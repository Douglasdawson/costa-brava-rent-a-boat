import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote, ChevronRight } from "lucide-react";
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

  // Sort by rating (highest first), take top 4
  const topReviews = [...testimonials]
    .sort((a, b) => b.rating - a.rating || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const averageRating = (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1);

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  return (
    <section ref={revealRef} id="reviews" className={`py-12 sm:py-16 bg-gray-50 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 mb-4">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-yellow-800">{averageRating}/5</span>
            <span className="text-sm text-yellow-700">({testimonials.length} {t.reviews.opinions})</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-2">
            {t.reviews.title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            {t.reviews.subtitle}
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {topReviews.map((review) => (
            <Card key={review.id} className="bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  {renderStars(review.rating)}
                  <Quote className="w-5 h-5 text-gray-200" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-4">
                  {review.comment}
                </p>
                <div className="border-t pt-3">
                  <p className="font-semibold text-sm text-gray-900">{review.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {review.boatName} &middot; {new Date(review.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'nl' ? 'nl-NL' : language === 'it' ? 'it-IT' : language === 'ca' ? 'ca-ES' : language === 'en' ? 'en-GB' : 'es-ES', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a href="/testimonios">
            <Button variant="outline" size="default" className="gap-1 h-10 sm:h-9 px-4">
              {t.reviews.viewAll}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
