import type { Express } from "express";
import { storage } from "../storage";

const SUPPORTED_LANGUAGES = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"];

// RFC 5646 language tags with region codes (matches seo-config.ts HREFLANG_CODES)
const HREFLANG_CODES: Record<string, string> = {
  es: "es-ES",
  en: "en-GB",
  ca: "ca-ES",
  fr: "fr-FR",
  de: "de-DE",
  nl: "nl-NL",
  it: "it-IT",
  ru: "ru-RU",
};

const getBaseUrl = (req?: any) => {
  if (req) {
    const protocol = req.protocol || "https";
    const host = req.get("host") || req.get("Host");
    if (host) {
      return `${protocol}://${host}`;
    }
  }
  return process.env.BASE_URL || "https://costabravarentaboat.app";
};

// Helper to format a date or timestamp as YYYY-MM-DD for sitemaps
const formatSitemapDate = (date?: Date | string | null): string => {
  if (!date) return "2026-02-12";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "2026-02-12";
  return d.toISOString().split("T")[0];
};

// Build xhtml:link alternate tags for all supported languages
const buildHreflangLinks = (baseUrl: string, path: string): string => {
  const canonicalPath = path === "/" ? "/" : path;
  let links = "";
  // x-default points to the Spanish (canonical) version
  links += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${canonicalPath}"/>\n`;
  links += `    <xhtml:link rel="alternate" hreflang="${HREFLANG_CODES.es}" href="${baseUrl}${canonicalPath}"/>\n`;
  SUPPORTED_LANGUAGES.forEach(lang => {
    if (lang !== "es") {
      const hreflangCode = HREFLANG_CODES[lang] || lang;
      links += `    <xhtml:link rel="alternate" hreflang="${hreflangCode}" href="${baseUrl}${canonicalPath}?lang=${lang}"/>\n`;
    }
  });
  return links;
};

const generateUrlEntry = (
  baseUrl: string,
  path: string,
  priority: string,
  now: string,
  changeFreq: string = "weekly"
) => {
  const hreflangLinks = buildHreflangLinks(baseUrl, path);
  let urls = "";

  // Canonical (ES) entry with all hreflang alternates
  urls += `  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
${hreflangLinks}  </url>
`;

  // One entry per non-ES language variant, each with hreflang links
  SUPPORTED_LANGUAGES.forEach(lang => {
    if (lang !== "es") {
      const langPath = path === "/" ? `/?lang=${lang}` : `${path}?lang=${lang}`;
      urls += `  <url>
    <loc>${baseUrl}${langPath}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
${hreflangLinks}  </url>
`;
    }
  });

  return urls;
};

