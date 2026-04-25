import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Anchor, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Boat } from "@shared/schema";

// --- Types ---

interface DashboardHoyProps {
  adminToken: string;
  onViewBooking: (bookingId: string) => void;
}

interface WhatsappInquirySummary {
  id: string;
  firstName: string;
  lastName: string;
  bookingDate: string;
  boatName: string;
  status: string;
}

interface PaginatedInquiries {
  data: WhatsappInquirySummary[];
  total: number;
  page: number;
  totalPages: number;
}

// --- Helpers ---

function timeUntil(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return "ahora";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
}

function todayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86400000 - 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function tomorrowRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const end = new Date(start.getTime() + 86400000 - 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

// --- Component ---

export function DashboardHoy({ adminToken: _adminToken, onViewBooking }: DashboardHoyProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Force re-render every 60s to update countdowns
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  // --- Data fetching ---

  const todayDates = todayRange();
  const tomorrowDates = tomorrowRange();

  const { data: todayBookings = [], isLoading: todayLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings/calendar", "today"],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: todayDates.start,
        endDate: todayDates.end,
      });
      const res = await fetch(`/api/admin/bookings/calendar?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error fetching today bookings");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const { data: tomorrowBookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings/calendar", "tomorrow"],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: tomorrowDates.start,
        endDate: tomorrowDates.end,
      });
      const res = await fetch(`/api/admin/bookings/calendar?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error fetching tomorrow bookings");
      return res.json();
    },
  });

  const { data: inquiriesResponse } = useQuery<PaginatedInquiries>({
    queryKey: ["/api/admin/booking-inquiries", "pending-hoy"],
    queryFn: async () => {
      const res = await fetch("/api/admin/booking-inquiries?status=pending&limit=3", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error fetching inquiries");
      return res.json();
    },
  });
  const inquiries = inquiriesResponse?.data ?? [];

  const { data: boats = [] } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });

  // --- Mutation: mark as completed ---

  const markCompleted = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookingStatus: "completed" }),
      });
      if (!res.ok) throw new Error("Error updating booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings/calendar", "today"] });
      toast({ title: "Barco devuelto" });
    },
  });

  // --- Computed values ---

  const now = new Date();

  const enAgua = todayBookings.filter(
    (b) =>
      b.bookingStatus === "confirmed" &&
      new Date(b.startTime) <= now &&
      new Date(b.endTime) >= now,
  );

  const upcoming = todayBookings
    .filter(
      (b) =>
        (b.bookingStatus === "confirmed" || b.bookingStatus === "pending_payment") &&
        new Date(b.startTime) > now,
    )
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const siguiente = upcoming[0] || null;
  const masTarde = upcoming.slice(1);

  const boatName = (id: string) => boats.find((b) => b.id === id)?.name || id;
  const totalBoats = boats.length;
  const boatsLibres = totalBoats - enAgua.length;
  const totalReservasHoy = todayBookings.filter(
    (b) => b.bookingStatus === "confirmed" || b.bookingStatus === "pending_payment",
  ).length;

  const confirmedTomorrow = tomorrowBookings
    .filter((b) => b.bookingStatus === "confirmed" || b.bookingStatus === "pending_payment")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // --- Render ---

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{enAgua.length} en agua</span>
        <span>·</span>
        <span>{boatsLibres} libres</span>
        <span>·</span>
        <span>{totalReservasHoy} reservas hoy</span>
      </div>

      {/* EN AGUA */}
      {enAgua.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            En agua
          </h3>
          {enAgua.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-3 rounded-lg bg-accent/30 min-h-[44px]"
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onViewBooking(booking.id)}
              >
                <p className="text-sm font-medium text-foreground truncate">
                  {boatName(booking.boatId)} · {booking.customerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  vuelve{" "}
                  {format(new Date(booking.endTime), "HH:mm", { locale: es })} (en{" "}
                  {timeUntil(new Date(booking.endTime))})
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-2 flex-shrink-0 min-h-[44px]"
                onClick={() => markCompleted.mutate(booking.id)}
                disabled={markCompleted.isPending}
              >
                {markCompleted.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Devuelto"
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state: all boats in port */}
      {!todayLoading && enAgua.length === 0 && upcoming.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Anchor className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Todos los barcos en puerto. No hay reservas hoy.</p>
        </div>
      )}

      {/* SIGUIENTE */}
      {siguiente && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Siguiente (en {timeUntil(new Date(siguiente.startTime))})
          </h3>
          <div
            className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors min-h-[44px]"
            onClick={() => onViewBooking(siguiente.id)}
          >
            <div className="text-sm font-medium text-foreground">
              {format(new Date(siguiente.startTime), "HH:mm", { locale: es })}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                {siguiente.customerName} {siguiente.customerSurname} ·{" "}
                {boatName(siguiente.boatId)}
              </p>
              <p className="text-xs text-muted-foreground">{siguiente.totalHours}h</p>
            </div>
          </div>
        </div>
      )}

      {/* MAS TARDE */}
      {masTarde.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Mas tarde
          </h3>
          {masTarde.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted transition-colors min-h-[44px]"
              onClick={() => onViewBooking(booking.id)}
            >
              <span className="text-sm text-muted-foreground w-12">
                {format(new Date(booking.startTime), "HH:mm", { locale: es })}
              </span>
              <span className="text-sm text-foreground truncate">
                {booking.customerName} · {boatName(booking.boatId)} · {booking.totalHours}h
              </span>
            </div>
          ))}
        </div>
      )}

      {/* PETICIONES */}
      {inquiries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Peticiones ({inquiriesResponse?.total ?? inquiries.length})
          </h3>
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="flex items-center gap-3 px-3 py-2 text-sm min-h-[44px]"
            >
              <span className="text-foreground">
                {inq.firstName} {inq.lastName}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {inq.bookingDate
                  ? format(new Date(inq.bookingDate + "T00:00:00"), "d MMM", { locale: es })
                  : "sin fecha"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* MANANA */}
      {confirmedTomorrow.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wide">Manana</span>
            {" · "}
            {confirmedTomorrow.length} reservas
            {" · "}
            {confirmedTomorrow
              .slice(0, 4)
              .map((b) => format(new Date(b.startTime), "HH:mm", { locale: es }))
              .join(" / ")}
          </p>
        </div>
      )}
    </div>
  );
}
