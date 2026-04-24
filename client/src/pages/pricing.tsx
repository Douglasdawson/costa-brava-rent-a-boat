import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Anchor,
  Fuel,
  ArrowRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import type { Boat } from "@shared/schema";
import { getMinActivePrice, minPriceAcrossBoats } from "@shared/pricing";
import { substituteFaqVars, computeFaqVars } from "@/utils/faqVars";

type SeasonKey = "BAJA" | "MEDIA" | "ALTA";

function getMinPrice(boat: Boat, season: SeasonKey): number | null {
  if (!boat.pricing) return null;
  const seasonData = (boat.pricing as Record<SeasonKey, { period: string; prices: Record<string, number> }>)[season];
  return getMinActivePrice(seasonData?.prices);
}

function formatPrice(price: number | null): string {
  if (price === null) return "-";
  return `${price}\u20AC`;
}

type PricingPageStrings = {
  licenseTypes: Record<string, string>;
  licenseFallback: string;
};

function getLicenseLabel(boat: Boat, strings: PricingPageStrings): string {
  const lt = (boat as Boat & { licenseType?: string }).licenseType;
  if (lt && lt !== "none") {
    return strings.licenseTypes[lt] ?? lt;
  }
  if (!boat.requiresLicense) return strings.licenseTypes.none;
  const licenseFeature = (boat.features as string[] | null)?.find(
    (f) => f.toLowerCase().includes("licencia") || f.toLowerCase().includes("license")
  );
  return licenseFeature ?? strings.licenseFallback;
}

