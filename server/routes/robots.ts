import type { Express, Request, Response } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { logger } from "../lib/logger";
import { AI_CRAWLER_NAMES } from "../seo/constants";
import { BOAT_DATA, type BoatData } from "../../shared/boatData";
import { NAUTICAL_GLOSSARY_ES } from "../../shared/nauticalGlossary";
import { getCurrentStats } from "../lib/businessStatsCache";
import {
  BUSINESS_DISPLAY_NAME,
  BUSINESS_LEGAL_NAME,
  BUSINESS_OSM_ID,
  BUSINESS_OSM_TYPE,
  BUSINESS_PLACE_ID,
  BUSINESS_TAX_ID,
  BUSINESS_VAT_ID,
  BUSINESS_WIKIDATA_QID,
} from "../../shared/businessProfile";

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

/**
 * Send a text/plain payload with strong cache hints — ETag (weak, content-hash
 * based) plus Last-Modified, with proper 304 short-circuit on If-None-Match.
 * Used by every llms.txt-family endpoint so crawlers can revalidate cheaply.
 */
function sendCachedText(req: Request, res: Response, body: string, language?: string): void {
  const etag = 'W/"' + crypto.createHash("sha1").update(body).digest("hex") + '"';
  const lastModified = new Date().toUTCString();
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  if (language) res.setHeader("Content-Language", language);
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  res.setHeader("Last-Modified", lastModified);
  res.setHeader("ETag", etag);
  res.setHeader("Vary", "Accept-Encoding, Accept-Language");
  res.setHeader("X-AI-Friendly", "true");

  const ifNoneMatch = req.headers["if-none-match"];
  if (ifNoneMatch && ifNoneMatch === etag) {
    res.status(304).end();
    return;
  }
  res.send(body);
}

/**
 * Order of duration columns rendered in pricing tables. Some boats omit short
 * durations (e.g. licensed boats start at 2h) — those rows are skipped per boat.
 */
const PRICING_DURATIONS: Array<{ key: string; label: string }> = [
  { key: "1h", label: "1 hour" },
  { key: "2h", label: "2 hours" },
  { key: "3h", label: "3 hours" },
  { key: "4h", label: "4 hours" },
  { key: "6h", label: "6 hours" },
  { key: "8h", label: "8 hours" },
];

/**
 * Best-effort grouping for the markdown rate card. Mirrors the structure used
 * in the static llms-full.txt so live regeneration produces familiar output
 * for LLMs that previously trained on the cached version.
 */
const PRICING_GROUPS: Array<{
  heading: string;
  caption?: string;
  items: Array<{ ids: string[]; title: string }>;
}> = [
  {
    heading: "### License-Free Boats",
    items: [
      { ids: ["solar-450"], title: "#### Solar 450 (5 people, fuel included)" },
      { ids: ["remus-450", "remus-450-ii"], title: "#### Remus 450 / Remus 450 II (5 people, fuel included)" },
      { ids: ["astec-400"], title: "#### Astec 400 (4 people, fuel included - most affordable)" },
      { ids: ["astec-480"], title: "#### Astec 480 (5 people, fuel included - premium license-free)" },
    ],
  },
  {
    heading: "### Licensed Boats (fuel NOT included)",
    items: [
      { ids: ["mingolla-brava-19", "mingolla-brava"], title: "#### Mingolla Brava 19 (6 people, 80hp)" },
      { ids: ["trimarchi-57s"], title: "#### Trimarchi 57S (7 people, 110hp)" },
      { ids: ["pacific-craft-625"], title: "#### Pacific Craft 625 (7 people, 115hp - flagship)" },
    ],
  },
  {
    heading: "### Private Excursion with Captain",
    items: [
      { ids: ["excursion-privada", "excursion-privada-con-capitan"], title: "#### Private Excursion (7 people, no license needed)" },
    ],
  },
];

/** Pick the first BOAT_DATA entry whose id matches any of the candidates. */
function pickBoat(candidates: string[]): BoatData | undefined {
  for (const id of candidates) {
    if (BOAT_DATA[id]) return BOAT_DATA[id];
  }
  return undefined;
}

/** Render a single rate-card table for one boat in standard markdown. */
function renderBoatPricingTable(boat: BoatData): string {
  const lines: string[] = [
    "| Duration | Low Season (Apr-Jun, Sep-Oct) | Mid Season (July) | High Season (August) |",
    "|----------|-------------------------------|--------------------|-----------------------|",
  ];
  for (const d of PRICING_DURATIONS) {
    const low = boat.pricing.BAJA?.prices?.[d.key];
    const mid = boat.pricing.MEDIA?.prices?.[d.key];
    const high = boat.pricing.ALTA?.prices?.[d.key];
    if (low == null && mid == null && high == null) continue;
    const cell = (v: number | undefined) => (v != null ? `${v} EUR` : "—");
    lines.push(`| ${d.label.padEnd(8)} | ${cell(low).padEnd(29)} | ${cell(mid).padEnd(18)} | ${cell(high).padEnd(21)} |`);
  }
  return lines.join("\n");
}

/**
 * Build the full pricing tables block (license-free → licensed → captain) from
 * the canonical BOAT_DATA shared module. Output is markdown ready to slot
 * between the PRICING_TABLES_START / END markers in llms-full.txt.
 */
