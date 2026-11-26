import type React from "react";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { Users, Car, Train, ParkingCircle, type LucideIcon } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
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
import ActivitatumTeaser from "@/components/ActivitatumTeaser";
import { HeroImage } from "@/components/HeroImage";
import {
  FactPanel,
  Lead,
  LocationCta,
  LocationFaq,
  LocationHero,
  Photo,
  Rise,
  SectionTitle,
  Sheet,
  SheetWrap,
  TONE_BG,
} from "@/components/location/LocationKit";
import { BookingStickyBar } from "@/components/MobileStickyBar";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

export { HeroImage };

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

export default function LocationTemplate({ config, extraCards, afterFaq }: LocationTemplateProps) {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();

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
    ] as { faqItems?: Array<{ question: string; answer: string }> } | undefined
  )?.faqItems;
  const rawFaqItems =
    localeFaqItems && localeFaqItems.length > 0 ? localeFaqItems : config.faqItems;

  const processedFaqItems = useMemo(() => {
    const vars = computeFaqVars(boatsData);
    return rawFaqItems.map(item => ({
      question: substituteFaqVars(item.question, vars),
      answer: substituteFaqVars(item.answer, vars),
    }));
  }, [boatsData, rawFaqItems]);

  const loc = (t.locationPages as unknown as Record<string, Record<string, unknown>>)[
    config.translationKey
  ] as
    | {
        hero: {
          title: string;
          subtitle: string;
          badgeDistance: string;
          badgeTime: string;
          badgeBeach: string;
          imageAlt?: string;
        };
        sections: Record<string, string>;
      }
    | undefined;

  const hero = loc?.hero;
  const s = loc?.sections;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  // Alt text localized via i18n; the config/DEFAULT strings are the fallback
  // (they were hardcoded English and leaked into non-EN pages, critique 2026-07).
  const whyRentImg = {
    src: (config.images?.whyRent ?? DEFAULTS.whyRent).src,
    alt: t.locationTemplate?.whyRentImgAlt ?? (config.images?.whyRent ?? DEFAULTS.whyRent).alt,
  };
  const coastBreakImg = {
    src: (config.images?.coastBreak ?? DEFAULTS.coastBreak).src,
    alt:
      t.locationTemplate?.coastBreakImgAlt ??
      (config.images?.coastBreak ?? DEFAULTS.coastBreak).alt,
  };

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
    mainEntity: processedFaqItems.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [locationSchema, breadcrumbSchema, faqSchema],
  };

  const popularPages = t.popularBoatsSection?.pages as
    | Record<string, { title?: string; description?: string }>
    | undefined;
  const destLinks = [
    { key: "locationCostaBrava", label: t.locationTemplate?.destCostaBrava ?? "Costa Brava" },
    { key: "locationLloret", label: t.locationTemplate?.destLloret ?? "Lloret de Mar - 25 min" },
    { key: "locationTossa", label: t.locationTemplate?.destTossa ?? "Tossa de Mar - 45 min" },
    { key: "locationBlanes", label: t.locationTemplate?.destBlanesCoves ?? "Calas de Blanes" },
  ] as const;

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

      <LocationHero
        basePath={config.heroImage?.basePath}
        imageAlt={hero?.imageAlt ?? config.heroImage?.alt}
        title={hero?.title}
        subtitle={hero?.subtitle}
        facts={[hero?.badgeDistance, hero?.badgeTime, hero?.badgeBeach]}
        bookLabel={t.nav.bookNow}
        onBook={() => openBookingModal()}
      />

      {s && (
        <>
          {/* Why rent from Blanes: ruled panel + photo */}
          <Sheet tone="page" next="muted" labelledBy="loc-why-title">
            <div className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16">
              <Rise>
                <SectionTitle id="loc-why-title">{s.whyRentTitle}</SectionTitle>
                <FactPanel
                  className="mt-8"
                  items={[
                    { title: s.closestPort, desc: s.closestPortDesc },
                    { title: s.varietyBoats, desc: s.varietyBoatsDesc },
                    { title: s.fuelIncluded, desc: s.fuelIncludedDesc },
                    { title: s.noExperience, desc: s.noExperienceDesc },
                  ]}
                />
              </Rise>
              <Rise delay={0.1}>
                <Photo src={whyRentImg.src} alt={whyRentImg.alt} />
              </Rise>
            </div>
          </Sheet>

          {/* Town attractions: coast photo + three rows */}
          <Sheet tone="muted" next="page" labelledBy="loc-attractions-title">
            <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
              <Rise>
                <Photo src={coastBreakImg.src} alt={coastBreakImg.alt} />
              </Rise>
              <Rise delay={0.1}>
                <SectionTitle id="loc-attractions-title">{s.townAttractionsTitle}</SectionTitle>
                <FactPanel
                  className="mt-8"
                  items={config.attractions.map((attr, i) => ({
                    title: s[`attraction${i + 1}`],
                    desc: s[`attraction${i + 1}Desc`],
                    icon: attr.Icon,
                  }))}
                />
              </Rise>
            </div>
          </Sheet>

          {/* How to get to Blanes */}
          <Sheet tone="page" next="muted" labelledBy="loc-how-title">
            <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
              <Rise>
                <SectionTitle id="loc-how-title">{s.howToGetTitle}</SectionTitle>
              </Rise>
              <Rise delay={0.1}>
                <FactPanel
                  items={[
                    { title: s.byCar, desc: s.byCarDesc, icon: Car },
                    { title: s.byPublicTransport, desc: s.byPublicTransportDesc, icon: Train },
                    { title: s.byTaxi, desc: s.byTaxiDesc, icon: Users },
                    { title: s.parkingAtBlanes, desc: s.parkingAtBlanesDesc, icon: ParkingCircle },
                  ]}
                />
              </Rise>
            </div>
          </Sheet>

          {/* Boat destinations: real links as rows */}
          <Sheet tone="muted" next="navy" labelledBy="loc-dest-title">
            <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
              <Rise>
                <SectionTitle id="loc-dest-title">{s.boatDestinationsTitle}</SectionTitle>
                <Lead text={s.boatDestinationsDesc} className="mt-5" />
              </Rise>
              <Rise delay={0.1}>
                <FactPanel
                  items={destLinks.map(({ key, label }) => ({
                    title: label,
                    href: localizedPath(key),
                  }))}
                />
              </Rise>
            </div>
          </Sheet>
        </>
      )}

      {/* Extra content slot */}
      {extraCards}

      {s && (
        <LocationCta
          title={s.ctaTitle}
          desc={s.ctaDescription}
          buttonLabel={s.ctaButton}
          onClick={handleBookingWhatsApp}
          testId={`button-whatsapp-${config.slug}`}
          next={config.popularBoats ? "muted" : "page"}
        />
      )}

      {/* Popular boats (SEO crosslinking). Title/description come from i18n
          (t.popularBoatsSection.pages.<town>) so non-Spanish visitors don't see the
          Spanish config fallback. */}
      {config.popularBoats && (
        <SheetWrap next="page">
          <PopularBoatsSection
            bgClass={TONE_BG.muted}
            title={popularPages?.[config.translationKey]?.title ?? config.popularBoats.title}
            description={
              popularPages?.[config.translationKey]?.description ?? config.popularBoats.description
            }
            boatIds={config.popularBoats.boatIds}
            badgeLabel={config.popularBoats.badgeLabel}
            badgeVariant={config.popularBoats.badgeVariant}
          />
        </SheetWrap>
      )}

      <LocationFaq id="loc-faq" title={config.faqTitle} items={processedFaqItems} next="muted" />

      {afterFaq}

      <RelatedLocationsSection currentLocation={config.slug} />
      <ActivitatumTeaser
        topic={config.slug === "blanes" ? "blanes" : "lloret"}
        surface="city-landing"
      />
      {config.relatedContentPage && <RelatedContent currentPage={config.relatedContentPage} />}
      <BookingStickyBar />
      <Footer />
    </div>
  );
}
