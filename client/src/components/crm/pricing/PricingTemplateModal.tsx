import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import {
  WEEKDAY_LABELS,
  type PricingOverrideTemplate,
  type PricingOverrideTemplateFormData,
} from "./types";

interface BoatOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: PricingOverrideTemplate | null;
}

const emptyForm: PricingOverrideTemplateFormData = {
  name: "",
  description: "",
  label: "",
  weekdayFilter: null,
  direction: "surcharge",
  adjustmentType: "multiplier",
  adjustmentValue: "0.20",
  boatId: null,
  notes: "",
  priority: 0,
};

export function PricingTemplateModal({ open, onOpenChange, template }: Props) {
  const { toast } = useToast();
  const isEdit = !!template;
  const [form, setForm] = useState<PricingOverrideTemplateFormData>(emptyForm);
  const [restrictWeekdays, setRestrictWeekdays] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (template) {
      setForm({
        name: template.name,
        description: template.description ?? "",
        label: template.label,
        weekdayFilter: template.weekdayFilter,
        direction: template.direction,
        adjustmentType: template.adjustmentType,
        adjustmentValue: template.adjustmentValue,
        boatId: template.boatId,
        notes: template.notes ?? "",
        priority: template.priority,
      });
      setRestrictWeekdays(!!template.weekdayFilter);
    } else {
      setForm(emptyForm);
      setRestrictWeekdays(false);
    }
  }, [open, template]);

  const { data: boats = [] } = useQuery<BoatOption[]>({
    queryKey: ["/api/admin/boats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/boats", { credentials: "include" });
      if (!res.ok) throw new Error("Error cargando barcos");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PricingOverrideTemplateFormData) => {
      const url = isEdit
        ? `/api/admin/pricing-override-templates/${template!.id}`
        : "/api/admin/pricing-override-templates";
      const payload = {
        ...data,
        description: data.description.trim() || null,
        notes: data.notes.trim() || null,
        weekdayFilter: restrictWeekdays ? data.weekdayFilter : null,
      };
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error guardando plantilla");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-override-templates"] });
      toast({ title: isEdit ? "Plantilla actualizada" : "Plantilla guardada" });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "El nombre interno es obligatorio" });
      return;
    }
    if (!form.label.trim()) {
      toast({ variant: "destructive", title: "Error", description: "El label sugerido es obligatorio" });
      return;
    }
    const adjValue = parseFloat(form.adjustmentValue);
    if (Number.isNaN(adjValue) || adjValue <= 0) {
      toast({ variant: "destructive", title: "Error", description: "El ajuste debe ser un número positivo" });
      return;
    }
    if (form.adjustmentType === "multiplier" && adjValue > 5) {
      toast({ variant: "destructive", title: "Error", description: "El multiplicador no puede superar 5 (500%)" });
      return;
    }
    saveMutation.mutate(form);
  };

  const toggleWeekday = (num: number) => {
    const current = form.weekdayFilter ?? [];
    const next = current.includes(num) ? current.filter((n) => n !== num) : [...current, num].sort();
    setForm({ ...form, weekdayFilter: next });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
          <DialogDescription>
            Guarda un preset que puedas reutilizar más adelante. Al aplicarlo, elegirás
            las fechas — el resto (barco, días, ajuste, label sugerido) se rellenará
            automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre interno *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Recargo finde Solar 450"
              maxLength={120}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Solo lo ves tú en este listado.
            </p>
          </div>

          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ej: +15% para sábados pico"
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="label">Label sugerido al aplicar *</Label>
            <Input
              id="label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ej: Pico agosto Solar 450"
              maxLength={120}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Aparece pre-rellenado en el override al aplicar; editable en ese momento.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="restrictWeekdays"
                checked={restrictWeekdays}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true;
                  setRestrictWeekdays(isChecked);
                  if (isChecked && !form.weekdayFilter) {
                    setForm({ ...form, weekdayFilter: [6, 0] });
                  }
                }}
              />
              <Label htmlFor="restrictWeekdays" className="cursor-pointer">
                Aplicar solo en días concretos de la semana
              </Label>
            </div>
            {restrictWeekdays && (
              <div className="flex gap-2 flex-wrap pl-6">
                {WEEKDAY_LABELS.map((d) => {
                  const checked = form.weekdayFilter?.includes(d.num) ?? false;
                  return (
                    <button
                      key={d.num}
                      type="button"
                      onClick={() => toggleWeekday(d.num)}
                      className={`w-10 h-10 rounded-md border text-sm font-medium transition ${
                        checked
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      }`}
                      title={d.long}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label>Dirección del ajuste *</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, direction: "surcharge" })}
                className={`px-3 py-2 rounded-md border text-sm font-medium transition ${
                  form.direction === "surcharge"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input"
                }`}
              >
                Subir precio (recargo)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, direction: "discount" })}
                className={`px-3 py-2 rounded-md border text-sm font-medium transition ${
                  form.direction === "discount"
                    ? "bg-success text-success-foreground border-success"
                    : "bg-background hover:bg-muted border-input"
                }`}
              >
                Bajar precio (promoción)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="adjustmentType">Tipo de ajuste *</Label>
              <Select
                value={form.adjustmentType}
                onValueChange={(v) => setForm({ ...form, adjustmentType: v as "multiplier" | "flat_eur" })}
              >
                <SelectTrigger id="adjustmentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiplier">Porcentaje (%)</SelectItem>
                  <SelectItem value="flat_eur">Importe fijo (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adjustmentValue">
                Valor *{" "}
                {form.adjustmentType === "multiplier" && (
                  <span className="text-xs text-muted-foreground">(0.25 = +25%)</span>
                )}
              </Label>
              <Input
                id="adjustmentValue"
                type="number"
                step={form.adjustmentType === "multiplier" ? "0.01" : "1"}
                min="0.01"
                value={form.adjustmentValue}
                onChange={(e) => setForm({ ...form, adjustmentValue: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="boatId">Aplica a</Label>
            <Select
              value={form.boatId ?? "_all"}
              onValueChange={(v) => setForm({ ...form, boatId: v === "_all" ? null : v })}
            >
              <SelectTrigger id="boatId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos los barcos</SelectItem>
                {boats.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Prioridad</Label>
            <Input
              id="priority"
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">Mayor número = gana en conflictos</p>
          </div>

          <div>
            <Label htmlFor="notes">Notas internas (opcional)</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Razón del preset, contexto, etc."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Guardar plantilla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
