import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Eye,
  MousePointerClick,
  Globe,
  Users,
  BarChart3,
  Monitor,
  Smartphone,
  Tablet,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
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

interface AnalyticsTabProps {
  adminToken: string;
}

interface AnalyticsStatus {
  configured: boolean;
  hasGSC: boolean;
  hasGA4: boolean;
}

interface AnalyticsOverview {
  gsc: {
    totals: { clicks: number; impressions: number; ctr: number; position: number };
    daily: Array<{ date: string; clicks: number; impressions: number }>;
  };
  ga4: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
  };
  cached: boolean;
}

interface KeywordRow {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface TrafficRow {
  channel: string;
  sessions: number;
  users: number;
}

interface DeviceRow {
  device: string;
  sessions: number;
  users: number;
}

interface CountryRow {
  country: string;
  users: number;
  sessions: number;
}

interface ConversionRow {
  event: string;
  count: number;
}

interface TrendsData {
  gsc: Array<{ date: string; clicks: number; impressions: number }>;
  ga4: Array<{ date: string; users: number; sessions: number; pageViews: number }>;
}

type TabId = "general" | "keywords" | "pages" | "traffic" | "audience" | "conversions";
type SortDirection = "asc" | "desc";

// --- Constants ---

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "general", label: "General" },
  { id: "keywords", label: "Keywords" },
  { id: "pages", label: "Paginas" },
  { id: "traffic", label: "Trafico" },
  { id: "audience", label: "Audiencia" },
  { id: "conversions", label: "Conversiones" },
];

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const CONVERSION_LABELS: Record<string, string> = {
  booking_started: "Reservas iniciadas",
  purchase: "Compras completadas",
  whatsapp_click: "Clics WhatsApp",
  phone_click: "Clics telefono",
};

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

// --- Helpers ---

function formatCtr(ctr: number): string {
  return (ctr * 100).toFixed(2) + "%";
}

function formatPosition(pos: number): string {
  return pos.toFixed(1);
}

function stripDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    // If it already looks like a path, return as-is
    return url.startsWith("/") ? url : "/" + url;
  }
}

// --- Sort helper ---

function sortData<T>(data: T[], key: keyof T, direction: SortDirection): T[] {
  return [...data].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal);
    const bStr = String(bVal);
    return direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });
}

// --- Custom Tooltip ---

function TrendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm" style={{ color: entry.color }}>
          {entry.dataKey === "clicks" && "Clics: "}
          {entry.dataKey === "users" && "Usuarios: "}
          {entry.dataKey === "impressions" && "Impresiones: "}
          {entry.dataKey === "sessions" && "Sesiones: "}
          <span className="font-semibold">{entry.value.toLocaleString("es-ES")}</span>
        </p>
      ))}
    </div>
  );
}

// --- Sortable Table Header ---

