import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Loader2,
  Sparkles,
  BookmarkPlus,
  Trash2,
  Pencil,
  Anchor,
  Globe,
} from "lucide-react";
import {
  TEMPLATE_DEFINITIONS,
  type PricingOverrideTemplate,
  type PricingOverrideFormData,
  type TemplateId,
} from "./types";
import { PricingTemplateModal } from "./PricingTemplateModal";

interface PricingTemplatesPanelProps {
  /** Called when a custom template is "applied" — opens the override modal seeded with its fields. */
  onApplyCustom: (initialValues: Partial<PricingOverrideFormData>) => void;
}

function formatAdjustment(t: PricingOverrideTemplate): string {
  const value = parseFloat(t.adjustmentValue);
  const sign = t.direction === "surcharge" ? "+" : "−";
  if (t.adjustmentType === "multiplier") {
    return `${sign}${Math.round(value * 100)}%`;
  }
  return `${sign}${Math.round(value)}€`;
}

function templateToFormValues(t: PricingOverrideTemplate): Partial<PricingOverrideFormData> {
  return {
    label: t.label,
    weekdayFilter: t.weekdayFilter,
    direction: t.direction,
    adjustmentType: t.adjustmentType,
    adjustmentValue: t.adjustmentValue,
    boatId: t.boatId,
    notes: t.notes ?? "",
    priority: t.priority,
  };
}

export function PricingTemplatesPanel({ onApplyCustom }: PricingTemplatesPanelProps) {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [pendingId, setPendingId] = useState<TemplateId | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PricingOverrideTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const applyMutation = useMutation({
    mutationFn: async (templateId: TemplateId) => {
      setPendingId(templateId);
      const res = await fetch(`/api/admin/pricing-overrides/templates/${templateId}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error aplicando plantilla");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-overrides/audit"] });
      const description = data.count
        ? `${data.count} overrides creados`
        : data.label ?? "Override creado";
      toast({ title: "Plantilla aplicada", description });
      setPendingId(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setPendingId(null);
    },
  });

  const { data: customTemplates = [], isLoading: customLoading } = useQuery<
    PricingOverrideTemplate[]
  >({
    queryKey: ["/api/admin/pricing-override-templates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pricing-override-templates", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando plantillas guardadas");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/pricing-override-templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error eliminando plantilla");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-override-templates"] });
      toast({ title: "Plantilla eliminada" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const openCreate = () => {
    setEditingTemplate(null);
    setModalOpen(true);
  };
  const openEdit = (t: PricingOverrideTemplate) => {
    setEditingTemplate(t);
    setModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Plantillas rápidas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Basadas en el análisis de 6 años de reservas (2020-2025). Aplica con un clic.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 max-w-xs">
            <Label htmlFor="year-select" className="whitespace-nowrap">Año:</Label>
            <Input
              id="year-select"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || currentYear)}
              min={currentYear}
              max={currentYear + 5}
              className="w-24"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TEMPLATE_DEFINITIONS.map((tpl) => {
              const badgeVariant: "default" | "secondary" | "destructive" | "outline" =
                tpl.badge === "Recomendado" ? "default"
                : tpl.badge === "Promo" ? "destructive"
                : tpl.badge === "Festivo" ? "secondary"
                : "outline";
              return (
              <Card key={tpl.id} className="border-2 hover:border-primary/40 transition-colors">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm leading-tight">{tpl.label}</h4>
                    <Badge variant={badgeVariant} className="shrink-0 text-[10px]">
                      {tpl.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground min-h-[2.5rem]">
                    {tpl.description}
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={applyMutation.isPending}
                    onClick={() => applyMutation.mutate(tpl.id)}
                  >
                    {pendingId === tpl.id ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : null}
                    Aplicar a {year}
                  </Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookmarkPlus className="w-5 h-5" />
              Tus plantillas guardadas
              <span className="text-sm font-normal text-muted-foreground">
                ({customTemplates.length})
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Presets propios para ajustes que repites. Al aplicar elegirás las fechas; el
              resto se rellena solo.
            </p>
          </div>
          <Button onClick={openCreate} variant="outline" size="sm">
            <BookmarkPlus className="w-4 h-4 mr-2" />
            Nueva plantilla
          </Button>
        </CardHeader>
        <CardContent>
          {customLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : customTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aún no tienes plantillas guardadas. Crea la primera con el botón de arriba.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {customTemplates.map((t) => (
                <Card key={t.id} className="border hover:border-primary/40 transition-colors">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm leading-tight truncate">{t.name}</h4>
                      <Badge
                        className={
                          t.direction === "discount"
                            ? "bg-success/15 text-success-foreground border border-success/40 hover:bg-success/15 shrink-0"
                            : "bg-popular/15 text-foreground border border-popular/40 hover:bg-popular/15 shrink-0"
                        }
                      >
                        {formatAdjustment(t)}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                        {t.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {t.boatId ? (
                        <span className="flex items-center gap-1">
                          <Anchor className="w-3 h-3" /> Barco específico
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Todos los barcos
                        </span>
                      )}
                      {t.priority !== 0 && <span>· prio {t.priority}</span>}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onApplyCustom(templateToFormValues(t))}
                      >
                        Aplicar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(t)}
                        aria-label="Editar plantilla"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`¿Eliminar la plantilla "${t.name}"?`)) {
                            deleteMutation.mutate(t.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        aria-label="Eliminar plantilla"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PricingTemplateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        template={editingTemplate}
      />
    </>
  );
}
