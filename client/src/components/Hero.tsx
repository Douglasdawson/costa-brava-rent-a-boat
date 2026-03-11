import { Button } from "./ui/button";
import { ShieldCheck, Shield, CheckCircle, Award, Users, Star, ChevronDown } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import CurvedLoop from "./CurvedLoop";

export default function Hero() {
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();

  return (
    <div className="relative h-dvh min-h-[600px] overflow-hidden" id="home">
      {/* Background Image - Responsive <picture> */}
      <picture>
        <source
          media="(min-width: 768px)"
          srcSet="/images/hero/hero-dive-desktop.webp"
        />
        <img
          src="/images/hero/hero-dive-mobile.webp"
          alt="Barco de alquiler sin licencia navegando por aguas turquesa cerca de las calas de Blanes, Costa Brava"
          className="absolute inset-0 w-full h-full object-cover brightness-110 saturate-[1.05]"
          loading="eager"
          fetchPriority="high"
        />
      </picture>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/20 to-black/5" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col sm:justify-start sm:pt-36 lg:pt-40">
        <div className="px-4 sm:px-6 lg:px-16 xl:px-24 max-w-screen-2xl mx-auto w-full h-full sm:h-auto flex flex-col sm:block">
          <div className="text-center flex flex-col items-center">
            {/* H1 - top on mobile, flows naturally on desktop */}
            <div className="pt-32 sm:pt-0">
              <h1 className="font-heading font-bold text-white tracking-tight mb-4 sm:mb-6 leading-[1.08] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" style={{ fontSize: 'clamp(2.7rem, 8.4vw, 4.5rem)' }}>
                {t.hero.title}
              </h1>
            </div>

            {/* Subtitle - single line on mobile, full on desktop */}
            <p className="text-[0.925rem] sm:text-[1.3rem] lg:text-[1.575rem] text-white/85 font-medium mb-0 sm:mb-8 leading-relaxed max-w-2xl lg:max-w-4xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
              <span className="sm:hidden">Calas secretas de la Costa Brava.<br />Sin experiencia necesaria.</span>
              <span className="hidden sm:inline">{t.hero.subtitleLine1}<br />{t.hero.subtitleLine2}</span>
            </p>

            {/* Separator - desktop only */}
            <div className="hidden sm:block w-16 h-px bg-white/40 mb-5 lg:w-24" />


          </div>
        </div>
      </div>

      {/* CTA - fixed at bottom center of hero */}
      <div className="absolute bottom-14 sm:bottom-16 left-0 right-0 z-20 flex flex-row items-center justify-center gap-3">
        <Button
          onClick={() => openBookingModal()}
          size="lg"
          className="bg-cta hover:bg-cta/90 text-white px-8 py-3 text-base sm:px-10 sm:py-4 sm:text-lg rounded-full font-medium btn-elevated cta-pulse"
          data-testid="button-hero-cta"
        >
          {t.hero.bookNow}
        </Button>
        <Button
          size="lg"
          onClick={() => {
            const fleet = document.getElementById('fleet');
            if (fleet) fleet.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="bg-[#A8C4DD] hover:bg-[#A8C4DD]/85 text-white px-6 py-3 text-base lg:px-10 lg:py-4 lg:text-lg rounded-full font-medium btn-elevated"
          data-testid="button-hero-explore"
        >
          {t.hero.viewFleet}
        </Button>
      </div>

      {/* Trust badges strip — full width at bottom */}
      <div className="hidden sm:block absolute bottom-0 left-0 right-0 z-20 bg-foreground/90 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-6 lg:gap-8 px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-white text-xs sm:text-sm font-medium">
            <Award className="w-3.5 h-3.5 flex-shrink-0" />
            {t.authority?.yearsExperience || '6+ anos de experiencia'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-white text-xs sm:text-sm font-medium">
            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
            {t.authority?.fullInsurance || 'Seguro a todo riesgo'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-white text-xs sm:text-sm font-medium">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            {t.authority?.happyCustomers || '5000+ clientes satisfechos'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-white text-xs sm:text-sm font-medium">
            <Star className="w-3.5 h-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />
            {t.hero.googleRating}
          </span>
        </div>
      </div>

      {/* Scroll indicator — animated chevron between CTAs and trust strip (desktop only) */}
      <div className="hidden sm:flex absolute bottom-[46px] left-0 right-0 z-20 justify-center pointer-events-none">
        <button
          onClick={() => {
            const fleet = document.getElementById('fleet');
            if (fleet) fleet.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="pointer-events-auto animate-bounce text-white/60 hover:text-white transition-colors"
          aria-label="Scroll down"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Curved loop marquee — overlaid at bottom of hero */}
      <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden opacity-50 sm:hidden">
        <CurvedLoop
          marqueeText="Alquiler de Barcos ✦ Con Licencia y sin Licencia ✦ En la Costa Brava ✦ Blanes ✦ Desde 70€ ✦ 4.8 Google ✦ Más de 2000 Clientes ✦ Desde 2020 ✦ "
          speed={1.5}
          curveAmount={60}
          direction="left"
          className="fill-white text-[3rem] lg:text-[3rem] font-display tracking-wider lg:lowercase"
        />
      </div>
    </div>
  );
}
