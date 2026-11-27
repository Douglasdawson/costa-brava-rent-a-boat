import { ChevronRight } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import Navigation from "@/components/Navigation";
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
  RuledPanel,
  Sheet,
  StepList,
} from "@/components/page-kit";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { generateHreflangLinks, generateCanonicalUrl } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { BOAT_DATA } from "@shared/boatData";
import { BUSINESS_RATING_STR } from "@shared/businessProfile";
import { translateBoatText } from "@shared/boatTextTranslations";
import { BookingStickyBar } from "@/components/MobileStickyBar";
import CategoryHero from "@/components/CategoryHero";

// The server injects the canonical JSON-LD graph for this route (Service +
// FAQPage + HowTo + Breadcrumb, built from the same i18n keys the page
// renders). SEO.tsx skips client-side JSON-LD when a server block exists, so
// this component intentionally ships none: one schema source, zero drift.
export default function CategoryCaptainedPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const cp = t.captainedPage!;
  const hreflangLinks = generateHreflangLinks("categoryCaptained");
  const canonical = generateCanonicalUrl("categoryCaptained", language);

  const excursion = BOAT_DATA["excursion-privada"];
  const boatName = translateBoatText(excursion.name, language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(boatName, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const whatIsCards = [
    { title: cp.cardSkipperTitle, desc: cp.cardSkipperDesc },
    { title: cp.cardCovesTitle, desc: cp.cardCovesDesc },
    { title: cp.cardSwimTitle, desc: cp.cardSwimDesc },
    { title: cp.cardComfortTitle, desc: cp.cardComfortDesc },
  ];

  const faqItems = cp.faq.map(f => ({ question: f.q, answer: f.a }));

  // Prices straight from the static catalog: boatData.ts is the single source
  // of truth, copy never hardcodes figures.
  const seasons = [
    { label: cp.seasonLow, prices: excursion.pricing.BAJA.prices },
    { label: cp.seasonMid, prices: excursion.pricing.MEDIA.prices },
    { label: cp.seasonHigh, prices: excursion.pricing.ALTA.prices },
  ];
  const durations: Array<"2h" | "3h" | "4h"> = ["2h", "3h", "4h"];
  const heroPrice = excursion.pricing.BAJA.prices["2h"];

  const specs = [
    { label: cp.specCapacityLabel, value: excursion.specifications.capacity },
    { label: cp.specEngineLabel, value: excursion.specifications.engine },
    { label: cp.specLengthLabel, value: excursion.specifications.length },
    { label: cp.specDepositLabel, value: excursion.specifications.deposit },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={cp.seoTitle}
        description={cp.seoDescription.replace("{rating}", BUSINESS_RATING_STR)}
        canonical={canonical}
        hreflang={hreflangLinks}
      />
      <Navigation />
      <ReadingProgressBar />

      {/* HERO */}
      <CategoryHero
        imageBasePath="/images/locations/hero-blanes"
        imageAlt={cp.heroImageAlt}
        title={cp.heroTitle}
        subtitleTemplate={cp.heroSubtitle}
        price={heroPrice}
        secondaryCta={{ href: localizedPath("categoryLicensed"), label: cp.heroSecondaryCta }}
        testId="captained"
        next="background"
      />

      {/* PRICING BY SEASON: straight from boatData */}
      <Sheet tone="background" next="muted" aria-labelledby="captained-pricing-title">
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise className="min-w-0">
            <h2 id="captained-pricing-title" className={H2}>
              {cp.pricingTitle}
            </h2>
            <LeadFacts text={cp.pricingIntro} className="mt-5" />
          </Rise>
          <Rise delay={0.1} className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm sm:text-base">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-4 text-left font-medium text-muted-foreground">
                        {cp.pricingColDuration}
                      </th>
                      {seasons.map((season, idx) => (
                        <th key={idx} className="p-4 text-right font-medium text-muted-foreground">
                          {season.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {durations.map((duration, dIdx) => (
                      <tr key={duration} className="border-b border-border last:border-b-0">
                        <td className="p-4 font-medium text-foreground">
                          {cp.pricingDurations[dIdx]}
                        </td>
                        {seasons.map((season, sIdx) => (
                          <td
                            key={sIdx}
                            className="p-4 text-right font-heading font-semibold tabular-nums text-foreground"
                          >
                            {season.prices[duration]}
                            {"€"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              {cp.pricingNote}
            </p>
          </Rise>
        </div>
      </Sheet>

      {/* WHAT IS A CAPTAINED EXCURSION */}
      <Sheet tone="muted" next="background" aria-labelledby="captained-what-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[7fr_5fr] lg:gap-16">
          <Rise>
            <h2 id="captained-what-title" className={H2}>
              {cp.whatIsTitle}
            </h2>
            <LeadFacts text={cp.whatIsIntro} className="mt-5" />
            <DefList
              className="mt-8"
              items={whatIsCards.map(card => ({ title: card.title, desc: card.desc }))}
            />
            <div className="mt-6 rounded-2xl border border-border bg-background p-5">
              <h3 className="font-heading text-base font-semibold text-foreground">
                {cp.synonymsTitle}
              </h3>
              <p className="mt-1 text-base leading-relaxed text-muted-foreground text-pretty">
                {cp.synonymsBody}
              </p>
            </div>
          </Rise>
          <Rise delay={0.1} className="lg:sticky lg:top-28">
            <img
              src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-puerto-blanes.webp"
              alt="Captained private boat excursion aboard the Pacific Craft 625 in Blanes"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
              loading="lazy"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* ROUTE: BLANES TO TOSSA */}
      <Sheet tone="background" next="muted" aria-labelledby="captained-route-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <div className="overflow-hidden rounded-2xl">
              <img
                src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-proa-solarium-cala.webp"
                alt="Bow sundeck of the private excursion boat anchored in a Costa Brava cove"
                className="aspect-[4/3] w-full object-cover lg:aspect-[4/5]"
                loading="lazy"
                width={1920}
                height={600}
              />
            </div>
          </Rise>
          <Rise delay={0.1}>
            <h2 id="captained-route-title" className={H2}>
              {cp.routeTitle}
            </h2>
            <LeadFacts text={cp.routeIntro} className="mt-5" />
            <StepList className="mt-8" steps={cp.routeStops.map(stop => ({ text: stop }))} />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              {cp.routeNote}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={localizedPath("locationTossa")} className={PILL_LINK}>
                {cp.linksTossa}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={localizedPath("blogDetail", "alquiler-barco-tossa-de-mar-desde-blanes")}
                className={PILL_LINK}
              >
                {cp.linksBlogTossa}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </Rise>
        </div>
      </Sheet>

      {/* INCLUDED / NOT INCLUDED */}
      <Sheet tone="muted" next="background" aria-label={cp.includedTitle}>
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 lg:gap-16">
          <Rise>
            <h2 className={H2}>{cp.includedTitle}</h2>
            <CheckPanel className="mt-6" items={cp.includedItems} />
          </Rise>
          <Rise delay={0.1}>
            <h2 className={H2}>{cp.notIncludedTitle}</h2>
            <RuledPanel className="mt-6" items={cp.notIncludedItems} />
            <Callout className="mt-4">{cp.fuelNote}</Callout>
          </Rise>
        </div>
      </Sheet>

      {/* THE BOAT: specs from the static catalog */}
      <Sheet tone="background" next="muted" aria-labelledby="captained-boat-title">
        <div className="container mx-auto max-w-6xl px-4">
          <Rise className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <h2 id="captained-boat-title" className={H2}>
              {cp.boatTitle}
            </h2>
            <LeadFacts text={cp.boatIntro} />
          </Rise>
          <Rise delay={0.1}>
            <dl className="mt-10 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-4">
              {specs.map((spec, idx) => (
                <div
                  key={idx}
                  className="border-border px-5 py-5 [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t md:[&:nth-child(n+2)]:border-l md:[&:nth-child(n+3)]:border-t-0"
                >
                  <dt className="text-sm text-muted-foreground">{spec.label}</dt>
                  <dd className="mt-1 font-heading text-lg font-semibold leading-snug text-foreground">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
            <a href={localizedPath("boatDetail", excursion.id)} className={`${PILL_LINK} mt-6`}>
              {cp.boatCta}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </Rise>
        </div>
      </Sheet>

      {/* FOR WHOM */}
      <Sheet tone="muted" next="background" aria-labelledby="captained-whom-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 id="captained-whom-title" className={H2}>
              {cp.forWhomTitle}
            </h2>
          </Rise>
          <Rise delay={0.1}>
            <DefList
              items={cp.forWhomItems.map(item => ({ title: item.title, desc: item.text }))}
            />
          </Rise>
        </div>
      </Sheet>

      {/* HOW TO: steps */}
      <Sheet tone="background" next="muted" aria-labelledby="captained-howto-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 id="captained-howto-title" className={H2}>
              {cp.howToTitle}
            </h2>
            <LeadFacts text={cp.howToIntro} className="mt-5" />
          </Rise>
          <Rise delay={0.1}>
            <StepList steps={cp.howToSteps} />
          </Rise>
        </div>
      </Sheet>

      {/* CAPTAINED VS SELF-DRIVE */}
      <Sheet tone="muted" next="background" aria-labelledby="captained-vs-title">
        <div className="container mx-auto max-w-6xl px-4">
          <Rise className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <h2 id="captained-vs-title" className={H2}>
              {cp.vsTitle}
            </h2>
            <LeadFacts text={cp.vsIntro} />
          </Rise>
          <Rise delay={0.1} className="mt-10 grid gap-4 md:grid-cols-2 md:gap-6">
            <div className="rounded-2xl border-2 border-primary bg-background p-6 sm:p-8">
              <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                {cp.vsCaptainedTitle}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground text-pretty">
                {cp.vsCaptainedText}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
              <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                {cp.vsSelfDriveTitle}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground text-pretty">
                {cp.vsSelfDriveText}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={localizedPath("categoryLicensed")} className={PILL_LINK}>
                  {cp.vsLinkLicensed}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href={localizedPath("navigationLicense")} className={PILL_LINK}>
                  {cp.vsLinkFree}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </Rise>
        </div>
      </Sheet>

      {/* FAQ: mirrored 1:1 by the server-side FAQPage schema; cards born folded, answers stay in the DOM */}
      <FaqSheet items={faqItems} idPrefix="captained-faq" tone="background" next="muted" />

      {/* INTERNAL LINKS */}
      <Sheet
        tone="muted"
        next="navy"
        className="py-12 sm:py-14"
        aria-labelledby="captained-links-title"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <h2
            id="captained-links-title"
            className="font-heading text-xl font-semibold tracking-tight text-foreground"
          >
            {cp.linksTitle}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={localizedPath("locationBlanes")} className={PILL_LINK}>
              {cp.linksBlanes}
            </a>
            <a href={localizedPath("locationTossa")} className={PILL_LINK}>
              {cp.linksTossa}
            </a>
            <a href={localizedPath("pricing")} className={PILL_LINK}>
              {cp.linksPricing}
            </a>
            <a href={localizedPath("garantias")} className={PILL_LINK}>
              {cp.linksGarantias}
            </a>
          </div>
        </div>
      </Sheet>

      {/* CTA: navy band, closes over the related-content band */}
      <Sheet tone="navy" next="muted" aria-labelledby="captained-cta-title">
        <Rise className="container mx-auto max-w-3xl px-4 text-center">
          <h2 id="captained-cta-title" className={H2}>
            {cp.ctaTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/85 text-pretty sm:text-lg dark:text-foreground/85">
            {cp.ctaDescription}
          </p>
          <InteractiveHoverButton
            tone="light"
            onClick={handleBookingWhatsApp}
            className="mt-8 min-h-12 px-8 text-base"
            data-testid="button-whatsapp-captained"
          >
            {cp.ctaButton}
          </InteractiveHoverButton>
        </Rise>
      </Sheet>

      <RelatedContent currentPage="categoryCaptained" />
      <BookingStickyBar />
      <Footer />
    </div>
  );
}
