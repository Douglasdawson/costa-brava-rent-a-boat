import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Globe,
  Building2,
  TrendingUp,
  Users,
  PauseCircle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Settings2,
  Euro,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// ===== Types =====

interface PlatformStats {
  totalTenants: number;
  byStatus: { trial: number; active: number; suspended: number; cancelled: number };
  byPlan: { starter: number; pro: number; enterprise: number };
  mrrEstimate: number;
}

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  createdAt: string;
  usersCount: number;
}

interface SuperAdminTabProps {
  adminToken: string;
}

// ===== Helpers =====

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  trial:     { label: "Trial",      variant: "secondary",   icon: AlertCircle },
  active:    { label: "Activo",     variant: "default",     icon: CheckCircle2 },
  suspended: { label: "Suspendido", variant: "destructive", icon: PauseCircle },
  cancelled: { label: "Cancelado",  variant: "outline",     icon: XCircle },
};

const PLAN_CONFIG: Record<string, { label: string; price: number }> = {
  starter:    { label: "Starter",    price: 49 },
  pro:        { label: "Pro",        price: 99 },
  enterprise: { label: "Enterprise", price: 199 },
};

function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

// ===== Main Component =====

export function SuperAdminTab({ adminToken }: SuperAdminTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [managingTenant, setManagingTenant] = useState<TenantRow | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [newPlan, setNewPlan] = useState<string>("");
  const { toast } = useToast();

  const headers = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  const { data: stats } = useQuery<PlatformStats>({
    queryKey: ["/api/superadmin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/stats", { headers });
      if (!res.ok) throw new Error("Error al cargar estadisticas");
      return res.json();
    },
  });

  const { data: tenants = [], isLoading } = useQuery<TenantRow[]>({
    queryKey: ["/api/superadmin/tenants"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/tenants", { headers });
      if (!res.ok) throw new Error("Error al cargar tenants");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stats"] });
      setManagingTenant(null);
      toast({ title: "Empresa actualizada correctamente" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleOpenManage = (tenant: TenantRow) => {
    setManagingTenant(tenant);
    setNewStatus(tenant.status);
    setNewPlan(tenant.plan);
  };

  const handleSave = () => {
    if (!managingTenant) return;
    const changes: Record<string, string> = {};
    if (newStatus !== managingTenant.status) changes.status = newStatus;
    if (newPlan !== managingTenant.plan) changes.plan = newPlan;
    if (Object.keys(changes).length === 0) {
      setManagingTenant(null);
      return;
    }
    updateMutation.mutate({ id: managingTenant.id, data: changes });
  };

  const filteredTenants = statusFilter === "all"
    ? tenants
    : tenants.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">NauticFlow — Panel de Plataforma</h2>
          <p className="text-sm text-muted-foreground">Administracion global de todas las empresas</p>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalTenants}</p>
              <p className="text-xs text-muted-foreground mt-0.5">empresas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-cta" />
                <span className="text-xs text-muted-foreground font-medium">Trial</span>
              </div>
              <p className="text-2xl font-bold text-cta">{stats.byStatus.trial}</p>
              <p className="text-xs text-muted-foreground mt-0.5">en prueba</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">Activos</span>
              </div>
              <p className="text-2xl font-bold text-primary">{stats.byStatus.active}</p>
              <p className="text-xs text-muted-foreground mt-0.5">de pago</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <PauseCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-muted-foreground font-medium">Suspendidos</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.byStatus.suspended}</p>
              <p className="text-xs text-muted-foreground mt-0.5">bloqueados</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-1 col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Euro className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">MRR estimado</span>
              </div>
              <p className="text-2xl font-bold text-primary">{stats.mrrEstimate.toLocaleString("es-ES")} €</p>
              <p className="text-xs text-muted-foreground mt-0.5">por mes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan breakdown */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Distribución por plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {Object.entries(stats.byPlan).map(([plan, count]) => (
                <div key={plan} className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {PLAN_CONFIG[plan]?.label || plan}
                  </Badge>
                  <span className="text-lg font-bold text-foreground">{count}</span>
                  <span className="text-xs text-muted-foreground">× {PLAN_CONFIG[plan]?.price}€</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenants table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Empresas registradas
              {filteredTenants.length !== tenants.length && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredTenants.length} de {tenants.length})
                </span>
              )}
            </CardTitle>
            {/* Status filter */}
            <div className="flex gap-1">
              {["all", "trial", "active", "suspended", "cancelled"].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === f
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f === "all" ? "Todos" : STATUS_CONFIG[f]?.label || f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Trial / Expira</TableHead>
                    <TableHead>
                      <Users className="w-4 h-4" />
                    </TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => {
                    const statusCfg = STATUS_CONFIG[tenant.status];
                    const StatusIcon = statusCfg?.icon;
                    const days = trialDaysLeft(tenant.trialEndsAt);

                    return (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{tenant.name}</p>
                            {tenant.email && (
                              <p className="text-xs text-muted-foreground">{tenant.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {tenant.slug}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {PLAN_CONFIG[tenant.plan]?.label || tenant.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusCfg?.variant || "outline"} className="text-xs flex items-center gap-1 w-fit">
                            {StatusIcon && <StatusIcon className="w-3 h-3" />}
                            {statusCfg?.label || tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {tenant.status === "trial" && days !== null ? (
                            <span className={days <= 3 ? "text-red-600 font-medium" : "text-cta"}>
                              {days === 0 ? "Expirado" : `${days}d`}
                            </span>
                          ) : tenant.trialEndsAt ? (
                            <span className="text-muted-foreground text-xs">
                              {new Date(tenant.trialEndsAt).toLocaleDateString("es-ES")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {tenant.usersCount}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(tenant.createdAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenManage(tenant)}
                            className="h-7 text-xs"
                          >
                            <Settings2 className="w-3.5 h-3.5 mr-1" />
                            Gestionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredTenants.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No hay empresas con este filtro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Dialog */}
      <Dialog open={!!managingTenant} onOpenChange={(open) => !open && setManagingTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {managingTenant?.name}
            </DialogTitle>
          </DialogHeader>

          {managingTenant && (
            <div className="space-y-4 py-2">
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p className="text-muted-foreground">Slug: <span className="font-mono text-foreground">{managingTenant.slug}</span></p>
                <p className="text-muted-foreground">Email: <span className="text-foreground">{managingTenant.email || "—"}</span></p>
                <p className="text-muted-foreground">Usuarios: <span className="text-foreground">{managingTenant.usersCount}</span></p>
                <p className="text-muted-foreground">Registrado: <span className="text-foreground">
                  {new Date(managingTenant.createdAt).toLocaleDateString("es-ES")}
                </span></p>
              </div>

              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial — periodo de prueba activo</SelectItem>
                    <SelectItem value="active">Activo — suscripcion de pago</SelectItem>
                    <SelectItem value="suspended">Suspendido — acceso bloqueado</SelectItem>
                    <SelectItem value="cancelled">Cancelado — cuenta cerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select value={newPlan} onValueChange={setNewPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter — 49 €/mes</SelectItem>
                    <SelectItem value="pro">Pro — 99 €/mes</SelectItem>
                    <SelectItem value="enterprise">Enterprise — 199 €/mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus === "suspended" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  Al suspender esta empresa, sus usuarios no podrán acceder al panel.
                </div>
              )}
              {newStatus === "active" && managingTenant.status !== "active" && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">
                  La empresa pasara a estado activo con suscripcion de pago.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingTenant(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
