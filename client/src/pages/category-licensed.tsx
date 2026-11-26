import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { Users, Gauge, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import LicenseVerifierInline from "@/components/booking/LicenseVerifierInline";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import {
  Callout,
  CheckPanel,
  DefList,
  FaqSheet,
  H2,
  LeadFacts,
  PILL_LINK,
  Rise,
  Sheet,
  StepList,
} from "@/components/page-kit";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { ReducedDepositLink } from "@/components/ReducedDepositLink";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { BOAT_DATA, isCaptainedBoat, type BoatData } from "@shared/boatData";
import { minPriceAcrossBoats } from "@shared/pricing";
import { translateBoatText } from "@shared/boatTextTranslations";
import { BookingStickyBar } from "@/components/MobileStickyBar";
import CategoryHero from "@/components/CategoryHero";

// The server injects the canonical JSON-LD graph for this route (Service +
// ItemList + FAQPage + HowTo + Breadcrumb, built from the same i18n keys the
// page renders). SEO.tsx skips client-side JSON-LD when a server block exists,
// so this component intentionally ships none: one schema source, zero drift.
export default function CategoryLicensedPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig("categoryLicensed", language);
  const hreflangLinks = generateHreflangLinks("categoryLicensed");
  const canonical = generateCanonicalUrl("categoryLicensed", language);

  const { data: boats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  // Captained excursion also carries requiresLicense in the DB (the captain's
  // license, not the client's) — keep it out of the self-drive category.
  const liveLicensed = (boats ?? []).filter(
    b => b.isActive && b.requiresLicense && !isCaptainedBoat(b.id)
  );
  const fallbackLicensed = Object.values(BOAT_DATA).filter(
    b => b.subtitle.startsWith("Con licencia") && !isCaptainedBoat(b.id)
  );
  const sourceLicensed: Array<Boat | BoatData> =
    liveLicensed.length > 0 ? liveLicensed : fallbackLicensed;

  const licensedBoats = sourceLicensed.map(b => {
    const specs = (b.specifications ?? {}) as {
      engine?: string;
      capacity?: string;
    };
    const isDbBoat = "isActive" in b;
    const capacity = isDbBoat
      ? `${(b as Boat).capacity} ${t.boats.people}`
      : (specs.capacity ?? "");
    const minPrice = minPriceAcrossBoats([b as { pricing?: unknown }], "2h", "BAJA");
    return {
      id: b.id,
      name: translateBoatText(b.name, language),
      capacity,
      engine: specs.engine ?? "",
      features: (b.features ?? []).slice(0, 4),
      price: minPrice ? `${minPrice}€` : "",
    };
  });

  const cl = t.categoryLicensed!;

  // Hero "from" price: live fleet when /api/boats has answered, static catalog before.
  const heroPrice =
    minPriceAcrossBoats(sourceLicensed, "2h", "BAJA") ??
    minPriceAcrossBoats(fallbackLicensed, "2h", "BAJA") ??
    0;

  // Comparison table straight from the static catalog (specs and prices are
  // never hardcoded in copy; boatData.ts is the single source of truth).
  const comparisonBoats = [
    { id: "mingolla-brava-19", data: BOAT_DATA["mingolla-brava-19"] },
    { id: "trimarchi-57s", data: BOAT_DATA["trimarchi-57s"] },
    { id: "pacific-craft-625", data: BOAT_DATA["pacific-craft-625"] },
  ];
  const bestForMap: Record<string, string> = {
    "mingolla-brava-19": cl.comparisonMingolla,
    "trimarchi-57s": cl.comparisonTrimarchi,
    "pacific-craft-625": cl.comparisonPacific,
  };

  const faqItems = [
    { question: cl.faqSinPatronQuestion, answer: cl.faqSinPatronAnswer },
    { question: cl.faqTossaQuestion, answer: cl.faqTossaAnswer },
    { question: cl.faqLanchaQuestion, answer: cl.faqLanchaAnswer },
    { question: cl.faqTitulacionQuestion, answer: cl.faqTitulacionAnswer },
    { question: cl.faqForeignLicenseQuestion, answer: cl.faqForeignLicenseAnswer },
    { question: cl.faqPriceQuestion, answer: cl.faqPriceAnswer },
    { question: cl.faqFuelQuestion, answer: cl.faqFuelAnswer },
    { question: cl.faqDepositQuestion, answer: cl.faqDepositAnswer },
    { question: cl.faqWeatherQuestion, answer: cl.faqWeatherAnswer },
  ];

  const howToSteps = [
    { title: cl.howToStep1Title, text: cl.howToStep1Text },
    { title: cl.howToStep2Title, text: cl.howToStep2Text },
    { title: cl.howToStep3Title, text: cl.howToStep3Text },
    { title: cl.howToStep4Title, text: cl.howToStep4Text },
    { title: cl.howToStep5Title, text: cl.howToStep5Text },
  ];

  const routeStops = [
    cl.routeStopLloret,
    cl.routeStopSantaCristina,
    cl.routeStopCanyelles,
    cl.routeStopTossa,
  ];

  const acceptedLicenses = [
    <span key="ln" className="font-medium">
      {cl.licenciaNavegacion}
    </span>,
    cl.per,
    cl.pnb,
    cl.yachtCaptain,
    cl.icc,
    cl.euEquivalent,
  ];

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
      />
      <Navigation />
      <ReadingProgressBar />

      {/* HERO */}
      <CategoryHero
        imageBasePath="/images/locations/hero-tossa-de-mar"
        imageAlt={cl.heroImageAlt}
        title={cl.heroTitle}
        subtitleTemplate={cl.heroSubtitle}
        price={heroPrice}
        secondaryCta={{ href: localizedPath("categoryCaptained"), label: cl.heroSecondaryCta }}
        testId="licensed"
        next="background"
      />

      {/* OUR LICENSED FLEET: price block right under the hero; cards link to each boat page */}
      <Sheet tone="background" next="muted" aria-labelledby="licensed-fleet-title">
        <div className="container mx-auto max-w-6xl px-4">
          <Rise>
            <h2 id="licensed-fleet-title" className={H2}>
              {cl.fleetTitle}
            </h2>
          </Rise>
          <Rise delay={0.1} className="mt-8 grid gap-3 sm:mt-10 md:grid-cols-3 sm:gap-5">
            {licensedBoats.map(boat => (
              <a
                key={boat.id}
                href={localizedPath("boatDetail", boat.id)}
                className="block rounded-2xl border border-border bg-card p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta sm:p-6 [@media(hover:hover)]:hover:border-foreground/40"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {boat.name}
                  </h3>
                  {boat.price && (
                    <div className="shrink-0 font-heading text-lg font-semibold text-foreground">
                      <span className="mr-1 font-sans text-sm font-normal text-muted-foreground">
                        {t.boats.from}
                      </span>
                      {boat.price}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground sm:mt-3">
                  <span className="flex items-center">
                    <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                    {boat.capacity}
                  </span>
                  <span className="flex items-center">
                    <Gauge className="mr-2 h-4 w-4" aria-hidden="true" />
                    {boat.engine}
                  </span>
                </div>
                <ul className="mt-4 hidden border-t border-border sm:block">
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

      {/* WHAT IS A LICENSED POWERBOAT */}
      <Sheet tone="muted" next="background" aria-labelledby="licensed-what-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[7fr_5fr] lg:gap-16">
          <Rise>
            <h2 id="licensed-what-title" className={H2}>
              {cl.whatAreTitle}
            </h2>
            <DefList
              className="mt-8"
              items={[
                { title: cl.advancedNavigation, desc: cl.advancedNavigationDesc },
                { title: cl.greaterFreedom, desc: cl.greaterFreedomDesc },
                { title: cl.professionalEquipment, desc: cl.professionalEquipmentDesc },
                { title: cl.superiorPerformance, desc: cl.superiorPerformanceDesc },
              ]}
            />
            <div className="mt-6 rounded-2xl border border-border bg-background p-5">
              <h3 className="font-heading text-base font-semibold text-foreground">
                {cl.synonymsTitle}
              </h3>
              <p className="mt-1 text-base leading-relaxed text-muted-foreground text-pretty">
                {cl.synonymsBody}
              </p>
            </div>
          </Rise>
          <Rise delay={0.1} className="lg:sticky lg:top-28">
            <img
              src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-cala-agua-cristalina.webp"
              alt="Licensed powerboat in the crystal-clear waters of a Costa Brava cove"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
              loading="lazy"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* ROUTE: BLANES TO TOSSA */}
      <Sheet tone="background" next="muted" aria-labelledby="licensed-route-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <div className="overflow-hidden rounded-2xl">
              <img
                src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-cala-costa-brava.webp"
                alt="Licensed powerboat navigating along the Costa Brava coastline"
                className="aspect-[4/3] w-full object-cover lg:aspect-[4/5]"
                loading="lazy"
                width={1920}
                height={600}
              />
            </div>
          </Rise>
          <Rise delay={0.1}>
            <h2 id="licensed-route-title" className={H2}>
              {cl.routeTitle}
            </h2>
            <LeadFacts text={cl.routeIntro} className="mt-5" />
            <StepList className="mt-8" steps={routeStops.map(stop => ({ text: stop }))} />
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={localizedPath("locationTossa")} className={PILL_LINK}>
                {cl.linksTossa}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={localizedPath("blogDetail", "alquiler-barco-tossa-de-mar-desde-blanes")}
                className={PILL_LINK}
              >
                {cl.linksBlogTossa}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </Rise>
        </div>
      </Sheet>

      {/* REQUIREMENTS + LICENSE VERIFIER */}
      <Sheet tone="muted" next="background" aria-labelledby="licensed-req-title">
        <div className="container mx-auto max-w-6xl px-4">
          <Rise>
            <h2 id="licensed-req-title" className={H2}>
              {cl.requirementsTitle}
            </h2>
          </Rise>
          <div className="mt-8 grid gap-10 md:grid-cols-2 lg:gap-16">
            <Rise>
              <h3 className="mb-4 font-heading text-lg font-semibold tracking-tight">
                {cl.acceptedLicenses}
              </h3>
              <CheckPanel items={acceptedLicenses} />
              <p className="mb-2 mt-6 text-sm font-medium text-foreground">{cl.verifierLead}</p>
              <LicenseVerifierInline />
            </Rise>
            <Rise delay={0.1}>
              <h3 className="mb-4 font-heading text-lg font-semibold tracking-tight">
                {cl.additionalRequirements}
              </h3>
              <CheckPanel
                items={[
                  cl.minAge,
                  cl.validId,
                  cl.validLicense,
                  <span key="deposit">
                    {cl.deposit}
                    <span className="mt-1 block">
                      <ReducedDepositLink requiresLicense />
                    </span>
                  </span>,
                  cl.technicalBriefing,
                ]}
              />
            </Rise>
          </div>
        </div>
      </Sheet>

      {/* COMPARISON TABLE */}
      <Sheet tone="background" next="muted" aria-labelledby="licensed-compare-title">
        <div className="container mx-auto max-w-6xl px-4">
          <Rise className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <h2 id="licensed-compare-title" className={H2}>
              {cl.comparisonTitle}
            </h2>
            <LeadFacts text={cl.comparisonIntro} />
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
                      {cl.comparisonBoatName}
                    </th>
                    <th className="p-4 text-left font-medium text-muted-foreground">
                      {cl.comparisonCapacity}
                    </th>
                    <th className="p-4 text-left font-medium text-muted-foreground">
                      {cl.comparisonEngine}
                    </th>
                    <th className="p-4 text-left font-medium text-muted-foreground">
                      {cl.comparisonBestFor}
                    </th>
                    <th className="p-4 text-right font-medium text-muted-foreground">
                      {cl.comparisonPriceLow}
                    </th>
                    <th className="p-4 text-right font-medium text-muted-foreground">
                      {cl.comparisonPriceHigh}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonBoats.map(boat => (
                    <tr key={boat.id} className="border-b border-border last:border-b-0">
                      <td className="p-4 font-medium">
                        <a
                          href={localizedPath("boatDetail", boat.id)}
                          className="text-foreground underline decoration-border underline-offset-4 [@media(hover:hover)]:hover:decoration-foreground"
                        >
                          {boat.data.name}
                        </a>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {boat.data.specifications.capacity}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {boat.data.specifications.engine}
                      </td>
                      <td className="p-4 text-muted-foreground">{bestForMap[boat.id]}</td>
                      <td className="p-4 text-right font-heading font-semibold tabular-nums text-foreground">
                        {boat.data.pricing.BAJA.prices["2h"]}
                        {"€"}
                      </td>
                      <td className="p-4 text-right font-heading font-semibold tabular-nums text-foreground">
                        {boat.data.pricing.ALTA.prices["2h"]}
                        {"€"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Rise>
        </div>
      </Sheet>

      {/* REGULATION */}
      <Sheet tone="muted" next="background" aria-labelledby="licensed-reg-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 id="licensed-reg-title" className={H2}>
              {cl.regulationTitle}
            </h2>
            <LeadFacts text={cl.regulationIntro} className="mt-5" />
          </Rise>
          <Rise delay={0.1}>
            <p className="rounded-2xl border border-border bg-background p-5 text-base leading-relaxed text-muted-foreground text-pretty sm:p-6">
              {cl.regulationForeign}
            </p>
            <Callout className="mt-4">{cl.regulationFuelDeposit}</Callout>
          </Rise>
        </div>
      </Sheet>

      {/* HOW TO: 5 STEPS */}
      <Sheet tone="background" next="muted" aria-labelledby="licensed-howto-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 id="licensed-howto-title" className={H2}>
              {cl.howToTitle}
            </h2>
            <LeadFacts text={cl.howToIntro} className="mt-5" />
          </Rise>
          <Rise delay={0.1}>
            <StepList steps={howToSteps} />
          </Rise>
        </div>
      </Sheet>

      {/* DIRECT VS MARKETPLACES */}
      <Sheet tone="muted" next="background" aria-labelledby="licensed-vs-title">
        <div className="container mx-auto max-w-6xl px-4">
          <Rise className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <h2 id="licensed-vs-title" className={H2}>
              {cl.vsMarketplacesTitle}
            </h2>
            <LeadFacts text={cl.vsMarketplacesIntro} />
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
                      {cl.vsMarketplacesCol1}
                    </th>
                    <th className="p-4 text-left font-medium text-muted-foreground">
                      {cl.vsMarketplacesCol2}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      [
                        cl.vsMarketplacesRow1Label,
                        cl.vsMarketplacesRow1Direct,
                        cl.vsMarketplacesRow1Market,
                      ],
                      [
                        cl.vsMarketplacesRow2Label,
                        cl.vsMarketplacesRow2Direct,
                        cl.vsMarketplacesRow2Market,
                      ],
                      [
                        cl.vsMarketplacesRow3Label,
                        cl.vsMarketplacesRow3Direct,
                        cl.vsMarketplacesRow3Market,
                      ],
                      [
                        cl.vsMarketplacesRow4Label,
                        cl.vsMarketplacesRow4Direct,
                        cl.vsMarketplacesRow4Market,
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
          <Callout className="mt-4">{cl.vsMarketplacesConclusion}</Callout>
        </div>
      </Sheet>

      {/* FAQ: mirrored 1:1 by the server-side FAQPage schema; cards born folded, answers stay in the DOM */}
      <FaqSheet items={faqItems} idPrefix="licensed-faq" tone="background" next="muted" />

      {/* INTERNAL LINKS */}
      <Sheet
        tone="muted"
        next="navy"
        className="py-12 sm:py-14"
        aria-labelledby="licensed-links-title"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <h2
            id="licensed-links-title"
            className="font-heading text-xl font-semibold tracking-tight text-foreground"
          >
            {cl.linksTitle}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={localizedPath("locationBlanes")} className={PILL_LINK}>
              {cl.linksBlanes}
            </a>
            <a href={localizedPath("locationTossa")} className={PILL_LINK}>
              {cl.linksTossa}
            </a>
            <a href={localizedPath("pricing")} className={PILL_LINK}>
              {cl.linksPricing}
            </a>
            <a href={localizedPath("categoryCaptained")} className={PILL_LINK}>
              {cl.linksNoLicense}
            </a>
            <a href={localizedPath("categoryCaptained")} className={PILL_LINK}>
              {cl.linksSkipper}
            </a>
          </div>
        </div>
      </Sheet>

      {/* CTA: navy band, closes over the related-content band */}
      <Sheet tone="navy" next="muted" aria-labelledby="licensed-cta-title">
        <Rise className="container mx-auto max-w-3xl px-4 text-center">
          <h2 id="licensed-cta-title" className={H2}>
            {cl.ctaTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/85 text-pretty sm:text-lg dark:text-foreground/85">
            {cl.ctaDescription}
          </p>
          <InteractiveHoverButton
            tone="light"
            onClick={handleBookingWhatsApp}
            className="mt-8 min-h-12 px-8 text-base"
            data-testid="button-whatsapp-licensed"
          >
            {cl.ctaButton}
          </InteractiveHoverButton>
        </Rise>
      </Sheet>

      <RelatedContent currentPage="categoryLicensed" />
      <BookingStickyBar />
      <Footer />
    </div>
  );
}
