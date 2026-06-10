import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { seoMeta } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { SUPPORTED_LANGUAGES, HREFLANG_CODES, type LangCode } from "../shared/seoConstants";
import { isValidLang, resolveSlug, getSlugForPage, getLocalizedPath, switchLanguagePath, type PageKey } from "../shared/i18n-routes";
import { resolveBoatImagePath, BOAT_IMAGE_WIDTH, BOAT_IMAGE_HEIGHT } from "../shared/boatImages";
import { resolveMediaPath } from "../shared/mediaUrl";
import { isAICrawler as isAICrawlerShared } from "./seo/constants";
import { authorToPersonSchema, DEFAULT_AUTHOR, AUTHORS } from "../shared/authors";
import { BUSINESS_RATING_STR, BUSINESS_REVIEW_COUNT_STR, BUSINESS_STREET } from "../shared/businessProfile";
import { getBoatReviewStats } from "./data/boatReviewStats";
import { getNativeOverride, type NativeLanguageOverride } from "./seo/nativeLanguageOverrides";
import { hasStaticTranslation } from "./seo/translatedStaticPaths";
import { shouldNoindexThinContent } from "./seo/thinContentGuard";
import { OCCASION_MATRIX_ENABLED, liveMatrixCombos, type MatrixCombo } from "../shared/occasionMatrix";
import { resolveMatrixSlug, resolveMatrixCombo, matrixSlug, matrixPath, comboId } from "../shared/occasionMatrixPage";
import { get404Meta } from "./seo/helpers";
import { getCurrentStats } from "./lib/businessStatsCache";

// Per-locale i18n bundles imported from the client to drive native-language
// SSR body fallback. Type-only import follows the pattern proven by
// scripts/validate-translations.ts (lines 11-18). esbuild bundles these
// statically (each ~200KB; only the keys actually accessed survive
// dead-code elimination on a small subset of branches).
import { es as i18nEs } from "../client/src/i18n/es";
import { en as i18nEn } from "../client/src/i18n/en";
import { ca as i18nCa } from "../client/src/i18n/ca";
import { fr as i18nFr } from "../client/src/i18n/fr";
import { de as i18nDe } from "../client/src/i18n/de";
import { nl as i18nNl } from "../client/src/i18n/nl";
import { it as i18nIt } from "../client/src/i18n/it";
import { ru as i18nRu } from "../client/src/i18n/ru";

const I18N_BY_LANG: Record<LangCode, typeof i18nEs> = {
  es: i18nEs, en: i18nEn, ca: i18nCa, fr: i18nFr,
  de: i18nDe, nl: i18nNl, it: i18nIt, ru: i18nRu,
};

const BASE_URL = process.env.BASE_URL || "https://www.costabravarentaboat.com";

// Dynamic season year: Nov-Dec → next year, otherwise current year
function getSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();
}
const SEASON_YEAR = getSeasonYear();

// AI crawler detection — re-exported from shared constants so other modules
// (aiBotLogger middleware, admin endpoints) can import a single canonical fn.
export const isAICrawler = isAICrawlerShared;

