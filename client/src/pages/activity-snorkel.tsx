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
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { FAQSection } from "@/components/FAQSection";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import React from "react";

// Icons paired by position to the `spots` array in t.activitySnorkel.
const SPOT_ICONS = [Star, Eye, Fish];

const faqsFallback: Array<{ question: string; answer: string }> = [];

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform,filter] duration-700 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"} ${className}`}>
      {children}
    </div>
  );
}

export default function ActivitySnorkelPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const faqs = t.activitySnorkel?.faqItems ?? faqsFallback;
  const snorkelSpots = (t.activitySnorkel?.spots ?? []).map((spot, i) => ({
    ...spot,
    icon: SPOT_ICONS[i] ?? Star,
  }));
  const recommendedBoats = t.activitySnorkel?.recommendedBoats ?? [];
  const depthLabel = t.activitySnorkel?.depthLabel ?? 'Profundidad:';
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
      <ReadingProgressBar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Waves className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                Excursion de Snorkel en Barco desde Blanes
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto leading-relaxed">
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

      {/* Why Snorkel from a Boat */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-8">
            <Star className="w-6 h-6 text-cta" />
            Por que hacer snorkel desde un barco
          </h2>
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">Acceso a calas inaccesibles</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Las mejores calas para snorkel en la Costa Brava no tienen acceso por carretera
                    o requieren caminatas largas. Desde el barco llegas directamente, fondeas a pocos
                    metros de la orilla y te tiras al agua. Sin aglomeraciones, sin caminar con el
                    equipo al sol.
                  </p>
                  <h3 className="font-heading font-semibold text-lg mb-3">Tu propia base flotante</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    El barco es tu punto de referencia en el agua. Puedes dejar toallas, comida y
                    bebida a bordo. Descansas entre inmersiones, te secas al sol en cubierta y
                    cuando quieres, cambias de cala en minutos.
                  </p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">Multiples spots en una salida</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    En una salida de 3-4 horas puedes visitar 2-3 calas diferentes. Cada una tiene
                    un ecosistema distinto: praderas de posidonia, fondos rocosos, paredes verticales.
                    Es como hacer tres excursiones de snorkel en una sola.
                  </p>
                  <h3 className="font-heading font-semibold text-lg mb-3">Sin necesidad de experiencia</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    No necesitas licencia de navegacion para nuestros barcos sin licencia. Te damos
                    una formacion de 15 minutos en el puerto. El snorkel es la actividad acuatica
                    mas accesible: solo necesitas mascara, tubo y ganas de descubrir.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-amigos-snorkel.webp"
                alt="Friends enjoying snorkeling from a rented boat"
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                width={640}
                height={800}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Photo break */}
      <div className="w-full overflow-hidden">
        <img
          src="/images/blog/snorkel-mar.jpg"
          alt="Snorkeling in the crystal-clear waters of Costa Brava"
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* Best Snorkel Spots */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-8">
            <MapPin className="w-6 h-6 text-primary" />
            Mejores calas para snorkel cerca de Blanes
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {snorkelSpots.map((spot) => {
              const Icon = spot.icon;
              return (
                <div key={spot.name} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{spot.name}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{spot.distance}</p>
                  <p className="text-sm text-primary font-medium mb-2">{depthLabel} {spot.depth}</p>
                  <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{spot.highlights}</p>
                  <p className="text-sm font-medium text-foreground">{spot.ideal}</p>
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* Equipment Section */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-8">
            <Anchor className="w-6 h-6 text-primary" />
            Equipo de snorkel incluido y disponible
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">Incluido con todos los barcos</h3>
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
              <h3 className="font-heading font-semibold text-lg mb-3">Alquiler adicional: 7,50 EUR/persona</h3>
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
        </div>
      </RevealSection>

      {/* Recommended Boats */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-8">
            <Users className="w-6 h-6 text-primary" />
            Barcos recomendados para snorkel
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {recommendedBoats.map((boat) => (
              <div key={boat.name} className="border rounded-lg p-6">
                <h3 className="font-heading font-semibold text-lg mb-2">{boat.name}</h3>
                <div className="flex gap-3 mb-3">
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {boat.duration}
                  </Badge>
                  <Badge variant="secondary">{boat.price}</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">{boat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Suggested Route */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-8">
            <Sun className="w-6 h-6 text-cta" />
            Ruta de snorkel recomendada (3 horas)
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="font-heading font-semibold">Puerto de Blanes - Salida</h3>
                <p className="text-muted-foreground leading-relaxed">Formacion de 15 minutos, recogida de equipo de snorkel. Salida hacia el norte por la costa.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="font-heading font-semibold">Cala Bona - Primera parada (45 min)</h3>
                <p className="text-muted-foreground leading-relaxed">Fondear y snorkel entre formaciones rocosas. Busca pulpos entre las grietas y observa los bancos de castanolas.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="font-heading font-semibold">Cala Sant Francesc - Segunda parada (45 min)</h3>
                <p className="text-muted-foreground leading-relaxed">La joya de la corona. Pradera de posidonia con sargos, obladas y estrellas de mar. Agua cristalina y fondo de arena blanca.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
              <div>
                <h3 className="font-heading font-semibold">Regreso al Puerto de Blanes</h3>
                <p className="text-muted-foreground leading-relaxed">Navegacion de vuelta disfrutando de las vistas de la costa. Devolucion del equipo de snorkel en el puerto.</p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Internal Links */}
      <div className="py-8 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="font-heading font-semibold text-lg mb-4">Explora mas actividades y servicios</h3>
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
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-heading font-bold mb-4 text-white">Reserva tu excursion de snorkel desde Blanes</h2>
          <p className="text-lg mb-6 text-white/90 leading-relaxed">
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
        </div>
      </div>

      {/* FAQ Section */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-8">
            Preguntas frecuentes sobre snorkel en barco
          </h2>
          <FAQSection items={faqs} />
        </div>
      </RevealSection>

      <RelatedContent currentPage="activitySnorkel" />
      <Footer />
    </div>
  );
}
