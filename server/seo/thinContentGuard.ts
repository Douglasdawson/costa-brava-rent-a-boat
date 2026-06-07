// server/seo/thinContentGuard.ts
//
// Anti-thin-content guard for programmatic / low-quality pages. Auto-noindexes
// a page when real GA4 engagement says users bounce off it — but ONLY once the
// page has enough traffic to judge, so we never penalize new or low-traffic
// pages that simply haven't accumulated data yet.
//
// This is the guardrail the SEO audit requires before any programmatic page
// matrix (boat × location × occasion …) ships: it lets us fan out long-tail
// pages without risking a thin-content sitewide penalty, because the ones that
// don't earn engagement quietly fall out of the index.
//
// Wired into server/seoInjector.ts (computeTranslationIndex result is OR-ed with
// this). Fail-safe: any error → do NOT noindex.

import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { ga4DailyMetrics } from "../../shared/schema";
import { logger } from "../lib/logger";

// Thresholds. A page is "thin" if, given enough sessions to judge, users mostly
// bounce or barely stay. Conservative so we only catch genuinely dead pages.
export const MIN_SESSIONS_TO_JUDGE = 30; // below this, not enough signal
export const MAX_BOUNCE_PERCENT = 80;
export const MIN_AVG_DURATION_SECONDS = 10;
const LOOKBACK_DAYS = 28;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h — GA4 data only changes daily

export interface EngagementMetrics {
  sessions: number;
  engagedSessions: number;
  bouncePercent: number; // 0-100
  avgSessionDurationSeconds: number;
}

/**
 * Pure, side-effect-free decision — unit tested. `null` metrics or too little
 * traffic → never noindex (don't punish pages we can't fairly judge yet).
 */
export function evaluateThinContent(
  m: EngagementMetrics | null,
): { noindex: boolean; reason?: string } {
  if (!m || m.sessions < MIN_SESSIONS_TO_JUDGE) return { noindex: false };
  if (m.bouncePercent > MAX_BOUNCE_PERCENT) {
    return { noindex: true, reason: `bounce ${m.bouncePercent.toFixed(0)}% > ${MAX_BOUNCE_PERCENT}% over ${m.sessions} sessions` };
  }
  if (m.avgSessionDurationSeconds < MIN_AVG_DURATION_SECONDS) {
    return { noindex: true, reason: `avg ${m.avgSessionDurationSeconds.toFixed(1)}s < ${MIN_AVG_DURATION_SECONDS}s over ${m.sessions} sessions` };
  }
  return { noindex: false };
}

// Strategically critical "money" pages are NEVER auto-noindexed by engagement
// signals. A high bounce on the home or a head-term landing is a reason to FIX
// the page, not to hide it from Google — losing one of these from the index is
// far costlier (and slower to recover) than tolerating an underperforming page.
// The guard still applies to programmatic long-tail pages (the boat×location×
// occasion matrix), which is exactly what it exists for.
//
// Keyed by the canonical (un-prefixed, un-translated) metaKey from
// pathToStaticMetaKey, so it covers all 8 locales at once.
const MONEY_PAGE_METAKEYS = new Set<string>([
  "/",                    // home (all languages)
  "/barcos",              // fleet
  "/barcos-sin-licencia", // category
  "/barcos-con-licencia", // category
  "/precios",             // pricing
]);

export function isThinGuardExempt(metaKey: string): boolean {
  if (MONEY_PAGE_METAKEYS.has(metaKey)) return true;
  if (metaKey.startsWith("/alquiler-barcos-")) return true; // location landings
  if (metaKey.startsWith("/barco/")) return true;           // boat detail pages
  return false;
}

/** Aggregate GA4 daily rows for one landing page over the lookback window. */
export async function getPageEngagementMetrics(
  landingPage: string,
  daysBack: number = LOOKBACK_DAYS,
): Promise<EngagementMetrics | null> {
  const since = new Date(Date.now() - daysBack * 86_400_000).toISOString().slice(0, 10);
  const rows = await db
    .select({
      sessions: sql<number>`coalesce(sum(${ga4DailyMetrics.sessions}), 0)::int`,
      engaged: sql<number>`coalesce(sum(${ga4DailyMetrics.engagedSessions}), 0)::int`,
      // session-weighted average duration: Σ(avgDur × sessions) / Σ(sessions)
      durNumer: sql<number>`coalesce(sum(${ga4DailyMetrics.averageSessionDuration} * ${ga4DailyMetrics.sessions}), 0)::float`,
    })
    .from(ga4DailyMetrics)
    .where(and(eq(ga4DailyMetrics.landingPage, landingPage), gte(ga4DailyMetrics.date, since)));

  const r = rows[0];
  if (!r || !r.sessions) return null;
  const bouncePercent = ((r.sessions - r.engaged) / r.sessions) * 100;
  const avgSessionDurationSeconds = r.durNumer / r.sessions;
  return { sessions: r.sessions, engagedSessions: r.engaged, bouncePercent, avgSessionDurationSeconds };
}

// Per-path decision cache so the hot SEO middleware does at most one DB query
// per path per hour.
const cache = new Map<string, { value: boolean; expires: number }>();

/**
 * True if `pagePath` should be noindex'd for thin content. Cached 1h. Fail-safe:
 * any DB/parse error → false (never accidentally noindex on infra hiccups).
 * `pagePath` must be the localized path as GA4 stores it (e.g. /es/alquiler-barcos-blanes).
 */
export async function shouldNoindexThinContent(pagePath: string, metaKey?: string): Promise<boolean> {
  // Never let engagement signals hide a strategically critical page.
  if (metaKey && isThinGuardExempt(metaKey)) return false;

  const now = Date.now();
  const hit = cache.get(pagePath);
  if (hit && hit.expires > now) return hit.value;

  let noindex = false;
  try {
    const metrics = await getPageEngagementMetrics(pagePath);
    const decision = evaluateThinContent(metrics);
    noindex = decision.noindex;
    if (noindex) {
      logger.info(`[SEO:ThinGuard] noindex ${pagePath} — ${decision.reason}`);
    }
  } catch (err) {
    logger.warn(`[SEO:ThinGuard] metrics lookup failed for ${pagePath} — not penalizing`, {
      error: err instanceof Error ? err.message : String(err),
    });
    noindex = false;
  }

  cache.set(pagePath, { value: noindex, expires: now + CACHE_TTL_MS });
  return noindex;
}

/** Test/ops helper: clear the in-memory decision cache. */
export function _clearThinContentCache(): void {
  cache.clear();
}
