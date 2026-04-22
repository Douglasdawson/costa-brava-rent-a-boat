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
 * Idempotent: create business_stats table if missing. Safe to run on every
 * startup (uses IF NOT EXISTS). Required because Drizzle migrations aren't
 * auto-applied on Replit deployments — new DB branches start without the
 * table and endpoints hit /api/business-stats would 500 until first sync.
 */
async function ensureTableExists(): Promise<void> {
  try {
    const { db } = await import("../db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS business_stats (
        id SERIAL PRIMARY KEY,
        place_id TEXT NOT NULL,
        rating REAL NOT NULL,
        user_rating_count INTEGER NOT NULL,
        display_name TEXT,
        international_phone_number TEXT,
        website_uri TEXT,
        weekday_hours JSONB,
        recent_reviews JSONB,
        raw_payload JSONB,
        last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        sync_source VARCHAR(30) NOT NULL DEFAULT 'places_api_new'
      );
    `);
    logger.info("[businessStatsCache] Table ensured");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "unknown";
    logger.warn("[businessStatsCache] ensureTableExists error (non-fatal)", { error: msg });
  }
}

/**
 * If the DB is empty after ensureTableExists, run one sync to populate it
 * so the next request gets real data instead of the hardcoded fallback.
 */
async function syncIfEmpty(): Promise<void> {
  try {
    const existing = await storage.getBusinessStats();
    if (existing) return;
    if (!process.env.GOOGLE_PLACES_API_KEY || !process.env.GOOGLE_PLACES_PLACE_ID) {
      logger.warn("[businessStatsCache] DB empty but Places API env vars missing — keeping fallback");
      return;
    }
    logger.info("[businessStatsCache] DB empty, running first-time sync");
    const { syncGbpStats } = await import("../services/gbpSync");
    await syncGbpStats();
    await loadFromDb(); // refresh cache with fresh data
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "unknown";
    logger.warn("[businessStatsCache] syncIfEmpty error (non-fatal)", { error: msg });
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
 * Ensures table exists, runs initial sync if DB empty, then loads into cache.
 */
export async function initBusinessStatsCache(): Promise<void> {
  await ensureTableExists();
  await loadFromDb();
  await syncIfEmpty();
}
