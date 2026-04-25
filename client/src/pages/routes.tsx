import React, { useState, useCallback, lazy, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Ruler, Ship, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
const RouteMap = lazy(() => import("@/components/RouteMap"));
import { boatRoutes } from "@shared/routesData";
import { trackRouteSelected } from "@/utils/analytics";
import type { BoatRoute } from "@shared/routesData";
import { useLanguage, type Language } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { getSEOConfig, generateCanonicalUrl, generateHreflangLinks, generateBreadcrumbSchema } from "@/utils/seo-config";

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform,filter] duration-700 ${
        isVisible
          ? "opacity-100 translate-y-0 blur-none"
          : "opacity-0 translate-y-6 blur-[2px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const difficultyColors: Record<string, string> = {
  easy: "bg-primary/10 text-primary",
  moderate: "bg-cta/10 text-cta",
  advanced: "bg-red-100 text-red-800",
};

const difficultyLabels: Record<string, Record<string, string>> = {
  easy: { es: "Facil", ca: "Facil", en: "Easy", fr: "Facile", de: "Einfach", nl: "Makkelijk", it: "Facile", ru: "Легкий" },
  moderate: { es: "Moderada", ca: "Moderada", en: "Moderate", fr: "Modere", de: "Mittel", nl: "Gemiddeld", it: "Moderato", ru: "Средний" },
  advanced: { es: "Avanzada", ca: "Avancada", en: "Advanced", fr: "Avance", de: "Fortgeschritten", nl: "Gevorderd", it: "Avanzato", ru: "Продвинутый" },
};

/** Memo'd route card to avoid re-renders when sibling cards change selection */
const RouteCard = React.memo(function RouteCard({
  route,
  isSelected,
  language,
  bookBoatLabel,
  onSelect,
}: {
  route: BoatRoute;
  isSelected: boolean;
  language: string;
  bookBoatLabel: string;
  onSelect: (id: string) => void;
}) {
  const desc = route.descriptions[language as Language] || route.descriptions.es;
  const { localizedPath } = useLanguage();
  const handleClick = useCallback(() => onSelect(route.id), [onSelect, route.id]);
  const handleBookClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = localizedPath("home") + "#fleet";
  }, [localizedPath]);

  return (
    <div
      className={`cursor-pointer transition-all rounded-2xl border border-border bg-background p-5 hover:shadow-lg ${
        isSelected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-heading font-semibold text-lg" style={{ color: route.color }}>
          {desc.name}
        </h3>
        <Badge className={difficultyColors[route.difficulty]}>
          {difficultyLabels[route.difficulty]?.[language] || difficultyLabels[route.difficulty]?.es}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">{desc.description}</p>

      <div className="flex items-center gap-4 text-sm text-muted-foreground/60 mb-4">
        <div className="flex items-center gap-1">
          <Ruler className="w-4 h-4" />
          {route.distance}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {route.estimatedTime}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {desc.highlights.map((highlight: string, i: number) => (
          <Badge key={i} variant="secondary" className="text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            {highlight}
          </Badge>
        ))}
      </div>

      {isSelected && (
        <Button
          className="w-full mt-4"
          onClick={handleBookClick}
        >
          <Ship className="w-4 h-4 mr-2" />
          {bookBoatLabel}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
});

function RoutesPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();

  const seoConfig = getSEOConfig("routes", language) || {
    title: "Rutas Sugeridas en Barco | Costa Brava Rent a Boat",
    description: "Descubre las mejores rutas en barco desde Blanes. Desde Sa Palomera hasta Tossa de Mar.",
  };
  const canonical = generateCanonicalUrl("routes", language);
  const hreflangLinks = generateHreflangLinks("routes");
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.routes, url: "/rutas" }
  ]);

  const handleRouteSelect = useCallback((id: string) => {
    setSelectedRouteId(prev => prev === id ? null : id);
    trackRouteSelected(id);
  }, []);

  return (
    <main id="main-content" className="min-h-screen">
      <SEO title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} ogImage={seoConfig.image} canonical={canonical} hreflang={hreflangLinks} jsonLd={breadcrumbSchema} />
      <Navigation />
      <ReadingProgressBar />

      {/* ═══ HERO ═══ */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 pt-20 sm:pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-3">
            {t.routes?.title || "Rutas Sugeridas"}
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t.routes?.subtitle || "Descubre las mejores rutas en barco desde el Puerto de Blanes"}
          </p>
        </div>
      </div>

      {/* ═══ INTRO: text + image ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-4">
                {t.routes?.introText}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                <a href={localizedPath("home") + "#fleet"} className="text-primary hover:underline">{t.routes?.introFleetLink}</a>{" "}
                {t.routes?.introSuffix}
              </p>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-consola-timon-cala.webp"
                alt="Boat console navigating a Costa Brava cove"
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                width={640}
                height={800}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ MAP ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="min-h-[400px] animate-pulse bg-muted rounded-lg" />}>
            <RouteMap
              routes={boatRoutes}
              selectedRouteId={selectedRouteId}
              onRouteSelect={handleRouteSelect}
            />
          </Suspense>
        </div>
      </RevealSection>

      {/* ═══ ROUTE CARDS ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boatRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                isSelected={route.id === selectedRouteId}
                language={language}
                bookBoatLabel={t.routes?.bookBoat || "Reservar barco"}
                onSelect={handleRouteSelect}
              />
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══ PHOTO BREAK ═══ */}
      <div className="w-full overflow-hidden">
        <img
          src="/images/blog/ruta-costera.jpg"
          alt="Coastal route along the Costa Brava by boat"
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* ═══ RELATED DESTINATIONS ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href={localizedPath("locationLloret")} className="block p-6 bg-background rounded-2xl border border-border hover:border-primary transition-colors">
              <h3 className="font-heading font-semibold text-lg mb-2">{t.routes?.lloretTitle}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.routes?.lloretDesc}</p>
            </a>
            <a href={localizedPath("locationTossa")} className="block p-6 bg-background rounded-2xl border border-border hover:border-primary transition-colors">
              <h3 className="font-heading font-semibold text-lg mb-2">{t.routes?.tossaTitle}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.routes?.tossaDesc}</p>
            </a>
            <a href={localizedPath("pricing")} className="block p-6 bg-background rounded-2xl border border-border hover:border-primary transition-colors">
              <h3 className="font-heading font-semibold text-lg mb-2">{t.routes?.pricesTitle}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.routes?.pricesDesc}</p>
            </a>
          </div>
        </div>
      </RevealSection>

      <Footer />
    </main>
  );
}

export default React.memo(RoutesPage);
