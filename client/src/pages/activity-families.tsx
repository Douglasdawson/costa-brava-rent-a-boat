import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  Anchor,
  Shield,
  Star,
  Heart,
  Sun,
  Waves,
  ChevronRight,
  HelpCircle,
  MessageCircle,
  Baby,
  MapPin
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";

const safetyFeatures = [
  {
    title: "Chalecos salvavidas infantiles",
    description: "Todos los barcos llevan chalecos homologados para ninos de todas las edades y tallas. Es obligatorio que los menores los lleven puestos durante la navegacion.",
    icon: Shield
  },
  {
    title: "Formacion de seguridad completa",
    description: "Antes de salir, dedicamos 15 minutos a ensenar el manejo del barco, las zonas de navegacion seguras y las normas basicas. Resolvemos todas las dudas antes de zarpar.",
    icon: Star
  },
  {
    title: "Barcos estables y faciles de manejar",
    description: "Nuestros barcos sin licencia tienen casco de fibra de vidrio con gran estabilidad. Motor de baja potencia, velocidad controlada y facil manejo incluso para novatos.",
    icon: Anchor
  },
  {
    title: "Zona de navegacion protegida",
    description: "La costa entre Blanes y Lloret ofrece calas protegidas del oleaje. Recomendamos calas tranquilas donde los ninos pueden banarse con seguridad.",
    icon: Waves
  }
];

const familyRoutes = [
  {
    name: "Ruta familiar corta (2 horas)",
    stops: ["Puerto de Blanes", "Cala Sant Francesc", "Regreso"],
    description: "Ideal para familias con ninos pequenos. Navegacion corta hasta una cala protegida con agua poco profunda y cristalina. Tiempo para banarse, hacer snorkel suave y picnic a bordo.",
    price: "Desde 140 EUR (70 EUR/h)",
    tip: "Perfecta para una primera experiencia en barco con ninos. La cala tiene zona de arena y agua tranquila."
  },
  {
    name: "Ruta familiar completa (4 horas)",
    stops: ["Puerto de Blanes", "Cala Bona", "Cala Sant Francesc", "Playa de Fenals", "Regreso"],
    description: "La experiencia completa para familias. Tres paradas con tiempo suficiente para explorar cada cala. Combina bano, snorkel, picnic y vistas espectaculares de la costa.",
    price: "Desde 280 EUR (70 EUR/h)",
    tip: "Recomendada para ninos a partir de 4 anos. Llevar comida, agua, crema solar y gorras."
  }
];

const faqs = [
  {
    question: "A partir de que edad pueden subir los ninos al barco?",
    answer: "No hay edad minima. Bebes y ninos de cualquier edad son bienvenidos. Todos los menores deben llevar chaleco salvavidas homologado durante la navegacion. Para bebes recomendamos salidas cortas de 1-2 horas y elegir dias con mar en calma."
  },
  {
    question: "Necesito licencia de navegacion para alquilar un barco familiar?",
    answer: "No. Nuestros barcos sin licencia no requieren ningun titulo nautico. Solo necesitas ser mayor de 18 anos. Te damos una formacion completa de 15 minutos antes de salir. Son barcos seguros, estables y muy faciles de manejar."
  },
  {
    question: "Que incluye el precio del alquiler?",
    answer: "El precio de los barcos sin licencia incluye gasolina, seguro, chalecos salvavidas para todos (incluidos infantiles), escalera de bano, toldo/bimini para sombra y la formacion de seguridad. Solo el equipo de snorkel es adicional (7,50 EUR/persona)."
  },
  {
    question: "Que debemos llevar para una salida en barco con ninos?",
    answer: "Recomendamos llevar: crema solar de alta proteccion (waterproof), gorras o sombreros, agua abundante, snacks o picnic, toallas, ropa de bano y una muda de ropa seca. Opcional: camara acuatica, juguetes de playa y equipo de snorkel propio."
  }
];

