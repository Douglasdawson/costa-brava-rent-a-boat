/**
 * AiMentionsSubTab — citation rate dashboard for the nightly AI Mentions
 * Monitor. Shows:
 *   • headline citation_rate % across all engines
 *   • per-engine citation rate (ChatGPT / Claude / Perplexity / Gemini)
 *   • prompts where we appear vs prompts where we don't
 *   • competitor share-of-voice (alert if any competitor outranks us)
 *   • sentiment breakdown on cited responses
 *   • recent 50 probes with click-to-inspect
 *
 * Data source: /api/admin/ai-mentions/summary. Window selector 7/30/90 days.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Quote, AlertTriangle, ArrowRight, Play, ExternalLink } from "lucide-react";
import { ErrorState } from "./shared/ErrorState";

type WindowDays = 7 | 30 | 90;

interface EngineRow {
  engine: string;
  totalProbes: number;
  citations: number;
  citationRate: number;
}
interface PromptRow {
  prompt: string;
  promptCategory: string | null;
  promptLang: string;
  totalProbes: number;
  citations: number;
  citationRate: number;
}
interface CompetitorRow {
  competitor: string;
  mentions: number;
}
interface SentimentRow {
  sentiment: string;
  count: number;
}
interface RecentRow {
  id: number;
  engine: string;
  prompt: string;
  promptLang: string;
  citedUs: boolean;
  sentiment: string | null;
  citationUrl: string | null;
  competitorsMentioned: string[] | null;
  ranAt: string;
}

interface SummaryResponse {
  windowDays: number;
  byEngine: EngineRow[];
  promptStats: PromptRow[];
  competitors: CompetitorRow[];
  sentiment: SentimentRow[];
  recent: RecentRow[];
  errors: Record<string, string | null>;
}

const WINDOW_OPTIONS: { days: WindowDays; label: string }[] = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
];

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: "bg-emerald-500",
  claude: "bg-orange-500",
  perplexity: "bg-purple-500",
  gemini: "bg-blue-500",
  google_ai_overview: "bg-sky-500",
};

const ENGINE_LABEL: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  perplexity: "Perplexity",
  gemini: "Gemini",
  google_ai_overview: "Google AI Overview",
};

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
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

export function AiMentionsSubTab() {
  const [days, setDays] = useState<WindowDays>(30);

  const { data, isLoading, isError, refetch } = useQuery<SummaryResponse>({
    queryKey: ["admin", "ai-mentions", "summary", days],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ai-mentions/summary?days=${days}&recent=50`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar datos");
      return res.json();
    },
    staleTime: 60_000,
  });

  const runNow = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/ai-mentions/run-now", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPromptsPerEngine: 5 }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError || !data) return <ErrorState />;

  const totalProbes = data.byEngine.reduce((s, r) => s + r.totalProbes, 0);
  const totalCitations = data.byEngine.reduce((s, r) => s + r.citations, 0);
  const globalRate = totalProbes > 0 ? totalCitations / totalProbes : 0;

  // Competitor alert: if any competitor has more mentions than our citations.
  const topCompetitor = data.competitors[0];
  const competitorAlert = topCompetitor && topCompetitor.mentions > totalCitations;

  const promptsWeOwn = data.promptStats.filter((p) => p.citationRate >= 0.5).sort((a, b) => b.citationRate - a.citationRate);
  const promptsWeMiss = data.promptStats.filter((p) => p.citationRate < 0.5 && p.totalProbes >= 2).sort((a, b) => a.citationRate - b.citationRate);

  return (
    <div className="space-y-4">
      {/* Header — global citation rate + window selector */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Citation Rate global · últimos {data.windowDays} días</p>
          <p className="text-4xl font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
            {pct(globalRate)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCitations.toLocaleString("es-ES")} de {totalProbes.toLocaleString("es-ES")} respuestas nos citan
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
          <Button
            variant="outline"
            size="sm"
            disabled={runNow.isPending}
            onClick={() => runNow.mutate()}
            className="min-h-[36px]"
          >
            {runNow.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span className="ml-1.5">Probar ahora</span>
          </Button>
        </div>
      </div>

      {competitorAlert && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">
                "{topCompetitor.competitor}" aparece en {topCompetitor.mentions} respuestas — más que las nuestras ({totalCitations}).
              </p>
              <p className="text-xs mt-0.5 opacity-90">
                Revisar las prompts donde nos pierden y considerar reforzar entity disambiguation en llms.txt / ai-context.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Per-engine rates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Quote className="w-4 h-4" />
            Citation rate por motor IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.byEngine.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aún no hay datos. La primera ejecución programada es a las 02:15 UTC.</p>
          ) : (
            <div className="space-y-2">
              {data.byEngine.map((row) => (
                <div key={row.engine}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium">{ENGINE_LABEL[row.engine] ?? row.engine}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {pct(row.citationRate)} ({row.citations}/{row.totalProbes})
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 ${ENGINE_COLORS[row.engine] ?? "bg-muted-foreground"}`}
                      style={{ width: `${Math.round(row.citationRate * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two columns: prompts we own vs miss */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
              <ArrowRight className="w-4 h-4" />
              Prompts donde aparecemos (top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {promptsWeOwn.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aún no aparecemos en respuestas significativas.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {promptsWeOwn.slice(0, 10).map((p, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className="flex-1 line-clamp-2">
                      <Badge variant="outline" className="mr-1 text-[10px]">{p.promptLang}</Badge>
                      {p.prompt}
                    </span>
                    <span className="text-emerald-700 font-medium tabular-nums">{pct(p.citationRate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
              <ArrowRight className="w-4 h-4" />
              Prompts donde NO aparecemos (oportunidad)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {promptsWeMiss.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Estamos en todas las prompts probadas.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {promptsWeMiss.slice(0, 10).map((p, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className="flex-1 line-clamp-2">
                      <Badge variant="outline" className="mr-1 text-[10px]">{p.promptLang}</Badge>
                      {p.prompt}
                    </span>
                    <span className="text-amber-700 font-medium tabular-nums">{pct(p.citationRate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Competitors + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Competidores mencionados (últimos {days} días)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Ningún competidor mencionado.</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {data.competitors.map((c) => (
                  <li key={c.competitor} className="flex justify-between">
                    <span>{c.competitor}</span>
                    <span className="tabular-nums text-muted-foreground">{c.mentions}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sentiment de respuestas que nos citan</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sentiment.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos de sentiment todavía.</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {data.sentiment.map((s) => (
                  <li key={s.sentiment} className="flex justify-between">
                    <span className="capitalize">{s.sentiment}</span>
                    <span className="tabular-nums text-muted-foreground">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent probes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Últimas 50 sondas</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aún no hay sondas registradas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Motor</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead className="w-20">Citado</TableHead>
                  <TableHead className="w-24">Sentiment</TableHead>
                  <TableHead className="w-32">Cuándo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent.map((r) => (
                  <TableRow key={r.id} className="text-xs">
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{ENGINE_LABEL[r.engine] ?? r.engine}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <span className="line-clamp-2">
                        <span className="text-[10px] text-muted-foreground mr-1">[{r.promptLang}]</span>
                        {r.prompt}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.citedUs ? (
                        r.citationUrl ? (
                          <a href={r.citationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-emerald-700 hover:underline">
                            Sí <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        ) : (
                          <span className="text-emerald-700">Sí</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{r.sentiment ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{relativeTime(r.ranAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
