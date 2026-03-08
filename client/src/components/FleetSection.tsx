import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import BoatCard from "./BoatCard";
import { openWhatsApp } from "@/utils/whatsapp";
import { useLocation } from "wouter";
import { getBoatImage, getBoatImageSrcSet } from "@/utils/boatImages";
import { useTranslations } from "@/lib/translations";
import type { Boat } from "@shared/schema";
import { SiWhatsapp } from "react-icons/si";
import { Phone, Users, CheckCircle, ChevronDown } from "lucide-react";
import { useBookingModal } from "@/hooks/useBookingModal";

/** All possible group size filter buckets */
const ALL_GROUP_SIZE_OPTIONS = [
  { label: '1-3', min: 1, max: 3 },
  { label: '4-5', min: 4, max: 5 },
  { label: '6-7', min: 6, max: 7 },
  { label: '8+', min: 8, max: 99 },
];

/** Build filter options dynamically based on max boat capacity */
function getGroupSizeOptions(maxCapacity: number) {
  return ALL_GROUP_SIZE_OPTIONS.filter(o => o.min <= maxCapacity);
}

/**
 * Determine current season from today's date (Spain timezone).
 * Returns null if outside operational season (Nov-March).
 */
function getCurrentSeason(): 'BAJA' | 'MEDIA' | 'ALTA' | null {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    month: 'numeric',
  }).formatToParts(now);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');

  if (month === 7) return 'MEDIA';
  if (month === 8) return 'ALTA';
  if ((month >= 4 && month <= 6) || (month >= 9 && month <= 10)) return 'BAJA';
  return null;
}

