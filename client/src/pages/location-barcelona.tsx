import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Anchor,
  Users,
  Car,
  Train,
  Bus,
  Waves,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { FAQSection } from "@/components/FAQSection";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
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

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform,filter] duration-700 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"} ${className}`}>
      {children}
    </div>
  );
}

export default function LocationBarcelonaPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => { trackLocationPageView("barcelona"); }, []);

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

  const faqItems = [
    {
      question: "¿Puedo alquilar un barco sin licencia cerca de Barcelona?",
      answer: "Sí, en Blanes (Costa Brava), a solo 70 minutos de Barcelona por la autopista AP-7, puedes alquilar barcos sin licencia desde {noLicBaja1h} €/hora. No necesitas experiencia previa ni titulación náutica, solo ser mayor de 18 años.",
    },
    {
      question: "¿Cuánto se tarda de Barcelona a Blanes?",
      answer: "En coche por la AP-7 se tarda aproximadamente 70 minutos. En tren RENFE (línea R1 Rodalies) unos 90 minutos desde Barcelona Sants o Passeig de Gràcia. También hay autobuses directos desde la Estación del Nord.",
    },
    {
      question: "¿Es más barato alquilar un barco en Blanes que en Barcelona?",
      answer: "Sí, significativamente. En Blanes los barcos sin licencia cuestan desde {noLicBaja1h} €/hora con gasolina incluida, mientras que en puertos de Barcelona los precios suelen empezar desde 120-150 €/hora. Además, las aguas en la Costa Brava son mucho más cristalinas y hay menos tráfico marítimo.",
    },
  ];

  const processedFaqItems = useMemo(
    () => faqItems.map((item) => ({
      question: substituteFaqVars(item.question, faqVars),
      answer: substituteFaqVars(item.answer, faqVars),
    })),
    [faqVars],
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
      "Alquiler de barcos sin licencia a 70 minutos de Barcelona. Puerto de Blanes, Costa Brava. Desde 70 € con gasolina incluida.",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.6722504,
      longitude: 2.7978625,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Puerto de Blanes",
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

      {/* Hero */}
      <div className="bg-card border-b border-border pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-6">
            {lb.hero.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto mb-6">
            {sub(lb.hero.description)}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Badge variant="outline" className="text-primary border-primary">
              <Car className="w-4 h-4 mr-2" />
              {lb.hero.badgeDistance}
            </Badge>
            <Badge variant="outline" className="text-primary border-primary">
              <Anchor className="w-4 h-4 mr-2" />
              {sub(lb.hero.badgeLicense)}
            </Badge>
            <Badge variant="outline" className="text-primary border-primary">
              <Waves className="w-4 h-4 mr-2" />
              {lb.hero.badgeWaters}
            </Badge>
          </div>
        </div>
      </div>

      {/* Why Blanes instead of Barcelona — text + image */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-3 mb-6">
                <Waves className="w-6 h-6 text-primary" />
                {lb.whyBlanes.title}
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">{lb.whyBlanes.betterPricesTitle}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{sub(lb.whyBlanes.betterPricesBody)}</p>
                  <h3 className="font-heading font-semibold text-lg mb-3">{lb.whyBlanes.crystalWatersTitle}</h3>
                  <p className="text-muted-foreground leading-relaxed">{lb.whyBlanes.crystalWatersBody}</p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">{lb.whyBlanes.lessTrafficTitle}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{lb.whyBlanes.lessTrafficBody}</p>
                  <h3 className="font-heading font-semibold text-lg mb-3">{lb.whyBlanes.realCostaBravaTitle}</h3>
                  <p className="text-muted-foreground leading-relaxed">{lb.whyBlanes.realCostaBravaBody}</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-pareja-navegando.webp"
                alt="Pareja navegando en Trimarchi 57S por la Costa Brava"
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
        <img
          src="/images/mejores-calas-costa-brava-mingolla-brava-rent-a-boat.webp"
          alt="Mejores calas de la Costa Brava"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* How to get from Barcelona */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-primary" />
            {lb.howToGet.title}
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <Car className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-heading font-semibold text-lg mb-1">{lb.howToGet.carTitle}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm mb-1" dangerouslySetInnerHTML={{ __html: lb.howToGet.carDuration }} />
                <p className="text-muted-foreground leading-relaxed text-sm">{lb.howToGet.carBody}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Train className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-heading font-semibold text-lg mb-1">{lb.howToGet.trainTitle}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm mb-1" dangerouslySetInnerHTML={{ __html: lb.howToGet.trainDuration }} />
                <p className="text-muted-foreground leading-relaxed text-sm">{lb.howToGet.trainBody}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Bus className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-heading font-semibold text-lg mb-1">{lb.howToGet.busTitle}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm mb-1" dangerouslySetInnerHTML={{ __html: lb.howToGet.busDuration }} />
                <p className="text-muted-foreground leading-relaxed text-sm">{lb.howToGet.busBody}</p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Our boats */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-3 mb-6">
            <Anchor className="w-6 h-6 text-primary" />
            {lb.boats.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{lb.boats.noLicenseTitle}</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">{lb.boats.noLicenseBody}</p>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {lb.boats.noLicenseBullet1}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {lb.boats.noLicenseBullet2}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{lb.boats.licensedTitle}</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">{lb.boats.licensedBody}</p>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {lb.boats.licensedBullet1}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {lb.boats.licensedBullet2}
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <a href={localizedPath("home") + "#fleet"}>
                {lb.boats.viewAllCta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </RevealSection>

      <PopularBoatsSection
        title="Barcos para tu escapada desde Barcelona"
        description="A 1h en coche o en tren R1, el Puerto de Blanes es la opción más cercana para alquilar barco en la Costa Brava. Desde sin licencia (5 de los 8 barcos) hasta charter premium con patrón."
        boatIds={["remus-450", "astec-480", "pacific-craft-625", "excursion-privada"]}
        badgeLabel={(id) => (id === "excursion-privada" ? "Con capitán" : id === "pacific-craft-625" ? "Con LNB" : "Sin licencia")}
        badgeVariant={(id) => (id === "excursion-privada" || id === "pacific-craft-625" ? "outline" : "secondary")}
      />

      {/* FAQ section */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground text-center mb-8">
            {lb.faqTitle}
          </h2>
          <FAQSection items={processedFaqItems} />
        </div>
      </RevealSection>

      {/* CTA */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">{lb.cta.title}</h2>
          <p className="text-lg text-white/85 mb-6 max-w-2xl mx-auto">{sub(lb.cta.subtitle)}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => openBookingModal()}
              className="rounded-full"
            >
              <Anchor className="w-5 h-5 mr-2" />
              {lb.cta.reserveButton}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-full"
              asChild
            >
              <a href={localizedPath("pricing")}>
                {lb.cta.viewPricesButton}
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Blog section */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-4">
            {lb.blog.title}
          </h2>
          <p
            className="text-muted-foreground leading-relaxed mb-4"
            dangerouslySetInnerHTML={{
              __html: lb.blog.description.replace("{blogPath}", localizedPath("blog")),
            }}
          />
        </div>
      </RevealSection>

      <Footer />
    </div>
  );
}
