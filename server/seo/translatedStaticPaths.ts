import type { LangCode } from "../../shared/seoConstants";

/**
 * Static (i.e. non-dynamic, non-DB-backed) pages whose UI copy is fully
 * translated in client/src/i18n/<lang>.ts for a listed set of locales.
 * Indexable in each listed locale even though they don't have a per-row DB
 * translation marker like blog posts do.
 *
 * This exists because seoInjector.computeTranslationIndex() defaults to
 * noindex-in-non-ES for every STATIC_META route, which is the right call
 * for pages that surface DB-only content (boats, destinations). Location
 * pages are different: the entire copy lives in t.locationPages.<slug>
 * with real translations in every listed locale, so noindex'ing them
 * throws away tracking like /de/boot-mieten-lloret-de-mar (position 1
 * for "boot mieten lloret de mar" pre-Round 2) for no content-duplication
 * reason.
 *
 * PR C seed: only Lloret + Tossa are listed because they're the two pages
 * rewritten in this round. Add other location pages here as their copy
 * gets the same Round 3 treatment. Keep the list scoped — marking every
 * STATIC_META route as indexable would re-open the duplicate-content risk
 * Round 2 closed.
 *
 * Keys are STATIC_META keys (Spanish canonical path, e.g. /alquiler-barcos-
 * lloret-de-mar). Values list the locales whose translated copy is
 * production-ready — if a locale still has Spanish leakage or stale copy,
 * drop it from the array and it will remain noindex until fixed.
 */
export const TRANSLATED_STATIC_PATHS: Readonly<Record<string, readonly LangCode[]>> = {
  "/alquiler-barcos-lloret-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/alquiler-barcos-tossa-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  // Costa Brava regional landing — Round 4 (2026-05-03). Server-side body
  // fallback now sources per-locale copy from client/src/i18n/<lang>.ts via
  // I18N_BY_LANG[lang].locationPages.costaBrava (see seoInjector.ts branch),
  // so each locale receives ~200-400 unique words of native content (hero,
  // intro paragraph, 5 cove descriptions). Marking all 8 locales indexable
  // unblocks GSC reindex requests that previously failed the live test due
  // to noindex meta + canonical→ES override.
  "/alquiler-barcos-costa-brava": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  // Category pages — Fase 2 (2026-05-28). Copy lives in t.categoryLicenseFree /
  // t.categoryLicensed (CI-validated in all 8 locales) and seoInjector now emits
  // a native-language SSR bodyFallback from it, so non-ES locales carry unique
  // content instead of a noindex'd Spanish/English ternary.
  "/barcos-sin-licencia": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/barcos-con-licencia": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
};

/**
 * True when (metaKey, lang) is explicitly marked as having a fully translated
 * UI. Used by computeTranslationIndex as a short-circuit that returns
 * "indexable" before the default noindex fallback.
 */
export function hasStaticTranslation(metaKey: string, lang: LangCode): boolean {
  const langs = TRANSLATED_STATIC_PATHS[metaKey];
  return langs !== undefined && langs.includes(lang);
}
