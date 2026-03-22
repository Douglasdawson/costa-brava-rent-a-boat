import type { LangCode } from "./seoConstants";
import { SUPPORTED_LANGUAGES } from "./seoConstants";

type TranslatedLang = "es" | "en" | "fr" | "de";

const TRANSLATED_LANGS: readonly TranslatedLang[] = ["es", "en", "fr", "de"] as const;

type SlugMap = Record<TranslatedLang, string>;

const FALLBACK_MAP: Partial<Record<LangCode, TranslatedLang>> = {
  ca: "es",
  nl: "en",
  it: "en",
  ru: "en",
};

export const ROUTE_SLUGS = {
  home: { es: "", en: "", fr: "", de: "" },

  // Location pages
  locationBlanes: { es: "alquiler-barcos-blanes", en: "boat-rental-blanes", fr: "location-bateaux-blanes", de: "bootsverleih-blanes" },
  locationLloret: { es: "alquiler-barcos-lloret-de-mar", en: "boat-rental-lloret-de-mar", fr: "location-bateaux-lloret-de-mar", de: "bootsverleih-lloret-de-mar" },
  locationTossa: { es: "alquiler-barcos-tossa-de-mar", en: "boat-rental-tossa-de-mar", fr: "location-bateaux-tossa-de-mar", de: "bootsverleih-tossa-de-mar" },
  locationMalgrat: { es: "alquiler-barcos-malgrat-de-mar", en: "boat-rental-malgrat-de-mar", fr: "location-bateaux-malgrat-de-mar", de: "bootsverleih-malgrat-de-mar" },
  locationSantaSusanna: { es: "alquiler-barcos-santa-susanna", en: "boat-rental-santa-susanna", fr: "location-bateaux-santa-susanna", de: "bootsverleih-santa-susanna" },
  locationCalella: { es: "alquiler-barcos-calella", en: "boat-rental-calella", fr: "location-bateaux-calella", de: "bootsverleih-calella" },
  locationPinedaDeMar: { es: "alquiler-barcos-pineda-de-mar", en: "boat-rental-pineda-de-mar", fr: "location-bateaux-pineda-de-mar", de: "bootsverleih-pineda-de-mar" },
  locationPalafolls: { es: "alquiler-barcos-palafolls", en: "boat-rental-palafolls", fr: "location-bateaux-palafolls", de: "bootsverleih-palafolls" },
  locationTordera: { es: "alquiler-barcos-tordera", en: "boat-rental-tordera", fr: "location-bateaux-tordera", de: "bootsverleih-tordera" },
  locationBarcelona: { es: "alquiler-barcos-cerca-barcelona", en: "boat-rental-near-barcelona", fr: "location-bateaux-pres-barcelone", de: "bootsverleih-nahe-barcelona" },
  locationCostaBrava: { es: "alquiler-barcos-costa-brava", en: "boat-rental-costa-brava", fr: "location-bateaux-costa-brava", de: "bootsverleih-costa-brava" },

  // Category pages
  categoryLicenseFree: { es: "barcos-sin-licencia", en: "boats-without-license", fr: "bateaux-sans-permis", de: "boote-ohne-fuehrerschein" },
  categoryLicensed: { es: "barcos-con-licencia", en: "boats-with-license", fr: "bateaux-avec-permis", de: "boote-mit-fuehrerschein" },

  // Content pages
  blog: { es: "blog", en: "blog", fr: "blog", de: "blog" },
  faq: { es: "faq", en: "faq", fr: "faq", de: "faq" },
  gallery: { es: "galeria", en: "gallery", fr: "galerie", de: "galerie" },
  routes: { es: "rutas", en: "routes", fr: "itineraires", de: "routen" },
  pricing: { es: "precios", en: "prices", fr: "tarifs", de: "preise" },
  testimonials: { es: "testimonios", en: "testimonials", fr: "temoignages", de: "bewertungen" },
  giftCards: { es: "tarjetas-regalo", en: "gift-cards", fr: "cartes-cadeaux", de: "geschenkkarten" },
  about: { es: "sobre-nosotros", en: "about", fr: "a-propos", de: "ueber-uns" },
  destinations: { es: "destinos", en: "destinations", fr: "destinations", de: "reiseziele" },

  // Dynamic route prefixes
  boatDetail: { es: "barco", en: "boat", fr: "bateau", de: "boot" },
  blogDetail: { es: "blog", en: "blog", fr: "blog", de: "blog" },
  destinationDetail: { es: "destinos", en: "destinations", fr: "destinations", de: "reiseziele" },

  // Activity pages
  activitySnorkel: { es: "excursion-snorkel-barco-blanes", en: "snorkel-boat-trip-blanes", fr: "excursion-snorkel-bateau-blanes", de: "schnorchel-bootsausflug-blanes" },
  activityFamilies: { es: "barco-familias-costa-brava", en: "family-boat-costa-brava", fr: "bateau-famille-costa-brava", de: "familien-boot-costa-brava" },
  activitySunset: { es: "sunset-boat-trip-blanes", en: "sunset-boat-trip-blanes", fr: "croisiere-coucher-soleil-blanes", de: "sonnenuntergang-bootsfahrt-blanes" },
  activityFishing: { es: "pesca-barco-blanes", en: "fishing-boat-blanes", fr: "peche-bateau-blanes", de: "angel-boot-blanes" },

  // Legal pages
  privacyPolicy: { es: "privacy-policy", en: "privacy-policy", fr: "privacy-policy", de: "privacy-policy" },
  termsConditions: { es: "terms-conditions", en: "terms-conditions", fr: "terms-conditions", de: "terms-conditions" },
  cookiesPolicy: { es: "cookies-policy", en: "cookies-policy", fr: "cookies-policy", de: "cookies-policy" },
  condicionesGenerales: { es: "condiciones-generales", en: "general-conditions", fr: "conditions-generales", de: "allgemeine-bedingungen" },
  accessibility: { es: "accesibilidad", en: "accessibility", fr: "accessibilite", de: "barrierefreiheit" },

  // App pages
  login: { es: "login", en: "login", fr: "login", de: "login" },
  crm: { es: "crm", en: "crm", fr: "crm", de: "crm" },
  myAccount: { es: "mi-cuenta", en: "my-account", fr: "mon-compte", de: "mein-konto" },
  booking: { es: "booking", en: "booking", fr: "booking", de: "booking" },
  onboarding: { es: "onboarding", en: "onboarding", fr: "onboarding", de: "onboarding" },
  cancel: { es: "cancel", en: "cancel", fr: "cancel", de: "cancel" },
  clientDashboard: { es: "mi-cuenta", en: "my-account", fr: "mon-compte", de: "mein-konto" },
} as const satisfies Record<string, SlugMap>;

