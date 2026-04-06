import type React from "react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Anchor,
  Users,
  Star,
  Car,
  Train,
  ParkingCircle,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { trackLocationPageView } from "@/utils/analytics";

// ---------------------------------------------------------------------------
// Config interface — each location page provides one of these
// ---------------------------------------------------------------------------

interface AttractionConfig {
  iconBg: string;       // e.g. "bg-amber-100"
  iconColor: string;    // e.g. "text-amber-600"
  Icon: LucideIcon;
}

export interface LocationConfig {
  slug: string;                     // analytics slug e.g. "malgrat"
  seoKey: string;                   // e.g. "locationMalgrat"
  translationKey: string;           // key in t.locationPages e.g. "malgrat"
  breadcrumbKey: string;            // key in t.breadcrumbs e.g. "locationMalgrat"
  breadcrumbUrl: string;            // e.g. "/alquiler-barcos-malgrat-de-mar"
  gradient: string;                 // e.g. "from-amber-50 to-blue-50"
  attractions: [AttractionConfig, AttractionConfig, AttractionConfig];
  schema: {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    locality: string;
    region: string;
    postalCode: string;
    touristType: string[];
  };
  faqItems: Array<{ question: string; answer: string }>;
  faqTitle: string;
  relatedContentPage?: string;      // e.g. "locationLloret" — shows RelatedContent component
}

interface LocationTemplateProps {
  config: LocationConfig;
  extraCards?: React.ReactNode;       // additional Cards rendered before CTA
  afterFaq?: React.ReactNode;         // content rendered after FAQ (e.g. blog section)
}

// ---------------------------------------------------------------------------
// Template component
// ---------------------------------------------------------------------------

export default function LocationTemplate({ config, extraCards, afterFaq }: LocationTemplateProps) {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();

  useEffect(() => { trackLocationPageView(config.slug); }, [config.slug]);

  const seoConfig = getSEOConfig(config.seoKey, language);
  const hreflangLinks = generateHreflangLinks(config.seoKey);
  const canonical = generateCanonicalUrl(config.seoKey, language);

  const loc = (t.locationPages as Record<string, Record<string, unknown>>)[config.translationKey] as {
    hero: { title: string; subtitle: string; badgeDistance: string; badgeTime: string; badgeBeach: string };
    sections: Record<string, string>;
  } | undefined;

  const hero = loc?.hero;
  const s = loc?.sections;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  const locationSchema = {
    "@type": "TouristDestination",
    "name": config.schema.name,
    "description": config.schema.description,
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": config.schema.latitude,
      "longitude": config.schema.longitude,
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": config.schema.locality,
      "addressRegion": config.schema.region,
      "postalCode": config.schema.postalCode,
      "addressCountry": "ES",
    },
    "touristType": config.schema.touristType,
    "availableLanguage": ["Spanish", "Catalan", "English", "French"],
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://www.costabravarentaboat.com/",
    },
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: (t.breadcrumbs as Record<string, string>).home, url: "/" },
    { name: (t.breadcrumbs as Record<string, string>)[config.breadcrumbKey], url: config.breadcrumbUrl },
  ]);

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": config.faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": { "@type": "Answer", "text": item.answer },
    })),
  };

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [locationSchema, breadcrumbSchema, faqSchema],
  };

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        ogImage={seoConfig.image}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />

      {/* Hero */}
      <div className={`bg-gradient-to-br ${config.gradient} pt-24 pb-12`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {hero?.title}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {hero?.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Car className="w-4 h-4 mr-2" />
                {hero?.badgeDistance}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                {hero?.badgeTime}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                {hero?.badgeBeach}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Why Rent from Blanes */}
          {s && (
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Anchor className="w-6 h-6 text-cta" />
                  {s.whyRentTitle}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">{s.closestPort}</h3>
                    <p className="text-muted-foreground mb-4">{s.closestPortDesc}</p>
                    <h3 className="font-semibold text-lg mb-3">{s.varietyBoats}</h3>
                    <p className="text-muted-foreground">{s.varietyBoatsDesc}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">{s.fuelIncluded}</h3>
                    <p className="text-muted-foreground mb-4">{s.fuelIncludedDesc}</p>
                    <h3 className="font-semibold text-lg mb-3">{s.noExperience}</h3>
                    <p className="text-muted-foreground">{s.noExperienceDesc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Town Attractions */}
          {s && (
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Star className="w-6 h-6 text-primary" />
                  {s.townAttractionsTitle}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {config.attractions.map((attr, i) => {
                    const num = i + 1;
                    return (
                      <div key={num} className="text-center">
                        <div className={`w-16 h-16 ${attr.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                          <attr.Icon className={`w-8 h-8 ${attr.iconColor}`} />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{s[`attraction${num}`]}</h3>
                        <p className="text-muted-foreground">{s[`attraction${num}Desc`]}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* How to Get to Blanes */}
          {s && (
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Car className="w-6 h-6 text-primary" />
                  {s.howToGetTitle}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      {s.byCar}
                    </h3>
                    <p className="text-muted-foreground mb-4">{s.byCarDesc}</p>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {s.byTaxi}
                    </h3>
                    <p className="text-muted-foreground">{s.byTaxiDesc}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Train className="w-5 h-5 text-primary" />
                      {s.byPublicTransport}
                    </h3>
                    <p className="text-muted-foreground mb-4">{s.byPublicTransportDesc}</p>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <ParkingCircle className="w-5 h-5 text-primary" />
                      {s.parkingAtBlanes}
                    </h3>
                    <p className="text-muted-foreground">{s.parkingAtBlanesDesc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Boat Destinations */}
          {s && (
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Anchor className="w-6 h-6 text-primary" />
                  {s.boatDestinationsTitle}
                </h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{s.boatDestinationsDesc}</p>
                <div className="flex flex-wrap gap-3">
                  <Link href={localizedPath("locationLloret")}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Lloret de Mar - 25 min</Badge>
                  </Link>
                  <Link href={localizedPath("locationTossa")}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Tossa de Mar - 1h</Badge>
                  </Link>
                  <Link href={localizedPath("locationBlanes")}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Calas de Blanes</Badge>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extra cards slot (cross-links, related services, etc.) */}
          {extraCards}

          {/* CTA */}
          {s && (
            <Card className="bg-primary text-white">
              <CardContent className="py-8 text-center">
                <h2 className="text-2xl font-bold mb-4">{s.ctaTitle}</h2>
                <p className="text-lg mb-6 max-w-2xl mx-auto">{s.ctaDescription}</p>
                <Button
                  onClick={handleBookingWhatsApp}
                  size="lg"
                  variant="secondary"
                  className="text-primary hover:text-primary"
                  data-testid={`button-whatsapp-${config.slug}`}
                >
                  {s.ctaButton}
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* FAQ */}
      <div className="py-12 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-heading font-bold text-center mb-8">
            {config.faqTitle}
          </h2>
          <div className="space-y-3">
            {config.faqItems.map((item, index) => (
              <details
                key={index}
                className="group border border-border rounded-lg bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="pr-4">{item.question}</span>
                  <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-4 text-muted-foreground">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* After FAQ slot (blog section, etc.) */}
      {afterFaq}

      <RelatedLocationsSection currentLocation={config.slug} />
      {config.relatedContentPage && (
        <RelatedContent currentPage={config.relatedContentPage} />
      )}
      <Footer />
    </div>
  );
}
