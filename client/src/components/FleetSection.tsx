import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import BoatCard from "./BoatCard";
import { openWhatsApp } from "@/utils/whatsapp";
import { useLocation } from "wouter";
import { getBoatImage, getBoatImageSrcSet } from "@/utils/boatImages";
import { useTranslations } from "@/lib/translations";
import type { Boat } from "@shared/schema";
import { SiWhatsapp } from "react-icons/si";
import { Phone } from "lucide-react";
import { useBookingModal } from "@/hooks/useBookingModal";

export default function FleetSection() {
  const t = useTranslations();
  const [, setLocation] = useLocation();
  const { openBookingModal } = useBookingModal();
  const { ref: revealRef, isVisible } = useScrollReveal();

  // Fetch boats from API
  const { data: boatsData, isLoading } = useQuery<Boat[]>({
    queryKey: ['/api/boats'],
  });

  // Determine the most popular boat: the first active boat by display order
  const popularBoatId = useMemo(() => {
    const sorted = (boatsData || [])
      .filter(boat => boat.isActive)
      .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    return sorted[0]?.id ?? null;
  }, [boatsData]);

  // Transform API data to BoatCard format — memoized to avoid recalculation on every render
  const boats = useMemo(() => (boatsData || [])
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
        imageSrcSet: boat.imageUrl ? getBoatImageSrcSet(boat.imageUrl) : '',
        imageAlt: `Alquiler barco ${boat.name} ${boat.requiresLicense ? "con licencia" : "sin licencia"} en Blanes Costa Brava 2026 - Capacidad ${boat.capacity} personas`,
        capacity: boat.capacity,
        requiresLicense: boat.requiresLicense,
        description: boat.description
          ? (boat.description.length > 150 ? boat.description.substring(0, 150) + "..." : boat.description)
          : '',
        basePrice,

        features: boat.equipment || [],
        available: true,
        enginePower: enginePower
      };
    }), [boatsData]);

  const handleBooking = (boatId: string) => {
    openBookingModal(boatId);
  };

  const handleDetails = (boatId: string) => {
    // Navigate to boat detail page - works for all boats from API
    setLocation(`/barco/${boatId}`);
    // Scroll to top when navigating to boat details
    window.scrollTo(0, 0);
  };

  return (
    <section ref={revealRef} className={`py-16 sm:py-24 lg:py-32 bg-white transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} id="fleet">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-light text-foreground tracking-tight mb-2 sm:mb-3 lg:mb-4 px-2">
            {t.fleet.title}
          </h2>
          <p className="text-base text-muted-foreground font-light mt-3 max-w-xl sm:max-w-2xl lg:max-w-4xl mx-auto px-2 sm:px-4">
            {t.fleet.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
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
                isPopular={boat.id === popularBoatId}
                onBooking={handleBooking}
                onDetails={handleDetails}
              />
            ))
          )}
        </div>

        <div className="text-center px-2 sm:px-4">
          <p className="text-sm lg:text-base text-gray-600 mb-3 sm:mb-4 lg:mb-6">{t.fleet.helpText}</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-center max-w-sm sm:max-w-lg mx-auto">
            <button
              className="border border-border text-foreground hover:border-foreground/30 px-5 py-3 rounded-full font-medium flex items-center justify-center transition-colors text-sm lg:text-base min-h-11"
              onClick={() => openWhatsApp("Hola! Necesito ayuda para elegir el mejor barco para alquilar en Blanes. ¿Podrían asesorarme sobre precios y disponibilidad?")}
              data-testid="button-whatsapp-help"
              aria-label="Consultar por WhatsApp para elegir barco"
            >
              <SiWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 text-[#25D366]" aria-hidden="true" />
              <span className="ml-1 sm:ml-2">{t.contact.whatsapp}</span>
            </button>
            <button
              className="border border-border text-foreground hover:border-foreground/30 px-5 py-3 rounded-full font-medium flex items-center justify-center transition-colors text-sm lg:text-base min-h-11"
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

    </section>
  );
}