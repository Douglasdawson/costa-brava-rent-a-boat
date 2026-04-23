import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Waves,
  Clock,
  Anchor,
  Users,
  Star,
  MapPin,
  Eye,
  Fish,
  Sun,
  ChevronRight,
  HelpCircle,
  MessageCircle
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";

const snorkelSpots = [
  {
    name: "Cala Sant Francesc",
    distance: "20 minutos desde el puerto",
    depth: "2-8 metros",
    highlights: "Posidonia oceanica, sargos, obladas, estrellas de mar. Fondo mixto de arena y roca con excelente visibilidad.",
    ideal: "Ideal para principiantes y familias por su agua cristalina y poca corriente.",
    icon: Star
  },
  {
    name: "Cala Bona",
    distance: "15 minutos desde el puerto",
    depth: "3-10 metros",
    highlights: "Formaciones rocosas, meros juveniles, pulpos, nudibranquios. Paredes sumergidas con mucha vida marina.",
    ideal: "Perfecta para snorkel intermedio. Fondear el barco y explorar la costa rocosa.",
    icon: Eye
  },
  {
    name: "Cala Treumal",
    distance: "25 minutos desde el puerto",
    depth: "2-6 metros",
    highlights: "Praderas de posidonia, caballitos de mar (especie protegida), bancos de castanolas y doncellas.",
    ideal: "La cala mas tranquila para snorkel relajado. Agua turquesa y poca afluencia.",
    icon: Fish
  }
];

const recommendedBoats = [
  {
    name: "Barcos sin licencia (4-5 personas)",
    duration: "2-3 horas recomendadas",
    price: "Desde 70 EUR/hora",
    description: "Perfectos para snorkel en calas cercanas como Cala Sant Francesc y Cala Bona. Gasolina incluida. Fondeas el barco y te tiras al agua directamente."
  },
  {
    name: "Barcos con licencia (6-7 personas)",
    duration: "4-6 horas recomendadas",
    price: "Desde 90 EUR/hora",
    description: "Mayor autonomia para visitar multiples calas en una sola salida. Ideales para grupos que quieren combinar snorkel con navegacion a Lloret o Tossa."
  }
];

const faqs = [
  {
    question: "Puedo alquilar equipo de snorkel con el barco?",
    answer: "Si. Ofrecemos kits de snorkel (mascara, tubo y aletas) por 7,50 EUR por persona. El equipo se recoge al embarcar y se devuelve al final del alquiler. Tambien puedes traer tu propio equipo sin coste adicional."
  },
  {
    question: "Cual es la mejor epoca para hacer snorkel en Blanes?",
    answer: "De junio a septiembre la temperatura del agua oscila entre 22 y 26 grados, ideal para snorkel sin neopreno. La mejor visibilidad se da en junio y septiembre, cuando hay menos afluencia y el agua esta mas calmada. En julio y agosto el agua esta mas calida pero puede haber mas oleaje en dias de viento."
  },
  {
    question: "Es seguro hacer snorkel desde el barco sin experiencia?",
    answer: "Totalmente. Antes de salir te damos una formacion de seguridad de 15 minutos donde explicamos como fondear el barco correctamente. Todos los barcos llevan chalecos salvavidas. Recomendamos snorkel en calas protegidas como Cala Sant Francesc para principiantes."
  },
  {
    question: "Cuantas calas puedo visitar en una salida de snorkel?",
    answer: "En 2 horas puedes visitar 1-2 calas con tiempo suficiente para snorkel. En 4 horas puedes hacer una ruta completa de 3-4 calas. Recomendamos un minimo de 3 horas para disfrutar sin prisas del snorkel y la navegacion."
  }
];

