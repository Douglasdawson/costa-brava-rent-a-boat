# SEO Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the SeoTab "Resumen" + "Keywords" + "Competencia" sub-tabs with a card-driven executive dashboard featuring trend charts, semaphore indicators, and competitive scoreboard.

**Architecture:** Three clickable metric cards (Posiciones, Trafico, Competidores) drive a shared chart + table area. Clicking a card switches both. A date-range selector (7d/30d/90d/custom) filters all data. Alerts badge surfaces critical SEO issues. Existing sub-tabs (Campanas, Experimentos, Informes, Salud) remain untouched.

**Tech Stack:** React + TypeScript, Recharts (already installed), shadcn/ui (Card, Table, Badge, Button, Popover), TanStack Query, date-fns

**Design doc:** `docs/plans/2026-04-25-seo-dashboard-design.md`

---

## Task 1: Backend — Add `/api/admin/seo/trends` endpoint

**Files:**
- Modify: `server/routes/admin-seo.ts`
- Modify: `server/storage/seo.ts` (or equivalent SEO storage module)

**Step 1: Add storage method for ranking trends**

In the SEO storage module, add a method that queries `seoRankings` aggregated by date:

```typescript
async getSeoTrends(days: number = 30): Promise<{
  rankings: { date: string; avgPosition: number; totalClicks: number; totalImpressions: number }[];
  byKeyword: { keywordId: number; keyword: string; cluster: string | null; language: string | null; points: { date: string; position: number; clicks: number; impressions: number }[] }[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Aggregated daily totals
  const dailyAgg = await db
    .select({
      date: seoRankings.date,
      avgPosition: sql<number>`round(avg(${seoRankings.position})::numeric, 1)`,
      totalClicks: sql<number>`coalesce(sum(${seoRankings.clicks}), 0)`,
      totalImpressions: sql<number>`coalesce(sum(${seoRankings.impressions}), 0)`,
    })
    .from(seoRankings)
    .where(gte(seoRankings.date, since.toISOString().split("T")[0]))
    .groupBy(seoRankings.date)
    .orderBy(asc(seoRankings.date));

  // Per-keyword time series (top 20 by impressions)
  const topKeywordIds = await db
    .select({ id: seoKeywords.id, keyword: seoKeywords.keyword, cluster: seoKeywords.cluster, language: seoKeywords.language })
    .from(seoKeywords)
    .innerJoin(seoRankings, eq(seoKeywords.id, seoRankings.keywordId))
    .where(and(eq(seoKeywords.tracked, true), gte(seoRankings.date, since.toISOString().split("T")[0])))
    .groupBy(seoKeywords.id, seoKeywords.keyword, seoKeywords.cluster, seoKeywords.language)
    .orderBy(desc(sql`sum(${seoRankings.impressions})`))
    .limit(20);

  const byKeyword = await Promise.all(
    topKeywordIds.map(async (kw) => {
      const points = await db
        .select({
          date: seoRankings.date,
          position: seoRankings.position,
          clicks: sql<number>`coalesce(${seoRankings.clicks}, 0)`,
          impressions: sql<number>`coalesce(${seoRankings.impressions}, 0)`,
        })
        .from(seoRankings)
        .where(and(eq(seoRankings.keywordId, kw.id), gte(seoRankings.date, since.toISOString().split("T")[0])))
        .orderBy(asc(seoRankings.date));
      return { keywordId: kw.id, keyword: kw.keyword, cluster: kw.cluster, language: kw.language, points };
    })
  );

  return { rankings: dailyAgg, byKeyword };
}
```

**Step 2: Add storage method for competitor trends**

