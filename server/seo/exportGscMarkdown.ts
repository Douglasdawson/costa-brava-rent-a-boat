// server/seo/exportGscMarkdown.ts
// Generates GSC-export.md in project root after each GSC sync.
// Used by the marketing team (Cowork) to orient content strategy.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "../lib/logger";
import { isConfigured, fetchGSCOverview, fetchGSCKeywords, fetchGSCPages } from "../services/googleAnalyticsService";

interface KeywordRow {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function fmtCtr(ctr: number): string {
  return (ctr * 100).toFixed(2) + "%";
}

function fmtPos(pos: number): string {
  return pos.toFixed(1);
}

function fmtNum(n: number): string {
  return n.toLocaleString("es-ES");
}

export async function exportGscMarkdown(): Promise<void> {
  if (!isConfigured()) {
    logger.warn("[GSC-Export] Google API not configured, skipping markdown export");
    return;
  }

  try {
    // 28-day window (GSC has ~3 day data delay)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 28);

    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const start = fmt(startDate);
    const end = fmt(endDate);

    // Fetch all data in parallel
    const [overview, keywordsRaw, pagesRaw] = await Promise.all([
      fetchGSCOverview(start, end),
      fetchGSCKeywords(start, end, 100),  // fetch 100, we'll slice later
      fetchGSCPages(start, end, 50),
    ]);

    // Sort keywords by impressions descending, take top 30
    const keywords: KeywordRow[] = [...keywordsRaw]
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 30);

    // Sort pages by clicks descending, take top 20
    const pages: PageRow[] = [...pagesRaw]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20);

    // Opportunity keywords: position 5-20 with 50+ impressions
    const opportunities: KeywordRow[] = [...keywordsRaw]
      .filter((k) => k.position >= 5 && k.position <= 20 && k.impressions >= 50)
      .sort((a, b) => a.position - b.position);

    const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    const { totals } = overview;

    // Build markdown
    const lines: string[] = [
      `# GSC Export — Costa Brava Rent a Boat`,
      ``,
      `**Ultima actualizacion:** ${now}`,
      `**Periodo:** ${start} a ${end} (28 dias)`,
      ``,
      `---`,
      ``,
      `## Resumen General`,
      ``,
      `| Metrica | Valor |`,
      `|---------|-------|`,
      `| Total clics | ${fmtNum(Math.round(totals.clicks))} |`,
      `| Total impresiones | ${fmtNum(Math.round(totals.impressions))} |`,
      `| CTR medio | ${fmtCtr(totals.ctr)} |`,
      `| Posicion media | ${fmtPos(totals.position)} |`,
      ``,
      `---`,
      ``,
      `## Top 30 Keywords (por impresiones)`,
      ``,
      `| # | Keyword | Clics | Impresiones | CTR | Posicion |`,
      `|---|---------|-------|-------------|-----|----------|`,
    ];

    keywords.forEach((k, i) => {
      lines.push(
        `| ${i + 1} | ${k.keyword} | ${fmtNum(k.clicks)} | ${fmtNum(k.impressions)} | ${fmtCtr(k.ctr)} | ${fmtPos(k.position)} |`
      );
    });

    lines.push(
      ``,
      `---`,
      ``,
      `## Top 20 Paginas (por clics)`,
      ``,
      `| # | URL | Clics | Impresiones | CTR | Posicion |`,
      `|---|-----|-------|-------------|-----|----------|`,
    );

    pages.forEach((p, i) => {
      // Shorten URL: remove domain, keep path
      const shortUrl = p.page.replace(/^https?:\/\/[^/]+/, "") || "/";
      lines.push(
        `| ${i + 1} | ${shortUrl} | ${fmtNum(p.clicks)} | ${fmtNum(p.impressions)} | ${fmtCtr(p.ctr)} | ${fmtPos(p.position)} |`
      );
    });

    lines.push(
      ``,
      `---`,
      ``,
      `## Keywords con Oportunidad (posicion 5-20, 50+ impresiones)`,
      ``,
      `Estas keywords estan cerca de la primera pagina o en posiciones bajas de la primera pagina. Con contenido optimizado o backlinks, pueden subir significativamente.`,
      ``,
    );

    if (opportunities.length === 0) {
      lines.push(`*No se encontraron keywords que cumplan los criterios en este periodo.*`);
    } else {
      lines.push(
        `| # | Keyword | Posicion | Impresiones | Clics | CTR | Accion sugerida |`,
        `|---|---------|----------|-------------|-------|-----|-----------------|`,
      );
      opportunities.forEach((k, i) => {
        const action =
          k.position <= 10
            ? "Optimizar meta title/description para mejorar CTR"
            : "Crear/mejorar contenido dedicado para subir a top 10";
        lines.push(
          `| ${i + 1} | ${k.keyword} | ${fmtPos(k.position)} | ${fmtNum(k.impressions)} | ${fmtNum(k.clicks)} | ${fmtCtr(k.ctr)} | ${action} |`
        );
      });
    }

    lines.push(
      ``,
      `---`,
      ``,
      `*Generado automaticamente por el SEO Engine de Costa Brava Rent a Boat.*`,
      `*Datos de Google Search Console. Proximo sync: cada 6 horas.*`,
      ``
    );

    const markdown = lines.join("\n");
    const outPath = path.resolve(process.cwd(), "GSC-export.md");
    await writeFile(outPath, markdown, "utf-8");

    logger.info(`[GSC-Export] Written ${keywords.length} keywords, ${pages.length} pages, ${opportunities.length} opportunities to GSC-export.md`);
  } catch (error) {
    logger.error("[GSC-Export] Failed to generate markdown", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
