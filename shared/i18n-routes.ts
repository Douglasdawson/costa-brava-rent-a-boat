import type { LangCode } from "./seoConstants";
import { SUPPORTED_LANGUAGES } from "./seoConstants";

// All 8 languages now have their own translated slugs
type TranslatedLang = LangCode;

const TRANSLATED_LANGS: readonly TranslatedLang[] = [...SUPPORTED_LANGUAGES];

type SlugMap = Record<TranslatedLang, string>;

export const ROUTE_SLUGS = {
  home: { es: "", en: "", fr: "", de: "", nl: "", it: "", ca: "", ru: "" },

  // Location pages
  locationBlanes: { es: "alquiler-barcos-blanes", en: "boat-rental-blanes", fr: "location-bateau-blanes", de: "boot-mieten-blanes", nl: "boot-huren-blanes", it: "noleggio-barca-blanes", ca: "lloguer-vaixell-blanes", ru: "arenda-lodki-blanes" },
  locationLloret: { es: "alquiler-barcos-lloret-de-mar", en: "boat-rental-lloret-de-mar", fr: "location-bateau-lloret-de-mar", de: "boot-mieten-lloret-de-mar", nl: "boot-huren-lloret-de-mar", it: "noleggio-barca-lloret-de-mar", ca: "lloguer-vaixell-lloret-de-mar", ru: "arenda-lodki-lloret-de-mar" },
  locationTossa: { es: "alquiler-barcos-tossa-de-mar", en: "boat-rental-tossa-de-mar", fr: "location-bateau-tossa-de-mar", de: "boot-mieten-tossa-de-mar", nl: "boot-huren-tossa-de-mar", it: "noleggio-barca-tossa-de-mar", ca: "lloguer-vaixell-tossa-de-mar", ru: "arenda-lodki-tossa-de-mar" },
  locationMalgrat: { es: "alquiler-barcos-malgrat-de-mar", en: "boat-rental-malgrat-de-mar", fr: "location-bateau-malgrat-de-mar", de: "boot-mieten-malgrat-de-mar", nl: "boot-huren-malgrat-de-mar", it: "noleggio-barca-malgrat-de-mar", ca: "lloguer-vaixell-malgrat-de-mar", ru: "arenda-lodki-malgrat-de-mar" },
  locationSantaSusanna: { es: "alquiler-barcos-santa-susanna", en: "boat-rental-santa-susanna", fr: "location-bateau-santa-susanna", de: "boot-mieten-santa-susanna", nl: "boot-huren-santa-susanna", it: "noleggio-barca-santa-susanna", ca: "lloguer-vaixell-santa-susanna", ru: "arenda-lodki-santa-susanna" },
  locationCalella: { es: "alquiler-barcos-calella", en: "boat-rental-calella", fr: "location-bateau-calella", de: "boot-mieten-calella", nl: "boot-huren-calella", it: "noleggio-barca-calella", ca: "lloguer-vaixell-calella", ru: "arenda-lodki-calella" },
  locationPinedaDeMar: { es: "alquiler-barcos-pineda-de-mar", en: "boat-rental-pineda-de-mar", fr: "location-bateau-pineda-de-mar", de: "boot-mieten-pineda-de-mar", nl: "boot-huren-pineda-de-mar", it: "noleggio-barca-pineda-de-mar", ca: "lloguer-vaixell-pineda-de-mar", ru: "arenda-lodki-pineda-de-mar" },
  locationPalafolls: { es: "alquiler-barcos-palafolls", en: "boat-rental-palafolls", fr: "location-bateau-palafolls", de: "boot-mieten-palafolls", nl: "boot-huren-palafolls", it: "noleggio-barca-palafolls", ca: "lloguer-vaixell-palafolls", ru: "arenda-lodki-palafolls" },
  locationTordera: { es: "alquiler-barcos-tordera", en: "boat-rental-tordera", fr: "location-bateau-tordera", de: "boot-mieten-tordera", nl: "boot-huren-tordera", it: "noleggio-barca-tordera", ca: "lloguer-vaixell-tordera", ru: "arenda-lodki-tordera" },
  locationBarcelona: { es: "alquiler-barcos-cerca-barcelona", en: "boat-rental-near-barcelona", fr: "location-bateau-pres-barcelone", de: "boot-mieten-nahe-barcelona", nl: "boot-huren-bij-barcelona", it: "noleggio-barca-vicino-barcellona", ca: "lloguer-vaixell-prop-barcelona", ru: "arenda-lodki-ryadom-s-barcelonoi" },
  locationCostaBrava: { es: "alquiler-barcos-costa-brava", en: "boat-rental-costa-brava", fr: "location-bateau-costa-brava", de: "boot-mieten-costa-brava", nl: "boot-huren-costa-brava", it: "noleggio-barca-costa-brava", ca: "lloguer-vaixell-costa-brava", ru: "arenda-lodki-costa-brava" },

  // Category pages
  categoryLicenseFree: { es: "barcos-sin-licencia", en: "boats-without-license", fr: "bateau-sans-permis", de: "boote-ohne-fuehrerschein", nl: "boot-zonder-vaarbewijs", it: "barca-senza-patente", ca: "vaixell-sense-llicencia", ru: "lodka-bez-litsenzii" },
  categoryLicensed: { es: "barcos-con-licencia", en: "boats-with-license", fr: "bateau-avec-permis", de: "boote-mit-fuehrerschein", nl: "boot-met-vaarbewijs", it: "barca-con-patente", ca: "vaixell-amb-llicencia", ru: "lodka-s-litsenziei" },

  // Content pages
  blog: { es: "blog", en: "blog", fr: "blog", de: "blog", nl: "blog", it: "blog", ca: "blog", ru: "blog" },
  faq: { es: "faq", en: "faq", fr: "faq", de: "faq", nl: "faq", it: "faq", ca: "faq", ru: "faq" },
  glossary: { es: "glosario", en: "glossary", fr: "glossaire", de: "glossar", nl: "woordenlijst", it: "glossario", ca: "glossari", ru: "glossariy" },
  gallery: { es: "galeria", en: "gallery", fr: "galerie", de: "galerie", nl: "galerij", it: "galleria", ca: "galeria", ru: "galereya" },
  routes: { es: "rutas", en: "routes", fr: "itineraires", de: "routen", nl: "routes", it: "itinerari", ca: "rutes", ru: "marshruty" },
  pricing: { es: "precios", en: "prices", fr: "tarifs", de: "preise", nl: "prijzen", it: "prezzi", ca: "preus", ru: "tseny" },
  testimonials: { es: "testimonios", en: "testimonials", fr: "temoignages", de: "bewertungen", nl: "beoordelingen", it: "recensioni", ca: "testimonis", ru: "otzyvy" },
  giftCards: { es: "tarjetas-regalo", en: "gift-cards", fr: "cartes-cadeaux", de: "geschenkkarten", nl: "cadeaukaarten", it: "buoni-regalo", ca: "targetes-regal", ru: "podarochnye-karty" },
  about: { es: "sobre-nosotros", en: "about", fr: "a-propos", de: "ueber-uns", nl: "over-ons", it: "chi-siamo", ca: "sobre-nosaltres", ru: "o-nas" },
  destinations: { es: "destinos", en: "destinations", fr: "destinations", de: "reiseziele", nl: "bestemmingen", it: "destinazioni", ca: "destinacions", ru: "napravleniya" },

  // Dynamic route prefixes
  boatDetail: { es: "barco", en: "boat", fr: "bateau", de: "boot", nl: "boot", it: "barca", ca: "vaixell", ru: "lodka" },
  blogDetail: { es: "blog", en: "blog", fr: "blog", de: "blog", nl: "blog", it: "blog", ca: "blog", ru: "blog" },
  destinationDetail: { es: "destinos", en: "destinations", fr: "destinations", de: "reiseziele", nl: "bestemmingen", it: "destinazioni", ca: "destinacions", ru: "napravleniya" },

  // Activity pages
  activitySnorkel: { es: "excursion-snorkel-barco-blanes", en: "snorkel-boat-trip-blanes", fr: "excursion-snorkel-bateau-blanes", de: "schnorchel-bootsausflug-blanes", nl: "snorkel-boottocht-blanes", it: "escursione-snorkel-barca-blanes", ca: "excursio-snorkel-vaixell-blanes", ru: "snorkel-progulka-na-lodke-blanes" },
  activityFamilies: { es: "barco-familias-costa-brava", en: "family-boat-costa-brava", fr: "bateau-familles-costa-brava", de: "familien-boot-costa-brava", nl: "familieboot-costa-brava", it: "barca-famiglie-costa-brava", ca: "vaixell-families-costa-brava", ru: "lodka-dlya-semei-costa-brava" },
  activitySunset: { es: "paseo-atardecer-barco-blanes", en: "sunset-boat-trip-blanes", fr: "balade-coucher-soleil-bateau-blanes", de: "sonnenuntergang-bootsfahrt-blanes", nl: "zonsondergang-boottocht-blanes", it: "gita-tramonto-barca-blanes", ca: "passeig-posta-sol-vaixell-blanes", ru: "progulka-na-zakate-lodka-blanes" },
  activityFishing: { es: "pesca-barco-blanes", en: "fishing-boat-blanes", fr: "peche-bateau-blanes", de: "angelboot-blanes", nl: "visboot-blanes", it: "pesca-barca-blanes", ca: "pesca-vaixell-blanes", ru: "rybalka-lodka-blanes" },

  // Legal pages
  privacyPolicy: { es: "politica-privacidad", en: "privacy-policy", fr: "politique-confidentialite", de: "datenschutz", nl: "privacybeleid", it: "informativa-privacy", ca: "politica-privacitat", ru: "politika-konfidentsialnosti" },
  termsConditions: { es: "terminos-condiciones", en: "terms-conditions", fr: "conditions-generales", de: "agb", nl: "algemene-voorwaarden", it: "termini-condizioni", ca: "termes-condicions", ru: "usloviya-ispolzovaniya" },
  cookiesPolicy: { es: "politica-cookies", en: "cookies-policy", fr: "politique-cookies", de: "cookie-richtlinie", nl: "cookiebeleid", it: "informativa-cookie", ca: "politica-cookies", ru: "politika-cookie" },
  condicionesGenerales: { es: "condiciones-generales", en: "general-conditions", fr: "conditions-de-reservation", de: "allgemeine-bedingungen", nl: "algemene-voorwaarden", it: "termini-condizioni", ca: "condicions-generals", ru: "obshchie-usloviya" },
  accessibility: { es: "accesibilidad", en: "accessibility", fr: "accessibilite", de: "barrierefreiheit", nl: "toegankelijkheid", it: "accessibilita", ca: "accessibilitat", ru: "dostupnost" },

  // App pages
  login: { es: "login", en: "login", fr: "login", de: "login", nl: "login", it: "login", ca: "login", ru: "login" },
  crm: { es: "crm", en: "crm", fr: "crm", de: "crm", nl: "crm", it: "crm", ca: "crm", ru: "crm" },
  myAccount: { es: "mi-cuenta", en: "my-account", fr: "mon-compte", de: "mein-konto", nl: "mijn-account", it: "mio-account", ca: "el-meu-compte", ru: "moy-akkaunt" },
  booking: { es: "booking", en: "booking", fr: "booking", de: "booking", nl: "booking", it: "booking", ca: "booking", ru: "booking" },
  onboarding: { es: "onboarding", en: "onboarding", fr: "onboarding", de: "onboarding", nl: "onboarding", it: "onboarding", ca: "onboarding", ru: "onboarding" },
  cancel: { es: "cancel", en: "cancel", fr: "cancel", de: "cancel", nl: "cancel", it: "cancel", ca: "cancel", ru: "cancel" },
  clientDashboard: { es: "mi-cuenta", en: "my-account", fr: "mon-compte", de: "mein-konto", nl: "mijn-account", it: "mio-account", ca: "el-meu-compte", ru: "moy-akkaunt" },
} as const satisfies Record<string, SlugMap>;

export type PageKey = keyof typeof ROUTE_SLUGS;

const DYNAMIC_PAGE_KEYS: readonly PageKey[] = ["boatDetail", "blogDetail", "destinationDetail", "cancel"];

export function getSlugForPage(pageKey: PageKey, lang: LangCode): string {
  return ROUTE_SLUGS[pageKey][lang];
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
    const sourceTl = sourceLang as TranslatedLang;
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
