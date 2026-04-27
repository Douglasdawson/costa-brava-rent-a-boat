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
  direction: "surcharge" | "discount";
  adjustmentType: "multiplier" | "flat_eur";
  adjustmentValue: string;
  boatId: string | null;
  notes: string;
  priority: number;
}

export const TEMPLATE_DEFINITIONS = [
  // Differentiated by boat type — preferred (captures more revenue, avoids
  // pricing risk on premium/secondary boats that already linger unsold).
  {
    id: "peak_august_differentiated",
    label: "Pico agosto — DIFERENCIADO",
    description: "+15% en CORE (Solar/Remus/Astec), +5% en PREMIUM (Trimarchi/Pacific). Mingolla y Pacific+capi sin subida. 1-17 ago.",
    badge: "Recomendado",
  },
  {
    id: "asuncion_differentiated",
    label: "Asunción — DIFERENCIADO",
    description: "+20% CORE, +10% PREMIUM, +5% Mingolla. Solo el 15 ago.",
    badge: "Festivo",
  },
  {
    id: "pacific_capitan_promo",
    label: "Promo Pacific+capitán",
    description: "−10% indefinido (toda la temporada) para Excursión Privada con Capitán. Sobra 88% de días pico, baja precio para llenar.",
    badge: "Promo",
  },
  // Uniform fallback templates — simpler but capture less and risk pushing away
  // customers on premium/secondary boats. Kept available for testing or fallback.
  {
    id: "peak_august",
    label: "Pico agosto — uniforme",
    description: "+10% a todos los barcos por igual, 1-17 ago. Más simple pero deja revenue sobre la mesa.",
    badge: "Simple",
  },
  {
    id: "asuncion_aug15",
    label: "Asunción — uniforme",
    description: "+15% a todos los barcos el 15 ago. Versión simple sin diferenciación.",
    badge: "Simple",
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
