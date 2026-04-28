// server/seo/collectors/urlInspection.ts
//
// Calls the Google Search Console URL Inspection API for each canonical URL
// declared in the site's sitemaps and stores the verdict in seo_url_inspections.
// One row per URL (upsert on url). Designed to run daily via the SEO worker.
//
// API quota: GSC URL Inspection API allows ~600 inspect calls/day per property
// (per official documentation). The site has ~171 canonical URLs, well under
// the daily ceiling, but we still pace requests at 350ms each to avoid
// burst-rate-limit errors that can return as 429s.
import { db } from "../../db";
import { seoUrlInspections } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { isConfigured } from "../../services/googleAnalyticsService";
import { google } from "googleapis";
import { config } from "../../config";

const SITEMAP_PATHS = [
  "/sitemap-pages.xml",
  "/sitemap-boats.xml",
  "/sitemap-blog.xml",
  "/sitemap-destinations.xml",
];

const INSPECT_PACING_MS = 350;
const FETCH_TIMEOUT_MS = 15_000;

interface InspectResult {
  url: string;
  ok: boolean;
  error?: string;
}

function getAuth() {
  return new google.auth.JWT({
    email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/webmasters"],
  });
}

function getBaseUrl(): string {
  return process.env.BASE_URL || "https://www.costabravarentaboat.com";
}

async function fetchSitemapUrls(sitemapPath: string): Promise<string[]> {
  const baseUrl = getBaseUrl();
  const sitemapUrl = `${baseUrl}${sitemapPath}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(sitemapUrl, { signal: controller.signal });
    if (!response.ok) {
      logger.warn(`[SEO:URL-Inspect] Failed to fetch ${sitemapPath} (${response.status})`);
      return [];
    }
    const xml = await response.text();
    const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
    return Array.from(matches, m => m[1].trim());
  } catch (error) {
    logger.warn(`[SEO:URL-Inspect] Error fetching ${sitemapPath}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function gatherCanonicalUrls(): Promise<Map<string, string>> {
  // Map of url -> referringSitemap. Later sitemaps don't overwrite earlier ones.
  const urls = new Map<string, string>();
  for (const path of SITEMAP_PATHS) {
    const list = await fetchSitemapUrls(path);
    for (const url of list) {
      if (!urls.has(url)) urls.set(url, path);
    }
  }
  return urls;
}

function deriveCanonicalMismatch(
  userCanonical: string | undefined,
  googleCanonical: string | undefined,
): boolean {
  if (!userCanonical || !googleCanonical) return false;
  // Normalize trailing slash and protocol for comparison
  const norm = (u: string) => u.replace(/\/+$/, "").toLowerCase();
  return norm(userCanonical) !== norm(googleCanonical);
}

async function inspectOne(
  searchconsole: ReturnType<typeof google.searchconsole>,
  siteUrl: string,
  url: string,
  referringSitemap: string,
): Promise<InspectResult> {
  try {
    const response = await searchconsole.urlInspection.index.inspect({
      requestBody: { inspectionUrl: url, siteUrl },
    });

    const result = response.data.inspectionResult;
    const indexStatus = result?.indexStatusResult;

    const userCanonical = indexStatus?.userCanonical || undefined;
    const googleCanonical = indexStatus?.googleCanonical || undefined;

    let lastCrawl: Date | null = null;
    if (indexStatus?.lastCrawlTime) {
      const parsed = new Date(indexStatus.lastCrawlTime);
      if (!isNaN(parsed.getTime())) lastCrawl = parsed;
    }

    await db
      .insert(seoUrlInspections)
      .values({
        url,
        coverageState: indexStatus?.coverageState ?? null,
        indexingState: indexStatus?.indexingState ?? null,
        pageFetchState: indexStatus?.pageFetchState ?? null,
        robotsTxtState: indexStatus?.robotsTxtState ?? null,
        verdict: indexStatus?.verdict ?? null,
        userCanonical: userCanonical ?? null,
        googleCanonical: googleCanonical ?? null,
        canonicalMismatch: deriveCanonicalMismatch(userCanonical, googleCanonical),
        lastCrawlTime: lastCrawl,
        crawledAs: indexStatus?.crawledAs ?? null,
        referringSitemap,
        rawPayload: result as unknown as Record<string, unknown>,
        inspectedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: seoUrlInspections.url,
        set: {
          coverageState: indexStatus?.coverageState ?? null,
          indexingState: indexStatus?.indexingState ?? null,
          pageFetchState: indexStatus?.pageFetchState ?? null,
          robotsTxtState: indexStatus?.robotsTxtState ?? null,
          verdict: indexStatus?.verdict ?? null,
          userCanonical: userCanonical ?? null,
          googleCanonical: googleCanonical ?? null,
          canonicalMismatch: deriveCanonicalMismatch(userCanonical, googleCanonical),
          lastCrawlTime: lastCrawl,
          crawledAs: indexStatus?.crawledAs ?? null,
          referringSitemap,
          rawPayload: result as unknown as Record<string, unknown>,
          inspectedAt: new Date(),
        },
      });

    return { url, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { url, ok: false, error: message };
  }
}

export interface UrlInspectionRunSummary {
  totalUrls: number;
  inspected: number;
  failed: number;
  skipped: number;
  errors: Array<{ url: string; error: string }>;
  durationMs: number;
}

export async function collectUrlInspections(options?: {
  limit?: number;
  onlyMissing?: boolean;
}): Promise<UrlInspectionRunSummary> {
  const start = Date.now();
  const summary: UrlInspectionRunSummary = {
    totalUrls: 0,
    inspected: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    durationMs: 0,
  };

  if (!isConfigured()) {
    logger.warn("[SEO:URL-Inspect] Google API not configured, skipping");
    summary.durationMs = Date.now() - start;
    return summary;
  }

  const auth = getAuth();
  const searchconsole = google.searchconsole({ version: "v1", auth });
  const siteUrl = config.GSC_SITE_URL || "sc-domain:costabravarentaboat.com";

  const urlsMap = await gatherCanonicalUrls();
  let urls = Array.from(urlsMap.entries());
  summary.totalUrls = urls.length;

  if (options?.onlyMissing) {
    const existing = await db.select({ url: seoUrlInspections.url }).from(seoUrlInspections);
    const seen = new Set(existing.map(r => r.url));
    urls = urls.filter(([url]) => !seen.has(url));
  }

  if (typeof options?.limit === "number" && options.limit >= 0) {
    urls = urls.slice(0, options.limit);
  }

  logger.info(`[SEO:URL-Inspect] Inspecting ${urls.length} URLs (${urlsMap.size} known canonical)`);

  for (const [url, referringSitemap] of urls) {
    const result = await inspectOne(searchconsole, siteUrl, url, referringSitemap);
    if (result.ok) {
      summary.inspected += 1;
    } else {
      summary.failed += 1;
      summary.errors.push({ url, error: result.error ?? "unknown" });
      logger.warn("[SEO:URL-Inspect] Inspect failed", { url, error: result.error });
    }
    await new Promise(resolve => setTimeout(resolve, INSPECT_PACING_MS));
  }

  summary.skipped = summary.totalUrls - urls.length;
  summary.durationMs = Date.now() - start;

  logger.info("[SEO:URL-Inspect] Run complete", {
    total: summary.totalUrls,
    inspected: summary.inspected,
    failed: summary.failed,
    skipped: summary.skipped,
    durationMs: summary.durationMs,
  });

  return summary;
}
