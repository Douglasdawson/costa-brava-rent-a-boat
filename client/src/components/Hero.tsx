import { useState } from "react";
import { Shield, Star, CheckCircle, Clock } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import heroImage from "../assets/generated_images/Mediterranean_coastal_hero_scene_8df465c2.webp";
import BookingFormWidget from "./BookingFormWidget";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export default function Hero() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <div className="relative min-h-screen md:h-screen bg-cover bg-center bg-no-repeat" 
         id="home"
         style={{ backgroundImage: `url(${heroImage})` }}>
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="relative z-10 container mx-auto px-3 sm:px-4 pt-24 sm:pt-36 pb-8 sm:pb-12 min-h-screen md:h-screen flex flex-col justify-center items-center text-center">
        <div className="max-w-5xl mx-auto mb-6 sm:mb-8 w-full px-2 sm:px-4">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight px-2">
            Alquiler de Barcos en Blanes,<br className="lg:hidden" /> Costa Brava.
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-8 sm:mb-10 px-2 text-center">
            Descubre las mejores calas de la Costa Brava con nuestros barcos con y sin licencia.{' '}
            <span className="hidden md:inline"><br /></span>
            Salidas desde Puerto de Blanes.
          </p>
          
          {/* CTA Button */}
          <Button 
            onClick={() => setIsBookingOpen(true)}
            size="lg"
            className="text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-7 shadow-2xl hover:scale-105 transition-transform"
            data-testid="button-hero-cta"
          >
            <SiWhatsapp className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            Solicita ya tu petición de reserva
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 sm:mt-10 w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-2 justify-items-center items-center gap-3 sm:gap-x-6 sm:gap-y-4 text-white/90 text-xs sm:text-sm bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:justify-center">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current flex-shrink-0" />
              <a 
                href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-white transition-colors cursor-pointer"
                data-testid="google-reviews-link"
              >
                4.8/5 valoración media en Google
              </a>
            </div>
            <div className="flex items-center space-x-2 sm:justify-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <a 
                href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-white transition-colors cursor-pointer"
                data-testid="satisfied-clients-link"
              >
                +500 clientes satisfechos
              </a>
            </div>
            <div className="flex items-center space-x-2 sm:justify-center">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
              <span className="font-medium">Totalmente asegurado</span>
            </div>
            <div className="flex items-center space-x-2 sm:justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
              <span className="font-medium">5 años de experiencia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="!max-w-4xl w-[95vw] h-[95vh] max-h-[95vh] p-3 sm:p-4 md:p-6 !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center mb-2">
              ¡SOLICITA AQUÍ LA PETICIÓN DE TU BARCO!
            </DialogTitle>
            <p className="text-sm sm:text-base text-gray-600 text-center">
              Completa los datos para solicitar la reserva de tu barco perfecto
            </p>
          </DialogHeader>
          <BookingFormWidget />
        </DialogContent>
      </Dialog>
    </div>
  );
}
