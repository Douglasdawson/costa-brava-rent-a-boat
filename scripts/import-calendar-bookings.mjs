import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const DRY_RUN = !process.argv.includes('--commit');
const TODAY = new Date('2026-04-28T12:00:00Z');

const PLACEHOLDERS = {
  customer_surname: 'PENDIENTE',
  customer_phone: '+34000000000',
  customer_nationality: 'ES',
  number_of_people: 1,
};

// Local Spain time (CEST UTC+2 in April-October) → store as UTC by subtracting 2h.
const localToUTC = (dateStr, hh, mm = 0) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - 2, mm)).toISOString();
};

const bookings = [
  { name: 'Stephan',  date: '2026-04-04', boat: 'pacific-craft-625', sH: 10, sM: 0,  eH: 18, eM: 0,  hours: 8, price: 300, deposit: 500, calNote: 'Stephan - 10h a 18h - Pacific. Paga 50€ por Revolut link. Faltan 250€ + 500€ fianza.' },
  { name: 'Kelly',    date: '2026-04-07', boat: 'excursion-privada', sH: 14, sM: 0,  eH: 16, eM: 0,  hours: 2, price: 200, deposit: 500, calNote: 'Kelly - 14h a 16h - excursión privada. Paga 50€ x Revolut. Faltan 150€.' },
  { name: 'Andy',     date: '2026-04-10', boat: 'astec-480',         sH: 11, sM: 0,  eH: 15, eM: 0,  hours: 4, price: 180, deposit: 200, calNote: 'Andy - 11h a 15h - Astec 480. Paga 50€ Revolut. Faltan 130€ + 200€ fianza.' },
  { name: 'Atthisan', date: '2026-04-10', boat: 'astec-480',         sH: 15, sM: 30, eH: 18, eM: 30, hours: 3, price: 117, deposit: 200, calNote: 'Atthisan - 15:30h a 18:30h - Astec 480. Paga 50€ x Revolut. Faltan 67€ + 200€ fianza.' },
  { name: 'Jimmy',    date: '2026-04-11', boat: 'astec-480',         sH: 16, sM: 30, eH: 18, eM: 30, hours: 2, price: 130, deposit: 200, calNote: 'Jimmy - 16:30h a 18:30h - Astec 480. Paga 50€ x Revolut. Faltan 80€ + 200€ fianza.' },
  { name: 'Caitlyn',  date: '2026-04-17', boat: 'astec-480',         sH: 16, sM: 0,  eH: 18, eM: 0,  hours: 2, price: 180, deposit: 200, calNote: 'Caitlyn - 16h a 18h - Astec 480. Paga 50€ x Revolut. Faltan 130€ + 200€ fianza.' },
  { name: 'Ania',     date: '2026-04-19', boat: 'astec-480',         sH: 12, sM: 0,  eH: 15, eM: 0,  hours: 3, price: 150, deposit: 200, calNote: 'Ania - 12h a 15h - Astec 480. Paga 50€ x Revolut. Faltan 100€ + 200€ fianza.' },
  // Aezhel SKIPPED — confirmed = Soilo Diaz (already in CRM)
  { name: 'Nelly',    date: '2026-04-19', boat: 'astec-480',         sH: 15, sM: 30, eH: 18, eM: 30, hours: 3, price: 150, deposit: 200, calNote: 'Nelly - 15:30h a 18:30h - Astec. Paga 50€ x bizum. Faltan 100€ + 200€ fianza.' },
  { name: 'Gerome',   date: '2026-04-25', boat: 'astec-480',         sH: 10, sM: 0,  eH: 12, eM: 0,  hours: 2, price: 106, deposit: 200, calNote: 'Gerome - 10h a 12h - Astec. Paga 50€ x Revolut. Faltan 56€ + 200€ fianza.' },
  { name: 'Rosalie',  date: '2026-08-13', boat: 'remus-450',         sH: 10, sM: 0,  eH: 14, eM: 0,  hours: 4, price: 189, deposit: 200, calNote: 'Rosalie - 10h a 14h - Remus. Paga 50€ x transfer. Faltan 139 € + 200€ fianza. De 10h a 14h.' },
];

console.log(`MODE: ${DRY_RUN ? 'DRY-RUN (no inserts)' : 'COMMIT'}\n`);

let inserted = 0;
for (const b of bookings) {
  const start = localToUTC(b.date, b.sH, b.sM);
  const end   = localToUTC(b.date, b.eH, b.eM);
  const status = (new Date(start) < TODAY) ? 'completed' : 'confirmed';
  const notes = `Reserva importada del calendario el 2026-04-28 — completar datos cliente (apellido, teléfono, nacionalidad, nº personas, email). Original: ${b.calNote}`;

  console.log(`${b.name.padEnd(10)} · ${b.date} · ${b.boat.padEnd(20)} · ${b.hours}h · ${b.price}€ · fianza ${b.deposit}€ · ${status}`);
  console.log(`  start=${start} end=${end}`);

  if (!DRY_RUN) {
    const result = await sql`
      INSERT INTO bookings (
        boat_id, booking_date, start_time, end_time,
        customer_name, customer_surname, customer_phone, customer_nationality,
        number_of_people, total_hours, subtotal, extras_total, deposit, total_amount,
        booking_status, payment_status, source, notes, language
      ) VALUES (
        ${b.boat}, ${start}, ${start}, ${end},
        ${b.name}, ${PLACEHOLDERS.customer_surname}, ${PLACEHOLDERS.customer_phone}, ${PLACEHOLDERS.customer_nationality},
        ${PLACEHOLDERS.number_of_people}, ${b.hours}, ${b.price}, 0, ${b.deposit}, ${b.price},
        ${status}, 'pending', 'admin', ${notes}, 'es'
      )
      RETURNING id
    `;
    console.log(`  → inserted id=${result[0].id}`);
    inserted++;
  }
}

console.log(`\n${DRY_RUN ? 'DRY-RUN complete. Run with --commit to insert.' : `Inserted ${inserted} bookings.`}`);
