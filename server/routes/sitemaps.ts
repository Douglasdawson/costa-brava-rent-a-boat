import type { Express } from "express";
import { storage } from "../storage";
import { logger } from "../lib/logger";
import { registerRobotsRoutes } from "./robots";
import { requireAdminSession } from "./auth-middleware";
import { SUPPORTED_LANGUAGES, HREFLANG_CODES } from "../../shared/seoConstants";
// Static destination slugs for sitemap fallback (when DB has no published destinations)
const FALLBACK_DESTINATION_SLUGS = [
  "sa-palomera",
  "cala-sant-francesc",
  "blanes-lloret",
  "blanes-tossa",
  "costa-brava-tour",
];

const getBaseUrl = (req?: any) => {
  if (req) {
    const protocol = req.protocol || "https";
    const host = req.get("host") || req.get("Host");
    if (host) {
      return `${protocol}://${host}`;
    }
  }
  return process.env.BASE_URL || "https://costabravarentaboat.com";
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

// Build xhtml:link alternate tags for specified (or all) languages
const buildHreflangLinks = (baseUrl: string, path: string, languages: readonly string[] = SUPPORTED_LANGUAGES): string => {
  const canonicalPath = path === "/" ? "/" : path;
  let links = "";
  // x-default points to the Spanish (canonical) version
  links += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${canonicalPath}"/>\n`;
  if (languages.includes("es")) {
    links += `    <xhtml:link rel="alternate" hreflang="${HREFLANG_CODES.es}" href="${baseUrl}${canonicalPath}"/>\n`;
  }
  languages.forEach(lang => {
    if (lang !== "es") {
      const hreflangCode = HREFLANG_CODES[lang as keyof typeof HREFLANG_CODES] || lang;
      links += `    <xhtml:link rel="alternate" hreflang="${hreflangCode}" href="${baseUrl}${canonicalPath}?lang=${lang}"/>\n`;
    }
  });
  return links;
};

const generateUrlEntry = (
  baseUrl: string,
  path: string,
  priority: string,
  lastmod: string | null,
  languages: readonly string[] = SUPPORTED_LANGUAGES,
  changefreq?: string
) => {
  const hreflangLinks = buildHreflangLinks(baseUrl, path, languages);
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  const changefreqTag = changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : "";
  let urls = "";

  // Canonical (ES) entry with all hreflang alternates
  urls += `  <url>
    <loc>${baseUrl}${path}</loc>${lastmodTag}
    <priority>${priority}</priority>${changefreqTag}
${hreflangLinks}  </url>
`;

  // One entry per non-ES language variant, each with hreflang links
  languages.forEach(lang => {
    if (lang !== "es") {
      const langPath = path === "/" ? `/?lang=${lang}` : `${path}?lang=${lang}`;
      urls += `  <url>
    <loc>${baseUrl}${langPath}</loc>${lastmodTag}
    <priority>${priority}</priority>${changefreqTag}
${hreflangLinks}  </url>
`;
    }
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
      const baseUrl = getBaseUrl(req);

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
      const baseUrl = getBaseUrl(req);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      // Static pages omit <lastmod> — Google recommends only including lastmod
      // when the date is accurate. Static pages don't have real modification dates.
      // changefreq hints help AI crawlers (Perplexity, ChatGPT) understand content freshness.
      sitemap += generateUrlEntry(baseUrl, "/", "1.0", null, SUPPORTED_LANGUAGES, "daily");

      const locationSlugs = ["blanes", "lloret-de-mar", "tossa-de-mar", "malgrat-de-mar", "santa-susanna", "calella"];
      locationSlugs.forEach(slug => {
        sitemap += generateUrlEntry(baseUrl, `/alquiler-barcos-${slug}`, "0.7", null, SUPPORTED_LANGUAGES, "monthly");
      });

      sitemap += generateUrlEntry(baseUrl, "/galeria", "0.6", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/rutas", "0.7", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/tarjetas-regalo", "0.6", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/precios", "0.8", null, SUPPORTED_LANGUAGES, "weekly");
      sitemap += generateUrlEntry(baseUrl, "/alquiler-barcos-cerca-barcelona", "0.7", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/alquiler-barcos-costa-brava", "0.9", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/faq", "0.6", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/testimonios", "0.6", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/about", "0.6", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/destinos", "0.7", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/barcos-sin-licencia", "0.7", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/barcos-con-licencia", "0.7", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/blog", "0.7", null, SUPPORTED_LANGUAGES, "weekly");
      sitemap += generateUrlEntry(baseUrl, "/excursion-snorkel-barco-blanes", "0.7", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/barco-familias-costa-brava", "0.7", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/sunset-boat-trip-blanes", "0.7", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/pesca-barco-blanes", "0.7", null, SUPPORTED_LANGUAGES, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/privacy-policy", "0.3", null, SUPPORTED_LANGUAGES, "yearly");
      sitemap += generateUrlEntry(baseUrl, "/terms-conditions", "0.3", null, SUPPORTED_LANGUAGES, "yearly");
      sitemap += generateUrlEntry(baseUrl, "/condiciones-generales", "0.3", null, SUPPORTED_LANGUAGES, "yearly");
      sitemap += generateUrlEntry(baseUrl, "/cookies-policy", "0.3", null, SUPPORTED_LANGUAGES, "yearly");
      sitemap += generateUrlEntry(baseUrl, "/accesibilidad", "0.3", null, SUPPORTED_LANGUAGES, "yearly");

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
      const baseUrl = getBaseUrl(req);

      const boats = await storage.getAllBoats();
      const activeBoats = boats.filter(b => b.isActive);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      activeBoats.forEach(boat => {
        const boatPath = `/barco/${boat.id}`;
        const boatLastmod = formatSitemapDate((boat as Record<string, any>).updatedAt || (boat as Record<string, any>).createdAt);
        const safeName = escapeXml(boat.name);

        const boatHreflang = buildHreflangLinks(baseUrl, boatPath);

        sitemap += `  <url>
    <loc>${baseUrl}${boatPath}</loc>
    <lastmod>${boatLastmod}</lastmod>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>`;

        if (boat.imageUrl) {
          const rawImageUrl = boat.imageUrl.startsWith("http")
            ? boat.imageUrl
            : `${baseUrl}/object-storage/${boat.imageUrl}`;
          const imageUrl = escapeXml(rawImageUrl);

          sitemap += `
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

            sitemap += `
    <image:image>
      <image:loc>${galleryUrl}</image:loc>
      <image:caption>${safeName} - Foto ${index + 1} - Alquiler barco en Blanes Costa Brava</image:caption>
      <image:title>${safeName} - Galeria ${index + 1} - Costa Brava Rent a Boat</image:title>
    </image:image>`;
          });
        }

        sitemap += `
${boatHreflang}  </url>
`;

        SUPPORTED_LANGUAGES.forEach(lang => {
          if (lang !== "es") {
            sitemap += `  <url>
    <loc>${baseUrl}${boatPath}?lang=${lang}</loc>
    <lastmod>${boatLastmod}</lastmod>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
${boatHreflang}  </url>
`;
          }
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
      const baseUrl = getBaseUrl(req);

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

        const postPath = `/blog/${post.slug}`;
        const postHreflang = buildHreflangLinks(baseUrl, postPath);

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

        // Canonical (ES) entry with image and hreflang
        sitemap += `  <url>
    <loc>${baseUrl}${postPath}</loc>
    <lastmod>${postDate}</lastmod>
    <priority>${priority}</priority>
    <changefreq>${blogChangefreq}</changefreq>${imageTag}
${postHreflang}  </url>
`;

        // Language variant entries
        SUPPORTED_LANGUAGES.forEach(lang => {
          if (lang !== "es") {
            sitemap += `  <url>
    <loc>${baseUrl}${postPath}?lang=${lang}</loc>
    <lastmod>${postDate}</lastmod>
    <priority>${priority}</priority>
    <changefreq>${blogChangefreq}</changefreq>${imageTag}
${postHreflang}  </url>
`;
          }
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
      const baseUrl = getBaseUrl(req);

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
          const destPath = `/destinos/${destination.slug}`;
          const destLastmod = formatSitemapDate((destination as Record<string, any>).updatedAt || (destination as Record<string, any>).createdAt);
          const safeName = escapeXml(destination.name);

          const destHreflang = buildHreflangLinks(baseUrl, destPath);

          sitemap += `  <url>
    <loc>${baseUrl}${destPath}</loc>
    <lastmod>${destLastmod}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>`;

          if (destination.featuredImage) {
            const rawImageUrl = destination.featuredImage.startsWith("http")
              ? destination.featuredImage
              : `${baseUrl}/object-storage/${destination.featuredImage}`;
            const imageUrl = escapeXml(rawImageUrl);

            sitemap += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>${safeName} - Destino Costa Brava cerca de Blanes</image:caption>
      <image:title>${safeName} - Costa Brava</image:title>
    </image:image>`;
          }

          sitemap += `
${destHreflang}  </url>
`;

          SUPPORTED_LANGUAGES.forEach(lang => {
            if (lang !== "es") {
              sitemap += `  <url>
    <loc>${baseUrl}${destPath}?lang=${lang}</loc>
    <lastmod>${destLastmod}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
${destHreflang}  </url>
`;
            }
          });
        });
      } else {
        // Fallback: generate entries from boatRoutes static data
        // These represent the navigable destinations from Blanes
        FALLBACK_DESTINATION_SLUGS.forEach(slug => {
          const destPath = `/destinos/${slug}`;
          const destHreflang = buildHreflangLinks(baseUrl, destPath);

          sitemap += `  <url>
    <loc>${baseUrl}${destPath}</loc>
    <lastmod>${DEPLOY_DATE}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>`;

          sitemap += `
${destHreflang}  </url>
`;

          SUPPORTED_LANGUAGES.forEach(lang => {
            if (lang !== "es") {
              sitemap += `  <url>
    <loc>${baseUrl}${destPath}?lang=${lang}</loc>
    <lastmod>${DEPLOY_DATE}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
${destHreflang}  </url>
`;
            }
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

  // CWV beacon — receives Core Web Vitals data from client
  app.post("/api/cwv-beacon", async (req, res) => {
    try {
      const { page, name, value, rating, deviceType, navigationType, connectionType } = req.body;
      if (!page || !name || typeof value !== "number") {
        return res.status(400).json({ message: "Invalid beacon data" });
      }
      const validMetrics = ["CLS", "LCP", "INP", "TTFB", "FCP"];
      if (!validMetrics.includes(name)) {
        return res.status(400).json({ message: "Invalid metric name" });
      }
      const { recordCwvBeacon } = await import("../seo/collectors/cwv");
      await recordCwvBeacon({ page, name, value, rating, deviceType, navigationType, connectionType });
      res.status(204).end();
    } catch {
      res.status(500).json({ message: "Error recording CWV" });
    }
  });
}
