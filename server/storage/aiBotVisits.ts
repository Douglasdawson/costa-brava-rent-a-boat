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
 * logged but never propagated so request latency is unaffected. Logged at
 * `error` level (not warn) so failures show up in stderr unmistakably.
 */
export async function recordAiBotVisit(visit: InsertAiBotVisit): Promise<void> {
  try {
    await db.insert(aiBotVisits).values(visit);
  } catch (error) {
    logger.error("[ai-bot-visits] insert failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      botName: visit.botName,
      path: visit.path,
    });
  }
}

/**
 * Boot-time self-test: insert a probe row and read it back. Surfaces both
 * connection problems (insert fails) and read-after-write issues (different
 * pool / replica lag) at startup with a clear log line, so we don't have to
 * wait for an organic bot hit to discover an outage.
 */
export async function selfTestAiBotVisits(): Promise<{ ok: boolean; error?: string; durationMs: number }> {
  const started = Date.now();
  const probe: InsertAiBotVisit = {
    botName: "_boot_self_test",
    userAgent: "boot-self-test/1.0",
    path: "/_self_test",
    method: "GET",
    lang: null,
    statusCode: 200,
  };
  try {
    await db.insert(aiBotVisits).values(probe);
    // Best-effort cleanup — leave the row if delete fails, the dashboard
    // filters out _boot_self_test entries downstream.
    try {
      await db.execute(sql`DELETE FROM ai_bot_visits WHERE bot_name = '_boot_self_test'`);
    } catch {
      /* ignore — the insert succeeded which is what matters */
    }
    return { ok: true, durationMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - started,
      error: error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error),
    };
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
  const visitCount = sql<number>`count(*)::int`.as("visits");
  const rows = await db
    .select({
      botName: aiBotVisits.botName,
      visits: visitCount,
    })
    .from(aiBotVisits)
    .where(gte(aiBotVisits.timestamp, since))
    .groupBy(aiBotVisits.botName)
    .orderBy(desc(visitCount));
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
  const visitCount = sql<number>`count(*)::int`.as("visits");
  const rows = await db
    .select({
      path: aiBotVisits.path,
      visits: visitCount,
    })
    .from(aiBotVisits)
    .where(gte(aiBotVisits.timestamp, since))
    .groupBy(aiBotVisits.path)
    .orderBy(desc(visitCount))
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
