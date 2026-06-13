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
  // Home-port flagship — location-blanes.tsx is fully i18n-driven (hero,
  // sections, schema and faqItems all read from t.locationPages.blanes, which
  // is CI-validated in all 8 locales). It was already prerendered in 8 langs
  // but missing here, so it was served noindex outside ES — an oversight for
  // the base port. Marking all 8 indexable, on par with Lloret/Tossa/Costa Brava.
  "/alquiler-barcos-blanes": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
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
  // Activity page — sunset is fully i18n-driven (no hardcoded Spanish in the
  // component) so it ships native SSR body in all 8 locales. The other three
  // activity pages (snorkel/families/fishing) still have hardcoded ES copy and
  // stay ES-only until migrated.
  "/paseo-atardecer-barco-blanes": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/excursion-snorkel-barco-blanes": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/barco-familias-costa-brava": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/pesca-barco-blanes": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/circuito-jet-ski-blanes": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/excursion-jet-ski-blanes-tossa": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/alquiler-moto-de-agua-blanes": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  // Scooter rental bridge page (Coast Rent, Lloret) — t.scootersPage is
  // i18n-complete in all 8 locales; SSR meta via buildScootersStaticMeta.
  "/alquiler-motos-lloret": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  // Merch shop (Laura Cabanas collab) — t.shopPage is i18n-complete in all 8
  // locales; SSR meta via buildTiendaStaticMeta. CURRENTLY CLOSED (early-access
  // password gate): kept OUT of indexable locales so seoInjector serves noindex.
  // To launch, restore: "/tienda": ["es","en","fr","de","ca","nl","it","ru"].
  // "/tienda": [...],
  // Satellite location pages — i18n-complete (t.locationPages.<town>) + native SSR body.
  "/alquiler-barcos-tordera": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/alquiler-barcos-palafolls": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/alquiler-barcos-pineda-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  // FAQ — t.faqPage is i18n-complete (92 keys × 8 locales) and seoInjector now
  // SSRs the full FAQPage JSON-LD from it per language (2026-06-10), so non-ES
  // locales carry real native content instead of the old noindex default.
  "/faq": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  // Social Boat (salidas compartidas) — validation landing, ES-only launch.
  // i18n exists in all 8 locales but only ES is prerendered/indexed for now;
  // open more locales once the concept is validated and copy is reviewed.
  "/salidas-compartidas": ["es"],
  // Programmatic matrix — snorkel vertical (occasion × location). Copy lives in
  // t.occasionMatrix.pages.<comboId>, translated + i18n-validated in all 8
  // locales (2026-06-03); both parent pages (activity + location) are 8-locale,
  // so indexableLangsForCombo opens all 8. Live behind OCCASION_MATRIX_ENABLED.
  "/snorkel-blanes": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/snorkel-lloret-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/snorkel-tossa-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/snorkel-costa-brava": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  // Matrix verticals 2/3/4 — families / sunset / fishing × 4 locations.
  // Copy in es.ts + translated/validated to all 8 locales (2026-06-03, done
  // directly without the capped API script). Both parent pages are 8-locale.
  "/familias-blanes": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/familias-lloret-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/familias-tossa-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/familias-costa-brava": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/atardecer-blanes": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/atardecer-lloret-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/atardecer-tossa-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/atardecer-costa-brava": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/pesca-blanes": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/pesca-lloret-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/pesca-tossa-de-mar": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
  "/pesca-costa-brava": ["es", "en", "fr", "de", "ca", "nl", "it", "ru"],
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
