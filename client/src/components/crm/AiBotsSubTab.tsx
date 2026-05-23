/**
 * AiBotsSubTab — visualización de visitas de crawlers LLM
 *
 * Renderiza los datos de /api/admin/seo/bot-visits en 3 secciones:
 * - Conteo por bot (con barra de proporción)
 * - Top paths más crawleados
 * - Hits recientes (últimos 50)
 *
 * Selector de ventana 7/30/90 días en cabecera. Datos vivos via React Query.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bot, Loader2, Activity, FileText, Clock, Hourglass, AlertTriangle, Download } from "lucide-react";
import { EmptyState } from "./shared/EmptyState";
import { ErrorState } from "./shared/ErrorState";

type WindowDays = 7 | 30 | 90;

interface BotCount {
  botName: string;
  visits: number;
}

interface PathCount {
  path: string;
  visits: number;
}

interface RecentVisit {
  botName: string;
  path: string;
  timestamp: string;
  statusCode: number | null;
}

interface BotVisitsResponse {
  windowDays: number;
  totalVisits: number;
  byBot: BotCount[];
  topPaths: PathCount[];
  recent: RecentVisit[];
  errors: {
    byBot: string | null;
    topPaths: string | null;
    recent: string | null;
  };
}

interface HourlyBucket {
  hour: number;
  visits: number;
}

interface TimingResponse {
  windowDays: number;
  botName: string | null;
  path: string | null;
  total: number;
  buckets: HourlyBucket[];
}

const WINDOW_OPTIONS: { days: WindowDays; label: string }[] = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
];

// Color por bot — se aplica a la barra de proporción y al badge.
function botBarColor(botName: string): string {
  const map: Record<string, string> = {
    "GPTBot": "bg-emerald-500",
    "ChatGPT-User": "bg-emerald-400",
    "ClaudeBot": "bg-orange-500",
    "Claude-Web": "bg-orange-400",
    "Anthropic": "bg-orange-300",
    "PerplexityBot": "bg-purple-500",
    "Google-Extended": "bg-blue-500",
    "Meta-ExternalAgent": "bg-sky-500",
    "Bytespider": "bg-pink-500",
    "Amazonbot": "bg-amber-500",
    "Applebot-Extended": "bg-slate-500",
    "CCBot": "bg-indigo-500",
  };
  return map[botName] ?? "bg-muted-foreground";
}

function statusCodeColor(code: number | null): string {
  if (code == null) return "text-muted-foreground";
  if (code >= 200 && code < 300) return "text-emerald-600";
  if (code >= 300 && code < 400) return "text-amber-600";
  if (code >= 400 && code < 500) return "text-orange-600";
  return "text-red-600";
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return `hace ${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `hace ${diffD}d`;
}

export function AiBotsSubTab() {
  const [days, setDays] = useState<WindowDays>(30);

  const { data, isLoading, isError } = useQuery<BotVisitsResponse>({
    queryKey: ["admin", "seo", "bot-visits", days],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/seo/bot-visits?days=${days}&topPaths=20&recent=50`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Error al cargar datos");
      return res.json();
    },
    staleTime: 60_000,
  });

  interface LastSeenRow {
    botName: string;
    lastSeen: string;
    visits7d: number;
    visits30d: number;
  }
  interface LastSeenResponse {
    rows: LastSeenRow[];
    unknownBots: LastSeenRow[];
    canonicalBots: string[];
  }
  const { data: lastSeenData } = useQuery<LastSeenResponse>({
    queryKey: ["admin", "seo", "bot-visits", "last-seen"],
    queryFn: async () => {
      const res = await fetch("/api/admin/seo/bot-visits/last-seen", { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar last-seen");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) return <ErrorState />;

  const totalForBars = data.byBot.reduce((sum, row) => sum + row.visits, 0);

  return (
    <div className="space-y-4">
      {/* Header: window selector + total */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            Visitas de crawlers LLM en los últimos {data.windowDays} días
          </p>
          <p className="text-3xl font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
            {data.totalVisits.toLocaleString("es-ES")}
          </p>
        </div>
        <div className="flex gap-1.5 items-center">
          {WINDOW_OPTIONS.map((opt) => (
            <Button
              key={opt.days}
              variant={days === opt.days ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(opt.days)}
              className="min-h-[36px]"
            >
              {opt.label}
            </Button>
          ))}
          <a
            href={`/api/admin/seo/bot-visits/export.csv?days=${days}`}
            className="inline-flex items-center gap-1.5 px-3 min-h-[36px] text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            data-testid="export-bot-visits-csv"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </a>
        </div>
      </div>

      {lastSeenData?.unknownBots && lastSeenData.unknownBots.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">
                Bot{lastSeenData.unknownBots.length > 1 ? "s" : ""} desconocido{lastSeenData.unknownBots.length > 1 ? "s" : ""} detectado{lastSeenData.unknownBots.length > 1 ? "s" : ""}: {lastSeenData.unknownBots.length}
              </p>
              <p className="text-xs mt-0.5 opacity-90">
                User-agents fuera de AI_CRAWLER_NAMES — revisar y añadirlos a la lista canónica si son crawlers IA legítimos.
              </p>
              <ul className="mt-2 text-xs space-y-0.5">
                {lastSeenData.unknownBots.slice(0, 5).map((b) => (
                  <li key={b.botName} className="font-mono">
                    {b.botName} · {b.visits30d} hits 30d · última visita {relativeTime(b.lastSeen)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: bot breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Conteo por bot
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.errors.byBot ? (
            <p className="text-xs text-destructive">{data.errors.byBot}</p>
          ) : data.byBot.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="Sin visitas"
              description="Ningún crawler LLM ha pegado en este periodo"
            />
          ) : (
            <div className="space-y-2">
              {data.byBot.map((row) => {
                const pct = totalForBars > 0 ? (row.visits / totalForBars) * 100 : 0;
                return (
                  <div key={row.botName} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{row.botName}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {row.visits.toLocaleString("es-ES")}{" "}
                        <span className="text-xs">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${botBarColor(row.botName)}`}
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: top paths */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Top paths crawleados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.errors.topPaths ? (
            <p className="text-xs text-destructive">{data.errors.topPaths}</p>
          ) : data.topPaths.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sin paths"
              description="Aún no hay paths registrados"
            />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead className="text-right w-24">Hits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topPaths.map((row) => (
                    <TableRow key={row.path}>
                      <TableCell className="font-mono text-xs truncate max-w-[300px]">
                        {row.path}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.visits.toLocaleString("es-ES")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2.5: hourly distribution (share vs crawl signal) */}
      <HourlyTimingCard days={days} byBot={data.byBot} topPaths={data.topPaths} />

      {/* Section 3: recent hits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hits recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.errors.recent ? (
            <p className="text-xs text-destructive">{data.errors.recent}</p>
          ) : data.recent.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Sin hits recientes"
              description="Aún no hay actividad registrada"
            />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bot</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead className="text-center w-20">Status</TableHead>
                    <TableHead className="text-right w-24">Cuándo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recent.map((hit, i) => (
                    <TableRow key={`${hit.timestamp}-${i}`}>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {hit.botName}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[260px]">
                        {hit.path}
                      </TableCell>
                      <TableCell className={`text-center font-mono text-xs ${statusCodeColor(hit.statusCode)}`}>
                        {hit.statusCode ?? "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                        {relativeTime(hit.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Hourly Timing Card ---
//
// Shows the 24-hour distribution of hits for a chosen bot+path combo.
// Uniform across all 24 hours → crawl-driven (training / regular crawler).
// Clusters at human-active hours (12-15h, 19-23h Europe/Madrid) → share-driven
// (somebody is sharing the URL on Meta-owned platforms — WhatsApp, IG, FB).
//
// Defaults to (Meta-ExternalAgent, /) because that's the noisy combo the
// dashboard surfaced first; the user can switch to any other bot+path.

interface HourlyTimingCardProps {
  days: WindowDays;
  byBot: BotCount[];
  topPaths: PathCount[];
}

function HourlyTimingCard({ days, byBot, topPaths }: HourlyTimingCardProps) {
  const defaultBot = byBot[0]?.botName ?? "Meta-ExternalAgent";
  const defaultPath = topPaths[0]?.path ?? "/";
  const [bot, setBot] = useState<string>(defaultBot);
  const [path, setPath] = useState<string>(defaultPath);

  const { data, isLoading, isError } = useQuery<TimingResponse>({
    queryKey: ["admin", "seo", "bot-visits", "timing", days, bot, path],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: String(days),
        ...(bot ? { bot } : {}),
        ...(path ? { path } : {}),
      });
      const res = await fetch(`/api/admin/seo/bot-visits/timing?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar timing");
      return res.json();
    },
    staleTime: 60_000,
  });

  const maxVisits = data ? Math.max(1, ...data.buckets.map((b) => b.visits)) : 1;
  // Heuristic: standard deviation across 24 hours, normalized by mean.
  // Low CV (<0.5) → uniform → crawl. High CV (>1) → bursty → share/human.
  const interpretation = (() => {
    if (!data || data.total < 24) return null;
    const mean = data.total / 24;
    const variance =
      data.buckets.reduce((sum, b) => sum + (b.visits - mean) ** 2, 0) / 24;
    const std = Math.sqrt(variance);
    const cv = mean > 0 ? std / mean : 0;
    if (cv < 0.5) return { label: "Uniforme — patrón de crawler automático", color: "text-blue-600" };
    if (cv < 1.0) return { label: "Mixto — algo de cluster, posible mezcla", color: "text-amber-600" };
    return { label: "Concentrado en franjas — probable share humano", color: "text-emerald-600" };
  })();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Hourglass className="w-4 h-4" />
          Distribución horaria (UTC)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            Bot:
            <select
              value={bot}
              onChange={(e) => setBot(e.target.value)}
              className="border rounded px-2 py-1 text-xs bg-background min-h-[36px]"
            >
              {byBot.map((b) => (
                <option key={b.botName} value={b.botName}>
                  {b.botName} ({b.visits})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            Path:
            <select
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="border rounded px-2 py-1 text-xs bg-background min-h-[36px] max-w-[260px]"
            >
              {topPaths.slice(0, 20).map((p) => (
                <option key={p.path} value={p.path}>
                  {p.path} ({p.visits})
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !data ? (
          <p className="text-xs text-destructive">Error al cargar timing</p>
        ) : data.total === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sin hits para {bot} en {path} en los últimos {data.windowDays} días.
          </p>
        ) : (
          <>
            <div className="text-xs text-muted-foreground">
              {data.total.toLocaleString("es-ES")} hits totales
              {interpretation && (
                <>
                  {" · "}
                  <span className={`font-medium ${interpretation.color}`}>{interpretation.label}</span>
                </>
              )}
            </div>
            <div className="grid grid-cols-24 gap-[2px] items-end h-32" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
              {data.buckets.map((bucket) => {
                const heightPct = (bucket.visits / maxVisits) * 100;
                return (
                  <div
                    key={bucket.hour}
                    className="flex flex-col items-center justify-end h-full"
                    title={`${bucket.hour.toString().padStart(2, "0")}:00 — ${bucket.visits} hits`}
                  >
                    <div
                      className="w-full bg-primary/70 hover:bg-primary transition-colors rounded-t"
                      style={{ height: `${Math.max(2, heightPct)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-24 gap-[2px] text-[9px] text-muted-foreground tabular-nums" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
              {data.buckets.map((bucket) => (
                <div key={bucket.hour} className="text-center">
                  {bucket.hour % 3 === 0 ? bucket.hour.toString().padStart(2, "0") : ""}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Horas en UTC. España = UTC+1 (invierno) / UTC+2 (verano), suma 1 o 2 al eje X para hora local.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
