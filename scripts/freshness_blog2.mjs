import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const blog = await sql`
  SELECT slug, is_published, created_at::date AS created, updated_at::date AS updated, published_at::date AS pub
  FROM blog_posts
  WHERE is_published = true
  ORDER BY pub DESC NULLS LAST
  LIMIT 50
`;
console.log('Published blog posts (latest 50):');
console.table(blog);

// Look up blog post for /ca/blog/alquiler-barco-sin-licencia-guia
const target = await sql`
  SELECT slug, is_published, created_at::date AS created, updated_at::date AS updated, published_at::date AS pub,
         char_length(content) AS content_len
  FROM blog_posts
  WHERE slug = 'alquiler-barco-sin-licencia-guia'
`;
console.log('\nTarget candidate (alquiler-barco-sin-licencia-guia):');
console.table(target);
