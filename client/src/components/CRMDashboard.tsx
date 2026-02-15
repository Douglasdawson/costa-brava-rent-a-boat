import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Booking } from "@shared/schema";

// Import modularized CRM components
import {
  AdminLayout,
  DashboardTab,
  CalendarTab,
  BookingsTab,
  CustomersTab,
  FleetManagement,
  EmployeeManagement,
  GalleryManagement,
  GiftCardManagement,
  DiscountManagement,
  MaintenanceTab,
  InventoryTab,
  ReportsTab,
  BookingDetailsModal,
  getStatusLabel,
} from "./crm";

interface PaginatedBookingsResponse {
  data: Booking[];
  total: number;
  page: number;
  totalPages: number;
}

interface CRMDashboardProps {
  adminToken: string;
}

export default function CRMDashboard({ adminToken }: CRMDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");
  const adminRole = sessionStorage.getItem("adminRole") || "admin";
  const adminUsername = sessionStorage.getItem("adminUsername") || "Admin";

  // Booking details modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  const { toast } = useToast();

  // Logout handler
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("adminToken");
    window.location.href = "/";
  }, []);

  // Open WhatsApp chat with customer
  const openWhatsApp = useCallback((phone: string, customerName: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
    const message = encodeURIComponent(`Hola ${customerName}, le contactamos desde Costa Brava Rent a Boat respecto a su reserva.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  }, []);

  // Handle new booking button
  const handleNewBooking = useCallback(() => {
    setSelectedBooking(null);
    setIsCreatingBooking(true);
    setIsEditing(true);
    setShowBookingDetails(true);
  }, []);

  // Handle new booking with pre-filled data from calendar slot click
  const handleNewBookingWithData = useCallback((_data: {
    boatId: string;
    startTime: string;
    endTime: string;
  }) => {
    // Open create booking modal - data is for future form pre-fill support
    setSelectedBooking(null);
    setIsCreatingBooking(true);
    setIsEditing(true);
    setShowBookingDetails(true);
  }, []);

  // Handle view booking from dashboard or bookings tab
  const handleViewBooking = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
    setIsEditing(false);
    setIsCreatingBooking(false);
  }, []);

  // Handle view booking by ID (from dashboard)
  const handleViewBookingById = useCallback((bookingId: string) => {
    // Fetch the booking data via API
    fetch(`/api/admin/bookings?search=${bookingId}&limit=1`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
      .then(res => res.json())
      .then((result: PaginatedBookingsResponse) => {
        const booking = result.data?.[0];
        if (booking) {
          setSelectedBooking(booking);
          setShowBookingDetails(true);
          setIsEditing(false);
          setIsCreatingBooking(false);
        }
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la reserva",
        });
      });
  }, [adminToken, toast]);

  // Handle edit booking by ID (from dashboard)
  const handleEditBookingById = useCallback((bookingId: string) => {
    fetch(`/api/admin/bookings?search=${bookingId}&limit=1`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
      .then(res => res.json())
      .then((result: PaginatedBookingsResponse) => {
        const booking = result.data?.[0];
        if (booking) {
          setSelectedBooking(booking);
          setShowBookingDetails(true);
          setIsEditing(true);
          setIsCreatingBooking(false);
        }
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la reserva",
        });
      });
  }, [adminToken, toast]);

  // Handle customer "view bookings" action - switch to bookings tab with search
  const handleViewCustomerBookings = useCallback((phone: string) => {
    setSelectedTab("bookings");
    // The BookingsTab manages its own search state internally,
    // so we switch tab and let the user search manually
  }, []);

  // Export bookings to CSV (fetches ALL matching bookings)
  const handleExportCSV = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '10000',
        sortBy: 'startTime',
        sortOrder: 'desc',
      });

      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (!response.ok) {
        throw new Error('Error al obtener reservas para exportar');
      }

      const result: PaginatedBookingsResponse = await response.json();
      const dataToExport = result.data;

      if (dataToExport.length === 0) {
        toast({
          variant: "destructive",
          title: "Sin datos",
          description: "No hay reservas para exportar",
        });
        return;
      }

      const headers = [
        "ID", "Fecha", "Hora Inicio", "Hora Fin", "Cliente", "Apellidos",
        "Telefono", "Email", "Nacionalidad", "Personas", "Barco",
        "Horas", "Subtotal", "Extras", "Deposito", "Total",
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
        title: "Exportacion completada",
        description: `${dataToExport.length} reservas exportadas a CSV`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: message,
      });
    }
  }, [adminToken, toast]);

  return (
    <>
      <AdminLayout
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        adminRole={adminRole}
        adminUsername={adminUsername}
        onLogout={handleLogout}
        onExportCSV={handleExportCSV}
        onNewBooking={handleNewBooking}
      >
        {/* Dashboard Tab */}
        {selectedTab === "dashboard" && (
          <DashboardTab
            adminToken={adminToken}
            selectedTimeRange={selectedTimeRange}
            onTimeRangeChange={setSelectedTimeRange}
            onViewBooking={handleViewBookingById}
            onEditBooking={handleEditBookingById}
          />
        )}

        {/* Calendar Tab */}
        {selectedTab === "calendar" && (
          <CalendarTab
            adminToken={adminToken}
            onViewBooking={handleViewBooking}
            onNewBooking={handleNewBooking}
            onNewBookingWithData={handleNewBookingWithData}
          />
        )}

        {/* Bookings Tab */}
        {selectedTab === "bookings" && (
          <BookingsTab
            adminToken={adminToken}
            onViewBooking={handleViewBooking}
            onOpenWhatsApp={openWhatsApp}
          />
        )}

        {/* Customers Tab */}
        {selectedTab === "customers" && (
          <CustomersTab
            adminToken={adminToken}
            onViewCustomerBookings={handleViewCustomerBookings}
            onOpenWhatsApp={openWhatsApp}
          />
        )}

        {/* Fleet Tab */}
        {selectedTab === "fleet" && (
          <FleetManagement adminToken={adminToken} />
        )}

        {/* Maintenance Tab */}
        {selectedTab === "maintenance" && (
          <MaintenanceTab adminToken={adminToken} />
        )}

        {/* Inventory Tab */}
        {selectedTab === "inventory" && (
          <InventoryTab adminToken={adminToken} />
        )}

        {/* Reports Tab */}
        {selectedTab === "reports" && (
          <ReportsTab adminToken={adminToken} />
        )}

        {/* Gallery Tab */}
        {selectedTab === "gallery" && (
          <GalleryManagement adminToken={adminToken} />
        )}

        {/* Gift Cards Tab */}
        {selectedTab === "giftcards" && (
          <GiftCardManagement adminToken={adminToken} />
        )}

        {/* Discounts Tab */}
        {selectedTab === "discounts" && (
          <DiscountManagement adminToken={adminToken} />
        )}

        {/* Employees Tab */}
        {selectedTab === "employees" && (
          <EmployeeManagement adminToken={adminToken} />
        )}
      </AdminLayout>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        open={showBookingDetails}
        onOpenChange={setShowBookingDetails}
        booking={selectedBooking}
        isEditing={isEditing}
        isCreating={isCreatingBooking}
        adminToken={adminToken}
        onEditStart={() => setIsEditing(true)}
        onEditCancel={() => {
          setIsEditing(false);
          setIsCreatingBooking(false);
        }}
        onOpenWhatsApp={openWhatsApp}
      />
    </>
  );
}
