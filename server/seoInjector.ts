import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { seoMeta } from "../shared/schema";
import { eq, and } from "drizzle-orm";

const BASE_URL = process.env.BASE_URL || "https://costabravarentaboat.com";

// AI crawler user-agent patterns for enhanced content delivery
const AI_BOT_PATTERNS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /PerplexityBot/i,
  /ClaudeBot/i,
  /Claude-Web/i,
  /Anthropic/i,
  /Google-Extended/i,
  /Applebot-Extended/i,
  /Bytespider/i,
  /CCBot/i,
  /cohere-ai/i,
];

export function isAICrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return AI_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

interface SEOMeta {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  articleMeta?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
}

type LangCode = "es" | "ca" | "en" | "fr" | "de" | "nl" | "it" | "ru";

// Escape special HTML attribute characters
function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Fetch SEO meta overrides from the database (seo_meta table).
// Returns null on miss or error so callers can fall back to hardcoded values.
async function getDbMeta(pagePath: string, lang: string): Promise<{ title?: string; description?: string; keywords?: string } | null> {
  try {
    const [meta] = await db
      .select()
      .from(seoMeta)
      .where(and(eq(seoMeta.page, pagePath), eq(seoMeta.language, lang)))
      .limit(1);
    return meta ? {
      title: meta.title || undefined,
      description: meta.description || undefined,
      keywords: meta.keywords || undefined,
    } : null;
  } catch {
    return null;
  }
}

