import { useState, useEffect } from "react";
import { EmptyState } from "./shared/EmptyState";
import { ErrorState } from "./shared/ErrorState";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useSortableTable } from "@/hooks/useSortableTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Eye,
  MessageCircle,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Booking, Boat } from "@shared/schema";
import { getStatusColor, getStatusLabel, getPaymentStatusColor, getPaymentStatusLabel } from "./constants";
import { PaginationControls } from "./shared/PaginationControls";
import { SortableTableHead } from "./shared/SortableTableHead";
import type { PaginatedResponse } from "./types";

type PaginatedBookingsResponse = PaginatedResponse<Booking>;

const BOOKINGS_PER_PAGE = 25;

interface BookingsTabProps {
  adminToken: string;
  onViewBooking: (booking: Booking) => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
}

export function BookingsTab({
  adminToken,
  onViewBooking,
  onOpenWhatsApp,
}: BookingsTabProps) {
  const { data: boats = [] } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const boatName = (id: string) => boats.find(b => b.id === id)?.name || id;

  const { searchQuery, debouncedSearch, handleSearchChange } = useDebounceSearch();
  const { currentPage, setCurrentPage, sortBy, sortOrder, handleSort } = useSortableTable("startTime", "desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, setCurrentPage]);

  // Fetch paginated bookings
  const { data: bookingsResponse, isLoading, error } = useQuery<PaginatedBookingsResponse>({
    queryKey: ['/api/admin/bookings', currentPage, debouncedSearch, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(BOOKINGS_PER_PAGE),
        sortBy,
        sortOrder,
      });
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        credentials: "include" as const
      });
      if (!response.ok) {
        let errorMessage = 'Error fetching bookings';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        const err: Record<string, unknown> = new Error(errorMessage) as unknown as Record<string, unknown>;
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

  const bookingsData = bookingsResponse?.data;
  const totalPages = bookingsResponse?.totalPages ?? 1;
  const total = bookingsResponse?.total ?? 0;


  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, email, teléfono..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
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

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todas las Reservas</CardTitle>
          <span className="text-sm text-muted-foreground">
            {total} reserva{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
          </span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <ErrorState message="Error al cargar reservas" />
          ) : !bookingsData || bookingsData.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No se encontraron reservas"
              description="Prueba a ajustar los filtros o crear una nueva reserva"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead field="startTime" currentField={sortBy} ascending={sortOrder === "asc"} onSort={handleSort}>
                      Fecha
                    </SortableTableHead>
                    <SortableTableHead field="customerName" currentField={sortBy} ascending={sortOrder === "asc"} onSort={handleSort}>
                      Cliente
                    </SortableTableHead>
                    <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                    <SortableTableHead field="boatId" currentField={sortBy} ascending={sortOrder === "asc"} onSort={handleSort}>
                      Barco
                    </SortableTableHead>
                    <TableHead className="hidden lg:table-cell">Horas</TableHead>
                    <SortableTableHead field="totalAmount" currentField={sortBy} ascending={sortOrder === "asc"} onSort={handleSort}>
                      Total
                    </SortableTableHead>
                    <SortableTableHead field="bookingStatus" currentField={sortBy} ascending={sortOrder === "asc"} onSort={handleSort}>
                      Estado
                    </SortableTableHead>
                    <TableHead className="hidden lg:table-cell">Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingsData.map((booking: Booking) => (
                    <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                      <TableCell className="font-medium">
                        {format(new Date(booking.startTime), 'dd/MM/yy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {booking.customerName} {booking.customerSurname}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        <div>{booking.customerPhone}</div>
                        {booking.customerEmail && (
                          <div className="text-xs">{booking.customerEmail}</div>
                        )}
                      </TableCell>
                      <TableCell>{boatName(booking.boatId)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{booking.totalHours}h</TableCell>
                      <TableCell className="font-semibold">
                        {"\u20AC"}{parseFloat(booking.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.bookingStatus)}>
                          {getStatusLabel(booking.bookingStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                          {getPaymentStatusLabel(booking.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenWhatsApp(booking.customerPhone, booking.customerName)}
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewBooking(booking)}
                            data-testid={`button-view-${booking.id}`}
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

          {/* Pagination Controls - Desktop */}
          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-sm font-medium text-muted-foreground">
            Todas las Reservas
          </div>
          <span className="text-xs text-muted-foreground">
            {total} resultado{total !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex gap-1.5 px-1 overflow-x-auto scrollbar-hide">
          {[
            { field: "startTime", label: "Fecha" },
            { field: "customerName", label: "Nombre" },
            { field: "totalAmount", label: "Importe" },
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                sortBy === field
                  ? "bg-primary text-white border-primary"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              {label}
              {sortBy === field && (
                sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <ErrorState message="Error al cargar reservas" />
        ) : !bookingsData || bookingsData.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No se encontraron reservas"
            description="Prueba a ajustar los filtros o crear una nueva reserva"
          />
        ) : (
          <>
            {bookingsData.map((booking: Booking) => (
              <Card key={booking.id} data-testid={`card-booking-${booking.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">
                        {booking.customerName} {booking.customerSurname}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(booking.startTime), 'dd/MM/yy HH:mm')} - {booking.totalHours}h
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge className={`text-xs ${getStatusColor(booking.bookingStatus)}`}>
                          {getStatusLabel(booking.bookingStatus)}
                        </Badge>
                        <Badge className={`text-xs ${getPaymentStatusColor(booking.paymentStatus)}`}>
                          {getPaymentStatusLabel(booking.paymentStatus)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onOpenWhatsApp(booking.customerPhone, booking.customerName); }}
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewBooking(booking)}
                        data-testid={`button-view-${booking.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 mt-3">
                    <div>
                      <span className="text-muted-foreground">Barco:</span>
                      <span className="ml-1 font-medium">{boatName(booking.boatId)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-1 font-semibold text-base">
                        {"\u20AC"}{parseFloat(booking.totalAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs">{booking.customerPhone}</span>
                      {booking.customerEmail && (
                        <span className="text-muted-foreground text-xs ml-2">{booking.customerEmail}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination Controls - Mobile */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

