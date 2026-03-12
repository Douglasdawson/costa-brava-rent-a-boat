import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/lib/translations";

interface AvailabilityData {
  boatId: string;
  month: string;
  days: Record<string, {
    status: string;
    slots: { time: string; available: boolean }[];
  }>;
}

interface AvailabilityCalendarProps {
  boatId: string;
  onSlotSelect?: (date: string, time: string) => void;
}

export default function AvailabilityCalendar({ boatId, onSlotSelect }: AvailabilityCalendarProps) {
  const t = useTranslations();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

  const { data: availability, isLoading, isError, refetch } = useQuery<AvailabilityData>({
    queryKey: ["/api/boats", boatId, "availability", monthKey],
    queryFn: async () => {
      const response = await fetch(`/api/boats/${boatId}/availability?month=${monthKey}`);
      if (!response.ok) throw new Error("Error fetching availability");
      return response.json();
    },
  });

  // Reset selected date when month changes
  useEffect(() => {
    setSelectedDate(undefined);
  }, [monthKey]);

  const getDayStatus = (date: Date): string => {
    if (!availability) return "unknown";
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return availability.days[dateStr]?.status || "unknown";
  };

  const getSelectedDaySlots = () => {
    if (!selectedDate || !availability) return [];
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return availability.days[dateStr]?.slots || [];
  };

  const selectedSlots = getSelectedDaySlots();

  // Custom day modifiers for styling
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const modifiers = {
    available: [] as Date[],
    partial: [] as Date[],
    booked: [] as Date[],
    offSeason: [] as Date[],
    past: [] as Date[],
    today: [todayDate],
  };

  if (availability) {
    Object.entries(availability.days).forEach(([dateStr, day]) => {
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      if (day.status === "available") modifiers.available.push(date);
      else if (day.status === "partial") modifiers.partial.push(date);
      else if (day.status === "booked") modifiers.booked.push(date);
      else if (day.status === "off_season") modifiers.offSeason.push(date);
      else if (day.status === "past") modifiers.past.push(date);
    });
  }

  const modifiersStyles = {
    available: {
      backgroundColor: "#a7f3d0",
      color: "#064e3b",
      borderRadius: "6px",
    },
    partial: {
      backgroundColor: "#fde68a",
      color: "#78350f",
      borderRadius: "6px",
    },
    booked: {
      backgroundColor: "#fecaca",
      color: "#7f1d1d",
      borderRadius: "6px",
    },
    offSeason: {
      backgroundColor: "#bae6fd",
      color: "#0c4a6e",
      borderRadius: "6px",
    },
    past: {
      backgroundColor: "#bae6fd",
      color: "#0c4a6e",
      borderRadius: "6px",
    },
    today: {
      boxShadow: "inset 0 0 0 2px hsl(var(--primary))",
      borderRadius: "6px",
      fontWeight: 700,
    },
  };

  // Format month caption to include year
  const formatCaption = (month: Date): string => {
    return month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center md:justify-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
          {t.availability?.title || "Disponibilidad"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar */}
          <div className="flex justify-center">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 w-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-64 w-64 text-center gap-3">
                <p className="text-sm text-muted-foreground">No se pudo cargar la disponibilidad.</p>
                <button
                  onClick={() => refetch()}
                  className="text-sm text-primary underline hover:no-underline"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                disabled={[
                  ...modifiers.offSeason,
                  ...modifiers.past,
                ]}
                fromMonth={new Date()}
                toMonth={new Date(new Date().getFullYear(), 9, 31)} // October
                formatters={{ formatCaption }}
              />
            )}
          </div>

          {/* Legend and Slots */}
          <div className="flex-1 space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500 border border-emerald-600" />
                <span>{t.availability?.available || "Disponible"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-sm bg-amber-400 border border-amber-500" />
                <span>{t.availability?.partial || "Parcial"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-sm bg-red-500 border border-red-600" />
                <span>{t.availability?.booked || "Ocupado"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-sm bg-sky-300 border border-sky-400" />
                <span>{t.availability?.offSeason || "Fuera de temporada"}</span>
              </div>
            </div>

            {/* Selected Day Slots */}
            {selectedDate && selectedSlots.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">
                  {t.availability?.slotsFor || "Horarios para"}{" "}
                  {selectedDate.toLocaleDateString()}:
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {selectedSlots.map((slot) => {
                    const dateStr = `${selectedDate!.getFullYear()}-${String(selectedDate!.getMonth() + 1).padStart(2, '0')}-${String(selectedDate!.getDate()).padStart(2, '0')}`;
                    const isClickable = slot.available && !!onSlotSelect;
                    return (
                      <Badge
                        key={slot.time}
                        variant={slot.available ? "outline" : "secondary"}
                        className={`justify-center py-1.5 flex-col gap-0.5 ${
                          slot.available
                            ? isClickable
                              ? "bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-primary cursor-pointer transition-colors"
                              : "bg-primary/5 text-primary border-primary/20"
                            : "bg-red-50 text-red-500 border-red-200 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (isClickable) onSlotSelect(dateStr, slot.time);
                        }}
                      >
                        <span>{slot.time}</span>
                        {isClickable && (
                          <span className="text-[9px] font-semibold uppercase tracking-wide">
                            {t.availability?.book || "Reservar"}
                          </span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedDate && selectedSlots.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t.availability?.noSlots || "No hay horarios disponibles para esta fecha"}
              </p>
            )}

            {!selectedDate && (
              <p className="text-sm text-muted-foreground">
                {t.availability?.selectDay || "Selecciona un día para ver los horarios disponibles"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
