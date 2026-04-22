// server/seo/helpers.ts
//
// Small pure helpers for seoInjector. Kept separate so the 3000+ line injector
// doesn't accumulate tiny utilities.

import type { LangCode } from "../../shared/seoConstants";

interface NotFoundMeta {
  title: string;
  description: string;
}

// Per-language title + description for the 404 response body. Kept short
// enough that OG previews render cleanly when someone shares a broken link.
const NOT_FOUND_BY_LANG: Record<LangCode, NotFoundMeta> = {
  es: {
    title: "404 – Página no encontrada | Costa Brava Rent a Boat",
    description: "La página que buscas no existe. Descubre nuestra flota de barcos con y sin licencia en Blanes, Costa Brava.",
  },
  en: {
    title: "404 – Page not found | Costa Brava Rent a Boat",
    description: "The page you are looking for does not exist. Discover our boat fleet in Blanes, Costa Brava.",
  },
  fr: {
    title: "404 – Page non trouvée | Costa Brava Rent a Boat",
    description: "La page recherchée n'existe pas. Découvrez notre flotte de bateaux à Blanes, Costa Brava.",
  },
  de: {
    title: "404 – Seite nicht gefunden | Costa Brava Rent a Boat",
    description: "Die gesuchte Seite existiert nicht. Entdecken Sie unsere Bootsflotte in Blanes, Costa Brava.",
  },
  ca: {
    title: "404 – Pàgina no trobada | Costa Brava Rent a Boat",
    description: "La pàgina que busques no existeix. Descobreix la nostra flota de vaixells a Blanes, Costa Brava.",
  },
  nl: {
    title: "404 – Pagina niet gevonden | Costa Brava Rent a Boat",
    description: "De pagina die u zoekt bestaat niet. Ontdek onze bootvloot in Blanes, Costa Brava.",
  },
  it: {
    title: "404 – Pagina non trovata | Costa Brava Rent a Boat",
    description: "La pagina che stai cercando non esiste. Scopri la nostra flotta di barche a Blanes, Costa Brava.",
  },
  ru: {
    title: "404 – Страница не найдена | Costa Brava Rent a Boat",
    description: "Запрашиваемая страница не существует. Откройте для себя наш флот лодок в Бланесе, Коста-Брава.",
  },
};

/**
 * Meta for the 404 response body. Consumed by seoInjector when resolveMeta
 * returns null so the served index.html has a lang-appropriate title +
 * description instead of the hardcoded Spanish fallback from client/index.html.
 *
 * Caller is responsible for also setting:
 *   - res.status(404)
 *   - res.setHeader("X-Robots-Tag", "noindex, follow")
 *   - res.setHeader("Content-Language", lang)
 * and for passing noindex=true to injectMeta so the <meta name="robots">
 * tag matches the header.
 */
export function get404Meta(lang: LangCode): NotFoundMeta {
  return NOT_FOUND_BY_LANG[lang] ?? NOT_FOUND_BY_LANG.es;
}
