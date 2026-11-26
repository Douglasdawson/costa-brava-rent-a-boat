import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { postEraMeta } from "@shared/postEraMeta";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { Bus, Tent, TreePine, Waves } from "lucide-react";
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

export default function LocationPalafollsPage() {
  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const { language } = useLanguage();
  useEffect(() => {
    trackLocationPageView("palafolls");
  }, []);

  const page = t.locationPages.palafolls;
  const s = page?.sections;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const render = (tpl: string | undefined, fallback: string) =>
    substituteFaqVars(tpl ?? fallback, faqVars);

  const locationSchema = {
    "@type": "TouristDestination",
    name: page?.schema?.name ?? "Alquiler de Barcos cerca de Palafolls",
    description:
      page?.schema?.description ??
      "Alquila barcos desde el Puerto de Blanes, a solo 12 minutos en coche de Palafolls. Con la Licencia de Navegación o con patrón.",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.6694,
      longitude: 2.7506,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Palafolls",
      addressRegion: "Barcelona",
      postalCode: "08389",
      addressCountry: "ES",
    },
    touristType: ["Family", "Camping", "Nature"],
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
      name: page?.breadcrumbName ?? "Alquiler Barcos Palafolls",
      url: "/alquiler-barcos-palafolls",
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
        {...postEraMeta("/alquiler-barcos-palafolls", language, {
          title:
            page?.seo?.title ??
            "Alquiler Barco Palafolls | Puerto Blanes a 12 min | Titulín o Patrón",
          description:
            page?.seo?.description ??
            "¿Alojado en Palafolls? El Puerto de Blanes está a 12 min. Desde el 1 de octubre de 2026 alquilas con la Licencia de Navegación (curso de 1 día, sin examen) o sales con patrón.",
        })}
        ogTitle={page?.seo?.ogTitle ?? "Alquiler Barco Palafolls | 12 min al Puerto Blanes"}
        ogDescription={
          page?.seo?.ogDescription ??
          "Desde Palafolls al Puerto Blanes en 12 min. Con titulín o con patrón."
        }
        canonical={getCanonicalUrl("/alquiler-barcos-palafolls")}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      <TownLanding
        slug="palafolls"
        s={s}
        render={render}
        heroTitle={s?.heroTitle ?? "Alquiler de Barcos cerca de Palafolls"}
        onBook={handleBookingWhatsApp}
        bookLabel={t.nav.bookNow}
        attractionIcons={[Tent, Waves, TreePine]}
        transportIcon={Bus}
        faqItems={processedFaqItems}
        ctaTestId="button-whatsapp-palafolls"
        showActivitatum
      />

      <BookingStickyBar />
      <Footer />
    </div>
  );
}
