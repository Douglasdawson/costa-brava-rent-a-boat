import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity, AlertTriangle, FileText, KeyRound, Send, ShieldCheck,
  CheckCircle2, XCircle, Clock, ExternalLink, Trash2, Copy, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StatCard } from "./shared/StatCard";
import { EmptyState } from "./shared/EmptyState";
import { ErrorState } from "./shared/ErrorState";
import { useToast } from "@/hooks/use-toast";

// ===== Types =====
interface AutopilotOverview {
  blogPosts: { total: number; published: number; last30d: number };
  distribution: {
    pending: number; scheduled: number; published: number;
    failed: number; discarded: number; total: number;
    byPlatform: Record<string, number>;
  };
  audit: { last24h: number; last24hErrors: number; topTools: Array<{ tool: string; count: number }> };
  tokens: { active: number; revoked: number };
  generatedAt: string;
}

interface DistributionItem {
  id: number; slug: string; platform: string; language: string;
  title: string | null; status: string;
  publishedUrl: string | null; failureReason: string | null;
  scheduledFor: string | null; publishedAt: string | null;
  createdAt: string; updatedAt: string;
}

interface AutopilotAlert {
  id: string; severity: "info" | "warning" | "error";
  title: string; detail: string; createdAt: string;
}

interface AuditEntry {
  id: number; tool: string; success: boolean;
  durationMs: number | null; resultSize: number | null;
  errorMessage: string | null; ip: string | null;
  tokenId: number | null; createdAt: string;
}

interface McpTokenPublic {
  id: number; name: string; tokenPrefix: string;
  scopes: string[]; active: boolean;
  createdAt: string; expiresAt: string | null;
  lastUsedAt: string | null; lastUsedIp: string | null;
  revokedAt: string | null; callCount: number;
}

// ===== Helpers =====
async function apiFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function statusBadge(status: string): { variant: "default" | "secondary" | "destructive" | "outline"; label: string } {
  switch (status) {
    case "published": return { variant: "default", label: "Publicado" };
    case "pending": return { variant: "secondary", label: "Pendiente" };
    case "scheduled": return { variant: "outline", label: "Programado" };
    case "failed": return { variant: "destructive", label: "Falló" };
    case "discarded": return { variant: "outline", label: "Descartado" };
    default: return { variant: "outline", label: status };
  }
}

// ============================================================================
// Main component
// ============================================================================
interface AutopilotTabProps {
  adminToken: string;
}

