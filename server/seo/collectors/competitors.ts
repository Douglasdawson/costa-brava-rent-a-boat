// server/seo/collectors/competitors.ts
import { db } from "../../db";
import { seoCompetitors } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

interface CompetitorSnapshot {
  domain: string;
  title: string;
  description: string;
  wordCount: number;
  hasSchemaOrg: boolean;
  schemaTypes: string[];
  h1: string;
  h2s: string[];
}

async function crawlCompetitorPage(url: string): Promise<CompetitorSnapshot | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOEngine/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;
    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const h2Matches = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map(m => m[1]);

    // Strip HTML tags and count words
    const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const wordCount = textContent.split(" ").length;

    const schemaMatches = [...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map(m => m[1]);

    return {
      domain: new URL(url).hostname,
      title: titleMatch?.[1] || "",
      description: descMatch?.[1] || "",
      wordCount,
      hasSchemaOrg: schemaMatches.length > 0,
      schemaTypes: [...new Set(schemaMatches)],
      h1: h1Match?.[1] || "",
      h2s: h2Matches.slice(0, 10),
    };
  } catch (error) {
    logger.warn(`[SEO:Competitors] Failed to crawl ${url}: ${error}`);
    return null;
  }
}

export async function checkCompetitors(): Promise<void> {
  const competitors = await db
    .select()
    .from(seoCompetitors)
    .where(eq(seoCompetitors.active, true));

  logger.info(`[SEO:Competitors] Checking ${competitors.length} competitors`);

  for (const comp of competitors) {
    const snapshot = await crawlCompetitorPage(`https://${comp.domain}`);
    if (snapshot) {
      logger.info(`[SEO:Competitors] ${comp.name}: ${snapshot.wordCount} words, schemas: ${snapshot.schemaTypes.join(",")}`);
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  logger.info("[SEO:Competitors] Check complete");
}
