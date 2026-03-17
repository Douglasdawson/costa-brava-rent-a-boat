// Orphan page detector -- finds pages with no internal links pointing to them
import { db } from "../../db";
import { seoLinks } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";

// All known site pages (from sitemap + SPA routes)
const KNOWN_PAGES = [
  "/", "/precios", "/faq", "/galeria", "/rutas", "/blog",
  "/testimonios", "/tarjetas-regalo", "/destinos",
  "/barcos-sin-licencia", "/barcos-con-licencia",
  "/alquiler-barcos-blanes", "/alquiler-barcos-lloret-de-mar",
  "/alquiler-barcos-tossa-de-mar", "/alquiler-barcos-cerca-barcelona",
  "/alquiler-barcos-costa-brava",
  "/privacy-policy", "/terms-conditions", "/cookies-policy",
  "/condiciones-generales", "/accesibilidad",
];

export async function detectOrphanPages(): Promise<string[]> {
  const baseUrl = SEO_CONFIG.baseUrl;

  // Fetch the homepage and extract internal links
  const internalLinks = new Set<string>();

  try {
    // Check main navigation + footer (scan homepage)
    const response = await fetch(`${baseUrl}/`, {
      headers: { "User-Agent": "SEO-Engine-OrphanCheck/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    const html = await response.text();

    // Extract internal links
    const linkRegex = /href=["'](\/[^"']*?)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html)) !== null) {
      const path = match[1].split("?")[0].split("#")[0];
      if (path && path !== "/") {
        internalLinks.add(path);
      }
    }
  } catch (error) {
    logger.warn("[SEO:Orphans] Failed to crawl homepage", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Also check DB for internal links added by the SEO engine
  try {
    const dbLinks = await db.select({ toPage: seoLinks.toPage }).from(seoLinks);
    for (const link of dbLinks) {
      if (link.toPage) internalLinks.add(link.toPage);
    }
  } catch {
    // seoLinks table may be empty
  }

  // Find pages that exist in KNOWN_PAGES but have no internal links
  const orphans = KNOWN_PAGES.filter(page => !internalLinks.has(page));

  logger.info(`[SEO:Orphans] Found ${orphans.length} orphan pages out of ${KNOWN_PAGES.length} known pages`);
  return orphans;
}
