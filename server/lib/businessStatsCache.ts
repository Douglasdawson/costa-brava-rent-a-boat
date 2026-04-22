/**
 * In-memory cache for Google Business Profile stats.
 *
 * Loaded at server startup from DB and refreshed hourly. Provides synchronous
 * access for SSR schema generators (seo-config, seoInjector) that can't await
 * DB lookups on every request.
 *
 * Source of truth: `business_stats` table (singleton row), populated weekly
 * by gbpSync cron from Google Places API.
 */

import { storage } from "../storage";
import { logger } from "./logger";
import {
  BUSINESS_RATING,
  BUSINESS_REVIEW_COUNT,
  BUSINESS_DISPLAY_NAME,
} from "../../shared/businessProfile";

interface CachedStats {
  rating: number;
  userRatingCount: number;
  displayName: string;
  lastSyncedAt: Date | null;
  isFallback: boolean;
}

const FALLBACK: CachedStats = {
  rating: BUSINESS_RATING,
  userRatingCount: BUSINESS_REVIEW_COUNT,
  displayName: BUSINESS_DISPLAY_NAME,
  lastSyncedAt: null,
  isFallback: true,
};

let cached: CachedStats = FALLBACK;
let lastLoadedAt = 0;
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function loadFromDb(): Promise<void> {
  try {
    const row = await storage.getBusinessStats();
    if (row) {
      cached = {
        rating: row.rating,
        userRatingCount: row.userRatingCount,
        displayName: row.displayName ?? FALLBACK.displayName,
        lastSyncedAt: row.lastSyncedAt,
        isFallback: false,
      };
      logger.info("[businessStatsCache] Loaded", {
        rating: cached.rating,
        userRatingCount: cached.userRatingCount,
        lastSyncedAt: cached.lastSyncedAt?.toISOString(),
      });
    } else {
      logger.warn("[businessStatsCache] No DB row, using fallback", { fallback: FALLBACK });
    }
    lastLoadedAt = Date.now();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "unknown";
    logger.error("[businessStatsCache] Load error", { error: msg });
  }
}

/**
 * Synchronous accessor for SSR schema generators.
 * Returns last loaded value (or fallback). Triggers background refresh if stale.
 */
export function getCurrentStats(): CachedStats {
  const now = Date.now();
  if (now - lastLoadedAt > REFRESH_INTERVAL_MS) {
    // Fire and forget — current call returns stale value, next call gets fresh
    void loadFromDb();
  }
  return cached;
}

/**
 * Convenience getters for common SSR needs.
 */
export function getCurrentRating(): number {
  return getCurrentStats().rating;
}

export function getCurrentReviewCount(): number {
  return getCurrentStats().userRatingCount;
}

/**
 * Initialize cache at server startup. Awaited from startScheduledServices.
 */
export async function initBusinessStatsCache(): Promise<void> {
  await loadFromDb();
}
