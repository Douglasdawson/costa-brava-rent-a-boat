import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  Euro, 
  TrendingUp, 
  Clock, 
  Anchor,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  LogOut
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CRMDashboardProps {
  adminToken: string;
}

export default function CRMDashboard({ adminToken }: CRMDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");
  const { toast } = useToast();

  // Fetch stats with authentication
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/admin/stats', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/stats?period=${selectedTimeRange}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (!response.ok) {
        let errorMessage = 'Error fetching stats';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        const error: any = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401 - it means session expired
      if (error?.status === 401) return false;
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });

  // Fetch all bookings
  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: ['/api/admin/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (!response.ok) {
        let errorMessage = 'Error fetching bookings';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        const error: any = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
  });

  // Handle authentication errors - logout if 401
  useEffect(() => {
    const error = statsError || bookingsError;
    if (error && (error as any)?.status === 401) {
      toast({
        variant: "destructive",
        title: "Sesión expirada",
        description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
      });
      // Delay logout slightly to ensure toast is shown
      setTimeout(handleLogout, 1000);
    }
  }, [statsError, bookingsError, toast]);

  // Show error toasts for non-auth errors
  useEffect(() => {
    if (statsError && (statsError as any)?.status !== 401) {
      toast({
        variant: "destructive",
        title: "Error cargando estadísticas",
        description: statsError.message || "No se pudieron cargar las estadísticas. Intenta recargar la página.",
      });
    }
  }, [statsError, toast]);

  useEffect(() => {
    if (bookingsError && (bookingsError as any)?.status !== 401) {
      toast({
        variant: "destructive",
        title: "Error cargando reservas",
        description: bookingsError.message || "No se pudieron cargar las reservas. Intenta recargar la página.",
      });
    }
  }, [bookingsError, toast]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    window.location.reload();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "confirmed": return "default";
      case "pending_payment": return "secondary";
      case "hold": return "outline";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case "confirmed": return "Confirmada";
      case "pending_payment": return "Pendiente Pago";
      case "hold": return "En Espera";
      case "cancelled": return "Cancelada";
      case "draft": return "Borrador";
      default: return status;
    }
  };

  const handleBookingAction = (action: string, bookingId: string) => {
    console.log(`${action} action for booking:`, bookingId);
    toast({
      title: "Funcionalidad en desarrollo",
      description: `Acción "${action}" para reserva ${bookingId}`,
    });
  };

  // Process bookings data
  const recentBookings = bookingsData?.slice(0, 10) || [];
  const upcomingBookings = bookingsData?.filter((b: any) => 
    new Date(b.startTime) > new Date() && 
    (b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending_payment')
  ).slice(0, 10) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Anchor className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CRM Costa Brava Rent a Boat Blanes</h1>
              <p className="text-sm text-gray-600">Sistema de gestión de reservas</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
            <Button variant="outline" data-testid="button-export-data">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button data-testid="button-new-booking">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Reserva
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 mt-6">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "bookings", label: "Reservas", icon: Calendar },
            { id: "customers", label: "Clientes", icon: Users },
            { id: "fleet", label: "Flota", icon: Anchor },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 font-medium rounded-lg transition-colors ${
                selectedTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Dashboard Tab */}
        {selectedTab === "dashboard" && (
          <div className="space-y-6">
            {/* Time range selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Periodo:</span>
              {["today", "week", "month"].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
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
                      `€${(stats?.revenue ?? 0).toFixed(2)}`
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
                  <CardTitle className="text-sm font-medium">Tasa Ocupación</CardTitle>
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
                {bookingsLoading ? (
                  <div className="text-center py-8 text-gray-500">Cargando reservas...</div>
                ) : bookingsError ? (
                  <div className="text-center py-8 text-red-500">Error cargando reservas</div>
                ) : recentBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No hay reservas recientes</div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                            <Badge variant={getStatusColor(booking.bookingStatus)}>
                              {getStatusLabel(booking.bookingStatus)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-gray-900">€{booking.totalAmount}</span>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleBookingAction("view", booking.id)}
                              data-testid={`button-view-${booking.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleBookingAction("edit", booking.id)}
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
                <CardTitle>Próximas Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-8 text-gray-500">Cargando reservas...</div>
                ) : bookingsError ? (
                  <div className="text-center py-8 text-red-500">Error cargando reservas</div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No hay reservas próximas</div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
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
                            <Badge variant={getStatusColor(booking.bookingStatus)}>
                              {getStatusLabel(booking.bookingStatus)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-gray-900">€{booking.totalAmount}</span>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleBookingAction("view", booking.id)}
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
        )}

        {/* Other Tabs */}
        {selectedTab !== "dashboard" && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sección en Desarrollo
                </h3>
                <p className="text-gray-600 mb-6">
                  La sección "{selectedTab}" estará disponible próximamente.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTab("dashboard")}
                  data-testid="button-back-dashboard"
                >
                  Volver al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