export function registerSitemapRoutes(app: Express) {
  // Sitemap Index - Main entry point
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = formatSitemapDate(new Date());

      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-boats.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-destinations.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemapIndex);
    } catch (error: unknown) {
      console.error("Error generating sitemap index:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Pages Sitemap
  app.get("/sitemap-pages.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = formatSitemapDate(new Date());

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      sitemap += generateUrlEntry(baseUrl, "/", "1.0", now, "daily");

      const locationSlugs = ["blanes", "lloret-de-mar", "tossa-de-mar"];
      locationSlugs.forEach(slug => {
        sitemap += generateUrlEntry(baseUrl, `/alquiler-barcos-${slug}`, "0.7", now);
      });

      sitemap += generateUrlEntry(baseUrl, "/galeria", "0.6", now);
      sitemap += generateUrlEntry(baseUrl, "/rutas", "0.7", now);
      sitemap += generateUrlEntry(baseUrl, "/tarjetas-regalo", "0.6", now);
      sitemap += generateUrlEntry(baseUrl, "/faq", "0.6", now);
      sitemap += generateUrlEntry(baseUrl, "/testimonios", "0.6", now);
      sitemap += generateUrlEntry(baseUrl, "/barcos-sin-licencia", "0.7", now);
      sitemap += generateUrlEntry(baseUrl, "/barcos-con-licencia", "0.7", now);
      sitemap += generateUrlEntry(baseUrl, "/privacy-policy", "0.3", now, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/terms-conditions", "0.3", now, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/condiciones-generales", "0.3", now, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/cookies-policy", "0.3", now, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/accesibilidad", "0.3", now, "monthly");

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: unknown) {
      console.error("Error generating pages sitemap:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Boats Sitemap with image tags
  app.get("/sitemap-boats.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const fallbackDate = formatSitemapDate(new Date());

      const boats = await storage.getAllBoats();
      const activeBoats = boats.filter(b => b.isActive);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      activeBoats.forEach(boat => {
        const boatPath = `/barco/${boat.id}`;
        const boatLastmod = formatSitemapDate((boat as any).updatedAt || (boat as any).createdAt) || fallbackDate;

        const boatHreflang = buildHreflangLinks(baseUrl, boatPath);

        sitemap += `  <url>
    <loc>${baseUrl}${boatPath}</loc>
    <lastmod>${boatLastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

        if (boat.imageUrl) {
          const imageUrl = boat.imageUrl.startsWith("http")
            ? boat.imageUrl
            : `${baseUrl}/object-storage/${boat.imageUrl}`;

          sitemap += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>Alquiler barco ${boat.name} en Blanes Costa Brava - ${boat.requiresLicense ? "Con licencia" : "Sin licencia"}</image:caption>
      <image:title>${boat.name} - Costa Brava Rent a Boat</image:title>
    </image:image>`;
        }

        sitemap += `
${boatHreflang}  </url>
`;

        SUPPORTED_LANGUAGES.forEach(lang => {
          if (lang !== "es") {
            sitemap += `  <url>
    <loc>${baseUrl}${boatPath}?lang=${lang}</loc>
    <lastmod>${boatLastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
      console.error("Error generating boats sitemap:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Blog Sitemap
  app.get("/sitemap-blog.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const fallbackDate = formatSitemapDate(new Date());

      const blogPosts = await storage.getAllBlogPosts();
      const publishedBlogPosts = blogPosts.filter(post => post.isPublished);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      sitemap += generateUrlEntry(baseUrl, "/blog", "0.6", fallbackDate);

      const now = Date.now();
      publishedBlogPosts.forEach(post => {
        const rawDate = (post as any).updatedAt || (post as any).publishedAt || (post as any).createdAt;
        const postDate = formatSitemapDate(rawDate) || fallbackDate;
        const ageMs = rawDate ? now - new Date(rawDate).getTime() : Infinity;
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const priority = ageDays < 30 ? "0.9" : ageDays < 90 ? "0.8" : "0.7";
        sitemap += generateUrlEntry(baseUrl, `/blog/${post.slug}`, priority, postDate);
      });

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: unknown) {
      console.error("Error generating blog sitemap:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Destinations Sitemap with image tags
  app.get("/sitemap-destinations.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const fallbackDate = formatSitemapDate(new Date());

      const destinations = await storage.getAllDestinations();
      const publishedDestinations = destinations.filter(dest => dest.isPublished);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      publishedDestinations.forEach(destination => {
        const destPath = `/destinos/${destination.slug}`;
        const destLastmod = formatSitemapDate((destination as any).updatedAt || (destination as any).createdAt) || fallbackDate;

        const destHreflang = buildHreflangLinks(baseUrl, destPath);

        sitemap += `  <url>
    <loc>${baseUrl}${destPath}</loc>
    <lastmod>${destLastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>`;

        if (destination.featuredImage) {
          const imageUrl = destination.featuredImage.startsWith("http")
            ? destination.featuredImage
            : `${baseUrl}/object-storage/${destination.featuredImage}`;

          sitemap += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>${destination.name} - Destino Costa Brava cerca de Blanes</image:caption>
      <image:title>${destination.name} - Costa Brava</image:title>
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
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
${destHreflang}  </url>
`;
          }
        });
      });

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: unknown) {
      console.error("Error generating destinations sitemap:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });
}
