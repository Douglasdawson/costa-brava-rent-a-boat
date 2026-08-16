// Unified operating constants for Costa Brava Rent a Boat
// All times are in Europe/Madrid timezone

// Operating hours (Madrid timezone)
export const OPERATING_START_HOUR = 9;
export const OPERATING_END_HOUR = 20;

// Season months (1-indexed)
export const SEASON_START_MONTH = 4; // April
export const SEASON_END_MONTH = 10; // October

// RD 1188/2025 (BOE 2025-12-30): from October 1, 2026 every rental customer must hold a
// nautical qualification. The 5 m / 15 HP exemption of RD 875/2014 survives for privately
// owned boats only. Last day the license-free rental offer is legal:
export const LICENSE_FREE_LAST_DAY = "2026-09-30";

// True while the license-free offer is still legal. Drives the dual copy on the homepage:
// on October 1 the "until Sept 30" messaging switches itself off with no code change.
// NOTE: prerendered snapshots freeze the HTML at build time, so a redeploy is still needed
// on 2026-10-01 for the static snapshots to catch up.
export function isLicenseFreeEraActive(now: Date = new Date()): boolean {
  // sv-SE renders YYYY-MM-DD; the timeZone keeps the switch on Madrid midnight, not UTC.
  return now.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" }) <= LICENSE_FREE_LAST_DAY;
}

// Normalize customer-typed names ("Raul RIVELLES GARCIA" -> "Raul Rivelles Garcia").
// Capitalizes after space, hyphen and apostrophe; caseless scripts (Chinese) pass through.
export function formatPersonName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es")
    .replace(/(^|[\s\-'])\p{L}/gu, m => m.toLocaleUpperCase("es"));
}
