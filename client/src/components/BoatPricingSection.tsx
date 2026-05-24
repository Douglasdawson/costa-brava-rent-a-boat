import { useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, TrendingUp, TrendingDown, Calendar, ChevronDown } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBoatPricingForDate } from "@/hooks/useBoatPricingForDate";
import { SEASON_END_MONTH } from "@shared/constants";
import AvailabilityCalendar from "./AvailabilityCalendar";
import type { Boat } from "@shared/schema";

interface BoatPricingSectionProps {
  boatData: Boat;
  boatId: string;
  requiresLicense: boolean;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date) => void;
  onDateClear: () => void;
  onDurationSelect: (duration: string, dateKey: string) => void;
  translate?: (text: string) => string;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Catalog items can drift to overlapping variants ("Seguro" vs.
 * "Seguro embarcación y ocupantes"). Prefer the most specific phrasing:
 * drop anything that is a strict substring of another item, then collapse
 * exact normalized duplicates.
 */
function dedupeIncluded(items: string[]): string[] {
  const norm = (s: string) => s.toLowerCase().trim();
  const seen = new Set<string>();
  const exact = items.filter((item) => {
    const key = norm(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return exact.filter((item) => {
    const itemN = norm(item);
    return !exact.some(
      (other) =>
        other !== item &&
        norm(other).includes(itemN) &&
        norm(other).length > itemN.length
    );
  });
}

function formatDayLabel(date: Date, language: string, short: boolean): string {
  try {
    return new Intl.DateTimeFormat(
      language,
      short
        ? { weekday: "short", day: "numeric", month: "short" }
        : { weekday: "long", day: "numeric", month: "long" }
    ).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export default function BoatPricingSection({
  boatData,
  boatId,
  requiresLicense,
  selectedDate,
  onDateSelect,
  onDateClear,
  onDurationSelect,
  translate = (s) => s,
}: BoatPricingSectionProps) {
  const t = useTranslations();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  // Used to focus the hidden <input type="date"> when the visible button is clicked.
  const nativeDateInputRef = useRef<HTMLInputElement>(null);

  const dayLabel = selectedDate ? formatDayLabel(selectedDate, language, isMobile) : "";

  // min / max bounds for the native date picker. Today through end of operational season.
  const { todayKey, maxKey } = useMemo(() => {
    const now = new Date();
    const t0 = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    // If we're past the end of this season, allow next season instead.
    const year = now.getMonth() + 1 > SEASON_END_MONTH ? now.getFullYear() + 1 : now.getFullYear();
    const lastDay = new Date(year, SEASON_END_MONTH, 0).getDate();
    const tMax = `${year}-${String(SEASON_END_MONTH).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { todayKey: t0, maxKey: tMax };
  }, []);

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m, d] = val.split("-").map(Number);
    onDateSelect(new Date(y, m - 1, d));
  };

  const openNativeDatePicker = () => {
    const el = nativeDateInputRef.current;
    if (!el) return;
    // Modern browsers expose showPicker(); fall back to focus()+click() on older ones.
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        // showPicker can throw if not triggered by user gesture in some envs
      }
    }
    el.focus();
    el.click();
  };

  return (
    <Card className="mb-8">
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] gap-6 md:gap-10 items-start">
          {/* Calendar — left column on tablet+, compact trigger + bottom sheet on mobile */}
          <div className="md:max-w-none max-w-md mx-auto md:mx-0 w-full">
            {isMobile ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={openNativeDatePicker}
                  className="w-full bg-background border-2 border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 transition-colors"
                  data-testid="button-open-calendar"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {selectedDate ? dayLabel : t.boatDetail.checkAvailability}
                    </span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                </button>
                {/* Native OS date picker, visually hidden but reachable by tap on browsers
                    that don't honor showPicker(). Positioned over the button so a tap
                    falls through to the input on older Safari versions. */}
                <input
                  ref={nativeDateInputRef}
                  type="date"
                  value={selectedDate ? toDateKey(selectedDate) : ""}
                  min={todayKey}
                  max={maxKey}
                  onChange={handleNativeDateChange}
                  aria-label={t.boatDetail.checkAvailability}
                  className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                  tabIndex={-1}
                />
              </div>
            ) : (
              <div>
                {!selectedDate && (
                  <p className="text-xs text-muted-foreground mb-2 px-1 text-center md:text-left">
                    {t.boatDetail.calendarHint}
                  </p>
                )}
                <AvailabilityCalendar
                  boatId={boatId}
                  selectedDate={selectedDate}
                  onDateSelect={onDateSelect}
                />
              </div>
            )}
          </div>

          {/* Pricing — right column on tablet+ */}
          <div aria-live="polite">
            {selectedDate ? (
              <div key={`day-${dayLabel}`} className="animate-in fade-in duration-300">
                <DayPricingMode
                  boatId={boatId}
                  selectedDate={selectedDate}
                  boatData={boatData}
                  requiresLicense={requiresLicense}
                  onDateClear={onDateClear}
                  onDurationSelect={onDurationSelect}
                  dayLabel={dayLabel}
                />
              </div>
            ) : (
              <div key="empty" className="animate-in fade-in duration-300">
                <EmptyPricingState />
              </div>
            )}
          </div>
        </div>

        {boatData.included && boatData.included.length > 0 && (() => {
          const items = dedupeIncluded(boatData.included);
          return (
            <div className="text-sm text-muted-foreground text-left md:text-center pt-4 border-t">
              <p className="mb-3 mt-3">
                <strong>{t.boatDetail.priceIncludes}</strong>
              </p>
              <div className="flex flex-wrap justify-start md:justify-center items-center gap-4">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-primary mr-1" />
                    <span className="text-xs">{translate(item)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}

function EmptyPricingState() {
  const t = useTranslations();
  return (
    <div className="rounded-lg bg-muted p-8 text-center space-y-3">
      <Calendar className="w-10 h-10 text-primary/40 mx-auto" aria-hidden="true" />
      <h3 className="text-base font-semibold font-heading">{t.boatDetail.selectDateTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {t.boatDetail.selectDateBody}
      </p>
    </div>
  );
}

interface DayPricingModeProps {
  boatId: string;
  selectedDate: Date;
  boatData: Boat;
  requiresLicense: boolean;
  onDateClear: () => void;
  onDurationSelect: (duration: string, dateKey: string) => void;
  dayLabel: string;
}

function DayPricingMode({
  boatId,
  selectedDate,
  boatData,
  requiresLicense,
  onDateClear,
  onDurationSelect,
  dayLabel,
}: DayPricingModeProps) {
  const t = useTranslations();
  const dateKey = toDateKey(selectedDate);

  const activeDurations = useMemo(() => {
    const set = new Set<string>();
    if (boatData.pricing) {
      (["BAJA", "MEDIA", "ALTA"] as const).forEach((s) => {
        const seasonPricing = boatData.pricing?.[s];
        if (!seasonPricing) return;
        Object.entries(seasonPricing.prices).forEach(([d, p]) => {
          if ((p as number) > 0) set.add(d);
        });
      });
    }
    return set;
  }, [boatData.pricing]);

  // One hook per possible duration. Hooks must be unconditional, but each one
  // gates its own fetch via `enabled` so we don't hit the API for slots the boat
  // doesn't sell. The filter at the bottom keeps the final array clean.
  const p1h = useBoatPricingForDate({ boatId, date: dateKey, duration: "1h", enabled: activeDurations.has("1h") });
  const p2h = useBoatPricingForDate({ boatId, date: dateKey, duration: "2h", enabled: activeDurations.has("2h") });
  const p3h = useBoatPricingForDate({ boatId, date: dateKey, duration: "3h", enabled: activeDurations.has("3h") });
  const p4h = useBoatPricingForDate({ boatId, date: dateKey, duration: "4h", enabled: activeDurations.has("4h") });
  const p6h = useBoatPricingForDate({ boatId, date: dateKey, duration: "6h", enabled: activeDurations.has("6h") });
  const p8h = useBoatPricingForDate({ boatId, date: dateKey, duration: "8h", enabled: activeDurations.has("8h") });

  const results = useMemo(
    () =>
      [
        { duration: "1h", ...p1h },
        { duration: "2h", ...p2h },
        { duration: "3h", ...p3h },
        { duration: "4h", ...p4h },
        { duration: "6h", ...p6h },
        { duration: "8h", ...p8h },
      ].filter((r) => activeDurations.has(r.duration)),
    [activeDurations, p1h, p2h, p3h, p4h, p6h, p8h]
  );

  const isLoading = results.length > 0 && results.every((r) => r.finalPrice === null);
  const allEmpty = !isLoading && results.every((r) => r.finalPrice === null);
  const overrideHit = results.find((r) => r.hasOverride);
  const isDiscount =
    !!overrideHit &&
    overrideHit.basePrice !== null &&
    overrideHit.finalPrice !== null &&
    overrideHit.finalPrice < overrideHit.basePrice;
  const overrideHeadline = isDiscount
    ? t.boatDetail.specialRateDiscount
    : t.boatDetail.specialRateIncrease;
  const overrideBadgeClass = isDiscount
    ? "bg-success/10 border border-success/30"
    : "bg-popular/10 border border-popular/30";
  const OverrideIcon = isDiscount ? TrendingDown : TrendingUp;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold font-heading">
          {t.boatDetail.pricesForDay.replace("{day}", dayLabel)}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDateClear}
          aria-label={t.boatDetail.backToSeasonPrices}
          className="text-xs h-7 shrink-0 text-muted-foreground hover:text-foreground -mt-1"
          data-testid="button-back-to-season-prices"
        >
          <X className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">{t.boatDetail.backToSeasonPrices}</span>
        </Button>
      </div>

      {overrideHit?.overrideLabel && (
        <div
          className={`rounded-md px-3 py-2 flex items-center justify-center gap-1.5 ${overrideBadgeClass}`}
        >
          <OverrideIcon className="w-3.5 h-3.5 text-foreground/70 shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">
            <strong>{overrideHeadline}:</strong> {overrideHit.overrideLabel}
          </span>
        </div>
      )}

      <div className="bg-muted rounded-lg p-4 md:p-6">
        {isLoading ? (
          <div
            className="flex flex-wrap justify-center gap-x-3 gap-y-6"
            role="status"
            aria-label={t.boatDetail.loadingPrices}
          >
            {results.map((r) => (
              <div
                key={`skel-${r.duration}`}
                className="text-center p-3 rounded-lg bg-background border w-[calc(50%-0.375rem)] sm:w-[160px]"
                aria-hidden="true"
              >
                <div className="h-7 w-16 mx-auto bg-foreground/10 animate-pulse rounded mb-1" />
                <div className="h-4 w-12 mx-auto bg-foreground/5 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : allEmpty ? (
          <p className="text-sm text-muted-foreground text-center">{t.boatDetail.noPricesForDate}</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-6">
            {results.map((r) => {
              if (r.finalPrice === null) return null;
              const isRecommended = !requiresLicense && r.duration === "4h";
              const hasDiff = r.hasOverride && r.basePrice !== null && r.basePrice !== r.finalPrice;
              const ariaLabel = `${t.hero.bookNow} ${r.duration} · ${r.finalPrice}€${
                isRecommended ? ` · ${t.boatDetail.recommendedBadge}` : ""
              }`;
              return (
                <button
                  key={r.duration}
                  type="button"
                  onClick={() => onDurationSelect(r.duration, dateKey)}
                  aria-label={ariaLabel}
                  className={`relative text-center p-3 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none w-[calc(50%-0.375rem)] sm:w-[160px] ${
                    isRecommended
                      ? "bg-background border-2 border-cta hover:shadow-lg hover:-translate-y-0.5"
                      : "bg-background border hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-sm"
                  }`}
                  data-testid={`button-duration-${r.duration}`}
                >
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cta text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap tracking-wide">
                      {t.boatDetail.recommendedBadge}
                    </span>
                  )}
                  <div
                    className={`font-bold tabular-nums ${
                      isRecommended ? "text-xl text-primary" : "text-lg text-primary"
                    }`}
                  >
                    {r.finalPrice}€
                  </div>
                  <div className="text-sm text-muted-foreground">{r.duration}</div>
                  {hasDiff && (
                    <div className="text-[10px] line-through text-muted-foreground mt-0.5 tabular-nums">
                      {r.basePrice}€
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