interface SEOMeta {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  articleMeta?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

// Default og:image:alt per language, used when a resolver doesn't provide a
// page-specific alt. Matches the generic brand image in client/index.html.
const DEFAULT_OG_IMAGE_ALT: Record<LangCode, string> = {
  es: "Costa Brava Rent a Boat - Alquiler de barcos en Puerto de Blanes",
  en: "Costa Brava Rent a Boat - Boat rental at Blanes Port",
  ca: "Costa Brava Rent a Boat - Lloguer de vaixells al Port de Blanes",
  fr: "Costa Brava Rent a Boat - Location de bateaux au Port de Blanes",
  de: "Costa Brava Rent a Boat - Bootsverleih im Hafen von Blanes",
  nl: "Costa Brava Rent a Boat - Botenverhuur in de haven van Blanes",
  it: "Costa Brava Rent a Boat - Noleggio barche al Porto di Blanes",
  ru: "Costa Brava Rent a Boat - Аренда лодок в порту Бланес",
};


// Escape special HTML attribute characters
function esc(str: unknown): string {
  // Defensive: callers pass numbers (boat.capacity) and other non-strings; coerce
  // to string before escaping so a TypeError doesn't bubble up and silently
  // crash the seoInjector boat handler (which would 404 the canonical /es/barco/X).
  return String(str ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Fetch SEO meta overrides from the database (seo_meta table).
// Returns null on miss or error so callers can fall back to hardcoded values.
// Cached with a 5-minute TTL to avoid hitting the DB on every page request.
const dbMetaCache = new Map<string, { data: { title?: string; description?: string; keywords?: string } | null; timestamp: number }>();
const DB_META_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getDbMeta(pagePath: string, lang: string): Promise<{ title?: string; description?: string; keywords?: string } | null> {
  const cacheKey = `${pagePath}::${lang}`;
  const now = Date.now();
  const cached = dbMetaCache.get(cacheKey);
  if (cached && now - cached.timestamp < DB_META_CACHE_TTL) {
    return cached.data;
  }

  try {
    const [meta] = await db
      .select()
      .from(seoMeta)
      .where(and(eq(seoMeta.page, pagePath), eq(seoMeta.language, lang)))
      .limit(1);
    const result = meta ? {
      title: meta.title || undefined,
      description: meta.description || undefined,
      keywords: meta.keywords || undefined,
    } : null;

    dbMetaCache.set(cacheKey, { data: result, timestamp: now });

    // Evict oldest entry if cache grows too large
    if (dbMetaCache.size > 200) {
      const oldestKey = dbMetaCache.keys().next().value;
      if (oldestKey) dbMetaCache.delete(oldestKey);
    }

    return result;
  } catch {
    return null;
  }
}

// Jet ski landing pages (circuito / excursión). Built from i18n jetskiLanding
// so all 8 locales get a native title/description derived from the hero copy.
function buildJetskiStaticMeta(
  copyKey: "circuito" | "excursion",
  minPrice: number,
): Partial<Record<LangCode, SEOMeta>> {
  const out: Partial<Record<LangCode, SEOMeta>> = {};
  for (const lang of Object.keys(I18N_BY_LANG) as LangCode[]) {
    const jl = (I18N_BY_LANG[lang] ?? i18nEs).jetskiLanding;
    const product = jl[copyKey];
    const fromLabel = jl.fromLabel;
    // Prefer the keyword-rich seoTitle ("alquiler moto de agua…") when present;
    // fall back to the hero title + price for older locales.
    out[lang] = {
      title: product.seoTitle || `${product.hero.title} | ${fromLabel} ${minPrice}€ · Blanes`,
      description: product.hero.subtitle,
    };
  }
  return out;
}

// Jet ski hub/category page ("alquiler de moto de agua en Blanes"), head term.
function buildJetskiHubStaticMeta(): Partial<Record<LangCode, SEOMeta>> {
  const out: Partial<Record<LangCode, SEOMeta>> = {};
  for (const lang of Object.keys(I18N_BY_LANG) as LangCode[]) {
    const hub = (I18N_BY_LANG[lang] ?? i18nEs).jetskiHub;
    out[lang] = { title: hub.seoTitle, description: hub.hero.subtitle };
  }
  return out;
}

// Programmatic matrix pages (occasion × location). Copy lives in i18n
// occasionMatrix.pages keyed by comboId; slugs are composite (occasionWord-place)
// and live OUTSIDE ROUTE_SLUGS, so they get their own STATIC_META entries keyed
// by the ES slug (same normalization contract as pathToStaticMetaKey).
interface MatrixPageCopy {
  seoTitle: string;
  seoDescription: string;
  h1: string;
  intro: string;
  spotsTitle: string;
  spots: Array<{ name: string; description: string }>;
  boatsTitle: string;
  boatsIntro: string;
  practicalTitle: string;
  practicalBody: string;
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  ctaTitle: string;
  ctaText: string;
}

function getMatrixCopy(lang: LangCode, id: string): MatrixPageCopy | undefined {
  const pages = (I18N_BY_LANG[lang] ?? i18nEs).occasionMatrix?.pages as
    | Record<string, MatrixPageCopy | undefined>
    | undefined;
  return pages?.[id];
}

function buildMatrixStaticMetaEntries(): Record<string, Partial<Record<LangCode, SEOMeta>>> {
  if (!OCCASION_MATRIX_ENABLED) return {};
  const out: Record<string, Partial<Record<LangCode, SEOMeta>>> = {};
  for (const combo of liveMatrixCombos()) {
    const id = comboId(combo.occasion.id, combo.locationKey);
    const entry: Partial<Record<LangCode, SEOMeta>> = {};
    for (const lang of Object.keys(I18N_BY_LANG) as LangCode[]) {
      const copy = getMatrixCopy(lang, id);
      // Defensive: skip locales whose copy hasn't landed yet so availableLanguages
      // (and therefore hreflang) only advertises real translations.
      if (copy?.seoTitle && copy?.seoDescription) {
        entry[lang] = { title: copy.seoTitle, description: copy.seoDescription };
      }
    }
    if (Object.keys(entry).length > 0) {
      out[`/${matrixSlug(combo.occasion.id, combo.locationKey, "es")}`] = entry;
    }
  }
  return out;
}

// Per-route, per-language SEO meta. Covers main crawled pages.
// Note: titles/descriptions with year are built dynamically via SEASON_YEAR
const STATIC_META: Record<string, Partial<Record<LangCode, SEOMeta>>> = {
  ...buildMatrixStaticMetaEntries(),
  "/circuito-jet-ski-blanes": buildJetskiStaticMeta("circuito", 65),
  "/excursion-jet-ski-blanes-tossa": buildJetskiStaticMeta("excursion", 190),
  "/alquiler-moto-de-agua-blanes": buildJetskiHubStaticMeta(),
  "/": {
    // GSC 2026-05-09: CTR rewrite. URL "/" captura 92 de 106 clicks 28d (87%) en
    // pos 8.28 con CTR 2.16%. Reformulación: keyword-singular en title (match
    // exacta a "alquiler barco costa brava" 629 imp #1), rating + reviews
    // delante (★ + 310) como CTR booster, capacidad real 7 personas (max
    // flota), Año en ogTitle solo (freshness signal en redes). Idioma natural
    // por país, no traducción literal.
    es: {
      title: `Alquiler Barco Costa Brava · ${BUSINESS_RATING_STR}★ ${BUSINESS_REVIEW_COUNT_STR} reseñas · Blanes 70€/h`,
      description: `Alquiler barco Costa Brava desde Puerto de Blanes · ★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} reseñas). Sin licencia 70€/h gasolina incluida, hasta 7 personas. Reserva WhatsApp.`,
      ogTitle: `Alquiler Barco Costa Brava ${SEASON_YEAR} · ${BUSINESS_RATING_STR}★ Google · Blanes 70€/h`,
      ogDescription: `★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} reseñas). Alquiler barco Costa Brava sin licencia desde 70€/h, gasolina incluida. Reserva por WhatsApp.`,
    },
    en: {
      title: `Costa Brava Boat Rental · ${BUSINESS_RATING_STR}★ ${BUSINESS_REVIEW_COUNT_STR} Reviews · Blanes 70€/h`,
      description: `Rent a boat on Costa Brava from Blanes · ★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} reviews). License-free 70€/h, fuel included, up to 7 people. 15 min training. Book WhatsApp.`,
      ogTitle: `Costa Brava Boat Rental ${SEASON_YEAR} · ${BUSINESS_RATING_STR}★ Google · Blanes 70€/h`,
      ogDescription: `★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} reviews). Rent a boat on Costa Brava from Blanes, license-free from 70€/h, fuel included. Book on WhatsApp.`,
    },
    fr: {
      title: `Location Bateau Blanes · ${BUSINESS_RATING_STR}★ ${BUSINESS_REVIEW_COUNT_STR} Avis · Sans Permis 70€/h`,
      description: `Location bateau au Port de Blanes (Costa Brava) · ★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} avis). Sans permis 70€/h, carburant inclus, jusqu'à 7 personnes. Réservez WhatsApp.`,
      ogTitle: `Location Bateau Blanes ${SEASON_YEAR} · ${BUSINESS_RATING_STR}★ Google · Sans Permis 70€/h`,
      ogDescription: `★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} avis). Location bateau au Port de Blanes, Costa Brava. Sans permis dès 70€/h, carburant inclus. Réservation WhatsApp.`,
    },
    de: {
      title: `Bootsverleih Costa Brava · ${BUSINESS_RATING_STR}★ ${BUSINESS_REVIEW_COUNT_STR} Bewertungen · Blanes 70€/h`,
      description: `Bootsverleih Hafen Blanes (Costa Brava) · ★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} Bewertungen). Ohne Führerschein 70€/h, Kraftstoff inkl., bis 7 Personen. WhatsApp Buchung.`,
      ogTitle: `Bootsverleih Costa Brava ${SEASON_YEAR} · ${BUSINESS_RATING_STR}★ Google · Blanes 70€/h`,
      ogDescription: `★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} Bewertungen). Boot mieten an der Costa Brava ab Hafen Blanes. Ohne Führerschein, Kraftstoff inkl., ab 70€/h.`,
    },
    ca: {
      title: `Lloguer Barques Costa Brava · ${BUSINESS_RATING_STR}★ ${BUSINESS_REVIEW_COUNT_STR} Ressenyes · Blanes 70€/h`,
      description: `Lloguer barques Costa Brava des de Blanes · ★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} ressenyes). Sense llicència 70€/h gasolina inclosa, fins a 7 persones. Reserva WhatsApp.`,
      ogTitle: `Lloguer Barques Costa Brava ${SEASON_YEAR} · ${BUSINESS_RATING_STR}★ Google · Blanes 70€/h`,
      ogDescription: `★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} ressenyes). Lloguer barques Costa Brava des del Port de Blanes. Sense llicència des de 70€/h, gasolina inclosa.`,
    },
    nl: {
      title: `Boot Huren Blanes Costa Brava · ${BUSINESS_RATING_STR}★ ${BUSINESS_REVIEW_COUNT_STR} Reviews · 70€/u`,
      description: `Boot huren in Blanes (Costa Brava) · ★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} beoordelingen). Zonder vaarbewijs 70€/u, brandstof inbegrepen, tot 7 personen. WhatsApp boeking.`,
      ogTitle: `Boot Huren Blanes Costa Brava ${SEASON_YEAR} · ${BUSINESS_RATING_STR}★ Google · 70€/u`,
      ogDescription: `★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} beoordelingen). Boot huren in Blanes aan de Costa Brava. Zonder vaarbewijs vanaf 70€/u, brandstof inbegrepen.`,
    },
    it: {
      title: `Noleggio Barche Costa Brava · ${BUSINESS_RATING_STR}★ ${BUSINESS_REVIEW_COUNT_STR} Recensioni · Blanes 70€/h`,
      description: `Noleggio barche Costa Brava da Blanes · ★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} recensioni). Senza patente 70€/h, carburante incluso, fino a 7 persone. Prenota su WhatsApp.`,
      ogTitle: `Noleggio Barche Costa Brava ${SEASON_YEAR} · ${BUSINESS_RATING_STR}★ Google · Blanes 70€/h`,
      ogDescription: `★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} recensioni). Noleggio barche sulla Costa Brava dal Porto di Blanes. Senza patente da 70€/h, carburante incluso.`,
    },
    ru: {
      title: `Аренда Лодок Коста-Брава · ${BUSINESS_RATING_STR}★ ${BUSINESS_REVIEW_COUNT_STR} отзывов · Бланес 70€/ч`,
      description: `Аренда лодок Коста-Брава из Бланеса · ★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} отзывов). Без лицензии 70€/ч, топливо включено, до 7 человек. Бронь в WhatsApp.`,
      ogTitle: `Аренда Лодок Коста-Брава ${SEASON_YEAR} · ${BUSINESS_RATING_STR}★ Google · Бланес 70€/ч`,
      ogDescription: `★${BUSINESS_RATING_STR} Google (${BUSINESS_REVIEW_COUNT_STR} отзывов). Аренда лодок на Коста-Браве из порта Бланес. Без лицензии от 70€/ч, топливо включено.`,
    },
  },
  "/ai-citations": {
    // AI Citation Hub — lang-agnostic page targeted at LLM crawlers. We still
    // ship localized titles so when a Spanish/French user lands here from a
    // ChatGPT cite, the SERP snippet and the SSR <title> match their locale.
    es: {
      title: "AI Citation Hub | Costa Brava Rent a Boat",
      description: "Datos atómicos citables (DAMAR COSTA BRAVA S.L., flota, precios, GPS, contacto) curados para asistentes IA: ChatGPT, Perplexity, Claude.",
      ogTitle: "AI Citation Hub · Costa Brava Rent a Boat",
      ogDescription: "Hechos atómicos con anclas únicas para citación por LLMs. Razón social, flota, precios y endpoints estructurados.",
    },
    en: {
      title: "AI Citation Hub | Costa Brava Rent a Boat",
      description: "Anchor-addressable atomic facts (DAMAR COSTA BRAVA S.L., fleet, pricing, GPS, contact) curated for citation by AI assistants: ChatGPT, Perplexity, Claude.",
      ogTitle: "AI Citation Hub · Costa Brava Rent a Boat",
      ogDescription: "Atomic facts with unique anchors for LLM citation. Legal entity, fleet, pricing and structured endpoints.",
    },
    ca: {
      title: "AI Citation Hub | Costa Brava Rent a Boat",
      description: "Dades atòmiques citables (DAMAR COSTA BRAVA S.L., flota, preus, GPS, contacte) curades per a assistents IA: ChatGPT, Perplexity, Claude.",
    },
    fr: {
      title: "AI Citation Hub | Costa Brava Rent a Boat",
      description: "Données atomiques citables (DAMAR COSTA BRAVA S.L., flotte, tarifs, GPS, contact) pour les assistants IA : ChatGPT, Perplexity, Claude.",
    },
    de: {
      title: "AI Citation Hub | Costa Brava Rent a Boat",
      description: "Atomare zitierbare Fakten (DAMAR COSTA BRAVA S.L., Flotte, Preise, GPS, Kontakt) für KI-Assistenten: ChatGPT, Perplexity, Claude.",
    },
    nl: {
      title: "AI Citation Hub | Costa Brava Rent a Boat",
      description: "Atomische citeerbare feiten (DAMAR COSTA BRAVA S.L., vloot, prijzen, GPS, contact) voor AI-assistenten: ChatGPT, Perplexity, Claude.",
    },
    it: {
      title: "AI Citation Hub | Costa Brava Rent a Boat",
      description: "Fatti atomici citabili (DAMAR COSTA BRAVA S.L., flotta, prezzi, GPS, contatti) per assistenti IA: ChatGPT, Perplexity, Claude.",
    },
    ru: {
      title: "AI Citation Hub | Costa Brava Rent a Boat",
      description: "Цитируемые атомарные факты (DAMAR COSTA BRAVA S.L., флот, цены, GPS, контакт) для ИИ-ассистентов: ChatGPT, Perplexity, Claude.",
    },
  },
  "/faq": {
    es: {
      title: "Preguntas Frecuentes Alquiler Barcos Blanes | FAQ",
      description: "¿Necesito licencia? ¿Qué incluye? ¿Cuánto cuesta? Resuelve todas tus dudas sobre alquiler de barcos en Blanes.",
      ogTitle: "FAQ Alquiler Barcos Blanes | Resuelve Tus Dudas Costa Brava",
      ogDescription: "¿Licencia necesaria? ¿Qué incluye? ¿Precios? Todas las respuestas sobre alquilar barcos en Blanes.",
    },
    en: {
      title: "Boat Rental Blanes FAQ | Frequently Asked Questions",
      description: "Do I need a license? What's included? How much does it cost? All your boat rental questions answered.",
    },
    ca: {
      title: "Preguntes Freqüents Lloguer Barques Blanes | FAQ",
      description: "Necessito llicència? Què inclou? Quant costa? Resol tots els dubtes sobre lloguer de barques a Blanes.",
    },
    fr: {
      title: "FAQ Location de Bateaux Blanes | Questions Fréquentes",
      description: "Ai-je besoin d'un permis? Qu'est-ce qui est inclus? Combien ça coûte? Toutes les réponses sur la location de bateaux à Blanes.",
    },
    de: {
      title: "FAQ Bootsverleih Blanes | Häufige Fragen",
      description: "Brauche ich einen Führerschein? Was ist inbegriffen? Wie viel kostet es? Alle Antworten zur Bootsmiete in Blanes.",
    },
    nl: {
      title: "FAQ Bootverhuur Blanes | Costa Brava",
      description: "Heb ik een vaarbewijs nodig? Wat is inbegrepen? Hoeveel kost het? Alle antwoorden over bootverhuur in Blanes.",
    },
    it: {
      title: "FAQ Noleggio Barche Blanes | Costa Brava",
      description: "Ho bisogno della patente? Cosa è incluso? Quanto costa? Tutte le risposte sul noleggio barche a Blanes.",
    },
    ru: {
      title: "FAQ Аренда Лодок Бланес | Коста-Брава",
      description: "Нужна ли лицензия? Что включено? Сколько стоит? Все ответы об аренде лодок в Бланесе.",
    },
  },
  "/galeria": {
    es: {
      title: "Galería de Fotos | Costa Brava Rent a Boat",
      description: "Fotos reales de nuestros clientes disfrutando en barco por la Costa Brava desde Blanes. ¡Comparte tu experiencia!",
    },
    en: {
      title: "Photo Gallery | Costa Brava Rent a Boat",
      description: "Real photos of our customers enjoying boat trips along Costa Brava from Blanes.",
    },
    ca: {
      title: "Galeria de Fotos Clients | Costa Brava Rent a Boat",
      description: "Fotos reals dels nostres clients gaudint en barca per la Costa Brava des de Blanes.",
    },
    fr: {
      title: "Galerie Photos Clients | Costa Brava Rent a Boat",
      description: "Photos réelles de nos clients profitant de la Costa Brava en bateau depuis Blanes.",
    },
    de: {
      title: "Kundenfotogalerie | Costa Brava Rent a Boat",
      description: "Echte Fotos unserer Kunden auf Bootsausflügen an der Costa Brava ab Blanes.",
    },
    nl: {
      title: "Klantenfotogalerij | Costa Brava Rent a Boat",
      description: "Echte foto's van onze klanten die genieten van boottochten aan de Costa Brava vanuit Blanes.",
    },
    it: {
      title: "Galleria Fotografica Clienti | Costa Brava Rent a Boat",
      description: "Foto reali dei nostri clienti che si godono gite in barca sulla Costa Brava da Blanes.",
    },
    ru: {
      title: "Фотогалерея Клиентов | Costa Brava Rent a Boat",
      description: "Реальные фото наших клиентов на лодочных прогулках по Коста-Браве из Бланеса.",
    },
  },
  "/rutas": {
    es: {
      title: "Rutas en Barco desde Blanes | Costa Brava",
      description: "Descubre las mejores rutas en barco desde Blanes. Desde Sa Palomera hasta Tossa de Mar. Mapas interactivos y guía de navegación.",
      ogTitle: `Rutas en Barco desde Blanes | Costa Brava ${SEASON_YEAR}`,
      ogDescription: "5 rutas en barco desde Blanes. Sa Palomera, Cala Sant Francesc, Lloret de Mar, Tossa de Mar.",
    },
    en: {
      title: "Boat Routes from Blanes | Costa Brava",
      description: "Discover the best boat routes from Blanes. From Sa Palomera to Tossa de Mar. Interactive maps and navigation guide.",
    },
    ca: {
      title: "Rutes en Barca des de Blanes | Costa Brava",
      description: "Descobreix les millors rutes en barca des de Blanes. Des de Sa Palomera fins a Tossa de Mar. Mapes interactius.",
    },
    fr: {
      title: "Itinéraires en Bateau depuis Blanes | Costa Brava",
      description: "Découvrez les meilleures routes en bateau depuis Blanes. De Sa Palomera à Tossa de Mar. Cartes interactives.",
    },
    de: {
      title: "Bootsrouten ab Blanes | Costa Brava",
      description: "Entdecken Sie die besten Bootsrouten ab Blanes. Von Sa Palomera bis Tossa de Mar. Interaktive Karten.",
    },
    nl: {
      title: "Bootroutes vanuit Blanes | Costa Brava",
      description: "Ontdek de beste bootroutes vanuit Blanes. Van Sa Palomera tot Tossa de Mar. Interactieve kaarten.",
    },
    it: {
      title: "Percorsi in Barca da Blanes | Costa Brava",
      description: "Scopri i migliori percorsi in barca da Blanes. Da Sa Palomera a Tossa de Mar. Mappe interattive.",
    },
    ru: {
      title: "Маршруты на Лодке из Бланеса | Коста-Брава",
      description: "Откройте лучшие маршруты на лодке из Бланеса. От Са Паломера до Тосса-де-Мар. Интерактивные карты.",
    },
  },
  "/tarjetas-regalo": {
    es: {
      title: "Tarjetas Regalo Alquiler Barcos | Costa Brava Rent a Boat",
      description: "Regala una experiencia náutica en la Costa Brava. Tarjetas regalo desde 50€ para alquilar barcos en Blanes. Válidas 1 año.",
      ogTitle: "Tarjetas Regalo | Costa Brava Rent a Boat",
      ogDescription: "Regala una experiencia náutica inolvidable. Tarjetas desde 50€ canjeables en todos nuestros barcos en Blanes.",
    },
    en: {
      title: "Gift Cards Boat Rental | Costa Brava Rent a Boat",
      description: "Give the gift of a nautical experience on Costa Brava. Gift cards from 50€ for boat rental in Blanes. Valid 1 year.",
    },
    ca: {
      title: "Targetes Regal Lloguer Barques | Costa Brava Rent a Boat",
      description: "Regala una experiència nàutica a la Costa Brava. Targetes regal des de 50€ per llogar barques a Blanes. Vàlides 1 any.",
    },
    fr: {
      title: "Cartes Cadeaux Location Bateaux | Costa Brava Rent a Boat",
      description: "Offrez une expérience nautique sur la Costa Brava. Cartes cadeaux dès 50€ pour louer des bateaux à Blanes. Valables 1 an.",
    },
    de: {
      title: "Geschenkkarten Bootsverleih | Costa Brava Rent a Boat",
      description: "Verschenken Sie ein nautisches Erlebnis an der Costa Brava. Geschenkkarten ab 50€ für Bootsverleih in Blanes. 1 Jahr gültig.",
    },
    nl: {
      title: "Cadeaukaarten Bootverhuur | Costa Brava Rent a Boat",
      description: "Geef een nautische ervaring aan de Costa Brava. Cadeaukaarten vanaf 50€ voor bootverhuur in Blanes. 1 jaar geldig.",
    },
    it: {
      title: "Carte Regalo Noleggio Barche | Costa Brava Rent a Boat",
      description: "Regala un'esperienza nautica sulla Costa Brava. Carte regalo da 50€ per noleggio barche a Blanes. Valide 1 anno.",
    },
    ru: {
      title: "Подарочные Карты Аренда Лодок | Costa Brava Rent a Boat",
      description: "Подарите морской опыт на Коста-Браве. Подарочные карты от 50€ на аренду лодок в Бланесе. Действительны 1 год.",
    },
  },
  "/testimonios": {
    es: {
      title: "Opiniones Clientes Alquiler Barcos Blanes",
      description: "Lee opiniones reales de clientes que alquilaron barcos en Blanes. +100 reviews verificadas. Experiencias en Costa Brava.",
      ogTitle: "Opiniones Verificadas Alquiler Barcos Blanes | Costa Brava",
      ogDescription: "+100 opiniones reales de clientes satisfechos. Descubre experiencias únicas navegando por la Costa Brava desde Blanes.",
    },
    en: {
      title: "Customer Reviews Boat Rental Blanes | Costa Brava",
      description: "Read real reviews from customers who rented boats in Blanes. +100 verified reviews.",
    },
    ca: {
      title: "Opinions Clients Lloguer Barques Blanes",
      description: "Llegeix opinions reals de clients que han llogat barques a Blanes. +100 ressenyes verificades.",
    },
    fr: {
      title: "Avis Clients Location Bateaux Blanes",
      description: "Lisez les avis réels de clients ayant loué des bateaux à Blanes. +100 avis vérifiés.",
    },
    de: {
      title: "Kundenbewertungen Bootsverleih Blanes",
      description: "Lesen Sie echte Bewertungen von Kunden, die Boote in Blanes gemietet haben. +100 verifizierte Bewertungen.",
    },
    nl: {
      title: "Klantenbeoordelingen Bootverhuur Blanes",
      description: "Lees echte beoordelingen van klanten die boten hebben gehuurd in Blanes. +100 geverifieerde reviews.",
    },
    it: {
      title: "Recensioni Clienti Noleggio Barche Blanes",
      description: "Leggi le recensioni reali dei clienti che hanno noleggiato barche a Blanes. +100 recensioni verificate.",
    },
    ru: {
      title: "Отзывы Клиентов Аренда Лодок Бланес",
      description: "Читайте реальные отзывы клиентов, арендовавших лодки в Бланесе. +100 проверенных отзывов.",
    },
  },
  "/blog": {
    es: {
      title: "Blog de Navegación y Destinos | Costa Brava",
      description: "Guías, consejos y destinos para alquilar barcos en Blanes y la Costa Brava. Descubre calas secretas, rutas náuticas y tips.",
      ogTitle: "Blog de Navegación Costa Brava | Guías y Destinos en Barco",
      ogDescription: "Descubre guías completas, consejos de navegación y los mejores destinos de la Costa Brava.",
    },
    en: {
      title: "Boat Navigation Blog | Costa Brava",
      description: "Guides, tips and destinations for boat rental in Blanes and Costa Brava. Discover secret coves and nautical routes.",
    },
    ca: {
      title: "Blog de Navegació i Destinacions | Costa Brava",
      description: "Guies, consells i destinacions per llogar barques a Blanes i la Costa Brava. Descobreix cales secretes i rutes nàutiques.",
    },
    fr: {
      title: "Blog de Navigation et Destinations | Costa Brava",
      description: "Guides, conseils et destinations pour louer des bateaux à Blanes et Costa Brava. Criques secrètes et routes nautiques.",
    },
    de: {
      title: "Navigation und Reiseziele Blog | Costa Brava",
      description: "Anleitungen, Tipps und Reiseziele für Bootsvermietung in Blanes und Costa Brava. Geheime Buchten und Seerouten.",
    },
    nl: {
      title: "Navigatie en Bestemmingen Blog | Costa Brava",
      description: "Gidsen, tips en bestemmingen voor bootverhuur in Blanes en Costa Brava. Geheime baaien en nautische routes.",
    },
    it: {
      title: "Blog di Navigazione e Destinazioni | Costa Brava",
      description: "Guide, consigli e destinazioni per noleggio barche a Blanes e Costa Brava. Calette segrete e rotte nautiche.",
    },
    ru: {
      title: "Блог о Навигации и Направлениях | Costa Brava",
      description: "Руководства, советы и направления для аренды лодок в Бланесе и Коста-Браве. Секретные бухты и морские маршруты.",
    },
  },
  "/barcos-sin-licencia": {
    es: {
      title: "Barcos Sin Licencia en Blanes | 5 Barcos desde 70€/h",
      description: "5 barcos sin licencia en Blanes con gasolina incluida. Astec 400, Solar 450, Remus 450 y Astec 480. Formación 15 min. 4.8★ Google. Reserva online.",
      ogTitle: "Barcos Sin Licencia en Blanes | Fácil y Seguro Costa Brava",
      ogDescription: "Alquila barcos sin licencia en Blanes. Hasta 15 CV, 4-7 personas. No necesitas titulación.",
    },
    en: {
      title: "No License Boat Rental Costa Brava | Blanes from 70€/h",
      description: "5 no-license boats in Blanes from 70€/h. Fuel included, 4-7 people. No experience needed, 15 min training. 4.8★ Google. Book online.",
    },
    ca: {
      title: "Barques Sense Llicència Blanes | 5 Barques des de 70€/h",
      description: "5 barques sense llicencia a Blanes des de 70€/h. Gasolina inclosa, 4-7 persones. Sense experiencia, formacio 15 min. 4.8★ Google. Reserva online.",
    },
    fr: {
      title: "Bateaux Sans Permis Costa Brava | 5 Bateaux dès 70€/h Blanes",
      description: "5 bateaux sans permis a Blanes des 70€/h. Carburant inclus, 4-7 personnes. Aucune experience, formation 15 min. 4.8★ Google. Reservez en ligne.",
    },
    de: {
      title: "Boote Ohne Führerschein Blanes | 5 Boote ab 70€/h",
      description: "5 Boote ohne Führerschein in Blanes ab 70€/h. Kraftstoff inklusive, 4-5 Personen. Keine Erfahrung notig, 15 Min Einweisung. 4.8★ Google. Online buchen.",
    },
    nl: {
      title: "Boten Zonder Vaarbewijs Blanes | 5 Boten vanaf 70€/u",
      description: `Huur een boot zonder vaarbewijs in Blanes, Costa Brava vanaf €70/u. Brandstof inbegrepen, tot 5 personen. 4.8★ · ${BUSINESS_REVIEW_COUNT_STR} reviews · 15 min training. Online boeken.`,
    },
    it: {
      title: "Barche Senza Patente Costa Brava | 5 Barche da 70€/h Blanes",
      description: "5 barche senza patente a Blanes da 70€/h. Carburante incluso, 4-7 persone. Nessuna esperienza, formazione 15 min. 4.8★ Google. Prenota online.",
    },
    ru: {
      title: "Лодки Без Лицензии Коста-Брава | 5 Лодок от 70€/ч Бланес",
      description: "5 лодок без лицензии в Бланесе от 70€/ч. Топливо включено, 4-7 человек. Без опыта, обучение 15 мин. 4.8★ Google. Бронируйте онлайн.",
    },
  },
  "/barcos-con-licencia": {
    es: {
      title: "Barcos Con Licencia Blanes Costa Brava | desde 160€/2h",
      description: "Navega a Lloret (15 min) y Tossa (30 min) desde Blanes. 3 barcos 80-115CV. Licencia Básica o con patrón incluido. 4.8★ Google. Reserva online.",
      ogTitle: "Barcos Con Licencia en Blanes | Lloret 15 min, Tossa 30 min",
      ogDescription: "3 barcos potentes 80-115CV en Blanes. Con tu Licencia Básica o con patrón. Reserva online.",
    },
    en: {
      title: "Licensed Boat Rental Costa Brava | Blanes from 160€/2h",
      description: "Sail to Lloret (15 min) and Tossa (30 min) from Blanes. 3 boats 80-115HP. Basic License or with skipper. 4.8★ Google. Book online.",
    },
    ca: {
      title: "Barques Amb Llicència Blanes | Costa Brava des de 160€/2h",
      description: "Navega a Lloret (15 min) i Tossa (30 min) des de Blanes. 3 barques 80-115CV. Llicència Bàsica o amb patró. 4.8★ Google. Reserva online.",
    },
    fr: {
      title: "Bateaux Avec Permis Blanes | Costa Brava dès 160€/2h",
      description: "Naviguez à Lloret (15 min) et Tossa (30 min) depuis Blanes. 3 bateaux 80-115CV. Permis côtier ou avec skipper. 4.8★ Google. Réservez en ligne.",
    },
    de: {
      title: "Boote Mit Führerschein Blanes | Costa Brava ab 160€/2h",
      description: "Segeln Sie nach Lloret (15 Min) und Tossa (30 Min) ab Blanes. 3 Boote 80-115PS. Bootsführerschein oder mit Skipper. 4.8★ Google. Online buchen.",
    },
    nl: {
      title: "Boten Met Vaarbewijs Costa Brava | Blanes vanaf 160€/2u",
      description: "Vaar naar Lloret (15 min) en Tossa (30 min) vanuit Blanes. 3 boten 80-115PK. Vaarbewijs of met schipper. 4.8★ Google. Boek online.",
    },
    it: {
      title: "Barche Con Patente Costa Brava | Blanes da 160€/2h",
      description: "Naviga a Lloret (15 min) e Tossa (30 min) da Blanes. 3 barche 80-115CV. Patente nautica o con skipper. 4.8★ Google. Prenota online.",
    },
    ru: {
      title: "Лодки С Лицензией Коста-Брава | Бланес от 160€/2ч",
      description: "Плавайте в Льорет (15 мин) и Тосса (30 мин) из Бланеса. 3 лодки 80-115 л.с. С лицензией или шкипером. 4.8★ Google. Бронируйте онлайн.",
    },
  },
  "/alquiler-barcos-blanes": {
    es: {
      title: "Alquiler Barcos Puerto Blanes | Sin Licencia desde 70\u20ac/h",
      description: "Alquila barco sin licencia en Puerto de Blanes desde 70\u20ac/h. Gasolina incluida, 9 barcos, parking gratis. 4.8\u2605 Google. Reserva online.",
      ogTitle: `Alquiler de Barcos en Puerto de Blanes | ${SEASON_YEAR}`,
      ogDescription: "Alquila barcos en Puerto de Blanes. Sin licencia desde 70\u20ac/h con gasolina incluida. 9 embarcaciones disponibles. Reserva ya.",
    },
    en: {
      title: `Boat Rental Blanes Port ${SEASON_YEAR} | No License from 70\u20ac/h`,
      description: "No license boat rental at Blanes Port from 70\u20ac/h. Fuel included, free parking. 9 boats available. 4.8\u2605 Google. Book online.",
    },
    ca: {
      title: `Lloguer Barques Sense Llic\u00e8ncia Blanes ${SEASON_YEAR} | des de 70\u20ac/h`,
      description: "Lloguer de barques sense llic\u00e8ncia al Port de Blanes. Des de 70\u20ac/h, gasolina inclosa. 9 barques disponibles. Reserva online.",
    },
    fr: {
      title: `Location Bateaux Sans Permis Blanes ${SEASON_YEAR} | d\u00e8s 70\u20ac/h`,
      description: "Location de bateaux sans permis au Port de Blanes. D\u00e8s 70\u20ac/h, carburant inclus. 9 bateaux disponibles. R\u00e9servez en ligne.",
    },
    de: {
      title: `Bootsverleih Ohne F\u00fchrerschein Blanes ${SEASON_YEAR} | ab 70\u20ac/h`,
      description: "Bootsverleih ohne F\u00fchrerschein im Hafen Blanes. Ab 70\u20ac/h, Kraftstoff inklusive. 9 Boote verf\u00fcgbar. Online buchen.",
    },
    nl: {
      title: `Bootverhuur Zonder Vaarbewijs Blanes ${SEASON_YEAR} | vanaf 70\u20ac/u`,
      description: "Bootverhuur zonder vaarbewijs in Haven Blanes. Vanaf 70\u20ac/u, brandstof inbegrepen. 9 boten beschikbaar. Online boeken.",
    },
    it: {
      title: `Noleggio Barche Senza Patente Blanes ${SEASON_YEAR} | da 70\u20ac/h`,
      description: "Noleggio barche senza patente al Porto di Blanes. Da 70\u20ac/h, carburante incluso. 9 barche disponibili. Prenota online.",
    },
    ru: {
      title: `\u0410\u0440\u0435\u043d\u0434\u0430 \u041b\u043e\u0434\u043e\u043a \u0411\u043b\u0430\u043d\u0435\u0441 \u0411\u0435\u0437 \u041b\u0438\u0446\u0435\u043d\u0437\u0438\u0438 ${SEASON_YEAR} | \u041f\u043e\u0440\u0442 \u0411\u043b\u0430\u043d\u0435\u0441 \u043e\u0442 70\u20ac/\u0447`,
      description: "\u0410\u0440\u0435\u043d\u0434\u0430 \u043b\u043e\u0434\u043e\u043a \u0431\u0435\u0437 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0438 \u0432 \u043f\u043e\u0440\u0442\u0443 \u0411\u043b\u0430\u043d\u0435\u0441. \u041e\u0442 70\u20ac/\u0447, \u0442\u043e\u043f\u043b\u0438\u0432\u043e \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u043e. 8 \u043b\u043e\u0434\u043e\u043a. \u0411\u0440\u043e\u043d\u0438\u0440\u0443\u0439\u0442\u0435 \u043e\u043d\u043b\u0430\u0439\u043d.",
    },
  },
  "/alquiler-barcos-lloret-de-mar": {
    es: {
      title: "Alquiler Barco Lloret de Mar Sin Licencia | Ruta 7 Calas",
      description: "Navega sin licencia desde Blanes hasta Playa de Fenals (sur de Lloret). 7 calas vírgenes: Sa Forcanera, Santa Cristina, Cala Sa Boadella. Gasolina incluida.",
      ogTitle: "Alquiler Barco Lloret de Mar Sin Licencia — Ruta 7 Calas",
      ogDescription: "7 calas entre Blanes y Playa de Fenals con barco sin licencia. 25 min de navegación desde el puerto. Gasolina incluida.",
    },
    en: {
      title: "Boat Trip to Lloret de Mar from Blanes",
      description: "Sail from Blanes to Lloret de Mar. Boat rental with or without license. Discover the best beaches and coves.",
    },
    ca: {
      title: "Excursió en Barca a Lloret de Mar des de Blanes",
      description: "Navega de Blanes a Lloret de Mar. Lloguer de barques amb o sense llicència. Descobreix les millors platges i cales.",
    },
    fr: {
      title: "Excursion en Bateau à Lloret de Mar depuis Blanes",
      description: "Naviguez de Blanes à Lloret de Mar. Location de bateaux avec ou sans permis. Découvrez les meilleures plages.",
    },
    de: {
      title: "Bootsausflug nach Lloret de Mar von Blanes",
      description: "Segeln Sie von Blanes nach Lloret de Mar. Bootsverleih mit oder ohne Führerschein. Entdecken Sie die besten Strände.",
    },
    nl: {
      title: "Boottocht naar Lloret de Mar vanuit Blanes",
      description: `Vaar naar Lloret de Mar vanaf Blanes. 7 cala's op de route. Boot huren zonder vaarbewijs vanaf €70/u. Brandstof inbegrepen. 4.8★ · ${BUSINESS_REVIEW_COUNT_STR} reviews. Boek online.`,
    },
    it: {
      title: "Escursione in Barca a Lloret de Mar da Blanes",
      description: "Naviga da Blanes a Lloret de Mar. Noleggio barche con o senza patente. Scopri le migliori spiagge.",
    },
    ru: {
      title: "Экскурсия на Лодке в Льорет-де-Мар из Бланеса",
      description: "Плывите из Бланеса в Льорет-де-Мар. Аренда лодок с лицензией или без. Откройте лучшие пляжи.",
    },
  },
  "/alquiler-barcos-tossa-de-mar": {
    es: {
      title: "Barco Tossa de Mar Con Licencia | Vila Vella desde el Mar",
      description: "Alquila barco con licencia (LN o superior) o charter con patrón desde Blanes a Tossa de Mar. Navega frente a la Vila Vella medieval. 30-45 min ida. Cala Pola, Giverola.",
      ogTitle: "Alquiler Barco Tossa de Mar | Licencia de Navegaci\u00f3n (LN) o Excursi\u00f3n con Capit\u00e1n",
      ogDescription: "Vila Vella de Tossa en 30-45 min desde Blanes. Con LN desde 160\u20ac (2h) o Excursi\u00f3n con Capit\u00e1n 4h desde 380\u20ac. Combustible aparte. 4.8\u2605.",
    },
    en: {
      title: "Boat Trip to Tossa de Mar from Blanes",
      description: "Sail to Tossa de Mar in 30-45 min from Blanes. Discover the most beautiful medieval town of Costa Brava.",
    },
    ca: {
      title: "Excursió en Barca a Tossa de Mar des de Blanes",
      description: "Navega a Tossa de Mar en 30-45 min des de Blanes. Descobreix el poble medieval més bonic de la Costa Brava.",
    },
    fr: {
      title: "Excursion en Bateau à Tossa de Mar depuis Blanes",
      description: "Naviguez vers Tossa de Mar en 30-45 min depuis Blanes. Découvrez la plus belle ville médiévale de la Costa Brava.",
    },
    de: {
      title: "Bootsausflug nach Tossa de Mar von Blanes",
      description: "Segeln Sie in 30-45 Min. von Blanes nach Tossa de Mar. Entdecken Sie die schönste mittelalterliche Stadt der Costa Brava.",
    },
    nl: {
      title: "Boottocht naar Tossa de Mar vanuit Blanes",
      description: `Vaar naar Tossa de Mar vanaf Blanes. Boot huren zonder vaarbewijs vanaf €70/u. Brandstof inbegrepen, tot 5 personen. 4.8★ · ${BUSINESS_REVIEW_COUNT_STR} reviews. Online boeken.`,
    },
    it: {
      title: "Escursione in Barca a Tossa de Mar da Blanes",
      description: "Naviga verso Tossa de Mar in 30-45 min da Blanes. Scopri la città medievale più bella della Costa Brava.",
    },
    ru: {
      title: "Экскурсия на Лодке в Тосса-де-Мар из Бланеса",
      description: "Плывите в Тосса-де-Мар за 1 час из Бланеса. Откройте самый красивый средневековый город Коста-Бравы.",
    },
  },
  "/alquiler-barcos-malgrat-de-mar": {
    es: {
      title: "Alquiler Barco cerca Malgrat | Puerto Blanes 10 min",
      description: "Alojado en Malgrat de Mar? Puerto de Blanes a 10 min en coche. Barcos sin licencia desde 70\u20ac/h con gasolina incluida.",
      ogTitle: "Alquiler Barco cerca de Malgrat de Mar | Desde Blanes",
      ogDescription: "Desde Malgrat al Puerto de Blanes en 10 min. Barcos sin licencia desde 70\u20ac con gasolina. Reserva ya.",
    },
    en: {
      title: "Boat Rental near Malgrat de Mar | Blanes Port 10 min",
      description: "Staying in Malgrat de Mar? Blanes Port is 10 min by car. License-free boats from \u20ac70/h, fuel included.",
    },
    ca: {
      title: "Lloguer Barques a prop Malgrat | Port Blanes 10 min",
      description: "Allotjat a Malgrat de Mar? Port de Blanes a 10 min en cotxe. Barques sense llicència des de 70\u20ac/h.",
    },
    fr: {
      title: "Location Bateau près de Malgrat de Mar | Port Blanes 10 min",
      description: "En vacances à Malgrat de Mar ? Port de Blanes à 10 min en voiture. Bateaux sans permis dès 70\u20ac/h.",
    },
    de: {
      title: "Bootsverleih bei Malgrat de Mar | Hafen Blanes 10 Min",
      description: "Urlaub in Malgrat de Mar? Hafen Blanes in 10 Min. Boote ohne Führerschein ab 70\u20ac/Std.",
    },
    nl: {
      title: "Boothuur bij Malgrat de Mar | Haven Blanes 10 min",
      description: "Op vakantie in Malgrat de Mar? Haven Blanes op 10 min. Boten zonder vaarbewijs vanaf \u20ac70/uur.",
    },
    it: {
      title: "Noleggio Barche vicino Malgrat | Porto Blanes 10 min",
      description: "In vacanza a Malgrat de Mar? Porto di Blanes a 10 min. Barche senza patente da 70\u20ac/ora.",
    },
    ru: {
      title: "Аренда лодок рядом с Малграт-де-Мар | Порт Бланес 10 мин",
      description: "Отдыхаете в Малграт-де-Мар? Порт Бланеса в 10 мин на машине. Лодки без прав от 70\u20ac/час.",
    },
  },
  "/alquiler-barcos-santa-susanna": {
    es: {
      title: "Alquiler Barco cerca de Santa Susanna | Puerto Blanes 15 min",
      description: "Vacaciones en Santa Susanna? Puerto de Blanes a 15 min. Barcos sin licencia desde 70\u20ac/h con gasolina incluida.",
      ogTitle: "Alquiler Barco cerca de Santa Susanna | Desde Blanes",
      ogDescription: "Desde Santa Susanna al Puerto de Blanes en 15 min. Barcos sin licencia desde 70\u20ac. Reserva tu aventura.",
    },
    en: {
      title: "Boat Rental near Santa Susanna | Blanes Port 15 min",
      description: "Holiday in Santa Susanna? Blanes Port is 15 min by car. License-free boats from \u20ac70/h, fuel included.",
    },
    ca: {
      title: "Lloguer Barques a prop de Santa Susanna | Port Blanes 15 min",
      description: "Vacances a Santa Susanna? Port de Blanes a 15 min en cotxe. Barques sense llicència des de 70\u20ac/h.",
    },
    fr: {
      title: "Location Bateau près de Santa Susanna | Port Blanes 15 min",
      description: "Vacances à Santa Susanna ? Port de Blanes à 15 min. Bateaux sans permis dès 70\u20ac/h.",
    },
    de: {
      title: "Bootsverleih bei Santa Susanna | Hafen Blanes 15 Min",
      description: "Urlaub in Santa Susanna? Hafen Blanes in 15 Min. Boote ohne Führerschein ab 70\u20ac/Std.",
    },
    nl: {
      title: "Boothuur bij Santa Susanna | Haven Blanes 15 min",
      description: "Vakantie in Santa Susanna? Haven Blanes op 15 min. Boten zonder vaarbewijs vanaf \u20ac70/uur.",
    },
    it: {
      title: "Noleggio Barche vicino a Santa Susanna | Porto Blanes 15 min",
      description: "Vacanza a Santa Susanna? Porto di Blanes a 15 min. Barche senza patente da 70\u20ac/ora.",
    },
    ru: {
      title: "Аренда лодок рядом с Санта-Сусанна | Порт Бланес 15 мин",
      description: "Отпуск в Санта-Сусанне? Порт Бланеса в 15 мин. Лодки без прав от 70\u20ac/час.",
    },
  },
  "/alquiler-barcos-calella": {
    es: {
      title: "Alquiler Barco cerca de Calella | Puerto Blanes 20 min",
      description: "En Calella? Puerto de Blanes a 20 min en coche. Barcos sin licencia desde 70\u20ac/h con gasolina incluida.",
      ogTitle: "Alquiler Barco cerca de Calella | Desde Blanes Costa Brava",
      ogDescription: "Desde Calella al Puerto de Blanes en 20 min. Barcos sin licencia desde 70\u20ac. Descubre la Costa Brava.",
    },
    en: {
      title: "Boat Rental near Calella | Blanes Port 20 min from \u20ac70",
      description: "Staying in Calella? Blanes Port is 20 min by car. License-free boats from \u20ac70/h, fuel included.",
    },
    ca: {
      title: "Lloguer Barques a prop de Calella | Port Blanes 20 min",
      description: "A Calella? Port de Blanes a 20 min en cotxe. Barques sense llicència des de 70\u20ac/h. Gasolina inclosa.",
    },
    fr: {
      title: "Location Bateau près de Calella | Port Blanes 20 min dès 70\u20ac",
      description: "En séjour à Calella ? Port de Blanes à 20 min. Bateaux sans permis dès 70\u20ac/h. Essence incluse.",
    },
    de: {
      title: "Bootsverleih bei Calella | Hafen Blanes 20 Min ab 70\u20ac",
      description: "In Calella? Hafen Blanes in 20 Min. Boote ohne Führerschein ab 70\u20ac/Std. Benzin inklusive.",
    },
    nl: {
      title: "Boothuur bij Calella | Haven Blanes 20 min vanaf \u20ac70",
      description: "In Calella? Haven Blanes op 20 min. Boten zonder vaarbewijs vanaf \u20ac70/uur. Brandstof inbegrepen.",
    },
    it: {
      title: "Noleggio Barche vicino a Calella | Porto Blanes 20 min",
      description: "A Calella? Porto di Blanes a 20 min. Barche senza patente da 70\u20ac/ora. Benzina inclusa.",
    },
    ru: {
      title: "Аренда лодок рядом с Калелья | Порт Бланес 20 мин от 70\u20ac",
      description: "В Калелье? Порт Бланеса в 20 мин на машине. Лодки без прав от 70\u20ac/час.",
    },
  },
  "/alquiler-barcos-pineda-de-mar": {
    es: {
      title: "Alquiler Barco Pineda de Mar | Puerto Blanes 18 min",
      description: "\u00bfAlojado en Pineda de Mar? Puerto Blanes a 18 min en coche o 12 min en tren R1. Alquila barco sin licencia desde 70\u20ac/h con gasolina incluida.",
      ogTitle: "Alquiler Barco Pineda de Mar | 18 min al Puerto Blanes",
      ogDescription: "Desde Pineda de Mar al Puerto Blanes en 18 min. Barco sin licencia desde 70\u20ac/h. 4.8\u2605 Google.",
    },
    en: {
      title: "Boat Rental Pineda de Mar | Blanes Port 18 min",
      description: "Staying in Pineda de Mar? Blanes Port is 18 min by car or 12 min by R1 train. Rent a license-free boat from 70\u20ac/h, fuel included.",
    },
    ca: {
      title: "Lloguer Barca Pineda de Mar | Port Blanes 18 min",
      description: "A Pineda de Mar? Port Blanes a 18 min en cotxe o 12 min en tren R1. Lloga barca sense llic\u00e8ncia des de 70\u20ac/h amb gasolina inclosa.",
    },
    fr: {
      title: "Location Bateau Pineda de Mar | Port Blanes 18 min",
      description: "En s\u00e9jour \u00e0 Pineda de Mar ? Port Blanes \u00e0 18 min en voiture ou 12 min en train R1. Louez un bateau sans permis d\u00e8s 70\u20ac/h avec carburant inclus.",
    },
    de: {
      title: "Bootsverleih Pineda de Mar | Hafen Blanes 18 Min",
      description: "Urlaub in Pineda de Mar? Hafen Blanes in 18 Min mit Auto oder 12 Min mit R1-Zug. Boot ohne F\u00fchrerschein ab 70\u20ac/h mit Kraftstoff inklusive.",
    },
    nl: {
      title: "Bootverhuur Pineda de Mar | Haven Blanes 18 min",
      description: "Op vakantie in Pineda de Mar? Haven Blanes op 18 min met auto of 12 min met R1-trein. Boot zonder vaarbewijs vanaf 70\u20ac/u met brandstof inbegrepen.",
    },
    it: {
      title: "Noleggio Barca Pineda de Mar | Porto Blanes 18 min",
      description: "In vacanza a Pineda de Mar? Porto Blanes a 18 min in auto o 12 min in treno R1. Barca senza patente da 70\u20ac/h con carburante incluso.",
    },
    ru: {
      title: "\u0410\u0440\u0435\u043d\u0434\u0430 \u043b\u043e\u0434\u043a\u0438 \u041f\u0438\u043d\u0435\u0434\u0430-\u0434\u0435-\u041c\u0430\u0440 | \u041f\u043e\u0440\u0442 \u0411\u043b\u0430\u043d\u0435\u0441 18 \u043c\u0438\u043d",
      description: "\u0412 \u041f\u0438\u043d\u0435\u0434\u0430-\u0434\u0435-\u041c\u0430\u0440? \u041f\u043e\u0440\u0442 \u0411\u043b\u0430\u043d\u0435\u0441 \u0432 18 \u043c\u0438\u043d. \u041b\u043e\u0434\u043a\u0430 \u0431\u0435\u0437 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0438 \u043e\u0442 70\u20ac/\u0447.",
    },
  },
  "/alquiler-barcos-palafolls": {
    es: {
      title: "Alquiler Barco Palafolls | Puerto Blanes 12 min",
      description: "\u00bfEn camping o alojamiento en Palafolls? Puerto Blanes a 12 min en coche. Alquila barco sin licencia desde 70\u20ac/h con gasolina incluida.",
      ogTitle: "Alquiler Barco Palafolls | 12 min al Puerto Blanes",
      ogDescription: "Desde Palafolls al Puerto Blanes en 12 min. Barco sin licencia desde 70\u20ac/h. Gasolina incluida. 4.8\u2605.",
    },
    en: {
      title: "Boat Rental Palafolls | Blanes Port 12 min",
      description: "Camping or staying in Palafolls? Blanes Port is 12 min by car. Rent a license-free boat from 70\u20ac/h, fuel included.",
    },
    ca: {
      title: "Lloguer Barca Palafolls | Port Blanes 12 min",
      description: "Allotjat a Palafolls? Port Blanes a 12 min en cotxe. Lloga barca sense llic\u00e8ncia des de 70\u20ac/h amb gasolina inclosa.",
    },
    fr: {
      title: "Location Bateau Palafolls | Port Blanes 12 min",
      description: "En camping ou en s\u00e9jour \u00e0 Palafolls ? Port Blanes \u00e0 12 min en voiture. Louez un bateau sans permis d\u00e8s 70\u20ac/h, carburant inclus.",
    },
    de: {
      title: "Bootsverleih Palafolls | Hafen Blanes 12 Min",
      description: "Camping oder Urlaub in Palafolls? Hafen Blanes in 12 Min mit Auto. Boot ohne F\u00fchrerschein ab 70\u20ac/h, Kraftstoff inklusive.",
    },
    nl: {
      title: "Bootverhuur Palafolls | Haven Blanes 12 min",
      description: "Kamperen of vakantie in Palafolls? Haven Blanes op 12 min met auto. Boot zonder vaarbewijs vanaf 70\u20ac/u, brandstof inbegrepen.",
    },
    it: {
      title: "Noleggio Barca Palafolls | Porto Blanes 12 min",
      description: "In campeggio a Palafolls? Porto Blanes a 12 min in auto. Barca senza patente da 70\u20ac/h con carburante incluso.",
    },
    ru: {
      title: "\u0410\u0440\u0435\u043d\u0434\u0430 \u043b\u043e\u0434\u043a\u0438 \u041f\u0430\u043b\u0430\u0444\u043e\u043b\u044c\u0441 | \u041f\u043e\u0440\u0442 \u0411\u043b\u0430\u043d\u0435\u0441 12 \u043c\u0438\u043d",
      description: "\u0412 \u041f\u0430\u043b\u0430\u0444\u043e\u043b\u044c\u0441? \u041f\u043e\u0440\u0442 \u0411\u043b\u0430\u043d\u0435\u0441 \u0432 12 \u043c\u0438\u043d. \u041b\u043e\u0434\u043a\u0430 \u0431\u0435\u0437 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0438 \u043e\u0442 70\u20ac/\u0447.",
    },
  },
  "/alquiler-barcos-tordera": {
    es: {
      title: "Alquiler Barco Tordera | Puerto Blanes 15 min",
      description: "\u00bfEn Tordera o cerca del Delta? Puerto Blanes a 15 min en coche o 8 min en tren R1. Alquila barco sin licencia desde 70\u20ac/h con gasolina incluida.",
      ogTitle: "Alquiler Barco Tordera | Delta del Tordera en Barco",
      ogDescription: "Desde Tordera al Puerto Blanes en 15 min. Barco sin licencia desde 70\u20ac/h. Delta del Tordera en barco. 4.8\u2605.",
    },
    en: {
      title: "Boat Rental Tordera | Blanes Port 15 min",
      description: "Living in Tordera or near the Delta? Blanes Port is 15 min by car or 8 min by R1 train. Rent a license-free boat from 70\u20ac/h, fuel included.",
    },
    ca: {
      title: "Lloguer Barca Tordera | Port Blanes 15 min",
      description: "A Tordera o prop del Delta? Port Blanes a 15 min en cotxe o 8 min en tren R1. Lloga barca sense llic\u00e8ncia des de 70\u20ac/h.",
    },
    fr: {
      title: "Location Bateau Tordera | Port Blanes 15 min",
      description: "\u00c0 Tordera ou pr\u00e8s du Delta ? Port Blanes \u00e0 15 min en voiture ou 8 min en train R1. Louez un bateau sans permis d\u00e8s 70\u20ac/h.",
    },
    de: {
      title: "Bootsverleih Tordera | Hafen Blanes 15 Min",
      description: "In Tordera oder am Delta? Hafen Blanes 15 Min mit Auto oder 8 Min mit R1-Zug. Boot ohne F\u00fchrerschein ab 70\u20ac/h.",
    },
    nl: {
      title: "Bootverhuur Tordera | Haven Blanes 15 min",
      description: "In Tordera of nabij de Delta? Haven Blanes 15 min met auto of 8 min met R1-trein. Boot zonder vaarbewijs vanaf 70\u20ac/u.",
    },
    it: {
      title: "Noleggio Barca Tordera | Porto Blanes 15 min",
      description: "A Tordera o vicino al Delta? Porto Blanes a 15 min in auto o 8 min in treno R1. Barca senza patente da 70\u20ac/h.",
    },
    ru: {
      title: "\u0410\u0440\u0435\u043d\u0434\u0430 \u043b\u043e\u0434\u043a\u0438 \u0422\u043e\u0440\u0434\u0435\u0440\u0430 | \u041f\u043e\u0440\u0442 \u0411\u043b\u0430\u043d\u0435\u0441 15 \u043c\u0438\u043d",
      description: "\u0412 \u0422\u043e\u0440\u0434\u0435\u0440\u0435? \u041f\u043e\u0440\u0442 \u0411\u043b\u0430\u043d\u0435\u0441 \u0432 15 \u043c\u0438\u043d. \u041b\u043e\u0434\u043a\u0430 \u0431\u0435\u0437 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0438 \u043e\u0442 70\u20ac/\u0447. \u0414\u0435\u043b\u044c\u0442\u0430 \u0422\u043e\u0440\u0434\u0435\u0440\u0430.",
    },
  },
  "/privacy-policy": {
    es: {
      title: "Política de Privacidad | Costa Brava Rent a Boat",
      description: "Política de privacidad y protección de datos de Costa Brava Rent a Boat.",
    },
    en: {
      title: "Privacy Policy | Costa Brava Rent a Boat",
      description: "Privacy policy and data protection of Costa Brava Rent a Boat.",
    },
    ca: {
      title: "Política de Privacitat | Costa Brava Rent a Boat",
      description: "Política de privacitat i protecció de dades de Costa Brava Rent a Boat.",
    },
    fr: {
      title: "Politique de Confidentialité | Costa Brava Rent a Boat",
      description: "Politique de confidentialité et protection des données de Costa Brava Rent a Boat.",
    },
    de: {
      title: "Datenschutzrichtlinie | Costa Brava Rent a Boat",
      description: "Datenschutzrichtlinie und Datenschutz von Costa Brava Rent a Boat.",
    },
    nl: {
      title: "Privacybeleid | Costa Brava Rent a Boat",
      description: "Privacybeleid en gegevensbescherming van Costa Brava Rent a Boat.",
    },
    it: {
      title: "Politica sulla Privacy | Costa Brava Rent a Boat",
      description: "Politica sulla privacy e protezione dei dati di Costa Brava Rent a Boat.",
    },
    ru: {
      title: "Политика конфиденциальности | Costa Brava Rent a Boat",
      description: "Политика конфиденциальности и защита данных Costa Brava Rent a Boat.",
    },
  },
  "/terms-conditions": {
    es: {
      title: "Términos y Condiciones | Costa Brava Rent a Boat",
      description: "Términos y condiciones del servicio de alquiler de barcos en Blanes, Costa Brava.",
    },
    en: {
      title: "Terms and Conditions | Costa Brava Rent a Boat",
      description: "Terms and conditions of the boat rental service in Blanes, Costa Brava.",
    },
    ca: {
      title: "Termes i Condicions | Costa Brava Rent a Boat",
      description: "Termes i condicions del servei de lloguer de barques a Blanes, Costa Brava.",
    },
    fr: {
      title: "Termes et Conditions | Costa Brava Rent a Boat",
      description: "Termes et conditions du service de location de bateaux à Blanes, Costa Brava.",
    },
    de: {
      title: "Geschäftsbedingungen | Costa Brava Rent a Boat",
      description: "Geschäftsbedingungen des Bootsverleihs in Blanes, Costa Brava.",
    },
    nl: {
      title: "Algemene Voorwaarden | Costa Brava Rent a Boat",
      description: "Algemene voorwaarden van de bootverhuurservice in Blanes, Costa Brava.",
    },
    it: {
      title: "Termini e Condizioni | Costa Brava Rent a Boat",
      description: "Termini e condizioni del servizio di noleggio barche a Blanes, Costa Brava.",
    },
    ru: {
      title: "Условия использования | Costa Brava Rent a Boat",
      description: "Условия использования службы аренды лодок в Бланесе, Коста-Брава.",
    },
  },
  "/condiciones-generales": {
    es: {
      title: "Condiciones Generales de Alquiler | Costa Brava Rent a Boat",
      description: "Condiciones generales para el alquiler de embarcaciones en Blanes, Costa Brava.",
    },
    en: {
      title: "General Rental Conditions | Costa Brava Rent a Boat",
      description: "General conditions for boat rental in Blanes, Costa Brava.",
    },
    ca: {
      title: "Condicions Generals de Lloguer | Costa Brava Rent a Boat",
      description: "Condicions generals per al lloguer d'embarcacions a Blanes, Costa Brava.",
    },
    fr: {
      title: "Conditions Générales de Location | Costa Brava Rent a Boat",
      description: "Conditions générales pour la location d'embarcations à Blanes, Costa Brava.",
    },
    de: {
      title: "Allgemeine Mietbedingungen | Costa Brava Rent a Boat",
      description: "Allgemeine Mietbedingungen für den Bootsverleih in Blanes, Costa Brava.",
    },
    nl: {
      title: "Algemene Huurvoorwaarden | Costa Brava Rent a Boat",
      description: "Algemene huurvoorwaarden voor bootverhuur in Blanes, Costa Brava.",
    },
    it: {
      title: "Condizioni Generali di Noleggio | Costa Brava Rent a Boat",
      description: "Condizioni generali per il noleggio di imbarcazioni a Blanes, Costa Brava.",
    },
    ru: {
      title: "Общие Условия Аренды | Costa Brava Rent a Boat",
      description: "Общие условия аренды лодок в Бланесе, Коста-Брава.",
    },
  },
  "/cookies-policy": {
    es: {
      title: "Política de Cookies | Costa Brava Rent a Boat",
      description: "Información sobre el uso de cookies en Costa Brava Rent a Boat.",
    },
    en: {
      title: "Cookie Policy | Costa Brava Rent a Boat",
      description: "Information about cookie usage on Costa Brava Rent a Boat.",
    },
    ca: {
      title: "Política de Cookies | Costa Brava Rent a Boat",
      description: "Informació sobre l'ús de cookies a Costa Brava Rent a Boat.",
    },
    fr: {
      title: "Politique de Cookies | Costa Brava Rent a Boat",
      description: "Informations sur l'utilisation des cookies sur Costa Brava Rent a Boat.",
    },
    de: {
      title: "Cookie-Richtlinie | Costa Brava Rent a Boat",
      description: "Informationen zur Cookie-Nutzung auf Costa Brava Rent a Boat.",
    },
    nl: {
      title: "Cookiebeleid | Costa Brava Rent a Boat",
      description: "Informatie over het gebruik van cookies op Costa Brava Rent a Boat.",
    },
    it: {
      title: "Politica sui Cookie | Costa Brava Rent a Boat",
      description: "Informazioni sull'uso dei cookie su Costa Brava Rent a Boat.",
    },
    ru: {
      title: "Политика Cookies | Costa Brava Rent a Boat",
      description: "Информация об использовании cookies на Costa Brava Rent a Boat.",
    },
  },
  "/accesibilidad": {
    es: {
      title: "Declaración de Accesibilidad | Costa Brava Rent a Boat",
      description: "Declaración de accesibilidad web de Costa Brava Rent a Boat. Cumplimiento WCAG 2.1.",
    },
    en: {
      title: "Accessibility Statement | Costa Brava Rent a Boat",
      description: "Web accessibility statement of Costa Brava Rent a Boat. WCAG 2.1 compliance.",
    },
    ca: {
      title: "Declaració d'Accessibilitat | Costa Brava Rent a Boat",
      description: "Declaració d'accessibilitat web de Costa Brava Rent a Boat. Compliment WCAG 2.1.",
    },
    fr: {
      title: "Déclaration d'Accessibilité | Costa Brava Rent a Boat",
      description: "Déclaration d'accessibilité web de Costa Brava Rent a Boat. Conformité WCAG 2.1.",
    },
    de: {
      title: "Barrierefreiheitserklärung | Costa Brava Rent a Boat",
      description: "Erklärung zur Barrierefreiheit von Costa Brava Rent a Boat. WCAG 2.1 Konformität.",
    },
    nl: {
      title: "Toegankelijkheidsverklaring | Costa Brava Rent a Boat",
      description: "Webtoegankelijkheidsverklaring van Costa Brava Rent a Boat. WCAG 2.1 conformiteit.",
    },
    it: {
      title: "Dichiarazione di Accessibilità | Costa Brava Rent a Boat",
      description: "Dichiarazione di accessibilità web di Costa Brava Rent a Boat. Conformità WCAG 2.1.",
    },
    ru: {
      title: "Заявление о Доступности | Costa Brava Rent a Boat",
      description: "Заявление о веб-доступности Costa Brava Rent a Boat. Соответствие WCAG 2.1.",
    },
  },
  "/precios": {
    es: {
      title: `Precios Alquiler Barcos Blanes ${SEASON_YEAR} | Costa Brava`,
      description: "Consulta precios de alquiler de barcos en Blanes. Sin licencia desde 70\u20ac/hora. Con licencia desde 160\u20ac/2h. Gasolina incluida. Temporada baja, media y alta.",
      ogTitle: `Precios Alquiler Barcos Blanes ${SEASON_YEAR} | Desde 70\u20ac`,
      ogDescription: "Compara precios de todos nuestros barcos en Blanes. Sin licencia desde 70\u20ac/h. Gasolina incluida. Temporada baja, media y alta.",
    },
    en: {
      title: `Boat Rental Prices Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Check boat rental prices in Blanes. No license from 70\u20ac/h. Licensed from 160\u20ac/2h. Fuel included. Low, mid and high season rates.",
    },
    fr: {
      title: `Tarifs Location Bateaux Blanes ${SEASON_YEAR} | Costa Brava`,
      description: "Consultez les tarifs de location de bateaux a Blanes. Sans permis des 70\u20ac/h. Essence incluse. Tarifs basse, moyenne et haute saison.",
    },
    de: {
      title: `Preise Bootsverleih Blanes ${SEASON_YEAR} | Costa Brava`,
      description: "Bootsverleih-Preise in Blanes. Ohne Fuhrerschein ab 70\u20ac/h. Benzin inklusive. Neben-, Mittel- und Hochsaison-Preise.",
    },
    ca: {
      title: `Preus Lloguer Barques Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Consulta els preus de lloguer de barques a Blanes. Sense llic\u00e8ncia des de 70\u20ac/h. Gasolina inclosa. Temporada baixa, mitja i alta.",
    },
    nl: {
      title: `Bootverhuur Prijzen Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Bekijk bootverhuur prijzen in Blanes. Zonder vaarbewijs vanaf 70\u20ac/u. Brandstof inbegrepen. Laag-, midden- en hoogseizoen.",
    },
    it: {
      title: `Prezzi Noleggio Barche Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Consulta i prezzi di noleggio barche a Blanes. Senza patente da 70\u20ac/h. Carburante incluso. Bassa, media e alta stagione.",
    },
    ru: {
      title: `\u0426\u0435\u043d\u044b \u0410\u0440\u0435\u043d\u0434\u0430 \u041b\u043e\u0434\u043e\u043a \u0411\u043b\u0430\u043d\u0435\u0441 ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "\u0423\u0437\u043d\u0430\u0439\u0442\u0435 \u0446\u0435\u043d\u044b \u0430\u0440\u0435\u043d\u0434\u044b \u043b\u043e\u0434\u043e\u043a \u0432 \u0411\u043b\u0430\u043d\u0435\u0441\u0435. \u0411\u0435\u0437 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0438 \u043e\u0442 70\u20ac/\u0447. \u0422\u043e\u043f\u043b\u0438\u0432\u043e \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u043e. \u041d\u0438\u0437\u043a\u0438\u0439, \u0441\u0440\u0435\u0434\u043d\u0438\u0439 \u0438 \u0432\u044b\u0441\u043e\u043a\u0438\u0439 \u0441\u0435\u0437\u043e\u043d.",
    },
  },
  // Long-tail: these map to existing SPA routes but give AI crawlers ultra-specific meta
  "/destinos": {
    es: {
      title: "Destinos en Barco desde Blanes | Calas y Playas Costa Brava",
      description: "Destinos en barco desde Puerto de Blanes: Cala Brava, Lloret de Mar, Tossa de Mar, Sant Francesc. Rutas con tiempos y distancias.",
      ogTitle: `Destinos en Barco desde Blanes | Costa Brava ${SEASON_YEAR}`,
      ogDescription: "Explora calas secretas y playas desde Puerto de Blanes. 5 destinos a menos de 45 minutos.",
    },
    en: {
      title: "Boat Destinations from Blanes | Coves & Beaches Costa Brava",
      description: "Discover all destinations accessible by boat from Blanes Port: Cala Brava, Lloret de Mar, Tossa de Mar, Sant Francesc and more.",
    },
    fr: {
      title: "Destinations en Bateau depuis Blanes | Criques Costa Brava",
      description: "Decouvrez toutes les destinations accessibles en bateau depuis le Port de Blanes. Criques secretes et plages paradisiaques.",
    },
    de: {
      title: "Bootsziele ab Blanes | Buchten & Strände Costa Brava",
      description: "Entdecken Sie alle Bootsziele ab Blanes Hafen: Cala Brava, Lloret de Mar, Tossa de Mar und mehr.",
    },
    ca: {
      title: "Destinacions des de Blanes | Cales i Platges Costa Brava",
      description: "Descobreix totes les destinacions accessibles en barca des del Port de Blanes. Cales secretes i platges paradis\u00edaques.",
    },
    nl: {
      title: "Bestemmingen vanuit Blanes | Baaien Costa Brava",
      description: "Ontdek alle bestemmingen bereikbaar per boot vanuit Haven Blanes. Geheime baaien en paradijselijke stranden.",
    },
    it: {
      title: "Destinazioni da Blanes | Calette Costa Brava",
      description: "Scopri tutte le destinazioni raggiungibili in barca dal Porto di Blanes. Calette segrete e spiagge paradisiache.",
    },
    ru: {
      title: "\u041d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u043d\u0430 \u041b\u043e\u0434\u043a\u0435 \u0438\u0437 \u0411\u043b\u0430\u043d\u0435\u0441\u0430 | \u0411\u0443\u0445\u0442\u044b \u0438 \u041f\u043b\u044f\u0436\u0438 \u041a\u043e\u0441\u0442\u0430-\u0411\u0440\u0430\u0432\u0430",
      description: "\u041e\u0442\u043a\u0440\u043e\u0439\u0442\u0435 \u0432\u0441\u0435 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f, \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0435 \u043d\u0430 \u043b\u043e\u0434\u043a\u0435 \u0438\u0437 \u043f\u043e\u0440\u0442\u0430 \u0411\u043b\u0430\u043d\u0435\u0441. \u0421\u0435\u043a\u0440\u0435\u0442\u043d\u044b\u0435 \u0431\u0443\u0445\u0442\u044b \u0438 \u0440\u0430\u0439\u0441\u043a\u0438\u0435 \u043f\u043b\u044f\u0436\u0438.",
    },
  },
  "/alquiler-barcos-cerca-barcelona": {
    es: {
      title: "Alquiler Barcos cerca Barcelona | Blanes a 70 min",
      description: "Alquila barcos sin licencia a 70 minutos de Barcelona. Blanes, Costa Brava. Mejores precios, aguas cristalinas. Desde 70\u20ac. Gasolina incluida.",
    },
    en: {
      title: "Boat Rental near Barcelona | Blanes 70min | Costa Brava",
      description: "Rent boats without license 70 minutes from Barcelona. Blanes, Costa Brava. Best prices, crystal clear water. From 70\u20ac. Fuel included.",
    },
    ca: {
      title: "Lloguer Barques prop Barcelona | Blanes a 70 min",
      description: "Lloga barques sense llic\u00e8ncia a 70 minuts de Barcelona. Blanes, Costa Brava. Millors preus, aig\u00fces cristal\u00b7lines. Des de 70\u20ac.",
    },
    fr: {
      title: "Location Bateaux pr\u00e8s Barcelone | Blanes \u00e0 70 min",
      description: "Louez des bateaux sans permis \u00e0 70 minutes de Barcelone. Blanes, Costa Brava. Meilleurs prix, eaux cristallines. D\u00e8s 70\u20ac.",
    },
    de: {
      title: "Bootsverleih nahe Barcelona | Blanes 70min | Costa Brava",
      description: "Boote ohne F\u00fchrerschein mieten, 70 Minuten von Barcelona. Blanes, Costa Brava. Beste Preise, kristallklares Wasser. Ab 70\u20ac.",
    },
    nl: {
      title: "Bootverhuur nabij Barcelona | Blanes 70min | Costa Brava",
      description: "Huur boten zonder vaarbewijs op 70 minuten van Barcelona. Blanes, Costa Brava. Beste prijzen, kristalhelder water. Vanaf 70\u20ac.",
    },
    it: {
      title: "Noleggio Barche vicino Barcellona | Blanes a 70 min",
      description: "Noleggia barche senza patente a 70 minuti da Barcellona. Blanes, Costa Brava. Migliori prezzi, acque cristalline. Da 70\u20ac.",
    },
    ru: {
      title: "\u0410\u0440\u0435\u043d\u0434\u0430 \u041b\u043e\u0434\u043e\u043a \u0440\u044f\u0434\u043e\u043c \u0441 \u0411\u0430\u0440\u0441\u0435\u043b\u043e\u043d\u043e\u0439 | \u0411\u043b\u0430\u043d\u0435\u0441 70\u043c\u0438\u043d | \u041a\u043e\u0441\u0442\u0430-\u0411\u0440\u0430\u0432\u0430",
      description: "\u0410\u0440\u0435\u043d\u0434\u0443\u0439\u0442\u0435 \u043b\u043e\u0434\u043a\u0438 \u0431\u0435\u0437 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0438 \u0432 70 \u043c\u0438\u043d\u0443\u0442\u0430\u0445 \u043e\u0442 \u0411\u0430\u0440\u0441\u0435\u043b\u043e\u043d\u044b. \u0411\u043b\u0430\u043d\u0435\u0441, \u041a\u043e\u0441\u0442\u0430-\u0411\u0440\u0430\u0432\u0430. \u041b\u0443\u0447\u0448\u0438\u0435 \u0446\u0435\u043d\u044b. \u041e\u0442 70\u20ac.",
    },
  },
  "/alquiler-barcos-costa-brava": {
    es: {
      title: "Alquiler Barcos Costa Brava | Sin Licencia 70\u20ac/h | 4.8\u2605",
      description: "Alquila barco en la Costa Brava desde Puerto de Blanes. 9 barcos (sin y con licencia), 70\u20ac/h, gasolina incluida. Calas v\u00edrgenes Blanes-Tossa. 4.8\u2605 Google.",
    },
    en: {
      title: `Boat Rental Costa Brava ${SEASON_YEAR} | No License from 70\u20ac/h`,
      description: `Rent boats on the Costa Brava from Blanes Port. 5 no-license boats from 70\u20ac/h, fuel included. Hidden coves Blanes-Tossa. 4.8\u2605 ${BUSINESS_REVIEW_COUNT_STR} reviews.`,
    },
    ca: {
      title: `Lloguer Barques Costa Brava ${SEASON_YEAR} | Sense Llic\u00e8ncia 70\u20ac/h`,
      description: `Lloga barques a la Costa Brava des del Port de Blanes. 5 barques sense llic\u00e8ncia des de 70\u20ac/h. Cales verges Blanes-Tossa. 4.8\u2605 ${BUSINESS_REVIEW_COUNT_STR} ressenyes.`,
    },
    fr: {
      title: `Location Bateaux Costa Brava ${SEASON_YEAR} | Sans Permis 70\u20ac/h`,
      description: "Louez des bateaux sur la Costa Brava depuis le Port de Blanes. 5 bateaux sans permis d\u00e8s 70\u20ac/h, carburant inclus. Criques Blanes-Tossa. 4.8★.",
    },
    de: {
      title: `Bootsverleih Costa Brava ${SEASON_YEAR} | Ohne F\u00fchrerschein 70\u20ac/h`,
      description: "Mieten Sie Boote an der Costa Brava ab Hafen Blanes. 5 Boote ohne F\u00fchrerschein ab 70\u20ac/h, Kraftstoff inklusive. Buchten Blanes-Tossa. 4.8★.",
    },
    nl: {
      title: `Bootverhuur Costa Brava ${SEASON_YEAR} | Zonder Vaarbewijs 70\u20ac/u`,
      description: "Huur boten aan de Costa Brava vanuit Haven Blanes. 5 boten zonder vaarbewijs vanaf 70\u20ac/u, brandstof inbegrepen. Baaien Blanes-Tossa. 4.8★.",
    },
    it: {
      title: `Noleggio Barche Costa Brava ${SEASON_YEAR} | Senza Patente 70\u20ac/h`,
      description: "Noleggia barche sulla Costa Brava dal Porto di Blanes. 5 barche senza patente da 70\u20ac/h, carburante incluso. Calette Blanes-Tossa. 4.8★.",
    },
    ru: {
      title: `\u0410\u0440\u0435\u043d\u0434\u0430 \u041b\u043e\u0434\u043e\u043a \u041a\u043e\u0441\u0442\u0430-\u0411\u0440\u0430\u0432\u0430 ${SEASON_YEAR} | \u0411\u0435\u0437 \u041b\u0438\u0446\u0435\u043d\u0437\u0438\u0438 \u043e\u0442 70\u20ac/\u0447`,
      description: "\u0410\u0440\u0435\u043d\u0434\u0443\u0439\u0442\u0435 \u043b\u043e\u0434\u043a\u0438 \u043d\u0430 \u041a\u043e\u0441\u0442\u0430-\u0411\u0440\u0430\u0432\u0435 \u0438\u0437 \u043f\u043e\u0440\u0442\u0430 \u0411\u043b\u0430\u043d\u0435\u0441. 5 \u043b\u043e\u0434\u043e\u043a \u0431\u0435\u0437 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0438 \u043e\u0442 70\u20ac/\u0447, \u0442\u043e\u043f\u043b\u0438\u0432\u043e \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u043e. \u0411\u0443\u0445\u0442\u044b \u0411\u043b\u0430\u043d\u0435\u0441-\u0422\u043e\u0441\u0441\u0430. 4.8★.",
    },
  },
  "/boat-rental-costa-brava": {
    en: {
      title: "Boat Rental Costa Brava | No License from 70\u20ac/h, Blanes",
      description: `Rent a boat in Blanes, Costa Brava from €70/h. License-free, fuel included, up to 5 people. 4.8★ · ${BUSINESS_REVIEW_COUNT_STR} Google reviews · 15 min training · book online.`,
      ogTitle: "Boat Rental Costa Brava — From Blanes Port",
      ogDescription: "Explore Spain's most beautiful coastline by boat. No license needed. From 70\u20ac/hour.",
    },
    es: {
      title: "Boat Rental Costa Brava | No License from 70\u20ac/h, Blanes",
      description: `Rent a boat in Blanes, Costa Brava from €70/h. License-free, fuel included, up to 5 people. 4.8★ · ${BUSINESS_REVIEW_COUNT_STR} Google reviews · 15 min training · book online.`,
    },
  },
  "/excursion-snorkel-barco-blanes": {
    es: {
      title: "Snorkel en Barco Blanes | Calas Cristalinas desde 70€/h",
      description: "Excursion snorkel en barco desde Blanes. Calas de aguas cristalinas, fauna marina, equipo incluido. Sin licencia desde 70€/h. 4.8★ Google. Reserva online.",
      ogTitle: "Snorkel en Barco desde Blanes | Calas Secretas Costa Brava",
      ogDescription: "Descubre los mejores spots de snorkel en barco desde Blanes. Aguas cristalinas, peces y posidonia.",
    },
    en: {
      title: "Snorkeling Boat Trip Blanes | Crystal Coves from 70€/h",
      description: "Snorkeling boat trip from Blanes. Crystal clear coves, marine life, equipment included. No license from 70€/h. 4.8★ Google. Book online.",
    },
    ca: {
      title: "Snorkel en Barca Blanes | Cales Cristal·lines des de 70€/h",
      description: "Excursio snorkel en barca des de Blanes. Cales d'aigues cristal·lines, fauna marina, equip inclos. Sense llicencia des de 70€/h. Reserva online.",
    },
    fr: {
      title: "Snorkeling en Bateau Blanes | Criques Costa Brava dès 70€/h",
      description: "Excursion snorkeling en bateau depuis Blanes. Criques aux eaux cristallines, faune marine. Sans permis dès 70€/h. 4.8★ Google. Réservez en ligne.",
    },
    de: {
      title: "Schnorcheln per Boot Blanes | Klare Buchten ab 70€/h",
      description: "Schnorchel-Bootsausflug ab Blanes. Kristallklare Buchten, Meeresfauna. Ohne Führerschein ab 70€/h. 4.8★ Google. Online buchen.",
    },
    nl: {
      title: "Snorkelen per Boot Blanes | Heldere Baaien vanaf 70€/u",
      description: "Snorkelboottocht vanuit Blanes. Kristalheldere baaien, zeeleven. Zonder vaarbewijs vanaf 70€/u. 4.8★ Google. Boek online.",
    },
    it: {
      title: "Snorkeling in Barca Blanes | Calette Cristalline da 70€/h",
      description: "Escursione snorkeling in barca da Blanes. Calette cristalline, fauna marina. Senza patente da 70€/h. 4.8★ Google. Prenota online.",
    },
    ru: {
      title: "Снорклинг на Лодке Бланес | Бухты Коста-Брава от 70€/ч",
      description: "Снорклинг-экскурсия на лодке из Бланеса. Кристально чистые бухты, морская фауна. Без лицензии от 70€/ч. 4.8★ Google. Бронируйте онлайн.",
    },
  },
  "/barco-familias-costa-brava": {
    es: {
      title: "Alquiler Barco Familias Blanes | Seguro desde 70€/h",
      description: "Alquiler barco para familias en Blanes. Barcos estables, seguros para niños. Sin licencia desde 70€/h, gasolina incluida. 4.8★ Google. Reserva online.",
      ogTitle: "Barco en Familia Costa Brava | Seguro para Niños desde 70€/h",
      ogDescription: "Barcos ideales para familias con niños en Blanes. Estables, seguros, fáciles de pilotar. Gasolina incluida.",
    },
    en: {
      title: "Family Boat Rental Blanes | Safe & Fun from 70€/h",
      description: "Family boat rental in Blanes. Stable boats, safe for kids. No license from 70€/h, fuel included. 4.8★ Google. Book online.",
    },
    ca: {
      title: "Lloguer Barca Famílies Blanes | Divertit des de 70€/h",
      description: "Lloguer barca per a families a Blanes. Barques estables, segures per a nens. Sense llicencia des de 70€/h, gasolina inclosa. Reserva online.",
    },
    fr: {
      title: "Location Bateau Familles Blanes | Sûr & Amusant dès 70€/h",
      description: "Location bateau pour familles à Blanes. Bateaux stables, sûrs pour les enfants. Sans permis dès 70€/h, carburant inclus. 4.8★ Google.",
    },
    de: {
      title: "Familienboot Costa Brava | Sicher & Spaß ab 70€/h Blanes",
      description: "Bootsverleih für Familien in Blanes. Stabile Boote, sicher für Kinder. Ohne Führerschein ab 70€/h, Kraftstoff inklusive. 4.8★ Google.",
    },
    nl: {
      title: "Gezinsboot Costa Brava | Veilig & Leuk vanaf 70€/u Blanes",
      description: "Bootverhuur voor gezinnen in Blanes. Stabiele boten, veilig voor kinderen. Zonder vaarbewijs vanaf 70€/u, brandstof inbegrepen. 4.8★ Google.",
    },
    it: {
      title: "Barca per Famiglie Blanes | Sicura e Divertente da 70€/h",
      description: "Noleggio barca per famiglie a Blanes. Barche stabili, sicure per bambini. Senza patente da 70€/h, carburante incluso. 4.8★ Google.",
    },
    ru: {
      title: "Лодка для Семей Бланес | Безопасно и Весело от 70€/ч",
      description: "Аренда лодки для семей в Бланесе. Стабильные лодки, безопасные для детей. Без лицензии от 70€/ч, топливо включено. 4.8★ Google.",
    },
  },
  "/paseo-atardecer-barco-blanes": {
    es: {
      title: "Paseo en Barco al Atardecer Blanes | Sunset desde 70€/h",
      description: "Paseo en barco al atardecer desde Blanes. Puesta de sol sobre la Costa Brava, calas doradas. Sin licencia desde 70€/h. 4.8★ Google. Reserva online.",
      ogTitle: "Sunset Boat Trip Blanes | Atardecer en la Costa Brava",
      ogDescription: "Vive un atardecer mágico en barco desde Blanes. Puesta de sol, calas doradas, experiencia inolvidable.",
    },
    en: {
      title: "Sunset Boat Trip Blanes | Golden Hour Costa Brava from 70€/h",
      description: "Sunset boat trip from Blanes. Golden hour over Costa Brava, stunning coves. No license from 70€/h. 4.8★ Google. Book online.",
    },
    ca: {
      title: "Passeig en Barca al Capvespre Blanes | des de 70€/h",
      description: "Passeig en barca al capvespre des de Blanes. Posta de sol sobre la Costa Brava, cales daurades. Sense llicencia des de 70€/h. Reserva online.",
    },
    fr: {
      title: "Bateau Coucher de Soleil Blanes | Costa Brava dès 70€/h",
      description: "Balade en bateau au coucher de soleil depuis Blanes. Lumière dorée sur la Costa Brava. Sans permis dès 70€/h. 4.8★ Google. Réservez.",
    },
    de: {
      title: "Sonnenuntergang Bootstour Blanes | Costa Brava ab 70€/h",
      description: "Bootstour zum Sonnenuntergang ab Blanes. Goldene Stunde über der Costa Brava. Ohne Führerschein ab 70€/h. 4.8★ Google. Online buchen.",
    },
    nl: {
      title: "Zonsondergang Boottocht Blanes | Costa Brava vanaf 70€/u",
      description: "Boottocht bij zonsondergang vanuit Blanes. Gouden uur boven de Costa Brava. Zonder vaarbewijs vanaf 70€/u. 4.8★ Google. Boek online.",
    },
    it: {
      title: "Gita in Barca al Tramonto Blanes | da 70€/h",
      description: "Gita in barca al tramonto da Blanes. Ora dorata sulla Costa Brava, calette dorate. Senza patente da 70€/h. 4.8★ Google. Prenota online.",
    },
    ru: {
      title: "Прогулка на Лодке на Закате Бланес | от 70€/ч",
      description: "Прогулка на лодке на закате из Бланеса. Золотой час над Коста-Бравой. Без лицензии от 70€/ч. 4.8★ Google. Бронируйте онлайн.",
    },
  },
  "/pesca-barco-blanes": {
    es: {
      title: "Pesca en Barco Blanes | Pesca Recreativa desde 70€/h",
      description: "Pesca recreativa en barco desde Blanes. Lubinas, doradas, sargos en aguas de Costa Brava. Sin licencia de navegación desde 70€/h. 4.8★ Google. Reserva online.",
      ogTitle: "Pesca en Barco desde Blanes | Costa Brava",
      ogDescription: "Sal a pescar desde Blanes. Lubinas, doradas, sargos. Barcos sin licencia. Gasolina incluida.",
    },
    en: {
      title: "Fishing Boat Trip Blanes | Recreational from 70€/h",
      description: "Recreational fishing by boat from Blanes. Sea bass, bream, sargo in Costa Brava waters. No boat license from 70€/h. 4.8★ Google. Book online.",
    },
    ca: {
      title: "Pesca en Barca Blanes | Pesca Recreativa des de 70€/h",
      description: "Pesca recreativa en barca des de Blanes. Llobarros, orades, sargs a la Costa Brava. Sense llicencia des de 70€/h. Reserva online.",
    },
    fr: {
      title: "Pêche en Bateau Blanes | Récréative dès 70€/h",
      description: "Pêche récréative en bateau depuis Blanes. Bars, dorades, sars en Costa Brava. Sans permis bateau dès 70€/h. 4.8★ Google. Réservez.",
    },
    de: {
      title: "Angeln per Boot Blanes | Freizeitfischen ab 70€/h",
      description: "Freizeitfischen per Boot ab Blanes. Wolfsbarsch, Goldbrassen an der Costa Brava. Ohne Bootsführerschein ab 70€/h. 4.8★ Google. Online buchen.",
    },
    nl: {
      title: "Vissen per Boot Blanes | Recreatief vanaf 70€/u",
      description: "Recreatief vissen per boot vanuit Blanes. Zeebaars, zeebrasem aan de Costa Brava. Zonder vaarbewijs vanaf 70€/u. 4.8★ Google. Boek online.",
    },
    it: {
      title: "Pesca in Barca Blanes | Pesca Ricreativa da 70€/h",
      description: "Pesca ricreativa in barca da Blanes. Spigole, orate, saraghi in Costa Brava. Senza patente nautica da 70€/h. 4.8★ Google. Prenota online.",
    },
    ru: {
      title: "Рыбалка на Лодке Бланес | Рекреационная от 70€/ч",
      description: "Рекреационная рыбалка на лодке из Бланеса. Сибас, дорада на Коста-Браве. Без лицензии на лодку от 70€/ч. 4.8★ Google. Бронируйте онлайн.",
    },
  },
  "/boat-rental-blanes": {
    en: {
      title: `Boat Rental Blanes Port ${SEASON_YEAR} | No License from 70\u20ac/h`,
      description: "Rent a boat at Blanes Port. No license needed from 70\u20ac/h, fuel included. 9 boats for 4-12 people. April to October. 4.8\u2605 Google. Book online.",
      ogTitle: `Boat Rental in Blanes | Port of Blanes ${SEASON_YEAR}`,
      ogDescription: "Rent boats in Blanes port. No license needed. Fuel included. 9 boats, 4-12 people. Book your adventure.",
    },
    es: {
      title: `Boat Rental in Blanes | Alquiler Barcos Blanes ${SEASON_YEAR}`,
      description: "Alquila un barco en el Puerto de Blanes. Sin licencia desde 70\u20ac/h, gasolina incluida. 9 barcos para 4-12 personas. Reserva online.",
    },
  },
};

// Cached base HTML to avoid re-reading from disk on every request
let cachedBaseHtml: string | null = null;

// Hashed filenames of the per-language i18n chunks (de-DzstEYSA.js, fr-…js, …).
// Built once from the assets dir (Vite emits no manifest — manifest:false in
// vite.config.ts). Lets injectMeta emit a <link rel="modulepreload"> so a
// non-Spanish visitor's translation chunk downloads in parallel with the main
// bundle instead of waiting for React to hydrate and lazy-import it.
let cachedLangChunkHrefs: Record<string, string> | null = null;

function buildLangChunkHrefs(distPath: string): Record<string, string> {
  const map: Record<string, string> = {};
  try {
    const assetsDir = path.resolve(distPath, "assets");
    const files = fs.readdirSync(assetsDir);
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === "es") continue; // es is bundled in the main entry, not lazy
      const re = new RegExp(`^${lang}-[A-Za-z0-9_-]+\\.js$`);
      const match = files.find((f) => re.test(f));
      if (match) map[lang] = `/assets/${match}`;
    }
  } catch {
    // dev mode or missing build — no preloads, harmless.
  }
  return map;
}

// LRU cache for final injected HTML to avoid repeated regex replacements.
// Keyed by "path:lang", TTL 5 minutes, max 200 entries.
const injectedHtmlCache = new Map<string, { html: string; timestamp: number }>();
const INJECTED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const INJECTED_CACHE_MAX = 200;

function getCachedInjectedHtml(key: string): string | null {
  const entry = injectedHtmlCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > INJECTED_CACHE_TTL) {
    injectedHtmlCache.delete(key);
    return null;
  }
  // Move to end for LRU ordering (Map preserves insertion order)
  injectedHtmlCache.delete(key);
  injectedHtmlCache.set(key, entry);
  return entry.html;
}

function setCachedInjectedHtml(key: string, html: string): void {
  // If key already exists, delete first so it moves to the end
  if (injectedHtmlCache.has(key)) {
    injectedHtmlCache.delete(key);
  }
  if (injectedHtmlCache.size >= INJECTED_CACHE_MAX) {
    // Evict oldest (first) entry
    const oldestKey = injectedHtmlCache.keys().next().value;
    if (oldestKey) injectedHtmlCache.delete(oldestKey);
  }
  injectedHtmlCache.set(key, { html, timestamp: Date.now() });
}

async function getBaseHtml(distPath: string): Promise<string> {
  if (!cachedBaseHtml) {
    let html = await fs.promises.readFile(
      path.resolve(distPath, "index.html"),
      "utf-8"
    );
    // Make the main CSS non-render-blocking: load async via media swap.
    // Uses a <script> tag instead of inline onload= to comply with CSP script-src-attr 'none'.
    const cssMatch = html.match(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/);
    if (cssMatch) {
      const cssHref = cssMatch[1];
      html = html.replace(
        cssMatch[0],
        `<link rel="stylesheet" crossorigin href="${cssHref}" media="print" id="main-css">` +
        `<noscript><link rel="stylesheet" crossorigin href="${cssHref}"></noscript>`
      );
      // Add a small script before </body> to swap media once loaded (CSP-compliant)
      html = html.replace(
        "</body>",
        `<script>document.getElementById("main-css").addEventListener("load",function(){this.media="all"});</script>\n</body>`
      );
    }

    // Preload only the main entry JS in <head> to break the critical chain.
    // Do NOT preload vendor chunks (vendor-ui 255KB, vendor-charts 396KB, etc.)
    // — let the browser load them on demand via the module graph. Eager preloading
    // forces parse+eval of all vendors upfront, adding ~1s to JS execution time.
    const mainJsMatch = html.match(/<script type="module" crossorigin src="(\/assets\/[^"]+\.js)">/);
    if (mainJsMatch) {
      html = html.replace("</head>", `    <link rel="modulepreload" crossorigin href="${mainJsMatch[1]}">\n  </head>`);
    }
    // Remove Vite's body-injected vendor modulepreloads — they cause eager evaluation
    // of heavy chunks (vendor-ui, vendor-charts) that aren't needed for first paint.
    html = html.replace(/\s*<link rel="modulepreload" crossorigin href="\/assets\/vendor-[^"]+\.js">/g, "");

    // Remove the dev-mode base64 modulepreload (causes MIME type error in browser)
    html = html.replace(/\s*<link rel="modulepreload"[^>]*href="data:[^"]*"[^>]*>\s*/g, "");

    cachedBaseHtml = html;
    cachedLangChunkHrefs = buildLangChunkHrefs(distPath);
  }
  return cachedBaseHtml;
}

function injectMeta(
  html: string,
  meta: SEOMeta,
  canonicalUrl: string,
  extraJsonLd?: object,
  lang: LangCode = "es",
  availableLanguages?: readonly string[],
  noindex: boolean = false,
  canonicalOverride?: string,
  lcpPreload?: LcpPreload,
): string {
  const title = esc(meta.title);
  const desc = esc(meta.description);
  const ogTitle = esc(meta.ogTitle || meta.title);
  const ogDesc = esc(meta.ogDescription || meta.description);
  const twitterTitle = esc(meta.twitterTitle || meta.ogTitle || meta.title);
  const twitterDesc = esc(meta.twitterDescription || meta.ogDescription || meta.description);
  const ogImageAlt = esc(meta.ogImageAlt || DEFAULT_OG_IMAGE_ALT[lang] || DEFAULT_OG_IMAGE_ALT.es);
  const effectiveCanonical = canonicalOverride || canonicalUrl;

  let result = html;

  // Dynamic html lang attribute — Google uses this as primary language signal
  result = result.replace(/<html lang="[^"]*">/, `<html lang="${esc(lang)}">`);

  // Update og:locale to match detected language
  const OG_LOCALE_MAP: Record<LangCode, string> = {
    es: "es_ES", ca: "ca_ES", en: "en_GB", fr: "fr_FR",
    de: "de_DE", nl: "nl_NL", it: "it_IT", ru: "ru_RU",
  };
  result = result.replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${OG_LOCALE_MAP[lang] || "es_ES"}">`);

  // Update meta language tag
  const LANG_NAME_MAP: Record<LangCode, string> = {
    es: "Spanish", ca: "Catalan", en: "English", fr: "French",
    de: "German", nl: "Dutch", it: "Italian", ru: "Russian",
  };
  result = result.replace(/<meta name="language" content="[^"]*">/, `<meta name="language" content="${LANG_NAME_MAP[lang] || "Spanish"}">`);

  result = result.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  result = result.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`);
  result = result.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${ogTitle}">`);
  result = result.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${ogDesc}">`);
  result = result.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${esc(BASE_URL + effectiveCanonical)}">`);
  result = result.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${esc(BASE_URL + effectiveCanonical)}">`);

  // Twitter card + og:image:alt were hardcoded Spanish in client/index.html
  // until 2026-04-22; they are now rewritten per-language so shared previews
  // match the page locale.
  result = result.replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${ogImageAlt}">`);
  result = result.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${twitterTitle}">`);
  result = result.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${twitterDesc}">`);
  result = result.replace(/<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${ogImageAlt}">`);

  // When noindex is requested (non-ES non-home routes without real translation),
  // override the default robots meta to noindex,follow so crawlers respect the
  // canonical while still following outbound links for link-graph purposes.
  if (noindex) {
    result = result.replace(
      /<meta name="robots" content="[^"]*">/,
      `<meta name="robots" content="noindex, follow">`,
    );
  }

  // Strip hero image preloads on non-homepage routes (they cause "preloaded but not used" warnings)
  const isHome = canonicalUrl === "/" || /^\/[a-z]{2}\/?$/.test(canonicalUrl);
  if (!isHome) {
    result = result.replace(/\s*<link rel="preload" as="image"[^>]*hero-[^>]*>/g, "");
  }

  // Preload the active language's translation chunk for non-Spanish visitors.
  // Without this the chunk is only discovered after React hydrates and calls the
  // lazy langLoader, so the user sees the Spanish fallback for an extra round
  // trip. modulepreload fetches it in parallel with the main bundle.
  if (lang !== "es") {
    const langHref = cachedLangChunkHrefs?.[lang];
    if (langHref) {
      result = result.replace(
        "</head>",
        `    <link rel="modulepreload" crossorigin href="${langHref}">\n</head>`,
      );
    }
  }

  // Emit a route-specific LCP image preload when the resolver provided one
  // (boat detail mini-hero, blog post featured image). This lets the browser
  // discover the LCP resource before React hydrates, closing the ~7s
  // resource-load-delay gap Lighthouse measured on 2026-04-21. The href/type
  // MUST match what the eventual <img> renders or the browser double-fetches.
  if (lcpPreload) {
    const attrs: string[] = [
      `rel="preload"`,
      `as="image"`,
      `fetchpriority="high"`,
      `href="${esc(lcpPreload.href)}"`,
    ];
    if (lcpPreload.imageType) attrs.push(`type="${esc(lcpPreload.imageType)}"`);
    if (lcpPreload.imagesrcset) attrs.push(`imagesrcset="${esc(lcpPreload.imagesrcset)}"`);
    if (lcpPreload.imagesizes) attrs.push(`imagesizes="${esc(lcpPreload.imagesizes)}"`);
    const preloadTag = `<link ${attrs.join(" ")}>`;
    result = result.replace("</head>", `  ${preloadTag}\n</head>`);
  }

  // Replace og:image if a page-specific image is provided
  if (meta.ogImage) {
    const absImage = meta.ogImage.startsWith("http") ? meta.ogImage : `${BASE_URL}${meta.ogImage}`;
    const imageMime = absImage.toLowerCase().endsWith(".png") ? "image/png"
      : absImage.toLowerCase().endsWith(".jpg") || absImage.toLowerCase().endsWith(".jpeg") ? "image/jpeg"
      : "image/webp";
    result = result.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(absImage)}">`);
    result = result.replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${esc(absImage)}">`);
    result = result.replace(/<meta property="og:image:type" content="[^"]*">/, `<meta property="og:image:type" content="${imageMime}">`);
    if (meta.ogImageWidth && meta.ogImageHeight) {
      result = result.replace(/<meta property="og:image:width" content="[^"]*">/, `<meta property="og:image:width" content="${meta.ogImageWidth}">`);
      result = result.replace(/<meta property="og:image:height" content="[^"]*">/, `<meta property="og:image:height" content="${meta.ogImageHeight}">`);
    } else {
      result = result.replace(/\s*<meta property="og:image:width" content="[^"]*">/, "");
      result = result.replace(/\s*<meta property="og:image:height" content="[^"]*">/, "");
    }
    // Add og:image:secure_url for parsers that require explicit HTTPS reference
    result = result.replace("</head>", `  <meta property="og:image:secure_url" content="${esc(absImage)}" />\n</head>`);
  } else {
    // Default og:image (1200x630 landscape recommended by Facebook/LinkedIn)
    result = result.replace(/<meta property="og:image:width" content="[^"]*">/, `<meta property="og:image:width" content="1200">`);
    result = result.replace(/<meta property="og:image:height" content="[^"]*">/, `<meta property="og:image:height" content="630">`);
  }

  // Replace og:type if specified (e.g. "product" for boats, "article" for blog)
  if (meta.ogType) {
    result = result.replace(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="${esc(meta.ogType)}">`);
  }

  // Inject article:* meta tags for blog posts
  if (meta.articleMeta) {
    const articleTags: string[] = [];
    if (meta.articleMeta.publishedTime) {
      articleTags.push(`  <meta property="article:published_time" content="${esc(meta.articleMeta.publishedTime)}" />`);
    }
    if (meta.articleMeta.modifiedTime) {
      articleTags.push(`  <meta property="article:modified_time" content="${esc(meta.articleMeta.modifiedTime)}" />`);
    }
    if (meta.articleMeta.author) {
      articleTags.push(`  <meta property="article:author" content="${esc(meta.articleMeta.author)}" />`);
    }
    if (meta.articleMeta.section) {
      articleTags.push(`  <meta property="article:section" content="${esc(meta.articleMeta.section)}" />`);
    }
    if (meta.articleMeta.tags) {
      for (const tag of meta.articleMeta.tags) {
        articleTags.push(`  <meta property="article:tag" content="${esc(tag)}" />`);
      }
    }
    if (articleTags.length > 0) {
      result = result.replace("</head>", `${articleTags.join("\n")}\n</head>`);
    }

    // Blog-lang noindex is now handled by the caller via computeTranslationIndex +
    // the generic noindex flag on injectMeta. A blog post is indexable for non-ES
    // langs only if it has a real titleByLang[lang] translation.
  }

  // Replace fallback JSON-LD with page-specific JSON-LD to avoid duplicate schemas
  if (extraJsonLd) {
    // Remove the hardcoded fallback JSON-LD from index.html (LocalBusiness + WebSite graph)
    result = result.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
    // Inject page-specific JSON-LD
    const jsonLdTag = `\n  <script type="application/ld+json">\n${JSON.stringify(extraJsonLd, null, 2)}\n  </script>`;
    result = result.replace("</head>", `${jsonLdTag}\n</head>`);
  }

  // Inject hreflang tags for all supported languages + x-default
  // Use switchLanguagePath to generate localized URLs for each language
  const langsToEmit = availableLanguages || SUPPORTED_LANGUAGES;
  const hreflangTags = langsToEmit.map(hrefLang => {
    const hreflangCode = HREFLANG_CODES[hrefLang as LangCode] || hrefLang;
    const localizedPath = localizedAlternatePath(canonicalUrl, hrefLang as LangCode);
    return `  <link rel="alternate" hreflang="${hreflangCode}" href="${esc(BASE_URL + localizedPath)}" />`;
  });
  // x-default points to the Spanish version
  const xDefaultPath = localizedAlternatePath(canonicalUrl, "es");
  hreflangTags.push(`  <link rel="alternate" hreflang="x-default" href="${esc(BASE_URL + xDefaultPath)}" />`);
  result = result.replace("</head>", `${hreflangTags.join("\n")}\n</head>`);

  return result;
}

/**
 * Inject SSR body fallback HTML inside <div id="root">. Solves the "URL is not
 * indexable — problems detected during live test" rejection that GSC reports
 * for 100% client-rendered pages with empty body. Crawlers that don't execute
 * JS (or fail to) still see semantic content with H1, description, and key
 * structured data. Removed by client/src/main.tsx before React hydrates.
 *
 * Subset semantic of the React-rendered content — no cloaking risk.
 */
function injectBodyFallback(html: string, fallbackHtml: string): string {
  if (!fallbackHtml) return html;
  return html.replace(
    '<div id="root"></div>',
    `<div id="root"><div id="seo-fallback" data-cowork-seo-fallback>${fallbackHtml}</div></div>`
  );
}

// Build AggregateRating schema from cached Google Business Profile stats.
// Cache is hydrated from DB at startup + refreshed hourly via businessStatsCache.
// Source of truth: weekly Places API sync → business_stats table.
function buildAggregateRating(): object {
  const stats = getCurrentStats();
  return {
    "@type": "AggregateRating",
    ratingValue: stats.rating.toFixed(1),
    bestRating: "5",
    worstRating: "1",
    reviewCount: String(stats.userRatingCount),
  };
}

// Build individual Review[] schemas from the 5 most recent reviews cached in
// business_stats. Each is a Review with author Person, reviewRating Rating,
// reviewBody, datePublished. AI crawlers cite these individually as
// authoritative first-party content (vs generic "we have 4.8 stars").
// Returns undefined when no reviews are cached (prevents empty review key).
function buildReviews(): object[] | undefined {
  const stats = getCurrentStats();
  if (!stats.reviews || stats.reviews.length === 0) return undefined;
  return stats.reviews.slice(0, 5).map((r) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.author || "Google user" },
    reviewRating: {
      "@type": "Rating",
      ratingValue: String(r.rating),
      bestRating: "5",
      worstRating: "1",
    },
    reviewBody: r.text,
    ...(r.publishTime ? { datePublished: r.publishTime } : {}),
    publisher: { "@type": "Organization", name: "Google Maps" },
  }));
}

// Geographic hierarchy for location schemas (aggressive entity stacking)
const GEO_HIERARCHY = {
  "@type": "Place",
  name: "Blanes",
  sameAs: "https://en.wikipedia.org/wiki/Blanes",
  containedInPlace: {
    "@type": "AdministrativeArea",
    name: "Girona",
    sameAs: "https://en.wikipedia.org/wiki/Province_of_Girona",
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: "Catalunya",
      sameAs: "https://en.wikipedia.org/wiki/Catalonia",
      containedInPlace: {
        "@type": "Country",
        name: "Spain",
        sameAs: "https://en.wikipedia.org/wiki/Spain",
      },
    },
  },
};

// Service schema with AggregateRating + AggregateOffer for landing pages.
// Google shows star snippets + price for Service schemas (same treatment as
// Product). Reads rating/reviews from buildAggregateRating() → businessStatsCache
// (DB-backed with GBP sync, fallback to shared/businessProfile.ts).
// Prices sourced from shared/boatData.ts (verified 2026-04-24 season).
function buildLandingService(
  serviceName: string,
  description: string,
  priceRange: { low: number; high: number },
): object {
  return {
    "@type": "Service",
    name: serviceName,
    description,
    provider: { "@type": "LocalBusiness", "@id": `${BASE_URL}/#organization` },
    areaServed: GEO_HIERARCHY,
    aggregateRating: buildAggregateRating(),
    offers: {
      "@type": "AggregateOffer",
      lowPrice: String(priceRange.low),
      highPrice: String(priceRange.high),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      availabilityStarts: `${SEASON_YEAR}-04-01`,
      availabilityEnds: `${SEASON_YEAR}-10-31`,
      priceValidUntil: `${SEASON_YEAR}-10-31`,
      seller: { "@type": "LocalBusiness", "@id": `${BASE_URL}/#organization` },
    },
  };
}

// Build Product JSON-LD for a boat detail page
// NOTE: Google shows star snippets for Product schemas (NOT for self-reviewed LocalBusiness).
// AggregateRating + Review here is the primary path to getting stars in SERP.
function buildBoatProductSchema(
  boat: { id: string; name: string; requiresLicense: boolean; capacity: number; deposit: string; imageUrl: string | null; imageGallery: string[] | null },
  fromPrice: number | null,
  aggregateRating?: object,
  reviews?: Array<{ name: string; rating: number; text: string; date: string }>,
): object {
  const licenseText = boat.requiresLicense ? "con licencia náutica" : "sin licencia náutica";
  // Offer.price is REQUIRED by Google merchant listings rich-result spec.
  // Always emit a numeric price; fall back to category floor when boat.pricing
  // is missing or all 0 (sin licencia ≥ 70€/h, con licencia ≥ 160€/2h-paquete).
  // Falsey-check below is `>0` not truthy so price=0 doesn't slip through.
  const FALLBACK_PRICE_BY_CATEGORY = boat.requiresLicense ? 160 : 70;
  const effectivePrice = (typeof fromPrice === "number" && fromPrice > 0) ? fromPrice : FALLBACK_PRICE_BY_CATEGORY;
  const offers: Record<string, unknown> = {
    "@type": "Offer",
    price: String(effectivePrice),
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    availabilityStarts: `${SEASON_YEAR}-04-01`,
    availabilityEnds: `${SEASON_YEAR}-10-31`,
    priceValidUntil: `${SEASON_YEAR}-10-31`,
    validFrom: `${SEASON_YEAR}-04-01`,
    businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
    eligibleRegion: { "@type": "Country", name: "ES" },
    seller: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat",
      "@id": `${BASE_URL}/#organization`,
    },
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: effectivePrice,
      priceCurrency: "EUR",
      unitText: "hour",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "HUR" },
    },
  };

