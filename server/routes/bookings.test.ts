import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../test/setup";

// Mock dependencies
vi.mock("../storage", () => ({
  storage: {
    getBookingByCancelationToken: vi.fn(),
    cancelBookingByToken: vi.fn(),
    getBoat: vi.fn(),
    getBookingById: vi.fn(),
    promoteHoldToRequested: vi.fn(),
    getBookingExtras: vi.fn(),
  },
}));
vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("./auth", () => ({
  requireAdminSession: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
  requireTabAccess: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));
vi.mock("../services", () => ({
  sendCancelationEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../services/emailService", () => ({
  sendBookingRequestReceived: vi.fn().mockResolvedValue(undefined),
  sendBookingRequestAdminNotification: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../lib/analyticsServer", () => ({
  sendGA4Event: vi.fn().mockResolvedValue(undefined),
  deriveClientIdFromRequest: vi.fn(() => "cid"),
}));
vi.mock("./payments", () => ({
  getStripe: vi.fn(),
}));

import { registerBookingRoutes } from "./bookings";
import { storage } from "../storage";

const mockedStorage = vi.mocked(storage);

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const INVALID_TOKEN = "not-a-valid-uuid";

describe("GET /api/bookings/cancel-info/:token", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerBookingRoutes(app);
  });

  it("returns 400 for invalid token format", async () => {
    const res = await request(app)
      .get(`/api/bookings/cancel-info/${INVALID_TOKEN}`)
      .expect(400);
    expect(res.body.message).toBe("Token inválido");
  });

  it("returns 404 when booking not found", async () => {
    mockedStorage.getBookingByCancelationToken.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/bookings/cancel-info/${VALID_UUID}`)
      .expect(404);
    expect(res.body.message).toContain("no encontrada");
  });

  it("returns 410 when booking is already cancelled", async () => {
    mockedStorage.getBookingByCancelationToken.mockResolvedValue({
      id: "booking-1",
      bookingStatus: "cancelled",
      startTime: new Date(Date.now() + 72 * 3600000),
      totalAmount: "100.00",
      boatId: "boat-1",
    } as never);

    const res = await request(app)
      .get(`/api/bookings/cancel-info/${VALID_UUID}`)
      .expect(410);
    expect(res.body.message).toContain("ya ha sido cancelada");
  });

  it("returns 422 when booking status is not cancellable", async () => {
    mockedStorage.getBookingByCancelationToken.mockResolvedValue({
      id: "booking-1",
      bookingStatus: "completed",
      startTime: new Date(Date.now() + 72 * 3600000),
      totalAmount: "100.00",
      boatId: "boat-1",
    } as never);

    const res = await request(app)
      .get(`/api/bookings/cancel-info/${VALID_UUID}`)
      .expect(422);
    expect(res.body.message).toContain("no puede cancelarse");
  });

  it("returns booking info with zero refund regardless of hours until start", async () => {
    const startTime = new Date(Date.now() + 72 * 3600000);
    mockedStorage.getBookingByCancelationToken.mockResolvedValue({
      id: "booking-1",
      customerName: "Juan",
      customerSurname: "Garcia",
      bookingStatus: "confirmed",
      startTime,
      endTime: new Date(startTime.getTime() + 3 * 3600000),
      totalAmount: "200.00",
      boatId: "boat-1",
      language: "es",
    } as never);
    mockedStorage.getBoat.mockResolvedValue({ id: "boat-1", name: "Barco Test" } as never);

    const res = await request(app)
      .get(`/api/bookings/cancel-info/${VALID_UUID}`)
      .expect(200);

    expect(res.body.booking).toBeDefined();
    expect(res.body.refundPolicy).toBeDefined();
    expect(res.body.refundPolicy.refundPercentage).toBe(0);
    expect(res.body.refundPolicy.refundAmount).toBe(0);
  });
});

describe("POST /api/bookings/cancel/:token", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerBookingRoutes(app);
  });

  it("returns 400 for invalid token format", async () => {
    const res = await request(app)
      .post(`/api/bookings/cancel/${INVALID_TOKEN}`)
      .expect(400);
    expect(res.body.message).toBe("Token inválido");
  });

  it("returns 404 when booking not found or not cancellable", async () => {
    mockedStorage.cancelBookingByToken.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/bookings/cancel/${VALID_UUID}`)
      .expect(404);
    expect(res.body.message).toContain("no encontrada");
  });

  it("returns success with zero refund when cancellation succeeds", async () => {
    mockedStorage.cancelBookingByToken.mockResolvedValue({
      booking: { id: "booking-1", customerName: "Juan" },
      refundAmount: 0,
      refundPercentage: 0,
    } as never);

    const res = await request(app)
      .post(`/api/bookings/cancel/${VALID_UUID}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.refundAmount).toBe(0);
    expect(res.body.refundPercentage).toBe(0);
    expect(res.body.message).toContain("Reserva cancelada");
  });
});

describe("POST /api/bookings/submit-request (A2 idempotency)", () => {
  let app: ReturnType<typeof createTestApp>;
  const CUSTOMER = {
    termsAccepted: true,
    customerName: "Ana",
    customerSurname: "García",
    customerEmail: "ana@example.com",
    customerPhone: "+34600111222",
    customerNationality: "ES",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerBookingRoutes(app);
  });

  it("is idempotent: re-submitting an already-requested hold returns 200 without re-firing side effects", async () => {
    mockedStorage.getBookingById.mockResolvedValue({
      id: "hold-1",
      bookingStatus: "requested",
      expiresAt: null,
    } as never);

    const res = await request(app)
      .post("/api/bookings/submit-request")
      .send({ holdId: "hold-1", ...CUSTOMER });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Must NOT promote again (no duplicate GA4/emails).
    expect(mockedStorage.promoteHoldToRequested).not.toHaveBeenCalled();
  });

  it("promotes a fresh hold and clears the TOCTOU race via the conditional update", async () => {
    mockedStorage.getBookingById.mockResolvedValue({
      id: "hold-2",
      bookingStatus: "hold",
      expiresAt: new Date(Date.now() + 60_000),
      boatId: "solar-450",
      totalAmount: "100",
      language: "es",
    } as never);
    mockedStorage.promoteHoldToRequested.mockResolvedValue({
      id: "hold-2", boatId: "solar-450", totalAmount: "100", language: "es", customerEmail: "ana@example.com",
    } as never);
    mockedStorage.getBoat.mockResolvedValue({ id: "solar-450", name: "Solar 450" } as never);
    mockedStorage.getBookingExtras.mockResolvedValue([] as never);

    const res = await request(app)
      .post("/api/bookings/submit-request")
      .send({ holdId: "hold-2", ...CUSTOMER });

    expect(res.status).toBe(200);
    expect(mockedStorage.promoteHoldToRequested).toHaveBeenCalledWith(
      "hold-2",
      expect.objectContaining({ customerEmail: "ana@example.com" }),
    );
  });

  it("returns 409 (not 500) when the hold was confirmed between read and write", async () => {
    mockedStorage.getBookingById
      .mockResolvedValueOnce({
        id: "hold-3", bookingStatus: "hold", expiresAt: new Date(Date.now() + 60_000),
      } as never)
      .mockResolvedValueOnce({ id: "hold-3", bookingStatus: "confirmed" } as never);
    // Conditional update affected 0 rows (admin confirmed mid-flight).
    mockedStorage.promoteHoldToRequested.mockResolvedValue(undefined as never);

    const res = await request(app)
      .post("/api/bookings/submit-request")
      .send({ holdId: "hold-3", ...CUSTOMER });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe("confirmed");
  });
});