// Per-route, per-language SEO meta. Covers main crawled pages.
const STATIC_META: Record<string, Partial<Record<LangCode, SEOMeta>>> = {
  "/": {
    es: {
      title: "Alquiler de Barcos en Blanes sin Licencia | Desde 70€ | Costa Brava Rent a Boat",
      description: "Alquila barcos sin licencia en Blanes desde 70€. Gasolina incluida, hasta 5 personas. 7 embarcaciones disponibles. Reserva por WhatsApp +34 611 500 372.",
      ogTitle: "Alquiler de Barcos en Blanes y Lloret | Costa Brava 2026",
      ogDescription: "Descubre la Costa Brava desde el mar. 7 barcos con y sin licencia. Explora calas paradisíacas. ¡Reserva tu aventura hoy!",
    },
    en: {
      title: "Boat Rental Blanes & Lloret de Mar | Costa Brava",
      description: "Discover Costa Brava from the sea with our boats in Blanes. With or without license. Easy, fast and safe!",
      ogTitle: "Boat Rental in Blanes & Lloret de Mar | Costa Brava 2026",
      ogDescription: "Discover Costa Brava from the sea. 7 boats with and without license. Explore paradise coves. Book your adventure today!",
    },
    fr: {
      title: "Location de Bateaux Blanes sans Permis | Costa Brava",
      description: "Louez des bateaux sans permis à Blanes dès 70€. Essence incluse, jusqu'à 5 personnes. 7 embarcations disponibles.",
      ogTitle: "Location de Bateaux à Blanes | Costa Brava 2026",
      ogDescription: "Découvrez la Costa Brava depuis la mer. 7 bateaux avec et sans permis. Explorez les criques. Réservez maintenant!",
    },
    de: {
      title: "Bootsverleih Blanes ohne Führerschein | Costa Brava",
      description: "Mieten Sie Boote ohne Führerschein in Blanes ab 70€. Benzin inklusive, bis zu 5 Personen. 7 Boote verfügbar.",
      ogTitle: "Bootsverleih Blanes | Costa Brava 2026",
      ogDescription: "Entdecken Sie die Costa Brava vom Meer aus. 7 Boote mit und ohne Führerschein. Buchen Sie Ihr Abenteuer!",
    },
    ca: {
      title: "Lloguer de Barques a Blanes sense Llicència | Costa Brava",
      description: "Lloga barques sense llicència a Blanes des de 70€. Gasolina inclosa, fins a 5 persones. 7 embarcacions disponibles.",
      ogTitle: "Lloguer de Barques a Blanes | Costa Brava 2026",
      ogDescription: "Descobreix la Costa Brava des del mar. 7 barques amb i sense llicència. Explora cales paradisíaques.",
    },
    nl: {
      title: "Boothuur Blanes zonder Vaarbewijs | Costa Brava",
      description: "Huur boten zonder vaarbewijs in Blanes vanaf 70€. Benzine inbegrepen, tot 5 personen. 7 boten beschikbaar.",
      ogTitle: "Boothuur in Blanes | Costa Brava 2026",
      ogDescription: "Ontdek de Costa Brava vanaf zee. 7 boten met en zonder vaarbewijs. Boek uw avontuur!",
    },
    it: {
      title: "Noleggio Barche Blanes senza Patente | Costa Brava",
      description: "Noleggia barche senza patente a Blanes da 70€. Benzina inclusa, fino a 5 persone. 7 imbarcazioni disponibili.",
      ogTitle: "Noleggio Barche a Blanes | Costa Brava 2026",
      ogDescription: "Scopri la Costa Brava dal mare. 7 barche con e senza patente. Esplora calette paradisiache.",
    },
    ru: {
      title: "Аренда Лодок в Бланесе без Прав | Коста Брава",
      description: "Арендуйте лодки без прав в Бланесе от 70€. Бензин включен, до 5 человек. 7 судов в наличии.",
      ogTitle: "Аренда Лодок в Бланесе | Коста Брава 2026",
      ogDescription: "Откройте Коста Браву с моря. 7 лодок с правами и без. Забронируйте свое приключение!",
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
    fr: {
      title: "FAQ Location de Bateaux Blanes | Questions Fréquentes",
      description: "Ai-je besoin d'un permis? Qu'est-ce qui est inclus? Combien ça coûte? Toutes les réponses sur la location de bateaux à Blanes.",
    },
    de: {
      title: "FAQ Bootsverleih Blanes | Häufige Fragen",
      description: "Brauche ich einen Führerschein? Was ist inbegriffen? Wie viel kostet es? Alle Antworten zur Bootsmiete in Blanes.",
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
  },
  "/rutas": {
    es: {
      title: "Rutas en Barco desde Blanes | Costa Brava",
      description: "Descubre las mejores rutas en barco desde Blanes. Desde Sa Palomera hasta Tossa de Mar. Mapas interactivos y guía de navegación.",
      ogTitle: "Rutas en Barco desde Blanes | Costa Brava 2026",
      ogDescription: "5 rutas en barco desde Blanes. Sa Palomera, Cala Sant Francesc, Lloret de Mar, Tossa de Mar.",
    },
    en: {
      title: "Boat Routes from Blanes | Costa Brava",
      description: "Discover the best boat routes from Blanes. From Sa Palomera to Tossa de Mar. Interactive maps and navigation guide.",
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
  },
  "/barcos-sin-licencia": {
    es: {
      title: "Alquiler Barcos Sin Licencia Blanes | Costa Brava",
      description: "Barcos sin licencia en Blanes. Hasta 15 CV, 4-7 personas. No necesitas titulación. Fácil de manejar. ¡Reserva!",
      ogTitle: "Barcos Sin Licencia en Blanes | Fácil y Seguro Costa Brava",
      ogDescription: "Alquila barcos sin licencia en Blanes. Hasta 15 CV, 4-7 personas. No necesitas titulación.",
    },
    en: {
      title: "No License Boat Rental Blanes | Costa Brava",
      description: "No license boats in Blanes. Up to 15 HP, 4-7 people. No qualification needed. Easy to drive. Book!",
    },
  },
  "/barcos-con-licencia": {
    es: {
      title: "Alquiler Barcos Con Licencia Blanes | PER Costa Brava",
      description: "Barcos con licencia en Blanes. Potentes y rápidos. Requiere PER o titulación náutica. ¡Reserva tu barco!",
      ogTitle: "Barcos Con Licencia en Blanes | PER Costa Brava",
      ogDescription: "Barcos potentes y rápidos en Blanes. Requiere PER o titulación náutica. Máxima libertad en la Costa Brava.",
    },
    en: {
      title: "Licensed Boat Rental Blanes | ICC Costa Brava",
      description: "Licensed boats in Blanes. Powerful and fast. Requires ICC or boating license. Maximum freedom on Costa Brava.",
    },
  },
  "/alquiler-barcos-blanes": {
    es: {
      title: "Alquiler Barcos en Blanes Puerto | Costa Brava 2026",
      description: "Alquila barcos en Puerto de Blanes. Sin licencia y con licencia. 7 embarcaciones disponibles. Explora calas y playas. ¡Reserva ya!",
      ogTitle: "Alquiler de Barcos en Puerto de Blanes | Costa Brava 2026",
      ogDescription: "Alquila barcos desde Puerto de Blanes. Con y sin licencia. 7 embarcaciones disponibles.",
    },
    en: {
      title: "Boat Rental in Blanes Port | Costa Brava 2026",
      description: "Rent boats in Blanes Port. With and without license. 7 boats available. Explore coves and beaches. Book now!",
    },
  },
  "/alquiler-barcos-lloret-de-mar": {
    es: {
      title: "Excursión en Barco a Lloret de Mar desde Blanes",
      description: "Navega desde Blanes hasta Lloret de Mar. Alquiler de barcos con o sin licencia. Descubre las mejores playas y calas.",
      ogTitle: "Excursión en Barco a Lloret de Mar | Desde Blanes Costa Brava",
      ogDescription: "Navega desde Blanes hasta Lloret de Mar en barco. Descubre las mejores playas y calas.",
    },
    en: {
      title: "Boat Trip to Lloret de Mar from Blanes",
      description: "Sail from Blanes to Lloret de Mar. Boat rental with or without license. Discover the best beaches and coves.",
    },
  },
  "/alquiler-barcos-tossa-de-mar": {
    es: {
      title: "Excursión en Barco a Tossa de Mar desde Blanes",
      description: "Navega a Tossa de Mar en 1 hora desde Blanes. Descubre el pueblo medieval más bonito de la Costa Brava.",
      ogTitle: "Excursión en Barco a Tossa de Mar | Vila Vella desde Blanes",
      ogDescription: "Navega a Tossa de Mar en 1h desde Blanes. Descubre el pueblo medieval más bonito de la Costa Brava.",
    },
    en: {
      title: "Boat Trip to Tossa de Mar from Blanes",
      description: "Sail to Tossa de Mar in 1 hour from Blanes. Discover the most beautiful medieval town of Costa Brava.",
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
  },
  "/condiciones-generales": {
    es: {
      title: "Condiciones Generales de Alquiler | Costa Brava Rent a Boat",
      description: "Condiciones generales para el alquiler de embarcaciones en Blanes, Costa Brava.",
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
  },
  "/accesibilidad": {
    es: {
      title: "Declaración de Accesibilidad | Costa Brava Rent a Boat",
      description: "Declaración de accesibilidad web de Costa Brava Rent a Boat. Cumplimiento WCAG 2.1.",
    },
  },
  // Long-tail: these map to existing SPA routes but give AI crawlers ultra-specific meta
  "/destinos": {
    es: {
      title: "Destinos en Barco desde Blanes | Calas y Playas Costa Brava",
      description: "Descubre todos los destinos accesibles en barco desde Puerto de Blanes: Cala Brava, Lloret de Mar, Tossa de Mar, Sant Francesc y mas. Rutas con tiempos y distancias.",
      ogTitle: "Destinos en Barco desde Blanes | Costa Brava 2026",
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
  },
};

// Cached base HTML to avoid re-reading from disk on every request
let cachedBaseHtml: string | null = null;

async function getBaseHtml(distPath: string): Promise<string> {
  if (!cachedBaseHtml) {
    cachedBaseHtml = await fs.promises.readFile(
      path.resolve(distPath, "index.html"),
      "utf-8"
    );
  }
  return cachedBaseHtml;
}

function injectMeta(html: string, meta: SEOMeta, canonicalUrl: string, extraJsonLd?: object): string {
  const title = esc(meta.title);
  const desc = esc(meta.description);
  const ogTitle = esc(meta.ogTitle || meta.title);
  const ogDesc = esc(meta.ogDescription || meta.description);
  const canonical = esc(canonicalUrl);

  let result = html;
  result = result.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  result = result.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`);
  result = result.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${ogTitle}">`);
  result = result.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${ogDesc}">`);
  result = result.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${esc(BASE_URL + canonicalUrl)}">`);
  result = result.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`);

  // Replace og:image if a page-specific image is provided
  if (meta.ogImage) {
    const absImage = meta.ogImage.startsWith("http") ? meta.ogImage : `${BASE_URL}${meta.ogImage}`;
    result = result.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(absImage)}">`);
    result = result.replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${esc(absImage)}">`);
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
    if (articleTags.length > 0) {
      result = result.replace("</head>", `${articleTags.join("\n")}\n</head>`);
    }
  }

  // Inject extra JSON-LD before </head>
  if (extraJsonLd) {
    const jsonLdTag = `\n  <script type="application/ld+json">\n${JSON.stringify(extraJsonLd, null, 2)}\n  </script>`;
    result = result.replace("</head>", `${jsonLdTag}\n</head>`);
  }

  // Inject hreflang tags for all supported languages + x-default
  const HREFLANG_LANGUAGES = ["es", "en", "fr", "de", "nl", "it", "ca", "ru"];
  const hreflangTags = HREFLANG_LANGUAGES.map(lang => {
    const href = lang === "es"
      ? `${BASE_URL}${canonicalUrl}`
      : `${BASE_URL}${canonicalUrl}?lang=${lang}`;
    return `  <link rel="alternate" hreflang="${lang}" href="${esc(href)}" />`;
  });
  // x-default points to the base URL without ?lang= (same as es)
  hreflangTags.push(`  <link rel="alternate" hreflang="x-default" href="${esc(BASE_URL + canonicalUrl)}" />`);
  result = result.replace("</head>", `${hreflangTags.join("\n")}\n</head>`);

  return result;
}

// Build AggregateRating schema from DB testimonials (with Google Maps data as baseline)
async function buildAggregateRating(): Promise<object> {
  let ratingValue = 4.8;
  let reviewCount = 307; // Known Google Maps rating as baseline
  try {
    const testimonialsData = await storage.getTestimonials();
    if (testimonialsData && testimonialsData.length > 0) {
      const dbCount = testimonialsData.length;
      const dbAvg = testimonialsData.reduce((sum: number, t: { rating?: number | null }) => sum + (t.rating || 5), 0) / dbCount;
      // Blend Google Maps (307 reviews, 4.8) with DB reviews for a realistic aggregate
      const totalCount = reviewCount + dbCount;
      ratingValue = Math.round(((ratingValue * reviewCount + dbAvg * dbCount) / totalCount) * 10) / 10;
      reviewCount = totalCount;
    }
  } catch {
    // Fall back to hardcoded Google data
  }
  return {
    "@type": "AggregateRating",
    ratingValue: ratingValue.toFixed(1),
    bestRating: "5",
    worstRating: "1",
    reviewCount: String(reviewCount),
  };
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

// Build Product JSON-LD for a boat detail page (with VideoObject + urgency Offer)
function buildBoatProductSchema(boat: { id: string; name: string; requiresLicense: boolean; capacity: number; deposit: string; imageUrl: string | null; imageGallery: string[] | null }, fromPrice: number | null): object {
  const licenseText = boat.requiresLicense ? "con licencia náutica" : "sin licencia náutica";
  const offers: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    availabilityStarts: "2026-04-01",
    availabilityEnds: "2026-10-31",
    priceValidUntil: "2026-10-31",
    validFrom: "2026-04-01",
    businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
    eligibleRegion: { "@type": "Country", name: "ES" },
    seller: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat",
      "@id": `${BASE_URL}/#organization`,
    },
  };
  if (fromPrice) {
    offers.price = String(fromPrice);
    offers.priceSpecification = {
      "@type": "UnitPriceSpecification",
      price: fromPrice,
      priceCurrency: "EUR",
      unitText: "hour",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "HUR" },
    };
  }

  let imgUrl: string | undefined;
  if (boat.imageUrl) {
    imgUrl = boat.imageUrl.startsWith("http") ? boat.imageUrl : `${BASE_URL}/object-storage/${boat.imageUrl}`;
  }

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${boat.name} - Alquiler en Blanes Costa Brava`,
    description: `Alquila el ${boat.name} en Blanes, Costa Brava. Hasta ${boat.capacity} personas, ${licenseText}. Temporada 2026 abril-octubre.`,
    url: `${BASE_URL}/barco/${boat.id}`,
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
        const fullUrl = img.startsWith("http") ? img : `${BASE_URL}/object-storage/${img}`;
        allImages.push(fullUrl);
      }
    }
    schema.image = allImages;
    // VideoObject using boat image as thumbnail (aggressive but valid schema)
    schema.subjectOf = {
      "@type": "VideoObject",
      name: `${boat.name} - Alquiler de Barcos en Blanes Costa Brava`,
      description: `Descubre el ${boat.name} disponible para alquiler ${licenseText} en Puerto de Blanes. Hasta ${boat.capacity} personas. Temporada 2026.`,
      thumbnailUrl: imgUrl,
      uploadDate: "2026-03-01",
      contentUrl: `${BASE_URL}/barco/${boat.id}`,
      embedUrl: `${BASE_URL}/barco/${boat.id}`,
      duration: "PT1M30S",
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WatchAction",
        userInteractionCount: 150,
      },
    };
  }
  return schema;
}

// Build Event schema for the seasonal business (aggressive: recurring seasonal event)
function buildSeasonalEvent(isEn: boolean): object {
  return {
    "@type": "Event",
    name: isEn ? "Costa Brava Boat Rental Season 2026" : "Temporada de Alquiler de Barcos Costa Brava 2026",
    description: isEn
      ? "Boat rental season in Blanes, Costa Brava. April to October 2026. License-free boats from 70 EUR/hour. 9 boats available."
      : "Temporada de alquiler de barcos en Blanes, Costa Brava. Abril a octubre 2026. Barcos sin licencia desde 70 EUR/hora. 9 embarcaciones disponibles.",
    startDate: "2026-04-01",
    endDate: "2026-10-31",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "Puerto de Blanes",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Puerto de Blanes",
        addressLocality: "Blanes",
        addressRegion: "Girona",
        postalCode: "17300",
        addressCountry: "ES",
      },
      geo: { "@type": "GeoCoordinates", latitude: 41.6751, longitude: 2.7934 },
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
      validFrom: "2026-01-01",
      url: BASE_URL,
    },
    image: `${BASE_URL}/og-image.webp`,
    performer: {
      "@type": "Organization",
      name: "Costa Brava Rent a Boat",
    },
  };
}

interface ResolvedPage {
  meta: SEOMeta;
  jsonLd?: object;
}

async function resolveMeta(pathname: string, lang: LangCode): Promise<ResolvedPage | null> {
  // 1. Static page lookup
  const pageMeta = STATIC_META[pathname];
  if (pageMeta) {
    const meta = pageMeta[lang] || pageMeta["es"];
    if (!meta) return null;

    // Helper: build a BreadcrumbList schema for any page
    const buildBreadcrumb = (items: Array<{ name: string; url: string }>) => ({
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    });

    const isEn = lang === "en";
    const homeCrumb = { name: isEn ? "Home" : "Inicio", url: BASE_URL };

    // For home page: add rich JSON-LD graph with all schemas
    if (pathname === "/") {
      const aggregateRating = await buildAggregateRating();
      const localBusiness = {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/#organization`,
        name: "Costa Brava Rent a Boat Blanes",
        legalName: "Costa Brava Rent a Boat - Blanes",
        description: "Alquiler de barcos sin licencia y con licencia en Blanes, Costa Brava. Puerto de Blanes. 7 embarcaciones para 4-7 personas.",
        url: BASE_URL,
        telephone: "+34611500372",
        email: "costabravarentaboat@gmail.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Puerto de Blanes",
          addressLocality: "Blanes",
          addressRegion: "Girona",
          postalCode: "17300",
          addressCountry: "ES",
        },
        geo: { "@type": "GeoCoordinates", latitude: 41.6751, longitude: 2.7934 },
        containedInPlace: GEO_HIERARCHY,
        openingHoursSpecification: [{
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
          opens: "09:00",
          closes: "20:00",
          validFrom: "2026-04-01",
          validThrough: "2026-10-31",
        }],
        priceRange: "€€",
        aggregateRating,
        image: `${BASE_URL}/og-image.webp`,
        knowsAbout: [
          "Costa Brava", "Blanes", "Boat Rental", "Boat Navigation",
          "Maritime Safety", "License-Free Boating", "Lloret de Mar",
          "Tossa de Mar", "Mediterranean Sea", "Nautical Tourism",
          "Costa Brava Coves", "Water Sports"
        ],
        sameAs: [
          "https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5",
          "https://www.instagram.com/costabravarentaboat/",
          "https://www.facebook.com/costabravarentaboat",
          "https://www.tiktok.com/@costabravarentaboat",
        ],
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["h1", ".hero-description"]
        }
      };
      const webSite = {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        name: "Costa Brava Rent a Boat Blanes",
        url: BASE_URL,
        inLanguage: ["es-ES","en-GB","ca-ES","fr-FR","de-DE","nl-NL","it-IT","ru-RU"],
        publisher: { "@type": "LocalBusiness", "@id": `${BASE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/?q={search_term_string}` },
          "query-input": "required name=search_term_string"
        }
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
          { "@type": "HowToStep", position: 1, name: "Choose your boat", text: "Select from license-free boats (from 70 EUR/hour) or licensed boats (from 150 EUR/2 hours)." },
          { "@type": "HowToStep", position: 2, name: "Select date and time", text: "Choose date, start time, and duration. Available April to October, 09:00-20:00." },
          { "@type": "HowToStep", position: 3, name: "Confirm booking", text: "Book via WhatsApp (+34 611 500 372) or website. No deposit for license-free boats." },
          { "@type": "HowToStep", position: 4, name: "Receive briefing", text: "15-minute training on boat handling and safety at Puerto de Blanes." },
          { "@type": "HowToStep", position: 5, name: "Explore Costa Brava", text: "Discover coves and beaches. Fuel, insurance and safety equipment included." },
        ] : [
          { "@type": "HowToStep", position: 1, name: "Elige tu barco", text: "Selecciona entre barcos sin licencia (desde 70 EUR/hora) o con licencia (desde 150 EUR/2 horas)." },
          { "@type": "HowToStep", position: 2, name: "Selecciona fecha y horario", text: "Elige fecha, hora de inicio y duracion. Disponible de abril a octubre, 09:00-20:00." },
          { "@type": "HowToStep", position: 3, name: "Confirma tu reserva", text: "Reserva por WhatsApp (+34 611 500 372) o web. No se requiere deposito para barcos sin licencia." },
          { "@type": "HowToStep", position: 4, name: "Recibe tu briefing", text: "Formacion de 15 minutos sobre manejo del barco y seguridad en Puerto de Blanes." },
          { "@type": "HowToStep", position: 5, name: "Navega por la Costa Brava", text: "Explora calas y playas. Combustible, seguro y equipo de seguridad incluidos." },
        ]
      };
      const faq = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: lang === "en" ? "Do I need a license to rent a boat in Blanes?" : "Necesito licencia para alquilar un barco en Blanes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: lang === "en"
                ? "No. We have 5 license-free boats for up to 5 people. You only need to be 18+. We provide a 15-minute training."
                : "No. Tenemos 5 barcos sin licencia para hasta 5 personas. Solo necesitas ser mayor de 18. Te damos formacion de 15 minutos."
            }
          },
          {
            "@type": "Question",
            name: lang === "en" ? "How much does it cost to rent a boat in Blanes?" : "Cuanto cuesta alquilar un barco en Blanes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: lang === "en"
                ? "License-free boats from 70 EUR/hour (low season) to 95 EUR/hour (high season). Price includes fuel, insurance and safety equipment."
                : "Barcos sin licencia desde 70 EUR/hora (temporada baja) hasta 95 EUR/hora (temporada alta). Precio incluye combustible, seguro y equipo de seguridad."
            }
          },
          {
            "@type": "Question",
            name: lang === "en" ? "What is included in the boat rental price?" : "Que incluye el precio del alquiler?",
            acceptedAnswer: {
              "@type": "Answer",
              text: lang === "en"
                ? "Fuel, insurance, safety equipment (life jackets, fire extinguisher, anchor), and a 15-minute safety briefing."
                : "Combustible, seguro, equipo de seguridad (chalecos, extintor, ancla) y formacion de seguridad de 15 minutos."
            }
          },
        ]
      };
      const seasonalEvent = buildSeasonalEvent(isEn);
      const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [localBusiness, webSite, howTo, faq, seasonalEvent]
      };
      return { meta, jsonLd };
    }

    // /faq - FAQPage schema (critical for AI search extraction)
    else if (pathname === "/faq") {
      const faqPage = {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: isEn ? "Do I need a license to rent a boat in Blanes?" : "Necesito licencia para alquilar un barco en Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "No. We have 5 license-free boats (up to 15 HP) for up to 5 people. You only need to be 18+. We provide a 15-minute safety briefing."
              : "No. Tenemos 5 barcos sin licencia (hasta 15 CV) para hasta 5 personas. Solo necesitas ser mayor de 18 anos. Te damos una formacion de seguridad de 15 minutos." },
          },
          {
            "@type": "Question",
            name: isEn ? "How much does it cost to rent a boat in Blanes?" : "Cuanto cuesta alquilar un barco en Blanes?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "License-free boats from 70 EUR/hour (low season) to 95 EUR/hour (high season). Licensed boats from 150 EUR/2 hours. Fuel, insurance and safety equipment are always included."
              : "Barcos sin licencia desde 70 EUR/hora (temporada baja) hasta 95 EUR/hora (temporada alta). Barcos con licencia desde 150 EUR/2 horas. Combustible, seguro y equipo de seguridad siempre incluidos." },
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
            name: isEn ? "What is the cancellation policy?" : "Cual es la politica de cancelacion?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Free cancellation up to 24 hours before departure. Same-day cancellations may be rescheduled depending on availability. In case of bad weather, we offer full rescheduling."
              : "Cancelacion gratuita hasta 24 horas antes de la salida. Cancelaciones del mismo dia pueden reprogramarse segun disponibilidad. En caso de mal tiempo, ofrecemos reprogramacion completa." },
          },
          {
            "@type": "Question",
            name: isEn ? "Where can I navigate with the rental boats?" : "Donde puedo navegar con los barcos de alquiler?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "License-free boats can navigate up to 2 nautical miles from the coast. You can explore from Sa Palomera to Lloret de Mar. Licensed boats can reach Tossa de Mar and beyond."
              : "Los barcos sin licencia pueden navegar hasta 2 millas nauticas de la costa. Puedes explorar desde Sa Palomera hasta Lloret de Mar. Los barcos con licencia pueden llegar hasta Tossa de Mar y mas alla." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: "FAQ", url: `${BASE_URL}/faq` }]);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [faqPage, breadcrumb] } };
    }

    // /testimonios - LocalBusiness with AggregateRating + individual Reviews
    else if (pathname === "/testimonios") {
      const aggregateRating = await buildAggregateRating();
      const localBusiness: Record<string, unknown> = {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/#organization`,
        name: "Costa Brava Rent a Boat Blanes",
        url: BASE_URL,
        telephone: "+34611500372",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Puerto de Blanes",
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
              datePublished: t.createdAt ? new Date(t.createdAt as string).toISOString().split("T")[0] : "2026-01-01",
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
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [localBusiness, breadcrumb] } };
    }

    // /alquiler-barcos-blanes - TouristDestination + FAQPage for Blanes
    else if (pathname === "/alquiler-barcos-blanes") {
      const destination = {
        "@type": "TouristDestination",
        name: isEn ? "Blanes Port - Boat Rental" : "Puerto de Blanes - Alquiler de Barcos",
        description: isEn
          ? "Rent boats in Blanes Port, the gateway to Costa Brava. 7 boats available with and without license. Explore coves, beaches, and the Mediterranean coast."
          : "Alquila barcos en el Puerto de Blanes, la puerta de la Costa Brava. 7 embarcaciones disponibles con y sin licencia. Explora calas, playas y la costa mediterranea.",
        url: `${BASE_URL}/alquiler-barcos-blanes`,
        touristType: [
          { "@type": "Audience", audienceType: isEn ? "Nautical tourists" : "Turistas nauticos" },
          { "@type": "Audience", audienceType: isEn ? "Families with children" : "Familias con ninos" },
          { "@type": "Audience", audienceType: isEn ? "Adventure seekers" : "Buscadores de aventura" },
        ],
        geo: { "@type": "GeoCoordinates", latitude: 41.6751, longitude: 2.7934 },
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
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [destination, faq, breadcrumb] } };
    }

    // /alquiler-barcos-lloret-de-mar - TouristDestination + FAQPage for Lloret
    else if (pathname === "/alquiler-barcos-lloret-de-mar") {
      const destination = {
        "@type": "TouristDestination",
        name: isEn ? "Boat Trip to Lloret de Mar from Blanes" : "Excursion en Barco a Lloret de Mar desde Blanes",
        description: isEn
          ? "Sail from Blanes to Lloret de Mar and discover stunning coves and beaches along the Costa Brava coastline."
          : "Navega desde Blanes hasta Lloret de Mar y descubre calas y playas impresionantes a lo largo de la costa de la Costa Brava.",
        url: `${BASE_URL}/alquiler-barcos-lloret-de-mar`,
        touristType: [
          { "@type": "Audience", audienceType: isEn ? "Nautical tourists" : "Turistas nauticos" },
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
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [destination, faq, breadcrumb] } };
    }

    // /alquiler-barcos-tossa-de-mar - TouristDestination + FAQPage for Tossa
    else if (pathname === "/alquiler-barcos-tossa-de-mar") {
      const destination = {
        "@type": "TouristDestination",
        name: isEn ? "Boat Trip to Tossa de Mar from Blanes" : "Excursion en Barco a Tossa de Mar desde Blanes",
        description: isEn
          ? "Sail from Blanes to Tossa de Mar in about 1 hour. Discover the medieval Vila Vella, stunning cliffs, and hidden coves."
          : "Navega desde Blanes hasta Tossa de Mar en aproximadamente 1 hora. Descubre la Vila Vella medieval, acantilados impresionantes y calas escondidas.",
        url: `${BASE_URL}/alquiler-barcos-tossa-de-mar`,
        touristType: [
          { "@type": "Audience", audienceType: isEn ? "Nautical tourists" : "Turistas nauticos" },
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
            name: isEn ? "Do I need a license to reach Tossa de Mar by boat?" : "Necesito licencia para llegar a Tossa de Mar en barco?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "Yes, Tossa de Mar is beyond the 2-mile zone for license-free boats. You need a licensed boat (PER/ICC) or our private excursion with captain."
              : "Si, Tossa de Mar esta mas alla de la zona de 2 millas para barcos sin licencia. Necesitas un barco con licencia (PER) o nuestra excursion privada con patron." },
          },
          {
            "@type": "Question",
            name: isEn ? "What can I see on the boat trip to Tossa de Mar?" : "Que puedo ver en la excursion en barco a Tossa de Mar?",
            acceptedAnswer: { "@type": "Answer", text: isEn
              ? "You'll see dramatic cliffs, hidden coves like Cala Pola, the iconic Vila Vella medieval fortress, and crystal-clear Mediterranean waters."
              : "Veras acantilados dramaticos, calas escondidas como Cala Pola, la iconica fortaleza medieval de la Vila Vella y aguas cristalinas del Mediterraneo." },
          },
        ],
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Tossa de Mar by Boat" : "Tossa de Mar en Barco", url: `${BASE_URL}/alquiler-barcos-tossa-de-mar` }]);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [destination, faq, breadcrumb] } };
    }

    // /barcos-sin-licencia - ItemList of 5 license-free boats
    else if (pathname === "/barcos-sin-licencia") {
      const noLicenseBoats = [
        { id: "solar-450", name: "Solar 450", capacity: 5, price: "75" },
        { id: "remus-450", name: "Remus 450", capacity: 5, price: "75" },
        { id: "remus-450-ii", name: "Remus 450 II", capacity: 5, price: "75" },
        { id: "astec-400", name: "Astec 400", capacity: 4, price: "70" },
        { id: "astec-480", name: "Astec 480", capacity: 5, price: "80" },
      ];
      const itemList = {
        "@type": "ItemList",
        name: isEn ? "License-Free Boats in Blanes" : "Barcos Sin Licencia en Blanes",
        description: isEn
          ? "5 license-free boats available for rent in Blanes, Costa Brava. No qualification needed, up to 15 HP."
          : "5 barcos sin licencia disponibles para alquilar en Blanes, Costa Brava. No se necesita titulacion, hasta 15 CV.",
        numberOfItems: 5,
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
              availabilityStarts: "2026-04-01",
              availabilityEnds: "2026-10-31",
              priceValidUntil: "2026-10-31",
              businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
            },
          },
        })),
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "No License Boats" : "Barcos Sin Licencia", url: `${BASE_URL}/barcos-sin-licencia` }]);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [itemList, breadcrumb] } };
    }

    // /barcos-con-licencia - ItemList of 4 licensed boats
    else if (pathname === "/barcos-con-licencia") {
      const licensedBoats = [
        { id: "mingolla-brava-19", name: "Mingolla Brava 19", capacity: 6, price: "150" },
        { id: "trimarchi-57s", name: "Trimarchi 57S", capacity: 7, price: "200" },
        { id: "pacific-craft-625", name: "Pacific Craft 625", capacity: 7, price: "250" },
        { id: "excursion-privada", name: "Excursion Privada con Capitan", capacity: 7, price: "300" },
      ];
      const itemList = {
        "@type": "ItemList",
        name: isEn ? "Licensed Boats in Blanes" : "Barcos Con Licencia en Blanes",
        description: isEn
          ? "4 licensed boats available for rent in Blanes, Costa Brava. Powerful engines for longer routes to Tossa de Mar."
          : "4 barcos con licencia disponibles para alquilar en Blanes, Costa Brava. Motores potentes para rutas mas largas hasta Tossa de Mar.",
        numberOfItems: 4,
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
              availabilityStarts: "2026-04-01",
              availabilityEnds: "2026-10-31",
              priceValidUntil: "2026-10-31",
              businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
            },
          },
        })),
      };
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Licensed Boats" : "Barcos Con Licencia", url: `${BASE_URL}/barcos-con-licencia` }]);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [itemList, breadcrumb] } };
    }

    // /rutas - ItemList of routes
    else if (pathname === "/rutas") {
      const itemList = {
        "@type": "ItemList",
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
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [itemList, breadcrumb] } };
    }

    // /galeria - BreadcrumbList only
    else if (pathname === "/galeria") {
      const breadcrumb = buildBreadcrumb([homeCrumb, { name: isEn ? "Gallery" : "Galeria", url: `${BASE_URL}/galeria` }]);
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [breadcrumb] } };
    }

    // /tarjetas-regalo - Product schema for gift cards
    else if (pathname === "/tarjetas-regalo") {
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
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [product, breadcrumb] } };
    }

    // /blog - CollectionPage schema
    else if (pathname === "/blog") {
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
      return { meta, jsonLd: { "@context": "https://schema.org", "@graph": [collectionPage, breadcrumb] } };
    }

    return { meta };
  }

  // 2. Boat detail pages: /barco/:id
  const boatMatch = pathname.match(/^\/barco\/([^/]+)$/);
  if (boatMatch) {
    const boatId = boatMatch[1];
    try {
      const boats = await storage.getAllBoats();
      const boat = boats.find(b => b.id === boatId);
      if (boat) {
        const licenseText = boat.requiresLicense
          ? (lang === "en" ? "with license" : "con licencia")
          : (lang === "en" ? "without license" : "sin licencia");
        const fromPrice = (() => {
          if (!boat.pricing) return null;
          const seasons = Object.values(boat.pricing) as Array<{ prices?: Record<string, number> }>;
          const prices = seasons.flatMap(s => s?.prices ? Object.values(s.prices) : []);
          return prices.length > 0 ? Math.min(...prices) : null;
        })();
        const priceStr = fromPrice ? ` | Desde ${fromPrice}€` : "";
        // Build boat-specific og:image URL
        const boatOgImage = boat.imageUrl
          ? (boat.imageUrl.startsWith("http") ? boat.imageUrl
            : boat.imageUrl.startsWith("/") ? boat.imageUrl
            : `/object-storage/${boat.imageUrl}`)
          : undefined;
        const meta: SEOMeta = lang === "en"
          ? {
              title: `Rent ${boat.name} in Blanes (${licenseText}) | Costa Brava${priceStr}`,
              description: `Book the ${boat.name} in Blanes, Costa Brava. Up to ${boat.capacity} people, ${licenseText}. Reserve via WhatsApp.`,
              ogImage: boatOgImage,
              ogType: "product",
            }
          : {
              title: `Alquiler ${boat.name} en Blanes (${licenseText}) | Costa Brava${priceStr}`,
              description: `Alquila el ${boat.name} en Blanes, Costa Brava. Hasta ${boat.capacity} personas, ${licenseText}. Reserva por WhatsApp.`,
              ogImage: boatOgImage,
              ogType: "product",
            };
        const jsonLd = buildBoatProductSchema(boat, fromPrice);
        return { meta, jsonLd };
      }
    } catch {
      // fall through
    }
  }

  // 3. Blog post pages: /blog/:slug
  const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    try {
      const posts = await storage.getAllBlogPosts();
      const post = posts.find(p => p.slug === slug && p.isPublished);
      if (post) {
        // Build blog-specific og:image URL
        const postOgImage = post.featuredImage
          ? (post.featuredImage.startsWith("http") ? post.featuredImage
            : post.featuredImage.startsWith("/") ? post.featuredImage
            : `/object-storage/${post.featuredImage}`)
          : undefined;
        const publishedTime = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;
        const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : publishedTime;
        const meta: SEOMeta = {
          title: `${post.title} | Costa Brava Rent a Boat`,
          description: post.excerpt || post.metaDescription || post.title,
          ogImage: postOgImage,
          ogType: "article",
          articleMeta: {
            publishedTime,
            modifiedTime,
            author: "Costa Brava Rent a Boat",
            section: (post.category as string) || "Navegacion",
          },
        };
        const jsonLd: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: meta.description,
          url: `${BASE_URL}/blog/${slug}`,
          datePublished: post.publishedAt || post.createdAt,
          dateModified: post.updatedAt || post.publishedAt,
          author: { "@type": "Organization", name: "Costa Brava Rent a Boat" },
          publisher: {
            "@type": "Organization",
            name: "Costa Brava Rent a Boat",
            logo: { "@type": "ImageObject", url: `${BASE_URL}/assets/og-image.png` },
          },
        };
        if (postOgImage) {
          const absImage = postOgImage.startsWith("http") ? postOgImage : `${BASE_URL}${postOgImage}`;
          jsonLd.image = absImage;
        }
        return { meta, jsonLd };
      }
    } catch {
      // fall through
    }
  }

  return null;
}

