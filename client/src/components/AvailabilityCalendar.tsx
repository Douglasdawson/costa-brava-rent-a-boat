import { useState, useCallback, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage, type Language } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import {
  isOperationalSeason,
  getSeason,
  isWeekend,
  WEEKEND_SURCHARGE_FACTOR,
  type Season,
} from "@shared/pricing";
import { BOAT_DATA } from "@shared/boatData";
import { SEASON_START_MONTH, SEASON_END_MONTH } from "@shared/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AvailabilityDayData {
  status: string; // "available" | "partial" | "booked" | "off_season" | "past"
  slots: { time: string; available: boolean }[];
}

interface AvailabilityApiResponse {
  boatId: string;
  month: string;
  days: Record<string, AvailabilityDayData>;
}

export interface AvailabilityCalendarProps {
  /** If set, shows this boat's availability. Otherwise shows fleet-wide status. */
  boatId?: string;
  /** Currently selected date (controlled) */
  selectedDate?: Date;
  /** Callback when user clicks an available day */
  onDateSelect?: (date: Date) => void;
  /** Legacy callback for slot selection (used in BoatDetailPage) */
  onSlotSelect?: (date: string, time: string) => void;
  /** Override language (defaults to useLanguage hook) */
  language?: string;
}

// ---------------------------------------------------------------------------
// Localized month / day names
// ---------------------------------------------------------------------------

