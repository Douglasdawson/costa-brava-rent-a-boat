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
  ChevronRight,
  Tag,
  Compass,
  Fish
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { BOAT_DATA } from "@shared/boatData";

export default function LocationBlanesPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('locationBlanes', language);
  const hreflangLinks = generateHreflangLinks('locationBlanes');
  const canonical = generateCanonicalUrl('locationBlanes', language);

  const s = t.locationPages.blanes.sections!;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // Location-specific schema
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": "Alquiler de Barcos en Blanes, Costa Brava",
    "description": "Alquiler de barcos sin licencia y con licencia en Blanes. Puerto de Blanes, Costa Brava. Embarcaciones para 4-7 personas.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.6667,
      "longitude": 2.7833
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Puerto de Blanes",
      "addressLocality": "Blanes",
      "addressRegion": "Girona",
      "postalCode": "17300",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Adventure", "Beach"],
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
    { name: t.breadcrumbs.locationBlanes, url: "/alquiler-barcos-blanes" }
  ]);

  // FAQ schema for AI search extraction - Blanes specific
  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Necesito licencia para alquilar un barco en Blanes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Tenemos 5 barcos sin licencia para hasta 5 personas. Solo necesitas ser mayor de 18 años. Te damos una formación de 15 minutos antes de salir."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuánto cuesta alquilar un barco en el Puerto de Blanes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Los barcos sin licencia cuestan desde 70 EUR/hora en temporada baja (abril-junio, septiembre-octubre). En temporada alta (agosto) desde 90 EUR/hora. El precio incluye combustible, seguro y equipo de seguridad."
        }
      },
      {
        "@type": "Question",
        "name": "¿A dónde puedo ir en barco desde Blanes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Desde el Puerto de Blanes puedes visitar Cala Brava (15 min), Cala Sant Francesc (20 min), Lloret de Mar (30 min) y Tossa de Mar (45 min). Los barcos con licencia tienen mayor autonomía para destinos más lejanos."
        }
      },
      {
        "@type": "Question",
        "name": "¿Hay aparcamiento cerca del Puerto de Blanes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí. Hay aparcamiento gratuito junto al Puerto de Blanes. También hay restaurantes, tiendas náuticas y gasolinera en la zona portuaria."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cual es la mejor epoca para alquilar un barco en Blanes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La temporada va de abril a octubre. Junio y septiembre ofrecen los mejores precios y menos afluencia. Agosto es temporada alta con las mejores condiciones de mar pero precios mas altos."
        }
      },
      {
        "@type": "Question",
        "name": "¿Se puede alquilar un barco en Blanes el mismo dia?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Si, aceptamos reservas de ultimo momento si hay disponibilidad. Contacta por WhatsApp al +34 611 500 372 para comprobar disponibilidad el mismo dia."
        }
      },
      {
        "@type": "Question",
        "name": "¿Es seguro navegar sin licencia desde Blanes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Si. Nuestros barcos sin licencia tienen un maximo de 15CV, no requieren titulacion y navegan cerca de la costa. Incluimos formacion de seguridad de 15 minutos, chalecos salvavidas y equipo de emergencia."
        }
      }
    ]
  };

  // Combine schemas
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [locationSchema, breadcrumbSchema, faqSchema]
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
                {t.locationPages.blanes.hero.title}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {t.locationPages.blanes.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Anchor className="w-4 h-4 mr-2" />
                {t.locationPages.blanes.hero.badgePort}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {t.locationPages.blanes.hero.badgeCapacity}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                {t.locationPages.blanes.hero.badgeDuration}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Why Choose Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-cta" />
                {s.whyBlanesTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.strategicLocation}</h3>
                  <p className="text-muted-foreground mb-4">{s.strategicLocationDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.safePorts}</h3>
                  <p className="text-muted-foreground">{s.safePortsDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.accessibleCoves}</h3>
                  <p className="text-muted-foreground mb-4">{s.accessibleCovesDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.allLevels}</h3>
                  <p className="text-muted-foreground">{s.allLevelsDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section A: Fleet */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Anchor className="w-6 h-6 text-primary" />
                {s.fleetTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{s.fleetIntro}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(BOAT_DATA).map((boat) => {
                  const isNoLicense = boat.features.some(
                    (f) => f.toLowerCase().includes("sin licencia")
                  );
                  const lowestPrice = Math.min(
                    ...Object.values(boat.pricing.BAJA.prices)
                  );
                  return (
                    <a
                      key={boat.id}
                      href={localizedPath("boatDetail", boat.id)}
                      className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{boat.name}</h3>
                        <Badge
                          variant={isNoLicense ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {isNoLicense ? s.fleetNoLicense : s.fleetLicense}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {boat.specifications.capacity}
                        </span>
                        <span>{boat.specifications.engine}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-semibold">
                          {s.fleetFrom} {lowestPrice} EUR
                        </span>
                        <span className="text-sm text-primary hover:underline">
                          {s.fleetViewDetails}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Section B: Complete Guide */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Ship className="w-6 h-6 text-primary" />
                {s.guideTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.guideRequirementsTitle}</h3>
                  <p className="text-muted-foreground mb-6">{s.guideRequirementsText}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.guideSeasonTitle}</h3>
                  <p className="text-muted-foreground">{s.guideSeasonText}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.guideIncludedTitle}</h3>
                  <p className="text-muted-foreground mb-6">{s.guideIncludedText}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.guideBookingTitle}</h3>
                  <p className="text-muted-foreground">{s.guideBookingText}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section C: Pricing Table */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Tag className="w-6 h-6 text-cta" />
                {s.pricingTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{s.pricingIntro}</p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">{s.pricingBoatCol}</th>
                      <th className="text-center p-3 font-semibold">{s.pricingCapacityCol}</th>
                      <th className="text-center p-3 font-semibold">{s.pricingLowCol}</th>
                      <th className="text-center p-3 font-semibold">{s.pricingHighCol}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(BOAT_DATA).map((boat) => (
                      <tr key={boat.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <a href={localizedPath("boatDetail", boat.id)} className="text-primary hover:underline font-medium">
                            {boat.name}
                          </a>
                        </td>
                        <td className="p-3 text-center">{boat.specifications.capacity}</td>
                        <td className="p-3 text-center">
                          {boat.pricing.BAJA.prices["2h"]
                            ? `${boat.pricing.BAJA.prices["2h"]} EUR`
                            : "-"}
                        </td>
                        <td className="p-3 text-center">
                          {boat.pricing.ALTA.prices["2h"]
                            ? `${boat.pricing.ALTA.prices["2h"]} EUR`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{s.pricingFuelNote}</p>
              <p className="text-sm text-muted-foreground mb-2">{s.pricingSeasons}</p>
              <a href={localizedPath("pricing")} className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                <ChevronRight className="w-4 h-4" />
                {s.pricingFullDetails}
              </a>
            </CardContent>
          </Card>

          {/* Section D: Popular Experiences */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Sun className="w-6 h-6 text-orange-500" />
                {s.experiencesTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <a href={localizedPath("activitySnorkel")} className="block border rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Waves className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{s.expSnorkelTitle}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{s.expSnorkelDesc}</p>
                </a>

                <a href={localizedPath("activitySunset")} className="block border rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Sun className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-lg">{s.expSunsetTitle}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{s.expSunsetDesc}</p>
                </a>

                <a href={localizedPath("locationTossa")} className="block border rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Compass className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{s.expTossaTitle}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{s.expTossaDesc}</p>
                </a>

                <a href={localizedPath("activityFishing")} className="block border rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Fish className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{s.expFishingTitle}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{s.expFishingDesc}</p>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Key Destinations from Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <NavigationIcon className="w-6 h-6 text-primary" />
                {s.destinationsTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Waves className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.calaBrava}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{s.calaBravaTime}</p>
                  <p className="text-muted-foreground">{s.calaBravaDesc}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.lloretDeMar}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{s.lloretTime}</p>
                  <p className="text-muted-foreground">{s.lloretDesc}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.calaSantFrancesc}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{s.calaSantFrancescTime}</p>
                  <p className="text-muted-foreground">{s.calaSantFrancescDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Local Services */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Car className="w-6 h-6 text-primary" />
                {s.servicesTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.portAmenities}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Car className="w-4 h-4 text-primary mr-2" />
                      <span>{s.freeParking}</span>
                    </li>
                    <li className="flex items-center">
                      <Ship className="w-4 h-4 text-primary mr-2" />
                      <span>{s.fuelStation}</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-primary mr-2" />
                      <span>{s.restaurants}</span>
                    </li>
                    <li className="flex items-center">
                      <Anchor className="w-4 h-4 text-primary mr-2" />
                      <span>{s.nauticalShops}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.howToGet}</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>{s.fromBarcelona}</li>
                    <li>{s.fromGirona}</li>
                    <li>{s.fromFrance}</li>
                    <li>{s.publicTransport}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nearby Towns */}
          <Card className="mb-8">
            <CardContent className="py-6">
              <h3 className="font-semibold text-lg mb-3">Pueblos cercanos al Puerto de Blanes</h3>
              <p className="text-muted-foreground">
                Turistas alojados en la costa del Maresme pueden llegar facilmente al Puerto de Blanes:{" "}
                <a href={localizedPath("locationMalgrat")} className="text-primary hover:underline font-medium">Malgrat de Mar</a> (10 min),{" "}
                <a href={localizedPath("locationSantaSusanna")} className="text-primary hover:underline font-medium">Santa Susanna</a> (15 min) y{" "}
                <a href={localizedPath("locationCalella")} className="text-primary hover:underline font-medium">Calella</a> (20 min en coche).
                Tambien accesible en tren RENFE linea R1.
              </p>
            </CardContent>
          </Card>

          {/* Related Services - Internal Linking */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Explora nuestros servicios desde Blanes</h3>
              <div className="flex flex-wrap gap-3">
                <a href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Alquiler de barcos sin licencia
                </a>
                <a href={localizedPath("categoryLicensed")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Barcos con licencia en Blanes
                </a>
                <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Precios y tarifas por temporada
                </a>
                <a href={localizedPath("locationLloret")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Excursion en barco a Lloret de Mar
                </a>
                <a href={localizedPath("locationTossa")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Navega hasta Tossa de Mar
                </a>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">{s.ctaTitle}</h2>
              <p className="text-lg mb-6 opacity-90">
                {s.ctaDescription}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  variant="secondary"
                  onClick={handleBookingWhatsApp}
                  data-testid="button-book-blanes"
                >
                  <Anchor className="w-5 h-5 mr-2" />
                  {s.ctaButton}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Location Map */}
          <Card className="mt-8">
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none tracking-tight">{s.mapTitle}</h2>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2980.1411982500704!2d2.7957177!3d41.6742939!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12bb172c94a8856f%3A0x9a2dfa936ef2e0a7!2sCosta%20Brava%20Rent%20a%20Boat%20-%20Blanes%20%7C%20Alquiler%20de%20Barcos%20Con%20y%20Sin%20Licencia!5e0!3m2!1ses!2ses!4v1758876869141!5m2!1ses!2ses"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de ubicación - Puerto de Blanes"
                  data-testid="map-blanes"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                📍 <a 
                  href="https://maps.app.goo.gl/ma3qtsJbuFNhcr4bA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors cursor-pointer underline"
                  data-testid="link-blanes-maps"
                >
                  Costa Brava Rent a Boat - Blanes, Puerto de Blanes, 17300 Blanes, Girona
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <RelatedLocationsSection currentLocation="blanes" />

      <RelatedContent currentPage="locationBlanes" />

      <Footer />
    </div>
  );
}