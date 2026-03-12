import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, Ship } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import { useTranslations } from "@/lib/translations";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { getAllReviews } from "@/data/boatReviews";
import { BOAT_DATA } from "@shared/boatData";

// Convert 2-letter country code to flag emoji
function countryFlag(code: string): string {
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...Array.from(upper).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
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

export default function TestimoniosPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('testimonios', language);
  const hreflangLinks = generateHreflangLinks('testimonios');
  const canonical = generateCanonicalUrl('testimonios', language);

  const [selectedBoat, setSelectedBoat] = useState<string>('all');
  const [, setLocation] = useLocation();

  // Use client-side reviews (same source as ReviewsSection on home)
  const allReviews = useMemo(() => {
    return getAllReviews()
      .map((r) => ({
        id: `${r.boatId}-${r.name}-${r.date}`,
        name: r.name,
        flag: r.flag,
        boatId: r.boatId,
        boatName: BOAT_DATA[r.boatId]?.name || r.boatId,
        rating: r.rating,
        text: r.text,
        date: r.date,
      }))
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.date.localeCompare(a.date);
      });
  }, []);

  // Get unique boats
  const boats = useMemo(() => {
    const boatMap = new Map<string, string>();
    for (const r of allReviews) {
      if (!boatMap.has(r.boatId)) {
        boatMap.set(r.boatId, r.boatName);
      }
    }
    return Array.from(boatMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allReviews]);

  // Filter by boat
  const filteredReviews = selectedBoat === 'all'
    ? allReviews
    : allReviews.filter(r => r.boatId === selectedBoat);

  // Average rating
  const averageRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : "5.0";

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: "Opiniones", url: "/testimonios" }
  ]);

  // Review schema for SEO
  const reviewsSchema = allReviews.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Costa Brava Rent a Boat - Blanes",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating,
      "reviewCount": allReviews.length,
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": allReviews.slice(0, 20).map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.name
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      },
      "reviewBody": review.text,
      "datePublished": review.date + "-01",
      "itemReviewed": {
        "@type": "Product",
        "name": `Alquiler ${review.boatName}`,
        "description": `Alquiler de barco ${review.boatName} en Blanes, Costa Brava`
      }
    }))
  } : null;

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": reviewsSchema ? [breadcrumbSchema, reviewsSchema] : [breadcrumbSchema]
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'text-amber-400 fill-amber-400'
            : 'text-muted-foreground/40'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />

      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-teal-600 text-white pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Quote className="w-10 h-10 sm:w-12 sm:h-12 hidden sm:block" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-center">
                Opiniones de Nuestros Clientes
              </h1>
            </div>

            <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-6 text-blue-50">
              Descubre por qué más de 1,000 personas confían en nosotros cada temporada para vivir experiencias únicas en la Costa Brava
            </p>

            {/* Rating Summary */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold">{averageRating}</span>
                <div className="flex">
                  {renderStars(5)}
                </div>
              </div>
              <p className="text-blue-50">
                Basado en {allReviews.length} opiniones verificadas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Filter by Boat */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Ship className="w-5 h-5 text-primary" />
              Filtrar por barco
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedBoat === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedBoat('all')}
                data-testid="filter-all"
              >
                Todos ({allReviews.length})
              </Button>
              {boats.map(boat => {
                const count = allReviews.filter(r => r.boatId === boat.id).length;
                return (
                  <Button
                    key={boat.id}
                    variant={selectedBoat === boat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedBoat(boat.id)}
                    data-testid={`filter-${boat.id}`}
                  >
                    {boat.name} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="hover-elevate" data-testid={`testimonial-${review.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-foreground">
                        {review.flag && (
                          <span className="mr-1.5" role="img" aria-label={review.flag}>
                            {countryFlag(review.flag)}
                          </span>
                        )}
                        {review.name}
                      </h3>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {new Date(review.date + "-01").toLocaleDateString(
                          LOCALE_MAP[language] || "es-ES",
                          { month: "long", year: "numeric" }
                        )}
                      </p>
                    </div>
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Boat badge */}
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Ship className="w-3 h-3" />
                      {review.boatName}
                    </Badge>

                    {/* Comment */}
                    <div className="relative">
                      <Quote className="absolute -top-1 -left-1 w-5 h-5 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground pl-5 leading-relaxed">
                        {review.text}
                      </p>
                    </div>

                    {/* View Boat Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setLocation(`/barco/${review.boatId}`)}
                      data-testid={`button-view-boat-${review.id}`}
                    >
                      Ver {review.boatName}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-3">
                ¿Listo para vivir tu propia experiencia?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Únete a cientos de clientes satisfechos que han descubierto las mejores calas de la Costa Brava con nosotros. Reserva ahora y crea recuerdos inolvidables.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={() => setLocation('/#fleet')}
                  data-testid="button-view-fleet"
                >
                  Ver Nuestra Flota
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation('/faq')}
                  data-testid="button-view-faq"
                >
                  Preguntas Frecuentes
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />
    </div>
  );
}
