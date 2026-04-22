import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { writeFileSync } from "fs";
import { join } from "path";

// Read-only baseline KPIs script for the 90-day plan.
// Captures current state of key metrics before Phase 1 starts,
// so progress vs. baseline can be measured.

interface KpiRow {
  metric: string;
  value: string | number;
  notes: string;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const rows: KpiRow[] = [];

  console.log(`\n=== BASELINE KPIs · Costa Brava Rent a Boat · ${today} ===\n`);

  // 1 · Business stats (GBP rating + review count)
  try {
    const bs = await db.execute(sql`
      SELECT rating, user_rating_count, last_synced_at
      FROM business_stats
      ORDER BY last_synced_at DESC
      LIMIT 1;
    `);
    if (bs.rows.length > 0) {
      const row = bs.rows[0] as { rating: number; user_rating_count: number; last_synced_at: Date };
      rows.push({ metric: "GBP rating", value: Number(row.rating).toFixed(2), notes: `Synced ${row.last_synced_at}` });
      rows.push({ metric: "GBP review count (total histórico)", value: row.user_rating_count, notes: "Baseline para medir +10/mes objetivo" });
    } else {
      rows.push({ metric: "GBP rating", value: "N/A", notes: "business_stats vacía — ejecutar sync-gbp-stats primero" });
    }
  } catch (e) {
    rows.push({ metric: "GBP rating", value: "ERROR", notes: String(e) });
  }

  // 2 · Bookings por idioma (últimos 90 días)
  try {
    const byLang = await db.execute(sql`
      SELECT
        COALESCE(language, 'unknown') AS lang,
        COUNT(*) AS total,
        SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '90 days'
      GROUP BY language
      ORDER BY total DESC;
    `);
    const langTotal = byLang.rows.reduce((acc, r) => acc + Number((r as { total: number }).total), 0);
    rows.push({ metric: "Reservas últimos 90 días (total)", value: langTotal, notes: `Distribuidas por ${byLang.rows.length} idiomas` });

    for (const r of byLang.rows) {
      const row = r as { lang: string; total: number; confirmed: number };
      const pct = langTotal > 0 ? ((Number(row.total) / langTotal) * 100).toFixed(1) : "0.0";
      rows.push({
        metric: `  · ${row.lang.toUpperCase()} (90d)`,
        value: `${row.total} (${pct}%)`,
        notes: `${row.confirmed} confirmadas`,
      });
    }

    const nonCoreTotal = byLang.rows
      .filter((r) => !["es", "en"].includes((r as { lang: string }).lang))
      .reduce((acc, r) => acc + Number((r as { total: number }).total), 0);
    const nonCorePct = langTotal > 0 ? ((nonCoreTotal / langTotal) * 100).toFixed(1) : "0.0";
    rows.push({
      metric: "% reservas no-ES/EN (foso idioma)",
      value: `${nonCorePct}%`,
      notes: "Meta 90d del plan: >25%",
    });
  } catch (e) {
    rows.push({ metric: "Reservas por idioma", value: "ERROR", notes: String(e) });
  }

  // 3 · Ratio solicitud → confirmada (90 días)
  try {
    const funnel = await db.execute(sql`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN booking_status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '90 days'
        AND booking_status NOT IN ('draft', 'hold');
    `);
    const f = funnel.rows[0] as { total: number; confirmed: number; completed: number; cancelled: number };
    const successful = Number(f.confirmed) + Number(f.completed);
    const ratio = Number(f.total) > 0 ? ((successful / Number(f.total)) * 100).toFixed(1) : "0.0";
    rows.push({
      metric: "Ratio solicitud → confirmada/completada",
      value: `${ratio}%`,
      notes: `${successful} de ${f.total} · Meta: ≥80%`,
    });
  } catch (e) {
    rows.push({ metric: "Ratio solicitud → confirmada", value: "ERROR", notes: String(e) });
  }

  // 4 · Ticket medio (últimos 90 días, confirmadas/completadas)
  try {
    const avg = await db.execute(sql`
      SELECT AVG(total_amount::numeric) AS avg_ticket,
             COUNT(*) AS total
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '90 days'
        AND booking_status IN ('confirmed', 'completed');
    `);
    const a = avg.rows[0] as { avg_ticket: number | null; total: number };
    rows.push({
      metric: "Ticket medio (confirmadas 90d)",
      value: a.avg_ticket ? `${Number(a.avg_ticket).toFixed(2)} €` : "N/A",
      notes: `Sobre ${a.total} reservas · Meta excursión privada: >500€`,
    });
  } catch (e) {
    rows.push({ metric: "Ticket medio", value: "ERROR", notes: String(e) });
  }

  // 5 · Campaña reseñas (baseline tasa de envío)
  try {
    const reviews = await db.execute(sql`
      SELECT
        COUNT(*) AS total_completed,
        SUM(CASE WHEN review_request_sent THEN 1 ELSE 0 END) AS review_sent
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '90 days'
        AND booking_status = 'completed';
    `);
    const r = reviews.rows[0] as { total_completed: number; review_sent: number };
    const pct = Number(r.total_completed) > 0
      ? ((Number(r.review_sent) / Number(r.total_completed)) * 100).toFixed(1)
      : "0.0";
    rows.push({
      metric: "% reservas completadas con review_request enviado",
      value: `${pct}%`,
      notes: `${r.review_sent} de ${r.total_completed} · Meta Fase 1: 100%`,
    });
  } catch (e) {
    rows.push({ metric: "% review_request enviado", value: "ERROR", notes: String(e) });
  }

  // Print table to console
  console.log("Metric".padEnd(55) + "Value".padEnd(25) + "Notes");
  console.log("-".repeat(140));
  for (const row of rows) {
    console.log(
      String(row.metric).padEnd(55) + String(row.value).padEnd(25) + String(row.notes),
    );
  }

  // Write markdown report
  const mdPath = join(process.cwd(), "docs", "sales", `baseline-kpis-${today}.md`);
  const md = [
    `# Baseline KPIs · ${today}`,
    "",
    "Snapshot de métricas antes de arrancar Fase 1 del Plan 90 días.",
    "Usar como referencia para medir progreso vs. metas del plan.",
    "",
    "| Métrica | Valor | Notas |",
    "|---------|-------|-------|",
    ...rows.map((r) => `| ${r.metric} | ${r.value} | ${r.notes} |`),
    "",
    "---",
    "",
    "**Ejecuta de nuevo** al inicio de cada mes con: `tsx scripts/baseline-kpis.ts`",
    "",
    "Las metas del plan 90d están en `plan-90-dias-2026-04-22.html` pestaña **KPIs y Tracking**.",
  ].join("\n");

  writeFileSync(mdPath, md, "utf-8");
  console.log(`\n✓ Reporte guardado: ${mdPath}`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
