// server/seo/collectors/geo.ts
import { db } from "../../db";
import { seoGeo } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";

const GEO_QUERIES = [
  "dónde alquilar un barco en la Costa Brava",
  "alquiler barco sin licencia Blanes",
  "boat rental Costa Brava",
  "alquilar barco Lloret de Mar",
  "rent a boat Blanes Spain",
  "excursión en barco Costa Brava precios",
  "best boat rental Costa Brava",
  "alquiler embarcación Blanes precio",
];

async function queryPerplexity(query: string): Promise<{
  cited: boolean;
  mentionedWithoutLink: boolean;
  citedUrl: string | null;
  position: number | null;
  competitorsCited: Array<{ domain: string; position: number }>;
  analysis: string;
} | null> {
  const apiKey = SEO_CONFIG.perplexityApiKey;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: query }],
        return_citations: true,
      }),
    });

    if (!response.ok) {
      logger.warn(`[SEO:GEO] Perplexity API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      citations?: string[];
    };

    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    const ourDomain = "costabravarentaboat";
    const cited = citations.some((c: string) => c.includes(ourDomain));
    const mentionedWithoutLink = !cited && content.toLowerCase().includes("costa brava rent");
    const citedUrl = citations.find((c: string) => c.includes(ourDomain)) || null;
    const position = citedUrl ? citations.indexOf(citedUrl) + 1 : null;

    // Check which competitors are cited
    const competitorsCited: Array<{ domain: string; position: number }> = [];
    for (const comp of SEO_CONFIG.competitors) {
      const compCitation = citations.find((c: string) => c.includes(comp.domain));
      if (compCitation) {
        competitorsCited.push({ domain: comp.domain, position: citations.indexOf(compCitation) + 1 });
      }
    }

    return {
      cited,
      mentionedWithoutLink,
      citedUrl,
      position,
      competitorsCited,
      analysis: `Query: "${query}". ${cited ? `Cited at position ${position}` : "Not cited"}. ${competitorsCited.length} competitors cited.`,
    };
  } catch (error) {
    logger.error("[SEO:GEO] Perplexity query failed", { error: String(error) });
    return null;
  }
}

export async function monitorGeo(): Promise<void> {
  logger.info(`[SEO:GEO] Monitoring ${GEO_QUERIES.length} queries across AI engines`);

  const today = new Date().toISOString().split("T")[0];

  for (const query of GEO_QUERIES) {
    const result = await queryPerplexity(query);
    if (!result) continue;

    await db
      .insert(seoGeo)
      .values({
        query,
        engine: "perplexity",
        date: today,
        cited: result.cited,
        mentionedWithoutLink: result.mentionedWithoutLink,
        citedUrl: result.citedUrl,
        position: result.position,
        competitorsCited: result.competitorsCited,
        analysis: result.analysis,
      })
      .onConflictDoUpdate({
        target: [seoGeo.query, seoGeo.engine, seoGeo.date],
        set: {
          cited: result.cited,
          mentionedWithoutLink: result.mentionedWithoutLink,
          citedUrl: result.citedUrl,
          position: result.position,
          competitorsCited: result.competitorsCited,
          analysis: result.analysis,
        },
      });

    logger.info(`[SEO:GEO] "${query}" on Perplexity: ${result.cited ? "CITED" : "not cited"}`);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  logger.info("[SEO:GEO] Monitoring complete");
}
