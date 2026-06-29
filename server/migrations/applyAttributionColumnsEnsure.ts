/**
 * Idempotent runtime schema sync for the marketing attribution columns on
 * whatsapp_inquiries (utm_source / utm_medium / utm_campaign / fbclid).
 *
 * Background: these columns were added with `drizzle-kit push` rather than a
 * journaled migration, so the drizzle meta journal (stuck at 0001) doesn't
 * know about them. Replit's Publish DB step keeps diffing that stale schema
 * against the live DB and proposing to DROP them, and a Republish occasionally
 * wipes them (same root cause documented in applyPricingOverridesEnsure.ts,
 * applySeoUrlInspectionsEnsure.ts and applyAiBotVisitsEnsure.ts). Without this
 * runner the lead -> booking attribution capture silently breaks after a
 * redeploy until a manual ALTER.
 *
 * This runner re-applies migrations/0011_attribution_columns.sql on every boot.
 * The SQL is fully idempotent (ADD COLUMN IF NOT EXISTS), so it's safe to run
 * any number of times. It restores the column STRUCTURE only -- per-row values
 * for existing rows cannot be recovered, so the destructive Publish prompt must
 * still be declined to preserve the data.
 *
 * Hook from server/index.ts BEFORE registerRoutes so the inquiry endpoints can
 * write the attribution columns from the first request after boot.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Pool } from "@neondatabase/serverless";

// Distinct advisory-lock id (random 64-bit signed int -- must not collide with
// the analytics, pricing, seo-url-inspections, ai-bot-visits or boats lock ids).
const ADVISORY_LOCK_ID = 8843921056472195n;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findMigrationFile(): string {
  const candidates = [
    join(__dirname, "../../migrations/0011_attribution_columns.sql"),
    join(__dirname, "../../../migrations/0011_attribution_columns.sql"),
    join(process.cwd(), "migrations/0011_attribution_columns.sql"),
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
    `Migration file 0011_attribution_columns.sql not found. Tried: ${candidates.join(", ")}`,
  );
}

export async function applyAttributionColumnsEnsure(pool: Pool): Promise<{
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
