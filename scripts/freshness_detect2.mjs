import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Show top 30 pages by total imp (33d window), with trend split
const r = await sql`
  WITH recent AS (
    SELECT page,
           SUM(clicks)::int AS clicks,
           SUM(impressions)::int AS impressions,
           AVG(position)::float AS avg_pos
    FROM gsc_queries
    WHERE date BETWEEN '2026-04-16' AND '2026-04-29'
      AND page IS NOT NULL
    GROUP BY page
  ), prior AS (
    SELECT page,
           SUM(clicks)::int AS clicks,
           SUM(impressions)::int AS impressions,
           AVG(position)::float AS avg_pos
    FROM gsc_queries
    WHERE date BETWEEN '2026-04-02' AND '2026-04-15'
      AND page IS NOT NULL
    GROUP BY page
  )
  SELECT
    COALESCE(r.page, p.page) AS page,
    p.impressions AS prior_imp,
    r.impressions AS recent_imp,
    p.clicks AS prior_clk,
    r.clicks AS recent_clk,
    p.avg_pos::numeric(6,1) AS prior_pos,
    r.avg_pos::numeric(6,1) AS recent_pos,
    CASE WHEN p.impressions > 0
      THEN ROUND(((r.impressions::float - p.impressions) / p.impressions * 100)::numeric, 1)
      ELSE NULL END AS drop_pct
  FROM recent r
  FULL OUTER JOIN prior p ON r.page = p.page
  WHERE COALESCE(p.impressions, 0) + COALESCE(r.impressions, 0) >= 25
  ORDER BY COALESCE(p.impressions, 0) + COALESCE(r.impressions, 0) DESC
  LIMIT 40
`;
console.log('Pages by total impressions (28 days):');
console.table(r.map(x => ({
  page: x.page,
  prior: x.prior_imp || 0,
  recent: x.recent_imp || 0,
  drop_pct: x.drop_pct,
  pos_p: x.prior_pos,
  pos_r: x.recent_pos,
  clk_p: x.prior_clk || 0,
  clk_r: x.recent_clk || 0,
})));
