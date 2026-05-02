import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Lower threshold for peak imp to ≥30 since GSC dataset is sparse for this site
const r = await sql`
  WITH recent AS (
    SELECT page,
           SUM(clicks)::int AS clicks,
           SUM(impressions)::int AS impressions,
           AVG(position)::float AS avg_pos
    FROM gsc_queries
    WHERE date BETWEEN '2026-04-16' AND '2026-04-29' AND page IS NOT NULL
    GROUP BY page
  ), prior AS (
    SELECT page,
           SUM(clicks)::int AS clicks,
           SUM(impressions)::int AS impressions,
           AVG(position)::float AS avg_pos
    FROM gsc_queries
    WHERE date BETWEEN '2026-04-02' AND '2026-04-15' AND page IS NOT NULL
    GROUP BY page
  )
  SELECT
    COALESCE(r.page, p.page) AS page,
    COALESCE(p.impressions, 0) AS prior_imp,
    COALESCE(r.impressions, 0) AS recent_imp,
    COALESCE(p.clicks, 0) AS prior_clk,
    COALESCE(r.clicks, 0) AS recent_clk,
    p.avg_pos::numeric(6,1) AS prior_pos,
    r.avg_pos::numeric(6,1) AS recent_pos,
    CASE WHEN COALESCE(p.impressions, 0) > 0
      THEN ROUND(((COALESCE(r.impressions, 0)::float - p.impressions) / p.impressions * 100)::numeric, 1)
      ELSE NULL END AS drop_pct
  FROM recent r
  FULL OUTER JOIN prior p ON r.page = p.page
  WHERE GREATEST(COALESCE(p.impressions, 0), COALESCE(r.impressions, 0)) >= 30
    AND COALESCE(p.impressions, 0) > 0
    AND COALESCE(r.impressions, 0) < p.impressions
    AND ((COALESCE(r.impressions, 0)::float - p.impressions) / p.impressions * 100) <= -30
  ORDER BY drop_pct ASC
`;
console.log('Decay candidates (drop ≥30%, peak ≥30 imp / 14d window):');
console.table(r.map(x => ({
  page: x.page.replace('https://www.costabravarentaboat.com', ''),
  prior_imp: x.prior_imp,
  recent_imp: x.recent_imp,
  drop_pct: x.drop_pct,
  pos_p: x.prior_pos,
  pos_r: x.recent_pos,
})));

// Now check for keyword-radar style: keywords with significant pos drop affecting URLs
const k = await sql`
  WITH recent_per_kw AS (
    SELECT query, page, AVG(position)::float AS pos, SUM(impressions)::int AS imp
    FROM gsc_queries
    WHERE date BETWEEN '2026-04-16' AND '2026-04-29' AND page IS NOT NULL
    GROUP BY query, page
  ), prior_per_kw AS (
    SELECT query, page, AVG(position)::float AS pos, SUM(impressions)::int AS imp
    FROM gsc_queries
    WHERE date BETWEEN '2026-04-02' AND '2026-04-15' AND page IS NOT NULL
    GROUP BY query, page
  )
  SELECT r.query, r.page,
         p.pos::numeric(6,1) AS prior_pos,
         r.pos::numeric(6,1) AS recent_pos,
         (r.pos - p.pos)::numeric(6,1) AS pos_change,
         p.imp AS prior_imp,
         r.imp AS recent_imp
  FROM recent_per_kw r
  JOIN prior_per_kw p ON p.query = r.query AND p.page = r.page
  WHERE (r.pos - p.pos) >= 5
    AND (p.imp + r.imp) >= 8
  ORDER BY (r.pos - p.pos) DESC
  LIMIT 25
`;
console.log('\nKeywords with position drop ≥5:');
console.table(k.map(x => ({
  query: x.query,
  page: x.page.replace('https://www.costabravarentaboat.com', ''),
  prior_pos: x.prior_pos,
  recent_pos: x.recent_pos,
  change: x.pos_change,
  prior_imp: x.prior_imp,
  recent_imp: x.recent_imp,
})));

// Check blog_posts to see what we can refresh in DB
const blog = await sql`
  SELECT slug, language, status, created_at::date AS created, updated_at::date AS updated, published_at::date AS pub
  FROM blog_posts
  WHERE status = 'published'
  ORDER BY pub DESC
  LIMIT 30
`;
console.log('\nPublished blog posts (latest 30):');
console.table(blog);
