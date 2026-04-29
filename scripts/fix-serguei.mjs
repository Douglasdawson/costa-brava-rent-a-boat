import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const ID = '37c0df5a-64e8-48e7-a7ac-b917f7231b1a';

const before = await sql`SELECT id, start_time, end_time, total_hours, subtotal, total_amount, notes FROM bookings WHERE id = ${ID}`;
console.log('BEFORE:', before[0]);

const result = await sql`
  UPDATE bookings
  SET start_time = '2026-04-17T16:30:00Z',
      end_time   = '2026-04-17T17:30:00Z',
      total_hours = 1,
      subtotal = 80,
      total_amount = 80,
      notes = COALESCE(notes, '') || E'\n[2026-04-28] Corregido: hora real 18:30-19:30 local (1h, 80€). Antes figuraba 16-18h / 2h / 130€.'
  WHERE id = ${ID}
  RETURNING id, start_time, end_time, total_hours, subtotal, total_amount
`;
console.log('AFTER:', result[0]);
