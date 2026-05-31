// server/seo/milestones.ts
//
// Computes the live "KPIs vs milestones" scorecard: gathers the current value
// of each tracked metric from the existing analytics tables and scores it
// against the SEO_MILESTONES targets. Each metric query is isolated — a failure
// degrades that metric to 0 (and its milestone shows at_risk) rather than
// breaking the whole scorecard.

import { and, gte, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { seoRankings, aiMentions, ga4DailyMetrics } from "../../shared/schema";
import {
  SEO_MILESTONES,
  scoreMilestone,
  type MilestoneMetric,
  type SeoMilestone,
  type MilestoneScore,
} from "../../shared/seoMilestones";
import { logger } from "../lib/logger";

export interface MilestoneScorecardEntry {
  milestone: SeoMilestone;
  score: MilestoneScore;
}

const dayStr = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

async function metric(label: string, fn: () => Promise<number>): Promise<number> {
  try {
    const v = await fn();
    return Number.isFinite(v) ? v : 0;
  } catch (err) {
    logger.warn(`[SEO:Milestones] metric '${label}' failed → 0`, { error: err instanceof Error ? err.message : String(err) });
    return 0;
  }
}

export async function getMilestoneScorecard(): Promise<MilestoneScorecardEntry[]> {
  const since30 = dayStr(30);
  const since7 = dayStr(7);

  const values: Record<MilestoneMetric, number> = {
    ai_citation_rate: await metric("ai_citation_rate", async () => {
      const [r] = await db
        .select({
          total: sql<number>`count(*)::int`,
          cited: sql<number>`count(*) filter (where ${aiMentions.citedUs})::int`,
        })
        .from(aiMentions)
        .where(and(gte(aiMentions.ranAt, new Date(Date.now() - 30 * 86_400_000)), isNull(aiMentions.errorMessage)));
      return r && r.total > 0 ? (r.cited / r.total) * 100 : 0;
    }),

    top10_keywords: await metric("top10_keywords", async () => {
      const [r] = await db
        .select({ n: sql<number>`count(distinct ${seoRankings.keywordId})::int` })
        .from(seoRankings)
        .where(and(gte(seoRankings.date, since7), sql`${seoRankings.position} <= 10`));
      return r?.n ?? 0;
    }),

    organic_clicks_30d: await metric("organic_clicks_30d", async () => {
      const [r] = await db
        .select({ s: sql<number>`coalesce(sum(${seoRankings.clicks}), 0)::int` })
        .from(seoRankings)
        .where(gte(seoRankings.date, since30));
      return r?.s ?? 0;
    }),

    organic_sessions_30d: await metric("organic_sessions_30d", async () => {
      const [r] = await db
        .select({ s: sql<number>`coalesce(sum(${ga4DailyMetrics.sessions}), 0)::int` })
        .from(ga4DailyMetrics)
        .where(and(gte(ga4DailyMetrics.date, since30), sql`${ga4DailyMetrics.channelGroup} ilike '%organic%'`));
      return r?.s ?? 0;
    }),

    avg_position: await metric("avg_position", async () => {
      const [r] = await db
        .select({ a: sql<number>`coalesce(avg(${seoRankings.position}), 0)::float` })
        .from(seoRankings)
        .where(gte(seoRankings.date, since7));
      return r?.a ?? 0;
    }),
  };

  const now = Date.now();
  return SEO_MILESTONES.map((m) => ({ milestone: m, score: scoreMilestone(m, values[m.metric], now) }));
}
