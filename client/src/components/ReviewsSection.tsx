import { Star, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Testimonial } from "@shared/schema";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ReviewsSection() {
  const t = useTranslations();
  const { language } = useLanguage();
  const { ref: revealRef, isVisible } = useScrollReveal();
  const { data: testimonials } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials'],
  });

  // Only show if we have testimonials
  if (!testimonials || testimonials.length === 0) return null;

  // Sort by rating (highest first), take top 6 for carousel
  const topReviews = [...testimonials]
    .sort((a, b) => b.rating - a.rating || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const averageRating = (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1);

  return (
    <section ref={revealRef} id="reviews" className={`py-16 sm:py-24 lg:py-32 bg-card transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="text-6xl sm:text-7xl font-heading font-light text-foreground">
            {averageRating}
          </div>
          <div className="flex justify-center gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 text-cta fill-cta"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t.reviews.subtitle} ({testimonials.length} {t.reviews.opinions})
          </p>
        </div>

        {/* Reviews Horizontal Scroll */}
        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 mb-8">
          {topReviews.map((review) => (
            <div
              key={review.id}
              className="min-w-[300px] sm:min-w-[350px] snap-start flex-shrink-0 bg-white rounded-2xl border border-border p-6"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < review.rating ? 'text-cta fill-cta' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              {/* Decorative quote */}
              <span className="text-4xl font-serif text-border leading-none">&ldquo;</span>
              {/* Comment */}
              <p className="text-foreground text-sm leading-relaxed mt-1 line-clamp-4">
                {review.comment}
              </p>
              {/* Author */}
              <div className="mt-4">
                <p className="font-medium text-foreground text-sm">{review.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {review.boatName} &middot; {new Date(review.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'nl' ? 'nl-NL' : language === 'it' ? 'it-IT' : language === 'ca' ? 'ca-ES' : language === 'en' ? 'en-GB' : 'es-ES', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
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
