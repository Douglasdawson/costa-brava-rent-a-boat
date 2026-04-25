import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import BoatCard from "./BoatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { openWhatsApp } from "@/utils/whatsapp";
import { useLocation } from "wouter";
import { getBoatImage, getBoatImageSrcSet } from "@/utils/boatImages";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import type { Boat } from "@shared/schema";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { Phone, Users, CheckCircle, ChevronDown, Anchor, LayoutGrid, TableProperties, Star } from "lucide-react";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { getBoatAverageRating } from "@/data/boatRatings";
import { trackViewItemList, trackBoatClickedFromFleet, trackPhoneClick } from "@/utils/analytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { filterActivePrices, getMinActivePrice } from "@shared/pricing";

/** Skeleton that mirrors BoatCard layout: image 4/3 + content + buttons */
function BoatCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative w-full aspect-[4/3] bg-muted">
        <Skeleton className="w-full h-full rounded-none" />
        <div className="absolute top-3 left-3">
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 mr-2">
            <Skeleton className="h-5 w-32 mb-1.5" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-3 w-12 ml-auto" />
            <Skeleton className="h-5 w-16 ml-auto" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-3 w-2/3 mb-2" />
        <div className="flex gap-1.5 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </Card>
  );
}

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

/** Estimated height of a single boat card row (px). Used by the virtualizer. */
const BOAT_ROW_HEIGHT = 480;

/** Threshold: only virtualize when more than this many boats */
const VIRTUALIZATION_THRESHOLD = 12;