  let imgUrl: string | undefined;
  const resolved = resolveBoatImagePath(boat.imageUrl) || resolveBoatImagePath(boat.id);
  if (resolved) {
    imgUrl = resolved.startsWith("http") ? resolved : `${BASE_URL}${resolved}`;
  }

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${boat.name} - Alquiler en Blanes Costa Brava`,
    description: `Alquila el ${boat.name} en Blanes, Costa Brava. Hasta ${boat.capacity} personas, ${licenseText}. Temporada ${SEASON_YEAR} abril-octubre.`,
    url: `${BASE_URL}/es/barco/${boat.id}`,
    brand: {
      "@type": "Brand",
      name: "Costa Brava Rent a Boat",
    },
    category: boat.requiresLicense ? "Licensed Boat Rental" : "License-Free Boat Rental",
    audience: {
      "@type": "PeopleAudience",
      suggestedMinAge: boat.requiresLicense ? 18 : 18,
      requiredMinAge: 18,
    },
    offers,
  };

  if (imgUrl) {
    const allImages = [imgUrl];
    if (boat.imageGallery?.length) {
      for (const img of boat.imageGallery) {
        const resolvedGallery = resolveBoatImagePath(img);
        if (!resolvedGallery) continue;
        const fullUrl = resolvedGallery.startsWith("http") ? resolvedGallery : `${BASE_URL}${resolvedGallery}`;
        if (!allImages.includes(fullUrl)) allImages.push(fullUrl);
      }
    }
    schema.image = allImages;
  }

  // AggregateRating — required for star snippets in Google SERP
  if (aggregateRating) {
    schema.aggregateRating = aggregateRating;
  }

  // Individual reviews — strengthens the AggregateRating signal for Google
  if (reviews && reviews.length > 0) {
    schema.review = reviews.slice(0, 5).map(r => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(r.rating),
        bestRating: "5",
        worstRating: "1",
      },
      author: { "@type": "Person", name: r.name },
      reviewBody: r.text,
      datePublished: r.date.length === 7 ? `${r.date}-15` : r.date,
      itemReviewed: { "@type": "Product", name: boat.name },
    }));
  }

  return schema;
}

// Build Event schema for the seasonal business (aggressive: recurring seasonal event)
function buildSeasonalEvent(isEn: boolean): object {
  return {
    "@type": "Event",
    name: isEn ? `Costa Brava Boat Rental Season ${SEASON_YEAR}` : `Temporada de Alquiler de Barcos Costa Brava ${SEASON_YEAR}`,
    description: isEn
      ? `Boat rental season in Blanes, Costa Brava. April to October ${SEASON_YEAR}. License-free boats from 70 EUR/hour. 9 boats available.`
      : `Temporada de alquiler de barcos en Blanes, Costa Brava. Abril a octubre ${SEASON_YEAR}. Barcos sin licencia desde 70 EUR/hora. 9 embarcaciones disponibles.`,
    startDate: `${SEASON_YEAR}-04-01`,
    endDate: `${SEASON_YEAR}-10-31`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "Puerto de Blanes",
      address: {
        "@type": "PostalAddress",
        streetAddress: BUSINESS_STREET,
        addressLocality: "Blanes",
        addressRegion: "Girona",
        postalCode: "17300",
        addressCountry: "ES",
      },
      geo: { "@type": "GeoCoordinates", latitude: 41.6722504, longitude: 2.7978625 },
      containedInPlace: GEO_HIERARCHY,
    },
    organizer: {
      "@type": "LocalBusiness",
      "@id": `${BASE_URL}/#organization`,
      name: "Costa Brava Rent a Boat Blanes",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: "70",
      highPrice: "450",
      availability: "https://schema.org/InStock",
      validFrom: `${SEASON_YEAR}-01-01`,
      url: BASE_URL,
    },
    image: `${BASE_URL}/og-image.webp`,
    performer: {
      "@type": "Organization",
      name: "Costa Brava Rent a Boat",
    },
  };
}

