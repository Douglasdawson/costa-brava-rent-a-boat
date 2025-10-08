import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, json, jsonb, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users (existing system - for CRM access)
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Customer users (Replit Auth - for customer accounts)
export const customerUsers = pgTable("customer_users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer profiles (extended info beyond Replit Auth)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => customerUsers.id).unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phonePrefix: varchar("phone_prefix").notNull(),
  phoneNumber: varchar("phone_number").notNull(),
  nationality: varchar("nationality").notNull(),
  documentType: varchar("document_type").notNull(), // passport, dni, nie, etc
  documentNumber: varchar("document_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const boats = pgTable("boats", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  requiresLicense: boolean("requires_license").notNull(),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }),
  deposit: decimal("deposit", { precision: 10, scale: 2 }).notNull(),
  
  // Extended boat information
  imageUrl: text("image_url"), // Main boat image
  imageGallery: text("image_gallery").array(), // Additional images
  subtitle: text("subtitle"), // e.g., "Sin Licencia Para Alquilar en Blanes"
  description: text("description"), // Full boat description
  
  // Specifications as JSON
  specifications: json("specifications").$type<{
    model: string;
    length: string;
    beam: string;
    engine: string;
    fuel: string;
    capacity: string;
    deposit: string;
  }>(),
  
  // Arrays
  equipment: text("equipment").array(), // Equipment items
  included: text("included").array(), // What's included in rental
  features: text("features").array(), // Key features
  
  // Seasonal pricing as JSON
  pricing: json("pricing").$type<{
    BAJA: { period: string; prices: { [key: string]: number } };
    MEDIA: { period: string; prices: { [key: string]: number } };
    ALTA: { period: string; prices: { [key: string]: number } };
  }>(),
  
  // Extras as JSON array
  extras: json("extras").$type<Array<{ name: string; price: string; icon: string }>>(),
  
  isActive: boolean("is_active").notNull().default(true),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id), // Optional link to customer profile
  boatId: varchar("boat_id").notNull().references(() => boats.id),
  bookingDate: timestamp("booking_date", { withTimezone: true }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  customerName: text("customer_name").notNull(),
  customerSurname: text("customer_surname").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  customerNationality: text("customer_nationality").notNull(),
  numberOfPeople: integer("number_of_people").notNull(),
  totalHours: integer("total_hours").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  extrasTotal: decimal("extras_total", { precision: 10, scale: 2 }).notNull().default("0"),
  deposit: decimal("deposit", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, completed, failed, refunded
  bookingStatus: text("booking_status").notNull().default("draft"), // draft, pending_payment, confirmed, cancelled
  source: text("source").notNull().default("web"), // web, admin
  couponCode: text("coupon_code"), // Optional discount code
  refundStatus: text("refund_status"), // null, requested, processing, completed
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }), // Amount refunded if any
  sessionId: text("session_id"), // Browser session for holds
  expiresAt: timestamp("expires_at", { withTimezone: true }), // Expiration time for holds
  whatsappConfirmationSent: boolean("whatsapp_confirmation_sent").notNull().default(false),
  whatsappReminderSent: boolean("whatsapp_reminder_sent").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  // Performance indexes
  boatTimeIdx: index("booking_boat_time_idx").on(table.boatId, table.startTime, table.endTime),
  bookingDateIdx: index("booking_date_idx").on(table.bookingDate),
  // Partial index for active bookings and holds
  activeBookingsIdx: index("active_bookings_idx").on(table.boatId, table.startTime, table.endTime)
    .where(sql`booking_status IN ('hold', 'pending_payment', 'confirmed')`),
  // Index for expired holds cleanup
  expiresAtIdx: index("bookings_expires_at_idx").on(table.expiresAt)
    .where(sql`booking_status = 'hold'`),
  // Indexes for status filtering (admin dashboard)
  bookingStatusIdx: index("booking_status_idx").on(table.bookingStatus),
  paymentStatusIdx: index("payment_status_idx").on(table.paymentStatus),
  // Index for customer lookups (admin customers endpoint)
  customerEmailIdx: index("customer_email_idx").on(table.customerEmail),
  customerPhoneIdx: index("customer_phone_idx").on(table.customerPhone),
  // Composite index for customer bookings lookup
  customerIdDateIdx: index("customer_id_date_idx").on(table.customerId, table.startTime),
}));

// Note: booking_holds functionality unified into bookings table with 'hold' status

