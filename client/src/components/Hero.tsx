import { Button } from "./ui/button";
import { ShieldCheck, Shield, CheckCircle } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/useBookingModal";
import CurvedLoop from "./CurvedLoop";

export default function Hero() {
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();

  return (
    <div className="relative h-dvh min-h-[600px] max-h-[1000px]" id="home">
      {/* Background Image - Responsive <picture> */}
      <picture>
        <source
          media="(min-width: 1024px)"
          srcSet="/images/hero/hero-lloret-desktop.webp"
        />
        <source
          media="(min-width: 768px)"
          srcSet="/images/hero/hero-lloret-tablet.webp"
        />
        <img
          src="/images/hero/hero-lloret-mobile.webp"
          alt="Costa Brava Rent a Boat - Alquiler de barcos en Blanes con vistas al Mediterráneo"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      </picture>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/10" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        <div className="px-4 sm:px-6 lg:px-12">
          <div className="text-center flex flex-col items-center">
            <h1 className="font-heading font-bold text-white tracking-tight mb-6 leading-[1.15]" style={{ fontSize: 'clamp(1.5rem, 5.5vw, 3.5rem)' }}>
              Alquiler de Barcos en Blanes,<br />
              Costa Brava
            </h1>
            <div className="w-16 h-px bg-white/40 mb-5" />
            <p className="text-xl sm:text-2xl lg:text-3xl text-white font-medium mb-8 leading-relaxed tracking-wide">
              {t.hero.subtitle.split('. ').map((sentence, i, arr) => (
                <span key={i} className="block">{sentence}{i < arr.length - 1 ? '.' : ''}</span>
              ))}
            </p>

            {/* Price badges */}
            <div className="flex items-center gap-2 xs:gap-3 mb-6">
              <span className="w-36 xs:w-44 py-2 rounded-full bg-[#A8C4DD]/50 backdrop-blur-sm border border-white/25 text-white text-xs xs:text-sm font-medium tracking-wide text-center">
                Desde 70€
              </span>
              <span className="w-36 xs:w-44 py-2 rounded-full bg-[#A8C4DD]/50 backdrop-blur-sm border border-white/25 text-white text-xs xs:text-sm font-medium tracking-wide text-center">
                Gasolina incluida
              </span>
            </div>

            {/* CTA */}
            <div>
              <Button
                onClick={() => openBookingModal()}
                size="lg"
                className="bg-cta hover:bg-cta/90 text-white px-10 py-4 text-lg rounded-full font-medium btn-elevated cta-pulse"
                data-testid="button-hero-cta"
              >
                {t.hero.bookNow}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs sm:text-sm px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.hero.freeCancellation}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs sm:text-sm px-3 py-1.5 rounded-full">
                <Shield className="w-3.5 h-3.5" />
                {t.hero.insured}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs sm:text-sm px-3 py-1.5 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                {t.hero.instantConfirmation}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Curved loop marquee — overlaid at bottom of hero */}
      <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden opacity-50">
        <CurvedLoop
          marqueeText="Alquiler de Barcos ✦ Con Licencia y sin Licencia ✦ En la Costa Brava ✦ Blanes ✦ Desde 70€ ✦ 4.8 Google ✦ Más de 2000 Clientes ✦ Desde 2020 ✦ "
          speed={1.5}
          curveAmount={60}
          direction="left"
          className="fill-white text-[2rem] font-display tracking-wider"
        />
      </div>
    </div>
  );
}
