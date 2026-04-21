import { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Clock, 
  Anchor, 
  Users, 
  Star,
  Navigation as NavigationIcon,
  Sun,
  Waves,
  Camera,
  Car,
  Ship,
  Music,
  Utensils,
  ChevronRight
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import RelatedContent from "@/components/RelatedContent";
import RangeFromBlanesSection from "@/components/RangeFromBlanesSection";
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

export default function LocationLloretPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => { trackLocationPageView("lloret"); }, []);
  const t = useTranslations();
  const seoConfig = getSEOConfig('locationLloret', language);
  const hreflangLinks = generateHreflangLinks('locationLloret');
  const canonical = generateCanonicalUrl('locationLloret', language);

  const s = t.locationPages.lloret.sections!;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // Location-specific schema for Lloret de Mar
  const locationSchema = {
    "@type": "TouristDestination",
    "name": "Excursiones en Barco a Lloret de Mar desde Blanes",
    "description": "Alquiler de barcos para visitar Lloret de Mar desde Puerto de Blanes. Embarcaciones sin licencia y con licencia para descubrir las playas de Lloret.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.7000,
      "longitude": 2.8500
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Playa de Lloret de Mar",
      "addressLocality": "Lloret de Mar",
      "addressRegion": "Girona",
      "postalCode": "17310",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Adventure", "Beach", "Party"],
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
    { name: t.breadcrumbs.locationLloret, url: "/alquiler-barcos-lloret-de-mar" }
  ]);

  // FAQ data for both schema and visible section. Reads from i18n first; if a
  // locale hasn't been pro-translated yet, the Spanish source-of-truth array
  // below is used so we never leak one language's copy into another (Round 2
  // H1 bug lesson). Five questions, each tuned to a specific commercial
  // intent around the real Blanes→Fenals sin-licencia range.
  const lloretFaqFromI18n = (t.locationPages.lloret as { faqItems?: Array<{ question: string; answer: string }> } | undefined)?.faqItems;
  const faqItems = lloretFaqFromI18n && lloretFaqFromI18n.length > 0 ? lloretFaqFromI18n : [
    {
      question: "¿Necesito licencia o experiencia para llegar a Lloret en barco?",
      answer: "No. Nuestros barcos sin licencia cumplen las condiciones legales para navegar hasta Playa de Fenals (sur de Lloret) sin titulación ni experiencia previa. Te damos un briefing de 15 minutos antes de salir. La única restricción es ser mayor de 18 años."
    },
    {
      question: "¿Hasta dónde exactamente puedo llegar con barco sin licencia?",
      answer: "Legalmente, hasta 2 millas náuticas de la costa, a máximo 5 nudos, con 15 CV. Desde Blanes, eso son 25 minutos de navegación hasta la Playa de Fenals, pasando por 7 calas. La Playa de Lloret centro y Cala Canyelles quedan al norte de Fenals — no son accesibles con barco sin licencia."
    },
    {
      question: "¿Cuánto cuesta alquilar un barco sin licencia para ir a Lloret?",
      answer: "Desde 70 €/hora (temporada baja) y 90 €/hora (temporada alta, julio–agosto). Packs de medio día (4 h) desde 240 € con gasolina incluida. Día completo (8 h) desde 480 €."
    },
    {
      question: "¿Puedo llegar a Tossa de Mar desde Lloret con barco sin licencia?",
      answer: "No. Tossa está 4–5 millas al norte de Fenals, fuera del rango legal sin licencia. Para ir a Tossa en barco desde Blanes necesitas (a) barco con Licencia Básica de Navegación (LBN), o (b) Excursión Privada con Capitán."
    },
    {
      question: "¿Qué pasa si el mar está malo?",
      answer: "Si la previsión marca >20 nudos sostenidos o alerta por olas >1.5 m, cancelamos sin coste. El tramo Blanes–Fenals está protegido de la Tramuntana por la propia costa, así que es de los más seguros para principiantes incluso con viento del norte."
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

      {/* Hero Section — full-bleed image + overlay with H1/subtitle/badges.
          Image is the LCP element; server/seoInjector.ts emits the matching
          <link rel="preload"> so the mobile variant starts downloading during
          HTML parse, before React hydrates. */}
      <div className="relative pt-20 sm:pt-24">
        <div className="relative w-full h-[55vh] min-h-[420px] sm:min-h-[520px] overflow-hidden">
          <picture>
            <source media="(min-width: 768px)" type="image/avif" srcSet="/images/locations/hero-lloret-de-mar.avif" />
            <source type="image/avif" srcSet="/images/locations/hero-lloret-de-mar-mobile.avif" />
            <source media="(min-width: 768px)" type="image/webp" srcSet="/images/locations/hero-lloret-de-mar.webp" />
            <source type="image/webp" srcSet="/images/locations/hero-lloret-de-mar-mobile.webp" />
            <img
              src="/images/locations/hero-lloret-de-mar.jpg"
              alt="Cala cerca de Lloret de Mar desde un barco sin licencia, aguas turquesa Costa Brava"
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
                  <MapPin className="w-7 h-7 text-white mr-3 drop-shadow" />
                  <h1 className="text-2xl sm:text-3xl lg:text-5xl font-heading font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    {t.locationPages.lloret.hero.title}
                  </h1>
                </div>
                <p className="text-base sm:text-lg text-white/95 mb-5 max-w-3xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                  {t.locationPages.lloret.hero.subtitle}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                  <Badge variant="outline" className="bg-white/90 text-primary border-white">
                    <Anchor className="w-4 h-4 mr-2" />
                    {t.locationPages.lloret.hero.badgeFrom}
                  </Badge>
                  <Badge variant="outline" className="bg-white/90 text-primary border-white">
                    <Clock className="w-4 h-4 mr-2" />
                    {t.locationPages.lloret.hero.badgeTime}
                  </Badge>
                  <Badge variant="outline" className="bg-white/90 text-primary border-white">
                    <Users className="w-4 h-4 mr-2" />
                    {t.locationPages.lloret.hero.badgeCapacity}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-calas timeline (the page's SEO spine) — handled by the reusable
          component so the Home and the Lloret page surface the exact same
          data without duplication. */}
      <RangeFromBlanesSection variant="lloret" />

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Why Visit Lloret de Mar by Boat */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-cta" />
                {s.whyLloretTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.uniquePerspective}</h3>
                  <p className="text-muted-foreground mb-4">{s.uniquePerspectiveDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.spectacularBeaches}</h3>
                  <p className="text-muted-foreground">{s.spectacularBeachesDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.vibrantAtmosphere}</h3>
                  <p className="text-muted-foreground mb-4">{s.vibrantAtmosphereDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.easyAccess}</h3>
                  <p className="text-muted-foreground">{s.easyAccessDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* (Removed in Round 3 PR C — the old "3 playas" card conflated
              Playa de Lloret centre (out of sin-licencia range) with Cala
              Boadella / Santa Cristina (in range). The real route is now
              surfaced by RangeFromBlanesSection above with honest boundaries.) */}

          {/* What to Do in Lloret */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Music className="w-6 h-6 text-primary" />
                {s.whatToDoTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.entertainment}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Music className="w-4 h-4 text-primary mr-2" />
                      <span>{s.nightlife}</span>
                    </li>
                    <li className="flex items-center">
                      <Utensils className="w-4 h-4 text-primary mr-2" />
                      <span>{s.restaurantsSea}</span>
                    </li>
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-primary mr-2" />
                      <span>{s.waterSports}</span>
                    </li>
                    <li className="flex items-center">
                      <Camera className="w-4 h-4 text-primary mr-2" />
                      <span>{s.santaClotildeMirador}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.pointsOfInterest}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-primary mr-2" />
                      <span>{s.mujerMarinera}</span>
                    </li>
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-primary mr-2" />
                      <span>{s.castilloSantJoan}</span>
                    </li>
                    <li className="flex items-center">
                      <Car className="w-4 h-4 text-primary mr-2" />
                      <span>{s.jardinesSantaClotilde}</span>
                    </li>
                    <li className="flex items-center">
                      <Ship className="w-4 h-4 text-primary mr-2" />
                      <span>{s.sportsMarina}</span>
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

                  <h3 className="font-semibold text-lg mb-3">{s.bestTimes}</h3>
                  <p className="text-muted-foreground">{s.bestTimesDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.whereToAnchor}</h3>
                  <p className="text-muted-foreground mb-4">{s.whereToAnchorDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.safety}</h3>
                  <p className="text-muted-foreground">{s.safetyDesc}</p>
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
                <a href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Barcos sin licencia disponibles en Blanes
                </a>
                <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Ver precios por temporada
                </a>
                <a href={localizedPath("locationTossa")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Continua la ruta hasta Tossa de Mar
                </a>
                <a href={localizedPath("locationCostaBrava")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Alquiler de barcos en la Costa Brava
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
                data-testid="button-whatsapp-lloret"
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
            Preguntas frecuentes sobre Lloret de Mar en barco
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
              <a href={localizedPath("blog")} className="text-primary hover:underline font-medium">blog de navegación</a>.
            </p>
          </div>
        </div>
      </div>

      <RelatedLocationsSection currentLocation="lloret" />

      <RelatedContent currentPage="locationLloret" />

      <Footer />
    </div>
  );
}