import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

(async () => {
  const r = await db.execute(sql`
    SELECT
      COUNT(*) AS total_all_time,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '90 days') AS last_90d,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS last_30d,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7d,
      MAX(created_at) AS last_booking,
      MIN(created_at) AS first_booking
    FROM bookings;
  `);
  console.log("=== BOOKINGS OVERVIEW ===");
  console.log(JSON.stringify(r.rows[0], null, 2));

  const r2 = await db.execute(sql`
    SELECT booking_status, COUNT(*) AS n
    FROM bookings
    GROUP BY booking_status
    ORDER BY n DESC;
  `);
  console.log("\n=== BY STATUS (all time) ===");
  for (const row of r2.rows) console.log(row);

  const r3 = await db.execute(sql`
    SELECT source, COUNT(*) AS n
    FROM bookings
    GROUP BY source
    ORDER BY n DESC;
  `);
  console.log("\n=== BY SOURCE (all time) ===");
  for (const row of r3.rows) console.log(row);

  const r4 = await db.execute(sql`
    SELECT EXTRACT(YEAR FROM created_at) AS y, EXTRACT(MONTH FROM created_at) AS m, COUNT(*) AS n
    FROM bookings
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY 1, 2
    ORDER BY 1 DESC, 2 DESC;
  `);
  console.log("\n=== BY MONTH (last 12) ===");
  for (const row of r4.rows) console.log(row);

  process.exit(0);
})();
