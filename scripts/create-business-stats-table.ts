/**
 * One-shot migration: create business_stats singleton table.
 * Idempotent: safe to run multiple times.
 */
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("[migrate] Creating business_stats table...");

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

  console.log("[migrate] Done. Verifying...");

  const result = await db.execute(sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'business_stats'
    ORDER BY ordinal_position;
  `);

  console.log("[migrate] Columns:", result.rows);
  process.exit(0);
}

main().catch((err) => {
  console.error("[migrate] FAILED", err);
  process.exit(1);
});