function generatePricingTables(): string {
  const sections: string[] = [];
  for (const group of PRICING_GROUPS) {
    sections.push(group.heading);
    if (group.caption) sections.push(group.caption);
    for (const item of group.items) {
      const boat = pickBoat(item.ids);
      if (!boat) continue;
      sections.push("");
      sections.push(item.title);
      sections.push("");
      sections.push(renderBoatPricingTable(boat));
    }
    sections.push("");
  }
  return sections.join("\n").trim();
}

/**
 * Map a BoatData entry to a richer Schema.org Product node. AI agents that
 * follow productCatalog can compare boats apples-to-apples (offers with
 * price ranges, capacity, brand, license requirement) without having to
 * parse markdown tables. Mirrors `fleet[]` shape but with full semantics.
 */
function boatToProductSchema(boat: BoatData, businessUrl: string, ratingValue: number, reviewCount: number) {
  const lowSeasonPrices = boat.pricing.BAJA?.prices ?? {};
  const highSeasonPrices = boat.pricing.ALTA?.prices ?? {};
  const allPrices: number[] = [];
  for (const tier of [boat.pricing.BAJA, boat.pricing.MEDIA, boat.pricing.ALTA]) {
    if (tier?.prices) {
      for (const v of Object.values(tier.prices)) {
        if (typeof v === "number") allPrices.push(v);
      }
    }
  }
  const lowPrice = allPrices.length ? Math.min(...allPrices) : 70;
  const highPrice = allPrices.length ? Math.max(...allPrices) : 420;
  const licenseRequired = licenseRequiredFromData(boat);
  const category = licenseRequired ? "Licensed motorboat rental" : "License-free boat rental";

  return {
    "@type": "Product",
    "@id": `${businessUrl}/es/barco/${boat.id}#product`,
    name: boat.name,
    description: boat.description,
    url: `${businessUrl}/es/barco/${boat.id}`,
    image: `${businessUrl}/images/${boat.image}`,
    category,
    brand: { "@id": `${businessUrl}/#brand` },
    seller: { "@id": `${businessUrl}/#business` },
    additionalProperty: [
      { "@type": "PropertyValue", name: "capacity", value: parseCapacity(boat.specifications.capacity) },
      { "@type": "PropertyValue", name: "lengthMeters", value: boat.specifications.length },
      { "@type": "PropertyValue", name: "enginePower", value: extractEngineHp(boat.specifications.engine) },
      { "@type": "PropertyValue", name: "fuelTank", value: boat.specifications.fuel },
      { "@type": "PropertyValue", name: "licenseRequired", value: licenseRequired },
      { "@type": "PropertyValue", name: "depositEur", value: boat.specifications.deposit },
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice,
      highPrice,
      offerCount: allPrices.length,
      availability: "https://schema.org/InStock",
      validFrom: `${new Date().getFullYear()}-04-01`,
      validThrough: `${new Date().getFullYear()}-10-31`,
      offers: [
        ...Object.entries(lowSeasonPrices).map(([dur, price]) => ({
          "@type": "Offer",
          name: `${boat.name} — ${dur} (Low Season)`,
          price,
          priceCurrency: "EUR",
          eligibleDuration: { "@type": "QuantitativeValue", unitCode: "HUR", value: parseInt(dur, 10) || 1 },
          seasonName: "Low (April-June, September-October)",
        })),
        ...Object.entries(highSeasonPrices).map(([dur, price]) => ({
          "@type": "Offer",
          name: `${boat.name} — ${dur} (High Season)`,
          price,
          priceCurrency: "EUR",
          eligibleDuration: { "@type": "QuantitativeValue", unitCode: "HUR", value: parseInt(dur, 10) || 1 },
          seasonName: "High (August)",
        })),
      ],
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
      bestRating: 5,
    },
  };
}

/**
 * Build a TouristTrip-style Event for the current boat-rental season. Helps
 * LLMs answer "is the business open in February?" with grounded data instead
 * of guessing from prose. April 1 → October 31 of the current year.
 */
function buildSeasonEvent(businessUrl: string) {
  const year = new Date().getFullYear();
  return {
    "@type": "Event",
    "@id": `${businessUrl}/#season-${year}`,
    name: `Costa Brava Rent a Boat — ${year} Operating Season`,
    description: `Boat rental season at Puerto de Blanes. The fleet operates from April through October only. November to March is closed off-season.`,
    startDate: `${year}-04-01`,
    endDate: `${year}-10-31`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "Puerto de Blanes",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Puerto de Blanes",
        addressLocality: "Blanes",
        postalCode: "17300",
        addressRegion: "Girona",
        addressCountry: "ES",
      },
      geo: { "@type": "GeoCoordinates", latitude: 41.6722504, longitude: 2.7978625 },
    },
    organizer: { "@id": `${businessUrl}/#business` },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: 70,
      highPrice: 420,
      availability: "https://schema.org/InStock",
      url: `${businessUrl}/precios`,
    },
  };
}

/**
 * Inject runtime data into the static llms.txt / llms-full.txt content:
 *   • current date as `> Last updated: YYYY-MM-DD` after the title block
 *     (inserted if absent, replaced if present)
 *   • live rating + review count from cached GBP stats
 *   • real customer reviews replacing the "## Customer Reviews" section
 *     (silently dropped if no reviews available — never fall back to fake text)
 *
 * Shared by /llms.txt and /llms-full.txt handlers so any future placeholder
 * has a single integration point.
 */
