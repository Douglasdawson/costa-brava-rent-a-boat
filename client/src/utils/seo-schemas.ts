import { BASE_DOMAIN } from "./seo-config";
import type { Translations } from "@/lib/translations";

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

export function generateSeasonalEventSchema(
  priceRange?: { low: number; high: number } | null,
  t?: Translations,
) {
  const now = new Date();
  const year = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();
  // Fallbacks used only before the /api/boats query resolves; keep conservative.
  const low = priceRange?.low ?? 75;
  const high = priceRange?.high ?? 450;
  const ev = t?.seoSchemas?.seasonalEvent;
  const name = (ev?.name ?? `Temporada {year} — Alquiler de Barcos en Costa Brava`).replace("{year}", String(year));
  const description = ev?.description ?? "Alquila barcos sin licencia en Blanes, Costa Brava. Temporada de abril a octubre.";
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
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
      lowPrice: String(low),
      highPrice: String(high),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    description,
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

type CoveDescKey =
  | "saPalomera"
  | "saForcanera"
  | "calaSantFrancescBlanes"
  | "calaDeSAgulla"
  | "calaTreumal"
  | "playaDeSantaCristina"
  | "calaSaBoadella"
  | "playaDeFenals";

interface CoveData {
  name: string;
  descKey: CoveDescKey;
  lat: number;
  lng: number;
  timeFromPort: string; // ISO 8601 duration (PT5M = 5 min)
  distanceNM: number;   // Nautical miles from port
  licenseRequired: boolean;
  isEndpoint?: boolean;
}

// Spanish fallback descriptions — used only when `t` is not passed to the
// schema generator. In production, HomePageSEO passes `t` so the emitted
// JSON-LD matches the user's language.
const COVE_DESC_FALLBACK_ES: Record<CoveDescKey, string> = {
  saPalomera: "Roca emblemática en el Port de Blanes, punto de referencia costero. Primera parada natural. Aguas cristalinas.",
  saForcanera: "Cala virgen rocosa con fondo de grava. Biodiversidad marina rica, ideal para snorkel.",
  calaSantFrancescBlanes: "Cala con pinos hasta la arena y aguas turquesa. Protegida del viento del norte. Ideal para primer snorkel.",
  calaDeSAgulla: "Cala pequeña semi-virgen, acceso difícil por tierra. Agua transparente.",
  calaTreumal: "Cala rocosa con pinos, aguas cristalinas. Fondeo tranquilo. Acceso a pie por camino de ronda.",
  playaDeSantaCristina: "Playa familiar tranquila con pinar. Servicios playeros en temporada. Fondo arenoso.",
  calaSaBoadella: "Cala semi-virgen con sección naturista. Roca y pinos. Acceso a pie difícil, barco la mejor opción.",
  playaDeFenals: "Playa urbana al sur de Lloret de Mar. Límite norte legal para embarcaciones sin licencia desde Blanes.",
};

const COVES_FROM_BLANES: CoveData[] = [
  { name: "Sa Palomera", descKey: "saPalomera", lat: 41.6717, lng: 2.7963, timeFromPort: "PT2M", distanceNM: 0.1, licenseRequired: false },
  { name: "Sa Forcanera", descKey: "saForcanera", lat: 41.6727, lng: 2.8020, timeFromPort: "PT5M", distanceNM: 0.4, licenseRequired: false },
  { name: "Cala Sant Francesc (Blanes)", descKey: "calaSantFrancescBlanes", lat: 41.6735, lng: 2.8060, timeFromPort: "PT8M", distanceNM: 0.7, licenseRequired: false },
  { name: "Cala de s'Agulla", descKey: "calaDeSAgulla", lat: 41.6820, lng: 2.8120, timeFromPort: "PT12M", distanceNM: 1.2, licenseRequired: false },
  { name: "Cala Treumal", descKey: "calaTreumal", lat: 41.6860, lng: 2.8185, timeFromPort: "PT15M", distanceNM: 1.6, licenseRequired: false },
  { name: "Playa de Santa Cristina", descKey: "playaDeSantaCristina", lat: 41.6906, lng: 2.8260, timeFromPort: "PT18M", distanceNM: 2.0, licenseRequired: false },
  { name: "Cala Sa Boadella", descKey: "calaSaBoadella", lat: 41.6938, lng: 2.8370, timeFromPort: "PT22M", distanceNM: 2.4, licenseRequired: false },
  { name: "Playa de Fenals", descKey: "playaDeFenals", lat: 41.6988, lng: 2.8466, timeFromPort: "PT25M", distanceNM: 2.8, licenseRequired: false, isEndpoint: true },
];

// ═══════════════════════════════════════════════════════════════════════════
// Nautical glossary — DefinedTermSet with 18 terms (LBN, PER, PNB, nudos,
// calas, etc.). GEO benefit: answer engines cite DefinedTerm entries for
// educational queries ("qué es la LBN", "cuánto es un nudo", "qué es fondear").
// Emitted without a dedicated /glosario page for now — schema alone is
// sufficient for AI citation; visual page is a separate UX enhancement.
// ═══════════════════════════════════════════════════════════════════════════

export interface GlossaryTerm {
  term: string;
  definition: string;
  category?: "titulacion" | "unidad" | "accion" | "parte" | "equipamiento";
  inLanguage?: string;
}

export const NAUTICAL_GLOSSARY_ES: GlossaryTerm[] = [
  { term: "LBN (Licencia Básica de Navegación)", definition: "Titulación náutica española que permite gobernar embarcaciones de hasta 8 metros de eslora y hasta 5 millas de la costa. Obligatoria para alquilar barcos con más de 15 CV. Válida de por vida tras aprobar el examen teórico + curso práctico.", category: "titulacion" },
  { term: "PER (Patrón de Embarcaciones de Recreo)", definition: "Titulación náutica española superior a la LBN. Permite gobernar embarcaciones de hasta 15 metros de eslora y hasta 12 millas de la costa. Requiere examen teórico + prácticas de navegación + radiocomunicaciones.", category: "titulacion" },
  { term: "PNB (Patrón de Navegación Básica)", definition: "Antigua titulación náutica reemplazada en 2014 por la LBN. Permite gobernar embarcaciones de hasta 8 metros hasta 5 millas. Los que la tengan siguen siendo válidos sin necesidad de actualizar a LBN.", category: "titulacion" },
  { term: "Milla náutica", definition: "Unidad de distancia marítima internacional equivalente a 1.852 metros (1,852 km). Las embarcaciones sin licencia en España pueden navegar hasta un máximo de 2 millas náuticas de la costa (3,7 km).", category: "unidad" },
  { term: "Nudo", definition: "Unidad de velocidad marítima equivalente a 1 milla náutica por hora (1,852 km/h). Las embarcaciones sin licencia están limitadas a 5 nudos (9,3 km/h). Los barcos con licencia pueden alcanzar mucha más velocidad.", category: "unidad" },
  { term: "Eslora", definition: "Longitud total del barco, medida de proa a popa. Unidad: metros. En España, la eslora determina la titulación náutica mínima: hasta 5m puede no requerir título, hasta 8m requiere LBN, hasta 15m requiere PER.", category: "unidad" },
  { term: "Manga", definition: "Anchura máxima del barco, medida de un costado a otro en su punto más ancho. Unidad: metros. Junto con la eslora define la estabilidad y espacio disponible a bordo.", category: "unidad" },
  { term: "CV (caballos de vapor)", definition: "Unidad de potencia del motor marino. Los barcos sin licencia en España están limitados a 15 CV. Los barcos con licencia típicamente tienen 40-150 CV, permitiendo navegación más rápida y alcance mayor.", category: "unidad" },
  { term: "Fondear", definition: "Acción de detener el barco lanzando el ancla al fondo marino para mantenerlo estático en una cala o zona sin amarre. Requiere elegir fondo arenoso (no rocoso), echar cabo suficiente (3-4 veces la profundidad) y verificar que el ancla agarra.", category: "accion" },
  { term: "Cala", definition: "Ensenada pequeña y abrigada en la costa, típicamente rodeada de acantilados o vegetación. En la Costa Brava existen decenas de calas accesibles solo por mar, con aguas cristalinas y fondos rocosos ideales para snorkel.", category: "parte" },
  { term: "Puerto deportivo", definition: "Instalación portuaria destinada a embarcaciones de recreo con amarres, servicios de combustible, agua, electricidad y varadero. El Puerto de Blanes (Girona) es el puerto deportivo náutico de referencia en la Costa Brava Sur.", category: "parte" },
  { term: "Proa", definition: "Parte delantera del barco, opuesta a la popa. En barcos de recreo suele llevar el solárium principal y la luz de navegación blanca.", category: "parte" },
  { term: "Popa", definition: "Parte trasera del barco, opuesta a la proa. Aloja el motor fuera borda, la escalera de baño y típicamente la zona de mesa central.", category: "parte" },
  { term: "Estribor", definition: "Lado derecho del barco mirando desde popa hacia proa. Se identifica por la luz verde de navegación. Regla de oro: 'Estribor = derecho' (ambas empiezan con E).", category: "parte" },
  { term: "Babor", definition: "Lado izquierdo del barco mirando desde popa hacia proa. Se identifica por la luz roja de navegación.", category: "parte" },
  { term: "Bimini / Toldo bimini", definition: "Toldo desplegable que cubre la bañera del barco proporcionando sombra. Esencial para navegación con niños o en verano. La mayoría de nuestros barcos sin licencia lo incorporan de serie.", category: "equipamiento" },
  { term: "Solárium", definition: "Zona acolchada del barco destinada a tumbarse al sol, típicamente en proa o popa. Los barcos premium tienen solárium doble (proa y popa).", category: "equipamiento" },
  { term: "Bañera", definition: "Zona central del barco donde se ubican los asientos, el puesto de gobierno y la mesa. Es el espacio operativo del barco durante la navegación.", category: "parte" },
];

export function generateGlossarySchema() {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": "https://www.costabravarentaboat.com/#glossary-nautical",
    "name": "Glosario náutico — Alquiler de barcos Costa Brava",
    "description": "Definiciones de términos náuticos esenciales para alquilar un barco en la Costa Brava: titulaciones, unidades de medida, partes del barco y terminología marina.",
    "inLanguage": "es",
    "hasDefinedTerm": NAUTICAL_GLOSSARY_ES.map((t) => ({
      "@type": "DefinedTerm",
      "name": t.term,
      "description": t.definition,
      "inDefinedTermSet": "https://www.costabravarentaboat.com/#glossary-nautical",
    })),
  };
}

