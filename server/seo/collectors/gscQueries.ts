// server/seo/collectors/gscQueries.ts
//
// Full-fidelity daily extract from Google Search Console into gsc_queries.
// Breaks down each day by query + page + country + device so the war-room
// can analyse CTR/position deltas, intent gaps, long-tail opportunities, etc.
//
// Complements server/seo/collectors/gsc.ts which only maintains seoKeywords /
// seoRankings summary. This collector preserves the full dimensional fidelity.

import { google } from "googleapis";
import { sql } from "drizzle-orm";
import { db } from "../../db";
import { gscQueries, type InsertGscQueryRow } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { config } from "../../config";
import { isConfigured } from "../../services/googleAnalyticsService";

const ROW_LIMIT_PER_REQUEST = 25000; // GSC API maximum
const MAX_DAYS_PER_RUN = 3; // Re-ingest last 3 days to absorb late-arriving data
const GSC_REPORT_DELAY_DAYS = 3; // GSC data typically lags ~3 days

function getAuth() {
  return new google.auth.JWT({
    email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
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

interface GscRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

/**
 * Fetch all rows for a given date, paginating with startRow until GSC returns
 * fewer than the page limit.
 */
async function fetchRowsForDate(
  searchconsole: ReturnType<typeof google.searchconsole>,
  siteUrl: string,
  date: string,
): Promise<GscRow[]> {
  const allRows: GscRow[] = [];
  let startRow = 0;

  // Safety cap: 10 pages × 25k rows = 250k rows/day (huge overhead for this site)
  for (let page = 0; page < 10; page++) {
    const resp = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: date,
        endDate: date,
        dimensions: ["query", "page", "country", "device"],
        rowLimit: ROW_LIMIT_PER_REQUEST,
        startRow,
        dataState: "final",
      },
    });

    const rows = (resp.data.rows || []) as GscRow[];
    allRows.push(...rows);

    if (rows.length < ROW_LIMIT_PER_REQUEST) break;
    startRow += ROW_LIMIT_PER_REQUEST;
  }

  return allRows;
}

/**
 * Main collector entry point. Called daily by scheduler.
 */
export async function collectGscQueries(options?: { daysBack?: number }): Promise<{
  days: number;
  rowsFetched: number;
  rowsWritten: number;
}> {
  if (!isConfigured()) {
    logger.warn("[SEO:GSCQueries] Google API not configured, skipping");
    return { days: 0, rowsFetched: 0, rowsWritten: 0 };
  }

  const auth = getAuth();
  const searchconsole = google.searchconsole({ version: "v1", auth });
  const siteUrl = config.GSC_SITE_URL || "sc-domain:costabravarentaboat.com";

  const daysBack = options?.daysBack ?? MAX_DAYS_PER_RUN;
  // Walk backward from the most recent reliably-available day
  const latestAvailable = subDays(new Date(), GSC_REPORT_DELAY_DAYS);

  let totalFetched = 0;
  let totalWritten = 0;

  for (let offset = 0; offset < daysBack; offset++) {
    const date = isoDate(subDays(latestAvailable, offset));

    try {
      const rows = await fetchRowsForDate(searchconsole, siteUrl, date);
      totalFetched += rows.length;

      if (rows.length === 0) {
        logger.info(`[SEO:GSCQueries] ${date}: no rows returned`);
        continue;
      }

      // Build batch insert values — normalise and filter
      const values: InsertGscQueryRow[] = [];
      for (const row of rows) {
        const [query, page, country, device] = row.keys || [];
        if (!query) continue;

        values.push({
          date,
          query,
          page: page || null,
          country: country || null,
          device: device || null,
          clicks: Math.round(row.clicks || 0),
          impressions: Math.round(row.impressions || 0),
          ctr: row.ctr != null ? String(row.ctr) : null,
          position: row.position != null ? String(row.position) : null,
        });
      }

      // Chunked upsert (Postgres limit ~65k parameters per statement; 9 columns
      // per row → ~7k rows per chunk is very safe)
      const CHUNK_SIZE = 500;
      for (let i = 0; i < values.length; i += CHUNK_SIZE) {
        const chunk = values.slice(i, i + CHUNK_SIZE);
        await db
          .insert(gscQueries)
          .values(chunk)
          .onConflictDoUpdate({
            target: [
              gscQueries.date,
              gscQueries.query,
              gscQueries.page,
              gscQueries.country,
              gscQueries.device,
            ],
            set: {
              clicks: sql`EXCLUDED.clicks`,
              impressions: sql`EXCLUDED.impressions`,
              ctr: sql`EXCLUDED.ctr`,
              position: sql`EXCLUDED.position`,
            },
          });
      }

      totalWritten += values.length;
      logger.info(`[SEO:GSCQueries] ${date}: ${values.length} rows upserted`);
    } catch (error) {
      logger.error(`[SEO:GSCQueries] ${date}: failed`, {
        error: error instanceof Error ? error.message : String(error),
      });
      // Keep going with the other days
    }
  }

  logger.info(
    `[SEO:GSCQueries] Done. Days: ${daysBack}, fetched ${totalFetched}, written ${totalWritten}`,
  );

  return { days: daysBack, rowsFetched: totalFetched, rowsWritten: totalWritten };
}
