import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const check = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'business_stats'
    ) as table_exists;
  `);
  console.log("Table exists:", check.rows[0]);

  if ((check.rows[0] as { table_exists: boolean }).table_exists) {
    const rows = await db.execute(sql`SELECT id, rating, user_rating_count, last_synced_at FROM business_stats;`);
    console.log("Rows:", rows.rows);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