export function generateCovesItemListSchema(t?: Translations) {
  const cs = t?.seoSchemas?.coves;
  const listName = cs?.listName ?? "Calas accesibles desde el Puerto de Blanes con barco sin licencia";
  const listDescription = cs?.listDescription ?? "Lista ordenada de las 8 calas principales entre Blanes y Playa de Fenals accesibles con barco sin licencia en menos de 25 minutos de navegación (límite legal 2 millas náuticas, 5 nudos).";
  const propTimeFromPort = cs?.propTimeFromPort ?? "Tiempo de navegación desde Port de Blanes";
  const propDistance = cs?.propDistance ?? "Distancia náutica desde Port de Blanes";
  const propDistanceUnit = cs?.propDistanceUnit ?? "millas náuticas";
  const propLicenseRequired = cs?.propLicenseRequired ?? "Requiere licencia náutica";
  const propEndpoint = cs?.propEndpoint ?? "Límite norte legal sin-licencia";
  const descriptions = cs?.descriptions ?? COVE_DESC_FALLBACK_ES;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": "https://www.costabravarentaboat.com/#coves-from-blanes",
    "name": listName,
    "description": listDescription,
    "numberOfItems": COVES_FROM_BLANES.length,
    "itemListOrder": "https://schema.org/ItemListOrderAscending",
    "itemListElement": COVES_FROM_BLANES.map((cove, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Place",
        "name": cove.name,
        "description": descriptions[cove.descKey] ?? COVE_DESC_FALLBACK_ES[cove.descKey],
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
          { "@type": "PropertyValue", "name": propTimeFromPort, "value": cove.timeFromPort, "unitCode": "MIN" },
          { "@type": "PropertyValue", "name": propDistance, "value": cove.distanceNM, "unitText": propDistanceUnit },
          { "@type": "PropertyValue", "name": propLicenseRequired, "value": cove.licenseRequired },
          ...(cove.isEndpoint ? [{ "@type": "PropertyValue", "name": propEndpoint, "value": true }] : []),
        ],
      },
    })),
  };
}