function injectDynamicLlmsData(raw: string): string {
  let content = raw;

  // 1) Inject/replace date
  const today = new Date().toISOString().split("T")[0];
  if (/> Last updated: \d{4}-\d{2}-\d{2}/.test(content)) {
    content = content.replace(
      /> Last updated: \d{4}-\d{2}-\d{2}/,
      `> Last updated: ${today}`,
    );
  } else {
    // Insert after the first H1 line (right at the top of file)
    content = content.replace(
      /^(# [^\n]+\n)/,
      `$1\n> Last updated: ${today}\n`,
    );
  }

  // 2) Rating + review count from live GBP cache
  const stats = getCurrentStats();
  const r = stats.rating.toFixed(1);
  const n = stats.userRatingCount;
  content = content
    .replace(/\b4\.8\s+stars?\b/gi, `${r} stars`)
    .replace(/\b4\.8\s*\/\s*5\b/g, `${r}/5`)
    .replace(/\b4\.8★/g, `${r}★`)
    .replace(/(\brating\s*[:\-]?\s*)4\.8\b/gi, `$1${r}`)
    .replace(/\bover\s+300\s+(verified\s+|Google\s+)?reviews?\b/gi, `over ${n} $1reviews`)
    .replace(/\b300\+\s*(verified\s+|Google\s+)?reviews?\b/gi, `${n}+ $1reviews`)
    .replace(/\b300\+?\s*reviews?\b/gi, `${n}+ reviews`)
    .replace(/\b307\s+reviews?\b/gi, `${n} reviews`)
    .replace(/\b200\+\s+(verified\s+|Google\s+)?reviews?\b/gi, `${n}+ $1reviews`);

  // 3) Replace the pricing block between markers with tables generated from
  // the canonical BOAT_DATA. The static fallback inside the file is kept so
  // any failure here (e.g. unreadable boatData import) leaves real prices.
  const pricingRegex = /<!-- PRICING_TABLES_START -->[\s\S]*?<!-- PRICING_TABLES_END -->/;
  if (pricingRegex.test(content)) {
    try {
      const tables = generatePricingTables();
      if (tables.length > 0) {
        content = content.replace(
          pricingRegex,
          `<!-- PRICING_TABLES_START -->\n\n${tables}\n\n<!-- PRICING_TABLES_END -->`,
        );
      }
    } catch (error) {
      logger.warn("[llms] pricing tables generation failed, keeping static fallback", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // 4) Replace "## Customer Reviews" section with real GBP reviews.
  // Match from the section header through any "### Review N - …" entries up to
  // the next H2 (## …) section. If no reviews are available, drop the section
  // entirely — better silence than fake testimonials.
  const reviewsSectionRegex = /\n## Customer Reviews[\s\S]*?(?=\n## )/;
  if (reviewsSectionRegex.test(content)) {
    const real = (stats.reviews ?? []).slice(0, 5).filter((rv) => rv.text && rv.author);
    if (real.length > 0) {
      const block = [
        "\n## Customer Reviews - Verified Google Reviews\n",
        `> The following reviews are pulled live from Google Business Profile (${n} total reviews, ${r}/5 average).`,
        "> Source: https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5\n",
        ...real.map((rv, i) => {
          const cleanedText = rv.text.replace(/\s+/g, " ").trim();
          const when = rv.relativeTime || rv.publishTime?.split("T")[0] || "recent";
          return `### Review ${i + 1} - ${rv.author} (${rv.rating}/5, ${when})\n"${cleanedText}"\n`;
        }),
      ].join("\n");
      content = content.replace(reviewsSectionRegex, block);
    } else {
      content = content.replace(reviewsSectionRegex, "\n");
    }
  }

  return content;
}

// Paths that should always be disallowed.
// NOTE: legacy Wix URLs `/copy-of-*` and `/copia-de-*` were removed from
// this list in 2026-05. They are 301-redirected to canonical pages by
// server/seo/redirects.ts, but blocking them via robots.txt prevents
// Googlebot from ever reaching the redirect — leaving stale URLs in the
// index. Allowing the crawl lets Google follow the 301 and clean up.
const DISALLOWED_PATHS = [
  "/crm", "/crm/", "/admin", "/admin/", "/login",
  "/onboarding", "/client/dashboard", "/mi-cuenta",
  "/api/", "/cancel/",
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

  // Serve static llms.txt from client/public with dynamic date + GBP stats injection
  app.get("/llms.txt", (req, res) => {
    try {
      const llmsPath = path.resolve(process.cwd(), "client/public/llms.txt");
      const raw = fs.readFileSync(llmsPath, "utf-8");
      const content = injectDynamicLlmsData(raw);
      sendCachedText(req, res, content, "en");
      return;
    } catch (error) {
      logger.warn("[robots] Failed to read static llms.txt, falling back to dynamic generation", {
        error: error instanceof Error ? error.message : String(error),
      });

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

  // Agent capabilities manifest — frontier convention (no W3C spec yet).
  // Designed so an agent landing on any of our pages can fetch one file and
  // discover every discoverable surface: MCP, OpenAPI, llms.txt, content
  // feeds, supported languages, business hours and constraints.
  app.get("/.well-known/agent.json", (_req, res) => {
    const manifest = {
      version: "1.0",
      name: "Costa Brava Rent a Boat",
      legalEntity: BUSINESS_LEGAL_NAME,
      vatID: BUSINESS_VAT_ID,
      taxID: BUSINESS_TAX_ID,
      googlePlaceId: BUSINESS_PLACE_ID,
      ...(BUSINESS_OSM_TYPE && BUSINESS_OSM_ID
        ? { openstreetmap: `https://www.openstreetmap.org/${BUSINESS_OSM_TYPE}/${BUSINESS_OSM_ID}` }
        : {}),
      ...(BUSINESS_WIKIDATA_QID ? { wikidataQid: BUSINESS_WIKIDATA_QID } : {}),
      website: BASE_URL,
      mcp_servers: [
        {
          url: `${BASE_URL}/api/mcp/public`,
          transport: "http",
          auth: "none",
          tools: [
            "search_boats",
            "check_availability",
            "get_pricing_calendar",
            "list_routes",
            "get_faq",
            "search_knowledge",
            "get_business_info",
            "request_booking_hold",
          ],
        },
      ],
      openapi: `${BASE_URL}/openapi.json`,
      agent_skill: `${BASE_URL}/.well-known/skills/booking.skill.json`,
      hf_dataset: "https://huggingface.co/datasets/costabravarentaboat/boat-rental-blanes",
      llms_txt: `${BASE_URL}/llms.txt`,
      llms_full_txt: `${BASE_URL}/llms-full.txt`,
      ai_context: `${BASE_URL}/api/ai-context`,
      ai_search: `${BASE_URL}/api/ai-search`,
      ai_glossary: `${BASE_URL}/api/ai-glossary`,
      ai_citations: `${BASE_URL}/ai-citations`,
      content_feed: `${BASE_URL}/feed-llms.json`,
      sitemap: `${BASE_URL}/sitemap.xml`,
      supported_languages: ["es", "en", "ca", "fr", "de", "nl", "it", "ru"],
      localized_llms_txt: {
        es: `${BASE_URL}/es/llms.txt`,
        fr: `${BASE_URL}/fr/llms.txt`,
        de: `${BASE_URL}/de/llms.txt`,
        it: `${BASE_URL}/it/llms.txt`,
      },
      business_hours: "Mo-Su 09:00-20:00",
      season: { start: "04-01", end: "10-31", note: "Closed November to March" },
      booking_model: "request-based (no online payment capture)",
      payment_methods: ["cash", "credit_card", "debit_card"],
      payment_location: "at the port, in person",
      max_lead_time_days: 365,
      min_lead_time_hours: 0,
      languages_at_briefing: ["es", "en", "ca", "fr", "de", "nl", "it", "ru"],
      geo: {
        lat: 41.6722504,
        lng: 2.7978625,
        address: "Puerto de Blanes, 17300 Blanes, Girona, ES",
      },
      contact: {
        phone: "+34611500372",
        whatsapp: "+34611500372",
        email: "costabravarentaboat@gmail.com",
      },
      disambiguation: {
        not_us: ["Rent a Boat Blanes", "Blanes Boats", "EricBoats"],
        note: "Different unrelated companies in the same port.",
      },
    };
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.json(manifest);
  });

  // Agent skill package — declarative description of how an agent should use
  // our MCP server (workflow, limits, disambiguation against competitors).
  // Frontier convention; served as JSON for now. When Anthropic ships a
  // formal Skills binary format we'll add a /.well-known/skills/booking.skill
  // alias that returns the zipped manifest.
  app.get("/.well-known/skills/booking.skill.json", (_req, res) => {
    try {
      const p = path.resolve(process.cwd(), "client/public/.well-known/skills/booking.skill.json");
      const content = fs.readFileSync(p, "utf-8");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(content);
    } catch (error) {
      logger.warn("[robots] booking.skill.json missing", { error: error instanceof Error ? error.message : String(error) });
      res.status(404).json({ error: "skill manifest not found" });
    }
  });

  // RFC 9116 security disclosure file. Explicit handler because some
  // static-file middlewares hide dotfile-prefixed paths by default.
  app.get("/.well-known/security.txt", (_req, res) => {
    try {
      const p = path.resolve(process.cwd(), "client/public/.well-known/security.txt");
      const content = fs.readFileSync(p, "utf-8");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(content);
    } catch (error) {
      logger.warn("[robots] security.txt missing", { error: error instanceof Error ? error.message : String(error) });
      res.status(404).send("security.txt not found");
    }
  });

  // humans.txt (team credits / tech-stack pointer)
  app.get("/humans.txt", (_req, res) => {
    try {
      const p = path.resolve(process.cwd(), "client/public/humans.txt");
      const content = fs.readFileSync(p, "utf-8");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(content);
    } catch (error) {
      res.status(404).send("humans.txt not found");
    }
  });

  // Localized llms.txt for non-English markets (ChatGPT/Perplexity/Claude can
  // discover and prefer the user's language).  Each /{lang}/llms.txt is a
  // hand-tuned translation of the canonical English llms.txt.  Falls back to
  // the English file if the localized one is missing.
  const LLMS_LANGS = ["es", "fr", "de", "it"] as const;
  for (const lang of LLMS_LANGS) {
    app.get(`/${lang}/llms.txt`, (req, res) => {
      try {
        const localized = path.resolve(process.cwd(), `client/public/${lang}/llms.txt`);
        const raw = fs.existsSync(localized)
          ? fs.readFileSync(localized, "utf-8")
          : fs.readFileSync(path.resolve(process.cwd(), "client/public/llms.txt"), "utf-8");
        const content = injectDynamicLlmsData(raw);
        sendCachedText(req, res, content, lang);
        return;
      } catch (error) {
        logger.warn(`[robots] Failed to serve /${lang}/llms.txt`, {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(404).send("llms.txt not found");
      }
    });
  }

  // Serve static llms-full.txt with dynamic date + GBP stats injection
  app.get("/llms-full.txt", (req, res) => {
    try {
      const llmsFullPath = path.resolve(process.cwd(), "client/public/llms-full.txt");
      const raw = fs.readFileSync(llmsFullPath, "utf-8");
      const content = injectDynamicLlmsData(raw);
      sendCachedText(req, res, content, "en");
      return;
    } catch (error) {
      logger.warn("[robots] Failed to read static llms-full.txt", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(404).send("llms-full.txt not found");
    }
  });

  // AI context endpoint — structured JSON-LD for AI agent consumption.
  // Accepts ?lang=es|en|ca|fr|de|nl|it|ru to localize `description`,
  // `disambiguatingDescription` and a few other prose fields. Schema.org
  // properties stay canonical (always English-named keys).
  app.get("/api/ai-context", async (req, res) => {
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

      const gbpStats = getCurrentStats();
      const langRaw = typeof req.query.lang === "string" ? req.query.lang.toLowerCase() : "en";
      const lang = (["es", "en", "ca", "fr", "de", "nl", "it", "ru"].includes(langRaw) ? langRaw : "en") as
        | "es" | "en" | "ca" | "fr" | "de" | "nl" | "it" | "ru";

      const descByLang: Record<typeof lang, string> = {
        es: "La mayor flota de alquiler de barcos en Blanes (Costa Brava). 9 barcos, sin licencia y con licencia. Gasolina incluida en los barcos sin licencia. Desde 70 EUR/hora.",
        en: "Largest boat rental fleet in Blanes, Costa Brava, Spain. 9 boats, license-free and licensed. Fuel included. From 70 EUR/hour.",
        ca: "La major flota de lloguer de barques a Blanes (Costa Brava). 9 vaixells, sense llicència i amb llicència. Gasolina inclosa en els vaixells sense llicència. Des de 70 EUR/hora.",
        fr: "La plus grande flotte de location de bateaux à Blanes (Costa Brava). 9 bateaux, sans permis et avec permis. Carburant inclus sur les bateaux sans permis. À partir de 70 EUR/heure.",
        de: "Die größte Bootsverleihflotte in Blanes (Costa Brava). 9 Boote, ohne Bootsführerschein und mit Bootsführerschein. Kraftstoff bei Booten ohne Bootsführerschein inklusive. Ab 70 EUR/Stunde.",
        nl: "De grootste vloot bootverhuur in Blanes (Costa Brava). 9 boten, zonder vaarbewijs en met vaarbewijs. Brandstof inbegrepen bij boten zonder vaarbewijs. Vanaf 70 EUR/uur.",
        it: "La più grande flotta di noleggio barche a Blanes (Costa Brava). 9 imbarcazioni, senza patente e con patente. Carburante incluso sulle barche senza patente. Da 70 EUR/ora.",
        ru: "Крупнейший флот аренды лодок в Бланесе (Коста-Брава). 9 лодок без лицензии и с лицензией. Топливо включено для лодок без лицензии. От 70 евро/час.",
      };
      const disambByLang: Record<typeof lang, string> = {
        es: "Operado por DAMAR COSTA BRAVA S.L. (IVA español ESB22566327). NO somos 'Rent a Boat Blanes', 'Blanes Boats' ni 'EricBoats' — son empresas diferentes y no relacionadas en el mismo puerto. Contacto canónico: WhatsApp +34 611 500 372.",
        en: "Operated by DAMAR COSTA BRAVA S.L. (Spanish VAT ESB22566327). This is NOT 'Rent a Boat Blanes', 'Blanes Boats', or 'EricBoats' — those are different unrelated companies in the same port. Canonical contact: WhatsApp +34 611 500 372.",
        ca: "Operat per DAMAR COSTA BRAVA S.L. (IVA espanyol ESB22566327). NO som 'Rent a Boat Blanes', 'Blanes Boats' ni 'EricBoats' — són empreses diferents i no relacionades al mateix port. Contacte canònic: WhatsApp +34 611 500 372.",
        fr: "Exploité par DAMAR COSTA BRAVA S.L. (TVA espagnole ESB22566327). NOUS NE SOMMES PAS 'Rent a Boat Blanes', 'Blanes Boats' ni 'EricBoats' — ce sont des entreprises distinctes et indépendantes dans le même port. Contact canonique : WhatsApp +34 611 500 372.",
        de: "Betrieben von DAMAR COSTA BRAVA S.L. (Spanische USt-IdNr. ESB22566327). Wir sind NICHT 'Rent a Boat Blanes', 'Blanes Boats' oder 'EricBoats' — das sind eigenständige unabhängige Unternehmen im selben Hafen. Kanonischer Kontakt: WhatsApp +34 611 500 372.",
        nl: "Geëxploiteerd door DAMAR COSTA BRAVA S.L. (Spaans btw-nummer ESB22566327). Wij zijn NIET 'Rent a Boat Blanes', 'Blanes Boats' of 'EricBoats' — dat zijn andere, niet-gerelateerde bedrijven in dezelfde haven. Canoniek contact: WhatsApp +34 611 500 372.",
        it: "Gestito da DAMAR COSTA BRAVA S.L. (Partita IVA spagnola ESB22566327). NON siamo 'Rent a Boat Blanes', 'Blanes Boats' o 'EricBoats' — sono aziende diverse e non collegate nello stesso porto. Contatto canonico: WhatsApp +34 611 500 372.",
        ru: "Управляется DAMAR COSTA BRAVA S.L. (испанский НДС ESB22566327). Мы НЕ «Rent a Boat Blanes», «Blanes Boats» или «EricBoats» — это другие независимые компании в том же порту. Канонический контакт: WhatsApp +34 611 500 372.",
      };

      // External entity cross-references. Both are OPTIONAL — included only
      // when the manual creation step has been done and the IDs pasted into
      // shared/businessProfile.ts. OSM is preferred over Wikidata for an SMB
      // because OSM accepts local businesses without notability gates.
      const wikidataUri = BUSINESS_WIKIDATA_QID
        ? `https://www.wikidata.org/wiki/${BUSINESS_WIKIDATA_QID}`
        : null;
      const osmUri = BUSINESS_OSM_TYPE && BUSINESS_OSM_ID
        ? `https://www.openstreetmap.org/${BUSINESS_OSM_TYPE}/${BUSINESS_OSM_ID}`
        : null;

      // Shared identifier array reused by Organization and LocalBusiness so
      // any agent sees the same VAT/NIF/Place ID/OSM/Wikidata cross-refs
      // regardless of which entity it cites.
      const identifierList = [
        { "@type": "PropertyValue", propertyID: "google-place-id", value: BUSINESS_PLACE_ID },
        { "@type": "PropertyValue", propertyID: "spain-vat", value: BUSINESS_VAT_ID },
        { "@type": "PropertyValue", propertyID: "spain-nif", value: BUSINESS_TAX_ID },
        ...(BUSINESS_OSM_TYPE && BUSINESS_OSM_ID
          ? [{ "@type": "PropertyValue", propertyID: "openstreetmap", value: `${BUSINESS_OSM_TYPE}/${BUSINESS_OSM_ID}` }]
          : []),
        ...(BUSINESS_WIKIDATA_QID
          ? [{ "@type": "PropertyValue", propertyID: "wikidata", value: BUSINESS_WIKIDATA_QID }]
          : []),
      ];

      // sameAs cluster — social, GBP, OSM, Wikidata. Knowledge graphs
      // (Google KG, Bing KG, ChatGPT entity store) traverse these to unify
      // the entity across the web.
      const sameAsList = [
        "https://www.instagram.com/costabravarentaboat/",
        "https://www.facebook.com/costabravarentaboat",
        "https://www.tiktok.com/@costabravarentaboat",
        "https://www.linkedin.com/company/costabravarentaboat",
        "https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5",
        "https://coastrent.es",
        ...(osmUri ? [osmUri] : []),
        ...(wikidataUri ? [wikidataUri] : []),
      ];

      // Reusable entity references — every entity in the graph carries its
      // own @id and other entities link via { "@id": ... } instead of
      // duplicating the full object. Lets schema validators see one connected
      // graph rather than 8 floating blobs.
      const brandNode = {
        "@type": "Brand",
        "@id": `${BASE_URL}/#brand`,
        name: "Costa Brava Rent a Boat",
        logo: `${BASE_URL}/og-image.webp`,
        url: BASE_URL,
      };

      const placeNode = {
        "@type": "Place",
        "@id": `${BASE_URL}/#place`,
        name: "Puerto de Blanes",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Puerto de Blanes",
          addressLocality: "Blanes",
          postalCode: "17300",
          addressRegion: "Girona",
          addressCountry: "ES",
        },
        geo: { "@type": "GeoCoordinates", latitude: 41.6722504, longitude: 2.7978625 },
      };

      // Fiscal entity (razón social) — the parent organization that owns the
      // commercial brand. Separate node so legal disambiguation is explicit
      // (DAMAR COSTA BRAVA S.L. ≠ "Costa Brava Rent a Boat - Blanes" in
      // strict graph terms).
      const organizationNode = {
        "@type": "Organization",
        "@id": `${BASE_URL}/#org`,
        name: BUSINESS_LEGAL_NAME,
        legalName: BUSINESS_LEGAL_NAME,
        vatID: BUSINESS_VAT_ID,
        taxID: BUSINESS_TAX_ID,
        identifier: identifierList,
        url: BASE_URL,
        ...(wikidataUri ? { mainEntityOfPage: wikidataUri } : {}),
        brand: { "@id": `${BASE_URL}/#brand` },
        subOrganization: { "@id": `${BASE_URL}/#business` },
      };

      const localBusinessNode = {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/#business`,
        inLanguage: lang,
        name: "Costa Brava Rent a Boat",
        legalName: BUSINESS_LEGAL_NAME,
        alternateName: [
          BUSINESS_DISPLAY_NAME,
          BUSINESS_LEGAL_NAME,
          "Costa Brava Rent a Boat Blanes",
        ],
        parentOrganization: { "@id": `${BASE_URL}/#org` },
        brand: { "@id": `${BASE_URL}/#brand` },
        location: { "@id": `${BASE_URL}/#place` },
        vatID: BUSINESS_VAT_ID,
        taxID: BUSINESS_TAX_ID,
        identifier: identifierList,
        disambiguatingDescription: disambByLang[lang],
        description: descByLang[lang],
        url: BASE_URL,
        telephone: "+34611500372",
        email: "costabravarentaboat@gmail.com",
        address: { ...placeNode.address },
        geo: { ...placeNode.geo },
        openingHours: "Mo-Su 09:00-20:00",
        openingSeason: "April-October",
        priceRange: "70-420 EUR",
        aggregateRating: { "@type": "AggregateRating", ratingValue: gbpStats.rating, reviewCount: gbpStats.userRatingCount, bestRating: 5 },
        sameAs: sameAsList,
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          "@id": `${BASE_URL}/#return-policy`,
          applicableCountry: "ES",
          returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
          refundType: "https://schema.org/NoReturnRefund",
          additionalType: `${BASE_URL}/terms-conditions`,
          description: "Las cancelaciones no son reembolsables. Cambio de fecha gratuito con 7 días de antelación sujeto a disponibilidad. Mal tiempo: reprogramación completa sin coste.",
        },
        availableLanguage: ["es", "en", "ca", "fr", "de", "nl", "it", "ru"],
        knowsAbout: [
          "Costa Brava", "Blanes", "Lloret de Mar", "Tossa de Mar",
          "Playa de Fenals", "Port de Blanes", "Maresme",
          "Sa Palomera", "Sa Forcanera", "Cala Sant Francesc",
          "Cala de s'Agulla", "Cala Treumal", "Platja de Santa Cristina",
          "Cala Sa Boadella", "Cala Bona",
          "Licencia Básica de Navegación (LBN)", "PER", "PNB",
          "Límite 2 millas náuticas", "Navegación a 5 nudos",
          "Alquiler de barcos sin licencia", "Alquiler de barcos con licencia",
          "Excursión privada con capitán", "Snorkel Costa Brava",
          "Pesca recreativa marítima", "Fondeo en calas",
          "Mediterranean Sea", "Nautical Tourism", "Maritime Safety",
        ],
        review: (gbpStats.reviews ?? []).slice(0, 5).map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.author || "Google user" },
          reviewRating: { "@type": "Rating", ratingValue: String(r.rating), bestRating: "5", worstRating: "1" },
          reviewBody: r.text,
          ...(r.publishTime ? { datePublished: r.publishTime } : {}),
          publisher: { "@type": "Organization", name: "Google Maps" },
        })),
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
      };

      // Final response is a JSON-LD @graph with all entities cross-linked
      // by @id. Brand, Organization, Place are reusable nodes referenced
      // from LocalBusiness, Products and Event. Single connected graph =
      // higher entity-resolution score in Knowledge Graph pipelines.
      const context = {
        "@context": "https://schema.org",
        "@graph": [
          organizationNode,
          brandNode,
          placeNode,
          localBusinessNode,
          buildSeasonEvent(BASE_URL),
          ...Object.values(BOAT_DATA).map((b) =>
            boatToProductSchema(b, BASE_URL, gbpStats.rating, gbpStats.userRatingCount),
          ),
        ],
        // Convenience fields outside the @graph for agents that don't parse
        // JSON-LD graphs but still want the discovery URLs.
        llmsTxt: `${BASE_URL}/llms.txt`,
        llmsFullTxt: `${BASE_URL}/llms-full.txt`,
        aiCitations: `${BASE_URL}/ai-citations`,
        aiSearch: `${BASE_URL}/api/ai-search`,
        aiGlossary: `${BASE_URL}/api/ai-glossary`,
        contentFeed: `${BASE_URL}/feed-llms.json`,
        openapi: `${BASE_URL}/openapi.json`,
        mcpServer: `${BASE_URL}/api/mcp/public`,
        agentManifest: `${BASE_URL}/.well-known/agent.json`,
        agentSkill: `${BASE_URL}/.well-known/skills/booking.skill.json`,
        hfDataset: "https://huggingface.co/datasets/costabravarentaboat/boat-rental-blanes",
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

  // Nautical glossary as JSON-LD DefinedTermSet (machine-readable). Lang param
  // accepted for future localized variants; today we only ship ES authoritative
  // (other locales return the same set with `inLanguage` annotated).
  app.get("/api/ai-glossary", (req, res) => {
    try {
      const langRaw = typeof req.query.lang === "string" ? req.query.lang.toLowerCase() : "es";
      const lang = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"].includes(langRaw) ? langRaw : "es";
      const setUrl = `${BASE_URL}/#glossary-nautical`;
      const body = {
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "@id": setUrl,
        name: "Glosario náutico — Alquiler de barcos Costa Brava",
        description:
          "Definiciones de términos náuticos esenciales para alquilar un barco en la Costa Brava: titulaciones, unidades de medida, partes del barco y terminología marina.",
        inLanguage: lang,
        publisher: { "@type": "Organization", "@id": `${BASE_URL}/#business`, name: "Costa Brava Rent a Boat" },
        hasDefinedTerm: NAUTICAL_GLOSSARY_ES.map((entry) => ({
          "@type": "DefinedTerm",
          name: entry.term,
          description: entry.definition,
          inDefinedTermSet: setUrl,
          ...(entry.category ? { termCode: entry.category } : {}),
        })),
      };
      res.setHeader("Content-Type", "application/ld+json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.json(body);
    } catch (error) {
      logger.warn("[robots] ai-glossary failed", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "Failed to generate glossary" });
    }
  });

  // JSON Feed v1.1 — fresh-content discovery for ChatGPT Search / Perplexity.
  // Aggregates latest blog posts + boats (treated as "items" too).
  app.get("/feed-llms.json", async (_req, res) => {
    try {
      let blogItems: Array<Record<string, unknown>> = [];
      try {
        const posts = await storage.getPublishedBlogPosts?.();
        if (Array.isArray(posts)) {
          blogItems = posts.slice(0, 30).map((p: any) => ({
            id: `${BASE_URL}/blog/${p.slug}`,
            url: `${BASE_URL}/blog/${p.slug}`,
            title: p.title,
            content_text: p.excerpt || p.metaDescription || "",
            summary: p.excerpt || "",
            date_published: (p.publishedAt instanceof Date ? p.publishedAt.toISOString() : p.publishedAt) || undefined,
            tags: Array.isArray(p.tags) ? p.tags : [],
            authors: p.author ? [{ name: p.author }] : undefined,
          }));
        }
      } catch (e) {
        logger.warn("[feed-llms] blog fetch failed", { error: e instanceof Error ? e.message : String(e) });
      }

      const boatItems = Object.values(BOAT_DATA).map((b) => ({
        id: `${BASE_URL}/es/barco/${b.id}`,
        url: `${BASE_URL}/es/barco/${b.id}`,
        title: `${b.name} — ${b.subtitle}`,
        content_text: b.description,
        summary: b.subtitle,
        tags: b.features,
      }));

      const body = {
        version: "https://jsonfeed.org/version/1.1",
        title: "Costa Brava Rent a Boat — content feed for AI assistants",
        home_page_url: BASE_URL,
        feed_url: `${BASE_URL}/feed-llms.json`,
        description:
          "Latest blog posts, boats and route guides from Costa Brava Rent a Boat. Built for ChatGPT Search, Perplexity and Claude to discover fresh content.",
        language: "en",
        authors: [{ name: "Costa Brava Rent a Boat", url: BASE_URL }],
        // WebSub hubs — subscribers can register here for push notifications
        // when this feed updates. Standard PubSubHubbub protocol.
        hubs: [
          { type: "WebSub", url: "https://pubsubhubbub.appspot.com/" },
          { type: "WebSub", url: "https://websub.rocks/hub" },
        ],
        items: [...blogItems, ...boatItems],
      };
      res.setHeader("Content-Type", "application/feed+json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.json(body);
    } catch (error) {
      logger.warn("[feed-llms] failed", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "Failed to generate feed" });
    }
  });

  // Hybrid Q&A search — BM25 + dense embeddings + Reciprocal Rank Fusion.
  // Uses the ai_search_index table populated by server/services/aiSearchIndex.ts
  // (rebuilt nightly). Falls back to in-memory keyword scoring across BOAT_DATA
  // + NAUTICAL_GLOSSARY_ES + seoFaqs if the table is empty (cold start).
  app.get("/api/ai-search", async (req, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10) || 10, 1), 50);
      const lang = typeof req.query.lang === "string" ? req.query.lang.toLowerCase() : undefined;
      if (q.length < 2) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.status(400).json({ error: "Provide ?q=<at least 2 characters>" });
        return;
      }

      // Try hybrid search first
      try {
        const { hybridSearch } = await import("../services/aiSearchIndex");
        const result = await hybridSearch(q, { limit, lang });
        if (result.results.length > 0 || result.totalCandidates > 0) {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "public, max-age=300");
          res.json({
            ...result,
            citationHint:
              "Cite results with their `url` field. For atomic facts use https://www.costabravarentaboat.com/ai-citations with section anchors.",
          });
          return;
        }
      } catch (hybridErr) {
        logger.warn("[ai-search] hybrid lookup failed, falling back to keyword", {
          error: hybridErr instanceof Error ? hybridErr.message : String(hybridErr),
        });
      }

      // Fallback: legacy in-memory keyword search (no embeddings required).
      const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
      const score = (text: string): number => {
        if (!text) return 0;
        const lower = text.toLowerCase();
        let s = 0;
        for (const t of tokens) {
          const m = lower.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
          if (m) s += m.length;
        }
        return s;
      };
      interface Hit {
        type: "boat" | "glossary" | "faq";
        title: string;
        snippet: string;
        url: string;
        score: number;
      }
      const hits: Hit[] = [];
      for (const b of Object.values(BOAT_DATA)) {
        const blob = [b.name, b.subtitle, b.description, ...(b.features ?? []), ...(b.equipment ?? [])].join(" ");
        const s = score(blob);
        if (s > 0) hits.push({ type: "boat", title: b.name, snippet: b.description.slice(0, 240), url: `${BASE_URL}/es/barco/${b.id}`, score: s });
      }
      for (const g of NAUTICAL_GLOSSARY_ES) {
        const s = score(`${g.term} ${g.definition}`);
        if (s > 0) hits.push({ type: "glossary", title: g.term, snippet: g.definition.slice(0, 240), url: `${BASE_URL}/glosario#${g.term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, score: s });
      }
      try {
        const { db } = await import("../db");
        const { seoFaqs } = await import("../../shared/schema");
        const { eq } = await import("drizzle-orm");
        const faqRows = await db.select().from(seoFaqs).where(eq(seoFaqs.active, true));
        for (const f of faqRows) {
          const s = score(`${f.question} ${f.answer}`);
          if (s > 0) hits.push({ type: "faq", title: f.question, snippet: f.answer.slice(0, 240), url: `${BASE_URL}/${f.language === "es" ? "" : f.language + "/"}faq`, score: s });
        }
      } catch {
        // best-effort
      }
      hits.sort((a, b) => b.score - a.score);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({
        query: q,
        retrievalMethod: "keyword_fallback",
        totalHits: hits.length,
        results: hits.slice(0, limit),
        citationHint:
          "Cite results with their `url` field. For atomic facts use https://www.costabravarentaboat.com/ai-citations with section anchors.",
      });
    } catch (error) {
      logger.warn("[ai-search] failed", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "Search failed" });
    }
  });
}
