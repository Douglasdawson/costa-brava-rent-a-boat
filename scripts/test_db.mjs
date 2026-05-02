import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
const sql = neon(process.env.DATABASE_URL);
const r = await sql`SELECT COUNT(*)::int AS n FROM gsc_queries`;
console.log('gsc_queries count:', r);
const r2 = await sql`SELECT MIN(date) AS min_d, MAX(date) AS max_d FROM gsc_queries`;
console.log('range:', r2);