// Build SiteNavigationElement schema. Tells Google which subpages are the
// primary navigation candidates for sitelinks under the brand result.
// Mirrors generateSiteNavigationSchema in client/src/utils/seo-config.ts
// (kept inline because the client utils module cannot be imported here).
function buildSiteNavigation(lang: LangCode): object {
  type LangMap = Partial<Record<LangCode, string>>;
  const items: Array<{ key: PageKey; name: LangMap; description: LangMap }> = [
    {
      key: "pricing",
      name: { es: "Precios", en: "Pricing", ca: "Preus", fr: "Tarifs", de: "Preise", nl: "Prijzen", it: "Prezzi", ru: "Цены" },
      description: {
        es: "Tarifas de alquiler por temporada y duración.",
        en: "Seasonal rental rates by duration.",
        ca: "Tarifes de lloguer per temporada i durada.",
        fr: "Tarifs de location saisonniers par durée.",
        de: "Saisonale Mietpreise nach Dauer.",
        nl: "Seizoensgebonden huurtarieven per duur.",
        it: "Tariffe di noleggio stagionali per durata.",
        ru: "Сезонные тарифы аренды по продолжительности.",
      },
    },
    {
      key: "categoryLicenseFree",
      name: { es: "Barcos sin licencia", en: "License-Free Boats", ca: "Barques sense llicència", fr: "Bateaux sans permis", de: "Boote ohne Führerschein", nl: "Boten zonder vaarbewijs", it: "Barche senza patente", ru: "Лодки без лицензии" },
      description: {
        es: "Embarcaciones para conducir sin titulación náutica.",
        en: "Boats you can pilot without a license.",
        ca: "Embarcacions per pilotar sense titulació.",
        fr: "Bateaux pilotables sans permis.",
        de: "Boote ohne Führerschein fahrbar.",
        nl: "Boten te besturen zonder vaarbewijs.",
        it: "Barche pilotabili senza patente.",
        ru: "Лодки, которыми можно управлять без лицензии.",
      },
    },
    {
      key: "categoryLicensed",
      name: { es: "Barcos con licencia", en: "Licensed Boats", ca: "Barques amb llicència", fr: "Bateaux avec permis", de: "Boote mit Führerschein", nl: "Boten met vaarbewijs", it: "Barche con patente", ru: "Лодки с лицензией" },
      description: {
        es: "Embarcaciones potentes con licencia o excursión con capitán.",
        en: "Powerful boats with license or excursion with captain.",
        ca: "Embarcacions potents amb llicència o excursió amb capità.",
        fr: "Bateaux puissants avec permis ou excursion avec capitaine.",
        de: "Leistungsstarke Boote mit Führerschein oder Ausflug mit Kapitän.",
        nl: "Krachtige boten met vaarbewijs of excursie met kapitein.",
        it: "Barche potenti con patente o escursione con capitano.",
        ru: "Мощные лодки с лицензией или экскурсия с капитаном.",
      },
    },
    {
      key: "routes",
      name: { es: "Rutas", en: "Routes", ca: "Rutes", fr: "Itinéraires", de: "Routen", nl: "Routes", it: "Itinerari", ru: "Маршруты" },
      description: {
        es: "Itinerarios y calas recomendadas desde Blanes.",
        en: "Recommended routes and coves from Blanes.",
        ca: "Itineraris i cales recomanades des de Blanes.",
        fr: "Itinéraires et criques recommandés depuis Blanes.",
        de: "Empfohlene Routen und Buchten ab Blanes.",
        nl: "Aanbevolen routes en baaien vanuit Blanes.",
        it: "Itinerari e calette consigliati da Blanes.",
        ru: "Рекомендуемые маршруты и бухты из Бланеса.",
      },
    },
    {
      key: "faq",
      name: { es: "FAQ", en: "FAQ", ca: "FAQ", fr: "FAQ", de: "FAQ", nl: "FAQ", it: "FAQ", ru: "FAQ" },
      description: {
        es: "Preguntas frecuentes sobre licencias, precios y reservas.",
        en: "Frequently asked questions on licenses, prices and bookings.",
        ca: "Preguntes freqüents sobre llicències, preus i reserves.",
        fr: "Questions fréquentes sur permis, tarifs et réservations.",
        de: "Häufig gestellte Fragen zu Führerschein, Preisen und Buchungen.",
        nl: "Veelgestelde vragen over vaarbewijs, prijzen en boekingen.",
        it: "Domande frequenti su patenti, prezzi e prenotazioni.",
        ru: "Часто задаваемые вопросы о лицензиях, ценах и бронировании.",
      },
    },
    {
      key: "testimonials",
      name: { es: "Testimonios", en: "Testimonials", ca: "Testimonis", fr: "Témoignages", de: "Bewertungen", nl: "Beoordelingen", it: "Recensioni", ru: "Отзывы" },
      description: {
        es: "300+ reseñas reales de clientes en Google.",
        en: "300+ real customer reviews on Google.",
        ca: "300+ ressenyes reals de clients a Google.",
        fr: "300+ avis clients réels sur Google.",
        de: "300+ echte Kundenbewertungen auf Google.",
        nl: "300+ echte klantbeoordelingen op Google.",
        it: "300+ recensioni reali dei clienti su Google.",
        ru: "300+ реальных отзывов клиентов в Google.",
      },
    },
  ];

  return {
    "@type": "ItemList",
    "@id": `${BASE_URL}/#sitenav`,
    name: "Costa Brava Rent a Boat - Site Navigation",
    itemListElement: items.map((item, i) => ({
      "@type": "SiteNavigationElement",
      position: i + 1,
      name: item.name[lang] ?? item.name.es,
      description: item.description[lang] ?? item.description.es,
      url: `${BASE_URL}${getLocalizedPath(item.key, lang)}`,
    })),
  };
}

interface LcpPreload {
  // MUST match the `src` of the real LCP <img>, otherwise the browser fetches
  // the image twice (once for the preload, once for the img). Type and srcset,
  // if provided, must also match the eventual <img>/<picture> selection.
  href: string;
  imageType?: string;
  imagesrcset?: string;
  imagesizes?: string;
}

interface ResolvedPage {
  meta: SEOMeta;
  jsonLd?: object;
  availableLanguages?: readonly string[];
  // True when this page/lang combo has real translated content (only relevant for
  // dynamic content like blog posts). When false on a non-ES non-home route, the
  // caller applies noindex+canonical-to-ES to avoid duplicate-content penalties.
  hasTranslation?: boolean;
  // Present when the resource was authored natively in a non-Spanish language.
  // Inverts the default ES-canonical logic: native lang becomes canonical and
  // indexable, every other locale (including ES) gets noindex + canonical→native.
  nativeOverride?: NativeLanguageOverride;
  // LCP hero image to preload. Non-home routes strip the home hero preload but
  // don't emit a replacement by default, which leaves the LCP image undiscovered
  // until React hydrates (Lighthouse mobile 2026-04-21: ~7s resource load delay
  // on boat + blog detail pages). When this field is set, injectMeta emits a
  // <link rel="preload" as="image" fetchpriority="high"> that mirrors the eventual
  // <img> src so the browser can start the fetch in parallel with JS evaluation.
  lcpPreload?: LcpPreload;
  // SSR body fallback HTML — injected inside <div id="root"> so that crawlers
  // (Googlebot's Live Test, Bingbot, social previewers) get visible semantic
  // content even before React hydrates. Removed by main.tsx before hydration
  // to avoid mismatch warnings. Fix for boat detail pages that Google's URL
  // Inspection rejected with "indexing problems detected during live test"
  // because the page was 100% client-rendered with empty body.
  bodyFallback?: string;
}

// Hero image preload aliases. Most boat ids resolve via resolveBoatImagePath;
// aliases like "remus-450-ii" (same underlying asset as "remus-450") live here
// so the LCP preload still fires for legacy/duplicate ids in the DB.
const BOAT_HERO_PRELOAD_ALIASES: Record<string, string> = {
  "remus-450-ii": "remus-450",
};

// Decide whether a given (pathname, lang) combo should be served with
// robots=noindex and canonical pointing to the ES equivalent. ES is always
// indexable. Home routes of every lang are fully i18n-covered (all UI strings
// come from client/src/i18n/<lang>.ts). Blog posts opt in via titleByLang[lang].
// Everything else (boats, destinations, locations, activities, categories,
// faq, legal, etc.) falls back to ES content from the DB, so we noindex them
// in non-ES langs and canonicalize to the ES equivalent.
//
// When `nativeOverride` is set, the normal ES-as-canonical rule is inverted:
// the native language is canonical and indexable, other locales noindex and
// canonicalize to the native URL (except any listed in `alsoIndexable`, which
// index themselves but still canonicalize to the native version).
function computeTranslationIndex(
  pathname: string,
  lang: LangCode,
  hasTranslation: boolean = false,
  nativeOverride?: NativeLanguageOverride,
): { noindex: boolean; canonicalOverride?: string } {
  if (nativeOverride) {
    const indexable = new Set<LangCode>([
      nativeOverride.nativeLang,
      ...(nativeOverride.alsoIndexable ?? []),
    ]);
    // The native URL is its own canonical; no override needed.
    if (lang === nativeOverride.nativeLang) return { noindex: false };
    const canonicalOverride = switchLanguagePath(pathname, nativeOverride.nativeLang);
    // Additional indexable locales: index, but canonicalize to the native URL so
    // Google consolidates signals on the single authoritative version.
    if (indexable.has(lang)) return { noindex: false, canonicalOverride };
    // Every other locale (including ES) gets noindex + canonical→native.
    return { noindex: true, canonicalOverride };
  }

  if (lang === "es") return { noindex: false };
  const isHome = pathname === "/" || /^\/[a-z]{2}\/?$/.test(pathname);
  if (isHome) return { noindex: false };
  if (hasTranslation) return { noindex: false };
  // Static pages whose UI is fully translated in i18n (location pages after
  // Round 3 PR C) opt into indexability via translatedStaticPaths.ts — no DB
  // row required. Route-to-metaKey resolution: strip the lang prefix.
  const { metaKey } = pathToStaticMetaKey(pathname);
  if (hasStaticTranslation(metaKey, lang)) return { noindex: false };
  return {
    noindex: true,
    canonicalOverride: localizedAlternatePath(pathname, "es"),
  };
}

