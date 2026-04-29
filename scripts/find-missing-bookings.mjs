import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const targets = [
  { name: 'Stephan',   date: '2026-04-04' },
  { name: 'Kelly',     date: '2026-04-07' },
  { name: 'Andy',      date: '2026-04-10' },
  { name: 'Atthisan',  date: '2026-04-10' },
  { name: 'Jimmy',     date: '2026-04-11' },
  { name: 'Caitlyn',   date: '2026-04-17' },
  { name: 'Ania',      date: '2026-04-19' },
  { name: 'Aezhel',    date: '2026-04-19' },
  { name: 'Nelly',     date: '2026-04-19' },
  { name: 'Gerome',    date: '2026-04-25' },
  { name: 'Rosalie',   date: '2026-08-13' },
];

console.log('=== whatsapp_inquiries ===\n');
for (const t of targets) {
  const rows = await sql`
    SELECT first_name, last_name, phone_prefix, phone_number, email,
           booking_date, preferred_time, boat_name, number_of_people,
           estimated_total, status, created_at, language
    FROM whatsapp_inquiries
    WHERE LOWER(first_name) LIKE ${'%' + t.name.toLowerCase() + '%'}
       OR LOWER(last_name) LIKE ${'%' + t.name.toLowerCase() + '%'}
    ORDER BY created_at DESC
    LIMIT 5
  `;
  if (rows.length) {
    console.log(`-- ${t.name} (${t.date}):`);
    for (const r of rows) {
      console.log(`   ${r.first_name} ${r.last_name} · ${r.phone_prefix}${r.phone_number} · ${r.email || 'sin email'} · fecha=${r.booking_date} · barco=${r.boat_name} · pers=${r.number_of_people} · €${r.estimated_total} · status=${r.status} · lang=${r.language}`);
    }
  } else {
    console.log(`-- ${t.name} (${t.date}): NO MATCH`);
  }
}

console.log('\n=== customers (registered users) ===\n');
for (const t of targets) {
  const rows = await sql`
    SELECT first_name, last_name, phone_prefix, phone_number, email, nationality
    FROM customers
    WHERE LOWER(first_name) LIKE ${'%' + t.name.toLowerCase() + '%'}
       OR LOWER(last_name) LIKE ${'%' + t.name.toLowerCase() + '%'}
    LIMIT 5
  `;
  if (rows.length) {
    console.log(`-- ${t.name}:`);
    for (const r of rows) {
      console.log(`   ${r.first_name} ${r.last_name} · ${r.phone_prefix}${r.phone_number} · ${r.email || 'sin email'} · ${r.nationality}`);
    }
  }
}

console.log('\n=== crm_customers ===\n');
for (const t of targets) {
  const rows = await sql`
    SELECT name, surname, phone, email, nationality, total_bookings, segment
    FROM crm_customers
    WHERE LOWER(name) LIKE ${'%' + t.name.toLowerCase() + '%'}
       OR LOWER(surname) LIKE ${'%' + t.name.toLowerCase() + '%'}
    LIMIT 5
  `;
  if (rows.length) {
    console.log(`-- ${t.name}:`);
    for (const r of rows) {
      console.log(`   ${r.name} ${r.surname} · ${r.phone} · ${r.email || 'sin email'} · ${r.nationality || 'sin nac'} · reservas=${r.total_bookings} · ${r.segment}`);
    }
  }
}
