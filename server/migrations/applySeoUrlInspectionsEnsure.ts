/**
 * Idempotent runtime schema sync for the seo_url_inspections table.
 *
 * Background: Replit `Republish` wipes tables added to shared/schema.ts after
 * the last full Publish (same root cause documented in
 * applyPricingOverridesEnsure.ts and project_seo_engine_schema_revert.md).
 * `seo_url_inspections` was added in commit 735c7f3 / 9042467 and disappeared
 * on the next Republish, so without this runner the URL Inspection coverage
 * endpoints (/api/admin/seo/coverage*) return 500 until a manual db:push.
 *
 * This runner re-applies migrations/0009_seo_url_inspections.sql on every
 * boot. The SQL is fully idempotent (CREATE TABLE IF NOT EXISTS + CREATE
 * INDEX IF NOT EXISTS), so it's safe to run any number of times.
 *
 * Hook from server/index.ts AFTER applyPricingOverridesEnsure and BEFORE
 * registerRoutes (so admin SEO coverage endpoints find the table).
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Pool } from "@neondatabase/serverless";

// Distinct advisory-lock id (random 64-bit signed int — must not collide
// with the analytics one in applyAnalyticsUnblock.ts or the pricing one
// in applyPricingOverridesEnsure.ts).
const ADVISORY_LOCK_ID = 7651928374610582n;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findMigrationFile(): string {
  const candidates = [
    join(__dirname, "../../migrations/0009_seo_url_inspections.sql"),
    join(__dirname, "../../../migrations/0009_seo_url_inspections.sql"),
    join(process.cwd(), "migrations/0009_seo_url_inspections.sql"),
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
    `Migration file 0009_seo_url_inspections.sql not found. Tried: ${candidates.join(", ")}`,
  );
}

export async function applySeoUrlInspectionsEnsure(pool: Pool): Promise<{
  applied: boolean;
  durationMs: number;
  error?: string;
}> {
  const started = Date.now();
  const client = await pool.connect();
  try {
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