function SortableHead({
  label,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  currentSort: string;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}) {
  const isActive = currentSort === sortKey;
  return (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground ${className || ""}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? "text-foreground" : "text-muted-foreground/50"}`} />
        {isActive && (
          <span className="text-[10px] text-muted-foreground">
            {currentDirection === "asc" ? "asc" : "desc"}
          </span>
        )}
      </span>
    </TableHead>
  );
}

// --- Main Component ---

export function AnalyticsTab({ adminToken }: AnalyticsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("general");

  // Sort state for tables
  const [keywordSort, setKeywordSort] = useState<{ key: string; dir: SortDirection }>({ key: "clicks", dir: "desc" });
  const [pageSort, setPageSort] = useState<{ key: string; dir: SortDirection }>({ key: "clicks", dir: "desc" });

  const headers = { Authorization: `Bearer ${adminToken}` };

  // --- Queries ---

  const { data: status, isLoading: statusLoading } = useQuery<AnalyticsStatus>({
    queryKey: ["/api/admin/analytics/status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/status", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/admin/analytics/overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/overview", { headers });
      if (!res.ok) throw new Error("Error");
      const json = await res.json();
      return { ...json.data, cached: json.cached };
    },
    enabled: status?.configured === true,
  });

  const { data: trends, isLoading: trendsLoading } = useQuery<TrendsData>({
    queryKey: ["/api/admin/analytics/trends"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/trends", { headers });
      if (!res.ok) throw new Error("Error");
      const json = await res.json();
      return json.data;
    },
    enabled: status?.configured === true && activeTab === "general",
  });

  const { data: keywordsData, isLoading: keywordsLoading } = useQuery<{ data: KeywordRow[] }>({
    queryKey: ["/api/admin/analytics/keywords"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/keywords", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: status?.configured === true && activeTab === "keywords",
  });

  const { data: pagesData, isLoading: pagesLoading } = useQuery<{ data: PageRow[] }>({
    queryKey: ["/api/admin/analytics/pages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/pages", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: status?.configured === true && activeTab === "pages",
  });

  const { data: trafficData, isLoading: trafficLoading } = useQuery<{ data: TrafficRow[] }>({
    queryKey: ["/api/admin/analytics/traffic"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/traffic", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: status?.configured === true && activeTab === "traffic",
  });

  const { data: devicesData, isLoading: devicesLoading } = useQuery<{ data: DeviceRow[] }>({
    queryKey: ["/api/admin/analytics/devices"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/devices", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: status?.configured === true && activeTab === "audience",
  });

  const { data: countriesData, isLoading: countriesLoading } = useQuery<{ data: CountryRow[] }>({
    queryKey: ["/api/admin/analytics/countries"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/countries", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: status?.configured === true && activeTab === "audience",
  });

  const { data: conversionsData, isLoading: conversionsLoading } = useQuery<{ data: ConversionRow[] }>({
    queryKey: ["/api/admin/analytics/conversions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/conversions", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: status?.configured === true && activeTab === "conversions",
  });

  // --- Sync mutation ---

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/analytics/sync", {
        method: "POST",
        headers,
      });
      if (!res.ok) throw new Error("Error al sincronizar");
      return res.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({ title: "Sincronizacion completada", description: data.message });
      // Invalidate all analytics queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo sincronizar los datos", variant: "destructive" });
    },
  });

  // --- Sort handlers ---

  function handleKeywordSort(key: string) {
    setKeywordSort(prev =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );
  }

  function handlePageSort(key: string) {
    setPageSort(prev =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );
  }

  // --- Loading guard ---

  if (statusLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Not configured state ---

  if (status && !status.configured) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold font-heading">SEO y Analytics</h2>
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700">
          <CardHeader>
            <CardTitle className="text-base font-heading flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5" />
              Google API no configurada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Para ver datos de SEO y analytics, sigue estos pasos:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-amber-700 dark:text-amber-400">
              <li>
                <span className="font-medium">Crear Service Account en Google Cloud</span>
                <p className="ml-6 text-xs text-amber-600 dark:text-amber-500">
                  Ve a Google Cloud Console, crea un proyecto y habilita las APIs de Search Console y GA4.
                  Crea una cuenta de servicio y descarga el JSON de credenciales.
                </p>
              </li>
              <li>
                <span className="font-medium">Añadir variables de entorno</span>
                <p className="ml-6 text-xs text-amber-600 dark:text-amber-500">
                  Configura GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GSC_SITE_URL y GA4_PROPERTY_ID
                  en las variables de entorno del servidor.
                </p>
              </li>
              <li>
                <span className="font-medium">Sincronizar datos</span>
                <p className="ml-6 text-xs text-amber-600 dark:text-amber-500">
                  Una vez configuradas las credenciales, pulsa el boton de sincronizar para obtener los datos iniciales.
                </p>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Prepared data ---

  const sortedKeywords = keywordsData?.data
    ? sortData(keywordsData.data, keywordSort.key as keyof KeywordRow, keywordSort.dir)
    : [];

  const sortedPages = pagesData?.data
    ? sortData(pagesData.data, pageSort.key as keyof PageRow, pageSort.dir)
    : [];

  // Merge trends for the line chart
  const mergedTrends: Array<{ date: string; clicks: number; users: number }> = [];
  if (trends) {
    const dateMap = new Map<string, { clicks: number; users: number }>();
    for (const point of (trends.gsc || [])) {
      dateMap.set(point.date, { clicks: point.clicks, users: 0 });
    }
    for (const point of (trends.ga4 || [])) {
      const existing = dateMap.get(point.date);
      if (existing) {
        existing.users = point.users;
      } else {
        dateMap.set(point.date, { clicks: 0, users: point.users });
      }
    }
    for (const [date, values] of Array.from(dateMap.entries()).sort()) {
      mergedTrends.push({ date, ...values });
    }
  }

  // Traffic pie chart data
  const trafficPieData = (trafficData?.data || []).map((item, i) => ({
    name: item.channel,
    value: item.sessions,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // Devices pie chart data
  const devicesPieData = (devicesData?.data || []).map((item, i) => ({
    name: item.device,
    value: item.sessions,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold font-heading">SEO y Analytics</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sincronizar ahora
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* ==================== GENERAL ==================== */}
      {activeTab === "general" && (
        <div className="space-y-4">
          {overviewLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
              </CardContent>
            </Card>
          ) : overviewError ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-destructive">Error cargando datos</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/overview"] })}
                >
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          ) : overview ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Organic Clicks */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Clics organicos
                    </CardTitle>
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <MousePointerClick className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-heading text-foreground">
                      {overview.gsc?.totals?.clicks?.toLocaleString("es-ES") ?? "—"}
                    </div>
                  </CardContent>
                </Card>

                {/* Impressions */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Impresiones
                    </CardTitle>
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-heading text-foreground">
                      {overview.gsc?.totals?.impressions?.toLocaleString("es-ES") ?? "—"}
                    </div>
                  </CardContent>
                </Card>

                {/* CTR */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      CTR medio
                    </CardTitle>
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-heading text-foreground">
                      {overview.gsc?.totals ? formatCtr(overview.gsc.totals.ctr) : "—"}
                    </div>
                  </CardContent>
                </Card>

                {/* Average Position */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Posicion media
                    </CardTitle>
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <Search className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-heading text-foreground">
                      {overview.gsc?.totals ? formatPosition(overview.gsc.totals.position) : "—"}
                    </div>
                  </CardContent>
                </Card>

                {/* Users */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Usuarios
                    </CardTitle>
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-heading text-foreground">
                      {overview.ga4?.activeUsers?.toLocaleString("es-ES") ?? "—"}
                    </div>
                  </CardContent>
                </Card>

                {/* Sessions */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Sesiones
                    </CardTitle>
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-heading text-foreground">
                      {overview.ga4?.sessions?.toLocaleString("es-ES") ?? "—"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trends Chart */}
              {trendsLoading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : mergedTrends.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-heading">Tendencia: Clics y Usuarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] sm:h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mergedTrends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            tickLine={false}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                            interval="preserveStartEnd"
                            minTickGap={40}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            tickLine={false}
                            axisLine={false}
                            width={45}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            tickLine={false}
                            axisLine={false}
                            width={45}
                          />
                          <Tooltip content={<TrendTooltip />} />
                          <Legend
                            verticalAlign="top"
                            height={30}
                            formatter={(value: string) => (
                              <span className="text-xs text-muted-foreground">
                                {value === "clicks" ? "Clics (GSC)" : "Usuarios (GA4)"}
                              </span>
                            )}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="clicks"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="users"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {overview.cached && (
                <p className="text-xs text-muted-foreground text-right">
                  Datos en cache. Pulsa "Sincronizar ahora" para actualizar.
                </p>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ==================== KEYWORDS ==================== */}
      {activeTab === "keywords" && (
        <div className="space-y-4">
          {keywordsLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
              </CardContent>
            </Card>
          ) : sortedKeywords.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay datos de keywords disponibles
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden md:block">
                <CardHeader>
                  <CardTitle className="text-base font-heading">
                    Keywords ({sortedKeywords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHead label="Keyword" sortKey="keyword" currentSort={keywordSort.key} currentDirection={keywordSort.dir} onSort={handleKeywordSort} />
                          <SortableHead label="Clics" sortKey="clicks" currentSort={keywordSort.key} currentDirection={keywordSort.dir} onSort={handleKeywordSort} className="text-right" />
                          <SortableHead label="Impresiones" sortKey="impressions" currentSort={keywordSort.key} currentDirection={keywordSort.dir} onSort={handleKeywordSort} className="text-right" />
                          <SortableHead label="CTR" sortKey="ctr" currentSort={keywordSort.key} currentDirection={keywordSort.dir} onSort={handleKeywordSort} className="text-right" />
                          <SortableHead label="Posicion" sortKey="position" currentSort={keywordSort.key} currentDirection={keywordSort.dir} onSort={handleKeywordSort} className="text-right" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedKeywords.map((kw, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium max-w-[300px] truncate">{kw.keyword}</TableCell>
                            <TableCell className="text-right">{kw.clicks.toLocaleString("es-ES")}</TableCell>
                            <TableCell className="text-right">{kw.impressions.toLocaleString("es-ES")}</TableCell>
                            <TableCell className="text-right">{formatCtr(kw.ctr)}</TableCell>
                            <TableCell className="text-right">{formatPosition(kw.position)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile card view */}
              <div className="block md:hidden space-y-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-heading">
                      Keywords ({sortedKeywords.length})
                    </CardTitle>
                  </CardHeader>
                </Card>
                {sortedKeywords.map((kw, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-2">
                      <p className="font-medium text-sm truncate">{kw.keyword}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Clics</p>
                          <p className="font-medium">{kw.clicks.toLocaleString("es-ES")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Impresiones</p>
                          <p className="font-medium">{kw.impressions.toLocaleString("es-ES")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">CTR</p>
                          <p className="font-medium">{formatCtr(kw.ctr)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Posicion</p>
                          <p className="font-medium">{formatPosition(kw.position)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== PAGES ==================== */}
      {activeTab === "pages" && (
        <div className="space-y-4">
          {pagesLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
              </CardContent>
            </Card>
          ) : sortedPages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay datos de paginas disponibles
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden md:block">
                <CardHeader>
                  <CardTitle className="text-base font-heading">
                    Paginas ({sortedPages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHead label="Pagina" sortKey="page" currentSort={pageSort.key} currentDirection={pageSort.dir} onSort={handlePageSort} />
                          <SortableHead label="Clics" sortKey="clicks" currentSort={pageSort.key} currentDirection={pageSort.dir} onSort={handlePageSort} className="text-right" />
                          <SortableHead label="Impresiones" sortKey="impressions" currentSort={pageSort.key} currentDirection={pageSort.dir} onSort={handlePageSort} className="text-right" />
                          <SortableHead label="CTR" sortKey="ctr" currentSort={pageSort.key} currentDirection={pageSort.dir} onSort={handlePageSort} className="text-right" />
                          <SortableHead label="Posicion" sortKey="position" currentSort={pageSort.key} currentDirection={pageSort.dir} onSort={handlePageSort} className="text-right" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedPages.map((pg, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium max-w-[300px] truncate font-mono text-xs">
                              {stripDomain(pg.page)}
                            </TableCell>
                            <TableCell className="text-right">{pg.clicks.toLocaleString("es-ES")}</TableCell>
                            <TableCell className="text-right">{pg.impressions.toLocaleString("es-ES")}</TableCell>
                            <TableCell className="text-right">{formatCtr(pg.ctr)}</TableCell>
                            <TableCell className="text-right">{formatPosition(pg.position)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile card view */}
              <div className="block md:hidden space-y-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-heading">
                      Paginas ({sortedPages.length})
                    </CardTitle>
                  </CardHeader>
                </Card>
                {sortedPages.map((pg, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-2">
                      <p className="font-mono text-xs truncate text-foreground">{stripDomain(pg.page)}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Clics</p>
                          <p className="font-medium">{pg.clicks.toLocaleString("es-ES")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Impresiones</p>
                          <p className="font-medium">{pg.impressions.toLocaleString("es-ES")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">CTR</p>
                          <p className="font-medium">{formatCtr(pg.ctr)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Posicion</p>
                          <p className="font-medium">{formatPosition(pg.position)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== TRAFFIC ==================== */}
      {activeTab === "traffic" && (
        <div className="space-y-4">
          {trafficLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
              </CardContent>
            </Card>
          ) : (trafficData?.data || []).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay datos de trafico disponibles
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pie Chart */}
              {trafficPieData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-heading">Trafico por canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={trafficPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            label={({ name, percent }: { name: string; percent: number }) =>
                              `${name} (${(percent * 100).toFixed(0)}%)`
                            }
                          >
                            {trafficPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload || !payload.length) return null;
                              const entry = payload[0];
                              return (
                                <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
                                  <p className="text-sm font-medium text-foreground">{entry.name as string}</p>
                                  <p className="text-xs text-muted-foreground">{(entry.value as number).toLocaleString("es-ES")} sesiones</p>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Traffic table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-heading">Detalle por canal</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Canal</TableHead>
                          <TableHead className="text-right">Sesiones</TableHead>
                          <TableHead className="text-right">Usuarios</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(trafficData?.data || []).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{row.channel}</TableCell>
                            <TableCell className="text-right">{row.sessions.toLocaleString("es-ES")}</TableCell>
                            <TableCell className="text-right">{row.users.toLocaleString("es-ES")}</TableCell>
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

      {/* ==================== AUDIENCE ==================== */}
      {activeTab === "audience" && (
        <div className="space-y-4">
          {devicesLoading || countriesLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Devices Pie Chart */}
              {devicesPieData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-heading">Dispositivos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={devicesPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            label={({ name, percent }: { name: string; percent: number }) =>
                              `${name} (${(percent * 100).toFixed(0)}%)`
                            }
                          >
                            {devicesPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload || !payload.length) return null;
                              const entry = payload[0];
                              return (
                                <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
                                  <p className="text-sm font-medium text-foreground">{entry.name as string}</p>
                                  <p className="text-xs text-muted-foreground">{(entry.value as number).toLocaleString("es-ES")} sesiones</p>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Devices detail cards (mobile-friendly) */}
              {(devicesData?.data || []).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(devicesData?.data || []).map((device, i) => {
                    const IconComponent = DEVICE_ICONS[device.device.toLowerCase()] || Globe;
                    return (
                      <Card key={i}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="rounded-md bg-primary/10 p-2">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium capitalize">{device.device}</p>
                            <p className="text-xs text-muted-foreground">
                              {device.sessions.toLocaleString("es-ES")} sesiones / {device.users.toLocaleString("es-ES")} usuarios
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Countries table */}
              {(countriesData?.data || []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-heading">Paises</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pais</TableHead>
                            <TableHead className="text-right">Usuarios</TableHead>
                            <TableHead className="text-right">Sesiones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(countriesData?.data || []).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{row.country}</TableCell>
                              <TableCell className="text-right">{row.users.toLocaleString("es-ES")}</TableCell>
                              <TableCell className="text-right">{row.sessions.toLocaleString("es-ES")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(devicesData?.data || []).length === 0 && (countriesData?.data || []).length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No hay datos de audiencia disponibles
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ==================== CONVERSIONS ==================== */}
      {activeTab === "conversions" && (
        <div className="space-y-4">
          {conversionsLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
              </CardContent>
            </Card>
          ) : (conversionsData?.data || []).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay datos de conversiones disponibles
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {(conversionsData?.data || []).map((conv, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {CONVERSION_LABELS[conv.event] || conv.event}
                    </CardTitle>
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-heading text-foreground">
                      {conv.count.toLocaleString("es-ES")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">eventos registrados</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
