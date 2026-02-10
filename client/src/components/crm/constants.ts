import {
  Umbrella,
  Sun,
  Ship,
  Compass,
  LifeBuoy,
  Music,
  Droplets,
  Euro,
  Fuel,
  Anchor,
  Sparkles,
  Shield,
  Users,
} from "lucide-react";

// Equipment catalog with icons
export const EQUIPMENT_OPTIONS = [
  { id: "toldo-bimini", label: "Toldo Bimini", icon: Umbrella },
  { id: "solarium-proa-popa", label: "Solárium proa y popa", icon: Sun },
  { id: "escalera-bano", label: "Escalera de baño", icon: Ship },
  { id: "equipo-navegacion", label: "Equipo de navegación", icon: Compass },
  { id: "equipo-seguridad", label: "Equipo de seguridad", icon: LifeBuoy },
  { id: "equipo-musica", label: "Equipo de música", icon: Music },
  { id: "ducha-agua-dulce", label: "Ducha de agua dulce", icon: Droplets },
];

// Included in price catalog with icons
export const INCLUDED_OPTIONS = [
  { id: "iva", label: "IVA", icon: Euro },
  { id: "carburante", label: "Carburante", icon: Fuel },
  { id: "amarre", label: "Amarre", icon: Anchor },
  { id: "limpieza", label: "Limpieza", icon: Sparkles },
  { id: "seguro", label: "Seguro", icon: Shield },
  { id: "patron", label: "Patrón", icon: Users },
];

// Status colors for badges
export const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "default";
    case "pending_payment":
      return "secondary";
    case "hold":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

// Status labels in Spanish
export const getStatusLabel = (status: string) => {
  switch (status) {
    case "confirmed":
      return "Confirmada";
    case "pending_payment":
      return "Pendiente Pago";
    case "hold":
      return "En Espera";
    case "cancelled":
      return "Cancelada";
    case "draft":
      return "Borrador";
    default:
      return status;
  }
};

// Payment status labels
export const getPaymentStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Pagado";
    case "pending":
      return "Pendiente";
    case "failed":
      return "Fallido";
    case "refunded":
      return "Reembolsado";
    default:
      return status;
  }
};

// Tab configuration
export const CRM_TABS = [
  { id: "dashboard", label: "Dashboard", icon: "TrendingUp" },
  { id: "bookings", label: "Reservas", icon: "Calendar" },
  { id: "customers", label: "Clientes", icon: "Users" },
  { id: "fleet", label: "Flota", icon: "Anchor" },
] as const;

export type CRMTabId = (typeof CRM_TABS)[number]["id"];
