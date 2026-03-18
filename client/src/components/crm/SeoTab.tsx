import { useState } from "react";
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
import {
  Search,
  Target,
  FlaskConical,
  Bell,
  ArrowUpDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Globe,
  Activity,
  FileText,
  HeartPulse,
  Beaker,
  Users,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "./shared/StatCard";
import { EmptyState } from "./shared/EmptyState";
import { ErrorState } from "./shared/ErrorState";

// --- Types ---

interface SeoTabProps {
  adminToken: string;
}

interface DashboardStats {
  trackedKeywords: number;
  activeCampaigns: number;
  runningExperiments: number;
  pendingAlerts: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  topKeywords: Array<{
    seo_rankings: {
      id: number;
      position: string | null;
      clicks: number | null;
      impressions: number | null;
      ctr: string | null;
    };
    seo_keywords: {
      id: number;
      keyword: string;
      language: string;
      intent: string | null;
    };
  }>;
}

interface SeoAlert {
  id: number;
  type: string;
  severity: string;
  title: string;
  message: string | null;
  status: string | null;
  createdAt: string;
}

interface KeywordRow {
  seo_keywords: {
    id: number;
    keyword: string;
    language: string;
    intent: string | null;
  };
  seo_rankings: {
    position: string | null;
    clicks: number | null;
    impressions: number | null;
    ctr: string | null;
  };
}

interface Campaign {
  id: number;
  name: string;
  objective: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  progress: Record<string, unknown> | null;
  createdAt: string;
}

interface Competitor {
  id: number;
  domain: string;
  name: string | null;
  type: string | null;
  active: boolean;
}

interface Experiment {
  id: number;
  type: string | null;
  page: string | null;
  hypothesis: string | null;
  status: string | null;
  learning: string | null;
  agentReasoning: string | null;
  executedAt: string | null;
}

interface SeoReport {
  id: number;
  type: string;
  periodStart: string;
  periodEnd: string;
  summary: string | null;
  createdAt: string;
}

interface HealthCheck {
  id: number;
  url: string;
  status: number | null;
  loadTimeMs: number | null;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  hasCanonical: boolean;
  hasHreflang: boolean;
  hasSchemaOrg: boolean;
  checkedAt: string | null;
}

interface CwvMetric {
  p75: number;
  rating: string;
  samples: number;
}

interface CwvPageSummary {
  page: string;
  metrics: Record<string, CwvMetric>;
}

interface CwvSummaryResponse {
  summary: CwvPageSummary[];
  hasAlert: boolean;
}

// --- Sub-tab definitions ---

type SubTab = "resumen" | "keywords" | "campanas" | "competencia" | "experimentos" | "informes" | "salud";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "keywords", label: "Keywords" },
  { id: "campanas", label: "Campanas" },
  { id: "competencia", label: "Competencia" },
  { id: "experimentos", label: "Experimentos" },
  { id: "informes", label: "Informes" },
  { id: "salud", label: "Salud" },
];

// --- Helpers ---

function severityBadge(severity: string) {
  const variants: Record<string, string> = {
    critical: "bg-red-500/10 text-red-600 border-red-200",
    high: "bg-orange-500/10 text-orange-600 border-orange-200",
    medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    low: "bg-blue-500/10 text-blue-600 border-blue-200",
  };
  return variants[severity] || "bg-muted text-muted-foreground";
}

function statusBadge(status: string | null) {
  const s = status || "draft";
  const variants: Record<string, string> = {
    active: "bg-green-500/10 text-green-600 border-green-200",
    running: "bg-blue-500/10 text-blue-600 border-blue-200",
    paused: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    completed: "bg-blue-500/10 text-blue-600 border-blue-200",
    success: "bg-green-500/10 text-green-600 border-green-200",
    failed: "bg-red-500/10 text-red-600 border-red-200",
    inconclusive: "bg-muted text-muted-foreground",
    draft: "bg-muted text-muted-foreground",
    new: "bg-orange-500/10 text-orange-600 border-orange-200",
    acknowledged: "bg-muted text-muted-foreground",
  };
  return variants[s] || "bg-muted text-muted-foreground";
}

function httpStatusColor(status: number | null) {
  if (!status) return "text-muted-foreground";
  if (status >= 200 && status < 300) return "text-green-600";
  if (status >= 300 && status < 400) return "text-yellow-600";
  return "text-red-600";
}

