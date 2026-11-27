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

export default function ActivityFishingPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const fi = t.activityFishing;
  const fishSpecies = fi?.fishSpecies ?? [];
  const recommendedBoats = fi?.recommendedBoats ?? [];
  const fishingSpots = fi?.fishingSpots ?? [];
  const faqs = fi?.faqItems ?? faqsFallback;
  const seoConfig = getSEOConfig("activityFishing", language);
  const hreflangLinks = generateHreflangLinks("activityFishing");
  const canonical = generateCanonicalUrl("activityFishing", language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Pesca desde Barco", url: "/pesca-barco-blanes" },
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
    name: "Alquiler de Barco para Pesca Recreativa desde Blanes",
    description:
      "Alquiler de barco con licencia (basta la Licencia de Navegacion) desde el Puerto de Blanes para pesca recreativa en calas rocosas o aguas abiertas de la Costa Brava. Equipo de pesca NO incluido (trae el tuyo). Requiere licencia de pesca recreativa de la Generalitat.",
    touristType: ["Adventure", "Sports", "Fishing"],
    inLanguage: ["es-ES", "en-GB", "ca-ES", "fr-FR", "de-DE", "nl-NL", "it-IT", "ru-RU"],
    provider: {
      "@type": "LocalBusiness",
      "@id": "https://www.costabravarentaboat.com/#organization",
      name: "Costa Brava Rent a Boat",
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
          <picture>
            <source type="image/webp" srcSet="/images/blog/puerto-barcos.webp" />
            <img
              src="/images/blog/puerto-barcos.jpg"
              alt="Boats in the port of Blanes, Costa Brava"
              width={1920}
              height={600}
              decoding="async"
              draggable={false}
            />
          </picture>
        }
        title={fi?.heroTitle ?? "Pesca desde Barco en Blanes - Costa Brava"}
        subtitle={fi?.heroDescription}
        actions={
          <>
            <InteractiveHoverButton
              tone="dark"
              onClick={handleBookingWhatsApp}
              className="min-h-12 w-full px-8 text-base sm:w-auto"
            >
              {fi?.ctaWhatsApp ?? "Reservar por WhatsApp"}
            </InteractiveHoverButton>
            <a href={localizedPath("categoryLicensed")} className={HERO_SECONDARY}>
              {fi?.ctaViewBoats ?? "Ver barcos con licencia"}
            </a>
          </>
        }
        facts={[fi?.badgeSpecies, fi?.badgeLicense, fi?.badgeDuration]}
      />

      {/* Why fish from Blanes */}
      <Sheet next="muted">
        <div className="grid gap-12 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16">
          <Rise>
            <h2 className={H2}>{fi?.whyTitle}</h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              <Feature title={fi?.whyLocationTitle ?? ""} text={fi?.whyLocationDesc} />
              <Feature title={fi?.whyPortTitle ?? ""} text={fi?.whyPortDesc} />
              <Feature title={fi?.whyVarietyTitle ?? ""} text={fi?.whyVarietyDesc} />
              <Feature title={fi?.whySeasonTitle ?? ""} text={fi?.whySeasonDesc} />
            </div>
          </Rise>
          <Rise delay={0.1}>
            <img
              src="/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-fondeado-bahia.webp"
              alt="Boat anchored in a bay ready for fishing on the Costa Brava"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
              loading="lazy"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Species */}
      <Sheet tone="muted" next="page">
        <Rise>
          <h2 className={H2}>{fi?.speciesTitle}</h2>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
            {fishSpecies.map(species => (
              <div
                key={species.name}
                className="grid gap-3 border-b border-border px-5 py-5 last:border-b-0 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:gap-8"
              >
                <h3 className={H3}>{species.name}</h3>
                <dl className="grid gap-x-6 gap-y-2 text-base sm:grid-cols-3">
                  <div>
                    <dt className="text-sm font-medium text-foreground">
                      {fi?.seasonLabel ?? "Temporada:"}
                    </dt>
                    <dd className="text-muted-foreground">{species.season}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-foreground">
                      {fi?.whereLabel ?? "Dónde:"}
                    </dt>
                    <dd className="text-muted-foreground">{species.where}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-foreground">
                      {fi?.techniqueLabel ?? "Técnica:"}
                    </dt>
                    <dd className="text-muted-foreground">{species.technique}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </Rise>
      </Sheet>

      {/* Recommended boats */}
      <Sheet next="muted">
        <Rise>
          <h2 className={H2}>{fi?.boatsTitle}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {recommendedBoats.map(boat => (
              <article
                key={boat.type}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                  <h3 className={H3}>{boat.type}</h3>
                  <span className="shrink-0 font-heading text-base font-semibold tabular-nums text-foreground">
                    {boat.price}
                  </span>
                </div>
                <div className="flex-1 space-y-3 px-5 py-4 sm:px-6">
                  <p className="text-sm font-medium text-primary dark:text-chart-1">
                    {boat.capacity}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{boat.autonomy}</p>
                  <ul className="border-t border-border">
                    {boat.advantages.map(adv => (
                      <li
                        key={adv}
                        className="border-b border-border py-2.5 text-sm leading-snug text-muted-foreground last:border-b-0"
                      >
                        {adv}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="border-t border-border bg-muted/50 px-5 py-3.5 text-sm font-medium text-foreground sm:px-6">
                  {boat.recommendation}
                </p>
              </article>
            ))}
          </div>
        </Rise>
      </Sheet>

      {/* Fishing spots */}
      <Sheet tone="muted" next="page">
        <Rise>
          <h2 className={H2}>{fi?.spotsTitle}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
            {fishingSpots.map(spot => (
              <Feature
                key={spot.name}
                title={spot.name}
                meta={`${spot.distance} · ${fi?.targetLabel ?? "Objetivo:"} ${spot.target}`}
                text={spot.description}
              />
            ))}
          </div>
        </Rise>
      </Sheet>

      {/* Regulations */}
      <Sheet next="muted">
        <Rise>
          <h2 className={H2}>{fi?.regulationsTitle}</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div className="space-y-8">
              <Feature title={fi?.licenseTitle ?? ""} text={fi?.licenseDesc} />
              <div>
                <h3 className={`${H3} mb-4`}>{fi?.catchLimitsTitle}</h3>
                <CheckPanel items={fi?.catchLimitsItems ?? []} />
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className={`${H3} mb-4`}>{fi?.minSizesTitle}</h3>
                <CheckPanel items={fi?.minSizesItems ?? []} />
              </div>
              <Feature title={fi?.prohibitedTitle ?? ""} text={fi?.prohibitedDesc} />
            </div>
          </div>
        </Rise>
      </Sheet>

      {/* Equipment + links */}
      <Sheet tone="muted" next="navy">
        <Rise>
          <h2 className={H2}>{fi?.equipmentTitle}</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className={`${H3} mb-4`}>{fi?.whatToBringTitle}</h3>
              <CheckPanel items={fi?.whatToBringItems ?? []} />
            </div>
            <div className="space-y-8">
              <Feature title={fi?.whereBaitTitle ?? ""} text={fi?.whereBaitDesc} />
              <Feature title={fi?.recommendationsTitle ?? ""} text={fi?.recommendationsDesc} />
            </div>
          </div>
        </Rise>
        <Rise className="mt-16">
          <LinkList
            title={fi?.exploreTitle}
            links={[
              { href: localizedPath("categoryLicensed"), label: fi?.linkLicensed },
              { href: localizedPath("navigationLicense"), label: fi?.linkNoLicense },
              { href: localizedPath("activitySnorkel"), label: fi?.linkSnorkel },
              { href: localizedPath("pricing"), label: fi?.linkPrices },
              { href: localizedPath("locationBlanes"), label: fi?.linkBlanes },
            ]}
          />
        </Rise>
      </Sheet>

      <CtaSheet
        next="page"
        title={fi?.ctaTitle}
        text={fi?.ctaDescription}
        actions={
          <>
            <NavyButton onClick={handleBookingWhatsApp}>
              <SiWhatsapp className="mr-2 h-5 w-5" aria-hidden="true" />
              {fi?.ctaWhatsApp}
            </NavyButton>
            <a href={localizedPath("categoryLicensed")} className={PILL_ON_NAVY}>
              <Anchor className="h-4 w-4" aria-hidden="true" />
              {fi?.ctaViewBoats}
            </a>
          </>
        }
      />

      <FaqSheet
        idPrefix="fishing-faq"
        title={fi?.faqTitle}
        items={faqs.map(x => ({ q: x.question, a: x.answer }))}
        next="muted"
      />

      <RelatedContent currentPage="activityFishing" />
      <BookingStickyBar />
      <Footer />
    </div>
  );
}
