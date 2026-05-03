/**
 * Sub-tab Diagnóstico: surfaces 3 datasets that the SEO engine already
 * collects but had no UI for:
 *
 *   1. Cannibalization — keyword conflicts where 2+ pages rank for the
 *      same query (Google can't decide which to surface).
 *   2. Orphans — pages in KNOWN_PAGES that no internal link points to
 *      (low crawl frequency, low PageRank distribution).
 *   3. Learnings — insights produced by the IA strategist agent over
 *      time (knowledge base of "what worked").
 *
 * All three load on-demand via React Query. Cannibalization + Orphans
 * call detectors directly (no cron persistence yet); Learnings reads
 * the existing seo_learnings table.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Unlink, Lightbulb, Loader2, CheckCircle2 } from "lucide-react";
import { EmptyState } from "./shared/EmptyState";
import { ErrorState } from "./shared/ErrorState";

interface CannibalizationConflict {
  keyword: string;
  pages: Array<{ page: string; position: number; clicks: number }>;
}

interface CannibalizationResponse {
  count: number;
  conflicts: CannibalizationConflict[];
}

interface OrphansResponse {
  count: number;
  orphans: string[];
}

interface Learning {
  id: number;
  category?: string | null;
  insight: string;
  confidence?: number | null;
  source?: string | null;
  createdAt?: string;
  experimentId?: number | null;
}

function useAdminQuery<T>(key: string[], url: string) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar datos");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center py-6">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export function SeoDiagnosticoSubTab() {
  return (
    <div className="space-y-4">
      <CannibalizationCard />
      <OrphansCard />
      <LearningsCard />
    </div>
  );
}

function CannibalizationCard() {
  const { data, isLoading, isError } = useAdminQuery<CannibalizationResponse>(
    ["admin", "seo", "cannibalization"],
    "/api/admin/seo/cannibalization",
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Canibalización de keywords
          {data && data.count > 0 && (
            <Badge variant="destructive" className="ml-auto">{data.count}</Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Keywords donde 2+ páginas tuyas compiten entre sí en el top 50. Decide cuál es canonical y redirige el resto, o diferencia el intent.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? <LoadingRow /> : isError ? <ErrorState /> : !data || data.count === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Sin canibalización"
            description="Ningún keyword tiene 2+ páginas tuyas peleando en el top 50."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Páginas en conflicto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.conflicts.slice(0, 30).map((c) => (
                  <TableRow key={c.keyword}>
                    <TableCell className="font-medium text-sm">{c.keyword}</TableCell>
                    <TableCell>
                      <ul className="space-y-1">
                        {c.pages.map((p) => (
                          <li key={p.page} className="text-xs flex items-center gap-2">
                            <Badge variant="outline" className="font-mono tabular-nums">#{p.position}</Badge>
                            <span className="truncate max-w-[300px]">{p.page}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {p.clicks > 0 ? `${p.clicks} clics` : "0 clics"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrphansCard() {
  const { data, isLoading, isError } = useAdminQuery<OrphansResponse>(
    ["admin", "seo", "orphans"],
    "/api/admin/seo/orphans",
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Unlink className="w-4 h-4 text-amber-500" />
          Páginas huérfanas
          {data && data.count > 0 && (
            <Badge variant="destructive" className="ml-auto">{data.count}</Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Páginas en el sitemap a las que ningún enlace interno apunta. Reciben menos crawl y menos PageRank. Añade enlaces desde páginas autoritativas (home, blog, footer).
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? <LoadingRow /> : isError ? <ErrorState /> : !data || data.count === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Sin huérfanas"
            description="Todas las páginas conocidas tienen enlaces internos."
          />
        ) : (
          <ul className="space-y-1">
            {data.orphans.map((url) => (
              <li key={url} className="font-mono text-xs text-foreground py-1 px-2 rounded bg-muted/50">
                {url}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LearningsCard() {
  const { data, isLoading, isError } = useAdminQuery<Learning[]>(
    ["admin", "seo", "learnings"],
    "/api/admin/seo/learnings",
  );

  const sorted = data
    ? [...data].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Aprendizajes del agente
          {data && data.length > 0 && (
            <Badge variant="outline" className="ml-auto">{data.length}</Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Insights generados por el agente IA tras experimentos. Mira las de alta confianza primero — son patrones validados.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? <LoadingRow /> : isError ? <ErrorState /> : !data || data.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="Sin aprendizajes aún"
            description="El agente registrará insights conforme corran experimentos."
          />
        ) : (
          <div className="space-y-2">
            {sorted.slice(0, 30).map((l) => (
              <div
                key={l.id}
                className="border-l-2 border-yellow-500/50 pl-3 py-1.5 bg-muted/30 rounded-r"
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {l.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {l.category}
                    </Badge>
                  )}
                  {l.confidence != null && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        l.confidence > 0.7
                          ? "border-green-500/50 text-green-600"
                          : l.confidence > 0.4
                            ? "border-amber-500/50 text-amber-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      conf. {Math.round(l.confidence * 100)}%
                    </Badge>
                  )}
                  {l.createdAt && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {new Date(l.createdAt).toLocaleDateString("es-ES")}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{l.insight}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
