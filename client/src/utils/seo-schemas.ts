import { BASE_DOMAIN } from "./seo-config";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface BoatProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  brand?: string;
  capacity: number;
  power: number;
  requiresLicense: boolean;
  minPrice?: string;
  maxPrice?: string;
  rating?: number;
  reviewCount?: number;
}

interface ListItem {
  id: string;
  name: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${BASE_DOMAIN}${item.url}`
    }))
  };
}

export function generateProductSchema(boat: BoatProduct) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": boat.name,
    "description": boat.description,
    "image": boat.imageUrl.startsWith('http') 
      ? boat.imageUrl 
      : `${BASE_DOMAIN}${boat.imageUrl}`,
    "brand": {
      "@type": "Brand",
      "name": boat.brand || "Costa Brava Rent a Boat"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "EUR",
      "lowPrice": boat.minPrice || "70",
      "highPrice": boat.maxPrice || "390",
      "availability": "https://schema.org/InStock",
      "url": `${BASE_DOMAIN}/barco/${boat.id}`
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Capacidad",
        "value": `${boat.capacity} personas`
      },
      {
        "@type": "PropertyValue",
        "name": "Licencia",
        "value": boat.requiresLicense ? "Requiere licencia náutica" : "No requiere licencia"
      },
      {
        "@type": "PropertyValue",
        "name": "Potencia",
        "value": `${boat.power} CV`
      }
    ]
  };

  // Add rating if available
  if (boat.rating && boat.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": boat.rating.toString(),
      "reviewCount": boat.reviewCount.toString(),
      "bestRating": "5"
    };
  }

  return schema;
}

export function generateFAQPageSchema(faqs: FAQItem[]) {
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

export function generateAggregateRatingSchema(rating: number, reviewCount: number, bestRating: number = 5) {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "ratingValue": rating.toString(),
    "reviewCount": reviewCount.toString(),
    "bestRating": bestRating.toString()
  };
}

export function generateReviewSchema(reviews: Array<{
  author: string;
  datePublished: string;
  reviewBody: string;
  ratingValue: number;
}>) {
  return reviews.map(review => ({
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "datePublished": review.datePublished,
    "reviewBody": review.reviewBody,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.ratingValue.toString(),
      "bestRating": "5"
    }
  }));
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
}

export function generateArticleSchema(article: BlogArticle) {
  const schema: any = {
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
  const schema: any = {
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
