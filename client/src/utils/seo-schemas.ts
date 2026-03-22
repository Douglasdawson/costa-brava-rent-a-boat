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
