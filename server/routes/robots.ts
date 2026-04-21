import type { Express } from "express";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { logger } from "../lib/logger";
import { AI_CRAWLER_NAMES } from "../seo/constants";
import { BOAT_DATA, type BoatData } from "../../shared/boatData";

const BASE_URL = process.env.BASE_URL || "https://www.costabravarentaboat.com";

type AiContextBoat = {
  name: string;
  capacity: number;
  enginePower: string;
  pricePerHour: number;
  licenseRequired: boolean;
};

/** Extract HP value (e.g. "15hp", "80hp", "115hp") from a free-form engine description. */
function extractEngineHp(engineDescription: string | undefined | null): string {
  if (!engineDescription) return "15hp";
  const match = engineDescription.match(/(\d+)\s*(cv|hp)/i);
  return match ? `${match[1]}hp` : "15hp";
}

/** Parse the first integer out of a capacity string like "5 Personas". */
function parseCapacity(raw: string | number | undefined | null, fallback = 5): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (!raw) return fallback;
  const match = String(raw).match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

/** Find the canonical BoatData entry whose `name` matches (case-insensitive). */
function findCanonicalBoatData(name: string): BoatData | undefined {
  const target = name.trim().toLowerCase();
  return Object.values(BOAT_DATA).find((b) => b.name.toLowerCase() === target);
}

/** Best-effort price-per-hour in EUR from a BoatData entry (low season). */
function derivePricePerHour(data: BoatData | undefined, fallback = 70): number {
  if (!data) return fallback;
  const baja = data.pricing?.BAJA?.prices ?? {};
  if (typeof baja["1h"] === "number") return baja["1h"];
  if (typeof baja["2h"] === "number") return Math.round(baja["2h"] / 2);
  if (typeof baja["4h"] === "number") return Math.round(baja["4h"] / 4);
  return fallback;
}

/** Heuristic: derive licenseRequired from BoatData subtitle ("Sin licencia" / "Con patrón" → false). */
function licenseRequiredFromData(data: BoatData | undefined): boolean {
  if (!data) return false;
  const subtitle = (data.subtitle || "").toLowerCase();
  if (subtitle.startsWith("sin licencia")) return false;
  if (subtitle.startsWith("con patrón") || subtitle.startsWith("con patron")) return false;
  const features = (data.features || []).map((f) => f.toLowerCase());
  if (features.some((f) => f.includes("sin licencia") || f.includes("no requiere licencia"))) {
    return false;
  }
  return true;
}

/** Project a canonical BoatData entry into the /api/ai-context fleet shape. */
function boatDataToAiContext(data: BoatData): AiContextBoat {
  return {
    name: data.name,
    capacity: parseCapacity(data.specifications?.capacity),
    enginePower: extractEngineHp(data.specifications?.engine),
    pricePerHour: derivePricePerHour(data),
    licenseRequired: licenseRequiredFromData(data),
  };
}

// Paths that should always be disallowed
const DISALLOWED_PATHS = [
  "/crm", "/crm/", "/admin", "/admin/", "/login",
  "/onboarding", "/client/dashboard", "/mi-cuenta",
  "/api/", "/cancel/", "/copia-de-*", "/copy-of-*",
  "/client/",
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
    for (const crawler of AI_CRAWLER_NAMES) {
      lines.push("");
      lines.push(`User-agent: ${crawler}`);
      lines.push("Allow: /");
    }

    // Crawl-delay for aggressive bots
    lines.push("");
    lines.push("User-agent: AhrefsBot");
    lines.push("Crawl-delay: 10");
    lines.push("");
    lines.push("User-agent: SemrushBot");
    lines.push("Crawl-delay: 10");
    lines.push("");
    lines.push("User-agent: DotBot");
    lines.push("Crawl-delay: 30");

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
- **Website**: https://www.costabravarentaboat.com
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
      let boats: AiContextBoat[] = [];
      try {
        const allBoats = await storage.getAllBoats();
        boats = allBoats
          .filter((b) => b.isActive)
          .map((b) => {
            const canonical = findCanonicalBoatData(b.name);
            const engineDescription = b.specifications?.engine ?? canonical?.specifications?.engine;
            // requiresLicense is a not-null boolean in the DB; prefer it over licenseType which
            // defaults to "none" and is frequently unset. Fall back to BoatData heuristics when
            // both are absent.
            let licenseRequired: boolean;
            if (typeof b.requiresLicense === "boolean") {
              licenseRequired = b.requiresLicense;
            } else if (typeof b.licenseType === "string" && b.licenseType !== "" && b.licenseType !== "none") {
              licenseRequired = true;
            } else {
              licenseRequired = licenseRequiredFromData(canonical);
            }
            return {
              name: b.name,
              capacity: parseCapacity(b.capacity ?? canonical?.specifications?.capacity),
              enginePower: extractEngineHp(engineDescription),
              pricePerHour:
                b.pricePerHour != null && b.pricePerHour !== ""
                  ? Number(b.pricePerHour)
                  : derivePricePerHour(canonical),
              licenseRequired,
            };
          });
      } catch (dbError) {
        logger.warn("[ai-context] DB lookup failed, falling back to static BoatData", {
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
      }

      // Ultimate fallback: if DB is unavailable or returned zero active boats, surface the
      // canonical static fleet from shared/boatData.ts so AI agents never see an empty fleet
      // (or worse, a partially populated one with default 70 EUR / 15hp for premium boats).
      if (boats.length === 0) {
        boats = Object.values(BOAT_DATA).map(boatDataToAiContext);
      }

      const context = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Costa Brava Rent a Boat",
        description: "Largest boat rental fleet in Blanes, Costa Brava, Spain. 9 boats, license-free and licensed. Fuel included. From 70 EUR/hour.",
        url: "https://www.costabravarentaboat.com",
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
        geo: { "@type": "GeoCoordinates", latitude: 41.6722504, longitude: 2.7978625 },
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
        fleet: boats,
        fleetSize: boats.length,
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
        llmsTxt: "https://www.costabravarentaboat.com/llms.txt",
        llmsFullTxt: "https://www.costabravarentaboat.com/llms-full.txt",
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