```typescript
async getCompetitorTrends(days: number = 30): Promise<{
  competitors: { id: number; name: string; domain: string }[];
  scoreboard: { keywordId: number; keyword: string; myPosition: number | null; competitors: { competitorId: number; position: number | null }[] }[];
  trends: { competitorId: number; points: { date: string; avgPosition: number }[] }[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const competitors = await db.select().from(seoCompetitors).where(eq(seoCompetitors.active, true));

  // Latest position per keyword for me
  const myLatest = await db
    .select({
      keywordId: seoRankings.keywordId,
      keyword: seoKeywords.keyword,
      position: seoRankings.position,
    })
    .from(seoRankings)
    .innerJoin(seoKeywords, eq(seoKeywords.id, seoRankings.keywordId))
    .where(eq(seoKeywords.tracked, true))
    .orderBy(desc(seoRankings.date))
    .limit(50);
  // Deduplicate to latest per keyword
  const myByKeyword = new Map<number, { keyword: string; position: number }>();
  for (const row of myLatest) {
    if (!myByKeyword.has(row.keywordId)) {
      myByKeyword.set(row.keywordId, { keyword: row.keyword, position: row.position });
    }
  }

  // Latest competitor positions
  const compLatest = await db
    .select({
      competitorId: seoCompetitorRankings.competitorId,
      keywordId: seoCompetitorRankings.keywordId,
      position: seoCompetitorRankings.position,
    })
    .from(seoCompetitorRankings)
    .where(gte(seoCompetitorRankings.date, since.toISOString().split("T")[0]))
    .orderBy(desc(seoCompetitorRankings.date));

  // Build scoreboard
  const scoreboard = Array.from(myByKeyword.entries()).map(([kwId, { keyword, position }]) => {
    const compPositions = competitors.map((c) => {
      const found = compLatest.find((r) => r.competitorId === c.id && r.keywordId === kwId);
      return { competitorId: c.id, position: found?.position ?? null };
    });
    return { keywordId: kwId, keyword, myPosition: position, competitors: compPositions };
  });

  // Competitor avg position over time
  const trends = await Promise.all(
    competitors.map(async (c) => {
      const points = await db
        .select({
          date: seoCompetitorRankings.date,
          avgPosition: sql<number>`round(avg(${seoCompetitorRankings.position})::numeric, 1)`,
        })
        .from(seoCompetitorRankings)
        .where(and(eq(seoCompetitorRankings.competitorId, c.id), gte(seoCompetitorRankings.date, since.toISOString().split("T")[0])))
        .groupBy(seoCompetitorRankings.date)
        .orderBy(asc(seoCompetitorRankings.date));
      return { competitorId: c.id, points };
    })
  );

  return { competitors, scoreboard, trends };
}
```

**Step 3: Register the API endpoint**

In `server/routes/admin-seo.ts`, add:

```typescript
app.get("/api/admin/seo/trends", requireAdminSession, async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const [rankings, competitors] = await Promise.all([
      storage.getSeoTrends(days),
      storage.getCompetitorTrends(days),
    ]);
    res.json({ rankings, competitors });
  } catch (error) {
    logger.error("Failed to fetch SEO trends", { error });
    res.status(500).json({ message: "Error al cargar tendencias SEO" });
  }
});
```

**Step 4: Test the endpoint manually**

Run: `npm run dev`
Test: `curl -b cookie.txt 'http://localhost:5000/api/admin/seo/trends?days=30'`
Expected: JSON with `rankings` and `competitors` objects.

**Step 5: Commit**

```bash
git add server/routes/admin-seo.ts server/storage/seo.ts
git commit -m "feat(seo): add /api/admin/seo/trends endpoint for dashboard charts"
```

---

## Task 2: Frontend — Create SeoDashboard component shell

**Files:**
- Create: `client/src/components/crm/SeoDashboard.tsx`

**Step 1: Create the component with state and data fetching**