export default function FleetSection() {
  const t = useTranslations();
  const [, setLocation] = useLocation();
  const { openBookingModal } = useBookingModal();
  const { ref: revealRef, isVisible } = useScrollReveal();
  const [selectedGroupSize, setSelectedGroupSize] = useState<number | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);

  // Fetch boats from API
  const { data: boatsData, isLoading } = useQuery<Boat[]>({
    queryKey: ['/api/boats'],
  });

  // Fetch fleet-wide scarcity data for the next Saturday
  const { data: fleetAvailability } = useQuery<{
    date: string;
    boats: Record<string, { availableSlots: number; totalSlots: number }>;
  }>({
    queryKey: ['/api/fleet-availability'],
    staleTime: 5 * 60 * 1000, // match server cache: 5 minutes
  });

  const currentSeason = useMemo(() => getCurrentSeason(), []);

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
      // Current season base price (minimum duration price), fallback to BAJA
      const season = currentSeason || 'BAJA';
      const seasonPricing = boat.pricing?.[season]?.prices;
      const basePrice = seasonPricing
        ? Math.min(...Object.values(seasonPricing))
        : 0;

      // High season minimum price for price anchoring
      const highSeasonPrices = boat.pricing?.ALTA?.prices;
      const highSeasonPrice = highSeasonPrices
        ? Math.min(...Object.values(highSeasonPrices))
        : 0;

      // Extract engine power from specifications
      const enginePower = boat.specifications?.engine || '';

      return {
        id: boat.id,
        name: boat.name,
        image: boat.imageGallery?.[0] || (boat.imageUrl ? getBoatImage(boat.imageUrl) : '/placeholder-boat.jpg'),
        imageSrcSet: boat.imageGallery?.[0] ? '' : (boat.imageUrl ? getBoatImageSrcSet(boat.imageUrl) : ''),
        imageAlt: `Alquiler barco ${boat.name} ${boat.requiresLicense ? "con licencia" : "sin licencia"} en Blanes Costa Brava 2026 - Capacidad ${boat.capacity} personas`,
        capacity: boat.capacity,
        requiresLicense: boat.requiresLicense,
        description: boat.description
          ? (boat.description.length > 150 ? boat.description.substring(0, 150) + "..." : boat.description)
          : '',
        basePrice,
        // Only pass high season price when we're NOT in high season
        highSeasonPrice: currentSeason !== 'ALTA' ? highSeasonPrice : undefined,
        features: boat.equipment || [],
        available: true,
        enginePower: enginePower
      };
    }), [boatsData, currentSeason]);

  // Dynamic group size options based on max boat capacity
  const groupSizeOptions = useMemo(() => {
    const maxCapacity = boats.reduce((max, b) => Math.max(max, b.capacity), 0);
    return getGroupSizeOptions(maxCapacity);
  }, [boats]);

  // Sort boats: recommended ones first when a group size is selected
  const sortedBoats = useMemo(() => {
    if (selectedGroupSize === null) return boats;
    const option = groupSizeOptions.find(
      o => selectedGroupSize >= o.min && selectedGroupSize <= o.max
    );
    if (!option) return boats;

    return [...boats].sort((a, b) => {
      const aMatch = a.capacity >= option.min && a.capacity >= selectedGroupSize;
      const bMatch = b.capacity >= option.min && b.capacity >= selectedGroupSize;
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }, [boats, selectedGroupSize]);

  const isBoatRecommended = (capacity: number): boolean => {
    if (selectedGroupSize === null) return false;
    return capacity >= selectedGroupSize;
  };

  const handleBooking = (boatId: string) => {
    openBookingModal(boatId);
  };

  const handleDetails = (boatId: string) => {
    setLocation(`/barco/${boatId}`);
    window.scrollTo(0, 0);
  };

  return (
    <section ref={revealRef} className={`py-16 sm:py-24 lg:py-32 bg-white transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} id="fleet">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-medium text-foreground tracking-tight mb-2 sm:mb-3 lg:mb-4 px-2 text-balance">
            {t.fleet.title}
          </h2>
          <p className="text-base text-muted-foreground font-light mt-3 max-w-xl sm:max-w-2xl lg:max-w-4xl mx-auto px-2 sm:px-4">
            {t.fleet.subtitle}
          </p>
        </div>

        {/* Group size recommendation selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
            <Users className="w-4 h-4" />
            {t.recommendation?.howManyPeople}
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => setSelectedGroupSize(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedGroupSize === null
                  ? 'bg-foreground text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
              }`}
            >
              {t.recommendation?.all}
            </button>
            {groupSizeOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => setSelectedGroupSize(option.min)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedGroupSize !== null && selectedGroupSize >= option.min && selectedGroupSize <= option.max
                    ? 'bg-foreground text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
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
            sortedBoats.map((boat) => (
              <div
                key={boat.id}
                className={`transition-opacity duration-300 ${
                  selectedGroupSize !== null && !isBoatRecommended(boat.capacity)
                    ? 'opacity-50'
                    : 'opacity-100'
                }`}
              >
                <BoatCard
                  {...boat}
                  isPopular={boat.id === popularBoatId}
                  isRecommended={isBoatRecommended(boat.capacity)}
                  scarcityData={fleetAvailability?.boats[boat.id]}
                  onBooking={handleBooking}
                  onDetails={handleDetails}
                />
              </div>
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

        {/* "What to bring" collapsible checklist — free value (reciprocity) */}
        <div className="mt-8 sm:mt-10 max-w-md mx-auto">
          <button
            onClick={() => setChecklistOpen(prev => !prev)}
            className="w-full flex items-center justify-between gap-2 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted/80 rounded-xl px-4 py-3 transition-colors"
            aria-expanded={checklistOpen}
          >
            <span>{t.reciprocity?.whatToBring}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${checklistOpen ? 'rotate-180' : ''}`} />
          </button>
          {checklistOpen && (
            <ul className="mt-2 space-y-2 px-4 pb-2">
              {[
                t.reciprocity?.sunscreen,
                t.reciprocity?.towels,
                t.reciprocity?.waterSnacks,
                t.reciprocity?.sunglasses,
                t.reciprocity?.camera,
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </section>
  );
}
