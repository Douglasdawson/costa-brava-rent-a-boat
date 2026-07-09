import { storage } from "../storage";
import { logger } from "./logger";

/**
 * Discriminator for the *kind* of validation failure. The frontend uses this
 * to render i18n copy (Spanish strings in `error` are kept only for legacy
 * callers and admin logging). P2.4 (2026-05-21).
 */
export type PromoValidationErrorCode =
  | "missing"           // empty / blank input
  | "not_found"         // code does not exist in the DB
  | "expired"           // existed but past its expiresAt
  | "consumed"          // existed but already redeemed (used / maxUses reached)
  | "cancelled"         // gift card explicitly cancelled
  | "inactive"          // discount inactive / gift card payment not completed
  | "server_error";     // DB/infra error — the code may well be valid; retry

/**
 * Result of validating a promo code (discount code or gift card).
 */
export interface PromoValidationResult {
  valid: boolean;
  error?: string;
  /** Machine-readable error discriminator. Always set when `valid === false`. */
  errorCode?: PromoValidationErrorCode;
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
 * - Gift cards: deducted from base + extras (NOT the refundable deposit), capped at
 *   remaining balance. Callers must pass `basePrice + extrasPrice` as the third arg.
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
    return { valid: false, errorCode: "missing", error: "Codigo requerido" };
  }

  // Track infra failures so a DB error (e.g. Neon cold start) is NOT reported as
  // "not_found" — which would reject a perfectly valid code with a 400.
  let dbError = false;

  // 1. Try gift card first
  try {
    const giftCard = await storage.getGiftCardByCode(normalized);
    if (giftCard) {
      if (giftCard.status === "expired" || new Date() > giftCard.expiresAt) {
        return { valid: false, errorCode: "expired", error: "Esta tarjeta regalo ha expirado" };
      }
      if (giftCard.status === "used") {
        return { valid: false, errorCode: "consumed", error: "Esta tarjeta regalo ya ha sido utilizada" };
      }
      if (giftCard.status === "cancelled") {
        return { valid: false, errorCode: "cancelled", error: "Esta tarjeta regalo ha sido cancelada" };
      }
      if (giftCard.paymentStatus !== "completed") {
        return { valid: false, errorCode: "inactive", error: "Esta tarjeta regalo no esta activada" };
      }

      return {
        valid: true,
        type: "gift_card",
        code: normalized,
        remainingAmount: parseFloat(giftCard.remainingAmount),
      };
    }
  } catch (err: unknown) {
    dbError = true;
    logger.error("[DiscountValidation] Error checking gift card", {
      code: normalized,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 2. Try discount code
  try {
    const discountCode = await storage.getDiscountCodeByCode(normalized);
    if (!discountCode) {
      return { valid: false, errorCode: "not_found", error: "Codigo no valido" };
    }

    if (discountCode.expiresAt && new Date() > discountCode.expiresAt) {
      return { valid: false, errorCode: "expired", error: "Este codigo de descuento ha expirado" };
    }

    if (discountCode.currentUses >= discountCode.maxUses) {
      return { valid: false, errorCode: "consumed", error: "Este codigo de descuento ya ha sido utilizado" };
    }

    if (!discountCode.isActive) {
      return { valid: false, errorCode: "inactive", error: "Este codigo de descuento no esta activo" };
    }

    return {
      valid: true,
      type: "discount",
      code: normalized,
      discountPercent: discountCode.discountPercent,
    };
  } catch (err: unknown) {
    dbError = true;
    logger.error("[DiscountValidation] Error checking discount code", {
      code: normalized,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // If a lookup threw, don't claim the code is invalid — signal a retryable server error.
  if (dbError) {
    return { valid: false, errorCode: "server_error", error: "No se pudo validar el codigo, intentalo de nuevo" };
  }

  return { valid: false, errorCode: "not_found", error: "Codigo no valido" };
}
