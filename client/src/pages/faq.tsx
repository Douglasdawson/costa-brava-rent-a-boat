import { ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { Fold, H2, PageHeader, PhotoBand, Rise, Sheet } from "@/components/content-kit";
import { useLanguage } from "@/hooks/use-language";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { useTranslations } from "@/lib/translations";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import { cn } from "@/lib/utils";

// Category definitions: maps UI-stable category id -> list of AccordionItem
// values with their matching fp.items key. The accordion `value` keys are
// kebab-case (stable URLs / testids); fp.items keys are camelCase (i18n).
//
// Everything below comes from t.faqPage.items, which is already translated
// to all 8 locales via npm run i18n:translate. Rich JSX bodies (bullets,
// inline CTAs) were replaced with plain-text answers -- the SEO schema
// already used the plain text, so now UI and schema show the same content
// in the user's language.
interface CategoryDef {
  id: string;
  items: Array<{ value: string; fpKey: string }>;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "reservas",
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
    items: [
      { value: "sin-licencia", fpKey: "sinLicencia" },
      { value: "normativa-2026", fpKey: "normativa2026" },
      { value: "titulin", fpKey: "titulin" },
      { value: "con-licencia", fpKey: "licenciasAceptadas" },
      { value: "edad", fpKey: "edadMinima" },
      { value: "experiencia", fpKey: "experiencia" },
    ],
  },
  {
    id: "incluye",
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
    items: [
      { value: "horarios", fpKey: "horarios" },
      { value: "llegada", fpKey: "llegadaPuerto" },
      { value: "parking", fpKey: "parking" },
      { value: "equipaje", fpKey: "equipaje" },
    ],
  },
  {
    id: "temporada",
    items: [
      { value: "temporada", fpKey: "temporada" },
      { value: "disponibilidad", fpKey: "disponibilidad" },
      { value: "antelacion", fpKey: "antelacion" },
    ],
  },
];

/**
 * The two answers that describe a guarantee get a link to /garantias. It is a
 * separate element and never markup inside the answer string: these answers
 * feed the FAQPage JSON-LD verbatim, so an inline <a> would ship as literal
 * tags in the structured data.
 */
const GUARANTEE_FAQ_VALUES = new Set(["tiempo", "fianza"]);

/**
 * Same pattern for the licensed-fleet answers: a separate link element to the
 * licensed category page (never markup inside the answer string, it feeds the
 * FAQPage JSON-LD verbatim).
 */
const LICENSED_FAQ_VALUES = new Set(["con-licencia", "diferencia-licencia", "blanes-tossa-barco"]);

