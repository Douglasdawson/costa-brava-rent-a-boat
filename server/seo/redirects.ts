// Dynamic redirect management
import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { seoRedirects } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { getLocalizedPath, isValidLang, resolveSlug } from "../../shared/i18n-routes";
import type { PageKey } from "../../shared/i18n-routes";

// In-memory cache for redirects (refreshed every 1 minute)
let redirectCache: Map<string, { toPath: string; statusCode: number }> = new Map();
let cacheLastRefresh = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

async function refreshCache(): Promise<void> {
  try {
    const redirects = await db.select().from(seoRedirects);
    const newCache = new Map<string, { toPath: string; statusCode: number }>();
    for (const r of redirects) {
      newCache.set(r.fromPath, { toPath: r.toPath, statusCode: r.statusCode });
    }
    redirectCache = newCache;
    cacheLastRefresh = Date.now();
    detectAndFlattenChains();
  } catch (error) {
    logger.warn("[SEO:Redirects] Cache refresh failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Detect and flatten redirect chains (A -> B -> C becomes A -> C)
function detectAndFlattenChains(): void {
  for (const [fromPath, redirect] of redirectCache) {
    const next = redirectCache.get(redirect.toPath);
    if (next) {
      logger.warn("[SEO:Redirects] Chain detected and flattened", {
        from: fromPath,
        via: redirect.toPath,
        to: next.toPath,
      });
      redirect.toPath = next.toPath;
    }
  }
}

// Validate a redirect before creating it
export function validateRedirect(fromPath: string, toPath: string): { valid: boolean; error?: string } {
  if (fromPath === toPath) {
    return { valid: false, error: "fromPath and toPath must be different (would create a loop)" };
  }
  if (toPath.startsWith("/api/")) {
    return { valid: false, error: "toPath must not point to an API route" };
  }
  if (redirectCache.has(toPath)) {
    return { valid: false, error: `toPath "${toPath}" is already a redirect source (would create a chain)` };
  }
  return { valid: true };
}

// Express middleware for dynamic redirects
export function redirectMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only check GET/HEAD requests for non-API paths. HEAD is included so that
    // link-preflight tooling (curl -I, uptime checkers, headless auditors)
    // sees the same 301 status as a real browser navigation.
    if (!["GET", "HEAD"].includes(req.method) || req.path.startsWith("/api")) {
      return next();
    }

    // Handle ?lang= query param redirects (legacy URLs from before i18n subdirectory migration)
    const langParam = req.query.lang as string;
    if (langParam && isValidLang(langParam)) {
      const pathWithoutQuery = req.path;

      // Root with ?lang= -> /{lang}/
      let slug = pathWithoutQuery.replace(/^\//, "");
      if (slug === "") {
        return res.redirect(301, `/${langParam}/`);
      }

      // If the path already has a valid lang prefix, strip it so we can re-localize.
      // Example: /es/alquiler-barcos-blanes?lang=fr -> treat slug as "alquiler-barcos-blanes"
      const firstSegment = slug.split("/")[0];
      if (isValidLang(firstSegment)) {
        slug = slug.substring(firstSegment.length + 1); // +1 for the trailing slash
        if (slug === "") {
          return res.redirect(301, `/${langParam}/`);
        }
      }

      const resolved = resolveSlug(slug);
      if (resolved) {
        const newPath = getLocalizedPath(resolved.pageKey as PageKey, langParam);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.redirect(301, newPath);
      }

      // Dynamic routes: /barco/slug?lang=fr -> /fr/bateau/slug
      const segments = slug.split("/");
      if (segments.length >= 2) {
        const prefixResolved = resolveSlug(segments[0]);
        if (prefixResolved) {
          const param = segments.slice(1).join("/");
          const newPath = getLocalizedPath(prefixResolved.pageKey as PageKey, langParam) + `/${param}`;
          res.set('Cache-Control', 'public, max-age=31536000, immutable');
          return res.redirect(301, newPath);
        }
      }

      // Fallback: just prepend the lang code
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      return res.redirect(301, `/${langParam}/${slug}`);
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

      if (redirect.statusCode === 301) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
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
    // Old destination URLs -> ES subdirectory
    "/destino/blanes": getLocalizedPath("locationBlanes", "es"),
    "/destino/lloret-de-mar": getLocalizedPath("locationLloret", "es"),
    "/destino/tossa-de-mar": getLocalizedPath("locationTossa", "es"),
    "/categoria/sin-licencia": getLocalizedPath("categoryLicenseFree", "es"),
    "/categoria/con-licencia": getLocalizedPath("categoryLicensed", "es"),
    "/copia-de-embarcaciones": getLocalizedPath("categoryLicenseFree", "es"),
    "/copy-of-extras": getLocalizedPath("pricing", "es"),
    "/copy-of-hoteles-y-alojamientos": getLocalizedPath("locationBlanes", "es"),
    "/motos-de-agua": getLocalizedPath("categoryLicenseFree", "es"),
    "/alquiler-con-licencia": getLocalizedPath("categoryLicensed", "es"),

    // Old boat detail URLs -> ES boat detail
    "/barco-sin-licencia-blanes-astec-400": getLocalizedPath("boatDetail", "es") + "/astec-400",
    "/barco-sin-licencia-blanes-solar-450": getLocalizedPath("boatDetail", "es") + "/solar-450",
    "/barco-sin-licencia-blanes-remus-450": getLocalizedPath("boatDetail", "es") + "/remus-450",
    "/barco-sin-licencia-blanes-astec-450": getLocalizedPath("boatDetail", "es") + "/astec-480",
    "/barco-con-licencia-blanes-pacific-craft-625": getLocalizedPath("boatDetail", "es") + "/pacific-craft-625",
    "/barco-con-licencia-blanes-trimarchi-57-s": getLocalizedPath("boatDetail", "es") + "/trimarchi-57s",
    "/barco-con-licencia-blanes-mingolla-brava-19": getLocalizedPath("boatDetail", "es") + "/mingolla-brava-19",
    "/excursiones-privadas-con-patron-blanes": getLocalizedPath("categoryLicensed", "es"),
    "/excursiones-moto-agua": getLocalizedPath("categoryLicenseFree", "es"),
    "/condiciones-generales-alquiler": getLocalizedPath("condicionesGenerales", "es"),
    "/preguntas-frequentes": getLocalizedPath("faq", "es"),
    "/fuegos-artificiales-blanes-2025": getLocalizedPath("blog", "es"),

    // Old Wix paths with /fr/, /en/, /ca/ prefix -> correct language subdirectory
    "/fr/fuegos-artificiales-blanes-2025": getLocalizedPath("blog", "fr"),
    "/ca/fuegos-artificiales-blanes-2025": getLocalizedPath("blog", "ca"),
    "/ca/barco-sin-licencia-blanes-astec-400": getLocalizedPath("boatDetail", "ca") + "/astec-400",
    "/ca/condiciones-de-reserva": getLocalizedPath("condicionesGenerales", "ca"),
    "/fr/excursion-barco-privado": getLocalizedPath("categoryLicensed", "fr"),
    "/fr/copy-of-hoteles-y-alojamientos": getLocalizedPath("locationBlanes", "fr"),
    "/en/copy-of-hoteles-y-alojamientos": getLocalizedPath("locationBlanes", "en"),
    "/en/barco-sin-licencia-blanes-solar-450": getLocalizedPath("boatDetail", "en") + "/solar-450",
    "/barco-mingolla-brava-19": getLocalizedPath("boatDetail", "es") + "/mingolla-brava-19",
    "/fr/barco-con-licencia-blanes-pacific-craft-625": getLocalizedPath("boatDetail", "fr") + "/pacific-craft-625",
    "/fr/politica-de-privacidad": getLocalizedPath("privacyPolicy", "fr"),
    "/ca/beneteau-flyer-5-5": getLocalizedPath("categoryLicensed", "ca"),
    "/en/barco-con-licencia-blanes-pacific-craft-625": getLocalizedPath("boatDetail", "en") + "/pacific-craft-625",
    "/fr/barco-sin-licencia-blanes-solar-450": getLocalizedPath("boatDetail", "fr") + "/solar-450",
    "/en/motos-de-agua": getLocalizedPath("categoryLicenseFree", "en"),
    "/en/nota-legal": getLocalizedPath("privacyPolicy", "en"),
    "/fr/copia-de-embarcaciones": getLocalizedPath("categoryLicenseFree", "fr"),
    "/fr/beneteau-flyer-5-5": getLocalizedPath("categoryLicensed", "fr"),
    "/en/condiciones-de-reserva": getLocalizedPath("condicionesGenerales", "en"),
    "/fr/motos-de-agua": getLocalizedPath("categoryLicenseFree", "fr"),
    "/ca/copy-of-extras": getLocalizedPath("pricing", "ca"),
    "/blank": getLocalizedPath("home", "es"),
    "/barco-sin-licencia-solar-450-blanes": getLocalizedPath("boatDetail", "es") + "/solar-450",
    "/excursion-barco-privado": getLocalizedPath("categoryLicensed", "es"),
    "/condiciones-de-reserva": getLocalizedPath("condicionesGenerales", "es"),
    "/es/condiciones-de-reserva": getLocalizedPath("condicionesGenerales", "es"),
    "/es/motos-de-agua": getLocalizedPath("categoryLicenseFree", "es"),
    "/nota-legal": getLocalizedPath("privacyPolicy", "es"),
    "/beneteau-flyer-5-5": getLocalizedPath("categoryLicensed", "es"),

    // Currently indexed bare paths (no lang prefix) -> ES subdirectory
    "/alquiler-barcos-blanes": getLocalizedPath("locationBlanes", "es"),
    "/alquiler-barcos-lloret-de-mar": getLocalizedPath("locationLloret", "es"),
    "/alquiler-barcos-tossa-de-mar": getLocalizedPath("locationTossa", "es"),
    "/alquiler-barcos-malgrat-de-mar": getLocalizedPath("locationMalgrat", "es"),
    "/alquiler-barcos-santa-susanna": getLocalizedPath("locationSantaSusanna", "es"),
    "/alquiler-barcos-calella": getLocalizedPath("locationCalella", "es"),
    "/alquiler-barcos-pineda-de-mar": getLocalizedPath("locationPinedaDeMar", "es"),
    "/alquiler-barcos-palafolls": getLocalizedPath("locationPalafolls", "es"),
    "/alquiler-barcos-tordera": getLocalizedPath("locationTordera", "es"),
    "/alquiler-barcos-cerca-barcelona": getLocalizedPath("locationBarcelona", "es"),
    "/alquiler-barcos-costa-brava": getLocalizedPath("locationCostaBrava", "es"),
    "/precios": getLocalizedPath("pricing", "es"),
    "/privacy-policy": getLocalizedPath("privacyPolicy", "es"),
    "/blog": getLocalizedPath("blog", "es"),
    "/faq": getLocalizedPath("faq", "es"),
    "/barcos-sin-licencia": getLocalizedPath("categoryLicenseFree", "es"),
    "/barcos-con-licencia": getLocalizedPath("categoryLicensed", "es"),
    "/galeria": getLocalizedPath("gallery", "es"),
    "/rutas": getLocalizedPath("routes", "es"),
    "/testimonios": getLocalizedPath("testimonials", "es"),
    "/tarjetas-regalo": getLocalizedPath("giftCards", "es"),
    "/about": getLocalizedPath("about", "es"),
    "/sobre-nosotros": getLocalizedPath("about", "es"),
    "/accesibilidad": getLocalizedPath("accessibility", "es"),
    "/terms-conditions": getLocalizedPath("termsConditions", "es"),
    "/cookies-policy": getLocalizedPath("cookiesPolicy", "es"),
    "/condiciones-generales": getLocalizedPath("condicionesGenerales", "es"),

    // Activity pages (bare paths -> ES subdirectory)
    "/excursion-snorkel-barco-blanes": getLocalizedPath("activitySnorkel", "es"),
    "/barco-familias-costa-brava": getLocalizedPath("activityFamilies", "es"),
    "/sunset-boat-trip-blanes": getLocalizedPath("activitySunset", "es"),
    "/pesca-barco-blanes": getLocalizedPath("activityFishing", "es"),

    // English landing pages -> EN subdirectory
    "/boat-rental-blanes": getLocalizedPath("locationBlanes", "en"),
    "/boat-rental-costa-brava": getLocalizedPath("locationCostaBrava", "en"),

    "/login": getLocalizedPath("login", "es"),

    // Broken CA/FR URLs with Spanish-style slugs (from GSC 404 report 2026-04-17)
    "/ca/blog/alquiler-barco-costa-brava-guia-completa": "/ca/blog/alquiler-barco-sin-licencia-blanes-guia",
    "/ca/barco-con-licencia-blanes-pacific-craft-625": "/ca/vaixell/pacific-craft-625",
    "/fr/barco-con-licencia-blanes-trimarchi-57-s": "/fr/bateau/trimarchi-57s",
    "/ca/excursiones-moto-agua": "/ca/vaixell-sense-llicencia",
    "/ca/barco-rodman-todo-incluido-blanes": "/ca/vaixell-amb-llicencia",
    "/ca/barco-sin-licencia-blanes-remus-450": "/ca/vaixell/remus-450",
    "/ca/barco-sin-licencia-blanes-astec-450": "/ca/vaixell/astec-480",

    // Blog posts with outdated slugs (2026-04-17 audit)
    "/es/blog/snorkel-costa-brava-mejores-spots-blanes": "/es/blog/snorkel-buceo-costa-brava-barco",
    "/fr/blog/snorkel-costa-brava-mejores-spots-blanes": "/fr/blog/snorkel-buceo-costa-brava-barco",
    "/en/blog/snorkel-costa-brava-mejores-spots-blanes": "/en/blog/snorkel-buceo-costa-brava-barco",
    "/nl/blog/alquiler-barco-costa-brava-guia-completa": "/nl/blog/alquiler-barco-sin-licencia-blanes-guia",
    "/es/blog/precios-alquiler-barcos-blanes-2026": "/es/blog/cuanto-cuesta-alquilar-barco-blanes-precios",
    "/es/blog/alquiler-barco-costa-brava-guia-completa": "/es/blog/alquiler-barco-sin-licencia-blanes-guia",
    "/es/blog/alquiler-barcos-sin-licencia-blanes-guia": "/es/blog/alquiler-barco-sin-licencia-blanes-guia",

    // Retired boat (Beneteau Flyer 5.5) -> category licensed
    "/es/barco/beneteau-flyer-5-5": "/es/barcos-con-licencia",
    "/en/boat/beneteau-flyer-5-5": "/en/boats-with-license",
    "/fr/bateau/beneteau-flyer-5-5": "/fr/bateau-avec-permis",
    "/de/boot/beneteau-flyer-5-5": "/de/boote-mit-fuehrerschein",
    "/ca/vaixell/beneteau-flyer-5-5": "/ca/vaixell-amb-llicencia",
    "/nl/boot/beneteau-flyer-5-5": "/nl/boot-met-vaarbewijs",
    "/it/barca/beneteau-flyer-5-5": "/it/barca-con-patente",
    "/ru/lodka/beneteau-flyer-5-5": "/ru/lodka-s-litsenziei",

    // Common contact URLs -> localized about page
    "/contacto": "/es/sobre-nosotros",
    "/es/contacto": "/es/sobre-nosotros",
    "/contact": "/en/about",
    "/en/contact": "/en/about",
    "/fr/contact": "/fr/a-propos",
    "/de/kontakt": "/de/ueber-uns",
    "/it/contatto": "/it/chi-siamo",
    "/nl/contact": "/nl/over-ons",

    // Localized FAQ variants (UX: users type in their language)
    "/es/preguntas-frecuentes": "/es/faq",
    "/en/frequently-asked-questions": "/en/faq",
    "/en/questions": "/en/faq",
    "/fr/questions-frequentes": "/fr/faq",
    "/fr/questions-frequemment-posees": "/fr/faq",
    "/de/haeufig-gestellte-fragen": "/de/faq",
    "/nl/veelgestelde-vragen": "/nl/faq",
    "/it/domande-frequenti": "/it/faq",
    "/ca/preguntes-frequents": "/ca/faq",
    "/ru/chasto-zadavaemye-voprosy": "/ru/faq",
    "/preguntas-frecuentes": "/es/faq",
    // "/preguntas-frequentes" (typo) ya cubierto arriba en línea 174
    "/veelgestelde-vragen": "/nl/faq",
    "/domande-frequenti": "/it/faq",

    // Wix legacy 'copy-of-*' variants in non-ES langs
    "/fr/copy-of-actividades-terrestres": "/fr/location-bateau-blanes",
    "/en/copy-of-actividades-terrestres": "/en/boat-rental-blanes",
    "/de/copy-of-actividades-terrestres": "/de/boot-mieten-blanes",
    "/it/copy-of-actividades-terrestres": "/it/noleggio-barca-blanes",
    "/nl/copy-of-actividades-terrestres": "/nl/boot-huren-blanes",
    "/ca/copy-of-actividades-terrestres": "/ca/lloguer-vaixell-blanes",

    // Astec-450 renamed to astec-480 across all languages
    "/en/boat/astec-450": "/en/boat/astec-480",
    "/fr/bateau/astec-450": "/fr/bateau/astec-480",
    "/de/boot/astec-450": "/de/boot/astec-480",
    "/ca/vaixell/astec-450": "/ca/vaixell/astec-480",
    "/nl/boot/astec-450": "/nl/boot/astec-480",
    "/it/barca/astec-450": "/it/barca/astec-480",
    "/ru/lodka/astec-450": "/ru/lodka/astec-480",

    // Legacy unprefixed boat detail URLs -> ES canonical (CRITICAL: these
    // were getting indexed by Google as "primary" instead of /es/barco/X
    // because Google followed cached pre-i18n internal links. Without these
    // 301s, all 9 boat detail pages received zero impressions in GSC for
    // 6 months. Audit 2026-04-28.)
    "/barco/solar-450": "/es/barco/solar-450",
    "/barco/remus-450": "/es/barco/remus-450",
    "/barco/remus-450-ii": "/es/barco/remus-450-ii",
    "/barco/astec-400": "/es/barco/astec-400",
    "/barco/astec-480": "/es/barco/astec-480",
    "/barco/astec-450": "/es/barco/astec-480", // also catches the old astec-450 slug
    "/barco/mingolla-brava-19": "/es/barco/mingolla-brava-19",
    "/barco/trimarchi-57s": "/es/barco/trimarchi-57s",
    "/barco/pacific-craft-625": "/es/barco/pacific-craft-625",
    "/barco/excursion-privada": "/es/barco/excursion-privada",
    "/barco-mirimare-sunrise-7": "/es/categoria/sin-licencia", // discontinued model
  };

  const values = Object.entries(legacyRedirects).map(([from, to]) => ({
    fromPath: from,
    toPath: to,
    statusCode: 301,
    createdBy: "legacy",
  }));

  if (values.length > 0) {
    await db
      .insert(seoRedirects)
      .values(values)
      .onConflictDoNothing();
  }

  logger.info(`[SEO:Redirects] Seeded ${Object.keys(legacyRedirects).length} legacy redirects`);
}
