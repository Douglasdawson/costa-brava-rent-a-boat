import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { useBookingModal } from "@/hooks/bookingModalContext";
import {
  Star,
  Navigation as NavigationIcon,
  Waves,
  Camera,
  Car,
  Ship,
  Music,
  Utensils,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import RelatedContent from "@/components/RelatedContent";
import RangeFromBlanesSection from "@/components/RangeFromBlanesSection";
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
import PopularBoatsSection from "@/components/PopularBoatsSection";
import {
  FactPanel,
  LocationCta,
  LocationFaq,
  LocationHero,
  Photo,
  RelatedLinks,
  Rise,
  SectionTitle,
  Sheet,
  SheetWrap,
  TONE_BG,
} from "@/components/location/LocationKit";
import ActivitatumTeaser from "@/components/ActivitatumTeaser";
import CoastrentOfficeNote from "@/components/CoastrentOfficeNote";
import { BookingStickyBar } from "@/components/MobileStickyBar";

export default function LocationLloretPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => {
    trackLocationPageView("lloret");
  }, []);

  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const seoConfig = getSEOConfig("locationLloret", language);
  const hreflangLinks = generateHreflangLinks("locationLloret");
  const canonical = generateCanonicalUrl("locationLloret", language);

  const s = t.locationPages.lloret.sections!;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  // Location-specific schema for Lloret de Mar
  const locationSchema = {
    "@type": "TouristDestination",
    name: "Excursiones en Barco a Lloret de Mar desde Blanes",
    description:
      "Alquiler de barcos para visitar Lloret de Mar desde Puerto de Blanes, con Licencia de Navegación o con patrón, para descubrir las playas de Lloret.",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.6988,
      longitude: 2.8466,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Playa de Lloret de Mar",
      addressLocality: "Lloret de Mar",
      addressRegion: "Girona",
      postalCode: "17310",
      addressCountry: "ES",
    },
    touristType: ["Family", "Adventure", "Beach", "Party"],
    availableLanguage: ["Spanish", "Catalan", "English", "French"],
    provider: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat Blanes",
      telephone: "+34611500372",
      url: "https://www.costabravarentaboat.com/",
    },
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.locationLloret, url: "/alquiler-barcos-lloret-de-mar" },
  ]);

  // FAQ data for both schema and visible section, from i18n only (all 8 locales
  // carry it; the old Spanish fallback promised licence-free rentals, which end
  // on 2026-10-01 under RD 1188/2025).
  const lloretFaqFromI18n = (
    t.locationPages.lloret as { faqItems?: Array<{ question: string; answer: string }> } | undefined
  )?.faqItems;
  const faqItems = lloretFaqFromI18n ?? [];

  const processedFaqItems = useMemo(
    () =>
      faqItems.map(item => ({
        question: substituteFaqVars(item.question, faqVars),
        answer: substituteFaqVars(item.answer, faqVars),
      })),
    [faqItems, faqVars]
  );

  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: processedFaqItems.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  // Combine schemas using @graph
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

      <LocationHero
        basePath="/images/locations/hero-lloret-de-mar"
        imageAlt="Cala cerca de Lloret de Mar vista desde un barco, aguas turquesa Costa Brava"
        title={t.locationPages.lloret.hero.title}
        subtitle={t.locationPages.lloret.hero.subtitle}
        facts={[
          t.locationPages.lloret.hero.badgeFrom,
          t.locationPages.lloret.hero.badgeTime,
          t.locationPages.lloret.hero.badgeCapacity,
        ]}
        bookLabel={t.nav.bookNow}
        onBook={() => openBookingModal()}
      />

      {/* 7-calas timeline (the page's SEO spine) — handled by the reusable
          component so the Home and the Lloret page surface the exact same
          data without duplication. */}
      <RangeFromBlanesSection variant="lloret" />

      {/* Why visit Lloret de Mar by boat */}
      <Sheet tone="page" next="muted" labelledBy="lloret-why-title">
        <div className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16">
          <Rise>
            <SectionTitle id="lloret-why-title">{s.whyLloretTitle}</SectionTitle>
            <FactPanel
              className="mt-8"
              items={[
                { title: s.uniquePerspective, desc: s.uniquePerspectiveDesc },
                { title: s.spectacularBeaches, desc: s.spectacularBeachesDesc },
                { title: s.vibrantAtmosphere, desc: s.vibrantAtmosphereDesc },
                { title: s.easyAccess, desc: s.easyAccessDesc },
              ]}
            />
          </Rise>
          <Rise delay={0.1}>
            <Photo
              src="/images/boats/mingolla/alquiler-barco-mingolla-brava-19-rent-a-boat-costa-brava-blanes-lateral-navegando.webp"
              alt="Barco Mingolla Brava 19 navegando hacia Lloret de Mar"
            />
          </Rise>
        </div>
      </Sheet>

      {/* What to do in Lloret */}
      <Sheet tone="muted" next="page" labelledBy="lloret-todo-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
          <Rise>
            <Photo src="/images/blog/calas-costa-brava.webp" alt="Calas de la Costa Brava" />
          </Rise>
          <Rise delay={0.1}>
            <SectionTitle id="lloret-todo-title">{s.whatToDoTitle}</SectionTitle>
            <FactPanel
              className="mt-8"
              items={[
                {
                  title: s.entertainment,
                  list: [
                    { text: s.nightlife, icon: Music },
                    { text: s.restaurantsSea, icon: Utensils },
                    { text: s.waterSports, icon: Waves },
                    { text: s.santaClotildeMirador, icon: Camera },
                  ],
                },
                {
                  title: s.pointsOfInterest,
                  list: [
                    { text: s.mujerMarinera, icon: Star },
                    { text: s.castilloSantJoan, icon: NavigationIcon },
                    { text: s.jardinesSantaClotilde, icon: Car },
                    { text: s.sportsMarina, icon: Ship },
                  ],
                },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Navigation tips */}
      <Sheet tone="page" next="muted" labelledBy="lloret-tips-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id="lloret-tips-title">{s.navigationTipsTitle}</SectionTitle>
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={[
                { title: s.recommendedRoute, desc: s.recommendedRouteDesc },
                { title: s.bestTimes, desc: s.bestTimesDesc },
                { title: s.whereToAnchor, desc: s.whereToAnchorDesc },
                { title: s.safety, desc: s.safetyDesc },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Cross-linking to southern towns + related services */}
      <Sheet tone="muted" next="navy">
        <RelatedLinks
          id="lloret-related-title"
          title={s.relatedTitle}
          html={s.crossLinkingText
            .replace("{malgratPath}", localizedPath("locationMalgrat"))
            .replace("{santaSusannaPath}", localizedPath("locationSantaSusanna"))
            .replace("{calellaPath}", localizedPath("locationCalella"))}
          links={[
            { label: s.relatedLicenseFree, href: localizedPath("categoryLicenseFree") },
            { label: s.relatedPricing, href: localizedPath("pricing") },
            { label: s.relatedTossa, href: localizedPath("locationTossa") },
            { label: s.relatedCostaBrava, href: localizedPath("locationCostaBrava") },
          ]}
        />
      </Sheet>

      <LocationCta
        title={s.ctaTitle}
        desc={s.ctaDescription}
        buttonLabel={s.ctaButton}
        onClick={handleBookingWhatsApp}
        testId="button-whatsapp-lloret"
        next="muted"
      />

      <SheetWrap next="page">
        <PopularBoatsSection
          bgClass={TONE_BG.muted}
          title={
            t.popularBoatsSection?.pages?.lloret?.title ??
            "Barcos populares para tu ruta a Lloret de Mar"
          }
          description={t.popularBoatsSection?.pages?.lloret?.description}
          boatIds={["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625", "excursion-privada"]}
        />
      </SheetWrap>

      <LocationFaq
        id="lloret-faq"
        title="Preguntas frecuentes sobre Lloret de Mar en barco"
        items={processedFaqItems}
        next="muted"
      />

      <RelatedLocationsSection currentLocation="lloret" />

      {/* Oficina de reservas en Lloret (Carabela). Va en esta landing porque es la página que
          responde a "alquiler barco Lloret": el visitante tiene que saber que puede reservar
          en Lloret pero que el barco lo coge en Blanes. */}
      <section className="px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <CoastrentOfficeNote
            surface="landing-lloret"
            className="leading-relaxed text-muted-foreground"
          />
        </div>
      </section>

      <ActivitatumTeaser topic={"lloret"} surface="city-landing" />
      <RelatedContent currentPage="locationLloret" />

      <BookingStickyBar />
      <Footer />
    </div>
  );
}