function useSeoQuery<T>(key: string, endpoint: string, adminToken: string, enabled: boolean) {
  return useQuery<T>({
    queryKey: ["seo", key],
    queryFn: async () => {
      const res = await fetch(`/api/admin/seo/${endpoint}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Error al cargar datos");
      return res.json();
    },
    enabled,
    staleTime: 60_000,
  });
}

// --- Main Component ---

export function SeoTab({ adminToken }: SeoTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("resumen");

  return (
    <div className="space-y-4">
      {/* Sub-tab navigation */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
        {SUB_TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab(tab.id)}
            className="min-h-[44px] min-w-[44px] flex-shrink-0"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Sub-tab content */}
      {activeSubTab === "resumen" && <ResumenSubTab adminToken={adminToken} />}
      {activeSubTab === "keywords" && <KeywordsSubTab adminToken={adminToken} />}
      {activeSubTab === "campanas" && <CampanasSubTab adminToken={adminToken} />}
      {activeSubTab === "competencia" && <CompetenciaSubTab adminToken={adminToken} />}
      {activeSubTab === "experimentos" && <ExperimentosSubTab adminToken={adminToken} />}
      {activeSubTab === "informes" && <InformesSubTab adminToken={adminToken} />}
      {activeSubTab === "salud" && <SaludSubTab adminToken={adminToken} />}
    </div>
  );
}

// --- Sub-tab: Resumen ---

function ResumenSubTab({ adminToken }: { adminToken: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dashboard, isLoading: dashLoading, isError: dashError } = useSeoQuery<DashboardResponse>(
    "dashboard", "dashboard", adminToken, true
  );
  const { data: alerts, isLoading: alertsLoading, isError: alertsError } = useSeoQuery<SeoAlert[]>(
    "alerts", "alerts", adminToken, true
  );

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await fetch(`/api/admin/seo/alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["seo", "dashboard"] });
      toast({ title: "Alerta resuelta" });
    },
  });

  if (dashLoading || alertsLoading) return <LoadingSpinner />;
  if (dashError || alertsError) return <ErrorState />;

  const stats = dashboard?.stats;
  const pendingAlerts = alerts?.filter((a) => a.status === "new") || [];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Keywords" value={stats?.trackedKeywords ?? 0} icon={Search} />
        <StatCard title="Campanas activas" value={stats?.activeCampaigns ?? 0} icon={Target} />
        <StatCard title="Experimentos" value={stats?.runningExperiments ?? 0} icon={FlaskConical} />
        <StatCard
          title="Alertas"
          value={stats?.pendingAlerts ?? 0}
          icon={Bell}
          description={(stats?.pendingAlerts ?? 0) > 0 ? "Pendientes" : "Sin alertas"}
        />
      </div>

      {/* Top keywords */}
      {dashboard?.topKeywords && dashboard.topKeywords.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">Top Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2 px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead className="text-right">Pos.</TableHead>
                    <TableHead className="text-right">Clics</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Impr.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.topKeywords.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {row.seo_keywords.keyword}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.seo_rankings.position ? Number(row.seo_rankings.position).toFixed(1) : "-"}
                      </TableCell>
                      <TableCell className="text-right">{row.seo_rankings.clicks ?? 0}</TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {row.seo_rankings.impressions ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {pendingAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alertas pendientes ({pendingAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={severityBadge(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm font-medium">{alert.title}</span>
                  </div>
                  {alert.message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] min-w-[44px] flex-shrink-0"
                  onClick={() => acknowledgeMutation.mutate(alert.id)}
                  disabled={acknowledgeMutation.isPending}
                >
                  {acknowledgeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Resolver"
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Core Web Vitals */}
      <CwvWidget adminToken={adminToken} />

      {!dashboard?.topKeywords?.length && pendingAlerts.length === 0 && (
        <EmptyState
          icon={Search}
          title="Sin datos SEO"
          description="El motor SEO aun no ha recopilado datos"
        />
      )}
    </div>
  );
}

// --- Sub-tab: Keywords ---

function KeywordsSubTab({ adminToken }: { adminToken: string }) {
  const [sortField, setSortField] = useState<"position" | "clicks" | "impressions" | "ctr">("impressions");
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading, isError } = useSeoQuery<KeywordRow[]>(
    "keywords", "keywords", adminToken, true
  );

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState />;
  if (!data?.length) return <EmptyState icon={Search} title="Sin keywords" description="No hay keywords rastreados" />;

  const sorted = [...data].sort((a, b) => {
    const aVal = Number(a.seo_rankings[sortField]) || 0;
    const bVal = Number(b.seo_rankings[sortField]) || 0;
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const SortHeader = ({ field, children }: { field: typeof sortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none text-right"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-3 h-3" />
      </span>
    </TableHead>
  );

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="overflow-x-auto -mx-2 px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <SortHeader field="position">Pos.</SortHeader>
                <SortHeader field="clicks">Clics</SortHeader>
                <SortHeader field="impressions">Impr.</SortHeader>
                <SortHeader field="ctr">
                  <span className="hidden md:inline">CTR</span>
                  <span className="md:hidden">CTR</span>
                </SortHeader>
                <TableHead className="hidden md:table-cell">Idioma</TableHead>
                <TableHead className="hidden md:table-cell">Intent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {row.seo_keywords.keyword}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.seo_rankings.position ? Number(row.seo_rankings.position).toFixed(1) : "-"}
                  </TableCell>
                  <TableCell className="text-right">{row.seo_rankings.clicks ?? 0}</TableCell>
                  <TableCell className="text-right">{row.seo_rankings.impressions ?? 0}</TableCell>
                  <TableCell className="text-right">
                    {row.seo_rankings.ctr ? (Number(row.seo_rankings.ctr) * 100).toFixed(1) + "%" : "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{row.seo_keywords.language}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {row.seo_keywords.intent || "-"}
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

// --- Sub-tab: Campanas ---

function CampanasSubTab({ adminToken }: { adminToken: string }) {
  const { data, isLoading, isError } = useSeoQuery<Campaign[]>(
    "campaigns", "campaigns", adminToken, true
  );

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState />;
  if (!data?.length) return <EmptyState icon={Target} title="Sin campanas" description="No hay campanas SEO creadas" />;

  return (
    <div className="space-y-3">
      {data.map((campaign) => {
        const progress = campaign.progress as Record<string, unknown> | null;
        const pct = progress && typeof progress.percentage === "number" ? progress.percentage : null;
        return (
          <Card key={campaign.id}>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{campaign.name}</h3>
                  {campaign.objective && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{campaign.objective}</p>
                  )}
                </div>
                <Badge variant="outline" className={statusBadge(campaign.status)}>
                  {campaign.status || "draft"}
                </Badge>
              </div>
              {campaign.startDate && campaign.endDate && (
                <p className="text-xs text-muted-foreground">
                  {campaign.startDate} — {campaign.endDate}
                </p>
              )}
              {pct !== null && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// --- Sub-tab: Competencia ---

function CompetenciaSubTab({ adminToken }: { adminToken: string }) {
  const { data, isLoading, isError } = useSeoQuery<Competitor[]>(
    "competitors", "competitors", adminToken, true
  );

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState />;
  if (!data?.length) return <EmptyState icon={Users} title="Sin competidores" description="No hay competidores registrados" />;

  return (
    <>
      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {data.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{c.domain}</p>
                  {c.name && <p className="text-xs text-muted-foreground">{c.name}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.type && <Badge variant="outline">{c.type}</Badge>}
                  <Badge variant="outline" className={c.active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}>
                    {c.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: table */}
      <Card className="hidden md:block">
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dominio</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.domain}</TableCell>
                  <TableCell>{c.name || "-"}</TableCell>
                  <TableCell>{c.type || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}>
                      {c.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

// --- Sub-tab: Experimentos ---

function ExperimentosSubTab({ adminToken }: { adminToken: string }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading, isError } = useSeoQuery<Experiment[]>(
    "experiments", "experiments", adminToken, true
  );

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState />;
  if (!data?.length) return <EmptyState icon={FlaskConical} title="Sin experimentos" description="No hay experimentos SEO" />;

  return (
    <div className="space-y-3">
      {data.map((exp) => (
        <Card key={exp.id}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {exp.type && <Badge variant="outline">{exp.type}</Badge>}
                  <Badge variant="outline" className={statusBadge(exp.status)}>
                    {exp.status || "draft"}
                  </Badge>
                </div>
                {exp.page && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{exp.page}</p>
                )}
              </div>
            </div>
            {exp.hypothesis && (
              <p className="text-sm">{exp.hypothesis}</p>
            )}
            {exp.learning && (exp.status === "success" || exp.status === "completed" || exp.status === "failed" || exp.status === "inconclusive") && (
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Aprendizaje</p>
                <p className="text-sm">{exp.learning}</p>
              </div>
            )}
            {exp.agentReasoning && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] p-0 text-xs text-muted-foreground"
                onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
              >
                {expandedId === exp.id ? (
                  <ChevronUp className="w-3 h-3 mr-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 mr-1" />
                )}
                Razonamiento del agente
              </Button>
            )}
            {expandedId === exp.id && exp.agentReasoning && (
              <p className="text-xs text-muted-foreground bg-muted/30 rounded p-2 whitespace-pre-wrap">
                {exp.agentReasoning}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Sub-tab: Informes ---

function InformesSubTab({ adminToken }: { adminToken: string }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading, isError } = useSeoQuery<SeoReport[]>(
    "reports", "reports", adminToken, true
  );

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState />;
  if (!data?.length) return <EmptyState icon={FileText} title="Sin informes" description="No hay informes SEO generados" />;

  return (
    <div className="space-y-3">
      {data.map((report) => (
        <Card key={report.id}>
          <CardContent className="pt-4">
            <div
              className="cursor-pointer"
              onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{report.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {report.periodStart} — {report.periodEnd}
                    </span>
                  </div>
                  {report.summary && (
                    <p className={`text-sm mt-1 ${expandedId === report.id ? "" : "line-clamp-2"}`}>
                      {report.summary}
                    </p>
                  )}
                </div>
                {expandedId === report.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Sub-tab: Salud ---

function SaludSubTab({ adminToken }: { adminToken: string }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading, isError } = useSeoQuery<HealthCheck[]>(
    "health", "health", adminToken, true
  );

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState />;
  if (!data?.length) return <EmptyState icon={HeartPulse} title="Sin datos de salud" description="No hay health checks realizados" />;

  const totalChecks = data.length;
  const healthyPages = data.filter(
    (h) => h.status !== null && h.status >= 200 && h.status < 300 && h.hasMetaTitle && h.hasMetaDescription
  ).length;
  const healthScore = totalChecks > 0 ? Math.round((healthyPages / totalChecks) * 100) : 0;

  const BoolIcon = ({ value }: { value: boolean }) =>
    value ? (
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400" />
    );

  return (
    <div className="space-y-4">
      {/* Global score */}
      <Card>
        <CardContent className="pt-4 flex items-center gap-4">
          <div
            className={`text-3xl font-bold ${
              healthScore >= 80 ? "text-green-600" : healthScore >= 50 ? "text-yellow-600" : "text-red-600"
            }`}
          >
            {healthScore}%
          </div>
          <div>
            <p className="text-sm font-medium">Salud SEO</p>
            <p className="text-xs text-muted-foreground">
              {healthyPages} de {totalChecks} paginas sin problemas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Health checks list */}
      <div className="space-y-2">
        {data.map((check) => (
          <Card key={check.id}>
            <CardContent className="pt-3 pb-3">
              <div
                className="flex items-center justify-between gap-2 cursor-pointer"
                onClick={() => setExpandedId(expandedId === check.id ? null : check.id)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`font-mono text-sm font-bold ${httpStatusColor(check.status)}`}>
                    {check.status || "?"}
                  </span>
                  <span className="text-sm truncate">{check.url}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {check.loadTimeMs !== null && (
                    <span className="text-xs text-muted-foreground">{check.loadTimeMs}ms</span>
                  )}
                  {expandedId === check.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              {expandedId === check.id && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1.5 text-xs">
                    <BoolIcon value={check.hasMetaTitle} />
                    <span>Meta title</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <BoolIcon value={check.hasMetaDescription} />
                    <span>Description</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <BoolIcon value={check.hasCanonical} />
                    <span>Canonical</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <BoolIcon value={check.hasHreflang} />
                    <span>Hreflang</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <BoolIcon value={check.hasSchemaOrg} />
                    <span>Schema.org</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- CWV Widget ---

const CWV_METRIC_NAMES = ["CLS", "LCP", "INP", "TTFB", "FCP"] as const;

function cwvRatingColor(rating: string): string {
  if (rating === "good") return "text-green-600";
  if (rating === "needs-improvement") return "text-yellow-600";
  if (rating === "poor") return "text-red-600";
  return "text-muted-foreground";
}

function formatCwvValue(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

function CwvWidget({ adminToken }: { adminToken: string }) {
  const { data, isLoading, isError } = useQuery<CwvSummaryResponse>({
    queryKey: ["cwv-summary"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cwv-summary", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Error al cargar CWV");
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) return null;
  if (isError || !data?.summary?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Core Web Vitals (7d)
          {data.hasAlert && (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 ml-auto">
              Metricas pobres
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-2 px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pagina</TableHead>
                {CWV_METRIC_NAMES.map((m) => (
                  <TableHead key={m} className="text-right">{m}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.summary.map((row) => (
                <TableRow key={row.page}>
                  <TableCell className="font-medium max-w-[180px] truncate text-xs">
                    {row.page}
                  </TableCell>
                  {CWV_METRIC_NAMES.map((m) => {
                    const metric = row.metrics[m];
                    if (!metric) {
                      return (
                        <TableCell key={m} className="text-right text-muted-foreground text-xs">
                          -
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={m} className="text-right">
                        <span className={`text-xs font-medium ${cwvRatingColor(metric.rating)}`}>
                          {formatCwvValue(m, metric.p75)}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          n={metric.samples}
                        </span>
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

// --- Loading Spinner ---

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}
