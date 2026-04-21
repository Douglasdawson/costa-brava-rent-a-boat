import type { Express } from "express";
import { storage } from "../storage";
import { logger } from "../lib/logger";
import { registerRobotsRoutes } from "./robots";
import { requireAdminSession } from "./auth-middleware";
import { SUPPORTED_LANGUAGES, HREFLANG_CODES } from "../../shared/seoConstants";
import type { LangCode } from "../../shared/seoConstants";
import { getLocalizedPath } from "../../shared/i18n-routes";
import type { PageKey } from "../../shared/i18n-routes";
import { getNativeOverride } from "../seo/nativeLanguageOverrides";
// Static destination slugs for sitemap fallback (when DB has no published destinations)
const FALLBACK_DESTINATION_SLUGS = [
  "sa-palomera",
  "cala-sant-francesc",
  "blanes-lloret",
  "blanes-tossa",
  "costa-brava-tour",
];

const getBaseUrl = () => {
  return process.env.BASE_URL || "https://www.costabravarentaboat.com";
};

// Stable lastmod for static pages — computed once at server start (approximates last deploy)
const DEPLOY_DATE = new Date().toISOString().split("T")[0];

// Helper to format a date or timestamp as YYYY-MM-DD for sitemaps
const formatSitemapDate = (date?: Date | string | null): string => {
  if (!date) return DEPLOY_DATE;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return DEPLOY_DATE;
  return d.toISOString().split("T")[0];
};

// Escape XML special characters to produce valid XML
const escapeXml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// Sitemap-eligible languages per page type. ES is always indexable (canonical).
// Home routes are fully i18n-covered in every language, so they index in all 8.
// Everything else (boats, destinations, locations, activities, categories,
// legal, faq) renders ES-only content from the DB — noindexed in non-ES langs
// via seoInjector.computeTranslationIndex, so we exclude them from the sitemap.
const ALL_LANGS: readonly LangCode[] = SUPPORTED_LANGUAGES as readonly LangCode[];
const ES_ONLY: readonly LangCode[] = ["es"];

// Compute sitemap-eligible languages for a blog post. ES is always included.
// Other langs are added only when titleByLang[lang] has real content (mirrors
// the hasTranslation check in seoInjector).
//
// When the post has a NativeLanguageOverride (authored in a non-ES language),
// the native lang + any alsoIndexable locales replace the default ES-primary
// behavior — the ES URL is noindex'd by seoInjector, so we exclude it here.
const indexableLangsForBlogPost = (post: {
  slug: string;
  titleByLang?: Record<string, string> | null;
}): readonly LangCode[] => {
  const override = getNativeOverride(post.slug, "blog");
  if (override) {
    return [override.nativeLang, ...(override.alsoIndexable ?? [])];
  }
  const titleByLang = (post.titleByLang ?? {}) as Record<string, string>;
  const langs: LangCode[] = ["es"];
  for (const lang of SUPPORTED_LANGUAGES as readonly LangCode[]) {
    if (lang === "es") continue;
    const t = titleByLang[lang];
    if (typeof t === "string" && t.trim()) langs.push(lang);
  }
  return langs;
};

// Build xhtml:link alternate tags for the given languages using subdirectory URLs.
// x-default always points to the Spanish (canonical) version.
const buildHreflangLinks = (
  baseUrl: string,
  pageKey: PageKey,
  dynamicParam?: string,
  indexableLangs: readonly LangCode[] = ALL_LANGS,
): string => {
  let links = "";
  let xDefaultPath = getLocalizedPath(pageKey, "es");
  if (dynamicParam) xDefaultPath += `/${dynamicParam}`;
  links += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${xDefaultPath}"/>\n`;

  indexableLangs.forEach(lang => {
    const code = HREFLANG_CODES[lang as keyof typeof HREFLANG_CODES] || lang;
    let path = getLocalizedPath(pageKey, lang);
    if (dynamicParam) path += `/${dynamicParam}`;
    links += `    <xhtml:link rel="alternate" hreflang="${code}" href="${baseUrl}${path}"/>\n`;
  });
  return links;
};

