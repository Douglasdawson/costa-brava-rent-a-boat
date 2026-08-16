import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
const url = readFileSync('.env','utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g,'');
const sql = neon(url);
const [r] = await sql`SELECT id, slug, category, cluster_id, is_published, is_auto_generated, length(content) clen, char_length(meta_description) mlen, array_length(tags,1) ntags FROM blog_posts WHERE slug='alquiler-barco-tossa-de-mar-desde-blanes'`;
console.log(JSON.stringify(r));
