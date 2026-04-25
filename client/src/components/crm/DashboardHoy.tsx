import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Anchor, Loader2, AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
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

function timeOverdue(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return "";
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

/** Build display name handling missing surname gracefully */
function customerDisplay(name: string, surname?: string | null): string {
  const parts = [name, surname].filter(Boolean);
  return parts.join(" ") || "Cliente";
}

// --- Component ---

export function DashboardHoy({ adminToken: _adminToken, onViewBooking }: DashboardHoyProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Undo mechanism for "Devuelto" button
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingCompleteId, setPendingCompleteId] = useState<string | null>(null);

  // Clean up pending timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Force re-render every 60s to update countdowns
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  // --- Data fetching ---

  const todayDates = todayRange();
  const tomorrowDates = tomorrowRange();

  const { data: todayBookings = [], isLoading: todayLoading, dataUpdatedAt } = useQuery<Booking[]>({
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
    },
  });

  const handleDevuelto = useCallback((booking: Booking) => {
    // Cancel any existing pending undo timer
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    const resolvedName = boats.find((b) => b.id === booking.boatId)?.name || booking.boatId;

    // Optimistically hide the booking
    setPendingCompleteId(booking.id);

    // Show toast with undo action
    toast({
      title: "Barco devuelto",
      description: resolvedName,
      action: (
        <ToastAction
          altText="Deshacer"
          onClick={() => {
            if (undoTimerRef.current) {
              clearTimeout(undoTimerRef.current);
              undoTimerRef.current = null;
            }
            setPendingCompleteId(null);
          }}
        >
          Deshacer
        </ToastAction>
      ),
    });

    // Fire the actual mutation after 3 seconds
    undoTimerRef.current = setTimeout(() => {
      undoTimerRef.current = null;
      setPendingCompleteId(null);
      markCompleted.mutate(booking.id);
    }, 3000);
  }, [boats, markCompleted, toast]);

  // --- Computed values ---

  const now = new Date();

  // "En agua" includes bookings that started and haven't been completed,
  // even if endTime is past (overdue returns).
  // Filter out the booking pending undo so it disappears optimistically.
  const enAgua = todayBookings.filter(
    (b) =>
      b.bookingStatus === "confirmed" &&
      new Date(b.startTime) <= now &&
      b.id !== pendingCompleteId,
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

  // Loading skeleton
  if (todayLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="sr-only">Cargando datos del dia</span>
          <span>Cargando...</span>
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Status bar */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <span className="font-medium text-foreground">{enAgua.length} en agua</span>
        <span aria-hidden="true">&middot;</span>
        <span>{boatsLibres} libres</span>
        <span aria-hidden="true">&middot;</span>
        <span>{totalReservasHoy} reservas hoy</span>
        {dataUpdatedAt > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            act. {formatDistanceToNow(new Date(dataUpdatedAt), { locale: es })}
          </span>
        )}
      </div>

      {/* EN AGUA — tight with status bar (space-y-2) */}
      {enAgua.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            En agua
          </h3>
          {enAgua.map((booking) => {
            const endTime = new Date(booking.endTime);
            const isOverdue = endTime < now;
            const resolvedBoatName = boatName(booking.boatId);

            return (
              <div
                key={booking.id}
                className={`flex items-center justify-between p-3 rounded-lg min-h-[44px] ${
                  isOverdue ? "bg-destructive/10" : "bg-accent/30"
                }`}
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer min-h-[44px] flex flex-col justify-center"
                  onClick={() => onViewBooking(booking.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onViewBooking(booking.id);
                    }
                  }}
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    {resolvedBoatName} &middot; {booking.customerName}
                  </p>
                  {isOverdue ? (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      atrasado {timeOverdue(endTime)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      vuelve{" "}
                      {format(endTime, "HH:mm", { locale: es })} (en{" "}
                      {timeUntil(endTime)})
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2 flex-shrink-0 min-h-[44px] min-w-[44px] active:scale-[0.97] transition-transform duration-75"
                  onClick={() => handleDevuelto(booking)}
                  disabled={markCompleted.isPending}
                  aria-label={`Marcar ${resolvedBoatName} como devuelto`}
                >
                  {markCompleted.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="sr-only">Guardando...</span>
                    </>
                  ) : (
                    "Devuelto"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state: all boats in port */}
      {enAgua.length === 0 && upcoming.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Anchor className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Todos los barcos en puerto. No hay reservas hoy.</p>
        </div>
      )}

      {/* SIGUIENTE — larger gap from En Agua section */}
      {siguiente && (
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Siguiente (en {timeUntil(new Date(siguiente.startTime))})
          </h3>
          <div
            className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors min-h-[44px]"
            onClick={() => onViewBooking(siguiente.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onViewBooking(siguiente.id);
              }
            }}
          >
            <div className="text-sm font-medium text-foreground">
              {format(new Date(siguiente.startTime), "HH:mm", { locale: es })}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                {customerDisplay(siguiente.customerName, siguiente.customerSurname)} &middot;{" "}
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
            {"M\u00e1s tarde"}
          </h3>
          {masTarde.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted transition-colors min-h-[44px]"
              onClick={() => onViewBooking(booking.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onViewBooking(booking.id);
                }
              }}
            >
              <span className="text-sm text-muted-foreground w-12">
                {format(new Date(booking.startTime), "HH:mm", { locale: es })}
              </span>
              <span className="text-sm text-foreground truncate">
                {booking.customerName} &middot; {boatName(booking.boatId)} &middot; {booking.totalHours}h
              </span>
            </div>
          ))}
        </div>
      )}

      {/* PETICIONES — larger gap (different context) */}
      {inquiries.length > 0 && (
        <div className="space-y-2 pt-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Peticiones ({inquiriesResponse?.total ?? inquiries.length})
          </h3>
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="flex items-center gap-3 px-3 py-2 text-sm min-h-[44px]"
            >
              <span className="text-foreground">
                {customerDisplay(inq.firstName, inq.lastName)}
              </span>
              <span className="text-muted-foreground" aria-hidden="true">&middot;</span>
              <span className="text-muted-foreground">
                {inq.bookingDate
                  ? format(new Date(inq.bookingDate + "T00:00:00"), "d MMM", { locale: es })
                  : "sin fecha"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* MANANA — larger gap (different context) */}
      {confirmedTomorrow.length > 0 && (
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wide">{"Ma\u00f1ana"}</span>
            {" \u00B7 "}
            {confirmedTomorrow.length} reservas
            {" \u00B7 "}
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