// Valid SPA routes — used to return 404 for unknown paths
const VALID_SPA_ROUTES = new Set([
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
  "/alquiler-barcos-cerca-barcelona",
  "/alquiler-barcos-costa-brava",
  "/barcos-sin-licencia",
  "/barcos-con-licencia",
  "/galeria",
  "/rutas",
  "/tarjetas-regalo",
  "/testimonios",
  "/precios",
  "/blog",
  "/barcos",
]);

// Dynamic route patterns
const VALID_DYNAMIC_PATTERNS = [
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
  if (VALID_SPA_ROUTES.has(cleanPath)) return true;
  return VALID_DYNAMIC_PATTERNS.some(pattern => pattern.test(cleanPath));
}

export async function serveWithSEO(
  req: Request,
  res: Response,
  distPath: string
): Promise<void> {
  try {
    const parsedUrl = new URL(req.originalUrl, "http://localhost");
    const pathname = parsedUrl.pathname;
    const langParam = parsedUrl.searchParams.get("lang");
    const lang: LangCode = (["es", "ca", "en", "fr", "de", "nl", "it", "ru"].includes(langParam || "") ? langParam : "es") as LangCode;

    // The canonical URL for this page (strip trailing slash, no query params — languages handled via hreflang)
    const canonicalPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    const canonicalUrl = canonicalPath;

    const resolved = await resolveMeta(canonicalPath, lang);
    if (resolved) {
      // Override with DB-sourced meta if available (seo_meta table)
      const dbMeta = await getDbMeta(canonicalPath, lang);
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
      const html = injectMeta(baseHtml, resolved.meta, canonicalUrl, resolved.jsonLd);
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=300, must-revalidate"); // 5 min cache for SEO-injected pages
      res.send(html);
    } else {
      // If route is unknown, send 404 status so crawlers don't index non-existent pages
      const status = isValidSPARoute(pathname) ? 200 : 404;
      res.status(status).sendFile(path.resolve(distPath, "index.html"));
    }
  } catch {
    const parsedUrl = new URL(req.originalUrl, "http://localhost");
    const status = isValidSPARoute(parsedUrl.pathname) ? 200 : 404;
    res.status(status).sendFile(path.resolve(distPath, "index.html"));
  }
}