// Convert a /:lang/:slug path to the STATIC_META key (Spanish path) for lookup.
// This avoids re-keying the massive STATIC_META object while supporting i18n subdirectory URLs.
function pathToStaticMetaKey(pathname: string): { metaKey: string; lang: LangCode } {
  const parts = pathname.split("/").filter(Boolean);

  // Root path: /
  if (parts.length === 0) return { metaKey: "/", lang: "es" };

  // Check if first segment is a valid language code
  const lang = isValidLang(parts[0]) ? parts[0] as LangCode : "es";

  // /:lang (home page)
  if (parts.length === 1 && isValidLang(parts[0])) {
    return { metaKey: "/", lang };
  }

  // For paths without a lang prefix (legacy), treat the whole path as the key
  if (!isValidLang(parts[0])) {
    return { metaKey: pathname, lang: "es" };
  }

  const slug = parts[1];
  const resolved = resolveSlug(slug);
  if (resolved) {
    const esSlug = getSlugForPage(resolved.pageKey as PageKey, "es");
    const metaKey = esSlug ? `/${esSlug}` : "/";
    const params = parts.slice(2).join("/");
    return { metaKey: params ? `${metaKey}/${params}` : metaKey, lang };
  }

  // Programmatic matrix slugs (occasion × location) live outside ROUTE_SLUGS;
  // normalize any localized matrix slug to its ES metaKey, mirroring the
  // resolveSlug branch above. matrixSlugCollisions guarantees no shadowing.
  if (OCCASION_MATRIX_ENABLED && parts.length === 2) {
    const matrixCombo = resolveMatrixSlug(slug);
    if (matrixCombo) {
      return { metaKey: `/${matrixSlug(matrixCombo.occasion.id, matrixCombo.locationKey, "es")}`, lang };
    }
  }

  // Fallback: use slug as-is (may match old STATIC_META keys like /privacy-policy)
  return { metaKey: `/${parts.slice(1).join("/")}`, lang };
}

// Like switchLanguagePath, but understands matrix slugs (whose localized form
// is NOT in ROUTE_SLUGS — e.g. /de/schnorcheln-blanes ↔ /fr/snorkeling-blanes).
// Used for hreflang alternates and canonical overrides so matrix pages don't
// emit same-slug alternates that 404 in other languages.
function localizedAlternatePath(pathname: string, targetLang: LangCode): string {
  if (OCCASION_MATRIX_ENABLED) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 2 && isValidLang(parts[0])) {
      const combo = resolveMatrixSlug(parts[1]);
      if (combo) return matrixPath(combo.occasion.id, combo.locationKey, targetLang);
    }
  }
  return switchLanguagePath(pathname, targetLang);
}

