import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Percent, Plus, X, Megaphone, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface DiscountCode {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  currentUses: number;
  customerEmail: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface CampaignResult {
  success: boolean;
  customersFound: number;
  codesGenerated: number;
  codes: Array<{
    email: string;
    name: string;
    code: string;
    discountPercent: number;
  }>;
}

interface DiscountManagementProps {
  adminToken: string;
}

export function DiscountManagement({ adminToken }: DiscountManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCampaignResults, setShowCampaignResults] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignResult | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();

  // Form state for creating a discount code
  const [newCode, setNewCode] = useState("");
  const [newDiscountPercent, setNewDiscountPercent] = useState(10);
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");

  const headers = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  // Fetch all discount codes
  const { data: discountCodes = [], isLoading } = useQuery<DiscountCode[]>({
    queryKey: ["/api/admin/discounts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/discounts", { headers });
      if (!res.ok) throw new Error("Error al cargar codigos de descuento");
      return res.json();
    },
  });

  // Create discount code mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      discountPercent: number;
      maxUses: number;
      customerEmail?: string | null;
      expiresAt?: string | null;
    }) => {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear el codigo");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      toast({ title: "Codigo de descuento creado correctamente" });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Deactivate discount code mutation
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al desactivar el codigo");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      toast({ title: "Codigo de descuento desactivado" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Pre-season campaign mutation
  const campaignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/discounts/pre-season-campaign", {
        method: "POST",
        headers,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al lanzar la campana");
      }
      return res.json() as Promise<CampaignResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      setCampaignData(data);
      setShowCampaignResults(true);
      toast({
        title: "Campana pre-temporada completada",
        description: `${data.codesGenerated} codigos generados para ${data.customersFound} clientes`,
      });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const resetForm = () => {
    setNewCode("");
    setNewDiscountPercent(10);
    setNewMaxUses(1);
    setNewCustomerEmail("");
    setNewExpiresAt("");
  };

  const handleCreate = () => {
    createMutation.mutate({
      code: newCode.toUpperCase().replace(/\s/g, ""),
      discountPercent: newDiscountPercent,
      maxUses: newMaxUses,
      customerEmail: newCustomerEmail || null,
      expiresAt: newExpiresAt ? new Date(newExpiresAt).toISOString() : null,
    });
  };

  const handleLaunchCampaign = () => {
    if (confirm("Esto generara codigos de descuento del 10% para todos los clientes con reservas confirmadas. Continuar?")) {
      campaignMutation.mutate();
    }
  };

  // Filter codes
  const filteredCodes = discountCodes.filter((code) => {
    if (filter === "all") return true;
    if (filter === "active") return code.isActive && code.currentUses < code.maxUses;
    if (filter === "used") return code.currentUses >= code.maxUses;
    if (filter === "inactive") return !code.isActive;
    return true;
  });

  // Stats
  const totalActive = discountCodes.filter(
    (c) => c.isActive && c.currentUses < c.maxUses
  ).length;
  const totalUsed = discountCodes.filter(
    (c) => c.currentUses >= c.maxUses
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Percent className="w-5 h-5" />
          Codigos de Descuento
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLaunchCampaign}
            disabled={campaignMutation.isPending}
          >
            {campaignMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Megaphone className="w-4 h-4 mr-2" />
            )}
            Lanzar campana pre-temporada
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo codigo
          </Button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Todos" },
          { key: "active", label: "Activos" },
          { key: "used", label: "Usados" },
          { key: "inactive", label: "Inactivos" },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Codigos</p>
            <p className="text-2xl font-bold">{discountCodes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Activos</p>
            <p className="text-2xl font-bold text-green-600">{totalActive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Usados</p>
            <p className="text-2xl font-bold text-blue-600">{totalUsed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : filteredCodes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay codigos de descuento{filter !== "all" ? " con este filtro" : ""}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Email cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.map((code) => {
                    const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                    const isFullyUsed = code.currentUses >= code.maxUses;
                    const isEffectivelyActive = code.isActive && !isExpired && !isFullyUsed;

                    return (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono font-bold">{code.code}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{code.discountPercent}%</Badge>
                        </TableCell>
                        <TableCell>
                          {code.currentUses}/{code.maxUses}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {code.customerEmail || "Universal"}
                        </TableCell>
                        <TableCell>
                          {isEffectivelyActive ? (
                            <Badge variant="default">Activo</Badge>
                          ) : isExpired ? (
                            <Badge variant="destructive">Expirado</Badge>
                          ) : isFullyUsed ? (
                            <Badge variant="outline">Agotado</Badge>
                          ) : (
                            <Badge variant="destructive">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {code.expiresAt
                            ? format(new Date(code.expiresAt), "dd/MM/yyyy")
                            : "Sin expiracion"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(code.createdAt), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {code.isActive && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => {
                                if (confirm("Desactivar este codigo de descuento?")) {
                                  deactivateMutation.mutate(code.id);
                                }
                              }}
                              disabled={deactivateMutation.isPending}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Discount Code Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Codigo de Descuento</DialogTitle>
            <DialogDescription>
              Introduce los datos del nuevo codigo de descuento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="discount-code">Codigo</Label>
              <Input
                id="discount-code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                placeholder="VERANO-2026"
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo letras mayusculas, numeros y guiones
              </p>
            </div>
            <div>
              <Label htmlFor="discount-percent">Porcentaje de descuento</Label>
              <Input
                id="discount-percent"
                type="number"
                min={1}
                max={100}
                value={newDiscountPercent}
                onChange={(e) => setNewDiscountPercent(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="discount-max-uses">Usos maximos</Label>
              <Input
                id="discount-max-uses"
                type="number"
                min={1}
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="discount-email">Email del cliente (opcional)</Label>
              <Input
                id="discount-email"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="Dejar vacio para codigo universal"
              />
            </div>
            <div>
              <Label htmlFor="discount-expires">Fecha de expiracion (opcional)</Label>
              <Input
                id="discount-expires"
                type="date"
                value={newExpiresAt}
                onChange={(e) => setNewExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !newCode || newDiscountPercent < 1}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Crear codigo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Results Dialog */}
      <Dialog open={showCampaignResults} onOpenChange={setShowCampaignResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultados de la Campana Pre-temporada</DialogTitle>
            <DialogDescription>
              {campaignData
                ? `${campaignData.codesGenerated} codigos generados para ${campaignData.customersFound} clientes`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {campaignData && campaignData.codes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Descuento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignData.codes.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{item.email}</TableCell>
                      <TableCell className="font-mono font-bold">{item.code}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.discountPercent}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No se encontraron clientes con reservas confirmadas
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignResults(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