export type PageKey = keyof typeof ROUTE_SLUGS;

const DYNAMIC_PAGE_KEYS: readonly PageKey[] = ["boatDetail", "blogDetail", "destinationDetail", "cancel"];

function getTranslatedLang(lang: LangCode): TranslatedLang {
  return (FALLBACK_MAP[lang] ?? lang) as TranslatedLang;
}

export function getSlugForPage(pageKey: PageKey, lang: LangCode): string {
  const effectiveLang = getTranslatedLang(lang);
  return ROUTE_SLUGS[pageKey][effectiveLang];
}

export function getLocalizedPath(
  pageKey: PageKey,
  lang: LangCode,
  params?: { slug?: string }
): string {
  const slug = getSlugForPage(pageKey, lang);

  if (pageKey === "home") {
    return `/${lang}/`;
  }

  const base = `/${lang}/${slug}`;

  if (params?.slug) {
    return `${base}/${params.slug}`;
  }

  return base;
}

// Lazy-initialized reverse lookup cache: slug -> Array<{ pageKey, lang }>
let reverseMap: Map<string, Array<{ pageKey: PageKey; lang: TranslatedLang }>> | null = null;

function getReverseMap(): Map<string, Array<{ pageKey: PageKey; lang: TranslatedLang }>> {
  if (reverseMap) return reverseMap;

  reverseMap = new Map();
  const pageKeys = Object.keys(ROUTE_SLUGS) as PageKey[];

  for (const pageKey of pageKeys) {
    const slugMap = ROUTE_SLUGS[pageKey];
    for (const tl of TRANSLATED_LANGS) {
      const slug = slugMap[tl];
      if (slug === "") continue; // skip home empty slugs
      const entries = reverseMap.get(slug) ?? [];
      entries.push({ pageKey, lang: tl });
      reverseMap.set(slug, entries);
    }
  }

  return reverseMap;
}

export function resolveSlug(slug: string): { pageKey: PageKey } | null {
  const map = getReverseMap();
  const entries = map.get(slug);
  if (!entries || entries.length === 0) return null;
  return { pageKey: entries[0].pageKey };
}

export function switchLanguagePath(currentPath: string, targetLang: LangCode): string {
  const segments = currentPath.split("/").filter(Boolean);

  if (segments.length === 0) {
    return `/${targetLang}/`;
  }

  const sourceLang = segments[0];
  if (!isValidLang(sourceLang)) {
    return `/${targetLang}/`;
  }

  // Path is just /:lang/ (home)
  if (segments.length === 1) {
    return `/${targetLang}/`;
  }

  const sourceSlug = segments[1];
  const map = getReverseMap();
  const entries = map.get(sourceSlug);

  if (!entries || entries.length === 0) {
    return `/${targetLang}/${segments.slice(1).join("/")}`;
  }

  // For dynamic routes, find the entry matching a dynamic page key
  const remainingSegments = segments.slice(2);
  const hasDynamicParam = remainingSegments.length > 0;

  let resolvedEntry: { pageKey: PageKey; lang: TranslatedLang } | undefined;

  if (hasDynamicParam) {
    resolvedEntry = entries.find((e) => DYNAMIC_PAGE_KEYS.includes(e.pageKey));
  }

  if (!resolvedEntry) {
    // For non-dynamic or when no dynamic match, prefer the entry matching source language
    const sourceTl = getTranslatedLang(sourceLang);
    resolvedEntry = entries.find((e) => e.lang === sourceTl) ?? entries[0];
  }

  const targetSlug = getSlugForPage(resolvedEntry.pageKey, targetLang);
  const basePath = `/${targetLang}/${targetSlug}`;

  if (hasDynamicParam) {
    return `${basePath}/${remainingSegments.join("/")}`;
  }

  return basePath;
}

export function isValidLang(lang: string): lang is LangCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}
