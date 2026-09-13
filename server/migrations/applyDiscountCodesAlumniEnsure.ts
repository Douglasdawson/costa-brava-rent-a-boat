/**
 * Idempotent runtime schema sync for the alumni-code columns on discount_codes
 * (customer_phone / licensed_only), added 2026-09-13 for the Escola Nàutica Blanes
 * loyalty programme. Same pattern as applyAttributionColumnsEnsure.ts: the SQL is
 * ADD COLUMN IF NOT EXISTS, so it is safe on every boot, and the container never
 * needs drizzle-kit. Inline SQL on purpose: nothing to locate inside the bundle.
 */

import type { Pool } from "@neondatabase/serverless";

// Distinct advisory-lock id (must not collide with the other applyXEnsure runners).
const ADVISORY_LOCK_ID = 7731904418256003n;

const SQL = `
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "customer_phone" text;
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "licensed_only" boolean NOT NULL DEFAULT false;
`;

export async function applyDiscountCodesAlumniEnsure(pool: Pool): Promise<{
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
    if (lockRes.rows[0]?.locked !== true) {
      return { applied: false, durationMs: Date.now() - started, error: "lock-held-by-other-instance" };
    }
    try {
      await client.query(SQL);
      return { applied: true, durationMs: Date.now() - started };
    } finally {
      await client.query("SELECT pg_advisory_unlock($1::bigint)", [ADVISORY_LOCK_ID.toString()]);
    }
  } catch (err) {
    return { applied: false, durationMs: Date.now() - started, error: err instanceof Error ? err.message : String(err) };
  } finally {
    client.release();
  }
}