async function resolveMeta(pathname: string, lang: LangCode): Promise<ResolvedPage | null> {
  // Resolve the STATIC_META key from the i18n path
  const { metaKey } = pathToStaticMetaKey(pathname);

  // 1. Static page lookup
  const pageMeta = STATIC_META[metaKey];
  if (pageMeta) {
    const meta = pageMeta[lang] || pageMeta["es"];
    if (!meta) return null;
    const availableLanguages = Object.keys(pageMeta) as LangCode[];

    // Helper: build a BreadcrumbList schema for any page (with @id for entity linking)
    const buildBreadcrumb = (items: Array<{ name: string; url: string }>) => ({
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}${metaKey}#breadcrumb`,
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    });

    const isEn = lang === "en";
    const homeCrumb = { name: isEn ? "Home" : "Inicio", url: BASE_URL };

    // SSR body fallback helper for location pages — gives non-JS AI crawlers
    // the citable facts (name, summary, top attractions, CTA) before hydration.
    // Defined once here so every if/else if branch in this scope can reuse it.
    const buildLocationBodyFallback = (
      heading: string,
      summary: string,
      bullets: string[],
      ctaLabel: string,
    ): string => `
<h1>${esc(heading)}</h1>
<p>${esc(summary)}</p>
<ul>
${bullets.map((b) => `  <li>${esc(b)}</li>`).join("\n")}
</ul>
<p><a href="https://wa.me/34611500372">${esc(ctaLabel)}</a></p>
    `.trim();

    // For home page: add rich JSON-LD graph with all schemas
    // NOTE: Google will NOT show star snippets for self-reviewed LocalBusiness schemas.
    // Stars can only appear on Product schemas (boat detail pages). The AggregateRating
    // here is kept for general structured data quality, not for SERP star snippets.
    if (metaKey === "/") {
      const aggregateRating = buildAggregateRating();
      const localBusiness = {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/#organization`,
        name: "Costa Brava Rent a Boat Blanes",
        legalName: "DAMAR COSTA BRAVA S.L.",
        alternateName: [
          "Costa Brava Rent a Boat",
          "Costa Brava Rent a Boat Blanes",
          "Alquiler de Barcos Costa Brava",
          "CBRaB",
        ],
        description: "Alquiler de barcos sin licencia y con licencia en Blanes, Costa Brava. Puerto de Blanes. 9 embarcaciones para 4-7 personas.",
        url: BASE_URL,
        telephone: "+34611500372",
        email: "costabravarentaboat@gmail.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS_STREET,
          addressLocality: "Blanes",
          addressRegion: "Girona",
          postalCode: "17300",
          addressCountry: "ES",
        },
        geo: { "@type": "GeoCoordinates", latitude: 41.6722504, longitude: 2.7978625 },
        containedInPlace: GEO_HIERARCHY,
        areaServed: [
          {
            "@type": "GeoShape",
            box: "41.60 2.65 41.75 2.95",
          },
          {
            "@type": "GeoCircle",
            geoMidpoint: { "@type": "GeoCoordinates", latitude: 41.6722504, longitude: 2.7978625 },
            geoRadius: "50000",
          },
        ],
        openingHoursSpecification: [{
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
          opens: "09:00",
          closes: "20:00",
          validFrom: `${SEASON_YEAR}-04-01`,
          validThrough: `${SEASON_YEAR}-10-31`,
        }],
        priceRange: "70-420 EUR",
        paymentAccepted: ["Cash", "Credit Card", "Debit Card"],
        currenciesAccepted: "EUR",
        aggregateRating,
        ...(buildReviews() ? { review: buildReviews() } : {}),
        image: `${BASE_URL}/og-image.jpg`,
        logo: `${BASE_URL}/og-image.jpg`,
        // Knowledge graph signal — entities this business has expertise on.
        // AI agents use knowsAbout to route topical queries to authoritative
        // sources. More entities = wider topical authority fingerprint.
        knowsAbout: [
          // Destinos geográficos
          "Costa Brava", "Blanes", "Lloret de Mar", "Tossa de Mar",
          "Sant Feliu de Guíxols", "Playa de Fenals", "Port de Blanes",
          "Maresme", "Costa Brava Sur",
          // Calas específicas
          "Sa Palomera", "Sa Forcanera", "Cala Sant Francesc", "Cala de s'Agulla",
          "Cala Treumal", "Platja de Santa Cristina", "Cala Sa Boadella",
          "Cala Bona", "Cala Canyelles",
          // Terminología y regulación náutica
          "Licencia de Navegación (LN)", "Licencia de Navegación Básica (LNB)", "PER (Patrón de Embarcaciones de Recreo)",
          "PNB (Patrón de Navegación Básica)", "Límite 2 millas náuticas",
          "Navegación a 5 nudos", "Matrícula lista 6ª", "Título náutico",
          // Actividades / servicios
          "Alquiler de barcos sin licencia", "Alquiler de barcos con licencia",
          "Excursión privada con capitán", "Snorkel Costa Brava",
          "Pesca recreativa marítima", "Fondeo en calas",
          "Tarifas estacionales náuticas", "Seguro embarcaciones ocupantes",
          // Ecosistema marino y turismo
          "Mediterranean Sea", "Nautical Tourism", "Water Sports",
          "Maritime Safety", "Cabo de Santa Anna", "Botánico Marimurtra",
        ],
        // sameAs: cluster de perfiles oficiales (alineado con
        // client/src/utils/seo-config.ts). TODO: añadir YouTube cuando
        // exista el canal del negocio.
        sameAs: [
          "https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5",
          "https://www.instagram.com/costabravarentaboat/",
          "https://www.facebook.com/costabravarentaboat",
          "https://www.tiktok.com/@costabravarentaboat",
          "https://www.linkedin.com/company/costabravarentaboat",
          "https://www.tripadvisor.com/Attraction_Review-g580331-d19938921-Reviews-Costa_Brava_Rent_a_Boat-Blanes_Costa_Brava_Province_of_Girona_Catalonia.html",
        ],
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          "@id": "https://www.costabravarentaboat.com/#return-policy",
          applicableCountry: "ES",
          returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
          refundType: "https://schema.org/NoReturnRefund",
          additionalType: "https://www.costabravarentaboat.com/terms-conditions",
          description: "Cambio de fecha gratuito hasta 7 días antes de la salida (sujeto a disponibilidad). Mal tiempo: reprogramamos sin coste o devolvemos el depósito íntegro. Las reservas confirmadas con depósito no son reembolsables fuera del supuesto de mal tiempo.",
        },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [
            ".hero-title",
            ".hero-subtitle",
            "h1",
            "h2",
            ".faq-answer",
            "[data-speakable]"
          ]
        }
      };
      // potentialAction SearchAction removed 2026-05: urlTemplate `/?q=`
      // didn't resolve to a working search page. Re-introduce when a
      // real /search endpoint is built.
      const webSite = {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        name: "Costa Brava Rent a Boat Blanes",
        url: BASE_URL,
        inLanguage: ["es-ES","en-GB","ca-ES","fr-FR","de-DE","nl-NL","it-IT","ru-RU"],
        publisher: { "@type": "LocalBusiness", "@id": `${BASE_URL}/#organization` }
      };
      const howTo = {
        "@type": "HowTo",
        name: lang === "en" ? "How to Rent a Boat in Blanes, Costa Brava" : "Como alquilar un barco en Blanes, Costa Brava",
        description: lang === "en"
          ? "Step-by-step guide to renting a boat in Blanes without a license."
          : "Guia paso a paso para alquilar un barco en Blanes sin licencia.",
        totalTime: "PT5M",
        estimatedCost: { "@type": "MonetaryAmount", currency: "EUR", value: "70" },
        step: lang === "en" ? [
          { "@type": "HowToStep", position: 1, name: "Choose your boat", text: "Select from license-free boats (from 70 EUR/hour) or licensed boats (from 160 EUR/2 hours)." },
          { "@type": "HowToStep", position: 2, name: "Select date and time", text: "Choose date, start time, and duration. Available April to October, 09:00-20:00." },
          { "@type": "HowToStep", position: 3, name: "Confirm booking", text: "Book via WhatsApp (+34 611 500 372) or website. No deposit for license-free boats." },
          { "@type": "HowToStep", position: 4, name: "Receive briefing", text: "15-minute training on boat handling and safety at Puerto de Blanes." },
          { "@type": "HowToStep", position: 5, name: "Explore Costa Brava", text: "Discover coves and beaches. Fuel, insurance and safety equipment included." },
        ] : [
          { "@type": "HowToStep", position: 1, name: "Elige tu barco", text: "Selecciona entre barcos sin licencia (desde 70 EUR/hora) o con licencia (desde 160 EUR/2 horas)." },
          { "@type": "HowToStep", position: 2, name: "Selecciona fecha y horario", text: "Elige fecha, hora de inicio y duracion. Disponible de abril a octubre, 09:00-20:00." },
          { "@type": "HowToStep", position: 3, name: "Confirma tu reserva", text: "Reserva por WhatsApp (+34 611 500 372) o web. No se requiere deposito para barcos sin licencia." },
          { "@type": "HowToStep", position: 4, name: "Recibe tu briefing", text: "Formacion de 15 minutos sobre manejo del barco y seguridad en Puerto de Blanes." },
          { "@type": "HowToStep", position: 5, name: "Navega por la Costa Brava", text: "Explora calas y playas. Combustible, seguro y equipo de seguridad incluidos." },
        ]
      };
      const faq = {
        "@type": "FAQPage",
        "@id": `${BASE_URL}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "¿Cuáles son los precios del alquiler?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Barcos sin licencia desde 70€ con gasolina incluida (1h, 2h, 3h, 4h, 6h o dia completo). Barcos con licencia desde 160€ sin gasolina incluida (2h, 4h, 8h). Los precios varian segun temporada (julio/agosto) y embarcacion."
            }
          },
          {
            "@type": "Question",
            name: "¿Puedo alquilar un barco sin tener licencia náutica?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "¡Sí! Tenemos varios barcos perfectos sin licencia de hasta 15 CV. Solo necesitas ser mayor de 18 años. Antes de salir te damos un briefing completo para que navegues con total seguridad."
            }
          },
          {
            "@type": "Question",
            name: "¿Qué está incluido en el precio?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Incluido en todos los alquileres: embarcación equipada, gasolina (en barcos sin licencia), chalecos salvavidas, kit de seguridad, ancla, escalera de baño, instrucciones de uso y seguro básico."
            }
          },
          {
            "@type": "Question",
            name: "¿Cuál es la política de cancelación?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Cambio de fecha gratuito hasta 7 días antes de la salida (sujeto a disponibilidad). Mal tiempo: reprogramamos sin coste o devolvemos el depósito íntegro. Las reservas confirmadas con depósito no son reembolsables fuera del supuesto de mal tiempo."
            }
          },
          {
            "@type": "Question",
            name: "¿Por dónde puedo navegar?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Barcos sin licencia: desde Blanes hasta Playa de Fenals al norte y el final de la playa de Blanes al sur, siempre a menos de 2 millas de la costa. Barcos con licencia: mayor radio de navegación, hasta Sant Feliu de Guíxols y más allá."
            }
          },
          {
            "@type": "Question",
            name: "¿Qué pasa si hace mal tiempo?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Si las condiciones meteorológicas no son seguras, te ofrecemos cambio de fecha gratuito o devolución íntegra del depósito. Consultamos la previsión 24h antes y te avisamos."
            }
          },
          {
            "@type": "Question",
            name: "¿Necesito experiencia previa?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No, ninguna. Antes de zarpar te damos una explicación completa del barco (10-15 min). Nuestros barcos sin licencia son muy fáciles de manejar."
            }
          },
          {
            "@type": "Question",
            name: "¿Puedo llevar comida y bebida?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "¡Por supuesto! Puedes traer tu propia comida, bebidas y snacks. Tenemos nevera a bordo. Solo pedimos que no se use cristal por seguridad."
            }
          },
        ]
      };
      const seasonalEvent = buildSeasonalEvent(isEn);
      const siteNav = buildSiteNavigation(lang);
      const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [localBusiness, webSite, siteNav, howTo, faq, seasonalEvent]
      };
      // SSR body fallback for AI crawlers (CCBot, ClaudeBot etc.) that parse
      // HTML but don't execute React hydration. Contains the citation-worthy
      // facts a LLM would extract for "what is Costa Brava Rent a Boat".
      const stats = getCurrentStats();
      // Use the real per-language hero copy so the pre-hydration paint matches
      // the H1 React eventually renders (Hero.tsx → t.hero.title) AND is in the
      // visitor's language. Before this, the SSR fallback H1/summary were
      // ES/EN-only, so a German visitor saw a Spanish H1 flash before hydration
      // (the reported "página en castellano" symptom). Falls back to the brand
      // string only if a locale somehow lacks the hero block.
      const heroT = (I18N_BY_LANG[lang] ?? i18nEs).hero;
      const homeH1 = heroT?.title
        ?? (isEn ? `Costa Brava Rent a Boat — Blanes, Spain` : `Costa Brava Rent a Boat — Blanes, Costa Brava`);
      const homeSummary = heroT?.summaryGeo ?? heroT?.subtitle
        ?? (isEn
          ? `Largest boat rental fleet in the Port of Blanes (9 boats). License-free boats from 70€/h with fuel included. Licensed boats and private excursions with captain available. Season April–October. ${stats.rating.toFixed(1)}★ on Google with ${stats.userRatingCount}+ reviews.`
          : `Mayor flota de alquiler de barcos del Puerto de Blanes (9 barcos). Sin licencia desde 70€/h con gasolina incluida. Barcos con licencia y excursión privada con capitán disponibles. Temporada abril–octubre. ${stats.rating.toFixed(1)}★ en Google con ${stats.userRatingCount}+ reseñas.`);
      const facts = isEn
        ? [
            "9 boats: 5 license-free, 3 licensed, 1 private excursion with captain",
            "Fuel included on all license-free boats",
            "8 languages: Spanish, English, Catalan, French, German, Dutch, Italian, Russian",
            "Coves accessible: Sa Palomera, Sa Forcanera, Sant Francesc, S'Agulla, Treumal, Santa Cristina, Sa Boadella, Fenals",
            "Open daily 09:00–20:00 from April to October",
            "Hours response time on WhatsApp +34 611 500 372",
          ]
        : [
            "9 barcos: 5 sin licencia, 3 con licencia, 1 excursión privada con capitán",
            "Gasolina incluida en todos los barcos sin licencia",
            "8 idiomas: español, inglés, catalán, francés, alemán, neerlandés, italiano, ruso",
            "Calas accesibles: Sa Palomera, Sa Forcanera, Sant Francesc, S'Agulla, Treumal, Santa Cristina, Sa Boadella, Fenals",
            "Abierto todos los días 09:00–20:00 de abril a octubre",
            "Respuesta inmediata por WhatsApp +34 611 500 372",
          ];
      const ctaLabel = isEn ? "Book via WhatsApp" : "Reserva por WhatsApp";
      const fleetLabel = isEn ? "View fleet" : "Ver flota";
      const faqLabel = isEn ? "FAQ" : "Preguntas frecuentes";
      const bodyFallback = `
<h1>${esc(homeH1)}</h1>
<p>${esc(homeSummary)}</p>
<ul>
${facts.map((f) => `  <li>${esc(f)}</li>`).join("\n")}
</ul>
<p>
  <a href="https://wa.me/34611500372">${esc(ctaLabel)}</a> ·
  <a href="${BASE_URL}/barcos">${esc(fleetLabel)}</a> ·
  <a href="${BASE_URL}/faq">${esc(faqLabel)}</a>
</p>
      `.trim();
      return { meta, jsonLd, availableLanguages, bodyFallback };
    }

    // /faq - FAQPage schema (critical for AI search extraction)
    else if (metaKey === "/faq") {
      const faqPage = {
        "@type": "FAQPage",
        "@id": `${BASE_URL}/faq#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "Do I need a license to rent a boat in Blanes?" : "¿Necesito licencia para alquilar un barco en Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "No. We have 5 license-free boats (up to 15 HP) for up to 5 people. You only need to be 18+. We provide a 15-minute safety briefing."
              : "No. Tenemos 5 barcos sin licencia (hasta 15 CV) para hasta 5 personas. Solo necesitas ser mayor de 18 anos. Te damos una formacion de seguridad de 15 minutos." },
          },
          {
            "@type": "Question",
            name: isEn ? "How much does it cost to rent a boat in Blanes?" : "¿Cuánto cuesta alquilar un barco en Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "License-free boats from 70 EUR/hour (low season) to 95 EUR/hour (high season). Licensed boats from 160 EUR/2 hours. Fuel, insurance and safety equipment are always included."
              : "Barcos sin licencia desde 70 EUR/hora (temporada baja) hasta 95 EUR/hora (temporada alta). Barcos con licencia desde 160 EUR/2 horas. Combustible, seguro y equipo de seguridad siempre incluidos." },
          },
          {
            "@type": "Question",
            name: isEn ? "What is included in the boat rental price?" : "Que incluye el precio del alquiler del barco?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "All rentals include fuel, civil liability insurance, safety equipment (life jackets, fire extinguisher, anchor, paddle), mooring, cleaning, and a 15-minute safety briefing."
              : "Todos los alquileres incluyen combustible, seguro de responsabilidad civil, equipo de seguridad (chalecos salvavidas, extintor, ancla, remo), amarre, limpieza y formacion de seguridad de 15 minutos." },
          },
          {
            "@type": "Question",
            name: isEn ? "What is the cancellation policy?" : "¿Cuál es la política de cancelación?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Free date changes up to 7 days before departure (subject to availability). Bad weather: free rescheduling or full deposit refund. Confirmed bookings with deposit are non-refundable outside the bad-weather case."
              : "Cambio de fecha gratuito hasta 7 días antes de la salida (sujeto a disponibilidad). Mal tiempo: reprogramamos sin coste o devolvemos el depósito íntegro. Las reservas confirmadas con depósito no son reembolsables fuera del supuesto de mal tiempo." },
          },
          {
            "@type": "Question",
            name: isEn ? "Where can I navigate with the rental boats?" : "¿Dónde puedo navegar con los barcos de alquiler?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "License-free boats can navigate up to 2 nautical miles from the coast. You can explore from Sa Palomera to Lloret de Mar. Licensed boats can reach Tossa de Mar and beyond."
              : "Los barcos sin licencia pueden navegar hasta 2 millas nauticas de la costa. Puedes explorar desde Sa Palomera hasta Lloret de Mar. Los barcos con licencia pueden llegar hasta Tossa de Mar y mas alla." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: "FAQ", url: `${BASE_URL}/faq` }]);
      // Speakable: voice assistants and AI engines can lift the answer text
      // verbatim. Targets the answer body of every Question/Answer block.
      const speakable = {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "h2", "[data-speakable]", ".faq-answer", "[data-faq-answer]"],
      };
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [{ ...faqPage, speakable }, breadcrumb] }, availableLanguages };
    }

    // /testimonios - LocalBusiness with AggregateRating + individual Reviews
    else if (metaKey === "/testimonios") {
      const aggregateRating = buildAggregateRating();
      const localBusiness: Record<string, unknown> = {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/#organization`,
        name: "Costa Brava Rent a Boat Blanes",
        url: BASE_URL,
        telephone: "+34611500372",
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS_STREET,
          addressLocality: "Blanes",
          addressRegion: "Girona",
          postalCode: "17300",
          addressCountry: "ES",
        },
        aggregateRating,
        image: `${BASE_URL}/og-image.webp`,
      };
      // Fetch individual reviews from DB for rich Review schema
      const reviews: Array<Record<string, unknown>> = [];
      try {
        const testimonialsData = await storage.getTestimonials();
        if (testimonialsData && testimonialsData.length > 0) {
          const topReviews = testimonialsData.slice(0, 10); // Top 10 reviews for schema
          topReviews.forEach((t: Record<string, unknown>) => {
            reviews.push({
              "@type": "Review",
              reviewRating: {
                "@type": "Rating",
                ratingValue: String((t.rating as number) || 5),
                bestRating: "5",
                worstRating: "1",
              },
              author: { "@type": "Person", name: (t.name as string) || "Cliente" },
              reviewBody: (t.text as string) || (t.comment as string) || "",
              datePublished: t.createdAt ? new Date(t.createdAt as string).toISOString().split("T")[0] : `${SEASON_YEAR}-01-01`,
              publisher: { "@type": "Organization", name: "Costa Brava Rent a Boat" },
              itemReviewed: { "@type": "LocalBusiness", "@id": `${BASE_URL}/#organization` },
            });
          });
          localBusiness.review = reviews;
        }
      } catch {
        // Fall back to aggregate only
      }
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Reviews" : "Opiniones", url: `${BASE_URL}/testimonios` }]);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [localBusiness, breadcrumb] }, availableLanguages };
    }

    // /alquiler-barcos-blanes - TouristDestination + FAQPage for Blanes
    else if (metaKey === "/alquiler-barcos-blanes") {
      const destination = {
        "@type": "TouristDestination",
        name: isEn ? "Blanes Port - Boat Rental" : "Puerto de Blanes - Alquiler de Barcos",
        description: isEn
          ? "Rent boats in Blanes Port, the gateway to Costa Brava. 9 boats available with and without license. Explore coves, beaches, and the Mediterranean coast."
          : "Alquila barcos en el Puerto de Blanes, la puerta de la Costa Brava. 9 embarcaciones disponibles con y sin licencia. Explora calas, playas y la costa mediterránea.",
        url: `${BASE_URL}/alquiler-barcos-blanes`,
        touristType: [
          { "@type": "Audience", audienceType: isEn ? "Nautical tourists" : "Turistas náuticos" },
          { "@type": "Audience", audienceType: isEn ? "Families with children" : "Familias con ninos" },
          { "@type": "Audience", audienceType: isEn ? "Adventure seekers" : "Buscadores de aventura" },
        ],
        geo: { "@type": "GeoCoordinates", latitude: 41.6722504, longitude: 2.7978625 },
        containedInPlace: GEO_HIERARCHY,
        includesAttraction: [
          { "@type": "TouristAttraction", name: "Sa Palomera", sameAs: "https://en.wikipedia.org/wiki/Sa_Palomera" },
          { "@type": "TouristAttraction", name: "Cala Sant Francesc" },
          { "@type": "TouristAttraction", name: "Platja de Blanes" },
          { "@type": "TouristAttraction", name: "Jardin Botanico Marimurtra", sameAs: "https://en.wikipedia.org/wiki/Marimurtra" },
        ],
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "Where is the boat rental point in Blanes?" : "Donde esta el punto de alquiler de barcos en Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Our boats depart from Puerto de Blanes (Blanes Port), located at the end of the promenade near Sa Palomera rock."
              : "Nuestros barcos salen del Puerto de Blanes, ubicado al final del paseo maritimo junto a la roca de Sa Palomera." },
          },
          {
            "@type": "Question",
            name: isEn ? "What can I see by boat from Blanes?" : "Que puedo ver en barco desde Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "From Blanes you can explore Sa Palomera, Cala Sant Francesc, Fenals Beach, Lloret de Mar coves, and even reach Tossa de Mar with a licensed boat."
              : "Desde Blanes puedes explorar Sa Palomera, Cala Sant Francesc, Playa de Fenals, las calas de Lloret de Mar, e incluso llegar a Tossa de Mar con barco con licencia." },
          },
          {
            "@type": "Question",
            name: isEn ? "Is Blanes a good place to rent a boat?" : "Es Blanes un buen lugar para alquilar un barco?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Yes! Blanes is the gateway to Costa Brava, with calm waters, sheltered port, and proximity to the best coves. Perfect for beginners and experienced sailors."
              : "Si! Blanes es la puerta de la Costa Brava, con aguas tranquilas, puerto abrigado y proximidad a las mejores calas. Perfecto para principiantes y navegantes experimentados." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Boat Rental in Blanes" : "Alquiler Barcos Blanes", url: `${BASE_URL}/alquiler-barcos-blanes` }]);
      const service = buildLandingService(
        isEn ? "Boat Rental in Blanes, Costa Brava" : "Alquiler de Barcos en Blanes, Costa Brava",
        isEn
          ? "Rent license-free and licensed boats from Blanes Port. 9 boats available, up to 7 people, from 70 EUR/hour. Fuel included on license-free boats."
          : "Alquiler de barcos sin licencia y con licencia desde el Puerto de Blanes. 9 embarcaciones disponibles, hasta 7 personas, desde 70€/hora. Gasolina incluida en los barcos sin licencia.",
        { low: 70, high: 420 },
      );
      const blanesBodyFallback = buildLocationBodyFallback(
        isEn ? "Boat Rental in Blanes, Costa Brava" : "Alquiler de Barcos en Blanes, Costa Brava",
        isEn
          ? "Rent license-free and licensed boats directly from Blanes Port (Girona). 9 boats available, up to 7 people, from 70€/hour. Fuel included on all license-free boats. The closest harbor for exploring Sa Palomera, Sant Francesc cove, and the southern Costa Brava."
          : "Alquila barcos sin licencia y con licencia directamente desde el Puerto de Blanes (Girona). 9 barcos disponibles, hasta 7 personas, desde 70€/hora. Gasolina incluida en todos los barcos sin licencia. El puerto más cercano para explorar Sa Palomera, Cala Sant Francesc y la Costa Brava sur.",
        isEn
          ? [
              "Sa Palomera rock — 5 minutes from the port",
              "Cala Sant Francesc — 10 minutes",
              "Platja de Blanes — main town beach",
              "Marimurtra Botanical Garden — coastal landmark",
              "Free parking 100m from the dock",
            ]
          : [
              "Roca de Sa Palomera — 5 minutos desde el puerto",
              "Cala Sant Francesc — 10 minutos",
              "Platja de Blanes — playa principal del pueblo",
              "Jardín Botánico Marimurtra — referente costero",
              "Parking gratuito a 100m del amarre",
            ],
        isEn ? "Book via WhatsApp +34 611 500 372" : "Reserva por WhatsApp +34 611 500 372",
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, destination, faq, breadcrumb] }, availableLanguages, bodyFallback: blanesBodyFallback };
    }

    // /alquiler-barcos-lloret-de-mar - TouristDestination + FAQPage for Lloret
    else if (metaKey === "/alquiler-barcos-lloret-de-mar") {
      const destination = {
        "@type": "TouristDestination",
        name: isEn ? "Boat Trip to Lloret de Mar from Blanes" : "Excursion en Barco a Lloret de Mar desde Blanes",
        description: isEn
          ? "Sail from Blanes to Lloret de Mar and discover stunning coves and beaches along the Costa Brava coastline."
          : "Navega desde Blanes hasta Lloret de Mar y descubre calas y playas impresionantes a lo largo de la costa de la Costa Brava.",
        url: `${BASE_URL}/alquiler-barcos-lloret-de-mar`,
        touristType: [
          { "@type": "Audience", audienceType: isEn ? "Nautical tourists" : "Turistas náuticos" },
          { "@type": "Audience", audienceType: isEn ? "Beach lovers" : "Amantes de la playa" },
          { "@type": "Audience", audienceType: isEn ? "Families with children" : "Familias con ninos" },
        ],
        geo: { "@type": "GeoCoordinates", latitude: 41.6994, longitude: 2.8455 },
        containedInPlace: {
          "@type": "Place",
          name: "Lloret de Mar",
          sameAs: "https://en.wikipedia.org/wiki/Lloret_de_Mar",
          containedInPlace: GEO_HIERARCHY.containedInPlace,
        },
        includesAttraction: [
          { "@type": "TouristAttraction", name: "Platja de Fenals" },
          { "@type": "TouristAttraction", name: "Cala Banys" },
          { "@type": "TouristAttraction", name: "Santa Cristina Beach" },
          { "@type": "TouristAttraction", name: "Cala Boadella" },
          { "@type": "TouristAttraction", name: "Jardines de Santa Clotilde", sameAs: "https://en.wikipedia.org/wiki/Gardens_of_Santa_Clotilde" },
        ],
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "How long does it take to reach Lloret de Mar by boat from Blanes?" : "Cuanto se tarda en llegar a Lloret de Mar en barco desde Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "About 30-40 minutes from Blanes Port, depending on the boat and sea conditions. It's one of our most popular routes."
              : "Aproximadamente 30-40 minutos desde el Puerto de Blanes, dependiendo del barco y las condiciones del mar. Es una de nuestras rutas mas populares." },
          },
          {
            "@type": "Question",
            name: isEn ? "Can I reach Lloret de Mar with a license-free boat?" : "Puedo llegar a Lloret de Mar con un barco sin licencia?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Yes! Lloret de Mar is within the 2-mile navigation zone for license-free boats. You can explore Fenals Beach, Cala Banys, and Santa Cristina Beach."
              : "Si! Lloret de Mar esta dentro de la zona de 2 millas para barcos sin licencia. Puedes explorar Playa de Fenals, Cala Banys y Playa de Santa Cristina." },
          },
          {
            "@type": "Question",
            name: isEn ? "What are the best coves between Blanes and Lloret de Mar?" : "Cuales son las mejores calas entre Blanes y Lloret de Mar?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "The highlights are Cala Sant Francesc, Sa Forcanera, Cala Boadella, and Fenals Beach - all accessible by our boats."
              : "Las mejores son Cala Sant Francesc, Sa Forcanera, Cala Boadella y Playa de Fenals - todas accesibles con nuestros barcos." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Lloret de Mar by Boat" : "Lloret de Mar en Barco", url: `${BASE_URL}/alquiler-barcos-lloret-de-mar` }]);
      // Preload the LCP hero image via a responsive imagesrcset that mirrors
      // the <picture> inside location-lloret-de-mar.tsx. AVIF is preferred;
      // browsers that don't support it ignore the preload and load the
      // webp/jpg fallback at natural priority.
      const lloretLcp: LcpPreload = {
        href: "/images/locations/hero-lloret-de-mar-mobile.avif",
        imagesrcset: "/images/locations/hero-lloret-de-mar-mobile.avif 768w, /images/locations/hero-lloret-de-mar.avif 1920w",
        imagesizes: "100vw",
        imageType: "image/avif",
      };
      const service = buildLandingService(
        isEn ? "Boat Rental from Blanes to Lloret de Mar" : "Alquiler de Barcos de Blanes a Lloret de Mar",
        isEn
          ? "Sail from Blanes to Lloret de Mar. License-free boats reach Fenals Beach in 25 min (2-mile zone). Licensed boats explore the full Lloret coastline. From 70 EUR/hour, up to 7 people."
          : "Navega desde Blanes hasta Lloret de Mar. Los barcos sin licencia llegan a Playa de Fenals en 25 min (zona de 2 millas). Los barcos con licencia recorren toda la costa de Lloret. Desde 70€/hora, hasta 7 personas.",
        { low: 70, high: 420 },
      );
      const lloretBodyFallback = buildLocationBodyFallback(
        isEn ? "Boat Rental from Blanes to Lloret de Mar" : "Alquiler de Barcos de Blanes a Lloret de Mar",
        isEn
          ? "Sail from Blanes to Lloret de Mar in 25 minutes with a license-free boat (2-mile zone reaches Fenals Beach). Licensed boats explore the full Lloret coastline including Cala Banys and Santa Cristina. Rentals from 70€/hour, up to 7 people, fuel included on license-free boats."
          : "Navega desde Blanes a Lloret de Mar en 25 minutos con barco sin licencia (la zona de 2 millas llega a Playa de Fenals). Los barcos con licencia recorren toda la costa de Lloret incluyendo Cala Banys y Santa Cristina. Alquileres desde 70€/hora, hasta 7 personas, gasolina incluida en barcos sin licencia.",
        isEn
          ? [
              "Cala Banys — most photographed cove in Lloret",
              "Cala Santa Cristina — family-friendly sandy beach",
              "Cala Sa Boadella — semi-virgin pine cove",
              "Playa de Fenals — northern legal limit for license-free boats",
              "Sa Forcanera cove — snorkel paradise on the way",
            ]
          : [
              "Cala Banys — la cala más fotografiada de Lloret",
              "Cala Santa Cristina — playa de arena familiar",
              "Cala Sa Boadella — cala semi-virgen con pinos",
              "Playa de Fenals — límite norte legal para barcos sin licencia",
              "Cala Sa Forcanera — paraíso del snorkel en la ruta",
            ],
        isEn ? "Book via WhatsApp +34 611 500 372" : "Reserva por WhatsApp +34 611 500 372",
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, destination, faq, breadcrumb] }, availableLanguages, lcpPreload: lloretLcp, bodyFallback: lloretBodyFallback };
    }

    // /alquiler-barcos-tossa-de-mar - TouristDestination + FAQPage for Tossa
    else if (metaKey === "/alquiler-barcos-tossa-de-mar") {
      const destination = {
        "@type": "TouristDestination",
        name: isEn ? "Boat Trip to Tossa de Mar from Blanes" : "Excursion en Barco a Tossa de Mar desde Blanes",
        description: isEn
          ? "Sail from Blanes to Tossa de Mar in 30-45 min. Discover the medieval Vila Vella, stunning cliffs, and hidden coves."
          : "Navega desde Blanes hasta Tossa de Mar en 30-45 min. Descubre la Vila Vella medieval, acantilados impresionantes y calas escondidas.",
        url: `${BASE_URL}/alquiler-barcos-tossa-de-mar`,
        touristType: [
          { "@type": "Audience", audienceType: isEn ? "Nautical tourists" : "Turistas náuticos" },
          { "@type": "Audience", audienceType: isEn ? "History enthusiasts" : "Entusiastas de la historia" },
          { "@type": "Audience", audienceType: isEn ? "Adventure seekers" : "Buscadores de aventura" },
        ],
        geo: { "@type": "GeoCoordinates", latitude: 41.7196, longitude: 2.9313 },
        containedInPlace: {
          "@type": "Place",
          name: "Tossa de Mar",
          sameAs: "https://en.wikipedia.org/wiki/Tossa_de_Mar",
          containedInPlace: GEO_HIERARCHY.containedInPlace,
        },
        includesAttraction: [
          { "@type": "TouristAttraction", name: "Vila Vella de Tossa de Mar", sameAs: "https://en.wikipedia.org/wiki/Vila_Vella" },
          { "@type": "TouristAttraction", name: "Platja Gran de Tossa" },
          { "@type": "TouristAttraction", name: "Cala Pola" },
          { "@type": "TouristAttraction", name: "Cala Giverola" },
          { "@type": "TouristAttraction", name: "Faro de Tossa de Mar" },
        ],
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "How long does it take to reach Tossa de Mar by boat from Blanes?" : "Cuanto se tarda en llegar a Tossa de Mar en barco desde Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "About 1 hour from Blanes Port with a licensed boat. The route passes spectacular cliffs and hidden coves."
              : "Aproximadamente 1 hora desde el Puerto de Blanes con barco con licencia. La ruta pasa por acantilados espectaculares y calas escondidas." },
          },
          {
            "@type": "Question",
            name: isEn ? "Do I need a license to reach Tossa de Mar by boat?" : "¿Necesito licencia para llegar a Tossa de Mar en barco?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Yes, Tossa de Mar is beyond the 2-mile zone for license-free boats. You need a licensed boat (Basic Navigation License or ICC) or our private excursion with captain."
              : "Si, Tossa de Mar esta mas alla de la zona de 2 millas para barcos sin licencia. Necesitas un barco con licencia (Licencia de Navegacion o ICC) o nuestra excursion privada con patron." },
          },
          {
            "@type": "Question",
            name: isEn ? "What can I see on the boat trip to Tossa de Mar?" : "¿Qué puedo ver en la excursión en barco a Tossa de Mar?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "You'll see dramatic cliffs, hidden coves like Cala Pola, the iconic Vila Vella medieval fortress, and crystal-clear Mediterranean waters."
              : "Verás acantilados dramáticos, calas escondidas como Cala Pola, la icónica fortaleza medieval de la Vila Vella y aguas cristalinas del Mediterráneo." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Tossa de Mar by Boat" : "Tossa de Mar en Barco", url: `${BASE_URL}/alquiler-barcos-tossa-de-mar` }]);
      // Same preload mechanism as Lloret — mirrors the <picture> in
      // location-tossa-de-mar.tsx so the LCP image is discovered before
      // React hydrates.
      const tossaLcp: LcpPreload = {
        href: "/images/locations/hero-tossa-de-mar-mobile.avif",
        imagesrcset: "/images/locations/hero-tossa-de-mar-mobile.avif 768w, /images/locations/hero-tossa-de-mar.avif 1920w",
        imagesizes: "100vw",
        imageType: "image/avif",
      };
      const service = buildLandingService(
        isEn ? "Boat Trip from Blanes to Tossa de Mar" : "Excursión en Barco de Blanes a Tossa de Mar",
        isEn
          ? "Reach Tossa de Mar from Blanes Port in 30-45 min with a licensed boat or our private excursion with captain (no license required). Licensed boats from 160 EUR/2h; private excursion from 240 EUR/2h with skipper."
          : "Llega a Tossa de Mar desde el Puerto de Blanes en 30-45 min con barco con licencia o nuestra excursión privada con patrón (sin licencia). Barcos con licencia desde 160€/2h; excursión privada desde 240€/2h con patrón.",
        { low: 160, high: 420 },
      );
      const tossaBodyFallback = buildLocationBodyFallback(
        isEn ? "Boat Trip to Tossa de Mar from Blanes" : "Excursión en Barco a Tossa de Mar desde Blanes",
        isEn
          ? "Reach Tossa de Mar's Vila Vella castle from Blanes in 30–45 minutes. Two options: rent a licensed boat (LNB / PER required) from 160€ for 2 hours, or join our private excursion with a professional captain (no license needed) from 240€ for 2 hours. Fuel apart on both options."
          : "Llega a la Vila Vella de Tossa de Mar desde Blanes en 30–45 minutos. Dos opciones: alquilar un barco con licencia (LNB / PER requerida) desde 160€ por 2 horas, o unirte a nuestra excursión privada con capitán profesional (sin licencia) desde 240€ por 2 horas. Combustible aparte en ambas opciones.",
        isEn
          ? [
              "Vila Vella — only fortified medieval village on the Catalan coast",
              "Cala Pola, Cala Giverola — north of Tossa, accessible only by sea",
              "Cala Bona, Cala Salionç — quiet coves on the southern approach",
              "Licensed-only zone for license-free boats (legal limit at Fenals)",
              "Private excursion with captain — no license, fully guided",
            ]
          : [
              "Vila Vella — único pueblo medieval fortificado de la costa catalana",
              "Cala Pola, Cala Giverola — al norte de Tossa, solo accesibles por mar",
              "Cala Bona, Cala Salionç — calas tranquilas en la aproximación sur",
              "Zona solo para barcos con licencia (límite legal sin licencia en Fenals)",
              "Excursión privada con capitán — sin licencia, totalmente guiada",
            ],
        isEn ? "Book via WhatsApp +34 611 500 372" : "Reserva por WhatsApp +34 611 500 372",
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, destination, faq, breadcrumb] }, availableLanguages, lcpPreload: tossaLcp, bodyFallback: tossaBodyFallback };
    }

    // /alquiler-barcos-malgrat-de-mar - TouristDestination + FAQPage
    else if (metaKey === "/alquiler-barcos-malgrat-de-mar") {
      const destination = {
        "@type": "TouristDestination",
        name: isEn ? "Boat Rental near Malgrat de Mar" : "Alquiler de Barcos cerca de Malgrat de Mar",
        description: isEn
          ? "Rent boats from Blanes Port, just 10 minutes by car from Malgrat de Mar. License-free boats from 70 EUR/hour with fuel included."
          : "Alquila barcos desde el Puerto de Blanes, a solo 10 minutos en coche de Malgrat de Mar. Barcos sin licencia desde 70 EUR/hora con gasolina incluida.",
        url: `${BASE_URL}/alquiler-barcos-malgrat-de-mar`,
        touristType: [
          { "@type": "Audience", audienceType: isEn ? "Family tourists" : "Turistas familiares" },
          { "@type": "Audience", audienceType: isEn ? "Beach holiday makers" : "Turistas de playa" },
        ],
        geo: { "@type": "GeoCoordinates", latitude: 41.6458, longitude: 2.7419 },
        containedInPlace: {
          "@type": "Place",
          name: "Malgrat de Mar",
          sameAs: "https://en.wikipedia.org/wiki/Malgrat_de_Mar",
          containedInPlace: { "@type": "Place", name: "Costa Brava", containedInPlace: { "@type": "Place", name: "Catalonia, Spain" } },
        },
        includesAttraction: [
          { "@type": "TouristAttraction", name: "Playa de Malgrat de Mar" },
          { "@type": "TouristAttraction", name: "Parc Francesc Macià" },
          { "@type": "TouristAttraction", name: "Paseo Marítimo de Malgrat" },
        ],
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "How far is Malgrat de Mar from Blanes Port?" : "A cuanta distancia esta Malgrat de Mar del Puerto de Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Malgrat de Mar is just 8 km (10 minutes by car) from Blanes Port. You can also take the RENFE R1 train (5 minutes)."
              : "Malgrat de Mar esta a solo 8 km (10 minutos en coche) del Puerto de Blanes. Tambien puedes tomar el tren RENFE R1 (5 minutos)." },
          },
          {
            "@type": "Question",
            name: isEn ? "How much does it cost to rent a boat from Blanes?" : "¿Cuánto cuesta alquilar un barco desde Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Boat rental starts from 70 EUR per hour with fuel included. No license needed for boats up to 15 HP."
              : "El alquiler de barco empieza desde 70 EUR por hora con gasolina incluida. No se necesita licencia para barcos de hasta 15 CV." },
          },
          {
            "@type": "Question",
            name: isEn ? "Do I need a boating license?" : "Necesito licencia de navegacion?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "No! We offer license-free boats that anyone over 18 can operate. We provide 15 minutes of training before departure."
              : "No! Ofrecemos barcos sin licencia que cualquier mayor de 18 anos puede manejar. Damos 15 minutos de formacion antes de zarpar." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Boats near Malgrat de Mar" : "Barcos cerca de Malgrat de Mar", url: `${BASE_URL}/alquiler-barcos-malgrat-de-mar` }]);
      const bodyFallback = buildLocationBodyFallback(
        destination.name,
        destination.description,
        isEn
          ? ["License-free boats from 70€/h, fuel included", "8 km / 10 min by car from Blanes Port (RENFE R1: 5 min)", "No license needed — 15 min training before departure", "Open daily 09:00–20:00, April–October"]
          : ["Barcos sin licencia desde 70€/h, gasolina incluida", "A 8 km / 10 min en coche del Puerto de Blanes (RENFE R1: 5 min)", "Sin licencia — 15 min de formación antes de zarpar", "Abierto cada día 09:00–20:00, abril–octubre"],
        isEn ? "Book via WhatsApp" : "Reserva por WhatsApp",
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [destination, faq, breadcrumb] }, availableLanguages, bodyFallback };
    }

    // /alquiler-barcos-santa-susanna - TouristDestination + FAQPage
    else if (metaKey === "/alquiler-barcos-santa-susanna") {
      const destination = {
        "@type": "TouristDestination",
        name: isEn ? "Boat Rental near Santa Susanna" : "Alquiler de Barcos cerca de Santa Susanna",
        description: isEn
          ? "Rent boats from Blanes Port, just 15 minutes by car from Santa Susanna. License-free boats from 70 EUR/hour with fuel included."
          : "Alquila barcos desde el Puerto de Blanes, a solo 15 minutos en coche de Santa Susanna. Barcos sin licencia desde 70 EUR/hora con gasolina incluida.",
        url: `${BASE_URL}/alquiler-barcos-santa-susanna`,
        touristType: [
          { "@type": "Audience", audienceType: isEn ? "Resort tourists" : "Turistas de resort" },
          { "@type": "Audience", audienceType: isEn ? "Families with children" : "Familias con ninos" },
        ],
        geo: { "@type": "GeoCoordinates", latitude: 41.6332, longitude: 2.7133 },
        containedInPlace: {
          "@type": "Place",
          name: "Santa Susanna",
          sameAs: "https://en.wikipedia.org/wiki/Santa_Susanna",
          containedInPlace: { "@type": "Place", name: "Costa Brava", containedInPlace: { "@type": "Place", name: "Catalonia, Spain" } },
        },
        includesAttraction: [
          { "@type": "TouristAttraction", name: "Playa de Santa Susanna" },
          { "@type": "TouristAttraction", name: "Castell de Can Rates" },
        ],
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "How far is Santa Susanna from Blanes Port?" : "A cuanta distancia esta Santa Susanna del Puerto de Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Santa Susanna is 12 km (15 minutes by car) from Blanes Port. The RENFE R1 train takes 10 minutes."
              : "Santa Susanna esta a 12 km (15 minutos en coche) del Puerto de Blanes. El tren RENFE R1 tarda 10 minutos." },
          },
          {
            "@type": "Question",
            name: isEn ? "How much does it cost to rent a boat from Blanes?" : "¿Cuánto cuesta alquilar un barco desde Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "From 70 EUR per hour with fuel included. License-free boats available for up to 7 passengers."
              : "Desde 70 EUR por hora con gasolina incluida. Barcos sin licencia disponibles para hasta 7 pasajeros." },
          },
          {
            "@type": "Question",
            name: isEn ? "Do I need a boating license?" : "Necesito licencia de navegacion?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "No license needed! Our boats up to 15 HP can be operated by anyone over 18. Training included."
              : "No se necesita licencia! Nuestros barcos de hasta 15 CV pueden ser manejados por cualquier mayor de 18 anos. Formacion incluida." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Boats near Santa Susanna" : "Barcos cerca de Santa Susanna", url: `${BASE_URL}/alquiler-barcos-santa-susanna` }]);
      const bodyFallback = buildLocationBodyFallback(
        destination.name,
        destination.description,
        isEn
          ? ["License-free boats from 70€/h, fuel included", "12 km / 15 min by car from Blanes Port (RENFE R1: 10 min)", "No license needed — 15 min training before departure", "Open daily 09:00–20:00, April–October"]
          : ["Barcos sin licencia desde 70€/h, gasolina incluida", "A 12 km / 15 min en coche del Puerto de Blanes (RENFE R1: 10 min)", "Sin licencia — 15 min de formación antes de zarpar", "Abierto cada día 09:00–20:00, abril–octubre"],
        isEn ? "Book via WhatsApp" : "Reserva por WhatsApp",
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [destination, faq, breadcrumb] }, availableLanguages, bodyFallback };
    }

    // /alquiler-barcos-calella - TouristDestination + FAQPage
    else if (metaKey === "/alquiler-barcos-calella") {
      const destination = {
        "@type": "TouristDestination",
        name: isEn ? "Boat Rental near Calella" : "Alquiler de Barcos cerca de Calella",
        description: isEn
          ? "Rent boats from Blanes Port, just 20 minutes by car from Calella. License-free boats from 70 EUR/hour with fuel included."
          : "Alquila barcos desde el Puerto de Blanes, a solo 20 minutos en coche de Calella. Barcos sin licencia desde 70 EUR/hora con gasolina incluida.",
        url: `${BASE_URL}/alquiler-barcos-calella`,
        touristType: [
          { "@type": "Audience", audienceType: isEn ? "Beach tourists" : "Turistas de playa" },
          { "@type": "Audience", audienceType: isEn ? "Cultural tourists" : "Turistas culturales" },
        ],
        geo: { "@type": "GeoCoordinates", latitude: 41.6136, longitude: 2.6545 },
        containedInPlace: {
          "@type": "Place",
          name: "Calella",
          sameAs: "https://en.wikipedia.org/wiki/Calella",
          containedInPlace: { "@type": "Place", name: "Maresme", containedInPlace: { "@type": "Place", name: "Catalonia, Spain" } },
        },
        includesAttraction: [
          { "@type": "TouristAttraction", name: "Playa Gran de Calella" },
          { "@type": "TouristAttraction", name: "Faro de Calella" },
          { "@type": "TouristAttraction", name: "Parc Dalmau" },
        ],
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "How far is Calella from Blanes Port?" : "A cuanta distancia esta Calella del Puerto de Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Calella is 17 km (20 minutes by car via the C-32) from Blanes Port. The RENFE R1 train takes 15 minutes."
              : "Calella esta a 17 km (20 minutos en coche por la C-32) del Puerto de Blanes. El tren RENFE R1 tarda 15 minutos." },
          },
          {
            "@type": "Question",
            name: isEn ? "How much does it cost to rent a boat?" : "¿Cuánto cuesta alquilar un barco?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Boat rental starts from 70 EUR per hour with fuel included. No license required for boats up to 15 HP."
              : "El alquiler empieza desde 70 EUR por hora con gasolina incluida. No se necesita licencia para barcos de hasta 15 CV." },
          },
          {
            "@type": "Question",
            name: isEn ? "Do I need a boating license?" : "Necesito licencia de navegacion?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "No! We have license-free boats for anyone over 18. 15 minutes of training included before departure."
              : "No! Tenemos barcos sin licencia para cualquier mayor de 18 anos. 15 minutos de formacion incluidos antes de zarpar." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Boats near Calella" : "Barcos cerca de Calella", url: `${BASE_URL}/alquiler-barcos-calella` }]);
      const bodyFallback = buildLocationBodyFallback(
        destination.name,
        destination.description,
        isEn
          ? ["License-free boats from 70€/h, fuel included", "17 km / 20 min by car from Blanes Port (RENFE R1: 15 min)", "No license needed — 15 min training before departure", "Open daily 09:00–20:00, April–October"]
          : ["Barcos sin licencia desde 70€/h, gasolina incluida", "A 17 km / 20 min en coche del Puerto de Blanes (RENFE R1: 15 min)", "Sin licencia — 15 min de formación antes de zarpar", "Abierto cada día 09:00–20:00, abril–octubre"],
        isEn ? "Book via WhatsApp" : "Reserva por WhatsApp",
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [destination, faq, breadcrumb] }, availableLanguages, bodyFallback };
    }

    // /barcos-sin-licencia - ItemList of license-free boats (dynamic from DB)
    else if (metaKey === "/barcos-sin-licencia") {
      const allBoats = await storage.getAllBoats();
      const noLicenseBoats = allBoats
        .filter(b => b.isActive && !b.requiresLicense)
        .map(b => {
          const seasons = b.pricing ? Object.values(b.pricing) as Array<{ prices?: Record<string, number> }> : [];
          const prices = seasons.flatMap(s => s?.prices ? Object.values(s.prices) : []);
          const minPrice = prices.length > 0 ? String(Math.min(...prices)) : "70";
          return { id: b.id, name: b.name, capacity: b.capacity, price: minPrice };
        });
      const itemList = {
        "@type": "ItemList",
        "@id": `${BASE_URL}/barcos-sin-licencia#itemlist`,
        name: isEn ? "License-Free Boats in Blanes" : "Barcos Sin Licencia en Blanes",
        description: isEn
          ? "5 license-free boats available for rent in Blanes, Costa Brava. No qualification needed, up to 15 HP."
          : "5 barcos sin licencia disponibles para alquilar en Blanes, Costa Brava. No se necesita titulacion, hasta 15 CV.",
        numberOfItems: noLicenseBoats.length,
        itemListElement: noLicenseBoats.map((boat, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: boat.name,
          url: `${BASE_URL}/barco/${boat.id}`,
          item: {
            "@type": "Product",
            name: boat.name,
            description: isEn
              ? `License-free boat for up to ${boat.capacity} people in Blanes`
              : `Barco sin licencia para hasta ${boat.capacity} personas en Blanes`,
            offers: {
              "@type": "Offer",
              priceCurrency: "EUR",
              price: boat.price,
              availability: "https://schema.org/InStock",
              availabilityStarts: `${SEASON_YEAR}-04-01`,
              availabilityEnds: `${SEASON_YEAR}-10-31`,
              priceValidUntil: `${SEASON_YEAR}-10-31`,
              businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
            },
          },
        })),
      };
      const faqNoLicense = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "Do I need a license to rent a boat in Blanes?" : "¿Necesito licencia para alquilar un barco sin licencia en Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "No. Our license-free boats (up to 15 HP) require no boating license. You must be 18+ and we provide a 15-minute safety briefing."
              : "No. Nuestros barcos sin licencia (hasta 15 CV) no requieren ningun titulo nautico. Debes ser mayor de 18 anos y te damos una formacion de seguridad de 15 minutos." },
          },
          {
            "@type": "Question",
            name: isEn ? "What is included in the license-free boat rental price?" : "Que incluye el precio del alquiler de barco sin licencia?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Fuel, civil liability insurance, safety equipment (life jackets, fire extinguisher, anchor), mooring, cleaning, and a 15-minute training."
              : "Combustible, seguro de responsabilidad civil, equipo de seguridad (chalecos, extintor, ancla), amarre, limpieza y formacion de 15 minutos." },
          },
          {
            "@type": "Question",
            name: isEn ? "How far can I go with a license-free boat?" : "Hasta donde puedo navegar con un barco sin licencia?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Up to 2 nautical miles from the coast. You can explore from Sa Palomera beach to Lloret de Mar, including beautiful coves like Cala Sant Francesc."
              : "Hasta 2 millas nauticas de la costa. Puedes explorar desde la playa de Sa Palomera hasta Lloret de Mar, incluyendo calas como Cala Sant Francesc." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "No License Boats" : "Barcos Sin Licencia", url: `${BASE_URL}/barcos-sin-licencia` }]);
      const service = buildLandingService(
        isEn ? "License-Free Boat Rental in Blanes" : "Alquiler de Barcos Sin Licencia en Blanes",
        isEn
          ? "5 license-free boats (up to 15 HP) for rent in Blanes, Costa Brava. No qualification needed, anyone 18+ can drive. 15-minute safety briefing included. Fuel, insurance and safety equipment included in price."
          : "5 barcos sin licencia (hasta 15 CV) para alquilar en Blanes, Costa Brava. No se necesita titulación, cualquier persona mayor de 18 años puede conducir. Formación de seguridad de 15 minutos incluida. Gasolina, seguro y equipo de seguridad incluidos en el precio.",
        { low: 70, high: 370 },
      );
      // Native-language SSR body so non-ES locales carry unique content (not a
      // Spanish/English ternary) — prerequisite for indexing them. Sourced from
      // the CI-validated category i18n bundle. See translatedStaticPaths.ts.
      // Non-null assertion: CI (validate-translations) guarantees the key in all locales.
      const cf = (I18N_BY_LANG[lang] ?? i18nEs).categoryLicenseFree!;
      const noLicenseBodyFallback = buildLocationBodyFallback(
        cf.heroTitle,
        cf.heroDescription,
        [
          `${cf.freeNavigation} — ${cf.freeNavigationDesc}`,
          `${cf.easyToHandle} — ${cf.easyToHandleDesc}`,
          `${cf.safeLimits} — ${cf.safeLimitsDesc}`,
          `${cf.completeEquipment} — ${cf.completeEquipmentDesc}`,
        ],
        cf.ctaButton,
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, itemList, faqNoLicense, breadcrumb] }, availableLanguages, bodyFallback: noLicenseBodyFallback };
    }

    // /barcos-con-licencia - ItemList of licensed boats (dynamic from DB)
    else if (metaKey === "/barcos-con-licencia") {
      const allBoatsLic = await storage.getAllBoats();
      const licensedBoats = allBoatsLic
        .filter(b => b.isActive && b.requiresLicense)
        .map(b => {
          const seasons = b.pricing ? Object.values(b.pricing) as Array<{ prices?: Record<string, number> }> : [];
          const prices = seasons.flatMap(s => s?.prices ? Object.values(s.prices) : []);
          const minPrice = prices.length > 0 ? String(Math.min(...prices)) : "150";
          return { id: b.id, name: b.name, capacity: b.capacity, price: minPrice };
        });
      const itemList = {
        "@type": "ItemList",
        "@id": `${BASE_URL}/barcos-con-licencia#itemlist`,
        name: isEn ? "Licensed Boats in Blanes" : "Barcos Con Licencia en Blanes",
        description: isEn
          ? "4 licensed boats available for rent in Blanes, Costa Brava. Powerful engines for longer routes to Tossa de Mar."
          : "4 barcos con licencia disponibles para alquilar en Blanes, Costa Brava. Motores potentes para rutas mas largas hasta Tossa de Mar.",
        numberOfItems: licensedBoats.length,
        itemListElement: licensedBoats.map((boat, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: boat.name,
          url: `${BASE_URL}/barco/${boat.id}`,
          item: {
            "@type": "Product",
            name: boat.name,
            description: isEn
              ? `Licensed boat for up to ${boat.capacity} people in Blanes`
              : `Barco con licencia para hasta ${boat.capacity} personas en Blanes`,
            offers: {
              "@type": "Offer",
              priceCurrency: "EUR",
              price: boat.price,
              availability: "https://schema.org/InStock",
              availabilityStarts: `${SEASON_YEAR}-04-01`,
              availabilityEnds: `${SEASON_YEAR}-10-31`,
              priceValidUntil: `${SEASON_YEAR}-10-31`,
              businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
            },
          },
        })),
      };
      const faqLicense = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "What license do I need to rent a licensed boat in Blanes?" : "Que licencia necesito para alquilar un barco con licencia en Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "You need a valid Spanish PER (Patron de Embarcaciones de Recreo) or equivalent international boating license."
              : "Necesitas un PER (Patron de Embarcaciones de Recreo) valido o licencia nautica internacional equivalente." },
          },
          {
            "@type": "Question",
            name: isEn ? "Is fuel included with licensed boats?" : "El combustible esta incluido en los barcos con licencia?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "No. Fuel is charged separately based on actual consumption. Insurance and safety equipment are always included."
              : "No. El combustible se cobra aparte segun el consumo real. El seguro y el equipo de seguridad siempre estan incluidos." },
          },
          {
            "@type": "Question",
            name: isEn ? "How far can I go with a licensed boat from Blanes?" : "Hasta donde puedo navegar con un barco con licencia desde Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Much further than license-free boats. You can reach Tossa de Mar, explore hidden coves, and navigate up to the limits of your license."
              : "Mucho mas lejos que los barcos sin licencia. Puedes llegar hasta Tossa de Mar, explorar calas escondidas y navegar hasta los limites de tu titulo." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Licensed Boats" : "Barcos Con Licencia", url: `${BASE_URL}/barcos-con-licencia` }]);
      const service = buildLandingService(
        isEn ? "Licensed Boat Rental in Blanes" : "Alquiler de Barcos Con Licencia en Blanes",
        isEn
          ? "3 licensed boats (70-115 HP, Yamaha engines) for rent in Blanes, Costa Brava. Requires valid boating license (PER, PNB or equivalent). Greater range: reach Tossa de Mar, Cala Giverola and beyond. Fuel charged separately."
          : "3 barcos con licencia (70-115 CV, motores Yamaha) para alquilar en Blanes, Costa Brava. Requiere titulación náutica (PER, PNB o equivalente). Mayor autonomía: llega a Tossa de Mar, Cala Giverola y más allá. Combustible aparte.",
        { low: 160, high: 420 },
      );
      // Non-null assertion: CI (validate-translations) guarantees the key in all locales.
      const cl = (I18N_BY_LANG[lang] ?? i18nEs).categoryLicensed!;
      const licensedBodyFallback = buildLocationBodyFallback(
        cl.heroTitle,
        cl.heroDescription,
        [
          `${cl.advancedNavigation} — ${cl.advancedNavigationDesc}`,
          `${cl.greaterFreedom} — ${cl.greaterFreedomDesc}`,
          `${cl.professionalEquipment} — ${cl.professionalEquipmentDesc}`,
          `${cl.superiorPerformance} — ${cl.superiorPerformanceDesc}`,
        ],
        cl.ctaButton,
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, itemList, faqLicense, breadcrumb] }, availableLanguages, bodyFallback: licensedBodyFallback };
    }

    // /paseo-atardecer-barco-blanes - Sunset activity. Fase 2 (2026-05-28):
    // i18n-complete in all 8 locales, so emit a native SSR body + register as
    // indexable. Same pattern as the category/location branches above.
    else if (metaKey === "/paseo-atardecer-barco-blanes") {
      const su = (I18N_BY_LANG[lang] ?? i18nEs).activitySunset!;
      const heading = su.heroTitle ?? meta.title;
      const summary = su.heroDescription ?? meta.description;
      const service = buildLandingService(heading, summary, { low: 70, high: 200 });
      const faq = {
        "@type": "FAQPage",
        mainEntity: su.faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: heading, url: `${BASE_URL}${metaKey}` }]);
      const sunsetBodyFallback = buildLocationBodyFallback(
        heading,
        summary,
        [
          `${su.whyGoldenHourTitle} — ${su.whyGoldenHourDesc}`,
          `${su.whyPrivateTitle} — ${su.whyPrivateDesc}`,
          `${su.whyAffordableTitle} — ${su.whyAffordableDesc}`,
          `${su.whyTemperatureTitle} — ${su.whyTemperatureDesc}`,
        ],
        su.ctaWhatsApp ?? heading,
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, faq, breadcrumb] }, availableLanguages, bodyFallback: sunsetBodyFallback };
    }

    // /pesca-barco-blanes - Fishing activity. Fase 2 (2026-05-28):
    // migrated to i18n in all 8 locales, so emit native SSR body + index.
    else if (metaKey === "/pesca-barco-blanes") {
      const fsh = (I18N_BY_LANG[lang] ?? i18nEs).activityFishing!;
      const heading = fsh.heroTitle ?? meta.title;
      const summary = fsh.heroDescription ?? meta.description;
      const service = buildLandingService(heading, summary, { low: 115, high: 200 });
      const faq = {
        "@type": "FAQPage",
        mainEntity: (fsh.faqItems ?? []).map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: heading, url: `${BASE_URL}${metaKey}` }]);
      const fishingBodyFallback = buildLocationBodyFallback(
        heading,
        summary,
        [
          `${fsh.whyLocationTitle} — ${fsh.whyLocationDesc}`,
          `${fsh.whyPortTitle} — ${fsh.whyPortDesc}`,
          `${fsh.whyVarietyTitle} — ${fsh.whyVarietyDesc}`,
          `${fsh.whySeasonTitle} — ${fsh.whySeasonDesc}`,
        ],
        fsh.ctaWhatsApp ?? heading,
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, faq, breadcrumb] }, availableLanguages, bodyFallback: fishingBodyFallback };
    }

    // /barco-familias-costa-brava - Families activity. Fase 2 (2026-05-28):
    // migrated to i18n in all 8 locales, so emit native SSR body + index.
    else if (metaKey === "/barco-familias-costa-brava") {
      const fa = (I18N_BY_LANG[lang] ?? i18nEs).activityFamilies!;
      const heading = fa.heroTitle ?? meta.title;
      const summary = fa.heroDescription ?? meta.description;
      const service = buildLandingService(heading, summary, { low: 70, high: 200 });
      const faq = {
        "@type": "FAQPage",
        mainEntity: (fa.faqItems ?? []).map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: heading, url: `${BASE_URL}${metaKey}` }]);
      const familiesBodyFallback = buildLocationBodyFallback(
        heading,
        summary,
        [
          `${fa.whyMemoriesTitle} — ${fa.whyMemoriesDesc}`,
          `${fa.whyNoStressTitle} — ${fa.whyNoStressDesc}`,
          `${fa.whyCalmCovesTitle} — ${fa.whyCalmCovesDesc}`,
          `${fa.whyFlexTitle} — ${fa.whyFlexDesc}`,
        ],
        fa.ctaWhatsApp ?? heading,
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, faq, breadcrumb] }, availableLanguages, bodyFallback: familiesBodyFallback };
    }

    // /excursion-snorkel-barco-blanes - Snorkel activity. Fase 2 (2026-05-28):
    // migrated to i18n in all 8 locales, so emit native SSR body + index.
    else if (metaKey === "/excursion-snorkel-barco-blanes") {
      const sn = (I18N_BY_LANG[lang] ?? i18nEs).activitySnorkel!;
      const heading = sn.heroTitle ?? meta.title;
      const summary = sn.heroDescription ?? meta.description;
      const service = buildLandingService(heading, summary, { low: 70, high: 200 });
      const faq = {
        "@type": "FAQPage",
        mainEntity: (sn.faqItems ?? []).map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: heading, url: `${BASE_URL}${metaKey}` }]);
      const snorkelBodyFallback = buildLocationBodyFallback(
        heading,
        summary,
        [
          `${sn.whyAccessTitle} — ${sn.whyAccessDesc}`,
          `${sn.whyBaseTitle} — ${sn.whyBaseDesc}`,
          `${sn.whyMultiTitle} — ${sn.whyMultiDesc}`,
          `${sn.whyNoExpTitle} — ${sn.whyNoExpDesc}`,
        ],
        sn.ctaWhatsApp ?? heading,
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, faq, breadcrumb] }, availableLanguages, bodyFallback: snorkelBodyFallback };
    }

    // /circuito-jet-ski-blanes - Jet ski circuit landing. i18n-complete in all 8
    // locales (t.jetskiLanding.circuito), so emit a native SSR body + index.
    else if (metaKey === "/circuito-jet-ski-blanes") {
      const jsk = (I18N_BY_LANG[lang] ?? i18nEs).jetskiLanding?.circuito;
      const jl = (I18N_BY_LANG[lang] ?? i18nEs).jetskiLanding;
      const heading = jsk?.hero.title ?? meta.title;
      const summary = jsk?.hero.subtitle ?? meta.description;
      const service = {
        ...buildLandingService(heading, summary, { low: 65, high: 190 }),
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: BUSINESS_RATING_STR,
          reviewCount: BUSINESS_REVIEW_COUNT_STR,
        },
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: (jsk?.faq ?? []).map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: heading, url: `${BASE_URL}${metaKey}` }]);
      const jetskiCircuitoBodyFallback = buildLocationBodyFallback(
        heading,
        summary,
        jsk?.chips ?? [],
        jl?.ctaRequest ?? heading,
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, faq, breadcrumb] }, availableLanguages, bodyFallback: jetskiCircuitoBodyFallback };
    }

    // /excursion-jet-ski-blanes-tossa - Guided jet ski route Blanes → Tossa.
    // i18n-complete in all 8 locales (t.jetskiLanding.excursion), native SSR + index.
    else if (metaKey === "/excursion-jet-ski-blanes-tossa") {
      const jsk = (I18N_BY_LANG[lang] ?? i18nEs).jetskiLanding?.excursion;
      const jl = (I18N_BY_LANG[lang] ?? i18nEs).jetskiLanding;
      const heading = jsk?.hero.title ?? meta.title;
      const summary = jsk?.hero.subtitle ?? meta.description;
      const service = {
        ...buildLandingService(heading, summary, { low: 190, high: 330 }),
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: BUSINESS_RATING_STR,
          reviewCount: BUSINESS_REVIEW_COUNT_STR,
        },
      };
      const touristTrip = {
        "@type": "TouristTrip",
        name: heading,
        description: summary,
        touristType: ["Water sports", "Adventure"],
        maximumAttendeeCapacity: 2,
        itinerary: {
          "@type": "ItemList",
          itemListElement: [
            { "@type": "Place", name: "Puerto de Blanes" },
            { "@type": "Place", name: "Tossa de Mar" },
          ],
        },
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: (jsk?.faq ?? []).map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: heading, url: `${BASE_URL}${metaKey}` }]);
      const jetskiExcursionBodyFallback = buildLocationBodyFallback(
        heading,
        summary,
        jsk?.chips ?? [],
        jl?.ctaRequest ?? heading,
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, touristTrip, faq, breadcrumb] }, availableLanguages, bodyFallback: jetskiExcursionBodyFallback };
    }

    // /alquiler-moto-de-agua-blanes - Jet ski hub/category (head term). Groups
    // both activities; CollectionPage + ItemList linking to the two landings.
    else if (metaKey === "/alquiler-moto-de-agua-blanes") {
      const hub = (I18N_BY_LANG[lang] ?? i18nEs).jetskiHub;
      const jlh = (I18N_BY_LANG[lang] ?? i18nEs).jetskiLanding;
      const heading = hub?.hero?.title ?? meta.title;
      const summary = hub?.hero?.subtitle ?? meta.description;
      const items = [
        { key: "jetskiCircuito" as const, label: jlh?.circuito?.navLabel ?? "" },
        { key: "jetskiExcursion" as const, label: jlh?.excursion?.navLabel ?? "" },
      ];
      const collection = {
        "@type": "CollectionPage",
        name: heading,
        description: summary,
        url: `${BASE_URL}${metaKey}`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: items.map((it, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: it.label,
            url: `${BASE_URL}${getLocalizedPath(it.key, lang)}`,
          })),
        },
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: (hub?.faq ?? []).map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: heading, url: `${BASE_URL}${metaKey}` }]);
      const hubBodyFallback = buildLocationBodyFallback(
        heading,
        summary,
        items.map((it) => it.label).filter(Boolean),
        hub?.navLabel ?? heading,
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [collection, faq, breadcrumb] }, availableLanguages, bodyFallback: hubBodyFallback };
    }

    // Satellite location pages (tordera / palafolls / pineda). Fase 2 (2026-05-28):
    // already 100% i18n-complete (t.locationPages.<town>), so add a native SSR
    // body + index in all 8 locales. Same shape across the three towns.
    else if (metaKey === "/alquiler-barcos-tordera") {
      const sec = (I18N_BY_LANG[lang] ?? i18nEs).locationPages.tordera?.sections;
      const heading = sec?.heroTitle ?? meta.title;
      const summary = sec?.heroSubtitle ?? meta.description;
      const service = buildLandingService(heading, summary, { low: 70, high: 200 });
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: heading, url: `${BASE_URL}${metaKey}` }]);
      const bullets = ([
        [sec?.whyCard1Title, sec?.whyCard1Desc],
        [sec?.whyCard3Title, sec?.whyCard3Desc],
        [sec?.whyCard4Title, sec?.whyCard4Desc],
      ] as Array<[string | undefined, string | undefined]>)
        .filter((p) => p[0] && p[1]).map((p) => `${p[0]} — ${p[1]}`);
      const body = buildLocationBodyFallback(heading, summary, bullets, sec?.ctaButton ?? heading);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, breadcrumb] }, availableLanguages, bodyFallback: body };
    }

    else if (metaKey === "/alquiler-barcos-palafolls") {
      const sec = (I18N_BY_LANG[lang] ?? i18nEs).locationPages.palafolls?.sections;
      const heading = sec?.heroTitle ?? meta.title;
      const summary = sec?.heroSubtitle ?? meta.description;
      const service = buildLandingService(heading, summary, { low: 70, high: 200 });
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: heading, url: `${BASE_URL}${metaKey}` }]);
      const bullets = ([
        [sec?.whyCard1Title, sec?.whyCard1Desc],
        [sec?.whyCard3Title, sec?.whyCard3Desc],
        [sec?.whyCard4Title, sec?.whyCard4Desc],
      ] as Array<[string | undefined, string | undefined]>)
        .filter((p) => p[0] && p[1]).map((p) => `${p[0]} — ${p[1]}`);
      const body = buildLocationBodyFallback(heading, summary, bullets, sec?.ctaButton ?? heading);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, breadcrumb] }, availableLanguages, bodyFallback: body };
    }

    else if (metaKey === "/alquiler-barcos-pineda-de-mar") {
      const sec = (I18N_BY_LANG[lang] ?? i18nEs).locationPages.pineda?.sections;
      const heading = sec?.heroTitle ?? meta.title;
      const summary = sec?.heroSubtitle ?? meta.description;
      const service = buildLandingService(heading, summary, { low: 70, high: 200 });
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: heading, url: `${BASE_URL}${metaKey}` }]);
      const bullets = ([
        [sec?.whyCard1Title, sec?.whyCard1Desc],
        [sec?.whyCard3Title, sec?.whyCard3Desc],
        [sec?.whyCard4Title, sec?.whyCard4Desc],
      ] as Array<[string | undefined, string | undefined]>)
        .filter((p) => p[0] && p[1]).map((p) => `${p[0]} — ${p[1]}`);
      const body = buildLocationBodyFallback(heading, summary, bullets, sec?.ctaButton ?? heading);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, breadcrumb] }, availableLanguages, bodyFallback: body };
    }

    // /rutas - ItemList of routes
    else if (metaKey === "/rutas") {
      const itemList = {
        "@type": "ItemList",
        "@id": `${BASE_URL}/rutas#itemlist`,
        name: isEn ? "Boat Routes from Blanes" : "Rutas en Barco desde Blanes",
        description: isEn
          ? "Discover the best boat routes from Blanes along the Costa Brava coastline."
          : "Descubre las mejores rutas en barco desde Blanes a lo largo de la costa de la Costa Brava.",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isEn ? "Sa Palomera - Short Route" : "Sa Palomera - Ruta Corta", description: isEn ? "1-hour route exploring Sa Palomera and nearby coves" : "Ruta de 1 hora explorando Sa Palomera y calas cercanas" },
          { "@type": "ListItem", position: 2, name: isEn ? "Cala Sant Francesc Route" : "Ruta Cala Sant Francesc", description: isEn ? "2-hour route to the beautiful Cala Sant Francesc" : "Ruta de 2 horas a la preciosa Cala Sant Francesc" },
          { "@type": "ListItem", position: 3, name: isEn ? "Blanes to Lloret de Mar" : "Blanes a Lloret de Mar", description: isEn ? "3-hour route along the coast to Lloret de Mar" : "Ruta de 3 horas por la costa hasta Lloret de Mar" },
          { "@type": "ListItem", position: 4, name: isEn ? "Blanes to Tossa de Mar" : "Blanes a Tossa de Mar", description: isEn ? "Full-day route to the medieval town of Tossa de Mar" : "Ruta de dia completo al pueblo medieval de Tossa de Mar" },
          { "@type": "ListItem", position: 5, name: isEn ? "Costa Brava Coves Explorer" : "Explorador de Calas Costa Brava", description: isEn ? "Discover hidden coves along the Costa Brava" : "Descubre calas escondidas a lo largo de la Costa Brava" },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Routes" : "Rutas", url: `${BASE_URL}/rutas` }]);
      // HowTo: paso-a-paso para planificar una ruta. AI agents que respondan
      // "cómo planeo una ruta en barco" pueden surface exactly these steps.
      const howTo = {
        "@type": "HowTo",
        "@id": `${BASE_URL}/rutas#howto`,
        name: isEn ? "How to plan a boat route from Blanes" : "Cómo planificar una ruta en barco desde Blanes",
        description: isEn
          ? "Step-by-step guide to choosing a maritime route departing from Puerto de Blanes based on your boat type, time available and experience."
          : "Guía paso a paso para elegir una ruta marítima desde el Puerto de Blanes según tu tipo de barco, tiempo disponible y experiencia.",
        totalTime: "PT4H",
        supply: [{ "@type": "HowToSupply", name: isEn ? "Sunscreen, water, swimwear, snacks" : "Crema solar, agua, bañador, snacks" }],
        tool: [{ "@type": "HowToTool", name: isEn ? "Smartphone with marine weather app (Windy/Windguru)" : "Móvil con app de meteo marina (Windy/Windguru)" }],
        step: [
          { "@type": "HowToStep", position: 1, name: isEn ? "Check the morning weather window" : "Comprueba la ventana de tiempo matinal", text: isEn ? "Mornings 09:00-12:00 are calmest. From midday the southerly Garbí thermal wind picks up — return to port by 15:00 if you want flat seas." : "Las mañanas 09:00-12:00 son las más tranquilas. A mediodía suele entrar el térmico sur (Garbí); regresa al puerto antes de las 15:00 para mantener mar plana." },
          { "@type": "HowToStep", position: 2, name: isEn ? "Pick a route within your boat's range" : "Elige una ruta dentro del alcance del barco", text: isEn ? "License-free boats: stay within 2 nautical miles, top destination Lloret de Mar (30 min). Licensed boats: full coast up to Tossa de Mar (30 min) and beyond." : "Barco sin licencia: hasta 2 millas náuticas, destino top Lloret de Mar (30 min). Con licencia: costa completa hasta Tossa de Mar (30 min) y más allá." },
          { "@type": "HowToStep", position: 3, name: isEn ? "Plan anchoring stops" : "Planifica las paradas de fondeo", text: isEn ? "Sa Palomera (5 min), Cala Brava (15 min), Cala Sant Francesc (20 min), Santa Cristina (25 min), Fenals (30 min). Anchor on sandy bottom only — Posidonia seagrass is protected." : "Sa Palomera (5 min), Cala Brava (15 min), Cala Sant Francesc (20 min), Santa Cristina (25 min), Fenals (30 min). Fondea solo en arena — la Posidonia está protegida." },
          { "@type": "HowToStep", position: 4, name: isEn ? "Plan fuel and return time" : "Planifica gasolina y hora de retorno", text: isEn ? "License-free boats consume ~2-3 L/h at cruising speed. 25-30 L tank lasts 8-10 h easily. Return 30 min before sunset for safe mooring." : "Barco sin licencia consume ~2-3 L/h a velocidad de crucero. Depósito 25-30 L da para 8-10 h sin problemas. Regresa 30 min antes del ocaso." },
          { "@type": "HowToStep", position: 5, name: isEn ? "Bring snorkel gear + water" : "Lleva snorkel + agua", text: isEn ? "Most coves have crystal-clear rocky seabeds (Cala Brava and Cala Sant Francesc especially). Rent snorkel kit on board for 7.50 EUR if you didn't bring." : "La mayoría de calas tiene fondos rocosos cristalinos (especialmente Cala Brava y Cala Sant Francesc). Alquila equipo de snorkel a bordo por 7,50 EUR si no llevas." },
        ],
      };
      const speakable = {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "h2", "h3", "[data-speakable]"],
      };
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [itemList, howTo, breadcrumb, speakable] }, availableLanguages };
    }

    // /galeria - CollectionPage + BreadcrumbList
    else if (metaKey === "/galeria") {
      const gallery = {
        "@type": "CollectionPage",
        "@id": `${BASE_URL}/galeria#gallery`,
        name: isEn ? "Customer Photo Gallery" : "Galeria de Fotos de Clientes",
        description: isEn
          ? "Real photos from our customers enjoying boat trips on Costa Brava from Blanes."
          : "Fotos reales de nuestros clientes disfrutando en barco por la Costa Brava desde Blanes.",
        url: `${BASE_URL}/galeria`,
        isPartOf: { "@type": "WebSite", "@id": `${BASE_URL}/#website` },
        about: { "@type": "LocalBusiness", "@id": `${BASE_URL}/#organization` },
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Gallery" : "Galeria", url: `${BASE_URL}/galeria` }]);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [gallery, breadcrumb] }, availableLanguages };
    }

    // /tarjetas-regalo - Product schema for gift cards
    else if (metaKey === "/tarjetas-regalo") {
      const product = {
        "@type": "Product",
        name: isEn ? "Gift Card - Boat Rental Costa Brava" : "Tarjeta Regalo - Alquiler de Barcos Costa Brava",
        description: isEn
          ? "Give the gift of a nautical experience on Costa Brava. Gift cards from 50 EUR, valid for 1 year. Redeemable on all boats in Blanes."
          : "Regala una experiencia nautica en la Costa Brava. Tarjetas regalo desde 50 EUR, validas durante 1 ano. Canjeables en todos nuestros barcos en Blanes.",
        url: `${BASE_URL}/tarjetas-regalo`,
        brand: { "@type": "Brand", name: "Costa Brava Rent a Boat" },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "EUR",
          lowPrice: "50",
          highPrice: "500",
          availability: "https://schema.org/InStock",
          seller: { "@type": "LocalBusiness", name: "Costa Brava Rent a Boat" },
        },
        image: `${BASE_URL}/og-image.webp`,
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Gift Cards" : "Tarjetas Regalo", url: `${BASE_URL}/tarjetas-regalo` }]);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [product, breadcrumb] }, availableLanguages };
    }

    // /precios - FAQPage + OfferCatalog for pricing page
    else if (metaKey === "/precios") {
      const faq = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "How much does it cost to rent a license-free boat in Blanes?" : "¿Cuánto cuesta alquilar un barco sin licencia en Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "License-free boats in Blanes start from 70 EUR/hour in low season (April-June, September-October). Mid season (July) from 80 EUR/hour and high season (August) from 90 EUR/hour. Price includes fuel, insurance and safety equipment."
              : "Los barcos sin licencia en Blanes cuestan desde 70 EUR/hora en temporada baja (abril-junio, septiembre-octubre). En temporada media (julio) desde 80 EUR/hora y en temporada alta (agosto) desde 90 EUR/hora. El precio incluye gasolina, seguro y equipo de seguridad." },
          },
          {
            "@type": "Question",
            name: isEn ? "Is fuel included in the rental price?" : "La gasolina esta incluida en el precio del alquiler?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Yes, all our license-free boats include fuel in the price. For licensed boats, fuel is paid separately based on actual consumption."
              : "Si, todos nuestros barcos sin licencia incluyen la gasolina en el precio. Para los barcos con licencia, el combustible se paga aparte segun el consumo real." },
          },
          {
            "@type": "Question",
            name: isEn ? "Is there a price difference between low and high season?" : "Hay diferencia de precio entre temporada baja y alta?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Yes. Low season (April-June and September-October) has the best prices. Mid season is July with intermediate prices, and high season is August with the highest rates."
              : "Si. La temporada baja (abril-junio y septiembre-octubre) tiene los mejores precios. La temporada media es julio con precios intermedios, y la temporada alta es agosto con las tarifas mas altas." },
          },
          {
            "@type": "Question",
            name: isEn ? "How much does it cost to rent a licensed boat in Blanes?" : "¿Cuánto cuesta alquilar un barco con licencia en Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Licensed boats in Blanes start from 160 EUR/2h in low season. They require a boating license (Basic Navigation License or ICC). More powerful boats with greater range to explore Costa Brava."
              : "Los barcos con licencia en Blanes cuestan desde 160 EUR/2h en temporada baja. Requieren Licencia de Navegacion (LN) o equivalente (ICC). Son barcos mas potentes con mayor autonomia para explorar la Costa Brava." },
          },
        ],
      };
      const offerCatalog = {
        "@type": "OfferCatalog",
        name: isEn ? `Boat Rental Prices Blanes ${SEASON_YEAR}` : `Precios Alquiler Barcos Blanes ${SEASON_YEAR}`,
        itemListElement: [
          {
            "@type": "Offer",
            name: isEn ? "License-Free Boats" : "Barcos Sin Licencia",
            priceCurrency: "EUR",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: 70,
              priceCurrency: "EUR",
              unitText: "hour",
              description: isEn ? "Low season starting price" : "Precio desde temporada baja",
            },
            availability: "https://schema.org/InStock",
          },
          {
            "@type": "Offer",
            name: isEn ? "Licensed Boats" : "Barcos Con Licencia",
            priceCurrency: "EUR",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: 150,
              priceCurrency: "EUR",
              unitText: "hour",
              description: isEn ? "Low season starting price" : "Precio desde temporada baja",
            },
            availability: "https://schema.org/InStock",
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Prices" : "Precios", url: `${BASE_URL}/precios` }]);
      const service = buildLandingService(
        isEn ? `Boat Rental Prices Blanes ${SEASON_YEAR}` : `Precios Alquiler Barcos Blanes ${SEASON_YEAR}`,
        isEn
          ? "Transparent prices for all our boats in Blanes, Costa Brava. License-free boats from 70 EUR/hour (fuel included). Licensed boats from 160 EUR/2h. Private excursion with captain from 240 EUR/2h. Low, mid and high season pricing."
          : "Precios transparentes para todos nuestros barcos en Blanes, Costa Brava. Barcos sin licencia desde 70€/hora (gasolina incluida). Barcos con licencia desde 160€/2h. Excursión privada con patrón desde 240€/2h. Tarifas temporada baja, media y alta.",
        { low: 70, high: 420 },
      );
      const speakable = {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "h2", "h3", ".pricing-amount", "[data-speakable]", "[data-pricing-amount]"],
      };
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, { ...faq, speakable }, offerCatalog, breadcrumb] }, availableLanguages };
    }

    // /alquiler-barcos-costa-brava - regional landing for the whole Costa Brava.
    // Highest-impression page in GSC ("alquiler barcos costa brava" + variants:
    // 625+ monthly impressions). Initially added in 8e670dd with isEn-only body
    // fallback; refactored here (Round 4, 2026-05-03) to source per-locale copy
    // directly from client/src/i18n/<lang>.ts so the SSR body served to
    // Googlebot is genuinely native in all 8 locales (~200-400 unique words per
    // locale instead of Spanish content with an English ternary). Without this,
    // GSC live-test rejected reindex requests for /en/, /fr/, /de/, /nl/, /it/,
    // /ca/, /ru/ as Soft 404 / "translated content with no unique value".
    //
    // pathToStaticMetaKey resolves all 8 language variants of this slug to the
    // canonical ES metaKey, so this single branch covers them via I18N_BY_LANG
    // lookup. The /boat-rental-costa-brava branch below is dead code (kept only
    // to avoid touching unrelated lines).
    //
    // FAQ Q&A and audience labels stay bilingual ES/EN inline because
    // t.locationPages.costaBrava has no faqItems block in i18n yet — those are
    // metadata schemas (less weighted than body text by Soft-404 detection),
    // safe to migrate later when the i18n bundle adds them.
    else if (metaKey === "/alquiler-barcos-costa-brava") {
      // Non-null assertion: t.locationPages.costaBrava is typed optional in
      // Translations but guaranteed present in all 8 locales by
      // scripts/validate-translations.ts (CI-enforced).
      const cb = (I18N_BY_LANG[lang] ?? i18nEs).locationPages.costaBrava!;
      const heroTitle = cb.hero.title;
      const heroSubtitle = cb.hero.subtitle;
      const intro = cb.sections.introP1;

      // First sentence helper for compact bullet copy.
      const firstSentence = (s: string): string => {
        const m = s.match(/^[^.!?]+[.!?]/);
        return m ? m[0] : s;
      };

      const breadcrumbLabels: Record<LangCode, string> = {
        es: "Alquiler Barcos Costa Brava",
        en: "Boat Rental Costa Brava",
        ca: "Lloguer Vaixells Costa Brava",
        fr: "Location Bateaux Costa Brava",
        de: "Bootsverleih Costa Brava",
        nl: "Bootverhuur Costa Brava",
        it: "Noleggio Barche Costa Brava",
        ru: "Аренда лодок Коста-Брава",
      };
      const audienceLabels: Record<LangCode, [string, string, string]> = {
        es: ["Turistas náuticos", "Familias con niños", "Buscadores de aventura"],
        en: ["Nautical tourists", "Families with children", "Adventure seekers"],
        ca: ["Turistes nàutics", "Famílies amb nens", "Buscadors d'aventura"],
        fr: ["Touristes nautiques", "Familles avec enfants", "Aventuriers"],
        de: ["Bootstouristen", "Familien mit Kindern", "Abenteurer"],
        nl: ["Nautische toeristen", "Gezinnen met kinderen", "Avonturiers"],
        it: ["Turisti nautici", "Famiglie con bambini", "Cercatori di avventura"],
        ru: ["Морские туристы", "Семьи с детьми", "Искатели приключений"],
      };
      const [aud1, aud2, aud3] = audienceLabels[lang] ?? audienceLabels.es;

      const destination = {
        "@type": "TouristDestination",
        name: heroTitle,
        description: heroSubtitle,
        url: `${BASE_URL}/alquiler-barcos-costa-brava`,
        touristType: [
          { "@type": "Audience", audienceType: aud1 },
          { "@type": "Audience", audienceType: aud2 },
          { "@type": "Audience", audienceType: aud3 },
        ],
        geo: { "@type": "GeoCoordinates", latitude: 41.6722504, longitude: 2.7978625 },
        containedInPlace: {
          "@type": "Place",
          name: "Costa Brava",
          sameAs: "https://en.wikipedia.org/wiki/Costa_Brava",
          containedInPlace: GEO_HIERARCHY.containedInPlace,
        },
        includesAttraction: [
          { "@type": "TouristAttraction", name: "Sa Palomera, Blanes" },
          { "@type": "TouristAttraction", name: "Cala Sant Francesc, Blanes" },
          { "@type": "TouristAttraction", name: "Cala Boadella, Lloret de Mar" },
          { "@type": "TouristAttraction", name: "Cala Banys, Lloret de Mar" },
          { "@type": "TouristAttraction", name: "Vila Vella de Tossa de Mar", sameAs: "https://en.wikipedia.org/wiki/Vila_Vella" },
        ],
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "Do I need a license to rent a boat on the Costa Brava?" : "¿Necesito licencia para alquilar un barco en la Costa Brava?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "No. We offer 5 license-free boats for up to 7 people. You only need to be 18 or older. We provide 15 minutes of training before departure."
              : "No. Ofrecemos 5 barcos sin licencia para hasta 7 personas. Solo necesitas ser mayor de 18 años. Proporcionamos 15 minutos de formación antes de salir." },
          },
          {
            "@type": "Question",
            name: isEn ? "How much does it cost to rent a boat on the Costa Brava?" : "¿Cuánto cuesta alquilar un barco en la Costa Brava?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "License-free boats from 70 EUR/hour in low season, 90 EUR/hour in August. Price includes fuel, insurance and safety equipment. Full-day rentals available."
              : "Los barcos sin licencia cuestan desde 70€/hora en temporada baja y 90€/hora en agosto. El precio incluye gasolina, seguro y equipo de seguridad. Disponible alquiler de día completo." },
          },
          {
            "@type": "Question",
            name: isEn ? "Where do the boats depart from?" : "¿Desde dónde salen los barcos?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "All our boats depart from Puerto de Blanes, the southern gateway to the Costa Brava. 70 minutes from Barcelona, 35 minutes from Girona, with free parking."
              : "Todos nuestros barcos salen del Puerto de Blanes, la puerta sur de la Costa Brava. A 70 minutos de Barcelona y 35 minutos de Girona, con aparcamiento gratuito." },
          },
          {
            "@type": "Question",
            name: isEn ? "Where can I navigate on the Costa Brava?" : "¿Dónde puedo navegar en la Costa Brava?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "License-free boats: Cala Brava (15 min), Cala Sant Francesc (20 min), Lloret de Mar (30 min). Licensed boats: full Costa Brava up to Tossa de Mar (45 min) and Sant Feliu de Guíxols (90 min)."
              : "Barcos sin licencia: Cala Brava (15 min), Cala Sant Francesc (20 min), Lloret de Mar (30 min). Barcos con licencia: toda la Costa Brava hasta Tossa de Mar (45 min) y Sant Feliu de Guíxols (90 min)." },
          },
          {
            "@type": "Question",
            name: isEn ? "What is the best time of year to rent a boat on the Costa Brava?" : "¿Cuál es la mejor época para alquilar un barco en la Costa Brava?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Season runs April through October. June and September offer the best balance of warm weather and fewer crowds. August is peak season."
              : "La temporada va de abril a octubre. Junio y septiembre ofrecen el mejor equilibrio entre buen tiempo y menos gente. Agosto es temporada alta." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([
        homeCrumb,
        { name: breadcrumbLabels[lang] ?? breadcrumbLabels.es, url: `${BASE_URL}/alquiler-barcos-costa-brava` },
      ]);
      const service = buildLandingService(
        `${heroTitle} ${SEASON_YEAR}`,
        intro,
        { low: 70, high: 420 },
      );
      const costaBravaBodyFallback = buildLocationBodyFallback(
        heroTitle,
        intro,
        [
          `${cb.sections.calaSantFrancescName} — ${firstSentence(cb.sections.calaSantFrancescDesc)}`,
          `${cb.sections.platjaPalomeraName} — ${firstSentence(cb.sections.platjaPalomeraDesc)}`,
          `${cb.sections.calaBBoadellaName} — ${firstSentence(cb.sections.calaBBoadellaDesc)}`,
          `${cb.sections.calaTreumalName} — ${firstSentence(cb.sections.calaTreumalDesc)}`,
          `${cb.sections.calaBravaName} — ${firstSentence(cb.sections.calaBravaDesc)}`,
        ],
        cb.sections.ctaButton,
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, destination, faq, breadcrumb] }, availableLanguages, bodyFallback: costaBravaBodyFallback };
    }

    // /boat-rental-costa-brava - DEAD CODE: superseded by the unified
    // /alquiler-barcos-costa-brava branch above. pathToStaticMetaKey resolves
    // EN, FR, DE, etc. variants to the canonical ES metaKey, so this branch
    // never fires under normal slug resolution. Kept temporarily to avoid
    // touching unrelated lines; safe to delete in a follow-up cleanup.
    else if (metaKey === "/boat-rental-costa-brava") {
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: "Boat Rental Costa Brava", url: `${BASE_URL}/boat-rental-costa-brava` }]);
      const service = buildLandingService(
        `Boat Rental Costa Brava ${SEASON_YEAR}`,
        "Boat rental on the Costa Brava from Blanes port. License-free boats from 70 EUR/hour (fuel included). Licensed boats and private excursions with captain available. Up to 12 people. Hidden coves, snorkel spots and medieval coastal villages.",
        { low: 70, high: 420 },
      );
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [service, breadcrumb] }, availableLanguages };
    }

    // /blog - CollectionPage schema
    else if (metaKey === "/blog") {
      const collectionPage = {
        "@type": "CollectionPage",
        name: isEn ? "Boat Navigation Blog - Costa Brava" : "Blog de Navegacion y Destinos - Costa Brava",
        description: isEn
          ? "Guides, tips and destinations for boat rental in Blanes and Costa Brava."
          : "Guias, consejos y destinos para alquilar barcos en Blanes y la Costa Brava.",
        url: `${BASE_URL}/blog`,
        isPartOf: { "@type": "WebSite", "@id": `${BASE_URL}/#website` },
        publisher: { "@type": "Organization", name: "Costa Brava Rent a Boat" },
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: "Blog", url: `${BASE_URL}/blog` }]);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [collectionPage, breadcrumb] }, availableLanguages };
    }

    // Programmatic matrix pages (occasion × location): SSR the same breadcrumb +
    // FAQPage the client renders, plus a body fallback so non-JS crawlers see
    // the full copy (h1, intro, spots, recommended boats, practical info).
    else if (OCCASION_MATRIX_ENABLED && resolveMatrixSlug(metaKey.slice(1))) {
      const matrixCombo = resolveMatrixSlug(metaKey.slice(1)) as MatrixCombo;
      const id = comboId(matrixCombo.occasion.id, matrixCombo.locationKey);
      const copy = getMatrixCopy(lang, id) ?? getMatrixCopy("es", id);
      const data = resolveMatrixCombo(matrixCombo);
      if (copy && data) {
        const pagePath = matrixPath(matrixCombo.occasion.id, matrixCombo.locationKey, lang);
        const breadcrumb = buildBreadcrumb([homeCrumb, { name: copy.h1, url: `${BASE_URL}${pagePath}` }]);
        const faqSchema = {
          "@type": "FAQPage",
          "@id": `${BASE_URL}${pagePath}#faq`,
          mainEntity: copy.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        };
        const bodyFallback = `
<h1>${esc(copy.h1)}</h1>
<p>${esc(copy.intro)}</p>
<h2>${esc(copy.spotsTitle)}</h2>
<ul>
${copy.spots.map((s) => `  <li>${esc(s.name)} — ${esc(s.description)}</li>`).join("\n")}
</ul>
<h2>${esc(copy.boatsTitle)}</h2>
<p>${esc(copy.boatsIntro)}</p>
<ul>
${data.boats.map((b) => `  <li>${esc(b.name)} — ${esc(b.capacity)}</li>`).join("\n")}
</ul>
<p>${esc(copy.practicalBody)}</p>
<p><a href="https://wa.me/34611500372">${esc(copy.ctaTitle)}</a></p>
        `.trim();
        return {
          meta,
          jsonLd: { "@context": "https://schema.org", "@graph": [breadcrumb, faqSchema] },
          availableLanguages,
          bodyFallback,
        };
      }
      return { meta, availableLanguages };
    }

    return { meta, availableLanguages };
  }

  // 2. Boat detail pages: /barco/:id (metaKey is already the Spanish path form)
  const boatMatch = metaKey.match(/^\/barco\/([^/]+)$/);
  if (boatMatch) {
    const boatId = boatMatch[1];
    try {
      const boats = await storage.getAllBoats();
      const boat = boats.find(b => b.id === boatId);
      if (boat) {
        const licenseLabels: Record<string, [string, string]> = {
          es: ["con licencia", "sin licencia"],
          en: ["with license", "without license"],
          ca: ["amb llicència", "sense llicència"],
          fr: ["avec permis", "sans permis"],
          de: ["mit Lizenz", "ohne Lizenz"],
          nl: ["met vaarbewijs", "zonder vaarbewijs"],
          it: ["con patente", "senza patente"],
          ru: ["с лицензией", "без лицензии"],
        };
        const [withLic, withoutLic] = licenseLabels[lang] || licenseLabels.es;
        const licenseText = boat.requiresLicense ? withLic : withoutLic;
        const fromPrice = (() => {
          // Filter out 0 placeholders — some boat.pricing rows have 0 for
          // tariff slots not yet defined (e.g. MEDIA.prices['6h']=0). Without
          // the filter Math.min returns 0, which is falsy and previously
          // caused the JSON-LD Offer to be emitted without a `price` field —
          // GSC flagged this as a critical "merchant listings" error
          // 2026-04-29 ("Falta el campo 'price' (en 'offers')").
          if (!boat.pricing) return null;
          const seasons = Object.values(boat.pricing) as Array<{ prices?: Record<string, number> }>;
          const prices = seasons
            .flatMap(s => s?.prices ? Object.values(s.prices) : [])
            .filter((p): p is number => typeof p === "number" && p > 0);
          return prices.length > 0 ? Math.min(...prices) : null;
        })();
        const fromLabels: Record<string, string> = {
          es: "Desde", en: "From", ca: "Des de", fr: "Dès", de: "Ab", nl: "Vanaf", it: "Da", ru: "От"
        };
        const priceStr = fromPrice ? ` | ${fromLabels[lang] || "Desde"} ${fromPrice}€` : "";
        // Build boat-specific og:image URL. resolveBoatImagePath maps legacy DB
        // filenames (e.g. "SOLAR_450_boat_photo_xxx.png") to real /images/boats/
        // asset paths so social crawlers get a 200 instead of a 404.
        const resolvedBoatImage = resolveBoatImagePath(boat.imageUrl) || resolveBoatImagePath(boat.id);
        const boatOgImage = resolvedBoatImage ?? undefined;
        const isExcursion = boat.id === "excursion-privada";
        const excursionMeta: Record<string, { title: string; description: string }> = {
          es: {
            title: `Excursión Privada en Barco Blanes | Con Capitán${priceStr}`,
            description: `Contrata una excursión privada en barco con patrón en Blanes, Costa Brava. Hasta ${boat.capacity} personas. No necesitas licencia — capitán incluido. Reserva por WhatsApp.`,
          },
          en: {
            title: `Private Boat Excursion Blanes | With Captain${priceStr}`,
            description: `Private boat trip with skipper in Blanes, Costa Brava. Up to ${boat.capacity} people. No license required — captain included. Book via WhatsApp.`,
          },
          ca: {
            title: `Excursió Privada Vaixell Blanes | Amb Patró${priceStr}`,
            description: `Contracta una excursió privada en vaixell amb patró a Blanes, Costa Brava. Fins a ${boat.capacity} persones. No necessites llicència — patró inclòs. Reserva per WhatsApp.`,
          },
          fr: {
            title: `Excursion Privée Bateau Blanes | Avec Capitaine${priceStr}`,
            description: `Réservez une excursion privée en bateau avec skipper à Blanes, Costa Brava. Jusqu'à ${boat.capacity} personnes. Pas de permis requis — capitaine inclus. Réservez via WhatsApp.`,
          },
          de: {
            title: `Private Bootsexkursion Blanes | Mit Kapitän${priceStr}`,
            description: `Buchen Sie eine private Bootsexkursion mit Skipper in Blanes, Costa Brava. Bis zu ${boat.capacity} Personen. Kein Bootsführerschein nötig — Kapitän inklusive. Buchen per WhatsApp.`,
          },
          nl: {
            title: `Privé Boottocht Blanes | Met Schipper${priceStr}`,
            description: `Boek een privé boottocht met schipper in Blanes, Costa Brava. Tot ${boat.capacity} personen. Geen vaarbewijs nodig — schipper inbegrepen. Boek via WhatsApp.`,
          },
          it: {
            title: `Escursione Privata Barca Blanes | Con Capitano${priceStr}`,
            description: `Prenota un'escursione privata in barca con skipper a Blanes, Costa Brava. Fino a ${boat.capacity} persone. Nessuna patente necessaria — capitano incluso. Prenota via WhatsApp.`,
          },
          ru: {
            title: `Частная экскурсия Бланес | С капитаном${priceStr}`,
            description: `Закажите частную экскурсию на лодке с капитаном в Бланесе, Коста Брава. До ${boat.capacity} человек. Лицензия не нужна — капитан включён. Бронируйте через WhatsApp.`,
          },
        };
        const rentLabels: Record<string, { verb: string; prep: string; upTo: string; bookVerb: string; people: string }> = {
          es: { verb: "Alquiler", prep: "en", upTo: "Hasta", bookVerb: "Alquila el", people: "personas" },
          en: { verb: "Rent", prep: "in", upTo: "Up to", bookVerb: "Book the", people: "people" },
          ca: { verb: "Lloguer", prep: "a", upTo: "Fins a", bookVerb: "Lloga el", people: "persones" },
          fr: { verb: "Location", prep: "à", upTo: "Jusqu'à", bookVerb: "Louez le", people: "personnes" },
          de: { verb: "Mieten", prep: "in", upTo: "Bis zu", bookVerb: "Mieten Sie das", people: "Personen" },
          nl: { verb: "Huur", prep: "in", upTo: "Tot", bookVerb: "Huur de", people: "personen" },
          it: { verb: "Noleggio", prep: "a", upTo: "Fino a", bookVerb: "Noleggia il", people: "persone" },
          ru: { verb: "Аренда", prep: "в", upTo: "До", bookVerb: "Арендуйте", people: "человек" },
        };
        const r = rentLabels[lang] || rentLabels.es;
        const exc = excursionMeta[lang] || excursionMeta.es;
        // Per-language og:image:alt for social sharing. Using the translated
        // verb + boat name keeps the alt consistent with the title and avoids
        // Spanish leaking into FB/WhatsApp/Twitter previews of /en/, /fr/, etc.
        const ogImageAltByLang: Record<string, string> = {
          es: `${boat.name} - Alquiler de barcos en Puerto de Blanes, Costa Brava`,
          en: `${boat.name} - Boat rental at Blanes Port, Costa Brava`,
          ca: `${boat.name} - Lloguer de vaixells al Port de Blanes, Costa Brava`,
          fr: `${boat.name} - Location de bateaux au Port de Blanes, Costa Brava`,
          de: `${boat.name} - Bootsverleih im Hafen von Blanes, Costa Brava`,
          nl: `${boat.name} - Botenverhuur in de haven van Blanes, Costa Brava`,
          it: `${boat.name} - Noleggio barche al Porto di Blanes, Costa Brava`,
          ru: `${boat.name} - Аренда лодок в порту Бланес, Коста-Брава`,
        };
        const boatOgImageAlt = ogImageAltByLang[lang] || ogImageAltByLang.es;
        const boatOgImageWidth = boatOgImage ? BOAT_IMAGE_WIDTH : undefined;
        const boatOgImageHeight = boatOgImage ? BOAT_IMAGE_HEIGHT : undefined;
        const meta: SEOMeta = isExcursion
          ? { title: exc.title, description: exc.description, ogImage: boatOgImage, ogImageAlt: boatOgImageAlt, ogImageWidth: boatOgImageWidth, ogImageHeight: boatOgImageHeight, ogType: "product" }
          : {
              title: `${r.verb} ${boat.name} ${r.prep} Blanes${priceStr}`,
              description: `${r.bookVerb} ${boat.name} ${r.prep} Blanes, Costa Brava. ${r.upTo} ${boat.capacity} ${r.people}, ${licenseText}. WhatsApp.`,
              ogImage: boatOgImage,
              ogImageAlt: boatOgImageAlt,
              ogImageWidth: boatOgImageWidth,
              ogImageHeight: boatOgImageHeight,
              ogType: "product",
            };
        // Build Product schema with AggregateRating + Reviews for star snippets
        const reviewStats = getBoatReviewStats(boat.id);
        const boatAggregateRating = reviewStats ? {
          "@type": "AggregateRating",
          ratingValue: String(reviewStats.average),
          reviewCount: String(reviewStats.count),
          bestRating: "5",
          worstRating: "1",
        } : buildAggregateRating();
        const jsonLd = buildBoatProductSchema(boat, fromPrice, boatAggregateRating, reviewStats?.reviews);
        // Preload the same webp the BoatDetailPage mini-hero renders
        // (client/src/components/BoatDetailPage.tsx:840 — loading="eager"
        // fetchPriority="high"). Without this preload the LCP image is only
        // discovered after React hydrates, adding ~7s of resource load delay.
        const heroHref = resolveBoatImagePath(BOAT_HERO_PRELOAD_ALIASES[boat.id] ?? boat.id);
        const lcpPreload: LcpPreload | undefined = heroHref
          ? { href: heroHref, imageType: "image/webp" }
          : undefined;
        // hasTranslation: true — boat detail meta (title/description/ogImageAlt)
        // is fully generated per-language above via rentLabels/excursionMeta, so
        // non-ES URLs should be indexable and self-canonical, not redirected to
        // the ES equivalent. Prior default (hasTranslation: false) caused Google
        // to see noindex + canonical→/es/barco/... on every non-Spanish boat URL.

        // SSR body fallback. Without this, GSC URL Inspection live-test rejects
        // the page because the body is empty (everything renders client-side).
        // Removed by main.tsx before React hydrates (data-cowork-seo-fallback).
        const fallbackBoatName = esc(boat.name);
        const fallbackTitle = esc(meta.title);
        const fallbackDesc = esc(meta.description);
        const capacityLabels: Record<string, string> = {
          es: "personas", en: "people", ca: "persones", fr: "personnes",
          de: "Personen", nl: "personen", it: "persone", ru: "человек",
        };
        const peopleLabel = capacityLabels[lang] || capacityLabels.es;
        const includesLabel: Record<string, string> = {
          es: "Incluye", en: "Includes", ca: "Inclou", fr: "Inclut",
          de: "Umfasst", nl: "Inclusief", it: "Include", ru: "Включает",
        };
        const incLabel = includesLabel[lang] || includesLabel.es;
        const fuelLabels: Record<string, [string, string]> = {
          es: ["combustible aparte", "gasolina incluida"],
          en: ["fuel apart", "fuel included"],
          ca: ["combustible a part", "gasolina inclosa"],
          fr: ["carburant en sus", "carburant inclus"],
          de: ["Kraftstoff separat", "Kraftstoff inklusive"],
          nl: ["brandstof apart", "brandstof inbegrepen"],
          it: ["carburante a parte", "carburante incluso"],
          ru: ["топливо отдельно", "топливо включено"],
        };
        const [fuelApart, fuelInc] = fuelLabels[lang] || fuelLabels.es;
        const fuelText = boat.requiresLicense ? fuelApart : fuelInc;
        const priceFromLabel = fromPrice ? `${fromLabels[lang] || "Desde"} ${fromPrice}€` : "";
        const reservaLabel: Record<string, string> = {
          es: "Reserva por WhatsApp", en: "Book via WhatsApp", ca: "Reserva per WhatsApp",
          fr: "Réservez par WhatsApp", de: "Per WhatsApp buchen", nl: "Boek via WhatsApp",
          it: "Prenota via WhatsApp", ru: "Бронирование по WhatsApp",
        };
        const ctaLabel = reservaLabel[lang] || reservaLabel.es;
        const bodyFallback = `
<h1>${fallbackTitle}</h1>
<p>${fallbackDesc}</p>
<ul>
  <li><strong>${fallbackBoatName}</strong></li>
  <li>${esc(boat.capacity || "")} ${peopleLabel}</li>
  <li>${esc(licenseText)}, ${esc(fuelText)}</li>
  ${priceFromLabel ? `<li>${esc(priceFromLabel)}</li>` : ""}
</ul>
<p>${incLabel}: IVA, amarre, limpieza, seguro embarcación y ocupantes.</p>
<p>${ctaLabel}: <a href="https://wa.me/34611500372">+34 611 500 372</a></p>
        `.trim();

        return { meta, jsonLd, lcpPreload, hasTranslation: true, bodyFallback };
      }
    } catch {
      // fall through
    }
  }

  // 3. Blog post pages: /blog/:slug (metaKey is already the Spanish path form)
  const blogMatch = metaKey.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    try {
      const posts = await storage.getAllBlogPosts();
      const post = posts.find(p => p.slug === slug && p.isPublished);
      if (post) {
        // Localized title/description/content for non-Spanish languages.
        // Falls back to Spanish defaults if translation missing.
        const titleByLang = (post.titleByLang ?? {}) as Record<string, string>;
        const excerptByLang = (post.excerptByLang ?? {}) as Record<string, string>;
        const metaDescByLang = (post.metaDescByLang ?? {}) as Record<string, string>;
        const contentByLang = (post.contentByLang ?? {}) as Record<string, string>;
        const localizedTitle = titleByLang[lang] || post.title;
        const localizedExcerpt = excerptByLang[lang] || post.excerpt || undefined;
        const localizedMetaDesc = metaDescByLang[lang] || post.metaDescription || undefined;
        const localizedContent = contentByLang[lang] || (typeof post.content === "string" ? post.content : "");

        // Build blog-specific og:image URL (resolveMediaPath returns null for
        // bare filenames so we skip the tag instead of emitting a 404 URL).
        const postOgImage = resolveMediaPath(post.featuredImage) ?? undefined;
        const publishedTime = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;
        const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : publishedTime;
        const meta: SEOMeta = {
          title: `${localizedTitle} | Costa Brava Rent a Boat`,
          description: localizedMetaDesc || localizedExcerpt || localizedTitle,
          ogImage: postOgImage,
          ogType: "article",
          articleMeta: {
            publishedTime,
            modifiedTime,
            author: "Costa Brava Rent a Boat",
            section: (post.category as string) || "Navegacion",
            tags: Array.isArray(post.tags) ? post.tags.filter((t): t is string => typeof t === "string") : undefined,
          },
        };
        const wordCount = localizedContent.split(/\s+/).filter(Boolean).length || undefined;
        // Canonical URL is language-specific so JSON-LD url matches the actual page URL.
        const localizedBlogUrl = `${BASE_URL}/${lang}/blog/${slug}`;
        const jsonLd: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${localizedBlogUrl}#article`,
          headline: localizedTitle,
          description: meta.description,
          url: localizedBlogUrl,
          mainEntityOfPage: { "@type": "WebPage", "@id": localizedBlogUrl },
          datePublished: post.publishedAt || post.createdAt,
          dateModified: post.updatedAt || post.publishedAt,
          // E-E-A-T: emit Person (named author with bio + sameAs) instead of
          // Organization. Match post.author string against AUTHORS registry;
          // fall back to DEFAULT_AUTHOR for unknown / generic strings like
          // "Costa Brava Rent a Boat".
          author: (() => {
            const raw = (post.author ?? "").trim();
            const matched = Object.values(AUTHORS).find(
              (a) => a.name.toLowerCase() === raw.toLowerCase(),
            );
            const profile = matched ?? DEFAULT_AUTHOR;
            return authorToPersonSchema(profile, BASE_URL);
          })(),
          publisher: {
            "@type": "Organization",
            name: "Costa Brava Rent a Boat",
            logo: { "@type": "ImageObject", url: `${BASE_URL}/assets/og-image.png` },
          },
          inLanguage: lang,
          articleSection: (post.category as string) || "Navegacion",
        };
        if (wordCount) jsonLd.wordCount = wordCount;
        if (postOgImage) {
          const absImage = postOgImage.startsWith("http") ? postOgImage : `${BASE_URL}${postOgImage}`;
          jsonLd.image = absImage;
        }
        // Signal real translation only when titleByLang actually has content for this lang.
        const hasBlogTranslation = Boolean(
          titleByLang[lang] && typeof titleByLang[lang] === "string" && titleByLang[lang].trim(),
        );
        const nativeOverride = getNativeOverride(slug, "blog");
        // Preload the featured image using the exact same resolution the
        // blog-detail <img> uses (client/src/pages/blog-detail.tsx:815 —
        // loading="eager" fetchPriority="high"). featuredImage is passed raw
        // as src; match that here so the preload doesn't cause a double fetch.
        const lcpPreload: LcpPreload | undefined = post.featuredImage
          ? { href: post.featuredImage }
          : undefined;
        // SSR body fallback for AI crawlers — emit headline + excerpt + first
        // ~250 words of content stripped of markdown so non-JS crawlers receive
        // the citable text. React hydration replaces this on load.
        const stripMd = (s: string) =>
          s
            .replace(/```[\s\S]*?```/g, " ")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/[#*_>~]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        const plainContent = stripMd(localizedContent || "");
        const firstWords = plainContent.split(" ").slice(0, 250).join(" ");
        const excerptText = localizedExcerpt ? esc(localizedExcerpt) : "";
        const bodyFallback = `
<article>
  <h1>${esc(localizedTitle)}</h1>
  ${excerptText ? `<p><strong>${excerptText}</strong></p>` : ""}
  <p>${esc(firstWords)}…</p>
  <p><a href="https://wa.me/34611500372">+34 611 500 372</a></p>
</article>
        `.trim();
        return { meta, jsonLd, hasTranslation: hasBlogTranslation, nativeOverride, lcpPreload, bodyFallback };
      }
    } catch {
      // fall through
    }
  }

  // 4. Destination detail pages: /destinos/:slug (metaKey is already the Spanish path form)
  const destMatch = metaKey.match(/^\/destinos\/([^/]+)$/);
  if (destMatch) {
    const slug = destMatch[1];
    try {
      const dest = await storage.getDestinationBySlug(slug);
      if (dest) {
        const destOgImage = resolveMediaPath(dest.featuredImage) ?? undefined;
        const meta: SEOMeta = {
          title: `${dest.name} | Costa Brava Rent a Boat`,
          description: dest.metaDescription || dest.description || dest.name,
          ogImage: destOgImage,
          ogType: "place",
        };

        const touristAttraction: Record<string, unknown> = {
          "@type": "TouristAttraction",
          "@id": `${BASE_URL}/destinos/${slug}#place`,
          name: dest.name,
          description: meta.description,
          url: `${BASE_URL}/destinos/${slug}`,
        };
        if (destOgImage) {
          touristAttraction.image = destOgImage.startsWith("http") ? destOgImage : `${BASE_URL}${destOgImage}`;
        }
        if (dest.coordinates) {
          try {
            const coords = typeof dest.coordinates === "string"
              ? JSON.parse(dest.coordinates)
              : dest.coordinates;
            if (coords.lat && coords.lng) {
              touristAttraction.geo = {
                "@type": "GeoCoordinates",
                latitude: coords.lat,
                longitude: coords.lng,
              };
            }
          } catch { /* ignore parsing errors */ }
        }
        touristAttraction.isAccessibleForFree = false;
        touristAttraction.touristType = ["Families", "Couples", "Adventure seekers"];

        const breadcrumb = {
          "@type": "BreadcrumbList",
          "@id": `${BASE_URL}/destinos/${slug}#breadcrumb`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Costa Brava Rent a Boat", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: lang === "en" ? "Destinations" : "Destinos", item: `${BASE_URL}/destinos` },
            { "@type": "ListItem", position: 3, name: dest.name, item: `${BASE_URL}/destinos/${slug}` },
          ],
        };

        return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [touristAttraction, breadcrumb] } };
      }
    } catch {
      // fall through
    }
  }

  return null;
}

