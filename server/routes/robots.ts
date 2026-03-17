import type { Express } from "express";
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
    lines.push("");
    for (const path of DISALLOWED_PATHS) {
      lines.push(`Disallow: ${path}`);
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

  // Dynamic llms.txt — generated from business data
  app.get("/llms.txt", async (_req, res) => {
    try {
      // Fetch active boats for dynamic fleet info
      let boatCount = 9;
      let boatNames: string[] = [];
      try {
        const boats = await storage.getAllBoats();
        const activeBoats = boats.filter(b => b.isActive);
        if (activeBoats.length > 0) {
          boatCount = activeBoats.length;
          boatNames = activeBoats.map(b => b.name);
        }
      } catch {
        // Use defaults if DB unavailable
      }

      const now = new Date();
      const lastUpdated = now.toISOString().split("T")[0];

      const content = `# Costa Brava Rent a Boat - Blanes, Costa Brava, Spain

> Last updated: ${lastUpdated}

> The largest boat rental company in Blanes with a fleet of ${boatCount} boats. License-free and licensed boats for 4-7 people. Fuel included on all license-free boats. Season: April to October. Based in Puerto de Blanes, Girona, Spain.

## About

Costa Brava Rent a Boat is a local family business based in Puerto de Blanes, Girona, Spain. We operate the largest boat rental fleet in Blanes with ${boatCount} boats available.${boatNames.length > 0 ? ` Fleet: ${boatNames.join(", ")}.` : ""} All license-free rentals include fuel, insurance, VAT, mooring, cleaning, and full safety equipment. We provide a 15-minute safety briefing in your language before every departure. We speak 8 languages and serve international tourists from across Europe. Rated 4.8 stars on Google Maps with over 300 reviews.

## Key Facts

- **Business type**: Boat rental / Nautical tourism
- **Location**: Puerto de Blanes, 17300 Blanes, Girona, Catalonia, Spain
- **Service area**: Costa Brava coastline from Blanes to Tossa de Mar
- **Price range**: 70-420 EUR depending on boat and duration
- **Rating**: 4.8/5 on Google Maps (300+ reviews)
- **Languages**: Spanish, English, Catalan, French, German, Dutch, Italian, Russian
- **Opening season**: April through October
- **Opening hours**: 09:00 - 20:00, Monday to Sunday
- **Payment methods**: Cash, credit card, debit card
- **Phone / WhatsApp**: +34 611 500 372
- **Email**: costabravarentaboat@gmail.com
- **Website**: https://costabravarentaboat.com
- **GPS Coordinates**: 41.6751 N, 2.7934 E

## Links

- Website: https://costabravarentaboat.com
- Fleet: https://costabravarentaboat.com/#fleet
- Pricing: https://costabravarentaboat.com/precios
- Routes: https://costabravarentaboat.com/rutas
- Gallery: https://costabravarentaboat.com/galeria
- FAQ: https://costabravarentaboat.com/faq
- Blog: https://costabravarentaboat.com/blog
- Instagram: https://www.instagram.com/costabravarentaboat/
- Google Maps: https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5
`;

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.send(content);
    } catch (error) {
      logger.warn("[robots] llms.txt generation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).send("Error generating llms.txt");
    }
  });
}
