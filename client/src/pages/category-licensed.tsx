import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle,
  Anchor,
  Gauge,
  Award,
  MapPin,
  ArrowLeftRight,
  ListChecks,
  FileText,
  Scale,
  Fuel,
  ChevronRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import LicenseVerifierInline from "@/components/booking/LicenseVerifierInline";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { FAQSection } from "@/components/FAQSection";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { ReducedDepositLink } from "@/components/ReducedDepositLink";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { BOAT_DATA, isCaptainedBoat, type BoatData } from "@shared/boatData";
import { minPriceAcrossBoats } from "@shared/pricing";
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
      price: minPrice ? `Desde ${minPrice}€` : "",
    };
  });

  const cl = t.categoryLicensed!;

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

  return (
    <div className="min-h-screen">
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

      {/* ═══ HERO ═══ */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Award className="w-8 h-8 text-primary mr-4 shrink-0" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {cl.heroTitle}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {cl.heroDescription}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Award className="w-4 h-4 mr-2" />
                {cl.badgeLicense}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Gauge className="w-4 h-4 mr-2" />
                {cl.badgePower}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {cl.badgeCapacity}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ WHAT IS A LICENSED POWERBOAT ═══ text + image */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
                {cl.whatAreTitle}
              </h2>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {cl.advancedNavigation}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {cl.advancedNavigationDesc}
                  </p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {cl.greaterFreedom}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{cl.greaterFreedomDesc}</p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {cl.professionalEquipment}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {cl.professionalEquipmentDesc}
                  </p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {cl.superiorPerformance}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {cl.superiorPerformanceDesc}
                  </p>
                </div>
              </div>
              <div className="mt-8 bg-muted rounded-xl p-5">
                <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                  {cl.synonymsTitle}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{cl.synonymsBody}</p>
              </div>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-cala-agua-cristalina.webp"
                alt="Licensed powerboat in the crystal-clear waters of a Costa Brava cove"
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
          src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-cala-costa-brava.webp"
          alt="Licensed powerboat navigating along the Costa Brava coastline"
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
            {cl.routeTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">{cl.routeIntro}</p>
          <ol className="relative border-l-2 border-primary/30 ml-3 space-y-6">
            {routeStops.map((stop, idx) => (
              <li key={idx} className="pl-6 relative">
                <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-primary" />
                <p className="text-foreground leading-relaxed">{stop}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            <a
              href={localizedPath("locationTossa")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cl.linksTossa}
            </a>
            <a
              href={localizedPath("blogDetail", "alquiler-barco-tossa-de-mar-desde-blanes")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cl.linksBlogTossa}
            </a>
          </div>
        </div>
      </RevealSection>

      {/* ═══ REQUIREMENTS + LICENSE VERIFIER ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
            <Award className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {cl.requirementsTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">{cl.acceptedLicenses}</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <span className="font-medium">{cl.licenciaNavegacion}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <span>{cl.per}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <span>{cl.pnb}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <span>{cl.yachtCaptain}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <span>{cl.icc}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <span>{cl.euEquivalent}</span>
                </li>
              </ul>
              <p className="mt-6 mb-2 text-sm font-medium text-foreground">{cl.verifierLead}</p>
              <LicenseVerifierInline />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">
                {cl.additionalRequirements}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <span>{cl.minAge}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <span>{cl.validId}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <span>{cl.validLicense}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 mt-1 flex-shrink-0" />
                  <span>
                    {cl.deposit}
                    <span className="mt-1 block">
                      <ReducedDepositLink requiresLicense />
                    </span>
                  </span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <span>{cl.technicalBriefing}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ OUR LICENSED FLEET ═══ cards link to each boat page */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-12">
            <Anchor className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {cl.fleetTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {licensedBoats.map(boat => (
              <a
                key={boat.id}
                href={localizedPath("boatDetail", boat.id)}
                className="block bg-background rounded-2xl p-6 border border-border transition-colors hover:border-primary"
              >
                <h3 className="font-heading font-semibold text-xl mb-3 text-primary">
                  {boat.name}
                </h3>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{boat.capacity}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Gauge className="w-4 h-4 mr-2" />
                    <span>{boat.engine}</span>
                  </div>
                  <div className="space-y-1">
                    {boat.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-muted-foreground">
                        <CheckCircle className="w-4 h-4 mr-2 text-primary shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-lg font-heading font-semibold text-primary">{boat.price}</div>
              </a>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ═══ COMPARISON TABLE ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-6">
            <ArrowLeftRight className="w-6 h-6 text-primary shrink-0" />
            {cl.comparisonTitle}
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">{cl.comparisonIntro}</p>
          <div className="rounded-2xl bg-background overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">{cl.comparisonBoatName}</th>
                    <th className="text-left p-3 font-semibold">{cl.comparisonCapacity}</th>
                    <th className="text-left p-3 font-semibold">{cl.comparisonEngine}</th>
                    <th className="text-left p-3 font-semibold">{cl.comparisonBestFor}</th>
                    <th className="text-right p-3 font-semibold">{cl.comparisonPriceLow}</th>
                    <th className="text-right p-3 font-semibold">{cl.comparisonPriceHigh}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonBoats.map(boat => (
                    <tr key={boat.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">
                        <a
                          href={localizedPath("boatDetail", boat.id)}
                          className="text-primary hover:underline"
                        >
                          {boat.data.name}
                        </a>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {boat.data.specifications.capacity}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {boat.data.specifications.engine}
                      </td>
                      <td className="p-3 text-muted-foreground">{bestForMap[boat.id]}</td>
                      <td className="p-3 text-right font-semibold text-primary">
                        {boat.data.pricing.BAJA.prices["2h"]}
                        {"€"}
                      </td>
                      <td className="p-3 text-right font-semibold text-primary">
                        {boat.data.pricing.ALTA.prices["2h"]}
                        {"€"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ REGULATION ═══ */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-6">
            <Scale className="w-6 h-6 text-primary shrink-0" />
            {cl.regulationTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">{cl.regulationIntro}</p>
          <p className="text-muted-foreground leading-relaxed mb-6">{cl.regulationForeign}</p>
          <p className="text-foreground leading-relaxed bg-amber-50 border border-amber-200 rounded-lg p-4">
            <Fuel className="w-5 h-5 text-amber-600 inline mr-2 -mt-1" />
            {cl.regulationFuelDeposit}
          </p>
        </div>
      </RevealSection>

      {/* ═══ HOW TO: 5 STEPS ═══ */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-4">
            <ListChecks className="w-6 h-6 text-primary shrink-0" />
            {cl.howToTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">{cl.howToIntro}</p>
          <ol className="space-y-6">
            {howToSteps.map((step, idx) => (
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

      {/* ═══ DIRECT VS MARKETPLACES ═══ */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-heading font-bold mb-4">
            <ArrowLeftRight className="w-6 h-6 text-primary shrink-0" />
            {cl.vsMarketplacesTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">{cl.vsMarketplacesIntro}</p>
          <div className="rounded-2xl bg-background border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold w-1/4"></th>
                    <th className="text-left p-3 font-semibold text-primary">
                      <CheckCircle className="w-4 h-4 inline mr-1.5" />
                      {cl.vsMarketplacesCol1}
                    </th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">
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
                    <tr key={idx} className="border-b last:border-b-0">
                      <td className="p-3 font-medium">{label}</td>
                      <td className="p-3 text-foreground">{direct}</td>
                      <td className="p-3 text-muted-foreground">{market}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-foreground leading-relaxed mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle className="w-5 h-5 text-green-600 inline mr-2 -mt-1" />
            {cl.vsMarketplacesConclusion}
          </p>
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
          <h3 className="font-heading font-semibold text-lg mb-4">{cl.linksTitle}</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <a
              href={localizedPath("locationBlanes")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cl.linksBlanes}
            </a>
            <a
              href={localizedPath("locationTossa")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cl.linksTossa}
            </a>
            <a
              href={localizedPath("pricing")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cl.linksPricing}
            </a>
            <a
              href={localizedPath("categoryLicenseFree")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cl.linksNoLicense}
            </a>
            <a
              href={localizedPath("boatDetail", "excursion-privada")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {cl.linksSkipper}
            </a>
          </div>
        </div>
      </div>

      {/* ═══ CTA ═══ full-width */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            {cl.ctaTitle}
          </h2>
          <p className="text-lg text-white/85 mb-8 max-w-2xl mx-auto">{cl.ctaDescription}</p>
          <Button
            onClick={handleBookingWhatsApp}
            size="lg"
            variant="secondary"
            className="text-primary hover:text-primary"
            data-testid="button-whatsapp-licensed"
          >
            {cl.ctaButton}
          </Button>
        </div>
      </div>

      <RelatedContent currentPage="categoryLicensed" />
      <Footer />
    </div>
  );
}
