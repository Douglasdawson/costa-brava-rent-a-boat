import { db } from "../../db";
import { seoHealthChecks, seoPages, seoAlerts } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";
import { lt } from "drizzle-orm";

const SITEMAP_PATHS = [
  "/sitemap-pages.xml",
  "/sitemap-boats.xml",
  "/sitemap-blog.xml",
  "/sitemap-destinations.xml",
];

interface HealthResult {
  url: string;
  status: number;
  loadTimeMs: number;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  hasCanonical: boolean;
  hasHreflang: boolean;
  hasSchemaOrg: boolean;
  issues: Array<{ type: string; detail: string }>;
}

async function crawlUrl(url: string): Promise<HealthResult> {
  const start = Date.now();
  const issues: Array<{ type: string; detail: string }> = [];

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "SEOEngine-HealthCheck/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    const loadTimeMs = Date.now() - start;
    const html = await response.text();

    const hasMetaTitle = /<title[^>]*>.+<\/title>/i.test(html);
    const hasMetaDescription = /<meta[^>]*name=["']description["'][^>]*>/i.test(html);
    const hasCanonical = /<link[^>]*rel=["']canonical["'][^>]*>/i.test(html);
    const hasHreflang = /<link[^>]*hreflang=/i.test(html);
    const hasSchemaOrg = /application\/ld\+json/i.test(html);

    if (!hasMetaTitle) issues.push({ type: "missing_title", detail: "No <title> tag found" });
    if (!hasMetaDescription) issues.push({ type: "missing_meta_description", detail: "No meta description found" });
    if (!hasCanonical) issues.push({ type: "missing_canonical", detail: "No canonical link found" });
    if (response.status >= 400) issues.push({ type: "http_error", detail: `HTTP ${response.status}` });
    if (loadTimeMs > 3000) issues.push({ type: "slow_response", detail: `${loadTimeMs}ms (>3s)` });

    return {
      url,
      status: response.status,
      loadTimeMs,
      hasMetaTitle,
      hasMetaDescription,
      hasCanonical,
      hasHreflang,
      hasSchemaOrg,
      issues,
    };
  } catch (error) {
    return {
      url,
      status: 0,
      loadTimeMs: Date.now() - start,
      hasMetaTitle: false,
      hasMetaDescription: false,
      hasCanonical: false,
      hasHreflang: false,
      hasSchemaOrg: false,
      issues: [{ type: "fetch_error", detail: error instanceof Error ? error.message : String(error) }],
    };
  }
}

// Critical pages — kept as a fallback when sitemap discovery fails. Note these
// are bare-path legacy URLs (no /es/ prefix) that 301-redirect to canonical
// /es/... — the previous behaviour. Real check now uses the full sitemap.
const CRITICAL_PAGES_FALLBACK = [
  "/", "/precios", "/faq", "/galeria", "/rutas", "/tarjetas-regalo",
  "/testimonios", "/blog", "/alquiler-barcos-costa-brava",
];

async function fetchSitemapPaths(): Promise<string[]> {
  const baseUrl = SEO_CONFIG.baseUrl;
  const urls = new Set<string>();
  for (const sm of SITEMAP_PATHS) {
    try {
      const r = await fetch(`${baseUrl}${sm}`, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) continue;
      const xml = await r.text();
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        try {
          urls.add(new URL(m[1].trim()).pathname);
        } catch { /* skip malformed */ }
      }
    } catch (err) {
      logger.warn(`[SEO:Health] Sitemap fetch failed ${sm}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return Array.from(urls);
}

/**
 * Trim seo_health_checks to last N days so the dashboard reflects current
 * state, not historical noise from old crawls. Called on every boot run.
 */
async function pruneOldChecks(daysToKeep = 14): Promise<number> {
  const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  const result = await db.delete(seoHealthChecks).where(lt(seoHealthChecks.checkedAt, cutoff));
  // drizzle returns rowCount on PG drivers; default to 0 if not present
  const deleted = (result as unknown as { rowCount?: number }).rowCount ?? 0;
  if (deleted > 0) {
    logger.info(`[SEO:Health] Pruned ${deleted} health_check rows older than ${daysToKeep}d`);
  }
  return deleted;
}

export async function checkSiteHealth(): Promise<void> {
  const baseUrl = SEO_CONFIG.baseUrl;

  // Prune historical noise so the dashboard reflects current state, not
  // crawls from before recent SEO fixes (multi-lang H1, SSR fallback, schema).
  await pruneOldChecks(14).catch(err =>
    logger.warn("[SEO:Health] Prune failed (non-fatal)", {
      error: err instanceof Error ? err.message : String(err),
    })
  );

  // Discover real public URLs from sitemaps. Falls back to a small static list
  // when sitemap fetch fails (network blip during boot run).
  let paths = await fetchSitemapPaths();
  if (paths.length === 0) {
    logger.warn("[SEO:Health] Sitemap discovery returned 0 URLs, using fallback list");
    paths = CRITICAL_PAGES_FALLBACK;
  }

  logger.info(`[SEO:Health] Starting health check for ${paths.length} pages`);

  let totalIssues = 0;
  let criticalIssues = 0;

  for (const path of paths) {
    const url = `${baseUrl}${path}`;
    const result = await crawlUrl(url);

    // Store health check
    await db.insert(seoHealthChecks).values({
      url: path,
      status: result.status,
      loadTimeMs: result.loadTimeMs,
      hasMetaTitle: result.hasMetaTitle,
      hasMetaDescription: result.hasMetaDescription,
      hasCanonical: result.hasCanonical,
      hasHreflang: result.hasHreflang,
      hasSchemaOrg: result.hasSchemaOrg,
      issues: result.issues,
    });

    // Update seoPages table
    await db
      .insert(seoPages)
      .values({
        path,
        status: result.status,
        loadTimeMs: result.loadTimeMs,
        hasSchemaOrg: result.hasSchemaOrg,
        lastCrawled: new Date(),
      })
      .onConflictDoUpdate({
        target: seoPages.path,
        set: {
          status: result.status,
          loadTimeMs: result.loadTimeMs,
          hasSchemaOrg: result.hasSchemaOrg,
          lastCrawled: new Date(),
        },
      });

    // Generate alerts for critical issues
    if (result.status === 0 || result.status >= 500) {
      criticalIssues++;
      await db.insert(seoAlerts).values({
        type: "technical_error",
        severity: "critical",
        title: `Page down: ${path}`,
        message: `${path} returned HTTP ${result.status}. Issues: ${result.issues.map(i => i.detail).join(", ")}`,
        data: result,
        status: "new",
      });
    }

    totalIssues += result.issues.length;

    // Small delay between requests to avoid self-DoS. Tightened from 500ms
    // since we now crawl 200 URLs (200 × 250ms = 50s vs. 100s previously).
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  logger.info(`[SEO:Health] Check complete. ${totalIssues} issues found, ${criticalIssues} critical`);
}
