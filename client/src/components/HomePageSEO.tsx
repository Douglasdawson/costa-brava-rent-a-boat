import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
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
import { generateItemListSchema, generateSeasonalEventSchema } from "@/utils/seo-schemas";
import type { Boat } from "@shared/schema";

export default function HomePageSEO() {
  const { language } = useLanguage();
  const seoConfig = getSEOConfig('home', language);
  const hreflangLinks = generateHreflangLinks('home');
  const canonical = generateCanonicalUrl('home', language);

  const { data: boats } = useQuery<Boat[]>({
    queryKey: ['/api/boats']
  });

  const localBusinessSchema = generateLocalBusinessSchema(language, 4.8, 307);
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
  const seasonalEventSchema = generateSeasonalEventSchema();

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
      webSiteSchema,
      howToSchema,
      seasonalEventSchema
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
