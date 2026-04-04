import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Shield, Award, Users, Star } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { useProgressiveImage } from "@/hooks/use-progressive-image";

import CurvedLoop from "./CurvedLoop";
import BoatQuizModal from "./BoatQuizModal";

export default function Hero() {
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const [quizOpen, setQuizOpen] = useState(false);
  const heroLoaded = useProgressiveImage("/images/hero/hero-dive-mobile.webp");

  // Listen for exit intent quiz trigger
  useEffect(() => {
    const handleOpenQuiz = () => setQuizOpen(true);
    window.addEventListener("cbrb:openQuiz", handleOpenQuiz);
    return () => window.removeEventListener("cbrb:openQuiz", handleOpenQuiz);
  }, []);

  return (
    <div className="relative h-dvh min-h-[600px] overflow-hidden" id="home">
      {/* Placeholder background until hero image loads */}
      <div
        className={`absolute inset-0 bg-muted transition-opacity duration-500 ${
          heroLoaded ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Background Image - Responsive <picture> */}
      <picture>
        <source
          media="(min-width: 768px)"
          type="image/avif"
          srcSet="/images/hero/hero-dive-desktop.avif"
        />
        <source
          type="image/avif"
          srcSet="/images/hero/hero-dive-mobile.avif"
        />
        <source
          media="(min-width: 768px)"
          srcSet="/images/hero/hero-dive-desktop.webp"
        />
        <img
          src="/images/hero/hero-dive-mobile.webp"
          alt="Barco de alquiler sin licencia navegando por aguas turquesa cerca de las calas de Blanes, Costa Brava"
          className={`absolute inset-0 w-full h-full object-cover saturate-[1.05] transition-opacity duration-500 ${
            heroLoaded ? "opacity-100" : "opacity-0"
          }`}
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
        />
      </picture>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/50" />

      {/* Content — justify-between pushes CTAs to bottom, content centers in remaining space */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Top: centered content block */}
        <div className="flex-1 flex flex-col justify-between lg:justify-center pt-24 lg:pt-24 pb-[70px] lg:pb-[52px] px-4 sm:px-6 lg:px-16 xl:px-24 max-w-screen-2xl mx-auto w-full">
          {/* Text group — top on mobile, centered with CTAs on tablet+ */}
          <div className="text-center flex flex-col items-center">
            <h1 className="font-heading font-bold text-white tracking-tight mb-2 sm:mb-6 leading-[1.08] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" style={{ fontSize: 'clamp(1.75rem, 5.5vw, 3.5rem)' }}>
              {t.hero.title}
            </h1>

            <p className="text-[0.875rem] sm:text-[1.15rem] lg:text-[1.575rem] text-white/85 font-medium mb-2 sm:mb-6 leading-snug sm:leading-relaxed sm:max-w-[720px] lg:max-w-3xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
              <span className="hidden sm:inline">{t.hero.subtitleLine1}<br />{t.hero.subtitleLine2}</span>
              <span className="sm:hidden">{t.hero.subtitleMobile || t.hero.subtitleLine1}</span>
            </p>

            {/* Price callout — visible on lg+ (desktop), hidden on mobile/tablet (shown near CTAs instead) */}
            <div className="hidden lg:block mb-4 lg:mb-8 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
              <p className="font-semibold text-white text-sm sm:text-lg lg:text-xl">
                {t.hero.pricePerPerson} &middot; {t.hero.fuelBadge}
              </p>
              <p className="text-white/85 text-xs sm:text-sm mt-0.5">
                {t.hero.pricePerPersonDetail}
              </p>
            </div>
          </div>

          {/* CTA group — bottom on mobile, flows after text on tablet+ */}
          <div className="text-center flex flex-col items-center">
            {/* Price callout — mobile + tablet, near CTAs */}
            <div className="lg:hidden mb-3 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
              <p className="font-semibold text-white text-sm">
                {t.hero.pricePerPerson} &middot; {t.hero.fuelBadge}
              </p>
              <p className="text-white/85 text-xs mt-0.5">
                {t.hero.pricePerPersonDetail}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full px-2 sm:px-0 sm:w-auto">
              <Button
                onClick={() => setQuizOpen(true)}
                size="lg"
                className="bg-cta hover:bg-cta/90 text-white px-8 py-2.5 text-sm sm:px-10 sm:py-3.5 sm:text-base lg:text-lg rounded-full font-semibold sm:font-medium btn-elevated cta-pulse w-full sm:w-auto"
                data-testid="button-hero-cta"
              >
                {t.hero.findYourBoat}
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  const fleet = document.getElementById('fleet');
                  if (fleet) fleet.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="bg-[#A8C4DD] hover:bg-[#93b5d2] text-[hsl(215_45%_20%)] px-6 py-2.5 text-sm sm:py-3.5 sm:text-base lg:px-10 lg:py-3.5 lg:text-lg rounded-full font-medium btn-elevated w-full sm:w-auto"
                data-testid="button-hero-explore"
              >
                {t.hero.viewFleet}
              </Button>
            </div>
            <p className="text-white/80 text-xs sm:text-sm mt-1.5 sm:mt-3">
              {t.hero.freeCancellation}
            </p>
          </div>
        </div>
      </div>

      {/* Trust badges strip — full width at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-foreground/90 dark:bg-cta/90 backdrop-blur-sm min-h-[40px]">
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-x-3 gap-y-1.5 sm:gap-6 lg:gap-8 px-3 sm:px-4 py-2 sm:py-3">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 text-white dark:text-foreground text-xs sm:text-sm font-medium whitespace-nowrap">
            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden="true" />
            {t.authority?.yearsExperience || '6+ años de experiencia'}
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 text-white dark:text-foreground text-xs sm:text-sm font-medium whitespace-nowrap">
            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden="true" />
            {t.authority?.fullInsurance || 'Seguro a todo riesgo'}
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 text-white dark:text-foreground text-xs sm:text-sm font-medium whitespace-nowrap">
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden="true" />
            {t.authority?.happyCustomers || '5000+ clientes satisfechos'}
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 text-white dark:text-foreground text-xs sm:text-sm font-medium whitespace-nowrap">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
            {t.hero.googleRating}
          </span>
        </div>
      </div>


      {/* Curved loop marquee — above the trust badges strip */}
      <div className="absolute bottom-[40px] left-0 right-0 z-10 overflow-hidden opacity-30 sm:hidden pointer-events-none">
        <CurvedLoop
          marqueeText={t.hero.marqueeText}
          speed={1.5}
          curveAmount={60}
          direction="left"
          className="fill-white text-[2rem] font-display tracking-wider"
        />
      </div>

      <BoatQuizModal
        open={quizOpen}
        onOpenChange={setQuizOpen}
        onBoatSelect={(boatId) => {
          setQuizOpen(false);
          openBookingModal(boatId);
        }}
      />
    </div>
  );
}
