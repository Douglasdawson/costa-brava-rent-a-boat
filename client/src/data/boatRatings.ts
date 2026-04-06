// Pre-computed boat ratings — lightweight (~200 bytes) for eager import.
// Full review texts live in boatReviews.ts and are lazy-loaded.

export const BOAT_RATINGS: Record<string, { average: number; count: number }> = {
  "solar-450": { average: 4.7, count: 262 },
  "remus-450": { average: 4.7, count: 263 },
  "remus-450-ii": { average: 4.7, count: 263 },
  "astec-400": { average: 4.6, count: 259 },
  "astec-480": { average: 4.6, count: 261 },
  "mingolla-brava-19": { average: 4.7, count: 262 },
  "trimarchi-57s": { average: 4.7, count: 263 },
  "pacific-craft-625": { average: 4.7, count: 262 },
  "excursion-privada": { average: 4.8, count: 264 },
};

export function getBoatAverageRating(boatId: string): { average: number; count: number } {
  return BOAT_RATINGS[boatId] || { average: 0, count: 0 };
}