// Legacy routes (without lang prefix) — kept for redirect middleware to catch
const LEGACY_SPA_ROUTES = new Set([
  "/",
  "/login",
  "/onboarding",
  "/faq",
  "/privacy-policy",
  "/terms-conditions",
  "/cookies-policy",
  "/condiciones-generales",
  "/accesibilidad",
  "/alquiler-barcos-blanes",
  "/alquiler-barcos-lloret-de-mar",
  "/alquiler-barcos-tossa-de-mar",
  "/alquiler-barcos-malgrat-de-mar",
  "/alquiler-barcos-santa-susanna",
  "/alquiler-barcos-calella",
  "/alquiler-barcos-cerca-barcelona",
  "/alquiler-barcos-costa-brava",
  "/boat-rental-costa-brava",
  "/barcos-sin-licencia",
  "/barcos-con-licencia",
  "/galeria",
  "/rutas",
  "/tarjetas-regalo",
  "/testimonios",
  "/precios",
  "/blog",
  // GSC 2026-05-18: /barcos movida a 301 server-side en server/seo/redirects.ts
  // (era zombie pos 65). Ya no se sirve como SPA.
  "/boat-rental-blanes",
  "/sobre-nosotros",
  "/about",
  // Lang-agnostic page intentionally served at the root (no /:lang prefix)
  // because its primary audience is AI crawlers, not localized humans.
  "/ai-citations",
]);

