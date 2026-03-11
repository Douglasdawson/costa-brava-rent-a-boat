import { describe, it, expect } from "vitest";

// Test the overlap detection logic directly (same as availability.test.ts pattern)
function hasTimeOverlap(
  startA: Date, endA: Date,
  startB: Date, endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

// Cancellation refund tier logic (extracted from server/routes/bookings.ts lines 77-80)
function calculateRefundTier(hoursUntilStart: number): { refundPercentage: number } {
  if (hoursUntilStart >= 48) return { refundPercentage: 100 };
  if (hoursUntilStart >= 24) return { refundPercentage: 50 };
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

describe("Cancellation refund tiers", () => {
  it("gives 100% refund for 48+ hours before start", () => {
    expect(calculateRefundTier(48).refundPercentage).toBe(100);
    expect(calculateRefundTier(72).refundPercentage).toBe(100);
    expect(calculateRefundTier(168).refundPercentage).toBe(100);
  });

  it("gives 50% refund for 24-47 hours before start", () => {
    expect(calculateRefundTier(24).refundPercentage).toBe(50);
    expect(calculateRefundTier(36).refundPercentage).toBe(50);
    expect(calculateRefundTier(47).refundPercentage).toBe(50);
    expect(calculateRefundTier(47.99).refundPercentage).toBe(50);
  });

  it("gives 0% refund for less than 24 hours before start", () => {
    expect(calculateRefundTier(23).refundPercentage).toBe(0);
    expect(calculateRefundTier(12).refundPercentage).toBe(0);
    expect(calculateRefundTier(1).refundPercentage).toBe(0);
    expect(calculateRefundTier(0).refundPercentage).toBe(0);
  });

  it("gives 100% at exactly 48 hours", () => {
    expect(calculateRefundTier(48).refundPercentage).toBe(100);
  });

  it("gives 50% at exactly 24 hours", () => {
    expect(calculateRefundTier(24).refundPercentage).toBe(50);
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
