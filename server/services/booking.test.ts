import { describe, it, expect } from "vitest";

// Test the overlap detection logic directly (same as availability.test.ts pattern)
function hasTimeOverlap(
  startA: Date, endA: Date,
  startB: Date, endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

// Cancellation refund policy, mirroring server/storage/bookings.ts
// (cancelBookingByToken) and server/routes/bookings.ts (cancel-info).
//
// Since the single fleet-wide policy of 2026-05-26 there are no notice-based
// refund tiers: a confirmed booking with a deposit is never refunded in cash.
// Bad weather is settled off this path (new date, or a 12-month voucher, or a
// cash refund only when the paid Garantia de mal tiempo was contracted), so a
// tier here that pays out for enough notice would silently undercut it.
function calculateRefundTier(_hoursUntilStart: number): { refundPercentage: number } {
  return { refundPercentage: 0 };
}

// Hold expiration check
function isHoldExpired(expiresAt: Date, now: Date): boolean {
  return now >= expiresAt;
}

// Status transition validation (based on booking flow)
type BookingStatus = "hold" | "pending_payment" | "confirmed" | "completed" | "cancelled" | "expired";

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  hold: ["pending_payment", "expired", "cancelled"],
  pending_payment: ["confirmed", "cancelled", "expired"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  expired: [],
};

function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

describe("Hold creation and 30-minute expiration", () => {
  it("creates a hold that expires in 30 minutes", () => {
    const now = new Date("2026-06-15T10:00:00Z");
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

    expect(expiresAt.getTime() - now.getTime()).toBe(30 * 60 * 1000);
    expect(isHoldExpired(expiresAt, now)).toBe(false);
  });

  it("detects expired hold after 30 minutes", () => {
    const now = new Date("2026-06-15T10:00:00Z");
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    const after31Min = new Date(now.getTime() + 31 * 60 * 1000);

    expect(isHoldExpired(expiresAt, after31Min)).toBe(true);
  });

  it("detects hold as expired exactly at expiration time", () => {
    const now = new Date("2026-06-15T10:00:00Z");
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

    expect(isHoldExpired(expiresAt, expiresAt)).toBe(true);
  });

  it("hold is still valid 29 minutes after creation", () => {
    const now = new Date("2026-06-15T10:00:00Z");
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    const after29Min = new Date(now.getTime() + 29 * 60 * 1000);

    expect(isHoldExpired(expiresAt, after29Min)).toBe(false);
  });
});

describe("Status transitions", () => {
  it("allows hold -> pending_payment", () => {
    expect(isValidTransition("hold", "pending_payment")).toBe(true);
  });

  it("allows hold -> expired", () => {
    expect(isValidTransition("hold", "expired")).toBe(true);
  });

  it("allows hold -> cancelled", () => {
    expect(isValidTransition("hold", "cancelled")).toBe(true);
  });

  it("allows pending_payment -> confirmed", () => {
    expect(isValidTransition("pending_payment", "confirmed")).toBe(true);
  });

  it("allows confirmed -> completed", () => {
    expect(isValidTransition("confirmed", "completed")).toBe(true);
  });

  it("allows confirmed -> cancelled", () => {
    expect(isValidTransition("confirmed", "cancelled")).toBe(true);
  });

  it("disallows completed -> any status", () => {
    expect(isValidTransition("completed", "cancelled")).toBe(false);
    expect(isValidTransition("completed", "confirmed")).toBe(false);
    expect(isValidTransition("completed", "hold")).toBe(false);
  });

  it("disallows cancelled -> any status", () => {
    expect(isValidTransition("cancelled", "confirmed")).toBe(false);
    expect(isValidTransition("cancelled", "hold")).toBe(false);
  });

  it("disallows hold -> confirmed (must go through pending_payment)", () => {
    expect(isValidTransition("hold", "confirmed")).toBe(false);
  });

  it("disallows hold -> completed", () => {
    expect(isValidTransition("hold", "completed")).toBe(false);
  });
});

describe("Cancellation refund policy", () => {
  it("never refunds cash, however much notice is given", () => {
    for (const hours of [0, 1, 12, 23, 24, 36, 47, 48, 72, 168, 720]) {
      expect(calculateRefundTier(hours).refundPercentage).toBe(0);
    }
  });

  it("has no free-cancellation window that would undercut the weather guarantee", () => {
    // 7 days' notice buys a free DATE CHANGE, never a refund.
    expect(calculateRefundTier(24 * 7).refundPercentage).toBe(0);
  });
});

describe("Overlap detection", () => {
  it("detects overlapping bookings", () => {
    const a = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    const b = { start: new Date("2026-06-15T12:00"), end: new Date("2026-06-15T16:00") };
    expect(hasTimeOverlap(a.start, a.end, b.start, b.end)).toBe(true);
  });

  it("detects booking fully contained within another", () => {
    const a = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T18:00") };
    const b = { start: new Date("2026-06-15T12:00"), end: new Date("2026-06-15T14:00") };
    expect(hasTimeOverlap(a.start, a.end, b.start, b.end)).toBe(true);
  });

  it("allows adjacent bookings (end time equals start time)", () => {
    const a = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    const b = { start: new Date("2026-06-15T14:00"), end: new Date("2026-06-15T18:00") };
    expect(hasTimeOverlap(a.start, a.end, b.start, b.end)).toBe(false);
  });

  it("allows non-overlapping bookings", () => {
    const a = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T12:00") };
    const b = { start: new Date("2026-06-15T14:00"), end: new Date("2026-06-15T16:00") };
    expect(hasTimeOverlap(a.start, a.end, b.start, b.end)).toBe(false);
  });

  it("detects same time range as overlap", () => {
    const a = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    expect(hasTimeOverlap(a.start, a.end, a.start, a.end)).toBe(true);
  });

  it("allows bookings on different days", () => {
    const a = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    const b = { start: new Date("2026-06-16T10:00"), end: new Date("2026-06-16T14:00") };
    expect(hasTimeOverlap(a.start, a.end, b.start, b.end)).toBe(false);
  });
});
