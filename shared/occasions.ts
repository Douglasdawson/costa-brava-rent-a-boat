// shared/occasions.ts
//
// Occasion taxonomy — the structural data model behind the programmatic SEO
// matrix (occasion × location × boat × duration). Promotes the four hand-built
// activity pages (snorkel / families / sunset / fishing) to typed data so the
// matrix generator, internal-linking and sitemap can consume them uniformly.
//
// IMPORTANT: this file holds STRUCTURE only (ids, route keys, associations) —
// never visible copy. All user-facing text lives in client/src/i18n/<lang>.ts
// under the existing activity sections and is referenced here via `routeKey` /
// `i18nKey`, so adding occasions never bypasses the i18n pipeline.

import type { Duration } from "./pricing";

export type OccasionId = "snorkel" | "families" | "sunset" | "fishing";

export interface Occasion {
  id: OccasionId;
  /** PageKey of the existing standalone activity page in shared/i18n-routes.ts ROUTE_SLUGS. */
  routeKey: "activitySnorkel" | "activityFamilies" | "activitySunset" | "activityFishing";
  /** Boats best suited to this occasion (ids from shared/boatData.ts), for boat×occasion
   *  programmatic pages and occasion→boat internal links. Ordered by relevance. */
  recommendedBoatIds: string[];
  /** Durations that make commercial sense for this occasion (subset of pricing Duration). */
  recommendedDurations: Duration[];
  /** Lucide icon name used by occasion UI. */
  icon: string;
}

// Boat associations respect the canonical fleet (see shared/boatData.ts):
//   sin licencia: solar-450, remus-450, remus-450-ii, astec-400, astec-480
//   con licencia: mingolla-brava-19, trimarchi-57s, pacific-craft-625
//   excursión con patrón: excursion-privada
export const OCCASIONS: Record<OccasionId, Occasion> = {
  snorkel: {
    id: "snorkel",
    routeKey: "activitySnorkel",
    // Sin-licencia boats reach the rocky calas best; fuel included.
    recommendedBoatIds: ["solar-450", "remus-450", "astec-480"],
    recommendedDurations: ["2h", "3h", "4h"],
    icon: "Waves",
  },
  families: {
    id: "families",
    routeKey: "activityFamilies",
    // Higher-capacity, easy-to-handle boats; pacific-craft-625 (7 pax) for big families.
    recommendedBoatIds: ["solar-450", "remus-450-ii", "pacific-craft-625"],
    recommendedDurations: ["2h", "3h", "4h"],
    icon: "Users",
  },
  sunset: {
    id: "sunset",
    routeKey: "activitySunset",
    // Comfortable cruisers for an evening cruise; shorter slots.
    recommendedBoatIds: ["trimarchi-57s", "solar-450", "remus-450"],
    recommendedDurations: ["1h", "2h", "3h"],
    icon: "Sunset",
  },
  fishing: {
    id: "fishing",
    routeKey: "activityFishing",
    // Licensed boats range further offshore; longer outings.
    recommendedBoatIds: ["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625"],
    recommendedDurations: ["3h", "4h", "6h"],
    icon: "Fish",
  },
};

export const OCCASION_LIST: readonly Occasion[] = Object.values(OCCASIONS);
export const OCCASION_IDS = Object.keys(OCCASIONS) as OccasionId[];

export function getOccasion(id: string): Occasion | undefined {
  return (OCCASIONS as Record<string, Occasion>)[id];
}
