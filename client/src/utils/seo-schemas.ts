import { BASE_DOMAIN } from "./seo-config";

interface ListItem {
  id: string;
  name: string;
}

export function generateItemListSchema(items: ListItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${BASE_DOMAIN}/barco/${item.id}`,
      "name": item.name
    }))
  };
}

interface BlogArticle {
  headline: string;
  slug: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  category?: string;
  body?: string;
}

export function generateArticleSchema(article: BlogArticle) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.headline,
    "description": article.description,
    "author": [{
      "@type": "Organization",
      "name": article.author,
      "url": BASE_DOMAIN
    }],
    "publisher": {
      "@type": "Organization",
      "name": "Costa Brava Rent a Boat",
      "url": BASE_DOMAIN,
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_DOMAIN}/logo.png`
      }
    },
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${BASE_DOMAIN}/blog/${article.slug}`
    }
  };

  // Add image if available
  if (article.image) {
    schema.image = article.image.startsWith('http') 
      ? article.image 
      : `${BASE_DOMAIN}${article.image}`;
  }

  // Add articleSection (category) if available
  if (article.category) {
    schema.articleSection = article.category;
  }

  // Add articleBody if available (improves rich result eligibility)
  if (article.body) {
    schema.articleBody = article.body;
  }

  // Add word count and reading time
  if (article.body) {
    const wordCount = article.body.split(/\s+/).filter(Boolean).length;
    schema.wordCount = wordCount;
    schema.timeRequired = `PT${Math.ceil(wordCount / 200)}M`;
  }

  // Link to parent website
  schema.isPartOf = {
    "@type": "WebSite",
    "name": "Costa Brava Rent a Boat",
    "@id": `${BASE_DOMAIN}/#website`
  };

  // Speakable specification for voice assistants
  schema.speakable = {
    "@type": "SpeakableSpecification",
    "cssSelector": ["h1", ".blog-content p:first-of-type"]
  };

  return schema;
}

// S2: BreadcrumbList JSON-LD schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// S3: FAQPage JSON-LD schema
interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function generateSeasonalEventSchema() {
  const now = new Date();
  const year = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `Temporada ${year} — Alquiler de Barcos en Costa Brava`,
    startDate: `${year}-04-01`,
    endDate: `${year}-10-31`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: "Puerto de Blanes",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Puerto Deportivo de Blanes",
        addressLocality: "Blanes",
        addressRegion: "Girona",
        postalCode: "17300",
        addressCountry: "ES",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Costa Brava Rent a Boat",
      url: "https://www.costabravarentaboat.com",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "80",
      highPrice: "450",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    description: "Alquila barcos sin licencia en Blanes, Costa Brava. Temporada de abril a octubre.",
  };
}

interface PlaceDestination {
  name: string;
  slug: string;
  description: string;
  coordinates?: { lat: number; lng: number };
  image?: string;
  address?: string;
}

export function generatePlaceSchema(place: PlaceDestination) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": place.name,
    "description": place.description,
    "url": `${BASE_DOMAIN}/destinos/${place.slug}`
  };

  // Add image if available
  if (place.image) {
    schema.image = place.image.startsWith('http') 
      ? place.image 
      : `${BASE_DOMAIN}${place.image}`;
  }

  // Add geo coordinates if available
  if (place.coordinates) {
    schema.geo = {
      "@type": "GeoCoordinates",
      "latitude": place.coordinates.lat.toString(),
      "longitude": place.coordinates.lng.toString()
    };
  }

  // Add address info
  schema.address = {
    "@type": "PostalAddress",
    "addressLocality": "Blanes",
    "addressRegion": "Girona",
    "addressCountry": "ES"
  };

  return schema;
}

// ═══════════════════════════════════════════════════════════════════════════
// Coves accessible from Port of Blanes — ItemList with Place schema per cove.
// GEO benefit: answer engines enumerate specific coves for queries like
// "calas cerca de Blanes sin licencia", "Sa Forcanera access", "7 calas
// Blanes Fenals". Each Place has real geo coords + description + access info.
// ═══════════════════════════════════════════════════════════════════════════

