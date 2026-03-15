import { z } from "zod";

export interface CRMDashboardProps {
  adminToken: string;
}

// Validation schema for editing booking
export const editBookingSchema = z.object({
  customerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  customerSurname: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  customerPhone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  customerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  customerNationality: z.string().min(1, "La nacionalidad es requerida"),
  numberOfPeople: z.coerce.number().min(1, "Debe ser al menos 1 persona"),
  boatId: z.string().min(1, "El barco es requerido"),
  startTime: z.string(),
  endTime: z.string(),
  totalHours: z.coerce.number().min(1, "Debe ser al menos 1 hora"),
  subtotal: z.string(),
  extrasTotal: z.string(),
  deposit: z.string(),
  totalAmount: z.string(),
  bookingStatus: z.enum(["draft", "hold", "pending_payment", "confirmed", "cancelled", "completed"]),
  paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]),
  notes: z.string().optional(),
});

export type EditBookingFormData = z.infer<typeof editBookingSchema>;

// Validation schema for boat
export const boatSchema = z.object({
  id: z.string().min(1, "El ID es requerido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  capacity: z.coerce.number().min(1, "La capacidad debe ser al menos 1"),
  requiresLicense: z.boolean(),
  licenseType: z.enum(["none", "navegacion", "pnb", "per", "patron_yate", "capitan_yate"]).default("none"),
  deposit: z.string().min(1, "El depósito es requerido"),
  isActive: z.boolean(),
  displayOrder: z.number().nullable().optional(),

  // Extended fields
  imageUrl: z.string().optional(),
  imageGallery: z.array(z.string()).optional(),
  imageGalleryTablet: z.array(z.string()).optional(),
  imageGalleryMobile: z.array(z.string()).optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  specifications: z
    .object({
      model: z.string().default(""),
      length: z.string().default(""),
      beam: z.string().default(""),
      engine: z.string().default(""),
      fuel: z.string().default(""),
      capacity: z.string().default(""),
      deposit: z.string().default(""),
    })
    .optional(),
  equipment: z.array(z.string()).optional(),
  included: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  pricing: z
    .object({
      BAJA: z.object({
        period: z.string(),
        prices: z.record(z.number()),
      }),
      MEDIA: z.object({
        period: z.string(),
        prices: z.record(z.number()),
      }),
      ALTA: z.object({
        period: z.string(),
        prices: z.record(z.number()),
      }),
    })
    .optional(),
  extras: z
    .array(
      z.object({
        name: z.string(),
        price: z.string(),
        icon: z.string(),
      })
    )
    .optional(),
});

export type BoatFormData = z.infer<typeof boatSchema>;

// Generic paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Dashboard stats from /api/admin/stats/dashboard
export interface DashboardStats {
  bookingsCount: number;
  revenue: number;
  confirmedBookings: number;
  pendingBookings: number;
  previousPeriodRevenue: number;
  previousPeriodBookings: number;
  averageTicket: number;
  previousAverageTicket: number;
  totalBoats: number;
  availableBoats: number;
  period: string;
}

// Legacy customer data type (derived from bookings - no longer used for API)
export interface CustomerData {
  customerName: string;
  customerSurname: string;
  customerPhone: string;
  customerEmail?: string;
  customerNationality: string;
  bookingsCount: number;
  totalSpent: number;
  lastBookingDate: string;
  bookingIds: string[];
}

// CRM Customer data type (from crm_customers table)
export interface CrmCustomerData {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string;
  nationality: string | null;
  documentId: string | null;
  notes: string | null;
  segment: "new" | "returning" | "vip";
  tags: string[] | null;
  totalBookings: number;
  totalSpent: string;
  firstBookingDate: string | null;
  lastBookingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCrmCustomersResponse extends PaginatedResponse<CrmCustomerData> {
  bestCustomerName: string | null;
  bestCustomerSpent: string | null;
  totalSpentAll: string;
  totalCustomersAll: number;
}

// Checkin data type
export interface CheckinData {
  id: string;
  bookingId: string;
  boatId: string;
  type: "checkin" | "checkout";
  performedAt: string;
  performedBy: string | null;
  fuelLevel: string;
  condition: string;
  engineHours: string | null;
  notes: string | null;
  photos: string[] | null;
  signatureUrl: string | null;
  checklist: Array<{ item: string; checked: boolean }> | null;
  createdAt: string;
}
