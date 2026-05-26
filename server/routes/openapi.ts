/**
 * OpenAPI 3.1 specification served at /openapi.json.
 *
 * Documents every public endpoint an AI agent / external integration would
 * realistically call: availability, pricing calendar, quote (booking hold),
 * submit-request, cancel info, plus the AI-discovery endpoints (ai-context,
 * ai-search, ai-glossary, feed-llms.json, MCP public).
 *
 * Custom extensions:
 *   x-ai-friendly: true            — operation/spec is intended for agents
 *   x-mcp-tool: true               — also available as an MCP tool
 *   x-business-context: <url>      — link back to /api/ai-context
 *
 * Spec is generated dynamically so live values (rating, review count,
 * BASE_URL, season year) stay current — no rebuild needed when GBP refreshes.
 */

import type { Express } from "express";
import { BUSINESS_RATING_STR, BUSINESS_REVIEW_COUNT_STR } from "../../shared/businessProfile";

const BASE_URL = process.env.BASE_URL || "https://www.costabravarentaboat.com";

function buildOpenApiDoc() {
  const seasonYear = new Date().getFullYear();

  return {
    openapi: "3.1.0",
    info: {
      title: "Costa Brava Rent a Boat — Public API",
      version: "1.0.0",
      summary:
        "Boat rental availability, pricing and request-booking endpoints + AI discovery surface.",
      description: [
        `Operated by DAMAR COSTA BRAVA S.L. (Spanish VAT ESB22566327).`,
        `Largest boat rental fleet in Blanes (Costa Brava, Spain). ${BUSINESS_RATING_STR}/5 on Google Maps with ${BUSINESS_REVIEW_COUNT_STR}+ reviews.`,
        ``,
        `### Booking model`,
        `The site captures **booking requests**, not online payments. The full flow is:`,
        `1. \`POST /api/quote\` — create a 30-minute hold and get a price quote.`,
        `2. \`POST /api/bookings/submit-request\` — promote the hold to a request with the customer's contact info.`,
        `3. The team contacts the customer within 24h to confirm and arrange payment in person at the port.`,
        ``,
        `### For AI agents`,
        `- Native MCP server at \`/api/mcp/public\` exposes the same functionality as tools.`,
        `- Machine-readable business context at [/api/ai-context](${BASE_URL}/api/ai-context).`,
        `- Semantic Q&A search at \`/api/ai-search?q=…\`.`,
        `- llms.txt at [${BASE_URL}/llms.txt](${BASE_URL}/llms.txt) (also \`/es/\`, \`/fr/\`, \`/de/\`, \`/it/\`).`,
      ].join("\n"),
      termsOfService: `${BASE_URL}/terminos-condiciones`,
      contact: {
        name: "Costa Brava Rent a Boat",
        email: "costabravarentaboat@gmail.com",
        url: BASE_URL,
      },
      license: { name: "Proprietary", url: `${BASE_URL}/terminos-condiciones` },
    },
    servers: [{ url: BASE_URL, description: "Production" }],
    "x-ai-friendly": true,
    "x-business-context": `${BASE_URL}/api/ai-context`,
    "x-llms-txt": `${BASE_URL}/llms.txt`,
    "x-mcp-server": `${BASE_URL}/api/mcp/public`,
    tags: [
      { name: "Availability", description: "Real-time slot availability for boats." },
      { name: "Pricing", description: "Seasonal pricing with override-aware calendar." },
      { name: "Booking", description: "Create a hold, then promote it to a request." },
      { name: "AI Discovery", description: "Endpoints designed for AI agents and answer engines." },
    ],
    paths: {
      "/api/availability": {
        get: {
          tags: ["Availability"],
          operationId: "getAvailability",
          summary: "Get available start slots for a boat on a given date.",
          description:
            "Returns half-hour start slots with the maximum continuous duration available from each slot. Empty arrays outside the April–October season.",
          "x-ai-friendly": true,
          "x-mcp-tool": "check_availability",
          parameters: [
            {
              name: "boatId",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 1, maxLength: 64 },
              example: "solar-450",
            },
            {
              name: "date",
              in: "query",
              required: true,
              schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
              example: "2026-07-15",
            },
          ],
          responses: {
            "200": {
              description: "Availability for that boat+date.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AvailabilityResponse" },
                  example: {
                    availableSlots: [
                      { time: "09:00", maxDuration: 8 },
                      { time: "10:00", maxDuration: 7 },
                    ],
                    unavailableSlots: ["12:30", "13:00"],
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/pricing/calendar": {
        get: {
          tags: ["Pricing"],
          operationId: "getPricingCalendar",
          summary: "Per-day pricing for a boat+duration over a date range.",
          description:
            "Returns base price (seasonal rate-card) and final price (after any active overrides). Maximum range: 120 days.",
          "x-ai-friendly": true,
          "x-mcp-tool": "get_pricing_calendar",
          parameters: [
            {
              name: "boatId",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 1 },
              example: "remus-450",
            },
            {
              name: "from",
              in: "query",
              required: true,
              schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
              example: `${seasonYear}-07-01`,
            },
            {
              name: "to",
              in: "query",
              required: true,
              schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
              example: `${seasonYear}-07-31`,
            },
            {
              name: "duration",
              in: "query",
              required: true,
              schema: { type: "string", enum: ["1h", "2h", "3h", "4h", "6h", "8h"] },
              example: "4h",
            },
          ],
          responses: {
            "200": {
              description: "Daily pricing breakdown.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PricingCalendarResponse" },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/api/quote": {
        post: {
          tags: ["Booking"],
          operationId: "createQuote",
          summary: "Create a 30-minute booking hold and get the total amount.",
          description:
            "Validates date, season, operating hours, capacity, applies pricing overrides and discount codes. Returns a `holdId` that must be promoted to a request via `/api/bookings/submit-request` within 30 minutes.",
          "x-ai-friendly": true,
          "x-mcp-tool": "request_booking_hold",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/QuoteRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Hold created.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/QuoteResponse" },
                },
              },
            },
            "400": {
              description:
                "Validation failed (past date, invalid range, out of operating hours, capacity exceeded, etc.).",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/QuoteError" },
                },
              },
            },
          },
        },
      },
      "/api/bookings/submit-request": {
        post: {
          tags: ["Booking"],
          operationId: "submitBookingRequest",
          summary: "Promote a hold to a booking request with the customer's contact info.",
          description:
            "Requires the `holdId` returned by `/api/quote`. Sends a confirmation email to the customer and an admin notification. No online payment — the team contacts the customer in <24h.",
          "x-ai-friendly": true,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SubmitRequestBody" },
              },
            },
          },
          responses: {
            "200": {
              description: "Request submitted.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SubmitRequestResponse" },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { description: "Hold not found." },
            "409": { description: "Hold already confirmed or cancelled." },
            "410": { description: "Hold expired (>30 min since /api/quote)." },
          },
        },
      },
      "/api/bookings/cancel-info/{token}": {
        get: {
          tags: ["Booking"],
          operationId: "getCancelInfo",
          summary: "Booking info for cancellation flow, addressed by cancelation token.",
          parameters: [
            {
              name: "token",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": { description: "Cancel info. Refund is always 0 per current policy." },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/ai-context": {
        get: {
          tags: ["AI Discovery"],
          operationId: "getAiContext",
          summary: "Schema.org LocalBusiness JSON-LD with live fleet, rating, season Event.",
          description:
            "Single source of truth for AI agents: legalName, vatID, productCatalog (Schema.org Product[] per boat), event (season), reviews (live from Google Business Profile). Supports `?lang=` for localized prose fields.",
          "x-ai-friendly": true,
          "x-mcp-tool": "get_business_info",
          parameters: [
            {
              name: "lang",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["es", "en", "ca", "fr", "de", "nl", "it", "ru"],
                default: "en",
              },
            },
          ],
          responses: {
            "200": {
              description: "JSON-LD document.",
              content: { "application/ld+json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/api/ai-search": {
        get: {
          tags: ["AI Discovery"],
          operationId: "searchKnowledge",
          summary: "Keyword/hybrid Q&A search over boats, FAQs, glossary and routes.",
          "x-ai-friendly": true,
          "x-mcp-tool": "search_knowledge",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 2 },
              example: "boat for 5 people with shade",
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
            },
          ],
          responses: {
            "200": {
              description: "Top results with snippets and citation URLs.",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/api/ai-glossary": {
        get: {
          tags: ["AI Discovery"],
          operationId: "getGlossary",
          summary: "Schema.org DefinedTermSet — 18 nautical terms.",
          "x-ai-friendly": true,
          parameters: [
            {
              name: "lang",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["es", "en", "ca", "fr", "de", "nl", "it", "ru"] },
            },
          ],
          responses: {
            "200": {
              description: "DefinedTermSet JSON-LD.",
              content: { "application/ld+json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/feed-llms.json": {
        get: {
          tags: ["AI Discovery"],
          operationId: "getContentFeed",
          summary: "JSON Feed v1.1 — latest blog posts and boats for crawler discovery.",
          "x-ai-friendly": true,
          responses: {
            "200": {
              description: "JSON Feed document.",
              content: { "application/feed+json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/api/mcp/public": {
        post: {
          tags: ["AI Discovery"],
          operationId: "mcpJsonRpc",
          summary: "Model Context Protocol endpoint (JSON-RPC 2.0 over HTTP).",
          description:
            "Public MCP server. No authentication required. Exposes tools: search_boats, check_availability, get_pricing_calendar, list_routes, get_faq, search_knowledge, get_business_info, request_booking_hold. Configure your MCP client with `{ url: \"" +
            BASE_URL +
            "/api/mcp/public\", transport: \"http\" }`.",
          "x-ai-friendly": true,
          requestBody: {
            description: "JSON-RPC 2.0 envelope per MCP spec.",
            required: true,
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: {
            "200": { description: "JSON-RPC response." },
            "401": { description: "Rate-limited (60 req/min/IP)." },
          },
        },
      },
    },
    components: {
      schemas: {
        AvailabilityResponse: {
          type: "object",
          required: ["availableSlots", "unavailableSlots"],
          properties: {
            availableSlots: {
              type: "array",
              items: {
                type: "object",
                required: ["time", "maxDuration"],
                properties: {
                  time: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  maxDuration: { type: "integer", minimum: 1, maximum: 11 },
                },
              },
            },
            unavailableSlots: { type: "array", items: { type: "string" } },
          },
        },
        PricingCalendarResponse: {
          type: "object",
          required: ["boatId", "duration", "days"],
          properties: {
            boatId: { type: "string" },
            duration: { type: "string", enum: ["1h", "2h", "3h", "4h", "6h", "8h"] },
            days: {
              type: "array",
              items: {
                type: "object",
                required: ["date", "basePrice", "finalPrice", "hasOverride"],
                properties: {
                  date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                  basePrice: { type: "number" },
                  finalPrice: { type: "number" },
                  hasOverride: { type: "boolean" },
                  overrideLabel: { type: "string" },
                },
              },
            },
          },
        },
        QuoteRequest: {
          type: "object",
          required: ["boatId", "startTime", "endTime", "numberOfPeople"],
          properties: {
            boatId: { type: "string", minLength: 1, maxLength: 64 },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            numberOfPeople: { type: "integer", minimum: 1, maximum: 20 },
            extras: { type: "array", items: { type: "string", maxLength: 64 }, maxItems: 10 },
            discountCode: { type: "string", maxLength: 30 },
          },
        },
        QuoteResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            holdId: { type: "string", format: "uuid" },
            totalAmount: { type: "string" },
            breakdown: {
              type: "object",
              properties: {
                basePrice: { type: "number" },
                discountLabel: { type: "string" },
                discountAmount: { type: "number" },
                finalPrice: { type: "number" },
              },
            },
          },
        },
        QuoteError: {
          type: "object",
          properties: {
            message: { type: "string" },
            available: { type: "boolean" },
            reason: {
              type: "string",
              enum: [
                "missing_fields",
                "past_date",
                "invalid_time_range",
                "out_of_season",
                "out_of_operating_hours",
                "capacity_exceeded",
                "boat_not_found",
              ],
            },
          },
        },
        SubmitRequestBody: {
          type: "object",
          required: [
            "holdId",
            "termsAccepted",
            "customerName",
            "customerSurname",
            "customerEmail",
            "customerPhone",
            "customerNationality",
          ],
          properties: {
            holdId: { type: "string", format: "uuid" },
            termsAccepted: { type: "boolean", const: true },
            customerName: { type: "string", minLength: 1, maxLength: 80 },
            customerSurname: { type: "string", minLength: 1, maxLength: 80 },
            customerEmail: { type: "string", format: "email", maxLength: 160 },
            customerPhone: { type: "string", minLength: 4, maxLength: 40 },
            customerNationality: { type: "string", minLength: 1, maxLength: 40 },
            language: { type: "string", minLength: 2, maxLength: 5 },
          },
        },
        SubmitRequestResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            bookingId: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["requested"] },
            message: { type: "string" },
          },
        },
        Error: {
          type: "object",
          properties: { message: { type: "string" } },
        },
      },
      responses: {
        BadRequest: {
          description: "Validation failed.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        NotFound: {
          description: "Resource not found.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
      },
    },
  };
}

export function registerOpenApiRoutes(app: Express): void {
  app.get("/openapi.json", (_req, res) => {
    const doc = buildOpenApiDoc();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.json(doc);
  });

  // Alias commonly used by SDK tooling
  app.get("/openapi.yaml", (_req, res) => {
    res.redirect(308, "/openapi.json");
  });
}
