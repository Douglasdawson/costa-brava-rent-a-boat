import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../test/setup";

// Mock dependencies
vi.mock("../storage", () => ({
  storage: {
    getBookingByCancelationToken: vi.fn(),
    cancelBookingByToken: vi.fn(),
    getBoat: vi.fn(),
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

  it("returns 100% refund when more than 48h before start", async () => {
    const startTime = new Date(Date.now() + 72 * 3600000); // 72h from now
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
    expect(res.body.refundPolicy.refundPercentage).toBe(100);
    expect(res.body.refundPolicy.refundAmount).toBe(200);
  });

  it("returns 50% refund when 24-48h before start", async () => {
    const startTime = new Date(Date.now() + 30 * 3600000); // 30h from now
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

    expect(res.body.refundPolicy.refundPercentage).toBe(50);
    expect(res.body.refundPolicy.refundAmount).toBe(100);
  });

  it("returns 0% refund when less than 24h before start", async () => {
    const startTime = new Date(Date.now() + 12 * 3600000); // 12h from now
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

  it("returns success with refund info when cancellation succeeds", async () => {
    mockedStorage.cancelBookingByToken.mockResolvedValue({
      booking: { id: "booking-1", customerName: "Juan" },
      refundAmount: 150,
      refundPercentage: 100,
    } as never);

    const res = await request(app)
      .post(`/api/bookings/cancel/${VALID_UUID}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.refundAmount).toBe(150);
    expect(res.body.refundPercentage).toBe(100);
    expect(res.body.message).toContain("150.00");
  });

  it("returns no-refund message when refund is 0", async () => {
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
    expect(res.body.message).toContain("No aplica reembolso");
  });
});
