import { Anchor } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import {
  H2,
  H3,
  Sheet,
  Rise,
  Feature,
  CheckPanel,
  LinkList,
  PhotoHero,
  CtaSheet,
  NavyButton,
  FaqSheet,
  HERO_SECONDARY,
  PILL_ON_NAVY,
} from "@/components/activity-kit";
import { BookingStickyBar } from "@/components/MobileStickyBar";

const faqsFallback: Array<{ question: string; answer: string }> = [];

export default function ActivitySunsetPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const s = t.activitySunset!;
  const faqs = s.faqItems ?? faqsFallback;
  const sunsetTimes = s.sunsetTimes ?? [];
  const viewpoints = s.viewpoints ?? [];
  const romanticIdeas = s.romanticIdeas ?? [];
  const seoConfig = getSEOConfig("activitySunset", language);
  const hreflangLinks = generateHreflangLinks("activitySunset");
  const canonical = generateCanonicalUrl("activitySunset", language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
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
    mainEntity: faqs.map((faq: { question: string; answer: string }) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const touristTripSchema = {
    "@type": "TouristTrip",
    "@id": `${canonical}#tour`,
    name: s.heroTitle,
    description: s.heroDescription,
    touristType: ["Romance", "Nature", "Couples"],
    inLanguage: ["es-ES", "en-GB", "ca-ES", "fr-FR", "de-DE", "nl-NL", "it-IT", "ru-RU"],
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

      <PhotoHero
        minHeight="sm:min-h-[72svh]"
        media={
          <picture>
            <source type="image/webp" srcSet="/images/blog/atardecer-mar.webp" />
            <img
              src="/images/blog/atardecer-mar.jpg"
              alt="Golden sunset over the Mediterranean sea from a boat"
              width={1920}
              height={600}
              decoding="async"
              draggable={false}
            />
          </picture>
        }
        title={s.heroTitle}
        subtitle={s.heroDescription}
        actions={
          <>
            <InteractiveHoverButton
              tone="dark"
              onClick={handleBookingWhatsApp}
              className="min-h-12 w-full px-8 text-base sm:w-auto"
            >
              {s.ctaWhatsApp}
            </InteractiveHoverButton>
            <a href={localizedPath("categoryLicensed")} className={HERO_SECONDARY}>
              {s.ctaViewBoats}
            </a>
          </>
        }
        facts={[s.badgeGoldenHour, s.badgeDuration, s.badgeCouples]}
      />

      {/* Why a sunset trip */}
      <Sheet next="muted">
        <div className="grid gap-12 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16">
          <Rise>
            <h2 className={H2}>{s.whyTitle}</h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              <Feature title={s.whyGoldenHourTitle} text={s.whyGoldenHourDesc} />
              <Feature title={s.whyPrivateTitle} text={s.whyPrivateDesc} />
              <Feature title={s.whyAffordableTitle} text={s.whyAffordableDesc} />
              <Feature title={s.whyTemperatureTitle} text={s.whyTemperatureDesc} />
            </div>
          </Rise>
          <Rise delay={0.1}>
            <img
              src="/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-popa-atardecer.webp"
              alt="Boat stern at sunset on the Costa Brava waters"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
              loading="lazy"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Viewpoints */}
      <Sheet tone="muted" next="page">
        <Rise>
          <h2 className={H2}>{s.viewpointsTitle}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
            {viewpoints.map(spot => (
              <Feature
                key={spot.name}
                title={spot.name}
                meta={spot.distance}
                text={spot.description}
              />
            ))}
          </div>
        </Rise>
      </Sheet>

      {/* Sunset times by month */}
      <Sheet next="muted" containerClassName="max-w-4xl">
        <Rise>
          <h2 className={H2}>{s.sunsetTimesTitle}</h2>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-base">
              <thead className="bg-muted/60 text-sm text-muted-foreground">
                <tr className="border-b border-border">
                  <th scope="col" className="px-5 py-3 font-medium sm:px-6">
                    {s.sunsetTimesTableMonth}
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium sm:px-6">
                    {s.sunsetTimesTableTime}
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium sm:px-6">
                    {s.sunsetTimesTableDeparture}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sunsetTimes.map(row => (
                  <tr key={row.month} className="border-b border-border last:border-0">
                    <th scope="row" className="px-5 py-3.5 font-medium text-foreground sm:px-6">
                      {row.month}
                    </th>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-foreground sm:px-6">
                      {row.time}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground sm:px-6">{row.suggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
            {s.sunsetTimesNote}
          </p>
        </Rise>
      </Sheet>

      {/* Romantic ideas */}
      <Sheet tone="muted" next="page">
        <Rise>
          <h2 className={H2}>{s.romanticIdeasTitle}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {romanticIdeas.map(idea => (
              <Feature key={idea.title} title={idea.title} text={idea.description} />
            ))}
          </div>
        </Rise>
      </Sheet>

      {/* What to bring + links */}
      <Sheet next="navy">
        <Rise>
          <h2 className={H2}>{s.whatToBringTitle}</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className={`${H3} mb-4`}>{s.whatToBringEssentials}</h3>
              <CheckPanel items={s.whatToBringEssentialItems ?? []} />
            </div>
            <div>
              <h3 className={`${H3} mb-4`}>{s.whatToBringNice}</h3>
              <CheckPanel items={s.whatToBringNiceItems ?? []} />
            </div>
          </div>
        </Rise>
        <Rise className="mt-16">
          <LinkList
            title={s.exploreMore}
            links={[
              { href: localizedPath("categoryLicensed"), label: s.linkNoLicense },
              { href: localizedPath("activitySnorkel"), label: s.linkSnorkel },
              { href: localizedPath("pricing"), label: s.linkPrices },
              { href: localizedPath("locationBlanes"), label: s.linkBlanes },
              { href: localizedPath("routes"), label: s.linkRoutes },
            ]}
          />
        </Rise>
      </Sheet>

      <CtaSheet
        next="page"
        title={s.ctaTitle}
        text={s.ctaDescription}
        actions={
          <>
            <NavyButton onClick={handleBookingWhatsApp}>
              <SiWhatsapp className="mr-2 h-5 w-5" aria-hidden="true" />
              {s.ctaWhatsApp}
            </NavyButton>
            <a href={localizedPath("categoryLicensed")} className={PILL_ON_NAVY}>
              <Anchor className="h-4 w-4" aria-hidden="true" />
              {s.ctaViewBoats}
            </a>
          </>
        }
      />

      <FaqSheet
        idPrefix="sunset-faq"
        title={s.faqTitle}
        items={faqs.map(x => ({ q: x.question, a: x.answer }))}
        next="muted"
      />

      <RelatedContent currentPage="activitySunset" />
      <BookingStickyBar />
      <Footer />
    </div>
  );
}
