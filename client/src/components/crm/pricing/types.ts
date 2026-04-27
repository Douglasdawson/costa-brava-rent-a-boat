export interface PricingOverride {
  id: string;
  tenantId: string | null;
  boatId: string | null;
  dateStart: string; // YYYY-MM-DD
  dateEnd: string; // YYYY-MM-DD
  weekdayFilter: number[] | null;
  direction: "surcharge" | "discount";
  adjustmentType: "multiplier" | "flat_eur";
  adjustmentValue: string; // numeric stored as string
  label: string;
  notes: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PricingOverrideFormData {
  label: string;
  dateStart: string;
  dateEnd: string;
  weekdayFilter: number[] | null;
  direction: "surcharge"; // MVP: only surcharge
  adjustmentType: "multiplier" | "flat_eur";
  adjustmentValue: string;
  boatId: string | null;
  notes: string;
  priority: number;
}

export const TEMPLATE_DEFINITIONS = [
  {
    id: "peak_august",
    label: "Pico agosto (1-17 ago)",
    description: "+10% sobre tarifa, todos los barcos, 17 días seguidos. Sin recargo finde extra (ya bypass en agosto).",
    badge: "Recomendado",
  },
  {
    id: "asuncion_aug15",
    label: "Festivo Asunción (15 ago)",
    description: "+15% solo el 15 de agosto. Suma a 'Pico agosto' por prioridad.",
    badge: "Festivo",
  },
] as const;

export type TemplateId = (typeof TEMPLATE_DEFINITIONS)[number]["id"];

export const WEEKDAY_LABELS = [
  { num: 1, short: "L", long: "Lunes" },
  { num: 2, short: "M", long: "Martes" },
  { num: 3, short: "X", long: "Miércoles" },
  { num: 4, short: "J", long: "Jueves" },
  { num: 5, short: "V", long: "Viernes" },
  { num: 6, short: "S", long: "Sábado" },
  { num: 0, short: "D", long: "Domingo" },
] as const;
