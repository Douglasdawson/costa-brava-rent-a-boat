import { useEffect } from "react";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { Anchor, Users, Star, Sun, Waves, Camera, Car, Ship, Compass, Fish } from "lucide-react";
import { Link } from "wouter";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import PopularBoatsSection from "@/components/PopularBoatsSection";
import {
  FactPanel,
  Lead,
  LocationCta,
  LocationFaq,
  LocationHero,
  Photo,
  RelatedLinks,
  Rise,
  SectionTitle,
  Sheet,
  SheetWrap,
  TONE_BG,
} from "@/components/location/LocationKit";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
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
import { BOAT_DATA } from "@shared/boatData";
import { isCatalogBoatPubliclyListed } from "@shared/publicFleet";
import { trackLocationPageView } from "@/utils/analytics";
import { translateBoatText } from "@shared/boatTextTranslations";
import ActivitatumTeaser from "@/components/ActivitatumTeaser";
import { BookingStickyBar } from "@/components/MobileStickyBar";

export default function LocationBlanesPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => {
    trackLocationPageView("blanes");
  }, []);
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const seoConfig = getSEOConfig("locationBlanes", language);
  const hreflangLinks = generateHreflangLinks("locationBlanes");
  const canonical = generateCanonicalUrl("locationBlanes", language);

  const s = t.locationPages.blanes.sections!;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const listedBoats = Object.values(BOAT_DATA).filter(b => isCatalogBoatPubliclyListed(b));

  // Location-specific schema
  const blanesSchema = t.locationPages.blanes.schema;
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: blanesSchema?.name ?? "Alquiler de Barcos en Blanes, Costa Brava",
    description:
      blanesSchema?.description ??
      "Alquiler de barcos en Blanes con Licencia de Navegación o con patrón. Puerto de Blanes, Costa Brava. Embarcaciones para hasta 7 personas.",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.6722504,
      longitude: 2.7978625,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Carrer Esplanada del Port",
      addressLocality: "Blanes",
      addressRegion: "Girona",
      postalCode: "17300",
      addressCountry: "ES",
    },
    touristType: ["Family", "Adventure", "Beach"],
    availableLanguage: ["Spanish", "Catalan", "English", "French"],
    provider: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat Blanes",
      telephone: "+34611500372",
      url: "https://www.costabravarentaboat.com/",
    },
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.locationBlanes, url: "/alquiler-barcos-blanes" },
  ]);

  // FAQ schema — reads from i18n for all 8 locales.
  const blanesFaqItems = t.locationPages.blanes.faqItems ?? [];
  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: blanesFaqItems.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  // Combine schemas
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [locationSchema, breadcrumbSchema, faqSchema],
  };

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
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      <LocationHero
        basePath="/images/locations/hero-blanes"
        imageAlt={t.locationPages.blanes.hero.imageAlt ?? t.locationPages.blanes.hero.title}
        title={t.locationPages.blanes.hero.title}
        subtitle={t.locationPages.blanes.hero.subtitle}
        facts={[
          t.locationPages.blanes.hero.badgePort,
          t.locationPages.blanes.hero.badgeCapacity,
          t.locationPages.blanes.hero.badgeDuration,
        ]}
        bookLabel={t.nav.bookNow}
        onBook={() => openBookingModal()}
      />

      {/* Why choose Blanes */}
      <Sheet tone="page" next="muted" labelledBy="blanes-why-title">
        <div className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16">
          <Rise>
            <SectionTitle id="blanes-why-title">{s.whyBlanesTitle}</SectionTitle>
            <FactPanel
              className="mt-8"
              items={[
                { title: s.strategicLocation, desc: s.strategicLocationDesc },
                { title: s.safePorts, desc: s.safePortsDesc },
                { title: s.accessibleCoves, desc: s.accessibleCovesDesc },
                { title: s.allLevels, desc: s.allLevelsDesc },
              ]}
            />
          </Rise>
          <Rise delay={0.1}>
            <Photo
              src="/images/boats/astec-480/alquiler-barco-astec-480-rent-a-boat-costa-brava-blanes-navegando-costa.webp"
              alt="Barco navegando por la costa de Blanes"
            />
          </Rise>
        </div>
      </Sheet>

      {/* Fleet: each boat is a link row */}
      <Sheet tone="muted" next="page" labelledBy="blanes-fleet-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id="blanes-fleet-title">{s.fleetTitle}</SectionTitle>
            <Lead text={s.fleetIntro} className="mt-5" />
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={listedBoats.map(boat => {
                const isNoLicense = boat.features.some(f =>
                  f.toLowerCase().includes("sin licencia")
                );
                const lowestPrice = Math.min(...Object.values(boat.pricing.BAJA.prices));
                return {
                  title: translateBoatText(boat.name, language),
                  meta: (
                    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {boat.specifications.capacity}
                      </span>
                      <span>{boat.specifications.engine}</span>
                    </span>
                  ),
                  lines: [isNoLicense ? s.fleetNoLicense : s.fleetLicense],
                  aside: `${s.fleetFrom} ${lowestPrice} EUR`,
                  href: localizedPath("boatDetail", boat.id),
                };
              })}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Complete guide */}
      <Sheet tone="page" next="muted" labelledBy="blanes-guide-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id="blanes-guide-title">{s.guideTitle}</SectionTitle>
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={[
                { title: s.guideRequirementsTitle, desc: s.guideRequirementsText },
                { title: s.guideSeasonTitle, desc: s.guideSeasonText },
                { title: s.guideIncludedTitle, desc: s.guideIncludedText },
                { title: s.guideBookingTitle, desc: s.guideBookingText },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Pricing table */}
      <Sheet tone="muted" next="page" labelledBy="blanes-pricing-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id="blanes-pricing-title">{s.pricingTitle}</SectionTitle>
            <Lead text={s.pricingIntro} className="mt-5" />
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {s.pricingFuelNote}
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {s.pricingSeasons}
            </p>
            <InteractiveHoverButton
              tone="dark"
              as={Link}
              href={localizedPath("pricing")}
              className="mt-8 min-h-12 px-7 text-base"
            >
              {s.pricingFullDetails}
            </InteractiveHoverButton>
          </Rise>
          <Rise delay={0.1}>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="p-3.5 text-left font-medium">{s.pricingBoatCol}</th>
                    <th className="p-3.5 text-center font-medium">{s.pricingCapacityCol}</th>
                    <th className="p-3.5 text-center font-medium">{s.pricingLowCol}</th>
                    <th className="p-3.5 text-center font-medium">{s.pricingHighCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {listedBoats.map(boat => (
                    <tr key={boat.id} className="border-b border-border last:border-b-0">
                      <td className="p-3.5">
                        <a
                          href={localizedPath("boatDetail", boat.id)}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {translateBoatText(boat.name, language)}
                        </a>
                      </td>
                      <td className="p-3.5 text-center">{boat.specifications.capacity}</td>
                      <td className="p-3.5 text-center">
                        {boat.pricing.BAJA.prices["2h"]
                          ? `${boat.pricing.BAJA.prices["2h"]} EUR`
                          : "-"}
                      </td>
                      <td className="p-3.5 text-center">
                        {boat.pricing.ALTA.prices["2h"]
                          ? `${boat.pricing.ALTA.prices["2h"]} EUR`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Rise>
        </div>
      </Sheet>

      {/* Popular experiences: link rows */}
      <Sheet tone="page" next="muted" labelledBy="blanes-exp-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id="blanes-exp-title">{s.experiencesTitle}</SectionTitle>
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={[
                {
                  title: s.expSnorkelTitle,
                  desc: s.expSnorkelDesc,
                  icon: Waves,
                  href: localizedPath("activitySnorkel"),
                },
                {
                  title: s.expSunsetTitle,
                  desc: s.expSunsetDesc,
                  icon: Sun,
                  href: localizedPath("activitySunset"),
                },
                {
                  title: s.expTossaTitle,
                  desc: s.expTossaDesc,
                  icon: Compass,
                  href: localizedPath("locationTossa"),
                },
                {
                  title: s.expFishingTitle,
                  desc: s.expFishingDesc,
                  icon: Fish,
                  href: localizedPath("activityFishing"),
                },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Key destinations from Blanes */}
      <Sheet tone="muted" next="page" labelledBy="blanes-dest-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
          <Rise>
            <Photo
              src="/images/mejores-calas-costa-brava-mingolla-brava-rent-a-boat.webp"
              alt="Calas de la Costa Brava desde barco"
            />
          </Rise>
          <Rise delay={0.1}>
            <SectionTitle id="blanes-dest-title">{s.destinationsTitle}</SectionTitle>
            <FactPanel
              className="mt-8"
              items={[
                { title: s.calaBrava, meta: s.calaBravaTime, desc: s.calaBravaDesc, icon: Waves },
                { title: s.lloretDeMar, meta: s.lloretTime, desc: s.lloretDesc, icon: Camera },
                {
                  title: s.calaSantFrancesc,
                  meta: s.calaSantFrancescTime,
                  desc: s.calaSantFrancescDesc,
                  icon: Sun,
                },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Local services */}
      <Sheet tone="page" next="muted" labelledBy="blanes-services-title">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id="blanes-services-title">{s.servicesTitle}</SectionTitle>
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={[
                {
                  title: s.portAmenities,
                  list: [
                    { text: s.freeParking, icon: Car },
                    { text: s.fuelStation, icon: Ship },
                    { text: s.restaurants, icon: Star },
                    { text: s.nauticalShops, icon: Anchor },
                  ],
                },
                {
                  title: s.howToGet,
                  list: [
                    { text: s.fromBarcelona },
                    { text: s.fromGirona },
                    { text: s.fromFrance },
                    { text: s.publicTransport },
                  ],
                },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* Nearby towns + related services (internal linking) */}
      <Sheet tone="muted" next="page">
        <RelatedLinks
          id="blanes-nearby-title"
          title={s.nearbyTownsTitle}
          listTitle={s.crossLinksTitle}
          links={[
            { label: s.crossLinkCostaBrava, href: localizedPath("locationCostaBrava") },
            { label: s.crossLinkLicenseFree, href: localizedPath("categoryLicenseFree") },
            { label: s.crossLinkLicensed, href: localizedPath("categoryLicensed") },
            { label: s.crossLinkPricing, href: localizedPath("pricing") },
            { label: s.crossLinkLloret, href: localizedPath("locationLloret") },
            { label: s.crossLinkTossa, href: localizedPath("locationTossa") },
          ]}
        >
          {s.nearbyTownsIntro} <a href={localizedPath("locationMalgrat")}>Malgrat de Mar</a> (
          {s.nearbyTownsMalgratTime}),{" "}
          <a href={localizedPath("locationSantaSusanna")}>Santa Susanna</a> (
          {s.nearbyTownsSantaSusannaTime}) {s.nearbyTownsConjunction}{" "}
          <a href={localizedPath("locationCalella")}>Calella</a> ({s.nearbyTownsCalellaTime}).{" "}
          {s.nearbyTownsTransport}
        </RelatedLinks>
      </Sheet>

      <SheetWrap next="muted">
        <PopularBoatsSection
          bgClass={TONE_BG.page}
          title={
            t.popularBoatsSection?.pages?.blanes?.title ?? "Barcos populares en el Puerto de Blanes"
          }
          description={t.popularBoatsSection?.pages?.blanes?.description}
          boatIds={["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625", "excursion-privada"]}
        />
      </SheetWrap>

      <LocationFaq id="blanes-faq" items={blanesFaqItems} next="navy" tone="muted" />

      <LocationCta
        title={s.ctaTitle}
        desc={s.ctaDescription}
        buttonLabel={s.ctaButton}
        onClick={handleBookingWhatsApp}
        testId="button-book-blanes"
        next="page"
      />

      {/* Location map */}
      <Sheet tone="page" next="muted" labelledBy="blanes-map-title">
        <Rise>
          <SectionTitle id="blanes-map-title">{s.mapTitle}</SectionTitle>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            <div className="h-64 w-full md:h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2980.1411982500704!2d2.7957177!3d41.6742939!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12bb172c94a8856f%3A0x9a2dfa936ef2e0a7!2sCosta%20Brava%20Rent%20a%20Boat%20-%20Blanes%20%7C%20Alquiler%20de%20Barcos%20Con%20y%20Sin%20Licencia!5e0!3m2!1ses!2ses!4v1758876869141!5m2!1ses!2ses"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={s.mapIframeTitle ?? "Mapa de ubicación - Puerto de Blanes"}
                data-testid="map-blanes"
              />
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            <a
              href="https://maps.app.goo.gl/ma3qtsJbuFNhcr4bA"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer underline underline-offset-4 transition-colors hover:text-foreground"
              data-testid="link-blanes-maps"
            >
              Costa Brava Rent a Boat - Blanes, Carrer Esplanada del Port, 17300 Blanes, Girona
            </a>
          </p>
        </Rise>
      </Sheet>

      <RelatedLocationsSection currentLocation="blanes" />

      <ActivitatumTeaser topic={"blanes"} surface="city-landing" />
      <RelatedContent currentPage="locationBlanes" />

      <BookingStickyBar />
      <Footer />
    </div>
  );
}
