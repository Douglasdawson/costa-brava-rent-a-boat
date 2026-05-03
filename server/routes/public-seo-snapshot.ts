/**
 * Public read-only SEO snapshot endpoint.
 *
 * GET /api/public/seo-snapshot?key=<SEO_SNAPSHOT_KEY>
 *
 * Returns Google Search Console position data (last N days) for one or
 * more target queries plus URL Inspection state for URLs matching a path
 * substring. Designed for external observability agents (e.g. scheduled
 * remote routines) that don't have DATABASE_URL or Google service-account
 * credentials in their sandbox.
 *
 * Auth: shared secret in env var SEO_SNAPSHOT_KEY, compared via
 * crypto.timingSafeEqual. If the env var is unset → 503 (endpoint
 * disabled). Wrong/missing key → 401 with no hint.
 *
 * Read-only by construction: only SELECTs, all params parameterized via
 * Drizzle. Payload bounded (≤20 GSC rows per query × ≤30 inspection
 * rows per request).
 */

import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { and, asc, desc, eq, gte, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { gscQueries, seoUrlInspections } from "../../shared/schema";
import { logger } from "../lib/logger";

const DEFAULT_QUERIES = ["alquiler barcos costa brava"];
const DEFAULT_PATH_PREFIX = "alquiler-barcos-costa-brava";
const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;
const MAX_QUERY_RESULTS = 20;
const MAX_INSPECTIONS = 30;

const querySchema = z.object({
  key: z.string().min(8).max(128),
  q: z.union([z.string(), z.array(z.string())]).optional(),
  path_prefix: z.string().max(200).optional(),
  days: z.coerce.number().int().positive().max(MAX_DAYS).optional(),
});

/** Constant-time key comparison; returns false when env var unset or lengths differ. */
function keyMatches(provided: string): boolean {
  const expected = process.env.SEO_SNAPSHOT_KEY;
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Touch a constant-time op so callers can't time-distinguish "wrong length"
    // from "wrong key of correct length".
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

interface GscRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}

interface InspectionRow {
  url: string;
  verdict: string | null;
  coverageState: string | null;
  indexingState: string | null;
  pageFetchState: string | null;
  robotsTxtState: string | null;
  userCanonical: string | null;
  googleCanonical: string | null;
  canonicalMismatch: boolean;
  lastCrawlTime: Date | null;
  referringSitemap: string | null;
  inspectedAt: Date;
}

export function registerPublicSeoSnapshotRoutes(app: Express): void {
  app.get("/api/public/seo-snapshot", async (req: Request, res: Response) => {
    if (!process.env.SEO_SNAPSHOT_KEY) {
      return res.status(503).json({ error: "snapshot endpoint disabled" });
    }

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success || !keyMatches(parsed.data.key)) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { q, path_prefix, days: daysArg } = parsed.data;
    const queries = q ? (Array.isArray(q) ? q : [q]) : DEFAULT_QUERIES;
    const pathPrefix = path_prefix ?? DEFAULT_PATH_PREFIX;
    const days = daysArg ?? DEFAULT_DAYS;

    try {
      const startDate = new Date(Date.now() - days * 86_400_000)
        .toISOString()
        .slice(0, 10);

      const rows = (await db
        .select({
          query: gscQueries.query,
          page: gscQueries.page,
          clicks: sql<number>`SUM(${gscQueries.clicks})::int`.as("clicks"),
          impressions: sql<number>`SUM(${gscQueries.impressions})::int`.as("impressions"),
          ctr: sql<number>`
            CASE WHEN SUM(${gscQueries.impressions}) > 0
              THEN ROUND((SUM(${gscQueries.clicks})::numeric / SUM(${gscQueries.impressions})), 5)::float
              ELSE 0 END
          `.as("ctr"),
          avgPosition: sql<number>`ROUND(AVG(${gscQueries.position})::numeric, 2)::float`.as("avg_position"),
        })
        .from(gscQueries)
        .where(
          and(
            gte(gscQueries.date, startDate),
            inArray(gscQueries.query, queries),
          ),
        )
        .groupBy(gscQueries.query, gscQueries.page)
        .orderBy(asc(gscQueries.query), desc(sql.identifier("impressions")))
        .limit(MAX_QUERY_RESULTS * queries.length)) as GscRow[];

      const queryGroups = new Map<string, GscRow[]>();
      for (const r of rows) {
        const list = queryGroups.get(r.query) ?? [];
        list.push(r);
        queryGroups.set(r.query, list);
      }

      const inspections = (await db
        .select({
          url: seoUrlInspections.url,
          verdict: seoUrlInspections.verdict,
          coverageState: seoUrlInspections.coverageState,
          indexingState: seoUrlInspections.indexingState,
          pageFetchState: seoUrlInspections.pageFetchState,
          robotsTxtState: seoUrlInspections.robotsTxtState,
          userCanonical: seoUrlInspections.userCanonical,
          googleCanonical: seoUrlInspections.googleCanonical,
          canonicalMismatch: seoUrlInspections.canonicalMismatch,
          lastCrawlTime: seoUrlInspections.lastCrawlTime,
          referringSitemap: seoUrlInspections.referringSitemap,
          inspectedAt: seoUrlInspections.inspectedAt,
        })
        .from(seoUrlInspections)
        .where(ilike(seoUrlInspections.url, `%${pathPrefix}%`))
        .orderBy(asc(seoUrlInspections.url))
        .limit(MAX_INSPECTIONS)) as InspectionRow[];

      res.setHeader("Cache-Control", "no-store");
      res.json({
        snapshot_at: new Date().toISOString(),
        window_days: days,
        queries: queries.map((query) => ({
          query,
          results: (queryGroups.get(query) ?? []).map((r) => ({
            page: r.page,
            clicks: Number(r.clicks),
            impressions: Number(r.impressions),
            ctr: Number(r.ctr),
            avg_position: Number(r.avgPosition),
          })),
        })),
        url_inspections: inspections.map((i) => ({
          url: i.url,
          verdict: i.verdict,
          coverage_state: i.coverageState,
          indexing_state: i.indexingState,
          page_fetch_state: i.pageFetchState,
          robots_txt_state: i.robotsTxtState,
          user_canonical: i.userCanonical,
          google_canonical: i.googleCanonical,
          canonical_mismatch: i.canonicalMismatch,
          last_crawl_time: i.lastCrawlTime,
          referring_sitemap: i.referringSitemap,
          inspected_at: i.inspectedAt,
        })),
      });
    } catch (err) {
      logger.error("public seo snapshot failed", {
        err: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: "snapshot generation failed" });
    }
  });
}
