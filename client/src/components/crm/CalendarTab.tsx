import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  isSameDay,
  isSameMonth,
  isToday,
  differenceInMinutes,
  setHours,
  setMinutes,
  eachDayOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Booking, Boat } from "@shared/schema";
import { getStatusLabel } from "./constants";

// ---- Types ----

type CalendarView = "day" | "week" | "month";

interface CalendarTabProps {
  adminToken: string;
  onViewBooking: (booking: Booking) => void;
  onNewBooking: () => void;
  onNewBookingWithData?: (data: {
    boatId: string;
    startTime: string;
    endTime: string;
  }) => void;
}

interface BookingBlock {
  booking: Booking;
  topPercent: number;
  heightPercent: number;
}

// ---- Status color mapping ----

const STATUS_COLORS: Record<
  string,
  { bg: string; border: string; text: string; opacity?: string }
> = {
  confirmed: {
    bg: "bg-green-100",
    border: "border-green-500",
    text: "text-green-800",
  },
  hold: {
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-800",
  },
  pending_payment: {
    bg: "bg-yellow-100",
    border: "border-yellow-500",
    text: "text-yellow-800",
  },
  draft: {
    bg: "bg-gray-100",
    border: "border-gray-400",
    text: "text-gray-700",
  },
  cancelled: {
    bg: "bg-red-100",
    border: "border-red-400",
    text: "text-red-700",
    opacity: "opacity-50",
  },
  completed: {
    bg: "bg-slate-100",
    border: "border-slate-400",
    text: "text-slate-700",
  },
};

const STATUS_DOT_COLORS: Record<string, string> = {
  confirmed: "bg-green-500",
  hold: "bg-blue-400",
  pending_payment: "bg-yellow-500",
  draft: "bg-gray-400",
  cancelled: "bg-red-400",
  completed: "bg-slate-400",
};

const ALL_STATUSES = [
  "confirmed",
  "hold",
  "pending_payment",
  "draft",
  "cancelled",
  "completed",
];

// ---- Time helpers ----

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;
const SLOT_HEIGHT_PX = 40; // Height per 30-minute slot

