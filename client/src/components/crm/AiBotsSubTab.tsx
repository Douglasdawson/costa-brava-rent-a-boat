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
import { Bot, Loader2, Activity, FileText, Clock } from "lucide-react";
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
        <div className="flex gap-1.5">
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
        </div>
      </div>

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
