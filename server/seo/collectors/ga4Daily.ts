// server/seo/collectors/ga4Daily.ts
//
// Daily GA4 ingestion into ga4_daily_metrics broken down by:
//   (date, landingPage, source, medium, country, deviceCategory)
//
// This lets the war-room answer "which landing pages are converting on which
// channels this week vs last" without re-querying the GA4 Data API every time.

import { google } from "googleapis";
import { sql } from "drizzle-orm";
import { db } from "../../db";
import { ga4DailyMetrics, type InsertGa4DailyMetric } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { config } from "../../config";
import { isConfigured } from "../../services/googleAnalyticsService";

const MAX_DAYS_PER_RUN = 3; // Re-ingest last 3 days for late attribution
const GA4_REPORT_DELAY_DAYS = 1; // GA4 stabilises within ~24-48h
const PAGE_SIZE = 100000; // GA4 runReport returns max 250k rows total

function getAuth() {
  return new google.auth.JWT({
    email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function subDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - days);
  return copy;
}

interface GaReportRow {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
}

function num(v: string | undefined, isInt = true): number {
  if (!v) return 0;
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return isInt ? Math.round(n) : n;
}

function asDecimalString(v: string | undefined, scale = 5): string | null {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(scale);
}

/**
 * Query GA4 Data API for a single date, paginated.
 */
async function fetchRowsForDate(propertyId: string, date: string, auth: InstanceType<typeof google.auth.JWT>): Promise<GaReportRow[]> {
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const allRows: GaReportRow[] = [];
  let offset = 0;

  for (let page = 0; page < 3; page++) { // up to 300k rows/day (absurd overhead)
    const resp = await analyticsdata.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: date, endDate: date }],
        dimensions: [
          { name: "date" },
          { name: "landingPagePlusQueryString" },
          { name: "sessionSource" },
          { name: "sessionMedium" },
          { name: "country" },
          { name: "deviceCategory" },
        ],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "engagedSessions" },
          { name: "engagementRate" },
          { name: "averageSessionDuration" },
          { name: "screenPageViewsPerSession" },
          { name: "conversions" },
          { name: "totalRevenue" },
        ],
        offset: String(offset),
        limit: String(PAGE_SIZE),
      },
    });

    const rows = (resp.data.rows || []) as GaReportRow[];
    allRows.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

export async function collectGa4Daily(options?: { daysBack?: number }): Promise<{
  days: number;
  rowsFetched: number;
  rowsWritten: number;
}> {
  if (!isConfigured() || !config.GOOGLE_ANALYTICS_PROPERTY_ID) {
    logger.warn("[SEO:GA4] GA4 property or service account not configured, skipping");
    return { days: 0, rowsFetched: 0, rowsWritten: 0 };
  }

  const auth = getAuth();
  const propertyId = String(config.GOOGLE_ANALYTICS_PROPERTY_ID);

  const daysBack = options?.daysBack ?? MAX_DAYS_PER_RUN;
  const latestAvailable = subDays(new Date(), GA4_REPORT_DELAY_DAYS);

  let totalFetched = 0;
  let totalWritten = 0;

  for (let offset = 0; offset < daysBack; offset++) {
    const date = isoDate(subDays(latestAvailable, offset));

    try {
      const rows = await fetchRowsForDate(propertyId, date, auth);
      totalFetched += rows.length;

      if (rows.length === 0) {
        logger.info(`[SEO:GA4] ${date}: no rows returned`);
        continue;
      }

      const values: InsertGa4DailyMetric[] = rows.map((row) => {
        const dims = row.dimensionValues || [];
        const mets = row.metricValues || [];
        // dim 0 = date (YYYYMMDD); we already know the date so ignore
        const landingPage = dims[1]?.value || null;
        const source = dims[2]?.value || null;
        const medium = dims[3]?.value || null;
        const country = (dims[4]?.value || "").slice(0, 3) || null;
        const deviceCategory = (dims[5]?.value || "").slice(0, 12) || null;

        return {
          date,
          landingPage,
          source,
          medium,
          country,
          deviceCategory,
          sessions: num(mets[0]?.value),
          totalUsers: num(mets[1]?.value),
          newUsers: num(mets[2]?.value),
          engagedSessions: num(mets[3]?.value),
          engagementRate: asDecimalString(mets[4]?.value, 5),
          averageSessionDuration: asDecimalString(mets[5]?.value, 2),
          screenPageViewsPerSession: asDecimalString(mets[6]?.value, 2),
          conversions: num(mets[7]?.value),
          totalRevenue: asDecimalString(mets[8]?.value, 2),
        } satisfies InsertGa4DailyMetric;
      });

      const CHUNK_SIZE = 500;
      for (let i = 0; i < values.length; i += CHUNK_SIZE) {
        const chunk = values.slice(i, i + CHUNK_SIZE);
        await db
          .insert(ga4DailyMetrics)
          .values(chunk)
          .onConflictDoUpdate({
            target: [
              ga4DailyMetrics.date,
              ga4DailyMetrics.landingPage,
              ga4DailyMetrics.source,
              ga4DailyMetrics.medium,
              ga4DailyMetrics.country,
              ga4DailyMetrics.deviceCategory,
            ],
            set: {
              sessions: sql`EXCLUDED.sessions`,
              totalUsers: sql`EXCLUDED.total_users`,
              newUsers: sql`EXCLUDED.new_users`,
              engagedSessions: sql`EXCLUDED.engaged_sessions`,
              engagementRate: sql`EXCLUDED.engagement_rate`,
              averageSessionDuration: sql`EXCLUDED.average_session_duration`,
              screenPageViewsPerSession: sql`EXCLUDED.screen_page_views_per_session`,
              conversions: sql`EXCLUDED.conversions`,
              totalRevenue: sql`EXCLUDED.total_revenue`,
            },
          });
      }

      totalWritten += values.length;
      logger.info(`[SEO:GA4] ${date}: ${values.length} rows upserted`);
    } catch (error) {
      logger.error(`[SEO:GA4] ${date}: failed`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info(`[SEO:GA4] Done. Days: ${daysBack}, fetched ${totalFetched}, written ${totalWritten}`);
  return { days: daysBack, rowsFetched: totalFetched, rowsWritten: totalWritten };
}
