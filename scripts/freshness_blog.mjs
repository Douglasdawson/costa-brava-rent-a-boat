import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const cols = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'blog_posts' ORDER BY ordinal_position
`;
console.log('blog_posts columns:', cols.map(c => c.column_name));

const blog = await sql`
  SELECT slug, status, created_at::date AS created, updated_at::date AS updated, published_at::date AS pub
  FROM blog_posts
  WHERE status = 'published'
  ORDER BY pub DESC NULLS LAST
  LIMIT 30
`;
console.log('Published blog posts (latest 30):');
console.table(blog);
