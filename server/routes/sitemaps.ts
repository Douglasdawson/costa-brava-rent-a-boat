import type { Express } from "express";
import { storage } from "../storage";

const SUPPORTED_LANGUAGES = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"];

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

const generateUrlEntry = (
  baseUrl: string,
  path: string,
  priority: string,
  now: string,
  changeFreq: string = "weekly"
) => {
  let urls = "";

  urls += `  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;

  if (path !== "/") {
    SUPPORTED_LANGUAGES.forEach(lang => {
      if (lang !== "es") {
        urls += `  <url>
    <loc>${baseUrl}${path}?lang=${lang}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
      }
    });
  } else {
    SUPPORTED_LANGUAGES.forEach(lang => {
      if (lang !== "es") {
        urls += `  <url>
    <loc>${baseUrl}/?lang=${lang}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
      }
    });
  }

  return urls;
};

export function registerSitemapRoutes(app: Express) {
  // Sitemap Index - Main entry point
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = new Date().toISOString();

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
    } catch (error: any) {
      console.error("Error generating sitemap index:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Pages Sitemap
  app.get("/sitemap-pages.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = new Date().toISOString();

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      sitemap += generateUrlEntry(baseUrl, "/", "1.0", now, "daily");

      const locationSlugs = ["blanes", "lloret-de-mar", "tossa-de-mar"];
      locationSlugs.forEach(slug => {
        sitemap += generateUrlEntry(baseUrl, `/alquiler-barcos-${slug}`, "0.7", now);
      });

      sitemap += generateUrlEntry(baseUrl, "/faq", "0.6", now);
      sitemap += generateUrlEntry(baseUrl, "/barcos-sin-licencia", "0.7", now);
      sitemap += generateUrlEntry(baseUrl, "/barcos-con-licencia", "0.7", now);
      sitemap += generateUrlEntry(baseUrl, "/privacy-policy", "0.3", now, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/terms-conditions", "0.3", now, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/condiciones-generales", "0.3", now, "monthly");
      sitemap += generateUrlEntry(baseUrl, "/cookies-policy", "0.3", now, "monthly");

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: any) {
      console.error("Error generating pages sitemap:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Boats Sitemap with image tags
  app.get("/sitemap-boats.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = new Date().toISOString();

      const boats = await storage.getAllBoats();
      const activeBoats = boats.filter(b => b.isActive);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

      activeBoats.forEach(boat => {
        const boatPath = `/barco/${boat.id}`;

        sitemap += `  <url>
    <loc>${baseUrl}${boatPath}</loc>
    <lastmod>${now}</lastmod>
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
  </url>
`;

        SUPPORTED_LANGUAGES.forEach(lang => {
          if (lang !== "es") {
            sitemap += `  <url>
    <loc>${baseUrl}${boatPath}?lang=${lang}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
          }
        });
      });

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: any) {
      console.error("Error generating boats sitemap:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Blog Sitemap
  app.get("/sitemap-blog.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = new Date().toISOString();

      const blogPosts = await storage.getAllBlogPosts();
      const publishedBlogPosts = blogPosts.filter(post => post.isPublished);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      sitemap += generateUrlEntry(baseUrl, "/blog", "0.6", now);

      publishedBlogPosts.forEach(post => {
        sitemap += generateUrlEntry(baseUrl, `/blog/${post.slug}`, "0.7", now);
      });

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: any) {
      console.error("Error generating blog sitemap:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Destinations Sitemap with image tags
  app.get("/sitemap-destinations.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = new Date().toISOString();

      const destinations = await storage.getAllDestinations();
      const publishedDestinations = destinations.filter(dest => dest.isPublished);

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

      publishedDestinations.forEach(destination => {
        const destPath = `/destinos/${destination.slug}`;

        sitemap += `  <url>
    <loc>${baseUrl}${destPath}</loc>
    <lastmod>${now}</lastmod>
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
  </url>
`;

        SUPPORTED_LANGUAGES.forEach(lang => {
          if (lang !== "es") {
            sitemap += `  <url>
    <loc>${baseUrl}${destPath}?lang=${lang}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
          }
        });
      });

      sitemap += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error: any) {
      console.error("Error generating destinations sitemap:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });
}
