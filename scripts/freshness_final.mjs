import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

console.log('=== FINAL DETECTION REPORT ===\n');

// Use 14d-vs-14d (data only spans 33 days; can't do month vs month)
console.log('Window: recent=2026-04-16..2026-04-29 vs prior=2026-04-02..2026-04-15 (14d each)');

const drops = await sql`
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
  WHERE COALESCE(p.impressions, 0) > 0
    AND ((COALESCE(r.impressions, 0)::float - p.impressions) / p.impressions * 100) <= -25
    AND GREATEST(COALESCE(p.impressions, 0), COALESCE(r.impressions, 0)) >= 15
  ORDER BY drop_pct ASC
`;
console.log('\nAll pages with imp drop ≥25% (peak ≥15 imp / 14d):');
console.table(drops.map(x => ({
  page: x.page.replace('https://www.costabravarentaboat.com', ''),
  prior_imp: x.prior_imp,
  recent_imp: x.recent_imp,
  drop_pct: x.drop_pct + '%',
  pos_p: x.prior_pos,
  pos_r: x.recent_pos,
  prior_clk: x.prior_clk,
  recent_clk: x.recent_clk,
})));

// Verify which candidate URLs exist as published pages
const candidates = drops.map(d => d.page.replace('https://www.costabravarentaboat.com', ''));
console.log('\nCandidate URLs check:');

for (const url of candidates) {
  // Extract slug for blog posts
  const blogMatch = url.match(/^\/(?:[a-z]{2}\/)?blog\/(.+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const r = await sql`
      SELECT slug, is_published, published_at::date AS pub
      FROM blog_posts WHERE slug = ${slug}
    `;
    console.log(`  ${url} → blog: ${r.length ? `EXISTS (pub ${r[0].pub})` : 'NOT FOUND IN DB (404)'}`);
  } else {
    console.log(`  ${url} → static page (React component)`);
  }
}
