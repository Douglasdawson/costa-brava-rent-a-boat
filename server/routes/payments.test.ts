import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env vars before any module loads
vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_12345";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
});

// ----- Mocks -----

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../storage", () => ({
  storage: {
    getBookingById: vi.fn(),
    getBooking: vi.fn(),
    updateBooking: vi.fn(),
    getBoat: vi.fn(),
    getBookingExtras: vi.fn(),
    updateBookingWhatsAppStatus: vi.fn(),
    updateGiftCard: vi.fn(),
    decrementExtrasStock: vi.fn().mockResolvedValue(undefined),
  },
}));

const _dbSelectLimit = vi.fn();
const _dbUpdateWhere = vi.fn();

vi.mock("../db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: _dbSelectLimit,
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: _dbUpdateWhere,
      }),
    }),
  },
}));

vi.mock("@shared/schema", () => ({
  bookings: { stripePaymentIntentId: "stripe_payment_intent_id", id: "id" },
  giftCards: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col: unknown, val: unknown) => ({ _col, val })),
}));

vi.mock("../services/emailService", () => ({
  sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./auth", () => ({
  requireAdminSession: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
}));

// Stripe mock: we create stable mock fns and return them from a stable object
// so that the singleton cache in getStripe() works across tests.
const _piCreate = vi.fn();
const _refundsCreate = vi.fn();
const _webhooksConstruct = vi.fn();

const _stripeInstance = {
  paymentIntents: { create: _piCreate },
  refunds: { create: _refundsCreate },
  webhooks: { constructEvent: _webhooksConstruct },
};

vi.mock("stripe", () => ({
  default: class MockStripe {
    paymentIntents = _stripeInstance.paymentIntents;
    refunds = _stripeInstance.refunds;
    webhooks = _stripeInstance.webhooks;
  },
}));

// ---- Now safe to import ----

import express from "express";
import request from "supertest";
import { registerPaymentRoutes } from "./payments";
import { storage } from "../storage";

const mockStorage = vi.mocked(storage);

// ----- Helpers -----

function createApp() {
  const app = express();
  app.use(express.json());
  registerPaymentRoutes(app);
  return app;
}

function makeHold(overrides: Record<string, unknown> = {}) {
  return {
    id: "hold-123",
    sessionId: "sess-abc",
    boatId: "solar-450",
    bookingDate: new Date("2026-06-15"),
    startTime: new Date("2026-06-15T10:00:00Z"),
    endTime: new Date("2026-06-15T14:00:00Z"),
    numberOfPeople: 4,
    totalAmount: "430.00",
    deposit: "250.00",
    bookingStatus: "hold",
    paymentStatus: "pending",
    stripePaymentIntentId: null,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    customerName: "John",
    customerSurname: "Doe",
    customerEmail: "john@example.com",
    customerPhone: "+34611500372",
    language: "en",
    totalHours: 4,
    refundStatus: null,
    ...overrides,
  };
}

// ----- Tests -----

