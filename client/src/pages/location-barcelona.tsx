import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { Car, Train, Bus } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { trackLocationPageView } from "@/utils/analytics";
import PopularBoatsSection from "@/components/PopularBoatsSection";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  FactPanel,
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

export default function LocationBarcelonaPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => {
    trackLocationPageView("barcelona");
  }, []);

  const t = useTranslations();
  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const lb = t.locationBarcelona!;
  const sub = (s: string) => substituteFaqVars(s, faqVars);
  const { openBookingModal } = useBookingModal();
  const seoConfig = getSEOConfig("locationBarcelona", language);
  const hreflangLinks = generateHreflangLinks("locationBarcelona");
  const canonical = generateCanonicalUrl("locationBarcelona", language);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs?.home || "Inicio", url: "/" },
    { name: "Alquiler barcos cerca de Barcelona", url: "/alquiler-barcos-cerca-barcelona" },
  ]);

  const faqItems = useMemo(() => lb.faqItems ?? [], [lb.faqItems]);

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

  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: "Alquiler de Barcos cerca de Barcelona - Blanes, Costa Brava",
    description:
      "Alquiler de barcos a 70 minutos de Barcelona con Licencia de Navegación o con patrón. Puerto de Blanes, Costa Brava.",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.6722504,
      longitude: 2.7978625,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Carrer Esplanada del Port",
      addressLocality: "Blanes",
      addressRegion: "Girona",
      postalCode: "17300",
      addressCountry: "ES",
    },
    touristType: ["Family", "Adventure", "Beach"],
    provider: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat Blanes",
      telephone: "+34611500372",
      url: "https://www.costabravarentaboat.com/",
    },
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

      <LocationHero
        title={lb.hero.title}
        subtitle={sub(lb.hero.description)}
        facts={[lb.hero.badgeDistance, sub(lb.hero.badgeLicense), lb.hero.badgeWaters]}
        bookLabel={t.nav.bookNow}
        onBook={() => openBookingModal()}
      />

      {/* Why Blanes instead of Barcelona */}
      <Sheet tone="page" next="muted" labelledBy="bcn-why-title">
        <div className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16">
          <Rise>
            <SectionTitle id="bcn-why-title">{lb.whyBlanes.title}</SectionTitle>
            <FactPanel
              className="mt-8"
              items={[
                { title: lb.whyBlanes.betterPricesTitle, desc: sub(lb.whyBlanes.betterPricesBody) },
                { title: lb.whyBlanes.crystalWatersTitle, desc: lb.whyBlanes.crystalWatersBody },
                { title: lb.whyBlanes.lessTrafficTitle, desc: lb.whyBlanes.lessTrafficBody },
                { title: lb.whyBlanes.realCostaBravaTitle, desc: lb.whyBlanes.realCostaBravaBody },
              ]}
            />
          </Rise>
          <Rise delay={0.1}>
            <Photo
              src="/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-pareja-navegando.webp"
              alt="Pareja navegando en Trimarchi 57S por la Costa Brava"
            />
          </Rise>
        </div>
      </Sheet>

      {/* How to get from Barcelona */}
      <Sheet tone="muted" next="page" labelledBy="bcn-how-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
          <Rise>
            <Photo
              src="/images/mejores-calas-costa-brava-mingolla-brava-rent-a-boat.webp"
              alt="Mejores calas de la Costa Brava"
            />
          </Rise>
          <Rise delay={0.1}>
            <SectionTitle id="bcn-how-title">{lb.howToGet.title}</SectionTitle>
            <FactPanel
              className="mt-8"
              items={[
                {
                  title: lb.howToGet.carTitle,
                  metaHtml: lb.howToGet.carDuration,
                  desc: lb.howToGet.carBody,
                  icon: Car,
                },
                {
                  title: lb.howToGet.trainTitle,
                  metaHtml: lb.howToGet.trainDuration,
                  desc: lb.howToGet.trainBody,
                  icon: Train,
                },
                {
                  title: lb.howToGet.busTitle,
                  metaHtml: lb.howToGet.busDuration,
                  desc: lb.howToGet.busBody,
                  icon: Bus,
                },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Our boats */}
      <Sheet tone="page" next="muted" labelledBy="bcn-boats-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id="bcn-boats-title">{lb.boats.title}</SectionTitle>
            <InteractiveHoverButton
              tone="dark"
              as="a"
              href={localizedPath("home") + "#fleet"}
              className="mt-8 min-h-12 px-7 text-base dark:text-background"
            >
              {lb.boats.viewAllCta}
            </InteractiveHoverButton>
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={[
                {
                  title: lb.boats.noLicenseTitle,
                  lines: [
                    lb.boats.noLicenseBody,
                    lb.boats.noLicenseBullet1,
                    lb.boats.noLicenseBullet2,
                  ],
                },
                {
                  title: lb.boats.licensedTitle,
                  lines: [
                    lb.boats.licensedBody,
                    lb.boats.licensedBullet1,
                    lb.boats.licensedBullet2,
                  ],
                },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      <SheetWrap next="page">
        <PopularBoatsSection
          bgClass={TONE_BG.muted}
          title={
            t.popularBoatsSection?.pages?.barcelona?.title ??
            "Barcos para tu escapada desde Barcelona"
          }
          description={t.popularBoatsSection?.pages?.barcelona?.description}
          boatIds={["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625", "excursion-privada"]}
          badgeLabel={id =>
            id === "excursion-privada"
              ? (t.popularBoatsSection?.badges?.captain ?? "Con capitán")
              : (t.popularBoatsSection?.badges?.licensed ?? "Con licencia")
          }
          badgeVariant={id =>
            id === "excursion-privada" || id === "pacific-craft-625" ? "outline" : "secondary"
          }
        />
      </SheetWrap>

      <LocationFaq id="bcn-faq" title={lb.faqTitle} items={processedFaqItems} next="navy" />

      <LocationCta
        title={lb.cta.title}
        desc={sub(lb.cta.subtitle)}
        buttonLabel={lb.cta.reserveButton}
        onClick={() => openBookingModal()}
        secondary={{ label: lb.cta.viewPricesButton, href: localizedPath("pricing") }}
        next="muted"
      />

      {/* Blog section: closes over the footer colour */}
      <div className="bg-foreground dark:bg-[hsl(215_45%_16%)]">
        <Sheet tone="muted" next="ink" labelledBy="bcn-blog-title">
          <Rise className="max-w-2xl">
            <SectionTitle id="bcn-blog-title">{lb.blog.title}</SectionTitle>
            <p
              className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4"
              dangerouslySetInnerHTML={{
                __html: lb.blog.description.replace("{blogPath}", localizedPath("blog")),
              }}
            />
          </Rise>
        </Sheet>
        <BookingStickyBar />
      </div>
      <Footer />
    </div>
  );
}
