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
import { eraCopy } from "@shared/constants";
import { isCaptainedBoat, isPubliclyListed } from "@shared/boatData";
import type { Boat } from "@shared/schema";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { Phone, ChevronDown, Anchor } from "lucide-react";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { trackViewItemList, trackBoatClickedFromFleet, trackPhoneClick } from "@/utils/analytics";
import { getMinActivePrice } from "@shared/pricing";
import {
  isJetSkiProduct,
  getJetSkiProduct,
  getJetSkiPageKey,
  type JetSkiProduct,
} from "@shared/jetskiProducts";
import type { PageKey } from "@shared/i18n-routes";
import JetSkiRequestModal from "./JetSkiRequestModal";
import { translateBoatText } from "@shared/boatTextTranslations";

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

/**
 * Determine current season from today's date (Spain timezone).
 * Returns null if outside operational season (Nov-March).
 */
function getCurrentSeason(): "BAJA" | "MEDIA" | "ALTA" | null {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    month: "numeric",
  }).formatToParts(now);
  const month = parseInt(parts.find(p => p.type === "month")?.value || "0");

  if (month === 7) return "MEDIA";
  if (month === 8) return "ALTA";
  if ((month >= 4 && month <= 6) || (month >= 9 && month <= 10)) return "BAJA";
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
      if (w >= 1536)
        setCols(4); // 2xl
      else if (w >= 1280)
        setCols(3); // xl
      else if (w >= 640)
        setCols(2); // sm
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
    isJetSki: boolean;
    jetskiHref?: string;
  }>;
  popularBoatId: string;
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
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            className="absolute left-0 w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            style={{
              top: `${virtualRow.start}px`,
              height: `${virtualRow.size}px`,
            }}
          >
            {rows[virtualRow.index].map(boat => (
              <div key={boat.id}>
                <BoatCard
                  {...boat}
                  isPopular={boat.id === popularBoatId}
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

interface FleetSectionProps {
  /** Home renders jet ski / eFoil in their own ActivitiesSection, so it drops them here. */
  excludeActivities?: boolean;
}

function FleetSection({ excludeActivities = false }: FleetSectionProps) {
  const t = useTranslations();
  const { language, localizedPath } = useLanguage();
  const [, setLocation] = useLocation();
  const { openBookingModal } = useBookingModal();
  const { ref: revealRef, isVisible } = useScrollReveal();
  const [jetskiProduct, setJetskiProduct] = useState<JetSkiProduct | null>(null);
  const [licenseFilter, setLicenseFilter] = useState<"all" | "no" | "yes">("all");
  // Listen for license filter events from LicenseComparisonSection
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.license) {
        setLicenseFilter(detail.license === "no" ? "no" : "yes");
      }
    };
    window.addEventListener("fleet-filter", handler);
    return () => window.removeEventListener("fleet-filter", handler);
  }, []);

  // Fetch boats from API
  const { data: boatsData, isLoading } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });

  // GA4 ecommerce view_item_list tracking
  useEffect(() => {
    if (boatsData && boatsData.length > 0) {
      trackViewItemList(
        "fleet",
        "Fleet Section",
        boatsData
          .filter(b => isPubliclyListed(b) && !(excludeActivities && isJetSkiProduct(b.id)))
          .map(boat => {
            const pricing = boat.pricing as Record<
              string,
              { prices: Record<string, number> }
            > | null;
            const price = getMinActivePrice(pricing?.BAJA?.prices) ?? 75;
            return {
              id: boat.id,
              name: boat.name,
              price,
              specifications: boat.specifications,
              requiresLicense: boat.requiresLicense,
            };
          })
      );
    }
  }, [boatsData, excludeActivities]);

  const currentSeason = useMemo(() => getCurrentSeason(), []);

  const popularBoatId = "solar-450";

  // Transform API data to BoatCard format — memoized to avoid recalculation on every render
  const boats = useMemo(
    () =>
      (boatsData || [])
        .filter(boat => isPubliclyListed(boat) && !(excludeActivities && isJetSkiProduct(boat.id)))
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
        .map(boat => {
          // Current season base price (minimum duration price), fallback to BAJA.
          // Skip 0/null entries so admin-disabled durations don't anchor the price.
          const season = currentSeason || "BAJA";
          const basePrice = getMinActivePrice(boat.pricing?.[season]?.prices) ?? 0;

          // Extract engine power from specifications
          const enginePower = boat.specifications?.engine || "";

          // Jet ski cards use the canonical image from shared/jetskiProducts.ts
          // (single source of truth) instead of the DB-seeded path, so the fleet
          // card always matches the hub and landing imagery without re-seeding.
          const jsk = getJetSkiProduct(boat.id);

          return {
            id: boat.id,
            name: translateBoatText(boat.name, language),
            image: jsk
              ? getBoatImage(jsk.image)
              : boat.imageGallery?.[0]?.trim()
                ? getBoatImage(boat.imageGallery[0].trim())
                : boat.imageUrl
                  ? getBoatImage(boat.imageUrl)
                  : "/placeholder-boat.jpg",
            imageSrcSet:
              jsk || boat.imageGallery?.[0]?.trim()
                ? ""
                : boat.imageUrl
                  ? getBoatImageSrcSet(boat.imageUrl)
                  : "",
            imageTablet: jsk
              ? undefined
              : boat.imageGalleryTablet?.[0]?.trim()
                ? getBoatImage(boat.imageGalleryTablet[0].trim())
                : boat.imageGallery?.[0]?.trim()
                  ? getBoatImage(boat.imageGallery[0].trim())
                  : undefined,
            imageMobile: jsk
              ? undefined
              : boat.imageGalleryMobile?.[0]?.trim()
                ? getBoatImage(boat.imageGalleryMobile[0].trim())
                : boat.imageGallery?.[0]?.trim()
                  ? getBoatImage(boat.imageGallery[0].trim())
                  : undefined,
            imageAlt:
              (boat.requiresLicense
                ? t.boats.imageAltWithLicense
                : eraCopy(
                    t.boats.imageAltNoLicense,
                    t.boats.imageAltNoLicensePostEra ?? t.boats.imageAltNoLicense
                  )
              )
                ?.replace("{name}", translateBoatText(boat.name, language))
                .replace("{capacity}", String(boat.capacity))
                .replace("{price}", String(basePrice)) ||
              `${translateBoatText(boat.name, language)} - ${boat.capacity} pax - Blanes, Costa Brava`,
            capacity: boat.capacity,
            requiresLicense: boat.requiresLicense,
            description: (() => {
              const teaser = t.boatTeasers?.[boat.id];
              if (teaser) return teaser;
              const desc = t.boatDescriptions?.[boat.id] || boat.description || "";
              if (desc.length <= 150) return desc;
              const cut = desc.slice(0, 150);
              return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\u2014(\s-]+$/, "") + "\u2026";
            })(),
            basePrice,
            features: boat.equipment || [],
            available: true,
            enginePower: enginePower,
            isJetSki: isJetSkiProduct(boat.id),
            jetskiHref: isJetSkiProduct(boat.id)
              ? localizedPath(getJetSkiPageKey(boat.id) as PageKey)
              : undefined,
          };
        }),
    [boatsData, currentSeason, t, language, excludeActivities]
  );

  // From 2026-10-01 there are no self-drive licence-free boats left, so the
  // licence filter would only ever show one option: hide it instead.
  const showLicenseFilter = boats.some(
    b => !b.requiresLicense && !b.isJetSki && !isCaptainedBoat(b.id)
  );

  // Filter by license
  const sortedBoats = useMemo(() => {
    let filtered = boats;

    // Apply license filter
    if (!showLicenseFilter) {
      // no-op: filter hidden
    } else if (licenseFilter === "no") {
      filtered = filtered.filter(b => !b.requiresLicense);
    } else if (licenseFilter === "yes") {
      filtered = filtered.filter(b => b.requiresLicense);
    }

    return filtered;
  }, [boats, licenseFilter, showLicenseFilter]);

  const handleBooking = useCallback(
    (boatId: string) => {
      trackBoatClickedFromFleet(boatId, "book");
      // Jet ski products use the lightweight slot-request modal, not the
      // per-hour booking wizard (they're not in the pricing engine).
      const jetski = getJetSkiProduct(boatId);
      if (jetski) {
        setJetskiProduct(jetski);
        return;
      }
      openBookingModal(boatId);
    },
    [openBookingModal]
  );

  const handleDetails = useCallback(
    (boatId: string) => {
      trackBoatClickedFromFleet(boatId, "details");
      const jetskiPageKey = getJetSkiPageKey(boatId);
      if (jetskiPageKey) {
        setLocation(localizedPath(jetskiPageKey as PageKey));
        window.scrollTo(0, 0);
        return;
      }
      setLocation(localizedPath("boatDetail", boatId));
      window.scrollTo(0, 0);
    },
    [setLocation, localizedPath]
  );

  return (
    <section
      ref={revealRef}
      className={`pt-16 sm:pt-24 lg:pt-32 ${excludeActivities ? "pb-8 sm:pb-10 lg:pb-12" : "pb-16 sm:pb-24 lg:pb-32"} bg-background transition-[opacity,filter] duration-500 ${isVisible ? "opacity-100 blur-none" : "opacity-0 blur-[2px]"}`}
      id="fleet"
    >
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-heading text-h2 font-semibold text-foreground tracking-tight mb-2 sm:mb-3 lg:mb-4 px-2 text-balance">
            {t.fleet.title}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-normal mt-3 max-w-xl sm:max-w-2xl lg:max-w-4xl mx-auto px-2 sm:px-4 text-pretty">
            {t.fleet.subtitle}
          </p>
        </div>

        {/* Filters — native selects on mobile, pill buttons on desktop */}

        {/* Mobile + Tablet: native OS selects */}
        <div
          /* El sangrado negativo DEBE igualar el padding del contenedor padre
             (`container px-3 sm:px-4`). Con `-mx-4` fijo se pasaba 4px por lado
             por debajo de sm y la home arrastraba 4px en horizontal en todos los
             moviles; no se veia porque body lleva overflow-x:hidden y lo recorta. */
          className="flex lg:hidden items-center justify-center gap-3 mb-6 sticky z-30 bg-background/95 backdrop-blur-sm py-2 -mx-3 px-3 sm:-mx-4 sm:px-4 md:static md:bg-transparent md:backdrop-blur-none md:py-0 md:mx-0 md:px-0"
          style={{ top: "calc(var(--nav-height) + 8px)" }}
        >
          {showLicenseFilter && (
            <div className="relative flex-1 min-w-0 md:flex-none">
              <Anchor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <label htmlFor="fleet-license-filter" className="sr-only">
                {t.recommendation?.withoutLicense || "License filter"}
              </label>
              <select
                id="fleet-license-filter"
                value={licenseFilter}
                onChange={e => setLicenseFilter(e.target.value as "all" | "no" | "yes")}
                className="appearance-none w-full md:w-auto bg-muted text-foreground text-sm font-medium rounded-xl pl-9 pr-8 py-2.5 min-h-11 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">{t.recommendation?.all}</option>
                <option value="no">{t.recommendation?.withoutLicense}</option>
                <option value="yes">{t.recommendation?.withLicense}</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>

        {/* Desktop: pill buttons */}
        <div className="hidden lg:flex flex-row items-center justify-center gap-6 mb-8">
          {/* License filter */}
          {showLicenseFilter && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                <Anchor className="w-4 h-4" />
                {t.recommendation?.licenseFilter}
              </span>
              <div className="flex gap-1.5">
                {[
                  { value: "all" as const, label: t.recommendation?.all },
                  { value: "no" as const, label: t.recommendation?.withoutLicense },
                  { value: "yes" as const, label: t.recommendation?.withLicense },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setLicenseFilter(opt.value)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                      licenseFilter === opt.value
                        ? "bg-foreground text-primary-foreground dark:bg-cta dark:text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${sortedBoats.length % 3 === 0 ? "xl:grid-cols-3" : "xl:grid-cols-4"} gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12`}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <BoatCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedBoats.length > VIRTUALIZATION_THRESHOLD ? (
          <VirtualizedBoatGrid
            boats={sortedBoats}
            popularBoatId={popularBoatId}
            onBooking={handleBooking}
            onDetails={handleDetails}
          />
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${sortedBoats.length % 3 === 0 ? "xl:grid-cols-3" : "xl:grid-cols-4"} gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12`}
          >
            {sortedBoats.map(boat => (
              <div key={boat.id}>
                <BoatCard
                  {...boat}
                  isPopular={boat.id === popularBoatId}
                  onBooking={handleBooking}
                  onDetails={handleDetails}
                />
              </div>
            ))}
          </div>
        )}
        {sortedBoats.length === 0 && !isLoading && (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted-foreground mb-4">{t.boats.notAvailable}</p>
            <button
              onClick={() => {
                setLicenseFilter("all");
              }}
              className="px-4 py-2 rounded-full border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              {t.recommendation?.all || "All"}
            </button>
          </div>
        )}

        {/* Help CTA: headline = text up to the first "?", subtitle = the rest (one i18n string, all locales). */}
        {(() => {
          const q = t.fleet.helpText.indexOf("?");
          const headline = q > -1 ? t.fleet.helpText.slice(0, q + 1) : t.fleet.helpText;
          const sub = q > -1 ? t.fleet.helpText.slice(q + 1).trim() : "";
          const btn =
            "inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full px-6 py-3 text-sm sm:text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-cta";
          return (
            <div className="mx-2 sm:mx-0 rounded-2xl bg-cta p-6 sm:p-8 lg:px-10 lg:py-9 text-primary-foreground dark:text-background flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-center lg:text-left">
                <h3 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
                  {headline}
                </h3>
                {sub && <p className="mt-2 text-base opacity-80 text-pretty">{sub}</p>}
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 lg:justify-end">
                <button
                  className={`${btn} bg-whatsapp text-cta hover:brightness-95`}
                  onClick={() => openWhatsApp(t.fleet.whatsappHelpPrefill)}
                  data-testid="button-whatsapp-help"
                  aria-label={t.a11y.checkWhatsApp}
                >
                  <SiWhatsapp className="w-5 h-5" aria-hidden="true" />
                  {t.contact.whatsapp}
                </button>
                <button
                  className={`${btn} bg-sky-300 text-cta hover:bg-sky-200`}
                  data-testid="button-call-help"
                  aria-label={`${t.a11y.callPhone} +34 611 500 372`}
                  onClick={() => {
                    trackPhoneClick();
                    window.open("tel:+34611500372", "_self");
                  }}
                >
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  {t.fleet.callButton}
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      <JetSkiRequestModal product={jetskiProduct} onClose={() => setJetskiProduct(null)} />
    </section>
  );
}

export default React.memo(FleetSection);
