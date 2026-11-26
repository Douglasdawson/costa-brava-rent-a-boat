import { Star } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  H2,
  ON_NAVY_MUTED,
  PageHeader,
  Rise,
  Sheet,
  splitSentences,
} from "@/components/content-kit";
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
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  BUSINESS_RATING_STR,
  BUSINESS_REVIEW_COUNT_STR,
  GBP_PROFILE_URL,
} from "@shared/businessProfile";

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
    () => (businessStats?.recentReviews ?? []).filter(r => r?.text && r.text.trim().length > 0),
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
          index < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40"
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

  const [introLead, introRest] = splitSentences(tt?.intro.paragraph1);

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

      <PageHeader
        title={tt?.hero.title ?? "Lo que dicen quienes ya han navegado"}
        subtitle={tt?.hero.subtitle ?? ""}
        next="background"
      >
        <a
          href={GBP_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto mt-10 block max-w-md rounded-2xl bg-background p-6 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none dark:bg-[hsl(215_45%_22%)] [@media(hover:hover)]:hover:bg-background/90"
        >
          <div className="mb-2 flex items-center justify-center gap-3">
            <span className="font-heading text-4xl font-semibold tabular-nums">
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
      </PageHeader>

      {/* INTRO: first sentence is the lead, the rest are loose facts with rules */}
      <Sheet tone="background" next="muted" aria-labelledby="testimonios-intro-title">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-5 lg:gap-16">
          <Rise className="lg:col-span-3">
            <h2 id="testimonios-intro-title" className={H2}>
              {tt?.intro.title ?? "Experiencias reales en el mar"}
            </h2>
            <p className="mt-5 max-w-xl text-lg font-medium leading-snug text-foreground text-pretty sm:text-xl">
              {introLead}
            </p>
            <ul className="mt-6 max-w-xl border-t border-border">
              {[...(introRest.length ? [introRest.join(" ")] : []), tt?.intro.paragraph2 ?? ""]
                .filter(Boolean)
                .map(fact => (
                  <li
                    key={fact}
                    className="border-b border-border py-4 text-base leading-relaxed text-muted-foreground text-pretty"
                  >
                    {fact}
                  </li>
                ))}
            </ul>
          </Rise>
          <Rise className="lg:col-span-2" delay={0.1}>
            <img
              src="/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-pareja-navegando-yates.webp"
              alt={tt?.intro.imageAlt ?? "Pareja navegando por la Costa Brava"}
              className="aspect-[4/5] w-full rounded-2xl object-cover"
              loading="lazy"
              decoding="async"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Real Google reviews */}
      <Sheet tone="muted" next="navy" aria-label={tt?.hero.title ?? "Opiniones"}>
        <div className="container mx-auto max-w-6xl px-4">
          {reviews.length > 0 ? (
            <Rise className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {reviews.map((review, idx) => (
                <figure
                  key={`gbp-${idx}-${review.author ?? "anon"}`}
                  className="flex flex-col rounded-2xl border border-border bg-background p-6"
                >
                  <span className="mb-3 flex items-center gap-0.5">
                    {renderStars(review.rating)}
                  </span>
                  <blockquote
                    cite={GOOGLE_REVIEWS_URL}
                    className="line-clamp-[10] flex-1 text-sm leading-relaxed text-foreground"
                  >
                    {review.text}
                  </blockquote>
                  <figcaption className="mt-4 border-t border-border pt-3">
                    <p className="text-sm font-medium text-foreground">
                      {review.author ?? "Google"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatReviewDate(review)}</p>
                  </figcaption>
                </figure>
              ))}
            </Rise>
          ) : (
            <p className="text-center text-muted-foreground">
              {ratingDisplay} · {ratingLabel}
            </p>
          )}

          <div className="mt-10 text-center">
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              {`${ratingDisplay} · ${countDisplay} ${t.reviews?.opinions ?? "opiniones"} ${t.reviews?.googleReviews ?? "en Google"}`}
            </a>
          </div>
        </div>
      </Sheet>

      {/* CTA: closes over the footer colour */}
      <Sheet tone="navy" next="foot" aria-labelledby="testimonios-cta-title">
        <Rise className="container mx-auto max-w-3xl px-4 text-center">
          <h2 id="testimonios-cta-title" className={H2}>
            {tt?.cta.title ?? ""}
          </h2>
          <p
            className={`mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty sm:text-lg ${ON_NAVY_MUTED}`}
          >
            {tt?.cta.paragraph ?? ""}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <InteractiveHoverButton
              tone="light"
              onClick={() => setLocation(localizedPath("home") + "#fleet")}
              className="min-h-12 px-8 text-base"
            >
              {tt?.cta.primary ?? ""}
            </InteractiveHoverButton>
            <button
              type="button"
              onClick={() => setLocation(localizedPath("faq"))}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-primary-foreground/50 px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none dark:border-foreground/40 dark:text-foreground dark:hover:bg-foreground/10"
            >
              {tt?.cta.secondary ?? ""}
            </button>
          </div>
        </Rise>
      </Sheet>

      <Footer />
    </main>
  );
}
