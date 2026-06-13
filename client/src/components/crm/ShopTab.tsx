import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Loader2, Package, ShoppingBag, Truck, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { getShopVariant } from "@shared/shopData";

interface ShopOrderItem {
  id: string;
  sku: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

interface ShopOrder {
  id: string;
  stripeSessionId: string;
  customerName: string | null;
  customerEmail: string | null;
  deliveryMethod: string;
  shippingAddress: {
    name?: string;
    address?: { line1?: string; line2?: string; postal_code?: string; city?: string; state?: string };
  } | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  status: string;
  language: string;
  createdAt: string;
  paidAt: string | null;
  fulfilledAt: string | null;
  items: ShopOrderItem[];
}

interface ShopVariant {
  sku: string;
  productId: string;
  color: string | null;
  size: string | null;
  stock: number;
  active: boolean;
}

interface ShopProduct {
  id: string;
  priceCents: number;
  active: boolean;
  variants: ShopVariant[];
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  fulfilled: "bg-muted text-muted-foreground",
  cancelled: "bg-red-100 text-red-800",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  fulfilled: "Entregado",
  cancelled: "Cancelado",
};

const COLOR_LABELS: Record<string, string> = {
  butter: "Amarillo mantequilla",
  navy: "Azul marino",
  royal: "Azul royal",
};

const PRODUCT_LABELS: Record<string, string> = {
  "camiseta-costa-brava-culture": "Camiseta Costa Brava Culture",
  "tote-bag-costa-brava": "Tote bag Costa Brava Culture",
};

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function skuLabel(sku: string): string {
  const entry = getShopVariant(sku);
  if (!entry) return sku;
  const base = PRODUCT_LABELS[entry.product.id] ?? entry.product.id;
  const color = COLOR_LABELS[entry.variant.color] ?? entry.variant.color;
  return entry.variant.size ? `${base} (${color}, ${entry.variant.size})` : `${base} (${color})`;
}

export function ShopTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-heading flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        Tienda
      </h2>
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4">
          <OrdersView />
        </TabsContent>
        <TabsContent value="stock" className="mt-4">
          <StockView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrdersView() {
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ orders: ShopOrder[] }>({
    queryKey: ["/api/admin/shop/orders"],
  });
  const orders = data?.orders ?? [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "fulfilled" | "cancelled" }) => {
      const res = await fetch(`/api/admin/shop/orders/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Error al actualizar el pedido");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/orders"] });
      toast({ title: "Pedido actualizado" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const paidCount = orders.filter((o) => o.status === "paid").length;
  const revenueCents = orders
    .filter((o) => o.status === "paid" || o.status === "fulfilled")
    .reduce((sum, o) => sum + o.totalCents, 0);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pedidos totales</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Por entregar</p>
            <p className="text-2xl font-bold text-amber-600">{paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ingresos</p>
            <p className="text-2xl font-bold">{euros(revenueCents)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "paid", "fulfilled", "pending", "cancelled"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todos" : ORDER_STATUS_LABELS[f] || f}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">No hay pedidos</p>
          <p className="text-sm text-muted-foreground">
            Los pedidos de la tienda aparecerán aquí cuando se paguen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{order.customerName || "(sin nombre)"}</span>
                      <Badge className={ORDER_STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {order.deliveryMethod === "shipping" ? (
                          <>
                            <Truck className="w-3 h-3" /> Envío
                          </>
                        ) : order.deliveryMethod === "pickup_laura" ? (
                          <>
                            <Package className="w-3 h-3" /> Recogida · Laura Cabanas
                          </>
                        ) : (
                          <>
                            <Package className="w-3 h-3" /> Recogida · Puerto
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.customerEmail} · {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <p className="font-bold text-lg">{euros(order.totalCents)}</p>
                </div>

                <ul className="mt-3 space-y-1 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span>
                        {skuLabel(item.sku)} <span className="text-muted-foreground">x{item.quantity}</span>
                      </span>
                      <span className="text-muted-foreground">{euros(item.unitPriceCents * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                {order.deliveryMethod === "shipping" && order.shippingAddress?.address && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Dirección: {[
                      order.shippingAddress.address.line1,
                      order.shippingAddress.address.line2,
                      order.shippingAddress.address.postal_code,
                      order.shippingAddress.address.city,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}

                {order.status === "paid" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id: order.id, status: "fulfilled" })}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      Marcar entregado
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id: order.id, status: "cancelled" })}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StockView() {
  const { toast } = useToast();
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<{ products: ShopProduct[] }>({
    queryKey: ["/api/admin/shop/inventory"],
  });
  const products = data?.products ?? [];

  const variantMutation = useMutation({
    mutationFn: async ({ sku, patch }: { sku: string; patch: { stock?: number; active?: boolean } }) => {
      const res = await fetch(`/api/admin/shop/variants/${sku}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Error al actualizar la variante");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/inventory"] });
      toast({ title: "Stock actualizado" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const productMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { active?: boolean; priceCents?: number } }) => {
      const res = await fetch(`/api/admin/shop/products/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Error al actualizar el producto");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop/inventory"] });
      toast({ title: "Producto actualizado" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {products.map((product) => {
        const priceDraft = priceDrafts[product.id] ?? (product.priceCents / 100).toFixed(2);
        return (
          <Card key={product.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{PRODUCT_LABELS[product.id] ?? product.id}</h3>
                  <Badge className={product.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                    {product.active ? "Activo" : "Desactivado"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">Precio</span>
                    <Input
                      className="w-24 h-8"
                      inputMode="decimal"
                      value={priceDraft}
                      onChange={(e) => setPriceDrafts((prev) => ({ ...prev, [product.id]: e.target.value }))}
                    />
                    <span className="text-sm text-muted-foreground">EUR</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={productMutation.isPending}
                      onClick={() => {
                        const parsed = Math.round(parseFloat(priceDraft.replace(",", ".")) * 100);
                        if (!Number.isFinite(parsed) || parsed < 0) {
                          toast({ variant: "destructive", title: "Precio no válido" });
                          return;
                        }
                        productMutation.mutate({ id: product.id, patch: { priceCents: parsed } });
                      }}
                    >
                      Guardar
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">Activo</span>
                    <Switch
                      checked={product.active}
                      disabled={productMutation.isPending}
                      onCheckedChange={(checked) =>
                        productMutation.mutate({ id: product.id, patch: { active: checked } })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variante</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Activa</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants.map((variant) => {
                      const draft = stockDrafts[variant.sku] ?? String(variant.stock);
                      return (
                        <TableRow key={variant.sku} className={variant.stock === 0 ? "opacity-70" : ""}>
                          <TableCell>
                            <span className="font-medium">
                              {COLOR_LABELS[variant.color ?? ""] ?? variant.color}
                              {variant.size ? ` · ${variant.size}` : ""}
                            </span>
                            <span className="block text-xs text-muted-foreground font-mono">{variant.sku}</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              className="w-20 h-8"
                              inputMode="numeric"
                              value={draft}
                              onChange={(e) =>
                                setStockDrafts((prev) => ({ ...prev, [variant.sku]: e.target.value }))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={variant.active}
                              disabled={variantMutation.isPending}
                              onCheckedChange={(checked) =>
                                variantMutation.mutate({ sku: variant.sku, patch: { active: checked } })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={variantMutation.isPending || draft === String(variant.stock)}
                              onClick={() => {
                                const parsed = parseInt(draft, 10);
                                if (!Number.isFinite(parsed) || parsed < 0) {
                                  toast({ variant: "destructive", title: "Stock no válido" });
                                  return;
                                }
                                variantMutation.mutate({ sku: variant.sku, patch: { stock: parsed } });
                              }}
                            >
                              Guardar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
