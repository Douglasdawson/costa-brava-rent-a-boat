import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Anchor, Users, Star, Navigation as NavigationIcon,
  Sun, Waves, Ship, ChevronRight
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FleetSection from "@/components/FleetSection";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { Link } from "wouter";

export default function LocationCostaBravaPage() {
  const { language } = useLanguage();
  const seoConfig = getSEOConfig('locationCostaBrava', language);
  const hreflangLinks = generateHreflangLinks('locationCostaBrava');
  const canonical = generateCanonicalUrl('locationCostaBrava', language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // Location-specific schema
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": "Alquiler de Barcos en la Costa Brava",
    "description": "Alquiler de barcos sin licencia y con licencia en la Costa Brava. Salidas desde el Puerto de Blanes. Embarcaciones para 4-7 personas. Desde 70 EUR/hora.",
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
      "url": "https://costabravarentaboat.com/"
    }
  };

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Alquiler Barcos Costa Brava", url: "/alquiler-barcos-costa-brava" }
  ]);

  // FAQ schema for AI search extraction
  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Necesito licencia para alquilar un barco en la Costa Brava?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Ofrecemos 5 barcos sin licencia para hasta 5 personas. Solo necesitas ser mayor de 18 anos. Proporcionamos 15 minutos de formacion antes de salir."
        }
      },
      {
        "@type": "Question",
        "name": "Cuanto cuesta alquilar un barco en la Costa Brava?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Los barcos sin licencia cuestan desde 70 EUR/hora en temporada baja (abril-junio, septiembre-octubre). En temporada alta (agosto) desde 90 EUR/hora. El precio incluye gasolina, seguro y equipo de seguridad."
        }
      },
      {
        "@type": "Question",
        "name": "Desde donde salen los barcos en la Costa Brava?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Todos nuestros barcos salen del Puerto de Blanes, situado en el corazon de la Costa Brava. Blanes esta a 70 minutos de Barcelona y 35 minutos de Girona."
        }
      },
      {
        "@type": "Question",
        "name": "Que puedo visitar en barco en la Costa Brava?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Desde Blanes puedes navegar a Cala Brava (15 min), Cala Sant Francesc (20 min), Lloret de Mar (30 min) y Tossa de Mar (45 min). Con barcos con licencia puedes llegar aun mas lejos por la costa."
        }
      },
      {
        "@type": "Question",
        "name": "Esta incluida la gasolina en el precio?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Si, todos nuestros barcos incluyen gasolina, seguro a todo riesgo y equipo de seguridad en el precio. Sin costes ocultos ni sorpresas."
        }
      }
    ]
  };

  // Combine schemas
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [locationSchema, breadcrumbSchema, faqSchema]
  };

  // TODO: Move all hardcoded Spanish text below to translation files (t.locationPages.costaBrava.*)
  // Departure ports data
  const departurePorts = [
    {
      name: "Blanes",
      description: "Nuestro puerto base. Punto de partida de todos los barcos. Aparcamiento gratuito, restaurantes y servicios nauticos.",
      href: "/alquiler-barcos-blanes",
      icon: Anchor,
      highlight: true,
    },
    {
      name: "Lloret de Mar",
      description: "A solo 30 minutos en barco desde Blanes. Playas espectaculares y calas escondidas por el camino.",
      href: "/alquiler-barcos-lloret-de-mar",
      icon: Waves,
    },
    {
      name: "Tossa de Mar",
      description: "45 minutos de navegacion por la costa mas bonita del Mediterraneo. Vila Vella y calas cristalinas.",
      href: "/alquiler-barcos-tossa-de-mar",
      icon: Sun,
    },
    {
      name: "Barcelona",
      description: "A 70 minutos en coche desde Barcelona. La escapada perfecta para un dia de mar en la Costa Brava.",
      href: "/alquiler-barcos-cerca-barcelona",
      icon: Ship,
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
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
                Alquiler de Barcos en la Costa Brava
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              Descubre las mejores calas y playas de la Costa Brava a bordo de nuestros barcos.
              Salidas desde el Puerto de Blanes, en el corazon de la costa catalana.
              Barcos sin licencia desde 70 EUR/hora con gasolina y seguro incluidos.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Anchor className="w-4 h-4 mr-2" />
                Puerto de Blanes
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                4-7 personas
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Ship className="w-4 h-4 mr-2" />
                Con y sin licencia
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Introduction */}
          <Card className="mb-8">
            <CardContent className="p-6 md:p-8">
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                La <strong>Costa Brava</strong> es uno de los destinos nauticos mas espectaculares del Mediterraneo.
                Con mas de 200 kilometros de litoral entre Blanes y la frontera francesa, ofrece una
                combinacion unica de acantilados, calas de aguas cristalinas, pueblos medievales y
                una naturaleza que solo se puede apreciar desde el mar.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                En <strong>Costa Brava Rent a Boat</strong> te ofrecemos la forma mas facil de explorar
                esta costa: alquila uno de nuestros barcos en el Puerto de Blanes y navega a tu ritmo.
                No necesitas experiencia previa ni licencia nautica para la mayoria de nuestras embarcaciones.
                Te proporcionamos 15 minutos de formacion y todo lo necesario para un dia perfecto en el mar.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Todos nuestros precios incluyen <strong>gasolina, seguro a todo riesgo y equipo de seguridad</strong>.
                Sin costes ocultos. Reserva hoy y descubre por que miles de familias eligen la Costa Brava
                cada verano para sus aventuras nauticas.
              </p>
            </CardContent>
          </Card>

          {/* Why Choose Costa Brava */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-cta" />
                Por que elegir la Costa Brava para alquilar un barco
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Calas y playas inaccesibles por tierra</h3>
                  <p className="text-muted-foreground mb-4">
                    La Costa Brava esconde decenas de calas que solo se pueden visitar en barco.
                    Desde Blanes, en solo 15-45 minutos llegaras a playas virgenes de aguas turquesa
                    sin las aglomeraciones de las playas principales. Cala Brava, Cala Sant Francesc,
                    Sa Forcanera y muchas mas te esperan.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Aguas tranquilas y protegidas</h3>
                  <p className="text-muted-foreground">
                    La orientacion de la costa y sus numerosas bahias crean condiciones ideales
                    para la navegacion, incluso para principiantes. Las aguas son calmas y
                    cristalinas, perfectas para banarse, hacer snorkel o simplemente disfrutar
                    del sol a bordo.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Accesible desde Barcelona y Girona</h3>
                  <p className="text-muted-foreground mb-4">
                    Nuestro puerto base en Blanes esta a solo 70 minutos de Barcelona y 35 minutos
                    de Girona por autopista. Aparcamiento gratuito junto al puerto. La escapada
                    perfecta para un dia o medio dia de aventura nautica.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Para todos los niveles</h3>
                  <p className="text-muted-foreground">
                    Tanto si nunca has navegado como si eres un patron experimentado, tenemos
                    el barco perfecto para ti. 5 barcos sin licencia para principiantes y
                    embarcaciones con motor potente para quienes buscan explorar mas lejos.
                    Formacion incluida en todos los alquileres.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fleet Section */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Ship className="w-6 h-6 text-primary" />
                  Nuestros Barcos
                </h2>
                <p className="text-muted-foreground mt-2">
                  Elige entre nuestra flota de barcos sin licencia y con licencia. Todos salen desde el Puerto de Blanes.
                </p>
              </CardHeader>
            </Card>
          </div>
          <FleetSection />

          {/* Departure Ports */}
          <Card className="mb-8 mt-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <NavigationIcon className="w-6 h-6 text-primary" />
                Puertos de Salida y Destinos
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {departurePorts.map((port) => (
                  <Link key={port.name} href={port.href}>
                    <div className={`p-4 rounded-lg border transition-colors hover:border-primary cursor-pointer ${
                      port.highlight ? "border-primary bg-primary/5" : "border-border"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <port.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{port.name}</h3>
                            {port.highlight && (
                              <Badge variant="secondary" className="text-xs">Puerto base</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">{port.description}</p>
                          <span className="text-primary text-sm font-medium inline-flex items-center mt-2">
                            Ver mas <ChevronRight className="w-4 h-4 ml-1" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-cta" />
                Preguntas Frecuentes sobre Alquiler de Barcos en la Costa Brava
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {faqSchema.mainEntity.map((faq, index) => (
                  <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-lg mb-2">{faq.name}</h3>
                    <p className="text-muted-foreground">{faq.acceptedAnswer.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Reserva tu Barco en la Costa Brava</h2>
              <p className="text-lg mb-6 opacity-90">
                Elige tu barco, fecha y horario. Gasolina, seguro y formacion incluidos.
                Reserva por WhatsApp y recibe confirmacion inmediata.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleBookingWhatsApp}
                  data-testid="button-book-costa-brava"
                >
                  <Anchor className="w-5 h-5 mr-2" />
                  Reservar por WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <RelatedLocationsSection currentLocation="blanes" />

      <Footer />
    </div>
  );
}
