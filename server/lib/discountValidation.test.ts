import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateDiscountAmount, type PromoValidationResult } from "./discountValidation";

// Note: validatePromoCode is async and depends on the database via storage.
// Here we test the pure calculateDiscountAmount function which is the core
// pricing logic. Integration tests for validatePromoCode should use the
// actual database or a more complete mock setup.

describe("calculateDiscountAmount", () => {
  it("returns 0 for invalid promo", () => {
    const promo: PromoValidationResult = { valid: false, error: "Invalid" };
    expect(calculateDiscountAmount(promo, 100, 120)).toBe(0);
  });

  it("returns 0 when valid but no type", () => {
    const promo: PromoValidationResult = { valid: true };
    expect(calculateDiscountAmount(promo, 100, 120)).toBe(0);
  });

  it("calculates percentage discount on base price", () => {
    const promo: PromoValidationResult = {
      valid: true,
      type: "discount",
      code: "SUMMER10",
      discountPercent: 10,
    };
    // 10% of 200 base = 20
    expect(calculateDiscountAmount(promo, 200, 250)).toBe(20);
  });

  it("handles 100% discount correctly", () => {
    const promo: PromoValidationResult = {
      valid: true,
      type: "discount",
      code: "FREE",
      discountPercent: 100,
    };
    expect(calculateDiscountAmount(promo, 150, 180)).toBe(150);
  });

  it("rounds discount to 2 decimal places", () => {
    const promo: PromoValidationResult = {
      valid: true,
      type: "discount",
      code: "ODD",
      discountPercent: 33,
    };
    // 33% of 100 = 33.00
    expect(calculateDiscountAmount(promo, 100, 120)).toBe(33);
    // 33% of 99 = 32.67
    expect(calculateDiscountAmount(promo, 99, 120)).toBe(32.67);
  });

  it("calculates gift card deduction capped at total", () => {
    const promo: PromoValidationResult = {
      valid: true,
      type: "gift_card",
      code: "CB-ABCD1234",
      remainingAmount: 50,
    };
    // Gift card 50, total 120 -> deduct 50
    expect(calculateDiscountAmount(promo, 100, 120)).toBe(50);
  });

  it("caps gift card deduction at total when balance exceeds total", () => {
    const promo: PromoValidationResult = {
      valid: true,
      type: "gift_card",
      code: "CB-RICH",
      remainingAmount: 500,
    };
    // Gift card 500, total 120 -> deduct only 120
    expect(calculateDiscountAmount(promo, 100, 120)).toBe(120);
  });

  it("returns 0 for discount type without percentage", () => {
    const promo: PromoValidationResult = {
      valid: true,
      type: "discount",
      code: "BROKEN",
    };
    expect(calculateDiscountAmount(promo, 100, 120)).toBe(0);
  });

  it("returns 0 for gift card type without remaining amount", () => {
    const promo: PromoValidationResult = {
      valid: true,
      type: "gift_card",
      code: "EMPTY",
    };
    expect(calculateDiscountAmount(promo, 100, 120)).toBe(0);
  });
});
