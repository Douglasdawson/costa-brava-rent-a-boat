import { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Anchor, Users, Star, Navigation as NavigationIcon,
  Sun, Waves, Ship, ChevronRight, Clock
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FleetSection from "@/components/FleetSection";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { Link } from "wouter";
import { trackLocationPageView } from "@/utils/analytics";

export default function LocationCostaBravaPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => { trackLocationPageView("costa-brava"); }, []);
  const t = useTranslations();
  const seoConfig = getSEOConfig('locationCostaBrava', language);
  const hreflangLinks = generateHreflangLinks('locationCostaBrava');
  const canonical = generateCanonicalUrl('locationCostaBrava', language);

  const cb = t.locationPages.costaBrava;
  const s = cb?.sections;
  const faqT = cb?.faq;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
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
      "url": "https://www.costabravarentaboat.com/"
    }
  };

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: "Alquiler Barcos Costa Brava", url: "/alquiler-barcos-costa-brava" }
  ]);

  // FAQ schema for AI search extraction — original 5 + 4 new
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
          "text": "En barcos sin licencia, si: gasolina, seguro a todo riesgo y equipo de seguridad estan incluidos. En barcos con licencia el combustible se paga aparte segun consumo real."
        }
      },
      {
        "@type": "Question",
        "name": faqT?.experienceQ || "Necesito experiencia previa para alquilar un barco en la Costa Brava?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faqT?.experienceA || "No, no necesitas ninguna experiencia previa. Para nuestros barcos sin licencia (hasta 15 CV) solo debes ser mayor de 18 anos. Te proporcionamos una formacion practica de 15 minutos."
        }
      },
      {
        "@type": "Question",
        "name": faqT?.distanceQ || "Hasta donde puedo navegar sin licencia desde Blanes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faqT?.distanceA || "Con un barco sin licencia puedes navegar hasta 2 millas nauticas de la costa (3,7 km). Esto te permite explorar Cala Brava, Cala Sant Francesc, Lloret de Mar y Cala Treumal."
        }
      },
      {
        "@type": "Question",
        "name": faqT?.weatherQ || "Que pasa si hace mal tiempo el dia de mi reserva?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faqT?.weatherA || "La seguridad es nuestra prioridad. Si las condiciones no permiten navegar, te ofrecemos cambio de fecha sin coste o devolucion completa."
        }
      },
      {
        "@type": "Question",
        "name": faqT?.petsQ || "Puedo llevar mascotas en el barco?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faqT?.petsA || "Si, las mascotas son bienvenidas en todos nuestros barcos. Recomendamos traer agua fresca y proteccion solar para tu mascota."
        }
      }
    ]
  };

  // Combine schemas
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [locationSchema, breadcrumbSchema, faqSchema]
  };

  // Departure ports data
  const departurePorts = [
    {
      name: "Blanes",
      description: "Nuestro puerto base. Punto de partida de todos los barcos. Aparcamiento gratuito, restaurantes y servicios nauticos.",
      href: localizedPath("locationBlanes"),
      icon: Anchor,
      highlight: true,
    },
    {
      name: "Lloret de Mar",
      description: "A solo 30 minutos en barco desde Blanes. Playas espectaculares y calas escondidas por el camino.",
      href: localizedPath("locationLloret"),
      icon: Waves,
    },
    {
      name: "Tossa de Mar",
      description: "45 minutos de navegacion por la costa mas bonita del Mediterraneo. Vila Vella y calas cristalinas.",
      href: localizedPath("locationTossa"),
      icon: Sun,
    },
    {
      name: "Barcelona",
      description: "A 70 minutos en coche desde Barcelona. La escapada perfecta para un dia de mar en la Costa Brava.",
      href: localizedPath("locationBarcelona"),
      icon: Ship,
    },
  ];

  // Navigation routes data
  const routes = [
    {
      title: s?.routeBlanesLloret || "Blanes - Lloret de Mar: 30 min, facil, sin licencia",
      description: s?.routeBlanesLloretDesc || "",
      difficulty: "easy" as const,
    },
    {
      title: s?.routeBlaneCalaBrava || "Blanes - Cala Brava: 15 min, facil, sin licencia",
      description: s?.routeBlaneCalaBravaDesc || "",
      difficulty: "easy" as const,
    },
    {
      title: s?.routeBlanesTossa || "Blanes - Tossa de Mar: 45 min, media, licencia recomendada",
      description: s?.routeBlanesTossaDesc || "",
      difficulty: "medium" as const,
    },
    {
      title: s?.routeBlaneSantFeliu || "Blanes - Sant Feliu de Guixols: 1,5h, avanzada, licencia requerida",
      description: s?.routeBlaneSantFeliuDesc || "",
      difficulty: "advanced" as const,
    },
  ];

  // Coves data
  const coves = [
    { name: s?.calaBravaName || "Cala Brava", description: s?.calaBravaDesc || "" },
    { name: s?.calaSantFrancescName || "Cala Sant Francesc", description: s?.calaSantFrancescDesc || "" },
    { name: s?.calaTreumalName || "Cala Treumal", description: s?.calaTreumalDesc || "" },
    { name: s?.calaBBoadellaName || "Cala Boadella", description: s?.calaBBoadellaDesc || "" },
    { name: s?.platjaPalomeraName || "Platja de Sa Palomera", description: s?.platjaPalomeraDesc || "" },
  ];

  const difficultyColors = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800",
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
                {cb?.hero.title || "Alquiler de Barcos en la Costa Brava"}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {cb?.hero.subtitle || "Descubre las mejores calas y playas de la Costa Brava a bordo de nuestros barcos. Salidas desde el Puerto de Blanes, en el corazon de la costa catalana. Barcos sin licencia desde 70 EUR/hora con gasolina y seguro incluidos."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Anchor className="w-4 h-4 mr-2" />
                {cb?.hero.badgePort || "Puerto de Blanes"}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {cb?.hero.badgeCapacity || "4-7 personas"}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Ship className="w-4 h-4 mr-2" />
                {cb?.hero.badgeLicense || "Con y sin licencia"}
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
                {s?.introP1 || "La Costa Brava es uno de los destinos nauticos mas espectaculares del Mediterraneo."}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                {s?.introP2 || "En Costa Brava Rent a Boat te ofrecemos la forma mas facil de explorar esta costa."}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {s?.introP3 || "En los barcos sin licencia el precio incluye gasolina, seguro a todo riesgo y equipo de seguridad."}
              </p>
            </CardContent>
          </Card>

          {/* Why Choose Costa Brava */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-cta" />
                {s?.whyChooseTitle || "Por que elegir la Costa Brava para alquilar un barco"}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s?.covesTitle || "Calas y playas inaccesibles por tierra"}</h3>
                  <p className="text-muted-foreground mb-4">
                    {s?.covesDesc || ""}
                  </p>

                  <h3 className="font-semibold text-lg mb-3">{s?.calmWatersTitle || "Aguas tranquilas y protegidas"}</h3>
                  <p className="text-muted-foreground">
                    {s?.calmWatersDesc || ""}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s?.accessibleTitle || "Accesible desde Barcelona y Girona"}</h3>
                  <p className="text-muted-foreground mb-4">
                    {s?.accessibleDesc || ""}
                  </p>

                  <h3 className="font-semibold text-lg mb-3">{s?.allLevelsTitle || "Para todos los niveles"}</h3>
                  <p className="text-muted-foreground">
                    {s?.allLevelsDesc || ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section A: Navigation Guide */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <NavigationIcon className="w-6 h-6 text-primary" />
                {s?.navigationGuideTitle || "Guia de Navegacion por la Costa Brava"}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {routes.map((route, index) => (
                  <div key={index} className="border-b border-border pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={difficultyColors[route.difficulty]}>
                        {route.difficulty === "easy" ? "Facil" : route.difficulty === "medium" ? "Media" : "Avanzada"}
                      </Badge>
                      <h3 className="font-semibold text-lg">{route.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{route.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section B: Boat Types Comparison */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Ship className="w-6 h-6 text-primary" />
                {s?.boatTypesTitle || "Tipos de Barcos para la Costa Brava"}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* No License Column */}
                <div className="border border-primary rounded-lg p-6 bg-primary/5">
                  <h3 className="font-bold text-xl mb-4 text-primary">{s?.noLicenseTitle || "Barcos Sin Licencia"}</h3>
                  <ul className="space-y-3 mb-4">
                    <li className="flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{s?.noLicensePower || "Hasta 15 CV de potencia"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{s?.noLicenseCapacity || "Maximo 5 personas a bordo"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <NavigationIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{s?.noLicenseNavigation || "Navegacion costera hasta 2 millas"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-green-700">{s?.noLicenseFuel || "Gasolina incluida en el precio"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-semibold">{s?.noLicensePrice || "Desde 70 EUR/hora"}</span>
                    </li>
                  </ul>
                  <p className="text-muted-foreground text-sm">{s?.noLicenseDesc || ""}</p>
                </div>

                {/* Licensed Column */}
                <div className="border border-border rounded-lg p-6">
                  <h3 className="font-bold text-xl mb-4">{s?.licensedTitle || "Barcos Con Licencia"}</h3>
                  <ul className="space-y-3 mb-4">
                    <li className="flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{s?.licensedPower || "De 40 CV a 150 CV"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{s?.licensedCapacity || "Hasta 12 personas a bordo"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <NavigationIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{s?.licensedNavigation || "Navegacion en mar abierto sin limites"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-orange-700">{s?.licensedFuel || "Combustible NO incluido (deposito aparte)"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-semibold">{s?.licensedPrice || "Desde 90 EUR/hora"}</span>
                    </li>
                  </ul>
                  <p className="text-muted-foreground text-sm">{s?.licensedDesc || ""}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section C: Best Coves */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Waves className="w-6 h-6 text-primary" />
                {s?.bestCovesTitle || "Las Mejores Calas de la Costa Brava en Barco"}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {coves.map((cove, index) => (
                  <div key={index} className="border-b border-border pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{index + 1}</span>
                      </div>
                      <h3 className="font-semibold text-lg">{cove.name}</h3>
                    </div>
                    <p className="text-muted-foreground ml-11">{cove.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section D: Fleet / Pricing */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Clock className="w-6 h-6 text-primary" />
                {s?.pricingTitle || "Precios Alquiler Barco Costa Brava 2026"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {s?.noLicenseFuel || "Gasolina incluida en el precio"} (sin licencia) | {s?.licensedFuel || "Combustible NO incluido"} (con licencia)
              </p>
            </CardHeader>
          </Card>
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

          {/* Cross-link to English version */}
          <Card className="mb-8">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-3">
                <Link href={localizedPath("locationCostaBrava")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  {s?.crossLinkEnglish || "This page in English: Boat Rental Costa Brava"}
                </Link>
                <Link href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Barcos sin licencia
                </Link>
                <Link href={localizedPath("categoryLicensed")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Barcos con licencia
                </Link>
                <Link href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Precios y tarifas
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {s?.ctaTitle || "Reserva tu Barco en la Costa Brava"}
              </h2>
              <p className="text-lg mb-6 opacity-90">
                {s?.ctaDescription || "Elige tu barco, fecha y horario. Gasolina, seguro y formacion incluidos en barcos sin licencia. Reserva por WhatsApp y recibe confirmacion inmediata."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleBookingWhatsApp}
                  data-testid="button-book-costa-brava"
                >
                  <Anchor className="w-5 h-5 mr-2" />
                  {s?.ctaButton || "Reservar por WhatsApp"}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <RelatedLocationsSection currentLocation="costa-brava" />

      <RelatedContent currentPage="locationCostaBrava" />

      <Footer />
    </div>
  );
}
