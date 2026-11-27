import { Anchor } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import Navigation from "@/components/Navigation";
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
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import {
  H2,
  H3,
  Sheet,
  Rise,
  Feature,
  LeadText,
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

export default function ActivityFamiliesPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const f = t.activityFamilies;
  const faqs = f?.faqItems ?? faqsFallback;
  const safetyFeatures = f?.safetyFeatures ?? [];
  const familyRoutes = f?.familyRoutes ?? [];
  const seoConfig = getSEOConfig("activityFamilies", language);
  const hreflangLinks = generateHreflangLinks("activityFamilies");
  const canonical = generateCanonicalUrl("activityFamilies", language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Barco para Familias", url: "/barco-familias-costa-brava" },
  ]);

  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const touristTripSchema = {
    "@type": "TouristTrip",
    "@id": `${canonical}#tour`,
    name: "Excursion Familiar en Barco desde Blanes",
    description:
      "Alquiler de barco para familias con ninos desde el Puerto de Blanes: lanchas con licencia que se llevan con la Licencia de Navegacion, o excursion privada con patron. Navegacion a calas tranquilas y aguas cristalinas en la Costa Brava Sur. Chalecos salvavidas infantiles incluidos.",
    touristType: ["Family", "Beach", "Nature"],
    inLanguage: ["es-ES", "en-GB", "ca-ES", "fr-FR", "de-DE", "nl-NL", "it-IT", "ru-RU"],
    provider: {
      "@type": "LocalBusiness",
      "@id": "https://www.costabravarentaboat.com/#organization",
      name: "Costa Brava Rent a Boat",
    },
    maximumAttendeeCapacity: 7,
    isFamilyFriendly: true,
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
            <source type="image/webp" srcSet="/images/blog/familias-barco.webp" />
            <img
              src="/images/blog/familias-barco.jpg"
              alt="Families enjoying a day on the water in Costa Brava"
              width={1920}
              height={600}
              decoding="async"
              draggable={false}
            />
          </picture>
        }
        title={f?.heroTitle ?? "Alquiler de Barco para Familias en Costa Brava"}
        subtitle={f?.heroDescription}
        actions={
          <>
            <InteractiveHoverButton
              tone="dark"
              onClick={handleBookingWhatsApp}
              className="min-h-12 w-full px-8 text-base sm:w-auto"
            >
              {f?.ctaWhatsApp ?? "Reservar por WhatsApp"}
            </InteractiveHoverButton>
            <a href={localizedPath("categoryLicensed")} className={HERO_SECONDARY}>
              {f?.ctaViewBoats ?? "Ver barcos con licencia"}
            </a>
          </>
        }
        facts={[f?.badgeNoLicense, f?.badgeKidsVests, f?.badgeFuel]}
      />

      {/* Why families */}
      <Sheet next="muted">
        <div className="grid gap-12 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16">
          <Rise>
            <h2 className={H2}>{f?.whyTitle}</h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              <Feature title={f?.whyMemoriesTitle ?? ""} text={f?.whyMemoriesDesc} />
              <Feature title={f?.whyNoStressTitle ?? ""} text={f?.whyNoStressDesc} />
              <Feature title={f?.whyCalmCovesTitle ?? ""} text={f?.whyCalmCovesDesc} />
              <Feature title={f?.whyFlexTitle ?? ""} text={f?.whyFlexDesc} />
            </div>
          </Rise>
          <Rise delay={0.1}>
            <img
              src="/images/boats/remus-450/alquiler-barco-remus-450-rent-a-boat-costa-brava-blanes-familia-navegando.webp"
              alt="Family navigating a boat along the Costa Brava coast"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
              loading="lazy"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Safety */}
      <Sheet tone="muted" next="page">
        <Rise>
          <h2 className={H2}>{f?.safetyTitle}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {safetyFeatures.map(feature => (
              <Feature key={feature.title} title={feature.title} text={feature.description} />
            ))}
          </div>
        </Rise>
      </Sheet>

      {/* Routes */}
      <Sheet next="muted">
        <Rise>
          <h2 className={H2}>{f?.routesTitle}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {familyRoutes.map(route => (
              <article
                key={route.name}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                  <h3 className={H3}>{route.name}</h3>
                  <span className="shrink-0 font-heading text-base font-semibold tabular-nums text-foreground">
                    {route.price}
                  </span>
                </div>
                <div className="flex-1 space-y-3 px-5 py-4 sm:px-6">
                  <p className="text-sm font-medium text-primary dark:text-chart-1">
                    {f?.stopsLabel ? `${f.stopsLabel} ` : ""}
                    {route.stops.join(" → ")}
                  </p>
                  <LeadText text={route.description} />
                </div>
                <p className="border-t border-border bg-muted/50 px-5 py-3.5 text-sm font-medium text-foreground sm:px-6">
                  {f?.tipLabel ?? "Consejo:"} {route.tip}
                </p>
              </article>
            ))}
          </div>
        </Rise>
      </Sheet>

      {/* What to bring + links */}
      <Sheet tone="muted" next="navy">
        <Rise>
          <h2 className={H2}>{f?.whatToBringTitle}</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className={`${H3} mb-4`}>{f?.essentialTitle ?? "Imprescindible"}</h3>
              <CheckPanel items={f?.essentialItems ?? []} />
            </div>
            <div>
              <h3 className={`${H3} mb-4`}>{f?.recommendedTitle ?? "Recomendado"}</h3>
              <CheckPanel items={f?.recommendedItems ?? []} />
            </div>
            <div>
              <h3 className={`${H3} mb-4`}>{f?.optionalTitle ?? "Opcional"}</h3>
              <CheckPanel items={f?.optionalItems ?? []} />
            </div>
          </div>
        </Rise>
        <Rise className="mt-16">
          <LinkList
            title={f?.exploreTitle}
            links={[
              { href: localizedPath("categoryLicensed"), label: f?.linkNoLicense },
              { href: localizedPath("activitySnorkel"), label: f?.linkSnorkel },
              { href: localizedPath("pricing"), label: f?.linkPrices },
              { href: localizedPath("locationBlanes"), label: f?.linkBlanes },
              { href: localizedPath("routes"), label: f?.linkRoutes },
            ]}
          />
        </Rise>
      </Sheet>

      <CtaSheet
        next="page"
        title={f?.ctaTitle}
        text={f?.ctaDescription}
        actions={
          <>
            <NavyButton onClick={handleBookingWhatsApp}>
              <SiWhatsapp className="mr-2 h-5 w-5" aria-hidden="true" />
              {f?.ctaWhatsApp}
            </NavyButton>
            <a href={localizedPath("categoryLicensed")} className={PILL_ON_NAVY}>
              <Anchor className="h-4 w-4" aria-hidden="true" />
              {f?.ctaViewBoats}
            </a>
          </>
        }
      />

      <FaqSheet
        idPrefix="families-faq"
        title={f?.faqTitle}
        items={faqs.map(x => ({ q: x.question, a: x.answer }))}
        next="muted"
      />

      <RelatedContent currentPage="activityFamilies" />
      <BookingStickyBar />
      <Footer />
    </div>
  );
}
