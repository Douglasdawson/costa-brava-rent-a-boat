// shared/occasionMatrix.ts
//
// Defines the SCOPE of the programmatic page matrix (occasion × location) and
// enumerates the combinations a generator / sitemap will iterate. Structure
// only — no copy, no routes. Kept deliberately small and curated (NOT a blind
// cartesian explosion): we seed with the indexable, content-rich coastal towns
// and let the anti-thin-content guard (server/seo/thinContentGuard.ts) cull any
// combination that doesn't earn engagement, so long-tail coverage grows without
// thin-content risk.

import type { PageKey } from "./i18n-routes";
import { OCCASION_LIST, type Occasion } from "./occasions";

// Matrix-eligible locations: the rich, 8-locale-indexable pages (see
// server/seo/translatedStaticPaths.ts). Typed as PageKey so tsc rejects any
// slug that isn't a real route. Expand cautiously as content proves out.
export const MATRIX_LOCATION_KEYS = [
  "locationBlanes",
  "locationLloret",
  "locationTossa",
  "locationCostaBrava",
] as const satisfies readonly PageKey[];

export type MatrixLocationKey = (typeof MATRIX_LOCATION_KEYS)[number];

export interface MatrixCombo {
  occasion: Occasion;
  locationKey: MatrixLocationKey;
}

/** Every (occasion × eligible-location) combination the matrix should generate. */
export function enumerateMatrix(): MatrixCombo[] {
  const combos: MatrixCombo[] = [];
  for (const occasion of OCCASION_LIST) {
    for (const locationKey of MATRIX_LOCATION_KEYS) {
      combos.push({ occasion, locationKey });
    }
  }
  return combos;
}

/** Total seed size of the matrix (occasions × eligible locations). */
export const MATRIX_SIZE = OCCASION_LIST.length * MATRIX_LOCATION_KEYS.length;
