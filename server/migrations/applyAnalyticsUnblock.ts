/**
 * Idempotent runtime schema sync for the analytics tables.
 *
 * Background: prod DB schema reverted between 2026-04-21 and 2026-04-25,
 * breaking every autopilot analytics tool (gsc_queries, ga4_daily_metrics,
 * psi_measurements, serp_snapshots, oauth_connections, seo_keywords.language).
 * Mechanism still unconfirmed (Replit Database snapshot? deploy-time push?).
 *
 * Until the revert mechanism is identified and fixed, this runner re-applies
 * the migration on every app boot. Postgres-side lock prevents concurrent
 * runs across Replit Autoscale instances. Migration uses CREATE TABLE IF
 * NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS, so it is safe to run
 * any number of times.
 *
 * Hook from server/index.ts AFTER `httpServer.listen` (so health probes
 * respond immediately) and BEFORE `registerRoutes` (so cron jobs and admin
 * routes find the tables they expect).
 */

import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { Pool } from "@neondatabase/serverless";

// Same advisory-lock id used across all instances. Random 64-bit signed int.
const ADVISORY_LOCK_ID = 7849125632104937n;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolve the migration file path. Works in dev (ts-node from server/) and
 * in build (esbuild from dist/). Tries multiple candidate locations.
 */
function findMigrationFile(): string {
  const candidates = [
    join(__dirname, "../../migrations/0007_unblock_analytics.sql"),
    join(__dirname, "../../../migrations/0007_unblock_analytics.sql"),
    join(process.cwd(), "migrations/0007_unblock_analytics.sql"),
  ];
  for (const c of candidates) {
    try {
      readFileSync(c, "utf8");
      return c;
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `Migration file not found. Tried: ${candidates.join(", ")}`,
  );
}

export async function applyAnalyticsUnblock(pool: Pool): Promise<{
  applied: boolean;
  durationMs: number;
  error?: string;
}> {
  const started = Date.now();
  const client = await pool.connect();
  try {
    // Acquire advisory lock so only one instance runs at a time.
    // pg_try_advisory_lock returns false if another instance holds it —
    // in that case we just skip; the other instance will apply.
    const lockRes = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1::bigint) AS locked",
      [ADVISORY_LOCK_ID.toString()],
    );
    const locked = lockRes.rows[0]?.locked === true;
    if (!locked) {
      return {
        applied: false,
        durationMs: Date.now() - started,
        error: "lock-held-by-other-instance",
      };
    }

    try {
      const sqlPath = findMigrationFile();
      const sql = readFileSync(sqlPath, "utf8");
      // The migration file already contains its own BEGIN/COMMIT,
      // so we just execute it as one batch.
      await client.query(sql);
      return { applied: true, durationMs: Date.now() - started };
    } finally {
      await client.query("SELECT pg_advisory_unlock($1::bigint)", [
        ADVISORY_LOCK_ID.toString(),
      ]);
    }
  } catch (err) {
    return {
      applied: false,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    client.release();
  }
}
