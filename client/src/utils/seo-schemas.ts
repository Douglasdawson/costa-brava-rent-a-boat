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
    "author": {
      "@type": "Organization",
      "name": article.author,
      "url": BASE_DOMAIN
    },
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

  return schema;
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
