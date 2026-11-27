import React, { memo, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { motion, useReducedMotion } from "motion/react";
import { trackReviewCarouselScroll } from "@/utils/analytics";
import { GBP_PROFILE_URL } from "@shared/businessProfile";

interface GoogleReview {
  rating: number;
  text: string;
  author: string;
  publishTime: string | null;
  relativeTime?: string | null;
}

interface BusinessStatsResponse {
  rating: number;
  userRatingCount: number;
  displayName: string | null;
  recentReviews: GoogleReview[];
  lastSyncedAt: string | null;
  isFallback: boolean;
}

interface NormalizedReview {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  relativeTime: string | null;
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

// Google's `relativeTime` is hardcoded in English. Synthesize a localized
// equivalent ("hace 7 meses", "vor 1 Jahr") from publishTime so the visitor
// reads the date in their language.
function formatRelativeTime(publishTime: string, locale: string): string {
  if (!publishTime) return "";
  const ts = Date.parse(publishTime);
  if (Number.isNaN(ts)) return "";
  const diffMs = ts - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  const abs = Math.abs(diffDays);
  if (abs < 30) return rtf.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, "month");
  return rtf.format(Math.round(diffDays / 365), "year");
}

/** Relative date in the visitor's language, falling back to the API string and then month/year. */
function reviewDateLabel(review: NormalizedReview, locale: string): string {
  return (
    formatRelativeTime(review.date, locale) ||
    review.relativeTime ||
    (review.date
      ? new Date(review.date).toLocaleDateString(locale, { month: "long", year: "numeric" })
      : "")
  );
}

const REVIEW_URL = "https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5";

/** Memoized individual review card: ruled panel, no decorative quote mark. */
const ReviewCard = memo(function ReviewCard({
  review,
  locale,
}: {
  review: NormalizedReview;
  locale: string;
}) {
  const dateLabel = reviewDateLabel(review, locale);
  return (
    <figure className="flex w-[260px] flex-shrink-0 snap-start flex-col rounded-2xl border border-border bg-background p-5 sm:w-[300px]">
      <div className="mb-3 flex gap-0.5" role="img" aria-label={`${review.rating} de 5 estrellas`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            aria-hidden="true"
            className={`h-3.5 w-3.5 ${
              i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
            }`}
          />
        ))}
      </div>
      <blockquote
        cite={REVIEW_URL}
        className="line-clamp-6 flex-1 text-sm leading-relaxed text-foreground"
      >
        {review.text}
      </blockquote>
      <figcaption className="mt-4 border-t border-border pt-3">
        <p className="text-[13px] font-medium text-foreground">{review.name}</p>
        {dateLabel && <p className="text-xs text-muted-foreground">{dateLabel}</p>}
      </figcaption>
    </figure>
  );
});

interface ReviewsSectionProps {
  /** Colour of the band that follows, so the rounded bottom corners reveal it. */
  wrapperClassName?: string;
}

