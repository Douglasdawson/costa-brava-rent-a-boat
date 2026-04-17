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
  Car,
  Train,
  ParkingCircle,
  Waves,
  TreePine,
  Mountain,
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
import { getCanonicalUrl } from "@/lib/domain";
import { trackLocationPageView } from "@/utils/analytics";

export default function LocationTorderaPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => { trackLocationPageView("tordera"); }, []);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  const locationSchema = {
    "@type": "TouristDestination",
    "name": "Alquiler de Barcos cerca de Tordera",
    "description": "Alquila barcos desde el Puerto de Blanes, a solo 15 minutos en coche de Tordera. Barcos sin licencia desde 70 EUR/hora con gasolina incluida.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.6992,
      "longitude": 2.7189
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Tordera",
      "addressRegion": "Barcelona",
      "postalCode": "08490",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Nature", "Residential"],
    "availableLanguage": ["Spanish", "Catalan", "English", "French"],
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://www.costabravarentaboat.com/"
    }
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Alquiler Barcos Tordera", url: "/alquiler-barcos-tordera" }
  ]);

  const faqItems = [
    {
      question: "¿A cuanta distancia esta Tordera del Puerto de Blanes?",
      answer: "Tordera esta a solo 10 km del Puerto de Blanes, unos 15 minutos en coche por la C-32 o la carretera local. Tambien puedes llegar en tren RENFE linea R1 en solo 8 minutos desde la estacion de Blanes."
    },
    {
      question: "¿Cuanto cuesta alquilar un barco desde Blanes si vivo en Tordera?",
      answer: "El alquiler de barco sin licencia empieza desde 70 EUR por hora con gasolina incluida. Barcos con licencia desde 150 EUR por 2 horas. Disponemos de 9 barcos para 4-11 personas."
    },
    {
      question: "¿Necesito licencia de navegacion?",
      answer: "No necesariamente. Ofrecemos barcos sin licencia que cualquier mayor de 18 anos puede manejar. Te damos 15 minutos de formacion antes de zarpar. Tambien tenemos barcos con licencia para navegantes experimentados."
    },
    {
      question: "¿Hay parking en el Puerto de Blanes?",
      answer: "Si, hay parking gratuito disponible cerca del Puerto de Blanes. Desde Tordera puedes aparcar comodamente ya que al ser una zona menos turistica que otros puntos de la costa, suele haber disponibilidad incluso en temporada alta."
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
        title="Alquiler Barco Tordera | Puerto Blanes 15 min | Sin Licencia 70€/h | Delta del Tordera"
        description="¿Vives en Tordera o cerca del Delta? Puerto Blanes a 15 min en coche o 8 min en tren R1. Alquila barco sin licencia desde 70€/h con gasolina incluida. Navega el Delta del Tordera."
        ogTitle="Alquiler Barco Tordera | Delta del Tordera en Barco"
        ogDescription="Desde Tordera al Puerto Blanes en 15 min. Barco sin licencia desde 70€/h. Delta del Tordera en barco. 4.8★."
        canonical={getCanonicalUrl("/alquiler-barcos-tordera")}
        jsonLd={combinedJsonLd}
      />
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                Alquiler de Barcos cerca de Tordera
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              Tordera es un municipio residencial del interior que sirve como puerta de entrada a la Costa Brava. A solo 15 minutos en coche del Puerto de Blanes, o 8 minutos en tren, es un punto de partida ideal para disfrutar del mar. Con aparcamiento facil en el puerto y sin las aglomeraciones de la costa, navegar desde Blanes es la mejor opcion para los residentes y visitantes de Tordera.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Car className="w-4 h-4 mr-2" />
                10 km / 15 min en coche
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Train className="w-4 h-4 mr-2" />
                RENFE R1: 8 min
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <ParkingCircle className="w-4 h-4 mr-2" />
                Parking facil
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
                ¿Por que alquilar un barco desde Blanes si estas en Tordera?
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Tu puerto mas cercano</h3>
                  <p className="text-muted-foreground mb-4">
                    El Puerto de Blanes esta a solo 10 km de Tordera, lo que lo convierte en el punto de alquiler de barcos mas cercano y accesible. Tanto si eres residente como si estas de paso, en 15 minutos puedes estar navegando por las aguas cristalinas de la Costa Brava. La conexion por carretera es directa y sin complicaciones.
                  </p>
                  <h3 className="font-semibold text-lg mb-3">9 barcos disponibles</h3>
                  <p className="text-muted-foreground">
                    Nuestra flota incluye 9 barcos: embarcaciones sin licencia ideales para familias y principiantes, y barcos con licencia para los mas experimentados. Desde barcas para 4 personas hasta embarcaciones para grupos de hasta 11 personas.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Gasolina incluida en barcos sin licencia</h3>
                  <p className="text-muted-foreground mb-4">
                    El precio de los barcos sin licencia incluye la gasolina. Desde 70 EUR por hora con el Astec 400, o desde 75 EUR por hora con otros modelos. Sin costes ocultos ni sorpresas en el precio final.
                  </p>
                  <h3 className="font-semibold text-lg mb-3">Sin experiencia previa necesaria</h3>
                  <p className="text-muted-foreground">
                    Antes de zarpar te ofrecemos 15 minutos de formacion practica donde aprenderas a manejar el motor, las normas basicas de navegacion y los mejores rincones para explorar. Cualquier persona mayor de 18 anos puede pilotar nuestros barcos sin licencia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Town Attractions */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-primary" />
                Tordera: puerta de entrada a la Costa Brava
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Tordera es un municipio tranquilo y bien comunicado, situado en el valle del rio Tordera. Su posicion estrategica entre el interior y la costa lo convierte en una base excelente para explorar la Costa Brava. Muchos residentes de Tordera aprovechan la cercania al Puerto de Blanes para disfrutar de la nautica sin las aglomeraciones de las grandes localidades costeras.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mountain className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Interior y naturaleza</h3>
                  <p className="text-muted-foreground">Municipio residencial rodeado de naturaleza, con el Montnegre y el Corredor como parques naturales cercanos. Combina senderismo de interior con una jornada de navegacion costera.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Waves className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">A minutos de la costa</h3>
                  <p className="text-muted-foreground">Aunque esta en el interior, Tordera tiene acceso rapido tanto al Maresme como a la Costa Brava. El Puerto de Blanes es tu enlace directo con el Mediterraneo.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TreePine className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Bien comunicado</h3>
                  <p className="text-muted-foreground">Con estacion de tren RENFE (linea R1), autopista C-32 y buenas carreteras locales, llegar al Puerto de Blanes desde Tordera es rapido y comodo en cualquier medio de transporte.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Get to Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Car className="w-6 h-6 text-primary" />
                Como llegar de Tordera al Puerto de Blanes
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    En coche (15 minutos)
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Desde Tordera, toma la carretera en direccion Blanes (GI-600 o C-32). Son 10 km de trayecto directo hasta el Puerto de Blanes. El aparcamiento en la zona del puerto es gratuito y generalmente tiene buena disponibilidad, especialmente si llegas por la manana.
                  </p>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    En taxi
                  </h3>
                  <p className="text-muted-foreground">
                    Un taxi desde Tordera al Puerto de Blanes cuesta aproximadamente 15-20 EUR. Es una opcion rapida y comoda para ir y volver.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Train className="w-5 h-5 text-primary" />
                    En tren RENFE (8 minutos)
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    La linea R1 de Rodalies de RENFE conecta Tordera con Blanes en solo 8 minutos. Es la opcion mas rapida y economica. Los trenes salen cada 30 minutos en temporada. Desde la estacion de Blanes, el puerto esta a 10-15 minutos caminando por el paseo maritimo.
                  </p>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ParkingCircle className="w-5 h-5 text-primary" />
                    Aparcamiento en Blanes
                  </h3>
                  <p className="text-muted-foreground">
                    Hay parking gratuito cerca del Puerto de Blanes. Los residentes de Tordera tienen la ventaja de llegar temprano desde el interior, por lo que encontrar plaza de aparcamiento suele ser mas facil que para quienes vienen de localidades costeras mas lejanas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boat Destinations from Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Anchor className="w-6 h-6 text-primary" />
                ¿Que puedes ver en barco desde Blanes?
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Desde el Puerto de Blanes puedes navegar hacia el norte por la espectacular costa de la Costa Brava. Descubre calas de aguas turquesas escondidas entre acantilados, playas solo accesibles por mar, y pueblos con encanto como Lloret de Mar y la historica Tossa de Mar con su villa medieval amurallada.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={localizedPath("locationLloret")}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Lloret de Mar - 25 min</Badge>
                </Link>
                <Link href={localizedPath("locationTossa")}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Tossa de Mar - 1h</Badge>
                </Link>
                <Link href={localizedPath("locationBlanes")}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Calas de Blanes</Badge>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Overview */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Clock className="w-6 h-6 text-primary" />
                Precios de alquiler de barcos
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Precios transparentes con gasolina incluida en todos los barcos sin licencia. Sin sorpresas ni costes adicionales.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Barcos sin licencia</h3>
                  <p className="text-muted-foreground mb-2">Astec 400: desde 70 EUR/hora (gasolina incluida)</p>
                  <p className="text-muted-foreground mb-2">Otros modelos: desde 75 EUR/hora (gasolina incluida)</p>
                  <p className="text-muted-foreground">Capacidad: 4-7 personas segun modelo</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Barcos con licencia</h3>
                  <p className="text-muted-foreground mb-2">Desde 150 EUR / 2 horas</p>
                  <p className="text-muted-foreground mb-2">Motores de 40 a 115 CV</p>
                  <p className="text-muted-foreground">Capacidad: hasta 11 personas</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href={localizedPath("pricing")}>
                  <Button variant="outline" size="sm">
                    Ver todos los precios y barcos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Reserva tu barco desde Tordera
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                En 15 minutos en coche o 8 minutos en tren estaras en el Puerto de Blanes listo para zarpar. Contactanos por WhatsApp para reservar tu barco y descubrir la Costa Brava desde el agua.
              </p>
              <Button
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-tordera"
              >
                Reservar por WhatsApp
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-heading font-bold text-center mb-8">
            Preguntas frecuentes sobre alquilar barco desde Tordera
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

      <RelatedLocationsSection currentLocation="tordera" />

      <Footer />
    </div>
  );
}
