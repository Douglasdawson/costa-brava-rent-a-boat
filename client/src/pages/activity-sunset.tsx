import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sunset,
  Clock,
  Heart,
  Camera,
  Wine,
  MapPin,
  ChevronRight,
  Star,
  Anchor,
  MessageCircle,
  Calendar,
  Users,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { FAQSection } from "@/components/FAQSection";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";

// Icons paired by position to t.activitySunset.viewpoints.
const VIEWPOINT_ICONS = [MapPin, Camera, Star];

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

const faqsFallback: Array<{ question: string; answer: string }> = [];

export default function ActivitySunsetPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const s = t.activitySunset!;
  const faqs = s.faqItems ?? faqsFallback;
  const sunsetTimes = s.sunsetTimes ?? [];
  const viewpoints = (s.viewpoints ?? []).map(
    (vp: { name: string; distance: string; description: string }, i: number) => ({
      ...vp,
      icon: VIEWPOINT_ICONS[i] ?? MapPin,
    }),
  );
  const romanticIdeas = s.romanticIdeas ?? [];
  const seoConfig = getSEOConfig("activitySunset", language);
  const hreflangLinks = generateHreflangLinks("activitySunset");
  const canonical = generateCanonicalUrl("activitySunset", language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(
      undefined,
      undefined,
      t.whatsappMessages,
    );
    openWhatsApp(message);
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: s.breadcrumbHome ?? "Inicio", url: "/" },
    {
      name: s.breadcrumbSunset ?? "Paseo en barco al atardecer",
      url: "/sunset-boat-trip-blanes",
    },
  ]);

  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: faqs.map(
      (faq: { question: string; answer: string }) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      }),
    ),
  };

  const touristTripSchema = {
    "@type": "TouristTrip",
    "@id": `${canonical}#tour`,
    name: s.heroTitle,
    description: s.heroDescription,
    touristType: ["Romance", "Nature", "Couples"],
    inLanguage: [
      "es-ES",
      "en-GB",
      "ca-ES",
      "fr-FR",
      "de-DE",
      "nl-NL",
      "it-IT",
      "ru-RU",
    ],
    provider: {
      "@type": "LocalBusiness",
      "@id": "https://www.costabravarentaboat.com/#organization",
      name: "Costa Brava Rent a Boat",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Pack atardecer 2h",
        price: "115",
        priceCurrency: "EUR",
        priceValidUntil: "2026-10-31",
        availability: "https://schema.org/InStock",
        url: canonical,
        description: s.ctaDescription,
      },
    ],
    maximumAttendeeCapacity: 7,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [breadcrumbSchema, touristTripSchema, faqSchema],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        keywords={seoConfig.keywords}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      {/* ═══ HERO ═══ */}
      <div className="bg-gradient-to-br from-orange-50 to-rose-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Sunset className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {s.heroTitle}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              {s.heroDescription}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Sunset className="w-4 h-4 mr-2" />
                {s.badgeGoldenHour}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                {s.badgeDuration}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Heart className="w-4 h-4 mr-2" />
                {s.badgeCouples}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ WHY A SUNSET TRIP ═══ text + image */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
                {s.whyTitle}
              </h2>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {s.whyGoldenHourTitle}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.whyGoldenHourDesc}
                  </p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {s.whyPrivateTitle}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.whyPrivateDesc}
                  </p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {s.whyAffordableTitle}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.whyAffordableDesc}
                  </p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-foreground">
                    {s.whyTemperatureTitle}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.whyTemperatureDesc}
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-popa-atardecer.webp"
                alt="Boat stern at sunset on the Costa Brava waters"
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                width={640}
                height={800}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ SUNSET PHOTO BREAK ═══ */}
      <div className="w-full overflow-hidden">
        <img
          src="/images/blog/atardecer-mar.jpg"
          alt="Golden sunset over the Mediterranean sea from a boat"
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* ═══ BEST VIEWPOINTS ═══ feature grid */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center text-foreground mb-12">
            <Camera className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {s.viewpointsTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {viewpoints.map(
              (spot: {
                name: string;
                distance: string;
                description: string;
                icon: React.ComponentType<{ className?: string }>;
              }) => {
                const Icon = spot.icon;
                return (
                  <div key={spot.name} className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2">
                      {spot.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {spot.distance}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {spot.description}
                    </p>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </RevealSection>

      {/* ═══ SUNSET TIMES BY MONTH ═══ table */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
            <Calendar className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {s.sunsetTimesTitle}
          </h2>
          <div className="overflow-x-auto rounded-2xl bg-muted">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-6 font-heading font-semibold">
                    {s.sunsetTimesTableMonth}
                  </th>
                  <th className="py-4 px-6 font-heading font-semibold">
                    {s.sunsetTimesTableTime}
                  </th>
                  <th className="py-4 px-6 font-heading font-semibold">
                    {s.sunsetTimesTableDeparture}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sunsetTimes.map(
                  (row: { month: string; time: string; suggestion: string }) => (
                    <tr
                      key={row.month}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-3.5 px-6 font-medium">{row.month}</td>
                      <td className="py-3.5 px-6 text-muted-foreground">
                        {row.time}
                      </td>
                      <td className="py-3.5 px-6 text-muted-foreground">
                        {row.suggestion}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {s.sunsetTimesNote}
          </p>
        </div>
      </RevealSection>

      {/* ═══ ROMANTIC IDEAS ═══ icon-led grid */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
            <Wine className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {s.romanticIdeasTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {romanticIdeas.map(
              (idea: { title: string; description: string }) => (
                <div key={idea.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-2">
                      {idea.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {idea.description}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </RevealSection>

      {/* ═══ WHAT TO BRING ═══ */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-10">
            <Users className="w-6 h-6 text-primary inline-block mr-3 align-middle" />
            {s.whatToBringTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">
                {s.whatToBringEssentials}
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                {(s.whatToBringEssentialItems ?? []).map(
                  (item: string, i: number) => (
                    <li key={i} className="flex items-center">
                      <ChevronRight className="w-4 h-4 text-primary mr-3 shrink-0" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">
                {s.whatToBringNice}
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                {(s.whatToBringNiceItems ?? []).map(
                  (item: string, i: number) => (
                    <li key={i} className="flex items-center">
                      <ChevronRight className="w-4 h-4 text-primary mr-3 shrink-0" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ═══ INTERNAL LINKS ═══ */}
      <div className="py-8 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="font-heading font-semibold text-lg mb-4">
            {s.exploreMore}
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <a
              href={localizedPath("categoryLicenseFree")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {s.linkNoLicense}
            </a>
            <a
              href={localizedPath("activitySnorkel")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {s.linkSnorkel}
            </a>
            <a
              href={localizedPath("pricing")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {s.linkPrices}
            </a>
            <a
              href={localizedPath("locationBlanes")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {s.linkBlanes}
            </a>
            <a
              href={localizedPath("routes")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              {s.linkRoutes}
            </a>
          </div>
        </div>
      </div>

      {/* ═══ CTA ═══ full-width */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            {s.ctaTitle}
          </h2>
          <p className="text-lg text-white/85 mb-8 max-w-2xl mx-auto">
            {s.ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleBookingWhatsApp}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {s.ctaWhatsApp}
            </Button>
            <a href={localizedPath("categoryLicenseFree")}>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 w-full"
              >
                <Anchor className="w-5 h-5 mr-2" />
                {s.ctaViewBoats}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* ═══ FAQ ═══ */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-10">
            {s.faqTitle}
          </h2>
          <FAQSection items={faqs} />
        </div>
      </RevealSection>

      <RelatedContent currentPage="activitySunset" />
      <Footer />
    </div>
  );
}
