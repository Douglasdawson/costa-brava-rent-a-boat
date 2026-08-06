import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle,
  Anchor,
  MapPin,
  ListChecks,
  FileText,
  Fuel,
  ChevronRight,
  LifeBuoy,
  ArrowLeftRight,
  Ruler,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { FAQSection } from "@/components/FAQSection";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { generateHreflangLinks, generateCanonicalUrl } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { BOAT_DATA } from "@shared/boatData";
import { BUSINESS_RATING_STR } from "@shared/businessProfile";
import { translateBoatText } from "@shared/boatTextTranslations";

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
        isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

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

  const specs = [
    { icon: Users, label: cp.specCapacityLabel, value: excursion.specifications.capacity },
    { icon: Gauge, label: cp.specEngineLabel, value: excursion.specifications.engine },
    { icon: Ruler, label: cp.specLengthLabel, value: excursion.specifications.length },
    { icon: ShieldCheck, label: cp.specDepositLabel, value: excursion.specifications.deposit },
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title={cp.seoTitle}
        description={cp.seoDescription.replace("{rating}", BUSINESS_RATING_STR)}
        canonical={canonical}
        hreflang={hreflangLinks}
      />
      <Navigation />
      <ReadingProgressBar />

      {/* ═══ HERO ═══ */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <LifeBuoy className="w-8 h-8 text-primary mr-4 shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {cp.heroTitle}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {cp.heroDescription}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <LifeBuoy className="w-4 h-4 mr-2" />
                {cp.badgeSkipper}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {cp.badgeCapacity}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <CheckCircle className="w-4 h-4 mr-2" />
                {cp.badgeNoLicense}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ WHAT IS A CAPTAINED EXCURSION ═══ text + image */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-4">
                {cp.whatIsTitle}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-10">{cp.whatIsIntro}</p>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
                {whatIsCards.map((card, idx) => (
                  <div key={idx}>
                    <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 bg-muted rounded-xl p-5">
                <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                  {cp.synonymsTitle}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{cp.synonymsBody}</p>
              </div>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-asientos-capitan.webp"
                alt="Captained private boat excursion aboard the Pacific Craft 625 in Blanes"
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                width={640}
                height={800}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ PHOTO BREAK ═══ */}
      <div className="w-full overflow-hidden">
        <img
          src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-proa-solarium-cala.webp"
          alt="Bow sundeck of the private excursion boat anchored in a Costa Brava cove"
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* ═══ ROUTE: BLANES TO TOSSA ═══ */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-4">
            <MapPin className="w-6 h-6 text-primary shrink-0" />
            {cp.routeTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">{cp.routeIntro}</p>
          <ol className="relative border-l-2 border-primary/30 ml-3 space-y-6">
            {cp.routeStops.map((stop, idx) => (
              <li key={idx} className="pl-6 relative">
                <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-primary" />
                <p className="text-foreground leading-relaxed">{stop}</p>
              </li>
            ))}
          </ol>
          <p className="text-muted-foreground leading-relaxed mt-6">{cp.routeNote}</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            <a
              href={localizedPath("locationTossa")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cp.linksTossa}
            </a>
            <a
              href={localizedPath("blogDetail", "alquiler-barco-tossa-de-mar-desde-blanes")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cp.linksBlogTossa}
            </a>
          </div>
        </div>
      </RevealSection>

      {/* ═══ INCLUDED / NOT INCLUDED ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-6">
                {cp.includedTitle}
              </h2>
              <ul className="space-y-3">
                {cp.includedItems.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-primary mr-3 mt-1 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-6">
                {cp.notIncludedTitle}
              </h2>
              <ul className="space-y-3">
                {cp.notIncludedItems.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <ChevronRight className="w-4 h-4 text-muted-foreground mr-3 mt-1 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-foreground leading-relaxed mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <Fuel className="w-5 h-5 text-amber-600 inline mr-2 -mt-1" />
                {cp.fuelNote}
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ THE BOAT ═══ specs from the static catalog */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-4">
            <Anchor className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {cp.boatTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8 max-w-3xl">{cp.boatIntro}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {specs.map((spec, idx) => (
              <div key={idx} className="bg-background rounded-2xl p-5 border border-border">
                <spec.icon className="w-5 h-5 text-primary mb-2" />
                <div className="text-sm text-muted-foreground">{spec.label}</div>
                <div className="font-heading font-semibold text-foreground">{spec.value}</div>
              </div>
            ))}
          </div>
          <a
            href={localizedPath("boatDetail", excursion.id)}
            className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            <ChevronRight className="w-4 h-4" />
            {cp.boatCta}
          </a>
        </div>
      </RevealSection>

      {/* ═══ PRICING BY SEASON ═══ straight from boatData */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-4">{cp.pricingTitle}</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">{cp.pricingIntro}</p>
          <div className="rounded-2xl bg-background overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">{cp.pricingColDuration}</th>
                    {seasons.map((season, idx) => (
                      <th key={idx} className="text-right p-3 font-semibold">
                        {season.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {durations.map((duration, dIdx) => (
                    <tr key={duration} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{cp.pricingDurations[dIdx]}</td>
                      {seasons.map((season, sIdx) => (
                        <td key={sIdx} className="p-3 text-right font-semibold text-primary">
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
          <p className="text-muted-foreground leading-relaxed mt-4">{cp.pricingNote}</p>
        </div>
      </RevealSection>

      {/* ═══ FOR WHOM ═══ */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
            {cp.forWhomTitle}
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
            {cp.forWhomItems.map((item, idx) => (
              <div key={idx}>
                <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══ HOW TO: 5 STEPS ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-4">
            <ListChecks className="w-6 h-6 text-primary shrink-0" />
            {cp.howToTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">{cp.howToIntro}</p>
          <ol className="space-y-6">
            {cp.howToSteps.map((step, idx) => (
              <li key={idx} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-heading font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </RevealSection>

      {/* ═══ CAPTAINED VS SELF-DRIVE ═══ */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-4">
            <ArrowLeftRight className="w-6 h-6 text-primary shrink-0" />
            {cp.vsTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">{cp.vsIntro}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-background rounded-2xl p-6 border-2 border-primary">
              <h3 className="font-heading font-semibold text-lg mb-2 text-primary">
                {cp.vsCaptainedTitle}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{cp.vsCaptainedText}</p>
            </div>
            <div className="bg-background rounded-2xl p-6 border border-border">
              <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                {cp.vsSelfDriveTitle}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{cp.vsSelfDriveText}</p>
              <div className="flex flex-col gap-2">
                <a
                  href={localizedPath("categoryLicensed")}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  {cp.vsLinkLicensed}
                </a>
                <a
                  href={localizedPath("categoryLicenseFree")}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  {cp.vsLinkFree}
                </a>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ FAQ ═══ mirrored 1:1 by the server-side FAQPage schema */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-6">
            <FileText className="w-6 h-6 text-primary shrink-0" />
            {language === "es"
              ? "Preguntas Frecuentes"
              : language === "en"
                ? "Frequently Asked Questions"
                : language === "ca"
                  ? "Preguntes Frequents"
                  : language === "fr"
                    ? "Questions Frequentes"
                    : language === "de"
                      ? "Haufig Gestellte Fragen"
                      : language === "nl"
                        ? "Veelgestelde Vragen"
                        : language === "it"
                          ? "Domande Frequenti"
                          : "Часто задаваемые вопросы"}
          </h2>
          <FAQSection items={faqItems} />
        </div>
      </RevealSection>

      {/* ═══ INTERNAL LINKS ═══ */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="font-heading font-semibold text-lg mb-4">{cp.linksTitle}</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <a
              href={localizedPath("locationBlanes")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cp.linksBlanes}
            </a>
            <a
              href={localizedPath("locationTossa")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cp.linksTossa}
            </a>
            <a
              href={localizedPath("pricing")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cp.linksPricing}
            </a>
            <a
              href={localizedPath("garantias")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cp.linksGarantias}
            </a>
          </div>
        </div>
      </div>

      {/* ═══ CTA ═══ full-width */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            {cp.ctaTitle}
          </h2>
          <p className="text-lg text-white/85 mb-8 max-w-2xl mx-auto">{cp.ctaDescription}</p>
          <Button
            onClick={handleBookingWhatsApp}
            size="lg"
            variant="secondary"
            className="text-primary hover:text-primary"
            data-testid="button-whatsapp-captained"
          >
            {cp.ctaButton}
          </Button>
        </div>
      </div>

      <RelatedContent currentPage="categoryCaptained" />
      <Footer />
    </div>
  );
}
