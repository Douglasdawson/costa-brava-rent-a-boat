import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Fish,
  Clock,
  Anchor,
  Users,
  Star,
  MapPin,
  Shield,
  Ship,
  ChevronRight,
  HelpCircle,
  MessageCircle,
  Navigation as NavigationIcon,
  AlertTriangle
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";

const fishSpecies = [
  {
    name: "Lubina (Dicentrarchus labrax)",
    season: "Todo el ano, mejor en otono e invierno",
    where: "Zonas rocosas cerca de la costa, desembocaduras",
    technique: "Spinning con senuelos, curricán"
  },
  {
    name: "Dorada (Sparus aurata)",
    season: "Primavera y verano",
    where: "Fondos de arena y posidonia, cerca de la costa",
    technique: "Pesca a fondo con cebo natural (gusano, gamba)"
  },
  {
    name: "Serviola (Seriola dumerili)",
    season: "Junio a octubre",
    where: "Aguas abiertas, 2-5 millas de la costa",
    technique: "Jigging, curricán con senuelos grandes"
  },
  {
    name: "Dentón (Dentex dentex)",
    season: "Primavera y otono",
    where: "Fondos rocosos entre 20-60m de profundidad",
    technique: "Pesca a fondo, jigging ligero"
  },
  {
    name: "Calamares (Loligo vulgaris)",
    season: "Otono e invierno (septiembre-febrero)",
    where: "Fondos de arena, cerca de praderas de posidonia",
    technique: "Pesca con poteras / jibioneras"
  }
];

const recommendedBoats = [
  {
    type: "Barcos con licencia",
    capacity: "6-7 personas",
    autonomy: "Mayor autonomia y rango",
    price: "Desde 90 EUR/hora (gasolina no incluida)",
    advantages: [
      "Acceso a zonas de pesca mas lejanas (5+ millas)",
      "Mayor potencia para curricán y jigging",
      "Espacio amplio para equipo de pesca",
      "Posibilidad de salir con mar mas movido"
    ],
    recommendation: "Recomendado para pescadores con experiencia que quieran pescar en aguas abiertas."
  },
  {
    type: "Barcos sin licencia",
    capacity: "4-5 personas",
    autonomy: "Pesca costera (hasta 2 millas)",
    price: "Desde 70 EUR/hora (gasolina incluida)",
    advantages: [
      "Sin necesidad de titulo nautico",
      "Gasolina incluida en el precio",
      "Perfectos para pesca a fondo en calas",
      "Ideal para iniciarse en la pesca desde barco"
    ],
    recommendation: "Recomendado para pesca recreativa ligera cerca de la costa."
  }
];

const fishingSpots = [
  {
    name: "Rocas de Sa Palomera",
    distance: "10 minutos del puerto",
    target: "Lubinas, sargos, mojarras",
    description: "Las formaciones rocosas frente a Sa Palomera son un clasico para spinning costero. Fondos de 5-15 metros con mucha vida."
  },
  {
    name: "Zona de Cala Bona - Cala Sant Francesc",
    distance: "15-20 minutos del puerto",
    target: "Doradas, dentones, pulpos",
    description: "Fondos mixtos de roca y arena entre 10-25 metros. Excelente para pesca a fondo con cebo natural."
  },
  {
    name: "Aguas abiertas frente a Blanes",
    distance: "30-45 minutos del puerto",
    target: "Serviolas, bonitos, llampugas",
    description: "A 3-5 millas de la costa, profundidades de 40-80 metros. Solo accesible con barcos con licencia. Jigging y curricán."
  }
];

const faqs = [
  {
    question: "Los barcos incluyen equipo de pesca?",
    answer: "No. Debes traer tu propio equipo de pesca (canas, carretes, senuelos, cebo). Nuestros barcos proporcionan la plataforma de navegacion, pero no incluyen material de pesca. En Blanes hay tiendas nauticas cerca del puerto donde puedes comprar cebo fresco y material basico."
  },
  {
    question: "Necesito licencia de pesca para pescar desde el barco?",
    answer: "Si. Para pesca recreativa en el mar necesitas la licencia de pesca recreativa maritima de la Generalitat de Catalunya. Puedes obtenerla online en gencat.cat por aproximadamente 14 EUR (validez 2 anos). Es diferente de la licencia de navegacion: la licencia de pesca es para pescar, la de navegacion para conducir el barco."
  },
  {
    question: "Que barco necesito para pescar en el mar?",
    answer: "Depende del tipo de pesca. Para pesca a fondo en calas cercanas (lubinas, doradas), un barco sin licencia es suficiente. Para pesca en aguas abiertas (serviolas, curricán), necesitas un barco con licencia que tiene mayor autonomia y potencia. Contactanos por WhatsApp y te asesoramos segun tu experiencia."
  },
  {
    question: "Cuales son las regulaciones de pesca en la Costa Brava?",
    answer: "La pesca recreativa en Catalunya tiene limites de captura: maximo 5 kg por persona y dia (excepto si una pieza supera ese peso). Hay tallas minimas por especie (lubina 36 cm, dorada 20 cm). Esta prohibido pescar en reservas marinas y zonas de bano. Algunas tecnicas como la pesca con arpón requieren licencia especifica."
  }
];

