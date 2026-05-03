/**
 * SEO pilot measurement runner.
 *
 * Called by the cron in server/seo/worker.ts. For each due pilot:
 *  1. Skip if a run row already exists for this (pilotKey, scheduledFor).
 *  2. Query gsc_queries for each pilot.queries entry.
 *  3. Query seo_url_inspections for the pilot.pathPrefix.
 *  4. Compute verdict via thresholds.
 *  5. Write a row to seo_pilot_runs.
 *  6. Optionally POST to env-configured webhook (Discord/Slack/generic).
 *
 * No external auth needed: runs in-process inside Replit, has direct DB
 * access. Bypasses the WAF that blocks external agents.
 */

import { and, asc, desc, eq, gte, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { gscQueries, seoUrlInspections, seoPilotRuns } from "../../shared/schema";
import { PILOTS, pilotsDueAt, type PilotConfig } from "../../shared/seoPilots";
import { logger } from "../lib/logger";

const GSC_WINDOW_DAYS = 30;

interface QueryResult {
  query: string;
  dedicated: { page: string; position: number; clicks: number; impressions: number } | null;
  home: { page: string; position: number; clicks: number; impressions: number } | null;
}

interface InspectionResult {
  url: string;
  verdict: string | null;
  coverageState: string | null;
  indexingState: string | null;
}

interface MeasurementData {
  measured_at: string;
  window_days: number;
  queries: QueryResult[];
  url_inspections: InspectionResult[];
}

/** Identify whether a URL is the "dedicated" landing for this pilot (any locale slug). */
function isDedicatedPage(url: string, slugs: string[]): boolean {
  return slugs.some((s) => url.includes(s));
}

/** Identify whether a URL is the home (root or /:lang/). */
function isHomePage(url: string): boolean {
  // Strip query/hash, then check pathname.
  const u = url.split("?")[0].split("#")[0];
  return /\/$|\/[a-z]{2}\/?$/.test(u);
}

async function fetchQueryResults(pilot: PilotConfig): Promise<QueryResult[]> {
  const startDate = new Date(Date.now() - GSC_WINDOW_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const rows = await db
    .select({
      query: gscQueries.query,
      page: gscQueries.page,
      clicks: sql<number>`SUM(${gscQueries.clicks})::int`.as("clicks"),
      impressions: sql<number>`SUM(${gscQueries.impressions})::int`.as("impressions"),
      avgPosition: sql<number>`ROUND(AVG(${gscQueries.position})::numeric, 2)::float`.as("avg_position"),
    })
    .from(gscQueries)
    .where(
      and(
        gte(gscQueries.date, startDate),
        inArray(gscQueries.query, pilot.queries),
      ),
    )
    .groupBy(gscQueries.query, gscQueries.page);

  // For each query, pick best dedicated and best home rows.
  const out: QueryResult[] = [];
  for (const q of pilot.queries) {
    const matches = rows.filter((r): r is typeof r & { page: string } => r.query === q && r.page !== null);
    const dedicatedRows = matches
      .filter((r) => isDedicatedPage(r.page, pilot.slugs))
      .sort((a, b) => Number(a.avgPosition) - Number(b.avgPosition));
    const homeRows = matches
      .filter((r) => isHomePage(r.page))
      .sort((a, b) => Number(a.avgPosition) - Number(b.avgPosition));

    out.push({
      query: q,
      dedicated: dedicatedRows[0]
        ? {
            page: dedicatedRows[0].page,
            position: Number(dedicatedRows[0].avgPosition),
            clicks: Number(dedicatedRows[0].clicks),
            impressions: Number(dedicatedRows[0].impressions),
          }
        : null,
      home: homeRows[0]
        ? {
            page: homeRows[0].page,
            position: Number(homeRows[0].avgPosition),
            clicks: Number(homeRows[0].clicks),
            impressions: Number(homeRows[0].impressions),
          }
        : null,
    });
  }
  return out;
}

async function fetchInspections(pilot: PilotConfig): Promise<InspectionResult[]> {
  const rows = await db
    .select({
      url: seoUrlInspections.url,
      verdict: seoUrlInspections.verdict,
      coverageState: seoUrlInspections.coverageState,
      indexingState: seoUrlInspections.indexingState,
    })
    .from(seoUrlInspections)
    .where(ilike(seoUrlInspections.url, `%${pilot.pathPrefix}%`))
    .orderBy(asc(seoUrlInspections.url));

  // Filter to landings only (exclude blog posts that also contain the prefix).
  return rows
    .filter((r) => isDedicatedPage(r.url, pilot.slugs))
    .map((r) => ({
      url: r.url,
      verdict: r.verdict,
      coverageState: r.coverageState,
      indexingState: r.indexingState,
    }));
}

function computeVerdict(
  pilot: PilotConfig,
  queries: QueryResult[],
  inspections: InspectionResult[],
): { verdict: "VERDE" | "AMBAR" | "ROJO"; summary: string } {
  // Primary KPI: dedicated position for the first query.
  const primary = queries[0];
  const primaryPos = primary?.dedicated?.position ?? null;
  const indexedCount = inspections.filter(
    (i) =>
      i.coverageState?.toLowerCase().includes("indexed") &&
      !i.coverageState.toLowerCase().includes("not indexed"),
  ).length;

  if (primaryPos !== null && primaryPos <= pilot.thresholds.greenPositionMax && indexedCount === pilot.slugs.length) {
    return {
      verdict: "VERDE",
      summary: `Dedicada en posición ${primaryPos.toFixed(1)} (≤${pilot.thresholds.greenPositionMax}) y ${indexedCount}/${pilot.slugs.length} URLs indexadas. Hipótesis confirmada.`,
    };
  }
  if (primaryPos !== null && primaryPos > pilot.baseline.dedicatedPositionPre + 5) {
    return {
      verdict: "ROJO",
      summary: `Regresión: dedicada cayó a posición ${primaryPos.toFixed(1)} (vs baseline ${pilot.baseline.dedicatedPositionPre}). Investigar antes de replicar.`,
    };
  }
  return {
    verdict: "AMBAR",
    summary: `Mejora parcial: posición primaria ${primaryPos === null ? "sin datos" : primaryPos.toFixed(1)}, ${indexedCount}/${pilot.slugs.length} URLs indexadas (esperadas ${pilot.slugs.length}).`,
  };
}

async function alreadyMeasured(pilotKey: string, scheduledFor: Date): Promise<boolean> {
  const existing = await db
    .select({ id: seoPilotRuns.id })
    .from(seoPilotRuns)
    .where(and(eq(seoPilotRuns.pilotKey, pilotKey), eq(seoPilotRuns.scheduledFor, scheduledFor)))
    .limit(1);
  return existing.length > 0;
}

async function postNotification(pilot: PilotConfig, verdict: string, summary: string): Promise<boolean> {
  const url = process.env.SEO_PILOT_WEBHOOK_URL;
  if (!url) return false;
  try {
    const emoji = verdict === "VERDE" ? "🟢" : verdict === "AMBAR" ? "🟡" : "🔴";
    // Generic JSON body that works with Discord/Slack incoming webhooks.
    const content = `${emoji} *${pilot.name}* — ${verdict}\n${summary}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, text: content }),  // 'content' for Discord, 'text' for Slack
    });
    return res.ok;
  } catch (err) {
    logger.warn("[pilot-runner] webhook post failed", { err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

/** Main entry point. Called by the cron. */
export async function runDuePilots(): Promise<{ checked: number; ran: number; skipped: number; failed: number }> {
  const now = new Date();
  const due = pilotsDueAt(now);
  let ran = 0;
  let skipped = 0;
  let failed = 0;

  for (const pilot of due) {
    if (await alreadyMeasured(pilot.key, pilot.scheduledFor)) {
      skipped++;
      continue;
    }
    try {
      const queries = await fetchQueryResults(pilot);
      const inspections = await fetchInspections(pilot);
      const { verdict, summary } = computeVerdict(pilot, queries, inspections);

      const data: MeasurementData = {
        measured_at: now.toISOString(),
        window_days: GSC_WINDOW_DAYS,
        queries,
        url_inspections: inspections,
      };

      await db.insert(seoPilotRuns).values({
        pilotKey: pilot.key,
        ranAt: now,
        scheduledFor: pilot.scheduledFor,
        verdict,
        summary,
        data: data as unknown as Record<string, unknown>,
        baseline: pilot.baseline as unknown as Record<string, unknown>,
        notificationSent: false,
      });

      const sent = await postNotification(pilot, verdict, summary);
      if (sent) {
        await db
          .update(seoPilotRuns)
          .set({ notificationSent: true })
          .where(and(eq(seoPilotRuns.pilotKey, pilot.key), eq(seoPilotRuns.scheduledFor, pilot.scheduledFor)));
      }

      logger.info(`[pilot-runner] ran ${pilot.key} → ${verdict}`, { summary });
      ran++;
    } catch (err) {
      logger.error(`[pilot-runner] FAILED ${pilot.key}`, { err: err instanceof Error ? err.message : String(err) });
      failed++;
    }
  }

  return { checked: PILOTS.length, ran, skipped, failed };
}
