import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Period A (recent): 2026-04-16 to 2026-04-29 (14 days)
// Period B (prior):  2026-04-02 to 2026-04-15 (14 days)
// Compare per-page imp totals; flag URLs with drop ≥ 30%

const recent = await sql`
  SELECT page,
         SUM(clicks)::int AS clicks,
         SUM(impressions)::int AS impressions,
         AVG(position)::float AS avg_pos
  FROM gsc_queries
  WHERE date BETWEEN '2026-04-16' AND '2026-04-29'
    AND page IS NOT NULL
  GROUP BY page
`;
const prior = await sql`
  SELECT page,
         SUM(clicks)::int AS clicks,
         SUM(impressions)::int AS impressions,
         AVG(position)::float AS avg_pos
  FROM gsc_queries
  WHERE date BETWEEN '2026-04-02' AND '2026-04-15'
    AND page IS NOT NULL
  GROUP BY page
`;

const priorMap = new Map(prior.map(r => [r.page, r]));
const candidates = [];
for (const r of recent) {
  const p = priorMap.get(r.page);
  if (!p) continue;
  // Filter: peak imp > 50 (14-day proxy for >100/month)
  const peakImp = Math.max(r.impressions, p.impressions);
  if (peakImp < 50) continue;
  if (p.impressions === 0) continue;
  const dropPct = ((r.impressions - p.impressions) / p.impressions) * 100;
  if (dropPct <= -30) {
    candidates.push({
      page: r.page,
      prior_imp: p.impressions,
      recent_imp: r.impressions,
      drop_pct: dropPct.toFixed(1),
      prior_pos: p.avg_pos.toFixed(1),
      recent_pos: r.avg_pos.toFixed(1),
      pos_drop: (r.avg_pos - p.avg_pos).toFixed(1),
      prior_clicks: p.clicks,
      recent_clicks: r.clicks,
    });
  }
}
candidates.sort((a, b) => parseFloat(a.drop_pct) - parseFloat(b.drop_pct));
console.log('Candidates with imp drop ≥ 30% (peak ≥ 50 imp / 14d):');
console.table(candidates);

// Also, find pages whose top keyword position dropped by ≥ 5
const posDropped = await sql`
  WITH recent_per_kw AS (
    SELECT query, page, AVG(position)::float AS pos
    FROM gsc_queries
    WHERE date BETWEEN '2026-04-16' AND '2026-04-29' AND page IS NOT NULL
    GROUP BY query, page HAVING SUM(impressions) >= 10
  ), prior_per_kw AS (
    SELECT query, page, AVG(position)::float AS pos
    FROM gsc_queries
    WHERE date BETWEEN '2026-04-02' AND '2026-04-15' AND page IS NOT NULL
    GROUP BY query, page HAVING SUM(impressions) >= 10
  )
  SELECT r.query, r.page,
         p.pos AS prior_pos, r.pos AS recent_pos,
         (r.pos - p.pos) AS pos_change
  FROM recent_per_kw r
  JOIN prior_per_kw p ON p.query = r.query AND p.page = r.page
  WHERE (r.pos - p.pos) >= 5
  ORDER BY (r.pos - p.pos) DESC
  LIMIT 30
`;
console.log('\nKeywords dropped ≥ 5 positions:');
console.table(posDropped.map(r => ({
  query: r.query, page: r.page,
  prior: r.prior_pos.toFixed(1), recent: r.recent_pos.toFixed(1),
  change: r.pos_change.toFixed(1)
})));
