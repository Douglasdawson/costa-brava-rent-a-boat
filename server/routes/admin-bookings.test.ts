import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../test/setup";

vi.mock("../storage", () => ({
  storage: {
    getBooking: vi.fn(),
    createBooking: vi.fn(),
    updateBooking: vi.fn(),
    getBookingsForCalendar: vi.fn(),
    getPaginatedBookings: vi.fn(),
  },
}));
vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("../lib/audit", () => ({
  audit: vi.fn(),
}));
vi.mock("./auth", () => ({
  requireAdminSession: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
  requireTabAccess: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

import { registerAdminBookingRoutes } from "./admin-bookings";
import { storage } from "../storage";

const mockedStorage = vi.mocked(storage);

const buildBookingPayload = (overrides: Record<string, unknown> = {}) => ({
  customerName: "Juan",
  customerSurname: "Pérez",
  customerPhone: "+34611500372",
  customerEmail: "test@example.com",
  customerNationality: "ES",
  numberOfPeople: 4,
  boatId: "boat-1",
  bookingDate: new Date("2026-04-26T11:30:00.000Z").toISOString(),
  startTime: new Date("2026-04-26T11:30:00.000Z").toISOString(),
  endTime: new Date("2026-04-26T14:30:00.000Z").toISOString(),
  totalHours: 3,
  subtotal: "117.00",
  extrasTotal: "0",
  deposit: "200.00",
  totalAmount: "117.00",
  paymentStatus: "completed",
  bookingStatus: "confirmed",
  source: "admin",
  ...overrides,
});

describe("POST /api/admin/bookings — relaxed admin validation", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerAdminBookingRoutes(app);
    mockedStorage.createBooking.mockResolvedValue({ id: "new-booking-id" } as never);
  });

  it("accepts a booking with startTime in the past (retroactive admin entry)", async () => {
    const yesterday = new Date(Date.now() - 24 * 3600_000);
    const yesterdayPlus3h = new Date(yesterday.getTime() + 3 * 3600_000);

    const res = await request(app)
      .post("/api/admin/bookings")
      .send(buildBookingPayload({
        bookingDate: yesterday.toISOString(),
        startTime: yesterday.toISOString(),
        endTime: yesterdayPlus3h.toISOString(),
      }))
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(mockedStorage.createBooking).toHaveBeenCalledOnce();
  });

  it("accepts a booking with endTime BEFORE startTime (admin override)", async () => {
    const start = new Date("2026-04-26T13:30:00.000Z");
    const endBeforeStart = new Date("2026-04-25T15:30:00.000Z");

    const res = await request(app)
      .post("/api/admin/bookings")
      .send(buildBookingPayload({
        startTime: start.toISOString(),
        endTime: endBeforeStart.toISOString(),
      }))
      .expect(201);

    expect(res.body.success).toBe(true);
  });
});

describe("PATCH /api/admin/bookings/:id — relaxed admin validation", () => {
  let app: ReturnType<typeof createTestApp>;
  const existingBookingId = "existing-id";

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerAdminBookingRoutes(app);
    mockedStorage.getBooking.mockResolvedValue({ id: existingBookingId, bookingStatus: "confirmed" } as never);
    mockedStorage.updateBooking.mockResolvedValue({ id: existingBookingId, bookingStatus: "confirmed" } as never);
  });

  it("accepts an update where endTime is BEFORE startTime (the user's repro case)", async () => {
    const start = new Date("2026-04-26T13:30:00.000Z");
    const endBeforeStart = new Date("2026-04-25T15:30:00.000Z");

    const res = await request(app)
      .patch(`/api/admin/bookings/${existingBookingId}`)
      .send({
        startTime: start.toISOString(),
        endTime: endBeforeStart.toISOString(),
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(mockedStorage.updateBooking).toHaveBeenCalledOnce();
  });

  it("accepts a partial update with only startTime in the past", async () => {
    const yesterday = new Date(Date.now() - 24 * 3600_000);

    const res = await request(app)
      .patch(`/api/admin/bookings/${existingBookingId}`)
      .send({ startTime: yesterday.toISOString() })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it("still rejects updates with structurally invalid fields (e.g. negative subtotal)", async () => {
    const res = await request(app)
      .patch(`/api/admin/bookings/${existingBookingId}`)
      .send({ subtotal: -100 })
      .expect(400);

    expect(res.body.message).toBe("Datos invalidos");
  });
});
