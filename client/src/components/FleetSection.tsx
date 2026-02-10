import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BoatCard from "./BoatCard";
import BookingFormWidget from "./BookingFormWidget";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useLocation } from "wouter";
import { getBoatImage } from "@/utils/boatImages";
import { useTranslations } from "@/lib/translations";
import type { Boat } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SiWhatsapp } from "react-icons/si";
import { Phone } from "lucide-react";

export default function FleetSection() {
  const t = useTranslations();
  const [, setLocation] = useLocation();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBoatId, setSelectedBoatId] = useState<string | undefined>(undefined);

  // Fetch boats from API
  const { data: boatsData, isLoading } = useQuery<Boat[]>({
    queryKey: ['/api/boats'],
  });

  // Default ratings for boats (can be moved to DB in future)
  const defaultRatings: Record<string, number> = {
    "astec-400": 4.7,
    "remus-450": 4.7,
    "solar-450": 4.6,
    "astec-450": 4.8,
    "pacific-craft-625": 4.9,
    "trimarchi-57s": 4.9,
    "mingolla-brava-19": 4.8
  };

  // Transform API data to BoatCard format
  const boats = (boatsData || [])
    .filter(boat => boat.isActive)
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
    .map(boat => {
      // Base price from BAJA season
      const basePrice = boat.pricing?.BAJA?.prices 
        ? Math.min(...Object.values(boat.pricing.BAJA.prices))
        : 0;

      // Extract engine power from specifications
      const enginePower = boat.specifications?.engine || '';

      return {
        id: boat.id,
        name: boat.name,
        image: boat.imageUrl ? getBoatImage(boat.imageUrl) : '/placeholder-boat.jpg',
        imageAlt: `Alquiler barco ${boat.name} ${boat.requiresLicense ? "con licencia" : "sin licencia"} en Blanes Costa Brava 2026 - Capacidad ${boat.capacity} personas`,
        capacity: boat.capacity,
        requiresLicense: boat.requiresLicense,
        description: boat.description 
          ? (boat.description.length > 150 ? boat.description.substring(0, 150) + "..." : boat.description)
          : '',
        basePrice,
        rating: defaultRatings[boat.id] || 4.5,
        features: boat.equipment || [],
        available: true,
        enginePower: enginePower
      };
    });

  const handleBooking = (boatId: string) => {
    setSelectedBoatId(boatId);
    setIsBookingModalOpen(true);
  };

  const handleDetails = (boatId: string) => {
    // Navigate to boat detail page - works for all boats from API
    setLocation(`/barco/${boatId}`);
    // Scroll to top when navigating to boat details
    window.scrollTo(0, 0);
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gray-50" id="fleet">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4 px-2">
            {t.fleet.title}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl sm:max-w-2xl lg:max-w-4xl mx-auto px-2 sm:px-4">
            {t.fleet.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="bg-gray-200 h-48 rounded mb-4"></div>
                <div className="bg-gray-200 h-6 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded mb-4"></div>
                <div className="bg-gray-200 h-10 rounded"></div>
              </div>
            ))
          ) : (
            boats.map((boat) => (
              <BoatCard
                key={boat.id}
                {...boat}
                onBooking={handleBooking}
                onDetails={handleDetails}
              />
            ))
          )}
        </div>

        <div className="text-center px-2 sm:px-4">
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-3 sm:mb-4 lg:mb-6">{t.fleet.helpText}</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-center max-w-sm sm:max-w-lg mx-auto">
            <button 
              className="bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 rounded-lg font-medium flex items-center justify-center transition-colors text-xs sm:text-sm lg:text-base"
              onClick={() => openWhatsApp("Hola! Necesito ayuda para elegir el mejor barco para alquilar en Blanes. ¿Podrían asesorarme sobre precios y disponibilidad?")}
              data-testid="button-whatsapp-help"
              aria-label="Consultar por WhatsApp para elegir barco"
            >
              <SiWhatsapp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="ml-1 sm:ml-2">{t.contact.whatsapp}</span>
            </button>
            <button 
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 rounded-lg font-medium flex items-center justify-center transition-colors text-xs sm:text-sm lg:text-base"
              data-testid="button-call-help"
              aria-label="Llamar para ayuda en la elección de barco"
              onClick={() => window.open("tel:+34611500372", "_self")}
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="ml-1">{t.fleet.callButton}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="!max-w-4xl w-[95vw] max-h-[85vh] p-3 sm:p-4 md:p-6 !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 overflow-y-auto">
          <DialogHeader className="space-y-1 py-4 sm:py-3">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
              {t.booking.title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 text-center">
              {t.booking.modalSubtitle}
            </DialogDescription>
          </DialogHeader>
          <BookingFormWidget preSelectedBoatId={selectedBoatId} hideHeader={true} />
        </DialogContent>
      </Dialog>
    </section>
  );
}