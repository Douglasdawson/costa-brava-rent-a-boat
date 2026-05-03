import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, Ship } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
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
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { getAllReviews } from "@/data/boatReviews";
import { BOAT_DATA } from "@shared/boatData";

const PAGE_SIZE = 30;

function countryFlag(code: string): string {
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...Array.from(upper).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
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
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('testimonios', language);
  const hreflangLinks = generateHreflangLinks('testimonios');
  const canonical = generateCanonicalUrl('testimonios', language);

  const tt = t.testimonios;

  const [selectedBoat, setSelectedBoat] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [, setLocation] = useLocation();

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

  const filteredReviews = useMemo(
    () => (selectedBoat === 'all' ? allReviews : allReviews.filter(r => r.boatId === selectedBoat)),
    [allReviews, selectedBoat]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedBoat]);

  const visibleReviews = filteredReviews.slice(0, visibleCount);
  const hasMore = visibleCount < filteredReviews.length;

  const averageRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : "5.0";

  const breadcrumbName = t.breadcrumbs.testimonios ?? 'Opiniones';
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: breadcrumbName, url: "/testimonios" }
  ]);

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
        aria-hidden="true"
        className={`w-4 h-4 ${
          index < rating
            ? 'text-amber-400 fill-amber-400'
            : 'text-muted-foreground/40'
        }`}
      />
    ));
  };

  const countryNameFor = (code: string): string => {
    const lower = code.toLowerCase();
    return tt?.countries?.[lower] ?? code.toUpperCase();
  };

  const ratingLabel = (tt?.hero.ratingLabel ?? 'Sobre {count} opiniones recogidas')
    .replace('{count}', String(allReviews.length));

  const showingLabel = (tt?.pagination.showing ?? 'Mostrando {shown} de {total}')
    .replace('{shown}', String(visibleReviews.length))
    .replace('{total}', String(filteredReviews.length));

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

      <section
        aria-labelledby="testimonios-hero-title"
        className="bg-gradient-to-br from-primary/5 to-primary/10 pt-24 pb-12"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Quote aria-hidden="true" className="w-10 h-10 sm:w-12 sm:h-12 hidden sm:block text-foreground/80" />
              <h1
                id="testimonios-hero-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-center text-foreground"
              >
                {tt?.hero.title ?? 'Lo que dicen quienes ya han navegado'}
              </h1>
            </div>

            <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-8 text-foreground/75 leading-relaxed">
              {tt?.hero.subtitle ?? 'Opiniones reales de familias, parejas y grupos que han zarpado con nosotros desde Blanes. Sin filtros, sin retoques.'}
            </p>

            <div className="bg-card rounded-2xl p-6 max-w-md mx-auto shadow-xs border border-border/40">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-4xl font-bold text-foreground tabular-nums">{averageRating}</span>
                <div className="flex" aria-label={`${averageRating} de 5`}>
                  {renderStars(5)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {ratingLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      <RevealSection className="py-16 sm:py-20 bg-background">
        <section
          aria-labelledby="testimonios-intro-title"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3 space-y-5">
              <h2
                id="testimonios-intro-title"
                className="text-2xl sm:text-3xl font-heading font-bold text-foreground"
              >
                {tt?.intro.title ?? 'Experiencias reales en el mar'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {tt?.intro.paragraph1 ?? 'Cada temporada, cientos de familias, parejas y grupos de amigos zarpan desde el Puerto de Blanes para descubrir las calas más bonitas de la Costa Brava. Estas son sus palabras, sin filtros.'}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {tt?.intro.paragraph2 ?? 'Atendemos en 8 idiomas, ofrecemos barcos sin licencia con gasolina incluida y opciones con patrón si prefieres relajarte. No lo decimos nosotros: lo dicen quienes ya han subido a bordo.'}
              </p>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-pareja-navegando-yates.webp"
                alt={tt?.intro.imageAlt ?? 'Pareja navegando en Trimarchi 57S por la Costa Brava'}
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                decoding="async"
                width={640}
                height={800}
              />
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection className="py-16 sm:py-20 bg-muted">
        <section
          aria-labelledby="testimonios-grid-title"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="mb-8">
            <h2
              id="testimonios-grid-title"
              className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-2 mb-4"
            >
              <Ship aria-hidden="true" className="w-6 h-6 text-primary" />
              {tt?.filter.title ?? 'Filtrar por barco'}
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={selectedBoat === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedBoat('all')}
                data-testid="filter-all"
              >
                {tt?.filter.all ?? 'Todos'} ({allReviews.length})
              </Button>
              {boats.map(boat => {
                const count = allReviews.filter(r => r.boatId === boat.id).length;
                return (
                  <Button
                    key={boat.id}
                    variant={selectedBoat === boat.id ? 'default' : 'outline'}
                    onClick={() => setSelectedBoat(boat.id)}
                    data-testid={`filter-${boat.id}`}
                  >
                    {boat.name} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleReviews.map((review) => {
              const viewBoatLabel = (tt?.card.viewBoat ?? 'Ver {boat}').replace('{boat}', review.boatName);
              return (
                <article
                  key={review.id}
                  className="bg-card border border-border/40 rounded-2xl p-5 transition-shadow hover:shadow-sm"
                  data-testid={`testimonial-${review.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-lg text-foreground">
                        {review.flag && (
                          <span className="mr-1.5" role="img" aria-label={countryNameFor(review.flag)}>
                            {countryFlag(review.flag)}
                          </span>
                        )}
                        {review.name}
                      </h3>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {new Date(review.date + "-01").toLocaleDateString(
                          LOCALE_MAP[language] || "es-ES",
                          { month: "long", year: "numeric" }
                        )}
                      </p>
                    </div>
                    <div className="flex" aria-label={`${review.rating} de 5`}>
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Ship aria-hidden="true" className="w-3 h-3" />
                      {review.boatName}
                    </Badge>

                    <div className="relative">
                      <Quote aria-hidden="true" className="absolute -top-1 -left-1 w-5 h-5 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground pl-5 leading-relaxed">
                        {review.text}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => setLocation(localizedPath("boatDetail", review.boatId))}
                      data-testid={`button-view-boat-${review.id}`}
                      aria-label={viewBoatLabel}
                    >
                      {viewBoatLabel}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          {(hasMore || filteredReviews.length > PAGE_SIZE) && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
                {showingLabel}
              </p>
              {hasMore && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  data-testid="button-show-more"
                >
                  {tt?.pagination.showMore ?? 'Ver más opiniones'}
                </Button>
              )}
            </div>
          )}
        </section>
      </RevealSection>

      <div className="w-full overflow-hidden bg-muted">
        <img
          src="/images/blog/atardecer-mar.jpg"
          alt={tt?.photoBreakAlt ?? 'Atardecer navegando en la Costa Brava'}
          className="w-full aspect-[16/5] min-h-[200px] max-h-[400px] object-cover"
          loading="lazy"
          decoding="async"
          width={1920}
          height={600}
        />
      </div>

      <RevealSection className="py-16 sm:py-20 bg-primary text-primary-foreground">
        <section
          aria-labelledby="testimonios-cta-title"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2
            id="testimonios-cta-title"
            className="text-2xl sm:text-3xl font-heading font-bold mb-4"
          >
            {tt?.cta.title ?? '¿Listo para vivir tu propia historia en el mar?'}
          </h2>
          <p className="text-primary-foreground/85 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
            {tt?.cta.paragraph ?? 'Reserva sin pago online: nos escribes, te confirmamos por WhatsApp y el día reservado solo te queda subir a bordo.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setLocation(localizedPath("home") + "#fleet")}
              data-testid="button-view-fleet"
            >
              {tt?.cta.primary ?? 'Ver nuestra flota'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setLocation(localizedPath("faq"))}
              data-testid="button-view-faq"
            >
              {tt?.cta.secondary ?? 'Preguntas frecuentes'}
            </Button>
          </div>
        </section>
      </RevealSection>

      <Footer />
    </main>
  );
}
