/**
 * Public MCP tool registrations.
 *
 * Read-mostly tools that wrap the existing public REST endpoints + canonical
 * data sources (BOAT_DATA, boatRoutes, NAUTICAL_GLOSSARY_ES, seo_faqs). One
 * write tool (request_booking_hold) creates a 30-min hold via the same path
 * as POST /api/quote — the conversion to a real booking still requires
 * email + phone via the web form (no abuse vector).
 *
 * Every tool returns a JSON-serialized text response. Errors propagate to
 * the MCP transport which surfaces them as protocol-level errors.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { eq, ilike, and, or, desc } from "drizzle-orm";
import { db } from "../shared/db.js";
import * as schema from "../../../shared/schema.js";
import { BOAT_DATA, type BoatData } from "../../../shared/boatData.js";
import { boatRoutes } from "../../../shared/routesData.js";
import { NAUTICAL_GLOSSARY_ES } from "../../../shared/nauticalGlossary.js";
import {
  calculatePricingBreakdown,
  type Duration,
} from "../../../shared/pricing.js";
import { storage } from "../../storage/index.js";
import { logger } from "../../lib/logger.js";

const BASE_URL = process.env.BASE_URL || "https://www.costabravarentaboat.com";

const TEXT = (obj: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }],
});

export interface ToolContext {
  ip: string | null;
  userAgent: string | null;
}

// -- helpers -----------------------------------------------------------------

function parseCapacity(raw: string | number | undefined): number {
  if (typeof raw === "number") return raw;
  if (!raw) return 5;
  const match = String(raw).match(/\d+/);
  return match ? Number(match[0]) : 5;
}

function lowestHourlyPrice(b: BoatData): number {
  const low = b.pricing?.BAJA?.prices ?? {};
  if (typeof low["1h"] === "number") return low["1h"];
  if (typeof low["2h"] === "number") return Math.round(low["2h"] / 2);
  if (typeof low["4h"] === "number") return Math.round(low["4h"] / 4);
  return 70;
}

function requiresLicense(b: BoatData): boolean {
  const subtitle = (b.subtitle || "").toLowerCase();
  if (subtitle.startsWith("sin licencia")) return false;
  if (subtitle.startsWith("con patrón") || subtitle.startsWith("con patron")) return false;
  return true;
}

function boatSummary(b: BoatData) {
  return {
    id: b.id,
    name: b.name,
    subtitle: b.subtitle,
    capacity: parseCapacity(b.specifications.capacity),
    length: b.specifications.length,
    engine: b.specifications.engine,
    licenseRequired: requiresLicense(b),
    fromPricePerHourEur: lowestHourlyPrice(b),
    deposit: b.specifications.deposit,
    features: b.features?.slice(0, 6) ?? [],
    detailUrl: `${BASE_URL}/es/barco/${b.id}`,
  };
}

// ===========================================================================
export function registerPublicTools(server: McpServer, ctx: ToolContext): void {
  void ctx; // currently unused; kept for future per-request metrics

  // -------------------------------------------------------------------------
  // 1) search_boats
  // -------------------------------------------------------------------------
  server.tool(
    "search_boats",
    "Search the fleet by free-text query, minimum capacity, license requirement and/or maximum hourly price. Returns boat summaries with detail URLs.",
    {
      query: z.string().max(120).optional().describe("Free-text match against name, subtitle, description, features"),
      minCapacity: z.number().int().min(1).max(20).optional().describe("Minimum people the boat must hold"),
      licenseRequired: z.boolean().optional().describe("true = only licensed boats (PER/PNB), false = license-free only, omit = any"),
      maxPricePerHourEur: z.number().int().min(1).max(1000).optional().describe("Maximum low-season price per hour in EUR"),
      limit: z.number().int().min(1).max(20).optional(),
    },
    async (args) => {
      const all = Object.values(BOAT_DATA);
      const q = args.query?.trim().toLowerCase();
      const matched = all.filter((b) => {
        if (args.minCapacity != null && parseCapacity(b.specifications.capacity) < args.minCapacity) return false;
        if (args.licenseRequired !== undefined && requiresLicense(b) !== args.licenseRequired) return false;
        if (args.maxPricePerHourEur != null && lowestHourlyPrice(b) > args.maxPricePerHourEur) return false;
        if (q) {
          const blob = [b.name, b.subtitle, b.description, ...(b.features ?? []), ...(b.equipment ?? [])]
            .join(" ")
            .toLowerCase();
          if (!blob.includes(q)) return false;
        }
        return true;
      });
      const limit = args.limit ?? 10;
      return TEXT({
        total: matched.length,
        returned: Math.min(matched.length, limit),
        results: matched.slice(0, limit).map(boatSummary),
      });
    },
  );

  // -------------------------------------------------------------------------
  // 2) check_availability
  // -------------------------------------------------------------------------
  server.tool(
    "check_availability",
    "Get available start slots for a specific boat on a given date. Returns half-hour slots with the maximum continuous duration from each. Empty arrays outside the April-October season.",
    {
      boatId: z.string().min(1).max(64),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    },
    async (args) => {
      try {
        const res = await fetch(`${BASE_URL}/api/availability?boatId=${encodeURIComponent(args.boatId)}&date=${args.date}`);
        if (!res.ok) {
          const errorBody = await res.text();
          return TEXT({ error: `Availability lookup failed (HTTP ${res.status})`, details: errorBody });
        }
        const data = await res.json();
        return TEXT({
          boatId: args.boatId,
          date: args.date,
          ...data,
          bookingHint: `To create a hold, call request_booking_hold with the chosen startTime/endTime. Hold expires in 30 minutes.`,
        });
      } catch (err) {
        logger.warn("[mcp-public] check_availability fetch failed", { err: err instanceof Error ? err.message : String(err) });
        return TEXT({ error: "Internal lookup failed", boatId: args.boatId, date: args.date });
      }
    },
  );

  // -------------------------------------------------------------------------
  // 3) get_pricing_calendar
  // -------------------------------------------------------------------------
  server.tool(
    "get_pricing_calendar",
    "Per-day pricing for a boat+duration over a date range (max 120 days). Shows base price and final price after any active overrides (weekend surcharge, seasonal events).",
    {
      boatId: z.string().min(1),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      duration: z.enum(["1h", "2h", "3h", "4h", "6h", "8h"]),
    },
    async (args) => {
      try {
        const overrides = await storage.loadActiveOverridesForRange(args.from, args.to, args.boatId);
        const fromDate = new Date(`${args.from}T00:00:00Z`);
        const toDate = new Date(`${args.to}T00:00:00Z`);
        const rangeDays = Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;
        if (rangeDays < 1 || rangeDays > 120) {
          return TEXT({ error: "Range must be between 1 and 120 days" });
        }
        const days: Array<Record<string, unknown>> = [];
        for (let i = 0; i < rangeDays; i++) {
          const day = new Date(fromDate.getTime() + i * 86400000);
          const dateStr = day.toISOString().slice(0, 10);
          try {
            const b = calculatePricingBreakdown(args.boatId, day, args.duration as Duration, [], [], overrides);
            days.push({
              date: dateStr,
              basePrice: b.basePriceBeforeOverride ?? b.basePrice,
              finalPrice: b.basePrice,
              hasOverride: !!b.appliedOverride,
              overrideLabel: b.appliedOverride?.label,
            });
          } catch {
            days.push({ date: dateStr, available: false, reason: "out_of_season_or_unknown_boat" });
          }
        }
        return TEXT({ boatId: args.boatId, duration: args.duration, days });
      } catch (err) {
        logger.warn("[mcp-public] get_pricing_calendar failed", { err: err instanceof Error ? err.message : String(err) });
        return TEXT({ error: "Internal pricing lookup failed" });
      }
    },
  );

  // -------------------------------------------------------------------------
  // 4) list_routes
  // -------------------------------------------------------------------------
  server.tool(
    "list_routes",
    "List the 5 maritime routes departing from Puerto de Blanes: GPS waypoints, distance, estimated time, difficulty and highlights. Includes which boats can navigate the route (license-free range is 2 NM).",
    {},
    async () => {
      const enriched = boatRoutes.map((r) => ({
        id: r.id,
        name: r.descriptions.en.name,
        nameEs: r.descriptions.es.name,
        description: r.descriptions.en.description,
        distance: r.distance,
        estimatedTime: r.estimatedTime,
        difficulty: r.difficulty,
        coordinates: r.coordinates,
        highlights: r.highlights,
      }));
      return TEXT({ count: enriched.length, routes: enriched });
    },
  );

  // -------------------------------------------------------------------------
  // 5) get_faq
  // -------------------------------------------------------------------------
  server.tool(
    "get_faq",
    "Search the FAQ knowledge base. Optional free-text query and language filter. Returns up to 20 matching Q&A entries.",
    {
      query: z.string().max(200).optional(),
      lang: z.enum(["es", "en", "ca", "fr", "de", "nl", "it", "ru"]).optional(),
      limit: z.number().int().min(1).max(20).optional(),
    },
    async (args) => {
      try {
        const conds = [eq(schema.seoFaqs.active, true)];
        if (args.lang) conds.push(eq(schema.seoFaqs.language, args.lang));
        if (args.query) {
          const like = `%${args.query.toLowerCase()}%`;
          conds.push(
            or(
              ilike(schema.seoFaqs.question, like),
              ilike(schema.seoFaqs.answer, like),
            )!,
          );
        }
        const rows = await db
          .select({
            question: schema.seoFaqs.question,
            answer: schema.seoFaqs.answer,
            page: schema.seoFaqs.page,
            language: schema.seoFaqs.language,
          })
          .from(schema.seoFaqs)
          .where(and(...conds))
          .orderBy(desc(schema.seoFaqs.sortOrder))
          .limit(args.limit ?? 20);
        return TEXT({
          total: rows.length,
          results: rows.map((r) => ({
            ...r,
            faqUrl: `${BASE_URL}/${r.language === "es" ? "" : r.language + "/"}faq`,
          })),
        });
      } catch (err) {
        logger.warn("[mcp-public] get_faq failed", { err: err instanceof Error ? err.message : String(err) });
        return TEXT({ error: "FAQ lookup failed" });
      }
    },
  );

  // -------------------------------------------------------------------------
  // 6) search_knowledge
  // -------------------------------------------------------------------------
  server.tool(
    "search_knowledge",
    "Free-text search across boats, FAQs, glossary terms and routes. Returns ranked results with snippets and citation URLs. (Keyword scoring today; will upgrade to hybrid dense+sparse with reranker in a future release.)",
    {
      query: z.string().min(2).max(200),
      limit: z.number().int().min(1).max(20).optional(),
    },
    async (args) => {
      try {
        const res = await fetch(`${BASE_URL}/api/ai-search?q=${encodeURIComponent(args.query)}&limit=${args.limit ?? 10}`);
        if (!res.ok) return TEXT({ error: `Search failed (HTTP ${res.status})` });
        const data = await res.json();
        return TEXT(data);
      } catch (err) {
        logger.warn("[mcp-public] search_knowledge failed", { err: err instanceof Error ? err.message : String(err) });
        return TEXT({ error: "Knowledge search failed" });
      }
    },
  );

  // -------------------------------------------------------------------------
  // 7) get_business_info
  // -------------------------------------------------------------------------
  server.tool(
    "get_business_info",
    "Canonical business context as Schema.org JSON-LD graph: legalName (DAMAR COSTA BRAVA S.L.), VAT, fleet, season Event, live Google rating + reviews, destinations and disambiguation against competitors with similar names.",
    {
      lang: z.enum(["es", "en", "ca", "fr", "de", "nl", "it", "ru"]).optional(),
    },
    async (args) => {
      try {
        const url = `${BASE_URL}/api/ai-context${args.lang ? `?lang=${args.lang}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) return TEXT({ error: `Context fetch failed (HTTP ${res.status})` });
        const data = await res.json();
        return TEXT(data);
      } catch (err) {
        logger.warn("[mcp-public] get_business_info failed", { err: err instanceof Error ? err.message : String(err) });
        return TEXT({ error: "Business info fetch failed" });
      }
    },
  );

  // -------------------------------------------------------------------------
  // 8) request_booking_hold
  // -------------------------------------------------------------------------
  server.tool(
    "request_booking_hold",
    "Create a temporary 30-minute booking hold for a boat at a specific date/time/duration. Returns a holdId and price quote. The hold expires automatically; to convert it into a real booking request the customer must submit their contact info via the web form at https://www.costabravarentaboat.com/booking?holdId=… (the team contacts them within 24h to arrange payment in person — no online payment).",
    {
      boatId: z.string().min(1).max(64),
      startTime: z.string().datetime().describe("ISO 8601 datetime, e.g. 2026-07-15T10:00:00.000Z"),
      endTime: z.string().datetime(),
      numberOfPeople: z.number().int().min(1).max(20),
      extras: z.array(z.string().max(64)).max(10).optional(),
    },
    async (args) => {
      try {
        const res = await fetch(`${BASE_URL}/api/quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boatId: args.boatId,
            startTime: args.startTime,
            endTime: args.endTime,
            numberOfPeople: args.numberOfPeople,
            extras: args.extras ?? [],
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return TEXT({ error: data?.message ?? "Quote failed", reason: data?.reason, status: res.status });
        }
        return TEXT({
          ...data,
          nextStep: `To convert this hold into a real booking, the customer must submit their name + email + phone via the web form at ${BASE_URL}/booking?holdId=${data.holdId}. Then the team will contact them within 24h to arrange payment in person at the port. No online payment available.`,
          expiresInMinutes: 30,
        });
      } catch (err) {
        logger.warn("[mcp-public] request_booking_hold failed", { err: err instanceof Error ? err.message : String(err) });
        return TEXT({ error: "Internal hold creation failed" });
      }
    },
  );

  // -------------------------------------------------------------------------
  // 9) get_glossary
  // -------------------------------------------------------------------------
  server.tool(
    "get_glossary",
    "Return the 18-term nautical glossary (LNB, PER, milla náutica, fondear, eslora, cala, etc.) with full definitions in Spanish. Useful for answering 'what is X' style queries with authoritative wording.",
    {},
    async () => {
      return TEXT({
        count: NAUTICAL_GLOSSARY_ES.length,
        terms: NAUTICAL_GLOSSARY_ES.map((t) => ({
          term: t.term,
          definition: t.definition,
          category: t.category,
        })),
      });
    },
  );
}
