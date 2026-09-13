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

  it("returns 0 for a friend code (referral): it gifts a Premium Pack, not money", () => {
    const promo: PromoValidationResult = {
      valid: true,
      type: "referral",
      code: "CBRB-VICT99",
    };
    // Si esto deja de ser 0, un código de amigo empezaría a descontar dinero
    // del total presupuestado y del cobro: el regalo lo aplica el CRM, no el precio.
    expect(calculateDiscountAmount(promo, 200, 250)).toBe(0);
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

// ── Alumni codes (Escola Nàutica Blanes): phone-bound, licensed boats only ──────────────
import { phoneMatches } from "./discountValidation";

describe("phoneMatches", () => {
  it("compares the last 9 digits regardless of prefix and spacing", () => {
    expect(phoneMatches("+34 611 500 372", "611500372")).toBe(true);
    expect(phoneMatches("0034611500372", "+34 611-500-372")).toBe(true);
  });
  it("never matches empty or short numbers", () => {
    expect(phoneMatches("", "611500372")).toBe(false);
    expect(phoneMatches("12345", "12345")).toBe(false);
    expect(phoneMatches(null, undefined)).toBe(false);
  });
  it("rejects a different number", () => {
    expect(phoneMatches("+34 611 500 372", "+34 611 500 373")).toBe(false);
  });
});

vi.mock("../storage", () => ({
  storage: {
    getGiftCardByCode: vi.fn(async () => undefined),
    getDiscountCodeByCode: vi.fn(async (code: string) =>
      code === "ALUMNO1"
        ? {
            code: "ALUMNO1",
            discountPercent: 20,
            maxUses: 10000,
            currentUses: 3,
            customerEmail: null,
            customerPhone: "+34 611 500 372",
            licensedOnly: true,
            isActive: true,
            expiresAt: null,
          }
        : undefined,
    ),
  },
}));
vi.mock("./crmDamarStats", () => ({ isCrmReferralCode: vi.fn(async () => false) }));

import { validatePromoCode } from "./discountValidation";

describe("validatePromoCode with an alumni code", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is refused without the student's phone", async () => {
    const r = await validatePromoCode("alumno1");
    expect(r.valid).toBe(false);
    expect(r.errorCode).toBe("phone_mismatch");
  });

  it("is refused with another phone", async () => {
    const r = await validatePromoCode("ALUMNO1", { phone: "+34 600 000 000" });
    expect(r.errorCode).toBe("phone_mismatch");
  });

  it("is valid with the right phone and carries licensedOnly", async () => {
    const r = await validatePromoCode("ALUMNO1", { phone: "611 500 372" });
    expect(r.valid).toBe(true);
    expect(r.discountPercent).toBe(20);
    expect(r.licensedOnly).toBe(true);
  });

  it("does not apply to a small (licence-free) boat but does to a licensed one", async () => {
    const small = await validatePromoCode("ALUMNO1", { phone: "611500372", boatId: "solar-450" });
    expect(small.valid).toBe(false);
    expect(small.errorCode).toBe("not_applicable");
    const licensed = await validatePromoCode("ALUMNO1", { phone: "611500372", boatId: "trimarchi-57s" });
    expect(licensed.valid).toBe(true);
  });
});
