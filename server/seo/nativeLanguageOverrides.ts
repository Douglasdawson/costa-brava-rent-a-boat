import type { LangCode } from "../../shared/seoConstants";

/**
 * Resources whose native content language is NOT Spanish. For these, the
 * canonical / noindex logic inverts: the native-lang URL is canonical and
 * indexable, and the Spanish stub (plus any other locale without real
 * translation) gets noindex + canonical pointing to the native URL.
 *
 * Without this override, computeTranslationIndex() defaults to ES-as-canonical,
 * which is correct for the 99% of content authored in Spanish but wrong for
 * content authored directly in another language.
 */
export interface NativeLanguageOverride {
  /** Slug shared across languages (the "root" slug used in every URL). */
  slug: string;
  /** Resource type — scopes the lookup so /blog/foo and /destinos/foo don't collide. */
  resourceType: "blog" | "boat" | "destination" | "page";
  /** The language in which the resource was originally authored. */
  nativeLang: LangCode;
  /**
   * Additional locales that are also indexable (e.g. a post authored in EN but
   * also professionally translated to FR). Leave empty if only the native lang
   * is indexable. ES does NOT need to be listed here — if it has a real
   * translation, let the titleByLang path handle it; if not, leave it out so
   * it gets noindex + canonical to the native version.
   */
  alsoIndexable?: readonly LangCode[];
}

export const NATIVE_LANGUAGE_OVERRIDES: readonly NativeLanguageOverride[] = [
  {
    slug: "sunset-boat-trip-blanes-costa-brava",
    resourceType: "blog",
    nativeLang: "en",
    alsoIndexable: [],
  },
  {
    slug: "boat-rental-costa-brava-english-guide",
    resourceType: "blog",
    nativeLang: "en",
    alsoIndexable: [],
  },
];

export function getNativeOverride(
  slug: string,
  resourceType: NativeLanguageOverride["resourceType"],
): NativeLanguageOverride | undefined {
  return NATIVE_LANGUAGE_OVERRIDES.find(
    (o) => o.slug === slug && o.resourceType === resourceType,
  );
}
