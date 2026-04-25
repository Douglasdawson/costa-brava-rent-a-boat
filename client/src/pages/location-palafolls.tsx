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
  Star,
  Car,
  Bus,
  ParkingCircle,
  Waves,
  TreePine,
  Tent,
} from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { FAQSection } from "@/components/FAQSection";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import Footer from "@/components/Footer";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { getCanonicalUrl } from "@/lib/domain";
import { trackLocationPageView } from "@/utils/analytics";

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform,filter] duration-700 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"} ${className}`}>
      {children}
    </div>
  );
}

export default function LocationPalafollsPage() {
  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  useEffect(() => { trackLocationPageView("palafolls"); }, []);

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
    "name": page?.schema?.name ?? "Alquiler de Barcos cerca de Palafolls",
    "description": page?.schema?.description ?? "Alquila barcos desde el Puerto de Blanes, a solo 12 minutos en coche de Palafolls. Barcos sin licencia desde 70 EUR/hora con gasolina incluida.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.6694,
      "longitude": 2.7506
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Palafolls",
      "addressRegion": "Barcelona",
      "postalCode": "08389",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Camping", "Nature"],
    "availableLanguage": ["Spanish", "Catalan", "English", "French"],
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://www.costabravarentaboat.com/"
    }
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: page?.breadcrumbName ?? "Alquiler Barcos Palafolls", url: "/alquiler-barcos-palafolls" }
  ]);

  const faqItems = page?.faqItems ?? [];

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
        title={page?.seo?.title ?? "Alquiler Barco Palafolls | Puerto Blanes 12 min | Sin Licencia 70€/h"}
        description={page?.seo?.description ?? "¿En camping o alojamiento en Palafolls? Puerto Blanes a 12 min en coche. Alquila barco sin licencia desde 70€/h con gasolina incluida. Excursión ideal Costa Brava."}
        ogTitle={page?.seo?.ogTitle ?? "Alquiler Barco Palafolls | 12 min al Puerto Blanes"}
        ogDescription={page?.seo?.ogDescription ?? "Desde Palafolls al Puerto Blanes en 12 min. Barco sin licencia desde 70€/h. Gasolina incluida. 4.8★."}
        canonical={getCanonicalUrl("/alquiler-barcos-palafolls")}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {s?.heroTitle ?? "Alquiler de Barcos cerca de Palafolls"}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {s?.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Car className="w-4 h-4 mr-2" />
                {s?.heroBadgeCar}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                {s?.heroBadgeTransport}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Tent className="w-4 h-4 mr-2" />
                {s?.heroBadgeExtra}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Why Rent from Blanes */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-3 mb-8">
                <Anchor className="w-6 h-6 text-primary" />
                {s?.whyTitle}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">{s?.whyCard1Title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{s?.whyCard1Desc}</p>
                  <h3 className="font-heading font-semibold text-lg mb-3">{s?.whyCard2Title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s?.whyCard2Desc}</p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">{s?.whyCard3Title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{s?.whyCard3Desc}</p>
                  <h3 className="font-heading font-semibold text-lg mb-3">{s?.whyCard4Title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s?.whyCard4Desc}</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-amigos-snorkel.webp"
                alt="Friends enjoying a boat day on the Costa Brava"
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                width={640}
                height={800}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Photo break */}
      <div className="w-full overflow-hidden">
        <img
          src="/images/mejores-calas-costa-brava-mingolla-brava-rent-a-boat.webp"
          alt="Boat anchored in a crystal-clear cove along the Costa Brava coast"
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* Town Attractions */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-3 mb-4">
            <Star className="w-6 h-6 text-primary" />
            {s?.townTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10">{s?.townIntro}</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Tent className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{s?.townCard1Title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s?.townCard1Desc}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Waves className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{s?.townCard2Title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s?.townCard2Desc}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TreePine className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{s?.townCard3Title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s?.townCard3Desc}</p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* How to Get to Blanes */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-3 mb-8">
            <Car className="w-6 h-6 text-primary" />
            {s?.howTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                {s?.howCarTitle}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{s?.howCarDesc}</p>
              <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                {s?.howTaxiTitle}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{s?.howTaxiDesc}</p>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bus className="w-5 h-5 text-primary" />
                </div>
                {s?.howTransportTitle}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{s?.howTransportDesc}</p>
              <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ParkingCircle className="w-5 h-5 text-primary" />
                </div>
                {s?.howParkingTitle}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{s?.howParkingDesc}</p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Boat Destinations from Blanes */}
      <div className="py-8 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-3 mb-4">
            <Anchor className="w-6 h-6 text-primary" />
            {s?.destsTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">{s?.destsIntro}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={localizedPath("locationLloret")}>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">{s?.destLloret}</Badge>
            </Link>
            <Link href={localizedPath("locationTossa")}>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">{s?.destTossa}</Badge>
            </Link>
            <Link href={localizedPath("locationBlanes")}>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">{s?.destBlanes}</Badge>
            </Link>
          </div>
        </div>
      </div>

      {/* Pricing Overview */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-primary" />
            {s?.pricingTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">{s?.pricingIntro}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{s?.pricingNoLicTitle}</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">{render(s?.pricingNoLicFrom, '')}</p>
              <p className="text-muted-foreground leading-relaxed">{s?.pricingNoLicCapacity}</p>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{s?.pricingLicTitle}</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">{render(s?.pricingLicFrom, '')}</p>
              <p className="text-muted-foreground leading-relaxed mb-2">{s?.pricingLicEngines}</p>
              <p className="text-muted-foreground leading-relaxed">{s?.pricingLicCapacity}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href={localizedPath("pricing")}>
              <Button variant="outline" size="sm">
                {s?.pricingButton}
              </Button>
            </Link>
          </div>
        </div>
      </RevealSection>

      {/* CTA Section */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">{s?.ctaTitle}</h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">{s?.ctaDesc}</p>
          <Button
            onClick={handleBookingWhatsApp}
            size="lg"
            variant="secondary"
            className="text-primary hover:text-primary"
            data-testid="button-whatsapp-palafolls"
          >
            {s?.ctaButton}
          </Button>
        </div>
      </div>

      {/* FAQ Section */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground text-center mb-8">
            {s?.faqTitle}
          </h2>
          <FAQSection items={processedFaqItems} />
        </div>
      </RevealSection>

      <RelatedLocationsSection currentLocation="palafolls" />

      <Footer />
    </div>
  );
}
