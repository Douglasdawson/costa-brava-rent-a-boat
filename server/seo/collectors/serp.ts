// server/seo/collectors/serp.ts
import { db } from "../../db";
import { seoKeywords, seoRankings, seoSerpFeatures, seoCompetitorRankings, seoCompetitors } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";

interface ValueSerpResult {
  search_parameters: { q: string };
  organic_results: Array<{
    position: number;
    link: string;
    domain: string;
    title: string;
    snippet: string;
  }>;
  related_questions?: Array<{ question: string }>;
  knowledge_graph?: Record<string, unknown>;
  local_results?: Array<Record<string, unknown>>;
  inline_images?: Array<Record<string, unknown>>;
  ai_overview?: Record<string, unknown>;
}

async function queryValueSerp(keyword: string, location: string = "Girona,Catalonia,Spain"): Promise<ValueSerpResult | null> {
  const apiKey = SEO_CONFIG.valueSerpApiKey;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    api_key: apiKey,
    q: keyword,
    location,
    gl: "es",
    hl: "es",
    num: "20",
    include_ai_overview: "true",
  });

  try {
    const response = await fetch(`https://api.valueserp.com/search?${params}`);
    if (!response.ok) {
      logger.error(`[SEO:SERP] ValueSERP API error: ${response.status}`);
      return null;
    }
    return await response.json() as ValueSerpResult;
  } catch (error) {
    logger.error("[SEO:SERP] ValueSERP request failed", { error: String(error) });
    return null;
  }
}

export async function trackSerps(): Promise<void> {
  // Get tracked keywords, prioritized by impressions
  const keywords = await db
    .select({
      id: seoKeywords.id,
      keyword: seoKeywords.keyword,
    })
    .from(seoKeywords)
    .where(eq(seoKeywords.tracked, true))
    .limit(SEO_CONFIG.maxSerpQueriesPerDay);

  const competitors = await db
    .select()
    .from(seoCompetitors)
    .where(eq(seoCompetitors.active, true));

  const today = new Date().toISOString().split("T")[0];

  logger.info(`[SEO:SERP] Tracking ${keywords.length} keywords`);

  let tracked = 0;
  for (const kw of keywords) {
    const result = await queryValueSerp(kw.keyword);
    if (!result) continue;

    const organicResults = result.organic_results || [];

    // Find our position
    const ourResult = organicResults.find(r =>
      r.domain?.includes("costabravarentaboat")
    );

    if (ourResult) {
      await db
        .insert(seoRankings)
        .values({
          keywordId: kw.id,
          date: today,
          position: String(ourResult.position),
          page: new URL(ourResult.link).pathname,
          device: "all",
          source: "serp",
        })
        .onConflictDoUpdate({
          target: [seoRankings.keywordId, seoRankings.date, seoRankings.device, seoRankings.source],
          set: {
            position: String(ourResult.position),
            page: new URL(ourResult.link).pathname,
          },
        });
    }

    // Track competitor positions
    for (const organic of organicResults) {
      const compDomain = competitors.find(c => organic.domain?.includes(c.domain));
      if (compDomain) {
        await db
          .insert(seoCompetitorRankings)
          .values({
            competitorId: compDomain.id,
            keywordId: kw.id,
            date: today,
            position: String(organic.position),
            url: organic.link,
          })
          .onConflictDoUpdate({
            target: [seoCompetitorRankings.competitorId, seoCompetitorRankings.keywordId, seoCompetitorRankings.date],
            set: {
              position: String(organic.position),
              url: organic.link,
            },
          });
      }
    }

    // Track SERP features
    const features = {
      faq: !!result.related_questions?.length,
      localPack: !!result.local_results?.length,
      images: !!result.inline_images?.length,
      knowledgeGraph: !!result.knowledge_graph,
      aiOverview: !!result.ai_overview,
    };

    const ownsLocalPack = result.local_results?.some((lr: Record<string, unknown>) =>
      String(lr.title || "").toLowerCase().includes("costa brava rent")
    ) || false;

    await db
      .insert(seoSerpFeatures)
      .values({
        keywordId: kw.id,
        date: today,
        features,
        ownsFaq: false, // TODO: detect if our FAQ appears
        ownsLocalPack,
        ownsImages: false, // TODO: detect if our images appear
        ownsAiOverview: false,
      })
      .onConflictDoUpdate({
        target: [seoSerpFeatures.keywordId, seoSerpFeatures.date],
        set: { features, ownsLocalPack },
      });

    tracked++;

    // Rate limiting: 1 request per 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  logger.info(`[SEO:SERP] Tracked ${tracked} keywords via ValueSERP`);
}
