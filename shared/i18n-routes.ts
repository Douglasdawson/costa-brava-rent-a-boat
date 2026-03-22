import type { LangCode } from "./seoConstants";
import { SUPPORTED_LANGUAGES } from "./seoConstants";

type TranslatedLang = "es" | "en" | "fr" | "de" | "nl" | "it";

const TRANSLATED_LANGS: readonly TranslatedLang[] = ["es", "en", "fr", "de", "nl", "it"] as const;

type SlugMap = Record<TranslatedLang, string>;

const FALLBACK_MAP: Partial<Record<LangCode, TranslatedLang>> = {
  ca: "es",
  ru: "en",
};

export const ROUTE_SLUGS = {
  home: { es: "", en: "", fr: "", de: "", nl: "", it: "" },

  // Location pages
  locationBlanes: { es: "alquiler-barcos-blanes", en: "boat-rental-blanes", fr: "location-bateau-blanes", de: "boot-mieten-blanes", nl: "boot-huren-blanes", it: "noleggio-barca-blanes" },
  locationLloret: { es: "alquiler-barcos-lloret-de-mar", en: "boat-rental-lloret-de-mar", fr: "location-bateau-lloret-de-mar", de: "boot-mieten-lloret-de-mar", nl: "boot-huren-lloret-de-mar", it: "noleggio-barca-lloret-de-mar" },
  locationTossa: { es: "alquiler-barcos-tossa-de-mar", en: "boat-rental-tossa-de-mar", fr: "location-bateau-tossa-de-mar", de: "boot-mieten-tossa-de-mar", nl: "boot-huren-tossa-de-mar", it: "noleggio-barca-tossa-de-mar" },
  locationMalgrat: { es: "alquiler-barcos-malgrat-de-mar", en: "boat-rental-malgrat-de-mar", fr: "location-bateau-malgrat-de-mar", de: "boot-mieten-malgrat-de-mar", nl: "boot-huren-malgrat-de-mar", it: "noleggio-barca-malgrat-de-mar" },
  locationSantaSusanna: { es: "alquiler-barcos-santa-susanna", en: "boat-rental-santa-susanna", fr: "location-bateau-santa-susanna", de: "boot-mieten-santa-susanna", nl: "boot-huren-santa-susanna", it: "noleggio-barca-santa-susanna" },
  locationCalella: { es: "alquiler-barcos-calella", en: "boat-rental-calella", fr: "location-bateau-calella", de: "boot-mieten-calella", nl: "boot-huren-calella", it: "noleggio-barca-calella" },
  locationPinedaDeMar: { es: "alquiler-barcos-pineda-de-mar", en: "boat-rental-pineda-de-mar", fr: "location-bateau-pineda-de-mar", de: "boot-mieten-pineda-de-mar", nl: "boot-huren-pineda-de-mar", it: "noleggio-barca-pineda-de-mar" },
  locationPalafolls: { es: "alquiler-barcos-palafolls", en: "boat-rental-palafolls", fr: "location-bateau-palafolls", de: "boot-mieten-palafolls", nl: "boot-huren-palafolls", it: "noleggio-barca-palafolls" },
  locationTordera: { es: "alquiler-barcos-tordera", en: "boat-rental-tordera", fr: "location-bateau-tordera", de: "boot-mieten-tordera", nl: "boot-huren-tordera", it: "noleggio-barca-tordera" },
  locationBarcelona: { es: "alquiler-barcos-cerca-barcelona", en: "boat-rental-near-barcelona", fr: "location-bateau-pres-barcelone", de: "boot-mieten-nahe-barcelona", nl: "boot-huren-bij-barcelona", it: "noleggio-barca-vicino-barcellona" },
  locationCostaBrava: { es: "alquiler-barcos-costa-brava", en: "boat-rental-costa-brava", fr: "location-bateau-costa-brava", de: "boot-mieten-costa-brava", nl: "boot-huren-costa-brava", it: "noleggio-barca-costa-brava" },

  // Category pages
  categoryLicenseFree: { es: "barcos-sin-licencia", en: "boats-without-license", fr: "bateau-sans-permis", de: "boote-ohne-fuehrerschein", nl: "boot-zonder-vaarbewijs", it: "barca-senza-patente" },
  categoryLicensed: { es: "barcos-con-licencia", en: "boats-with-license", fr: "bateau-avec-permis", de: "boote-mit-fuehrerschein", nl: "boot-met-vaarbewijs", it: "barca-con-patente" },

  // Content pages
  blog: { es: "blog", en: "blog", fr: "blog", de: "blog", nl: "blog", it: "blog" },
  faq: { es: "faq", en: "faq", fr: "faq", de: "faq", nl: "faq", it: "faq" },
  gallery: { es: "galeria", en: "gallery", fr: "galerie", de: "galerie", nl: "galerij", it: "galleria" },
  routes: { es: "rutas", en: "routes", fr: "itineraires", de: "routen", nl: "routes", it: "itinerari" },
  pricing: { es: "precios", en: "prices", fr: "tarifs", de: "preise", nl: "prijzen", it: "prezzi" },
  testimonials: { es: "testimonios", en: "testimonials", fr: "temoignages", de: "bewertungen", nl: "beoordelingen", it: "recensioni" },
  giftCards: { es: "tarjetas-regalo", en: "gift-cards", fr: "cartes-cadeaux", de: "geschenkkarten", nl: "cadeaukaarten", it: "buoni-regalo" },
  about: { es: "sobre-nosotros", en: "about", fr: "a-propos", de: "ueber-uns", nl: "over-ons", it: "chi-siamo" },
  destinations: { es: "destinos", en: "destinations", fr: "destinations", de: "reiseziele", nl: "bestemmingen", it: "destinazioni" },

  // Dynamic route prefixes
  boatDetail: { es: "barco", en: "boat", fr: "bateau", de: "boot", nl: "boot", it: "barca" },
  blogDetail: { es: "blog", en: "blog", fr: "blog", de: "blog", nl: "blog", it: "blog" },
  destinationDetail: { es: "destinos", en: "destinations", fr: "destinations", de: "reiseziele", nl: "bestemmingen", it: "destinazioni" },

  // Activity pages
  activitySnorkel: { es: "excursion-snorkel-barco-blanes", en: "snorkel-boat-trip-blanes", fr: "excursion-snorkel-bateau-blanes", de: "schnorchel-bootsausflug-blanes", nl: "snorkel-boottocht-blanes", it: "escursione-snorkel-barca-blanes" },
  activityFamilies: { es: "barco-familias-costa-brava", en: "family-boat-costa-brava", fr: "bateau-familles-costa-brava", de: "familien-boot-costa-brava", nl: "familieboot-costa-brava", it: "barca-famiglie-costa-brava" },
  activitySunset: { es: "paseo-atardecer-barco-blanes", en: "sunset-boat-trip-blanes", fr: "balade-coucher-soleil-bateau-blanes", de: "sonnenuntergang-bootsfahrt-blanes", nl: "zonsondergang-boottocht-blanes", it: "gita-tramonto-barca-blanes" },
  activityFishing: { es: "pesca-barco-blanes", en: "fishing-boat-blanes", fr: "peche-bateau-blanes", de: "angelboot-blanes", nl: "visboot-blanes", it: "pesca-barca-blanes" },

  // Legal pages
  privacyPolicy: { es: "politica-privacidad", en: "privacy-policy", fr: "politique-confidentialite", de: "datenschutz", nl: "privacybeleid", it: "informativa-privacy" },
  termsConditions: { es: "terminos-condiciones", en: "terms-conditions", fr: "conditions-generales", de: "agb", nl: "algemene-voorwaarden", it: "termini-condizioni" },
  cookiesPolicy: { es: "politica-cookies", en: "cookies-policy", fr: "politique-cookies", de: "cookie-richtlinie", nl: "cookiebeleid", it: "informativa-cookie" },
  condicionesGenerales: { es: "condiciones-generales", en: "general-conditions", fr: "conditions-de-reservation", de: "allgemeine-bedingungen", nl: "algemene-voorwaarden", it: "termini-condizioni" },
  accessibility: { es: "accesibilidad", en: "accessibility", fr: "accessibilite", de: "barrierefreiheit", nl: "toegankelijkheid", it: "accessibilita" },

  // App pages
  login: { es: "login", en: "login", fr: "login", de: "login", nl: "login", it: "login" },
  crm: { es: "crm", en: "crm", fr: "crm", de: "crm", nl: "crm", it: "crm" },
  myAccount: { es: "mi-cuenta", en: "my-account", fr: "mon-compte", de: "mein-konto", nl: "mijn-account", it: "mio-account" },
  booking: { es: "booking", en: "booking", fr: "booking", de: "booking", nl: "booking", it: "booking" },
  onboarding: { es: "onboarding", en: "onboarding", fr: "onboarding", de: "onboarding", nl: "onboarding", it: "onboarding" },
  cancel: { es: "cancel", en: "cancel", fr: "cancel", de: "cancel", nl: "cancel", it: "cancel" },
  clientDashboard: { es: "mi-cuenta", en: "my-account", fr: "mon-compte", de: "mein-konto", nl: "mijn-account", it: "mio-account" },
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
