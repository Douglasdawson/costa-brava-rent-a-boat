import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import BoatCard from "./BoatCard";
import { openWhatsApp } from "@/utils/whatsapp";
import { useLocation } from "wouter";
import { getBoatImage, getBoatImageSrcSet } from "@/utils/boatImages";
import { useTranslations } from "@/lib/translations";
import type { Boat } from "@shared/schema";
import { SiWhatsapp } from "react-icons/si";
import { Phone, Users, CheckCircle, ChevronDown, Anchor, LayoutGrid, TableProperties, Star } from "lucide-react";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { getBoatAverageRating } from "@/data/boatReviews";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** All possible group size filter buckets */
const ALL_GROUP_SIZE_OPTIONS = [
  { label: '1-4', min: 1, max: 4 },
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
  const [selectedGroupSize, setSelectedGroupSize] = useState<string | null>(null);
  const [licenseFilter, setLicenseFilter] = useState<'all' | 'no' | 'yes'>('all');
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Listen for license filter events from LicenseComparisonSection
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.license) {
        setLicenseFilter(detail.license === 'no' ? 'no' : 'yes');
      }
    };
    window.addEventListener('fleet-filter', handler);
    return () => window.removeEventListener('fleet-filter', handler);
  }, []);

  // Fetch boats from API
  const { data: boatsData, isLoading } = useQuery<Boat[]>({
    queryKey: ['/api/boats'],
  });

  // Fetch weekly bookings count per boat (social proof)
  const { data: weeklyBookings } = useQuery<Record<string, number>>({
    queryKey: ['/api/boats/weekly-bookings'],
    staleTime: 5 * 60 * 1000,
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

  const popularBoatId = "solar-450";

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
        imageTablet: boat.imageGalleryTablet?.[0] || boat.imageGallery?.[0] || undefined,
        imageMobile: boat.imageGalleryMobile?.[0] || boat.imageGallery?.[0] || undefined,
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

  // Filter by license and group size
  const sortedBoats = useMemo(() => {
    let filtered = boats;

    // Apply license filter
    if (licenseFilter === 'no') {
      filtered = filtered.filter(b => !b.requiresLicense);
    } else if (licenseFilter === 'yes') {
      filtered = filtered.filter(b => b.requiresLicense);
    }

    if (selectedGroupSize === null) return filtered;
    const option = groupSizeOptions.find(o => o.label === selectedGroupSize);
    if (!option) return filtered;

    // Filter: only show boats whose capacity falls within the selected bucket
    return filtered.filter(b => b.capacity >= option.min && b.capacity <= option.max);
  }, [boats, selectedGroupSize, licenseFilter, groupSizeOptions]);

  const isBoatRecommended = (capacity: number): boolean => {
    if (selectedGroupSize === null) return false;
    const option = groupSizeOptions.find(o => o.label === selectedGroupSize);
    if (!option) return false;
    return capacity >= option.min && capacity <= option.max;
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

        {/* Filters — native selects on mobile, pill buttons on desktop */}

        {/* Mobile + Tablet: native OS selects */}
        <div className="flex lg:hidden items-center justify-center gap-3 mb-6 sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 md:static md:bg-transparent md:backdrop-blur-none md:py-0 md:mx-0 md:px-0">
          <div className="relative">
            <Anchor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value as 'all' | 'no' | 'yes')}
              className="appearance-none bg-muted text-foreground text-sm font-medium rounded-xl pl-9 pr-8 py-2.5 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="all">{t.recommendation?.all}</option>
              <option value="no">{t.recommendation?.withoutLicense}</option>
              <option value="yes">{t.recommendation?.withLicense}</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={selectedGroupSize ?? ''}
              onChange={(e) => setSelectedGroupSize(e.target.value || null)}
              className="appearance-none bg-muted text-foreground text-sm font-medium rounded-xl pl-9 pr-8 py-2.5 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">{t.recommendation?.all}</option>
              {groupSizeOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label} {t.boats?.people}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Desktop: pill buttons */}
        <div className="hidden lg:flex flex-row items-center justify-center gap-6 mb-8">
          {/* License filter */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
              <Anchor className="w-4 h-4" />
              {t.recommendation?.licenseFilter}
            </span>
            <div className="flex gap-1.5">
              {([
                { value: 'all' as const, label: t.recommendation?.all },
                { value: 'no' as const, label: t.recommendation?.withoutLicense },
                { value: 'yes' as const, label: t.recommendation?.withLicense },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLicenseFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    licenseFilter === opt.value
                      ? 'bg-foreground text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Group size selector */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
              <Users className="w-4 h-4" />
              {t.recommendation?.howManyPeople}
            </span>
            <div className="flex flex-wrap gap-1.5">
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
                  onClick={() => setSelectedGroupSize(option.label)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedGroupSize === option.label
                      ? 'bg-foreground text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* View mode toggle: grid / table */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-full transition-colors ${
                viewMode === 'grid'
                  ? 'bg-foreground text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`hidden md:inline-flex p-2 rounded-full transition-colors ${
                viewMode === 'table'
                  ? 'bg-foreground text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
              }`}
              aria-label={t.comparison.compare}
            >
              <TableProperties className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid view */}
        {viewMode === 'grid' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-primary/10 overflow-hidden animate-pulse">
                    <div className="h-48 bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-8 bg-muted rounded w-full" />
                    </div>
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
                      weeklyBookings={weeklyBookings?.[boat.id]}
                      onBooking={handleBooking}
                      onDetails={handleDetails}
                    />
                  </div>
                ))
              )}
            </div>
            {sortedBoats.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {t.boats.notAvailable}
                </p>
                <button
                  onClick={() => {
                    setLicenseFilter('all');
                    setSelectedGroupSize(null);
                  }}
                  className="px-4 py-2 rounded-full border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  {t.recommendation?.all || 'All'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Comparison table view */}
        {viewMode === 'table' && !isLoading && (
          <div className="mb-6 sm:mb-8 lg:mb-12 overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px] sticky left-0 bg-white z-10">{t.comparison.compare}</TableHead>
                  {sortedBoats.map((boat) => (
                    <TableHead key={boat.id} className="min-w-[160px] text-center">{boat.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Photo thumbnail */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white z-10">{''}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center">
                      <img
                        src={boat.image}
                        alt={boat.name}
                        className="w-32 h-20 object-cover rounded-lg mx-auto"
                        loading="lazy"
                        decoding="async"
                      />
                    </TableCell>
                  ))}
                </TableRow>
                {/* Capacity */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white z-10">{t.comparison.tableCapacity}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {boat.capacity}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
                {/* License */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white z-10">{t.comparison.tableLicense}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center">
                      {boat.requiresLicense ? (
                        <span className="text-amber-600 font-medium">{t.comparison.tableYes}</span>
                      ) : (
                        <span className="text-green-600 font-medium">{t.comparison.tableNo}</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Engine */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white z-10">{t.comparison.tableEngine}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center text-sm">
                      {boat.enginePower || '-'}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Duration options */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white z-10">{t.comparison.tableDuration}</TableCell>
                  {sortedBoats.map((boat) => {
                    const rawBoat = boatsData?.find(b => b.id === boat.id);
                    const season = currentSeason || 'BAJA';
                    const durations = rawBoat?.pricing?.[season]?.prices
                      ? Object.keys(rawBoat.pricing[season].prices).sort((a, b) => parseFloat(a) - parseFloat(b))
                      : [];
                    return (
                      <TableCell key={boat.id} className="text-center text-sm">
                        {durations.length > 0 ? durations.map(d => String(d).endsWith('h') ? d : `${d}h`).join(', ') : '-'}
                      </TableCell>
                    );
                  })}
                </TableRow>
                {/* Price from */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white z-10">{t.comparison.tablePriceFrom}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center">
                      <span className="font-semibold text-foreground">{boat.basePrice > 0 ? `${boat.basePrice}\u20AC` : '-'}</span>
                    </TableCell>
                  ))}
                </TableRow>
                {/* Price per person */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white z-10">{t.comparison.tablePricePerPerson}</TableCell>
                  {sortedBoats.map((boat) => {
                    const perPerson = boat.basePrice > 0 && boat.capacity > 0
                      ? Math.ceil(boat.basePrice / boat.capacity)
                      : 0;
                    return (
                      <TableCell key={boat.id} className="text-center text-sm">
                        {perPerson > 0 ? `${perPerson}\u20AC` : '-'}
                      </TableCell>
                    );
                  })}
                </TableRow>
                {/* Rating */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white z-10">{t.comparison.tableRating}</TableCell>
                  {sortedBoats.map((boat) => {
                    const ratingData = getBoatAverageRating(boat.id);
                    return (
                      <TableCell key={boat.id} className="text-center">
                        {ratingData.count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            {ratingData.average.toFixed(1)}
                            <span className="text-muted-foreground">({ratingData.count})</span>
                          </span>
                        ) : '-'}
                      </TableCell>
                    );
                  })}
                </TableRow>
                {/* Fuel included */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white z-10">{t.comparison.tableFuelIncluded}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center">
                      {!boat.requiresLicense ? (
                        <span className="text-green-600 font-medium">{t.comparison.tableYes}</span>
                      ) : (
                        <span className="text-muted-foreground">{t.comparison.tableNo}</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {/* CTA button */}
                <TableRow>
                  <TableCell className="sticky left-0 bg-white z-10">{''}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center">
                      <button
                        onClick={() => handleBooking(boat.id)}
                        className="bg-[hsl(210,35%,76%)] hover:bg-[hsl(210,35%,68%)] text-foreground px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        {t.boats.book}
                      </button>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        <div className="text-center px-2 sm:px-4">
          <p className="text-sm lg:text-base text-gray-600 mb-3 sm:mb-4 lg:mb-6">{t.fleet.helpText}</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-center max-w-sm sm:max-w-lg mx-auto">
            <button
              className="border border-border text-foreground hover:border-foreground/30 px-5 py-3 rounded-full font-medium flex items-center justify-center transition-colors text-sm lg:text-base min-h-11"
              onClick={() => openWhatsApp("Hola! Necesito ayuda para elegir el mejor barco para alquilar en Blanes. ¿Podrían asesorarme sobre precios y disponibilidad?")}
              data-testid="button-whatsapp-help"
              aria-label={t.a11y.checkWhatsApp}
            >
              <SiWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 text-[#25D366]" aria-hidden="true" />
              <span className="ml-1 sm:ml-2">{t.contact.whatsapp}</span>
            </button>
            <button
              className="border border-border text-foreground hover:border-foreground/30 px-5 py-3 rounded-full font-medium flex items-center justify-center transition-colors text-sm lg:text-base min-h-11"
              data-testid="button-call-help"
              aria-label={`${t.a11y.callPhone} +34 611 500 372`}
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
