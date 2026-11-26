import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { postEraMeta } from "@shared/postEraMeta";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { Mountain, Train, TreePine, Waves } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { getCanonicalUrl } from "@/lib/domain";
import { trackLocationPageView } from "@/utils/analytics";
import { BookingStickyBar } from "@/components/MobileStickyBar";
import TownLanding from "@/components/location/TownLanding";

export default function LocationTorderaPage() {
  const { language } = useLanguage();
  useEffect(() => {
    trackLocationPageView("tordera");
  }, []);

  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const page = t.locationPages.tordera;
  const s = page?.sections;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  // Placeholder substitution for headings/descriptions that use {fleetCount} / {noLicBaja1h} / {licBaja2h}.
  const render = (tpl: string | undefined, fallback: string) =>
    substituteFaqVars(tpl ?? fallback, faqVars);

  const locationSchema = {
    "@type": "TouristDestination",
    name: page?.schema?.name ?? "Alquiler de Barcos cerca de Tordera",
    description:
      page?.schema?.description ??
      "Alquila barcos desde el Puerto de Blanes, a solo 15 minutos en coche de Tordera. Con la Licencia de Navegación o con patrón.",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.6992,
      longitude: 2.7189,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tordera",
      addressRegion: "Barcelona",
      postalCode: "08490",
      addressCountry: "ES",
    },
    touristType: ["Family", "Nature", "Residential"],
    availableLanguage: ["Spanish", "Catalan", "English", "French"],
    provider: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat Blanes",
      telephone: "+34611500372",
      url: "https://www.costabravarentaboat.com/",
    },
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: page?.breadcrumbName ?? "Alquiler Barcos Tordera", url: "/alquiler-barcos-tordera" },
  ]);

  const faqItems = page?.faqItems ?? [];

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

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [locationSchema, breadcrumbSchema, faqSchema],
  };

  return (
    <div className="min-h-screen">
      <SEO
        {...postEraMeta("/alquiler-barcos-tordera", language, {
          title:
            page?.seo?.title ??
            "Alquiler Barco Tordera | Puerto Blanes a 15 min | Titulín o Patrón",
          description:
            page?.seo?.description ??
            "¿Alojado en Tordera? El Puerto de Blanes está a 15 min. Desde el 1 de octubre de 2026 alquilas con la Licencia de Navegación (curso de 1 día, sin examen) o sales con patrón.",
        })}
        ogTitle={page?.seo?.ogTitle ?? "Alquiler Barco Tordera | Delta del Tordera en Barco"}
        ogDescription={
          page?.seo?.ogDescription ??
          "Desde Tordera al Puerto Blanes en 15 min. Con titulín o con patrón."
        }
        canonical={getCanonicalUrl("/alquiler-barcos-tordera")}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      <TownLanding
        slug="tordera"
        s={s}
        render={render}
        heroTitle={s?.heroTitle ?? "Alquiler de Barcos cerca de Tordera"}
        onBook={handleBookingWhatsApp}
        bookLabel={t.nav.bookNow}
        attractionIcons={[Mountain, Waves, TreePine]}
        transportIcon={Train}
        faqItems={processedFaqItems}
        ctaTestId="button-whatsapp-tordera"
        showActivitatum
      />

      <BookingStickyBar />
      <Footer />
    </div>
  );
}