// Build hreflang links for blog posts where each language may have a different slug.
// Only emits alternates for langs that have a real translation.
// For posts with a NativeLanguageOverride, x-default points to the native
// language URL instead of ES.
const buildBlogHreflangLinks = (
  baseUrl: string,
  post: { slug: string; slugByLang?: Record<string, string> | null },
  indexableLangs: readonly LangCode[],
): string => {
  let links = "";
  const override = getNativeOverride(post.slug, "blog");
  const xDefaultLang: LangCode = override ? override.nativeLang : "es";
  const xDefaultSlug = post.slugByLang?.[xDefaultLang] || post.slug;
  links += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${getLocalizedPath("blogDetail", xDefaultLang)}/${xDefaultSlug}"/>\n`;
  indexableLangs.forEach(lang => {
    const code = HREFLANG_CODES[lang as keyof typeof HREFLANG_CODES] || lang;
    const langSlug = post.slugByLang?.[lang] || post.slug;
    links += `    <xhtml:link rel="alternate" hreflang="${code}" href="${baseUrl}${getLocalizedPath("blogDetail", lang)}/${langSlug}"/>\n`;
  });
  return links;
};

// Language-tier priority multipliers: high-traffic languages get full priority,
// secondary languages get a slight reduction to signal content importance to crawlers.
const LANG_PRIORITY_TIER: Record<string, number> = {
  es: 1.0,   // primary language
  en: 0.9,   // high traffic
  fr: 0.9,   // high traffic
  de: 0.9,   // high traffic
  nl: 0.9,   // high traffic
  ca: 0.7,   // lower traffic
  it: 0.7,   // lower traffic
  ru: 0.7,   // lower traffic
};

const getLanguagePriority = (basePriority: string, lang: string): string => {
  const base = parseFloat(basePriority);
  const tier = LANG_PRIORITY_TIER[lang] ?? 0.7;
  // Clamp between 0.1 and 1.0, round to 1 decimal
  const adjusted = Math.min(1.0, Math.max(0.1, Math.round(base * tier * 10) / 10));
  return adjusted.toFixed(1);
};

const generateUrlEntry = (
  baseUrl: string,
  pageKey: PageKey,
  priority: string,
  lastmod: string | null,
  changefreq?: string,
  indexableLangs: readonly LangCode[] = ALL_LANGS,
): string => {
  const hreflangLinks = buildHreflangLinks(baseUrl, pageKey, undefined, indexableLangs);
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  const changefreqTag = changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : "";
  let urls = "";

  indexableLangs.forEach(lang => {
    const path = getLocalizedPath(pageKey, lang);
    const langPriority = getLanguagePriority(priority, lang);
    urls += `  <url>
    <loc>${baseUrl}${path}</loc>${lastmodTag}
    <priority>${langPriority}</priority>${changefreqTag}
${hreflangLinks}  </url>\n`;
  });

  return urls;
};

// Get the most recent date from a list of date-like values
const getMaxDate = (dates: Array<Date | string | null | undefined>): string => {
  let max = 0;
  for (const d of dates) {
    if (!d) continue;
    const ts = (typeof d === "string" ? new Date(d) : d).getTime();
    if (!isNaN(ts) && ts > max) max = ts;
  }
  return max > 0 ? new Date(max).toISOString().split("T")[0] : DEPLOY_DATE;
};

