import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { H2, Rise, Sheet } from "@/components/page-kit";
import { useLanguage } from "@/hooks/use-language";
import {
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { generatePlaceSchema } from "@/utils/seo-schemas";
import type { Destination } from "@shared/schema";

export default function DestinationDetailPage({ slug: slugProp }: { slug?: string }) {
  const routeParams = useParams<{ slug: string }>();
  const slug = slugProp || routeParams.slug;
  const { language, localizedPath } = useLanguage();

  // Fetch the destination
  const {
    data: destination,
    isLoading,
    isError,
  } = useQuery<Destination>({
    queryKey: [`/api/destinations/${slug}`],
    enabled: !!slug,
  });

  // SEO Configuration
  const seoConfig = destination
    ? {
        title: `${destination.name} | Costa Brava Rent a Boat`,
        description: destination.metaDescription || destination.description || "",
        ogTitle: destination.name,
        ogDescription: destination.metaDescription || destination.description || "",
      }
    : {
        title: "Destinos | Costa Brava Rent a Boat",
        description: "",
      };

  const hreflangLinks = generateHreflangLinks("destinationDetail", slug);
  const canonical = generateCanonicalUrl("destinationDetail", language, slug);

  // Generate breadcrumb schema
  const breadcrumbSchema = destination
    ? generateBreadcrumbSchema([
        { name: "Inicio", url: "/" },
        { name: "Destinos", url: "/destinos" },
        { name: destination.name, url: `/destinos/${destination.slug}` },
      ])
    : null;

  // Generate Place schema
  const placeSchema = destination
    ? generatePlaceSchema({
        name: destination.name,
        slug: destination.slug,
        description: destination.metaDescription || destination.description || "",
        coordinates: destination.coordinates || undefined,
        image: destination.featuredImage || undefined,
      })
    : null;

  // Combine schemas using @graph pattern
  const combinedJsonLd =
    breadcrumbSchema && placeSchema
      ? {
          "@context": "https://schema.org",
          "@graph": [breadcrumbSchema, placeSchema],
        }
      : breadcrumbSchema;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main id="main-content" className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
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
        <main id="main-content" className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-h2 font-semibold tracking-tight mb-4">Destino no encontrado</h2>
              <p className="text-muted-foreground mb-6">
                El destino que buscas no existe o ha sido eliminado.
              </p>
              <Button asChild data-testid="button-back-destinations">
                <Link href={localizedPath("destinations")}>
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

      <main id="main-content" className="flex-1 bg-background">
        <article>
          {/* Header + featured image + content */}
          <Sheet
            tone="background"
            next="muted"
            className="pt-28 sm:pt-32"
            aria-label={destination.name}
          >
            <div className="container mx-auto max-w-4xl px-4">
              <Link
                href={localizedPath("destinations")}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
                data-testid="button-back-to-destinations"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver a Destinos
              </Link>

              <header className="mt-6">
                <h1
                  className="font-heading text-h1 font-semibold leading-[1.08] tracking-tight text-balance"
                  data-testid={`text-title-${destination.slug}`}
                >
                  {destination.name}
                </h1>

                {/* Facts as a ruled strip, not pills. */}
                <dl className="mt-6 flex flex-wrap divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card text-sm">
                  {destination.distanceFromPort && (
                    <div className="px-4 py-3" data-testid={`badge-distance-${destination.slug}`}>
                      <dd className="font-medium">{destination.distanceFromPort}</dd>
                    </div>
                  )}
                  {destination.coordinates && (
                    <div
                      className="px-4 py-3 tabular-nums text-muted-foreground"
                      data-testid={`badge-coordinates-${destination.slug}`}
                    >
                      <dd>
                        {destination.coordinates.lat.toFixed(4)},{" "}
                        {destination.coordinates.lng.toFixed(4)}
                      </dd>
                    </div>
                  )}
                  {destination.recommendedBoats && destination.recommendedBoats.length > 0 && (
                    <div
                      className="px-4 py-3 text-muted-foreground"
                      data-testid={`badge-boats-${destination.slug}`}
                    >
                      <dd>{destination.recommendedBoats.length} barcos recomendados</dd>
                    </div>
                  )}
                </dl>

                {destination.description && (
                  <p
                    className="mt-6 text-lg font-medium leading-relaxed text-foreground/85 text-pretty sm:text-xl"
                    data-testid={`text-description-${destination.slug}`}
                  >
                    {destination.description}
                  </p>
                )}
              </header>

              {destination.featuredImage && (
                <img
                  src={destination.featuredImage}
                  alt={destination.name}
                  className="mt-8 aspect-video w-full rounded-2xl object-cover"
                  loading="lazy"
                  width={1200}
                  height={675}
                  data-testid={`img-featured-${destination.slug}`}
                />
              )}

              <div
                className="prose prose-lg mt-10 max-w-none dark:prose-invert prose-headings:font-heading prose-headings:font-semibold prose-headings:tracking-tight"
                data-testid={`content-destination-${destination.slug}`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{destination.content}</ReactMarkdown>
              </div>
            </div>
          </Sheet>

          {/* Nearby attractions + gallery */}
          {((destination.nearbyAttractions && destination.nearbyAttractions.length > 0) ||
            (destination.imageGallery && destination.imageGallery.length > 0)) && (
            <Sheet tone="muted" next="navy" aria-label={destination.name}>
              <div className="container mx-auto max-w-4xl space-y-12 px-4">
                {destination.nearbyAttractions && destination.nearbyAttractions.length > 0 && (
                  <Rise>
                    <h2 className={H2}>Atracciones Cercanas</h2>
                    <ul className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
                      {destination.nearbyAttractions.map((attraction, index) => (
                        <li
                          key={index}
                          className="border-b border-border px-5 py-3.5 text-base last:border-b-0"
                          data-testid={`badge-attraction-${index}`}
                        >
                          {attraction}
                        </li>
                      ))}
                    </ul>
                  </Rise>
                )}

                {destination.imageGallery && destination.imageGallery.length > 0 && (
                  <Rise>
                    <h2 className={H2}>Galería</h2>
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                      {destination.imageGallery.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${destination.name} - Imagen ${index + 1}`}
                          className="h-32 w-full rounded-2xl object-cover sm:h-48"
                          loading="lazy"
                          width={400}
                          height={300}
                          data-testid={`img-gallery-${index}`}
                        />
                      ))}
                    </div>
                  </Rise>
                )}
              </div>
            </Sheet>
          )}

          {/* CTA */}
          <Sheet tone="navy" next="footer" aria-labelledby="destination-cta-title">
            <Rise className="container mx-auto max-w-3xl px-4 text-center">
              <h2 id="destination-cta-title" className={H2}>
                ¿Listo para explorar {destination.name}?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 text-pretty sm:text-lg dark:text-foreground/85">
                Alquila un barco y descubre este increíble destino de la Costa Brava
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <InteractiveHoverButton
                  as={Link}
                  href={localizedPath("home") + "#fleet"}
                  tone="light"
                  className="min-h-12 w-full px-8 text-base sm:w-auto"
                  data-testid="button-cta-booking"
                >
                  Ver Barcos Disponibles
                </InteractiveHoverButton>
                <Link
                  href={localizedPath("home") + "#contact"}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border-2 border-primary-foreground/60 px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 motion-reduce:transition-none sm:w-auto dark:border-foreground/50 dark:text-foreground"
                  data-testid="button-cta-contact"
                >
                  Contactar
                </Link>
              </div>
            </Rise>
          </Sheet>
        </article>
      </main>

      <Footer />
    </div>
  );
}
