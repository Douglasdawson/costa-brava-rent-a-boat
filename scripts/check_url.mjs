import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// 1. Find all slugs containing "sin-licencia"
const r = await sql`
  SELECT slug, is_published, published_at::date AS pub
  FROM blog_posts
  WHERE slug ILIKE '%sin-licencia%' OR slug ILIKE '%sin_licencia%'
  ORDER BY published_at DESC NULLS LAST
`;
console.log('Slugs with "sin-licencia":');
console.table(r);

// 2. Check ca/blog routing by reading the blog content slug structure
const ca = await sql`
  SELECT slug, is_published,
    COALESCE(content_by_lang->>'ca', '') AS ca_content_len_chk,
    COALESCE(title_by_lang->>'ca', '') AS ca_title
  FROM blog_posts
  WHERE slug ILIKE '%sin-licencia%'
  LIMIT 5
`;
console.log('\nCA translations for sin-licencia posts:');
console.table(ca.map(x => ({
  slug: x.slug,
  has_ca: x.ca_content_len_chk ? x.ca_content_len_chk.length : 0,
  ca_title: x.ca_title?.slice(0, 50) || '(none)',
})));

// 3. Check if /ca/blog/{slug} routes work — find the catalan slug for sin-licencia
console.log('\nLooking for any URL ending alquiler-barco-sin-licencia-guia in ANY way:');
const t = await sql`
  SELECT page, SUM(impressions)::int AS imp, AVG(position)::numeric(6,1) AS pos
  FROM gsc_queries
  WHERE page ILIKE '%alquiler-barco-sin-licencia%'
  GROUP BY page
  ORDER BY imp DESC
`;
console.table(t.map(x => ({page: x.page.replace('https://www.costabravarentaboat.com', ''), imp: x.imp, pos: x.pos})));

// 4. Look at the content of guia-alquiler-barcos-sin-licencia-blanes (could be the canonical)
const canon = await sql`
  SELECT slug, is_published, published_at::date AS pub, char_length(content) AS content_len,
         char_length(COALESCE(content_by_lang->>'ca', '')) AS ca_len
  FROM blog_posts
  WHERE slug = 'guia-alquiler-barcos-sin-licencia-blanes'
     OR slug = 'alquiler-barco-sin-licencia-blanes-guia'
`;
console.log('\nCanonical sin-licencia-blanes post:');
console.table(canon);
