import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  BarChart3,
  Ship,
  Users,
  Wrench,
  Package,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ReportsTabProps {
  adminToken: string;
}

interface FleetReport {
  boatId: string;
  boatName: string;
  revenue: number;
  bookings: number;
  hours: number;
  utilization: number;
  maintenanceCost: number;
  netRevenue: number;
}

interface MaintenanceSummary {
  total: number;
  completed: number;
  scheduled: number;
  inProgress: number;
  totalCost: number;
  byType: {
    preventive: number;
    corrective: number;
    inspection: number;
  };
}

interface TopCustomer {
  id: string;
  name: string;
  surname: string;
  phone: string;
  segment: string;
  totalBookings: number;
  totalSpent: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  availableStock: number;
  totalStock: number;
  status: string;
  pricePerUnit: string | null;
}

const SEGMENT_COLORS: Record<string, string> = {
  vip: "bg-emerald-100 text-emerald-800",
  returning: "bg-blue-100 text-blue-800",
  new: "bg-amber-100 text-amber-800",
};

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function ReportsTab({ adminToken }: ReportsTabProps) {
  const { toast } = useToast();
  const [fleetPeriod, setFleetPeriod] = useState<string>("season");
  const [activeReport, setActiveReport] = useState<string>("fleet");

  const headers = { Authorization: `Bearer ${adminToken}` };

  // Fleet utilization
  const { data: fleetData = [], isLoading: loadingFleet } = useQuery<FleetReport[]>({
    queryKey: ["/api/admin/reports/fleet-utilization", fleetPeriod],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/fleet-utilization?period=${fleetPeriod}`, { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  // Maintenance summary
  const { data: maintSummary, isLoading: loadingMaint } = useQuery<MaintenanceSummary>({
    queryKey: ["/api/admin/reports/maintenance-summary"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reports/maintenance-summary", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  // Top customers
  const { data: topCustomers = [], isLoading: loadingCustomers } = useQuery<TopCustomer[]>({
    queryKey: ["/api/admin/reports/top-customers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reports/top-customers", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  // Inventory
  const { data: inventoryItems = [], isLoading: loadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/admin/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inventory", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  // Export functions
  const exportCSV = (data: Record<string, unknown>[], filename: string, headerMap: Record<string, string>) => {
    const csvHeaders = Object.values(headerMap);
    const keys = Object.keys(headerMap);
    const rows = data.map(row => keys.map(key => {
      const val = row[key];
      return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : `"${val}"`;
    }));

    const csvContent = [csvHeaders.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exportacion completada", description: `${data.length} registros exportados` });
  };

  const exportFleetCSV = () => {
    exportCSV(
      fleetData as unknown as Record<string, unknown>[],
      "flota_utilizacion",
      {
        boatName: "Barco",
        bookings: "Reservas",
        hours: "Horas",
        utilization: "Utilizacion %",
        revenue: "Ingresos",
        maintenanceCost: "Coste Mant.",
        netRevenue: "Ingreso Neto",
      }
    );
  };

  const exportCustomersCSV = () => {
    exportCSV(
      topCustomers as unknown as Record<string, unknown>[],
      "top_clientes",
      {
        name: "Nombre",
        surname: "Apellidos",
        phone: "Teléfono",
        segment: "Segmento",
        totalBookings: "Reservas",
        totalSpent: "Total Gastado",
      }
    );
  };

  // Charts data
  const fleetChartData = fleetData.map(b => ({
    name: b.boatName.length > 12 ? b.boatName.substring(0, 12) + "..." : b.boatName,
    revenue: b.revenue,
    maintenance: b.maintenanceCost,
    net: b.netRevenue,
  }));

  const maintPieData = maintSummary ? [
    { name: "Preventivo", value: maintSummary.byType.preventive },
    { name: "Correctivo", value: maintSummary.byType.corrective },
    { name: "Inspeccion", value: maintSummary.byType.inspection },
  ].filter(d => d.value > 0) : [];

  const REPORT_TABS = [
    { id: "fleet", label: "Flota", icon: Ship },
    { id: "customers", label: "Clientes", icon: Users },
    { id: "maintenance", label: "Mantenimiento", icon: Wrench },
    { id: "inventory", label: "Inventario", icon: Package },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold font-heading">Reportes Operativos</h2>
      </div>

      {/* Report selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {REPORT_TABS.map(tab => (
          <Button
            key={tab.id}
            variant={activeReport === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveReport(tab.id)}
            className="flex-shrink-0"
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* FLEET UTILIZATION REPORT */}
      {activeReport === "fleet" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={fleetPeriod} onValueChange={setFleetPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="season">Temporada</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportFleetCSV} disabled={fleetData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {loadingFleet ? (
            <Card><CardContent className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>
          ) : (
            <>
              {/* Chart */}
              {fleetChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-heading">Ingresos vs Mantenimiento por Barco</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={fleetChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(value: number | undefined) => value !== undefined ? `\u20AC${value.toFixed(2)}` : ""} />
                        <Bar dataKey="revenue" name="Ingresos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="maintenance" name="Mantenimiento" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Desktop table */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Barco</TableHead>
                          <TableHead className="text-right">Reservas</TableHead>
                          <TableHead className="text-right">Horas</TableHead>
                          <TableHead className="text-right">Utilizacion</TableHead>
                          <TableHead className="text-right">Ingresos</TableHead>
                          <TableHead className="text-right">Mant.</TableHead>
                          <TableHead className="text-right">Neto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fleetData.map(boat => (
                          <TableRow key={boat.boatId}>
                            <TableCell className="font-medium">{boat.boatName}</TableCell>
                            <TableCell className="text-right">{boat.bookings}</TableCell>
                            <TableCell className="text-right">{boat.hours}h</TableCell>
                            <TableCell className="text-right">
                              <Badge className={
                                boat.utilization >= 50 ? "bg-emerald-100 text-emerald-800" :
                                boat.utilization >= 20 ? "bg-amber-100 text-amber-800" :
                                "bg-red-100 text-red-800"
                              }>
                                {boat.utilization}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{"\u20AC"}{boat.revenue.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-600">{"\u20AC"}{boat.maintenanceCost.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">{"\u20AC"}{boat.netRevenue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        {fleetData.length > 0 && (
                          <TableRow className="font-bold bg-muted">
                            <TableCell>TOTAL</TableCell>
                            <TableCell className="text-right">{fleetData.reduce((s, b) => s + b.bookings, 0)}</TableCell>
                            <TableCell className="text-right">{fleetData.reduce((s, b) => s + b.hours, 0)}h</TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right">{"\u20AC"}{fleetData.reduce((s, b) => s + b.revenue, 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-600">{"\u20AC"}{fleetData.reduce((s, b) => s + b.maintenanceCost, 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{"\u20AC"}{fleetData.reduce((s, b) => s + b.netRevenue, 0).toFixed(2)}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile card view - fleet */}
              <div className="block md:hidden space-y-3">
                {fleetData.map(boat => (
                  <Card key={boat.boatId}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{boat.boatName}</p>
                        <Badge className={
                          boat.utilization >= 50 ? "bg-emerald-100 text-emerald-800" :
                          boat.utilization >= 20 ? "bg-amber-100 text-amber-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {boat.utilization}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Reservas</p>
                          <p className="font-medium">{boat.bookings}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Horas</p>
                          <p className="font-medium">{boat.hours}h</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ingresos</p>
                          <p className="font-medium">{"\u20AC"}{boat.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                        <div>
                          <p className="text-muted-foreground">Mantenimiento</p>
                          <p className="font-medium text-red-600">{"\u20AC"}{boat.maintenanceCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Neto</p>
                          <p className="font-bold">{"\u20AC"}{boat.netRevenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {fleetData.length > 0 && (
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Reservas</p>
                          <p className="font-bold">{fleetData.reduce((s, b) => s + b.bookings, 0)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ingresos</p>
                          <p className="font-bold">{"\u20AC"}{fleetData.reduce((s, b) => s + b.revenue, 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Neto</p>
                          <p className="font-bold">{"\u20AC"}{fleetData.reduce((s, b) => s + b.netRevenue, 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TOP CUSTOMERS REPORT */}
      {activeReport === "customers" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportCustomersCSV} disabled={topCustomers.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {loadingCustomers ? (
            <Card><CardContent className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>
          ) : (
            <>
            {/* Desktop table */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle className="text-base font-heading">Top 20 Clientes por Valor</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Segmento</TableHead>
                        <TableHead className="text-right">Reservas</TableHead>
                        <TableHead className="text-right">Total Gastado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomers.map((customer, index) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.name} {customer.surname}</p>
                              <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={SEGMENT_COLORS[customer.segment] || ""}>
                              {customer.segment.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{customer.totalBookings}</TableCell>
                          <TableCell className="text-right font-medium">{"\u20AC"}{parseFloat(customer.totalSpent).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile card view - customers */}
            <div className="block md:hidden space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading">Top 20 Clientes por Valor</CardTitle>
                </CardHeader>
              </Card>
              {topCustomers.map((customer, index) => (
                <Card key={customer.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                          <p className="font-medium text-sm truncate">{customer.name} {customer.surname}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{customer.phone}</p>
                      </div>
                      <Badge className={SEGMENT_COLORS[customer.segment] || ""}>
                        {customer.segment.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-muted-foreground">Reservas: <span className="font-medium text-foreground">{customer.totalBookings}</span></span>
                      <span className="text-muted-foreground">Total: <span className="font-bold text-foreground">{"\u20AC"}{parseFloat(customer.totalSpent).toFixed(2)}</span></span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </>
          )}
        </div>
      )}

      {/* MAINTENANCE REPORT */}
      {activeReport === "maintenance" && (
        <div className="space-y-4">
          {loadingMaint ? (
            <Card><CardContent className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>
          ) : maintSummary ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{maintSummary.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Completados</p>
                    <p className="text-2xl font-bold text-emerald-600">{maintSummary.completed}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-2xl font-bold text-amber-600">{maintSummary.scheduled + maintSummary.inProgress}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Coste Total</p>
                    <p className="text-2xl font-bold">{"\u20AC"}{maintSummary.totalCost.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pie chart */}
              {maintPieData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-heading">Distribucion por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={maintPieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {maintPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay datos de mantenimiento
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* INVENTORY REPORT */}
      {activeReport === "inventory" && (
        <div className="space-y-4">
          {loadingInventory ? (
            <Card><CardContent className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>
          ) : inventoryItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay items en el inventario
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="text-2xl font-bold">{inventoryItems.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Disponibles</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {inventoryItems.filter(i => i.status === "available").length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Stock Bajo</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {inventoryItems.filter(i => i.status === "low_stock").length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Sin Stock</p>
                    <p className="text-2xl font-bold text-destructive">
                      {inventoryItems.filter(i => i.status === "out_of_stock").length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Disponible</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                            <TableCell className="text-right">{item.availableStock}</TableCell>
                            <TableCell className="text-right">{item.totalStock}</TableCell>
                            <TableCell>
                              <Badge className={
                                item.status === "available" ? "bg-emerald-100 text-emerald-800" :
                                item.status === "low_stock" ? "bg-amber-100 text-amber-800" :
                                "bg-red-100 text-red-800"
                              }>
                                {item.status === "available" ? "OK" :
                                 item.status === "low_stock" ? "Bajo" : "Sin Stock"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
