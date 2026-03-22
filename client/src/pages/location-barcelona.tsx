import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Anchor,
  Users,
  Car,
  Train,
  Bus,
  Waves,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";

export default function LocationBarcelonaPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const seoConfig = getSEOConfig("locationBarcelona", language);
  const hreflangLinks = generateHreflangLinks("locationBarcelona");
  const canonical = generateCanonicalUrl("locationBarcelona", language);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs?.home || "Inicio", url: "/" },
    { name: "Alquiler barcos cerca de Barcelona", url: "/alquiler-barcos-cerca-barcelona" },
  ]);

  const faqItems = [
    {
      question: "¿Puedo alquilar un barco sin licencia cerca de Barcelona?",
      answer: "Sí, en Blanes (Costa Brava), a solo 70 minutos de Barcelona por la autopista AP-7, puedes alquilar barcos sin licencia desde 70 €/hora. No necesitas experiencia previa ni titulación náutica, solo ser mayor de 18 años.",
    },
    {
      question: "¿Cuánto se tarda de Barcelona a Blanes?",
      answer: "En coche por la AP-7 se tarda aproximadamente 70 minutos. En tren RENFE (línea R1 Rodalies) unos 90 minutos desde Barcelona Sants o Passeig de Gràcia. También hay autobuses directos desde la Estación del Nord.",
    },
    {
      question: "¿Es más barato alquilar un barco en Blanes que en Barcelona?",
      answer: "Sí, significativamente. En Blanes los barcos sin licencia cuestan desde 70 €/hora con gasolina incluida, mientras que en puertos de Barcelona los precios suelen empezar desde 120-150 €/hora. Además, las aguas en la Costa Brava son mucho más cristalinas y hay menos tráfico marítimo.",
    },
  ];

  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: faqItems.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: "Alquiler de Barcos cerca de Barcelona - Blanes, Costa Brava",
    description:
      "Alquiler de barcos sin licencia a 70 minutos de Barcelona. Puerto de Blanes, Costa Brava. Desde 70 € con gasolina incluida.",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.6667,
      longitude: 2.7833,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Puerto de Blanes",
      addressLocality: "Blanes",
      addressRegion: "Girona",
      postalCode: "17300",
      addressCountry: "ES",
    },
    touristType: ["Family", "Adventure", "Beach"],
    provider: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat Blanes",
      telephone: "+34611500372",
      url: "https://www.costabravarentaboat.com/",
    },
  };

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [locationSchema, breadcrumbSchema, faqSchema],
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

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <MapPin className="w-8 h-8 text-primary mr-4" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
              Alquiler de Barcos cerca de Barcelona
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto mb-6">
            A solo 70 minutos de Barcelona, el Puerto de Blanes te ofrece la mejor experiencia
            nautica de la Costa Brava. Barcos sin licencia desde 70 € con gasolina incluida.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Badge variant="outline" className="text-primary border-primary">
              <Car className="w-4 h-4 mr-2" />
              70 min desde Barcelona
            </Badge>
            <Badge variant="outline" className="text-primary border-primary">
              <Anchor className="w-4 h-4 mr-2" />
              Sin licencia desde 70 €
            </Badge>
            <Badge variant="outline" className="text-primary border-primary">
              <Waves className="w-4 h-4 mr-2" />
              Aguas cristalinas
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Why Blanes instead of Barcelona */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Waves className="w-6 h-6 text-cta" />
                Por que alquilar en Blanes y no en Barcelona
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Mejores precios</h3>
                  <p className="text-muted-foreground mb-4">
                    En Blanes los barcos sin licencia cuestan desde 70 €/hora con gasolina
                    incluida. En Barcelona los precios empiezan desde 120-150 €/hora sin
                    gasolina. Te ahorras hasta un 50% en el alquiler.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Aguas cristalinas</h3>
                  <p className="text-muted-foreground">
                    La Costa Brava ofrece aguas transparentes y turquesas que no encontrarás
                    en el litoral de Barcelona. Calas escondidas, fondos rocosos para
                    hacer snorkel y paisajes naturales espectaculares.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Menos tráfico marítimo</h3>
                  <p className="text-muted-foreground mb-4">
                    El puerto de Barcelona tiene un intenso tráfico de ferries, cruceros y
                    embarcaciones comerciales. En Blanes navegas tranquilamente por aguas
                    limpias y sin aglomeraciones.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">
                    La auténtica Costa Brava
                  </h3>
                  <p className="text-muted-foreground">
                    Desde Blanes puedes explorar calas secretas como Cala Sant Francesc,
                    llegar a Lloret de Mar o incluso a Tossa de Mar. Es la puerta de
                    entrada a la Costa Brava real, con acantilados, pinos y aguas
                    color esmeralda.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to get from Barcelona */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <MapPin className="w-6 h-6 text-primary" />
                Cómo llegar de Barcelona a Blanes
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">En coche</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    <strong>70 minutos</strong> por la AP-7
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Toma la autopista AP-7 dirección Girona/Francia. Salida 9 (Blanes).
                    Aparcamiento gratuito junto al puerto.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Train className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">En tren</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    <strong>90 minutos</strong> RENFE Rodalies
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Línea R1 desde Barcelona Sants o Passeig de Gràcia hasta
                    Blanes. Trenes cada 30 minutos. Estación a 10 min del puerto.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bus className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">En autobús</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    <strong>80 minutos</strong> desde Estación del Nord
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Autobuses directos desde la Estación del Nord de Barcelona.
                    Varias frecuencias diarias en temporada de verano.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our boats */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Anchor className="w-6 h-6 text-primary" />
                Nuestros barcos
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Barcos sin licencia
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    5 embarcaciones para 4-5 personas. No necesitas experiencia previa ni
                    titulación. Te damos una formación de 15 minutos y listo para navegar.
                    Gasolina incluida en el precio.
                  </p>
                  <ul className="space-y-1 text-muted-foreground text-sm">
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Hasta 5 personas por barco
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Desde 1 hora de alquiler
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Barcos con licencia
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    2 embarcaciones potentes para hasta 7 personas. Requieren PER o
                    título náutico equivalente. Mayor autonomía y velocidad para
                    explorar toda la Costa Brava.
                  </p>
                  <ul className="space-y-1 text-muted-foreground text-sm">
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Hasta 7 personas por barco
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Jornada completa disponible
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  asChild
                >
                  <a href={localizedPath("home") + "#fleet"}>
                    Ver todos los barcos
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQ section */}
          <div className="mt-12">
            <h2 className="text-2xl font-heading font-bold text-center mb-8">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3 max-w-3xl mx-auto">
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

          {/* CTA */}
          <Card className="mt-12 bg-primary text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Escapa de Barcelona y navega por la Costa Brava
              </h2>
              <p className="text-lg mb-6 opacity-90">
                A solo 70 minutos de Barcelona. Barcos sin licencia desde 70 € con
                gasolina incluida. Aguas cristalinas y calas secretas te esperan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => openBookingModal()}
                >
                  <Anchor className="w-5 h-5 mr-2" />
                  Reservar barco
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  asChild
                >
                  <a href={localizedPath("pricing")}>
                    Ver precios
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
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

      <Footer />
    </div>
  );
}
