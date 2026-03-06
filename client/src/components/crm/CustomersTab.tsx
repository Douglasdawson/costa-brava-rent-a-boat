import { useState, useCallback, useRef, useEffect } from "react";
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
  Users,
  Euro,
  TrendingUp,
  MessageCircle,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { CrmCustomerData, PaginatedCrmCustomersResponse } from "./types";
import { CustomerDetailModal } from "./CustomerDetailModal";
import { PaginationControls } from "./shared/PaginationControls";

const CUSTOMERS_PER_PAGE = 25;

interface CustomersTabProps {
  adminToken: string;
  onViewCustomerBookings: (phone: string) => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
}

function getSegmentBadge(segment: string) {
  switch (segment) {
    case "vip":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">VIP</Badge>;
    case "returning":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Recurrente</Badge>;
    case "new":
    default:
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Nuevo</Badge>;
  }
}

export function CustomersTab({
  adminToken,
  onViewCustomerBookings,
  onOpenWhatsApp,
}: CustomersTabProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [nationalityFilter, setNationalityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("lastBookingDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);

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
  }, [segmentFilter, nationalityFilter]);

  // Fetch paginated customers
  const { data: customersResponse, isLoading, error } = useQuery<PaginatedCrmCustomersResponse>({
    queryKey: ["/api/admin/customers", currentPage, debouncedSearch, segmentFilter, nationalityFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(CUSTOMERS_PER_PAGE),
        sortBy,
        sortOrder,
      });
      if (segmentFilter && segmentFilter !== "all") {
        params.set("segment", segmentFilter);
      }
      if (nationalityFilter && nationalityFilter !== "all") {
        params.set("nationality", nationalityFilter);
      }
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      const response = await fetch(`/api/admin/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error" }));
        throw new Error(errorData.message || "Error fetching customers");
      }
      return response.json();
    },
    retry: (failureCount, err: unknown) => {
      if ((err as Record<string, unknown>)?.status === 401) return false;
      return failureCount < 2;
    },
  });

  const customersData = customersResponse?.data;
  const totalPages = customersResponse?.totalPages ?? 1;
  const total = customersResponse?.total ?? 0;

  // Sync customers mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/customers/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Error" }));
        throw new Error(err.message || "Error syncing");
      }
      return response.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({ title: "Sincronizacion completada", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  // Export CSV
  const handleExportCSV = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/customers/export", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Error exporting");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clientes_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exportacion completada", description: "Archivo CSV descargado" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo exportar" });
    }
  }, [adminToken, toast]);

  const handleCustomerClick = useCallback((customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowCustomerDetail(true);
  }, []);

  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  }, [sortBy]);

  const renderSortIcon = (column: string) => {
    if (sortBy === column) {
      return sortOrder === "asc"
        ? <ArrowUp className="w-3 h-3" />
        : <ArrowDown className="w-3 h-3" />;
    }
    return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email, telefono..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los segmentos</SelectItem>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="returning">Recurrente</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
              <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Nacionalidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Espanola">Espanola</SelectItem>
                  <SelectItem value="Francesa">Francesa</SelectItem>
                  <SelectItem value="Britanica">Britanica</SelectItem>
                  <SelectItem value="Alemana">Alemana</SelectItem>
                  <SelectItem value="Holandesa">Holandesa</SelectItem>
                  <SelectItem value="Belga">Belga</SelectItem>
                  <SelectItem value="Italiana">Italiana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                {syncMutation.isPending ? "Sincronizando..." : "Sincronizar desde Reservas"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clientes CRM</CardTitle>
          <span className="text-sm text-muted-foreground">
            {total} cliente{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
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
            <div className="text-center py-12 text-red-500">Error cargando clientes</div>
          ) : !customersData || customersData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-heading font-medium text-foreground mb-1">No se encontraron clientes</p>
              <p className="text-sm text-muted-foreground">
                {total === 0 && !debouncedSearch && segmentFilter === "all"
                  ? 'Usa "Sincronizar desde Reservas" para importar clientes'
                  : "Prueba a ajustar los filtros de busqueda"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Nombre
                        {renderSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefono</TableHead>
                    <TableHead>Nacionalidad</TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:bg-muted/50 text-center"
                      onClick={() => handleSort("totalBookings")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Reservas
                        {renderSortIcon("totalBookings")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("totalSpent")}
                    >
                      <div className="flex items-center gap-1">
                        Total Gastado
                        {renderSortIcon("totalSpent")}
                      </div>
                    </TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("lastBookingDate")}
                    >
                      <div className="flex items-center gap-1">
                        Ultima Reserva
                        {renderSortIcon("lastBookingDate")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersData.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleCustomerClick(customer.id)}
                    >
                      <TableCell className="font-medium">
                        {customer.name} {customer.surname}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.email || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.phone}
                      </TableCell>
                      <TableCell>{customer.nationality || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {customer.totalBookings}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {"\u20AC"}{parseFloat(customer.totalSpent).toFixed(2)}
                      </TableCell>
                      <TableCell>{getSegmentBadge(customer.segment)}</TableCell>
                      <TableCell>
                        {customer.lastBookingDate
                          ? format(new Date(customer.lastBookingDate), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onOpenWhatsApp(customer.phone, customer.name)
                            }
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-green-600" />
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
          <div className="text-sm font-medium font-heading text-muted-foreground">Clientes CRM</div>
          <span className="text-xs text-muted-foreground">
            {total} resultado{total !== 1 ? "s" : ""}
          </span>
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
          <Card>
            <CardContent className="py-12 text-center text-red-500">
              Error cargando clientes
            </CardContent>
          </Card>
        ) : !customersData || customersData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-heading font-medium text-foreground mb-1">No se encontraron clientes</p>
              <p className="text-sm text-muted-foreground">Usa "Sincronizar desde Reservas" para importar clientes</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {customersData.map((customer) => (
              <Card
                key={customer.id}
                className="cursor-pointer"
                onClick={() => handleCustomerClick(customer.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold font-heading text-base">
                        {customer.name} {customer.surname}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {customer.nationality || "Sin nacionalidad"}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {getSegmentBadge(customer.segment)}
                        <Badge variant="secondary" className="text-xs">
                          {customer.totalBookings} reserva{customer.totalBookings !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onOpenWhatsApp(customer.phone, customer.name)
                        }
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 mt-3">
                    <div>
                      <span className="text-muted-foreground">Gasto Total:</span>
                      <span className="ml-1 font-semibold">
                        {"\u20AC"}{parseFloat(customer.totalSpent).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Ultima:</span>
                      <span className="ml-1 font-medium text-xs">
                        {customer.lastBookingDate
                          ? format(new Date(customer.lastBookingDate), "dd/MM/yy")
                          : "-"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs">{customer.phone}</span>
                      {customer.email && (
                        <span className="text-muted-foreground text-xs ml-2">{customer.email}</span>
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
                <span className="text-sm text-muted-foreground">
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

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : error ? "Error" : total}
            </div>
            <p className="text-xs text-muted-foreground">Clientes unicos en CRM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejor Cliente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {isLoading
                ? "..."
                : error
                  ? "Error"
                  : customersResponse?.bestCustomerName
                    ? customersResponse.bestCustomerName
                    : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {customersResponse?.bestCustomerSpent
                ? `${"\u20AC"}${parseFloat(customersResponse.bestCustomerSpent).toFixed(2)} gastados`
                : "Sin datos"}
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
              {isLoading
                ? "..."
                : error
                  ? "Error"
                  : customersResponse && customersResponse.totalCustomersAll > 0
                    ? `${"\u20AC"}${(parseFloat(customersResponse.totalSpentAll) / customersResponse.totalCustomersAll).toFixed(2)}`
                    : `${"\u20AC"}0.00`}
            </div>
            <p className="text-xs text-muted-foreground">Gasto promedio por cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Detail Sheet */}
      <CustomerDetailModal
        open={showCustomerDetail}
        onOpenChange={setShowCustomerDetail}
        customerId={selectedCustomerId}
        adminToken={adminToken}
        onOpenWhatsApp={onOpenWhatsApp}
      />
    </div>
  );
}

