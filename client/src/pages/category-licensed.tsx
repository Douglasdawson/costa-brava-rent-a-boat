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
  ChevronRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
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

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform,filter] duration-700 ${
        isVisible
          ? "opacity-100 translate-y-0 blur-none"
          : "opacity-0 translate-y-6 blur-[2px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function CategoryLicensedPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig("categoryLicensed", language);
  const hreflangLinks = generateHreflangLinks("categoryLicensed");
  const canonical = generateCanonicalUrl("categoryLicensed", language);

  const { data: boats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(
      undefined,
      undefined,
      t.whatsappMessages,
    );
    openWhatsApp(message);
  };

  const serviceSchema = {
    "@type": "Service",
    name: "Alquiler de Barcos Con Licencia en Blanes",
    description:
      "Alquiler de embarcaciones con licencia, potentes y avanzadas en Puerto de Blanes, Costa Brava. Requiere titulación náutica PER, PNB o superior.",
    provider: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat Blanes",
      telephone: "+34611500372",
      url: "https://www.costabravarentaboat.com/",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Puerto de Blanes",
        addressLocality: "Blanes",
        addressRegion: "Girona",
        postalCode: "17300",
        addressCountry: "ES",
      },
    },
    serviceType: "Boat Rental",
    areaServed: {
      "@type": "Place",
      name: "Costa Brava, Cataluña, Mediterráneo",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: BUSINESS_RATING_STR,
      reviewCount: BUSINESS_REVIEW_COUNT_STR,
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "160",
      highPrice: "350",
      priceCurrency: "EUR",
      offerCount: "4",
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.categoryLicensed, url: "/barcos-con-licencia" },
  ]);

  const liveLicensed = (boats ?? []).filter(
    (b) => b.isActive && b.requiresLicense,
  );
  const fallbackLicensed = Object.values(BOAT_DATA).filter((b) =>
    b.subtitle.startsWith("Con licencia"),
  );
  const sourceLicensed: Array<Boat | BoatData> =
    liveLicensed.length > 0 ? liveLicensed : fallbackLicensed;

  const licensedBoats = sourceLicensed.map((b) => {
    const specs = (b.specifications ?? {}) as {
      engine?: string;
      capacity?: string;
    };
    const isDbBoat = "isActive" in b;
    const capacity = isDbBoat
      ? `${(b as Boat).capacity} personas`
      : (specs.capacity ?? "");
    const minPrice = minPriceAcrossBoats(
      [b as { pricing?: unknown }],
      "2h",
      "BAJA",
    );
    return {
      id: b.id,
      name: b.name,
      capacity,
      engine: specs.engine ?? "",
      features: (b.features ?? []).slice(0, 4),
      price: minPrice ? `Desde ${minPrice}\u20AC` : "",
    };
  });

  const itemListSchema = {
    "@type": "ItemList",
    name: "Barcos Con Licencia en Blanes",
    numberOfItems: licensedBoats.length,
    itemListElement: licensedBoats.map((boat, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: boat.name,
      url: "https://www.costabravarentaboat.com/barcos-con-licencia",
      item: {
        "@type": "Product",
        name: boat.name,
        description: `Barco con licencia ${boat.name}, ${boat.capacity}, motor ${boat.engine}`,
        brand: { "@type": "Brand", name: "Costa Brava Rent a Boat" },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: BUSINESS_RATING_STR,
          reviewCount: BUSINESS_REVIEW_COUNT_STR,
          bestRating: "5",
          worstRating: "1",
        },
        review: {
          "@type": "Review",
          author: { "@type": "Person", name: "Carlos R." },
          datePublished: "2025-09-10",
          reviewRating: {
            "@type": "Rating",
            ratingValue: "5",
            bestRating: "5",
            worstRating: "1",
          },
          reviewBody:
            "Barco potente y bien mantenido. Navegamos hasta Tossa de Mar y la experiencia fue fantastica. Muy recomendable.",
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          price: boat.price.replace(/[^\d]/g, ""),
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: "Costa Brava Rent a Boat Blanes",
          },
        },
      },
    })),
  };

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [serviceSchema, itemListSchema, breadcrumbSchema],
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
      <ReadingProgressBar />

      {/* ═══ HERO ═══ */}
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

      {/* ═══ WHAT ARE LICENSED BOATS ═══ text + image */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
                {cl.whatAreTitle}
              </h2>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {cl.advancedNavigation}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {cl.advancedNavigationDesc}
                  </p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {cl.greaterFreedom}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {cl.greaterFreedomDesc}
                  </p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {cl.professionalEquipment}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {cl.professionalEquipmentDesc}
                  </p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {cl.superiorPerformance}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {cl.superiorPerformanceDesc}
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-cala-agua-cristalina.webp"
                alt="Licensed boat in the crystal-clear waters of a Costa Brava cove"
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                width={640}
                height={800}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ PHOTO BREAK ═══ */}
      <div className="w-full overflow-hidden">
        <img
          src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-cala-costa-brava.webp"
          alt="Licensed boat navigating along the Costa Brava coastline"
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* ═══ OUR LICENSED FLEET ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-12">
            <Anchor className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {cl.fleetTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {licensedBoats.map((boat, index) => (
              <div
                key={index}
                className="bg-background rounded-2xl p-6 border border-border"
              >
                <h3 className="font-heading font-semibold text-xl mb-3">
                  {boat.name}
                </h3>
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
                      <div
                        key={idx}
                        className="flex items-center text-muted-foreground"
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-lg font-heading font-semibold text-primary">
                  {boat.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══ ADVANTAGES ═══ */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
            <Heart className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {cl.advantagesTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">
                {cl.superiorPerformanceAdv}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Zap className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.greaterSpeedPower}</span>
                </li>
                <li className="flex items-center">
                  <Compass className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.unlimitedDistance}</span>
                </li>
                <li className="flex items-center">
                  <Target className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.remoteCoves}</span>
                </li>
                <li className="flex items-center">
                  <Waves className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.betterOpenSea}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">
                {cl.premiumExperience}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <NavigationIcon className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.advancedNavEquipment}</span>
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.greaterComfort}</span>
                </li>
                <li className="flex items-center">
                  <Clock className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.greaterFuelAutonomy}</span>
                </li>
                <li className="flex items-center">
                  <Award className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.sportNavigation}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ REQUIREMENTS ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
            <Award className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {cl.requirementsTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">
                {cl.acceptedLicenses}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.per}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.pnb}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.yachtCaptain}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.icc}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.euEquivalent}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">
                {cl.additionalRequirements}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.minAge}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.validId}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.validLicense}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.deposit}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.technicalBriefing}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ WHAT YOU CAN DO ═══ */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
            <Compass className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {cl.whatCanDoTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">
                {cl.expandedDestinations}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Target className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.islasMedas}</span>
                </li>
                <li className="flex items-center">
                  <Target className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.begurCoves}</span>
                </li>
                <li className="flex items-center">
                  <Target className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.cadaques}</span>
                </li>
                <li className="flex items-center">
                  <Target className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.nightNavigation}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">
                {cl.specialActivities}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Waves className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.sportFishing}</span>
                </li>
                <li className="flex items-center">
                  <NavigationIcon className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.fullDayTrips}</span>
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.sportNav}</span>
                </li>
                <li className="flex items-center">
                  <Compass className="w-4 h-4 text-primary mr-3" />
                  <span>{cl.portToPort}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ INTERNAL LINKS ═══ */}
      <div className="py-8 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="font-heading font-semibold text-lg mb-4">
            Destinos con barco con licencia desde Blanes
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <a
              href={localizedPath("locationBlanes")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              Puerto de Blanes: punto de salida
            </a>
            <a
              href={localizedPath("locationTossa")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              Navega hasta Tossa de Mar
            </a>
            <a
              href={localizedPath("locationCostaBrava")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              Explora toda la Costa Brava en barco
            </a>
            <a
              href={localizedPath("pricing")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              Tarifas de barcos con licencia
            </a>
          </div>
        </div>
      </div>

      {/* ═══ CTA ═══ full-width */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            {cl.ctaTitle}
          </h2>
          <p className="text-lg text-white/85 mb-8 max-w-2xl mx-auto">
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
        </div>
      </div>

      <RelatedContent currentPage="categoryLicensed" />
      <Footer />
    </div>
  );
}
