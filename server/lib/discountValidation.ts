import { storage } from "../storage";
import { logger } from "./logger";

/**
 * Result of validating a promo code (discount code or gift card).
 */
export interface PromoValidationResult {
  valid: boolean;
  error?: string;
  /** "discount" = percentage-based code, "gift_card" = balance-based card */
  type?: "discount" | "gift_card";
  /** The normalized (uppercased, trimmed) code */
  code?: string;
  /** Discount percentage (only for type "discount") */
  discountPercent?: number;
  /** Remaining balance in EUR (only for type "gift_card") */
  remainingAmount?: number;
}

/**
 * Calculates the discount amount in EUR for a validated promo code.
 *
 * - Discount codes: percentage applied to the base price (subtotal without extras).
 * - Gift cards: deducted from the full total (base + extras), capped at remaining balance.
 */
export function calculateDiscountAmount(
  promo: PromoValidationResult,
  basePrice: number,
  totalBeforeDiscount: number,
): number {
  if (!promo.valid || !promo.type) return 0;

  if (promo.type === "discount" && promo.discountPercent) {
    return Math.round((basePrice * promo.discountPercent) / 100 * 100) / 100;
  }

  if (promo.type === "gift_card" && promo.remainingAmount) {
    return Math.min(promo.remainingAmount, totalBeforeDiscount);
  }

  return 0;
}

/**
 * Validates a promo code (discount code or gift card) server-side.
 *
 * Tries gift card first, then discount code. Returns a unified result.
 * This is the single source of truth for code validation -- used by
 * the public validate endpoints, the quote endpoint, and payment creation.
 */
export async function validatePromoCode(code: string): Promise<PromoValidationResult> {
  const normalized = code.toUpperCase().trim();

  if (!normalized) {
    return { valid: false, error: "Codigo requerido" };
  }

  // 1. Try gift card first
  try {
    const giftCard = await storage.getGiftCardByCode(normalized);
    if (giftCard) {
      if (giftCard.status === "expired" || new Date() > giftCard.expiresAt) {
        return { valid: false, error: "Esta tarjeta regalo ha expirado" };
      }
      if (giftCard.status === "used") {
        return { valid: false, error: "Esta tarjeta regalo ya ha sido utilizada" };
      }
      if (giftCard.status === "cancelled") {
        return { valid: false, error: "Esta tarjeta regalo ha sido cancelada" };
      }
      if (giftCard.paymentStatus !== "completed") {
        return { valid: false, error: "Esta tarjeta regalo no esta activada" };
      }

      return {
        valid: true,
        type: "gift_card",
        code: normalized,
        remainingAmount: parseFloat(giftCard.remainingAmount),
      };
    }
  } catch (err: unknown) {
    logger.error("[DiscountValidation] Error checking gift card", {
      code: normalized,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 2. Try discount code
  try {
    const discountCode = await storage.getDiscountCodeByCode(normalized);
    if (!discountCode) {
      return { valid: false, error: "Codigo no valido" };
    }

    if (discountCode.expiresAt && new Date() > discountCode.expiresAt) {
      return { valid: false, error: "Este codigo de descuento ha expirado" };
    }

    if (discountCode.currentUses >= discountCode.maxUses) {
      return { valid: false, error: "Este codigo de descuento ya ha sido utilizado" };
    }

    if (!discountCode.isActive) {
      return { valid: false, error: "Este codigo de descuento no esta activo" };
    }

    return {
      valid: true,
      type: "discount",
      code: normalized,
      discountPercent: discountCode.discountPercent,
    };
  } catch (err: unknown) {
    logger.error("[DiscountValidation] Error checking discount code", {
      code: normalized,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { valid: false, error: "Codigo no valido" };
}
