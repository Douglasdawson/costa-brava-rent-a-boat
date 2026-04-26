/**
 * Auto-backfill analytics tables on app boot if they are empty.
 *
 * Background: Replit Autoscale Deploy appears to reset the DB schema on every
 * Republish — tables added outside the original drizzle journal (war-room-fase2,
 * 0001_sync) get dropped + recreated empty by some snapshot/restore mechanism.
 * Mechanism still unconfirmed (see project_seo_engine_schema_revert.md).
 *
 * `applyAnalyticsUnblock` already heals the schema on boot. This module heals
 * the DATA: if it detects empty tables, it triggers the GSC + GA4 collectors
 * to re-ingest the last 28 days. All operations are idempotent (ON CONFLICT
 * upserts) so accidental double-runs are safe.
 *
 * Hook order in server/index.ts:
 *   1. httpServer.listen        ← health probes respond
 *   2. applyAnalyticsUnblock    ← schema sync (tables exist with right shape)
 *   3. autoBackfillAnalytics    ← THIS — data restore (fire-and-forget)
 *   4. registerRoutes           ← app fully online
 *
 * Single-instance guarantee via pg_advisory_lock (different lock id from
 * applyAnalyticsUnblock so they don't conflict).
 *
 * Quota: each backfill makes ~30 Google API calls. Cap on running only when
 * empty + advisory lock means at most 1 backfill across all Autoscale
 * instances per Republish — well within Google's daily quotas.
 */

import { sql } from "drizzle-orm";
import type { Pool } from "@neondatabase/serverless";
import { db } from "../db";
import { gscQueries, ga4DailyMetrics, ga4ConversionEvents } from "../../shared/schema";
import { logger } from "../lib/logger";

// Distinct from the schema-sync lock id
const AUTOBACKFILL_LOCK_ID = 7849125632104938n;

const BACKFILL_DAYS = 28;

interface BackfillResult {
  triggered: boolean;
  reason?: string;
  results?: {
    gsc?: { rowsFetched: number; rowsWritten: number } | { error: string };
    ga4Daily?: { rowsFetched: number; rowsWritten: number } | { error: string };
    ga4Conversions?: { rowsFetched: number; rowsWritten: number } | { error: string };
  };
  durationMs: number;
}

async function tableIsEmpty(table: typeof gscQueries | typeof ga4DailyMetrics | typeof ga4ConversionEvents): Promise<boolean> {
  try {
    // Fast existence check — LIMIT 1 is cheaper than COUNT on indexed tables
    const result = await db.select({ id: sql<number>`1` }).from(table).limit(1);
    return result.length === 0;
  } catch (err) {
    // If table query throws, treat as empty (schema-sync hasn't created it yet)
    logger.warn("[auto-backfill] tableIsEmpty check failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false; // safer: don't trigger backfill on uncertain state
  }
}

async function safeCallCollector<T>(name: string, fn: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`[auto-backfill] ${name} failed`, { error: msg });
    return { error: msg };
  }
}

export async function autoBackfillAnalytics(pool: Pool): Promise<BackfillResult> {
  const started = Date.now();
  const client = await pool.connect();

  try {
    // Acquire dedicated lock — only one instance backfills per Republish.
    const lockRes = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1::bigint) AS locked",
      [AUTOBACKFILL_LOCK_ID.toString()],
    );
    const locked = lockRes.rows[0]?.locked === true;
    if (!locked) {
      return {
        triggered: false,
        reason: "lock-held-by-other-instance",
        durationMs: Date.now() - started,
      };
    }

    try {
      // Decide whether to backfill: only if all 3 are empty (typical post-Republish state).
      // If even one has data, the cron probably ran or the user already triggered manual ETLs;
      // skip to avoid quota waste.
      const [gscEmpty, ga4Empty, ga4ConvEmpty] = await Promise.all([
        tableIsEmpty(gscQueries),
        tableIsEmpty(ga4DailyMetrics),
        tableIsEmpty(ga4ConversionEvents),
      ]);

      const tablesEmpty = [gscEmpty, ga4Empty, ga4ConvEmpty].filter(Boolean).length;
      if (tablesEmpty === 0) {
        return {
          triggered: false,
          reason: "tables-have-data",
          durationMs: Date.now() - started,
        };
      }

      logger.info(`[auto-backfill] Detected empty analytics tables (${tablesEmpty}/3), triggering ${BACKFILL_DAYS}-day backfill`);

      // Lazy-import collectors so this module doesn't load Google deps at module init
      const [{ collectGscQueries }, { collectGa4Daily }, { collectGa4ConversionEvents }] = await Promise.all([
        import("../seo/collectors/gscQueries"),
        import("../seo/collectors/ga4Daily"),
        import("../seo/collectors/ga4ConversionEvents"),
      ]);

      // Run in parallel — they hit different Google APIs (Search Console vs Analytics Data)
      // so no single-API rate limit conflict.
      const [gscResult, ga4DailyResult, ga4ConvResult] = await Promise.all([
        gscEmpty
          ? safeCallCollector("collectGscQueries", () => collectGscQueries({ daysBack: BACKFILL_DAYS }))
          : Promise.resolve({ rowsFetched: 0, rowsWritten: 0 }),
        ga4Empty
          ? safeCallCollector("collectGa4Daily", () => collectGa4Daily({ daysBack: BACKFILL_DAYS }))
          : Promise.resolve({ rowsFetched: 0, rowsWritten: 0 }),
        ga4ConvEmpty
          ? safeCallCollector("collectGa4ConversionEvents", () => collectGa4ConversionEvents({ daysBack: BACKFILL_DAYS }))
          : Promise.resolve({ rowsFetched: 0, rowsWritten: 0 }),
      ]);

      logger.info("[auto-backfill] Done", {
        durationMs: Date.now() - started,
        gsc: gscResult,
        ga4Daily: ga4DailyResult,
        ga4Conversions: ga4ConvResult,
      });

      return {
        triggered: true,
        results: {
          gsc: "rowsFetched" in gscResult ? { rowsFetched: gscResult.rowsFetched, rowsWritten: gscResult.rowsWritten } : gscResult,
          ga4Daily: "rowsFetched" in ga4DailyResult ? { rowsFetched: ga4DailyResult.rowsFetched, rowsWritten: ga4DailyResult.rowsWritten } : ga4DailyResult,
          ga4Conversions: "rowsFetched" in ga4ConvResult ? { rowsFetched: ga4ConvResult.rowsFetched, rowsWritten: ga4ConvResult.rowsWritten } : ga4ConvResult,
        },
        durationMs: Date.now() - started,
      };
    } finally {
      await client.query("SELECT pg_advisory_unlock($1::bigint)", [
        AUTOBACKFILL_LOCK_ID.toString(),
      ]);
    }
  } catch (err) {
    return {
      triggered: false,
      reason: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
    };
  } finally {
    client.release();
  }
}
