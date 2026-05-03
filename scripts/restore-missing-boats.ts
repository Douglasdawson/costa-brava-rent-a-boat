/**
 * One-shot CLI to invoke the same boats seed ensure runner that
 * server/index.ts runs on every boot. Useful for restoring missing canonical
 * rows (e.g. after a Replit Republish wipes them) without waiting for a redeploy.
 *
 * Run:  npx tsx scripts/restore-missing-boats.ts
 */
import "dotenv/config";
import { Pool } from "@neondatabase/serverless";
import { applyBoatsSeedEnsure } from "../server/migrations/applyBoatsSeedEnsure";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const result = await applyBoatsSeedEnsure(pool);
console.log(JSON.stringify(result, null, 2));
await pool.end();
