import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { postEraMeta } from "@shared/postEraMeta";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { Hotel, Sun, Train, Users } from "lucide-react";
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

export default function LocationPinedaDeMarPage() {
  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const { language } = useLanguage();
  useEffect(() => {
    trackLocationPageView("pineda");
  }, []);

  const page = t.locationPages.pineda;
  const s = page?.sections;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const render = (tpl: string | undefined, fallback: string) =>
    substituteFaqVars(tpl ?? fallback, faqVars);

  const locationSchema = {
    "@type": "TouristDestination",
    name: page?.schema?.name ?? "Alquiler de Barcos cerca de Pineda de Mar",
    description:
      page?.schema?.description ??
      "Alquila barcos desde el Puerto de Blanes, a solo 18 minutos en coche de Pineda de Mar. Con la Licencia de Navegación o con patrón.",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.6281,
      longitude: 2.6914,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pineda de Mar",
      addressRegion: "Barcelona",
      postalCode: "08397",
      addressCountry: "ES",
    },
    touristType: ["Family", "Hotels", "Beach"],
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
    {
      name: page?.breadcrumbName ?? "Alquiler Barcos Pineda de Mar",
      url: "/alquiler-barcos-pineda-de-mar",
    },
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
        {...postEraMeta("/alquiler-barcos-pineda-de-mar", language, {
          title:
            page?.seo?.title ??
            "Alquiler Barco Pineda de Mar | Puerto Blanes a 18 min | Titulín o Patrón",
          description:
            page?.seo?.description ??
            "¿Alojado en Pineda de Mar? El Puerto de Blanes está a 18 min. Desde el 1 de octubre de 2026 alquilas con la Licencia de Navegación (curso de 1 día, sin examen) o sales con patrón.",
        })}
        ogTitle={page?.seo?.ogTitle ?? "Alquiler Barco Pineda de Mar | 18 min al Puerto Blanes"}
        ogDescription={
          page?.seo?.ogDescription ??
          "Desde Pineda de Mar al Puerto Blanes en 18 min. Con titulín o con patrón."
        }
        canonical={getCanonicalUrl("/alquiler-barcos-pineda-de-mar")}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      <TownLanding
        slug="pineda"
        s={s}
        render={render}
        heroTitle={s?.heroTitle ?? "Alquiler de Barcos cerca de Pineda de Mar"}
        heroImage={{
          basePath: "/images/locations/hero-pineda-de-mar",
          alt: s?.heroImageAlt ?? s?.heroTitle ?? "Costa Brava",
        }}
        onBook={handleBookingWhatsApp}
        bookLabel={t.nav.bookNow}
        attractionIcons={[Hotel, Sun, Users]}
        transportIcon={Train}
        faqItems={processedFaqItems}
        ctaTestId="button-whatsapp-pineda"
      />

      <BookingStickyBar />
      <Footer />
    </div>
  );
}
