import { Button } from "./ui/button";
import { ShieldCheck, Shield, CheckCircle, Award, Users, Star } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/useBookingModal";
import CurvedLoop from "./CurvedLoop";

export default function Hero() {
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();

  return (
    <div className="relative h-dvh min-h-[600px] max-h-[900px] overflow-hidden" id="home">
      {/* Background Image - Responsive <picture> */}
      <picture>
        <source
          media="(min-width: 1024px)"
          srcSet="/images/hero/hero-dive-desktop.webp"
        />
        <source
          media="(min-width: 768px)"
          srcSet="/images/hero/hero-dive-tablet.webp"
        />
        <img
          src="/images/hero/hero-dive-mobile.webp"
          alt="Costa Brava Rent a Boat - Alquiler de barcos en Blanes con vistas al Mediterráneo"
          className="absolute inset-0 w-full h-full object-cover brightness-110 saturate-[1.05]"
          loading="eager"
          fetchPriority="high"
        />
      </picture>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/20 to-black/5" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col sm:justify-start sm:pt-28 lg:pt-32">
        <div className="px-4 sm:px-6 lg:px-16 xl:px-24 max-w-screen-2xl mx-auto w-full h-full sm:h-auto flex flex-col sm:block">
          <div className="text-center flex flex-col items-center">
            {/* H1 - top on mobile, flows naturally on desktop */}
            <div className="pt-20 sm:pt-0">
              <h1 className="font-heading font-bold text-white tracking-tight mb-4 sm:mb-6 leading-[1.08] uppercase" style={{ fontSize: 'clamp(2.25rem, 7vw, 4.5rem)' }}>
                <span className="inline sm:block">Alquiler de Barcos en</span>{' '}
                <span className="inline sm:block">Blanes, <span className="text-[hsl(215,45%,20%)]">Costa Brava</span></span>
              </h1>
            </div>

            {/* Subtitle - single line on mobile, full on desktop */}
            <p className="text-sm sm:text-xl lg:text-2xl text-white/85 font-light mb-0 sm:mb-8 leading-relaxed max-w-xl lg:max-w-2xl">
              <span className="sm:hidden">Desde 70€ · Gasolina incluida</span>
              <span className="hidden sm:inline">{t.hero.subtitleLine1}<br />{t.hero.subtitleLine2}</span>
            </p>

            {/* Separator - desktop only */}
            <div className="hidden sm:block w-16 h-px bg-white/40 mb-5 lg:w-24" />

            {/* Price badges - desktop/tablet only */}
            <div className="hidden sm:flex items-center gap-2 xs:gap-3 mb-8">
              <span className="w-36 xs:w-44 py-2 rounded-full bg-[#A8C4DD]/50 backdrop-blur-sm border border-white/25 text-white text-xs xs:text-sm font-medium tracking-wide text-center">
                Desde 70€
              </span>
              <span className="w-36 xs:w-44 py-2 rounded-full bg-[#A8C4DD]/50 backdrop-blur-sm border border-white/25 text-white text-xs xs:text-sm font-medium tracking-wide text-center">
                Gasolina incluida
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* CTA - fixed at bottom center of hero */}
      <div className="absolute bottom-14 sm:bottom-16 left-0 right-0 z-20 flex flex-col items-center gap-3">
        <Button
          onClick={() => openBookingModal()}
          size="lg"
          className="bg-cta hover:bg-cta/90 text-white px-8 py-3 text-base sm:px-10 sm:py-4 sm:text-lg rounded-full font-medium btn-elevated cta-pulse"
          data-testid="button-hero-cta"
        >
          {t.hero.bookNow}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const fleet = document.getElementById('fleet');
            if (fleet) fleet.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="hidden sm:inline-flex bg-transparent border-white/60 text-white hover:bg-white/10 hover:text-white rounded-full px-6 py-2 text-sm font-medium"
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
