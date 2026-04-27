/**
 * Idempotent runtime schema sync for the pricing_overrides table.
 *
 * Background: Replit `Republish` wipes tables added to shared/schema.ts after
 * the last full Publish (same root cause documented in
 * applyAnalyticsUnblock.ts and project_seo_engine_schema_revert.md memory).
 * `pricing_overrides` was added in commit d9d8e8c, so it disappears on every
 * Republish until a full Publish includes it.
 *
 * Until that's fixed (or migrated to drizzle-kit migrate), this runner
 * re-applies migrations/0008_pricing_overrides.sql on every boot. The SQL
 * is fully idempotent (CREATE TABLE IF NOT EXISTS + CHECK constraints
 * via DO blocks + CREATE INDEX IF NOT EXISTS), so it's safe to run any
 * number of times.
 *
 * Hook from server/index.ts AFTER applyAnalyticsUnblock and BEFORE
 * registerRoutes (so admin pricing endpoints find the table they expect).
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Pool } from "@neondatabase/serverless";

// Distinct advisory-lock id (random 64-bit signed int — must not collide
// with the analytics one in applyAnalyticsUnblock.ts).
const ADVISORY_LOCK_ID = 8923741058372651n;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findMigrationFile(): string {
  const candidates = [
    join(__dirname, "../../migrations/0008_pricing_overrides.sql"),
    join(__dirname, "../../../migrations/0008_pricing_overrides.sql"),
    join(process.cwd(), "migrations/0008_pricing_overrides.sql"),
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
    `Migration file 0008_pricing_overrides.sql not found. Tried: ${candidates.join(", ")}`,
  );
}

export async function applyPricingOverridesEnsure(pool: Pool): Promise<{
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