export function AutopilotTab({ adminToken }: AutopilotTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading">SEO Autopilot</h2>
          <p className="text-sm text-muted-foreground">
            Orquestación de contenido, distribución y métricas SEO en vivo.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full max-w-3xl overflow-x-auto">
          <TabsTrigger value="overview" className="flex-shrink-0"><Activity className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Overview</span><span className="sm:hidden">Info</span></TabsTrigger>
          <TabsTrigger value="distribution" className="flex-shrink-0"><Send className="h-4 w-4 mr-1" />Bandeja</TabsTrigger>
          <TabsTrigger value="alerts" className="flex-shrink-0"><AlertTriangle className="h-4 w-4 mr-1" />Alertas</TabsTrigger>
          <TabsTrigger value="audit" className="flex-shrink-0"><FileText className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Auditoría</span><span className="sm:hidden">Audit</span></TabsTrigger>
          <TabsTrigger value="tokens" className="flex-shrink-0"><KeyRound className="h-4 w-4 mr-1" />Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewPanel adminToken={adminToken} />
        </TabsContent>
        <TabsContent value="distribution" className="mt-4">
          <DistributionPanel adminToken={adminToken} />
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <AlertsPanel adminToken={adminToken} />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditPanel adminToken={adminToken} />
        </TabsContent>
        <TabsContent value="tokens" className="mt-4">
          <TokensPanel adminToken={adminToken} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Overview
// ============================================================================
function OverviewPanel({ adminToken }: { adminToken: string }) {
  const { data, isLoading, error, refetch } = useQuery<AutopilotOverview>({
    queryKey: ["autopilot", "overview"],
    queryFn: () => apiFetch<AutopilotOverview>("/api/admin/autopilot/overview", adminToken),
    refetchInterval: 60_000,
  });

  if (isLoading) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Cargando…</CardContent></Card>;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Error"} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Blog posts" value={data.blogPosts.published} icon={<FileText className="h-4 w-4" />}
          description={`${data.blogPosts.total} totales · +${data.blogPosts.last30d} ultimos 30d`} />
        <StatCard title="En bandeja" value={data.distribution.pending + data.distribution.scheduled} icon={<Send className="h-4 w-4" />}
          description={`${data.distribution.published} publicados · ${data.distribution.failed} fallidos`} />
        <StatCard title="Llamadas MCP (24h)" value={data.audit.last24h} icon={<Activity className="h-4 w-4" />}
          description={`${data.audit.last24hErrors} errores`} />
        <StatCard title="Tokens activos" value={data.tokens.active} icon={<ShieldCheck className="h-4 w-4" />}
          description={`${data.tokens.revoked} revocados`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Distribución por plataforma</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(data.distribution.byPlatform).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
            ) : (
              <div className="space-y-1 text-sm">
                {Object.entries(data.distribution.byPlatform).map(([platform, count]) => (
                  <div key={platform} className="flex justify-between">
                    <span className="capitalize">{platform.replace("_", " ")}</span>
                    <span className="font-mono">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top herramientas MCP (24h)</CardTitle></CardHeader>
          <CardContent>
            {data.audit.topTools.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin llamadas recientes.</p>
            ) : (
              <div className="space-y-1 text-sm">
                {data.audit.topTools.map((t) => (
                  <div key={t.tool} className="flex justify-between">
                    <code className="text-xs">{t.tool}</code>
                    <span className="font-mono">{t.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        Generado: {formatDate(data.generatedAt)} · <button className="underline" onClick={() => refetch()}>Actualizar</button>
      </p>
    </div>
  );
}

// ============================================================================
// Distribution Tray
// ============================================================================
function DistributionPanel({ adminToken }: { adminToken: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data, isLoading, error } = useQuery<{ items: DistributionItem[]; count: number }>({
    queryKey: ["autopilot", "distribution", filterStatus],
    queryFn: () => {
      const q = filterStatus ? `?status=${filterStatus}` : "";
      return apiFetch(`/api/admin/autopilot/distribution${q}`, adminToken);
    },
  });

  const markMutation = useMutation({
    mutationFn: async (args: { id: number; result: "published" | "failed" | "discarded"; publishedUrl?: string; reason?: string }) => {
      return apiFetch(`/api/admin/autopilot/distribution/${args.id}/mark`, adminToken, {
        method: "POST",
        body: JSON.stringify({ result: args.result, publishedUrl: args.publishedUrl, reason: args.reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopilot", "distribution"] });
      queryClient.invalidateQueries({ queryKey: ["autopilot", "overview"] });
      toast({ title: "Estado actualizado" });
    },
    onError: (err: unknown) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      apiFetch(`/api/admin/autopilot/distribution/${id}`, adminToken, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopilot", "distribution"] });
      toast({ title: "Eliminado" });
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Error"} />;
  const items = data?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="dist-status" className="text-sm">Estado:</Label>
        <select
          id="dist-status"
          className="text-sm border rounded px-2 py-1 bg-background"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="scheduled">Programado</option>
          <option value="published">Publicado</option>
          <option value="failed">Fallido</option>
          <option value="discarded">Descartado</option>
        </select>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Send} title="Bandeja vacía" description="Cuando la autopilot encole contenido, aparecerá aquí." />
      ) : (
        <>
        {/* Desktop table */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Idioma</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => {
                  const sb = statusBadge(it.status);
                  return (
                    <TableRow key={it.id}>
                      <TableCell className="capitalize">{it.platform.replace("_", " ")}</TableCell>
                      <TableCell className="uppercase text-xs font-mono">{it.language}</TableCell>
                      <TableCell className="font-mono text-xs">{it.slug}</TableCell>
                      <TableCell><Badge variant={sb.variant}>{sb.label}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(it.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {it.publishedUrl && (
                          <a href={it.publishedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
                            <Button size="sm" variant="ghost"><ExternalLink className="h-3 w-3" /></Button>
                          </a>
                        )}
                        {(it.status === "pending" || it.status === "scheduled") && (
                          <Button size="sm" variant="outline"
                            onClick={() => {
                              const url = window.prompt("URL de publicación:");
                              if (url) markMutation.mutate({ id: it.id, result: "published", publishedUrl: url });
                            }}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />Publicado
                          </Button>
                        )}
                        <Button size="sm" variant="ghost"
                          onClick={() => {
                            if (window.confirm("¿Eliminar este item?")) deleteMutation.mutate(it.id);
                          }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {items.map((it) => {
            const sb = statusBadge(it.status);
            return (
              <Card key={it.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm capitalize">{it.platform.replace("_", " ")}</span>
                    <Badge variant={sb.variant}>{sb.label}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <p className="text-muted-foreground">Idioma</p>
                      <p className="font-medium text-foreground uppercase font-mono">{it.language}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Creado</p>
                      <p className="font-medium text-foreground">{formatDate(it.createdAt)}</p>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mt-1 truncate">{it.slug}</p>
                  <div className="flex gap-2 mt-3">
                    {it.publishedUrl && (
                      <a href={it.publishedUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="min-h-[44px]"><ExternalLink className="h-3 w-3" /></Button>
                      </a>
                    )}
                    {(it.status === "pending" || it.status === "scheduled") && (
                      <Button size="sm" variant="outline" className="min-h-[44px]"
                        onClick={() => {
                          const url = window.prompt("URL de publicación:");
                          if (url) markMutation.mutate({ id: it.id, result: "published", publishedUrl: url });
                        }}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />Publicado
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="min-h-[44px]"
                      onClick={() => {
                        if (window.confirm("¿Eliminar este item?")) deleteMutation.mutate(it.id);
                      }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Alerts
// ============================================================================
function AlertsPanel({ adminToken }: { adminToken: string }) {
  const { data, isLoading, error } = useQuery<{ alerts: AutopilotAlert[]; count: number }>({
    queryKey: ["autopilot", "alerts"],
    queryFn: () => apiFetch("/api/admin/autopilot/alerts", adminToken),
    refetchInterval: 120_000,
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Error"} />;
  const alerts = data?.alerts ?? [];

  if (alerts.length === 0) {
    return <EmptyState icon={ShieldCheck} title="Sin alertas" description="Todo funciona correctamente." />;
  }

  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const tint = a.severity === "error" ? "bg-red-500/5 border-red-200" : a.severity === "warning" ? "bg-amber-500/5 border-amber-200" : "bg-blue-500/5 border-blue-200";
        return (
          <Card key={a.id} className={tint}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// Audit
// ============================================================================
function AuditPanel({ adminToken }: { adminToken: string }) {
  const [sinceHours, setSinceHours] = useState<number>(24);
  const { data, isLoading, error } = useQuery<{ entries: AuditEntry[]; count: number }>({
    queryKey: ["autopilot", "audit", sinceHours],
    queryFn: () => apiFetch(`/api/admin/autopilot/audit?sinceHours=${sinceHours}&limit=200`, adminToken),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Error"} />;
  const entries = data?.entries ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="audit-since" className="text-sm">Últimas:</Label>
        <select id="audit-since" className="text-sm border rounded px-2 py-1 bg-background"
          value={sinceHours} onChange={(e) => setSinceHours(Number(e.target.value))}>
          <option value={1}>1h</option>
          <option value={24}>24h</option>
          <option value={168}>7d</option>
          <option value={720}>30d</option>
        </select>
      </div>
      {entries.length === 0 ? (
        <EmptyState icon={Clock} title="Sin registros" description="Aún no se han realizado llamadas." />
      ) : (
        <>
        {/* Desktop table */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuándo</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>ms</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</TableCell>
                    <TableCell><code className="text-xs">{e.tool}</code></TableCell>
                    <TableCell>{e.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}</TableCell>
                    <TableCell className="font-mono text-xs">{e.durationMs ?? "—"}</TableCell>
                    <TableCell className="text-xs">{e.tokenId ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{e.errorMessage ?? ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {entries.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-xs font-medium">{e.tool}</code>
                  {e.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Cuándo</p>
                    <p className="font-medium">{formatDate(e.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duración</p>
                    <p className="font-medium font-mono">{e.durationMs ? `${e.durationMs}ms` : "—"}</p>
                  </div>
                </div>
                {e.errorMessage && (
                  <p className="text-xs text-destructive mt-2 line-clamp-2">{e.errorMessage}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Tokens
// ============================================================================
function TokensPanel({ adminToken }: { adminToken: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTokenName, setNewTokenName] = useState("");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery<{ tokens: McpTokenPublic[] }>({
    queryKey: ["autopilot", "tokens"],
    queryFn: () => apiFetch("/api/admin/mcp-tokens", adminToken),
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) =>
      apiFetch<{ rawToken: string; token: McpTokenPublic }>("/api/admin/mcp-tokens", adminToken, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: (res) => {
      setCreatedSecret(res.rawToken);
      setNewTokenName("");
      queryClient.invalidateQueries({ queryKey: ["autopilot", "tokens"] });
      queryClient.invalidateQueries({ queryKey: ["autopilot", "overview"] });
    },
    onError: (err: unknown) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: number) =>
      apiFetch(`/api/admin/mcp-tokens/${id}/revoke`, adminToken, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopilot", "tokens"] });
      toast({ title: "Token revocado" });
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Error"} />;
  const tokens = data?.tokens ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Los tokens permiten que clientes externos (p.ej. Cowork) llamen al MCP{" "}
          <code className="text-xs">/api/mcp/seo-autopilot</code>.
        </p>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setCreatedSecret(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-3 w-3 mr-1" />Nuevo token</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear token MCP</DialogTitle></DialogHeader>
            {createdSecret ? (
              <div className="space-y-3">
                <p className="text-sm">Este token solo se mostrará una vez. Guárdalo en un gestor de contraseñas.</p>
                <div className="font-mono text-xs p-3 bg-muted rounded break-all">{createdSecret}</div>
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(createdSecret).then(() => toast({ title: "Copiado" }));
                }}><Copy className="h-3 w-3 mr-1" />Copiar</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="token-name">Nombre descriptivo</Label>
                  <Input id="token-name" value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="Cowork — casa" />
                </div>
                <DialogFooter>
                  <Button disabled={newTokenName.length < 2 || createMutation.isPending}
                    onClick={() => createMutation.mutate(newTokenName)}>
                    {createMutation.isPending ? "Creando…" : "Crear"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {tokens.length === 0 ? (
        <EmptyState icon={KeyRound} title="Sin tokens" description="Crea uno para conectar un cliente MCP externo." />
      ) : (
        <>
        {/* Desktop table */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Prefijo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead>Llamadas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-sm">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs">{t.tokenPrefix}…</TableCell>
                    <TableCell>
                      {t.active
                        ? <Badge>Activo</Badge>
                        : t.revokedAt
                          ? <Badge variant="destructive">Revocado</Badge>
                          : <Badge variant="outline">Expirado</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(t.lastUsedAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{t.callCount}</TableCell>
                    <TableCell className="text-right">
                      {t.active && (
                        <Button size="sm" variant="ghost"
                          onClick={() => {
                            if (window.confirm(`¿Revocar "${t.name}"?`)) revokeMutation.mutate(t.id);
                          }}>
                          Revocar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {tokens.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{t.name}</span>
                  {t.active
                    ? <Badge>Activo</Badge>
                    : t.revokedAt
                      ? <Badge variant="destructive">Revocado</Badge>
                      : <Badge variant="outline">Expirado</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Prefijo</p>
                    <p className="font-medium font-mono">{t.tokenPrefix}…</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Llamadas</p>
                    <p className="font-medium font-mono">{t.callCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creado</p>
                    <p className="font-medium">{formatDate(t.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Último uso</p>
                    <p className="font-medium">{formatDate(t.lastUsedAt)}</p>
                  </div>
                </div>
                {t.active && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="ghost" className="min-h-[44px]"
                      onClick={() => {
                        if (window.confirm(`¿Revocar "${t.name}"?`)) revokeMutation.mutate(t.id);
                      }}>
                      Revocar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
