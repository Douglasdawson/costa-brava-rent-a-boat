/**
 * AI Mentions storage queries.
 *
 * Powers the CRM dashboard at /crm/seo → "AI Mentions".  All queries hit the
 * `ai_mentions` table and apply a configurable time window (days). Filters by
 * engine and language are optional.
 */

import { db, sql, gte, desc, and, eq, aiMentions, type AiMention } from "./base";

export type { AiMention };

export interface CitationRateRow {
  engine: string;
  totalProbes: number;
  citations: number;
  citationRate: number; // 0..1
}

/**
 * Citation rate per engine over the last N days (default 30).
 * Citation rate = sum(cited_us::int) / count(*) where the engine returned
 * a non-null response (engine errors excluded so we measure real misses,
 * not infrastructure issues).
 */
export async function getCitationRateByEngine(days = 30): Promise<CitationRateRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      engine: aiMentions.engine,
      totalProbes: sql<number>`count(*) filter (where ${aiMentions.errorMessage} is null)::int`.as("totalProbes"),
      citations: sql<number>`count(*) filter (where ${aiMentions.citedUs} = true)::int`.as("citations"),
    })
    .from(aiMentions)
    .where(gte(aiMentions.ranAt, since))
    .groupBy(aiMentions.engine);
  return rows.map((r) => ({
    engine: r.engine,
    totalProbes: r.totalProbes,
    citations: r.citations,
    citationRate: r.totalProbes > 0 ? r.citations / r.totalProbes : 0,
  }));
}

export interface PromptStats {
  prompt: string;
  promptCategory: string | null;
  promptLang: string;
  totalProbes: number;
  citations: number;
  citationRate: number;
}

/** Per-prompt citation rate — surface the prompts we own vs the ones we don't. */
export async function getPromptStats(days = 30, limit = 100): Promise<PromptStats[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      prompt: aiMentions.prompt,
      promptCategory: aiMentions.promptCategory,
      promptLang: aiMentions.promptLang,
      totalProbes: sql<number>`count(*) filter (where ${aiMentions.errorMessage} is null)::int`.as("totalProbes"),
      citations: sql<number>`count(*) filter (where ${aiMentions.citedUs} = true)::int`.as("citations"),
    })
    .from(aiMentions)
    .where(gte(aiMentions.ranAt, since))
    .groupBy(aiMentions.prompt, aiMentions.promptCategory, aiMentions.promptLang)
    .limit(limit);
  return rows.map((r) => ({
    prompt: r.prompt,
    promptCategory: r.promptCategory,
    promptLang: r.promptLang,
    totalProbes: r.totalProbes,
    citations: r.citations,
    citationRate: r.totalProbes > 0 ? r.citations / r.totalProbes : 0,
  }));
}

export interface CompetitorCount {
  competitor: string;
  mentions: number;
}

/**
 * Aggregate competitor mentions across all probes. Counts every appearance in
 * any response — useful to spot "Rent a Boat Blanes" stealing share of voice
 * even when we are also cited.
 */
export async function getCompetitorMentions(days = 30): Promise<CompetitorCount[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // Postgres unnest of the text[] column for grouping. Drizzle doesn't have
  // first-class array unnest so we go raw.
  const rows = await db.execute(sql`
    SELECT competitor, COUNT(*)::int AS mentions
    FROM (
      SELECT unnest(competitors_mentioned) AS competitor
      FROM ai_mentions
      WHERE ran_at >= ${since}
        AND competitors_mentioned IS NOT NULL
    ) t
    GROUP BY competitor
    ORDER BY mentions DESC
  `);
  return (rows.rows as Array<{ competitor: string; mentions: number }>).map((r) => ({
    competitor: r.competitor,
    mentions: r.mentions,
  }));
}

export interface SentimentRow {
  sentiment: string;
  count: number;
}

export async function getSentimentBreakdown(days = 30): Promise<SentimentRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      sentiment: sql<string>`coalesce(${aiMentions.sentiment}, 'unclassified')`.as("sentiment"),
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(aiMentions)
    .where(and(gte(aiMentions.ranAt, since), sql`${aiMentions.citedUs} = true`))
    .groupBy(sql`coalesce(${aiMentions.sentiment}, 'unclassified')`)
    .orderBy(desc(sql<number>`count(*)`));
  return rows;
}

export interface RecentMention {
  id: number;
  engine: string;
  prompt: string;
  promptLang: string;
  citedUs: boolean;
  sentiment: string | null;
  citationUrl: string | null;
  competitorsMentioned: string[] | null;
  ranAt: Date;
}

export async function getRecentMentions(limit = 100, engine?: string): Promise<RecentMention[]> {
  const conds = [];
  if (engine) conds.push(eq(aiMentions.engine, engine));
  const q = db
    .select({
      id: aiMentions.id,
      engine: aiMentions.engine,
      prompt: aiMentions.prompt,
      promptLang: aiMentions.promptLang,
      citedUs: aiMentions.citedUs,
      sentiment: aiMentions.sentiment,
      citationUrl: aiMentions.citationUrl,
      competitorsMentioned: aiMentions.competitorsMentioned,
      ranAt: aiMentions.ranAt,
    })
    .from(aiMentions);
  const filtered = conds.length > 0 ? q.where(and(...conds)) : q;
  return await filtered.orderBy(desc(aiMentions.ranAt)).limit(limit);
}
