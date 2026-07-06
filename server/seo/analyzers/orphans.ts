// Orphan page detector -- finds pages with no internal links pointing to them
import { db } from "../../db";
import { seoLinks } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";

// Key pages that MUST be internally linked. Canonical /es/ paths (Spanish
// slugs from shared/i18n-routes.ts) — the site serves every page under a
// language prefix since the i18n migration, so bare paths never match the
// real internal links and would flag everything as orphan.
const KNOWN_PAGES = [
  "/es/", "/es/precios", "/es/faq", "/es/galeria", "/es/rutas", "/es/blog",
  "/es/testimonios", "/es/tarjetas-regalo", "/es/destinos",
  "/es/barcos-sin-licencia", "/es/barcos-con-licencia",
  "/es/alquiler-barcos-blanes", "/es/alquiler-barcos-lloret-de-mar",
  "/es/alquiler-barcos-tossa-de-mar", "/es/alquiler-barcos-cerca-barcelona",
  "/es/alquiler-barcos-costa-brava",
  "/es/alquiler-barcos-malgrat-de-mar", "/es/alquiler-barcos-santa-susanna",
  "/es/alquiler-barcos-calella", "/es/alquiler-barcos-pineda-de-mar",
  "/es/politica-privacidad", "/es/terminos-condiciones", "/es/politica-cookies",
  "/es/condiciones-generales", "/es/accesibilidad",
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
