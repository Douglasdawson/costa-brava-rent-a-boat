import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  SELECT b.id, b.start_time, b.end_time, b.customer_name, b.customer_surname,
         b.customer_phone, b.total_hours, b.subtotal, b.deposit, b.total_amount,
         b.booking_status, b.payment_status, b.source, b.notes,
         bo.name AS boat_name
  FROM bookings b
  LEFT JOIN boats bo ON bo.id = b.boat_id
  WHERE b.start_time >= '2026-01-01' AND b.start_time < '2027-01-01'
  ORDER BY b.start_time ASC
`;
console.log(JSON.stringify(rows, null, 2));
console.log('---TOTAL:', rows.length);
