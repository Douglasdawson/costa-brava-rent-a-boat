// Core Web Vitals collector — receives beacon data from client
import { db } from "../../db";
import { seoCwvMetrics } from "../../../shared/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { logger } from "../../lib/logger";

interface CwvBeacon {
  page: string;
  name: string; // CLS, LCP, INP, TTFB, FCP
  value: number;
  rating?: string; // good, needs-improvement, poor
}

// Thresholds from web.dev
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  CLS: { good: 0.1, poor: 0.25 },
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
};

function classifyRating(name: string, value: number): string {
  const t = THRESHOLDS[name];
  if (!t) return "unknown";
  if (value <= t.good) return "good";
  if (value >= t.poor) return "poor";
  return "needs-improvement";
}

export async function recordCwvBeacon(beacon: CwvBeacon): Promise<void> {
  const rating = beacon.rating || classifyRating(beacon.name, beacon.value);

  await db.insert(seoCwvMetrics).values({
    page: beacon.page,
    metricName: beacon.name,
    value: beacon.value,
    rating,
  });
}

// Get CWV summary for SEO briefing (last 7 days, aggregated by page)
export async function getCwvSummary(): Promise<Array<{
  page: string;
  metrics: Record<string, { p75: number; rating: string; samples: number }>;
}>> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const rows = await db
    .select({
      page: seoCwvMetrics.page,
      metricName: seoCwvMetrics.metricName,
      p75: sql<number>`percentile_cont(0.75) WITHIN GROUP (ORDER BY ${seoCwvMetrics.value})`.as("p75"),
      samples: sql<number>`count(*)::int`.as("samples"),
    })
    .from(seoCwvMetrics)
    .where(gte(seoCwvMetrics.recordedAt, sevenDaysAgo))
    .groupBy(seoCwvMetrics.page, seoCwvMetrics.metricName);

  // Group by page
  const pageMap = new Map<string, Record<string, { p75: number; rating: string; samples: number }>>();
  for (const row of rows) {
    if (!pageMap.has(row.page)) pageMap.set(row.page, {});
    const metrics = pageMap.get(row.page)!;
    const p75 = Number(row.p75);
    metrics[row.metricName] = {
      p75: Math.round(p75 * 100) / 100,
      rating: classifyRating(row.metricName, p75),
      samples: row.samples,
    };
  }

  return Array.from(pageMap.entries()).map(([page, metrics]) => ({ page, metrics }));
}
