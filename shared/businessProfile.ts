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
export const BUSINESS_REVIEW_COUNT = 310;
export const BUSINESS_RATING_LAST_UPDATED = "2026-04-22";

// String variants for JSON-LD schemas that expect string values.
export const BUSINESS_RATING_STR = BUSINESS_RATING.toFixed(1);
export const BUSINESS_REVIEW_COUNT_STR = String(BUSINESS_REVIEW_COUNT);

export const BUSINESS_DISPLAY_NAME = "Costa Brava Rent a Boat - Blanes";
