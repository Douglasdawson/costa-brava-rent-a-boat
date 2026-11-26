import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { useBookingModal } from "@/hooks/bookingModalContext";
import {
  AlertTriangle,
  Camera,
  Castle,
  Navigation as NavigationIcon,
  Shield,
  Star,
  Sun,
  Waves,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
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
import { BookingStickyBar } from "@/components/MobileStickyBar";

export default function LocationTossaPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => {
    trackLocationPageView("tossa");
  }, []);

  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const seoConfig = getSEOConfig("locationTossa", language);
  const hreflangLinks = generateHreflangLinks("locationTossa");
  const canonical = generateCanonicalUrl("locationTossa", language);

  const s = t.locationPages.tossa.sections!;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  // Location-specific schema for Tossa de Mar
  const locationSchema = {
    "@type": "TouristDestination",
    name: "Excursiones en Barco a Tossa de Mar desde Blanes",
    description:
      "Alquiler de barcos para visitar Tossa de Mar desde Puerto de Blanes, con Licencia de Navegación o con patrón, para descubrir la Vila Vella y calas de Tossa.",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.72,
      longitude: 2.9313,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Playa de Tossa de Mar",
      addressLocality: "Tossa de Mar",
      addressRegion: "Girona",
      postalCode: "17320",
      addressCountry: "ES",
    },
    touristType: ["Family", "Cultural", "Beach", "Historic"],
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
    { name: t.breadcrumbs.locationTossa, url: "/alquiler-barcos-tossa-de-mar" },
  ]);

  // FAQ data for both schema and visible section - Tossa specific.
  //
  // Tossa de Mar is OUT OF RANGE for a licence-free boat from Blanes (~7 nm,
  // over the 2-mile legal limit). The two ways to reach Tossa commercially:
  //   (1) Auto-alquiler con Licencia de Navegación Básica (LNB) — packs cerrados 2h/4h/8h, 3 tiers
  //       por temporada, 3 barcos de flota (Mingolla 19 / Trimarchi 57S /
  //       Pacific Craft 625). Datos canónicos en shared/boatData.ts.
  //   (2) Excursión Privada con Capitán — ÚNICO charter guiado del catálogo.
  //       Pacific Craft 625 + patrón profesional, 4h máximo (no existe día
  //       completo con patrón), 7 pax, rutas Blanes↔Tossa. Precios por
  //       temporada: 420€ baja / 440€ media / 460€ alta. IVA, patrón,
  //       amarre, limpieza y seguro incluidos — combustible aparte.
  //       Catalog: /es/barco/excursion-privada
  //
  // Todos los precios que aparecen en esta FAQ vienen de shared/boatData.ts
  // o del producto excursion-privada en el catálogo — ninguno es asunción.
  const tossaFaqFromI18n = (
    t.locationPages.tossa as { faqItems?: Array<{ question: string; answer: string }> } | undefined
  )?.faqItems;
  const faqItems = tossaFaqFromI18n ?? [];

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
        basePath="/images/locations/hero-tossa-de-mar"
        imageAlt="Vila Vella de Tossa de Mar desde el mar con barco, murallas medievales y aguas cristalinas Costa Brava"
        title={t.locationPages.tossa.hero.title}
        subtitle={t.locationPages.tossa.hero.subtitle}
        facts={[
          t.locationPages.tossa.hero.badgeFrom,
          t.locationPages.tossa.hero.badgeTime,
          t.locationPages.tossa.hero.badgeCapacity,
        ]}
        bookLabel={t.nav.bookNow}
        onBook={() => openBookingModal()}
      />

      {/* Honest warning: Tossa is out of range for licence-free boats. Putting
          this immediately under the hero anchors the commercial positioning
          before any other content so users and crawlers see it first. */}
      <Sheet tone="page" next="page" className="py-8 sm:py-10">
        <Rise className="flex items-start gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-950/30 sm:p-6">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <div className="text-sm sm:text-base text-foreground">
            <p className="mb-1 font-semibold">{s.warningTitle}</p>
            <p
              className="leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: substituteFaqVars(s.warningBody, faqVars) }}
            />
          </div>
        </Rise>
      </Sheet>

      {/* Why visit Tossa de Mar by boat */}
      <Sheet tone="page" next="muted" labelledBy="tossa-why-title" className="pt-8 sm:pt-12">
        <div className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16">
          <Rise>
            <SectionTitle id="tossa-why-title">{s.whyTossaTitle}</SectionTitle>
            <FactPanel
              className="mt-8"
              items={[
                { title: s.jewelCostaBrava, desc: s.jewelCostaBravaDesc },
                { title: s.historicHeritage, desc: s.historicHeritageDesc },
                { title: s.paradisiacalCoves, desc: s.paradisiacalCovesDesc },
                { title: s.panoramicNavigation, desc: s.panoramicNavigationDesc },
              ]}
            />
          </Rise>
          <Rise delay={0.1}>
            <Photo
              src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-proa-solarium-cala.webp"
              alt="Pacific Craft 625 fondeado en una cala cerca de Tossa de Mar"
            />
          </Rise>
        </div>
      </Sheet>

      {/* Main beaches and historic sites */}
      <Sheet tone="muted" next="page" labelledBy="tossa-attractions-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
          <Rise>
            <Photo src="/images/blog/ruta-costera.webp" alt="Ruta costera por la Costa Brava" />
          </Rise>
          <Rise delay={0.1}>
            <SectionTitle id="tossa-attractions-title">{s.attractionsTitle}</SectionTitle>
            <FactPanel
              className="mt-8"
              items={[
                { title: s.vilaVella, meta: s.vilaVellaSub, desc: s.vilaVellaDesc, icon: Castle },
                {
                  title: s.playaGrande,
                  meta: s.playaGrandeSub,
                  desc: s.playaGrandeDesc,
                  icon: Waves,
                },
                {
                  title: s.virginCoves,
                  meta: s.virginCovesSub,
                  desc: s.virginCovesDesc,
                  icon: Sun,
                },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* What to do in Tossa */}
      <Sheet tone="page" next="muted" labelledBy="tossa-todo-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id="tossa-todo-title">{s.whatToDoTitle}</SectionTitle>
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={[
                {
                  title: s.cultureHistory,
                  list: [
                    { text: s.exploreVilaVella, icon: Castle },
                    { text: s.climbWalls, icon: Shield },
                    { text: s.municipalMuseum, icon: Camera },
                    { text: s.tossaLighthouse, icon: Star },
                  ],
                },
                {
                  title: s.natureRelax,
                  list: [
                    { text: s.diveCrystalWaters, icon: Waves },
                    { text: s.anchorSecretCoves, icon: Sun },
                    { text: s.coastalPaths, icon: NavigationIcon },
                    { text: s.sunsetFromSea, icon: Camera },
                  ],
                },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Navigation tips */}
      <Sheet tone="muted" next="page" labelledBy="tossa-tips-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id="tossa-tips-title">{s.navigationTipsTitle}</SectionTitle>
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={[
                { title: s.recommendedRoute, desc: s.recommendedRouteDesc },
                { title: s.bestSeason, desc: s.bestSeasonDesc },
                { title: s.anchoringZones, desc: s.anchoringZonesDesc },
                { title: s.safeNavigation, desc: s.safeNavigationDesc },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Cross-linking to southern towns + related services */}
      <Sheet tone="page" next="navy">
        <RelatedLinks
          id="tossa-related-title"
          title={s.relatedTitle}
          html={s.crossLinkingText
            .replace("{malgratPath}", localizedPath("locationMalgrat"))
            .replace("{santaSusannaPath}", localizedPath("locationSantaSusanna"))
            .replace("{calellaPath}", localizedPath("locationCalella"))}
          links={[
            { label: s.relatedCostaBrava, href: localizedPath("locationCostaBrava") },
            { label: s.relatedLicensed, href: localizedPath("categoryLicensed") },
            { label: s.relatedPricing, href: localizedPath("pricing") },
            { label: s.relatedLloret, href: localizedPath("locationLloret") },
            { label: s.relatedBlanes, href: localizedPath("locationBlanes") },
          ]}
        />
      </Sheet>

      <LocationCta
        title={s.ctaTitle}
        desc={s.ctaDescription}
        buttonLabel={s.ctaButton}
        onClick={handleBookingWhatsApp}
        testId="button-whatsapp-tossa"
        next="muted"
      />

      <SheetWrap next="page">
        <PopularBoatsSection
          bgClass={TONE_BG.muted}
          title={t.popularBoatsSection?.pages?.tossa?.title ?? "Barcos para tu ruta a Tossa de Mar"}
          description={t.popularBoatsSection?.pages?.tossa?.description}
          boatIds={["excursion-privada", "pacific-craft-625", "trimarchi-57s", "mingolla-brava-19"]}
          badgeLabel={id =>
            id === "excursion-privada"
              ? (t.popularBoatsSection?.badges?.captain ?? "Con capitán")
              : (t.popularBoatsSection?.badges?.licensed ?? "Con licencia")
          }
          badgeVariant={id => (id === "excursion-privada" ? "secondary" : "outline")}
        />
      </SheetWrap>

      <LocationFaq
        id="tossa-faq"
        title="Preguntas frecuentes sobre Tossa de Mar en barco"
        items={processedFaqItems}
        next="muted"
      />

      <RelatedLocationsSection currentLocation="tossa" />

      <ActivitatumTeaser topic={"lloret"} surface="city-landing" />
      <RelatedContent currentPage="locationTossa" />

      <BookingStickyBar />
      <Footer />
    </div>
  );
}
