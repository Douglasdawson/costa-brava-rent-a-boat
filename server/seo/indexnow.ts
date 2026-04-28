// IndexNow API client for instant indexing notifications
import { logger } from "../lib/logger";
import { SEO_CONFIG } from "./config";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";

// Batch notify IndexNow of URL changes (max 10,000 per call)
export async function notifyIndexNow(urls: string[], retryCount = 0): Promise<void> {
  if (!INDEXNOW_KEY) {
    logger.debug("[SEO:IndexNow] Skipped — INDEXNOW_KEY not set");
    return;
  }
  if (urls.length === 0) return;

  const baseUrl = SEO_CONFIG.baseUrl;
  const fullUrls = urls.map(u => u.startsWith("http") ? u : `${baseUrl}${u}`);

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: new URL(baseUrl).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${baseUrl}/${INDEXNOW_KEY}.txt`,
        urlList: fullUrls.slice(0, 10000),
      }),
    });

    if (response.ok || response.status === 202) {
      logger.info("[SEO:IndexNow] Submission successful", { urls: fullUrls.length, status: response.status });
    } else if ((response.status === 429 || response.status >= 500) && retryCount < 1) {
      logger.warn("[SEO:IndexNow] Retrying in 5s", { status: response.status });
      setTimeout(() => notifyIndexNow(urls, retryCount + 1), 5000);
    } else {
      logger.warn("[SEO:IndexNow] Submission failed", { status: response.status, statusText: response.statusText });
    }
  } catch (error) {
    if (retryCount < 1) {
      logger.warn("[SEO:IndexNow] Request failed, retrying in 5s", { error: error instanceof Error ? error.message : String(error) });
      setTimeout(() => notifyIndexNow(urls, retryCount + 1), 5000);
    } else {
      logger.warn("[SEO:IndexNow] Request failed after retry", { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

// Safe wrapper with logging for page change notifications
export async function notifyPageChangedSafe(path: string): Promise<void> {
  try {
    await notifyIndexNow([path]);
  } catch (err) {
    logger.warn("[SEO:IndexNow] Page change notification failed", { err, path });
  }
}

// Notify for a single page change
export async function notifyPageChanged(path: string): Promise<void> {
  await notifyIndexNow([path]);
}

// Batch notify critical pages on deploy (call on startup if INDEXNOW_ON_DEPLOY is set)
export async function notifyCriticalPagesOnDeploy(): Promise<void> {
  const criticalPages = [
    "/", "/barcos-sin-licencia", "/barcos-con-licencia",
    "/alquiler-barcos-blanes", "/alquiler-barcos-costa-brava",
    "/precios", "/faq",
    "/excursion-snorkel-barco-blanes", "/barco-familias-costa-brava",
    "/sunset-boat-trip-blanes", "/pesca-barco-blanes",
  ];
  logger.info("[SEO:IndexNow] Notifying critical pages on deploy", { count: criticalPages.length });
  await notifyIndexNow(criticalPages);
}

/**
 * Fetch all 4 sub-sitemaps and notify IndexNow (Bing, Yandex, Seznam, Naver)
 * about every public URL. Idempotent — safe to run on every boot/cron tick.
 *
 * Designed to run after every Replit Republish + daily, so the search engines
 * that DO accept programmatic re-indexation requests get the freshest signal
 * about the catalog. Google ignores IndexNow, but Bing+Yandex push these into
 * priority crawl queue.
 */
export async function notifyAllSitemapUrls(): Promise<{ found: number; notified: number }> {
  if (!INDEXNOW_KEY) {
    logger.debug("[SEO:IndexNow] Skipped sitemap-wide notify — INDEXNOW_KEY not set");
    return { found: 0, notified: 0 };
  }

  const baseUrl = SEO_CONFIG.baseUrl;
  const subSitemaps = [
    `${baseUrl}/sitemap-pages.xml`,
    `${baseUrl}/sitemap-boats.xml`,
    `${baseUrl}/sitemap-blog.xml`,
    `${baseUrl}/sitemap-destinations.xml`,
  ];

  const allUrls: string[] = [];
  for (const sm of subSitemaps) {
    try {
      const resp = await fetch(sm);
      if (!resp.ok) {
        logger.warn(`[SEO:IndexNow] Sub-sitemap fetch failed ${sm}: ${resp.status}`);
        continue;
      }
      const xml = await resp.text();
      const matches = xml.match(/<loc>([^<]+)<\/loc>/g) ?? [];
      for (const m of matches) {
        const url = m.replace(/<\/?loc>/g, "").trim();
        if (url) allUrls.push(url);
      }
    } catch (err) {
      logger.warn(`[SEO:IndexNow] Sub-sitemap error ${sm}`, { err: err instanceof Error ? err.message : String(err) });
    }
  }

  if (allUrls.length === 0) {
    logger.warn("[SEO:IndexNow] notifyAllSitemapUrls: zero URLs extracted");
    return { found: 0, notified: 0 };
  }

  logger.info("[SEO:IndexNow] Notifying sitemap URLs", { count: allUrls.length });
  await notifyIndexNow(allUrls);
  return { found: allUrls.length, notified: allUrls.length };
}
