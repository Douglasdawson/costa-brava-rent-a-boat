import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { CheckPanel, FaqSheet, H2, NavyHero, PILL_LINK, Rise, Sheet } from "@/components/page-kit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, ArrowRight } from "lucide-react";
import { isCaptainedBoat, boatIncludesFuel, isPubliclyListed } from "@shared/boatData";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { LastUpdated } from "@/components/LastUpdated";
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
import { isJetSkiProduct } from "@shared/jetskiProducts";
import { isLicenseFreeEraActive } from "@shared/constants";
import { substituteFaqVars, computeFaqVars } from "@/utils/faqVars";
import { getBoatImage } from "@/utils/boatImages";
import { translateBoatText } from "@shared/boatTextTranslations";
import { BookingStickyBar } from "@/components/MobileStickyBar";

type SeasonKey = "BAJA" | "MEDIA" | "ALTA";

function getMinPrice(boat: Boat, season: SeasonKey): number | null {
  if (!boat.pricing) return null;
  const seasonData = (
    boat.pricing as Record<SeasonKey, { period: string; prices: Record<string, number> }>
  )[season];
  return getMinActivePrice(seasonData?.prices);
}

const LOCALE_BY_LANG: Record<string, string> = {
  es: "es-ES",
  ca: "ca-ES",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  nl: "nl-NL",
  it: "it-IT",
  ru: "ru-RU",
};

