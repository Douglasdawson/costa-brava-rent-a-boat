import { useState } from "react";
import { Shield, Star, CheckCircle, Clock } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import BookingFormWidget from "./BookingFormWidget";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useTranslations } from "@/lib/translations";

export default function Hero() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const t = useTranslations();

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

      {/* Overlay - between image and content */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

      {/* Content - left aligned over dark overlay area */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {t.hero.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Button
                onClick={() => setIsBookingOpen(true)}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white shadow-2xl px-8 py-6 text-lg rounded-lg"
                data-testid="button-hero-cta"
              >
                <SiWhatsapp className="w-5 h-5 mr-2" />
                {t.hero.bookNow}
              </Button>
              <a href="#fleet">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/40 px-8 py-6 text-lg rounded-lg backdrop-blur-sm"
                >
                  {t.hero.viewFleet}
                </Button>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-white/90 text-xs sm:text-sm bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />
                <a
                  href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-white transition-colors"
                  data-testid="google-reviews-link"
                >
                  4.8/5 en Google
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a
                  href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-white transition-colors"
                  data-testid="satisfied-clients-link"
                >
                  +5000 clientes
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="font-medium">Asegurado</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="font-medium">+5 años exp.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="!max-w-4xl w-[95vw] max-h-[85vh] p-3 sm:p-4 md:p-6 !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 overflow-y-auto">
          <DialogHeader className="space-y-1 py-4 sm:py-3">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
              {t.booking.title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 text-center">
              {t.booking.modalSubtitle}
            </DialogDescription>
          </DialogHeader>
          <BookingFormWidget hideHeader={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
