import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Anchor,
  Clock,
  MapPin,
  Shield,
  Phone,
  Waves,
  FileText,
  CheckCircle,
  Euro,
  Calendar,
  Ship,
  ArrowLeftRight,
} from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useMemo, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { useTranslations } from "@/lib/translations";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";

// Category definitions: maps UI-stable category id → list of AccordionItem
// values with their matching fp.items key. The accordion `value` keys are
// kebab-case (stable URLs / testids); fp.items keys are camelCase (i18n).
//
// Everything below comes from t.faqPage.items, which is already translated
// to all 8 locales via npm run i18n:translate. Rich JSX bodies (bullets,
// inline CTAs) were replaced with plain-text answers — the SEO schema
// already used the plain text, so now UI and schema show the same content
// in the user's language.
interface CategoryDef {
  id: string;
  icon: ComponentType<{ className?: string }>;
  items: Array<{ value: string; fpKey: string }>;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "reservas",
    icon: Euro,
    items: [
      { value: "precios", fpKey: "precios" },
      { value: "reserva", fpKey: "reserva" },
      { value: "pago", fpKey: "pago" },
      { value: "cancelacion", fpKey: "cancelacion" },
      { value: "descuentos", fpKey: "descuentos" },
    ],
  },
  {
    id: "comparativas",
    icon: ArrowLeftRight,
    items: [
      { value: "diferencia-licencia", fpKey: "diferenciaLicencia" },
      { value: "precio-blanes-vs-lloret", fpKey: "precioBlanesVsLloret" },
      { value: "barco-grupo-grande", fpKey: "barcoGrupoGrande" },
      { value: "precio-costa-brava", fpKey: "precioCostaBrava" },
      { value: "blanes-tossa-barco", fpKey: "tossaBarco" },
      { value: "excursion-con-patron", fpKey: "excursionPatron" },
      { value: "seguro-sin-experiencia", fpKey: "seguroSinExperiencia" },
      { value: "barco-vs-excursion", fpKey: "barcoVsExcursion" },
      { value: "mejor-epoca", fpKey: "mejorEpoca" },
    ],
  },
  {
    id: "licencias",
    icon: Shield,
    items: [
      { value: "sin-licencia", fpKey: "sinLicencia" },
      { value: "con-licencia", fpKey: "licenciasAceptadas" },
      { value: "edad", fpKey: "edadMinima" },
      { value: "experiencia", fpKey: "experiencia" },
    ],
  },
  {
    id: "incluye",
    icon: CheckCircle,
    items: [
      { value: "incluido", fpKey: "queIncluye" },
      { value: "combustible", fpKey: "combustible" },
      { value: "extras", fpKey: "extras" },
      { value: "llevar", fpKey: "queLlevar" },
      { value: "comida-bebida", fpKey: "comidaBebida" },
    ],
  },
  {
    id: "navegacion",
    icon: Waves,
    items: [
      { value: "zona", fpKey: "porDondeNavegar" },
      { value: "seguridad", fpKey: "seguridad" },
      { value: "tiempo", fpKey: "malTiempo" },
      { value: "emergencia", fpKey: "emergencia" },
      { value: "fianza", fpKey: "fianza" },
      { value: "equipamiento-seguridad", fpKey: "equipoSeguridad" },
      { value: "hasta-donde", fpKey: "hastaDondeNavegar" },
    ],
  },
  {
    id: "practica",
    icon: Clock,
    items: [
      { value: "horarios", fpKey: "horarios" },
      { value: "llegada", fpKey: "llegadaPuerto" },
      { value: "parking", fpKey: "parking" },
      { value: "equipaje", fpKey: "equipaje" },
    ],
  },
  {
    id: "temporada",
    icon: Calendar,
    items: [
      { value: "temporada", fpKey: "temporada" },
      { value: "disponibilidad", fpKey: "disponibilidad" },
      { value: "antelacion", fpKey: "antelacion" },
    ],
  },
];

