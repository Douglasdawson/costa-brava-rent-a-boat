import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Anchor, 
  Users, 
  Star,
  Navigation as NavigationIcon,
  Sun,
  Waves,
  Camera,
  Shield,
  Castle,
  Crown,
  Heart,
  ChevronRight
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { 
  getSEOConfig, 
  generateHreflangLinks, 
  generateCanonicalUrl,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { trackLocationPageView } from "@/utils/analytics";

export default function LocationTossaPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => { trackLocationPageView("tossa"); }, []);

  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const seoConfig = getSEOConfig('locationTossa', language);
  const hreflangLinks = generateHreflangLinks('locationTossa');
  const canonical = generateCanonicalUrl('locationTossa', language);

  const s = t.locationPages.tossa.sections!;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // Location-specific schema for Tossa de Mar
  const locationSchema = {
    "@type": "TouristDestination",
    "name": "Excursiones en Barco a Tossa de Mar desde Blanes",
    "description": "Alquiler de barcos para visitar Tossa de Mar desde Puerto de Blanes. Embarcaciones sin licencia y con licencia para descubrir la Vila Vella y calas de Tossa.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.7200,
      "longitude": 2.9313
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Playa de Tossa de Mar",
      "addressLocality": "Tossa de Mar",
      "addressRegion": "Girona",
      "postalCode": "17320",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Cultural", "Beach", "Historic"],
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
    { name: t.breadcrumbs.locationTossa, url: "/alquiler-barcos-tossa-de-mar" }
  ]);

  // FAQ data for both schema and visible section - Tossa specific.
  //
  // Tossa de Mar is OUT OF RANGE for a licence-free boat from Blanes (~7 nm,
  // over the 2-mile legal limit). The two ways to reach Tossa commercially:
  //   (1) Auto-alquiler con Licencia Básica de Navegación (LBN) — packs cerrados 2h/4h/8h, 3 tiers
  //       por temporada, 3 barcos de flota (Mingolla 19 / Trimarchi 57S /
  //       Pacific Craft 625). Datos canónicos en shared/boatData.ts.
  //   (2) Excursión Privada con Capitán — ÚNICO charter guiado del catálogo.
  //       Pacific Craft 625 + patrón profesional, 4h máximo (no existe día
  //       completo con patrón), 7 pax, rutas Blanes↔Tossa. Precios por
  //       temporada: 380€ baja / 400€ media / 420€ alta. IVA, patrón,
  //       amarre, limpieza y seguro incluidos — combustible aparte.
  //       Catalog: /es/barco/excursion-privada
  //
  // Todos los precios que aparecen en esta FAQ vienen de shared/boatData.ts
  // o del producto excursion-privada en el catálogo — ninguno es asunción.
  const tossaFaqFromI18n = (t.locationPages.tossa as { faqItems?: Array<{ question: string; answer: string }> } | undefined)?.faqItems;
  const faqItems = tossaFaqFromI18n && tossaFaqFromI18n.length > 0 ? tossaFaqFromI18n : [
    {
      question: "¿Puedo llegar a Tossa de Mar con barco sin licencia desde Blanes?",
      answer: "No. Los barcos sin licencia (2 millas de costa, 5 nudos, 15 CV) llegan hasta Playa de Fenals (sur de Lloret), 4 millas antes de Tossa. Para llegar a Tossa necesitas Licencia Básica de Navegación (LBN) o contratar la Excursión Privada con Capitán."
    },
    {
      question: "¿Cuánto se tarda en barco de Blanes a Tossa?",
      answer: "Entre 45 minutos y 1 hora desde el Puerto de Blanes. 7 millas de costa espectacular con acantilados y calas vírgenes."
    },
    {
      question: "¿Cuánto cuesta la Excursión Privada con Capitán a Tossa?",
      answer: "Pacific Craft 625 con patrón profesional, 4 h máximo, hasta 7 personas. Desde {excursionBaja4h} € temporada baja (abril-junio, septiembre-cierre). Incluye IVA, patrón, amarre, limpieza y seguro. Combustible aparte."
    },
    {
      question: "¿Cuánto cuesta alquilar a Tossa con Licencia Básica (LBN)?",
      answer: "Packs cerrados 2 h / 4 h / 8 h, sin patrón. Desde {licBaja2h} € (2 h temporada baja) con los barcos con licencia. 3 tiers estacionales. Fianza 500 €. IVA, amarre, limpieza y seguro incluidos; combustible aparte."
    },
    {
      question: "¿Puedo desembarcar en Tossa pueblo desde el barco?",
      answer: "No hay amarre turístico público en Tossa. Se puede fondear en calas cercanas como Cala Llevadó, Mar d'en Roig o Cala Pola."
    },
    {
      question: "¿Merece la pena ir a Tossa en barco si no tengo licencia?",
      answer: "Sí, mediante la Excursión Privada con Capitán (Pacific Craft 625, 4 h, desde {excursionBaja4h} €). Única opción sin necesidad de licencia."
    }
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

      {/* Hero Section — full-bleed image showing the Vila Vella from the sea,
          which is the unique "only medieval castle on the Mediterranean"
          framing the new Tossa positioning depends on. LCP image preloaded
          via server/seoInjector.ts LcpPreload. */}
      <div className="relative pt-20 sm:pt-24">
        <div className="relative w-full h-[55vh] min-h-[420px] sm:min-h-[520px] overflow-hidden">
          <picture>
            <source media="(min-width: 768px)" type="image/avif" srcSet="/images/locations/hero-tossa-de-mar.avif" />
            <source type="image/avif" srcSet="/images/locations/hero-tossa-de-mar-mobile.avif" />
            <source media="(min-width: 768px)" type="image/webp" srcSet="/images/locations/hero-tossa-de-mar.webp" />
            <source type="image/webp" srcSet="/images/locations/hero-tossa-de-mar-mobile.webp" />
            <img
              src="/images/locations/hero-tossa-de-mar.jpg"
              alt="Vila Vella de Tossa de Mar desde el mar con barco, murallas medievales y aguas cristalinas Costa Brava"
              className="absolute inset-0 w-full h-full object-cover"
              width={1920}
              height={1080}
              loading="eager"
              fetchPriority="high"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/55" />
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center justify-center mb-4">
                  <Castle className="w-7 h-7 text-white mr-3 drop-shadow" />
                  <h1 className="text-2xl sm:text-3xl lg:text-5xl font-heading font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    {t.locationPages.tossa.hero.title}
                  </h1>
                </div>
                <p className="text-base sm:text-lg text-white/95 mb-5 max-w-3xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                  {t.locationPages.tossa.hero.subtitle}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                  <Badge variant="outline" className="bg-white/90 text-primary border-white">
                    <Anchor className="w-4 h-4 mr-2" />
                    {t.locationPages.tossa.hero.badgeFrom}
                  </Badge>
                  <Badge variant="outline" className="bg-white/90 text-primary border-white">
                    <Clock className="w-4 h-4 mr-2" />
                    {t.locationPages.tossa.hero.badgeTime}
                  </Badge>
                  <Badge variant="outline" className="bg-white/90 text-primary border-white">
                    <Users className="w-4 h-4 mr-2" />
                    {t.locationPages.tossa.hero.badgeCapacity}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Honest warning: Tossa is out of range for licence-free boats. Putting
          this immediately under the hero anchors the commercial positioning
          before any other content so users and crawlers see it first. */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border-y border-amber-300 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex gap-3 sm:gap-4 items-start">
            <span className="text-2xl" role="img" aria-label="warning">⚠️</span>
            <div className="text-sm sm:text-base text-foreground">
              <p className="font-semibold mb-1">Tossa no es alcanzable con barco sin licencia.</p>
              <p className="text-muted-foreground leading-relaxed">
                Los barcos sin licencia (2 millas, 5 nudos, 15 CV) llegan hasta Playa de Fenals (sur de Lloret) — 4 millas antes de Tossa. Para llegar a Tossa desde Blanes necesitas (1) auto-alquiler con Licencia Básica de Navegación / LBN (packs cerrados 2 h / 4 h / 8 h desde {faqVars.licBaja2h} € con Mingolla Brava 19 o Trimarchi 57S, IVA, amarre, limpieza y seguro incluidos; combustible y fianza 500 € aparte), o (2) la{" "}
                <a href="/es/barco/excursion-privada" className="underline font-medium text-foreground hover:text-primary">
                  Excursión Privada con Capitán
                </a>{" "}
                (Pacific Craft 625 + patrón, 4 h máximo, hasta 7 pax, desde {faqVars.excursionBaja4h} € con IVA, patrón, amarre, limpieza y seguro incluidos — combustible aparte). La tercera alternativa es ir en coche a Tossa (20 min desde Lloret) y alquilar barco sin licencia localmente allí.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Why Visit Tossa de Mar by Boat */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Crown className="w-6 h-6 text-cta" />
                {s.whyTossaTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.jewelCostaBrava}</h3>
                  <p className="text-muted-foreground mb-4">{s.jewelCostaBravaDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.historicHeritage}</h3>
                  <p className="text-muted-foreground">{s.historicHeritageDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.paradisiacalCoves}</h3>
                  <p className="text-muted-foreground mb-4">{s.paradisiacalCovesDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.panoramicNavigation}</h3>
                  <p className="text-muted-foreground">{s.panoramicNavigationDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Beaches and Historic Sites */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Shield className="w-6 h-6 text-primary" />
                {s.attractionsTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Castle className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.vilaVella}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{s.vilaVellaSub}</p>
                  <p className="text-muted-foreground">{s.vilaVellaDesc}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Waves className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.playaGrande}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{s.playaGrandeSub}</p>
                  <p className="text-muted-foreground">{s.playaGrandeDesc}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.virginCoves}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{s.virginCovesSub}</p>
                  <p className="text-muted-foreground">{s.virginCovesDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to Do in Tossa */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Heart className="w-6 h-6 text-primary" />
                {s.whatToDoTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.cultureHistory}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Castle className="w-4 h-4 text-primary mr-2" />
                      <span>{s.exploreVilaVella}</span>
                    </li>
                    <li className="flex items-center">
                      <Shield className="w-4 h-4 text-primary mr-2" />
                      <span>{s.climbWalls}</span>
                    </li>
                    <li className="flex items-center">
                      <Camera className="w-4 h-4 text-primary mr-2" />
                      <span>{s.municipalMuseum}</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-primary mr-2" />
                      <span>{s.tossaLighthouse}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.natureRelax}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-primary mr-2" />
                      <span>{s.diveCrystalWaters}</span>
                    </li>
                    <li className="flex items-center">
                      <Sun className="w-4 h-4 text-primary mr-2" />
                      <span>{s.anchorSecretCoves}</span>
                    </li>
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-primary mr-2" />
                      <span>{s.coastalPaths}</span>
                    </li>
                    <li className="flex items-center">
                      <Camera className="w-4 h-4 text-primary mr-2" />
                      <span>{s.sunsetFromSea}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tips */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <NavigationIcon className="w-6 h-6 text-primary" />
                {s.navigationTipsTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.recommendedRoute}</h3>
                  <p className="text-muted-foreground mb-4">{s.recommendedRouteDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.bestSeason}</h3>
                  <p className="text-muted-foreground">{s.bestSeasonDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.anchoringZones}</h3>
                  <p className="text-muted-foreground mb-4">{s.anchoringZonesDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.safeNavigation}</h3>
                  <p className="text-muted-foreground">{s.safeNavigationDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cross-linking to southern towns */}
          <Card className="mb-8">
            <CardContent className="py-6">
              <p className="text-muted-foreground">
                También ofrecemos servicio para turistas alojados en{" "}
                <a href={localizedPath("locationMalgrat")} className="text-primary hover:underline font-medium">Malgrat de Mar</a>,{" "}
                <a href={localizedPath("locationSantaSusanna")} className="text-primary hover:underline font-medium">Santa Susanna</a> y{" "}
                <a href={localizedPath("locationCalella")} className="text-primary hover:underline font-medium">Calella</a>.
                Desde estos pueblos de la costa del Maresme se llega al Puerto de Blanes en 10-20 minutos en coche.
              </p>
            </CardContent>
          </Card>

          {/* Related Services - Internal Linking */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Servicios y destinos relacionados</h3>
              <div className="flex flex-wrap gap-3">
                <a href={localizedPath("locationCostaBrava")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Mas destinos en la Costa Brava
                </a>
                <a href={localizedPath("categoryLicensed")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Barcos con licencia para llegar a Tossa
                </a>
                <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Consulta precios y temporadas
                </a>
                <a href={localizedPath("locationLloret")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Ruta intermedia: Lloret de Mar en barco
                </a>
                <a href={localizedPath("locationBlanes")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Puerto de salida: Blanes
                </a>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {s.ctaTitle}
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                {s.ctaDescription}
              </p>
              <Button
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-tossa"
              >
                {s.ctaButton}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-heading font-bold text-center mb-8">
            Preguntas frecuentes sobre Tossa de Mar en barco
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

      {/* Blog section */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">
              Artículos del blog
            </h2>
            <p className="text-muted-foreground mb-4">
              Descubre más sobre navegar por la Costa Brava en nuestro{" "}
              <a href={localizedPath("blog")} className="text-primary hover:underline font-medium">blog de navegación</a>.
            </p>
          </div>
        </div>
      </div>

      <RelatedLocationsSection currentLocation="tossa" />

      <RelatedContent currentPage="locationTossa" />

      <Footer />
    </div>
  );
}