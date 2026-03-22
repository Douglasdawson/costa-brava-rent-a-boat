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

export default function LocationLloretPage() {
  const { language, localizedPath } = useLanguage();
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

  // FAQ data for both schema and visible section - Lloret specific
  const faqItems = [
    {
      question: "¿Cuánto se tarda en llegar a Lloret de Mar en barco desde Blanes?",
      answer: "El trayecto desde el Puerto de Blanes hasta Lloret de Mar dura aproximadamente 20-30 minutos dependiendo del barco y las condiciones del mar. Es una ruta costera preciosa que pasa por calas como Cala Sant Francesc."
    },
    {
      question: "¿Se puede fondear en las playas de Lloret de Mar?",
      answer: "Sí, puedes fondear en varias playas y calas de Lloret. Las mejores zonas de fondeo son Cala Boadella, Sa Caleta y la zona de Santa Cristina. Recuerda mantener distancia de la zona de bañistas."
    },
    {
      question: "¿Necesito licencia para ir en barco a Lloret de Mar?",
      answer: "No necesariamente. Con nuestros barcos sin licencia puedes llegar a Lloret de Mar cómodamente. Solo necesitas ser mayor de 18 años. También tenemos barcos con licencia para una experiencia más potente."
    },
    {
      question: "¿Cuál es la mejor época para ir en barco a Lloret de Mar?",
      answer: "Los mejores meses son junio y septiembre: temperaturas agradables, mar tranquilo y menos afluencia turística. Julio y agosto son más concurridos pero el agua está más cálida."
    },
    {
      question: "¿Se puede ir a Lloret de Mar en barco sin licencia?",
      answer: "Sí, Lloret de Mar está dentro de la zona de 2 millas náuticas, por lo que es accesible con nuestros barcos sin licencia. Solo necesitas ser mayor de 18 años y te damos 15 minutos de formación antes de zarpar."
    },
    {
      question: "¿Cuánto cuesta alquilar un barco para ir a Lloret de Mar?",
      answer: "El alquiler empieza desde 70 EUR por hora con gasolina incluida. Para una excursión completa a Lloret recomendamos mínimo 3 horas (ida, exploración y vuelta). Disponemos de 7 barcos para 4-7 personas."
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
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {t.locationPages.lloret.hero.title}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {t.locationPages.lloret.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Anchor className="w-4 h-4 mr-2" />
                {t.locationPages.lloret.hero.badgeFrom}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                {t.locationPages.lloret.hero.badgeTime}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {t.locationPages.lloret.hero.badgeCapacity}
              </Badge>
            </div>
          </div>
        </div>
      </div>

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

          {/* Main Beaches and Spots in Lloret */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Waves className="w-6 h-6 text-primary" />
                {s.beachesTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.playaLloret}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{s.playaLloretSub}</p>
                  <p className="text-muted-foreground">{s.playaLloretDesc}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.calaBoadella}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{s.calaBoadellaSub}</p>
                  <p className="text-muted-foreground">{s.calaBoadellaDesc}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.santaCristina}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{s.santaCristinaSub}</p>
                  <p className="text-muted-foreground">{s.santaCristinaDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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