const LEGACY_DYNAMIC_PATTERNS = [
  /^\/barco\/[\w-]+$/,
  /^\/blog\/[\w-]+$/,
  /^\/destinos\/[\w-]+$/,
  /^\/cancel\/[\w-]+$/,
  /^\/crm(\/[\w-]*)?$/,
  /^\/mi-cuenta$/,
  /^\/client\/dashboard$/,
  /^\/destino\/(blanes|lloret-de-mar|tossa-de-mar)$/,
  /^\/categoria\/(sin-licencia|con-licencia)$/,
];

export function isValidSPARoute(pathname: string): boolean {
  const cleanPath = pathname.replace(/\/$/, "") || "/";

  // Root is always valid
  if (cleanPath === "/") return true;

  const segments = cleanPath.split("/").filter(Boolean);

  // Check if starts with valid lang code
  if (segments.length > 0 && isValidLang(segments[0])) {
    // /:lang/ (home)
    if (segments.length === 1) return true;

    const slug = segments[1];

    // Try to resolve as a known page slug
    const resolved = resolveSlug(slug);
    if (resolved) {
      // /:lang/:slug (static page)
      if (segments.length === 2) return true;
      // /:lang/:slug/:param (dynamic page like blog detail, boat detail)
      if (segments.length === 3) return true;
    }

    // Programmatic matrix pages (occasion × location) — slugs live outside ROUTE_SLUGS
    if (OCCASION_MATRIX_ENABLED && segments.length === 2 && resolveMatrixSlug(slug)) return true;

    // CRM with optional tab: /:lang/crm/:tab?
    if (slug === "crm" && segments.length <= 3) return true;

    return false;
  }

  // Legacy routes (without lang prefix) — serve as 200 so redirect middleware can catch them
  if (LEGACY_SPA_ROUTES.has(cleanPath)) return true;
  return LEGACY_DYNAMIC_PATTERNS.some(pattern => pattern.test(cleanPath));
}

export async function serveWithSEO(
  req: Request,
  res: Response,
  distPath: string
): Promise<void> {
  try {
    // Trailing slash redirect (except root and /:lang/ which is acceptable)
    if (req.path !== "/" && req.path.endsWith("/")) {
      const parts = req.path.split("/").filter(Boolean);
      // Allow trailing slash for /:lang/ (home page) — strip for everything else
      if (!(parts.length === 1 && isValidLang(parts[0]))) {
        const clean = req.path.slice(0, -1);
        const qs = req.originalUrl.includes("?") ? req.originalUrl.substring(req.originalUrl.indexOf("?")) : "";
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        return res.redirect(301, clean + qs);
      }
    }

    const parsedUrl = new URL(req.originalUrl, "http://localhost");
    const pathname = parsedUrl.pathname;

    // Extract language from URL path (/:lang/...)
    const pathParts = pathname.split("/").filter(Boolean);
    const pathLang = pathParts[0];

    let lang: LangCode;
    if (isValidLang(pathLang)) {
      lang = pathLang as LangCode;
    } else {
      // Legacy URL without lang prefix — use ?lang= param or default to es
      const legacyLang = parsedUrl.searchParams.get("lang");
      lang = (legacyLang && isValidLang(legacyLang)) ? legacyLang as LangCode : "es";
    }

    // Serve prerendered HTML if available (full page content for SEO crawlers)
    // Only serve NEW format prerendered files (prerendered/:lang/:slug.html)
    // Legacy format (prerendered/slug__lang_xx.html) is disabled until files are
    // regenerated for subdirectory URLs — old prerendered files lack JS bundles
    // and break the SPA when served for /:lang/ routes.
    const prerenderedDir = path.resolve(distPath, "..", "prerendered");
    if (fs.existsSync(prerenderedDir)) {
      // For subdirectory URLs, the file path mirrors the URL structure
      const routePath = pathname === "/" ? `/${lang}/index` : pathname.replace(/\/$/, "");
      const candidate = path.join(prerenderedDir, `${routePath}.html`);

      if (fs.existsSync(candidate)) {
        res.set("Content-Type", "text/html; charset=utf-8");
        res.set("Content-Language", lang);
        res.set("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
        res.set("X-Prerendered", "true");
        res.sendFile(path.resolve(candidate));
        return;
      }
    }

    // The canonical URL is the full localized path (e.g. /fr/location-bateau-blanes).
    // Home pages (root or /:lang[/?]) canonicalize to "/${lang}/" with trailing slash;
    // internal routes strip the trailing slash (e.g. /es/alquiler-barcos-blanes).
    const isHomePath = pathname === "/" || /^\/[a-z]{2}\/?$/.test(pathname);
    const canonicalPath = isHomePath ? `/${lang}/` : pathname.replace(/\/$/, "");
    const canonicalUrl = canonicalPath;

    const resolved = await resolveMeta(canonicalPath, lang);
    if (resolved) {
      // Decide indexability and canonical target up front so both the cache hit
      // and miss paths emit a consistent Link header + X-Robots-Tag.
      const { noindex, canonicalOverride } = computeTranslationIndex(
        canonicalPath,
        lang,
        resolved.hasTranslation ?? false,
        resolved.nativeOverride,
      );
      const canonicalTarget = canonicalOverride || canonicalUrl;

      // Thin-content guard: a page that's otherwise indexable but that real GA4
      // engagement shows users bounce off gets auto-noindex'd. Skipped when the
      // page is already noindex, and exempt for strategically critical "money"
      // pages (home, category, location landings, boat detail — see
      // isThinGuardExempt). Fail-safe (errors → not noindex). Cached 1h, so this
      // is a Map lookup on the hot path after the first request per page.
      const { metaKey: thinGuardMetaKey } = pathToStaticMetaKey(canonicalPath);
      const effectiveNoindex = noindex || (await shouldNoindexThinContent(canonicalPath, thinGuardMetaKey));

      // Check LRU cache for pre-injected HTML (avoids 9+ regex replacements).
      // Key includes the index decision so a thin/healthy flip can't serve stale robots.
      const cacheKey = `${canonicalPath}:${lang}:${effectiveNoindex ? "n" : "i"}`;
      const cachedHtml = getCachedInjectedHtml(cacheKey);
      if (cachedHtml) {
        res.set("Content-Type", "text/html; charset=utf-8");
        res.set("Content-Language", lang);
        res.set("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
        res.set("X-SEO-Cache", "HIT");
        res.set("Link", `<${BASE_URL}${canonicalTarget}>; rel="canonical"`);
        if (effectiveNoindex) res.set("X-Robots-Tag", "noindex, follow");
        res.send(cachedHtml);
        return;
      }

      // Override with DB-sourced meta if available (seo_meta table)
      const { metaKey } = pathToStaticMetaKey(canonicalPath);
      const dbMeta = await getDbMeta(metaKey, lang);
      if (dbMeta) {
        if (dbMeta.title) {
          resolved.meta.title = dbMeta.title;
          if (!resolved.meta.ogTitle || resolved.meta.ogTitle === resolved.meta.title) {
            resolved.meta.ogTitle = dbMeta.title;
          }
        }
        if (dbMeta.description) {
          resolved.meta.description = dbMeta.description;
          if (!resolved.meta.ogDescription || resolved.meta.ogDescription === resolved.meta.description) {
            resolved.meta.ogDescription = dbMeta.description;
          }
        }
      }
      const baseHtml = await getBaseHtml(distPath);
      let html = injectMeta(
        baseHtml,
        resolved.meta,
        canonicalUrl,
        resolved.jsonLd,
        lang,
        resolved.availableLanguages,
        effectiveNoindex,
        canonicalOverride,
        resolved.lcpPreload,
      );
      // SSR body fallback for crawlers (boat detail + future routes that opt in)
      if (resolved.bodyFallback) {
        html = injectBodyFallback(html, resolved.bodyFallback);
      }

      // Cache the final injected HTML
      setCachedInjectedHtml(cacheKey, html);

      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Content-Language", lang);
      res.set("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
      res.set("X-SEO-Cache", "MISS");
      res.set("Link", `<${BASE_URL}${canonicalTarget}>; rel="canonical"`);
      if (effectiveNoindex) res.set("X-Robots-Tag", "noindex, follow");
      res.send(html);
    } else {
      // Dynamic content routes that resolveMeta couldn't match
      // are genuinely non-existent — return 404 to avoid soft 404 indexing issues.
      // Match both new /:lang/(blog|barco|destinos)/:slug and legacy /(blog|barco|destinos)/:slug
      const isDynamicContentRoute = /^(\/[a-z]{2})?\/(blog|barco|destinos)\/[\w-]+$/.test(pathname);
      const status = isDynamicContentRoute ? 404 : (isValidSPARoute(pathname) ? 200 : 404);

      // On 404, inject lang-aware meta + noindex so crawlers don't index the
      // soft-404 under the Spanish homepage title (which was the old behaviour
      // because sendFile served raw index.html with its hardcoded ES <title>).
      if (status === 404) {
        try {
          const notFound = get404Meta(lang);
          const baseHtml = await getBaseHtml(distPath);
          const html = injectMeta(
            baseHtml,
            { title: notFound.title, description: notFound.description },
            pathname,
            undefined, // no JSON-LD — 404 is not a real content page
            lang,
            undefined,
            true, // noindex
          );
          res.status(404);
          res.set("Content-Type", "text/html; charset=utf-8");
          res.set("Content-Language", lang);
          res.set("X-Robots-Tag", "noindex, follow");
          res.send(html);
          return;
        } catch {
          // Fall through to raw sendFile if injection fails.
        }
      }

      res.status(status).sendFile(path.resolve(distPath, "index.html"));
    }
  } catch {
    const parsedUrl = new URL(req.originalUrl, "http://localhost");
    const status = isValidSPARoute(parsedUrl.pathname) ? 200 : 404;
    res.status(status).sendFile(path.resolve(distPath, "index.html"));
  }
}
