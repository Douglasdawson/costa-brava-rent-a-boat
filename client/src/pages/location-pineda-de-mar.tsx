import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Anchor,
  Users,
  Star,
  Car,
  Train,
  ParkingCircle,
  Waves,
  Hotel,
  Sun,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { getCanonicalUrl } from "@/lib/domain";
import { trackLocationPageView } from "@/utils/analytics";

export default function LocationPinedaDeMarPage() {
  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  useEffect(() => { trackLocationPageView("pineda"); }, []);

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
    "name": page?.schema?.name ?? "Alquiler de Barcos cerca de Pineda de Mar",
    "description": page?.schema?.description ?? "Alquila barcos desde el Puerto de Blanes, a solo 18 minutos en coche de Pineda de Mar. Barcos sin licencia desde 70 EUR/hora con gasolina incluida.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.6281,
      "longitude": 2.6914
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Pineda de Mar",
      "addressRegion": "Barcelona",
      "postalCode": "08397",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Hotels", "Beach"],
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
    { name: page?.breadcrumbName ?? "Alquiler Barcos Pineda de Mar", url: "/alquiler-barcos-pineda-de-mar" }
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
        title={page?.seo?.title ?? "Alquiler Barco Pineda de Mar | Puerto Blanes 18 min | Sin Licencia 70€/h"}
        description={page?.seo?.description ?? "¿Alojado en Pineda de Mar? Puerto Blanes a 18 min en coche o 12 min en tren R1. Alquila barco sin licencia desde 70€/h con gasolina incluida. Navega a Blanes, Lloret o Tossa."}
        ogTitle={page?.seo?.ogTitle ?? "Alquiler Barco Pineda de Mar | 18 min al Puerto Blanes"}
        ogDescription={page?.seo?.ogDescription ?? "Desde Pineda de Mar al Puerto Blanes en 18 min. Barco sin licencia desde 70€/h. 4.8★ Google."}
        canonical={getCanonicalUrl("/alquiler-barcos-pineda-de-mar")}
        jsonLd={combinedJsonLd}
      />
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {s?.heroTitle ?? "Alquiler de Barcos cerca de Pineda de Mar"}
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
                <Train className="w-4 h-4 mr-2" />
                {s?.heroBadgeTransport}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Waves className="w-4 h-4 mr-2" />
                {s?.heroBadgeExtra}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Why Rent from Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Anchor className="w-6 h-6 text-cta" />
                {s?.whyTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s?.whyCard1Title}</h3>
                  <p className="text-muted-foreground mb-4">{s?.whyCard1Desc}</p>
                  <h3 className="font-semibold text-lg mb-3">{render(s?.whyCard2Title, '')}</h3>
                  <p className="text-muted-foreground">{render(s?.whyCard2Desc, '')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s?.whyCard3Title}</h3>
                  <p className="text-muted-foreground mb-4">{s?.whyCard3Desc}</p>
                  <h3 className="font-semibold text-lg mb-3">{s?.whyCard4Title}</h3>
                  <p className="text-muted-foreground">{s?.whyCard4Desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Town Attractions */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-primary" />
                {s?.townTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{s?.townIntro}</p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Hotel className="w-8 h-8 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s?.townCard1Title}</h3>
                  <p className="text-muted-foreground">{s?.townCard1Desc}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s?.townCard2Title}</h3>
                  <p className="text-muted-foreground">{s?.townCard2Desc}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s?.townCard3Title}</h3>
                  <p className="text-muted-foreground">{s?.townCard3Desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Get to Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Car className="w-6 h-6 text-primary" />
                {s?.howTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    {s?.howCarTitle}
                  </h3>
                  <p className="text-muted-foreground mb-4">{s?.howCarDesc}</p>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {s?.howTaxiTitle}
                  </h3>
                  <p className="text-muted-foreground">{s?.howTaxiDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Train className="w-5 h-5 text-primary" />
                    {s?.howTransportTitle}
                  </h3>
                  <p className="text-muted-foreground mb-4">{s?.howTransportDesc}</p>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ParkingCircle className="w-5 h-5 text-primary" />
                    {s?.howParkingTitle}
                  </h3>
                  <p className="text-muted-foreground">{s?.howParkingDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boat Destinations from Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Anchor className="w-6 h-6 text-primary" />
                {s?.destsTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{s?.destsIntro}</p>
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
            </CardContent>
          </Card>

          {/* Pricing Overview */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Clock className="w-6 h-6 text-primary" />
                {s?.pricingTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{s?.pricingIntro}</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s?.pricingNoLicTitle}</h3>
                  <p className="text-muted-foreground mb-2">{render(s?.pricingNoLicFrom, '')}</p>
                  <p className="text-muted-foreground">{s?.pricingNoLicCapacity}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s?.pricingLicTitle}</h3>
                  <p className="text-muted-foreground mb-2">{render(s?.pricingLicFrom, '')}</p>
                  <p className="text-muted-foreground mb-2">{s?.pricingLicEngines}</p>
                  <p className="text-muted-foreground">{s?.pricingLicCapacity}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href={localizedPath("pricing")}>
                  <Button variant="outline" size="sm">
                    {s?.pricingButton}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">{s?.ctaTitle}</h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">{s?.ctaDesc}</p>
              <Button
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-pineda"
              >
                {s?.ctaButton}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-heading font-bold text-center mb-8">
            {s?.faqTitle}
          </h2>
          <div className="space-y-3">
            {processedFaqItems.map((item, index) => (
              <details
                key={index}
                className="group border border-border rounded-lg bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="pr-4">{item.question}</span>
                  <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-4 text-muted-foreground">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      <RelatedLocationsSection currentLocation="pineda" />

      <Footer />
    </div>
  );
}
