import { useState } from "react";
import { Button } from "./ui/button";
import { ShieldCheck, Shield, CheckCircle, Award, Users, Star } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { useProgressiveImage } from "@/hooks/use-progressive-image";
import { trackWhatsAppClick } from "@/utils/analytics";
import CurvedLoop from "./CurvedLoop";
import BoatQuizModal from "./BoatQuizModal";

export default function Hero() {
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const [quizOpen, setQuizOpen] = useState(false);
  const heroLoaded = useProgressiveImage("/images/hero/hero-dive-mobile.webp");

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
          className={`absolute inset-0 w-full h-full object-cover brightness-110 saturate-[1.05] transition-opacity duration-500 ${
            heroLoaded ? "opacity-100" : "opacity-0"
          }`}
          width={1920}
          height={1080}
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

            {/* Price callout */}
            <p className="font-medium text-white/90 text-sm sm:text-base lg:text-lg mb-0 sm:mb-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
              Desde 70€/h &middot; Gasolina incluida
            </p>

          </div>
        </div>
      </div>

      {/* CTA - fixed at bottom center of hero */}
      <div className="absolute bottom-14 sm:bottom-16 left-0 right-0 z-20 flex flex-col items-center gap-2.5">
        <div className="flex flex-row items-center justify-center gap-3">
          <Button
            onClick={() => setQuizOpen(true)}
            size="lg"
            className="bg-cta hover:bg-cta/90 text-white px-8 py-3 text-base sm:px-10 sm:py-4 sm:text-lg rounded-full font-medium btn-elevated cta-pulse"
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
            className="bg-[#A8C4DD] hover:bg-[#93b5d2] text-[hsl(215_45%_20%)] px-6 py-3 text-base lg:px-10 lg:py-4 lg:text-lg rounded-full font-medium btn-elevated"
            data-testid="button-hero-explore"
          >
            {t.hero.viewFleet}
          </Button>
        </div>
        <a
          href="https://wa.me/34611500372"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick("hero")}
          className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors drop-shadow-md"
          data-testid="button-hero-whatsapp"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Preguntanos por WhatsApp
        </a>
      </div>

      {/* Trust badges strip — full width at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-foreground/90 dark:bg-cta/90 backdrop-blur-sm min-h-[40px]">
        <div className="flex items-center justify-center gap-3 sm:gap-6 lg:gap-8 px-3 sm:px-4 py-2.5 sm:py-3 overflow-x-auto scrollbar-hide">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 text-white dark:text-foreground text-[11px] sm:text-sm font-medium whitespace-nowrap">
            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden="true" />
            {t.authority?.yearsExperience || '6+ anos de experiencia'}
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 text-white dark:text-foreground text-[11px] sm:text-sm font-medium whitespace-nowrap">
            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden="true" />
            {t.authority?.fullInsurance || 'Seguro a todo riesgo'}
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 text-white dark:text-foreground text-[11px] sm:text-sm font-medium whitespace-nowrap">
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden="true" />
            {t.authority?.happyCustomers || '5000+ clientes satisfechos'}
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 text-white dark:text-foreground text-[11px] sm:text-sm font-medium whitespace-nowrap">
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
