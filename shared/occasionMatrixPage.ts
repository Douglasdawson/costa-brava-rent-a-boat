// shared/occasionMatrixPage.ts
//
// Resolution layer for a single programmatic matrix page (occasion × location).
// Turns a MatrixCombo into the structural data a page / sitemap / internal-link
// needs — WITHOUT any visible copy (copy stays in client/src/i18n/<lang>.ts and
// is referenced via the occasion routeKey + location pageKey) and WITHOUT a URL
// scheme yet (the matrix slug strategy is decided separately, then layered on a
// `slugFor` helper). Pure + side-effect-free.
//
// Indexability is DERIVED from the single source of truth
// (server/seo/translatedStaticPaths.ts via hasStaticTranslation): a combo is
// only indexable in a language when BOTH its occasion page and its location
// page are already indexable in that language. This guarantees the matrix can
// never open a locale before its two parent pages carry native content.

import type { Duration } from "./pricing";
import type { LangCode } from "./seoConstants";
import { getSlugForPage, resolveSlug, type PageKey } from "./i18n-routes";
import { getOccasion, type Occasion, type OccasionId } from "./occasions";
import { getOccasionBoats, type OccasionBoat } from "./occasionData";
import { type MatrixCombo, type MatrixLocationKey } from "./occasionMatrix";

const ALL_LANGS: readonly LangCode[] = ["es", "en", "fr", "de", "ca", "nl", "it", "ru"];

// ── Slug vocabulary ────────────────────────────────────────────────────────
// Composite dedicated slug = `${occasionWord[lang]}-${placeToken}`. Both pieces
// are STRUCTURAL (URL tokens, like ROUTE_SLUGS) — not visible copy. The occasion
// word is the localized search term; the place token is a language-invariant
// proper noun shared with the location's own slug.

const OCCASION_SLUG_WORD: Record<OccasionId, Record<LangCode, string>> = {
  snorkel: { es: "snorkel", en: "snorkel", fr: "snorkeling", de: "schnorcheln", ca: "snorkel", nl: "snorkelen", it: "snorkeling", ru: "snorkeling" },
  families: { es: "familias", en: "family", fr: "famille", de: "familien", ca: "families", nl: "familie", it: "famiglia", ru: "semya" },
  sunset: { es: "atardecer", en: "sunset", fr: "coucher-soleil", de: "sonnenuntergang", ca: "posta-sol", nl: "zonsondergang", it: "tramonto", ru: "zakat" },
  fishing: { es: "pesca", en: "fishing", fr: "peche", de: "angeln", ca: "pesca", nl: "vissen", it: "pesca", ru: "rybalka" },
};

const MATRIX_LOCATION_PLACE: Record<MatrixLocationKey, string> = {
  locationBlanes: "blanes",
  locationLloret: "lloret-de-mar",
  locationTossa: "tossa-de-mar",
  locationCostaBrava: "costa-brava",
};

/** Localized composite slug for a combo, e.g. ("snorkel","locationTossa","de") → "schnorcheln-tossa-de-mar". */
export function matrixSlug(occasionId: OccasionId, locationKey: MatrixLocationKey, lang: LangCode): string {
  return `${OCCASION_SLUG_WORD[occasionId][lang]}-${MATRIX_LOCATION_PLACE[locationKey]}`;
}

/** Localized path for a combo, e.g. "/de/schnorcheln-tossa-de-mar". */
export function matrixPath(occasionId: OccasionId, locationKey: MatrixLocationKey, lang: LangCode): string {
  return `/${lang}/${matrixSlug(occasionId, locationKey, lang)}`;
}

/**
 * Defensive: returns matrix slugs that collide with an existing ROUTE_SLUGS slug
 * (any language) — must be empty before the matrix is wired into routing/sitemap.
 */
export function matrixSlugCollisions(combos: MatrixCombo[]): string[] {
  const collisions = new Set<string>();
  for (const combo of combos) {
    for (const lang of ALL_LANGS) {
      const slug = matrixSlug(combo.occasion.id, combo.locationKey, lang);
      if (resolveSlug(slug)) collisions.add(slug);
    }
  }
  return [...collisions];
}

export interface MatrixSitemapEntry {
  comboId: string;
  /** Localized alternates, one per indexable language — ready for hreflang emission. */
  alternates: Array<{ lang: LangCode; path: string }>;
}

/**
 * Sitemap/hreflang entries for the matrix. Each combo yields one entry listing
 * only the languages where BOTH parent pages are indexable (via the injected
 * predicate — pass hasStaticTranslation). Combos with no indexable language are
 * dropped. Pure: gating on OCCASION_MATRIX_ENABLED is the caller's job, so the
 * sitemap never emits matrix URLs until the master switch is on.
 */
export function enumerateMatrixSitemapEntries(
  combos: MatrixCombo[],
  isIndexable: (metaKey: string, lang: LangCode) => boolean,
): MatrixSitemapEntry[] {
  const entries: MatrixSitemapEntry[] = [];
  for (const combo of combos) {
    const langs = indexableLangsForCombo(combo, isIndexable);
    if (langs.length === 0) continue;
    entries.push({
      comboId: comboId(combo.occasion.id, combo.locationKey),
      alternates: langs.map((lang) => ({
        lang,
        path: matrixPath(combo.occasion.id, combo.locationKey, lang),
      })),
    });
  }
  return entries;
}

export interface MatrixPageData {
  /** Stable identity for the combo, e.g. "snorkel__locationTossa". */
  comboId: string;
  occasion: Occasion;
  locationKey: MatrixLocationKey;
  /** PageKey of the occasion's standalone activity page (copy source). */
  occasionRouteKey: PageKey;
  /** Boats recommended for this occasion, resolved against the live catalog. */
  boats: OccasionBoat[];
  /** Durations that make commercial sense for this occasion. */
  durations: Duration[];
}

/** Stable id for a combo, independent of language/URL. */
export function comboId(occasionId: OccasionId, locationKey: MatrixLocationKey): string {
  return `${occasionId}__${locationKey}`;
}

/** ES path of a page key, normalized to a leading-slash metaKey for translatedStaticPaths. */
function metaKeyFor(pageKey: PageKey): string {
  return `/${getSlugForPage(pageKey, "es")}`;
}

/**
 * Resolve a combo to its structural page data. Returns null if the occasion id
 * is unknown (defensive — should never happen for an enumerated combo).
 */
export function resolveMatrixCombo(combo: MatrixCombo): MatrixPageData | null {
  const occasion = getOccasion(combo.occasion.id);
  if (!occasion) return null;
  return {
    comboId: comboId(occasion.id, combo.locationKey),
    occasion,
    locationKey: combo.locationKey,
    occasionRouteKey: occasion.routeKey,
    boats: getOccasionBoats(occasion.id),
    durations: occasion.recommendedDurations,
  };
}

/**
 * Languages in which a combo may be indexed: the intersection of the locales
 * where its occasion page AND its location page are already translated/indexable
 * (per the single source). Requires an `isIndexable(metaKey, lang)` predicate so
 * this module stays dependency-free of server code — callers pass
 * `hasStaticTranslation` from server/seo/translatedStaticPaths.ts.
 */
export function indexableLangsForCombo(
  combo: MatrixCombo,
  isIndexable: (metaKey: string, lang: LangCode) => boolean,
): LangCode[] {
  const occasionMeta = metaKeyFor(combo.occasion.routeKey);
  const locationMeta = metaKeyFor(combo.locationKey);
  return ALL_LANGS.filter(
    (lang) => isIndexable(occasionMeta, lang) && isIndexable(locationMeta, lang),
  );
}
