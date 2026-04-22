/**
 * Business Stats change alerter.
 * Notifies owner (via WhatsApp/email) when GBP rating or review count
 * changes significantly between syncs.
 *
 * Thresholds (chosen conservatively — avoid alert fatigue):
 *  - rating delta >= 0.1 (equivalent to ~15-20 new reviews shifting avg)
 *  - reviewCount delta >= 10 (sudden burst of reviews suggests campaign/issue)
 *  - rating drop below 4.5 (reputation threshold)
 *
 * v1 (MVP): structured logging only. Human reads weekly digest.
 * v2: Twilio WhatsApp push to OWNER_WHATSAPP when delta significant.
 * v3: Email summary weekly + per-review alerts for 1-2 star.
 */

import { logger } from "./logger";

export interface StatsChangeEvent {
  previousRating: number;
  previousCount: number;
  newRating: number;
  newCount: number;
  deltaRating: number;
  deltaCount: number;
  syncedAt: Date;
}

const RATING_DELTA_THRESHOLD = 0.1;
const REVIEW_COUNT_DELTA_THRESHOLD = 10;
const RATING_FLOOR = 4.5;

export function detectChange(prev: { rating: number; userRatingCount: number } | null, next: { rating: number; userRatingCount: number }): {
  isSignificant: boolean;
  deltaRating: number | null;
  deltaCount: number | null;
  reasons: string[];
} {
  if (!prev) {
    return { isSignificant: false, deltaRating: null, deltaCount: null, reasons: ["first sync"] };
  }
  const deltaRating = Math.round((next.rating - prev.rating) * 100) / 100;
  const deltaCount = next.userRatingCount - prev.userRatingCount;
  const reasons: string[] = [];

  if (Math.abs(deltaRating) >= RATING_DELTA_THRESHOLD) {
    reasons.push(`rating delta ${deltaRating > 0 ? "+" : ""}${deltaRating}`);
  }
  if (Math.abs(deltaCount) >= REVIEW_COUNT_DELTA_THRESHOLD) {
    reasons.push(`review count delta ${deltaCount > 0 ? "+" : ""}${deltaCount}`);
  }
  if (next.rating < RATING_FLOOR && prev.rating >= RATING_FLOOR) {
    reasons.push(`rating dropped below ${RATING_FLOOR} floor`);
  }

  return { isSignificant: reasons.length > 0, deltaRating, deltaCount, reasons };
}

/**
 * Alert channel dispatcher. v1 is log-only; wire up Twilio/email in v2.
 */
export async function alertStatsChange(event: StatsChangeEvent, reasons: string[]): Promise<void> {
  const severity = event.deltaRating < 0 || event.newRating < RATING_FLOOR ? "warn" : "info";
  const msg = `[GBP alert] ${reasons.join(" | ")}`;

  const payload = {
    previousRating: event.previousRating,
    newRating: event.newRating,
    deltaRating: event.deltaRating,
    previousCount: event.previousCount,
    newCount: event.newCount,
    deltaCount: event.deltaCount,
    syncedAt: event.syncedAt.toISOString(),
    reasons,
  };

  if (severity === "warn") {
    logger.warn(msg, payload);
  } else {
    logger.info(msg, payload);
  }

  // TODO v2: if (process.env.TWILIO_ACCOUNT_SID && process.env.OWNER_WHATSAPP) { sendWhatsApp(...) }
  // TODO v2: if (process.env.SENDGRID_API_KEY) { sendEmailDigest(...) }
}
