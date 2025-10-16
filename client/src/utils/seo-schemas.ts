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
