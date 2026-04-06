// server/seo/exportGa4Markdown.ts
// Generates GA4-export.md every 6 hours for the marketing team.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "../lib/logger";
import {
  isConfigured,
  fetchGA4Overview,
  fetchGA4TrafficSources,
  fetchGA4TopPages,
  fetchGA4Conversions,
} from "../services/googleAnalyticsService";

function fmtNum(n: number): string {
  return n.toLocaleString("es-ES");
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function exportGa4Markdown(): Promise<void> {
  if (!isConfigured()) {
    logger.warn("[GA4-Export] Google API not configured, skipping");
    return;
  }

  try {
    const now = new Date();

    // Date ranges
    const end = fmt(now);
    const start24h = fmt(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const start7d = fmt(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));

    // Fetch all data in parallel
    const [
      overview24h,
      overview7d,
      traffic24h,
      traffic7d,
      topPages7d,
      conversions24h,
      conversions7d,
    ] = await Promise.all([
      fetchGA4Overview(start24h, end),
      fetchGA4Overview(start7d, end),
      fetchGA4TrafficSources(start24h, end),
      fetchGA4TrafficSources(start7d, end),
      fetchGA4TopPages(start7d, end, 10),
      fetchGA4Conversions(start24h, end),
      fetchGA4Conversions(start7d, end),
    ]);

    const ts = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";

    // Helper to find event count
    const evtCount = (evts: Array<{ event: string; count: number }>, name: string) =>
      evts.find((e) => e.event === name)?.count || 0;

    // Conversion rate
    const bookingsStarted7d = evtCount(conversions7d, "booking_started");
    const purchases7d = evtCount(conversions7d, "purchase");
    const convRate = bookingsStarted7d > 0 ? (purchases7d / bookingsStarted7d) : 0;

    const lines: string[] = [
      `# GA4 Export — Costa Brava Rent a Boat`,
      ``,
      `**Ultima actualizacion:** ${ts}`,
      ``,
      `---`,
      ``,
      `## Resumen de Trafico`,
      ``,
      `| Metrica | Ultimas 24h | Ultimos 7 dias |`,
      `|---------|-------------|----------------|`,
      `| Sesiones | ${fmtNum(overview24h.sessions)} | ${fmtNum(overview7d.sessions)} |`,
      `| Usuarios activos | ${fmtNum(overview24h.activeUsers)} | ${fmtNum(overview7d.activeUsers)} |`,
      `| Nuevos usuarios | ${fmtNum(overview24h.newUsers)} | ${fmtNum(overview7d.newUsers)} |`,
      `| Paginas vistas | ${fmtNum(overview24h.pageViews)} | ${fmtNum(overview7d.pageViews)} |`,
      `| Tasa de rebote | ${fmtPct(overview24h.bounceRate)} | ${fmtPct(overview7d.bounceRate)} |`,
      `| Duracion media sesion | ${fmtDuration(overview24h.avgSessionDuration)} | ${fmtDuration(overview7d.avgSessionDuration)} |`,
      ``,
      `---`,
      ``,
      `## Trafico por Fuente (ultimas 24h)`,
      ``,
      `| # | Canal | Sesiones | Usuarios |`,
      `|---|-------|----------|----------|`,
    ];

    traffic24h.forEach((t, i) => {
      lines.push(`| ${i + 1} | ${t.channel} | ${fmtNum(t.sessions)} | ${fmtNum(t.users)} |`);
    });

    lines.push(
      ``,
      `## Trafico por Fuente (ultimos 7 dias)`,
      ``,
      `| # | Canal | Sesiones | Usuarios |`,
      `|---|-------|----------|----------|`,
    );

    traffic7d.forEach((t, i) => {
      lines.push(`| ${i + 1} | ${t.channel} | ${fmtNum(t.sessions)} | ${fmtNum(t.users)} |`);
    });

    lines.push(
      ``,
      `---`,
      ``,
      `## Top 10 Paginas (ultimos 7 dias, por visitas)`,
      ``,
      `| # | Pagina | Visitas | Usuarios | Duracion media |`,
      `|---|--------|---------|----------|----------------|`,
    );

    topPages7d.forEach((p, i) => {
      lines.push(`| ${i + 1} | ${p.page} | ${fmtNum(p.views)} | ${fmtNum(p.users)} | ${fmtDuration(p.avgDuration)} |`);
    });

    lines.push(
      ``,
      `---`,
      ``,
      `## Eventos Clave (ultimas 24h)`,
      ``,
      `| Evento | Cantidad |`,
      `|--------|----------|`,
      `| whatsapp_click | ${fmtNum(evtCount(conversions24h, "whatsapp_click"))} |`,
      `| phone_click | ${fmtNum(evtCount(conversions24h, "phone_click"))} |`,
      `| booking_started | ${fmtNum(evtCount(conversions24h, "booking_started"))} |`,
      `| purchase | ${fmtNum(evtCount(conversions24h, "purchase"))} |`,
      `| generate_lead | ${fmtNum(evtCount(conversions24h, "generate_lead"))} |`,
      ``,
      `## Tasa de Conversion (ultimos 7 dias)`,
      ``,
      `| Metrica | Valor |`,
      `|---------|-------|`,
      `| Reservas iniciadas | ${fmtNum(bookingsStarted7d)} |`,
      `| Compras completadas | ${fmtNum(purchases7d)} |`,
      `| Tasa de conversion | **${fmtPct(convRate)}** |`,
      ``,
      `---`,
      ``,
      `*Generado automaticamente. Datos de Google Analytics 4. Se actualiza cada 6 horas.*`,
      ``,
    );

    const outPath = path.resolve(process.cwd(), "GA4-export.md");
    await writeFile(outPath, lines.join("\n"), "utf-8");
    logger.info(`[GA4-Export] Written GA4-export.md`);
  } catch (error) {
    logger.error("[GA4-Export] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
