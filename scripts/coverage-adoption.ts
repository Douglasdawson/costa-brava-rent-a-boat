import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Adoption of the optional coverages (step 5 of the booking wizard).
 *
 * The names are matched against the CANONICAL SPANISH labels, which the widget
 * writes into `extras` regardless of the visitor's language
 * (COVERAGE_INQUIRY_NAMES in shared/pricing.ts) — matching translated labels
 * would silently miss every non-Spanish request.
 *
 * Read-only. Run: `npx tsx scripts/coverage-adoption.ts [días]` (default 30).
 */
const WEATHER = "Garantía de mal tiempo";
const DEPOSIT = "Fianza reducida";

(async () => {
  const days = Number(process.argv[2]) || 30;

  const overall = await db.execute(sql`
    SELECT
      COUNT(*)                                                        AS peticiones,
      COUNT(*) FILTER (WHERE extras ? ${WEATHER})                     AS con_meteo,
      COUNT(*) FILTER (WHERE extras ? ${DEPOSIT})                     AS con_fianza,
      COUNT(*) FILTER (WHERE extras ? ${WEATHER} OR extras ? ${DEPOSIT}) AS con_alguna,
      COUNT(*) FILTER (WHERE extras ? ${WEATHER} AND extras ? ${DEPOSIT}) AS con_ambas
    FROM whatsapp_inquiries
    WHERE created_at >= NOW() - (${days} || ' days')::interval;
  `);

  const row = overall.rows[0] as Record<string, string>;
  const total = Number(row.peticiones);
  const pct = (n: string) => (total ? `${((Number(n) / total) * 100).toFixed(1)}%` : "—");

  console.log(`=== COBERTURAS · últimos ${days} días ===`);
  console.log(`Peticiones:        ${total}`);
  console.log(`Garantía meteo:    ${row.con_meteo} (${pct(row.con_meteo)})`);
  console.log(`Fianza reducida:   ${row.con_fianza} (${pct(row.con_fianza)})`);
  console.log(`Alguna:            ${row.con_alguna} (${pct(row.con_alguna)})`);
  console.log(`Ambas:             ${row.con_ambas} (${pct(row.con_ambas)})`);
  console.log(
    "\nReferencia de mercado: damage waiver 10-30%, garantía meteo 5-15%.\n" +
      "Por debajo de eso el problema suele ser de claridad, no de precio."
  );

  // Split by device: the mobile and desktop step 5 are two different renders,
  // so a gap between them points at the layout, not at the offer.
  const bySource = await db.execute(sql`
    SELECT source,
           COUNT(*) AS peticiones,
           COUNT(*) FILTER (WHERE extras ? ${WEATHER} OR extras ? ${DEPOSIT}) AS con_alguna
    FROM whatsapp_inquiries
    WHERE created_at >= NOW() - (${days} || ' days')::interval
    GROUP BY source ORDER BY peticiones DESC;
  `);
  console.log("\n=== por dispositivo ===");
  console.table(bySource.rows);

  // Does buying a coverage correlate with actually converting?
  const byStatus = await db.execute(sql`
    SELECT status,
           COUNT(*) AS peticiones,
           COUNT(*) FILTER (WHERE extras ? ${WEATHER} OR extras ? ${DEPOSIT}) AS con_alguna
    FROM whatsapp_inquiries
    WHERE created_at >= NOW() - (${days} || ' days')::interval
    GROUP BY status ORDER BY peticiones DESC;
  `);
  console.log("\n=== por estado de la petición ===");
  console.table(byStatus.rows);

  process.exit(0);
})();
