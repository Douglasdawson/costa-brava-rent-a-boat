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
  bookingStatus: z.enum(["draft", "hold", "pending_payment", "confirmed", "cancelled"]),
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
  deposit: z.string().min(1, "El depósito es requerido"),
  isActive: z.boolean(),
  displayOrder: z.number().optional(),

  // Extended fields
  imageUrl: z.string().optional(),
  imageGallery: z.array(z.string()).optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  specifications: z
    .object({
      model: z.string(),
      length: z.string(),
      beam: z.string(),
      engine: z.string(),
      fuel: z.string(),
      capacity: z.string(),
      deposit: z.string(),
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

// Stats data type
export interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  averageRating: number;
  fleetAvailability: number;
  boatsAvailable: number;
  totalBoats: number;
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

export interface PaginatedCrmCustomersResponse {
  data: CrmCustomerData[];
  total: number;
  page: number;
  totalPages: number;
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
