import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { useTranslations } from "@/lib/translations";
import { PageHeader, Sheet } from "@/components/content-kit";

// Shared layout for legal pages (privacy, terms, cookies, accessibility).
// Content comes from t.legalPages.<page>.sections — each { title, body }.
// Body supports newline-separated paragraphs + '- ' bullet lines rendered
// with whitespace-pre-line (no rich JSX inside).
//
// A disclaimer banner stating that the Spanish version prevails legally
// is rendered at the top, because these texts are auto-translated by
// npm run i18n:translate and jurisdictional authority stays with ES.

interface LegalPageLayoutProps {
  heroTitle: string;
  lastUpdated: string;
  sections: Array<{ title: string; body: string }>;
}

export function LegalPageLayout({ heroTitle, lastUpdated, sections }: LegalPageLayoutProps) {
  const t = useTranslations();
  const disclaimer = t.legalPages?.legalDisclaimer;

  return (
    <main id="main-content" className="min-h-screen">
      <Navigation />
      <ReadingProgressBar />

      <PageHeader title={heroTitle} subtitle={lastUpdated} next="background" />

      {/* Content: typography only, the legal text is untouched */}
      <Sheet tone="background" next="foot" className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6 lg:px-8">
          {disclaimer && (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <p>{disclaimer}</p>
            </div>
          )}

          {sections.map((section, i) => (
            <section key={i} aria-labelledby={`legal-section-${i}`}>
              <h2
                id={`legal-section-${i}`}
                className="mb-4 border-t border-border pt-6 font-heading text-xl font-semibold tracking-tight text-foreground"
              >
                {section.title}
              </h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </Sheet>

      <Footer />
    </main>
  );
}
