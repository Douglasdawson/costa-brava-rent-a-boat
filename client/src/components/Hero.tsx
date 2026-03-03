import { Button } from "./ui/button";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/useBookingModal";

export default function Hero() {
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();

  return (
    <div className="relative h-screen min-h-[600px] max-h-[900px]" id="home">
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

      {/* Overlay - lighter editorial gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/10" />

      {/* Content - centered */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white tracking-tight mb-6 leading-tight">
              {t.hero.title}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 font-light mb-8 leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* Price as discrete text */}
            <p className="text-white/80 text-base font-light mb-6">
              Desde 70€ · Gasolina incluida
            </p>

            {/* Single CTA */}
            <div className="mb-10">
              <Button
                onClick={() => openBookingModal()}
                size="lg"
                className="bg-cta hover:bg-cta/90 text-white px-10 py-4 text-lg rounded-full shadow-lg font-medium"
                data-testid="button-hero-cta"
              >
                {t.hero.bookNow}
              </Button>
            </div>

            {/* Minimal trust line */}
            <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-6 text-white/80 text-sm font-light">
              <a
                href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t.hero.googleRating} (abre en Google Maps, nueva pestaña)`}
                className="hover:text-white/80 transition-colors"
                data-testid="google-reviews-link"
              >
                4.8 Google
              </a>
              <span className="text-white/30">|</span>
              <a
                href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t.hero.clients} (abre en Google Maps, nueva pestaña)`}
                className="hover:text-white/80 transition-colors"
                data-testid="satisfied-clients-link"
              >
                +2000 clientes
              </a>
              <span className="text-white/30">|</span>
              <span>100% asegurado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
