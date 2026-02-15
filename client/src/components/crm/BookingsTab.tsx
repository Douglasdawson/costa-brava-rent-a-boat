import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Fetch paginated bookings
  const { data: bookingsResponse, isLoading, error } = useQuery<PaginatedBookingsResponse>({
    queryKey: ['/api/admin/bookings', currentPage, debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(BOOKINGS_PER_PAGE),
        sortBy: 'startTime',
        sortOrder: 'desc',
      });
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
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

  // Allow parent to set search (e.g., from customers tab)
  const setSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setDebouncedSearch(query);
    setCurrentPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, email, telefono..."
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
          <span className="text-sm text-gray-500">
            {total} reserva{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
          </span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Cargando reservas...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">Error cargando reservas</div>
          ) : !bookingsData || bookingsData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron reservas con los filtros seleccionados
            </div>
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
                  {bookingsData.map((booking: Booking) => (
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
                        {"\u20AC"}{parseFloat(booking.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(booking.bookingStatus) as "default" | "secondary" | "outline" | "destructive"}>
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
          <div className="text-sm font-medium text-gray-600">
            Todas las Reservas
          </div>
          <span className="text-xs text-gray-500">
            {total} resultado{total !== 1 ? 's' : ''}
          </span>
        </div>
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Cargando reservas...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-red-500">
              Error cargando reservas
            </CardContent>
          </Card>
        ) : !bookingsData || bookingsData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No se encontraron reservas
            </CardContent>
          </Card>
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
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(booking.startTime), 'dd/MM/yy HH:mm')} - {booking.totalHours}h
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant={getStatusColor(booking.bookingStatus) as "default" | "secondary" | "outline" | "destructive"} className="text-xs">
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
                      onClick={() => onViewBooking(booking)}
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
                        {"\u20AC"}{parseFloat(booking.totalAmount).toFixed(2)}
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
            ))}

            {/* Pagination Controls - Mobile */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Reusable pagination controls component
function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages: number[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t">
      <div className="text-sm text-gray-600">
        Pagina {currentPage} de {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="Primera pagina"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          title="Pagina anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {pages.map((pageNum) => (
          <Button
            key={pageNum}
            variant={pageNum === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className="min-w-[36px]"
          >
            {pageNum}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          title="Pagina siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Ultima pagina"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
