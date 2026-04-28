import type React from "react";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
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
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { FAQSection } from "@/components/FAQSection";
import PopularBoatsSection from "@/components/PopularBoatsSection";
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
// Sub-components
// ---------------------------------------------------------------------------

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

function HeroImage({ basePath, alt }: { basePath: string; alt: string }) {
  return (
    <picture>
      <source
        media="(min-width: 768px)"
        type="image/avif"
        srcSet={`${basePath}.avif`}
      />
      <source type="image/avif" srcSet={`${basePath}-mobile.avif`} />
      <source
        media="(min-width: 768px)"
        type="image/webp"
        srcSet={`${basePath}.webp`}
      />
      <source type="image/webp" srcSet={`${basePath}-mobile.webp`} />
      <img
        src={`${basePath}.jpg`}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
        loading="eager"
        fetchPriority="high"
      />
    </picture>
  );
}

// ---------------------------------------------------------------------------
// Config interface — each location page provides one of these
// ---------------------------------------------------------------------------

interface AttractionConfig {
  iconBg: string;
  iconColor: string;
  Icon: LucideIcon;
}

interface ImageSlot {
  src: string;
  alt: string;
}

export interface LocationConfig {
  slug: string;
  seoKey: string;
  translationKey: string;
  breadcrumbKey: string;
  breadcrumbUrl: string;
  gradient: string;
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
  relatedContentPage?: string;

  /**
   * Optional "popular boats" section rendered before the FAQ. Add here to
   * pass internal SEO signal from the location landing to specific boat
   * detail pages, with the boat name as anchor text.
   */
  popularBoats?: {
    title: string;
    description?: string;
    boatIds: string[];
    badgeLabel?: (boatId: string) => string;
    badgeVariant?: (boatId: string) => "default" | "secondary" | "outline";
  };

  /** Hero image — basePath auto-generates avif/webp/jpg desktop+mobile variants. Omit for gradient fallback. */
  heroImage?: {
    basePath: string;
    alt: string;
  };
  /** Mid-section images. Shared defaults used when omitted. */
  images?: {
    whyRent?: ImageSlot;
    coastBreak?: ImageSlot;
  };
}

