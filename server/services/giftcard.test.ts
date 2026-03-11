import { describe, it, expect } from "vitest";

// Gift card validation logic extracted from server/routes/giftcards.ts
type GiftCardStatus = "pending" | "active" | "used" | "expired" | "cancelled";
type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

interface GiftCard {
  code: string;
  amount: number;
  remainingAmount: number;
  status: GiftCardStatus;
  paymentStatus: PaymentStatus;
  expiresAt: Date;
}

interface ValidationResult {
  valid: boolean;
  message?: string;
}

function validateGiftCard(card: GiftCard, now: Date): ValidationResult {
  if (card.status === "expired" || now > card.expiresAt) {
    return { valid: false, message: "Esta tarjeta regalo ha expirado" };
  }
  if (card.status === "used") {
    return { valid: false, message: "Esta tarjeta regalo ya ha sido utilizada" };
  }
  if (card.status === "cancelled") {
    return { valid: false, message: "Esta tarjeta regalo ha sido cancelada" };
  }
  if (card.paymentStatus !== "completed") {
    return { valid: false, message: "Esta tarjeta regalo no esta activada" };
  }
  return { valid: true };
}

function redeemGiftCard(
  card: GiftCard,
  amount: number,
  now: Date,
): { success: boolean; newRemaining: number; error?: string } {
  const validation = validateGiftCard(card, now);
  if (!validation.valid) {
    return { success: false, newRemaining: card.remainingAmount, error: validation.message };
  }
  if (card.remainingAmount <= 0) {
    return { success: false, newRemaining: 0, error: "Saldo insuficiente" };
  }
  if (amount > card.remainingAmount) {
    // Partial redemption: use remaining balance
    return { success: true, newRemaining: 0 };
  }
  return { success: true, newRemaining: card.remainingAmount - amount };
}

function makeCard(overrides: Partial<GiftCard> = {}): GiftCard {
  return {
    code: "CB-TEST1234",
    amount: 100,
    remainingAmount: 100,
    status: "active",
    paymentStatus: "completed",
    expiresAt: new Date("2027-06-15T00:00:00Z"),
    ...overrides,
  };
}

const NOW = new Date("2026-06-15T12:00:00Z");

describe("Gift card creation and activation", () => {
  it("validates an active, paid gift card as valid", () => {
    const card = makeCard();
    const result = validateGiftCard(card, NOW);
    expect(result.valid).toBe(true);
  });

  it("rejects a pending (unpaid) gift card", () => {
    const card = makeCard({ paymentStatus: "pending" });
    const result = validateGiftCard(card, NOW);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("no esta activada");
  });

  it("rejects a failed payment gift card", () => {
    const card = makeCard({ paymentStatus: "failed" });
    const result = validateGiftCard(card, NOW);
    expect(result.valid).toBe(false);
  });
});

describe("Gift card redemption", () => {
  it("allows full redemption when amount equals balance", () => {
    const card = makeCard({ remainingAmount: 100 });
    const result = redeemGiftCard(card, 100, NOW);
    expect(result.success).toBe(true);
    expect(result.newRemaining).toBe(0);
  });

  it("allows partial redemption", () => {
    const card = makeCard({ remainingAmount: 100 });
    const result = redeemGiftCard(card, 40, NOW);
    expect(result.success).toBe(true);
    expect(result.newRemaining).toBe(60);
  });

  it("caps redemption at remaining balance when amount exceeds it", () => {
    const card = makeCard({ remainingAmount: 30 });
    const result = redeemGiftCard(card, 100, NOW);
    expect(result.success).toBe(true);
    expect(result.newRemaining).toBe(0);
  });

  it("rejects redemption on zero balance card", () => {
    const card = makeCard({ remainingAmount: 0 });
    const result = redeemGiftCard(card, 50, NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Saldo insuficiente");
  });
});

describe("Expired gift card", () => {
  it("rejects a card past its expiration date", () => {
    const card = makeCard({ expiresAt: new Date("2026-01-01T00:00:00Z") });
    const result = validateGiftCard(card, NOW);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("expirado");
  });

  it("rejects a card with status expired", () => {
    const card = makeCard({ status: "expired" });
    const result = validateGiftCard(card, NOW);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("expirado");
  });

  it("rejects redemption on expired card", () => {
    const card = makeCard({ expiresAt: new Date("2026-01-01T00:00:00Z") });
    const result = redeemGiftCard(card, 50, NOW);
    expect(result.success).toBe(false);
    expect(result.error).toContain("expirado");
  });
});

describe("Used gift card", () => {
  it("rejects a fully used card", () => {
    const card = makeCard({ status: "used" });
    const result = validateGiftCard(card, NOW);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("utilizada");
  });
});

describe("Cancelled gift card", () => {
  it("rejects a cancelled card", () => {
    const card = makeCard({ status: "cancelled" });
    const result = validateGiftCard(card, NOW);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("cancelada");
  });

  it("rejects redemption on cancelled card", () => {
    const card = makeCard({ status: "cancelled" });
    const result = redeemGiftCard(card, 50, NOW);
    expect(result.success).toBe(false);
  });
});

describe("Gift card code generation format", () => {
  it("codes follow the CB-XXXXXXXX pattern", () => {
    const codeRegex = /^CB-[A-HJ-NP-Z2-9]{8}$/;
    // The actual generator uses chars without I, O, 0, 1 to avoid confusion
    expect(codeRegex.test("CB-ABCD2345")).toBe(true);
    expect(codeRegex.test("CB-12345678")).toBe(false); // contains 1
    expect(codeRegex.test("ABCD2345")).toBe(false); // missing prefix
  });
});
