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
  Castle,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";
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

export default function LocationSantaSusannaPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('locationSantaSusanna', language);
  const hreflangLinks = generateHreflangLinks('locationSantaSusanna');
  const canonical = generateCanonicalUrl('locationSantaSusanna', language);

  const s = t.locationPages.santaSusanna.sections!;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  const locationSchema = {
    "@type": "TouristDestination",
    "name": "Alquiler de Barcos cerca de Santa Susanna",
    "description": "Alquila barcos desde el Puerto de Blanes, a solo 15 minutos en coche de Santa Susanna. Barcos sin licencia desde 70 EUR/hora.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.6332,
      "longitude": 2.7133
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Santa Susanna",
      "addressRegion": "Barcelona",
      "postalCode": "08398",
      "addressCountry": "ES"
    },
    "touristType": ["Resort", "Family", "Spa", "Beach"],
    "availableLanguage": ["Spanish", "Catalan", "English", "French"],
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://costabravarentaboat.com/"
    }
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.locationSantaSusanna, url: "/alquiler-barcos-santa-susanna" }
  ]);

  const faqItems = [
    {
      question: "¿A cuánta distancia está Santa Susanna del Puerto de Blanes?",
      answer: "Santa Susanna está a 12 km del Puerto de Blanes, unos 15 minutos en coche por la N-II. También puedes llegar en tren RENFE línea R1 en solo 10 minutos."
    },
    {
      question: "¿Cuánto cuesta alquilar un barco desde Blanes si estoy en Santa Susanna?",
      answer: "El alquiler de barco empieza desde 70 EUR por hora con gasolina incluida. No se necesita licencia para barcos de hasta 15 CV. Disponemos de 7 barcos para 4-7 personas."
    },
    {
      question: "¿Necesito licencia de navegación para alquilar un barco?",
      answer: "No necesariamente. Ofrecemos barcos sin licencia que cualquier mayor de 18 años puede manejar. Te damos 15 minutos de formación antes de zarpar. También tenemos barcos con licencia."
    },
    {
      question: "¿Es fácil llegar en transporte público desde Santa Susanna?",
      answer: "Sí, la línea R1 de RENFE conecta Santa Susanna con Blanes en solo 10 minutos. Los trenes salen cada 30 minutos en temporada alta. La estación de Blanes está a 10 minutos andando del puerto."
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
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {t.locationPages.santaSusanna.hero.title}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {t.locationPages.santaSusanna.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Car className="w-4 h-4 mr-2" />
                {t.locationPages.santaSusanna.hero.badgeDistance}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                {t.locationPages.santaSusanna.hero.badgeTime}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Waves className="w-4 h-4 mr-2" />
                {t.locationPages.santaSusanna.hero.badgeBeach}
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
                {s.whyRentTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.closestPort}</h3>
                  <p className="text-muted-foreground mb-4">{s.closestPortDesc}</p>
                  <h3 className="font-semibold text-lg mb-3">{s.varietyBoats}</h3>
                  <p className="text-muted-foreground">{s.varietyBoatsDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.fuelIncluded}</h3>
                  <p className="text-muted-foreground mb-4">{s.fuelIncludedDesc}</p>
                  <h3 className="font-semibold text-lg mb-3">{s.noExperience}</h3>
                  <p className="text-muted-foreground">{s.noExperienceDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Town Attractions */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-primary" />
                {s.townAttractionsTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Waves className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.attraction1}</h3>
                  <p className="text-muted-foreground">{s.attraction1Desc}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Castle className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.attraction2}</h3>
                  <p className="text-muted-foreground">{s.attraction2Desc}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.attraction3}</h3>
                  <p className="text-muted-foreground">{s.attraction3Desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Get to Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Car className="w-6 h-6 text-primary" />
                {s.howToGetTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    {s.byCar}
                  </h3>
                  <p className="text-muted-foreground mb-4">{s.byCarDesc}</p>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {s.byTaxi}
                  </h3>
                  <p className="text-muted-foreground">{s.byTaxiDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Train className="w-5 h-5 text-primary" />
                    {s.byPublicTransport}
                  </h3>
                  <p className="text-muted-foreground mb-4">{s.byPublicTransportDesc}</p>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ParkingCircle className="w-5 h-5 text-primary" />
                    {s.parkingAtBlanes}
                  </h3>
                  <p className="text-muted-foreground">{s.parkingAtBlanesDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boat Destinations from Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Anchor className="w-6 h-6 text-primary" />
                {s.boatDestinationsTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{s.boatDestinationsDesc}</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/alquiler-barcos-lloret-de-mar">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Lloret de Mar - 25 min</Badge>
                </Link>
                <Link href="/alquiler-barcos-tossa-de-mar">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Tossa de Mar - 1h</Badge>
                </Link>
                <Link href="/alquiler-barcos-blanes">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Calas de Blanes</Badge>
                </Link>
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
                data-testid="button-whatsapp-santa-susanna"
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
            Preguntas frecuentes sobre alquilar barco desde Santa Susanna
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

      <RelatedLocationsSection currentLocation="santaSusanna" />

      <Footer />
    </div>
  );
}
