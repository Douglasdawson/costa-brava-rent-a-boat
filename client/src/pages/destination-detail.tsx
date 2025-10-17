import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Anchor, Ship, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { generatePlaceSchema } from "@/utils/seo-schemas";
import type { Destination } from "@shared/schema";

export default function DestinationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();

  // Fetch the destination
  const { data: destination, isLoading, isError } = useQuery<Destination>({
    queryKey: [`/api/destinations/${slug}`],
    enabled: !!slug
  });

  // SEO Configuration
  const seoConfig = destination ? {
    title: `${destination.name} | Costa Brava Rent a Boat`,
    description: destination.metaDescription || destination.description || '',
    ogTitle: destination.name,
    ogDescription: destination.metaDescription || destination.description || ''
  } : {
    title: 'Destinos | Costa Brava Rent a Boat',
    description: '',
  };

  const hreflangLinks = generateHreflangLinks('destinationDetail', slug);
  const canonical = generateCanonicalUrl('destinationDetail', language, slug);

  // Generate breadcrumb schema
  const breadcrumbSchema = destination ? generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Destinos", url: "/destinos" },
    { name: destination.name, url: `/destinos/${destination.slug}` }
  ]) : null;

  // Generate Place schema
  const placeSchema = destination ? generatePlaceSchema({
    name: destination.name,
    slug: destination.slug,
    description: destination.metaDescription || destination.description || '',
    coordinates: destination.coordinates || undefined,
    image: destination.featuredImage || undefined
  }) : null;

  // Combine schemas using @graph pattern
  const combinedJsonLd = (breadcrumbSchema && placeSchema) ? {
    "@context": "https://schema.org",
    "@graph": [breadcrumbSchema, placeSchema]
  } : breadcrumbSchema;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !destination) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Destino no encontrado</h2>
              <p className="text-muted-foreground mb-6">
                El destino que buscas no existe o ha sido eliminado.
              </p>
              <Button asChild data-testid="button-back-destinations">
                <Link href="/destinos">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Destinos
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        ogImage={destination?.featuredImage || undefined}
        ogType="place"
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd || undefined}
      />
      
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Inicio", href: "/" },
            { label: "Destinos", href: "/destinos" },
            { label: destination.name }
          ]} 
        />

        {/* Back to Destinations */}
        <Button 
          variant="ghost" 
          asChild 
          className="mb-6"
          data-testid="button-back-to-destinations"
        >
          <Link href="/destinos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Destinos
          </Link>
        </Button>

        {/* Destination Header */}
        <article className="space-y-6">
          <header className="space-y-4">
            <h1 
              className="text-4xl font-bold tracking-tight"
              data-testid={`text-title-${destination.slug}`}
            >
              {destination.name}
            </h1>

            {/* Info Pills */}
            <div className="flex flex-wrap gap-3">
              {destination.distanceFromPort && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center gap-1"
                  data-testid={`badge-distance-${destination.slug}`}
                >
                  <Anchor className="h-3 w-3" />
                  {destination.distanceFromPort}
                </Badge>
              )}
              {destination.coordinates && (
                <Badge 
                  variant="outline"
                  className="flex items-center gap-1"
                  data-testid={`badge-coordinates-${destination.slug}`}
                >
                  <MapPin className="h-3 w-3" />
                  {destination.coordinates.lat.toFixed(4)}, {destination.coordinates.lng.toFixed(4)}
                </Badge>
              )}
              {destination.recommendedBoats && destination.recommendedBoats.length > 0 && (
                <Badge 
                  variant="outline"
                  className="flex items-center gap-1"
                  data-testid={`badge-boats-${destination.slug}`}
                >
                  <Ship className="h-3 w-3" />
                  {destination.recommendedBoats.length} barcos recomendados
                </Badge>
              )}
            </div>

            {destination.description && (
              <p 
                className="text-xl text-muted-foreground"
                data-testid={`text-description-${destination.slug}`}
              >
                {destination.description}
              </p>
            )}
          </header>

          {/* Featured Image */}
          {destination.featuredImage && (
            <div className="my-8">
              <img 
                src={destination.featuredImage} 
                alt={destination.name}
                className="w-full h-auto rounded-lg"
                data-testid={`img-featured-${destination.slug}`}
              />
            </div>
          )}

          {/* Destination Content */}
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            data-testid={`content-destination-${destination.slug}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {destination.content}
            </ReactMarkdown>
          </div>

          {/* Nearby Attractions */}
          {destination.nearbyAttractions && destination.nearbyAttractions.length > 0 && (
            <div className="pt-6 border-t">
              <h3 className="text-xl font-semibold mb-4">Atracciones Cercanas</h3>
              <div className="flex flex-wrap gap-2">
                {destination.nearbyAttractions.map((attraction, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    data-testid={`badge-attraction-${index}`}
                  >
                    {attraction}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {destination.imageGallery && destination.imageGallery.length > 0 && (
            <div className="pt-6 border-t">
              <h3 className="text-xl font-semibold mb-4">Galería</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {destination.imageGallery.map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`${destination.name} - Imagen ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                    data-testid={`img-gallery-${index}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-12 pt-8 border-t">
            <Card>
              <CardHeader>
                <CardTitle>¿Listo para explorar {destination.name}?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Alquila un barco y descubre este increíble destino de la Costa Brava
                </p>
                <div className="flex gap-4">
                  <Button asChild data-testid="button-cta-booking">
                    <Link href="/#fleet">
                      Ver Barcos Disponibles
                    </Link>
                  </Button>
                  <Button variant="outline" asChild data-testid="button-cta-contact">
                    <Link href="/#contact">
                      Contactar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
