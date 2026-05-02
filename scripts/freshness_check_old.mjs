import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Look up GSC data for the 2025-10-16 posts (>60 days old eligible for refresh)
const slugs = [
  'comparativa-barcos-con-sin-licencia-blanes',
  'mejor-epoca-alquilar-barco-blanes',
  'que-hacer-en-blanes-en-barco',
  'seguridad-alquiler-barcos-consejos',
  '7-calas-secretas-costa-brava-en-barco',
  'guia-alquiler-barcos-sin-licencia-blanes',
  'ruta-barco-blanes-tossa-mar',
];

for (const slug of slugs) {
  const r = await sql`
    SELECT page,
           SUM(impressions)::int AS imp,
           SUM(clicks)::int AS clk,
           AVG(position)::numeric(6,1) AS pos,
           MIN(date) AS d_min, MAX(date) AS d_max
    FROM gsc_queries
    WHERE page ILIKE ${`%/blog/${slug}%`}
    GROUP BY page
    ORDER BY imp DESC
  `;
  if (r.length) {
    console.log(`\n${slug}:`);
    console.table(r);
  }
}

// Also check landing pages by URL pattern
console.log('\n--- Landing pages with consistent traffic ---');
const lps = await sql`
  SELECT page,
         SUM(impressions)::int AS imp,
         SUM(clicks)::int AS clk,
         AVG(position)::numeric(6,1) AS pos,
         COUNT(DISTINCT date) AS days
  FROM gsc_queries
  WHERE page ILIKE '%alquiler%' OR page ILIKE '%barcos%' OR page ILIKE '%boat-rental%' OR page ILIKE '%bootverleih%' OR page ILIKE '%boot-mieten%'
  GROUP BY page
  HAVING SUM(impressions) >= 30
  ORDER BY imp DESC
  LIMIT 30
`;
console.table(lps.map(x => ({page: x.page.replace('https://www.costabravarentaboat.com', ''), imp: x.imp, clk: x.clk, pos: x.pos, days: x.days})));
