import type { Express } from "express";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { logger } from "../lib/logger";

const BASE_URL = process.env.BASE_URL || "https://costabravarentaboat.com";

// AI crawler user agents to explicitly allow
const AI_CRAWLERS = [
  "GPTBot", "ChatGPT-User", "Google-Extended", "PerplexityBot",
  "ClaudeBot", "Claude-Web", "Anthropic", "Applebot-Extended",
  "CCBot", "Bytespider", "cohere-ai", "Meta-ExternalAgent",
  "Amazonbot", "YouBot", "Timpibot", "AI2Bot", "Diffbot",
  "ImagesiftBot", "Omgili",
];

// Paths that should always be disallowed
const DISALLOWED_PATHS = [
  "/crm", "/crm/", "/admin", "/admin/", "/login",
  "/onboarding", "/client/dashboard", "/mi-cuenta",
  "/api/", "/cancel/", "/copia-de-*", "/copy-of-*",
];

export function registerRobotsRoutes(app: Express): void {

  // Dynamic robots.txt
  app.get("/robots.txt", (_req, res) => {
    const lines: string[] = [];

    // General crawler rules
    lines.push("User-agent: *");
    lines.push("Allow: /");
    lines.push("Allow: /api/ai-context");
    lines.push("");
    for (const p of DISALLOWED_PATHS) {
      lines.push(`Disallow: ${p}`);
    }
    lines.push("");
    lines.push(`Sitemap: ${BASE_URL}/sitemap.xml`);
    lines.push("");

    // AI crawler explicit allows
    lines.push("# AI Search Optimization — explicit Allow for all known AI crawlers");
    for (const crawler of AI_CRAWLERS) {
      lines.push("");
      lines.push(`User-agent: ${crawler}`);
      lines.push("Allow: /");
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.send(lines.join("\n") + "\n");
  });

  // Serve static llms.txt from client/public with dynamic date injection
  app.get("/llms.txt", (_req, res) => {
    try {
      const llmsPath = path.resolve(process.cwd(), "client/public/llms.txt");
      let content = fs.readFileSync(llmsPath, "utf-8");

      // Inject current date for freshness
      const lastUpdated = new Date().toISOString().split("T")[0];
      content = content.replace(
        /> Last updated: \d{4}-\d{2}-\d{2}/,
        `> Last updated: ${lastUpdated}`,
      );

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.send(content);
    } catch (error) {
      logger.warn("[robots] Failed to read static llms.txt, falling back to dynamic generation", {
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback: minimal dynamic version
      const lastUpdated = new Date().toISOString().split("T")[0];
      const fallback = `# Costa Brava Rent a Boat - Blanes, Costa Brava, Spain

> Last updated: ${lastUpdated}

> The largest boat rental company in Blanes with a fleet of 9 boats. License-free and licensed boats for 4-7 people. Fuel included on all license-free boats. Season: April to October. Based in Puerto de Blanes, Girona, Spain.

## Key Facts

- **Location**: Puerto de Blanes, 17300 Blanes, Girona, Catalonia, Spain
- **Price range**: 70-420 EUR
- **Phone / WhatsApp**: +34 611 500 372
- **Website**: https://costabravarentaboat.com
`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(fallback);
    }
  });

  // Serve static llms-full.txt with dynamic date injection
  app.get("/llms-full.txt", (_req, res) => {
    try {
      const llmsFullPath = path.resolve(process.cwd(), "client/public/llms-full.txt");
      let content = fs.readFileSync(llmsFullPath, "utf-8");

      // Inject current date for freshness
      const lastUpdated = new Date().toISOString().split("T")[0];
      content = content.replace(
        /> Last updated: \d{4}-\d{2}-\d{2}/,
        `> Last updated: ${lastUpdated}`,
      );

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.send(content);
    } catch (error) {
      logger.warn("[robots] Failed to read static llms-full.txt", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(404).send("llms-full.txt not found");
    }
  });

  // Serve .well-known/ai-plugin.json
  app.get("/.well-known/ai-plugin.json", (_req, res) => {
    try {
      const pluginPath = path.resolve(process.cwd(), "client/public/.well-known/ai-plugin.json");
      const content = fs.readFileSync(pluginPath, "utf-8");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.send(content);
    } catch (error) {
      logger.warn("[robots] Failed to read ai-plugin.json", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(404).json({ error: "ai-plugin.json not found" });
    }
  });

  // AI context endpoint — structured JSON-LD for AI agent consumption
  app.get("/api/ai-context", async (_req, res) => {
    try {
      let boats: Array<{name: string; capacity: number; enginePower: string; pricePerHour: number; licenseRequired: boolean}> = [];
      try {
        const allBoats = await storage.getAllBoats();
        boats = allBoats.filter(b => b.isActive).map(b => ({
          name: b.name,
          capacity: b.capacity || 5,
          enginePower: b.enginePower || "15hp",
          pricePerHour: b.pricePerHour ? Number(b.pricePerHour) : 70,
          licenseRequired: b.licenseType !== null && b.licenseType !== "none",
        }));
      } catch {
        // Use empty array if DB unavailable
      }

      const context = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Costa Brava Rent a Boat",
        description: "Largest boat rental fleet in Blanes, Costa Brava, Spain. 9 boats, license-free and licensed. Fuel included. From 70 EUR/hour.",
        url: "https://costabravarentaboat.com",
        telephone: "+34611500372",
        email: "costabravarentaboat@gmail.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Puerto de Blanes",
          addressLocality: "Blanes",
          postalCode: "17300",
          addressRegion: "Girona",
          addressCountry: "ES",
        },
        geo: { "@type": "GeoCoordinates", latitude: 41.6751, longitude: 2.7934 },
        openingHours: "Mo-Su 09:00-20:00",
        openingSeason: "April-October",
        priceRange: "70-420 EUR",
        aggregateRating: { "@type": "AggregateRating", ratingValue: 4.8, reviewCount: 300, bestRating: 5 },
        sameAs: [
          "https://www.instagram.com/costabravarentaboat/",
          "https://www.facebook.com/costabravarentaboat",
          "https://www.tiktok.com/@costabravarentaboat",
          "https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5",
        ],
        availableLanguage: ["es", "en", "ca", "fr", "de", "nl", "it", "ru"],
        fleet: boats.length > 0 ? boats : undefined,
        destinations: [
          { name: "Sa Palomera", timeFromPort: "5 min", coordinates: "41.6742,2.7905", licenseRequired: false },
          { name: "Cala Brava", timeFromPort: "15 min", coordinates: "41.6820,2.8050", licenseRequired: false },
          { name: "Cala Sant Francesc", timeFromPort: "20 min", coordinates: "41.6890,2.8180", licenseRequired: false },
          { name: "Lloret de Mar", timeFromPort: "30 min", coordinates: "41.6994,2.8455", licenseRequired: false },
          { name: "Tossa de Mar", timeFromPort: "45 min", coordinates: "41.7196,2.9313", licenseRequired: true },
        ],
        nearbyTowns: [
          { name: "Malgrat de Mar", distanceKm: 8, driveTime: "10 min", trainTime: "5 min", page: "/alquiler-barcos-malgrat-de-mar" },
          { name: "Santa Susanna", distanceKm: 12, driveTime: "15 min", trainTime: "10 min", page: "/alquiler-barcos-santa-susanna" },
          { name: "Calella", distanceKm: 17, driveTime: "20 min", trainTime: "15 min", page: "/alquiler-barcos-calella" },
        ],
        llmsTxt: "https://costabravarentaboat.com/llms.txt",
        llmsFullTxt: "https://costabravarentaboat.com/llms-full.txt",
      };

      res.setHeader("Content-Type", "application/ld+json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.json(context);
    } catch (error) {
      logger.warn("[robots] ai-context generation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Failed to generate AI context" });
    }
  });
}
