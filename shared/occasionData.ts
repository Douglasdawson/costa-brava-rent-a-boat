// shared/occasionData.ts
//
// Resolution layer over the occasion taxonomy: turns the structural
// associations in occasions.ts into concrete catalog data the programmatic
// pages, internal-linking and sitemap can render. Pure + side-effect-free.

import { BOAT_DATA } from "./boatData";
import { OCCASIONS, type OccasionId } from "./occasions";

export interface OccasionBoat {
  id: string;
  name: string;
  capacity: string;
}

/**
 * Resolve an occasion's recommended boats to display data, dropping any id not
 * present in BOAT_DATA so a renamed/removed boat can never break a page.
 */
export function getOccasionBoats(occasionId: OccasionId): OccasionBoat[] {
  const occ = OCCASIONS[occasionId];
  if (!occ) return [];
  return occ.recommendedBoatIds
    .map((id) => {
      const b = BOAT_DATA[id];
      return b ? { id: b.id, name: b.name, capacity: b.specifications.capacity } : null;
    })
    .filter((b): b is OccasionBoat => b !== null);
}
