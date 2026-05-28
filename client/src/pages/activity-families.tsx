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
import { useTranslations } from "@/lib/translations";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { FAQSection } from "@/components/FAQSection";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// Icons paired by position to the i18n arrays.
const SAFETY_ICONS = [Shield, Star, Anchor, Waves];

const faqsFallback: Array<{ question: string; answer: string }> = [];

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform,filter] duration-700 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"} ${className}`}>
      {children}
    </div>
  );
}

export default function ActivityFamiliesPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const f = t.activityFamilies;
  const faqs = f?.faqItems ?? faqsFallback;
  const safetyFeatures = (f?.safetyFeatures ?? []).map((feat, i) => ({
    ...feat,
    icon: SAFETY_ICONS[i] ?? Shield,
  }));
  const familyRoutes = f?.familyRoutes ?? [];
  const seoConfig = getSEOConfig('activityFamilies', language);
  const hreflangLinks = generateHreflangLinks('activityFamilies');
  const canonical = generateCanonicalUrl('activityFamilies', language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
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
    "name": "Excursion Familiar en Barco desde Blanes",
    "description": "Alquiler de barco sin licencia desde el Puerto de Blanes para familias con ninos. Navegacion a calas tranquilas y aguas cristalinas en la Costa Brava Sur. Briefing de seguridad 15 min. Chalecos salvavidas infantiles incluidos.",
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
        "description": "Barco sin licencia para 4-5 personas, 4h, gasolina + chalecos ninos + kit seguridad incluido.",
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
      <ReadingProgressBar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {f?.heroTitle ?? "Alquiler de Barco para Familias en Costa Brava"}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto leading-relaxed">
              {f?.heroDescription ?? "Una aventura segura y divertida para toda la familia. Barcos sin licencia desde el Puerto de Blanes con gasolina incluida, chalecos infantiles y calas protegidas perfectas para niños. Desde 70 EUR/hora."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Shield className="w-4 h-4 mr-2" />
                {f?.badgeNoLicense ?? "Sin licencia necesaria"}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Baby className="w-4 h-4 mr-2" />
                {f?.badgeKidsVests ?? "Chalecos infantiles incluidos"}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Sun className="w-4 h-4 mr-2" />
                {f?.badgeFuel ?? "Gasolina incluida"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Why Perfect for Families */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-10">
            <Star className="w-6 h-6 text-primary" />
            {f?.whyTitle ?? "Por qué es perfecto para familias"}
          </h2>
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <h3 className="font-heading font-semibold text-lg mb-3">{f?.whyMemoriesTitle ?? "Una experiencia que recordarán siempre"}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {f?.whyMemoriesDesc ?? "Alquilar un barco en familia es mucho más que un paseo por el mar. Es descubrir calas escondidas juntos, ver peces bajo el agua, hacer un picnic flotando en aguas turquesas y crear recuerdos que los niños contarán durante años. En la Costa Brava, la costa entre Blanes y Lloret ofrece el escenario perfecto."}
              </p>
              <h3 className="font-heading font-semibold text-lg mb-3">{f?.whyNoStressTitle ?? "Sin estrés, sin complicaciones"}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {f?.whyNoStressDesc ?? "No necesitas experiencia previa ni licencia de navegación. Te enseñamos todo en 15 minutos. Los barcos son estables, fáciles de manejar y tienen velocidad limitada. La gasolina está incluida, así que no hay sorpresas con el precio. Solo necesitas venir con ganas de pasarlo bien."}
              </p>
              <h3 className="font-heading font-semibold text-lg mb-3">{f?.whyCalmCovesTitle ?? "Calas tranquilas para niños"}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {f?.whyCalmCovesDesc ?? "Recomendamos calas protegidas con agua poco profunda y sin oleaje. Cala Sant Francesc tiene fondo de arena ideal para que los niños se bañen con seguridad. Cala Bona ofrece aguas cristalinas perfectas para primeras experiencias de snorkel."}
              </p>
              <h3 className="font-heading font-semibold text-lg mb-3">{f?.whyFlexTitle ?? "Flexibilidad total"}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {f?.whyFlexDesc ?? "Tú decides el ritmo. Si los niños quieren quedarse más tiempo en una cala, sin problema. Si alguien se cansa, volvemos. No hay horarios fijos ni rutas obligatorias. Es vuestro barco, vuestro plan, vuestro día en el mar."}
              </p>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/remus-450/alquiler-barco-remus-450-rent-a-boat-costa-brava-blanes-familia-navegando.webp"
                alt="Family navigating a boat along the Costa Brava coast"
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                width={640}
                height={800}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Photo Break */}
      <div className="w-full overflow-hidden">
        <img
          src="/images/blog/familias-barco.jpg"
          alt="Families enjoying a day on the water in Costa Brava"
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* Safety Features */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-10">
            <Shield className="w-6 h-6 text-primary" />
            {f?.safetyTitle ?? "Seguridad para toda la familia"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {safetyFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* Family Routes */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-10">
            <MapPin className="w-6 h-6 text-primary" />
            {f?.routesTitle ?? "Itinerarios recomendados para familias"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {familyRoutes.map((route) => (
              <div key={route.name} className="border rounded-lg p-6">
                <h3 className="font-heading font-semibold text-lg mb-3">{route.name}</h3>
                <Badge variant="secondary" className="mb-3">{route.price}</Badge>
                <div className="mb-3">
                  <p className="text-sm font-medium text-foreground mb-1">{f?.stopsLabel ?? "Paradas:"}</p>
                  <div className="flex flex-wrap gap-2">
                    {route.stops.map((stop, i) => (
                      <span key={i} className="text-sm text-muted-foreground">
                        {stop}{i < route.stops.length - 1 ? " \u2192 " : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground mb-3 leading-relaxed">{route.description}</p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">{f?.tipLabel ?? "Consejo:"} {route.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* What to Bring */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-10">
            <Users className="w-6 h-6 text-primary" />
            {f?.whatToBringTitle ?? "Qué llevar para un día en barco con niños"}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-heading font-semibold mb-3">{f?.essentialTitle ?? "Imprescindible"}</h3>
              <ul className="space-y-2 text-muted-foreground">
                {(f?.essentialItems ?? ["Crema solar SPF 50+ waterproof", "Agua abundante (mínimo 1L por persona)", "Gorras o sombreros para el sol", "Toallas"]).map((item) => (
                  <li key={item} className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-3">{f?.recommendedTitle ?? "Recomendado"}</h3>
              <ul className="space-y-2 text-muted-foreground">
                {(f?.recommendedItems ?? ["Snacks o picnic preparado", "Camisetas UV para niños", "Gafas de sol con cordón", "Ropa seca para el regreso"]).map((item) => (
                  <li key={item} className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-3">{f?.optionalTitle ?? "Opcional"}</h3>
              <ul className="space-y-2 text-muted-foreground">
                {(f?.optionalItems ?? ["Cámara acuática o funda móvil", "Equipo de snorkel propio", "Nevera pequeña con hielo", "Juguetes de playa hinchables"]).map((item) => (
                  <li key={item} className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Internal Links */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="font-heading font-semibold text-lg mb-4">{f?.exploreTitle ?? "Descubre más sobre nuestros servicios"}</h3>
          <div className="flex flex-wrap gap-3">
            <a href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              {f?.linkNoLicense ?? "Barcos sin licencia"}
            </a>
            <a href={localizedPath("activitySnorkel")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              {f?.linkSnorkel ?? "Excursión de snorkel"}
            </a>
            <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              {f?.linkPrices ?? "Precios y tarifas"}
            </a>
            <a href={localizedPath("locationBlanes")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              {f?.linkBlanes ?? "Puerto de Blanes"}
            </a>
            <a href={localizedPath("routes")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              {f?.linkRoutes ?? "Rutas marítimas"}
            </a>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-4 text-white">{f?.ctaTitle ?? "Reserva un barco para toda la familia"}</h2>
          <p className="text-lg mb-6 text-white/90 leading-relaxed">
            {f?.ctaDescription ?? "Barcos seguros, fáciles de manejar y con todo incluido. El plan perfecto para un día en familia en la Costa Brava. Salidas desde el Puerto de Blanes de abril a octubre."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleBookingWhatsApp}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {f?.ctaWhatsApp ?? "Reservar por WhatsApp"}
            </Button>
            <a href={localizedPath("categoryLicenseFree")}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full">
                <Anchor className="w-5 h-5 mr-2" />
                {f?.ctaViewBoats ?? "Ver barcos sin licencia"}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-10">
            <HelpCircle className="w-6 h-6 text-primary" />
            {f?.faqTitle ?? "Preguntas frecuentes sobre barcos para familias"}
          </h2>
          <FAQSection items={faqs} />
        </div>
      </RevealSection>

      <RelatedContent currentPage="activityFamilies" />
      <Footer />
    </div>
  );
}
