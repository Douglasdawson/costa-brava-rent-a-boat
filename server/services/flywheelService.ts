/**
 * Post-Rental Flywheel Service
 *
 * Automated email sequences after each completed booking:
 * 1. Review request (+24h) — synced with existing thank-you flow
 * 2. Referral code (+3 days) — the customer's own CRM code (friend gets a free
 *    Premium Pack, referrer gets 20€ or 10%+extra). No codes are minted here.
 * 3. Early bird offer (+7 days) — 20% off next season
 *
 * All three functions are idempotent and safe to run hourly.
 */

import { storage } from "../storage";
import { sendReferralEmail, sendEarlyBirdEmail } from "./emailService";
import { fetchCrmReferralCode } from "../lib/crmDamarStats";
import { logger } from "../lib/logger";
import { GOOGLE_REVIEW_URL } from "../../shared/businessProfile";

export { GOOGLE_REVIEW_URL };

/**
 * Generate a short random alphanumeric string (uppercase).
 */
function randomChars(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for readability
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Step 1: Mark review request as sent for bookings that already received the thank-you email.
 *
 * The existing processThankYou() in schedulerService already sends a thank-you email
 * at +24h that includes a Google review CTA. This function marks `reviewRequestSent = true`
 * for those bookings so the flywheel tracking stays consistent. It does NOT send a
 * duplicate email; it just syncs the flag.
 */
export async function syncReviewRequests(): Promise<void> {
  try {
    const eligible = await storage.getBookingsForReviewRequest();

    if (eligible.length === 0) return;

    logger.info("[Flywheel] Syncing review request flags", { count: eligible.length });

    for (const booking of eligible) {
      try {
        // If the thank-you email was already sent, just mark the review flag.
        // If not, skip — the thank-you job will handle it.
        if (booking.emailThankYouSent) {
          await storage.markFlywheelStepSent(booking.id, "reviewRequestSent");
          logger.info("[Flywheel] Review request flag synced", { bookingId: booking.id });
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error("[Flywheel] Error syncing review request", { bookingId: booking.id, error: msg });
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Flywheel] Error in syncReviewRequests", { error: msg });
  }
}

/**
 * Step 2: Send the customer their referral code ~3 days after the trip.
 *
 * The referral programme lives in the CRM (one permanent personal code per
 * customer: friend gets a free Premium Pack, referrer gets 20€ or 10%+extra).
 * This job used to mint its OWN codes here (REF- 15% / THX- 10%), which meant
 * two competing offers for the same customers — so now it just asks the CRM for
 * the customer's code and emails that. Codes issued by the old scheme stay
 * valid until they expire; we simply stop creating new ones.
 *
 * `referralCodeSent` means SENT, not "attempted": if the CRM is unreachable the
 * booking is left unmarked and the next hourly run retries it (the eligibility
 * window is 70-74h, so ~4 attempts) instead of silently swallowing the email.
 */
export async function sendReferralCodes(): Promise<void> {
  try {
    const eligible = await storage.getBookingsForReferralCode();

    if (eligible.length === 0) return;

    logger.info("[Flywheel] Processing referral codes", { count: eligible.length });

    for (const booking of eligible) {
      try {
        const referralCode = await fetchCrmReferralCode(
          booking.customerEmail,
          booking.customerPhone,
        );

        if (referralCode === null) {
          // Infra failure (CRM down, timeout, missing config) — retry next hour.
          logger.warn("[Flywheel] Referral code unavailable, will retry", { bookingId: booking.id });
          continue;
        }

        if (referralCode === "not_found") {
          // No CRM record: there is no code to hand out and nothing to retry.
          logger.info("[Flywheel] No CRM client for booking, skipping referral email", { bookingId: booking.id });
          continue;
        }

        const result = await sendReferralEmail(booking, referralCode);
        if (!result.success) {
          logger.warn("[Flywheel] Referral email not sent, will retry", { bookingId: booking.id });
          continue;
        }

        await storage.markFlywheelStepSent(booking.id, "referralCodeSent");
        logger.info("[Flywheel] Referral code sent", { bookingId: booking.id, referralCode });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error("[Flywheel] Error sending referral code", { bookingId: booking.id, error: msg });
        // No marcamos: la ventana de elegibilidad (70-74h) acota los reintentos sola.
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Flywheel] Error in sendReferralCodes", { error: msg });
  }
}

/**
 * Step 3: Send early bird offer ~7 days after the trip.
 * Creates a 20% discount code valid until March 31 of the next year.
 */
export async function sendEarlyBirdOffers(): Promise<void> {
  try {
    const eligible = await storage.getBookingsForEarlyBird();

    if (eligible.length === 0) return;

    logger.info("[Flywheel] Processing early bird offers", { count: eligible.length });

    for (const booking of eligible) {
      try {
        if (!booking.customerEmail) {
          await storage.markFlywheelStepSent(booking.id, "earlyBirdOfferSent");
          continue;
        }

        const namePrefix = booking.customerName
          .replace(/[^a-zA-Z]/g, "")
          .slice(0, 3)
          .toUpperCase()
          .padEnd(3, "X");

        // Early bird code: 20% off, single use, expires March 31 next year
        const earlyBirdCode = `EARLY-${namePrefix}-${randomChars(5)}`;
        const now = new Date();
        const expiresAt = new Date(now.getFullYear() + 1, 2, 31, 23, 59, 59); // March 31

        await storage.createDiscountCode({
          code: earlyBirdCode,
          discountPercent: 20,
          maxUses: 1,
          isActive: true,
          expiresAt,
          customerEmail: booking.customerEmail.toLowerCase().trim(),
        });

        // Send email
        const result = await sendEarlyBirdEmail(booking, earlyBirdCode, expiresAt);

        // Mark as sent regardless of email outcome
        await storage.markFlywheelStepSent(booking.id, "earlyBirdOfferSent");

        logger.info("[Flywheel] Early bird offer sent", {
          bookingId: booking.id,
          emailSent: result.success,
          earlyBirdCode,
          expiresAt: expiresAt.toISOString(),
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error("[Flywheel] Error sending early bird offer", { bookingId: booking.id, error: msg });
        try {
          await storage.markFlywheelStepSent(booking.id, "earlyBirdOfferSent");
        } catch {
          // Best effort
        }
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Flywheel] Error in sendEarlyBirdOffers", { error: msg });
  }
}
