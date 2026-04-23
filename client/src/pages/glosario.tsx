import { useMemo, useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Anchor, BookOpen, ChevronRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  NAUTICAL_GLOSSARY_ES,
  generateGlossarySchema,
  generateBreadcrumbSchema,
} from "@/utils/seo-schemas";

// Pictograms per category — language-invariant, so they stay hardcoded
// next to the category order. Labels come from i18n (t.glossaryPage.categories).
const CATEGORY_ICONS: Record<string, string> = {
  titulacion: "🎓",
  unidad: "📏",
  accion: "⚓",
  parte: "🚤",
  equipamiento: "🧰",
};

const CATEGORY_ORDER = ["titulacion", "unidad", "accion", "parte", "equipamiento"];

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
  const terms = g?.terms ?? NAUTICAL_GLOSSARY_ES.map((entry) => ({
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
    return CATEGORY_ORDER
      .filter((cat) => byCategory.has(cat))
      .map((cat) => ({ category: cat, terms: byCategory.get(cat)! }));
  }, [terms]);

  const filteredTerms = useMemo(() => {
    if (selectedCategory === "all") return terms;
    return terms.filter((entry) => entry.category === selectedCategory);
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

  const introText = (g?.intro ?? '{count} términos esenciales...').replace('{count}', String(terms.length));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={g?.seo?.title ?? "Glosario Náutico — Alquiler Barcos Costa Brava | Costa Brava Rent a Boat"}
        description={g?.seo?.description ?? "Glosario de términos náuticos esenciales: LBN, PER, PNB, nudos, millas náuticas, eslora, fondear, calas y partes del barco. Diccionario práctico para alquilar un barco en Blanes."}
        keywords={g?.seo?.keywords ?? "glosario nautico, que es LBN, que es PER, que es PNB, millas nauticas, nudos, eslora, fondear, glosario barcos"}
        canonical="https://www.costabravarentaboat.com/glosario"
        jsonLd={schema}
      />
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link href={`/${language}`} className="hover:text-foreground">{t.breadcrumbs.home}</Link>
            <ChevronRight className="inline w-4 h-4 mx-1" />
            <span className="text-foreground">{g?.breadcrumbName ?? "Glosario Náutico"}</span>
          </nav>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-4">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight mb-4">
              {g?.h1 ?? "Glosario Náutico"}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              {introText}
            </p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {g?.filterAll ?? "Todos"} ({terms.length})
            </button>
            {CATEGORY_ORDER.map((cat) => {
              const count = terms.filter((entry) => entry.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    selectedCategory === cat
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <span className="mr-1.5">{CATEGORY_ICONS[cat]}</span>
                  {categoryLabel(cat)} ({count})
                </button>
              );
            })}
          </div>

          {/* Terms list */}
          {selectedCategory === "all" ? (
            <div className="space-y-10">
              {groups.map(({ category, terms: catTerms }) => (
                <section key={category} id={`cat-${category}`}>
                  <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span>{CATEGORY_ICONS[category]}</span>
                    <span>{categoryLabel(category)}</span>
                  </h2>
                  <dl className="space-y-5">
                    {catTerms.map((entry) => (
                      <div
                        key={slugify(entry.term)}
                        id={slugify(entry.term)}
                        className="border-l-4 border-border hover:border-primary/40 pl-4 py-1 transition-colors"
                      >
                        <dt className="font-heading font-semibold text-foreground text-lg mb-1">
                          {entry.term}
                        </dt>
                        <dd className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                          {entry.definition}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          ) : (
            <dl className="space-y-5">
              {filteredTerms.map((entry) => (
                <div
                  key={slugify(entry.term)}
                  id={slugify(entry.term)}
                  className="border-l-4 border-border hover:border-primary/40 pl-4 py-1 transition-colors"
                >
                  <dt className="font-heading font-semibold text-foreground text-lg mb-1">
                    {entry.term}
                  </dt>
                  <dd className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {entry.definition}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {/* CTA footer */}
          <div className="mt-16 text-center bg-muted/30 rounded-2xl p-8 sm:p-12">
            <Anchor className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              {g?.ctaTitle ?? "¿Listo para alquilar tu barco?"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {g?.ctaDesc ?? "Ahora que dominas la terminología, elige tu barco sin licencia o con licencia para explorar la Costa Brava."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/${language}`}
                className="bg-cta hover:bg-cta/90 text-white px-8 py-3 rounded-full font-medium inline-block"
              >
                {g?.ctaFleet ?? "Ver la flota"}
              </Link>
              <Link
                href={`/${language}/faq`}
                className="border border-border text-foreground hover:border-foreground/30 px-8 py-3 rounded-full font-medium inline-block"
              >
                {g?.ctaFaq ?? "Preguntas frecuentes"}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
