import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings,
  AlertTriangle,
  Loader2,
  CheckCircle,
  History,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface InventoryTabProps {
  adminToken: string;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  totalStock: number;
  availableStock: number;
  pricePerUnit: string | null;
  status: string;
  minStockAlert: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InventoryMovement {
  id: string;
  itemId: string;
  type: string;
  quantity: number;
  reason: string | null;
  bookingId: string | null;
  createdBy: string | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  water_sports: "Deportes Acuaticos",
  safety: "Seguridad",
  comfort: "Comodidad",
  navigation: "Navegacion",
  other: "Otros",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "bg-green-100 text-green-800" },
  low_stock: { label: "Stock Bajo", color: "bg-yellow-100 text-yellow-800" },
  out_of_stock: { label: "Sin Stock", color: "bg-red-100 text-red-800" },
};

const MOVEMENT_LABELS: Record<string, { label: string; icon: typeof ArrowUpCircle; color: string }> = {
  in: { label: "Entrada", icon: ArrowUpCircle, color: "text-green-600" },
  out: { label: "Salida", icon: ArrowDownCircle, color: "text-red-600" },
  adjustment: { label: "Ajuste", icon: Settings, color: "text-blue-600" },
};

export function InventoryTab({ adminToken }: InventoryTabProps) {
  const { toast } = useToast();
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Item dialog
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    category: "water_sports",
    totalStock: "0",
    availableStock: "0",
    pricePerUnit: "",
    minStockAlert: "1",
    imageUrl: "",
  });

  // Movement dialog
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [movementItemId, setMovementItemId] = useState<string>("");
  const [movementForm, setMovementForm] = useState({
    type: "in" as string,
    quantity: "1",
    reason: "",
  });

  // Detail sheet
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const headers = { Authorization: `Bearer ${adminToken}` };

  // Queries
  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/admin/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inventory", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const { data: lowStockItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/admin/inventory/low-stock"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inventory/low-stock", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const { data: movements = [] } = useQuery<InventoryMovement[]>({
    queryKey: ["/api/admin/inventory/movements", selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem) return [];
      const res = await fetch(`/api/admin/inventory/${selectedItem.id}/movements`, { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: !!selectedItem,
  });

  const filteredItems = filterCategory === "all"
    ? items
    : items.filter(i => i.category === filterCategory);

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      setShowItemDialog(false);
      toast({ title: "Item creado" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/inventory/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      setShowItemDialog(false);
      setEditingItem(null);
      toast({ title: "Item actualizado" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/inventory/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      toast({ title: "Item eliminado" });
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/inventory/${data.itemId}/movements`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      if (selectedItem) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory/movements", selectedItem.id] });
      }
      setShowMovementDialog(false);
      toast({ title: "Movimiento registrado" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const handleItemSubmit = () => {
    const data = {
      name: itemForm.name,
      description: itemForm.description || null,
      category: itemForm.category,
      totalStock: parseInt(itemForm.totalStock) || 0,
      availableStock: parseInt(itemForm.availableStock) || 0,
      pricePerUnit: itemForm.pricePerUnit || null,
      minStockAlert: parseInt(itemForm.minStockAlert) || 1,
      imageUrl: itemForm.imageUrl || null,
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleMovementSubmit = () => {
    createMovementMutation.mutate({
      itemId: movementItemId,
      type: movementForm.type,
      quantity: parseInt(movementForm.quantity) || 1,
      reason: movementForm.reason || null,
    });
  };

  const openEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || "",
      category: item.category,
      totalStock: String(item.totalStock),
      availableStock: String(item.availableStock),
      pricePerUnit: item.pricePerUnit || "",
      minStockAlert: String(item.minStockAlert),
      imageUrl: item.imageUrl || "",
    });
    setShowItemDialog(true);
  };

  const openMovement = (itemId: string) => {
    setMovementItemId(itemId);
    setMovementForm({ type: "in", quantity: "1", reason: "" });
    setShowMovementDialog(true);
  };

  const openDetail = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemForm({
      name: "",
      description: "",
      category: "water_sports",
      totalStock: "0",
      availableStock: "0",
      pricePerUnit: "",
      minStockAlert: "1",
      imageUrl: "",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Inventario de Extras</h2>
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => {
              resetItemForm();
              setShowItemDialog(true);
            }}
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Agregar Item</span>
          </Button>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="font-medium text-yellow-800">Alertas de stock ({lowStockItems.length})</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <Badge
                  key={item.id}
                  className={item.status === "out_of_stock" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}
                >
                  {item.name}: {item.availableStock} ud.
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Grid */}
      {isLoading ? (
        <Card><CardContent className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No hay items en el inventario</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.available;
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-500">{CATEGORY_LABELS[item.category] || item.category}</p>
                    </div>
                    <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <p className="text-gray-500">Disponible</p>
                      <p className={`text-lg font-bold ${item.availableStock <= item.minStockAlert ? "text-red-600" : "text-green-600"}`}>
                        {item.availableStock}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <p className="text-gray-500">Total</p>
                      <p className="text-lg font-bold">{item.totalStock}</p>
                    </div>
                  </div>

                  {item.pricePerUnit && (
                    <p className="text-sm text-gray-600 mb-3">Precio: {item.pricePerUnit} EUR/ud</p>
                  )}

                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openMovement(item.id)}>
                      <ArrowUpCircle className="w-4 h-4 mr-1" />
                      Movimiento
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(item)}>
                      <History className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditItem(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Eliminar ${item.name}?`)) deleteItemMutation.mutate(item.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Item" : "Agregar Item"}</DialogTitle>
            <DialogDescription>Gestiona un item del inventario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={itemForm.name}
                onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Kit Snorkel"
              />
            </div>
            <div>
              <Label>Descripcion</Label>
              <Textarea
                value={itemForm.description}
                onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Descripcion del item..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria *</Label>
                <Select value={itemForm.category} onValueChange={v => setItemForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Precio/ud (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemForm.pricePerUnit}
                  onChange={e => setItemForm(p => ({ ...p, pricePerUnit: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Stock Total</Label>
                <Input
                  type="number"
                  value={itemForm.totalStock}
                  onChange={e => setItemForm(p => ({ ...p, totalStock: e.target.value }))}
                />
              </div>
              <div>
                <Label>Disponible</Label>
                <Input
                  type="number"
                  value={itemForm.availableStock}
                  onChange={e => setItemForm(p => ({ ...p, availableStock: e.target.value }))}
                />
              </div>
              <div>
                <Label>Alerta min.</Label>
                <Input
                  type="number"
                  value={itemForm.minStockAlert}
                  onChange={e => setItemForm(p => ({ ...p, minStockAlert: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleItemSubmit}
              disabled={!itemForm.name || createItemMutation.isPending || updateItemMutation.isPending}
            >
              {createItemMutation.isPending || updateItemMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />Guardar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
            <DialogDescription>Entrada, salida o ajuste de stock</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={movementForm.type} onValueChange={v => setMovementForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada (+)</SelectItem>
                  <SelectItem value="out">Salida (-)</SelectItem>
                  <SelectItem value="adjustment">Ajuste (=)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={movementForm.quantity}
                onChange={e => setMovementForm(p => ({ ...p, quantity: e.target.value }))}
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Input
                value={movementForm.reason}
                onChange={e => setMovementForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="Ej: Reposicion de stock"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>Cancelar</Button>
            <Button onClick={handleMovementSubmit} disabled={createMovementMutation.isPending}>
              {createMovementMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registrando...</>
              ) : (
                "Registrar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedItem?.name} - Historial</SheetTitle>
          </SheetHeader>
          {selectedItem && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-3 text-center">
                  <p className="text-sm text-gray-500">Disponible</p>
                  <p className="text-2xl font-bold">{selectedItem.availableStock}</p>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold">{selectedItem.totalStock}</p>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  openMovement(selectedItem.id);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Movimiento
              </Button>

              <div>
                <h4 className="font-medium mb-2">Movimientos recientes</h4>
                {movements.length === 0 ? (
                  <p className="text-sm text-gray-500">Sin movimientos registrados</p>
                ) : (
                  <div className="space-y-2">
                    {movements.map(mov => {
                      const config = MOVEMENT_LABELS[mov.type] || MOVEMENT_LABELS.in;
                      const Icon = config.icon;
                      return (
                        <div key={mov.id} className="flex items-center gap-3 p-2 border rounded">
                          <Icon className={`w-5 h-5 ${config.color}`} />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="font-medium text-sm">{config.label}: {mov.quantity} ud.</span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(mov.createdAt), "dd/MM HH:mm")}
                              </span>
                            </div>
                            {mov.reason && <p className="text-xs text-gray-500">{mov.reason}</p>}
                            {mov.createdBy && <p className="text-xs text-gray-400">Por: {mov.createdBy}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
