import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Euro,
  TrendingUp,
  TrendingDown,
  Clock,
  Anchor,
  Eye,
  Edit,
  BarChart3,
  Receipt,
  Percent,
  ArrowRight,
  Plus,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Booking } from "@shared/schema";
import { getStatusColor, getStatusLabel } from "./constants";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// --- Types ---

interface PaginatedBookingsResponse {
  data: Booking[];
  total: number;
  page: number;
  totalPages: number;
}

interface DashboardStats {
  bookingsCount: number;
  revenue: number;
  confirmedBookings: number;
  pendingBookings: number;
  previousPeriodRevenue: number;
  previousPeriodBookings: number;
  averageTicket: number;
  previousAverageTicket: number;
  totalBoats: number;
  availableBoats: number;
  period: string;
}

interface RevenueTrendPoint {
  date: string;
  revenue: number;
  bookings: number;
}

interface BoatPerformance {
  boatId: string;
  boatName: string;
  revenue: number;
  bookings: number;
  hours: number;
  utilization: number;
}

interface StatusDistribution {
  confirmed: number;
  pending_payment: number;
  hold: number;
  cancelled: number;
  completed: number;
  draft: number;
}

interface DashboardTabProps {
  adminToken: string;
  selectedTimeRange: string;
  onTimeRangeChange: (range: string) => void;
  onViewBooking: (bookingId: string) => void;
  onEditBooking: (bookingId: string) => void;
}

// --- Helper: percentage change ---
function calcChange(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

// --- Helper: fetch with auth ---
function buildFetcher<T>(adminToken: string) {
  return async (url: string): Promise<T> => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!response.ok) {
      let errorMessage = "Error fetching data";
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
  };
}

// --- Sub-components ---

function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null) return null;
  const isPositive = change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {change}%
    </span>
  );
}

function KPICardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-28 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = "h-[300px]" }: { height?: string }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className={`w-full ${height} rounded`} />
      </CardContent>
    </Card>
  );
}

// --- Status color map for pie chart ---
const STATUS_COLORS: Record<string, string> = {
  confirmed: "#22c55e",    // green-500
  pending_payment: "#eab308", // yellow-500
  hold: "#3b82f6",         // blue-500
  cancelled: "#ef4444",    // red-500
  completed: "#64748b",    // slate-500
  draft: "#a1a1aa",        // zinc-400
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending_payment: "Pendiente pago",
  hold: "En espera",
  cancelled: "Cancelada",
  completed: "Completada",
  draft: "Borrador",
};

// Boat colors for bar chart
const BOAT_COLORS = [
  "#0ea5e9", // sky-500
  "#8b5cf6", // violet-500
  "#f97316", // orange-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#6366f1", // indigo-500
];

// Activity icon based on booking status
function getActivityIcon(status: string) {
  switch (status) {
    case "confirmed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "pending_payment":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Plus className="h-4 w-4 text-blue-500" />;
  }
}

// --- Period labels ---
const PERIOD_OPTIONS = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "season", label: "Temporada" },
  { value: "year", label: "Anio" },
];

// Custom tooltip for revenue chart
function RevenueTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const dateStr = label ? format(new Date(label + "T00:00:00"), "d MMM yyyy", { locale: es }) : "";
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-gray-500 mb-1">{dateStr}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm">
          {entry.dataKey === "revenue" ? (
            <span className="font-semibold text-gray-900">
              {"\u20AC"}{entry.value.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </span>
          ) : (
            <span className="text-gray-600">{entry.value} reservas</span>
          )}
        </p>
      ))}
    </div>
  );
}