/** Number of columns per breakpoint — must match the Tailwind grid classes */
function useGridColumns(): number {
  const [cols, setCols] = useState(1);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1536) setCols(4);       // 2xl
      else if (w >= 1280) setCols(3);  // xl
      else if (w >= 640) setCols(2);   // sm
      else setCols(1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

interface VirtualizedBoatGridProps {
  boats: Array<{
    id: string;
    name: string;
    image: string;
    imageSrcSet: string;
    imageTablet?: string;
    imageMobile?: string;
    imageAlt: string;
    capacity: number;
    requiresLicense: boolean;
    description: string;
    basePrice: number;
    features: string[];
    available: boolean;
    enginePower: string;
  }>;
  popularBoatId: string;
  selectedGroupSize: string | null;
  isBoatRecommended: (capacity: number) => boolean;
  onBooking: (boatId: string) => void;
  onDetails: (boatId: string) => void;
}

/**
 * Virtualized boat grid — only rendered when >12 boats.
 * Uses @tanstack/react-virtual to render only visible rows,
 * keeping the same responsive column layout as the normal grid.
 */
const VirtualizedBoatGrid = React.memo(function VirtualizedBoatGrid({
  boats,
  popularBoatId,
  selectedGroupSize,
  isBoatRecommended,
  onBooking,
  onDetails,
}: VirtualizedBoatGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useGridColumns();

  // Split boats into rows based on column count
  const rows = useMemo(() => {
    const result: Array<typeof boats> = [];
    for (let i = 0; i < boats.length; i += columns) {
      result.push(boats.slice(i, i + columns));
    }
    return result;
  }, [boats, columns]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => BOAT_ROW_HEIGHT,
    overscan: 2,
  });

  return (
    <div
      ref={parentRef}
      className="mb-6 sm:mb-8 lg:mb-12 overflow-y-auto"
      style={{ maxHeight: "80vh" }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            className="absolute left-0 w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            style={{
              top: `${virtualRow.start}px`,
              height: `${virtualRow.size}px`,
            }}
          >
            {rows[virtualRow.index].map((boat) => (
              <div
                key={boat.id}
                className={`transition-opacity duration-300 ${
                  selectedGroupSize !== null && !isBoatRecommended(boat.capacity)
                    ? "opacity-50"
                    : "opacity-100"
                }`}
              >
                <BoatCard
                  {...boat}
                  isPopular={boat.id === popularBoatId}
                  isRecommended={isBoatRecommended(boat.capacity)}
                  onBooking={onBooking}
                  onDetails={onDetails}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

function FleetSection() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
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


  // GA4 ecommerce view_item_list tracking
  useEffect(() => {
    if (boatsData && boatsData.length > 0) {
      trackViewItemList('fleet', 'Fleet Section', boatsData.filter(b => b.isActive).map(boat => {
        const pricing = boat.pricing as Record<string, { prices: Record<string, number> }> | null;
        const price = getMinActivePrice(pricing?.BAJA?.prices) ?? 75;
        return {
          id: boat.id,
          name: boat.name,
          price,
          specifications: boat.specifications,
          requiresLicense: boat.requiresLicense,
        };
      }));
    }
  }, [boatsData]);

  const currentSeason = useMemo(() => getCurrentSeason(), []);

  const popularBoatId = "solar-450";


  // Transform API data to BoatCard format — memoized to avoid recalculation on every render
  const boats = useMemo(() => (boatsData || [])
    .filter(boat => boat.isActive)
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
    .map(boat => {
      // Current season base price (minimum duration price), fallback to BAJA.
      // Skip 0/null entries so admin-disabled durations don't anchor the price.
      const season = currentSeason || 'BAJA';
      const basePrice = getMinActivePrice(boat.pricing?.[season]?.prices) ?? 0;

      // Extract engine power from specifications
      const enginePower = boat.specifications?.engine || '';

      return {
        id: boat.id,
        name: boat.name,
        image: (boat.imageGallery?.[0]?.trim()) || (boat.imageUrl ? getBoatImage(boat.imageUrl) : '/placeholder-boat.jpg'),
        imageSrcSet: (boat.imageGallery?.[0]?.trim()) ? '' : (boat.imageUrl ? getBoatImageSrcSet(boat.imageUrl) : ''),
        imageTablet: (boat.imageGalleryTablet?.[0]?.trim()) || (boat.imageGallery?.[0]?.trim()) || undefined,
        imageMobile: (boat.imageGalleryMobile?.[0]?.trim()) || (boat.imageGallery?.[0]?.trim()) || undefined,
        imageAlt: (boat.requiresLicense ? t.boats.imageAltWithLicense : t.boats.imageAltNoLicense)
          ?.replace('{name}', boat.name)
          .replace('{capacity}', String(boat.capacity))
          .replace('{price}', String(basePrice))
          || `${boat.name} - ${boat.capacity} pax - Blanes, Costa Brava`,
        capacity: boat.capacity,
        requiresLicense: boat.requiresLicense,
        description: (() => {
          const desc = t.boatDescriptions?.[boat.id] || boat.description || '';
          return desc.length > 150 ? desc.substring(0, 150) + "..." : desc;
        })(),
        basePrice,
        features: boat.equipment || [],
        available: true,
        enginePower: enginePower,
      };
    }), [boatsData, currentSeason, t]);

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

  const isBoatRecommended = useCallback((capacity: number): boolean => {
    if (selectedGroupSize === null) return false;
    const option = groupSizeOptions.find(o => o.label === selectedGroupSize);
    if (!option) return false;
    return capacity >= option.min && capacity <= option.max;
  }, [selectedGroupSize, groupSizeOptions]);

  const handleBooking = useCallback((boatId: string) => {
    trackBoatClickedFromFleet(boatId, 'book');
    openBookingModal(boatId);
  }, [openBookingModal]);

  const handleDetails = useCallback((boatId: string) => {
    trackBoatClickedFromFleet(boatId, 'details');
    setLocation(localizedPath("boatDetail", boatId));
    window.scrollTo(0, 0);
  }, [setLocation, localizedPath]);

  return (
    <section ref={revealRef} className={`py-16 sm:py-24 lg:py-32 bg-background transition-[opacity,transform,filter] duration-500 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-8 blur-[2px]"}`} id="fleet">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-2 sm:mb-3 lg:mb-4 px-2 text-balance">
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
            <label htmlFor="fleet-license-filter" className="sr-only">{t.recommendation?.withoutLicense || "License filter"}</label>
            <select
              id="fleet-license-filter"
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
            <label htmlFor="fleet-group-size" className="sr-only">{t.boats?.people || "Group size"}</label>
            <select
              id="fleet-group-size"
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
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    licenseFilter === opt.value
                      ? 'bg-foreground text-white dark:bg-cta dark:text-foreground'
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
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  selectedGroupSize === null
                    ? 'bg-foreground text-white dark:bg-cta dark:text-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
                }`}
              >
                {t.recommendation?.all}
              </button>
              {groupSizeOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setSelectedGroupSize(option.label)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    selectedGroupSize === option.label
                      ? 'bg-foreground text-white dark:bg-cta dark:text-foreground'
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
              className={`p-2.5 rounded-full transition-colors ${
                viewMode === 'grid'
                  ? 'bg-foreground text-white dark:bg-cta dark:text-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`hidden md:inline-flex p-2.5 rounded-full transition-colors ${
                viewMode === 'table'
                  ? 'bg-foreground text-white dark:bg-cta dark:text-foreground'
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
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
                {Array.from({ length: 6 }).map((_, i) => (
                  <BoatCardSkeleton key={i} />
                ))}
              </div>
            ) : sortedBoats.length > VIRTUALIZATION_THRESHOLD ? (
              <VirtualizedBoatGrid
                boats={sortedBoats}
                popularBoatId={popularBoatId}
                selectedGroupSize={selectedGroupSize}
                isBoatRecommended={isBoatRecommended}
                onBooking={handleBooking}
                onDetails={handleDetails}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
                {sortedBoats.map((boat) => (
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
                      onBooking={handleBooking}
                      onDetails={handleDetails}
                    />
                  </div>
                ))}
              </div>
            )}
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

        {/* Comparison table view — skeleton */}
        {viewMode === 'table' && isLoading && (
          <div className="mb-6 sm:mb-8 lg:mb-12 overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]"><Skeleton className="h-4 w-16" /></TableHead>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TableHead key={i} className="min-w-[160px] text-center"><Skeleton className="h-4 w-24 mx-auto" /></TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, row) => (
                  <TableRow key={row}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    {Array.from({ length: 4 }).map((_, col) => (
                      <TableCell key={col} className="text-center">
                        {row === 0 ? (
                          <Skeleton className="w-32 h-20 rounded-lg mx-auto" />
                        ) : (
                          <Skeleton className="h-4 w-16 mx-auto" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Comparison table view */}
        {viewMode === 'table' && !isLoading && (
          <div className="mb-6 sm:mb-8 lg:mb-12 overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px] sticky left-0 bg-background z-10">{t.comparison.compare}</TableHead>
                  {sortedBoats.map((boat) => (
                    <TableHead key={boat.id} className="min-w-[160px] text-center">{boat.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Photo thumbnail */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{''}</TableCell>
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
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{t.comparison.tableCapacity}</TableCell>
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
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{t.comparison.tableLicense}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center">
                      {boat.requiresLicense ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">{t.comparison.tableYes}</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-medium">{t.comparison.tableNo}</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Engine */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{t.comparison.tableEngine}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center text-sm">
                      {boat.enginePower || '-'}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Duration options */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{t.comparison.tableDuration}</TableCell>
                  {sortedBoats.map((boat) => {
                    const rawBoat = boatsData?.find(b => b.id === boat.id);
                    const season = currentSeason || 'BAJA';
                    const durations = Object.keys(filterActivePrices(rawBoat?.pricing?.[season]?.prices))
                      .sort((a, b) => parseFloat(a) - parseFloat(b));
                    return (
                      <TableCell key={boat.id} className="text-center text-sm">
                        {durations.length > 0 ? durations.map(d => String(d).endsWith('h') ? d : `${d}h`).join(', ') : '-'}
                      </TableCell>
                    );
                  })}
                </TableRow>
                {/* Price from */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{t.comparison.tablePriceFrom}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center">
                      <span className="font-semibold text-foreground">{boat.basePrice > 0 ? `${boat.basePrice}\u20AC` : '-'}</span>
                    </TableCell>
                  ))}
                </TableRow>
                {/* Price per person */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{t.comparison.tablePricePerPerson}</TableCell>
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
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{t.comparison.tableRating}</TableCell>
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
                  <TableCell className="font-medium sticky left-0 bg-background z-10">{t.comparison.tableFuelIncluded}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center">
                      {!boat.requiresLicense ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">{t.comparison.tableYes}</span>
                      ) : (
                        <span className="text-muted-foreground">{t.comparison.tableNo}</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {/* CTA button */}
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10">{''}</TableCell>
                  {sortedBoats.map((boat) => (
                    <TableCell key={boat.id} className="text-center">
                      <button
                        onClick={() => handleBooking(boat.id)}
                        className="bg-cta hover:bg-cta/90 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
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
          <p className="text-sm lg:text-base text-muted-foreground mb-3 sm:mb-4 lg:mb-6">{t.fleet.helpText}</p>
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
              onClick={() => { trackPhoneClick(); window.open("tel:+34611500372", "_self"); }}
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
          <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${checklistOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <ul className="overflow-hidden mt-2 space-y-2 px-4 pb-2">
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
          </div>
        </div>
      </div>

    </section>
  );
}

export default React.memo(FleetSection);
