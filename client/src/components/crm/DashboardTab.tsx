import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Euro,
  TrendingUp,
  Clock,
  Anchor,
  Eye,
  Edit,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Booking } from "@shared/schema";
import { getStatusColor, getStatusLabel } from "./constants";

interface PaginatedBookingsResponse {
  data: Booking[];
  total: number;
  page: number;
  totalPages: number;
}

interface DashboardTabProps {
  adminToken: string;
  selectedTimeRange: string;
  onTimeRangeChange: (range: string) => void;
  onViewBooking: (bookingId: string) => void;
  onEditBooking: (bookingId: string) => void;
}

export function DashboardTab({
  adminToken,
  selectedTimeRange,
  onTimeRangeChange,
  onViewBooking,
  onEditBooking,
}: DashboardTabProps) {
  // Fetch stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/admin/stats', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/stats?period=${selectedTimeRange}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!response.ok) {
        let errorMessage = 'Error fetching stats';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        const error: Record<string, unknown> = new Error(errorMessage) as unknown as Record<string, unknown>;
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    retry: (failureCount, error: unknown) => {
      if ((error as Record<string, unknown>)?.status === 401) return false;
      return failureCount < 2;
    },
  });

  // Fetch recent bookings
  const { data: recentResponse, isLoading: recentLoading, error: recentError } = useQuery<PaginatedBookingsResponse>({
    queryKey: ['/api/admin/bookings', 'recent'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!response.ok) {
        const err: Record<string, unknown> = new Error('Error fetching recent bookings') as unknown as Record<string, unknown>;
        err.status = response.status;
        throw err;
      }
      return response.json();
    },
    retry: (failureCount, error: unknown) => {
      if ((error as Record<string, unknown>)?.status === 401) return false;
      return failureCount < 2;
    },
  });
  const recentBookings = recentResponse?.data || [];

  // Fetch upcoming bookings
  const { data: upcomingResponse, isLoading: upcomingLoading, error: upcomingError } = useQuery<PaginatedBookingsResponse>({
    queryKey: ['/api/admin/bookings', 'upcoming'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        sortBy: 'startTime',
        sortOrder: 'asc',
      });
      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!response.ok) {
        const err: Record<string, unknown> = new Error('Error fetching upcoming bookings') as unknown as Record<string, unknown>;
        err.status = response.status;
        throw err;
      }
      const result: PaginatedBookingsResponse = await response.json();
      result.data = result.data.filter((b: Booking) =>
        new Date(b.startTime) > new Date() &&
        (b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending_payment')
      );
      return result;
    },
    retry: (failureCount, error: unknown) => {
      if ((error as Record<string, unknown>)?.status === 401) return false;
      return failureCount < 2;
    },
  });
  const upcomingBookings = upcomingResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Periodo:</span>
        {["today", "week", "month"].map((range) => (
          <button
            key={range}
            onClick={() => onTimeRangeChange(range)}
            className={`px-3 py-1 text-sm rounded-md ${
              selectedTimeRange === range
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
            data-testid={`filter-${range}`}
          >
            {range === "today" ? "Hoy" : range === "week" ? "Semana" : "Mes"}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : statsError ? "Error" : stats?.bookingsCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedTimeRange === "today" ? "Hoy" : selectedTimeRange === "week" ? "Esta semana" : "Este mes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : statsError ? "Error" :
                `${"\u20AC"}${(stats?.revenue ?? 0).toFixed(2)}`
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedTimeRange === "today" ? "Hoy" : selectedTimeRange === "week" ? "Esta semana" : "Este mes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barcos Disponibles</CardTitle>
            <Anchor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : statsError ? "Error" :
                `${stats?.availableBoats ?? 0}/${stats?.totalBoats ?? 0}`
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Ahora mismo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Ocupacion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : statsError ? "Error" :
                (stats?.totalBoats ?? 0) > 0
                  ? `${Math.round((((stats?.totalBoats ?? 0) - (stats?.availableBoats ?? 0)) / (stats?.totalBoats ?? 1)) * 100)}%`
                  : "0%"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Ahora mismo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando reservas...</div>
          ) : recentError ? (
            <div className="text-center py-8 text-red-500">Error cargando reservas</div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay reservas recientes</div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking: Booking) => (
                <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.customerName} {booking.customerSurname}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(booking.bookingDate), 'dd/MM/yyyy')} - {booking.totalHours}h
                        </p>
                      </div>
                      <Badge variant={getStatusColor(booking.bookingStatus) as "default" | "secondary" | "outline" | "destructive"}>
                        {getStatusLabel(booking.bookingStatus)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-gray-900">{"\u20AC"}{booking.totalAmount}</span>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewBooking(booking.id)}
                        data-testid={`button-view-${booking.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditBooking(booking.id)}
                        data-testid={`button-edit-${booking.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Proximas Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando reservas...</div>
          ) : upcomingError ? (
            <div className="text-center py-8 text-red-500">Error cargando reservas</div>
          ) : upcomingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay reservas proximas</div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking: Booking) => (
                <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 rounded-lg gap-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.customerName} {booking.customerSurname}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(booking.startTime), 'dd/MM/yyyy HH:mm')} - {booking.totalHours}h
                        </p>
                      </div>
                      <Badge variant={getStatusColor(booking.bookingStatus) as "default" | "secondary" | "outline" | "destructive"}>
                        {getStatusLabel(booking.bookingStatus)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-gray-900">{"\u20AC"}{booking.totalAmount}</span>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewBooking(booking.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