export const bookingExtras = pgTable("booking_extras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  extraName: text("extra_name").notNull(),
  extraPrice: decimal("extra_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
});

// Page visits analytics
export const pageVisits = pgTable("page_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pagePath: text("page_path").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"), // mobile, tablet, desktop
  browserName: text("browser_name"),
  osName: text("os_name"),
  language: text("language"),
  country: text("country"),
  city: text("city"),
  referrer: text("referrer"),
  sessionId: text("session_id"),
  visitedAt: timestamp("visited_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  visitedAtIdx: index("page_visits_visited_at_idx").on(table.visitedAt),
  pagePathIdx: index("page_visits_page_path_idx").on(table.pagePath),
  sessionIdIdx: index("page_visits_session_idx").on(table.sessionId),
}));

// Zod schemas for validation
export const insertAdminUserSchema = createInsertSchema(adminUsers).pick({
  username: true,
  passwordHash: true,
});

export const upsertCustomerUserSchema = createInsertSchema(customerUsers);
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBoatSchema = createInsertSchema(boats);

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  whatsappConfirmationSent: true,
  whatsappReminderSent: true,
  refundStatus: true,
  refundAmount: true,
}).extend({
  // Custom validation for booking form with date coercion
  bookingDate: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  customerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  customerSurname: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  customerPhone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  customerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  customerNationality: z.string().min(1, "La nacionalidad es requerida"),
  numberOfPeople: z.number().min(1, "Debe ser al menos 1 persona"),
  totalHours: z.number().min(1, "Debe ser al menos 1 hora"),
  subtotal: z.string(),
  extrasTotal: z.string(),
  deposit: z.string(),
  totalAmount: z.string(),
  // Enum validations
  paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']),
  bookingStatus: z.enum(['draft', 'hold', 'pending_payment', 'confirmed', 'cancelled']),
  source: z.enum(['web', 'admin']),
}).refine((data) => data.startTime < data.endTime, {
  message: "La hora de fin debe ser posterior a la hora de inicio",
  path: ["endTime"],
});

export const insertBookingExtraSchema = createInsertSchema(bookingExtras).omit({
  id: true,
});

export const insertPageVisitSchema = createInsertSchema(pageVisits).omit({
  id: true,
  visitedAt: true,
});

// Update booking schema for PATCH requests (all fields optional)
export const updateBookingSchema = z.object({
  customerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  customerSurname: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres").optional(),
  customerPhone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos").optional(),
  customerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  customerNationality: z.string().min(1, "La nacionalidad es requerida").optional(),
  numberOfPeople: z.coerce.number().int("Debe ser un número entero").min(1, "Debe ser al menos 1 persona").optional(),
  boatId: z.string().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  totalHours: z.coerce.number().int("Debe ser un número entero").min(1, "Debe ser al menos 1 hora").optional(),
  subtotal: z.coerce.number().min(0, "El subtotal no puede ser negativo").optional(),
  extrasTotal: z.coerce.number().min(0, "Los extras no pueden ser negativos").optional(),
  deposit: z.coerce.number().min(0, "El depósito no puede ser negativo").optional(),
  totalAmount: z.coerce.number().min(0, "El total no puede ser negativo").optional(),
  paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  bookingStatus: z.enum(['draft', 'hold', 'pending_payment', 'confirmed', 'cancelled']).optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // If both startTime and endTime are provided, validate their order
  if (data.startTime && data.endTime) {
    return data.startTime < data.endTime;
  }
  return true;
}, {
  message: "La hora de fin debe ser posterior a la hora de inicio",
  path: ["endTime"],
});

// Types
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export type UpsertCustomerUser = z.infer<typeof upsertCustomerUserSchema>;
export type CustomerUser = typeof customerUsers.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertBoat = z.infer<typeof insertBoatSchema>;
export type Boat = typeof boats.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertBookingExtra = z.infer<typeof insertBookingExtraSchema>;
export type BookingExtra = typeof bookingExtras.$inferSelect;

// Booking status enums for type safety
export const BOOKING_STATUS = {
  DRAFT: 'draft',
  HOLD: 'hold',
  PENDING_PAYMENT: 'pending_payment', 
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const;

export const BOOKING_SOURCE = {
  WEB: 'web',
  ADMIN: 'admin'
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type BookingSource = typeof BOOKING_SOURCE[keyof typeof BOOKING_SOURCE];