describe("Payment Routes", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  // ===== 1. Payment Intent Creation — Valid Booking =====

  describe("POST /api/create-payment-intent", () => {
    it("creates a payment intent for a valid hold", async () => {
      const hold = makeHold();
      mockStorage.getBookingById.mockResolvedValue(hold as never);
      mockStorage.updateBooking.mockResolvedValue({ ...hold, bookingStatus: "pending_payment" } as never);
      _piCreate.mockResolvedValue({
        id: "pi_test_123",
        client_secret: "pi_test_123_secret_abc",
      });

      const res = await request(app)
        .post("/api/create-payment-intent")
        .send({ holdId: "hold-123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.clientSecret).toBe("pi_test_123_secret_abc");
      expect(res.body.paymentIntentId).toBe("pi_test_123");
      expect(res.body.amount).toBe(180); // 430 - 250
      expect(res.body.currency).toBe("eur");

      expect(_piCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 18000,
          currency: "eur",
          metadata: expect.objectContaining({
            holdId: "hold-123",
            boatId: "solar-450",
            depositCollectionMethod: "cash_on_site",
          }),
        }),
      );

      expect(mockStorage.updateBooking).toHaveBeenCalledWith("hold-123", {
        bookingStatus: "pending_payment",
        paymentStatus: "pending",
        stripePaymentIntentId: "pi_test_123",
      });
    });

    it("accepts bookingId instead of holdId", async () => {
      const hold = makeHold({ bookingStatus: "pending_payment" });
      mockStorage.getBookingById.mockResolvedValue(hold as never);
      mockStorage.updateBooking.mockResolvedValue(hold as never);
      _piCreate.mockResolvedValue({ id: "pi_456", client_secret: "pi_456_secret" });

      const res = await request(app)
        .post("/api/create-payment-intent")
        .send({ bookingId: "hold-123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    // ===== 2. Invalid / Expired Hold =====

    it("returns 404 when hold does not exist", async () => {
      mockStorage.getBookingById.mockResolvedValue(null as never);

      const res = await request(app)
        .post("/api/create-payment-intent")
        .send({ holdId: "nonexistent" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 when hold status is not 'hold'", async () => {
      mockStorage.getBookingById.mockResolvedValue(makeHold({ bookingStatus: "confirmed" }) as never);

      const res = await request(app)
        .post("/api/create-payment-intent")
        .send({ holdId: "hold-123" });

      expect(res.status).toBe(400);
    });

    it("returns 410 when hold has expired", async () => {
      mockStorage.getBookingById.mockResolvedValue(
        makeHold({ expiresAt: new Date(Date.now() - 60_000) }) as never,
      );

      const res = await request(app)
        .post("/api/create-payment-intent")
        .send({ holdId: "hold-123" });

      expect(res.status).toBe(410);
    });

    it("returns 400 when service amount is zero", async () => {
      mockStorage.getBookingById.mockResolvedValue(
        makeHold({ totalAmount: "250.00", deposit: "250.00" }) as never,
      );

      const res = await request(app)
        .post("/api/create-payment-intent")
        .send({ holdId: "hold-123" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when neither holdId nor bookingId is provided", async () => {
      const res = await request(app)
        .post("/api/create-payment-intent")
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ===== 3. Webhook — payment_intent.succeeded =====

  describe("POST /api/stripe-webhook", () => {
    it("confirms booking on payment_intent.succeeded", async () => {
      const booking = makeHold({ id: "booking-1", bookingStatus: "pending_payment" });

      _webhooksConstruct.mockReturnValue({
        id: "evt_success_1",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test_123", metadata: {} } },
      });

      _dbSelectLimit.mockResolvedValue([booking]);
      mockStorage.updateBooking.mockResolvedValue(booking as never);
      mockStorage.getBoat.mockResolvedValue({ id: "solar-450", name: "Solar 450" } as never);
      mockStorage.getBookingExtras.mockResolvedValue([] as never);

      const res = await request(app)
        .post("/api/stripe-webhook")
        .set("stripe-signature", "sig_test")
        .set("content-type", "application/json")
        .send(JSON.stringify({ type: "payment_intent.succeeded" }));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      expect(mockStorage.updateBooking).toHaveBeenCalledWith(
        "booking-1",
        expect.objectContaining({ bookingStatus: "confirmed", paymentStatus: "completed" }),
      );
    });

    it("activates gift card on payment_intent.succeeded with gift_card metadata", async () => {
      _webhooksConstruct.mockReturnValue({
        id: "evt_gc_1",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_gc", metadata: { type: "gift_card", giftCardId: "gc-abc" } } },
      });

      mockStorage.updateGiftCard.mockResolvedValue(undefined as never);

      const res = await request(app)
        .post("/api/stripe-webhook")
        .set("stripe-signature", "sig_test")
        .set("content-type", "application/json")
        .send(JSON.stringify({}));

      expect(res.status).toBe(200);
      expect(mockStorage.updateGiftCard).toHaveBeenCalledWith("gc-abc", {
        paymentStatus: "completed",
        status: "active",
      });
    });

    // ===== 4. Webhook — payment_intent.payment_failed =====

    it("marks booking as failed on payment_intent.payment_failed", async () => {
      const booking = makeHold({ id: "booking-2" });

      _webhooksConstruct.mockReturnValue({
        id: "evt_fail_1",
        type: "payment_intent.payment_failed",
        data: { object: { id: "pi_failed" } },
      });

      _dbSelectLimit.mockResolvedValue([booking]);
      mockStorage.updateBooking.mockResolvedValue(booking as never);

      const res = await request(app)
        .post("/api/stripe-webhook")
        .set("stripe-signature", "sig_test")
        .set("content-type", "application/json")
        .send(JSON.stringify({}));

      expect(res.status).toBe(200);
      expect(mockStorage.updateBooking).toHaveBeenCalledWith(
        "booking-2",
        expect.objectContaining({ paymentStatus: "failed" }),
      );
    });

    it("returns 400 when webhook signature is invalid", async () => {
      _webhooksConstruct.mockImplementation(() => {
        throw new Error("Webhook signature verification failed");
      });

      const res = await request(app)
        .post("/api/stripe-webhook")
        .set("stripe-signature", "bad_sig")
        .set("content-type", "application/json")
        .send(JSON.stringify({}));

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid webhook signature");
    });

    // ===== 7. Idempotency =====

    it("processes the same event ID only once", async () => {
      const booking = makeHold({ id: "booking-idem" });

      _webhooksConstruct.mockReturnValue({
        id: "evt_idem_1",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_idem", metadata: {} } },
      });
      _dbSelectLimit.mockResolvedValue([booking]);
      mockStorage.updateBooking.mockResolvedValue(booking as never);
      mockStorage.getBoat.mockResolvedValue({ id: "solar-450", name: "Solar 450" } as never);
      mockStorage.getBookingExtras.mockResolvedValue([] as never);

      // First call
      await request(app)
        .post("/api/stripe-webhook")
        .set("stripe-signature", "sig")
        .set("content-type", "application/json")
        .send(JSON.stringify({}));

      expect(mockStorage.updateBooking).toHaveBeenCalledTimes(1);

      // Reset mock call counts but keep implementations
      mockStorage.updateBooking.mockClear();
      _webhooksConstruct.mockReturnValue({
        id: "evt_idem_1", // same ID
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_idem", metadata: {} } },
      });

      // Second call — should be skipped due to idempotency
      const res2 = await request(app)
        .post("/api/stripe-webhook")
        .set("stripe-signature", "sig")
        .set("content-type", "application/json")
        .send(JSON.stringify({}));

      expect(res2.status).toBe(200);
      expect(res2.body.received).toBe(true);
      expect(mockStorage.updateBooking).not.toHaveBeenCalled();
    });

    it("handles unhandled event types gracefully", async () => {
      _webhooksConstruct.mockReturnValue({
        id: "evt_unknown_1",
        type: "charge.refunded",
        data: { object: {} },
      });

      const res = await request(app)
        .post("/api/stripe-webhook")
        .set("stripe-signature", "sig")
        .set("content-type", "application/json")
        .send(JSON.stringify({}));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });
  });

  // ===== 5. Refund — Valid Booking =====

  describe("POST /api/admin/bookings/:id/refund", () => {
    it("issues refund for a valid confirmed booking", async () => {
      const booking = makeHold({
        id: "b-refund",
        bookingStatus: "confirmed",
        stripePaymentIntentId: "pi_confirmed",
        refundStatus: null,
      });

      mockStorage.getBooking.mockResolvedValue(booking as never);
      _dbUpdateWhere.mockResolvedValue(undefined);
      _refundsCreate.mockResolvedValue({ id: "re_123" });

      const res = await request(app)
        .post("/api/admin/bookings/b-refund/refund")
        .send({ amount: 100, reason: "requested_by_customer" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.refundId).toBe("re_123");
      expect(res.body.amount).toBe(100);

      expect(_refundsCreate).toHaveBeenCalledWith({
        payment_intent: "pi_confirmed",
        amount: 10000,
        reason: "requested_by_customer",
      });
    });

    it("returns 404 when booking does not exist", async () => {
      mockStorage.getBooking.mockResolvedValue(null as never);

      const res = await request(app)
        .post("/api/admin/bookings/nope/refund")
        .send({ amount: 50 });

      expect(res.status).toBe(404);
    });

    it("returns 400 when booking has no Stripe payment intent", async () => {
      mockStorage.getBooking.mockResolvedValue(makeHold({ stripePaymentIntentId: null }) as never);

      const res = await request(app)
        .post("/api/admin/bookings/hold-123/refund")
        .send({ amount: 50 });

      expect(res.status).toBe(400);
    });

    // ===== 6. Refund — Already Refunded =====

    it("returns 409 when booking was already refunded", async () => {
      mockStorage.getBooking.mockResolvedValue(
        makeHold({ stripePaymentIntentId: "pi_done", refundStatus: "completed" }) as never,
      );

      const res = await request(app)
        .post("/api/admin/bookings/hold-123/refund")
        .send({ amount: 50 });

      expect(res.status).toBe(409);
    });

    it("returns 400 when refund amount exceeds max refundable", async () => {
      mockStorage.getBooking.mockResolvedValue(
        makeHold({ stripePaymentIntentId: "pi_x", refundStatus: null }) as never,
      );

      const res = await request(app)
        .post("/api/admin/bookings/hold-123/refund")
        .send({ amount: 200 }); // max is 180 (430-250)

      expect(res.status).toBe(400);
    });

    it("returns 400 for negative refund amount", async () => {
      const res = await request(app)
        .post("/api/admin/bookings/any/refund")
        .send({ amount: -10 });

      expect(res.status).toBe(400);
    });
  });
});