export default function ActivityFamiliesPage() {
  const { language, localizedPath } = useLanguage();
  const seoConfig = getSEOConfig('activityFamilies', language);
  const hreflangLinks = generateHreflangLinks('activityFamilies');
  const canonical = generateCanonicalUrl('activityFamilies', language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Barco para Familias", url: "/barco-familias-costa-brava" }
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
    "name": "Excursión Familiar en Barco desde Blanes",
    "description": "Alquiler de barco sin licencia desde el Puerto de Blanes para familias con niños. Navegación a calas tranquilas y aguas cristalinas en la Costa Brava Sur. Briefing de seguridad 15 min. Chalecos salvavidas infantiles incluidos.",
    "touristType": ["Family", "Beach", "Nature"],
    "inLanguage": ["es-ES", "en-GB", "ca-ES", "fr-FR", "de-DE", "nl-NL", "it-IT", "ru-RU"],
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://www.costabravarentaboat.com/#organization",
      "name": "Costa Brava Rent a Boat",
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Pack familia 4h (hasta 5 personas)",
        "price": "150",
        "priceCurrency": "EUR",
        "priceValidUntil": "2026-10-31",
        "availability": "https://schema.org/InStock",
        "url": canonical,
        "description": "Barco sin licencia para 4-5 personas, 4h, gasolina + chalecos niños + kit seguridad incluido.",
      },
    ],
    "maximumAttendeeCapacity": 7,
    "isFamilyFriendly": true,
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
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 pt-8 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-primary mr-4" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                  Alquiler de Barco para Familias en Costa Brava
                </h1>
              </div>
              <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
                Una aventura segura y divertida para toda la familia. Barcos sin licencia desde el Puerto
                de Blanes con gasolina incluida, chalecos infantiles y calas protegidas perfectas para ninos.
                Desde 70 EUR/hora.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge variant="outline" className="text-primary border-primary">
                  <Shield className="w-4 h-4 mr-2" />
                  Sin licencia necesaria
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Baby className="w-4 h-4 mr-2" />
                  Chalecos infantiles incluidos
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Sun className="w-4 h-4 mr-2" />
                  Gasolina incluida
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-12 bg-muted">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Why Perfect for Families */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Star className="w-6 h-6 text-cta" />
                  Por que es perfecto para familias
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Una experiencia que recordaran siempre</h3>
                    <p className="text-muted-foreground mb-4">
                      Alquilar un barco en familia es mucho mas que un paseo por el mar. Es descubrir
                      calas escondidas juntos, ver peces bajo el agua, hacer un picnic flotando en aguas
                      turquesas y crear recuerdos que los ninos contaran durante anos. En la Costa Brava,
                      la costa entre Blanes y Lloret ofrece el escenario perfecto.
                    </p>
                    <h3 className="font-semibold text-lg mb-3">Sin estres, sin complicaciones</h3>
                    <p className="text-muted-foreground">
                      No necesitas experiencia previa ni licencia de navegacion. Te ensenamos todo en
                      15 minutos. Los barcos son estables, faciles de manejar y tienen velocidad limitada.
                      La gasolina esta incluida, asi que no hay sorpresas con el precio. Solo necesitas
                      venir con ganas de pasarlo bien.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Calas tranquilas para ninos</h3>
                    <p className="text-muted-foreground mb-4">
                      Recomendamos calas protegidas con agua poco profunda y sin oleaje. Cala Sant Francesc
                      tiene fondo de arena ideal para que los ninos se banen con seguridad. Cala Bona
                      ofrece aguas cristalinas perfectas para primeras experiencias de snorkel.
                    </p>
                    <h3 className="font-semibold text-lg mb-3">Flexibilidad total</h3>
                    <p className="text-muted-foreground">
                      Tu decides el ritmo. Si los ninos quieren quedarse mas tiempo en una cala, sin
                      problema. Si alguien se cansa, volvemos. No hay horarios fijos ni rutas obligatorias.
                      Es vuestro barco, vuestro plan, vuestro dia en el mar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Features */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Shield className="w-6 h-6 text-primary" />
                  Seguridad para toda la familia
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {safetyFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.title} className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Family Routes */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <MapPin className="w-6 h-6 text-primary" />
                  Itinerarios recomendados para familias
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {familyRoutes.map((route) => (
                    <div key={route.name} className="border rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-3">{route.name}</h3>
                      <Badge variant="secondary" className="mb-3">{route.price}</Badge>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground mb-1">Paradas:</p>
                        <div className="flex flex-wrap gap-2">
                          {route.stops.map((stop, i) => (
                            <span key={i} className="text-sm text-muted-foreground">
                              {stop}{i < route.stops.length - 1 ? " → " : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-3">{route.description}</p>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium">Consejo: {route.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What to Bring */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Users className="w-6 h-6 text-primary" />
                  Que llevar para un dia en barco con ninos
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Imprescindible</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Crema solar SPF 50+ waterproof
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Agua abundante (minimo 1L por persona)
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Gorras o sombreros para el sol
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Toallas
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Recomendado</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Snacks o picnic preparado
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Camisetas UV para ninos
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Gafas de sol con cordon
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Ropa seca para el regreso
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Opcional</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Camara acuatica o funda movil
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Equipo de snorkel propio
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Nevera pequena con hielo
                      </li>
                      <li className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        Juguetes de playa hinchables
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Internal Links */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Descubre mas sobre nuestros servicios</h3>
                <div className="flex flex-wrap gap-3">
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
                  Preguntas frecuentes sobre barcos para familias
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
                <h2 className="text-2xl font-bold mb-4">Reserva un barco para toda la familia</h2>
                <p className="text-lg mb-6 opacity-90">
                  Barcos seguros, faciles de manejar y con todo incluido. El plan perfecto para un dia
                  en familia en la Costa Brava. Salidas desde el Puerto de Blanes de abril a octubre.
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
                      Ver barcos sin licencia
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <RelatedContent currentPage="activityFamilies" />
      <Footer />
    </div>
  );
}