export default function FAQPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig("faq", language);
  const hreflangLinks = generateHreflangLinks("faq");
  const canonical = generateCanonicalUrl("faq", language);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: boats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqVars = useMemo(() => computeFaqVars(boats), [boats]);
  const sub = (text: string) => substituteFaqVars(text, faqVars);

  // Always defined at runtime: useTranslations deep-merges missing keys from es.ts.
  const fp = t.faqPage!;

  const handleWhatsAppContact = () => {
    openWhatsApp(fp.whatsappGenericMessage);
  };

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  // FAQ Schema for structured data — rendered from live i18n so edits to
  // es.ts propagate to all 8 locales automatically.
  const faqSchemaFromI18n = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "name": fp.schemaName,
    "description": fp.schemaDescription,
    "mainEntity": Object.values(fp.items).map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": substituteFaqVars(item.answer, faqVars),
      },
    })),
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.faq, url: "/faq" },
  ]);

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [faqSchemaFromI18n, breadcrumbSchema],
  };

  const filterButtons = [
    { id: "all", name: fp.categories.all, icon: FileText },
    ...CATEGORIES.map((cat) => ({ id: cat.id, name: fp.categories[cat.id] ?? cat.id, icon: cat.icon })),
  ];

  const shouldShowCategory = (categoryId: string) =>
    selectedCategory === "all" || selectedCategory === categoryId;

  return (
    <main id="main-content" className="min-h-screen">
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
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 pt-20 sm:pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Anchor className="w-8 h-8 text-primary mr-4" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
              {fp.heroTitle}
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-8 max-w-4xl mx-auto">
            {fp.heroDescription}
          </p>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="pt-6 pb-10 sm:pt-8 sm:pb-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">{fp.filterLabel}</h2>
            <div className="flex flex-wrap gap-2">
              {filterButtons.map(({ id, name, icon: Icon }) => (
                <Button
                  key={id}
                  variant={selectedCategory === id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(id)}
                  className="gap-2"
                  data-testid={`filter-${id}`}
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Category cards with Accordion items */}
          {CATEGORIES.filter((cat) => shouldShowCategory(cat.id)).map((cat) => {
            const Icon = cat.icon;
            return (
              <Card key={cat.id} className="mb-6 sm:mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Icon className="w-6 h-6 text-primary" />
                    {fp.categories[cat.id] ?? cat.id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {cat.items.map(({ value, fpKey }) => {
                      const item = (fp.items as Record<string, { question: string; answer: string } | undefined>)[fpKey];
                      if (!item) return null;
                      return (
                        <AccordionItem key={value} value={value} data-testid={`faq-${value}`}>
                          <AccordionTrigger>{sub(item.question)}</AccordionTrigger>
                          <AccordionContent>
                            <p className="whitespace-pre-line text-muted-foreground">
                              {sub(item.answer)}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}

          {/* Contact and Support */}
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Phone className="w-6 h-6 text-primary" />
                {fp.contactTitle ?? "¿Más Preguntas?"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{fp.contactDesc}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleWhatsAppContact}
                  className="gap-2 flex-1 bg-[#25D366] hover:bg-[#128C7E] active:bg-[#075E54] border-[#25D366]"
                  data-testid="button-whatsapp-questions"
                >
                  <SiWhatsapp className="w-5 h-5" />
                  {fp.contactWhatsApp ?? "Preguntar por WhatsApp"}
                </Button>
                <Button
                  onClick={handleBookingWhatsApp}
                  variant="outline"
                  className="gap-2 flex-1"
                  data-testid="button-direct-booking"
                >
                  <Anchor className="w-5 h-5" />
                  {fp.contactBooking ?? "Reservar Directamente"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="py-8 sm:py-12 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">{fp.infoPortTitle}</h3>
                <p className="text-muted-foreground text-sm">{fp.infoPortDesc}</p>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">{fp.infoSeasonTitle}</h3>
                <p className="text-muted-foreground text-sm">{fp.infoSeasonDesc}</p>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <Ship className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">{fp.infoFleetTitle}</h3>
                <p className="text-muted-foreground text-sm">{fp.infoFleetDesc}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
