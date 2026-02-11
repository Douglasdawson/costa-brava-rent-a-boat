import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, Check, X, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface GiftCard {
  id: string;
  code: string;
  amount: string;
  remainingAmount: string;
  purchaserName: string;
  purchaserEmail: string;
  recipientName: string;
  recipientEmail: string;
  personalMessage: string | null;
  paymentStatus: string;
  status: string;
  usedBookingId: string | null;
  expiresAt: string;
  createdAt: string;
}

interface GiftCardManagementProps {
  adminToken: string;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "secondary",
  used: "outline",
  expired: "destructive",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  active: "Activa",
  used: "Usada",
  expired: "Expirada",
  cancelled: "Cancelada",
};

const paymentLabels: Record<string, string> = {
  pending: "Pendiente",
  completed: "Pagado",
  failed: "Fallido",
};

export function GiftCardManagement({ adminToken }: GiftCardManagementProps) {
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();

  const headers = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  const { data: giftCards = [], isLoading } = useQuery<GiftCard[]>({
    queryKey: ["/api/admin/gift-cards"],
    queryFn: async () => {
      const res = await fetch("/api/admin/gift-cards", { headers });
      if (!res.ok) throw new Error("Error fetching gift cards");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, string> }) => {
      const res = await fetch(`/api/admin/gift-cards/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Error updating gift card");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-cards"] });
      toast({ title: "Tarjeta regalo actualizada" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const filteredCards = giftCards.filter((card) => {
    if (filter === "all") return true;
    return card.status === filter;
  });

  const totalActive = giftCards.filter((c) => c.status === "active").length;
  const totalRevenue = giftCards
    .filter((c) => c.paymentStatus === "completed")
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Tarjetas Regalo
        </h2>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "active", "used", "expired"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todas" : statusLabels[f] || f}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Tarjetas</p>
            <p className="text-2xl font-bold">{giftCards.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Activas</p>
            <p className="text-2xl font-bold text-green-600">{totalActive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Ingresos Totales</p>
            <p className="text-2xl font-bold">{totalRevenue.toFixed(2)}EUR</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay tarjetas regalo {filter !== "all" ? statusLabels[filter]?.toLowerCase() || "" : ""}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Destinatario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono font-bold">{card.code}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-semibold">{parseFloat(card.amount).toFixed(0)}EUR</span>
                          {card.remainingAmount !== card.amount && (
                            <span className="text-xs text-gray-500 block">
                              Restante: {parseFloat(card.remainingAmount).toFixed(0)}EUR
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{card.purchaserName}</p>
                          <p className="text-xs text-gray-500">{card.purchaserEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{card.recipientName}</p>
                          <p className="text-xs text-gray-500">{card.recipientEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[card.status] || "secondary"}>
                          {statusLabels[card.status] || card.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={card.paymentStatus === "completed" ? "default" : "outline"}>
                          {paymentLabels[card.paymentStatus] || card.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(card.expiresAt), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {card.status === "pending" && card.paymentStatus !== "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() =>
                                updateMutation.mutate({
                                  id: card.id,
                                  updates: { status: "active", paymentStatus: "completed" },
                                })
                              }
                              disabled={updateMutation.isPending}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Activar
                            </Button>
                          )}
                          {(card.status === "active" || card.status === "pending") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() =>
                                updateMutation.mutate({
                                  id: card.id,
                                  updates: { status: "cancelled" },
                                })
                              }
                              disabled={updateMutation.isPending}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
