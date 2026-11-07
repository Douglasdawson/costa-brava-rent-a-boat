import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Award, BadgeCheck, Star } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { useBusinessStats } from "@/hooks/useBusinessStats";
import { eraCopy, isLicenseFreeEraActive } from "@shared/constants";

import BoatQuizModal from "./BoatQuizModal";
import { GBP_PROFILE_URL } from "@shared/businessProfile";

export default function Hero() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const { openBookingModal } = useBookingModal();
  const { data: businessStats } = useBusinessStats();
  const [quizOpen, setQuizOpen] = useState(false);
  const authority = t.authority!;
  const ratingDisplay = businessStats
    ? `${businessStats.rating.toFixed(1)}/5 · ${businessStats.userRatingCount}+ ${t.hero.reviewsLabel}`
    : t.hero.googleRating;
  // RD 1188/2025: the license-free escape hatch retires itself on 2026-10-01.
  const licenseFreeEra = isLicenseFreeEraActive();

  // Listen for exit intent quiz trigger
  useEffect(() => {
    const handleOpenQuiz = () => setQuizOpen(true);
    window.addEventListener("cbrb:openQuiz", handleOpenQuiz);
    return () => window.removeEventListener("cbrb:openQuiz", handleOpenQuiz);
  }, []);

  return (
    <div className="bg-background">
      <div className="relative h-dvh min-h-[600px] overflow-hidden rounded-b-2xl" id="home">
        {/* Background Image - Responsive <picture> */}
        <picture>
          <source
            media="(min-width: 768px)"
            type="image/avif"
            srcSet="/images/hero/hero-dive-desktop.avif"
          />
          <source
            media="(max-width: 767px)"
            type="image/avif"
            srcSet="/images/hero/hero-dive-mobile.avif"
          />
          <source
            media="(min-width: 768px)"
            type="image/webp"
            srcSet="/images/hero/hero-dive-desktop.webp"
          />
          <source
            media="(max-width: 767px)"
            type="image/webp"
            srcSet="/images/hero/hero-dive-mobile.webp"
          />
          <img
            src="/images/hero/hero-dive-mobile.webp"
            alt={t.hero.imageAlt}
            className="absolute inset-0 w-full h-full object-cover saturate-[1.05]"
            width={1920}
            height={1080}
            sizes="100vw"
            loading="eager"
            {...({ fetchpriority: "high" } as React.ImgHTMLAttributes<HTMLImageElement>)}
          />
        </picture>

        {/* Overlay — lighter center on mobile/tablet to show image, stronger on desktop where text covers center */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_22%_30%,rgba(8,22,42,0.38),transparent_70%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/60 via-black/30 to-transparent hidden lg:block"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/65 lg:from-black/30 lg:via-black/15 lg:to-black/55" />

        {/* Content — justify-between pushes CTAs to bottom, content centers in remaining space */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          {/* Top: centered content block.
            pb leaves enough breathing room above the absolute trust strip:
              - Mobile: strip is ~60px (2-col grid, 4 items). pb-24 (96px)
                gives ~36px of air between the last CTA and the strip.
              - Desktop: strip is ~52px (single row). pb-20 (80px) gives
                ~28px of air. Both follow the 8pt spacing scale. */}
          <div className="flex-1 flex flex-col justify-between lg:gap-8 pt-24 lg:pt-[clamp(9rem,18vh,13rem)] pb-24 lg:pb-20 px-4 sm:px-8 lg:px-16 xl:px-24 max-w-screen-2xl mx-auto w-full">
            {/* Text group — top on mobile, centered with CTAs on tablet+ */}
            <div className="text-left lg:text-center flex flex-col items-start lg:items-center">
              <h1
                className="font-heading font-semibold text-primary-foreground tracking-[-0.02em] mb-4 sm:mb-5 leading-[1.06] text-left lg:text-center text-balance animate-in slide-in-from-bottom-3 duration-700 motion-reduce:animate-none sm:max-w-3xl lg:max-w-5xl [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_4px_24px_rgba(0,0,0,0.4)] hyphens-manual break-words"
                style={{ fontSize: "clamp(2rem, 4.4vw + 0.5rem, 3.25rem)" }}
              >
                {t.hero.title}
              </h1>

              {t.hero.summaryGeo && (
                <p className="sr-only" data-testid="hero-summary-geo">
                  {eraCopy(t.hero.summaryGeo, t.hero.summaryGeoPostEra ?? t.hero.summaryGeo)}
                </p>
              )}

              <p
                data-speakable
                className="text-[0.95rem] sm:text-[clamp(0.95rem,2.1vw,1.25rem)] text-primary-foreground/95 font-medium leading-relaxed sm:leading-snug text-pretty max-w-[21rem] text-left lg:text-center sm:max-w-none sm:whitespace-nowrap drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]"
              >
                <span className="hidden sm:inline">{t.hero.subtitleLine1}</span>
                <span className="sm:hidden">{t.hero.subtitleLine1}</span>
              </p>
            </div>

            {/* CTA group — bottom on mobile, flows after text on tablet+ */}
            <div className="text-left lg:text-center flex flex-col items-start lg:items-center w-full">
              {/* Specs as one typographic line with hairline dividers: no pills, no boxes */}
              <ul
                className="mb-5 lg:mb-6 hidden sm:flex items-center justify-start lg:justify-center divide-x divide-white/40 text-sm lg:text-base font-medium tracking-[0.01em] text-primary-foreground drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
                data-speakable
                aria-label={t.hero.specsLine}
              >
                {t.hero.specsLine.split(/\s·\s/).map(spec => (
                  <li key={spec} className="whitespace-nowrap px-4 lg:px-5 first:pl-0 last:pr-0">
                    {spec}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start lg:justify-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => openBookingModal()}
                  size="lg"
                  className="bg-cta hover:bg-cta/90 text-primary-foreground px-8 py-2.5 text-sm sm:px-10 sm:py-3.5 sm:text-base lg:text-lg rounded-full font-semibold sm:font-medium btn-elevated cta-pulse w-full sm:w-auto"
                  data-testid="button-hero-cta"
                >
                  {t.hero.findYourBoat}
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 border-2 border-white/70 text-white px-6 py-2.5 text-sm sm:py-3.5 sm:text-base lg:px-10 lg:py-3.5 lg:text-lg rounded-full font-medium w-full sm:w-auto"
                  data-testid="button-hero-titulin"
                >
                  <a href={localizedPath("navigationLicense")}>{t.hero.ctaTitulin}</a>
                </Button>
              </div>

              <p className="mt-4 lg:mt-3 self-center text-center max-w-md sm:max-w-none text-xs sm:text-sm leading-snug text-primary-foreground/90 text-balance sm:whitespace-nowrap drop-shadow-[0_1px_5px_rgba(0,0,0,0.7)]">
                {t.hero.licenseNote}
              </p>

              {/* License-free escape hatch — self-retires on 2026-10-01 (RD 1188/2025) */}
              {licenseFreeEra && (
                <p className="mt-3 text-xs sm:text-sm text-primary-foreground/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)] max-w-md">
                  {t.hero.licenseFreeUntil}{" "}
                  <a
                    href={localizedPath("categoryLicenseFree")}
                    className="underline underline-offset-2 font-medium hover:text-primary-foreground"
                    data-testid="link-hero-license-free"
                  >
                    {t.hero.licenseFreeUntilCta}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Trust badges strip — mobile: 2x2 grid with hairline dividers, 13px text, safe-area aware */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-foreground/90 dark:bg-cta/90 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)]">
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center sm:gap-6 lg:gap-8 sm:px-4 sm:py-3 text-primary-foreground dark:text-foreground text-xs sm:text-sm font-medium [&>*]:min-h-10 sm:[&>*]:min-h-0 [&>*]:justify-center [&>*]:px-2 sm:[&>*]:whitespace-nowrap [&>*]:text-center [&>*]:leading-tight max-sm:[&>*]:border-white/15">
            <span className="inline-flex items-center gap-1.5 max-sm:order-1 max-sm:border-b max-sm:border-r">
              <Award className="w-3.5 h-3.5 flex-shrink-0 opacity-80" aria-hidden="true" />
              {authority.yearsExperience}
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap max-sm:order-3 max-sm:col-span-2">
              <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0 opacity-80" aria-hidden="true" />
              {authority.foreignLicenseVerified}
            </span>
            <a
              href={GBP_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline underline-offset-2 max-sm:order-2 max-sm:border-b"
            >
              <Star
                className="w-3.5 h-3.5 flex-shrink-0 fill-amber-400 text-amber-400"
                aria-hidden="true"
              />
              {ratingDisplay}
            </a>
          </div>
        </div>

        <BoatQuizModal
          open={quizOpen}
          onOpenChange={setQuizOpen}
          onBoatSelect={boatId => {
            setQuizOpen(false);
            openBookingModal(boatId);
          }}
        />
      </div>
    </div>
  );
}
