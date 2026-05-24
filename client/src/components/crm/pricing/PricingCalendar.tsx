import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Anchor, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PricingOverride } from "./types";

interface BoatLite {
  id: string;
  name: string;
}

interface PricingCalendarProps {
  /** Open the create modal with date_start = date_end = the clicked day */
  onCreateForDay: (dayKey: string) => void;
  /** Open the edit modal for an existing override */
  onEditOverride: (override: PricingOverride) => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAY_HEADERS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMonthGrid(year: number, month: number): (number | null)[] {
  // month is 1-indexed; weekday Monday = 0
  const firstDay = new Date(year, month - 1, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);
  return cells;
}

/**
 * Same predicate the backend uses (selectApplicableOverride) but returns
 * every match instead of resolving to one. Used to show admins the full
 * picture: stacked overrides, conflicts, polarity.
 */
function overridesForDay(
  overrides: PricingOverride[],
  year: number,
  month: number,
  day: number,
  boatFilter: string | null
): PricingOverride[] {
  const dateKey = toDateKey(year, month, day);
  const weekday = new Date(year, month - 1, day).getDay(); // 0 = Sun .. 6 = Sat
  return overrides.filter((o) => {
    if (!o.isActive) return false;
    if (dateKey < o.dateStart || dateKey > o.dateEnd) return false;
    if (o.weekdayFilter && o.weekdayFilter.length > 0 && !o.weekdayFilter.includes(weekday)) {
      return false;
    }
    // Boat filter: when admin picks a boat, show globals (boatId=null) + that boat's specifics.
    // When admin picks "all", show every override.
    if (boatFilter && o.boatId && o.boatId !== boatFilter) return false;
    return true;
  });
}

function formatAdjustment(o: PricingOverride): string {
  const value = parseFloat(o.adjustmentValue);
  const sign = o.direction === "surcharge" ? "+" : "−";
  if (o.adjustmentType === "multiplier") {
    return `${sign}${Math.round(value * 100)}%`;
  }
  return `${sign}${Math.round(value)}€`;
}

function pickCellTone(matches: PricingOverride[]): "neutral" | "surcharge" | "discount" | "mixed" {
  if (matches.length === 0) return "neutral";
  const hasSurcharge = matches.some((m) => m.direction === "surcharge");
  const hasDiscount = matches.some((m) => m.direction === "discount");
  if (hasSurcharge && hasDiscount) return "mixed";
  return hasSurcharge ? "surcharge" : "discount";
}

function cellToneClass(tone: ReturnType<typeof pickCellTone>, isToday: boolean): string {
  const base = "relative h-16 sm:h-20 rounded-md border p-1.5 text-xs text-left transition-colors hover:border-foreground/30";
  const todayRing = isToday ? "ring-2 ring-cta ring-offset-1" : "";
  switch (tone) {
    case "surcharge":
      return cn(base, todayRing, "bg-popular/10 border-popular/30");
    case "discount":
      return cn(base, todayRing, "bg-success/10 border-success/30");
    case "mixed":
      return cn(base, todayRing, "bg-muted border-foreground/20");
    default:
      return cn(base, todayRing, "bg-background border-border");
  }
}

export function PricingCalendar({ onCreateForDay, onEditOverride }: PricingCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [boatFilter, setBoatFilter] = useState<string>("all");

  const { data: overrides = [], isLoading } = useQuery<PricingOverride[]>({
    queryKey: ["/api/admin/pricing-overrides"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pricing-overrides", { credentials: "include" });
      if (!res.ok) throw new Error("Error cargando overrides");
      return res.json();
    },
  });

  const { data: boats = [] } = useQuery<BoatLite[]>({
    queryKey: ["/api/admin/boats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/boats", { credentials: "include" });
      if (!res.ok) throw new Error("Error cargando barcos");
      return res.json();
    },
  });

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const effectiveBoatFilter = boatFilter === "all" ? null : boatFilter;

