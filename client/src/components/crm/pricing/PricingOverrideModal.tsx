import { useEffect, useMemo, useState } from "react";
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
import { Loader2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  WEEKDAY_LABELS,
  type PricingOverride,
  type PricingOverrideFormData,
} from "./types";
import {
  calculatePricingBreakdown,
  type Duration,
  type PricingOverrideRule,
} from "@shared/pricing";
import { BOAT_DATA } from "@shared/boatData";

const PREVIEW_DURATIONS: Duration[] = ["1h", "2h", "4h", "8h"];

function weekdaysIntersect(a: number[] | null, b: number[] | null): boolean {
  if (!a || a.length === 0 || !b || b.length === 0) return true;
  return a.some((d) => b.includes(d));
}

function appliesToSameBoat(aBoatId: string | null, bBoatId: string | null): boolean {
  // global (null) affects every boat, so it overlaps any boat-specific or another global.
  if (aBoatId === null || bBoatId === null) return true;
  return aBoatId === bBoatId;
}

function findOverlappingOverrides(
  candidate: {
    dateStart: string;
    dateEnd: string;
    weekdayFilter: number[] | null;
    boatId: string | null;
  },
  all: PricingOverride[],
  excludeId?: string
): PricingOverride[] {
  if (!candidate.dateStart || !candidate.dateEnd || candidate.dateStart > candidate.dateEnd) {
    return [];
  }
  return all.filter((o) => {
    if (o.id === excludeId) return false;
    if (!o.isActive) return false;
    if (candidate.dateStart > o.dateEnd || candidate.dateEnd < o.dateStart) return false;
    if (!appliesToSameBoat(candidate.boatId, o.boatId)) return false;
    if (!weekdaysIntersect(candidate.weekdayFilter, o.weekdayFilter)) return false;
    return true;
  });
}

