// server/seo/strategist/briefing.ts
import { db } from "../../db";
import {
  seoKeywords, seoRankings, seoCompetitors, seoCompetitorRankings,
  seoSerpFeatures, seoCampaigns, seoExperiments, seoLearnings,
  seoConversions, seoPages, seoGeo, seoAlerts, bookings,
} from "../../../shared/schema";
import { eq, desc, gte, and, sql, count, sum, lt, inArray } from "drizzle-orm";
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

  // Core Web Vitals
  coreWebVitals: Array<{
    page: string;
    metrics: Record<string, { p75: number; rating: string; samples: number }>;
  }>;

  // Content health
  cannibalizationConflicts: Array<{
    keyword: string;
    pages: Array<{ page: string; position: number; clicks: number }>;
  }>;
  orphanPages: string[];
  staleContent: Array<{ slug: string; title: string; daysSinceUpdate: number }>;
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

  // Keywords losing position week-over-week
  const losingRaw: Array<{ keyword: string; positionChange: number; currentPosition: number }> = [];
  for (const row of topKeywordsRaw) {
    const keywordId = row.id;
    const latestEntry = keywordMap.get(row.keyword);
    if (!latestEntry || !latestEntry.position) continue;

    const weekAgoRankings = await db
      .select({ position: seoRankings.position })
      .from(seoRankings)
      .where(
        and(
          eq(seoRankings.keywordId, keywordId),
          eq(seoRankings.date, dateStr(sevenDaysAgo)),
        )
      )
      .limit(1);

    if (weekAgoRankings.length > 0 && weekAgoRankings[0].position) {
      const currentPos = Number(latestEntry.position);
      const oldPos = Number(weekAgoRankings[0].position);
      const change = currentPos - oldPos; // positive = worsened
      if (change > 2) {
        losingRaw.push({
          keyword: row.keyword,
          positionChange: change,
          currentPosition: currentPos,
        });
      }
    }
  }
  // Deduplicate by keyword
  const losingMap = new Map<string, typeof losingRaw[0]>();
  for (const l of losingRaw) {
    if (!losingMap.has(l.keyword)) losingMap.set(l.keyword, l);
  }
  const losing = Array.from(losingMap.values());

  // Competitor comparison: keywords they beat us
  const competitorKeywordIds = Array.from(keywordMap.values()).map(k => k.id);
  const competitorComparison = await Promise.all(
    competitors.map(async (c) => {
      const keywordsTheyBeatUs: Array<{ keyword: string; theirPosition: number; ourPosition: number }> = [];

      if (competitorKeywordIds.length > 0) {
        const compRankings = await db
          .select({
            keywordId: seoCompetitorRankings.keywordId,
            position: seoCompetitorRankings.position,
          })
          .from(seoCompetitorRankings)
          .where(
            and(
              eq(seoCompetitorRankings.competitorId, c.id),
              gte(seoCompetitorRankings.date, dateStr(sevenDaysAgo)),
              inArray(seoCompetitorRankings.keywordId, competitorKeywordIds),
            )
          );

        // Group by keyword, get latest (we already have recent data)
        const compMap = new Map<number, number>();
        for (const cr of compRankings) {
          if (cr.position) {
            const pos = Number(cr.position);
            const existing = compMap.get(cr.keywordId);
            if (!existing || pos < existing) compMap.set(cr.keywordId, pos);
          }
        }

        for (const [kwId, theirPos] of Array.from(compMap.entries())) {
          const ourEntry = topKeywordsRaw.find(k => k.id === kwId);
          if (ourEntry && ourEntry.position) {
            const ourPos = Number(ourEntry.position);
            if (theirPos < ourPos) {
              keywordsTheyBeatUs.push({
                keyword: ourEntry.keyword,
                theirPosition: theirPos,
                ourPosition: ourPos,
              });
            }
          }
        }
      }

      return {
        competitor: c.name || "",
        type: c.type || "",
        keywordsTheyBeatUs,
      };
    })
  );

  // SERP feature opportunities
  const serpRaw = await db
    .select({
      keyword: seoKeywords.keyword,
      features: seoSerpFeatures.features,
      ownsFaq: seoSerpFeatures.ownsFaq,
      ownsLocalPack: seoSerpFeatures.ownsLocalPack,
      ownsImages: seoSerpFeatures.ownsImages,
      ownsAiOverview: seoSerpFeatures.ownsAiOverview,
    })
    .from(seoSerpFeatures)
    .innerJoin(seoKeywords, eq(seoSerpFeatures.keywordId, seoKeywords.id))
    .where(gte(seoSerpFeatures.date, dateStr(sevenDaysAgo)))
    .orderBy(desc(seoSerpFeatures.date));

  const serpFeatureOpportunities = serpRaw.map(row => {
    const featuresObj = (row.features || {}) as Record<string, boolean>;
    const ownershipMap: Record<string, boolean> = {
      faq: row.ownsFaq,
      localPack: row.ownsLocalPack,
      images: row.ownsImages,
      aiOverview: row.ownsAiOverview,
    };
    const weOwn: string[] = [];
    const weMiss: string[] = [];
    for (const [feature, exists] of Object.entries(featuresObj)) {
      if (exists) {
        if (ownershipMap[feature]) {
          weOwn.push(feature);
        } else {
          weMiss.push(feature);
        }
      }
    }
    return {
      keyword: row.keyword,
      features: featuresObj,
      weOwn,
      weMiss,
    };
  });

  // Top revenue keywords
  const topRevenueKeywordsRaw = await db
    .select({
      keyword: seoKeywords.keyword,
      revenue: sum(seoConversions.revenue).as("total_revenue"),
      bookings: count(seoConversions.bookingId).as("total_bookings"),
    })
    .from(seoConversions)
    .innerJoin(seoKeywords, eq(seoConversions.keywordId, seoKeywords.id))
    .groupBy(seoKeywords.keyword)
    .orderBy(desc(sql`total_revenue`))
    .limit(20);

  const topRevenueKeywords = topRevenueKeywordsRaw.map(r => ({
    keyword: r.keyword,
    revenue: Number(r.revenue || 0),
    bookings: Number(r.bookings || 0),
  }));

  // Core Web Vitals summary
  let coreWebVitals: SeoBriefing["coreWebVitals"] = [];
  try {
    const { getCwvSummary } = await import("../collectors/cwv");
    coreWebVitals = await getCwvSummary();
  } catch {
    // CWV table may not exist yet
  }

  // Cannibalization detection
  let cannibalizationConflicts: SeoBriefing["cannibalizationConflicts"] = [];
  try {
    const { detectCannibalization } = await import("../analyzers/cannibalization");
    cannibalizationConflicts = await detectCannibalization();
  } catch { /* table may not exist */ }

  // Orphan pages
  let orphanPages: string[] = [];
  try {
    const { detectOrphanPages } = await import("../analyzers/orphans");
    orphanPages = await detectOrphanPages();
  } catch { /* ignore */ }

  // Stale content
  let staleContent: SeoBriefing["staleContent"] = [];
  try {
    const { detectStaleContent } = await import("../executors/freshness");
    const stale = await detectStaleContent();
    staleContent = stale.map(s => ({
      slug: s.slug,
      title: s.title,
      daysSinceUpdate: s.daysSinceUpdate,
    }));
  } catch { /* ignore */ }

  return {
    timestamp: now.toISOString(),
    seasonMode: SEO_CONFIG.getSeasonMode(),
    maxActionsThisWeek: SEO_CONFIG.getMaxActionsPerWeek(),

    topKeywords,
    almostThere,
    doorway,
    losing,

    competitorComparison,

    serpFeatureOpportunities,

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

    topRevenueKeywords,

    pagesWithIssues: pagesRaw.map(p => ({
      path: p.path,
      issues: [`status: ${p.status}`, `loadTime: ${p.loadTimeMs}ms`],
    })),

    geoStatus: geoRaw.map(g => ({
      query: g.query,
      engine: g.engine,
      cited: g.cited,
    })),

    coreWebVitals,

    cannibalizationConflicts,
    orphanPages,
    staleContent,
  };
}
