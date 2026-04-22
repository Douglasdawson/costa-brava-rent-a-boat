import { useMemo, useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Anchor, BookOpen, ChevronRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import {
  NAUTICAL_GLOSSARY_ES,
  type GlossaryTerm,
  generateGlossarySchema,
  generateBreadcrumbSchema,
} from "@/utils/seo-schemas";

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  titulacion: { label: "Titulaciones", icon: "🎓" },
  unidad: { label: "Unidades de medida", icon: "📏" },
  accion: { label: "Acciones", icon: "⚓" },
  parte: { label: "Partes del barco y costa", icon: "🚤" },
  equipamiento: { label: "Equipamiento", icon: "🧰" },
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Group terms by category
  const groups = useMemo(() => {
    const byCategory = new Map<string, GlossaryTerm[]>();
    for (const t of NAUTICAL_GLOSSARY_ES) {
      const cat = t.category ?? "parte";
      const existing = byCategory.get(cat) ?? [];
      existing.push(t);
      byCategory.set(cat, existing);
    }
    return CATEGORY_ORDER
      .filter((cat) => byCategory.has(cat))
      .map((cat) => ({ category: cat, terms: byCategory.get(cat)! }));
  }, []);

  const filteredTerms = useMemo(() => {
    if (selectedCategory === "all") return NAUTICAL_GLOSSARY_ES;
    return NAUTICAL_GLOSSARY_ES.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  const schema = useMemo(() => {
    const glossarySchema = generateGlossarySchema();
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: "Inicio", url: "/" },
      { name: "Glosario Náutico", url: "/glosario" },
    ]);
    return {
      "@context": "https://schema.org",
      "@graph": [glossarySchema, breadcrumbSchema],
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Glosario Náutico — Alquiler Barcos Costa Brava | Costa Brava Rent a Boat"
        description="Glosario de términos náuticos esenciales: LBN, PER, PNB, nudos, millas náuticas, eslora, fondear, calas y partes del barco. Diccionario práctico para alquilar un barco en Blanes."
        keywords="glosario nautico, que es LBN, que es PER, que es PNB, millas nauticas, nudos, eslora, fondear, glosario barcos"
        canonical="https://www.costabravarentaboat.com/glosario"
        jsonLd={schema}
      />
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link href={`/${language}`} className="hover:text-foreground">Inicio</Link>
            <ChevronRight className="inline w-4 h-4 mx-1" />
            <span className="text-foreground">Glosario Náutico</span>
          </nav>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-4">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight mb-4">
              Glosario Náutico
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              {NAUTICAL_GLOSSARY_ES.length} términos esenciales para alquilar un barco en la
              Costa Brava. Titulaciones, unidades de medida, partes del barco y vocabulario
              marino.
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
              Todos ({NAUTICAL_GLOSSARY_ES.length})
            </button>
            {CATEGORY_ORDER.filter((cat) => CATEGORY_LABELS[cat]).map((cat) => {
              const count = NAUTICAL_GLOSSARY_ES.filter((t) => t.category === cat).length;
              if (count === 0) return null;
              const info = CATEGORY_LABELS[cat];
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
                  <span className="mr-1.5">{info.icon}</span>
                  {info.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Terms list */}
          {selectedCategory === "all" ? (
            <div className="space-y-10">
              {groups.map(({ category, terms }) => {
                const info = CATEGORY_LABELS[category];
                return (
                  <section key={category} id={`cat-${category}`}>
                    <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span>{info?.icon}</span>
                      <span>{info?.label ?? category}</span>
                    </h2>
                    <dl className="space-y-5">
                      {terms.map((t) => (
                        <div
                          key={slugify(t.term)}
                          id={slugify(t.term)}
                          className="border-l-4 border-border hover:border-primary/40 pl-4 py-1 transition-colors"
                        >
                          <dt className="font-heading font-semibold text-foreground text-lg mb-1">
                            {t.term}
                          </dt>
                          <dd className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {t.definition}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                );
              })}
            </div>
          ) : (
            <dl className="space-y-5">
              {filteredTerms.map((t) => (
                <div
                  key={slugify(t.term)}
                  id={slugify(t.term)}
                  className="border-l-4 border-border hover:border-primary/40 pl-4 py-1 transition-colors"
                >
                  <dt className="font-heading font-semibold text-foreground text-lg mb-1">
                    {t.term}
                  </dt>
                  <dd className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {t.definition}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {/* CTA footer */}
          <div className="mt-16 text-center bg-muted/30 rounded-2xl p-8 sm:p-12">
            <Anchor className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              ¿Listo para alquilar tu barco?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Ahora que dominas la terminología, elige tu barco sin licencia o con licencia para
              explorar la Costa Brava.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/${language}`}
                className="bg-cta hover:bg-cta/90 text-white px-8 py-3 rounded-full font-medium inline-block"
              >
                Ver la flota
              </Link>
              <Link
                href={`/${language}/faq`}
                className="border border-border text-foreground hover:border-foreground/30 px-8 py-3 rounded-full font-medium inline-block"
              >
                Preguntas frecuentes
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
