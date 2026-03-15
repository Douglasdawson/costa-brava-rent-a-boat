import { db } from "../../db";
import { seoHealthChecks, seoPages, seoAlerts } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";

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

// Critical pages to always check
const CRITICAL_PAGES = [
  "/",
  "/reservar",
  "/flota",
  "/precios",
  "/faq",
  "/contacto",
  "/galeria",
  "/rutas",
  "/tarjetas-regalo",
  "/testimonios",
  "/blog",
  "/blanes",
  "/lloret-de-mar",
  "/tossa-de-mar",
  "/barcelona",
  "/alquiler-barcos-costa-brava",
];

export async function checkSiteHealth(): Promise<void> {
  const baseUrl = SEO_CONFIG.baseUrl;
  logger.info(`[SEO:Health] Starting health check for ${CRITICAL_PAGES.length} pages`);

  let totalIssues = 0;
  let criticalIssues = 0;

  for (const path of CRITICAL_PAGES) {
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

    // Small delay between requests to avoid self-DoS
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  logger.info(`[SEO:Health] Check complete. ${totalIssues} issues found, ${criticalIssues} critical`);
}
