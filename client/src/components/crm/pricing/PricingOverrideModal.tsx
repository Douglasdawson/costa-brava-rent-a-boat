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
  type PricingOverride,
  type PricingOverrideFormData,
} from "./types";

interface BoatOption {
  id: string;
  name: string;
}

interface PricingOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  override?: PricingOverride | null; // null/undefined = create mode; otherwise edit
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm: PricingOverrideFormData = {
  label: "",
  dateStart: todayISO(),
  dateEnd: todayISO(),
  weekdayFilter: null,
  direction: "surcharge",
  adjustmentType: "multiplier",
  adjustmentValue: "0.20",
  boatId: null,
  notes: "",
  priority: 0,
};

export function PricingOverrideModal({ open, onOpenChange, override }: PricingOverrideModalProps) {
  const { toast } = useToast();
  const isEdit = !!override;
  const [form, setForm] = useState<PricingOverrideFormData>(emptyForm);
  const [restrictWeekdays, setRestrictWeekdays] = useState(false);

  // Reset form when modal opens or override changes
  useEffect(() => {
    if (!open) return;
    if (override) {
      setForm({
        label: override.label,
        dateStart: override.dateStart,
        dateEnd: override.dateEnd,
        weekdayFilter: override.weekdayFilter,
        direction: "surcharge",
        adjustmentType: override.adjustmentType,
        adjustmentValue: override.adjustmentValue,
        boatId: override.boatId,
        notes: override.notes ?? "",
        priority: override.priority,
      });
      setRestrictWeekdays(!!override.weekdayFilter);
    } else {
      setForm(emptyForm);
      setRestrictWeekdays(false);
    }
  }, [open, override]);

  const { data: boats = [] } = useQuery<BoatOption[]>({
    queryKey: ["/api/admin/boats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/boats", { credentials: "include" });
      if (!res.ok) throw new Error("Error cargando barcos");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PricingOverrideFormData) => {
      const url = isEdit
        ? `/api/admin/pricing-overrides/${override!.id}`
        : "/api/admin/pricing-overrides";
      const payload = {
        ...data,
        weekdayFilter: restrictWeekdays ? data.weekdayFilter : null,
        notes: data.notes.trim() || null,
      };
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error guardando override");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-overrides"] });
      toast({ title: isEdit ? "Override actualizado" : "Override creado" });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.dateEnd < form.dateStart) {
      toast({ variant: "destructive", title: "Error", description: "Fecha fin debe ser igual o posterior a fecha inicio" });
      return;
    }
    if (!form.label.trim()) {
      toast({ variant: "destructive", title: "Error", description: "El nombre es obligatorio" });
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
          <DialogTitle>{isEdit ? "Editar override de precio" : "Nuevo override de precio"}</DialogTitle>
          <DialogDescription>
            Aplica un ajuste sobre la tarifa base para un rango de fechas. Útil para semanas pico, festivos o promociones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="label">Nombre interno *</Label>
            <Input
              id="label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ej: Pico agosto 2026"
              maxLength={120}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dateStart">Fecha inicio *</Label>
              <Input
                id="dateStart"
                type="date"
                value={form.dateStart}
                onChange={(e) => setForm({ ...form, dateStart: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="dateEnd">Fecha fin *</Label>
              <Input
                id="dateEnd"
                type="date"
                value={form.dateEnd}
                onChange={(e) => setForm({ ...form, dateEnd: e.target.value })}
                required
              />
            </div>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <Input
                id="priority"
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">Mayor número = gana en conflictos</p>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Razón del ajuste, contexto, etc."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear override"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
