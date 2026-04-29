/**
 * AI Bot Visit Log Storage
 *
 * Persistent record of every HTTP hit from a known LLM crawler. Powers the
 * /api/admin/seo/bot-visits endpoint that surfaces "how often is GPTBot /
 * ClaudeBot / PerplexityBot indexing our pages".
 */

import {
  db, sql, gte, desc,
  aiBotVisits,
  type AiBotVisit, type InsertAiBotVisit,
} from "./base";
import { logger } from "../lib/logger";

export type { AiBotVisit, InsertAiBotVisit };

/**
 * Persist a single bot visit. Fire-and-forget from the middleware: errors are
 * logged but never propagated so request latency is unaffected.
 */
export async function recordAiBotVisit(visit: InsertAiBotVisit): Promise<void> {
  try {
    await db.insert(aiBotVisits).values(visit);
  } catch (error) {
    logger.warn("[ai-bot-visits] insert failed", {
      error: error instanceof Error ? error.message : String(error),
      botName: visit.botName,
      path: visit.path,
    });
  }
}

export interface MonthlyBotCount {
  botName: string;
  visits: number;
}

/**
 * Returns visit counts per bot for the last N days (default: last 30).
 */
export async function getBotVisitsByBot(days = 30): Promise<MonthlyBotCount[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      botName: aiBotVisits.botName,
      visits: sql<number>`count(*)::int`,
    })
    .from(aiBotVisits)
    .where(gte(aiBotVisits.timestamp, since))
    .groupBy(aiBotVisits.botName)
    .orderBy(desc(sql`count(*)`));
  return rows;
}

export interface TopPath {
  path: string;
  visits: number;
}

/**
 * Returns the most-crawled paths for the last N days (default: last 30).
 */
export async function getTopBotPaths(days = 30, limit = 20): Promise<TopPath[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      path: aiBotVisits.path,
      visits: sql<number>`count(*)::int`,
    })
    .from(aiBotVisits)
    .where(gte(aiBotVisits.timestamp, since))
    .groupBy(aiBotVisits.path)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  return rows;
}

export interface RecentVisit {
  botName: string;
  path: string;
  timestamp: Date;
  statusCode: number | null;
}

/**
 * Returns the N most-recent bot visits for live debugging.
 */
export async function getRecentBotVisits(limit = 50): Promise<RecentVisit[]> {
  const rows = await db
    .select({
      botName: aiBotVisits.botName,
      path: aiBotVisits.path,
      timestamp: aiBotVisits.timestamp,
      statusCode: aiBotVisits.statusCode,
    })
    .from(aiBotVisits)
    .orderBy(desc(aiBotVisits.timestamp))
    .limit(limit);
  return rows;
}
