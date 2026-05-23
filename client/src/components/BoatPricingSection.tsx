import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { filterActivePrices } from "@shared/pricing";
import { useBoatPricingForDate } from "@/hooks/useBoatPricingForDate";
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

function formatDayLabel(date: Date, language: string): string {
  try {
    return new Intl.DateTimeFormat(language, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
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

  return (
    <Card className="mb-8">
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] gap-6 md:gap-10 items-start">
          {/* Calendar — left column on tablet+ */}
          <div className="md:max-w-none max-w-md mx-auto md:mx-0 w-full">
            <AvailabilityCalendar
              boatId={boatId}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
            />
          </div>

          {/* Pricing — right column on tablet+ */}
          <div aria-live="polite">
            {selectedDate ? (
              <div
                key={`day-${formatDayLabel(selectedDate, language)}`}
                className="animate-in fade-in duration-300"
              >
                <DayPricingMode
                  boatId={boatId}
                  selectedDate={selectedDate}
                  boatData={boatData}
                  requiresLicense={requiresLicense}
                  onDateClear={onDateClear}
                  onDurationSelect={onDurationSelect}
                  translate={translate}
                  dayLabel={formatDayLabel(selectedDate, language)}
                />
              </div>
            ) : (
              <div key="season" className="animate-in fade-in duration-300">
                <SeasonPricingMode
                  boatData={boatData}
                  requiresLicense={requiresLicense}
                  translate={translate}
                />
              </div>
            )}
          </div>
        </div>

        {boatData.included && boatData.included.length > 0 && (
          <div className="text-sm text-muted-foreground text-left md:text-center pt-4 border-t">
            <p className="mb-3 mt-3">
              <strong>{t.boatDetail.priceIncludes}</strong>
            </p>
            <div className="flex flex-wrap justify-start md:justify-center items-center gap-4">
              {boatData.included.map((item, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-primary mr-1" />
                  <span className="text-xs">{translate(item)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SeasonPricingModeProps {
  boatData: Boat;
  requiresLicense: boolean;
  translate: (text: string) => string;
}

function SeasonPricingMode({ boatData, requiresLicense, translate }: SeasonPricingModeProps) {
  const t = useTranslations();
  const pricing = boatData.pricing;
  const [selectedSeason, setSelectedSeason] = useState<"BAJA" | "MEDIA" | "ALTA">("BAJA");

  if (!pricing) {
    return (
      <p className="text-sm text-muted-foreground text-center italic">
        {t.boatDetail.selectDateHint}
      </p>
    );
  }

  const seasonLabels: Record<"BAJA" | "MEDIA" | "ALTA", string> = {
    BAJA: t.boatDetail.seasonLow,
    MEDIA: t.boatDetail.seasonMid,
    ALTA: t.boatDetail.seasonHigh,
  };
  const seasonPeriods: Record<"BAJA" | "MEDIA" | "ALTA", string> = {
    BAJA: t.boatDetail.periodLow,
    MEDIA: t.boatDetail.periodMid,
    ALTA: t.boatDetail.periodHigh,
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold font-heading mb-1">
          {t.boatDetail.pricesBySeason}
        </h3>
        <p className="text-xs text-muted-foreground italic">{t.boatDetail.selectDateHint}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["BAJA", "MEDIA", "ALTA"] as const)
          .filter((s) => s in pricing)
          .map((season) => (
            <Button
              key={season}
              variant={selectedSeason === season ? "default" : "outline"}
              onClick={() => setSelectedSeason(season)}
              className="text-sm"
              data-testid={`button-season-${season.toLowerCase()}`}
            >
              {seasonLabels[season]}
            </Button>
          ))}
      </div>

      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-3 text-center">
          {seasonPeriods[selectedSeason]}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {Object.entries(filterActivePrices(pricing[selectedSeason].prices))
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([duration, price]) => {
              const isRecommended = !requiresLicense && duration === "4h";
              return (
                <div
                  key={duration}
                  className={`relative text-center p-3 rounded-lg min-w-[100px] transition-all ${
                    isRecommended
                      ? "bg-background border-2 border-primary shadow-md scale-105 ring-3 ring-cta/35"
                      : "bg-background border"
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap tracking-wide shadow-sm">
                      {t.boatDetail.recommendedBadge}
                    </span>
                  )}
                  <div
                    className={`font-bold ${
                      isRecommended ? "text-xl text-primary" : "text-lg text-primary"
                    }`}
                  >
                    {price}€
                  </div>
                  <div className="text-sm text-muted-foreground">{duration}</div>
                </div>
              );
            })}
        </div>
      </div>
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
  translate: (text: string) => string;
  dayLabel: string;
}

function DayPricingMode({
  boatId,
  selectedDate,
  boatData,
  requiresLicense,
  onDateClear,
  onDurationSelect,
  translate,
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

  const p1h = useBoatPricingForDate({ boatId, date: dateKey, duration: "1h", enabled: activeDurations.has("1h") });
  const p2h = useBoatPricingForDate({ boatId, date: dateKey, duration: "2h", enabled: activeDurations.has("2h") });
  const p4h = useBoatPricingForDate({ boatId, date: dateKey, duration: "4h", enabled: activeDurations.has("4h") });
  const p8h = useBoatPricingForDate({ boatId, date: dateKey, duration: "8h", enabled: activeDurations.has("8h") });

  const results = useMemo(
    () =>
      [
        { duration: "1h", ...p1h },
        { duration: "2h", ...p2h },
        { duration: "4h", ...p4h },
        { duration: "8h", ...p8h },
      ].filter((r) => activeDurations.has(r.duration)),
    [activeDurations, p1h, p2h, p4h, p8h]
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
    ? "bg-emerald-50 border border-emerald-300"
    : "bg-popular/10 border border-popular/30";

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
          className="text-xs h-7 shrink-0 text-muted-foreground hover:text-foreground -mt-1"
          data-testid="button-back-to-season-prices"
        >
          <X className="w-3 h-3 mr-1" />
          {t.boatDetail.backToSeasonPrices}
        </Button>
      </div>

      {overrideHit?.overrideLabel && (
        <div className={`rounded-md px-3 py-2 text-center ${overrideBadgeClass}`}>
          <span className="text-xs font-medium text-foreground">
            <strong>{overrideHeadline}:</strong> {overrideHit.overrideLabel}
          </span>
        </div>
      )}

      <div className="bg-muted rounded-lg p-4">
        {isLoading ? (
          <div
            className="flex flex-wrap justify-center gap-3"
            role="status"
            aria-label={t.boatDetail.loadingPrices}
          >
            {results.map((r) => (
              <div
                key={`skel-${r.duration}`}
                className="text-center p-3 rounded-lg min-w-[100px] bg-background border"
                aria-hidden="true"
              >
                <div className="h-7 w-14 mx-auto bg-foreground/10 animate-pulse rounded mb-1" />
                <div className="h-4 w-10 mx-auto bg-foreground/5 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : allEmpty ? (
          <p className="text-sm text-muted-foreground text-center">{t.boatDetail.noPricesForDate}</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
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
                  className={`relative text-center p-3 rounded-lg min-w-[100px] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 ${
                    isRecommended
                      ? "bg-background border-2 border-primary shadow-md scale-105 hover:shadow-lg ring-3 ring-cta/35"
                      : "bg-background border hover:bg-primary/5"
                  }`}
                  data-testid={`button-duration-${r.duration}`}
                >
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap tracking-wide shadow-sm">
                      {t.boatDetail.recommendedBadge}
                    </span>
                  )}
                  <div
                    className={`font-bold ${
                      isRecommended ? "text-xl text-primary" : "text-lg text-primary"
                    }`}
                  >
                    {r.finalPrice}€
                  </div>
                  <div className="text-sm text-muted-foreground">{r.duration}</div>
                  {hasDiff && (
                    <div className="text-[10px] line-through text-muted-foreground mt-0.5">
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
