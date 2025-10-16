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
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useTranslations } from "@/lib/translations";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Testimonial } from "@shared/schema";

export default function TestimoniosPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('testimonios', language);
  const hreflangLinks = generateHreflangLinks('testimonios');
  const canonical = generateCanonicalUrl('testimonios', language);

  const [selectedBoat, setSelectedBoat] = useState<string>('all');

  // Fetch testimonials from API
  const { data: testimonials, isLoading, isError } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials']
  });

  // Filter testimonials by boat
  const filteredTestimonials = selectedBoat === 'all'
    ? testimonials || []
    : (testimonials || []).filter(t => t.boatId === selectedBoat);

  // Calculate average rating
  const averageRating = testimonials && testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : "5.0";

  // Get unique boats from testimonials
  const boats = Array.from(
    new Set((testimonials || [])
      .filter(t => t.boatId && t.boatName)
      .map(t => JSON.stringify({ id: t.boatId, name: t.boatName })))
  )
    .map(str => JSON.parse(str))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: "Opiniones", url: "/testimonios" }
  ]);

  // Review schema for SEO - only if we have testimonials
  const reviewsSchema = testimonials && testimonials.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Costa Brava Rent a Boat - Blanes",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating,
      "reviewCount": testimonials.length,
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": testimonials.map(testimonial => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": testimonial.customerName
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": testimonial.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      },
      "reviewBody": testimonial.comment,
      "datePublished": new Date(testimonial.date).toISOString().split('T')[0],
      "itemReviewed": {
        "@type": "Product",
        "name": `Alquiler ${testimonial.boatName}`,
        "description": `Alquiler de barco ${testimonial.boatName} en Blanes, Costa Brava`
      }
    }))
  } : null;

  // Combine schemas
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
            ? 'text-yellow-500 fill-yellow-500'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar opiniones</h2>
            <p className="text-gray-600 mb-6">
              No pudimos cargar las opiniones de clientes en este momento. Por favor, intenta de nuevo más tarde.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              data-testid="reload-button"
            >
              Reintentar
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white">
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
          <Breadcrumbs
            items={[
              { label: t.breadcrumbs.home, href: "/" },
              { label: "Opiniones", href: "/testimonios" }
            ]}
          />
          
          <div className="text-center mt-8">
            <div className="inline-flex items-center justify-center mb-6">
              <Quote className="w-12 h-12 mr-4" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold">
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
                Basado en {testimonials?.length || 0} opiniones verificadas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Filter by Boat */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
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
                Todos ({testimonials?.length || 0})
              </Button>
              {boats.map(boat => {
                const count = (testimonials || []).filter(t => t.boatId === boat.id).length;
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {filteredTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="hover-elevate" data-testid={`testimonial-${testimonial.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {testimonial.customerName}
                        </h3>
                        {testimonial.isVerified && (
                          <Badge variant="default" className="text-xs">
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(testimonial.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Boat and Details */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className="gap-1">
                        <Ship className="w-3 h-3" />
                        {testimonial.boatName}
                      </Badge>
                      <Badge variant="outline" className="gap-1" data-testid={`testimonial-date-${testimonial.id}`}>
                        {new Date(testimonial.date).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </Badge>
                    </div>

                    {/* Occasion */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Ocasión:</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {testimonial.occasion}
                      </span>
                    </div>

                    {/* Comment */}
                    <div className="relative">
                      <Quote className="absolute -top-1 -left-1 w-6 h-6 text-gray-200" />
                      <p className="text-sm text-gray-700 pl-6 leading-relaxed">
                        {testimonial.comment}
                      </p>
                    </div>

                    {/* View Boat Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setLocation(`/barco/${testimonial.boatId}`)}
                      data-testid={`button-view-boat-${testimonial.id}`}
                    >
                      Ver {testimonial.boat}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                ¿Listo para vivir tu propia experiencia?
              </h2>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
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