  const navigatePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const navigateNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const totalForMonth = useMemo(
    () =>
      cells.reduce<number>((acc, day) => {
        if (day === null) return acc;
        return acc + overridesForDay(overrides, year, month, day, effectiveBoatFilter).length;
      }, 0),
    [cells, overrides, year, month, effectiveBoatFilter]
  );

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="capitalize">
            {MONTH_NAMES[month - 1]} {year}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({totalForMonth} {totalForMonth === 1 ? "override" : "overrides"})
            </span>
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={navigatePrev} aria-label="Mes anterior">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext} aria-label="Mes siguiente">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={boatFilter} onValueChange={setBoatFilter}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los barcos</SelectItem>
              {boats.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {effectiveBoatFilter
              ? "Mostrando overrides aplicables a este barco (incluye globales)"
              : "Mostrando todos los overrides"}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-popular/10 border border-popular/30" />
            Recargo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-success/10 border border-success/30" />
            Descuento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-muted border border-foreground/20" />
            Mixto (subida y bajada en el mismo día)
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[420px] w-full" />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_HEADERS.map((dh) => (
                <div key={dh} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {dh}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="h-16 sm:h-20" />;
                const matches = overridesForDay(overrides, year, month, day, effectiveBoatFilter);
                const tone = pickCellTone(matches);
                const isToday =
                  day === today.getDate() &&
                  month === today.getMonth() + 1 &&
                  year === today.getFullYear();

                if (matches.length === 0) {
                  // Empty day: a button that opens the create modal prefilled with this date.
                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => onCreateForDay(toDateKey(year, month, day))}
                      className={cn(cellToneClass(tone, isToday), "group cursor-pointer")}
                      aria-label={`Crear override para el ${day} de ${MONTH_NAMES[month - 1]}`}
                    >
                      <span className={cn("text-foreground", isToday && "font-bold")}>{day}</span>
                      <Plus className="absolute bottom-1 right-1 w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                    </button>
                  );
                }

                // Day with at least one override: clickable to open a popover with the details.
                return (
                  <Popover key={`day-${day}`}>
                    <PopoverTrigger asChild>
                      <button type="button" className={cn(cellToneClass(tone, isToday), "cursor-pointer")}>
                        <span className={cn("text-foreground", isToday && "font-bold")}>{day}</span>
                        <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 justify-start">
                          {matches.slice(0, 2).map((m) => (
                            <Badge
                              key={m.id}
                              variant="outline"
                              className={cn(
                                "h-4 px-1 text-[9px] leading-none border-0 font-semibold",
                                m.direction === "discount"
                                  ? "bg-success/20 text-success"
                                  : "bg-popular/25 text-foreground"
                              )}
                            >
                              {formatAdjustment(m)}
                            </Badge>
                          ))}
                          {matches.length > 2 && (
                            <span className="text-[9px] text-muted-foreground font-semibold">
                              +{matches.length - 2}
                            </span>
                          )}
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3" align="start">
                      <p className="text-sm font-semibold mb-2">
                        {day} {MONTH_NAMES[month - 1]} {year}{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          ({matches.length} {matches.length === 1 ? "override" : "overrides"})
                        </span>
                      </p>
                      <ul className="space-y-2 mb-3 max-h-64 overflow-y-auto">
                        {matches.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => onEditOverride(m)}
                              className="w-full text-left border rounded-md p-2 hover:border-foreground/40 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-sm font-medium truncate">{m.label}</span>
                                <Badge
                                  className={cn(
                                    "shrink-0",
                                    m.direction === "discount"
                                      ? "bg-success/15 text-success-foreground border border-success/40 hover:bg-success/15"
                                      : "bg-popular/15 text-foreground border border-popular/40 hover:bg-popular/15"
                                  )}
                                >
                                  {formatAdjustment(m)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                {m.boatId ? (
                                  <span className="flex items-center gap-1">
                                    <Anchor className="w-3 h-3" /> Barco específico
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> Todos los barcos
                                  </span>
                                )}
                                {m.priority !== 0 && <span>· prio {m.priority}</span>}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => onCreateForDay(toDateKey(year, month, day))}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Crear otro override para este día
                      </Button>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
