import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Anchor, 
  Star,
  Gauge,
  Award,
  Heart,
  Zap,
  Navigation as NavigationIcon,
  Waves,
  Compass,
  Target,
  ChevronRight
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { 
  getSEOConfig, 
  generateHreflangLinks, 
  generateCanonicalUrl,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import {
  BUSINESS_RATING_STR,
  BUSINESS_REVIEW_COUNT_STR,
} from "@shared/businessProfile";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { BOAT_DATA, type BoatData } from "@shared/boatData";
import { minPriceAcrossBoats } from "@shared/pricing";

export default function CategoryLicensedPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('categoryLicensed', language);
  const hreflangLinks = generateHreflangLinks('categoryLicensed');
  const canonical = generateCanonicalUrl('categoryLicensed', language);

  const { data: boats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // Service schema for licensed boats
  const serviceSchema = {
    "@type": "Service",
    "name": "Alquiler de Barcos Con Licencia en Blanes",
    "description": "Alquiler de embarcaciones con licencia, potentes y avanzadas en Puerto de Blanes, Costa Brava. Requiere titulación náutica PER, PNB o superior.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://www.costabravarentaboat.com/",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Puerto de Blanes",
        "addressLocality": "Blanes",
        "addressRegion": "Girona",
        "postalCode": "17300",
        "addressCountry": "ES"
      }
    },
    "serviceType": "Boat Rental",
    "areaServed": {
      "@type": "Place",
      "name": "Costa Brava, Cataluña, Mediterráneo"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": BUSINESS_RATING_STR,
      "reviewCount": BUSINESS_REVIEW_COUNT_STR,
      "bestRating": "5",
      "worstRating": "1"
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "160",
      "highPrice": "350",
      "priceCurrency": "EUR",
      "offerCount": "4",
      "availability": "https://schema.org/InStock"
    }
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.categoryLicensed, url: "/barcos-con-licencia" }
  ]);

  // Licensed fleet: derived from /api/boats with a BOAT_DATA fallback so SSR
  // and first-paint never render an empty grid.
  const liveLicensed = (boats ?? []).filter(
    (b) => b.isActive && b.requiresLicense,
  );
  const fallbackLicensed = Object.values(BOAT_DATA).filter((b) =>
    b.subtitle.startsWith("Con licencia"),
  );
  const sourceLicensed: Array<Boat | BoatData> =
    liveLicensed.length > 0 ? liveLicensed : fallbackLicensed;

  const licensedBoats = sourceLicensed.map((b) => {
    const specs = (b.specifications ?? {}) as { engine?: string; capacity?: string };
    const isDbBoat = "isActive" in b;
    const capacity = isDbBoat
      ? `${(b as Boat).capacity} personas`
      : (specs.capacity ?? "");
    const minPrice = minPriceAcrossBoats([b as { pricing?: unknown }], "2h", "BAJA");
    return {
      id: b.id,
      name: b.name,
      capacity,
      engine: specs.engine ?? "",
      features: (b.features ?? []).slice(0, 4),
      price: minPrice ? `Desde ${minPrice}€` : "",
    };
  });

  // ItemList schema for category page (helps Google understand this is a product listing)
  const itemListSchema = {
    "@type": "ItemList",
    "name": "Barcos Con Licencia en Blanes",
    "numberOfItems": licensedBoats.length,
    "itemListElement": licensedBoats.map((boat, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": boat.name,
      "url": `https://www.costabravarentaboat.com/barcos-con-licencia`,
      "item": {
        "@type": "Product",
        "name": boat.name,
        "description": `Barco con licencia ${boat.name}, ${boat.capacity}, motor ${boat.engine}`,
        "brand": { "@type": "Brand", "name": "Costa Brava Rent a Boat" },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": BUSINESS_RATING_STR,
          "reviewCount": BUSINESS_REVIEW_COUNT_STR,
          "bestRating": "5",
          "worstRating": "1"
        },
        "review": {
          "@type": "Review",
          "author": { "@type": "Person", "name": "Carlos R." },
          "datePublished": "2025-09-10",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1"
          },
          "reviewBody": "Barco potente y bien mantenido. Navegamos hasta Tossa de Mar y la experiencia fue fantastica. Muy recomendable."
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "EUR",
          "price": boat.price.replace(/[^\d]/g, ""),
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": "Costa Brava Rent a Boat Blanes" }
        }
      }
    }))
  };

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      serviceSchema,
      itemListSchema,
      breadcrumbSchema
    ]
  };

  const cl = t.categoryLicensed!;

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

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Award className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {cl.heroTitle}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {cl.heroDescription}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Award className="w-4 h-4 mr-2" />
                {cl.badgeLicense}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Gauge className="w-4 h-4 mr-2" />
                {cl.badgePower}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {cl.badgeCapacity}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* What are Licensed Boats */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Award className="w-6 h-6 text-primary" />
                {cl.whatAreTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{cl.advancedNavigation}</h3>
                  <p className="text-muted-foreground mb-4">{cl.advancedNavigationDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{cl.greaterFreedom}</h3>
                  <p className="text-muted-foreground">{cl.greaterFreedomDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{cl.professionalEquipment}</h3>
                  <p className="text-muted-foreground mb-4">{cl.professionalEquipmentDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{cl.superiorPerformance}</h3>
                  <p className="text-muted-foreground">{cl.superiorPerformanceDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Licensed Fleet */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Anchor className="w-6 h-6 text-primary" />
                {cl.fleetTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {licensedBoats.map((boat, index) => (
                  <div key={index} className="bg-background rounded-lg p-6 shadow-sm border">
                    <h3 className="font-semibold text-xl mb-3">{boat.name}</h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{boat.capacity}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Gauge className="w-4 h-4 mr-2" />
                        <span>{boat.engine}</span>
                      </div>
                      <div className="space-y-1">
                        {boat.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-muted-foreground">
                            <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-primary mb-3">
                      {boat.price}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advantages */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Heart className="w-6 h-6 text-primary" />
                {cl.advantagesTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{cl.superiorPerformanceAdv}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Zap className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.greaterSpeedPower}</span>
                    </li>
                    <li className="flex items-center">
                      <Compass className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.unlimitedDistance}</span>
                    </li>
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.remoteCoves}</span>
                    </li>
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.betterOpenSea}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{cl.premiumExperience}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.advancedNavEquipment}</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.greaterComfort}</span>
                    </li>
                    <li className="flex items-center">
                      <Clock className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.greaterFuelAutonomy}</span>
                    </li>
                    <li className="flex items-center">
                      <Award className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.sportNavigation}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements and Documentation */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Award className="w-6 h-6 text-primary" />
                {cl.requirementsTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{cl.acceptedLicenses}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.per}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.pnb}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.yachtCaptain}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.icc}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.euEquivalent}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{cl.additionalRequirements}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.minAge}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.validId}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.validLicense}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.deposit}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.technicalBriefing}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What You Can Do */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Compass className="w-6 h-6 text-primary" />
                {cl.whatCanDoTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{cl.expandedDestinations}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.islasMedas}</span>
                    </li>
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.begurCoves}</span>
                    </li>
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.cadaques}</span>
                    </li>
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.nightNavigation}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{cl.specialActivities}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.sportFishing}</span>
                    </li>
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.fullDayTrips}</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.sportNav}</span>
                    </li>
                    <li className="flex items-center">
                      <Compass className="w-4 h-4 text-primary mr-2" />
                      <span>{cl.portToPort}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explore Destinations - Internal Linking */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Destinos con barco con licencia desde Blanes</h3>
              <div className="flex flex-wrap gap-3">
                <a href={localizedPath("locationBlanes")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Puerto de Blanes: punto de salida
                </a>
                <a href={localizedPath("locationTossa")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Navega hasta Tossa de Mar
                </a>
                <a href={localizedPath("locationCostaBrava")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Explora toda la Costa Brava en barco
                </a>
                <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Tarifas de barcos con licencia
                </a>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {cl.ctaTitle}
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                {cl.ctaDescription}
              </p>
              <Button
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-licensed"
              >
                {cl.ctaButton}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      <RelatedContent currentPage="categoryLicensed" />

      <Footer />
    </div>
  );
}