export default function PricingPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const seoConfig = getSEOConfig("pricing", language);
  const hreflangLinks = generateHreflangLinks("pricing");
  const canonical = generateCanonicalUrl("pricing", language);

  const { data: boats, isLoading } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });

  const activeBoats = (boats || [])
    .filter((boat) => boat.isActive)
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  // Always defined at runtime: useTranslations deep-merges missing keys from es.ts.
  const pp = t.pricingPage!;
  const faqVars = computeFaqVars(boats);
  const noLicAnswer = substituteFaqVars(pp.faq.a1Template, faqVars);
  const licAnswer = substituteFaqVars(pp.faq.a4Template, faqVars);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs?.home || "Inicio", url: "/" },
    { name: pp.heroTitle, url: "/precios" },
  ]);

  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: pp.faq.q1,
        acceptedAnswer: { "@type": "Answer", text: noLicAnswer },
      },
      {
        "@type": "Question",
        name: pp.faq.q2,
        acceptedAnswer: {
          "@type": "Answer",
          text: pp.faq.a2,
        },
      },
      {
        "@type": "Question",
        name: pp.faq.q3,
        acceptedAnswer: {
          "@type": "Answer",
          text: pp.faq.a3,
        },
      },
      {
        "@type": "Question",
        name: pp.faq.q4,
        acceptedAnswer: { "@type": "Answer", text: licAnswer },
      },
    ],
  };

  // Dynamic ItemList schema with Product entries for each boat
  const itemListSchema = activeBoats.length > 0 ? {
    "@type": "ItemList",
    "name": "Precios Alquiler de Barcos en Blanes",
    "numberOfItems": activeBoats.length,
    "itemListElement": activeBoats.map((boat, index) => {
      const allPrices = (["BAJA", "MEDIA", "ALTA"] as SeasonKey[])
        .map(s => getMinPrice(boat, s))
        .filter((p): p is number => p !== null);
      const lowPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
      const highPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;

      return {
        "@type": "ListItem",
        "position": index + 1,
        "name": boat.name,
        "url": `https://www.costabravarentaboat.com/barco/${boat.id}`,
        "item": {
          "@type": "Product",
          "name": `Alquiler ${boat.name} en Blanes`,
          "description": `Barco ${boat.name} para ${boat.capacity} personas${boat.requiresLicense ? " (requiere licencia)" : " (sin licencia)"}`,
          "brand": { "@type": "Brand", "name": "Costa Brava Rent a Boat" },
          ...(lowPrice && highPrice ? {
            "offers": {
              "@type": "AggregateOffer",
              "priceCurrency": "EUR",
              "lowPrice": lowPrice.toString(),
              "highPrice": highPrice.toString(),
              "offerCount": allPrices.length,
              "availability": "https://schema.org/InStock",
              "seller": { "@type": "Organization", "name": "Costa Brava Rent a Boat Blanes" }
            }
          } : {})
        }
      };
    })
  } : null;

  const graphItems = [
    breadcrumbSchema,
    faqSchema,
    ...(itemListSchema ? [itemListSchema] : []),
  ];

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": graphItems,
  };

  return (
    <main id="main-content" className="min-h-screen">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        keywords={seoConfig.keywords}
        ogImage={seoConfig.image}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />

      {/* Hero */}
      <div className="bg-card border-b border-border pt-28 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            {pp.heroTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
            {pp.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Badge variant="outline" className="text-primary border-primary">
              <Fuel className="w-4 h-4 mr-2" />
              {pp.fuelBadge}
            </Badge>
            <Badge variant="outline" className="text-primary border-primary">
              <Anchor className="w-4 h-4 mr-2" />
              {activeBoats.length} {pp.fleetCountSuffix}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm text-center mt-4">
            {pp.portAccessible}{" "}
            <a href={localizedPath("locationMalgrat")} className="text-primary hover:underline">Malgrat de Mar</a> (10 min),{" "}
            <a href={localizedPath("locationSantaSusanna")} className="text-primary hover:underline">Santa Susanna</a> (15 min),{" "}
            <a href={localizedPath("locationCalella")} className="text-primary hover:underline">Calella</a> (20 min)
          </p>
        </div>
      </div>

      {/* Season legend */}
      <div className="bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            {(["BAJA", "MEDIA", "ALTA"] as SeasonKey[]).map((season) => (
              <div key={season} className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    season === "BAJA"
                      ? "bg-green-500"
                      : season === "MEDIA"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
                <span className="font-medium">{pp.seasonNames[season]}</span>
                <span className="text-muted-foreground">({pp.seasonLabels[season]})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-12" role="status">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <span className="sr-only">Loading...</span>
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden lg:block">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">{pp.table.boat}</TableHead>
                          <TableHead className="text-center">{pp.table.capacity}</TableHead>
                          <TableHead className="text-center">{pp.table.license}</TableHead>
                          {(["BAJA", "MEDIA", "ALTA"] as SeasonKey[]).map((season) => (
                            <TableHead key={season} className="text-center">
                              <div className="flex flex-col items-center">
                                <span
                                  className={`inline-block w-3 h-3 rounded-full mb-1 ${
                                    season === "BAJA"
                                      ? "bg-green-500"
                                      : season === "MEDIA"
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                />
                                <span>{pp.seasonShort[season]}</span>
                                <span className="text-xs font-normal text-muted-foreground">
                                  {pp.seasonLabels[season]}
                                </span>
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="text-center w-[140px]"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeBoats.map((boat) => {
                          const minBaja = getMinPrice(boat, "BAJA");
                          const minMedia = getMinPrice(boat, "MEDIA");
                          const minAlta = getMinPrice(boat, "ALTA");

                          return (
                            <TableRow key={boat.id}>
                              <TableCell className="font-medium">
                                <a
                                  href={localizedPath("boatDetail", boat.id)}
                                  className="hover:text-primary transition-colors underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none rounded-sm"
                                >
                                  {boat.name}
                                </a>
                                {!boat.requiresLicense && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs bg-green-100 text-green-800"
                                  >
                                    <Fuel className="w-3 h-3 mr-1" />
                                    {pp.fuelIncludedTag}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                  {boat.capacity}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={boat.requiresLicense ? "default" : "outline"}
                                  className={
                                    boat.requiresLicense
                                      ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                      : "border-green-600 text-green-700"
                                  }
                                >
                                  {getLicenseLabel(boat, pp)}
                                </Badge>
                              </TableCell>
                              {[minBaja, minMedia, minAlta].map((min, i) => (
                                <TableCell key={i} className="text-center font-semibold">
                                  {min !== null ? (
                                    <span>
                                      {pp.from} {formatPrice(min)}<span className="text-sm font-normal">{pp.perHour}</span>
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                              ))}
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  className="bg-cta hover:bg-cta/90 text-white"
                                  onClick={() => openBookingModal(boat.id)}
                                  aria-label={`${pp.reserveButton}: ${boat.name}`}
                                >
                                  {pp.reserveButton}
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile card view */}
              <div className="lg:hidden space-y-4">
                {activeBoats.map((boat) => {
                  const minBaja = getMinPrice(boat, "BAJA");
                  const minMedia = getMinPrice(boat, "MEDIA");
                  const minAlta = getMinPrice(boat, "ALTA");

                  return (
                    <Card key={boat.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <a
                              href={localizedPath("boatDetail", boat.id)}
                              className="text-lg font-semibold hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none rounded-sm"
                            >
                              {boat.name}
                            </a>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {boat.capacity} personas
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={boat.requiresLicense ? "default" : "outline"}
                            className={
                              boat.requiresLicense
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "border-green-600 text-green-700"
                            }
                          >
                            {getLicenseLabel(boat, pp)}
                          </Badge>
                        </div>
                        {!boat.requiresLicense && (
                          <Badge
                            variant="secondary"
                            className="w-fit text-xs bg-green-100 text-green-800 mt-2"
                          >
                            <Fuel className="w-3 h-3 mr-1" />
                            {pp.fuelIncludedFull}
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {(["BAJA", "MEDIA", "ALTA"] as SeasonKey[]).map((season) => {
                            const price = getMinPrice(boat, season);
                            return (
                              <div
                                key={season}
                                className="text-center rounded-lg bg-muted p-3"
                              >
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <span
                                    className={`inline-block w-2 h-2 rounded-full ${
                                      season === "BAJA"
                                        ? "bg-green-500"
                                        : season === "MEDIA"
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                    }`}
                                  />
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {pp.seasonShort[season]}
                                  </span>
                                </div>
                                <div className="font-bold text-lg">
                                  {price !== null ? `${formatPrice(price)}` : "-"}
                                </div>
                                {price !== null && (
                                  <div className="text-xs text-muted-foreground">{pp.perHourLong}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <Button
                          className="w-full bg-cta hover:bg-cta/90 text-white"
                          onClick={() => openBookingModal(boat.id)}
                          aria-label={pp.reserveSpecificButton.replace("{name}", boat.name)}
                        >
                          {pp.reserveSpecificButton.replace("{name}", boat.name)}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Info section */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">{pp.info.whatIncludesTitle}</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Fuel className="w-4 h-4 text-green-600 mt-1 shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: pp.info.fuelIncludedItem }} />
                  </li>
                  <li className="flex items-start gap-2">
                    <Anchor className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <span>{pp.info.insurance}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <span>{pp.info.briefing}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Anchor className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <span>{pp.info.equipment}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">{pp.info.importantTitle}</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li dangerouslySetInnerHTML={{ __html: pp.info.minPerHour }} />
                  <li dangerouslySetInnerHTML={{ __html: pp.info.deposit }} />
                  <li dangerouslySetInnerHTML={{ __html: pp.info.freeCancellation }} />
                  <li dangerouslySetInnerHTML={{ __html: pp.info.licenseRequired }} />
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* FAQ section */}
          <div className="mt-12">
            <h2 className="text-2xl font-heading font-bold text-center mb-8">
              {pp.faqTitle}
            </h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{pp.faq.q1}</h3>
                  <p className="text-muted-foreground">{noLicAnswer}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{pp.faq.q2}</h3>
                  <p className="text-muted-foreground">{pp.faq.a2}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{pp.faq.q3}</h3>
                  <p className="text-muted-foreground">{pp.faq.a3}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{pp.faq.q4}</h3>
                  <p className="text-muted-foreground">{licAnswer}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <section className="mt-12 bg-primary text-primary-foreground rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-heading font-bold mb-4">{pp.cta.title}</h2>
            <p className="text-lg mb-6 text-primary-foreground/85 max-w-2xl mx-auto">{pp.cta.subtitle}</p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => openBookingModal()}
              className="rounded-full"
            >
              <Anchor className="w-5 h-5 mr-2" />
              {pp.cta.button}
            </Button>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
