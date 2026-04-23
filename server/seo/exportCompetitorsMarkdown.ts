// server/seo/exportCompetitorsMarkdown.ts
// Generates competitors-check.md weekly (Mondays) for the marketing team.
// Uses SERP tracking data from the database collected by serp.ts.

import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../db";
import { seoKeywords, seoRankings, seoCompetitorRankings, seoCompetitors } from "../../shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";

// The 5 target keywords to track
const TARGET_KEYWORDS = [
  "alquiler barco blanes",
  "barco sin licencia blanes",
  "alquiler barco costa brava",
  "rent boat blanes",
  "boat rental costa brava",
];

function fmtPos(pos: number | null): string {
  if (pos === null) return "-";
  return pos.toFixed(1);
}

function parsePos(s: string | null | undefined): number | null {
  if (s === null || s === undefined) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export async function exportCompetitorsMarkdown(): Promise<void> {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const ts = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";

    // Last week date for comparison
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekDate = lastWeek.toISOString().split("T")[0];

    // Get keyword IDs for our target keywords
    const kwRows = await db
      .select({ id: seoKeywords.id, keyword: seoKeywords.keyword })
      .from(seoKeywords)
      .where(inArray(seoKeywords.keyword, TARGET_KEYWORDS));

    const kwMap = new Map(kwRows.map((r) => [r.keyword, r.id]));

    // Get active competitors
    const competitors = await db
      .select()
      .from(seoCompetitors)
      .where(eq(seoCompetitors.active, true));

    const compMap = new Map(competitors.map((c) => [c.id, c.name]));

    const lines: string[] = [
      `# Competitors Check — Costa Brava Rent a Boat`,
      ``,
      `**Ultima actualizacion:** ${ts}`,
      `**Periodo comparado:** ${lastWeekDate} vs ${today}`,
      ``,
      `---`,
      ``,
      `## Posiciones por Keyword`,
      ``,
    ];

    for (const keyword of TARGET_KEYWORDS) {
      const kwId = kwMap.get(keyword);
      if (!kwId) {
        lines.push(`### "${keyword}"`, ``, `*Keyword no trackeada en la base de datos.*`, ``);
        continue;
      }

      // Our position today (latest from serp source)
      const ourRankings = await db
        .select({ position: seoRankings.position, date: seoRankings.date, page: seoRankings.page })
        .from(seoRankings)
        .where(and(eq(seoRankings.keywordId, kwId), eq(seoRankings.source, "serp")))
        .orderBy(desc(seoRankings.date))
        .limit(2);

      const currentPos = parsePos(ourRankings[0]?.position);
      const prevPos = parsePos(ourRankings[1]?.position);

      let changeStr = "";
      if (currentPos !== null && prevPos !== null) {
        const diff = prevPos - currentPos;
        if (diff > 0.5) changeStr = ` (subimos ${diff.toFixed(1)} posiciones)`;
        else if (diff < -0.5) changeStr = ` (bajamos ${Math.abs(diff).toFixed(1)} posiciones)`;
        else changeStr = " (estable)";
      }

      lines.push(
        `### "${keyword}"`,
        ``,
        `**Nuestra posicion:** ${fmtPos(currentPos)}${changeStr}`,
        ``,
      );

      // Competitor rankings for this keyword (latest date)
      const compRankings = await db
        .select({
          competitorId: seoCompetitorRankings.competitorId,
          position: seoCompetitorRankings.position,
          url: seoCompetitorRankings.url,
        })
        .from(seoCompetitorRankings)
        .where(eq(seoCompetitorRankings.keywordId, kwId))
        .orderBy(desc(seoCompetitorRankings.date))
        .limit(competitors.length);

      // Deduplicate by competitor (keep latest)
      const seen = new Set<string>();
      const latestCompRankings = compRankings.filter((r) => {
        if (seen.has(r.competitorId)) return false;
        seen.add(r.competitorId);
        return true;
      });

      // Sort by position
      const aboveUs = latestCompRankings
        .filter((r) => currentPos === null || (parsePos(r.position) ?? Infinity) < currentPos)
        .sort((a, b) => (parsePos(a.position) ?? 0) - (parsePos(b.position) ?? 0));

      if (aboveUs.length > 0) {
        lines.push(
          `| Posicion | Competidor | URL |`,
          `|----------|------------|-----|`,
        );
        for (const r of aboveUs) {
          const name = compMap.get(r.competitorId) || r.competitorId;
          const shortUrl = r.url ? new URL(r.url).pathname : "-";
          lines.push(`| ${fmtPos(parsePos(r.position))} | ${name} | ${shortUrl} |`);
        }
      } else {
        lines.push(`*Ningun competidor trackeado por encima de nosotros.*`);
      }

      lines.push(``);
    }

    lines.push(
      `---`,
      ``,
      `## Competidores Monitorizados`,
      ``,
      `| Nombre | Dominio |`,
      `|--------|---------|`,
    );

    for (const comp of competitors) {
      lines.push(`| ${comp.name} | ${comp.domain} |`);
    }

    lines.push(
      ``,
      `---`,
      ``,
      `*Generado automaticamente cada lunes. Datos de SERP tracking (ValueSERP + GSC).*`,
      `*Si falta alguna keyword, puede ser que no tenga datos de SERP (requiere VALUESERP_API_KEY).*`,
      ``,
    );

    // Read previous file for comparison header
    const outPath = path.resolve(process.cwd(), "competitors-check.md");
    await writeFile(outPath, lines.join("\n"), "utf-8");
    logger.info(`[Competitors-Export] Written competitors-check.md`);
  } catch (error) {
    logger.error("[Competitors-Export] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