function timeSlots(): string[] {
  const slots: string[] = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

function getBlockPosition(
  booking: Booking,
  dayDate: Date
): { topPercent: number; heightPercent: number } {
  const dayStart = setMinutes(setHours(dayDate, DAY_START_HOUR), 0);
  const dayEnd = setMinutes(setHours(dayDate, DAY_END_HOUR), 0);

  const bookingStart = new Date(booking.startTime);
  const bookingEnd = new Date(booking.endTime);

  // Clamp to visible day range
  const visibleStart = bookingStart < dayStart ? dayStart : bookingStart;
  const visibleEnd = bookingEnd > dayEnd ? dayEnd : bookingEnd;

  const startMinutes = differenceInMinutes(visibleStart, dayStart);
  const durationMinutes = differenceInMinutes(visibleEnd, visibleStart);

  const topPercent = (startMinutes / TOTAL_MINUTES) * 100;
  const heightPercent = Math.max((durationMinutes / TOTAL_MINUTES) * 100, 2);

  return { topPercent, heightPercent };
}

// ---- Main Component ----

export function CalendarTab({
  adminToken,
  onViewBooking,
  onNewBooking,
  onNewBookingWithData,
}: CalendarTabProps) {
  const [view, setView] = useState<CalendarView>("day");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedBoatFilter, setSelectedBoatFilter] = useState<string>("all");
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(
    new Set(ALL_STATUSES)
  );
  const [mobileBoatIndex, setMobileBoatIndex] = useState(0);

  // Fetch boats
  const { data: boats } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
    queryFn: async () => {
      const response = await fetch("/api/boats");
      if (!response.ok) throw new Error("Error fetching boats");
      return response.json();
    },
  });

  const activeBoats = useMemo(() => {
    if (!boats) return [];
    const filtered = boats.filter((b) => b.isActive);
    filtered.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    return filtered;
  }, [boats]);

  const filteredBoats = useMemo(() => {
    if (selectedBoatFilter === "all") return activeBoats;
    return activeBoats.filter((b) => b.id === selectedBoatFilter);
  }, [activeBoats, selectedBoatFilter]);

  // Compute date range for API query based on current view
  const dateRange = useMemo(() => {
    let start: Date;
    let end: Date;

    if (view === "day") {
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
    } else if (view === "week") {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
      // Extend to full calendar grid weeks
      start = startOfWeek(start, { weekStartsOn: 1 });
      end = endOfWeek(end, { weekStartsOn: 1 });
    }

    return { start, end };
  }, [view, currentDate]);

  // Fetch calendar bookings
  const {
    data: bookingsData,
    isLoading,
    error,
  } = useQuery<Booking[]>({
    queryKey: [
      "/api/admin/bookings/calendar",
      dateRange.start.toISOString(),
      dateRange.end.toISOString(),
      selectedBoatFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });
      if (selectedBoatFilter !== "all") {
        params.set("boatId", selectedBoatFilter);
      }
      const response = await fetch(
        `/api/admin/bookings/calendar?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      if (!response.ok) throw new Error("Error fetching calendar bookings");
      return response.json();
    },
  });

  // Filter bookings by visible statuses
  const filteredBookings = useMemo(() => {
    if (!bookingsData) return [];
    return bookingsData.filter((b) => visibleStatuses.has(b.bookingStatus));
  }, [bookingsData, visibleStatuses]);

  // Navigation handlers
  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const goPrev = useCallback(() => {
    if (view === "day") setCurrentDate((d) => subDays(d, 1));
    else if (view === "week") setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subMonths(d, 1));
  }, [view]);

  const goNext = useCallback(() => {
    if (view === "day") setCurrentDate((d) => addDays(d, 1));
    else if (view === "week") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addMonths(d, 1));
  }, [view]);

  const navigateToDay = useCallback((date: Date) => {
    setCurrentDate(date);
    setView("day");
  }, []);

  const toggleStatus = useCallback((status: string) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  // Handle click on empty slot in day view
  const handleEmptySlotClick = useCallback(
    (boatId: string, slotTime: string) => {
      if (onNewBookingWithData) {
        const [hours, minutes] = slotTime.split(":").map(Number);
        const start = setMinutes(setHours(currentDate, hours), minutes);
        const end = addDays(start, 0); // clone
        end.setHours(hours + 1, minutes, 0, 0); // default 1 hour duration
        onNewBookingWithData({
          boatId,
          startTime: format(start, "yyyy-MM-dd'T'HH:mm"),
          endTime: format(end, "yyyy-MM-dd'T'HH:mm"),
        });
      } else {
        onNewBooking();
      }
    },
    [currentDate, onNewBooking, onNewBookingWithData]
  );

  // Title for current view
  const viewTitle = useMemo(() => {
    if (view === "day") {
      return format(currentDate, "EEEE d 'de' MMMM yyyy", { locale: es });
    } else if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`;
    } else {
      return format(currentDate, "MMMM yyyy", { locale: es });
    }
  }, [view, currentDate]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Controls Bar */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col gap-3">
              {/* Row 1: Navigation + View Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Date navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToday}
                    className="text-xs sm:text-sm"
                  >
                    Hoy
                  </Button>
                  <Button variant="outline" size="icon" onClick={goPrev}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goNext}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <h2 className="text-sm sm:text-lg font-semibold capitalize ml-2 whitespace-nowrap">
                    {viewTitle}
                  </h2>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 border rounded-lg p-0.5">
                  <Button
                    variant={view === "day" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("day")}
                    className="text-xs px-3"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Dia
                  </Button>
                  <Button
                    variant={view === "week" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("week")}
                    className="text-xs px-3"
                  >
                    <List className="w-3.5 h-3.5 mr-1" />
                    Semana
                  </Button>
                  <Button
                    variant={view === "month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("month")}
                    className="text-xs px-3"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                    Mes
                  </Button>
                </div>
              </div>

              {/* Row 2: Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Boat filter */}
                <Select
                  value={selectedBoatFilter}
                  onValueChange={setSelectedBoatFilter}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filtrar barco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los barcos</SelectItem>
                    {activeBoats.map((boat) => (
                      <SelectItem key={boat.id} value={boat.id}>
                        {boat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status filters */}
                <div className="flex flex-wrap gap-1.5">
                  {ALL_STATUSES.map((status) => {
                    const isActive = visibleStatuses.has(status);
                    const dotColor = STATUS_DOT_COLORS[status] || "bg-gray-400";
                    return (
                      <button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isActive
                            ? "bg-white border-gray-300 text-gray-700"
                            : "bg-gray-50 border-gray-200 text-gray-400 line-through"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${dotColor} ${isActive ? "" : "opacity-30"}`}
                        />
                        {getStatusLabel(status)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Content */}
        {isLoading ? (
          <CalendarSkeleton view={view} />
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-red-500">
              Error cargando datos del calendario
            </CardContent>
          </Card>
        ) : (
          <>
            {view === "day" && (
              <DayView
                date={currentDate}
                boats={filteredBoats}
                bookings={filteredBookings}
                onViewBooking={onViewBooking}
                onEmptySlotClick={handleEmptySlotClick}
                mobileBoatIndex={mobileBoatIndex}
                onMobileBoatChange={setMobileBoatIndex}
              />
            )}
            {view === "week" && (
              <WeekView
                date={currentDate}
                boats={filteredBoats}
                bookings={filteredBookings}
                onViewBooking={onViewBooking}
                onDayClick={navigateToDay}
              />
            )}
            {view === "month" && (
              <MonthView
                date={currentDate}
                bookings={filteredBookings}
                onDayClick={navigateToDay}
              />
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

// ---- Skeleton ----

function CalendarSkeleton({ view }: { view: CalendarView }) {
  if (view === "day") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (view === "week") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Booking Tooltip Content ----

function BookingTooltipContent({ booking }: { booking: Booking }) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const durationMinutes = differenceInMinutes(end, start);
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;

  return (
    <div className="space-y-1 text-xs max-w-[220px]">
      <p className="font-semibold text-sm">
        {booking.customerName} {booking.customerSurname}
      </p>
      <p className="text-muted-foreground">
        {format(start, "HH:mm")} - {format(end, "HH:mm")} ({durationStr})
      </p>
      <p className="text-muted-foreground">Barco: {booking.boatId}</p>
      <div className="flex items-center gap-1.5 pt-0.5">
        <span
          className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[booking.bookingStatus] || "bg-gray-400"}`}
        />
        <span>{getStatusLabel(booking.bookingStatus)}</span>
      </div>
      {booking.totalAmount && (
        <p className="font-medium">
          {"\u20AC"}
          {parseFloat(booking.totalAmount).toFixed(2)}
        </p>
      )}
    </div>
  );
}

// ---- DAY VIEW ----

interface DayViewProps {
  date: Date;
  boats: Boat[];
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  onEmptySlotClick: (boatId: string, slotTime: string) => void;
  mobileBoatIndex: number;
  onMobileBoatChange: (index: number) => void;
}

function DayView({
  date,
  boats,
  bookings,
  onViewBooking,
  onEmptySlotClick,
  mobileBoatIndex,
  onMobileBoatChange,
}: DayViewProps) {
  const slots = useMemo(() => timeSlots(), []);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group bookings by boat
  const bookingsByBoat = useMemo(() => {
    const map = new Map<string, Booking[]>();
    boats.forEach((b) => map.set(b.id, []));

    bookings.forEach((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      // Check if booking overlaps with this day
      if (bookingStart <= dayEnd && bookingEnd >= dayStart) {
        const arr = map.get(booking.boatId);
        if (arr) arr.push(booking);
      }
    });

    return map;
  }, [boats, bookings, date]);

  // Current time indicator position
  const [currentTimePercent, setCurrentTimePercent] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      if (isSameDay(now, date)) {
        const dayStart = setMinutes(setHours(date, DAY_START_HOUR), 0);
        const mins = differenceInMinutes(now, dayStart);
        if (mins >= 0 && mins <= TOTAL_MINUTES) {
          setCurrentTimePercent((mins / TOTAL_MINUTES) * 100);
        } else {
          setCurrentTimePercent(null);
        }
      } else {
        setCurrentTimePercent(null);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [date]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (containerRef.current && currentTimePercent !== null) {
      const totalHeight = slots.length * SLOT_HEIGHT_PX;
      const scrollTo = (currentTimePercent / 100) * totalHeight - 100;
      containerRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, [currentTimePercent, slots.length]);

  // Mobile boat selector
  const currentMobileBoat = boats[mobileBoatIndex] || boats[0];

  if (boats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No hay barcos para mostrar
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Mobile boat selector */}
      <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMobileBoatChange(Math.max(0, mobileBoatIndex - 1))}
          disabled={mobileBoatIndex <= 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-medium text-sm">
          {currentMobileBoat?.name || "Barco"}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            onMobileBoatChange(Math.min(boats.length - 1, mobileBoatIndex + 1))
          }
          disabled={mobileBoatIndex >= boats.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="overflow-auto"
          style={{ maxHeight: "calc(100vh - 320px)" }}
        >
          <div className="min-w-[600px]">
            {/* Header row with boat names */}
            <div className="flex sticky top-0 z-20 bg-white border-b">
              <div className="w-16 sm:w-20 flex-shrink-0 border-r bg-gray-50" />
              {/* Desktop: show all boats */}
              <div className="hidden sm:contents">
                {boats.map((boat) => (
                  <div
                    key={boat.id}
                    className="flex-1 min-w-[140px] text-center py-2 px-1 border-r bg-gray-50"
                  >
                    <p className="text-xs sm:text-sm font-semibold truncate">
                      {boat.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Cap: {boat.capacity}
                    </p>
                  </div>
                ))}
              </div>
              {/* Mobile: show selected boat */}
              <div className="sm:hidden flex-1 text-center py-2 px-1 bg-gray-50">
                <p className="text-sm font-semibold">
                  {currentMobileBoat?.name}
                </p>
              </div>
            </div>

            {/* Time grid */}
            <div className="relative flex">
              {/* Time labels column */}
              <div className="w-16 sm:w-20 flex-shrink-0 border-r">
                {slots.map((slot) => (
                  <div
                    key={slot}
                    className="border-b border-gray-100 text-right pr-2 text-[10px] sm:text-xs text-gray-500 flex items-start justify-end"
                    style={{ height: SLOT_HEIGHT_PX }}
                  >
                    <span className="-mt-1.5">{slot}</span>
                  </div>
                ))}
              </div>

              {/* Boat columns - Desktop */}
              <div className="hidden sm:contents">
                {boats.map((boat) => {
                  const boatBookings = bookingsByBoat.get(boat.id) || [];
                  return (
                    <BoatColumn
                      key={boat.id}
                      boat={boat}
                      date={date}
                      bookings={boatBookings}
                      slots={slots}
                      onViewBooking={onViewBooking}
                      onEmptySlotClick={onEmptySlotClick}
                    />
                  );
                })}
              </div>

              {/* Boat column - Mobile (single) */}
              {currentMobileBoat && (
                <div className="sm:hidden flex-1">
                  <BoatColumn
                    boat={currentMobileBoat}
                    date={date}
                    bookings={bookingsByBoat.get(currentMobileBoat.id) || []}
                    slots={slots}
                    onViewBooking={onViewBooking}
                    onEmptySlotClick={onEmptySlotClick}
                  />
                </div>
              )}

              {/* Current time indicator */}
              {currentTimePercent !== null && (
                <div
                  className="absolute left-0 right-0 z-10 pointer-events-none"
                  style={{ top: `${currentTimePercent}%` }}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Boat Column (Day View sub-component) ----

interface BoatColumnProps {
  boat: Boat;
  date: Date;
  bookings: Booking[];
  slots: string[];
  onViewBooking: (booking: Booking) => void;
  onEmptySlotClick: (boatId: string, slotTime: string) => void;
}

function BoatColumn({
  boat,
  date,
  bookings,
  slots,
  onViewBooking,
  onEmptySlotClick,
}: BoatColumnProps) {
  const totalHeight = slots.length * SLOT_HEIGHT_PX;

  return (
    <div className="flex-1 min-w-[140px] border-r relative">
      {/* Slot rows (background grid) */}
      {slots.map((slot) => (
        <div
          key={slot}
          className="border-b border-gray-100 cursor-pointer hover:bg-blue-50/30 transition-colors"
          style={{ height: SLOT_HEIGHT_PX }}
          onClick={() => onEmptySlotClick(boat.id, slot)}
        />
      ))}

      {/* Booking blocks overlaid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ height: totalHeight }}
      >
        {bookings.map((booking) => {
          const { topPercent, heightPercent } = getBlockPosition(booking, date);
          const colors = STATUS_COLORS[booking.bookingStatus] || STATUS_COLORS.draft;

          return (
            <Tooltip key={booking.id}>
              <TooltipTrigger asChild>
                <button
                  className={`absolute left-1 right-1 rounded-md border-l-[3px] px-1.5 py-0.5 overflow-hidden pointer-events-auto cursor-pointer transition-shadow hover:shadow-md ${colors.bg} ${colors.border} ${colors.text} ${colors.opacity || ""}`}
                  style={{
                    top: `${topPercent}%`,
                    height: `${heightPercent}%`,
                    minHeight: "20px",
                  }}
                  onClick={() => onViewBooking(booking)}
                >
                  <div className="flex flex-col h-full justify-start overflow-hidden">
                    <p className="text-[10px] sm:text-xs font-semibold truncate leading-tight">
                      {booking.customerName} {booking.customerSurname?.charAt(0)}.
                    </p>
                    {heightPercent > 6 && (
                      <p className="text-[9px] sm:text-[10px] text-gray-600 truncate leading-tight">
                        {format(new Date(booking.startTime), "HH:mm")} -{" "}
                        {format(new Date(booking.endTime), "HH:mm")}
                      </p>
                    )}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <BookingTooltipContent booking={booking} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

// ---- WEEK VIEW ----

interface WeekViewProps {
  date: Date;
  boats: Boat[];
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  onDayClick: (date: Date) => void;
}

function WeekView({
  date,
  boats,
  bookings,
  onViewBooking,
  onDayClick,
}: WeekViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }),
    [weekStart]
  );

  // Group bookings by boat and day
  const bookingGrid = useMemo(() => {
    const grid = new Map<string, Map<string, Booking[]>>();

    boats.forEach((boat) => {
      const dayMap = new Map<string, Booking[]>();
      weekDays.forEach((day) => {
        dayMap.set(format(day, "yyyy-MM-dd"), []);
      });
      grid.set(boat.id, dayMap);
    });

    bookings.forEach((booking) => {
      const bStart = new Date(booking.startTime);
      const bEnd = new Date(booking.endTime);

      weekDays.forEach((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        if (bStart <= dayEnd && bEnd >= dayStart) {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayMap = grid.get(booking.boatId);
          if (dayMap) {
            const arr = dayMap.get(dayKey);
            if (arr) arr.push(booking);
          }
        }
      });
    });

    return grid;
  }, [boats, bookings, weekDays]);

  if (boats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No hay barcos para mostrar
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header: weekday names */}
            <div className="flex sticky top-0 z-10 bg-white border-b">
              <div className="w-32 sm:w-40 flex-shrink-0 border-r bg-gray-50 py-2 px-2">
                <span className="text-xs font-semibold text-gray-500">
                  Barco
                </span>
              </div>
              {weekDays.map((day) => {
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`flex-1 min-w-[80px] text-center py-2 border-r cursor-pointer hover:bg-blue-50 transition-colors ${
                      today ? "bg-blue-50" : "bg-gray-50"
                    }`}
                    onClick={() => onDayClick(day)}
                  >
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase">
                      {format(day, "EEE", { locale: es })}
                    </p>
                    <p
                      className={`text-sm sm:text-base font-semibold ${
                        today
                          ? "text-white bg-primary rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                          : ""
                      }`}
                    >
                      {format(day, "d")}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Boat rows */}
            {boats.map((boat) => {
              const dayMap = bookingGrid.get(boat.id);

              return (
                <div key={boat.id} className="flex border-b">
                  <div className="w-32 sm:w-40 flex-shrink-0 border-r bg-gray-50 py-2 px-2 flex items-center">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold truncate">
                        {boat.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Cap: {boat.capacity}
                      </p>
                    </div>
                  </div>

                  {weekDays.map((day) => {
                    const dayKey = format(day, "yyyy-MM-dd");
                    const dayBookings = dayMap?.get(dayKey) || [];
                    const today = isToday(day);

                    return (
                      <div
                        key={dayKey}
                        className={`flex-1 min-w-[80px] border-r p-1 min-h-[60px] cursor-pointer hover:bg-blue-50/50 transition-colors ${
                          today ? "bg-blue-50/30" : ""
                        }`}
                        onClick={() => onDayClick(day)}
                      >
                        <div className="space-y-0.5">
                          {dayBookings.slice(0, 4).map((booking) => {
                            const colors =
                              STATUS_COLORS[booking.bookingStatus] ||
                              STATUS_COLORS.draft;
                            return (
                              <Tooltip key={booking.id}>
                                <TooltipTrigger asChild>
                                  <button
                                    className={`w-full text-left rounded px-1 py-0.5 text-[9px] sm:text-[10px] truncate border-l-2 ${colors.bg} ${colors.border} ${colors.text} ${colors.opacity || ""} hover:shadow-sm`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewBooking(booking);
                                    }}
                                  >
                                    <span className="font-medium">
                                      {format(
                                        new Date(booking.startTime),
                                        "HH:mm"
                                      )}
                                    </span>{" "}
                                    {booking.customerName}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-[250px]"
                                >
                                  <BookingTooltipContent booking={booking} />
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                          {dayBookings.length > 4 && (
                            <p className="text-[9px] text-gray-500 pl-1">
                              +{dayBookings.length - 4} mas
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- MONTH VIEW ----

interface MonthViewProps {
  date: Date;
  bookings: Booking[];
  onDayClick: (date: Date) => void;
}

function MonthView({ date, bookings, onDayClick }: MonthViewProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  // Count bookings per day
  const bookingCountByDay = useMemo(() => {
    const map = new Map<string, { total: number; byStatus: Record<string, number> }>();

    calendarDays.forEach((day) => {
      map.set(format(day, "yyyy-MM-dd"), { total: 0, byStatus: {} });
    });

    bookings.forEach((booking) => {
      const bStart = new Date(booking.startTime);
      const bEnd = new Date(booking.endTime);

      calendarDays.forEach((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        if (bStart <= dayEnd && bEnd >= dayStart) {
          const dayKey = format(day, "yyyy-MM-dd");
          const entry = map.get(dayKey);
          if (entry) {
            entry.total++;
            entry.byStatus[booking.bookingStatus] =
              (entry.byStatus[booking.bookingStatus] || 0) + 1;
          }
        }
      });
    });

    return map;
  }, [bookings, calendarDays]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) }).map((d) =>
      format(d, "EEE", { locale: es })
    );
  }, []);

  // Determine occupancy level for background color
  const getOccupancyColor = (count: number): string => {
    if (count === 0) return "";
    if (count <= 2) return "bg-green-50";
    if (count <= 5) return "bg-yellow-50";
    return "bg-red-50";
  };

  const getOccupancyBorder = (count: number): string => {
    if (count === 0) return "";
    if (count <= 2) return "border-green-200";
    if (count <= 5) return "border-yellow-200";
    return "border-red-200";
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2 sm:p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase py-1"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const entry = bookingCountByDay.get(dayKey);
            const count = entry?.total || 0;
            const inMonth = isSameMonth(day, date);
            const today = isToday(day);

            // Get status breakdown for dots
            const statusEntries = entry?.byStatus
              ? Object.entries(entry.byStatus)
              : [];

            return (
              <button
                key={dayKey}
                onClick={() => onDayClick(day)}
                className={`relative p-1 sm:p-2 rounded-lg border text-left transition-colors hover:ring-2 hover:ring-primary/30 min-h-[52px] sm:min-h-[80px] ${
                  inMonth ? "bg-white" : "bg-gray-50/50"
                } ${today ? "ring-2 ring-primary border-primary" : "border-gray-200"} ${
                  count > 0 ? getOccupancyColor(count) : ""
                } ${count > 0 ? getOccupancyBorder(count) : ""}`}
              >
                {/* Day number */}
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    !inMonth
                      ? "text-gray-300"
                      : today
                        ? "text-primary font-bold"
                        : "text-gray-700"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {/* Booking count badge */}
                {count > 0 && inMonth && (
                  <div className="mt-0.5 sm:mt-1">
                    <span
                      className={`inline-block text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        count <= 2
                          ? "bg-green-200 text-green-800"
                          : count <= 5
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-red-200 text-red-800"
                      }`}
                    >
                      {count}
                    </span>

                    {/* Status dots - show up to 5 */}
                    <div className="hidden sm:flex flex-wrap gap-0.5 mt-1">
                      {statusEntries.slice(0, 5).map(([status, statusCount]) => (
                        <Tooltip key={status}>
                          <TooltipTrigger asChild>
                            <span
                              className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[status] || "bg-gray-400"}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {getStatusLabel(status)}: {statusCount}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t text-[10px] sm:text-xs text-gray-500">
          <span className="font-medium text-gray-600">Ocupacion:</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-50 border border-green-200" />
            Baja (1-2)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-50 border border-yellow-200" />
            Media (3-5)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-50 border border-red-200" />
            Alta (6+)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
