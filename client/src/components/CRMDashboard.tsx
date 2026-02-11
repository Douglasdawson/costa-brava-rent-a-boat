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
  Eye,
  Edit,
  LogOut,
  Search,
  X,
  Check,
  Save,
  Download,
  Plus,
  MessageCircle,
  Camera,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Booking } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

// Import from CRM module
import { FleetManagement, EmployeeManagement, GalleryManagement, editBookingSchema, type EditBookingFormData } from "./crm";

interface CRMDashboardProps {
  adminToken: string;
}

export default function CRMDashboard({ adminToken }: CRMDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const adminRole = sessionStorage.getItem("adminRole") || "admin";
  const adminUsername = sessionStorage.getItem("adminUsername") || "Admin";
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const { toast } = useToast();

  // Form for editing bookings
  const editForm = useForm<EditBookingFormData>({
    resolver: zodResolver(editBookingSchema),
  });

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

  // Fetch all customers
  const { data: customersData, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ['/api/admin/customers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/customers', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (!response.ok) {
        let errorMessage = 'Error fetching customers';
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
    const error = statsError || bookingsError || customersError;
    if (error && (error as any)?.status === 401) {
      toast({
        variant: "destructive",
        title: "Sesión expirada",
        description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
      });
      // Delay logout slightly to ensure toast is shown
      setTimeout(handleLogout, 1000);
    }
  }, [statsError, bookingsError, customersError, toast]);

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

  useEffect(() => {
    if (customersError && (customersError as any)?.status !== 401) {
      toast({
        variant: "destructive",
        title: "Error cargando clientes",
        description: customersError.message || "No se pudieron cargar los clientes. Intenta recargar la página.",
      });
    }
  }, [customersError, toast]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    window.location.href = "/";
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

  // Mutation for full booking edit
  const editBookingMutation = useMutation({
    mutationFn: async ({ bookingId, data }: { bookingId: string; data: EditBookingFormData }) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar la reserva');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      toast({
        title: "Reserva actualizada",
        description: "Los cambios se han guardado correctamente",
      });
      setIsEditing(false);
      setShowBookingDetails(false);
      setSelectedBooking(null);
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
        setIsEditing(false);
      }
    } else if (action === "edit") {
      // Find the booking and open edit mode
      const booking = bookingsData?.find((b: Booking) => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setShowBookingDetails(true);
        setIsEditing(true);
        // Populate form with booking data
        editForm.reset({
          customerName: booking.customerName,
          customerSurname: booking.customerSurname,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail || "",
          customerNationality: booking.customerNationality,
          numberOfPeople: booking.numberOfPeople,
          boatId: booking.boatId,
          startTime: format(new Date(booking.startTime), "yyyy-MM-dd'T'HH:mm"),
          endTime: format(new Date(booking.endTime), "yyyy-MM-dd'T'HH:mm"),
          totalHours: booking.totalHours,
          subtotal: booking.subtotal,
          extrasTotal: booking.extrasTotal,
          deposit: booking.deposit,
          totalAmount: booking.totalAmount,
          bookingStatus: booking.bookingStatus as any,
          paymentStatus: booking.paymentStatus as any,
          notes: booking.notes || "",
        });
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
    }
  };

  const handleEditSubmit = (data: EditBookingFormData) => {
    if (selectedBooking) {
      editBookingMutation.mutate({
        bookingId: selectedBooking.id,
        data
      });
    }
  };

  const handleCreateSubmit = (data: EditBookingFormData) => {
    createBookingMutation.mutate(data);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreatingBooking(false);
    editForm.reset();
  };

  // Mutation for creating a new booking
  const createBookingMutation = useMutation({
    mutationFn: async (data: EditBookingFormData) => {
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...data,
          bookingDate: startDate.toISOString(),
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          source: 'admin',
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear la reserva');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      toast({
        title: "Reserva creada",
        description: "La nueva reserva se ha creado correctamente",
      });
      setIsCreatingBooking(false);
      setIsEditing(false);
      setShowBookingDetails(false);
      setSelectedBooking(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear la reserva",
      });
    }
  });

  // Handle new booking button
  const handleNewBooking = () => {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setHours(10, 0, 0, 0);
    if (defaultStart < now) defaultStart.setDate(defaultStart.getDate() + 1);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultStart.getHours() + 2);

    editForm.reset({
      customerName: "",
      customerSurname: "",
      customerPhone: "",
      customerEmail: "",
      customerNationality: "ES",
      numberOfPeople: 1,
      boatId: "",
      startTime: format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
      totalHours: 2,
      subtotal: "0",
      extrasTotal: "0",
      deposit: "0",
      totalAmount: "0",
      bookingStatus: "draft",
      paymentStatus: "pending",
      notes: "",
    });
    setSelectedBooking(null);
    setIsCreatingBooking(true);
    setIsEditing(true);
    setShowBookingDetails(true);
  };

  // Export bookings to CSV
  const handleExportCSV = () => {
    if (!bookingsData || bookingsData.length === 0) {
      toast({
        variant: "destructive",
        title: "Sin datos",
        description: "No hay reservas para exportar",
      });
      return;
    }

    let dataToExport = bookingsData;
    if (statusFilter !== "all") {
      dataToExport = dataToExport.filter((b: Booking) => b.bookingStatus === statusFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      dataToExport = dataToExport.filter((b: Booking) =>
        b.customerName.toLowerCase().includes(query) ||
        b.customerSurname.toLowerCase().includes(query) ||
        b.customerEmail?.toLowerCase().includes(query) ||
        b.customerPhone.toLowerCase().includes(query)
      );
    }

    const headers = [
      "ID", "Fecha", "Hora Inicio", "Hora Fin", "Cliente", "Apellidos",
      "Teléfono", "Email", "Nacionalidad", "Personas", "Barco",
      "Horas", "Subtotal", "Extras", "Depósito", "Total",
      "Estado Reserva", "Estado Pago", "Fuente", "Notas"
    ];

    const rows = dataToExport.map((b: Booking) => [
      b.id,
      format(new Date(b.bookingDate), 'dd/MM/yyyy'),
      format(new Date(b.startTime), 'dd/MM/yyyy HH:mm'),
      format(new Date(b.endTime), 'dd/MM/yyyy HH:mm'),
      b.customerName,
      b.customerSurname,
      b.customerPhone,
      b.customerEmail || "",
      b.customerNationality,
      b.numberOfPeople,
      b.boatId,
      b.totalHours,
      b.subtotal,
      b.extrasTotal,
      b.deposit,
      b.totalAmount,
      getStatusLabel(b.bookingStatus),
      b.paymentStatus === 'completed' ? 'Pagado' : b.paymentStatus === 'pending' ? 'Pendiente' : b.paymentStatus,
      b.source,
      (b.notes || "").replace(/"/g, '""'),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: (string | number)[]) => row.map((cell: string | number) => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportación completada",
      description: `${dataToExport.length} reservas exportadas a CSV`,
    });
  };

  // Open WhatsApp chat with customer
  const openWhatsApp = (phone: string, customerName: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
    const message = encodeURIComponent(`Hola ${customerName}, le contactamos desde Costa Brava Rent a Boat respecto a su reserva.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Process bookings data
  const recentBookings = bookingsData?.slice(0, 10) || [];
  const upcomingBookings = bookingsData?.filter((b: any) => 
    new Date(b.startTime) > new Date() && 
    (b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending_payment')
  ).slice(0, 10) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile optimized */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Anchor className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">CRM Costa Brava</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{adminUsername} ({adminRole === "admin" ? "Administrador" : "Empleado"})</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:space-x-4">
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout" size="sm" className="sm:h-10">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
            <Button variant="outline" onClick={handleExportCSV} data-testid="button-export-data" size="sm" className="hidden sm:flex sm:h-10">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={handleNewBooking} data-testid="button-new-booking" size="sm" className="sm:h-10">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva Reserva</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs - Mobile optimized */}
        <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "bookings", label: "Reservas", icon: Calendar },
            ...(adminRole === "admin" ? [
              { id: "customers", label: "Clientes", icon: Users },
              { id: "fleet", label: "Flota", icon: Anchor },
              { id: "gallery", label: "Galeria", icon: Camera },
              { id: "employees", label: "Equipo", icon: Users },
            ] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-w-[44px] ${
                selectedTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm sm:text-base">{tab.label}</span>
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

            {/* Bookings Table - Responsive */}
            {/* Desktop Table View */}
            <Card className="hidden md:block">
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
                                <div className="flex justify-end space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openWhatsApp(booking.customerPhone, booking.customerName)}
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4 text-green-600" />
                                  </Button>
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              <div className="text-sm font-medium text-gray-600 px-1">
                Todas las Reservas
              </div>
              {bookingsLoading ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    Cargando reservas...
                  </CardContent>
                </Card>
              ) : bookingsError ? (
                <Card>
                  <CardContent className="py-12 text-center text-red-500">
                    Error cargando reservas
                  </CardContent>
                </Card>
              ) : (() => {
                let filteredBookings = bookingsData || [];
                
                if (statusFilter !== "all") {
                  filteredBookings = filteredBookings.filter((b: Booking) => 
                    b.bookingStatus === statusFilter
                  );
                }
                
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
                    <Card>
                      <CardContent className="py-12 text-center text-gray-500">
                        No se encontraron reservas
                      </CardContent>
                    </Card>
                  );
                }

                return filteredBookings.map((booking: Booking) => (
                  <Card key={booking.id} data-testid={`card-booking-${booking.id}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">
                            {booking.customerName} {booking.customerSurname}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(booking.startTime), 'dd/MM/yy HH:mm')} - {booking.totalHours}h
                          </p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant={getStatusColor(booking.bookingStatus)} className="text-xs">
                              {getStatusLabel(booking.bookingStatus)}
                            </Badge>
                            <Badge variant={booking.paymentStatus === 'completed' ? 'default' : 'outline'} className="text-xs">
                              {booking.paymentStatus === 'completed' ? 'Pagado' : 
                               booking.paymentStatus === 'pending' ? 'Pendiente' :
                               booking.paymentStatus === 'failed' ? 'Fallido' : 'Reembolsado'}
                            </Badge>
                          </div>
                        </div>
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
                      <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 mt-3">
                        <div>
                          <span className="text-gray-600">Barco:</span>
                          <span className="ml-1 font-medium">{booking.boatId}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">Total:</span>
                          <span className="ml-1 font-semibold text-base">
                            €{parseFloat(booking.totalAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600 text-xs">{booking.customerPhone}</span>
                          {booking.customerEmail && (
                            <span className="text-gray-600 text-xs ml-2">{booking.customerEmail}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {selectedTab === "customers" && (
          <div className="space-y-6">
            {/* Customers Table - Responsive */}
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Todos los Clientes</CardTitle>
                <p className="text-sm text-gray-600">
                  Lista de clientes únicos extraídos de las reservas
                </p>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div className="text-center py-12 text-gray-500">Cargando clientes...</div>
                ) : customersError ? (
                  <div className="text-center py-12 text-red-500">Error cargando clientes</div>
                ) : !customersData || customersData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No hay clientes registrados</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead>Nacionalidad</TableHead>
                          <TableHead>Reservas</TableHead>
                          <TableHead>Gasto Total</TableHead>
                          <TableHead>Última Reserva</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customersData.map((customer: any, index: number) => (
                          <TableRow key={index} data-testid={`row-customer-${index}`}>
                            <TableCell className="font-medium">
                              {customer.customerName} {customer.customerSurname}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              <div>{customer.customerPhone}</div>
                              {customer.customerEmail && (
                                <div className="text-xs">{customer.customerEmail}</div>
                              )}
                            </TableCell>
                            <TableCell>{customer.customerNationality}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {customer.bookingsCount} {customer.bookingsCount === 1 ? 'reserva' : 'reservas'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              €{customer.totalSpent.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {format(new Date(customer.lastBookingDate), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openWhatsApp(customer.customerPhone, customer.customerName)}
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSearchQuery(customer.customerPhone);
                                    setSelectedTab("bookings");
                                  }}
                                  title="Ver reservas"
                                  data-testid={`button-view-customer-${index}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              <div className="text-sm font-medium text-gray-600 px-1">
                Todos los Clientes
              </div>
              {customersLoading ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    Cargando clientes...
                  </CardContent>
                </Card>
              ) : customersError ? (
                <Card>
                  <CardContent className="py-12 text-center text-red-500">
                    Error cargando clientes
                  </CardContent>
                </Card>
              ) : !customersData || customersData.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    No hay clientes registrados
                  </CardContent>
                </Card>
              ) : (
                customersData.map((customer: any, index: number) => (
                  <Card key={index} data-testid={`card-customer-${index}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">
                            {customer.customerName} {customer.customerSurname}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{customer.customerNationality}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {customer.bookingsCount} {customer.bookingsCount === 1 ? 'reserva' : 'reservas'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openWhatsApp(customer.customerPhone, customer.customerName)}
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchQuery(customer.customerPhone);
                              setSelectedTab("bookings");
                            }}
                            title="Ver reservas"
                            data-testid={`button-view-customer-${index}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 mt-3">
                        <div>
                          <span className="text-gray-600">Gasto Total:</span>
                          <span className="ml-1 font-semibold">€{customer.totalSpent.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">Última Reserva:</span>
                          <span className="ml-1 font-medium text-xs">
                            {format(new Date(customer.lastBookingDate), 'dd/MM/yy')}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600 text-xs">{customer.customerPhone}</span>
                          {customer.customerEmail && (
                            <span className="text-gray-600 text-xs ml-2">{customer.customerEmail}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {customersLoading ? "..." : customersError ? "Error" : customersData?.length ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clientes únicos registrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mejor Cliente</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {customersLoading ? "..." : customersError ? "Error" : 
                      customersData && customersData.length > 0 
                        ? `${customersData[0].customerName} ${customersData[0].customerSurname}`
                        : "N/A"
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {customersData && customersData.length > 0 
                      ? `€${customersData[0].totalSpent.toFixed(2)} gastados`
                      : "Sin datos"
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Promedio por Cliente</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {customersLoading ? "..." : customersError ? "Error" : 
                      customersData && customersData.length > 0
                        ? `€${(customersData.reduce((sum: number, c: any) => sum + c.totalSpent, 0) / customersData.length).toFixed(2)}`
                        : "€0.00"
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gasto promedio por cliente
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Fleet Tab */}
        {selectedTab === "fleet" && (
          <FleetManagement adminToken={adminToken} />
        )}

        {/* Gallery Tab */}
        {selectedTab === "gallery" && (
          <GalleryManagement adminToken={adminToken} />
        )}

        {/* Employees Tab */}
        {selectedTab === "employees" && (
          <EmployeeManagement adminToken={adminToken} />
        )}
      </div>

      {/* Booking Details Modal */}
      <Dialog open={showBookingDetails} onOpenChange={(open) => {
        setShowBookingDetails(open);
        if (!open) {
          setIsCreatingBooking(false);
          setIsEditing(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreatingBooking ? "Nueva Reserva" : isEditing ? "Editar Reserva" : "Detalles de la Reserva"}</DialogTitle>
            <DialogDescription>
              {isCreatingBooking ? "Crear reserva manualmente desde el CRM" : `ID: ${selectedBooking?.id}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && !isEditing && (
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
                  <Button
                    variant="outline"
                    className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => openWhatsApp(selectedBooking.customerPhone, selectedBooking.customerName)}
                    data-testid="button-whatsapp-booking"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
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

          {/* Edit / Create Form */}
          {(isCreatingBooking || (selectedBooking && isEditing)) && (
            <form onSubmit={editForm.handleSubmit(isCreatingBooking ? handleCreateSubmit : handleEditSubmit)} className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Nombre</Label>
                    <Input
                      id="customerName"
                      autoComplete="given-name"
                      {...editForm.register("customerName")}
                      data-testid="input-customer-name"
                    />
                    {editForm.formState.errors.customerName && (
                      <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.customerName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerSurname">Apellidos</Label>
                    <Input
                      id="customerSurname"
                      autoComplete="family-name"
                      {...editForm.register("customerSurname")}
                      data-testid="input-customer-surname"
                    />
                    {editForm.formState.errors.customerSurname && (
                      <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.customerSurname.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Teléfono</Label>
                    <Input
                      id="customerPhone"
                      autoComplete="tel"
                      {...editForm.register("customerPhone")}
                      data-testid="input-customer-phone"
                    />
                    {editForm.formState.errors.customerPhone && (
                      <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.customerPhone.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email (opcional)</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      autoComplete="email"
                      {...editForm.register("customerEmail")}
                      data-testid="input-customer-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerNationality">Nacionalidad</Label>
                    <Input
                      id="customerNationality"
                      {...editForm.register("customerNationality")}
                      data-testid="input-customer-nationality"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfPeople">Número de Personas</Label>
                    <Input
                      id="numberOfPeople"
                      type="number"
                      {...editForm.register("numberOfPeople")}
                      data-testid="input-number-people"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Detalles de la Reserva</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="boatId">Barco</Label>
                    <Input
                      id="boatId"
                      {...editForm.register("boatId")}
                      data-testid="input-boat-id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalHours">Horas Totales</Label>
                    <Input
                      id="totalHours"
                      type="number"
                      {...editForm.register("totalHours")}
                      data-testid="input-total-hours"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Fecha y Hora de Inicio</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      {...editForm.register("startTime")}
                      data-testid="input-start-time"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Fecha y Hora de Fin</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      {...editForm.register("endTime")}
                      data-testid="input-end-time"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bookingStatus">Estado de Reserva</Label>
                    <Select
                      value={editForm.watch("bookingStatus")}
                      onValueChange={(value) => editForm.setValue("bookingStatus", value as any)}
                    >
                      <SelectTrigger data-testid="select-booking-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="hold">En Espera</SelectItem>
                        <SelectItem value="pending_payment">Pendiente de Pago</SelectItem>
                        <SelectItem value="confirmed">Confirmada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentStatus">Estado de Pago</Label>
                    <Select
                      value={editForm.watch("paymentStatus")}
                      onValueChange={(value) => editForm.setValue("paymentStatus", value as any)}
                    >
                      <SelectTrigger data-testid="select-payment-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="failed">Fallido</SelectItem>
                        <SelectItem value="refunded">Reembolsado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Información de Pago</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subtotal">Subtotal (€)</Label>
                    <Input
                      id="subtotal"
                      {...editForm.register("subtotal")}
                      data-testid="input-subtotal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="extrasTotal">Extras (€)</Label>
                    <Input
                      id="extrasTotal"
                      {...editForm.register("extrasTotal")}
                      data-testid="input-extras-total"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deposit">Depósito (€)</Label>
                    <Input
                      id="deposit"
                      {...editForm.register("deposit")}
                      data-testid="input-deposit"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalAmount">Total (€)</Label>
                    <Input
                      id="totalAmount"
                      {...editForm.register("totalAmount")}
                      data-testid="input-total-amount"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  {...editForm.register("notes")}
                  rows={3}
                  data-testid="input-notes"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isCreatingBooking ? createBookingMutation.isPending : editBookingMutation.isPending}
                  data-testid="button-save-booking"
                >
                  {(isCreatingBooking ? createBookingMutation.isPending : editBookingMutation.isPending) ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isCreatingBooking ? "Crear Reserva" : "Guardar Cambios"}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isCreatingBooking ? createBookingMutation.isPending : editBookingMutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
          
          <DialogFooter>
            {!isEditing && (
              <Button variant="outline" onClick={() => setShowBookingDetails(false)} data-testid="button-close-modal">
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
