// Unified operating constants for Costa Brava Rent a Boat
// All times are in Europe/Madrid timezone

// Operating hours (Madrid timezone)
export const OPERATING_START_HOUR = 9;
export const OPERATING_END_HOUR = 20;

// Season months (1-indexed)
export const SEASON_START_MONTH = 4; // April
export const SEASON_END_MONTH = 10; // October

// Normalize customer-typed names ("Raul RIVELLES GARCIA" -> "Raul Rivelles Garcia").
// Capitalizes after space, hyphen and apostrophe; caseless scripts (Chinese) pass through.
export function formatPersonName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es")
    .replace(/(^|[\s\-'])\p{L}/gu, m => m.toLocaleUpperCase("es"));
}
