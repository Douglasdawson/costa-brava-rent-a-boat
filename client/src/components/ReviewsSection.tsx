import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Testimonial } from "@shared/schema";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { getAllReviews } from "@/data/boatReviews";

// Convert 2-letter country code to flag emoji
function countryFlag(code: string): string {
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...Array.from(upper).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

interface NormalizedReview {
  id: string;
  name: string;
  flag: string;
  rating: number;
  text: string;
  date: string;
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

export default function ReviewsSection() {
  const t = useTranslations();
  const { language } = useLanguage();
  const { ref: revealRef, isVisible } = useScrollReveal();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Server testimonials as fallback
  const { data: testimonials } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  // Aggregate all client-side boat reviews
  const clientReviews: NormalizedReview[] = useMemo(() => {
    return getAllReviews().map((r) => ({
      id: `${r.boatId}-${r.name}-${r.date}`,
      name: r.name,
      flag: r.flag,
      rating: r.rating,
      text: r.text,
      date: r.date,
    }));
  }, []);

  // Normalize server testimonials to same shape (fallback)
  const serverReviews: NormalizedReview[] = useMemo(() => {
    if (!testimonials) return [];
    return testimonials.map((item) => ({
      id: `server-${item.id}`,
      name: item.customerName,
      flag: "",
      rating: item.rating,
      text: item.comment,
      date: typeof item.date === 'string' ? item.date : new Date(item.date).toISOString().slice(0, 7),
    }));
  }, [testimonials]);

  // Prefer client-side reviews; use server as fallback
  const allReviews = clientReviews.length > 0 ? clientReviews : serverReviews;

  // Pick top 12 sorted by rating (desc) then date (desc)
  const displayReviews = useMemo(() => {
    return [...allReviews]
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.date.localeCompare(a.date);
      })
      .slice(0, 12);
  }, [allReviews]);

  // Average rating across all reviews
  const averageRating = useMemo(() => {
    if (allReviews.length === 0) return "0.0";
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / allReviews.length).toFixed(1);
  }, [allReviews]);

  // Scroll state tracking
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const tolerance = 4;
    setCanScrollLeft(el.scrollLeft > tolerance);
    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - tolerance
    );
    // Calculate active dot based on scroll progress
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setActiveIndex(0);
      return;
    }
    const progress = el.scrollLeft / maxScroll;
    const dotCount = Math.min(displayReviews.length, 6);
    setActiveIndex(Math.min(Math.round(progress * (dotCount - 1)), dotCount - 1));
  }, [displayReviews.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -350 : 350;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const dotCount = Math.min(displayReviews.length, 6);

  if (displayReviews.length === 0) return null;

  return (
    <section
      ref={revealRef}
      id="reviews"
      className={`py-16 sm:py-24 lg:py-32 bg-card transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with average rating */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="text-6xl sm:text-7xl font-heading font-light text-foreground">
            {averageRating}
          </div>
          <div className="flex justify-center gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t.reviews.subtitle} ({allReviews.length} {t.reviews.opinions})
          </p>
        </div>

        {/* Carousel with navigation arrows */}
        <div className="relative group">
          {/* Left arrow - desktop only */}
          <button
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white border border-border shadow-md transition-opacity ${
              canScrollLeft
                ? "opacity-0 group-hover:opacity-100 hover:bg-gray-50 cursor-pointer"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Right arrow - desktop only */}
          <button
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white border border-border shadow-md transition-opacity ${
              canScrollRight
                ? "opacity-0 group-hover:opacity-100 hover:bg-gray-50 cursor-pointer"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          {/* Review cards carousel */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {displayReviews.map((review) => (
              <div
                key={review.id}
                className="w-[220px] sm:w-[240px] aspect-[3/3.2] snap-start flex-shrink-0 bg-white rounded-2xl border border-border p-5 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < review.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                {/* Decorative quote */}
                <span className="text-3xl font-serif text-border leading-none">
                  &ldquo;
                </span>
                {/* Comment */}
                <p className="text-foreground text-[13px] leading-relaxed mt-1 line-clamp-6 flex-1">
                  {review.text}
                </p>
                {/* Author */}
                <div className="mt-auto pt-3">
                  <p className="font-medium text-foreground text-[13px]">
                    {review.flag && (
                      <span
                        className="mr-1.5"
                        role="img"
                        aria-label={review.flag}
                      >
                        {countryFlag(review.flag)}
                      </span>
                    )}
                    {review.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.date + "-01").toLocaleDateString(
                      LOCALE_MAP[language] || "es-ES",
                      { month: "long", year: "numeric" }
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator dots */}
        <div className="flex justify-center gap-1.5 mt-4 mb-8">
          {Array.from({ length: dotCount }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 bg-cta"
                  : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        {/* CTA link */}
        <div className="text-center">
          <a
            href="/testimonios"
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
