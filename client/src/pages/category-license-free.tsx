import { Users, Gauge } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  Callout,
  CheckPanel,
  DefList,
  FaqSheet,
  H2,
  LeadFacts,
  NavyHero,
  PILL_LINK,
  Rise,
  Sheet,
  StepList,
} from "@/components/page-kit";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { useLanguage } from "@/hooks/use-language";
import { ReducedDepositLink } from "@/components/ReducedDepositLink";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { BOAT_DATA, type BoatData } from "@shared/boatData";
import { eraCopy } from "@shared/constants";
import { escolaNauticaHandoff } from "@shared/escolaNauticaLinks";
import type { Boat } from "@shared/schema";
import { minPriceAcrossBoats } from "@shared/pricing";
import { isJetSkiProduct } from "@shared/jetskiProducts";
import { useQuery } from "@tanstack/react-query";
import { translateBoatText } from "@shared/boatTextTranslations";
import { BUSINESS_RATING_STR, BUSINESS_REVIEW_COUNT_STR } from "@shared/businessProfile";

export default function CategoryLicenseFreePage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig("categoryLicenseFree", language);
  const hreflangLinks = generateHreflangLinks("categoryLicenseFree");
  const canonical = generateCanonicalUrl("categoryLicenseFree", language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  // License-free fleet: derived from /api/boats with a BOAT_DATA fallback so
  // SSR and first-paint never render an empty grid. Excursion Privada is
  // excluded because it's a captained service, not a self-service rental.
  const { data: apiBoats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const liveUnlicensed = (apiBoats ?? []).filter(
    b => b.isActive && !b.requiresLicense && b.id !== "excursion-privada" && !isJetSkiProduct(b.id)
  );
  const fallbackUnlicensed = Object.values(BOAT_DATA).filter(
    b => b.subtitle.startsWith("Sin licencia") && b.id !== "excursion-privada"
  );
  const sourceBoats: Array<Boat | BoatData> =
    liveUnlicensed.length > 0 ? liveUnlicensed : fallbackUnlicensed;

  const licenseFreeBoats = sourceBoats.map(b => {
    const specs = (b.specifications ?? {}) as { engine?: string; capacity?: string };
    const isDbBoat = "isActive" in b;
    const capacity = isDbBoat
      ? `${(b as Boat).capacity} ${t.boats.people}`
      : (specs.capacity ?? "");
    const minPrice = minPriceAcrossBoats([b as { pricing?: unknown }], "1h", "BAJA");
    return {
      id: b.id,
      name: translateBoatText(b.name, language),
      capacity,
      engine: specs.engine ?? "",
      features: (b.features ?? []).slice(0, 3),
      price: minPrice ? `Desde ${minPrice}\u20AC/h` : "",
    };
  });

  // Detailed comparison data from boatData.ts for the comparison table
  const comparisonBoats = [
    {
      id: "solar-450",
      data: BOAT_DATA["solar-450"],
    },
    {
      id: "remus-450",
      data: BOAT_DATA["remus-450"],
    },
    {
      id: "astec-400",
      data: BOAT_DATA["astec-400"],
    },
    {
      id: "astec-480",
      data: BOAT_DATA["astec-480"],
    },
  ];

  const clf = t.categoryLicenseFree!;
  // RD 1188/2025: from 2026-10-01 the page keeps its URL and keyword but tells the truth:
  // the same small boats, now rented with the titulín (or with a skipper).
  const postEra = eraCopy(false, true);
  const heroTitle = eraCopy(clf.heroTitle, clf.postEraHeroTitle ?? clf.heroTitle);
  const heroDescription = eraCopy(
    clf.heroDescription,
    clf.postEraHeroDescription ?? clf.heroDescription
  );
  const badgeLicense = eraCopy(clf.badgeNoLicense, clf.postEraBadge ?? clf.badgeNoLicense);
  const ctaButton = eraCopy(clf.ctaButton, clf.postEraCtaButton ?? clf.ctaButton);
  const schoolSmall = postEra ? escolaNauticaHandoff(language, "category-small") : null;

  // FAQ items for structured data and display
  // GSC 2026-05-18: added 3 long-tail FAQs (carnet, experiencia, group size)
  // Fase 2 2026-07-24: added which-boat / price-per-hour / bad-weather FAQs
  // (mirror exact search queries). Ordered by search intent.
  const allFaqItems = [
    {
      question: clf.faqWhichBoatQuestion,
      answer: clf.faqWhichBoatAnswer,
    },
    {
      question: clf.faqCarnetQuestion,
      answer: eraCopy(clf.faqCarnetAnswer, clf.postEraFaqCarnetAnswer ?? clf.faqCarnetAnswer),
    },
    {
      question: clf.faqPriceQuestion,
      answer: clf.faqPriceAnswer,
    },
    {
      question: clf.faqDistanceQuestion,
      answer: clf.faqDistanceAnswer,
    },
    {
      question: clf.faqExperienceQuestion,
      answer: clf.faqExperienceAnswer,
    },
    {
      question: clf.faqGroupSizeQuestion,
      answer: clf.faqGroupSizeAnswer,
    },
    {
      question: clf.faqSpeedQuestion,
      answer: clf.faqSpeedAnswer,
    },
    {
      question: clf.faqChildrenQuestion,
      answer: clf.faqChildrenAnswer,
    },
    {
      question: clf.faqWeatherQuestion,
      answer: clf.faqWeatherAnswer,
    },
  ];
  // From 2026-10-01 the licence-free boats are withdrawn: only the answers that stay true remain.
  const faqItems = postEra
    ? allFaqItems.filter(
        i => i.question === clf.faqCarnetQuestion || i.question === clf.faqWeatherQuestion
      )
    : allFaqItems;

  // Best-for descriptions keyed by boat id
  const bestForMap: Record<string, string> = {
    "solar-450": clf.comparisonSolar450,
    "remus-450": clf.comparisonRemus450,
    "astec-400": clf.comparisonAstec400,
    "astec-480": clf.comparisonAstec480,
  };

  // Service schema for license-free boats
  const serviceSchema = {
    "@type": "Service",
    name: "Alquiler de Barcos Sin Licencia en Costa Brava — Puerto de Blanes",
    description:
      "Alquiler de embarcaciones sin licencia hasta 15 CV en Puerto de Blanes, Costa Brava. No requiere titulacion nautica. Barcos para 4-7 personas.",
    provider: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat Blanes",
      telephone: "+34611500372",
      url: "https://www.costabravarentaboat.com/",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Carrer Esplanada del Port",
        addressLocality: "Blanes",
        addressRegion: "Girona",
        postalCode: "17300",
        addressCountry: "ES",
      },
    },
    serviceType: "Boat Rental",
    areaServed: {
      "@type": "Place",
      name: "Costa Brava, Cataluna",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: BUSINESS_RATING_STR,
      reviewCount: BUSINESS_REVIEW_COUNT_STR,
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "70",
      highPrice: "95",
      priceCurrency: "EUR",
      offerCount: "4",
      availability: "https://schema.org/InStock",
    },
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.categoryLicenseFree, url: "/barcos-sin-licencia" },
  ]);

  // ItemList schema for category page (helps Google understand this is a product listing)
  const itemListSchema = {
    "@type": "ItemList",
    name: "Barcos Sin Licencia en Costa Brava — Puerto de Blanes",
    numberOfItems: licenseFreeBoats.length,
    itemListElement: licenseFreeBoats.map((boat, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: boat.name,
      url: `https://www.costabravarentaboat.com/barcos-sin-licencia`,
      item: {
        "@type": "Product",
        name: boat.name,
        description: `Barco sin licencia ${boat.name}, ${boat.capacity}, motor ${boat.engine}`,
        brand: { "@type": "Brand", name: "Costa Brava Rent a Boat" },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: BUSINESS_RATING_STR,
          reviewCount: BUSINESS_REVIEW_COUNT_STR,
          bestRating: "5",
          worstRating: "1",
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          price: boat.price.replace(/[^\d]/g, ""),
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Costa Brava Rent a Boat Blanes" },
        },
      },
    })),
  };

  // FAQ schema for structured data
  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: faqItems.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  // HowTo steps for "Cómo alquilar un barco sin licencia" (added 2026-05-21).
  // Long-tail rescue: pos 13→18 caída en "alquiler barco sin licencia".
  // Solo se renderiza si el idioma tiene las claves (es las tiene; resto pendiente i18n:translate).
  const hasHowTo = !!(clf.howToTitle && clf.howToStep1Title);
  const howToSteps = hasHowTo
    ? [
        { title: clf.howToStep1Title!, text: clf.howToStep1Text! },
        { title: clf.howToStep2Title!, text: clf.howToStep2Text! },
        { title: clf.howToStep3Title!, text: clf.howToStep3Text! },
        { title: clf.howToStep4Title!, text: clf.howToStep4Text! },
        { title: clf.howToStep5Title!, text: clf.howToStep5Text! },
      ]
    : [];

  // HowTo schema for SERP rich result. Each step is keyword-rich.
  const howToSchema =
    hasHowTo && !postEra
      ? {
          "@type": "HowTo",
          name: clf.howToTitle,
          description: clf.howToIntro,
          totalTime: "PT35M",
          estimatedCost: {
            "@type": "MonetaryAmount",
            currency: "EUR",
            value: "70",
          },
          supply: [
            { "@type": "HowToSupply", name: "DNI o pasaporte (mayor de 18 años)" },
            { "@type": "HowToSupply", name: "Fianza 200€ (tarjeta o efectivo, reembolsable)" },
          ],
          step: howToSteps.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: s.text,
          })),
        }
      : null;

  const hasVsMarketplaces = !!(clf.vsMarketplacesTitle && clf.vsMarketplacesRow1Label);

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // RD 1188/2025: from 2026-10-01 these boats are no longer offered, so no Service/Offer markup.
      ...(postEra ? [] : [serviceSchema, itemListSchema]),
      breadcrumbSchema,
      faqSchema,
      ...(howToSchema ? [howToSchema] : []),
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        ogImage={seoConfig.image}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      {/* HERO: navy sheet, facts as one ruled strip (no loose pills) */}
      <NavyHero
        title={heroTitle}
        subtitle={heroDescription}
        facts={[badgeLicense, ...(postEra ? [] : [clf.badgePower, clf.badgeCapacity])]}
        next={postEra ? "muted" : "background"}
      />

      {postEra && (
        <Sheet
          tone="muted"
          next="background"
          className="py-12 sm:py-16"
          data-testid="post-era-notice"
          aria-labelledby="license-free-notice-title"
        >
          <div className="container mx-auto grid max-w-6xl items-start gap-8 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <Rise>
              <h2 id="license-free-notice-title" className={H2}>
                {clf.postEraNoticeTitle}
              </h2>
            </Rise>
            <Rise delay={0.1}>
              <LeadFacts text={clf.postEraNoticeBody} />
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={localizedPath("navigationLicense")}
                  className={PILL_LINK}
                  data-testid="link-post-era-titulin"
                >
                  {clf.postEraNoticeLink}
                </a>
                <a
                  href={localizedPath("categoryLicensed")}
                  className={PILL_LINK}
                  data-testid="link-post-era-licensed"
                >
                  {ctaButton}
                </a>
                {schoolSmall && (
                  <a
                    href={schoolSmall.url}
                    target="_blank"
                    rel="noopener"
                    className={PILL_LINK}
                    data-testid="link-post-era-escola"
                  >
                    {schoolSmall.cta}
                  </a>
                )}
              </div>
            </Rise>
          </div>
        </Sheet>
      )}

      {/* WHAT ARE LICENSE-FREE BOATS */}
      {!postEra && (
        <Sheet tone="background" next="muted" aria-labelledby="license-free-what-title">
          <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[7fr_5fr] lg:gap-16">
            <Rise>
              <h2 id="license-free-what-title" className={H2}>
                {clf.whatAreTitle}
              </h2>
              <DefList
                className="mt-8"
                items={[
                  { title: clf.freeNavigation, desc: clf.freeNavigationDesc },
                  { title: clf.easyToHandle, desc: clf.easyToHandleDesc },
                  { title: clf.safeLimits, desc: clf.safeLimitsDesc },
                  { title: clf.completeEquipment, desc: clf.completeEquipmentDesc },
                ]}
              />
              {clf.synonymsTitle && (
                <div className="mt-6 rounded-2xl border border-border bg-background p-5">
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {clf.synonymsTitle}
                  </h3>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground text-pretty">
                    {clf.synonymsBody}
                  </p>
                </div>
              )}
            </Rise>
            <Rise delay={0.1} className="lg:sticky lg:top-28">
              <img
                src="/images/boats/astec-480/alquiler-barco-astec-480-rent-a-boat-costa-brava-blanes-navegando-costa.webp"
                alt="License-free boat navigating along the Costa Brava coast"
                className="aspect-[4/5] w-full rounded-2xl object-cover"
                loading="lazy"
                width={640}
                height={800}
              />
            </Rise>
          </div>
        </Sheet>
      )}

      {/* LEGAL FRAMEWORK / REGULATION */}
      {!postEra && (
        <Sheet tone="muted" next="background" aria-labelledby="license-free-reg-title">
          <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <Rise>
              <h2 id="license-free-reg-title" className={H2}>
                {clf.regulationTitle}
              </h2>
              <LeadFacts text={clf.regulationIntro} className="mt-5" />
            </Rise>
            <Rise delay={0.1}>
              <p className="text-base leading-relaxed text-muted-foreground text-pretty">
                {clf.regulationRequirements}
              </p>
              <DefList
                className="mt-6"
                items={[
                  {
                    title:
                      language === "es"
                        ? "Lo que puedes hacer"
                        : language === "en"
                          ? "What you can do"
                          : language === "ca"
                            ? "El que pots fer"
                            : language === "fr"
                              ? "Ce que vous pouvez faire"
                              : language === "de"
                                ? "Was Sie tun konnen"
                                : language === "nl"
                                  ? "Wat je kunt doen"
                                  : language === "it"
                                    ? "Cosa puoi fare"
                                    : "Что можно делать",
                    desc: clf.regulationAllowed,
                  },
                  {
                    title:
                      language === "es"
                        ? "Limitaciones"
                        : language === "en"
                          ? "Limitations"
                          : language === "ca"
                            ? "Limitacions"
                            : language === "fr"
                              ? "Limitations"
                              : language === "de"
                                ? "Einschrankungen"
                                : language === "nl"
                                  ? "Beperkingen"
                                  : language === "it"
                                    ? "Limitazioni"
                                    : "Ограничения",
                    desc: clf.regulationNotAllowed,
                  },
                ]}
              />
              <Callout className="mt-4">{clf.regulationFuelIncluded}</Callout>
            </Rise>
          </div>
        </Sheet>
      )}

      {/* OUR LICENSE-FREE FLEET (not offered from 2026-10-01) */}
      {!postEra && (
        <Sheet tone="background" next="muted" aria-labelledby="license-free-fleet-title">
          <div className="container mx-auto max-w-6xl px-4">
            <Rise>
              <h2 id="license-free-fleet-title" className={H2}>
                {clf.fleetTitle}
              </h2>
            </Rise>
            <Rise delay={0.1} className="mt-8 grid gap-3 sm:mt-10 sm:gap-5 md:grid-cols-3">
              {licenseFreeBoats.map(boat => (
                <a
                  key={boat.id}
                  href={localizedPath("boatDetail", boat.id)}
                  className="block rounded-2xl border border-border bg-card p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta sm:p-6 [@media(hover:hover)]:hover:border-foreground/40"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {boat.name}
                    </h3>
                    <div className="shrink-0 font-heading text-base font-semibold text-foreground">
                      {boat.price}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                      {boat.capacity}
                    </span>
                    <span className="flex items-center">
                      <Gauge className="mr-2 h-4 w-4" aria-hidden="true" />
                      {boat.engine}
                    </span>
                  </div>
                  <ul className="mt-4 border-t border-border">
                    {boat.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="border-b border-border py-2 text-sm text-muted-foreground last:border-b-0"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                </a>
              ))}
            </Rise>
          </div>
        </Sheet>
      )}

      {/* COMPARISON TABLE */}
      {!postEra && (
        <Sheet tone="muted" next="background" aria-labelledby="license-free-compare-title">
          <div className="container mx-auto max-w-6xl px-4">
            <Rise className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
              <h2 id="license-free-compare-title" className={H2}>
                {clf.comparisonTitle}
              </h2>
              <LeadFacts text={clf.comparisonIntro} />
            </Rise>
            <Rise
              delay={0.1}
              className="mt-10 overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-4 text-left font-medium text-muted-foreground">
                        {clf.comparisonBoatName}
                      </th>
                      <th className="p-4 text-left font-medium text-muted-foreground">
                        {clf.comparisonCapacity}
                      </th>
                      <th className="p-4 text-left font-medium text-muted-foreground">
                        {clf.comparisonEngine}
                      </th>
                      <th className="p-4 text-left font-medium text-muted-foreground">
                        {clf.comparisonBestFor}
                      </th>
                      <th className="p-4 text-right font-medium text-muted-foreground">
                        {clf.comparisonPriceLow}
                      </th>
                      <th className="p-4 text-right font-medium text-muted-foreground">
                        {clf.comparisonPriceHigh}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonBoats.map(boat => (
                      <tr key={boat.id} className="border-b border-border last:border-b-0">
                        <td className="p-4 font-medium">{boat.data.name}</td>
                        <td className="p-4 text-muted-foreground">
                          {boat.data.specifications.capacity}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {boat.data.specifications.engine}
                        </td>
                        <td className="p-4 text-muted-foreground">{bestForMap[boat.id]}</td>
                        <td className="p-4 text-right font-heading font-semibold tabular-nums text-foreground">
                          {boat.data.pricing.BAJA.prices["2h"]}
                          {"\u20AC"}
                        </td>
                        <td className="p-4 text-right font-heading font-semibold tabular-nums text-foreground">
                          {boat.data.pricing.ALTA.prices["2h"]}
                          {"\u20AC"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Rise>
          </div>
        </Sheet>
      )}

      {/* VS MARKETPLACES: direct booking advantage */}
      {hasVsMarketplaces && !postEra && (
        <Sheet tone="background" next="muted" aria-labelledby="license-free-vs-title">
          <div className="container mx-auto max-w-6xl px-4">
            <Rise className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
              <h2 id="license-free-vs-title" className={H2}>
                {clf.vsMarketplacesTitle}
              </h2>
              <LeadFacts text={clf.vsMarketplacesIntro} />
            </Rise>
            <Rise
              delay={0.1}
              className="mt-10 overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-1/4 p-4 text-left"></th>
                      <th className="p-4 text-left font-semibold text-foreground">
                        {clf.vsMarketplacesCol1}
                      </th>
                      <th className="p-4 text-left font-medium text-muted-foreground">
                        {clf.vsMarketplacesCol2}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        [
                          clf.vsMarketplacesRow1Label,
                          clf.vsMarketplacesRow1Direct,
                          clf.vsMarketplacesRow1Market,
                        ],
                        [
                          clf.vsMarketplacesRow2Label,
                          clf.vsMarketplacesRow2Direct,
                          clf.vsMarketplacesRow2Market,
                        ],
                        [
                          clf.vsMarketplacesRow3Label,
                          clf.vsMarketplacesRow3Direct,
                          clf.vsMarketplacesRow3Market,
                        ],
                        [
                          clf.vsMarketplacesRow4Label,
                          clf.vsMarketplacesRow4Direct,
                          clf.vsMarketplacesRow4Market,
                        ],
                        [
                          clf.vsMarketplacesRow5Label,
                          clf.vsMarketplacesRow5Direct,
                          clf.vsMarketplacesRow5Market,
                        ],
                      ] as const
                    ).map(([label, direct, market], idx) => (
                      <tr key={idx} className="border-b border-border last:border-b-0">
                        <td className="p-4 font-medium">{label}</td>
                        <td className="p-4 text-foreground">{direct}</td>
                        <td className="p-4 text-muted-foreground">{market}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Rise>
            <Callout className="mt-4">{clf.vsMarketplacesConclusion}</Callout>
          </div>
        </Sheet>
      )}

      {/* ADVANTAGES */}
      {!postEra && (
        <Sheet tone="muted" next="background" aria-labelledby="license-free-adv-title">
          <div className="container mx-auto max-w-6xl px-4">
            <Rise>
              <h2 id="license-free-adv-title" className={H2}>
                {clf.advantagesTitle}
              </h2>
            </Rise>
            <div className="mt-8 grid gap-10 md:grid-cols-2 lg:gap-16">
              <Rise>
                <h3 className="mb-4 font-heading text-lg font-semibold tracking-tight">
                  {clf.totalAccessibility}
                </h3>
                <CheckPanel
                  items={[
                    clf.noLicenseNeeded,
                    clf.quickLearning,
                    clf.lowerCost,
                    clf.perfectBeginners,
                  ]}
                />
              </Rise>
              <Rise delay={0.1}>
                <h3 className="mb-4 font-heading text-lg font-semibold tracking-tight">
                  {clf.guaranteedFun}
                </h3>
                <CheckPanel
                  items={[
                    clf.accessCoves,
                    clf.idealFamilies,
                    clf.safeCoastalNavigation,
                    clf.immediateAvailability,
                  ]}
                />
              </Rise>
            </div>
          </div>
        </Sheet>
      )}

      {/* SAFETY AND REQUIREMENTS */}
      {!postEra && (
        <Sheet tone="background" next="muted" aria-labelledby="license-free-safety-title">
          <div className="container mx-auto max-w-6xl px-4">
            <Rise>
              <h2 id="license-free-safety-title" className={H2}>
                {clf.safetyTitle}
              </h2>
            </Rise>
            <div className="mt-8 grid gap-10 md:grid-cols-2 lg:gap-16">
              <Rise>
                <h3 className="mb-4 font-heading text-lg font-semibold tracking-tight">
                  {clf.minRequirements}
                </h3>
                <CheckPanel
                  items={[
                    clf.minAge,
                    clf.validId,
                    <span key="deposit">
                      {clf.deposit}
                      <span className="mt-1 block">
                        <ReducedDepositLink requiresLicense={false} />
                      </span>
                    </span>,
                    clf.safetyBriefing,
                  ]}
                />
              </Rise>
              <Rise delay={0.1}>
                <h3 className="mb-4 font-heading text-lg font-semibold tracking-tight">
                  {clf.safetyIncluded}
                </h3>
                <CheckPanel
                  items={[clf.lifeJackets, clf.fireExtinguisher, clf.vhfRadio, clf.civilLiability]}
                />
              </Rise>
            </div>
          </div>
        </Sheet>
      )}

      {/* HOWTO: 5 steps to rent */}
      {hasHowTo && !postEra && (
        <Sheet tone="muted" next="background" aria-labelledby="license-free-howto-title">
          <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <Rise>
              <h2 id="license-free-howto-title" className={H2}>
                {clf.howToTitle}
              </h2>
              <LeadFacts text={clf.howToIntro} className="mt-5" />
            </Rise>
            <Rise delay={0.1}>
              <StepList steps={howToSteps} />
              <dl className="mt-4 grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2">
                <div className="border-b border-border px-5 py-4 sm:border-b-0 sm:border-r">
                  <dt className="text-sm text-muted-foreground">{clf.howToDurationLabel}</dt>
                  <dd className="mt-1 font-heading text-base font-semibold text-foreground">
                    {clf.howToDurationValue}
                  </dd>
                </div>
                <div className="px-5 py-4">
                  <dt className="text-sm text-muted-foreground">{clf.howToCostLabel}</dt>
                  <dd className="mt-1 font-heading text-base font-semibold text-foreground">
                    {clf.howToCostValue}
                  </dd>
                </div>
              </dl>
            </Rise>
          </div>
        </Sheet>
      )}

      {/* FAQ: cards born folded, answers stay in the DOM */}
      <FaqSheet items={faqItems} idPrefix="license-free-faq" tone="background" next="muted" />

      {/* EXPLORE DESTINATIONS: internal linking */}
      {!postEra && (
        <Sheet
          tone="muted"
          next="navy"
          className="py-12 sm:py-14"
          aria-labelledby="license-free-links-title"
        >
          <div className="container mx-auto max-w-6xl px-4">
            <h2
              id="license-free-links-title"
              className="font-heading text-xl font-semibold tracking-tight text-foreground"
            >
              Navega desde Blanes con barco sin licencia
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={localizedPath("locationBlanes")} className={PILL_LINK}>
                Salida desde el Puerto de Blanes
              </a>
              <a href={localizedPath("locationLloret")} className={PILL_LINK}>
                Excursion sin licencia a Lloret de Mar
              </a>
              <a href={localizedPath("locationTossa")} className={PILL_LINK}>
                Ruta en barco hasta Tossa de Mar
              </a>
              <a href={localizedPath("pricing")} className={PILL_LINK}>
                Consulta precios por temporada
              </a>
              <a
                href={localizedPath("categoryLicensed")}
                className={PILL_LINK}
                data-testid="link-cross-licensed"
              >
                {t.categoryLicensed!.crossLinkFromFree}
              </a>
            </div>
          </div>
        </Sheet>
      )}

      {/* CTA: licence-free booking CTA is gone from 2026-10-01; the notice above links to the licensed boats. */}
      {!postEra && (
        <Sheet tone="navy" next="muted" aria-labelledby="license-free-cta-title">
          <Rise className="container mx-auto max-w-3xl px-4 text-center">
            <h2 id="license-free-cta-title" className={H2}>
              {clf.ctaTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/85 text-pretty sm:text-lg dark:text-foreground/85">
              {clf.ctaDescription}
            </p>
            <InteractiveHoverButton
              tone="light"
              onClick={handleBookingWhatsApp}
              className="mt-8 min-h-12 px-8 text-base"
              data-testid="button-whatsapp-license-free"
            >
              {ctaButton}
            </InteractiveHoverButton>
          </Rise>
        </Sheet>
      )}

      <RelatedContent currentPage="categoryLicenseFree" />

      <Footer />
    </div>
  );
}
