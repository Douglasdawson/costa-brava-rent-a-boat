import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function safeCount(label: string, query: any) {
  try {
    const r = await db.execute(query);
    console.log(label, JSON.stringify(r.rows[0] ?? r.rows));
  } catch (e) {
    console.log(label, "ERR", e instanceof Error ? e.message : String(e));
  }
}

(async () => {
  console.log("=== SIGNAL DATA STATE ===\n");

  await safeCount(
    "GA4 daily rows:",
    sql`SELECT COUNT(*) AS n, MAX(date) AS last, MIN(date) AS first FROM ga4_daily;`,
  );
  await safeCount(
    "GA4 conv events:",
    sql`SELECT COUNT(*) AS n, MAX(date) AS last FROM ga4_conv_events;`,
  );
  await safeCount(
    "GSC queries rows:",
    sql`SELECT COUNT(*) AS n, MAX(date) AS last, MIN(date) AS first FROM gsc_queries;`,
  );
  await safeCount(
    "SEO rankings rows:",
    sql`SELECT COUNT(*) AS n, MAX(date) AS last FROM seo_rankings;`,
  );
  await safeCount(
    "psi_measurements (CWV):",
    sql`SELECT COUNT(*) AS n, MAX(measured_at) AS last FROM psi_measurements;`,
  );
  await safeCount(
    "ai_bot_visits:",
    sql`SELECT COUNT(*) AS n, MAX(visited_at) AS last FROM ai_bot_visits;`,
  );

  console.log("\n=== ALTERNATIVE BOOKING/LEAD TABLES ===\n");
  // Try common alternative table names
  const candidates = [
    "booking_requests",
    "leads",
    "contact_requests",
    "calendar_bookings",
    "external_bookings",
    "newsletter_subscribers",
    "review_requests",
  ];
  for (const t of candidates) {
    try {
      const r = await db.execute(sql.raw(
        `SELECT COUNT(*) AS n, MAX(created_at) AS last FROM ${t}`,
      ));
      console.log(`${t}:`, JSON.stringify(r.rows[0]));
    } catch (e) {
      console.log(`${t}: NOT FOUND`);
    }
  }

  console.log("\n=== TOP GSC QUERIES (last 30d, by clicks) ===\n");
  try {
    const r = await db.execute(sql`
      SELECT query, page, SUM(clicks) AS clicks, SUM(impressions) AS impr,
             AVG(position) AS avg_pos
      FROM gsc_queries
      WHERE date >= NOW() - INTERVAL '30 days'
      GROUP BY query, page
      ORDER BY clicks DESC NULLS LAST
      LIMIT 15;
    `);
    for (const row of r.rows) console.log(row);
  } catch (e) {
    console.log("ERR:", e instanceof Error ? e.message : String(e));
  }

  console.log("\n=== GA4 TOP LANDING PAGES (last 30d) ===\n");
  try {
    const r = await db.execute(sql`
      SELECT landing_page, channel_group,
             SUM(sessions) AS sessions, SUM(engaged_sessions) AS engaged
      FROM ga4_daily
      WHERE date >= NOW() - INTERVAL '30 days'
      GROUP BY landing_page, channel_group
      ORDER BY sessions DESC NULLS LAST
      LIMIT 15;
    `);
    for (const row of r.rows) console.log(row);
  } catch (e) {
    console.log("ERR:", e instanceof Error ? e.message : String(e));
  }

  process.exit(0);
})();