function ReviewsSection({ wrapperClassName = "bg-muted/40" }: ReviewsSectionProps) {
  const t = useTranslations();
  const { language, localizedPath } = useLanguage();
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const locale = LOCALE_MAP[language] || "es-ES";

  // Live reviews + rating from Google Business Profile (synced via Places API).
  // Endpoint cached server-side: 1h browser, 6h CDN.
  const { data: businessStats } = useQuery<BusinessStatsResponse>({
    queryKey: ["/api/business-stats"],
  });

  // Map Google Places reviews to display shape. Preserve API order (Google
  // ranks by relevance/recency); skip empty bodies.
  const displayReviews = useMemo<NormalizedReview[]>(() => {
    const reviews = businessStats?.recentReviews ?? [];
    return reviews
      .filter(r => r?.text && r.text.trim().length > 0)
      .map((r, idx) => ({
        id: `gbp-${idx}-${r.author || "anon"}`,
        name: r.author || "Google",
        rating: r.rating,
        text: r.text,
        date: r.publishTime ?? "",
        relativeTime: r.relativeTime ?? null,
      }));
  }, [businessStats]);

  // Use real Google rating (e.g. 4.8) — falls back to computed avg if missing.
  const averageRating = useMemo(() => {
    if (typeof businessStats?.rating === "number") {
      return businessStats.rating.toFixed(1);
    }
    if (displayReviews.length === 0) return "0.0";
    const sum = displayReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / displayReviews.length).toFixed(1);
  }, [businessStats, displayReviews]);

  const totalReviewCount = businessStats?.userRatingCount ?? displayReviews.length;

  // Scroll state tracking: batched reads in rAF to avoid forced reflow
  const scrollRafRef = useRef(0);
  const updateScrollState = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = 0;
      const el = scrollRef.current;
      if (!el) return;
      const { scrollLeft, clientWidth, scrollWidth } = el;
      const tolerance = 4;
      setCanScrollLeft(scrollLeft > tolerance);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - tolerance);
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      cancelAnimationFrame(scrollRafRef.current);
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, displayReviews.length]);

  const scrollByCards = useCallback((direction: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" });
    trackReviewCarouselScroll(direction);
  }, []);

  if (displayReviews.length === 0) return null;

  const featured = displayReviews[0];
  const hasMore = displayReviews.length > 1;
  const featuredDateLabel = reviewDateLabel(featured, locale);
  const arrowClass =
    "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta enabled:[@media(hover:hover)]:hover:bg-muted disabled:opacity-35 motion-reduce:transition-none";

  return (
    <div className={wrapperClassName}>
      <section id="reviews" className="below-fold rounded-b-2xl squircle-b bg-card py-16 sm:py-24">
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
          initial={reduce ? false : { y: 24 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
            {/* The proof: real Google rating and count */}
            <div className="flex flex-col justify-between gap-8 rounded-2xl bg-cta p-7 text-primary-foreground dark:text-background sm:p-9">
              <div>
                <p className="font-heading text-6xl font-semibold leading-none tracking-tight sm:text-7xl">
                  {averageRating}
                </p>
                <div className="mt-4 flex gap-1" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <a
                href={GBP_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-11 w-full items-center justify-between gap-4 rounded-full bg-background px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-cta motion-reduce:transition-none sm:w-auto sm:self-start"
              >
                {totalReviewCount} {t.reviews.opinions} {t.reviews.googleReviews ?? ""}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </a>
            </div>

            {/* The story: the featured review, in clean heading type */}
            <figure className="flex flex-col justify-center py-2 lg:px-4">
              <blockquote
                cite={REVIEW_URL}
                className="line-clamp-6 font-heading text-xl font-medium leading-snug tracking-tight text-foreground text-pretty sm:text-2xl lg:text-[1.75rem]"
              >
                {featured.text}
              </blockquote>
              <figcaption className="mt-6 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{featured.name}</span>
                {featuredDateLabel && (
                  <>
                    <span className="mx-1.5" aria-hidden="true">
                      ·
                    </span>
                    <span>{featuredDateLabel}</span>
                  </>
                )}
              </figcaption>
            </figure>
          </div>

          {/* Carousel */}
          <div className="mt-12 sm:mt-14">
            <div className="mb-5 flex items-center justify-between gap-4">
              <a
                href={localizedPath("testimonials")}
                className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-cta"
              >
                {t.reviews.viewAll}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </a>
              {hasMore && (
                <div className="hidden gap-2 md:flex">
                  <button
                    type="button"
                    onClick={() => scrollByCards("left")}
                    disabled={!canScrollLeft}
                    aria-label={t.a11y.reviewPrev}
                    className={arrowClass}
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByCards("right")}
                    disabled={!canScrollRight}
                    aria-label={t.a11y.reviewNext}
                    className={arrowClass}
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            {hasMore && (
              <div
                ref={scrollRef}
                className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {displayReviews.slice(1).map(review => (
                  <ReviewCard key={review.id} review={review} locale={locale} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default memo(ReviewsSection);
