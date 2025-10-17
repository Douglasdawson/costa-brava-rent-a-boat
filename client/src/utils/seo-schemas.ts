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
  pricing?: {
    BAJA: { period: string; prices: { [key: string]: number } };
    MEDIA: { period: string; prices: { [key: string]: number } };
    ALTA: { period: string; prices: { [key: string]: number } };
  };
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
  const currentYear = new Date().getFullYear();
  
  // Helper to parse season period and generate dates
  const parseSeasonDates = (period: string, seasonName: string) => {
    const months: { [key: string]: number } = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
      'cierre': 9 // Map "Cierre" to October (end of season)
    };
    
    const periodLower = period.toLowerCase().trim();
    
    // Handle single month (e.g., "Julio", "Agosto")
    if (months[periodLower] !== undefined) {
      const monthNum = months[periodLower];
      return {
        validFrom: new Date(currentYear, monthNum, 1).toISOString().split('T')[0],
        validThrough: new Date(currentYear, monthNum + 1, 0).toISOString().split('T')[0]
      };
    }
    
    // Handle comma-separated ranges (e.g., "Abril-Junio, Septiembre-Cierre")
    const segments = periodLower.split(',').map(s => s.trim());
    let earliestStart: Date | null = null;
    let latestEnd: Date | null = null;
    
    for (const segment of segments) {
      const parts = segment.split('-').map(p => p.trim());
      
      if (parts.length === 2) {
        const startMonth = months[parts[0]];
        const endMonth = months[parts[1]];
        
        if (startMonth !== undefined && endMonth !== undefined) {
          const segmentStart = new Date(currentYear, startMonth, 1);
          const segmentEnd = new Date(currentYear, endMonth + 1, 0);
          
          if (!earliestStart || segmentStart < earliestStart) {
            earliestStart = segmentStart;
          }
          if (!latestEnd || segmentEnd > latestEnd) {
            latestEnd = segmentEnd;
          }
        }
      } else if (parts.length === 1 && months[parts[0]] !== undefined) {
        // Single month in segment
        const monthNum = months[parts[0]];
        const segmentStart = new Date(currentYear, monthNum, 1);
        const segmentEnd = new Date(currentYear, monthNum + 1, 0);
        
        if (!earliestStart || segmentStart < earliestStart) {
          earliestStart = segmentStart;
        }
        if (!latestEnd || segmentEnd > latestEnd) {
          latestEnd = segmentEnd;
        }
      }
    }
    
    // If we successfully parsed segments, return the range
    if (earliestStart && latestEnd) {
      return {
        validFrom: earliestStart.toISOString().split('T')[0],
        validThrough: latestEnd.toISOString().split('T')[0]
      };
    }
    
    // Fallback dates based on season name (only if parsing completely failed)
    if (seasonName === 'BAJA') {
      return {
        validFrom: `${currentYear}-04-01`,
        validThrough: `${currentYear}-06-30`
      };
    } else if (seasonName === 'MEDIA') {
      return {
        validFrom: `${currentYear}-07-01`,
        validThrough: `${currentYear}-07-31`
      };
    } else { // ALTA
      return {
        validFrom: `${currentYear}-08-01`,
        validThrough: `${currentYear}-08-31`
      };
    }
  };

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

  // Enhanced Offers with seasonal pricing
  if (boat.pricing) {
    const offers: any[] = [];
    
    // Generate offer for each season
    ['BAJA', 'MEDIA', 'ALTA'].forEach((season) => {
      const seasonData = boat.pricing![season as keyof typeof boat.pricing];
      if (seasonData && seasonData.prices) {
        const prices = Object.values(seasonData.prices).filter(p => p > 0);
        if (prices.length > 0) {
          const dates = parseSeasonDates(seasonData.period, season);
          
          offers.push({
            "@type": "Offer",
            "name": `Temporada ${season}`,
            "priceCurrency": "EUR",
            "price": Math.min(...prices).toString(),
            "lowPrice": Math.min(...prices).toString(),
            "highPrice": Math.max(...prices).toString(),
            "priceValidUntil": dates.validThrough,
            "validFrom": dates.validFrom,
            "validThrough": dates.validThrough,
            "availability": "https://schema.org/InStock",
            "eligibleRegion": {
              "@type": "Place",
              "name": "Costa Brava, Girona, España",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Blanes",
                "addressRegion": "Girona",
                "addressCountry": "ES"
              }
            },
            "url": `${BASE_DOMAIN}/barco/${boat.id}`
          });
        }
      }
    });

    // Use AggregateOffer if multiple seasons, or single Offer
    if (offers.length > 1) {
      const allPrices = offers.flatMap(o => [parseFloat(o.lowPrice), parseFloat(o.highPrice)]);
      schema.offers = {
        "@type": "AggregateOffer",
        "priceCurrency": "EUR",
        "lowPrice": Math.min(...allPrices).toString(),
        "highPrice": Math.max(...allPrices).toString(),
        "offerCount": offers.length.toString(),
        "offers": offers,
        "availability": "https://schema.org/InStock",
        "url": `${BASE_DOMAIN}/barco/${boat.id}`
      };
    } else if (offers.length === 1) {
      schema.offers = offers[0];
    } else {
      // Fallback to simple offer
      schema.offers = {
        "@type": "Offer",
        "priceCurrency": "EUR",
        "price": boat.minPrice || "70",
        "availability": "https://schema.org/InStock",
        "url": `${BASE_DOMAIN}/barco/${boat.id}`
      };
    }
  } else {
    // Fallback when no pricing data
    schema.offers = {
      "@type": "AggregateOffer",
      "priceCurrency": "EUR",
      "lowPrice": boat.minPrice || "70",
      "highPrice": boat.maxPrice || "390",
      "availability": "https://schema.org/InStock",
      "url": `${BASE_DOMAIN}/barco/${boat.id}`
    };
  }

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
