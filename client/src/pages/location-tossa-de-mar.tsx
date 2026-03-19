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

export default function LocationTossaPage() {
  const { language } = useLanguage();
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
      "url": "https://costabravarentaboat.com/"
    }
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.locationTossa, url: "/alquiler-barcos-tossa-de-mar" }
  ]);

  // FAQ data for both schema and visible section - Tossa specific
  const faqItems = [
    {
      question: "¿Cuánto se tarda en llegar a Tossa de Mar en barco desde Blanes?",
      answer: "El trayecto dura entre 30-45 minutos dependiendo del barco. Es una ruta espectacular con vistas a acantilados y calas vírgenes. Recomendamos la ruta costera para disfrutar del paisaje."
    },
    {
      question: "¿Se puede ver la Vila Vella de Tossa desde el barco?",
      answer: "Sí, la Vila Vella (recinto amurallado medieval) es visible desde el mar y ofrece una perspectiva única. Es uno de los puntos más fotografiados de la Costa Brava desde el agua."
    },
    {
      question: "¿Qué calas puedo visitar entre Blanes y Tossa de Mar?",
      answer: "En la ruta encontrarás calas espectaculares como Cala Sant Francesc, Sa Palomera, Cala Boadella, Cala Santa Cristina y las calas de Lloret. Puedes parar a nadar en cualquiera de ellas."
    },
    {
      question: "¿Es seguro ir a Tossa de Mar en barco sin licencia?",
      answer: "Sí, la ruta es segura en condiciones normales de mar. Antes de zarpar te damos formación completa y recomendaciones sobre la ruta. El barco incluye todo el equipo de seguridad homologado."
    },
    {
      question: "¿Cuánto cuesta alquilar un barco para ir a Tossa de Mar?",
      answer: "El alquiler empieza desde 70 EUR por hora con gasolina incluida. Para una excursión a Tossa recomendamos mínimo 4-5 horas para disfrutar del trayecto y explorar. También ofrecemos excursiones privadas con patrón."
    },
    {
      question: "¿Cuánto se tarda en barco de Blanes a Tossa de Mar?",
      answer: "Aproximadamente 1 hora desde el Puerto de Blanes con un barco con licencia. La ruta costera pasa por Lloret de Mar, acantilados espectaculares y calas escondidas como Cala Pola."
    }
  ];

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
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
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Castle className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {t.locationPages.tossa.hero.title}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {t.locationPages.tossa.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Anchor className="w-4 h-4 mr-2" />
                {t.locationPages.tossa.hero.badgeFrom}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                {t.locationPages.tossa.hero.badgeTime}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {t.locationPages.tossa.hero.badgeCapacity}
              </Badge>
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
                <a href="/alquiler-barcos-malgrat-de-mar" className="text-primary hover:underline font-medium">Malgrat de Mar</a>,{" "}
                <a href="/alquiler-barcos-santa-susanna" className="text-primary hover:underline font-medium">Santa Susanna</a> y{" "}
                <a href="/alquiler-barcos-calella" className="text-primary hover:underline font-medium">Calella</a>.
                Desde estos pueblos de la costa del Maresme se llega al Puerto de Blanes en 10-20 minutos en coche.
              </p>
            </CardContent>
          </Card>

          {/* Related Services - Internal Linking */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Servicios y destinos relacionados</h3>
              <div className="flex flex-wrap gap-3">
                <a href="/barcos-con-licencia" className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Barcos con licencia para llegar a Tossa
                </a>
                <a href="/precios" className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Consulta precios y temporadas
                </a>
                <a href="/alquiler-barcos-lloret-de-mar" className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Ruta intermedia: Lloret de Mar en barco
                </a>
                <a href="/alquiler-barcos-blanes" className="text-primary hover:underline flex items-center gap-1">
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
            {faqItems.map((item, index) => (
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
              <a href="/blog" className="text-primary hover:underline font-medium">blog de navegación</a>.
            </p>
          </div>
        </div>
      </div>

      <RelatedLocationsSection currentLocation="tossa" />

      <Footer />
    </div>
  );
}