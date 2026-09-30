import type React from "react";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBookingModal } from "@/hooks/bookingModalContext";
import {
  MapPin,
  Clock,
  Anchor,
  Users,
  Star,
  Navigation as NavigationIcon,
  Sun,
  Waves,
  Camera,
  Car,
  Ship,
  Music,
  Utensils,
  ChevronRight
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import RelatedContent from "@/components/RelatedContent";
import RangeFromBlanesSection from "@/components/RangeFromBlanesSection";
import { FAQSection } from "@/components/FAQSection";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { trackLocationPageView } from "@/utils/analytics";
import PopularBoatsSection from "@/components/PopularBoatsSection";
import ActivitatumTeaser from "@/components/ActivitatumTeaser";
import { BookingStickyBar } from "@/components/MobileStickyBar";

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform,filter] duration-700 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"} ${className}`}>
      {children}
    </div>
  );
}

export default function LocationLloretPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => { trackLocationPageView("lloret"); }, []);

  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const seoConfig = getSEOConfig('locationLloret', language);
  const hreflangLinks = generateHreflangLinks('locationLloret');
  const canonical = generateCanonicalUrl('locationLloret', language);

  const s = t.locationPages.lloret.sections!;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  // Location-specific schema for Lloret de Mar
  const locationSchema = {
    "@type": "TouristDestination",
    "name": "Excursiones en Barco a Lloret de Mar desde Blanes",
    "description": "Alquiler de barcos para visitar Lloret de Mar desde Puerto de Blanes, con Licencia de Navegación o con patrón, para descubrir las playas de Lloret.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.6988,
      "longitude": 2.8466
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Playa de Lloret de Mar",
      "addressLocality": "Lloret de Mar",
      "addressRegion": "Girona",
      "postalCode": "17310",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Adventure", "Beach", "Party"],
    "availableLanguage": ["Spanish", "Catalan", "English", "French"],
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://www.costabravarentaboat.com/"
    }
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.locationLloret, url: "/alquiler-barcos-lloret-de-mar" }
  ]);

  // FAQ data for both schema and visible section, from i18n only (all 8 locales
  // carry it; the old Spanish fallback promised licence-free rentals, which end
  // on 2026-10-01 under RD 1188/2025).
  const lloretFaqFromI18n = (t.locationPages.lloret as { faqItems?: Array<{ question: string; answer: string }> } | undefined)?.faqItems;
  const faqItems = lloretFaqFromI18n ?? [];

  const processedFaqItems = useMemo(
    () => faqItems.map((item) => ({
      question: substituteFaqVars(item.question, faqVars),
      answer: substituteFaqVars(item.answer, faqVars),
    })),
    [faqItems, faqVars],
  );

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": processedFaqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      locationSchema,
      breadcrumbSchema,
      faqSchema
    ]
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

      {/* Hero Section — full-bleed image + overlay with H1/subtitle/badges.
          Image is the LCP element; server/seoInjector.ts emits the matching
          <link rel="preload"> so the mobile variant starts downloading during
          HTML parse, before React hydrates. */}
      <div className="relative pt-20 sm:pt-24">
        <div className="relative w-full min-h-[max(55vh,420px)] sm:min-h-[max(55vh,520px)] flex flex-col overflow-hidden">
          <picture>
            <source media="(min-width: 768px)" type="image/avif" srcSet="/images/locations/hero-lloret-de-mar.avif" />
            <source type="image/avif" srcSet="/images/locations/hero-lloret-de-mar-mobile.avif" />
            <source media="(min-width: 768px)" type="image/webp" srcSet="/images/locations/hero-lloret-de-mar.webp" />
            <source type="image/webp" srcSet="/images/locations/hero-lloret-de-mar-mobile.webp" />
            <img
              src="/images/locations/hero-lloret-de-mar.jpg"
              alt="Cala cerca de Lloret de Mar vista desde un barco, aguas turquesa Costa Brava"
              className="absolute inset-0 w-full h-full object-cover"
              width={1920}
              height={1080}
              loading="eager"
              {...({ fetchpriority: "high" } as unknown as React.ImgHTMLAttributes<HTMLImageElement>)}
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/55" />
          <div className="relative z-10 flex-1 flex items-center py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center justify-center mb-4">
                  <MapPin className="w-7 h-7 text-white mr-3 drop-shadow" />
                  <h1 className="text-h1 font-heading font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    {t.locationPages.lloret.hero.title}
                  </h1>
                </div>
                <p className="text-base sm:text-lg text-white/95 mb-5 max-w-3xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                  {t.locationPages.lloret.hero.subtitle}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                  <Badge variant="outline" className="bg-white/90 text-primary border-white">
                    <Anchor className="w-4 h-4 mr-2" />
                    {t.locationPages.lloret.hero.badgeFrom}
                  </Badge>
                  <Badge variant="outline" className="bg-white/90 text-primary border-white">
                    <Clock className="w-4 h-4 mr-2" />
                    {t.locationPages.lloret.hero.badgeTime}
                  </Badge>
                  <Badge variant="outline" className="bg-white/90 text-primary border-white">
                    <Users className="w-4 h-4 mr-2" />
                    {t.locationPages.lloret.hero.badgeCapacity}
                  </Badge>
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() => openBookingModal()}
                    className="bg-cta hover:bg-cta/90 text-cta-foreground rounded-full min-h-11 px-7 btn-elevated"
                    data-testid="button-location-hero-book"
                  >
                    {t.nav.bookNow}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-calas timeline (the page's SEO spine) — handled by the reusable
          component so the Home and the Lloret page surface the exact same
          data without duplication. */}
      <RangeFromBlanesSection variant="lloret" />

      {/* Why Visit Lloret de Mar by Boat — text + image */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-h2 font-heading font-bold text-foreground flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-primary" />
                {s.whyLloretTitle}
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">{s.uniquePerspective}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{s.uniquePerspectiveDesc}</p>
                  <h3 className="font-heading font-semibold text-lg mb-3">{s.spectacularBeaches}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.spectacularBeachesDesc}</p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">{s.vibrantAtmosphere}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{s.vibrantAtmosphereDesc}</p>
                  <h3 className="font-heading font-semibold text-lg mb-3">{s.easyAccess}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.easyAccessDesc}</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/mingolla/alquiler-barco-mingolla-brava-19-rent-a-boat-costa-brava-blanes-lateral-navegando.webp"
                alt="Barco Mingolla Brava 19 navegando hacia Lloret de Mar"
                className="rounded-2xl w-full h-auto object-cover shadow-lg"
                loading="lazy"
                width={800}
                height={600}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Photo break */}
      <div className="relative w-full h-64 sm:h-80 overflow-hidden">
        <picture>
          <source type="image/webp" srcSet="/images/blog/calas-costa-brava.webp" />
          <img
            src="/images/blog/calas-costa-brava.jpg"
            alt="Calas de la Costa Brava"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            width={1920}
            height={600}
          />
        </picture>
      </div>

      {/* What to Do in Lloret */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 font-heading font-bold text-foreground flex items-center gap-3 mb-6">
            <Music className="w-6 h-6 text-primary" />
            {s.whatToDoTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{s.entertainment}</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Music className="w-4 h-4 text-primary mr-2" />
                  <span>{s.nightlife}</span>
                </li>
                <li className="flex items-center">
                  <Utensils className="w-4 h-4 text-primary mr-2" />
                  <span>{s.restaurantsSea}</span>
                </li>
                <li className="flex items-center">
                  <Waves className="w-4 h-4 text-primary mr-2" />
                  <span>{s.waterSports}</span>
                </li>
                <li className="flex items-center">
                  <Camera className="w-4 h-4 text-primary mr-2" />
                  <span>{s.santaClotildeMirador}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{s.pointsOfInterest}</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-primary mr-2" />
                  <span>{s.mujerMarinera}</span>
                </li>
                <li className="flex items-center">
                  <NavigationIcon className="w-4 h-4 text-primary mr-2" />
                  <span>{s.castilloSantJoan}</span>
                </li>
                <li className="flex items-center">
                  <Car className="w-4 h-4 text-primary mr-2" />
                  <span>{s.jardinesSantaClotilde}</span>
                </li>
                <li className="flex items-center">
                  <Ship className="w-4 h-4 text-primary mr-2" />
                  <span>{s.sportsMarina}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Navigation Tips */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 font-heading font-bold text-foreground flex items-center gap-3 mb-6">
            <NavigationIcon className="w-6 h-6 text-primary" />
            {s.navigationTipsTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{s.recommendedRoute}</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{s.recommendedRouteDesc}</p>
              <h3 className="font-heading font-semibold text-lg mb-3">{s.bestTimes}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.bestTimesDesc}</p>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{s.whereToAnchor}</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{s.whereToAnchorDesc}</p>
              <h3 className="font-heading font-semibold text-lg mb-3">{s.safety}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.safetyDesc}</p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Cross-linking to southern towns */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p
            className="text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: s.crossLinkingText
                .replace("{malgratPath}", localizedPath("locationMalgrat"))
                .replace("{santaSusannaPath}", localizedPath("locationSantaSusanna"))
                .replace("{calellaPath}", localizedPath("locationCalella")),
            }}
          />
        </div>
      </RevealSection>

      {/* Related Services - Internal Linking */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="font-heading font-semibold text-lg mb-4">{s.relatedTitle}</h3>
          <div className="flex flex-wrap gap-3">
            <a href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1 pointer-coarse:py-3">
              <ChevronRight className="w-4 h-4" />
              {s.relatedLicenseFree}
            </a>
            <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1 pointer-coarse:py-3">
              <ChevronRight className="w-4 h-4" />
              {s.relatedPricing}
            </a>
            <a href={localizedPath("locationTossa")} className="text-primary hover:underline flex items-center gap-1 pointer-coarse:py-3">
              <ChevronRight className="w-4 h-4" />
              {s.relatedTossa}
            </a>
            <a href={localizedPath("locationCostaBrava")} className="text-primary hover:underline flex items-center gap-1 pointer-coarse:py-3">
              <ChevronRight className="w-4 h-4" />
              {s.relatedCostaBrava}
            </a>
          </div>
        </div>
      </RevealSection>

      {/* CTA Section */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-h2 font-heading font-bold text-white mb-4">
            {s.ctaTitle}
          </h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            {s.ctaDescription}
          </p>
          <Button
            onClick={handleBookingWhatsApp}
            size="lg"
            variant="secondary"
            className="text-primary hover:text-primary"
            data-testid="button-whatsapp-lloret"
          >
            {s.ctaButton}
          </Button>
        </div>
      </div>

      <PopularBoatsSection
        title={t.popularBoatsSection?.pages?.lloret?.title ?? "Barcos populares para tu ruta a Lloret de Mar"}
        description={t.popularBoatsSection?.pages?.lloret?.description}
        boatIds={["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625", "excursion-privada"]}
      />

      {/* FAQ Section */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 font-heading font-bold text-foreground text-center mb-8">
            Preguntas frecuentes sobre Lloret de Mar en barco
          </h2>
          <FAQSection items={processedFaqItems} />
        </div>
      </RevealSection>


      <RelatedLocationsSection currentLocation="lloret" />

      <ActivitatumTeaser topic={"lloret"} surface="city-landing" />
      <RelatedContent currentPage="locationLloret" />

      <BookingStickyBar />
      <Footer />
    </div>
  );
}