export default function ActivitySnorkelPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('activitySnorkel', language);
  const hreflangLinks = generateHreflangLinks('activitySnorkel');
  const canonical = generateCanonicalUrl('activitySnorkel', language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Excursion Snorkel en Barco", url: "/excursion-snorkel-barco-blanes" }
  ]);

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // TouristTrip + Offer: positions this page as a bookable snorkel experience
  // so Google SGE / Perplexity can enumerate it for "snorkel Costa Brava" queries.
  const touristTripSchema = {
    "@type": "TouristTrip",
    "@id": `${canonical}#tour`,
    "name": "Ruta de Snorkel en Barco desde Blanes",
    "description": "Excursión en barco sin licencia desde el Puerto de Blanes hacia calas vírgenes de aguas cristalinas ideales para snorkel. Equipo opcional (7,50€). Gasolina, seguro y kit de seguridad incluidos.",
    "touristType": ["Adventure", "Family", "Nature"],
    "inLanguage": ["es-ES", "en-GB", "ca-ES", "fr-FR", "de-DE", "nl-NL", "it-IT", "ru-RU"],
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://www.costabravarentaboat.com/#organization",
      "name": "Costa Brava Rent a Boat",
    },
    "itinerary": {
      "@type": "ItemList",
      "itemListElement": [
        { "@type": "Place", "name": "Sa Palomera", "description": "5 min desde puerto — roca emblemática con vida marina" },
        { "@type": "Place", "name": "Cala Sant Francesc", "description": "Pinos y agua turquesa, ideal para primer snorkel" },
        { "@type": "Place", "name": "Cala Sa Forcanera", "description": "Cala virgen con fondo rocoso y biodiversidad" },
      ],
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Barco sin licencia 2h con equipo snorkel",
        "price": "125",
        "priceCurrency": "EUR",
        "priceValidUntil": "2026-10-31",
        "availability": "https://schema.org/InStock",
        "url": canonical,
        "description": "Barco sin licencia 2h (desde 115€) + equipo snorkel opcional (7,50€ por persona). Gasolina incluida.",
      },
    ],
    "maximumAttendeeCapacity": 7,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [breadcrumbSchema, touristTripSchema, faqSchema]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        keywords={seoConfig.keywords}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      <main className="pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 pt-8 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <Waves className="w-8 h-8 text-primary mr-4" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                  Excursion de Snorkel en Barco desde Blanes
                </h1>
              </div>
              <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
                Descubre los fondos marinos de la Costa Brava desde nuestros barcos en el Puerto de Blanes.
                Navega hasta las mejores calas, fondea y sumérgete en aguas cristalinas con visibilidad
                de hasta 15 metros. Equipo de snorkel disponible por 7,50 EUR/persona.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge variant="outline" className="text-primary border-primary">
                  <Waves className="w-4 h-4 mr-2" />
                  3 calas de snorkel
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Eye className="w-4 h-4 mr-2" />
                  Visibilidad 10-15m
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Clock className="w-4 h-4 mr-2" />
                  2-4 horas recomendadas
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-12 bg-muted">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Why Snorkel from a Boat */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Star className="w-6 h-6 text-cta" />
                  Por que hacer snorkel desde un barco
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Acceso a calas inaccesibles</h3>
                    <p className="text-muted-foreground mb-4">
                      Las mejores calas para snorkel en la Costa Brava no tienen acceso por carretera
                      o requieren caminatas largas. Desde el barco llegas directamente, fondeas a pocos
                      metros de la orilla y te tiras al agua. Sin aglomeraciones, sin caminar con el
                      equipo al sol.
                    </p>
                    <h3 className="font-semibold text-lg mb-3">Tu propia base flotante</h3>
                    <p className="text-muted-foreground">
                      El barco es tu punto de referencia en el agua. Puedes dejar toallas, comida y
                      bebida a bordo. Descansas entre inmersiones, te secas al sol en cubierta y
                      cuando quieres, cambias de cala en minutos.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Multiples spots en una salida</h3>
                    <p className="text-muted-foreground mb-4">
                      En una salida de 3-4 horas puedes visitar 2-3 calas diferentes. Cada una tiene
                      un ecosistema distinto: praderas de posidonia, fondos rocosos, paredes verticales.
                      Es como hacer tres excursiones de snorkel en una sola.
                    </p>
                    <h3 className="font-semibold text-lg mb-3">Sin necesidad de experiencia</h3>
                    <p className="text-muted-foreground">
                      No necesitas licencia de navegacion para nuestros barcos sin licencia. Te damos
                      una formacion de 15 minutos en el puerto. El snorkel es la actividad acuatica
                      mas accesible: solo necesitas mascara, tubo y ganas de descubrir.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Snorkel Spots */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <MapPin className="w-6 h-6 text-primary" />
                  Mejores calas para snorkel cerca de Blanes
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {snorkelSpots.map((spot) => {
                    const Icon = spot.icon;
                    return (
                      <div key={spot.name} className="text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{spot.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{spot.distance}</p>
                        <p className="text-sm text-primary font-medium mb-2">Profundidad: {spot.depth}</p>
                        <p className="text-muted-foreground text-sm mb-3">{spot.highlights}</p>
                        <p className="text-sm font-medium text-foreground">{spot.ideal}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Equipment Section */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Anchor className="w-6 h-6 text-primary" />
                  Equipo de snorkel incluido y disponible
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Incluido con todos los barcos</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Chalecos salvavidas para todos los pasajeros
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Escalera de bano para subir y bajar al agua
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Toldo / bimini para sombra en cubierta
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Ancla para fondear en las calas
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Alquiler adicional: 7,50 EUR/persona</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Mascara de snorkel de calidad
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Tubo con valvula anti-entrada de agua
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Aletas ajustables (varias tallas disponibles)
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Tambien puedes traer tu propio equipo
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Boats */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Users className="w-6 h-6 text-primary" />
                  Barcos recomendados para snorkel
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {recommendedBoats.map((boat) => (
                    <div key={boat.name} className="border rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-2">{boat.name}</h3>
                      <div className="flex gap-3 mb-3">
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {boat.duration}
                        </Badge>
                        <Badge variant="secondary">{boat.price}</Badge>
                      </div>
                      <p className="text-muted-foreground">{boat.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Suggested Route */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Sun className="w-6 h-6 text-cta" />
                  Ruta de snorkel recomendada (3 horas)
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                    <div>
                      <h3 className="font-semibold">Puerto de Blanes - Salida</h3>
                      <p className="text-muted-foreground">Formacion de 15 minutos, recogida de equipo de snorkel. Salida hacia el norte por la costa.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                    <div>
                      <h3 className="font-semibold">Cala Bona - Primera parada (45 min)</h3>
                      <p className="text-muted-foreground">Fondear y snorkel entre formaciones rocosas. Busca pulpos entre las grietas y observa los bancos de castanolas.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                    <div>
                      <h3 className="font-semibold">Cala Sant Francesc - Segunda parada (45 min)</h3>
                      <p className="text-muted-foreground">La joya de la corona. Pradera de posidonia con sargos, obladas y estrellas de mar. Agua cristalina y fondo de arena blanca.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
                    <div>
                      <h3 className="font-semibold">Regreso al Puerto de Blanes</h3>
                      <p className="text-muted-foreground">Navegacion de vuelta disfrutando de las vistas de la costa. Devolucion del equipo de snorkel en el puerto.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Internal Links */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Explora mas actividades y servicios</h3>
                <div className="flex flex-wrap gap-3">
                  <a href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Barcos sin licencia
                  </a>
                  <a href={localizedPath("categoryLicensed")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Barcos con licencia
                  </a>
                  <a href={localizedPath("activityFamilies")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Barcos para familias
                  </a>
                  <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Precios y tarifas
                  </a>
                  <a href={localizedPath("routes")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Rutas maritimas
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <HelpCircle className="w-6 h-6 text-primary" />
                  Preguntas frecuentes sobre snorkel en barco
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground">{faq.answer}</p>
                      {index < faqs.length - 1 && <hr className="mt-6" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card className="bg-primary text-white">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Reserva tu excursion de snorkel desde Blanes</h2>
                <p className="text-lg mb-6 opacity-90">
                  Elige tu barco, anade el equipo de snorkel y descubre los fondos marinos de la Costa Brava.
                  Salidas desde el Puerto de Blanes de abril a octubre.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handleBookingWhatsApp}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Reservar por WhatsApp
                  </Button>
                  <a href={localizedPath("categoryLicenseFree")}>
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full">
                      <Anchor className="w-5 h-5 mr-2" />
                      Ver barcos disponibles
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <RelatedContent currentPage="activitySnorkel" />
      <Footer />
    </div>
  );
}
