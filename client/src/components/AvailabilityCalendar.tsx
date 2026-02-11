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
}

export default function AvailabilityCalendar({ boatId }: AvailabilityCalendarProps) {
  const t = useTranslations();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

  const { data: availability, isLoading } = useQuery<AvailabilityData>({
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
  const modifiers = {
    available: [] as Date[],
    partial: [] as Date[],
    booked: [] as Date[],
    offSeason: [] as Date[],
    past: [] as Date[],
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
      backgroundColor: "rgb(220, 252, 231)",
      color: "rgb(22, 101, 52)",
      borderRadius: "6px",
    },
    partial: {
      backgroundColor: "rgb(254, 249, 195)",
      color: "rgb(133, 77, 14)",
      borderRadius: "6px",
    },
    booked: {
      backgroundColor: "rgb(254, 226, 226)",
      color: "rgb(153, 27, 27)",
      borderRadius: "6px",
    },
    offSeason: {
      backgroundColor: "rgb(243, 244, 246)",
      color: "rgb(156, 163, 175)",
      borderRadius: "6px",
    },
    past: {
      backgroundColor: "rgb(243, 244, 246)",
      color: "rgb(156, 163, 175)",
      borderRadius: "6px",
    },
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
              />
            )}
          </div>

          {/* Legend and Slots */}
          <div className="flex-1 space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
                <span>{t.availability?.available || "Disponible"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-300" />
                <span>{t.availability?.partial || "Parcial"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
                <span>{t.availability?.booked || "Ocupado"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300" />
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
                  {selectedSlots.map((slot) => (
                    <Badge
                      key={slot.time}
                      variant={slot.available ? "outline" : "secondary"}
                      className={`justify-center py-1.5 ${
                        slot.available
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-red-50 text-red-500 border-red-200"
                      }`}
                    >
                      {slot.time}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && selectedSlots.length === 0 && (
              <p className="text-sm text-gray-500">
                {t.availability?.noSlots || "No hay horarios disponibles para esta fecha"}
              </p>
            )}

            {!selectedDate && (
              <p className="text-sm text-gray-500">
                {t.availability?.selectDay || "Selecciona un día para ver los horarios disponibles"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