export function registerSitemapRoutes(app: Express) {
  // Register dynamic robots.txt and llms.txt routes
  registerRobotsRoutes(app);

  // IndexNow key verification
  app.get("/:key.txt", (req, res, next) => {
    const indexNowKey = process.env.INDEXNOW_KEY;
    if (indexNowKey && req.params.key === indexNowKey) {
      res.type("text/plain").send(indexNowKey);
    } else {
      next();
    }
  });

  // Sitemap Index - Main entry point with real lastmod per sub-sitemap
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl();

      // Query DB for real lastmod dates per sub-sitemap
      const [boats, blogPosts, destinations] = await Promise.all([
        storage.getAllBoats(),
        storage.getAllBlogPosts(),
        storage.getAllDestinations(),
      ]);

      const activeBoats = boats.filter(b => b.isActive);
      const publishedPosts = blogPosts.filter(p => p.isPublished);
      const publishedDests = destinations.filter(d => d.isPublished);

      const boatsLastmod = getMaxDate(
        activeBoats.map(b => (b as Record<string, any>).updatedAt || (b as Record<string, any>).createdAt)
      );
      const blogLastmod = getMaxDate(
        publishedPosts.map(p => p.updatedAt || p.publishedAt || p.createdAt)
      );
      const destsLastmod = getMaxDate(
        publishedDests.map(d => (d as Record<string, any>).updatedAt || (d as Record<string, any>).createdAt)
      );

      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${DEPLOY_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-boats.xml</loc>
    <lastmod>${boatsLastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${blogLastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-destinations.xml</loc>
    <lastmod>${destsLastmod}</lastmod>
  </sitemap>
</sitemapindex>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemapIndex);
    } catch (error: unknown) {
      logger.error("Error generating sitemap index", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Pages Sitemap — uses DEPLOY_DATE (stable per server lifecycle, not "today")
  app.get("/sitemap-pages.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl();

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      // Static pages omit <lastmod> — Google recommends only including lastmod
      // when the date is accurate. Static pages don't have real modification dates.
      // changefreq hints help AI crawlers (Perplexity, ChatGPT) understand content freshness.

      // Home is indexable in every language (fully i18n-covered UI + meta).
      sitemap += generateUrlEntry(baseUrl, "home", "1.0", null, "daily", ALL_LANGS);

      // All non-home pages render content sourced from the DB (ES-only) on
      // every locale subdirectory. Only the ES URL is sitemap-eligible;
      // non-ES counterparts are served with robots=noindex + canonical to ES
      // by seoInjector until real translations exist in the DB.
      const locationPages: PageKey[] = [
        "locationBlanes", "locationLloret", "locationTossa", "locationMalgrat",
        "locationSantaSusanna", "locationCalella", "locationPinedaDeMar",
        "locationPalafolls", "locationTordera",
      ];
      locationPages.forEach(pageKey => {
        sitemap += generateUrlEntry(baseUrl, pageKey, "0.7", null, "monthly", ES_ONLY);
      });

      sitemap += generateUrlEntry(baseUrl, "locationBarcelona", "0.7", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "locationCostaBrava", "0.9", null, "monthly", ES_ONLY);

      // Content pages
      sitemap += generateUrlEntry(baseUrl, "gallery", "0.6", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "routes", "0.7", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "giftCards", "0.6", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "pricing", "0.8", null, "weekly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "faq", "0.6", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "testimonials", "0.6", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "about", "0.6", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "destinations", "0.7", null, "monthly", ES_ONLY);

      // Category pages
      sitemap += generateUrlEntry(baseUrl, "categoryLicenseFree", "0.7", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "categoryLicensed", "0.7", null, "monthly", ES_ONLY);

      // Blog index (the listing page itself; individual posts are in sitemap-blog.xml)
      sitemap += generateUrlEntry(baseUrl, "blog", "0.7", null, "weekly", ES_ONLY);

      // Activity pages
      sitemap += generateUrlEntry(baseUrl, "activitySnorkel", "0.7", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "activityFamilies", "0.7", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "activitySunset", "0.7", null, "monthly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "activityFishing", "0.7", null, "monthly", ES_ONLY);

      // Legal pages
      sitemap += generateUrlEntry(baseUrl, "privacyPolicy", "0.3", null, "yearly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "termsConditions", "0.3", null, "yearly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "condicionesGenerales", "0.3", null, "yearly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "cookiesPolicy", "0.3", null, "yearly", ES_ONLY);
      sitemap += generateUrlEntry(baseUrl, "accessibility", "0.3", null, "yearly", ES_ONLY);

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: unknown) {
      logger.error("Error generating pages sitemap", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Boats Sitemap with image tags and XML escaping
  app.get("/sitemap-boats.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl();

      const boats = await storage.getAllBoats();
      const activeBoats = boats.filter(b => b.isActive);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      activeBoats.forEach(boat => {
        const boatSlug = (boat as Record<string, any>).slug || String(boat.id);
        const boatLastmod = formatSitemapDate((boat as Record<string, any>).updatedAt || (boat as Record<string, any>).createdAt);
        const safeName = escapeXml(boat.name);
        // Boat detail content is ES-only in the DB. Non-ES langs are noindex+canonical→ES.
        const boatHreflang = buildHreflangLinks(baseUrl, "boatDetail", boatSlug, ES_ONLY);

        // Build image tags once (shared across all language URLs)
        let imageTags = "";
        if (boat.imageUrl) {
          const rawImageUrl = boat.imageUrl.startsWith("http")
            ? boat.imageUrl
            : `${baseUrl}/object-storage/${boat.imageUrl}`;
          const imageUrl = escapeXml(rawImageUrl);

          imageTags += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>Alquiler barco ${safeName} en Blanes Costa Brava - ${boat.requiresLicense ? "Con licencia" : "Sin licencia"}</image:caption>
      <image:title>${safeName} - Costa Brava Rent a Boat</image:title>
    </image:image>`;
        }

        if (boat.imageGallery && Array.isArray(boat.imageGallery)) {
          boat.imageGallery.forEach((galleryImg, index) => {
            const rawGalleryUrl = galleryImg.startsWith("http")
              ? galleryImg
              : `${baseUrl}/object-storage/${galleryImg}`;
            const galleryUrl = escapeXml(rawGalleryUrl);

            imageTags += `
    <image:image>
      <image:loc>${galleryUrl}</image:loc>
      <image:caption>${safeName} - Foto ${index + 1} - Alquiler barco en Blanes Costa Brava</image:caption>
      <image:title>${safeName} - Galeria ${index + 1} - Costa Brava Rent a Boat</image:title>
    </image:image>`;
          });
        }

        // Emit only the ES URL (non-ES are noindexed, so excluding them from
        // sitemap keeps Search Console clean of "indexed but noindex" warnings).
        ES_ONLY.forEach(lang => {
          const boatPath = getLocalizedPath("boatDetail", lang) + `/${boatSlug}`;
          const boatPriority = getLanguagePriority("0.8", lang);
          sitemap += `  <url>
    <loc>${baseUrl}${boatPath}</loc>
    <lastmod>${boatLastmod}</lastmod>
    <priority>${boatPriority}</priority>
    <changefreq>weekly</changefreq>${imageTags}
${boatHreflang}  </url>
`;
        });
      });

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: unknown) {
      logger.error("Error generating boats sitemap", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Blog Sitemap with XML escaping
  app.get("/sitemap-blog.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl();

      const blogPosts = await storage.getAllBlogPosts();
      const publishedBlogPosts = blogPosts.filter(post => post.isPublished);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      const now = Date.now();
      publishedBlogPosts.forEach(post => {
        const rawDate = post.updatedAt || post.publishedAt || post.createdAt;
        const postDate = formatSitemapDate(rawDate);
        const ageMs = rawDate ? now - new Date(String(rawDate)).getTime() : Infinity;
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const priority = ageDays < 30 ? "0.9" : ageDays < 90 ? "0.8" : "0.7";
        const blogChangefreq = ageDays < 30 ? "weekly" : ageDays < 90 ? "monthly" : "yearly";

        // Blog posts opt into non-ES langs only when titleByLang[lang] has real
        // translated content; everything else defaults to ES-only.
        const postLangs = indexableLangsForBlogPost(post as { slug: string; titleByLang?: Record<string, string> | null });
        const postHreflang = buildBlogHreflangLinks(baseUrl, post, postLangs);

        // Build image tag if featured image exists (with XML escaping)
        let imageTag = "";
        if (post.featuredImage) {
          const rawImageUrl = post.featuredImage.startsWith("http")
            ? post.featuredImage
            : `${baseUrl}/object-storage/${post.featuredImage}`;

          const imageUrl = escapeXml(rawImageUrl);
          const safeTitle = escapeXml(post.title);

          imageTag = `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>${safeTitle} - Blog Costa Brava Rent a Boat</image:caption>
      <image:title>${safeTitle}</image:title>
    </image:image>`;
        }

        // Emit one <url> only for sitemap-eligible langs (ES + translated).
        postLangs.forEach(lang => {
          const postSlug = (post as Record<string, unknown>).slugByLang
            ? ((post as Record<string, unknown>).slugByLang as Record<string, string>)[lang] || post.slug
            : post.slug;
          const blogPath = getLocalizedPath("blogDetail", lang) + `/${postSlug}`;
          const blogPriority = getLanguagePriority(priority, lang);
          sitemap += `  <url>
    <loc>${baseUrl}${blogPath}</loc>
    <lastmod>${postDate}</lastmod>
    <priority>${blogPriority}</priority>
    <changefreq>${blogChangefreq}</changefreq>${imageTag}
${postHreflang}  </url>
`;
        });
      });

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: unknown) {
      logger.error("Error generating blog sitemap", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Destinations Sitemap with image tags and XML escaping
  // Uses DB destinations if available, otherwise falls back to boatRoutes static data
  app.get("/sitemap-destinations.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl();

      const destinations = await storage.getAllDestinations();
      const publishedDestinations = destinations.filter(dest => dest.isPublished);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      if (publishedDestinations.length > 0) {
        // Generate entries from DB destinations
        publishedDestinations.forEach(destination => {
          const destLastmod = formatSitemapDate((destination as Record<string, any>).updatedAt || (destination as Record<string, any>).createdAt);
          const safeName = escapeXml(destination.name);
          // Destination content is ES-only; non-ES langs are noindex+canonical→ES.
          const destHreflang = buildHreflangLinks(baseUrl, "destinationDetail", destination.slug, ES_ONLY);

          // Build image tag once (shared across all language URLs)
          let imageTag = "";
          if (destination.featuredImage) {
            const rawImageUrl = destination.featuredImage.startsWith("http")
              ? destination.featuredImage
              : `${baseUrl}/object-storage/${destination.featuredImage}`;
            const imageUrl = escapeXml(rawImageUrl);

            imageTag = `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>${safeName} - Destino Costa Brava cerca de Blanes</image:caption>
      <image:title>${safeName} - Costa Brava</image:title>
    </image:image>`;
          }

          // Emit only the ES URL — non-ES are noindexed.
          ES_ONLY.forEach(lang => {
            const destPath = getLocalizedPath("destinationDetail", lang) + `/${destination.slug}`;
            const destPriority = getLanguagePriority("0.7", lang);
            sitemap += `  <url>
    <loc>${baseUrl}${destPath}</loc>
    <lastmod>${destLastmod}</lastmod>
    <priority>${destPriority}</priority>
    <changefreq>monthly</changefreq>${imageTag}
${destHreflang}  </url>
`;
          });
        });
      } else {
        // Fallback: generate entries from static destination slugs (ES-only).
        FALLBACK_DESTINATION_SLUGS.forEach(slug => {
          const destHreflang = buildHreflangLinks(baseUrl, "destinationDetail", slug, ES_ONLY);

          ES_ONLY.forEach(lang => {
            const destPath = getLocalizedPath("destinationDetail", lang) + `/${slug}`;
            const destPriority = getLanguagePriority("0.7", lang);
            sitemap += `  <url>
    <loc>${baseUrl}${destPath}</loc>
    <lastmod>${DEPLOY_DATE}</lastmod>
    <priority>${destPriority}</priority>
    <changefreq>monthly</changefreq>
${destHreflang}  </url>
`;
          });
        });
      }

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: unknown) {
      logger.error("Error generating destinations sitemap", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // CWV summary — admin dashboard for Core Web Vitals (last 7 days)
  app.get("/api/admin/cwv-summary", requireAdminSession, async (_req, res) => {
    try {
      const { getCwvSummary } = await import("../seo/collectors/cwv");
      const summary = await getCwvSummary();

      let hasAlert = false;
      for (const page of summary) {
        for (const metric of Object.values(page.metrics)) {
          if (metric.rating === "poor") {
            hasAlert = true;
            break;
          }
        }
        if (hasAlert) break;
      }

      res.json({ summary, hasAlert });
    } catch (error: unknown) {
      logger.error("Error fetching CWV summary", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error al obtener resumen de CWV" });
    }
  });

  // CWV beacon — receives Core Web Vitals data from client (via navigator.sendBeacon)
  app.post("/api/cwv-beacon", async (req, res) => {
    try {
      const body = req.body;
      if (!body || typeof body !== "object") {
        return res.status(204).end(); // silently accept malformed beacons
      }
      const { page, name, value, rating, deviceType, navigationType, connectionType } = body;
      if (!page || !name || typeof value !== "number" || !isFinite(value)) {
        return res.status(204).end();
      }
      const validMetrics = ["CLS", "LCP", "INP", "TTFB", "FCP"];
      if (!validMetrics.includes(name)) {
        return res.status(204).end();
      }
      const { recordCwvBeacon } = await import("../seo/collectors/cwv");
      await recordCwvBeacon({ page, name, value, rating, deviceType, navigationType, connectionType });
      res.status(204).end();
    } catch (error) {
      logger.warn("CWV beacon recording failed", { error: error instanceof Error ? error.message : String(error) });
      res.status(204).end(); // never return 500 for beacons — they're fire-and-forget
    }
  });
}