export default function FAQPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig("faq", language);
  const hreflangLinks = generateHreflangLinks("faq");
  const canonical = generateCanonicalUrl("faq", language);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  // Born folded: no question open by default (answers stay in the DOM).
  const [openItem, setOpenItem] = useState<string | null>(null);

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

  // FAQ Schema for structured data -- rendered from live i18n so edits to
  // es.ts propagate to all 8 locales automatically.
  const faqSchemaFromI18n = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: fp.schemaName,
    description: fp.schemaDescription,
    mainEntity: Object.values(fp.items).map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: substituteFaqVars(item.answer, faqVars),
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
    { id: "all", name: fp.categories.all },
    ...CATEGORIES.map(cat => ({ id: cat.id, name: fp.categories[cat.id] ?? cat.id })),
  ];

  const shouldShowCategory = (categoryId: string) =>
    selectedCategory === "all" || selectedCategory === categoryId;

  const guaranteeLink =
    "mt-4 inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-semibold text-cta transition-colors hover:text-cta/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

  const infoItems = [
    { title: fp.infoPortTitle, desc: fp.infoPortDesc },
    { title: fp.infoSeasonTitle, desc: fp.infoSeasonDesc },
    { title: fp.infoFleetTitle, desc: fp.infoFleetDesc },
  ];

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
      <ReadingProgressBar />

      <PageHeader title={fp.heroTitle} subtitle={fp.heroDescription} next="background" />

      {/* FILTER + FAQ: one ruled panel per category, every question folded */}
      <Sheet tone="background" next="muted">
        <div className="container mx-auto max-w-4xl px-4">
          <Rise>
            <p className="text-sm font-medium text-muted-foreground">{fp.filterLabel}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {filterButtons.map(({ id, name }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedCategory(id)}
                  aria-pressed={selectedCategory === id}
                  data-testid={`filter-${id}`}
                  className={cn(
                    "min-h-11 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 motion-reduce:transition-none",
                    selectedCategory === id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground [@media(hover:hover)]:hover:border-foreground/40 [@media(hover:hover)]:hover:text-foreground"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </Rise>

          <div className="mt-12 space-y-12">
            {CATEGORIES.filter(cat => shouldShowCategory(cat.id)).map(cat => (
              <Rise key={cat.id}>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  {fp.categories[cat.id] ?? cat.id}
                </h2>
                <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
                  {cat.items.map(({ value, fpKey }) => {
                    const item = (
                      fp.items as Record<string, { question: string; answer: string } | undefined>
                    )[fpKey];
                    if (!item) return null;
                    return (
                      <Fold
                        key={value}
                        id={`faq-${value}`}
                        testId={`faq-${value}`}
                        flat
                        title={sub(item.question)}
                        open={openItem === value}
                        onToggle={() => setOpenItem(openItem === value ? null : value)}
                      >
                        <p className="max-w-prose whitespace-pre-line">{sub(item.answer)}</p>
                        {GUARANTEE_FAQ_VALUES.has(value) && (
                          <a
                            href={localizedPath("garantias")}
                            data-testid={`faq-garantias-link-${value}`}
                            className={guaranteeLink}
                          >
                            {t.garantiasPage.navLabel}
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        )}
                        {LICENSED_FAQ_VALUES.has(value) && (
                          <a
                            href={localizedPath("categoryLicensed")}
                            data-testid={`faq-licensed-link-${value}`}
                            className={guaranteeLink}
                          >
                            {t.categoryLicensed!.faqCrossLinkLabel}
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </Fold>
                    );
                  })}
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </Sheet>

      <PhotoBand
        tone="muted"
        next="background"
        webp="/images/blog/familias-barco.webp"
        src="/images/blog/familias-barco.jpg"
        alt="Families enjoying a boat trip on the Costa Brava"
      />

      {/* CONTACT */}
      <Sheet tone="background" next="muted">
        <Rise className="container mx-auto max-w-4xl px-4">
          <h2 className={H2}>{fp.contactTitle ?? "Mas Preguntas?"}</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
            {fp.contactDesc}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <InteractiveHoverButton
              tone="dark"
              onClick={handleWhatsAppContact}
              className="min-h-12 px-8 text-base"
              data-testid="button-whatsapp-questions"
            >
              {fp.contactWhatsApp ?? "Preguntar por WhatsApp"}
            </InteractiveHoverButton>
            <button
              type="button"
              onClick={handleBookingWhatsApp}
              data-testid="button-direct-booking"
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-border px-6 text-base font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              {fp.contactBooking ?? "Reservar Directamente"}
            </button>
          </div>
        </Rise>
      </Sheet>

      {/* QUICK INFO: three facts as one ruled strip */}
      <Sheet tone="muted" next="foot">
        <Rise className="container mx-auto max-w-6xl px-4">
          <dl className="grid overflow-hidden rounded-2xl border border-border bg-background md:grid-cols-3">
            {infoItems.map(item => (
              <div
                key={item.title}
                className="border-b border-border p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <dt className="font-heading text-lg font-semibold tracking-tight">{item.title}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {item.desc}
                </dd>
              </div>
            ))}
          </dl>
        </Rise>
      </Sheet>

      <Footer />
    </main>
  );
}
