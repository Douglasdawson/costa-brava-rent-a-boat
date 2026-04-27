import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Calendar as CalendarIcon, Anchor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WEEKDAY_LABELS, type PricingOverride } from "./types";

interface PricingOverridesListProps {
  onEdit: (override: PricingOverride) => void;
}

interface BoatLite {
  id: string;
  name: string;
}

function formatAdjustment(o: PricingOverride): string {
  const value = parseFloat(o.adjustmentValue);
  const sign = o.direction === "surcharge" ? "+" : "−";
  if (o.adjustmentType === "multiplier") {
    return `${sign}${Math.round(value * 100)}%`;
  }
  return `${sign}${Math.round(value)}€`;
}

function formatWeekdayFilter(filter: number[] | null): string | null {
  if (!filter || filter.length === 0) return null;
  if (filter.length === 7) return null;
  if (filter.length === 2 && filter.includes(0) && filter.includes(6)) return "Sábados y domingos";
  return filter
    .map((n) => WEEKDAY_LABELS.find((w) => w.num === n)?.short ?? "?")
    .join(" ");
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (start === end) {
    return format(s, "d MMM yyyy", { locale: es });
  }
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${format(s, "d", { locale: es })} – ${format(e, "d MMM yyyy", { locale: es })}`;
  }
  return `${format(s, "d MMM", { locale: es })} – ${format(e, "d MMM yyyy", { locale: es })}`;
}

export function PricingOverridesList({ onEdit }: PricingOverridesListProps) {
  const { toast } = useToast();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: overrides = [], isLoading } = useQuery<PricingOverride[]>({
    queryKey: ["/api/admin/pricing-overrides"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pricing-overrides", { credentials: "include" });
      if (!res.ok) throw new Error("Error cargando overrides");
      return res.json();
    },
  });

  const { data: boats = [] } = useQuery<BoatLite[]>({
    queryKey: ["/api/admin/boats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/boats", { credentials: "include" });
      if (!res.ok) throw new Error("Error cargando barcos");
      return res.json();
    },
  });

  const boatNameById = (id: string | null) => {
    if (!id) return null;
    return boats.find((b) => b.id === id)?.name ?? id;
  };

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/pricing-overrides/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al eliminar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-overrides"] });
      toast({ title: "Override eliminado" });
      setConfirmDeleteId(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overrides activos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Overrides activos ({overrides.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay overrides activos. Crea uno desde una plantilla o con el botón de arriba.
            </p>
          ) : (
            <div className="space-y-3">
              {overrides.map((o) => {
                const boatName = boatNameById(o.boatId);
                const weekdayLabel = formatWeekdayFilter(o.weekdayFilter);
                return (
                  <div
                    key={o.id}
                    className="border rounded-md p-3 space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm truncate">{o.label}</h4>
                          <Badge variant="default">{formatAdjustment(o)}</Badge>
                          {o.priority > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              prio {o.priority}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {formatDateRange(o.dateStart, o.dateEnd)}
                          </span>
                          {weekdayLabel && <span>· {weekdayLabel}</span>}
                          {boatName && (
                            <span className="flex items-center gap-1">
                              <Anchor className="w-3 h-3" />
                              {boatName}
                            </span>
                          )}
                          {!boatName && <span>· Todos los barcos</span>}
                        </div>
                        {o.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">{o.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => onEdit(o)} aria-label="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmDeleteId(o.id)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar override?</AlertDialogTitle>
            <AlertDialogDescription>
              El override quedará desactivado. Las reservas pasadas que se hicieron con este precio
              conservan el dato (no se borra del historial).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && deactivateMutation.mutate(confirmDeleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