export default function ActivityFishingPage() {
  const { language, localizedPath } = useLanguage();
  const seoConfig = getSEOConfig('activityFishing', language);
  const hreflangLinks = generateHreflangLinks('activityFishing');
  const canonical = generateCanonicalUrl('activityFishing', language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Pesca desde Barco", url: "/pesca-barco-blanes" }
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

  const touristTripSchema = {
    "@type": "TouristTrip",
    "@id": `${canonical}#tour`,
    "name": "Alquiler de Barco para Pesca Recreativa desde Blanes",
    "description": "Alquiler de barco sin licencia o con licencia desde el Puerto de Blanes para pesca recreativa en calas rocosas o aguas abiertas de la Costa Brava. Equipo de pesca NO incluido (trae el tuyo). Requiere licencia de pesca recreativa de la Generalitat.",
    "touristType": ["Adventure", "Sports", "Fishing"],
    "inLanguage": ["es-ES", "en-GB", "ca-ES", "fr-FR", "de-DE", "nl-NL", "it-IT", "ru-RU"],
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://www.costabravarentaboat.com/#organization",
      "name": "Costa Brava Rent a Boat",
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Barco sin licencia para pesca costera (2h)",
        "price": "115",
        "priceCurrency": "EUR",
        "priceValidUntil": "2026-10-31",
        "availability": "https://schema.org/InStock",
        "url": canonical,
        "description": "Ideal para pesca a fondo en calas cercanas (lubinas, doradas). Hasta 15 CV, gasolina incluida.",
      },
      {
        "@type": "Offer",
        "name": "Barco con licencia para pesca en aguas abiertas (2h)",
        "price": "160",
        "priceCurrency": "EUR",
        "priceValidUntil": "2026-10-31",
        "availability": "https://schema.org/InStock",
        "url": canonical,
        "description": "Para pesca en aguas abiertas (serviolas, curricán). Requiere Licencia Básica de Navegación (LBN) o PER. Gasolina NO incluida.",
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
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 pt-8 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <Fish className="w-8 h-8 text-primary mr-4" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                  Pesca desde Barco en Blanes - Costa Brava
                </h1>
              </div>
              <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
                Alquila un barco en el Puerto de Blanes y sal a pescar en las aguas de la Costa Brava.
                Lubinas, doradas, serviolas y mas. Barcos con y sin licencia para adaptarse a tu nivel
                de experiencia. Trae tu equipo y nosotros ponemos el barco.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge variant="outline" className="text-primary border-primary">
                  <Fish className="w-4 h-4 mr-2" />
                  5+ especies objetivo
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Ship className="w-4 h-4 mr-2" />
                  Con y sin licencia
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Clock className="w-4 h-4 mr-2" />
                  4-6 horas recomendadas
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-12 bg-muted">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Why Fish from Blanes */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Star className="w-6 h-6 text-cta" />
                  Por que pescar desde Blanes
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Ubicacion estrategica</h3>
                    <p className="text-muted-foreground mb-4">
                      Blanes esta en el punto donde el litoral cambia de caracter: al sur playas de
                      arena del Maresme, al norte la costa rocosa de la Costa Brava. Esta transicion
                      crea una diversidad de habitats marinos excepcional para la pesca: fondos de
                      arena, praderas de posidonia, formaciones rocosas y aguas abiertas, todo
                      accesible en menos de 30 minutos de navegacion.
                    </p>
                    <h3 className="font-semibold text-lg mb-3">Puerto comodo y bien equipado</h3>
                    <p className="text-muted-foreground">
                      El Puerto de Blanes tiene aparcamiento gratuito, gasolinera nautica y tiendas
                      donde comprar cebo fresco. Sales del puerto y en 10 minutos ya estas en zonas
                      de pesca productivas. Al volver, puedes limpiar las capturas y comer en los
                      restaurantes del puerto.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Variedad de especies</h3>
                    <p className="text-muted-foreground mb-4">
                      Las aguas frente a Blanes albergan una gran diversidad de especies. Cerca de la
                      costa encontraras lubinas, doradas, sargos y mojarras. Un poco mas lejos, en
                      aguas abiertas, serviolas, bonitos y dentones. En otono e invierno, la pesca
                      de calamares con potera es excelente.
                    </p>
                    <h3 className="font-semibold text-lg mb-3">Temporada extendida</h3>
                    <p className="text-muted-foreground">
                      Aunque la temporada de alquiler de barcos va de abril a octubre, cada mes tiene
                      sus propias oportunidades de pesca. Primavera para doradas, verano para serviolas,
                      otono para calamares y dentones. Siempre hay algo que pescar en Blanes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fish Species */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Fish className="w-6 h-6 text-primary" />
                  Especies que puedes pescar en Blanes
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fishSpecies.map((species) => (
                    <div key={species.name} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-2">{species.name}</h3>
                      <div className="grid sm:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-foreground">Temporada: </span>
                          <span className="text-muted-foreground">{species.season}</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Donde: </span>
                          <span className="text-muted-foreground">{species.where}</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Tecnica: </span>
                          <span className="text-muted-foreground">{species.technique}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Boats */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Anchor className="w-6 h-6 text-primary" />
                  Barcos recomendados para pesca
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {recommendedBoats.map((boat) => (
                    <div key={boat.type} className="border rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-2">{boat.type}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {boat.capacity}
                        </Badge>
                        <Badge variant="secondary">{boat.price}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{boat.autonomy}</p>
                      <ul className="space-y-1 mb-3">
                        {boat.advantages.map((adv, i) => (
                          <li key={i} className="flex items-center text-sm text-muted-foreground">
                            <ChevronRight className="w-4 h-4 text-primary mr-1 flex-shrink-0" />
                            {adv}
                          </li>
                        ))}
                      </ul>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium">{boat.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fishing Spots */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <MapPin className="w-6 h-6 text-primary" />
                  Zonas de pesca desde Blanes
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {fishingSpots.map((spot) => (
                    <div key={spot.name} className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <NavigationIcon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{spot.name}</h3>
                      <p className="text-muted-foreground text-sm mb-2">{spot.distance}</p>
                      <p className="text-sm text-primary font-medium mb-2">Objetivo: {spot.target}</p>
                      <p className="text-muted-foreground text-sm">{spot.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Regulations */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <AlertTriangle className="w-6 h-6 text-primary" />
                  Regulaciones y normativa de pesca
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Licencia de pesca obligatoria</h3>
                    <p className="text-muted-foreground mb-3">
                      Para pescar en el mar desde un barco necesitas la licencia de pesca recreativa
                      maritima de la Generalitat de Catalunya. Puedes obtenerla online en
                      gencat.cat por aproximadamente 14 EUR con validez de 2 anos.
                    </p>
                    <h3 className="font-semibold text-lg mb-3">Limites de captura</h3>
                    <ul className="space-y-1 text-muted-foreground">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Maximo 5 kg por persona y dia
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Si una pieza supera 5 kg, cuenta como cupo
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Maximo 2 canas por persona
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Tallas minimas principales</h3>
                    <ul className="space-y-1 text-muted-foreground">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Lubina: 36 cm
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Dorada: 20 cm
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Denton: 35 cm
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Serviola: 40 cm
                      </li>
                    </ul>
                    <h3 className="font-semibold text-lg mt-4 mb-3">Zonas prohibidas</h3>
                    <p className="text-muted-foreground">
                      Esta prohibido pescar en zonas de bano senalizadas, reservas marinas y dentro
                      de puertos. Respeta siempre las boyas de balizamiento y las zonas protegidas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bring Your Own Equipment */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Shield className="w-6 h-6 text-primary" />
                  Equipo de pesca: trae el tuyo
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Que traer</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Canas y carretes (spinning, jigging o fondo)
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Senuelos, plomos y anzuelos
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Cebo fresco (disponible en tiendas del puerto)
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Nevera con hielo para las capturas
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Alicates de pesca y cuchillo
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Donde comprar cebo en Blanes</h3>
                    <p className="text-muted-foreground mb-3">
                      Cerca del Puerto de Blanes hay varias tiendas nauticas donde puedes comprar
                      cebo fresco (gusano americano, gusano coreano, gamba) y material de pesca basico.
                      Recomendamos comprar el cebo el mismo dia de la salida para maxima frescura.
                    </p>
                    <h3 className="font-semibold text-lg mb-3">Recomendaciones</h3>
                    <p className="text-muted-foreground">
                      Lleva crema solar, agua abundante, gorra y gafas de sol polarizadas (ayudan a
                      ver peces en el agua). Una camiseta de manga larga te protege del sol durante
                      las horas de pesca. No olvides la licencia de pesca impresa o en el movil.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Internal Links */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Explora mas actividades y servicios</h3>
                <div className="flex flex-wrap gap-3">
                  <a href={localizedPath("categoryLicensed")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Barcos con licencia
                  </a>
                  <a href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Barcos sin licencia
                  </a>
                  <a href={localizedPath("activitySnorkel")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Excursion de snorkel
                  </a>
                  <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Precios y tarifas
                  </a>
                  <a href={localizedPath("locationBlanes")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Puerto de Blanes
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <HelpCircle className="w-6 h-6 text-primary" />
                  Preguntas frecuentes sobre pesca desde barco
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
                <h2 className="text-2xl font-bold mb-4">Reserva tu barco para pescar en Blanes</h2>
                <p className="text-lg mb-6 opacity-90">
                  Trae tu equipo, nosotros ponemos el barco. Lubinas, doradas, serviolas y mas
                  te esperan en las aguas de la Costa Brava. Salidas desde el Puerto de Blanes.
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
                  <a href={localizedPath("categoryLicensed")}>
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full">
                      <Anchor className="w-5 h-5 mr-2" />
                      Ver barcos con licencia
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <RelatedContent currentPage="activityFishing" />
      <Footer />
    </div>
  );
}