function formatPrice(price: number | null, language: string): string {
  if (price === null) return "-";
  const locale = LOCALE_BY_LANG[language] || "es-ES";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

type PricingPageStrings = {
  licenseTypes: Record<string, string>;
  licenseFallback: string;
};

function getLicenseLabel(boat: Boat, strings: PricingPageStrings): string {
  // Captained boats are not "sin licencia": the customer does not pilot, so
  // neither the licence-free badge nor fuel-included claims apply to them.
  if (isCaptainedBoat(boat.id)) {
    return strings.licenseTypes.captained ?? strings.licenseFallback;
  }
  const lt = (boat as Boat & { licenseType?: string }).licenseType;
  if (lt && lt !== "none") {
    return strings.licenseTypes[lt] ?? lt;
  }
  if (!boat.requiresLicense) return strings.licenseTypes.none;
  const licenseFeature = (boat.features as string[] | null)?.find(
    f => f.toLowerCase().includes("licencia") || f.toLowerCase().includes("license")
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
    // Jet ski products use slot pricing, not the per-hour/season table shown here.
    .filter(boat => isPubliclyListed(boat) && !isJetSkiProduct(boat.id))
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
  const itemListSchema =
    activeBoats.length > 0
      ? {
          "@type": "ItemList",
          name: "Precios Alquiler de Barcos en Blanes",
          numberOfItems: activeBoats.length,
          itemListElement: activeBoats.map((boat, index) => {
            const allPrices = (["BAJA", "MEDIA", "ALTA"] as SeasonKey[])
              .map(s => getMinPrice(boat, s))
              .filter((p): p is number => p !== null);
            const lowPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
            const highPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;

            return {
              "@type": "ListItem",
              position: index + 1,
              name: translateBoatText(boat.name, language),
              url: `https://www.costabravarentaboat.com/barco/${boat.id}`,
              item: {
                "@type": "Product",
                name: `Alquiler ${translateBoatText(boat.name, language)} en Blanes`,
                description: `Barco ${translateBoatText(boat.name, language)} para ${boat.capacity} personas${isCaptainedBoat(boat.id) ? " (con patron incluido)" : boat.requiresLicense ? " (requiere licencia)" : " (sin licencia)"}`,
                brand: { "@type": "Brand", name: "Costa Brava Rent a Boat" },
                ...(lowPrice && highPrice
                  ? {
                      offers: {
                        "@type": "AggregateOffer",
                        priceCurrency: "EUR",
                        lowPrice: lowPrice.toString(),
                        highPrice: highPrice.toString(),
                        offerCount: allPrices.length,
                        availability: "https://schema.org/InStock",
                        seller: { "@type": "Organization", name: "Costa Brava Rent a Boat Blanes" },
                      },
                    }
                  : {}),
              },
            };
          }),
        }
      : null;

  const graphItems = [breadcrumbSchema, faqSchema, ...(itemListSchema ? [itemListSchema] : [])];

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": graphItems,
  };

  return (
    <main id="main-content" className="min-h-screen bg-background">
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
      <ReadingProgressBar />

      {/* HERO */}
      <NavyHero
        title={pp.heroTitle}
        subtitle={pp.heroSubtitle}
        facts={[pp.fuelBadge, `${activeBoats.length} ${pp.fleetCountSuffix}`]}
        next="background"
      >
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-primary-foreground/80 dark:text-foreground/80">
          {pp.portAccessible}{" "}
          <a
            href={localizedPath("locationMalgrat")}
            className="underline underline-offset-4 hover:text-primary-foreground dark:hover:text-foreground"
          >
            Malgrat de Mar
          </a>{" "}
          (10 min),{" "}
          <a
            href={localizedPath("locationSantaSusanna")}
            className="underline underline-offset-4 hover:text-primary-foreground dark:hover:text-foreground"
          >
            Santa Susanna
          </a>{" "}
          (15 min),{" "}
          <a
            href={localizedPath("locationCalella")}
            className="underline underline-offset-4 hover:text-primary-foreground dark:hover:text-foreground"
          >
            Calella
          </a>{" "}
          (20 min)
        </p>
        <LastUpdated
          date="2026-09-03"
          className="mt-3 text-center text-primary-foreground/70 dark:text-foreground/70"
        />
      </NavyHero>

      {/* WHAT THE PRICE INCLUDES */}
      <Sheet tone="background" next="muted" aria-labelledby="pricing-includes-title">
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-[7fr_5fr] lg:gap-16">
          <Rise>
            <h2 id="pricing-includes-title" className={H2}>
              {pp.info.whatIncludesTitle}
            </h2>
            <CheckPanel
              className="mt-8"
              items={[
                <span key="fuel" dangerouslySetInnerHTML={{ __html: pp.info.fuelIncludedItem }} />,
                pp.info.insurance,
                pp.info.briefing,
                pp.info.equipment,
              ]}
            />
          </Rise>
          <Rise delay={0.1}>
            <img
              src="/images/boats/astec-480/alquiler-barco-astec-480-rent-a-boat-costa-brava-blanes-navegando-patron.webp"
              alt="Boat rental pricing - navigating the Costa Brava coast"
              className="aspect-[4/3] w-full rounded-2xl object-cover"
              loading="lazy"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* PRICING TABLE (season legend above it) */}
      <Sheet tone="muted" next="background" aria-label={pp.heroTitle}>
        <div className="container mx-auto max-w-6xl px-4">
          <ul className="mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {(["BAJA", "MEDIA", "ALTA"] as SeasonKey[]).map(season => (
              <li key={season} className="flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    season === "BAJA"
                      ? "bg-green-500"
                      : season === "MEDIA"
                        ? "bg-yellow-500"
                        : "bg-primary"
                  }`}
                />
                <span className="font-medium">{pp.seasonNames[season]}</span>
                <span className="text-muted-foreground">({pp.seasonLabels[season]})</span>
              </li>
            ))}
          </ul>
          {isLoading ? (
            <div className="flex justify-center py-12" role="status">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
              <span className="sr-only">Loading...</span>
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">{pp.table.boat}</TableHead>
                      <TableHead className="text-center">{pp.table.capacity}</TableHead>
                      <TableHead className="text-center">{pp.table.license}</TableHead>
                      {(["BAJA", "MEDIA", "ALTA"] as SeasonKey[]).map(season => (
                        <TableHead key={season} className="text-center">
                          <div className="flex flex-col items-center">
                            <span
                              className={`inline-block w-3 h-3 rounded-full mb-1 ${
                                season === "BAJA"
                                  ? "bg-green-500"
                                  : season === "MEDIA"
                                    ? "bg-yellow-500"
                                    : "bg-primary"
                              }`}
                            />
                            <span>{pp.seasonShort[season]}</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {pp.seasonLabels[season]}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center w-[140px]">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeBoats.map(boat => {
                      const minBaja = getMinPrice(boat, "BAJA");
                      const minMedia = getMinPrice(boat, "MEDIA");
                      const minAlta = getMinPrice(boat, "ALTA");

                      return (
                        <TableRow key={boat.id}>
                          <TableCell className="font-medium">
                            <a
                              href={localizedPath("boatDetail", boat.id)}
                              className="flex items-center gap-3 hover:text-primary transition-colors underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none rounded-sm"
                            >
                              <img
                                src={getBoatImage(boat.imageUrl || "")}
                                alt={translateBoatText(boat.name, language)}
                                className="w-12 h-9 rounded object-cover flex-shrink-0"
                                loading="lazy"
                                width={48}
                                height={36}
                              />
                              {translateBoatText(boat.name, language)}
                            </a>
                            {boatIncludesFuel(boat.id, boat.requiresLicense) && (
                              <span className="ml-2 text-xs font-normal text-success">
                                {pp.fuelIncludedTag}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              {boat.capacity}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm text-muted-foreground">
                              {getLicenseLabel(boat, pp)}
                            </span>
                          </TableCell>
                          {[minBaja, minMedia, minAlta].map((min, i) => (
                            <TableCell key={i} className="text-center font-semibold tabular-nums">
                              {min !== null ? (
                                <span>
                                  {pp.from} {formatPrice(min, language)}
                                  <span className="text-sm font-normal">{pp.perHour}</span>
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openBookingModal(boat.id)}
                              aria-label={`${pp.reserveButton}: ${translateBoatText(boat.name, language)}`}
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
              </div>

              {/* Mobile card view */}
              <div className="lg:hidden space-y-4">
                {activeBoats.map(boat => {
                  const minBaja = getMinPrice(boat, "BAJA");
                  const minMedia = getMinPrice(boat, "MEDIA");
                  const minAlta = getMinPrice(boat, "ALTA");

                  return (
                    <div key={boat.id} className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <a href={localizedPath("boatDetail", boat.id)} className="flex-shrink-0">
                          <img
                            src={getBoatImage(boat.imageUrl || "")}
                            alt={translateBoatText(boat.name, language)}
                            className="w-16 h-12 rounded-lg object-cover"
                            loading="lazy"
                            width={64}
                            height={48}
                          />
                        </a>
                        <div className="flex-1 flex items-start justify-between min-w-0">
                          <div>
                            <a
                              href={localizedPath("boatDetail", boat.id)}
                              className="text-lg font-semibold hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none rounded-sm"
                            >
                              {translateBoatText(boat.name, language)}
                            </a>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {boat.capacity} personas
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 text-sm text-muted-foreground">
                            {getLicenseLabel(boat, pp)}
                          </span>
                        </div>
                      </div>
                      {boatIncludesFuel(boat.id, boat.requiresLicense) && (
                        <p className="mb-3 text-sm text-success">{pp.fuelIncludedFull}</p>
                      )}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {(["BAJA", "MEDIA", "ALTA"] as SeasonKey[]).map(season => {
                          const price = getMinPrice(boat, season);
                          return (
                            <div key={season} className="text-center rounded-lg bg-muted p-3">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${
                                    season === "BAJA"
                                      ? "bg-green-500"
                                      : season === "MEDIA"
                                        ? "bg-yellow-500"
                                        : "bg-primary"
                                  }`}
                                />
                                <span className="text-xs text-muted-foreground font-medium">
                                  {pp.seasonShort[season]}
                                </span>
                              </div>
                              <div className="font-heading text-lg font-semibold tabular-nums">
                                {price !== null ? formatPrice(price, language) : "-"}
                              </div>
                              {price !== null && (
                                <div className="text-xs text-muted-foreground">
                                  {pp.perHourLong}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => openBookingModal(boat.id)}
                        aria-label={pp.reserveSpecificButton.replace(
                          "{name}",
                          translateBoatText(boat.name, language)
                        )}
                      >
                        {pp.reserveSpecificButton.replace(
                          "{name}",
                          translateBoatText(boat.name, language)
                        )}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Sheet>

      {/* IMPORTANT INFO */}
      <Sheet tone="background" next="muted" aria-labelledby="pricing-important-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 id="pricing-important-title" className={H2}>
              {pp.info.importantTitle}
            </h2>
            <img
              src="/images/blog/grupos-barco.webp"
              alt="Group enjoying a boat day on the Costa Brava"
              className="mt-8 aspect-[4/3] w-full rounded-2xl object-cover"
              loading="lazy"
              width={1920}
              height={600}
            />
          </Rise>
          <Rise delay={0.1}>
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {[
                pp.info.minPerHour,
                pp.info.deposit,
                pp.info.freeCancellation,
                pp.info.licenseRequired,
              ].map((html, i) => (
                <li
                  key={i}
                  className="border-b border-border px-5 py-4 text-base leading-relaxed text-muted-foreground last:border-b-0 sm:px-6 [&_strong]:font-semibold [&_strong]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ))}
            </ul>
          </Rise>
        </div>
      </Sheet>

      {/* FAQ: cards born folded, answers stay in the DOM */}
      <FaqSheet
        idPrefix="pricing-faq"
        tone="muted"
        next="background"
        title={pp.faqTitle}
        items={[
          { question: pp.faq.q1, answer: noLicAnswer },
          { question: pp.faq.q2, answer: pp.faq.a2 },
          { question: pp.faq.q3, answer: pp.faq.a3 },
          { question: pp.faq.q4, answer: licAnswer },
        ]}
      />

      {/* CATEGORY LINKS: price pages should route authority to both categories */}
      <Sheet tone="background" next="navy" className="py-10 sm:py-12" aria-label={pp.heroTitle}>
        <div className="container mx-auto flex max-w-6xl flex-wrap justify-center gap-3 px-4">
          {/* Licence-free rental ends 2026-10-01 (RD 1188/2025): no link after that. */}
          {isLicenseFreeEraActive() && (
            <a
              href={localizedPath("categoryLicenseFree")}
              className={PILL_LINK}
              data-testid="pricing-link-license-free"
            >
              {t.breadcrumbs.categoryLicenseFree}
            </a>
          )}
          <a
            href={localizedPath("categoryLicensed")}
            className={PILL_LINK}
            data-testid="pricing-link-licensed"
          >
            {t.categoryLicensed!.crossLinkFromFree}
          </a>
          <a
            href={localizedPath("categoryCaptained")}
            className={PILL_LINK}
            data-testid="pricing-link-captained"
          >
            {t.captainedPage!.crossLinkLabel}
          </a>
        </div>
      </Sheet>

      {/* CTA: closes over the footer colour */}
      <Sheet tone="navy" next="footer" aria-labelledby="pricing-cta-title">
        <Rise className="container mx-auto max-w-3xl px-4 text-center">
          <h2 id="pricing-cta-title" className={H2}>
            {pp.cta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/85 text-pretty sm:text-lg dark:text-foreground/85">
            {pp.cta.subtitle}
          </p>
          <InteractiveHoverButton
            tone="light"
            onClick={() => openBookingModal()}
            className="mt-8 min-h-12 px-8 text-base"
          >
            {pp.cta.button}
          </InteractiveHoverButton>
        </Rise>
      </Sheet>
      <div className="bg-foreground">
        <BookingStickyBar />
      </div>
      <Footer />
    </main>
  );
}
