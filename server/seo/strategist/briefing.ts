// server/seo/strategist/briefing.ts
import { db } from "../../db";
import {
  seoKeywords, seoRankings, seoCompetitors, seoCompetitorRankings,
  seoSerpFeatures, seoCampaigns, seoExperiments, seoLearnings,
  seoConversions, seoPages, seoGeo, seoAlerts, bookings,
} from "../../../shared/schema";
import { eq, desc, gte, and, sql, count } from "drizzle-orm";
import { SEO_CONFIG } from "../config";

export interface SeoBriefing {
  timestamp: string;
  seasonMode: string;
  maxActionsThisWeek: number;

  // Keyword landscape
  topKeywords: Array<{
    keyword: string;
    position: number;
    clicks: number;
    impressions: number;
    ctr: number;
    page: string;
    trend: string; // "up", "down", "stable"
    cluster: string | null;
    intent: string | null;
  }>;

  // Opportunities
  almostThere: Array<{ keyword: string; position: number; impressions: number; page: string }>;
  doorway: Array<{ keyword: string; position: number; impressions: number }>;
  losing: Array<{ keyword: string; positionChange: number; currentPosition: number }>;

  // Competitors
  competitorComparison: Array<{
    competitor: string;
    type: string;
    keywordsTheyBeatUs: Array<{ keyword: string; theirPosition: number; ourPosition: number }>;
  }>;

  // SERP features
  serpFeatureOpportunities: Array<{
    keyword: string;
    features: Record<string, boolean>;
    weOwn: string[];
    weMiss: string[];
  }>;

  // Active campaigns
  campaigns: Array<{
    name: string;
    objective: string;
    status: string;
    progress: unknown;
  }>;

  // Experiments
  runningExperiments: Array<{
    id: number;
    type: string;
    page: string;
    hypothesis: string;
    status: string;
    executedAt: string;
  }>;

  recentResults: Array<{
    type: string;
    page: string;
    hypothesis: string;
    result: string;
    learning: string | null;
  }>;

  // Learnings
  learnings: Array<{
    category: string;
    insight: string;
    confidence: number;
  }>;

  // Revenue data
  topRevenueKeywords: Array<{
    keyword: string;
    revenue: number;
    bookings: number;
  }>;

  // Technical health
  pagesWithIssues: Array<{
    path: string;
    issues: string[];
  }>;

  // GEO status
  geoStatus: Array<{
    query: string;
    engine: string;
    cited: boolean;
  }>;
}

export async function buildBriefing(): Promise<SeoBriefing> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dateStr = (d: Date) => d.toISOString().split("T")[0];

  // Fetch top keywords with latest rankings
  const topKeywordsRaw = await db
    .select({
      id: seoKeywords.id,
      keyword: seoKeywords.keyword,
      cluster: seoKeywords.cluster,
      intent: seoKeywords.intent,
      position: seoRankings.position,
      clicks: seoRankings.clicks,
      impressions: seoRankings.impressions,
      ctr: seoRankings.ctr,
      page: seoRankings.page,
      date: seoRankings.date,
    })
    .from(seoKeywords)
    .innerJoin(seoRankings, eq(seoKeywords.id, seoRankings.keywordId))
    .where(gte(seoRankings.date, dateStr(sevenDaysAgo)))
    .orderBy(desc(seoRankings.impressions))
    .limit(100);

  // Group by keyword, get latest
  const keywordMap = new Map<string, typeof topKeywordsRaw[0]>();
  for (const row of topKeywordsRaw) {
    const existing = keywordMap.get(row.keyword);
    if (!existing || row.date > existing.date) {
      keywordMap.set(row.keyword, row);
    }
  }

  const topKeywords = Array.from(keywordMap.values()).map(row => ({
    keyword: row.keyword,
    position: Number(row.position || 0),
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: Number(row.ctr || 0),
    page: row.page || "",
    trend: "stable" as string,
    cluster: row.cluster,
    intent: row.intent,
  }));

  // Classify opportunities
  const almostThere = topKeywords.filter(k => k.position >= 4 && k.position <= 10 && k.impressions > 50);
  const doorway = topKeywords.filter(k => k.position >= 11 && k.position <= 20 && k.impressions > 100);

  // Active campaigns
  const campaigns = await db
    .select()
    .from(seoCampaigns)
    .where(eq(seoCampaigns.status, "active"));

  // Running experiments
  const runningExperiments = await db
    .select()
    .from(seoExperiments)
    .where(eq(seoExperiments.status, "running"))
    .orderBy(desc(seoExperiments.executedAt))
    .limit(10);

  // Recent completed experiments
  const recentResults = await db
    .select()
    .from(seoExperiments)
    .where(
      and(
        eq(seoExperiments.status, "success"),
        gte(seoExperiments.executedAt, thirtyDaysAgo),
      )
    )
    .orderBy(desc(seoExperiments.executedAt))
    .limit(10);

  // Learnings
  const learnings = await db
    .select()
    .from(seoLearnings)
    .orderBy(desc(seoLearnings.confidence))
    .limit(20);

  // Competitor data
  const competitors = await db
    .select()
    .from(seoCompetitors)
    .where(eq(seoCompetitors.active, true));

  // Pages with issues
  const pagesRaw = await db
    .select()
    .from(seoPages)
    .where(sql`${seoPages.status} >= 400 OR ${seoPages.loadTimeMs} > 3000`);

  // GEO status (latest per query+engine)
  const geoRaw = await db
    .select()
    .from(seoGeo)
    .orderBy(desc(seoGeo.date))
    .limit(20);

  return {
    timestamp: now.toISOString(),
    seasonMode: SEO_CONFIG.getSeasonMode(),
    maxActionsThisWeek: SEO_CONFIG.getMaxActionsPerWeek(),

    topKeywords,
    almostThere,
    doorway,
    losing: [], // TODO: calculate from ranking trend

    competitorComparison: competitors.map(c => ({
      competitor: c.name || "",
      type: c.type || "",
      keywordsTheyBeatUs: [],
    })),

    serpFeatureOpportunities: [],

    campaigns: campaigns.map(c => ({
      name: c.name,
      objective: c.objective || "",
      status: c.status || "",
      progress: c.progress,
    })),

    runningExperiments: runningExperiments.map(e => ({
      id: e.id,
      type: e.type || "",
      page: e.page || "",
      hypothesis: e.hypothesis || "",
      status: e.status || "",
      executedAt: e.executedAt ? e.executedAt.toISOString() : "",
    })),

    recentResults: recentResults.map(e => ({
      type: e.type || "",
      page: e.page || "",
      hypothesis: e.hypothesis || "",
      result: e.status || "",
      learning: e.learning,
    })),

    learnings: learnings.map(l => ({
      category: l.category || "",
      insight: l.insight,
      confidence: Number(l.confidence || 0),
    })),

    topRevenueKeywords: [],

    pagesWithIssues: pagesRaw.map(p => ({
      path: p.path,
      issues: [`status: ${p.status}`, `loadTime: ${p.loadTimeMs}ms`],
    })),

    geoStatus: geoRaw.map(g => ({
      query: g.query,
      engine: g.engine,
      cited: g.cited,
    })),
  };
}
