import { Suspense, lazy, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { LastUpdated } from "@/components/LastUpdated";
import { Anchor, MapPin, Ship, Clock, Waves, Info } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { generateBreadcrumbSchema, BASE_DOMAIN } from "@/utils/seo-config";
import { HREFLANG_CODES, SUPPORTED_LANGUAGES } from "@shared/seoConstants";
import { resolveMatrixCombo, matrixPath } from "@shared/occasionMatrixPage";
import type { MatrixCombo } from "@shared/occasionMatrix";

const Footer = lazy(() => import("@/components/Footer"));

interface OccasionMatrixPageProps {
  combo: MatrixCombo;
}

export default function OccasionMatrixPage({ combo }: OccasionMatrixPageProps) {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const data = resolveMatrixCombo(combo);
  const copy = data ? t.occasionMatrix?.pages?.[data.comboId] : undefined;

  // 8-locale launch (translatedStaticPaths + sitemap already index all 8):
  // self-canonical per locale, hreflang across the full set with x-default → ES.
  // Mirrors what the server SSR injects so hydration never downgrades the head.
  const esPath = data ? matrixPath(combo.occasion.id, combo.locationKey, "es") : "/";
  const canonical = `${BASE_DOMAIN}${data ? matrixPath(combo.occasion.id, combo.locationKey, language) : "/"}`;
  const hreflang = useMemo(
    () => [
      ...SUPPORTED_LANGUAGES.map((l) => ({
        lang: HREFLANG_CODES[l] ?? l,
        url: `${BASE_DOMAIN}${matrixPath(combo.occasion.id, combo.locationKey, l)}`,
      })),
      { lang: "x-default", url: `${BASE_DOMAIN}${esPath}` },
    ],
    [combo.occasion.id, combo.locationKey, esPath],
  );

  const jsonLd = useMemo(() => {
    if (!copy) return undefined;
    const breadcrumb = generateBreadcrumbSchema([
      { name: t.breadcrumbs.home, url: "/" },
      { name: copy.h1, url: matrixPath(combo.occasion.id, combo.locationKey, language) },
    ]);
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: copy.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    return { "@context": "https://schema.org", "@graph": [breadcrumb, faqSchema] };
  }, [copy, combo.occasion.id, combo.locationKey, language, t.breadcrumbs.home]);

  if (!data || !copy) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 max-w-3xl mx-auto px-4 text-center">
          <p className="text-muted-foreground">404</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={copy.seoTitle}
        description={copy.seoDescription}
        canonical={canonical}
        hreflang={hreflang}
        jsonLd={jsonLd}
      />
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-4">
              <Waves className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight mb-4">
              {copy.h1}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">{copy.intro}</p>
            <LastUpdated date="2026-05-31" className="mt-3" />
          </div>

          {/* Spots */}
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-5 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" /> {copy.spotsTitle}
            </h2>
            <dl className="space-y-5">
              {copy.spots.map((s) => (
                <div key={s.name} className="pl-4 border-l-2 border-primary/20">
                  <dt className="font-heading font-semibold text-foreground text-lg mb-1">{s.name}</dt>
                  <dd className="text-muted-foreground leading-relaxed">{s.description}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Boats */}
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-3 flex items-center gap-2">
              <Ship className="w-6 h-6 text-primary" /> {copy.boatsTitle}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-5">{copy.boatsIntro}</p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {data.boats.map((b) => (
                <li key={b.id} className="flex items-center gap-3 p-4 rounded-xl bg-muted/40">
                  <Anchor className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{b.name}</p>
                    <p className="text-sm text-muted-foreground">{b.capacity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Practical */}
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-3 flex items-center gap-2">
              <Info className="w-6 h-6 text-primary" /> {copy.practicalTitle}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{copy.practicalBody}</p>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-5 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" /> {copy.faqTitle}
            </h2>
            <dl className="space-y-5">
              {copy.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-heading font-semibold text-foreground mb-1">{f.q}</dt>
                  <dd className="text-muted-foreground leading-relaxed">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* CTA */}
          <div className="text-center bg-muted/30 rounded-2xl p-8 sm:p-12">
            <Anchor className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground mb-3">{copy.ctaTitle}</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{copy.ctaText}</p>
            <a
              href={localizedPath("booking")}
              className="bg-cta hover:bg-cta/90 text-white px-8 py-3 rounded-full font-medium inline-block"
            >
              {t.routes?.bookBoat ?? "Reservar barco"}
            </a>
          </div>
        </div>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