interface CoveData {
  name: string;
  description: string;
  lat: number;
  lng: number;
  timeFromPort: string; // ISO 8601 duration (PT5M = 5 min)
  distanceNM: number;   // Nautical miles from port
  licenseRequired: boolean;
  isEndpoint?: boolean;
}

const COVES_FROM_BLANES: CoveData[] = [
  { name: "Sa Palomera", description: "Roca emblemática en el Port de Blanes, punto de referencia costero. Primera parada natural. Aguas cristalinas.", lat: 41.6717, lng: 2.7963, timeFromPort: "PT2M", distanceNM: 0.1, licenseRequired: false },
  { name: "Sa Forcanera", description: "Cala virgen rocosa con fondo de grava. Biodiversidad marina rica, ideal para snorkel.", lat: 41.6727, lng: 2.8020, timeFromPort: "PT5M", distanceNM: 0.4, licenseRequired: false },
  { name: "Cala Sant Francesc (Blanes)", description: "Cala con pinos hasta la arena y aguas turquesa. Protegida del viento del norte. Ideal para primer snorkel.", lat: 41.6735, lng: 2.8060, timeFromPort: "PT8M", distanceNM: 0.7, licenseRequired: false },
  { name: "Cala de s'Agulla", description: "Cala pequeña semi-virgen, acceso difícil por tierra. Agua transparente.", lat: 41.6820, lng: 2.8120, timeFromPort: "PT12M", distanceNM: 1.2, licenseRequired: false },
  { name: "Cala Treumal", description: "Cala rocosa con pinos, aguas cristalinas. Fondeo tranquilo. Acceso a pie por camino de ronda.", lat: 41.6860, lng: 2.8185, timeFromPort: "PT15M", distanceNM: 1.6, licenseRequired: false },
  { name: "Playa de Santa Cristina", description: "Playa familiar tranquila con pinar. Servicios playeros en temporada. Fondo arenoso.", lat: 41.6906, lng: 2.8260, timeFromPort: "PT18M", distanceNM: 2.0, licenseRequired: false },
  { name: "Cala Sa Boadella", description: "Cala semi-virgen con sección naturista. Roca y pinos. Acceso a pie difícil, barco la mejor opción.", lat: 41.6938, lng: 2.8370, timeFromPort: "PT22M", distanceNM: 2.4, licenseRequired: false },
  { name: "Playa de Fenals", description: "Playa urbana al sur de Lloret de Mar. Límite norte legal para embarcaciones sin licencia desde Blanes.", lat: 41.6988, lng: 2.8466, timeFromPort: "PT25M", distanceNM: 2.8, licenseRequired: false, isEndpoint: true },
];

export function generateCovesItemListSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": "https://www.costabravarentaboat.com/#coves-from-blanes",
    "name": "Calas accesibles desde el Puerto de Blanes con barco sin licencia",
    "description": "Lista ordenada de las 8 calas principales entre Blanes y Playa de Fenals accesibles con barco sin licencia en menos de 25 minutos de navegación (límite legal 2 millas náuticas, 5 nudos).",
    "numberOfItems": COVES_FROM_BLANES.length,
    "itemListOrder": "https://schema.org/ItemListOrderAscending",
    "itemListElement": COVES_FROM_BLANES.map((cove, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Place",
        "name": cove.name,
        "description": cove.description,
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": cove.lat,
          "longitude": cove.lng,
        },
        "containedInPlace": {
          "@type": "AdministrativeArea",
          "name": "Costa Brava",
          "sameAs": "https://en.wikipedia.org/wiki/Costa_Brava",
        },
        "publicAccess": true,
        "additionalProperty": [
          { "@type": "PropertyValue", "name": "Tiempo de navegación desde Port de Blanes", "value": cove.timeFromPort, "unitCode": "MIN" },
          { "@type": "PropertyValue", "name": "Distancia náutica desde Port de Blanes", "value": cove.distanceNM, "unitText": "millas náuticas" },
          { "@type": "PropertyValue", "name": "Requiere licencia náutica", "value": cove.licenseRequired },
          ...(cove.isEndpoint ? [{ "@type": "PropertyValue", "name": "Límite norte legal sin-licencia", "value": true }] : []),
        ],
      },
    })),
  };
}

