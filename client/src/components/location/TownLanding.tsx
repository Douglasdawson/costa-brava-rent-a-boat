import type { ReactNode } from "react";
import { Car, Users, ParkingCircle, type LucideIcon } from "lucide-react";
import { Link } from "wouter";
import PopularBoatsSection from "@/components/PopularBoatsSection";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import ActivitatumTeaser from "@/components/ActivitatumTeaser";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  FactPanel,
  Lead,
  LocationCta,
  LocationFaq,
  LocationHero,
  Photo,
  Rise,
  SectionTitle,
  Sheet,
  SheetWrap,
  TONE_BG,
} from "@/components/location/LocationKit";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";

type Sections = Record<string, string | undefined>;

interface TownLandingProps {
  /** Key of t.popularBoatsSection.pages and of RelatedLocationsSection. */
  slug: string;
  s: Sections | undefined;
  /** Substitutes the {fleetCount}/{licBaja2h}... placeholders. */
  render: (tpl: string | undefined, fallback: string) => string;
  heroTitle: string;
  heroImage?: { basePath: string; alt: string };
  onBook: () => void;
  bookLabel: string;
  attractionIcons: [LucideIcon, LucideIcon, LucideIcon];
  transportIcon: LucideIcon;
  faqItems: Array<{ question: string; answer: string }>;
  ctaTestId: string;
  showActivitatum?: boolean;
  children?: ReactNode;
}

const WHY_IMG =
  "/images/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-amigos-snorkel.webp";
const COAST_IMG = "/images/mejores-calas-costa-brava-mingolla-brava-rent-a-boat.webp";
const POPULAR_BOATS = [
  "mingolla-brava-19",
  "trimarchi-57s",
  "pacific-craft-625",
  "excursion-privada",
];

/**
 * Shared body of the small-town landings (Tordera, Palafolls, Pineda de Mar): same
 * sections and i18n keys (`t.locationPages.<town>.sections`), only icons, hero photo
 * and the SEO head differ per page.
 */
export default function TownLanding({
  slug,
  s,
  render,
  heroTitle,
  heroImage,
  onBook,
  bookLabel,
  attractionIcons,
  transportIcon,
  faqItems,
  ctaTestId,
  showActivitatum,
}: TownLandingProps) {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const pop = t.popularBoatsSection?.pages as
    | Record<string, { title?: string; description?: string }>
    | undefined;
  const whyAlt =
    t.locationTemplate?.whyRentImgAlt ?? "Friends enjoying a boat day on the Costa Brava";
  const coastAlt =
    t.locationTemplate?.coastBreakImgAlt ??
    "Boat anchored in a crystal-clear cove along the Costa Brava coast";

  return (
    <>
      <LocationHero
        basePath={heroImage?.basePath}
        imageAlt={heroImage?.alt ?? s?.heroImageAlt ?? heroTitle}
        title={heroTitle}
        subtitle={s?.heroSubtitle}
        facts={[s?.heroBadgeCar, s?.heroBadgeTransport, s?.heroBadgeExtra]}
        bookLabel={bookLabel}
        onBook={onBook}
      />

      <Sheet tone="page" next="muted" labelledBy={`${slug}-why-title`}>
        <div className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-16">
          <Rise>
            <SectionTitle id={`${slug}-why-title`}>{s?.whyTitle}</SectionTitle>
            <FactPanel
              className="mt-8"
              items={[
                { title: s?.whyCard1Title, desc: s?.whyCard1Desc },
                { title: render(s?.whyCard2Title, ""), desc: render(s?.whyCard2Desc, "") },
                { title: s?.whyCard3Title, desc: s?.whyCard3Desc },
                { title: s?.whyCard4Title, desc: s?.whyCard4Desc },
              ]}
            />
          </Rise>
          <Rise delay={0.1}>
            <Photo src={WHY_IMG} alt={whyAlt} />
          </Rise>
        </div>
      </Sheet>

      <Sheet tone="muted" next="page" labelledBy={`${slug}-town-title`}>
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
          <Rise>
            <Photo src={COAST_IMG} alt={coastAlt} />
          </Rise>
          <Rise delay={0.1}>
            <SectionTitle id={`${slug}-town-title`}>{s?.townTitle}</SectionTitle>
            <Lead text={s?.townIntro} className="mt-5" />
            <FactPanel
              className="mt-8"
              items={[1, 2, 3].map(n => ({
                title: s?.[`townCard${n}Title`],
                desc: s?.[`townCard${n}Desc`],
                icon: attractionIcons[n - 1],
              }))}
            />
          </Rise>
        </div>
      </Sheet>

      <Sheet tone="page" next="muted" labelledBy={`${slug}-how-title`}>
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id={`${slug}-how-title`}>{s?.howTitle}</SectionTitle>
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={[
                { title: s?.howCarTitle, desc: s?.howCarDesc, icon: Car },
                { title: s?.howTaxiTitle, desc: s?.howTaxiDesc, icon: Users },
                { title: s?.howTransportTitle, desc: s?.howTransportDesc, icon: transportIcon },
                { title: s?.howParkingTitle, desc: s?.howParkingDesc, icon: ParkingCircle },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      <Sheet tone="muted" next="page" labelledBy={`${slug}-dests-title`}>
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id={`${slug}-dests-title`}>{s?.destsTitle}</SectionTitle>
            <Lead text={s?.destsIntro} className="mt-5" />
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={[
                { title: s?.destLloret, href: localizedPath("locationLloret") },
                { title: s?.destTossa, href: localizedPath("locationTossa") },
                { title: s?.destBlanes, href: localizedPath("locationBlanes") },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      <Sheet tone="page" next="navy" labelledBy={`${slug}-pricing-title`}>
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <SectionTitle id={`${slug}-pricing-title`}>{s?.pricingTitle}</SectionTitle>
            <Lead text={s?.pricingIntro} className="mt-5" />
            <InteractiveHoverButton
              tone="dark"
              as={Link}
              href={localizedPath("pricing")}
              className="mt-8 min-h-12 px-7 text-base"
            >
              {s?.pricingButton}
            </InteractiveHoverButton>
          </Rise>
          <Rise delay={0.1}>
            <FactPanel
              items={[
                {
                  title: s?.pricingNoLicTitle,
                  lines: [render(s?.pricingNoLicFrom, ""), s?.pricingNoLicCapacity],
                },
                {
                  title: s?.pricingLicTitle,
                  lines: [
                    render(s?.pricingLicFrom, ""),
                    s?.pricingLicEngines,
                    s?.pricingLicCapacity,
                  ],
                },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      <LocationCta
        title={s?.ctaTitle}
        desc={s?.ctaDesc}
        buttonLabel={s?.ctaButton}
        onClick={onBook}
        testId={ctaTestId}
        next="muted"
      />

      <SheetWrap next="page">
        <PopularBoatsSection
          bgClass={TONE_BG.muted}
          title={pop?.[slug]?.title ?? "Barcos populares para alquilar desde el Puerto de Blanes"}
          description={pop?.[slug]?.description}
          boatIds={POPULAR_BOATS}
        />
      </SheetWrap>

      <LocationFaq id={`${slug}-faq`} title={s?.faqTitle} items={faqItems} next="muted" />

      {showActivitatum && <ActivitatumTeaser topic="blanes" surface="city-landing" />}
      <RelatedLocationsSection currentLocation={slug} />
    </>
  );
}
