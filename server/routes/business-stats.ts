import type { Express } from "express";
import { storage } from "../storage";
import { syncGbpStats } from "../services/gbpSync";
import { requireAdminSession } from "./auth-middleware";
import { logger } from "../lib/logger";
import { getCrmDamarLifetimeStats } from "../lib/crmDamarStats";
import {
  BUSINESS_RATING,
  BUSINESS_REVIEW_COUNT,
  BUSINESS_DISPLAY_NAME,
} from "../../shared/businessProfile";

/**
 * Public endpoint exposing the cached Google Business Profile stats.
 * Frontend hooks + SSR schema generators consume this.
 */
export function registerBusinessStatsRoutes(app: Express) {
  // Public read (cached). Browser cache 1h, CDN cache 6h.
  app.get("/api/business-stats", async (_req, res) => {
    try {
      const row = await storage.getBusinessStats();
      if (!row) {
        // No row yet — fallback values so frontend never breaks
        res.set("Cache-Control", "public, max-age=300");
        return res.json({
          rating: BUSINESS_RATING,
          userRatingCount: BUSINESS_REVIEW_COUNT,
          displayName: BUSINESS_DISPLAY_NAME,
          recentReviews: [],
          lastSyncedAt: null,
          isFallback: true,
        });
      }

      res.set(
        "Cache-Control",
        "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400"
      );
      res.json({
        rating: row.rating,
        userRatingCount: row.userRatingCount,
        displayName: row.displayName,
        internationalPhoneNumber: row.internationalPhoneNumber,
        websiteUri: row.websiteUri,
        weekdayHours: row.weekdayHours ?? null,
        recentReviews: Array.isArray(row.recentReviews) ? row.recentReviews : [],
        lastSyncedAt: row.lastSyncedAt,
        isFallback: false,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "unknown";
      logger.error("[business-stats] GET error", { error: msg });
      res.status(500).json({ message: "Error: " + msg });
    }
  });

  // Public lifetime numbers (years, rentals, customers) read from the CRM.
  // Rounded DOWN to the nearest 50 so the "+" on the page is always true.
  // available:false hides the section: never invent numbers.
  app.get("/api/business-stats/lifetime", async (_req, res) => {
    const unavailable = () => {
      res.set("Cache-Control", "public, max-age=300");
      return res.json({ available: false });
    };
    try {
      const stats = await getCrmDamarLifetimeStats();
      if (!stats || stats.rentals < 100 || stats.customers < 100) return unavailable();
      const firstYear = Number(stats.firstDate.slice(0, 4));
      // Summers (seasons) active, first one included: matches the hero's "+7 veranos".
      const seasons = new Date().getFullYear() - firstYear + 1;
      const floor50 = (n: number) => Math.floor(n / 50) * 50;
      res.set(
        "Cache-Control",
        "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400"
      );
      return res.json({
        available: true,
        sinceYear: firstYear,
        seasons,
        rentals: floor50(stats.rentals),
        customers: floor50(stats.customers),
      });
    } catch (error: unknown) {
      logger.error("[business-stats] GET lifetime error", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return unavailable();
    }
  });

  // Admin — history of syncs with delta rating/count per entry.
  // Useful to detect reputation trends (rating going up/down over weeks).
  app.get("/api/admin/business-stats/history", requireAdminSession, async (_req, res) => {
    try {
      const { db } = await import("../db");
      const { sql } = await import("drizzle-orm");
      const result = await db.execute(sql`
        SELECT id, rating, user_rating_count, delta_rating, delta_review_count,
               is_significant_change, raw_payload, synced_at
        FROM business_stats_history
        ORDER BY synced_at DESC
        LIMIT 20
      `);
      res.json({ history: result.rows });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "unknown";
      logger.error("[business-stats] GET history error", { error: msg });
      res.status(500).json({ message: "Error: " + msg });
    }
  });

  // Admin manual trigger — useful for forcing a refresh after rotating key,
  // updating GBP info, or testing.
  app.post("/api/admin/business-stats/sync", requireAdminSession, async (_req, res) => {
    try {
      const result = await syncGbpStats();
      if (!result.success) {
        return res.status(502).json({ message: "Sync failed", error: result.error });
      }
      res.json({
        success: true,
        rating: result.rating,
        userRatingCount: result.userRatingCount,
        lastSyncedAt: result.lastSyncedAt,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "unknown";
      logger.error("[business-stats] POST sync error", { error: msg });
      res.status(500).json({ message: "Error: " + msg });
    }
  });
}
