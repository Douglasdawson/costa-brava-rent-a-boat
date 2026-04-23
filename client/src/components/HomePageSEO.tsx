import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { SEO } from "@/components/SEO";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateLocalBusinessSchema,
  generateServiceSchema,
  generateBreadcrumbSchema,
  generateWebSiteSchema,
  generateHowToBookingSchema,
  generateSpeakableSchema
} from "@/utils/seo-config";
import { generateItemListSchema, generateSeasonalEventSchema, generateCovesItemListSchema, generateGlossarySchema } from "@/utils/seo-schemas";
import { FALLBACK_ITEMS } from "@/components/FAQPreview";
import { useBusinessStats } from "@/hooks/useBusinessStats";
import { BUSINESS_RATING, BUSINESS_REVIEW_COUNT } from "@shared/businessProfile";
import type { Boat } from "@shared/schema";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { getMinActivePrice } from "@shared/pricing";

export default function HomePageSEO() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('home', language);
  const hreflangLinks = generateHreflangLinks('home');
  const canonical = generateCanonicalUrl('home', language);

  const { data: boats } = useQuery<Boat[]>({
    queryKey: ['/api/boats']
  });
  const { data: stats } = useBusinessStats();

  const localBusinessSchema = generateLocalBusinessSchema(
    language,
    stats?.rating ?? BUSINESS_RATING,
    stats?.userRatingCount ?? BUSINESS_REVIEW_COUNT,
  );
  const serviceSchema = generateServiceSchema(language);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" }
  ]);

  const activeBoats = (boats || []).filter(boat => boat.isActive);
  const fleetItems = activeBoats.map(boat => ({
    id: boat.id,
    name: boat.name
  }));
  const itemListSchema = generateItemListSchema(fleetItems);

  const webSiteSchema = generateWebSiteSchema();
  const howToSchema = generateHowToBookingSchema(language);

  // Derive live price range for AggregateOffer so Google Rich Results stay in sync with admin pricing.
  const priceRange = (() => {
    const lows: number[] = [];
    const highs: number[] = [];
    for (const b of activeBoats) {
      const p = b.pricing as Record<string, { prices: Record<string, number> }> | null;
      for (const season of ["BAJA", "MEDIA", "ALTA"] as const) {
        const vals = Object.values(p?.[season]?.prices ?? {}).filter((v): v is number => typeof v === "number" && v > 0);
        if (vals.length) {
          lows.push(Math.min(...vals));
          highs.push(Math.max(...vals));
        }
      }
      // Also use the cheapest active BAJA price via helper for consistency
      getMinActivePrice(p?.BAJA?.prices);
    }
    return lows.length && highs.length ? { low: Math.min(...lows), high: Math.max(...highs) } : null;
  })();

  const seasonalEventSchema = generateSeasonalEventSchema(priceRange, t);
  const covesItemListSchema = generateCovesItemListSchema(t);
  const glossarySchema = generateGlossarySchema();

  // FAQPage schema using homepage FAQ preview items (with live-data substitution)
  const faqVars = computeFaqVars(boats);
  const faqPageSchema = {
    "@type": "FAQPage",
    "@id": `${canonical}#faq`,
    "mainEntity": FALLBACK_ITEMS.slice(0, 8).map(item => ({
      "@type": "Question",
      "name": substituteFaqVars(item.question, faqVars),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": substituteFaqVars(item.answer, faqVars)
      }
    }))
  };

  const speakableSpec = generateSpeakableSchema([
    "h1", ".hero-description", ".fleet-section h2", ".faq-answer"
  ]);

  localBusinessSchema.speakable = speakableSpec;

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      localBusinessSchema,
      serviceSchema,
      breadcrumbSchema,
      itemListSchema,
      covesItemListSchema,
      glossarySchema,
      webSiteSchema,
      howToSchema,
      seasonalEventSchema,
      faqPageSchema
    ]
  };

  return (
    <SEO
      title={seoConfig.title}
      description={seoConfig.description}
      ogTitle={seoConfig.ogTitle}
      ogDescription={seoConfig.ogDescription}
      keywords={seoConfig.keywords}
      canonical={canonical}
      hreflang={hreflangLinks}
      jsonLd={combinedJsonLd}
    />
  );
}