```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Target,
  BarChart3,
  Users,
} from "lucide-react";

type ActiveCard = "positions" | "traffic" | "competitors";
type DateRange = "7" | "30" | "90" | "custom";

interface TrendPoint {
  date: string;
  avgPosition: number;
  totalClicks: number;
  totalImpressions: number;
}

interface KeywordTrend {
  keywordId: number;
  keyword: string;
  cluster: string | null;
  language: string | null;
  points: { date: string; position: number; clicks: number; impressions: number }[];
}

interface CompetitorInfo {
  id: number;
  name: string;
  domain: string;
}

interface ScoreboardEntry {
  keywordId: number;
  keyword: string;
  myPosition: number | null;
  competitors: { competitorId: number; position: number | null }[];
}

interface CompetitorTrendData {
  competitorId: number;
  points: { date: string; avgPosition: number }[];
}

interface TrendsResponse {
  rankings: {
    rankings: TrendPoint[];
    byKeyword: KeywordTrend[];
  };
  competitors: {
    competitors: CompetitorInfo[];
    scoreboard: ScoreboardEntry[];
    trends: CompetitorTrendData[];
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

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "7", label: "7d" },
  { value: "30", label: "30d" },
  { value: "90", label: "90d" },
];

export function SeoDashboard({ adminToken }: { adminToken: string }) {
  const [activeCard, setActiveCard] = useState<ActiveCard>("positions");
  const [dateRange, setDateRange] = useState<DateRange>("30");

  const { data: trends, isLoading } = useQuery<TrendsResponse>({
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

  const { data: alerts } = useQuery<SeoAlert[]>({
    queryKey: ["seo", "alerts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/seo/alerts", { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar alertas");
      return res.json();
    },
    staleTime: 60_000,
  });

  const pendingAlerts = alerts?.filter((a) => a.status === "pending") ?? [];

  // Compute card metrics from trends data
  const rankings = trends?.rankings.rankings ?? [];
  const currentAvgPos = rankings.length > 0 ? rankings[rankings.length - 1].avgPosition : null;
  const prevAvgPos = rankings.length > 1 ? rankings[0].avgPosition : null;
  const posChange = currentAvgPos != null && prevAvgPos != null ? prevAvgPos - currentAvgPos : null;

  const totalClicks = rankings.reduce((sum, r) => sum + r.totalClicks, 0);
  const halfIdx = Math.floor(rankings.length / 2);
  const firstHalfClicks = rankings.slice(0, halfIdx).reduce((sum, r) => sum + r.totalClicks, 0);
  const secondHalfClicks = rankings.slice(halfIdx).reduce((sum, r) => sum + r.totalClicks, 0);
  const clicksChange = firstHalfClicks > 0 ? Math.round(((secondHalfClicks - firstHalfClicks) / firstHalfClicks) * 100) : 0;

  const scoreboard = trends?.competitors.scoreboard ?? [];
  const winning = scoreboard.filter((s) => {
    if (s.myPosition == null) return false;
    return s.competitors.every((c) => c.position == null || s.myPosition! <= c.position);
  }).length;
  const losing = scoreboard.length - winning;

  return (
    <div className="space-y-4">
      {/* Date range selector + alerts */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground mr-1">Periodo:</span>
          {DATE_RANGES.map((opt) => (
            <Button
              key={opt.value}
              variant={dateRange === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(opt.value)}
              className="min-h-[44px]"
            >
              {opt.label}
            </Button>
          ))}
        </div>
        {pendingAlerts.length > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {pendingAlerts.length} alerta{pendingAlerts.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard
          active={activeCard === "positions"}
          onClick={() => setActiveCard("positions")}
          title="Posiciones"
          icon={Target}
          value={currentAvgPos != null ? `${currentAvgPos}` : "--"}
          subtitle="pos. media"
          change={posChange}
          invertChange
          semaphore={currentAvgPos == null ? "neutral" : currentAvgPos < 5 ? "green" : currentAvgPos <= 10 ? "yellow" : "red"}
          isLoading={isLoading}
        />
        <MetricCard
          active={activeCard === "traffic"}
          onClick={() => setActiveCard("traffic")}
          title="Trafico organico"
          icon={BarChart3}
          value={totalClicks.toLocaleString("es-ES")}
          subtitle="clicks totales"
          change={clicksChange}
          semaphore={clicksChange > 5 ? "green" : clicksChange >= -5 ? "yellow" : "red"}
          isLoading={isLoading}
        />
        <MetricCard
          active={activeCard === "competitors"}
          onClick={() => setActiveCard("competitors")}
          title="Competidores"
          icon={Users}
          value={`${winning}/${scoreboard.length}`}
          subtitle="keywords ganando"
          change={null}
          semaphore={scoreboard.length === 0 ? "neutral" : winning > losing ? "green" : winning === losing ? "yellow" : "red"}
          isLoading={isLoading}
        />
      </div>

      {/* Chart area — Task 3 */}
      <SeoTrendChart
        activeCard={activeCard}
        trends={trends}
        isLoading={isLoading}
      />

      {/* Table area — Task 4 */}
      <SeoDataTable
        activeCard={activeCard}
        trends={trends}
        isLoading={isLoading}
      />
    </div>
  );
}

// --- MetricCard subcomponent ---

function MetricCard({
  active,
  onClick,
  title,
  icon: Icon,
  value,
  subtitle,
  change,
  invertChange,
  semaphore,
  isLoading,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  subtitle: string;
  change: number | null;
  invertChange?: boolean;
  semaphore: "green" | "yellow" | "red" | "neutral";
  isLoading: boolean;
}) {
  const borderColor = {
    green: "border-l-emerald-500",
    yellow: "border-l-amber-500",
    red: "border-l-red-500",
    neutral: "border-l-muted",
  }[semaphore];

  const isPositive = change != null && (invertChange ? change > 0 : change > 0);
  const isNegative = change != null && (invertChange ? change < 0 : change < 0);

  return (
    <Card
      className={`cursor-pointer border-l-4 ${borderColor} transition-all hover:shadow-md ${
        active ? "ring-2 ring-primary/50 bg-accent/30" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-md bg-primary/10 p-1.5">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
        ) : (
          <>
            <div className="text-2xl font-bold font-heading text-foreground">{value}</div>
            <div className="flex items-center gap-2 mt-1">
              {change != null && (
                <span className={`flex items-center text-xs font-medium ${isPositive ? "text-emerald-600" : isNegative ? "text-red-600" : "text-muted-foreground"}`}>
                  {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : isNegative ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                  {invertChange ? (change > 0 ? "+" : "") + change.toFixed(1) : (change > 0 ? "+" : "") + change + "%"}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Placeholder components — implemented in Tasks 3 & 4
function SeoTrendChart(_props: { activeCard: ActiveCard; trends: TrendsResponse | undefined; isLoading: boolean }) {
  return <Card className="p-6 h-[300px] flex items-center justify-center text-muted-foreground">Chart placeholder</Card>;
}

function SeoDataTable(_props: { activeCard: ActiveCard; trends: TrendsResponse | undefined; isLoading: boolean }) {
  return <Card className="p-6 flex items-center justify-center text-muted-foreground">Table placeholder</Card>;
}
```

**Step 2: Commit**

```bash
git add client/src/components/crm/SeoDashboard.tsx
git commit -m "feat(seo): create SeoDashboard component shell with metric cards"
```

---

## Task 3: Frontend — Implement SeoTrendChart

**Files:**
- Modify: `client/src/components/crm/SeoDashboard.tsx` (replace SeoTrendChart placeholder)

**Step 1: Replace the SeoTrendChart placeholder with Recharts implementation**

```typescript
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
```

```typescript
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function SeoTrendChart({
  activeCard,
  trends,
  isLoading,
  selectedKeywordId,
}: {
  activeCard: ActiveCard;
  trends: TrendsResponse | undefined;
  isLoading: boolean;
  selectedKeywordId?: number | null;
}) {
  if (isLoading) {
    return <Card className="p-6 h-[350px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></Card>;
  }

  const rankings = trends?.rankings.rankings ?? [];

  if (rankings.length < 2) {
    return (
      <Card className="p-6 h-[350px] flex items-center justify-center text-muted-foreground">
        Datos insuficientes. Se necesitan al menos 7 dias de tracking.
      </Card>
    );
  }

  const formatDate = (d: string) => format(new Date(d + "T00:00:00"), "d MMM", { locale: es });

  if (activeCard === "positions") {
    // Line chart: top keywords position over time (Y inverted — lower = better)
    const keywords = trends?.rankings.byKeyword.slice(0, 5) ?? [];
    const dates = [...new Set(keywords.flatMap((k) => k.points.map((p) => p.date)))].sort();
    const chartData = dates.map((date) => {
      const point: Record<string, string | number> = { date };
      keywords.forEach((kw) => {
        const found = kw.points.find((p) => p.date === date);
        point[kw.keyword] = found?.position ?? 0;
      });
      return point;
    });

    return (
      <Card className="p-4">
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Posicion por keyword (top 5)
          </CardTitle>
        </CardHeader>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                reversed
                domain={[1, "auto"]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={formatDate}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {keywords.map((kw, i) => (
                <Line
                  key={kw.keywordId}
                  type="monotone"
                  dataKey={kw.keyword}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  }

  if (activeCard === "traffic") {
    // Area chart: clicks + impressions over time
    return (
      <Card className="p-4">
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Clicks e impresiones organicas
          </CardTitle>
        </CardHeader>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rankings} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={45}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={formatDate}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Area
                type="monotone"
                dataKey="totalImpressions"
                name="Impresiones"
                stroke="hsl(var(--chart-2))"
                strokeWidth={1.5}
                fill="url(#impressionsGrad)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="totalClicks"
                name="Clicks"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#clicksGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(var(--chart-1))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  }

  if (activeCard === "competitors") {
    // Line chart: my avg position vs each competitor over time
    const myData = rankings;
    const compTrends = trends?.competitors.trends ?? [];
    const compInfo = trends?.competitors.competitors ?? [];
    const allDates = [...new Set([
      ...myData.map((r) => r.date),
      ...compTrends.flatMap((c) => c.points.map((p) => p.date)),
    ])].sort();

    const chartData = allDates.map((date) => {
      const point: Record<string, string | number> = { date };
      const myPoint = myData.find((r) => r.date === date);
      point["Mi sitio"] = myPoint?.avgPosition ?? 0;
      compTrends.forEach((ct) => {
        const comp = compInfo.find((c) => c.id === ct.competitorId);
        const cp = ct.points.find((p) => p.date === date);
        if (comp && cp) point[comp.name] = cp.avgPosition;
      });
      return point;
    });

    const allNames = ["Mi sitio", ...compInfo.map((c) => c.name)];

    return (
      <Card className="p-4">
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Posicion media vs competidores
          </CardTitle>
        </CardHeader>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                reversed
                domain={[1, "auto"]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={formatDate}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {allNames.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={i === 0 ? "hsl(var(--chart-1))" : CHART_COLORS[(i + 1) % CHART_COLORS.length]}
                  strokeWidth={i === 0 ? 3 : 1.5}
                  strokeDasharray={i === 0 ? undefined : "5 5"}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  }

  return null;
}
```

**Step 2: Commit**

```bash
git add client/src/components/crm/SeoDashboard.tsx
git commit -m "feat(seo): implement SeoTrendChart with position/traffic/competitor views"
```

---

## Task 4: Frontend — Implement SeoDataTable

**Files:**
- Modify: `client/src/components/crm/SeoDashboard.tsx` (replace SeoDataTable placeholder)

**Step 1: Replace the SeoDataTable placeholder**

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function SeoDataTable({
  activeCard,
  trends,
  isLoading,
  onSelectKeyword,
}: {
  activeCard: ActiveCard;
  trends: TrendsResponse | undefined;
  isLoading: boolean;
  onSelectKeyword?: (keywordId: number) => void;
}) {
  if (isLoading) {
    return <Card className="p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" /></Card>;
  }

  if (activeCard === "positions") {
    const keywords = trends?.rankings.byKeyword ?? [];
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rankings por keyword</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-right">Pos.</TableHead>
                <TableHead className="text-right">Cambio</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Impr.</TableHead>
                <TableHead className="text-right">CTR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((kw) => {
                const latest = kw.points[kw.points.length - 1];
                const prev = kw.points.length > 1 ? kw.points[0] : null;
                const posChange = prev ? prev.position - latest.position : 0;
                const totalClicks = kw.points.reduce((s, p) => s + p.clicks, 0);
                const totalImpressions = kw.points.reduce((s, p) => s + p.impressions, 0);
                const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

                return (
                  <TableRow key={kw.keywordId} className="cursor-pointer hover:bg-accent/50">
                    <TableCell className="font-medium">{kw.keyword}</TableCell>
                    <TableCell className="text-right">{latest?.position ?? "--"}</TableCell>
                    <TableCell className="text-right">
                      <span className={posChange > 0 ? "text-emerald-600" : posChange < 0 ? "text-red-600" : "text-muted-foreground"}>
                        {posChange > 0 ? `+${posChange}` : posChange < 0 ? `${posChange}` : "="}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{totalClicks.toLocaleString("es-ES")}</TableCell>
                    <TableCell className="text-right">{totalImpressions.toLocaleString("es-ES")}</TableCell>
                    <TableCell className="text-right">{ctr}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (activeCard === "traffic") {
    // Aggregate clicks/impressions by page from keyword data
    const keywords = trends?.rankings.byKeyword ?? [];
    const pageMap = new Map<string, { clicks: number; impressions: number; positions: number[] }>();
    keywords.forEach((kw) => {
      kw.points.forEach((p) => {
        // Group by keyword as proxy (page data would need extending the endpoint)
        const key = kw.keyword;
        const existing = pageMap.get(key) ?? { clicks: 0, impressions: 0, positions: [] };
        existing.clicks += p.clicks;
        existing.impressions += p.impressions;
        existing.positions.push(p.position);
        pageMap.set(key, existing);
      });
    });

    const rows = Array.from(pageMap.entries())
      .map(([keyword, data]) => ({
        keyword,
        clicks: data.clicks,
        impressions: data.impressions,
        avgPosition: (data.positions.reduce((a, b) => a + b, 0) / data.positions.length).toFixed(1),
        ctr: data.impressions > 0 ? ((data.clicks / data.impressions) * 100).toFixed(1) : "0.0",
      }))
      .sort((a, b) => b.clicks - a.clicks);

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Trafico por keyword</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Impr.</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Pos. media</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.keyword}>
                  <TableCell className="font-medium">{row.keyword}</TableCell>
                  <TableCell className="text-right">{row.clicks.toLocaleString("es-ES")}</TableCell>
                  <TableCell className="text-right">{row.impressions.toLocaleString("es-ES")}</TableCell>
                  <TableCell className="text-right">{row.ctr}%</TableCell>
                  <TableCell className="text-right">{row.avgPosition}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (activeCard === "competitors") {
    const scoreboard = trends?.competitors.scoreboard ?? [];
    const compInfo = trends?.competitors.competitors ?? [];

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Scoreboard: mi posicion vs competidores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-right">Mi pos.</TableHead>
                {compInfo.map((c) => (
                  <TableHead key={c.id} className="text-right">{c.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoreboard.map((row) => (
                <TableRow
                  key={row.keywordId}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => onSelectKeyword?.(row.keywordId)}
                >
                  <TableCell className="font-medium">{row.keyword}</TableCell>
                  <TableCell className="text-right font-bold">{row.myPosition ?? "--"}</TableCell>
                  {compInfo.map((c) => {
                    const comp = row.competitors.find((x) => x.competitorId === c.id);
                    const pos = comp?.position;
                    const isBetter = row.myPosition != null && pos != null && row.myPosition < pos;
                    const isWorse = row.myPosition != null && pos != null && row.myPosition > pos;
                    return (
                      <TableCell
                        key={c.id}
                        className={`text-right ${isBetter ? "text-emerald-600" : isWorse ? "text-red-600" : ""}`}
                      >
                        {pos ?? "--"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return null;
}
```

**Step 2: Add selectedKeywordId state to SeoDashboard and wire it**

In SeoDashboard component, add:
```typescript
const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
```

Pass to both SeoTrendChart and SeoDataTable:
```typescript
<SeoTrendChart activeCard={activeCard} trends={trends} isLoading={isLoading} selectedKeywordId={selectedKeywordId} />
<SeoDataTable activeCard={activeCard} trends={trends} isLoading={isLoading} onSelectKeyword={setSelectedKeywordId} />
```

**Step 3: Commit**

```bash
git add client/src/components/crm/SeoDashboard.tsx
git commit -m "feat(seo): implement SeoDataTable with positions/traffic/competitor views"
```

---

## Task 5: Wire SeoDashboard into SeoTab

**Files:**
- Modify: `client/src/components/crm/SeoTab.tsx`

**Step 1: Update sub-tab config**

Replace the SUB_TABS array and SubTab type:

```typescript
type SubTab = "dashboard" | "campanas" | "experimentos" | "informes" | "salud";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "campanas", label: "Campanas" },
  { id: "experimentos", label: "Experimentos" },
  { id: "informes", label: "Informes" },
  { id: "salud", label: "Salud" },
];
```

**Step 2: Import SeoDashboard and render it**

Add import:
```typescript
import { SeoDashboard } from "./SeoDashboard";
```

Replace the sub-tab rendering section. Remove:
```typescript
{activeSubTab === "resumen" && <ResumenSubTab adminToken={adminToken} />}
{activeSubTab === "keywords" && <KeywordsSubTab adminToken={adminToken} />}
{activeSubTab === "competencia" && <CompetenciaSubTab adminToken={adminToken} />}
```

Add:
```typescript
{activeSubTab === "dashboard" && <SeoDashboard adminToken={adminToken} />}
```

**Step 3: Update default state**

Change:
```typescript
const [activeSubTab, setActiveSubTab] = useState<SubTab>("resumen");
```
To:
```typescript
const [activeSubTab, setActiveSubTab] = useState<SubTab>("dashboard");
```

**Step 4: Clean up unused sub-components**

Remove (or comment out for safety) the `ResumenSubTab`, `KeywordsSubTab`, and `CompetenciaSubTab` function components that are no longer used. Keep `CampanasSubTab`, `ExperimentosSubTab`, `InformesSubTab`, `SaludSubTab` untouched.

**Step 5: Test in browser**

Run: `npm run dev`
Navigate to: CRM > SEO tab
Expected: Dashboard sub-tab loads by default with 3 metric cards, chart area, and table area.

**Step 6: Commit**

```bash
git add client/src/components/crm/SeoTab.tsx
git commit -m "feat(seo): wire SeoDashboard into SeoTab, remove old Resumen/Keywords/Competencia sub-tabs"
```

---

## Task 6: Responsive polish and empty states

**Files:**
- Modify: `client/src/components/crm/SeoDashboard.tsx`

**Step 1: Add mobile responsiveness**

- Metric cards: Already `grid-cols-1 md:grid-cols-3` (stacks on mobile)
- Competitor table: Already has `overflow-x-auto`
- Chart height: Reduce to `h-[250px]` on mobile via responsive class
- Date selector: Wrap with `flex-wrap` (already done)

**Step 2: Add empty states**

When `trends` is loaded but empty (no keywords tracked), show:

```typescript
if (!isLoading && rankings.length === 0) {
  return (
    <div className="space-y-4">
      {/* Date range selector still visible */}
      <Card className="p-12 text-center">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-heading font-semibold mb-2">Sin datos de ranking</h3>
        <p className="text-sm text-muted-foreground">
          Anade keywords en el SEO Engine y espera a que se recopilen datos (min. 7 dias).
        </p>
      </Card>
    </div>
  );
}
```

**Step 3: Test edge cases in browser**

- Test with 7d/30d/90d range switches
- Test clicking between cards
- Test competitor scoreboard click -> chart filter
- Test on mobile viewport (375px width)

**Step 4: Commit**

```bash
git add client/src/components/crm/SeoDashboard.tsx
git commit -m "feat(seo): add responsive polish and empty states to dashboard"
```

---

## Task 7: Type check and final verification

**Step 1: Run type checker**

Run: `npx tsc --noEmit`
Expected: No errors in SeoDashboard.tsx or SeoTab.tsx

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new warnings/errors

**Step 3: Run full check**

Run: `npm run check:all`
Expected: All checks pass

**Step 4: Final browser verification**

1. Open CRM > SEO tab
2. Verify Dashboard loads by default
3. Click each metric card — chart and table switch
4. Change date range — data refreshes
5. Click keyword in competitor scoreboard — chart filters
6. Switch to Campanas/Experimentos/Informes/Salud — all still work
7. Test on mobile viewport

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(seo): address type/lint issues in SEO dashboard"
```
