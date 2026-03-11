import { describe, it, expect } from "vitest";
import { calculateAutoDiscount } from "./discounts";

describe("Early-bird discounts", () => {
  it("gives 10% for 7+ days advance in LOW season (BAJA)", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-05-20",
      today: "2026-05-10",
      basePrice: 150,
      existingBookingsForDate: 0,
    });
    expect(result.type).toBe("early-bird");
    expect(result.percentage).toBe(10);
    expect(result.amount).toBe(15);
  });

  it("gives 10% for exactly 7 days advance in BAJA", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-06-17",
      today: "2026-06-10",
      basePrice: 200,
      existingBookingsForDate: 3,
    });
    expect(result.type).toBe("early-bird");
    expect(result.percentage).toBe(10);
    expect(result.amount).toBe(20);
  });

  it("gives no discount for 6 days advance (below threshold)", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-05-16",
      today: "2026-05-10",
      basePrice: 150,
      existingBookingsForDate: 0,
    });
    expect(result.type).toBeNull();
    expect(result.percentage).toBe(0);
    expect(result.amount).toBe(0);
  });

  it("gives no early-bird discount for MID season (July)", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-07-20",
      today: "2026-07-01",
      basePrice: 200,
      existingBookingsForDate: 0,
    });
    // 19 days advance but MEDIA season -> no early-bird (early-bird is BAJA only)
    expect(result.type).toBeNull();
    expect(result.percentage).toBe(0);
  });

  it("rounds the discount amount to nearest integer", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-05-20",
      today: "2026-05-10",
      basePrice: 115,
      existingBookingsForDate: 0,
    });
    expect(result.amount).toBe(12); // Math.round(115 * 10 / 100) = 12
  });
});

describe("Flash deals", () => {
  it("gives 10% for tomorrow with no bookings in LOW season", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-05-11",
      today: "2026-05-10",
      basePrice: 150,
      existingBookingsForDate: 0,
    });
    expect(result.type).toBe("flash-deal");
    expect(result.percentage).toBe(10);
    expect(result.amount).toBe(15);
  });

  it("gives 10% for tomorrow with no bookings in MID season (July)", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-07-16",
      today: "2026-07-15",
      basePrice: 200,
      existingBookingsForDate: 0,
    });
    expect(result.type).toBe("flash-deal");
    expect(result.percentage).toBe(10);
    expect(result.amount).toBe(20);
  });

  it("gives no discount if bookings exist for that date", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-05-11",
      today: "2026-05-10",
      basePrice: 150,
      existingBookingsForDate: 1,
    });
    expect(result.type).toBeNull();
    expect(result.percentage).toBe(0);
    expect(result.amount).toBe(0);
  });

  it("gives no flash deal for today (must be tomorrow)", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-05-10",
      today: "2026-05-10",
      basePrice: 150,
      existingBookingsForDate: 0,
    });
    expect(result.type).toBeNull();
    expect(result.percentage).toBe(0);
  });

  it("gives no flash deal for day after tomorrow", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-05-12",
      today: "2026-05-10",
      basePrice: 150,
      existingBookingsForDate: 0,
    });
    expect(result.type).toBeNull();
    expect(result.percentage).toBe(0);
  });
});

describe("HIGH season (ALTA - August)", () => {
  it("never gives discounts even with 30 days advance", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-08-15",
      today: "2026-07-15",
      basePrice: 200,
      existingBookingsForDate: 0,
    });
    expect(result.type).toBeNull();
    expect(result.percentage).toBe(0);
    expect(result.amount).toBe(0);
  });

  it("never gives flash deals in August", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-08-16",
      today: "2026-08-15",
      basePrice: 200,
      existingBookingsForDate: 0,
    });
    expect(result.type).toBeNull();
    expect(result.percentage).toBe(0);
  });
});

describe("Off-season (November-March)", () => {
  it("returns no discount for dates outside operational season", () => {
    const result = calculateAutoDiscount({
      bookingDate: "2026-01-15",
      today: "2026-01-01",
      basePrice: 100,
      existingBookingsForDate: 0,
    });
    expect(result.type).toBeNull();
    expect(result.percentage).toBe(0);
    expect(result.amount).toBe(0);
  });
});

describe("Early-bird takes priority over flash deal", () => {
  it("returns early-bird when both conditions match (7+ days, BAJA, tomorrow impossible at 7+ days)", () => {
    // At 7+ days advance, it can't be "tomorrow", so they're mutually exclusive by design.
    // But if somehow both could apply, early-bird is checked first.
    const result = calculateAutoDiscount({
      bookingDate: "2026-05-20",
      today: "2026-05-10",
      basePrice: 100,
      existingBookingsForDate: 0,
    });
    expect(result.type).toBe("early-bird");
  });
});
