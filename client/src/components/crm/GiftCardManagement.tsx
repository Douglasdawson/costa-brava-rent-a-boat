import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, Check, X, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { PaginationControls } from "./shared/PaginationControls";

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

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  used: "bg-gray-100 text-gray-800",
  expired: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCards = filteredCards.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalActive = giftCards.filter((c) => c.status === "active").length;
  const totalRevenue = giftCards
    .filter((c) => c.paymentStatus === "completed")
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold font-heading flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Tarjetas Regalo
        </h2>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "active", "used", "expired"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter(f); setCurrentPage(1); }}
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
            <p className="text-sm text-muted-foreground">Total Tarjetas</p>
            <p className="text-2xl font-bold">{giftCards.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Activas</p>
            <p className="text-2xl font-bold text-green-600">{totalActive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ingresos Totales</p>
            <p className="text-2xl font-bold">{"\u20AC"}{totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Gift className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-heading font-medium text-foreground mb-1">No hay tarjetas regalo</p>
          <p className="text-sm text-muted-foreground">
            {filter !== "all" ? `No hay tarjetas ${statusLabels[filter]?.toLowerCase() || ""}` : "Las tarjetas regalo apareceran aqui cuando se creen"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
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
                    {paginatedCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-mono font-bold">{card.code}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold">{"\u20AC"}{parseFloat(card.amount).toFixed(2)}</span>
                            {card.remainingAmount !== card.amount && (
                              <span className="text-xs text-muted-foreground block">
                                Restante: {"\u20AC"}{parseFloat(card.remainingAmount).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{card.purchaserName}</p>
                            <p className="text-xs text-muted-foreground">{card.purchaserEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{card.recipientName}</p>
                            <p className="text-xs text-muted-foreground">{card.recipientEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[card.status] || "bg-gray-100 text-gray-800"}>
                            {statusLabels[card.status] || card.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={card.paymentStatus === "completed" ? "bg-emerald-100 text-emerald-800" : card.paymentStatus === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
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

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {paginatedCards.map((card) => (
              <div key={card.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold font-mono text-foreground">{card.code}</span>
                  <Badge className={statusColors[card.status] || "bg-gray-100 text-gray-800"}>
                    {statusLabels[card.status] || card.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold">{"\u20AC"}{parseFloat(card.amount).toFixed(2)}</span>
                  {card.remainingAmount !== card.amount && (
                    <span className="text-muted-foreground">
                      Restante: {"\u20AC"}{parseFloat(card.remainingAmount).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{card.purchaserName} - {card.purchaserEmail}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Expira: {format(new Date(card.expiresAt), "dd/MM/yyyy")}
                  </span>
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
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <PaginationControls
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
