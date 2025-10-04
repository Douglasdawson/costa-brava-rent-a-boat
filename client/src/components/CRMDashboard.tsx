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
  LogOut,
  Search,
  X,
  Check
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Booking } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface CRMDashboardProps {
  adminToken: string;
}

export default function CRMDashboard({ adminToken }: CRMDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
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

  // Mutation para actualizar el estado de la reserva
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, updates }: { bookingId: string; updates: any }) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || 'Error actualizando reserva');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Éxito",
        description: data.message || "Reserva actualizada correctamente",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setShowBookingDetails(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la reserva",
      });
    }
  });

  const handleBookingAction = (action: string, bookingId: string) => {
    if (action === "view") {
      // Find the booking and open details modal
      const booking = bookingsData?.find((b: Booking) => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setShowBookingDetails(true);
      }
    } else if (action === "confirm") {
      updateBookingMutation.mutate({
        bookingId,
        updates: {
          bookingStatus: "confirmed",
          paymentStatus: "completed"
        }
      });
    } else if (action === "cancel") {
      if (confirm("¿Estás seguro de que quieres cancelar esta reserva?")) {
        updateBookingMutation.mutate({
          bookingId,
          updates: {
            bookingStatus: "cancelled"
          }
        });
      }
    } else if (action === "edit") {
      toast({
        title: "Funcionalidad en desarrollo",
        description: "La edición de reservas estará disponible próximamente",
      });
    }
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

        {/* Bookings Tab */}
        {selectedTab === "bookings" && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nombre, email, tel\u00e9fono..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-bookings"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="pending_payment">Pendiente Pago</SelectItem>
                      <SelectItem value="hold">En Espera</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="draft">Borrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bookings Table */}
            <Card>
              <CardHeader>
                <CardTitle>Todas las Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-12 text-gray-500">Cargando reservas...</div>
                ) : bookingsError ? (
                  <div className="text-center py-12 text-red-500">Error cargando reservas</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead>Barco</TableHead>
                          <TableHead>Horas</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Pago</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          let filteredBookings = bookingsData || [];
                          
                          // Filter by status
                          if (statusFilter !== "all") {
                            filteredBookings = filteredBookings.filter((b: Booking) => 
                              b.bookingStatus === statusFilter
                            );
                          }
                          
                          // Filter by search query
                          if (searchQuery) {
                            const query = searchQuery.toLowerCase();
                            filteredBookings = filteredBookings.filter((b: Booking) => 
                              b.customerName.toLowerCase().includes(query) ||
                              b.customerSurname.toLowerCase().includes(query) ||
                              b.customerEmail?.toLowerCase().includes(query) ||
                              b.customerPhone.toLowerCase().includes(query)
                            );
                          }
                          
                          if (filteredBookings.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                  No se encontraron reservas con los filtros seleccionados
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          return filteredBookings.map((booking: Booking) => (
                            <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                              <TableCell className="font-medium">
                                {format(new Date(booking.startTime), 'dd/MM/yy HH:mm')}
                              </TableCell>
                              <TableCell>
                                {booking.customerName} {booking.customerSurname}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                <div>{booking.customerPhone}</div>
                                {booking.customerEmail && (
                                  <div className="text-xs">{booking.customerEmail}</div>
                                )}
                              </TableCell>
                              <TableCell>{booking.boatId}</TableCell>
                              <TableCell>{booking.totalHours}h</TableCell>
                              <TableCell className="font-semibold">
                                \u20ac{parseFloat(booking.totalAmount).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(booking.bookingStatus)}>
                                  {getStatusLabel(booking.bookingStatus)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={booking.paymentStatus === 'completed' ? 'default' : 'outline'}>
                                  {booking.paymentStatus === 'completed' ? 'Pagado' : 
                                   booking.paymentStatus === 'pending' ? 'Pendiente' :
                                   booking.paymentStatus === 'failed' ? 'Fallido' : 'Reembolsado'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowBookingDetails(true);
                                    }}
                                    data-testid={`button-view-${booking.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other Tabs - Customers and Fleet */}
        {(selectedTab === "customers" || selectedTab === "fleet") && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {selectedTab === "customers" ? <Users className="w-8 h-8 text-gray-400" /> : <Anchor className="w-8 h-8 text-gray-400" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sección en Desarrollo
                </h3>
                <p className="text-gray-600 mb-6">
                  La sección "{selectedTab === "customers" ? "Clientes" : "Flota"}" estará disponible próximamente.
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

      {/* Booking Details Modal */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Reserva</DialogTitle>
            <DialogDescription>
              ID: {selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Informaci\u00f3n del Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Nombre Completo</p>
                    <p className="font-medium">{selectedBooking.customerName} {selectedBooking.customerSurname}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tel\u00e9fono</p>
                    <p className="font-medium">{selectedBooking.customerPhone}</p>
                  </div>
                  {selectedBooking.customerEmail && (
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">{selectedBooking.customerEmail}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Nacionalidad</p>
                    <p className="font-medium">{selectedBooking.customerNationality}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">N\u00famero de Personas</p>
                    <p className="font-medium">{selectedBooking.numberOfPeople}</p>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Detalles de la Reserva</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Barco</p>
                    <p className="font-medium">{selectedBooking.boatId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fecha de Inicio</p>
                    <p className="font-medium">{format(new Date(selectedBooking.startTime), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fecha de Fin</p>
                    <p className="font-medium">{format(new Date(selectedBooking.endTime), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duraci\u00f3n</p>
                    <p className="font-medium">{selectedBooking.totalHours} horas</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Estado de Reserva</p>
                    <Badge variant={getStatusColor(selectedBooking.bookingStatus)}>
                      {getStatusLabel(selectedBooking.bookingStatus)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-600">Estado de Pago</p>
                    <Badge variant={selectedBooking.paymentStatus === 'completed' ? 'default' : 'outline'}>
                      {selectedBooking.paymentStatus === 'completed' ? 'Pagado' : 
                       selectedBooking.paymentStatus === 'pending' ? 'Pendiente' :
                       selectedBooking.paymentStatus === 'failed' ? 'Fallido' : 'Reembolsado'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Informaci\u00f3n de Pago</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Subtotal</p>
                    <p className="font-medium">\u20ac{parseFloat(selectedBooking.subtotal).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Extras</p>
                    <p className="font-medium">\u20ac{parseFloat(selectedBooking.extrasTotal).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Dep\u00f3sito</p>
                    <p className="font-medium">\u20ac{parseFloat(selectedBooking.deposit).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total</p>
                    <p className="font-semibold text-lg">\u20ac{parseFloat(selectedBooking.totalAmount).toFixed(2)}</p>
                  </div>
                  {selectedBooking.stripePaymentIntentId && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Stripe Payment Intent</p>
                      <p className="font-mono text-xs">{selectedBooking.stripePaymentIntentId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              {(selectedBooking.notes || selectedBooking.couponCode) && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Informaci\u00f3n Adicional</h3>
                  <div className="space-y-2 text-sm">
                    {selectedBooking.couponCode && (
                      <div>
                        <p className="text-gray-600">C\u00f3digo de Descuento</p>
                        <p className="font-medium">{selectedBooking.couponCode}</p>
                      </div>
                    )}
                    {selectedBooking.notes && (
                      <div>
                        <p className="text-gray-600">Notas</p>
                        <p className="font-medium">{selectedBooking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Acciones</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.bookingStatus === 'pending_payment' && (
                    <Button
                      variant="default"
                      onClick={() => handleBookingAction("confirm", selectedBooking.id)}
                      data-testid="button-confirm-booking"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar Reserva
                    </Button>
                  )}
                  {(selectedBooking.bookingStatus === 'confirmed' || selectedBooking.bookingStatus === 'pending_payment') && (
                    <Button
                      variant="destructive"
                      onClick={() => handleBookingAction("cancel", selectedBooking.id)}
                      data-testid="button-cancel-booking"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar Reserva
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleBookingAction("edit", selectedBooking.id)}
                    data-testid="button-edit-booking"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 border-t pt-4">
                <p>Creada: {format(new Date(selectedBooking.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                <p>Fuente: {selectedBooking.source === 'web' ? 'Web' : 'Admin'}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDetails(false)} data-testid="button-close-modal">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