const MONTH_NAMES: Record<string, string[]> = {
  es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  ca: ["Gener", "Febrer", "Marc", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"],
  de: ["Januar", "Februar", "Marz", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  nl: ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"],
  it: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
  ru: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"],
};

const DAY_HEADERS: Record<string, string[]> = {
  es: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
  ca: ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  fr: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"],
  de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  nl: ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
  it: ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"],
  ru: ["Pn", "Vt", "Sr", "Ch", "Pt", "Sb", "Vs"],
};

const FROM_LABEL: Record<string, string> = {
  es: "desde", ca: "des de", en: "from", fr: "des", de: "ab", nl: "vanaf", it: "da", ru: "ot",
};

const LEGEND_LABELS: Record<string, { available: string; partial: string; booked: string; offSeason: string; past: string }> = {
  es: { available: "Disponible", partial: "Quedan pocas horas", booked: "Completo", offSeason: "Fuera de temporada", past: "Pasado" },
  ca: { available: "Disponible", partial: "Queden poques hores", booked: "Complet", offSeason: "Fora de temporada", past: "Passat" },
  en: { available: "Available", partial: "Few slots left", booked: "Fully booked", offSeason: "Off season", past: "Past" },
  fr: { available: "Disponible", partial: "Peu de creneaux", booked: "Complet", offSeason: "Hors saison", past: "Passe" },
  de: { available: "Verfugbar", partial: "Wenige Platze", booked: "Ausgebucht", offSeason: "Nebensaison", past: "Vergangen" },
  nl: { available: "Beschikbaar", partial: "Bijna vol", booked: "Volgeboekt", offSeason: "Buiten seizoen", past: "Verleden" },
  it: { available: "Disponibile", partial: "Pochi posti", booked: "Completo", offSeason: "Fuori stagione", past: "Passato" },
  ru: { available: "Dostupno", partial: "Malo mest", booked: "Zanyato", offSeason: "Ne sezon", past: "Proshloe" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Get the cheapest 1h price across all boats for a given season, applying weekend surcharge if needed */
function getCheapestPrice(season: Season, weekend: boolean): number {
  let min = Infinity;
  for (const boat of Object.values(BOAT_DATA)) {
    const seasonPricing = boat.pricing[season];
    if (!seasonPricing) continue;
    // Use the shortest available duration (1h) as the "desde" price
    const price1h = seasonPricing.prices["1h"];
    if (price1h !== undefined && price1h > 0 && price1h < min) {
      min = price1h;
    }
  }
  if (min === Infinity) return 0;
  return weekend ? Math.round(min * WEEKEND_SURCHARGE_FACTOR) : min;
}

/** Get the cheapest 1h price for a specific boat on a given season */
function getBoatCheapestPrice(boatId: string, season: Season, weekend: boolean): number {
  const boat = BOAT_DATA[boatId];
  if (!boat) return 0;
  const seasonPricing = boat.pricing[season];
  if (!seasonPricing) return 0;
  const price1h = seasonPricing.prices["1h"];
  if (price1h === undefined || price1h <= 0) return 0;
  return weekend ? Math.round(price1h * WEEKEND_SURCHARGE_FACTOR) : price1h;
}

/** Get today at midnight in local time */
function getTodayMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Build grid cells for a month. Returns array of 42 (6 weeks * 7 days). null = empty cell. */
function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  // getDay() is 0=Sun. We want Monday=0, so: (getDay() + 6) % 7
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);
  return cells;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AvailabilityCalendar({
  boatId,
  selectedDate,
  onDateSelect,
  onSlotSelect,
  language: languageProp,
}: AvailabilityCalendarProps) {
  const { language: hookLang } = useLanguage();
  const lang = (languageProp || hookLang || "es") as Language;

  // Current displayed month
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    if (selectedDate) return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  // Internal selected date (uncontrolled fallback)
  const [internalSelected, setInternalSelected] = useState<Date | undefined>(selectedDate);
  const effectiveSelected = selectedDate ?? internalSelected;

  // Cache of fetched months (keyed by "boatId|YYYY-MM")
  const cacheRef = useRef<Map<string, AvailabilityApiResponse>>(new Map());

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth() + 1; // 1-indexed
  const monthKey = toMonthKey(displayMonth);
  const cacheKey = `${boatId || "fleet"}|${monthKey}`;

  // ---------------------------------------------------------------------------
  // Data fetching -- only fetch when a specific boat is selected
  // ---------------------------------------------------------------------------
  const shouldFetch = !!boatId;

  const { data: availability, isLoading } = useQuery<AvailabilityApiResponse>({
    queryKey: ["/api/boats", boatId, "availability", monthKey],
    queryFn: async () => {
      // Check cache first
      const cached = cacheRef.current.get(cacheKey);
      if (cached) return cached;

      const response = await fetch(`/api/boats/${boatId}/availability?month=${monthKey}`);
      if (!response.ok) throw new Error("Error fetching availability");
      const data: AvailabilityApiResponse = await response.json();
      cacheRef.current.set(cacheKey, data);
      return data;
    },
    enabled: shouldFetch,
    staleTime: 60_000, // 1 minute
  });

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  const canGoPrev = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return displayMonth > currentMonthStart;
  }, [displayMonth]);

  const canGoNext = useMemo(() => {
    // Don't go past October of the current season year
    const currentYear = new Date().getFullYear();
    const maxMonth = new Date(currentYear, SEASON_END_MONTH - 1, 1); // October
    return displayMonth < maxMonth;
  }, [displayMonth]);

  const goToPrevMonth = useCallback(() => {
    if (!canGoPrev) return;
    setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, [canGoPrev]);

  const goToNextMonth = useCallback(() => {
    if (!canGoNext) return;
    setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, [canGoNext]);

  // ---------------------------------------------------------------------------
  // Grid data
  // ---------------------------------------------------------------------------
  const gridCells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const today = useMemo(getTodayMidnight, []);

  const isInSeason = month >= SEASON_START_MONTH && month <= SEASON_END_MONTH;

  // Compute day info (status + price) for each day
  type DayInfo = {
    day: number;
    dateKey: string;
    date: Date;
    isPast: boolean;
    isOffSeason: boolean;
    status: "available" | "partial" | "booked" | "off_season" | "past";
    price: number | null; // "desde" price in euros, null if unavailable
    isSelected: boolean;
    isToday: boolean;
  };

  const dayInfoMap = useMemo(() => {
    const map = new Map<number, DayInfo>();
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dateKey = toDateKey(year, month, d);
      const isPast = date < today;
      const isOff = !isInSeason;

      let status: DayInfo["status"] = "available";
      let price: number | null = null;

      if (isOff) {
        status = "off_season";
      } else if (isPast) {
        status = "past";
      } else {
        // Compute price client-side from season data
        try {
          const season = getSeason(date);
          const weekend = isWeekend(date);
          price = boatId
            ? getBoatCheapestPrice(boatId, season, weekend)
            : getCheapestPrice(season, weekend);
        } catch {
          // getSeason throws if out of season
          price = null;
        }

        // If we have API data for this boat, use the real status
        if (availability?.days[dateKey]) {
          const dayData = availability.days[dateKey];
          if (dayData.status === "booked") status = "booked";
          else if (dayData.status === "partial") status = "partial";
          else if (dayData.status === "available") status = "available";
          else if (dayData.status === "off_season") status = "off_season";
          else if (dayData.status === "past") status = "past";
        }
        // Without API data and no boat selected, assume "available" for in-season future dates
      }

      const isSelected = effectiveSelected
        ? effectiveSelected.getFullYear() === year &&
          effectiveSelected.getMonth() === month - 1 &&
          effectiveSelected.getDate() === d
        : false;

      const isToday = today.getFullYear() === year && today.getMonth() === month - 1 && today.getDate() === d;

      map.set(d, { day: d, dateKey, date, isPast, isOffSeason: isOff, status, price, isSelected, isToday });
    }
    return map;
  }, [year, month, today, isInSeason, boatId, availability, effectiveSelected]);

  // ---------------------------------------------------------------------------
  // Slot panel for selected day (legacy BoatDetailPage compat)
  // ---------------------------------------------------------------------------
  const selectedDaySlots = useMemo(() => {
    if (!effectiveSelected || !availability) return [];
    const key = toDateKey(
      effectiveSelected.getFullYear(),
      effectiveSelected.getMonth() + 1,
      effectiveSelected.getDate()
    );
    return availability.days[key]?.slots || [];
  }, [effectiveSelected, availability]);

  // ---------------------------------------------------------------------------
  // Click handler
  // ---------------------------------------------------------------------------
  const handleDayClick = useCallback(
    (info: DayInfo) => {
      if (info.isPast || info.isOffSeason || info.status === "booked") return;
      const date = info.date;
      setInternalSelected(date);
      onDateSelect?.(date);

      // If no slot panel will appear, open booking directly with the selected date
      const dateStr = toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
      const daySlots = availability?.days[dateStr]?.slots || [];
      if (onSlotSelect && daySlots.length === 0) {
        onSlotSelect(dateStr, "");
      }
    },
    [onDateSelect, onSlotSelect, availability]
  );

  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------
  const monthNames = MONTH_NAMES[lang] || MONTH_NAMES.es;
  const dayHeaders = DAY_HEADERS[lang] || DAY_HEADERS.es;
  const fromLabel = FROM_LABEL[lang] || FROM_LABEL.es;
  const legend = LEGEND_LABELS[lang] || LEGEND_LABELS.es;

  function getDayCellClasses(info: DayInfo): string {
    const base = "relative flex flex-col items-center justify-center rounded-lg transition-colors min-h-[3rem] sm:min-h-[3.5rem] text-sm";

    if (info.isSelected) {
      return cn(base, "ring-2 ring-primary ring-offset-1 bg-primary/10 font-semibold");
    }

    switch (info.status) {
      case "available":
        return cn(base, "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 cursor-pointer");
      case "partial":
        return cn(base, "bg-amber-50 hover:bg-amber-100 text-amber-900 cursor-pointer");
      case "booked":
        return cn(base, "bg-red-100 text-red-400 cursor-not-allowed");
      case "off_season":
        return cn(base, "bg-gray-100 text-gray-400 cursor-not-allowed");
      case "past":
        return cn(base, "bg-gray-50 text-gray-300 cursor-not-allowed");
      default:
        return cn(base, "text-foreground");
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const selectDayLabel: Record<string, string> = {
    es: "Selecciona un día para ver los horarios disponibles",
    ca: "Selecciona un dia per veure els horaris disponibles",
    en: "Select a day to see available time slots",
    fr: "Sélectionnez un jour pour voir les créneaux disponibles",
    de: "Wählen Sie einen Tag, um verfügbare Zeitfenster zu sehen",
    nl: "Selecteer een dag om beschikbare tijdsloten te zien",
    it: "Seleziona un giorno per vedere gli orari disponibili",
    ru: "Выберите день, чтобы увидеть доступные временные слоты",
  };

  const showSlotPanel = boatId && onSlotSelect;

  return (
    <div className={cn(
      "w-full select-none",
      showSlotPanel
        ? "max-w-md lg:max-w-none mx-auto lg:grid lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-8"
        : "max-w-md mx-auto"
    )}>
      {/* Left column: calendar + legend */}
      <div>
      {/* Header: month navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={goToPrevMonth}
          disabled={!canGoPrev}
          className={cn(
            "p-2 rounded-lg transition-colors",
            canGoPrev ? "hover:bg-muted text-foreground" : "text-muted-foreground/40 cursor-not-allowed"
          )}
          aria-label={lang === "es" ? "Mes anterior" : "Previous month"}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="text-base font-semibold font-heading capitalize">
          {monthNames[month - 1]} {year}
        </h3>

        <button
          type="button"
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className={cn(
            "p-2 rounded-lg transition-colors",
            canGoNext ? "hover:bg-muted text-foreground" : "text-muted-foreground/40 cursor-not-allowed"
          )}
          aria-label={lang === "es" ? "Mes siguiente" : "Next month"}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1 px-1">
        {dayHeaders.map((dh) => (
          <div key={dh} className="text-center text-xs font-medium text-muted-foreground py-1">
            {dh}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 px-1" role="grid" aria-label={`${monthNames[month - 1]} ${year}`}>
        {isLoading && shouldFetch ? (
          // Skeleton: 42 cells
          Array.from({ length: 42 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="min-h-[3rem] sm:min-h-[3.5rem] rounded-lg bg-muted/40 animate-pulse"
            />
          ))
        ) : (
          gridCells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="min-h-[3rem] sm:min-h-[3.5rem]" />;
            }

            const info = dayInfoMap.get(day);
            if (!info) return <div key={`none-${i}`} className="min-h-[3rem] sm:min-h-[3.5rem]" />;

            const clickable = !info.isPast && !info.isOffSeason && info.status !== "booked";
            const ariaLabel = `${day} ${monthNames[month - 1]}${info.price ? `, ${fromLabel} ${info.price}€` : ""}${info.status === "booked" ? `, ${legend.booked}` : ""}`;

            return (
              <button
                key={`day-${day}`}
                type="button"
                role="gridcell"
                aria-label={ariaLabel}
                aria-selected={info.isSelected}
                aria-disabled={!clickable}
                disabled={!clickable}
                tabIndex={clickable ? 0 : -1}
                className={getDayCellClasses(info)}
                onClick={() => handleDayClick(info)}
              >
                {/* Day number */}
                <span className={cn("leading-none", info.isToday && "font-bold underline underline-offset-2")}>
                  {day}
                </span>

                {/* Price badge removed — prices shown in pricing section instead */}

                {/* Booked indicator */}
                {info.status === "booked" && (
                  <span className="text-[9px] leading-tight font-medium text-red-500">
                    --
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Loading indicator overlay */}
      {isLoading && shouldFetch && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-300" />
          {legend.available}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-50 border border-amber-300" />
          {legend.partial}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          {legend.booked}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-gray-100 border border-gray-300" />
          {legend.offSeason}
        </div>
      </div>
      </div>

      {/* Right column: slot panel */}
      {showSlotPanel && (
        <div className="mt-4 lg:mt-0 px-1 lg:px-0">
          {effectiveSelected && selectedDaySlots.length > 0 ? (
            <>
              <p className="text-sm font-medium mb-2">
                {LEGEND_LABELS[lang]?.available || "Available"} - {effectiveSelected.toLocaleDateString(lang)}:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-1.5">
                {selectedDaySlots.map((slot) => {
                  const dateStr = toDateKey(
                    effectiveSelected.getFullYear(),
                    effectiveSelected.getMonth() + 1,
                    effectiveSelected.getDate()
                  );
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => slot.available && onSlotSelect(dateStr, slot.time)}
                      className={cn(
                        "py-1.5 px-2 rounded-md text-sm text-center transition-colors",
                        slot.available
                          ? "bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-white"
                          : "bg-red-50 text-red-400 border border-red-200 cursor-not-allowed"
                      )}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground hidden lg:block">
              {selectDayLabel[lang] || selectDayLabel.en}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
