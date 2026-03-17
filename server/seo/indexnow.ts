// IndexNow API client for instant indexing notifications
import { logger } from "../lib/logger";
import { SEO_CONFIG } from "./config";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";

// Batch notify IndexNow of URL changes (max 10,000 per call)
export async function notifyIndexNow(urls: string[]): Promise<void> {
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
      logger.info(`[SEO:IndexNow] Notified ${fullUrls.length} URLs`);
    } else {
      logger.warn(`[SEO:IndexNow] Failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    logger.warn("[SEO:IndexNow] Request failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Notify for a single page change
export async function notifyPageChanged(path: string): Promise<void> {
  await notifyIndexNow([path]);
}
