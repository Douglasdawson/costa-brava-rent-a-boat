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
  Bus,
  ParkingCircle,
  Waves,
  TreePine,
  Tent,
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

export default function LocationPalafollsPage() {
  const { data: boatsData } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boatsData), [boatsData]);
  const t = useTranslations();
  const { language, localizedPath } = useLanguage();
  useEffect(() => { trackLocationPageView("palafolls"); }, []);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const locationSchema = {
    "@type": "TouristDestination",
    "name": "Alquiler de Barcos cerca de Palafolls",
    "description": "Alquila barcos desde el Puerto de Blanes, a solo 12 minutos en coche de Palafolls. Barcos sin licencia desde 70 EUR/hora con gasolina incluida.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.6694,
      "longitude": 2.7506
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Palafolls",
      "addressRegion": "Barcelona",
      "postalCode": "08389",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Camping", "Nature"],
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
    { name: "Alquiler Barcos Palafolls", url: "/alquiler-barcos-palafolls" }
  ]);

  const faqItems = [
    {
      question: "¿A cuanta distancia esta Palafolls del Puerto de Blanes?",
      answer: "Palafolls esta a solo 8 km del Puerto de Blanes, unos 12 minutos en coche. Es uno de los municipios mas cercanos al puerto, lo que lo convierte en un punto ideal para hacer una excursion en barco por la Costa Brava."
    },
    {
      question: "¿Cuanto cuesta alquilar un barco desde Blanes si estoy en Palafolls?",
      answer: "El alquiler de barco sin licencia empieza desde {noLicBaja1h} EUR por hora con gasolina incluida. Barcos con licencia desde {licBaja2h} EUR por 2 horas. Disponemos de {fleetCount} barcos para 4-11 personas."
    },
    {
      question: "¿Puedo ir desde el camping de Palafolls al Puerto de Blanes facilmente?",
      answer: "Si, desde los campings de la zona de Palafolls (como La Masia o Neptuno) llegas al Puerto de Blanes en unos 10-15 minutos en coche. Hay lineas de autobus que conectan ambas localidades, aunque el coche es la opcion mas comoda."
    },
    {
      question: "¿Necesito experiencia para alquilar un barco?",
      answer: "No necesitas experiencia. Ofrecemos barcos sin licencia que cualquier mayor de 18 anos puede manejar. Te damos 15 minutos de formacion antes de zarpar, incluyendo normas de navegacion y consejos de seguridad."
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
        title="Alquiler Barco Palafolls | Puerto Blanes 12 min | Sin Licencia 70€/h"
        description="¿En camping o alojamiento en Palafolls? Puerto Blanes a 12 min en coche. Alquila barco sin licencia desde 70€/h con gasolina incluida. Excursión ideal Costa Brava."
        ogTitle="Alquiler Barco Palafolls | 12 min al Puerto Blanes"
        ogDescription="Desde Palafolls al Puerto Blanes en 12 min. Barco sin licencia desde 70€/h. Gasolina incluida. 4.8★."
        canonical={getCanonicalUrl("/alquiler-barcos-palafolls")}
        jsonLd={combinedJsonLd}
      />
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                Alquiler de Barcos cerca de Palafolls
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              Palafolls es un municipio del interior del Maresme conocido por su amplia zona de campings y resorts naturales. A solo 12 minutos en coche del Puerto de Blanes, es el punto de partida perfecto para una excursion en barco por la Costa Brava. Nuestros barcos sin licencia son ideales para familias de camping que buscan una actividad diferente.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Car className="w-4 h-4 mr-2" />
                8 km / 12 min en coche
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                Muy cerca de Blanes
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Tent className="w-4 h-4 mr-2" />
                Zona de campings
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
                ¿Por que alquilar un barco desde Blanes si estas en Palafolls?
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">A 12 minutos del puerto</h3>
                  <p className="text-muted-foreground mb-4">
                    Palafolls es uno de los municipios mas cercanos al Puerto de Blanes. Con solo 8 km de distancia, puedes salir del camping por la manana, navegar durante unas horas por la Costa Brava y volver a tiempo para la comida. Es la excursion perfecta para un dia de vacaciones diferente.
                  </p>
                  <h3 className="font-semibold text-lg mb-3">Ideal para campistas</h3>
                  <p className="text-muted-foreground">
                    Si te alojas en uno de los campings de Palafolls como La Masia, Neptuno, o los complejos de bungalows de la zona, alquilar un barco es la actividad estrella que hara unicas tus vacaciones. Muchas familias de campings cercanos nos visitan cada temporada.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Gasolina incluida en barcos sin licencia</h3>
                  <p className="text-muted-foreground mb-4">
                    El precio de los barcos sin licencia incluye la gasolina. Desde 70 EUR por hora con el Astec 400, o desde 75 EUR por hora con otros modelos de mayor eslora. Sin costes ocultos ni suplementos por combustible.
                  </p>
                  <h3 className="font-semibold text-lg mb-3">Sin experiencia previa necesaria</h3>
                  <p className="text-muted-foreground">
                    Antes de zarpar, nuestro equipo te da 15 minutos de formacion practica. Te ensenamos a manejar el motor, las normas basicas de navegacion y los mejores rincones para explorar. Cualquier persona mayor de 18 anos puede pilotar nuestros barcos sin licencia.
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
                Palafolls: campings, naturaleza y mar
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Palafolls combina la tranquilidad de un pueblo de interior con la proximidad al mar. Su amplia oferta de campings y alojamientos rurales atrae a miles de familias europeas cada verano. Complementa tu estancia con una jornada de navegacion por las calas mas bonitas de la Costa Brava.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tent className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Zona de campings</h3>
                  <p className="text-muted-foreground">Camping La Masia, Neptuno y otros complejos turisticos de la zona atraen a familias de toda Europa. Una excursion en barco es la actividad perfecta para completar las vacaciones.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Waves className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">A minutos del mar</h3>
                  <p className="text-muted-foreground">Aunque Palafolls es un municipio de interior, las playas de Blanes y Malgrat estan a menos de 10 minutos. El Puerto de Blanes es tu puerta de entrada a la Costa Brava por mar.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TreePine className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Naturaleza y castillo</h3>
                  <p className="text-muted-foreground">El Castillo de Palafolls y los senderos de la zona ofrecen paseos tranquilos. Combina naturaleza de interior con la emocion de navegar por aguas cristalinas.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Get to Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Car className="w-6 h-6 text-primary" />
                Como llegar de Palafolls al Puerto de Blanes
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    En coche (12 minutos)
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Desde Palafolls, toma la BV-6001 en direccion a Blanes. Son solo 8 km hasta el Puerto de Blanes. El trayecto es rapido y sencillo, con buena senalizacion. Desde los campings de la zona, el recorrido es aun mas directo.
                  </p>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    En taxi
                  </h3>
                  <p className="text-muted-foreground">
                    Un taxi desde Palafolls al Puerto de Blanes cuesta aproximadamente 12-18 EUR. Es una opcion comoda si no dispones de coche propio.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-primary" />
                    En autobus
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Palafolls no tiene estacion de tren, pero hay lineas de autobus que conectan con Blanes. El trayecto dura unos 20 minutos. Consulta los horarios de las lineas locales en temporada alta, ya que la frecuencia aumenta durante el verano.
                  </p>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ParkingCircle className="w-5 h-5 text-primary" />
                    Aparcamiento en Blanes
                  </h3>
                  <p className="text-muted-foreground">
                    Hay aparcamiento gratuito disponible cerca del Puerto de Blanes. En temporada alta (julio-agosto) recomendamos llegar temprano para asegurar plaza de parking.
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
                Desde el Puerto de Blanes puedes navegar hacia el norte explorando la espectacular costa de la Costa Brava. Calas escondidas de aguas turquesas, acantilados cubiertos de pinos y la impresionante silueta de Tossa de Mar en el horizonte. Todo esto a tu alcance desde el barco.
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
                Precios transparentes con gasolina incluida en todos los barcos sin licencia. Sin costes ocultos.
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
                Reserva tu barco desde Palafolls
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                En 12 minutos estaras en el Puerto de Blanes listo para zarpar. La excursion perfecta desde tu camping. Contactanos por WhatsApp para reservar.
              </p>
              <Button
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-palafolls"
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
            Preguntas frecuentes sobre alquilar barco desde Palafolls
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

      <RelatedLocationsSection currentLocation="palafolls" />

      <Footer />
    </div>
  );
}