function pickPreviewDate(
  dateStart: string,
  dateEnd: string,
  weekdayFilter: number[] | null
): Date | null {
  if (!dateStart) return null;
  const start = new Date(dateStart + "T12:00:00");
  const end = new Date(dateEnd + "T12:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return null;
  const cursor = new Date(start);
  while (cursor <= end) {
    const wd = cursor.getDay();
    if (!weekdayFilter || weekdayFilter.length === 0 || weekdayFilter.includes(wd)) {
      return new Date(cursor);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

interface BoatOption {
  id: string;
  name: string;
}

interface PricingOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  override?: PricingOverride | null; // null/undefined = create mode; otherwise edit
  prefillDate?: string | null; // ISO YYYY-MM-DD; used only in create mode to seed dateStart/dateEnd
  /** Used only in create mode. Seeds all non-date fields from a saved template. */
  initialValues?: Partial<PricingOverrideFormData> | null;
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

interface OverlapWarningProps {
  candidate: {
    dateStart: string;
    dateEnd: string;
    weekdayFilter: number[] | null;
    boatId: string | null;
  };
  excludeId?: string;
}

function OverlapWarning({ candidate, excludeId }: OverlapWarningProps) {
  // Reuses the React Query cache populated by PricingOverridesList — no extra request.
  const { data: allOverrides = [] } = useQuery<PricingOverride[]>({
    queryKey: ["/api/admin/pricing-overrides"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pricing-overrides?includeInactive=true", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando overrides");
      return res.json();
    },
  });

  const overlapping = useMemo(
    () => findOverlappingOverrides(candidate, allOverrides, excludeId),
    [candidate, allOverrides, excludeId]
  );

  if (overlapping.length === 0) return null;

  const fmtRange = (s: string, e: string) => (s === e ? s : `${s} → ${e}`);

  return (
    <Alert className="border-popular/40 bg-popular/5">
      <AlertTriangle className="h-4 w-4 text-popular" />
      <AlertTitle>
        {overlapping.length === 1
          ? "Hay otro override en estas fechas"
          : `Hay ${overlapping.length} overrides en estas fechas`}
      </AlertTitle>
      <AlertDescription>
        <p className="text-xs mb-2">
          Si las condiciones se cruzan, gana el más específico (un barco concreto antes que «todos»),
          luego el de mayor prioridad, luego el más reciente.
        </p>
        <ul className="space-y-1 text-xs">
          {overlapping.slice(0, 4).map((o) => (
            <li key={o.id}>
              · <strong>{o.label}</strong>{" "}
              <span className="text-muted-foreground">
                ({fmtRange(o.dateStart, o.dateEnd)}
                {o.priority !== 0 ? ` · prio ${o.priority}` : ""}
                {o.boatId ? ` · barco específico` : ` · todos los barcos`})
              </span>
            </li>
          ))}
          {overlapping.length > 4 && (
            <li className="text-muted-foreground italic">y {overlapping.length - 4} más…</li>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

interface OverridePreviewProps {
  form: PricingOverrideFormData;
  restrictWeekdays: boolean;
}

function OverridePreview({ form, restrictWeekdays }: OverridePreviewProps) {
  const candidate = useMemo<PricingOverrideRule | null>(() => {
    const value = parseFloat(form.adjustmentValue);
    if (!form.dateStart || !form.dateEnd || Number.isNaN(value) || value <= 0) return null;
    return {
      id: "preview",
      boatId: form.boatId,
      dateStart: form.dateStart,
      dateEnd: form.dateEnd,
      weekdayFilter: restrictWeekdays ? form.weekdayFilter : null,
      direction: form.direction,
      adjustmentType: form.adjustmentType,
      adjustmentValue: value,
      priority: form.priority,
      label: form.label || "Preview",
      isActive: true,
      createdAt: new Date(),
    };
  }, [form, restrictWeekdays]);

  const sampleDate = useMemo(
    () => pickPreviewDate(form.dateStart, form.dateEnd, restrictWeekdays ? form.weekdayFilter : null),
    [form.dateStart, form.dateEnd, form.weekdayFilter, restrictWeekdays]
  );

  const boatsToPreview = useMemo(() => {
    const all = Object.values(BOAT_DATA);
    if (form.boatId) {
      const one = all.find((b) => b.id === form.boatId);
      return one ? [one] : [];
    }
    return all.slice(0, 5);
  }, [form.boatId]);

  if (!candidate || !sampleDate || boatsToPreview.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        Rellena fechas y valor para ver el impacto previsto.
      </div>
    );
  }

  const sampleLabel = sampleDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="rounded-md border p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Impacto previsto · {sampleLabel}
        {form.boatId ? "" : ` · primeros ${boatsToPreview.length} barcos`}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium pb-1.5 pr-2">Barco</th>
              {PREVIEW_DURATIONS.map((d) => (
                <th key={d} className="text-right font-medium pb-1.5 px-2">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {boatsToPreview.map((boat) => (
              <tr key={boat.id} className="border-t">
                <td className="py-1.5 pr-2 truncate max-w-[160px]" title={boat.name}>
                  {boat.name}
                </td>
                {PREVIEW_DURATIONS.map((d) => {
                  let before = 0;
                  let after = 0;
                  try {
                    before = calculatePricingBreakdown(boat.id, sampleDate, d, [], [], []).basePrice;
                    after = calculatePricingBreakdown(boat.id, sampleDate, d, [], [], [candidate]).basePrice;
                  } catch {
                    return <td key={d} className="py-1.5 px-2 text-right text-muted-foreground">—</td>;
                  }
                  if (before <= 0) {
                    return <td key={d} className="py-1.5 px-2 text-right text-muted-foreground">—</td>;
                  }
                  const isDown = after < before;
                  const Arrow = isDown ? TrendingDown : TrendingUp;
                  const colorClass = after === before
                    ? "text-muted-foreground"
                    : isDown
                      ? "text-success"
                      : "text-foreground";
                  return (
                    <td key={d} className={`py-1.5 px-2 text-right tabular-nums ${colorClass}`}>
                      <span className="text-muted-foreground line-through mr-1">{before}€</span>
                      <Arrow className="inline w-3 h-3 mx-0.5 -mt-0.5" aria-hidden="true" />
                      <strong>{after}€</strong>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PricingOverrideModal({
  open,
  onOpenChange,
  override,
  prefillDate,
  initialValues,
}: PricingOverrideModalProps) {
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
        direction: override.direction,
        adjustmentType: override.adjustmentType,
        adjustmentValue: override.adjustmentValue,
        boatId: override.boatId,
        notes: override.notes ?? "",
        priority: override.priority,
      });
      setRestrictWeekdays(!!override.weekdayFilter);
    } else {
      // Create mode: start from empty, then overlay template values (everything
      // except dates), then overlay the date prefill (calendar day-click).
      const base: PricingOverrideFormData = { ...emptyForm };
      if (initialValues) Object.assign(base, initialValues);
      if (prefillDate) {
        base.dateStart = prefillDate;
        base.dateEnd = prefillDate;
      }
      setForm(base);
      setRestrictWeekdays(!!base.weekdayFilter);
    }
  }, [open, override, prefillDate, initialValues]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-overrides/audit"] });
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
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Razón del ajuste, contexto, etc."
            />
          </div>

          <OverlapWarning
            candidate={{
              dateStart: form.dateStart,
              dateEnd: form.dateEnd,
              weekdayFilter: restrictWeekdays ? form.weekdayFilter : null,
              boatId: form.boatId,
            }}
            excludeId={override?.id}
          />

          <OverridePreview form={form} restrictWeekdays={restrictWeekdays} />

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
