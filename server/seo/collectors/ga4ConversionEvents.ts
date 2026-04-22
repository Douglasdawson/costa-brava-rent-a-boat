// server/seo/collectors/ga4ConversionEvents.ts
//
// Per-event conversion counts per day per landing page + source/medium.
// Needed to derive whatsapp_click_rate, booking_started_rate, phone_click_rate,
// purchase_rate per landing page — not available from ga4_daily_metrics whose
// `conversions` column is an aggregate across all event names.

import { google } from "googleapis";
import { sql } from "drizzle-orm";
import { db } from "../../db";
import { ga4ConversionEvents, type InsertGa4ConversionEvent } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { config } from "../../config";
import { isConfigured } from "../../services/googleAnalyticsService";

const MAX_DAYS_PER_RUN = 3;
const GA4_REPORT_DELAY_DAYS = 1;
const PAGE_SIZE = 100000;

// Event names that map to business outcomes. Filtering server-side keeps
// cardinality manageable and avoids writing rows for gtag noise like
// page_view / scroll / session_start.
const TRACKED_EVENTS = [
  "booking_started",
  "purchase",
  "whatsapp_click",
  "phone_click",
  "generate_lead",
] as const;

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

function num(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

async function fetchEventRowsForDate(
  propertyId: string,
  date: string,
  auth: InstanceType<typeof google.auth.JWT>,
): Promise<GaReportRow[]> {
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const allRows: GaReportRow[] = [];
  let offset = 0;

  for (let page = 0; page < 3; page++) {
    const resp = await analyticsdata.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: date, endDate: date }],
        dimensions: [
          { name: "eventName" },
          { name: "landingPagePlusQueryString" },
          { name: "sessionSource" },
          { name: "sessionMedium" },
        ],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: { values: [...TRACKED_EVENTS] },
          },
        },
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

export async function collectGa4ConversionEvents(options?: { daysBack?: number }): Promise<{
  days: number;
  rowsFetched: number;
  rowsWritten: number;
}> {
  if (!isConfigured() || !config.GOOGLE_ANALYTICS_PROPERTY_ID) {
    logger.warn("[SEO:GA4Events] GA4 not configured, skipping");
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
      const rows = await fetchEventRowsForDate(propertyId, date, auth);
      totalFetched += rows.length;

      if (rows.length === 0) {
        logger.info(`[SEO:GA4Events] ${date}: no rows`);
        continue;
      }

      const values: InsertGa4ConversionEvent[] = [];
      for (const row of rows) {
        const dims = row.dimensionValues || [];
        const mets = row.metricValues || [];
        const eventName = (dims[0]?.value || "").slice(0, 60);
        if (!eventName) continue;

        values.push({
          date,
          eventName,
          landingPage: dims[1]?.value || null,
          source: dims[2]?.value || null,
          medium: dims[3]?.value || null,
          eventCount: num(mets[0]?.value),
        });
      }

      const CHUNK_SIZE = 500;
      for (let i = 0; i < values.length; i += CHUNK_SIZE) {
        const chunk = values.slice(i, i + CHUNK_SIZE);
        await db
          .insert(ga4ConversionEvents)
          .values(chunk)
          .onConflictDoUpdate({
            target: [
              ga4ConversionEvents.date,
              ga4ConversionEvents.eventName,
              ga4ConversionEvents.landingPage,
              ga4ConversionEvents.source,
              ga4ConversionEvents.medium,
            ],
            set: { eventCount: sql`EXCLUDED.event_count` },
          });
      }

      totalWritten += values.length;
      logger.info(`[SEO:GA4Events] ${date}: ${values.length} rows upserted`);
    } catch (error) {
      logger.error(`[SEO:GA4Events] ${date}: failed`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info(`[SEO:GA4Events] Done. Days: ${daysBack}, fetched ${totalFetched}, written ${totalWritten}`);
  return { days: daysBack, rowsFetched: totalFetched, rowsWritten: totalWritten };
}
