import React, { useState, useCallback, lazy, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Ruler, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { LastUpdated } from "@/components/LastUpdated";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  Fold,
  H2,
  PageHeader,
  PhotoBand,
  Rise,
  Sheet,
  splitSentences,
} from "@/components/content-kit";
const RouteMap = lazy(() => import("@/components/RouteMap"));
import { boatRoutes } from "@shared/routesData";
import { trackRouteSelected } from "@/utils/analytics";
import type { BoatRoute } from "@shared/routesData";
import { useLanguage, type Language } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  getSEOConfig,
  generateCanonicalUrl,
  generateHreflangLinks,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { generateRoutesItemListSchema } from "@/utils/seo-schemas";

const difficultyColors: Record<string, string> = {
  easy: "bg-primary/10 text-primary",
  moderate: "bg-cta/10 text-cta",
  advanced: "bg-red-100 text-red-800",
};

const difficultyLabels: Record<string, Record<string, string>> = {
  easy: {
    es: "Facil",
    ca: "Facil",
    en: "Easy",
    fr: "Facile",
    de: "Einfach",
    nl: "Makkelijk",
    it: "Facile",
    ru: "Легкий",
  },
  moderate: {
    es: "Moderada",
    ca: "Moderada",
    en: "Moderate",
    fr: "Modere",
    de: "Mittel",
    nl: "Gemiddeld",
    it: "Moderato",
    ru: "Средний",
  },
  advanced: {
    es: "Avanzada",
    ca: "Avancada",
    en: "Advanced",
    fr: "Avance",
    de: "Fortgeschritten",
    nl: "Gevorderd",
    it: "Avanzato",
    ru: "Продвинутый",
  },
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
  const handleBookClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      window.location.href = localizedPath("home") + "#fleet";
    },
    [localizedPath]
  );

  return (
    <div
      className={`cursor-pointer rounded-2xl border bg-background p-5 transition-colors motion-reduce:transition-none [@media(hover:hover)]:hover:border-foreground/30 ${
        isSelected ? "border-primary ring-2 ring-primary" : "border-border"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="flex items-start gap-2.5 font-heading text-lg font-semibold tracking-tight">
          <span
            className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: route.color }}
            aria-hidden="true"
          />
          {desc.name}
        </h3>
        <Badge className={difficultyColors[route.difficulty]}>
          {difficultyLabels[route.difficulty]?.[language] || difficultyLabels[route.difficulty]?.es}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
        {desc.description}
      </p>

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
        <InteractiveHoverButton tone="dark" className="mt-4 w-full" onClick={handleBookClick}>
          {bookBoatLabel}
        </InteractiveHoverButton>
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
    description:
      "Descubre las mejores rutas en barco desde Blanes. Desde Sa Palomera hasta Tossa de Mar.",
  };
  const canonical = generateCanonicalUrl("routes", language);
  const hreflangLinks = generateHreflangLinks("routes");
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.routes, url: "/rutas" },
  ]);
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [breadcrumbSchema, generateRoutesItemListSchema(language)],
  };

  const handleRouteSelect = useCallback((id: string) => {
    setSelectedRouteId(prev => (prev === id ? null : id));
    trackRouteSelected(id);
  }, []);

  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const guide = t.routes?.guide;
  const guideItems = guide
    ? [
        { id: "geography", title: guide.geographyTitle, body: guide.geographyBody },
        { id: "sea", title: guide.seaTitle, body: guide.seaBody },
        { id: "calas", title: guide.calasTitle, body: guide.calasBody },
        { id: "season", title: guide.seasonTitle, body: guide.seasonBody },
      ]
    : [];
  const [introLead, introRest] = splitSentences(t.routes?.introText);
  const related = [
    {
      href: localizedPath("locationLloret"),
      title: t.routes?.lloretTitle,
      desc: t.routes?.lloretDesc,
    },
    {
      href: localizedPath("locationTossa"),
      title: t.routes?.tossaTitle,
      desc: t.routes?.tossaDesc,
    },
    { href: localizedPath("pricing"), title: t.routes?.pricesTitle, desc: t.routes?.pricesDesc },
  ];

  return (
    <main id="main-content" className="min-h-screen">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        ogImage={seoConfig.image}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      <PageHeader
        title={t.routes?.title || "Rutas Sugeridas"}
        subtitle={
          t.routes?.subtitle || "Descubre las mejores rutas en barco desde el Puerto de Blanes"
        }
        next="background"
      >
        <div className="mt-4 [&_p]:!text-primary-foreground/70 dark:[&_p]:!text-foreground/70">
          <LastUpdated date="2026-05-31" />
        </div>
      </PageHeader>

      {/* INTRO: first sentence is the lead, the rest are loose facts with rules */}
      <Sheet tone="background" next="muted">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-5 lg:gap-16">
          <Rise className="lg:col-span-3">
            <p className="max-w-xl text-lg font-medium leading-snug text-foreground text-pretty sm:text-xl">
              {introLead}
            </p>
            <ul className="mt-6 max-w-xl border-t border-border">
              <li className="border-b border-border py-4 text-base leading-relaxed text-muted-foreground text-pretty">
                {introRest.join(" ")}{" "}
                <a
                  href={localizedPath("home") + "#fleet"}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {t.routes?.introFleetLink}
                </a>{" "}
                {t.routes?.introSuffix}
              </li>
            </ul>
          </Rise>
          <Rise className="lg:col-span-2" delay={0.1}>
            <img
              src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-consola-timon-cala.webp"
              alt="Boat console navigating a Costa Brava cove"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
              loading="lazy"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* MAP */}
      <Sheet tone="muted" next="background" className="py-10 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <Suspense
            fallback={
              <div className="min-h-[400px] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
            }
          >
            <RouteMap
              routes={boatRoutes}
              selectedRouteId={selectedRouteId}
              onRouteSelect={handleRouteSelect}
            />
          </Suspense>
        </div>
      </Sheet>

      {/* ROUTE CARDS */}
      <Sheet tone="background" next="muted">
        <div className="container mx-auto max-w-6xl px-4">
          <Rise className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {boatRoutes.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                isSelected={route.id === selectedRouteId}
                language={language}
                bookBoatLabel={t.routes?.bookBoat || "Reservar barco"}
                onSelect={handleRouteSelect}
              />
            ))}
          </Rise>
        </div>
      </Sheet>

      <PhotoBand
        tone="muted"
        next={guide ? "background" : "muted"}
        webp="/images/blog/ruta-costera.webp"
        src="/images/blog/ruta-costera.jpg"
        alt="Coastal route along the Costa Brava by boat"
      />

      {/* NAVIGATION GUIDE (GEO prose): folded, answers stay in the DOM */}
      {guide && (
        <Sheet tone="background" next="muted">
          <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[5fr_6fr] lg:gap-16">
            <Rise className="lg:sticky lg:top-[calc(var(--nav-height,5rem)+1rem)] lg:self-start">
              <h2 className={H2}>{guide.heading}</h2>
            </Rise>
            <Rise delay={0.1} className="flex flex-col gap-3 sm:gap-4">
              {guideItems.map(item => (
                <Fold
                  key={item.id}
                  id={`routes-guide-${item.id}`}
                  title={item.title}
                  open={openGuide === item.id}
                  onToggle={() => setOpenGuide(openGuide === item.id ? null : item.id)}
                >
                  {item.body}
                </Fold>
              ))}
            </Rise>
          </div>
        </Sheet>
      )}

      {/* RELATED: one ruled panel of links, not three identical cards */}
      <Sheet tone="muted" next="foot">
        <Rise className="container mx-auto max-w-4xl px-4">
          <ul className="overflow-hidden rounded-2xl border border-border bg-background">
            {related.map(item => (
              <li key={item.href} className="border-b border-border last:border-b-0">
                <a
                  href={item.href}
                  className="group flex items-center justify-between gap-6 px-5 py-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cta motion-reduce:transition-none sm:px-6 [@media(hover:hover)]:hover:bg-muted/50"
                >
                  <span>
                    <span className="block font-heading text-lg font-semibold tracking-tight">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground text-pretty">
                      {item.desc}
                    </span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </Rise>
      </Sheet>

      <Footer />
    </main>
  );
}

export default React.memo(RoutesPage);
