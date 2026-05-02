import React, { memo, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { trackReviewCarouselScroll } from "@/utils/analytics";

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

/** Memoized individual review card */
const ReviewCard = memo(function ReviewCard({
  review,
  locale,
}: {
  review: NormalizedReview;
  locale: string;
}) {
  const dateLabel =
    review.relativeTime ||
    (review.date
      ? new Date(review.date).toLocaleDateString(locale, {
          month: "long",
          year: "numeric",
        })
      : "");
  return (
    <figure
      className="w-[220px] sm:w-[240px] aspect-[3/3.2] snap-start flex-shrink-0 bg-background rounded-2xl border border-border p-5 flex flex-col"
    >
      {/* Stars */}
      <div className="flex gap-0.5 mb-2" aria-label={`${review.rating} de 5 estrellas`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            aria-hidden="true"
            className={`w-3 h-3 ${
              i < review.rating
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/40"
            }`}
          />
        ))}
      </div>
      {/* Decorative quote */}
      <span className="text-3xl font-heading text-border leading-none" aria-hidden="true">
        &ldquo;
      </span>
      {/* Comment */}
      <blockquote
        cite="https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5"
        className="text-foreground text-sm leading-relaxed mt-1 line-clamp-6 flex-1"
      >
        {review.text}
      </blockquote>
      {/* Author */}
      <figcaption className="mt-auto pt-3">
        <p className="font-medium text-foreground text-[13px]">{review.name}</p>
        {dateLabel && (
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        )}
      </figcaption>
    </figure>
  );
});

function ReviewsSection() {
  const t = useTranslations();
  const { language, localizedPath } = useLanguage();
  const { ref: revealRef, isVisible } = useScrollReveal();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

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
      .filter((r) => r?.text && r.text.trim().length > 0)
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

  const totalReviewCount =
    businessStats?.userRatingCount ?? displayReviews.length;

  // Scroll state tracking — batched reads in rAF to avoid forced reflow
  const scrollRafRef = useRef(0);
  const updateScrollState = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = 0;
      const el = scrollRef.current;
      if (!el) return;
      const { scrollLeft, clientWidth, scrollWidth } = el;
      const tolerance = 4;
      const maxScroll = scrollWidth - clientWidth;
      setCanScrollLeft(scrollLeft > tolerance);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - tolerance);
      if (maxScroll <= 0) {
        setActiveIndex(0);
      } else {
        const progress = scrollLeft / maxScroll;
        const dotCount = Math.min(displayReviews.length, 6);
        setActiveIndex(Math.min(Math.round(progress * (dotCount - 1)), dotCount - 1));
      }
    });
  }, [displayReviews.length]);

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
  }, [updateScrollState]);

  const handleScrollLeft = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: -350, behavior: "smooth" });
    trackReviewCarouselScroll("left");
  }, []);

  const handleScrollRight = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: 350, behavior: "smooth" });
    trackReviewCarouselScroll("right");
  }, []);

  const dotCount = Math.min(displayReviews.length, 6);

  if (displayReviews.length === 0) return null;

  return (
    <section
      ref={revealRef}
      id="reviews"
      className={`below-fold py-16 sm:py-24 lg:py-32 bg-card transition-[opacity,transform,filter] duration-500 ${
        isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-8 blur-[2px]"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pull quote — featured review, editorial treatment.
            The metric (rating + count) drops to a small caption underneath; the story leads, the proof follows. */}
        {(() => {
          const featured = displayReviews[0];
          if (!featured) return null;
          const featuredDateLabel =
            featured.relativeTime ||
            (featured.date
              ? new Date(featured.date).toLocaleDateString(locale, {
                  month: "long",
                  year: "numeric",
                })
              : "");
          return (
            <figure className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
              <blockquote
                cite="https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5"
                className="font-heading font-light italic text-foreground leading-[1.2] tracking-tight text-balance line-clamp-5"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.625rem)" }}
              >
                <span aria-hidden="true" className="text-primary/25 not-italic font-semibold pr-1">&ldquo;</span>
                {featured.text}
                <span aria-hidden="true" className="text-primary/25 not-italic font-semibold pl-1">&rdquo;</span>
              </blockquote>
              <figcaption className="mt-6 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{featured.name}</span>
                {featuredDateLabel && (
                  <>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>{featuredDateLabel}</span>
                  </>
                )}
              </figcaption>
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                </span>
                <span>
                  {averageRating} · {totalReviewCount} {t.reviews.opinions}
                </span>
              </p>
            </figure>
          );
        })()}

        {/* Carousel with navigation arrows */}
        <div className="relative group">
          <button
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-md transition-opacity ${
              canScrollLeft
                ? "opacity-0 group-hover:opacity-100 hover:bg-muted cursor-pointer"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <button
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-md transition-opacity ${
              canScrollRight
                ? "opacity-0 group-hover:opacity-100 hover:bg-muted cursor-pointer"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {displayReviews.map((review) => (
              <ReviewCard key={review.id} review={review} locale={locale} />
            ))}
          </div>
        </div>

        {/* Scroll indicator dots */}
        <div className="flex justify-center gap-1.5 mt-4 mb-8" role="presentation" aria-hidden="true">
          {Array.from({ length: dotCount }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-cta" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        {/* CTA link */}
        <div className="text-center">
          <a
            href={localizedPath("testimonials")}
            className="text-sm font-medium text-foreground hover:text-cta inline-flex items-center gap-1 transition-colors"
          >
            {t.reviews.viewAll}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default memo(ReviewsSection);
