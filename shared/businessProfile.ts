// Single source of truth for business profile data that appears in
// JSON-LD schemas, meta tags and UI (Google aggregateRating, TrustBadges, etc.).
// Change here → changes everywhere.
//
// WHEN TO UPDATE:
// - Rating / review count: when the values change in Google Maps.
//   Manual update until S3, where gbpSync will auto-refresh from
//   Google Business Profile API into the `business_stats` DB row.
//   The values here are the STATIC FALLBACK used when no DB row
//   exists yet and the FALLBACK embedded in static JSON-LD schemas
//   generated at build time (category pages, about page, home HTML).
// - Address / phone / openingHours / coords: only if the business changes.
//
// RULE: never hardcode rating/review count outside this file.

export const BUSINESS_RATING = 4.8;
export const BUSINESS_REVIEW_COUNT = 323;
export const BUSINESS_RATING_LAST_UPDATED = "2026-05-21";

// String variants for JSON-LD schemas that expect string values.
export const BUSINESS_RATING_STR = BUSINESS_RATING.toFixed(1);
export const BUSINESS_REVIEW_COUNT_STR = String(BUSINESS_REVIEW_COUNT);

export const BUSINESS_DISPLAY_NAME = "Costa Brava Rent a Boat - Blanes";

// Fiscal entity (razón social) — used for JSON-LD `legalName`, invoices,
// terms-and-conditions, and AI disambiguation. The commercial brand above is
// the consumer-facing name; this is the legal company that owns it.
export const BUSINESS_LEGAL_NAME = "DAMAR COSTA BRAVA S.L.";
export const BUSINESS_VAT_ID = "ESB22566327";
export const BUSINESS_TAX_ID = "B22566327";

// Wikidata entity ID (Q-prefixed). Wikidata's notability policy makes it
// risky for a local SMB; we deprioritised this in favour of OpenStreetMap
// (see below). Kept as an optional slot — if a Wikidata item is eventually
// created and survives notability review, paste its QID here and it
// auto-propagates to /api/ai-context sameAs[] and identifier[].
export const BUSINESS_WIKIDATA_QID = "";

// OpenStreetMap canonical IDs. OSM accepts local businesses by design
// (no notability gate). ChatGPT / Claude / Perplexity all read OSM for
// entity resolution of physical locations.
//   • BUSINESS_OSM_TYPE: "node" | "way" | "relation" (typical for a
//     boat-rental kiosk: "node")
//   • BUSINESS_OSM_ID:   numeric ID — paste once the node is created via
//     openstreetmap.org/edit (instructions in
//     docs/handoff/2026-05-24-ai-pending-manual-steps.md)
// Empty values are omitted from JSON-LD downstream.
export const BUSINESS_OSM_TYPE: "node" | "way" | "relation" | "" = "";
export const BUSINESS_OSM_ID = "";

// Google Business Profile Place ID. Single source of truth. Verified via
// Places API v1 (rating 4.8, 310 reviews, name "Costa Brava Rent a Boat - Blanes").
// Used to build the canonical "write review" URL that opens the correct GBP.
export const BUSINESS_PLACE_ID = "ChIJb4WolCwXuxIRp-DybpP6LZo";
export const GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${BUSINESS_PLACE_ID}`;
