import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const boats = await sql`SELECT id, name, deposit, requires_license FROM boats ORDER BY name`;
console.log('=== BOATS ===');
for (const b of boats) {
  console.log(`${b.id.padEnd(20)} · ${b.name.padEnd(35)} · fianza=${b.deposit} · licencia=${b.requires_license}`);
}

const tenants = await sql`SELECT id, name FROM tenants`;
console.log('\n=== TENANTS ===');
for (const t of tenants) console.log(`${t.id} · ${t.name}`);

// Sample one existing booking to see what tenant_id is used
const sample = await sql`SELECT tenant_id, boat_id FROM bookings WHERE start_time >= '2026-04-01' AND start_time < '2026-05-01' LIMIT 1`;
console.log('\n=== sample booking tenant ===');
console.log(sample[0]);
