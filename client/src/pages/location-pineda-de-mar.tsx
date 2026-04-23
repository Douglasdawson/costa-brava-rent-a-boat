import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
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
  Hotel,
  Sun,
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
import { useTranslations } from "@/lib/translations";
import { getCanonicalUrl } from "@/lib/domain";
import { trackLocationPageView } from "@/utils/analytics";

export default function LocationPinedaDeMarPage() {
  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const { language, localizedPath } = useLanguage();
  useEffect(() => { trackLocationPageView("pineda"); }, []);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const locationSchema = {
    "@type": "TouristDestination",
    "name": "Alquiler de Barcos cerca de Pineda de Mar",
    "description": "Alquila barcos desde el Puerto de Blanes, a solo 18 minutos en coche de Pineda de Mar. Barcos sin licencia desde 70 EUR/hora con gasolina incluida.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.6278,
      "longitude": 2.6923
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Pineda de Mar",
      "addressRegion": "Barcelona",
      "postalCode": "08397",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Beach", "Resort"],
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
    { name: "Alquiler Barcos Pineda de Mar", url: "/alquiler-barcos-pineda-de-mar" }
  ]);

  const faqItems = [
    {
      question: "¿A cuanta distancia esta Pineda de Mar del Puerto de Blanes?",
      answer: "Pineda de Mar esta a 15 km del Puerto de Blanes, unos 18 minutos en coche por la N-II. Tambien puedes llegar en tren RENFE linea R1 en solo 12 minutos desde la estacion de Blanes."
    },
    {
      question: "¿Cuanto cuesta alquilar un barco desde Blanes si estoy en Pineda de Mar?",
      answer: "El alquiler de barco sin licencia empieza desde {noLicBaja1h} EUR por hora con gasolina incluida. Barcos con licencia desde {licBaja2h} EUR por 2 horas. Disponemos de {fleetCount} barcos para 4-11 personas."
    },
    {
      question: "¿Necesito licencia de navegacion para alquilar un barco?",
      answer: "No necesariamente. Ofrecemos barcos sin licencia que cualquier mayor de 18 anos puede manejar. Te damos 15 minutos de formacion antes de zarpar. Tambien tenemos barcos con licencia para navegantes mas experimentados."
    },
    {
      question: "¿Puedo ir desde Pineda de Mar a Blanes en transporte publico?",
      answer: "Si, la linea R1 de RENFE conecta Pineda de Mar con Blanes en 12 minutos. Los trenes salen cada 30 minutos en temporada. La estacion de Blanes esta a unos 10 minutos andando del puerto."
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
        title="Alquiler Barco Pineda de Mar | Puerto Blanes 18 min | Sin Licencia 70€/h"
        description="¿Alojado en Pineda de Mar? Puerto Blanes a 18 min en coche o 12 min en tren R1. Alquila barco sin licencia desde 70€/h con gasolina incluida. Navega a Blanes, Lloret o Tossa."
        ogTitle="Alquiler Barco Pineda de Mar | 18 min al Puerto Blanes"
        ogDescription="Desde Pineda de Mar al Puerto Blanes en 18 min. Barco sin licencia desde 70€/h. 4.8★ Google."
        canonical={getCanonicalUrl("/alquiler-barcos-pineda-de-mar")}
        jsonLd={combinedJsonLd}
      />
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                Alquiler de Barcos cerca de Pineda de Mar
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              Pineda de Mar es uno de los destinos turisticos mas importantes de la costa del Maresme, con decenas de hoteles y resorts all-inclusive. El Puerto de Blanes, a solo 18 minutos en coche o 12 minutos en tren, es el punto de alquiler de barcos mas cercano. Disfruta de la Costa Brava sin necesidad de licencia de navegacion.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Car className="w-4 h-4 mr-2" />
                15 km / 18 min en coche
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Train className="w-4 h-4 mr-2" />
                RENFE R1: 12 min
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Waves className="w-4 h-4 mr-2" />
                Costa del Maresme
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
                ¿Por que alquilar un barco desde Blanes si estas en Pineda de Mar?
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">El puerto mas cercano con alquiler de barcos</h3>
                  <p className="text-muted-foreground mb-4">
                    Pineda de Mar no dispone de puerto deportivo ni de servicio de alquiler de embarcaciones. El Puerto de Blanes es el punto mas cercano donde puedes alquilar un barco, a tan solo 15 km por la carretera N-II. Si estas alojado en uno de los muchos hoteles de Pineda, en menos de 20 minutos estaras navegando por las aguas cristalinas de la Costa Brava.
                  </p>
                  <h3 className="font-semibold text-lg mb-3">{faqVars.fleetCount} barcos para elegir</h3>
                  <p className="text-muted-foreground">
                    Disponemos de una flota de {faqVars.fleetCount} barcos que incluye embarcaciones sin licencia ideales para familias y principiantes, asi como barcos con licencia para navegantes experimentados. Capacidad de 4 a 11 personas segun el modelo elegido.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Gasolina incluida en barcos sin licencia</h3>
                  <p className="text-muted-foreground mb-4">
                    El precio de los barcos sin licencia incluye la gasolina, asi que no hay sorpresas. Desde 70 EUR por hora con el Astec 400, o desde 75 EUR por hora con otros modelos de mayor eslora. El precio que ves es el precio final.
                  </p>
                  <h3 className="font-semibold text-lg mb-3">Sin experiencia previa necesaria</h3>
                  <p className="text-muted-foreground">
                    Antes de zarpar, nuestro equipo te da 15 minutos de formacion practica: manejo del motor, normas basicas de navegacion y consejos sobre las mejores calas. Cualquier persona mayor de 18 anos puede pilotar un barco sin licencia.
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
                Pineda de Mar: actividades para huespedes de hotel
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Pineda de Mar es conocida por su amplia oferta hotelera, con numerosos hoteles y resorts que atraen a familias de toda Europa. Si buscas una actividad diferente durante tus vacaciones, alquilar un barco y explorar la Costa Brava desde el agua es una experiencia inolvidable que complementa perfectamente tu estancia en la playa.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Hotel className="w-8 h-8 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Zona hotelera de primer nivel</h3>
                  <p className="text-muted-foreground">Decenas de hoteles y resorts all-inclusive en primera linea de playa. Escapate unas horas para vivir la experiencia nautica que hara unicas tus vacaciones.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Playa de Pineda</h3>
                  <p className="text-muted-foreground">Mas de 1 km de playa de arena dorada con todos los servicios. Despues de navegar, vuelve a tu hotel a relajarte junto al mar.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Perfecta para familias</h3>
                  <p className="text-muted-foreground">Pineda es un destino familiar por excelencia. Nuestros barcos sin licencia son seguros y faciles de manejar, ideales para una excursion en familia por la costa.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Get to Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Car className="w-6 h-6 text-primary" />
                Como llegar de Pineda de Mar al Puerto de Blanes
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    En coche (18 minutos)
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Toma la N-II en direccion norte hacia Blanes. Son 15 km de trayecto comodo y directo. Desde la mayoria de hoteles de Pineda de Mar llegaras al Puerto de Blanes en unos 18 minutos. El trayecto bordea la costa y es muy agradable.
                  </p>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    En taxi
                  </h3>
                  <p className="text-muted-foreground">
                    Un taxi desde Pineda de Mar al Puerto de Blanes cuesta aproximadamente 20-25 EUR. Es una buena opcion si no dispones de coche o prefieres no preocuparte por el aparcamiento.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Train className="w-5 h-5 text-primary" />
                    En tren RENFE (12 minutos)
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    La linea R1 de Rodalies de RENFE conecta Pineda de Mar con Blanes en solo 12 minutos. Los trenes salen cada 30 minutos en temporada alta. Desde la estacion de Blanes, el puerto esta a unos 10-15 minutos caminando por el paseo maritimo.
                  </p>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ParkingCircle className="w-5 h-5 text-primary" />
                    Aparcamiento en Blanes
                  </h3>
                  <p className="text-muted-foreground">
                    Hay aparcamiento gratuito disponible cerca del Puerto de Blanes. En temporada alta (julio-agosto) recomendamos llegar temprano o considerar el tren como alternativa comoda y rapida.
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
                Desde el Puerto de Blanes puedes navegar hacia el norte por la espectacular costa de la Costa Brava. Descubre calas escondidas, acantilados impresionantes y pueblos medievales como Tossa de Mar. Con un barco sin licencia puedes explorar hasta 2 millas de la costa, suficiente para llegar a las calas mas bonitas de la zona.
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
                Ofrecemos precios competitivos con gasolina incluida en todos los barcos sin licencia. No hay costes ocultos ni suplementos por combustible.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Barcos sin licencia</h3>
                  <p className="text-muted-foreground mb-2">Desde {faqVars.noLicBaja1h} EUR/hora (gasolina incluida)</p>
                  <p className="text-muted-foreground">Capacidad: 4-7 personas segun modelo</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Barcos con licencia</h3>
                  <p className="text-muted-foreground mb-2">Desde {faqVars.licBaja2h} EUR / 2 horas</p>
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
                Reserva tu barco desde Pineda de Mar
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                En 18 minutos estaras en el Puerto de Blanes listo para zarpar. Contactanos por WhatsApp para reservar tu barco y vivir una experiencia unica en la Costa Brava.
              </p>
              <Button
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-pineda"
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
            Preguntas frecuentes sobre alquilar barco desde Pineda de Mar
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

      <RelatedLocationsSection currentLocation="pineda" />

      <Footer />
    </div>
  );
}
