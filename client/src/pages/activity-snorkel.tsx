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
import { translateBoatText } from "@shared/boatTextTranslations";
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

export default function ActivitySnorkelPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const s = t.activitySnorkel;
  const faqs = s?.faqItems ?? faqsFallback;
  const snorkelSpots = s?.spots ?? [];
  const recommendedBoats = t.activitySnorkel?.recommendedBoats ?? [];
  const depthLabel = t.activitySnorkel?.depthLabel ?? "Profundidad:";
  const seoConfig = getSEOConfig("activitySnorkel", language);
  const hreflangLinks = generateHreflangLinks("activitySnorkel");
  const canonical = generateCanonicalUrl("activitySnorkel", language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Excursion Snorkel en Barco", url: "/excursion-snorkel-barco-blanes" },
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

  // TouristTrip + Offer: positions this page as a bookable snorkel experience
  // so Google SGE / Perplexity can enumerate it for "snorkel Costa Brava" queries.
  const touristTripSchema = {
    "@type": "TouristTrip",
    "@id": `${canonical}#tour`,
    name: "Ruta de Snorkel en Barco desde Blanes",
    description:
      "Excursión en barco desde el Puerto de Blanes hacia calas vírgenes de aguas cristalinas ideales para snorkel, en lancha con licencia (Licencia de Navegación) o en la excursión privada con patrón. Equipo opcional (7,50€). Seguro y kit de seguridad incluidos; gasolina aparte.",
    touristType: ["Adventure", "Family", "Nature"],
    inLanguage: ["es-ES", "en-GB", "ca-ES", "fr-FR", "de-DE", "nl-NL", "it-IT", "ru-RU"],
    provider: {
      "@type": "LocalBusiness",
      "@id": "https://www.costabravarentaboat.com/#organization",
      name: "Costa Brava Rent a Boat",
    },
    itinerary: {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "Place",
          name: "Sa Palomera",
          description: "5 min desde puerto — roca emblemática con vida marina",
        },
        {
          "@type": "Place",
          name: "Cala Sant Francesc",
          description: "Pinos y agua turquesa, ideal para primer snorkel",
        },
        {
          "@type": "Place",
          name: "Cala Sa Forcanera",
          description: "Cala virgen con fondo rocoso y biodiversidad",
        },
      ],
    },
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
          <img
            src="/images/blog/snorkel-mar.webp"
            alt="Snorkeling in the crystal-clear waters of Costa Brava"
            width={1920}
            height={600}
            decoding="async"
            draggable={false}
          />
        }
        title={s?.heroTitle ?? "Excursión de Snorkel en Barco desde Blanes"}
        subtitle={s?.heroDescription}
        actions={
          <>
            <InteractiveHoverButton
              tone="dark"
              onClick={handleBookingWhatsApp}
              className="min-h-12 w-full px-8 text-base sm:w-auto"
            >
              {s?.ctaWhatsApp ?? "Reservar por WhatsApp"}
            </InteractiveHoverButton>
            <a href={localizedPath("categoryLicensed")} className={HERO_SECONDARY}>
              {s?.ctaViewBoats ?? "Ver barcos disponibles"}
            </a>
          </>
        }
        facts={[s?.badgeSpots, s?.badgeVisibility, s?.badgeDuration]}
      />

      {/* Why snorkel from a boat */}
      <Sheet next="muted">
        <div className="grid gap-12 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16">
          <Rise>
            <h2 className={H2}>{s?.whyTitle}</h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              <Feature title={s?.whyAccessTitle ?? ""} text={s?.whyAccessDesc} />
              <Feature title={s?.whyBaseTitle ?? ""} text={s?.whyBaseDesc} />
              <Feature title={s?.whyMultiTitle ?? ""} text={s?.whyMultiDesc} />
              <Feature title={s?.whyNoExpTitle ?? ""} text={s?.whyNoExpDesc} />
            </div>
          </Rise>
          <Rise delay={0.1}>
            <img
              src="/images/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-amigos-snorkel.webp"
              alt="Friends enjoying snorkeling from a rented boat"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
              loading="lazy"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Spots */}
      <Sheet tone="muted" next="page">
        <Rise>
          <h2 className={H2}>{s?.spotsTitle}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
            {snorkelSpots.map(spot => (
              <Feature
                key={spot.name}
                title={spot.name}
                meta={`${spot.distance} · ${depthLabel} ${spot.depth}`}
                text={spot.highlights}
              >
                <p className="mt-3 border-t border-border pt-3 text-sm font-medium text-foreground">
                  {spot.ideal}
                </p>
              </Feature>
            ))}
          </div>
        </Rise>
      </Sheet>

      {/* Equipment */}
      <Sheet next="muted">
        <Rise>
          <h2 className={H2}>{s?.equipmentTitle}</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className={`${H3} mb-4`}>{s?.includedTitle}</h3>
              <CheckPanel items={s?.includedItems ?? []} />
            </div>
            <div>
              <h3 className={`${H3} mb-4`}>{s?.rentalTitle}</h3>
              <CheckPanel items={s?.rentalItems ?? []} />
            </div>
          </div>
        </Rise>
      </Sheet>

      {/* Recommended boats */}
      <Sheet tone="muted" next="page">
        <Rise>
          <h2 className={H2}>{s?.boatsTitle}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {recommendedBoats.map(boat => (
              <article
                key={boat.name}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                  <h3 className={H3}>{translateBoatText(boat.name, language)}</h3>
                  <span className="shrink-0 font-heading text-base font-semibold tabular-nums text-foreground">
                    {boat.price}
                  </span>
                </div>
                <div className="space-y-3 px-5 py-4 sm:px-6">
                  <p className="text-sm font-medium text-primary dark:text-chart-1">
                    {boat.duration}
                  </p>
                  <LeadText text={boat.description} />
                </div>
              </article>
            ))}
          </div>
        </Rise>
      </Sheet>

      {/* Suggested route + links */}
      <Sheet next="navy">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 className={H2}>{s?.routeTitle}</h2>
          </Rise>
          <Rise delay={0.1}>
            <ol className="overflow-hidden rounded-2xl border border-border bg-card">
              {(s?.routeSteps ?? []).map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-4 border-b border-border px-5 py-4 last:border-b-0 sm:px-6"
                >
                  <span className="w-5 shrink-0 font-heading text-base font-semibold tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold leading-snug text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Rise>
        </div>
        <Rise className="mt-16">
          <LinkList
            title={s?.exploreTitle}
            links={[
              { href: localizedPath("categoryCaptained"), label: s?.linkNoLicense },
              { href: localizedPath("categoryLicensed"), label: s?.linkLicensed },
              { href: localizedPath("activityFamilies"), label: s?.linkFamilies },
              { href: localizedPath("pricing"), label: s?.linkPrices },
              { href: localizedPath("routes"), label: s?.linkRoutes },
            ]}
          />
        </Rise>
      </Sheet>

      <CtaSheet
        next="page"
        title={s?.ctaTitle}
        text={s?.ctaDescription}
        actions={
          <>
            <NavyButton onClick={handleBookingWhatsApp}>
              <SiWhatsapp className="mr-2 h-5 w-5" aria-hidden="true" />
              {s?.ctaWhatsApp}
            </NavyButton>
            <a href={localizedPath("categoryLicensed")} className={PILL_ON_NAVY}>
              <Anchor className="h-4 w-4" aria-hidden="true" />
              {s?.ctaViewBoats}
            </a>
          </>
        }
      />

      <FaqSheet
        idPrefix="snorkel-faq"
        title={s?.faqTitle}
        items={faqs.map(x => ({ q: x.question, a: x.answer }))}
        next="muted"
      />

      <RelatedContent currentPage="activitySnorkel" />
      <BookingStickyBar />
      <Footer />
    </div>
  );
}
