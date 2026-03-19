// Dynamic redirect management
import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { seoRedirects } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

// In-memory cache for redirects (refreshed every 5 minutes)
let redirectCache: Map<string, { toPath: string; statusCode: number }> = new Map();
let cacheLastRefresh = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function refreshCache(): Promise<void> {
  try {
    const redirects = await db.select().from(seoRedirects);
    const newCache = new Map<string, { toPath: string; statusCode: number }>();
    for (const r of redirects) {
      newCache.set(r.fromPath, { toPath: r.toPath, statusCode: r.statusCode });
    }
    redirectCache = newCache;
    cacheLastRefresh = Date.now();
  } catch (error) {
    logger.warn("[SEO:Redirects] Cache refresh failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Express middleware for dynamic redirects
export function redirectMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only check GET requests for non-API paths
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      return next();
    }

    // Refresh cache if stale
    if (Date.now() - cacheLastRefresh > CACHE_TTL) {
      await refreshCache();
    }

    const redirect = redirectCache.get(req.path);
    if (redirect) {
      // Track hit asynchronously (don't block response)
      db.update(seoRedirects)
        .set({
          hits: sql`${seoRedirects.hits} + 1`,
          lastHitAt: new Date(),
        })
        .where(eq(seoRedirects.fromPath, req.path))
        .catch(() => {});

      return res.redirect(redirect.statusCode, redirect.toPath);
    }

    next();
  };
}

// Seed initial redirects from the hardcoded list in server/index.ts
export async function seedLegacyRedirects(): Promise<void> {
  // Check if table exists before seeding (prevents startup crash if table is missing)
  try {
    await db.execute(sql`SELECT 1 FROM seo_redirects LIMIT 1`);
  } catch {
    logger.warn("[SEO:Redirects] seo_redirects table not found, skipping seed");
    return;
  }

  const legacyRedirects: Record<string, string> = {
    "/destino/blanes": "/alquiler-barcos-blanes",
    "/destino/lloret-de-mar": "/alquiler-barcos-lloret-de-mar",
    "/destino/tossa-de-mar": "/alquiler-barcos-tossa-de-mar",
    "/categoria/sin-licencia": "/barcos-sin-licencia",
    "/categoria/con-licencia": "/barcos-con-licencia",
    "/copia-de-embarcaciones": "/barcos-sin-licencia",
    "/copy-of-extras": "/precios",
    "/copy-of-hoteles-y-alojamientos": "/alquiler-barcos-blanes",
    "/motos-de-agua": "/barcos-sin-licencia",
    "/alquiler-con-licencia": "/barcos-con-licencia",

    // GSC-discovered old site URLs (March 2026)
    "/barco-sin-licencia-blanes-astec-400": "/barco/astec-400",
    "/barco-sin-licencia-blanes-solar-450": "/barco/solar-450",
    "/barco-sin-licencia-blanes-remus-450": "/barco/remus-450",
    "/barco-sin-licencia-blanes-astec-450": "/barco/astec-480",
    "/barco-con-licencia-blanes-pacific-craft-625": "/barco/pacific-craft-625",
    "/barco-con-licencia-blanes-trimarchi-57-s": "/barco/trimarchi-57s",
    "/barco-con-licencia-blanes-mingolla-brava-19": "/barco/mingolla-brava-19",
    "/excursiones-privadas-con-patron-blanes": "/barcos-con-licencia",
    "/excursiones-moto-agua": "/barcos-sin-licencia",
    "/condiciones-generales-alquiler": "/condiciones-generales",
    "/preguntas-frequentes": "/faq",
    "/fuegos-artificiales-blanes-2025": "/blog",
    "/fr/fuegos-artificiales-blanes-2025": "/blog?lang=fr",
    "/ca/fuegos-artificiales-blanes-2025": "/blog?lang=ca",
    "/ca/barco-sin-licencia-blanes-astec-400": "/barco/astec-400?lang=ca",
    "/ca/condiciones-de-reserva": "/condiciones-generales?lang=ca",
  };

  for (const [from, to] of Object.entries(legacyRedirects)) {
    await db
      .insert(seoRedirects)
      .values({ fromPath: from, toPath: to, statusCode: 301, createdBy: "legacy" })
      .onConflictDoNothing();
  }

  logger.info(`[SEO:Redirects] Seeded ${Object.keys(legacyRedirects).length} legacy redirects (26 total)`);
}
