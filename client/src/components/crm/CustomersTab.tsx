import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  Euro,
  TrendingUp,
  Eye,
  MessageCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { CustomerData } from "./types";

interface CustomersTabProps {
  adminToken: string;
  onViewCustomerBookings: (phone: string) => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
}

export function CustomersTab({
  adminToken,
  onViewCustomerBookings,
  onOpenWhatsApp,
}: CustomersTabProps) {
  const { data: customersData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/customers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/customers', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!response.ok) {
        let errorMessage = 'Error fetching customers';
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

  return (
    <div className="space-y-6">
      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Todos los Clientes</CardTitle>
          <p className="text-sm text-gray-600">
            Lista de clientes unicos extraidos de las reservas
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Cargando clientes...</div>
          ) : error ? (
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
                    <TableHead>Ultima Reserva</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersData.map((customer: CustomerData, index: number) => (
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
                        {"\u20AC"}{customer.totalSpent.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(customer.lastBookingDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenWhatsApp(customer.customerPhone, customer.customerName)}
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewCustomerBookings(customer.customerPhone)}
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
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Cargando clientes...
            </CardContent>
          </Card>
        ) : error ? (
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
          customersData.map((customer: CustomerData, index: number) => (
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
                      onClick={() => onOpenWhatsApp(customer.customerPhone, customer.customerName)}
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewCustomerBookings(customer.customerPhone)}
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
                    <span className="ml-1 font-semibold">{"\u20AC"}{customer.totalSpent.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600">Ultima Reserva:</span>
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
              {isLoading ? "..." : error ? "Error" : customersData?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes unicos registrados
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
              {isLoading ? "..." : error ? "Error" :
                customersData && customersData.length > 0
                  ? `${customersData[0].customerName} ${customersData[0].customerSurname}`
                  : "N/A"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {customersData && customersData.length > 0
                ? `${"\u20AC"}${customersData[0].totalSpent.toFixed(2)} gastados`
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
              {isLoading ? "..." : error ? "Error" :
                customersData && customersData.length > 0
                  ? `${"\u20AC"}${(customersData.reduce((sum: number, c: CustomerData) => sum + c.totalSpent, 0) / customersData.length).toFixed(2)}`
                  : `${"\u20AC"}0.00`
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Gasto promedio por cliente
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
