/**
 * Google Business Profile sync service.
 *
 * Fetches rating + review count + recent reviews from Google Places API (New)
 * and persists to the singleton `business_stats` table.
 *
 * Cost: ~$0.005 per request (Place Details Basic SKU with minimal field mask).
 * Run weekly via scheduler. Manual run via /api/admin/business-stats/sync.
 */

import { storage } from "../storage";
import { logger } from "../lib/logger";
import {
  BUSINESS_RATING,
  BUSINESS_REVIEW_COUNT,
  BUSINESS_DISPLAY_NAME,
} from "../../shared/businessProfile";

const PLACES_API_BASE = "https://places.googleapis.com/v1/places";
const FIELD_MASK = [
  "id",
  "displayName",
  "rating",
  "userRatingCount",
  "regularOpeningHours.weekdayDescriptions",
  "internationalPhoneNumber",
  "websiteUri",
  "reviews.rating",
  "reviews.text",
  "reviews.authorAttribution.displayName",
  "reviews.publishTime",
  "reviews.relativePublishTimeDescription",
].join(",");

interface PlaceDetailsResponse {
  id: string;
  displayName?: { text: string; languageCode?: string };
  rating?: number;
  userRatingCount?: number;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  reviews?: Array<{
    rating?: number;
    text?: { text: string; languageCode?: string };
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
    publishTime?: string;
    relativePublishTimeDescription?: string;
  }>;
}

export interface GbpSyncResult {
  success: boolean;
  rating?: number;
  userRatingCount?: number;
  lastSyncedAt?: Date;
  error?: string;
}

/**
 * Fetch fresh stats from Google Places API and upsert to DB.
 * Never throws — returns {success:false, error} on failure so cron does not crash.
 */
export async function syncGbpStats(): Promise<GbpSyncResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACES_PLACE_ID;

  if (!apiKey || !placeId) {
    const msg = "GOOGLE_PLACES_API_KEY or GOOGLE_PLACES_PLACE_ID not configured";
    logger.warn("[gbpSync] " + msg);
    return { success: false, error: msg };
  }

  const url = `${PLACES_API_BASE}/${placeId}`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      const msg = `Places API ${res.status}: ${body.slice(0, 200)}`;
      logger.error("[gbpSync] " + msg);
      return { success: false, error: msg };
    }

    const data = (await res.json()) as PlaceDetailsResponse;

    if (typeof data.rating !== "number" || typeof data.userRatingCount !== "number") {
      const msg = "Places API response missing rating or userRatingCount";
      logger.error("[gbpSync] " + msg, { data });
      return { success: false, error: msg };
    }

    const recentReviews = (data.reviews ?? []).slice(0, 5).map((r) => ({
      rating: r.rating ?? 0,
      text: r.text?.text ?? "",
      author: r.authorAttribution?.displayName ?? "",
      publishTime: r.publishTime ?? null,
      relativeTime: r.relativePublishTimeDescription ?? null,
    }));

    const saved = await storage.upsertBusinessStats({
      placeId: data.id,
      rating: data.rating,
      userRatingCount: data.userRatingCount,
      displayName: data.displayName?.text ?? null,
      internationalPhoneNumber: data.internationalPhoneNumber ?? null,
      websiteUri: data.websiteUri ?? null,
      weekdayHours: data.regularOpeningHours?.weekdayDescriptions ?? null,
      recentReviews,
      rawPayload: data,
      syncSource: "places_api_new",
    });

    logger.info("[gbpSync] Synced", {
      rating: saved.rating,
      userRatingCount: saved.userRatingCount,
      reviewsCount: recentReviews.length,
    });

    return {
      success: true,
      rating: saved.rating,
      userRatingCount: saved.userRatingCount,
      lastSyncedAt: saved.lastSyncedAt,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("[gbpSync] Fetch error", { error: msg });
    return { success: false, error: msg };
  }
}

/**
 * Get cached stats with safe fallback. Used by request-time SSR helpers
 * that must not block on Places API.
 */
export async function getCachedGbpStats(): Promise<{
  rating: number;
  userRatingCount: number;
  displayName: string | null;
  lastSyncedAt: Date | null;
  isFallback: boolean;
}> {
  const row = await storage.getBusinessStats();
  if (row) {
    return {
      rating: row.rating,
      userRatingCount: row.userRatingCount,
      displayName: row.displayName,
      lastSyncedAt: row.lastSyncedAt,
      isFallback: false,
    };
  }
  return {
    rating: BUSINESS_RATING,
    userRatingCount: BUSINESS_REVIEW_COUNT,
    displayName: BUSINESS_DISPLAY_NAME,
    lastSyncedAt: null,
    isFallback: true,
  };
}