interface LocationTemplateProps {
  config: LocationConfig;
  extraCards?: React.ReactNode;
  afterFaq?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Shared default images — generic boat/coast shots from existing assets
// ---------------------------------------------------------------------------

const DEFAULTS = {
  whyRent: {
    src: "/images/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-amigos-snorkel.webp",
    alt: "Friends enjoying a boat day with snorkeling on the Costa Brava",
  },
  coastBreak: {
    src: "/images/mejores-calas-costa-brava-mingolla-brava-rent-a-boat.webp",
    alt: "Boat anchored in a crystal-clear cove along the Costa Brava coast",
  },
};

// ---------------------------------------------------------------------------
// Template component
// ---------------------------------------------------------------------------

export default function LocationTemplate({
  config,
  extraCards,
  afterFaq,
}: LocationTemplateProps) {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();

  useEffect(() => {
    trackLocationPageView(config.slug);
  }, [config.slug]);

  const seoConfig = getSEOConfig(config.seoKey, language);
  const hreflangLinks = generateHreflangLinks(config.seoKey);
  const canonical = generateCanonicalUrl(config.seoKey, language);

  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });

  const localeFaqItems = (
    (t.locationPages as unknown as Record<string, Record<string, unknown>>)[
      config.translationKey
    ] as
      | { faqItems?: Array<{ question: string; answer: string }> }
      | undefined
  )?.faqItems;
  const rawFaqItems =
    localeFaqItems && localeFaqItems.length > 0
      ? localeFaqItems
      : config.faqItems;

  const processedFaqItems = useMemo(() => {
    const vars = computeFaqVars(boatsData);
    return rawFaqItems.map((item) => ({
      question: substituteFaqVars(item.question, vars),
      answer: substituteFaqVars(item.answer, vars),
    }));
  }, [boatsData, rawFaqItems]);

  const loc = (
    t.locationPages as unknown as Record<string, Record<string, unknown>>
  )[config.translationKey] as
    | {
        hero: {
          title: string;
          subtitle: string;
          badgeDistance: string;
          badgeTime: string;
          badgeBeach: string;
        };
        sections: Record<string, string>;
      }
    | undefined;

  const hero = loc?.hero;
  const s = loc?.sections;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(
      undefined,
      undefined,
      t.whatsappMessages,
    );
    openWhatsApp(message);
  };

  const whyRentImg = config.images?.whyRent ?? DEFAULTS.whyRent;
  const coastBreakImg = config.images?.coastBreak ?? DEFAULTS.coastBreak;

  const locationSchema = {
    "@type": "TouristDestination",
    name: config.schema.name,
    description: config.schema.description,
    geo: {
      "@type": "GeoCoordinates",
      latitude: config.schema.latitude,
      longitude: config.schema.longitude,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: config.schema.locality,
      addressRegion: config.schema.region,
      postalCode: config.schema.postalCode,
      addressCountry: "ES",
    },
    touristType: config.schema.touristType,
    availableLanguage: ["Spanish", "Catalan", "English", "French"],
    provider: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat Blanes",
      telephone: "+34611500372",
      url: "https://www.costabravarentaboat.com/",
    },
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: (t.breadcrumbs as Record<string, string>).home, url: "/" },
    {
      name: (t.breadcrumbs as Record<string, string>)[config.breadcrumbKey],
      url: config.breadcrumbUrl,
    },
  ]);

  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: processedFaqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
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
      <ReadingProgressBar />

      {/* ═══ HERO ═══ */}
      {config.heroImage ? (
        <div className="relative pt-20 sm:pt-24">
          <div className="relative w-full h-[55vh] min-h-[420px] sm:min-h-[520px] overflow-hidden">
            <HeroImage
              basePath={config.heroImage.basePath}
              alt={config.heroImage.alt}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/55" />
            <div className="relative z-10 h-full flex items-end pb-12 sm:pb-16">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-white drop-shadow-lg mb-3">
                  {hero?.title}
                </h1>
                <p className="text-lg text-white/90 mb-6 max-w-2xl drop-shadow">
                  {hero?.subtitle}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Badge
                    variant="outline"
                    className="bg-white/15 text-white border-white/30 backdrop-blur-sm"
                  >
                    <Car className="w-4 h-4 mr-2" />
                    {hero?.badgeDistance}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-white/15 text-white border-white/30 backdrop-blur-sm"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {hero?.badgeTime}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-white/15 text-white border-white/30 backdrop-blur-sm"
                  >
                    {hero?.badgeBeach}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Gradient fallback for locations without hero images */
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
                <Badge
                  variant="outline"
                  className="text-primary border-primary"
                >
                  <Car className="w-4 h-4 mr-2" />
                  {hero?.badgeDistance}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-primary border-primary"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {hero?.badgeTime}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-primary border-primary"
                >
                  {hero?.badgeBeach}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ WHY RENT FROM BLANES ═══ text + image */}
      {s && (
        <RevealSection className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-3">
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
                  {s.whyRentTitle}
                </h2>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                      {s.closestPort}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {s.closestPortDesc}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                      {s.varietyBoats}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {s.varietyBoatsDesc}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                      {s.fuelIncluded}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {s.fuelIncludedDesc}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                      {s.noExperience}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {s.noExperienceDesc}
                    </p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <img
                  src={whyRentImg.src}
                  alt={whyRentImg.alt}
                  className="w-full rounded-2xl object-cover aspect-[4/5]"
                  loading="lazy"
                  width={640}
                  height={800}
                />
              </div>
            </div>
          </div>
        </RevealSection>
      )}

      {/* ═══ COASTAL PHOTO BREAK ═══ */}
      <div className="w-full overflow-hidden">
        <img
          src={coastBreakImg.src}
          alt={coastBreakImg.alt}
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* ═══ TOWN ATTRACTIONS ═══ feature grid */}
      {s && (
        <RevealSection className="py-16 sm:py-20 bg-muted">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center text-foreground mb-12">
              <Star className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
              {s.townAttractionsTitle}
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              {config.attractions.map((attr, i) => {
                const num = i + 1;
                return (
                  <div key={num} className="text-center">
                    <div
                      className={`w-16 h-16 ${attr.iconBg} rounded-full flex items-center justify-center mx-auto mb-5`}
                    >
                      <attr.Icon className={`w-8 h-8 ${attr.iconColor}`} />
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-3">
                      {s[`attraction${num}`]}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {s[`attraction${num}Desc`]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </RevealSection>
      )}

      {/* ═══ HOW TO GET TO BLANES ═══ icon-led grid */}
      {s && (
        <RevealSection className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
              {s.howToGetTitle}
            </h2>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    {s.byCar}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.byCarDesc}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Train className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    {s.byPublicTransport}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.byPublicTransportDesc}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    {s.byTaxi}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.byTaxiDesc}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <ParkingCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    {s.parkingAtBlanes}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.parkingAtBlanesDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>
      )}

      {/* ═══ BOAT DESTINATIONS ═══ */}
      {s && (
        <RevealSection className="py-12 sm:py-16 bg-muted">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-4">
              <Anchor className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
              {s.boatDestinationsTitle}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-3xl">
              {s.boatDestinationsDesc}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={localizedPath("locationCostaBrava")}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 text-sm py-1.5 px-4"
                >
                  Costa Brava
                </Badge>
              </Link>
              <Link href={localizedPath("locationLloret")}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 text-sm py-1.5 px-4"
                >
                  Lloret de Mar - 25 min
                </Badge>
              </Link>
              <Link href={localizedPath("locationTossa")}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 text-sm py-1.5 px-4"
                >
                  Tossa de Mar - 45 min
                </Badge>
              </Link>
              <Link href={localizedPath("locationBlanes")}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 text-sm py-1.5 px-4"
                >
                  Calas de Blanes
                </Badge>
              </Link>
            </div>
          </div>
        </RevealSection>
      )}

      {/* Extra content slot */}
      {extraCards}

      {/* ═══ CTA ═══ full-width section */}
      {s && (
        <div className="py-16 sm:py-20 bg-primary">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
              {s.ctaTitle}
            </h2>
            <p className="text-lg text-white/85 mb-8 max-w-2xl mx-auto">
              {s.ctaDescription}
            </p>
            <Button
              onClick={handleBookingWhatsApp}
              size="lg"
              variant="secondary"
              className="text-primary hover:text-primary"
              data-testid={`button-whatsapp-${config.slug}`}
            >
              {s.ctaButton}
            </Button>
          </div>
        </div>
      )}

      {/* ═══ POPULAR BOATS (SEO crosslinking) ═══ */}
      {config.popularBoats && (
        <PopularBoatsSection
          title={config.popularBoats.title}
          description={config.popularBoats.description}
          boatIds={config.popularBoats.boatIds}
          badgeLabel={config.popularBoats.badgeLabel}
          badgeVariant={config.popularBoats.badgeVariant}
        />
      )}

      {/* ═══ FAQ ═══ */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-10">
            {config.faqTitle}
          </h2>
          <FAQSection items={processedFaqItems} />
        </div>
      </RevealSection>

      {afterFaq}

      <RelatedLocationsSection currentLocation={config.slug} />
      {config.relatedContentPage && (
        <RelatedContent currentPage={config.relatedContentPage} />
      )}
      <Footer />
    </div>
  );
}
