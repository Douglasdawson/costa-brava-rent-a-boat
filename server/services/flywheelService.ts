/**
 * Post-Rental Flywheel Service
 *
 * Automated email sequences after each completed booking:
 * 1. Review request (+24h) — synced with existing thank-you flow
 * 2. Referral codes (+3 days) — friend gets 15%, referrer gets 10%
 * 3. Early bird offer (+7 days) — 20% off next season
 *
 * All three functions are idempotent and safe to run hourly.
 */

import { storage } from "../storage";
import { sendReferralEmail, sendEarlyBirdEmail } from "./emailService";
import { logger } from "../lib/logger";

/** Google review place ID — update if the Google Business Profile changes */
const GOOGLE_REVIEW_PLACE_ID = "ChIJrTRWOdA0uxIR_vCCNfbFNpE";
export const GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${GOOGLE_REVIEW_PLACE_ID}`;

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
 * Step 2: Send referral codes ~3 days after the trip.
 * Creates two discount codes: one for the friend (15%) and one for the referrer (10%).
 */
export async function sendReferralCodes(): Promise<void> {
  try {
    const eligible = await storage.getBookingsForReferralCode();

    if (eligible.length === 0) return;

    logger.info("[Flywheel] Processing referral codes", { count: eligible.length });

    for (const booking of eligible) {
      try {
        if (!booking.customerEmail) {
          await storage.markFlywheelStepSent(booking.id, "referralCodeSent");
          continue;
        }

        const namePrefix = booking.customerName
          .replace(/[^a-zA-Z]/g, "")
          .slice(0, 3)
          .toUpperCase()
          .padEnd(3, "X");

        // Friend code: 15% off, single use, valid 6 months
        const friendCode = `REF-${namePrefix}-${randomChars(5)}`;
        const friendExpires = new Date();
        friendExpires.setMonth(friendExpires.getMonth() + 6);

        await storage.createDiscountCode({
          code: friendCode,
          discountPercent: 15,
          maxUses: 1,
          isActive: true,
          expiresAt: friendExpires,
          customerEmail: null, // Anyone can use it (it's a gift)
        });

        // Referrer code: 10% off, single use, valid 1 year
        const referrerCode = `THX-${namePrefix}-${randomChars(5)}`;
        const referrerExpires = new Date();
        referrerExpires.setFullYear(referrerExpires.getFullYear() + 1);

        await storage.createDiscountCode({
          code: referrerCode,
          discountPercent: 10,
          maxUses: 1,
          isActive: true,
          expiresAt: referrerExpires,
          customerEmail: booking.customerEmail.toLowerCase().trim(),
        });

        // Send email
        const result = await sendReferralEmail(booking, friendCode, referrerCode);

        // Mark as sent regardless of email outcome to prevent retries
        await storage.markFlywheelStepSent(booking.id, "referralCodeSent");

        logger.info("[Flywheel] Referral codes sent", {
          bookingId: booking.id,
          emailSent: result.success,
          friendCode,
          referrerCode,
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error("[Flywheel] Error sending referral code", { bookingId: booking.id, error: msg });
        // Mark as sent to avoid infinite retry on persistent errors
        try {
          await storage.markFlywheelStepSent(booking.id, "referralCodeSent");
        } catch {
          // Best effort
        }
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
