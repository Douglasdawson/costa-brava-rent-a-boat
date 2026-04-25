import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Target,
  BarChart3,
  Users,
  Loader2,
} from "lucide-react";

// --- Types ---

interface RankingPoint {
  date: string;
  avgPosition: number;
  totalClicks: number;
  totalImpressions: number;
}

interface KeywordPoints {
  date: string;
  position: number;
  clicks: number;
  impressions: number;
}

interface KeywordRanking {
  keywordId: number;
  keyword: string;
  cluster: string | null;
  language: string;
  points: KeywordPoints[];
}

interface Competitor {
  id: number;
  domain: string;
  name: string | null;
  type: string | null;
}

interface ScoreboardEntry {
  keywordId: number;
  keyword: string;
  myPosition: number | null;
  competitors: {
    competitorId: number;
    domain: string;
    position: number | null;
  }[];
}

interface CompetitorTrend {
  competitorId: number;
  domain: string;
  points: { date: string; avgPosition: number }[];
}

interface TrendsResponse {
  rankings: {
    rankings: RankingPoint[];
    byKeyword: KeywordRanking[];
  };
  competitors: {
    competitors: Competitor[];
    scoreboard: ScoreboardEntry[];
    trends: CompetitorTrend[];
  };
}

interface SeoAlert {
  id: number;
  type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

type ActiveCard = "posiciones" | "trafico" | "competidores";

// --- Constants ---

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const DATE_RANGE_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

// --- Helpers ---

const formatDate = (d: string) =>
  format(new Date(d + "T00:00:00"), "d MMM", { locale: es });

// Recharts-compatible label formatter (accepts ReactNode, we cast to string)
const labelFormatter = (label: unknown) => formatDate(String(label));

function getSemaphoreColor(
  card: ActiveCard,
  data: TrendsResponse | undefined,
): string {
  if (!data) return "border-l-muted";

  if (card === "posiciones") {
    const rankings = data.rankings.rankings;
    if (rankings.length === 0) return "border-l-muted";
    const latest = rankings[rankings.length - 1].avgPosition;
    if (latest < 5) return "border-l-emerald-500";
    if (latest <= 10) return "border-l-amber-500";
    return "border-l-red-500";
  }

  if (card === "trafico") {
    const rankings = data.rankings.rankings;
    if (rankings.length < 2) return "border-l-muted";
    const mid = Math.floor(rankings.length / 2);
    const recentClicks = rankings
      .slice(mid)
      .reduce((s, r) => s + r.totalClicks, 0);
    const olderClicks = rankings
      .slice(0, mid)
      .reduce((s, r) => s + r.totalClicks, 0);
    if (olderClicks === 0)
      return recentClicks > 0 ? "border-l-emerald-500" : "border-l-muted";
    const pctChange = ((recentClicks - olderClicks) / olderClicks) * 100;
    if (pctChange > 5) return "border-l-emerald-500";
    if (pctChange >= -5) return "border-l-amber-500";
    return "border-l-red-500";
  }

  // competidores
  const scoreboard = data.competitors.scoreboard;
  if (scoreboard.length === 0) return "border-l-muted";
  let winning = 0;
  let losing = 0;
  for (const entry of scoreboard) {
    if (entry.myPosition === null) continue;
    for (const comp of entry.competitors) {
      if (comp.position === null) continue;
      if (entry.myPosition < comp.position) winning++;
      else if (entry.myPosition > comp.position) losing++;
    }
  }
  if (winning > losing) return "border-l-emerald-500";
  if (winning === losing) return "border-l-amber-500";
  return "border-l-red-500";
}

// --- Sub-components ---

interface MetricCardProps {
  title: string;
  value: string;
  change: number | null;
  subtitle: string;
  icon: React.ReactNode;
  active: boolean;
  semaphoreColor: string;
  changeUnit?: string;
  onClick: () => void;
}

function MetricCard({
  title,
  value,
  change,
  subtitle,
  icon,
  active,
  semaphoreColor,
  changeUnit = "%",
  onClick,
}: MetricCardProps) {
  const isPositive =
    change !== null ? change > 0 : null;
  const isNeutral = change !== null && change === 0;

  return (
    <Card
      className={`border-l-4 ${semaphoreColor} hover:shadow-md transition-all cursor-pointer ${
        active ? "ring-2 ring-primary/50 bg-accent/30" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-md bg-primary/10 p-1.5">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-heading text-foreground">
          {value}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {change !== null && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                isNeutral
                  ? "text-muted-foreground"
                  : isPositive
                    ? "text-primary"
                    : "text-destructive"
              }`}
            >
              {isNeutral ? (
                <Minus className="h-3 w-3" />
              ) : isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {change > 0 ? "+" : ""}
              {change}
              {changeUnit}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SeoTrendChart({
  activeCard,
  data,
  isLoading,
}: {
  activeCard: ActiveCard;
  data: TrendsResponse | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.rankings.rankings.length === 0) return null;

  if (activeCard === "posiciones") {
    // Top 5 keywords by most recent position (lower = better)
    const top5 = [...data.rankings.byKeyword]
      .filter((kw) => kw.points.length > 0)
      .sort((a, b) => {
        const aPos = a.points[a.points.length - 1].position;
        const bPos = b.points[b.points.length - 1].position;
        return aPos - bPos;
      })
      .slice(0, 5);

    // Build chart data: merge all dates
    const allDates = new Set<string>();
    for (const kw of top5) {
      for (const p of kw.points) allDates.add(p.date);
    }
    const sortedDates = [...allDates].sort();
    const chartData = sortedDates.map((date) => {
      const point: Record<string, string | number> = { date };
      for (const kw of top5) {
        const found = kw.points.find((p) => p.date === date);
        if (found) point[kw.keyword] = found.position;
      }
      return point;
    });

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold font-heading text-foreground">
            Posiciones - Top 5 keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  reversed
                  domain={[1, "auto"]}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={labelFormatter}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  iconType="plainline"
                />
                {top5.map((kw, i) => (
                  <Line
                    key={kw.keywordId}
                    type="monotone"
                    dataKey={kw.keyword}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeCard === "trafico") {
    const chartData = data.rankings.rankings.map((r) => ({
      date: r.date,
      clicks: r.totalClicks,
      impressions: r.totalImpressions,
    }));

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold font-heading text-foreground">
            Trafico organico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="clicksGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS[0]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS[0]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="impressionsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS[1]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS[1]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={labelFormatter}
                  formatter={(value: unknown, name: unknown) => [
                    (value as number).toLocaleString("es-ES"),
                    (name as string) === "clicks" ? "Clics" : "Impresiones",
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  formatter={(value: string) =>
                    value === "clicks" ? "Clics" : "Impresiones"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  stroke={CHART_COLORS[1]}
                  strokeWidth={2}
                  fill="url(#impressionsGradient)"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  fill="url(#clicksGradient)"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Competidores chart
  const myTrendData = data.rankings.rankings;
  const competitorTrends = data.competitors.trends;

  // Merge all dates
  const allDates = new Set<string>();
  for (const r of myTrendData) allDates.add(r.date);
  for (const ct of competitorTrends) {
    for (const p of ct.points) allDates.add(p.date);
  }
  const sortedDates = [...allDates].sort();

  const chartData = sortedDates.map((date) => {
    const point: Record<string, string | number> = { date };
    const myPoint = myTrendData.find((r) => r.date === date);
    if (myPoint) point["Mi sitio"] = myPoint.avgPosition;
    for (const ct of competitorTrends) {
      const cp = ct.points.find((p) => p.date === date);
      if (cp) point[ct.domain] = cp.avgPosition;
    }
    return point;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold font-heading text-foreground">
          Posicion media vs competidores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                reversed
                domain={[1, "auto"]}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={false}
                width={35}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={labelFormatter}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                iconType="plainline"
              />
              <Line
                type="monotone"
                dataKey="Mi sitio"
                stroke={CHART_COLORS[0]}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
              {competitorTrends.map((ct, i) => (
                <Line
                  key={ct.competitorId}
                  type="monotone"
                  dataKey={ct.domain}
                  stroke={CHART_COLORS[(i + 1) % CHART_COLORS.length]}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SeoDataTable({
  activeCard,
  data,
  isLoading,
}: {
  activeCard: ActiveCard;
  data: TrendsResponse | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.rankings.byKeyword.length === 0) return null;

  if (activeCard === "posiciones") {
    // Keywords ranked by current position
    const rows = data.rankings.byKeyword
      .filter((kw) => kw.points.length > 0)
      .map((kw) => {
        const latest = kw.points[kw.points.length - 1];
        const prev = kw.points.length >= 2 ? kw.points[kw.points.length - 2] : null;
        const posChange = prev ? prev.position - latest.position : 0;
        const totalClicks = kw.points.reduce((s, p) => s + p.clicks, 0);
        const totalImpr = kw.points.reduce((s, p) => s + p.impressions, 0);
        const ctr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
        return {
          keyword: kw.keyword,
          position: latest.position,
          change: posChange,
          clicks: totalClicks,
          impressions: totalImpr,
          ctr,
        };
      })
      .sort((a, b) => a.position - b.position);

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold font-heading text-foreground">
            Rankings por keyword
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-right">Pos.</TableHead>
                  <TableHead className="text-right">Cambio</TableHead>
                  <TableHead className="text-right">Clics</TableHead>
                  <TableHead className="text-right">Impr.</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.keyword}>
                    <TableCell className="font-medium text-sm">
                      {row.keyword}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.position}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.change !== 0 && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                            row.change > 0 ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {row.change > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {row.change > 0 ? "+" : ""}
                          {row.change}
                        </span>
                      )}
                      {row.change === 0 && (
                        <Minus className="h-3 w-3 text-muted-foreground inline" />
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.clicks.toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.impressions.toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.ctr.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeCard === "trafico") {
    // Traffic by keyword
    const rows = data.rankings.byKeyword
      .filter((kw) => kw.points.length > 0)
      .map((kw) => {
        const totalClicks = kw.points.reduce((s, p) => s + p.clicks, 0);
        const totalImpr = kw.points.reduce((s, p) => s + p.impressions, 0);
        const ctr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
        const avgPos =
          kw.points.reduce((s, p) => s + p.position, 0) / kw.points.length;
        return {
          keyword: kw.keyword,
          clicks: totalClicks,
          impressions: totalImpr,
          ctr,
          avgPosition: avgPos,
        };
      })
      .sort((a, b) => b.clicks - a.clicks);

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold font-heading text-foreground">
            Trafico por keyword
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-right">Clics</TableHead>
                  <TableHead className="text-right">Impr.</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Pos. media</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.keyword}>
                    <TableCell className="font-medium text-sm">
                      {row.keyword}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.clicks.toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.impressions.toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.ctr.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.avgPosition.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Competidores scoreboard
  const scoreboard = data.competitors.scoreboard;
  const competitors = data.competitors.competitors;

  if (scoreboard.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold font-heading text-foreground">
          Comparativa de posiciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-right">Mi pos.</TableHead>
                {competitors.map((c) => (
                  <TableHead key={c.id} className="text-right text-xs">
                    {c.name || c.domain}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoreboard.map((entry) => (
                <TableRow key={entry.keywordId}>
                  <TableCell className="font-medium text-sm">
                    {entry.keyword}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {entry.myPosition ?? "-"}
                  </TableCell>
                  {competitors.map((c) => {
                    const compEntry = entry.competitors.find(
                      (ce) => ce.competitorId === c.id,
                    );
                    const pos = compEntry?.position;
                    const myPos = entry.myPosition;
                    let colorClass = "";
                    if (pos !== null && pos !== undefined && myPos !== null) {
                      if (myPos < pos) colorClass = "text-emerald-600";
                      else if (myPos > pos) colorClass = "text-red-500";
                      else colorClass = "text-amber-500";
                    }
                    return (
                      <TableCell
                        key={c.id}
                        className={`text-right tabular-nums ${colorClass}`}
                      >
                        {pos ?? "-"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---

export function SeoDashboard({ adminToken }: { adminToken: string }) {
  const [dateRange, setDateRange] = useState<number>(30);
  const [activeCard, setActiveCard] = useState<ActiveCard>("posiciones");

  const { data, isLoading } = useQuery<TrendsResponse>({
    queryKey: ["seo", "trends", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/seo/trends?days=${dateRange}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar tendencias");
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: alerts = [] } = useQuery<SeoAlert[]>({
    queryKey: ["seo", "alerts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/seo/alerts", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar alertas");
      return res.json();
    },
    staleTime: 60_000,
  });

  const pendingAlerts = alerts.filter((a) => a.status === "pending");

  // Compute metric card values
  const metrics = useMemo(() => {
    if (!data)
      return {
        avgPosition: null,
        posChange: null,
        totalClicks: null,
        clicksChange: null,
        competitorScore: null,
      };

    const rankings = data.rankings.rankings;

    // Position metrics
    let avgPosition: number | null = null;
    let posChange: number | null = null;
    if (rankings.length > 0) {
      avgPosition = rankings[rankings.length - 1].avgPosition;
      if (rankings.length >= 2) {
        const prevPos = rankings[0].avgPosition;
        // Positive = improved (position went down = better)
        posChange = Math.round((prevPos - avgPosition) * 10) / 10;
      }
    }

    // Traffic metrics
    let totalClicks: number | null = null;
    let clicksChange: number | null = null;
    if (rankings.length > 0) {
      totalClicks = rankings.reduce((s, r) => s + r.totalClicks, 0);
      if (rankings.length >= 2) {
        const mid = Math.floor(rankings.length / 2);
        const recentClicks = rankings
          .slice(mid)
          .reduce((s, r) => s + r.totalClicks, 0);
        const olderClicks = rankings
          .slice(0, mid)
          .reduce((s, r) => s + r.totalClicks, 0);
        if (olderClicks > 0) {
          clicksChange = Math.round(
            ((recentClicks - olderClicks) / olderClicks) * 100,
          );
        } else if (recentClicks > 0) {
          clicksChange = 100;
        }
      }
    }

    // Competitor score
    const scoreboard = data.competitors.scoreboard;
    let competitorScore: string | null = null;
    if (scoreboard.length > 0) {
      let winning = 0;
      let total = 0;
      for (const entry of scoreboard) {
        if (entry.myPosition === null) continue;
        for (const comp of entry.competitors) {
          if (comp.position === null) continue;
          total++;
          if (entry.myPosition < comp.position) winning++;
        }
      }
      competitorScore =
        total > 0 ? `${winning}/${total}` : "0/0";
    }

    return { avgPosition, posChange, totalClicks, clicksChange, competitorScore };
  }, [data]);

  // Empty state
  const hasData =
    data &&
    (data.rankings.rankings.length > 0 ||
      data.rankings.byKeyword.length > 0);

  if (!isLoading && !hasData) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Sin datos de ranking — Anade keywords en el SEO Engine y espera a
              que se recopilen datos (min. 7 dias).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: date range + alerts */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">
            Periodo:
          </span>
          {DATE_RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={dateRange === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(opt.value)}
              className={
                dateRange === opt.value
                  ? ""
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              {opt.label}
            </Button>
          ))}
        </div>
        {pendingAlerts.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <Bell className="h-3 w-3" />
            {pendingAlerts.length} alerta{pendingAlerts.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Posiciones"
          value={
            metrics.avgPosition !== null
              ? metrics.avgPosition.toFixed(1)
              : "-"
          }
          change={metrics.posChange !== null ? metrics.posChange : null}
          changeUnit=""
          subtitle="posicion media"
          icon={<Target className="h-4 w-4 text-primary" />}
          active={activeCard === "posiciones"}
          semaphoreColor={getSemaphoreColor("posiciones", data)}
          onClick={() => setActiveCard("posiciones")}
        />
        <MetricCard
          title="Trafico"
          value={
            metrics.totalClicks !== null
              ? metrics.totalClicks.toLocaleString("es-ES")
              : "-"
          }
          change={metrics.clicksChange}
          subtitle="clics totales"
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
          active={activeCard === "trafico"}
          semaphoreColor={getSemaphoreColor("trafico", data)}
          onClick={() => setActiveCard("trafico")}
        />
        <MetricCard
          title="Competidores"
          value={metrics.competitorScore ?? "-"}
          change={null}
          subtitle="keywords ganando"
          icon={<Users className="h-4 w-4 text-primary" />}
          active={activeCard === "competidores"}
          semaphoreColor={getSemaphoreColor("competidores", data)}
          onClick={() => setActiveCard("competidores")}
        />
      </div>

      {/* Chart */}
      <SeoTrendChart activeCard={activeCard} data={data} isLoading={isLoading} />

      {/* Table */}
      <SeoDataTable activeCard={activeCard} data={data} isLoading={isLoading} />
    </div>
  );
}
