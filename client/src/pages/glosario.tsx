import { useMemo, useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ChevronRight } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { H2, ON_NAVY_MUTED, PageHeader, Rise, Sheet } from "@/components/content-kit";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { LastUpdated } from "@/components/LastUpdated";
import {
  NAUTICAL_GLOSSARY_ES,
  generateGlossarySchema,
  generateBreadcrumbSchema,
} from "@/utils/seo-schemas";

const CATEGORY_ORDER = [
  "titulacion",
  "unidad",
  "accion",
  "parte",
  "equipamiento",
  "seguridad",
  "meteo",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\([^)]*\)/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function GlosarioPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const g = t.glossaryPage;
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Resolve the glossary source: prefer per-locale translated entries; fall back
  // to the Spanish canonical in seo-schemas.ts (kept as defensive baseline so a
  // missing i18n block never yields an empty page).
  const terms =
    g?.terms ??
    NAUTICAL_GLOSSARY_ES.map(entry => ({
      term: entry.term,
      definition: entry.definition,
      category: entry.category ?? "parte",
    }));

  const categoryLabel = (cat: string): string => {
    const labels = g?.categories;
    if (!labels) return cat;
    return (labels as Record<string, string>)[cat] ?? cat;
  };

  const groups = useMemo(() => {
    const byCategory = new Map<string, typeof terms>();
    for (const entry of terms) {
      const cat = entry.category ?? "parte";
      const existing = byCategory.get(cat) ?? [];
      existing.push(entry);
      byCategory.set(cat, existing);
    }
    return CATEGORY_ORDER.filter(cat => byCategory.has(cat)).map(cat => ({
      category: cat,
      terms: byCategory.get(cat)!,
    }));
  }, [terms]);

  const filteredTerms = useMemo(() => {
    if (selectedCategory === "all") return terms;
    return terms.filter(entry => entry.category === selectedCategory);
  }, [selectedCategory, terms]);

  const schema = useMemo(() => {
    const glossarySchema = generateGlossarySchema(t, language);
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: t.breadcrumbs.home, url: "/" },
      { name: g?.breadcrumbName ?? "Glosario Náutico", url: "/glosario" },
    ]);
    return {
      "@context": "https://schema.org",
      "@graph": [glossarySchema, breadcrumbSchema],
    };
  }, [t, g, language]);

  const introText = (g?.intro ?? "{count} términos esenciales...").replace(
    "{count}",
    String(terms.length)
  );

  const filterBtn = (active: boolean) =>
    cn(
      "min-h-11 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 motion-reduce:transition-none",
      active
        ? "border-foreground bg-foreground text-background"
        : "border-border text-muted-foreground [@media(hover:hover)]:hover:border-foreground/40 [@media(hover:hover)]:hover:text-foreground"
    );

  const renderTerms = (list: typeof terms) => (
    <dl className="overflow-hidden rounded-2xl border border-border bg-card">
      {list.map(entry => (
        <div
          key={slugify(entry.term)}
          id={slugify(entry.term)}
          className="grid gap-1 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-8 sm:px-6"
        >
          <dt className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {entry.term}
          </dt>
          <dd className="text-base leading-relaxed text-muted-foreground text-pretty">
            {entry.definition}
          </dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={
          g?.seo?.title ??
          "Glosario Náutico — Alquiler Barcos Costa Brava | Costa Brava Rent a Boat"
        }
        description={
          g?.seo?.description ??
          "Glosario de términos náuticos esenciales: LNB, PER, PNB, nudos, millas náuticas, eslora, fondear, calas y partes del barco. Diccionario práctico para alquilar un barco en Blanes."
        }
        keywords={
          g?.seo?.keywords ??
          "glosario nautico, que es LNB, que es PER, que es PNB, millas nauticas, nudos, eslora, fondear, glosario barcos"
        }
        canonical="https://www.costabravarentaboat.com/glosario"
        jsonLd={schema}
      />
      <Navigation />

      <main>
        <PageHeader title={g?.h1 ?? "Glosario Náutico"} subtitle={introText} next="background">
          <div className="mt-4 [&_p]:!text-primary-foreground/70 dark:[&_p]:!text-foreground/70">
            <LastUpdated date="2026-05-31" />
          </div>
        </PageHeader>

        <Sheet tone="background" next="muted">
          <div className="container mx-auto max-w-4xl px-4">
            {/* Breadcrumbs */}
            <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link href={`/${language}`} className="hover:text-foreground">
                {t.breadcrumbs.home}
              </Link>
              <ChevronRight className="mx-1 inline h-4 w-4" aria-hidden="true" />
              <span className="text-foreground">{g?.breadcrumbName ?? "Glosario Náutico"}</span>
            </nav>

            {/* Category filter */}
            <div className="mb-10 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                aria-pressed={selectedCategory === "all"}
                className={filterBtn(selectedCategory === "all")}
              >
                {g?.filterAll ?? "Todos"} ({terms.length})
              </button>
              {CATEGORY_ORDER.map(cat => {
                const count = terms.filter(entry => entry.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    aria-pressed={selectedCategory === cat}
                    className={filterBtn(selectedCategory === cat)}
                  >
                    {categoryLabel(cat)} ({count})
                  </button>
                );
              })}
            </div>

            {/* Terms list */}
            {selectedCategory === "all" ? (
              <div className="space-y-12">
                {groups.map(({ category, terms: catTerms }) => (
                  <section key={category} id={`cat-${category}`}>
                    <h2 className="mb-5 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                      {categoryLabel(category)}
                    </h2>
                    {renderTerms(catTerms)}
                  </section>
                ))}
              </div>
            ) : (
              renderTerms(filteredTerms)
            )}
          </div>
        </Sheet>

        {/* CTA: closes over the footer colour */}
        <Sheet tone="navy" next="foot" className="">
          <Rise className="container mx-auto max-w-3xl px-4 text-center">
            <h2 className={H2}>{g?.ctaTitle ?? "¿Listo para alquilar tu barco?"}</h2>
            <p
              className={`mx-auto mt-5 max-w-md text-base leading-relaxed text-pretty sm:text-lg ${ON_NAVY_MUTED}`}
            >
              {g?.ctaDesc ??
                "Ahora que dominas la terminología, elige tu barco sin licencia o con licencia para explorar la Costa Brava."}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <InteractiveHoverButton
                tone="light"
                as={Link}
                href={`/${language}`}
                className="min-h-12 px-8 text-base"
              >
                {g?.ctaFleet ?? "Ver la flota"}
              </InteractiveHoverButton>
              <Link
                href={`/${language}/faq`}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary-foreground/50 px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none dark:border-foreground/40 dark:text-foreground dark:hover:bg-foreground/10"
              >
                {g?.ctaFaq ?? "Preguntas frecuentes"}
              </Link>
            </div>
          </Rise>
        </Sheet>
      </main>

      <Footer />
    </div>
  );
}
