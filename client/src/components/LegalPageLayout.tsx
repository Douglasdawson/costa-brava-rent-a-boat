import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useTranslations } from "@/lib/translations";

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

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 pt-20 sm:pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary mr-4" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
              {heroTitle}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground/60">{lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="pt-6 pb-10 sm:pt-8 sm:pb-16 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {disclaimer && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 text-sm text-amber-900 dark:text-amber-200">
              <p>{disclaimer}</p>
            </div>
          )}

          {sections.map((section, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {section.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
