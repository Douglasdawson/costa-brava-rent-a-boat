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
  Target,
  FlaskConical,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  FileText,
  HeartPulse,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "./shared/EmptyState";
import { ErrorState } from "./shared/ErrorState";
import { SeoDashboard } from "./SeoDashboard";

// --- Types ---

interface SeoTabProps {
  adminToken: string;
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

// --- Sub-tab definitions ---

type SubTab = "dashboard" | "campanas" | "experimentos" | "informes" | "salud";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "campanas", label: "Campanas" },
  { id: "experimentos", label: "Experimentos" },
  { id: "informes", label: "Informes" },
  { id: "salud", label: "Salud" },
];

// --- Helpers ---

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
        credentials: "include",
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
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("dashboard");

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
      {activeSubTab === "dashboard" && <SeoDashboard adminToken={adminToken} />}
      {activeSubTab === "campanas" && <CampanasSubTab adminToken={adminToken} />}
      {activeSubTab === "experimentos" && <ExperimentosSubTab adminToken={adminToken} />}
      {activeSubTab === "informes" && <InformesSubTab adminToken={adminToken} />}
      {activeSubTab === "salud" && <SaludSubTab adminToken={adminToken} />}
    </div>
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
                  {campaign.startDate} /{campaign.endDate}
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
                      {report.periodStart} /{report.periodEnd}
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

// --- Loading Spinner ---

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}
