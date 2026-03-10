import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { storage } from "./storage";

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
}

type LangCode = "es" | "ca" | "en" | "fr" | "de" | "nl" | "it" | "ru";

// Escape special HTML attribute characters
function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

// Build Product JSON-LD for a boat detail page
function buildBoatProductSchema(boat: { id: string; name: string; requiresLicense: boolean; capacity: number; deposit: string; imageUrl: string | null }, fromPrice: number | null): object {
  const licenseText = boat.requiresLicense ? "con licencia náutica" : "sin licencia náutica";
  const offers: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat",
    },
  };
  if (fromPrice) {
    offers.price = String(fromPrice);
    offers.priceSpecification = {
      "@type": "UnitPriceSpecification",
      price: fromPrice,
      priceCurrency: "EUR",
      unitText: "hour",
    };
  }
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${boat.name} - Alquiler en Blanes Costa Brava`,
    description: `Alquila el ${boat.name} en Blanes, Costa Brava. Hasta ${boat.capacity} personas, ${licenseText}.`,
    url: `${BASE_URL}/barco/${boat.id}`,
    brand: {
      "@type": "Brand",
      name: "Costa Brava Rent a Boat",
    },
    offers,
  };
  if (boat.imageUrl) {
    const imgUrl = boat.imageUrl.startsWith("http") ? boat.imageUrl : `${BASE_URL}/object-storage/${boat.imageUrl}`;
    schema.image = imgUrl;
  }
  return schema;
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
      const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [localBusiness, webSite, howTo, faq]
      };
      return { meta, jsonLd };
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
        const meta = lang === "en"
          ? {
              title: `Rent ${boat.name} in Blanes (${licenseText}) | Costa Brava${priceStr}`,
              description: `Book the ${boat.name} in Blanes, Costa Brava. Up to ${boat.capacity} people, ${licenseText}. Reserve via WhatsApp.`,
            }
          : {
              title: `Alquiler ${boat.name} en Blanes (${licenseText}) | Costa Brava${priceStr}`,
              description: `Alquila el ${boat.name} en Blanes, Costa Brava. Hasta ${boat.capacity} personas, ${licenseText}. Reserva por WhatsApp.`,
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
        const meta = {
          title: `${post.title} | Costa Brava Rent a Boat`,
          description: post.excerpt || post.metaDescription || post.title,
        };
        const jsonLd = {
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
            logo: { "@type": "ImageObject", url: `${BASE_URL}/og-image.webp` },
          },
        };
        return { meta, jsonLd };
      }
    } catch {
      // fall through
    }
  }

  return null;
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
      const baseHtml = await getBaseHtml(distPath);
      const html = injectMeta(baseHtml, resolved.meta, canonicalUrl, resolved.jsonLd);
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=300, must-revalidate"); // 5 min cache for SEO-injected pages
      res.send(html);
    } else {
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  } catch {
    res.sendFile(path.resolve(distPath, "index.html"));
  }
}
