import { Button } from "@/components/ui/button";
import { Star, Quote } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BUSINESS_RATING_STR, BUSINESS_REVIEW_COUNT_STR, GBP_PROFILE_URL } from "@shared/businessProfile";

const GOOGLE_REVIEWS_URL = GBP_PROFILE_URL;

interface GoogleReview {
  author: string | null;
  rating: number;
  text: string;
  publishTime: string | null;
  relativeTime: string | null;
}

interface BusinessStatsResponse {
  rating: number;
  userRatingCount: number;
  displayName: string | null;
  recentReviews: GoogleReview[];
  lastSyncedAt: string | null;
  isFallback: boolean;
}

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}

const LOCALE_MAP: Record<string, string> = {
  es: "es-ES",
  ca: "ca-ES",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  nl: "nl-NL",
  it: "it-IT",
  ru: "ru-RU",
};

/**
 * /testimonios — built EXCLUSIVELY on real Google Business Profile reviews
 * (`/api/business-stats`, synced via Places API). The previous version
 * rendered ~2,400 synthetic per-boat reviews from client/src/data/* and
 * emitted 20 of them as schema.org Review entries; that dataset was retired
 * on 2026-06-11 (owner decision, impeccable sweep P1.10). Never reintroduce
 * fabricated reviews on this page or its JSON-LD.
 */
export default function TestimoniosPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig("testimonios", language);
  const hreflangLinks = generateHreflangLinks("testimonios");
  const canonical = generateCanonicalUrl("testimonios", language);
  const [, setLocation] = useLocation();

  const tt = t.testimonios;
  const locale = LOCALE_MAP[language] || "es-ES";

  const { data: businessStats } = useQuery<BusinessStatsResponse>({
    queryKey: ["/api/business-stats"],
  });

  const reviews = useMemo(
    () =>
      (businessStats?.recentReviews ?? []).filter(
        r => r?.text && r.text.trim().length > 0
      ),
    [businessStats]
  );

  const ratingDisplay =
    typeof businessStats?.rating === "number"
      ? businessStats.rating.toFixed(1)
      : BUSINESS_RATING_STR;
  const countDisplay = businessStats?.userRatingCount ?? BUSINESS_REVIEW_COUNT_STR;

  const breadcrumbName = t.breadcrumbs.testimonios ?? "Opiniones";
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: breadcrumbName, url: "/testimonios" },
  ]);

  // Aggregate only, from the canonical Google Business Profile values.
  // Individual Review entries are deliberately NOT emitted.
  const reviewsSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Costa Brava Rent a Boat - Blanes",
    url: "https://www.costabravarentaboat.com",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: BUSINESS_RATING_STR,
      reviewCount: BUSINESS_REVIEW_COUNT_STR,
      bestRating: "5",
      worstRating: "1",
    },
  };

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [breadcrumbSchema, reviewsSchema],
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        aria-hidden="true"
        className={`w-4 h-4 ${
          index < Math.round(rating)
            ? "text-amber-400 fill-amber-400"
            : "text-muted-foreground/40"
        }`}
      />
    ));

  const ratingLabel = (tt?.hero.ratingLabel ?? "Sobre {count} opiniones recogidas").replace(
    "{count}",
    String(countDisplay)
  );

  const formatReviewDate = (r: GoogleReview): string => {
    if (r.relativeTime) return r.relativeTime;
    if (!r.publishTime) return "";
    try {
      return new Date(r.publishTime).toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogImage={seoConfig.image}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />

      <Navigation />
      <ReadingProgressBar />

      {/* Hero */}
      <section
        aria-labelledby="testimonios-hero-title"
        className="bg-gradient-to-br from-primary/5 to-primary/10 pt-24 pb-12"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Quote
                aria-hidden="true"
                className="w-10 h-10 sm:w-12 sm:h-12 hidden sm:block text-foreground/80"
              />
              <h1
                id="testimonios-hero-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-center text-foreground"
              >
                {tt?.hero.title ?? "Lo que dicen quienes ya han navegado"}
              </h1>
            </div>

            <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-8 text-foreground/75 leading-relaxed">
              {tt?.hero.subtitle ?? ""}
            </p>

            <a
              href={GBP_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-card rounded-2xl p-6 max-w-md mx-auto shadow-xs border border-border/40 hover:border-foreground/30 transition-colors"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-4xl font-bold text-foreground tabular-nums">
                  {ratingDisplay}
                </span>
                <div className="flex" aria-label={`${ratingDisplay} de 5`}>
                  {renderStars(5)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {ratingLabel} {t.reviews?.googleReviews ?? "en Google"}
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* Intro */}
      <RevealSection className="py-16 sm:py-20 bg-background">
        <section
          aria-labelledby="testimonios-intro-title"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3 space-y-5">
              <h2
                id="testimonios-intro-title"
                className="text-2xl sm:text-3xl font-heading font-bold text-foreground"
              >
                {tt?.intro.title ?? "Experiencias reales en el mar"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {tt?.intro.paragraph1 ?? ""}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {tt?.intro.paragraph2 ?? ""}
              </p>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-pareja-navegando-yates.webp"
                alt={tt?.intro.imageAlt ?? "Pareja navegando por la Costa Brava"}
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                decoding="async"
                width={640}
                height={800}
              />
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Real Google reviews */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <section
          aria-label={tt?.hero.title ?? "Opiniones"}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {reviews.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review, idx) => (
                <figure
                  key={`gbp-${idx}-${review.author ?? "anon"}`}
                  className="bg-background border border-card-border rounded-2xl p-6 flex flex-col"
                >
                  <Quote aria-hidden="true" className="w-6 h-6 text-primary/20 mb-3" />
                  <span className="flex items-center gap-0.5 mb-2">
                    {renderStars(review.rating)}
                  </span>
                  <blockquote
                    cite={GOOGLE_REVIEWS_URL}
                    className="text-sm text-foreground leading-relaxed flex-1 line-clamp-[10]"
                  >
                    {review.text}
                  </blockquote>
                  <figcaption className="mt-4 pt-3 border-t border-border/60">
                    <p className="font-medium text-foreground text-sm">
                      {review.author ?? "Google"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatReviewDate(review)}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              {ratingDisplay} · {ratingLabel}
            </p>
          )}

          <div className="text-center mt-10">
            <Button
              variant="outline"
              className="rounded-full min-h-11 px-6"
              onClick={() => window.open(GOOGLE_REVIEWS_URL, "_blank", "noopener")}
            >
              {`${ratingDisplay} · ${countDisplay} ${t.reviews?.opinions ?? "opiniones"} ${t.reviews?.googleReviews ?? "en Google"}`}
            </Button>
          </div>
        </section>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="py-16 sm:py-20 bg-primary text-primary-foreground">
        <section
          aria-labelledby="testimonios-cta-title"
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2
            id="testimonios-cta-title"
            className="text-2xl sm:text-3xl font-heading font-bold mb-4"
          >
            {tt?.cta.title ?? ""}
          </h2>
          <p className="text-primary-foreground/85 mb-8">{tt?.cta.paragraph ?? ""}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-cta hover:bg-cta/90 text-cta-foreground rounded-full min-h-11 px-7"
              onClick={() => setLocation(localizedPath("home") + "#fleet")}
            >
              {tt?.cta.primary ?? ""}
            </Button>
            <Button
              variant="outline"
              className="rounded-full min-h-11 px-7 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setLocation(localizedPath("faq"))}
            >
              {tt?.cta.secondary ?? ""}
            </Button>
          </div>
        </section>
      </RevealSection>

      <Footer />
    </main>
  );
}