// Custom tooltip for boat performance chart
function BoatTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: BoatPerformance }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-gray-900 mb-1">{data.boatName}</p>
      <p className="text-xs text-gray-600">{data.bookings} reservas</p>
      <p className="text-xs text-gray-600">{data.hours}h navegadas</p>
      <p className="text-xs font-medium text-gray-900">
        {"\u20AC"}{data.revenue.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// --- Main Component ---

export function DashboardTab({
  adminToken,
  selectedTimeRange,
  onTimeRangeChange,
  onViewBooking,
  onEditBooking,
}: DashboardTabProps) {
  const fetcher = buildFetcher<DashboardStats>(adminToken);
  const arrayFetcher = buildFetcher<RevenueTrendPoint[]>(adminToken);
  const boatsFetcher = buildFetcher<BoatPerformance[]>(adminToken);
  const statusFetcher = buildFetcher<StatusDistribution>(adminToken);
  const paginatedFetcher = buildFetcher<PaginatedBookingsResponse>(adminToken);

  const retryFn = (failureCount: number, error: unknown) => {
    if ((error as Record<string, unknown>)?.status === 401) return false;
    return failureCount < 2;
  };

  // --- Queries ---

  // Main stats with comparison
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats", selectedTimeRange],
    queryFn: () => fetcher(`/api/admin/stats?period=${selectedTimeRange}`),
    retry: retryFn,
  });

  // Revenue trend (always last 30 days)
  const { data: revenueTrend, isLoading: trendLoading } = useQuery({
    queryKey: ["/api/admin/stats/revenue-trend"],
    queryFn: () => arrayFetcher("/api/admin/stats/revenue-trend?period=30d"),
    retry: retryFn,
  });

  // Boats performance (matching selected time range roughly)
  const boatsPeriod = selectedTimeRange === "year" ? "year" : selectedTimeRange === "season" ? "season" : "month";
  const { data: boatsPerformance, isLoading: boatsLoading } = useQuery({
    queryKey: ["/api/admin/stats/boats-performance", boatsPeriod],
    queryFn: () => boatsFetcher(`/api/admin/stats/boats-performance?period=${boatsPeriod}`),
    retry: retryFn,
  });

  // Status distribution (year to date)
  const { data: statusDistribution, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/admin/stats/status-distribution"],
    queryFn: () => statusFetcher("/api/admin/stats/status-distribution"),
    retry: retryFn,
  });

  // Upcoming bookings
  const { data: upcomingResponse, isLoading: upcomingLoading } = useQuery<PaginatedBookingsResponse>({
    queryKey: ["/api/admin/bookings", "upcoming-dashboard"],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        limit: "20",
        sortBy: "startTime",
        sortOrder: "asc",
      });
      const result = await paginatedFetcher(`/api/admin/bookings?${params.toString()}`);
      result.data = result.data.filter(
        (b: Booking) =>
          new Date(b.startTime) > new Date() &&
          (b.bookingStatus === "confirmed" || b.bookingStatus === "pending_payment")
      );
      return result;
    },
    retry: retryFn,
  });
  const upcomingBookings = (upcomingResponse?.data || []).slice(0, 6);

  // Recent bookings for activity feed
  const { data: recentResponse, isLoading: recentLoading } = useQuery<PaginatedBookingsResponse>({
    queryKey: ["/api/admin/bookings", "recent-dashboard"],
    queryFn: () => {
      const params = new URLSearchParams({
        page: "1",
        limit: "8",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      return paginatedFetcher(`/api/admin/bookings?${params.toString()}`);
    },
    retry: retryFn,
  });
  const recentBookings = recentResponse?.data || [];

  // --- KPI calculations ---
  const revenueChange = stats ? calcChange(stats.revenue, stats.previousPeriodRevenue) : null;
  const bookingsChange = stats ? calcChange(stats.bookingsCount, stats.previousPeriodBookings) : null;
  const ticketChange = stats ? calcChange(stats.averageTicket, stats.previousAverageTicket) : null;
  const occupancy = stats && stats.totalBoats > 0
    ? Math.round(((stats.totalBoats - stats.availableBoats) / stats.totalBoats) * 100)
    : 0;

  // --- Pie chart data ---
  const pieData = statusDistribution
    ? Object.entries(statusDistribution)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          name: STATUS_LABELS[status] || status,
          value: count,
          color: STATUS_COLORS[status] || "#94a3b8",
        }))
    : [];

  const totalStatusBookings = pieData.reduce((sum, d) => sum + d.value, 0);

  // Short boat name for bar chart X-axis
  function shortBoatName(name: string): string {
    // Take first two meaningful words
    const parts = name.split(" ");
    if (parts.length <= 2) return name;
    return parts.slice(0, 2).join(" ");
  }

  // --- Period label helper ---
  function periodLabel(range: string): string {
    const found = PERIOD_OPTIONS.find((p) => p.value === range);
    return found ? found.label : range;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-500 mr-1">Periodo:</span>
        {PERIOD_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={selectedTimeRange === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => onTimeRangeChange(opt.value)}
            className={
              selectedTimeRange === opt.value
                ? ""
                : "text-gray-600 hover:text-gray-900"
            }
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            {/* Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Ingresos
                </CardTitle>
                <div className="rounded-md bg-emerald-50 p-1.5">
                  <Euro className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {"\u20AC"}
                  {(stats?.revenue ?? 0).toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <ChangeIndicator change={revenueChange} />
                  <span className="text-xs text-gray-400">
                    vs periodo anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Bookings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Reservas
                </CardTitle>
                <div className="rounded-md bg-blue-50 p-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.bookingsCount ?? 0}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <ChangeIndicator change={bookingsChange} />
                  <span className="text-xs text-gray-400">
                    vs periodo anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Average Ticket */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Ticket Medio
                </CardTitle>
                <div className="rounded-md bg-violet-50 p-1.5">
                  <Receipt className="h-4 w-4 text-violet-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {"\u20AC"}
                  {(stats?.averageTicket ?? 0).toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <ChangeIndicator change={ticketChange} />
                  <span className="text-xs text-gray-400">
                    vs periodo anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Occupancy */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Ocupacion
                </CardTitle>
                <div className="rounded-md bg-orange-50 p-1.5">
                  <Percent className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {occupancy}%
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {stats?.availableBoats ?? 0}/{stats?.totalBoats ?? 0} barcos libres ahora
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend - Area Chart */}
        {trendLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">
                Ingresos ultimos 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueTrend || []}
                    margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => {
                        const date = new Date(d + "T00:00:00");
                        return format(date, "d MMM", { locale: es });
                      }}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      interval="preserveStartEnd"
                      minTickGap={40}
                    />
                    <YAxis
                      tickFormatter={(v: number) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                    />
                    <Tooltip content={<RevenueTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: "#0ea5e9" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boats Performance - Bar Chart */}
        {boatsLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">
                Reservas por barco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={boatsPerformance || []}
                    margin={{ top: 5, right: 10, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="boatName"
                      tickFormatter={shortBoatName}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      width={35}
                      allowDecimals={false}
                    />
                    <Tooltip content={<BoatTooltip />} />
                    <Bar dataKey="bookings" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {(boatsPerformance || []).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={BOAT_COLORS[index % BOAT_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Distribution - Donut Chart */}
        {statusLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">
                Estado de reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Sin datos de reservas
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const entry = payload[0];
                          const v = (entry.value as number) ?? 0;
                          const name = entry.name as string;
                          return (
                            <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
                              <p className="text-sm font-medium text-gray-900">{name}</p>
                              <p className="text-xs text-gray-600">
                                {v} reservas ({totalStatusBookings > 0 ? Math.round((v / totalStatusBookings) * 100) : 0}%)
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-xs text-gray-600">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Bookings Mini Table */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800">
              Proximas reservas
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-900"
              onClick={() => onTimeRangeChange("week")}
            >
              Ver todas
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Anchor className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No hay reservas proximas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map((booking: Booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => onViewBooking(booking.id)}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {booking.customerName} {booking.customerSurname}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(booking.startTime), "d MMM, HH:mm", { locale: es })}
                        {" - "}
                        {booking.totalHours}h
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {"\u20AC"}{parseFloat(booking.totalAmount).toLocaleString("es-ES", { minimumFractionDigits: 0 })}
                      </span>
                      <Badge
                        variant={
                          getStatusColor(booking.bookingStatus) as
                            | "default"
                            | "secondary"
                            | "outline"
                            | "destructive"
                        }
                        className="text-[10px]"
                      >
                        {getStatusLabel(booking.bookingStatus)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBooking(booking.id);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-800">
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              No hay actividad reciente
            </div>
          ) : (
            <div className="space-y-1">
              {recentBookings.map((booking: Booking) => {
                const activityText =
                  booking.bookingStatus === "confirmed"
                    ? "Nueva reserva confirmada"
                    : booking.bookingStatus === "cancelled"
                      ? "Reserva cancelada"
                      : booking.bookingStatus === "pending_payment"
                        ? "Reserva pendiente de pago"
                        : "Nueva reserva creada";

                return (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onViewBooking(booking.id)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                      {getActivityIcon(booking.bookingStatus)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-900">
                          {booking.customerName} {booking.customerSurname}
                        </span>
                        {" -- "}
                        {activityText}
                      </p>
                      <p className="text-xs text-gray-400">
                        {booking.boatId} -- {"\u20AC"}{booking.totalAmount}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {formatDistanceToNow(new Date(booking.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
