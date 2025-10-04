import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, json, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const boats = pgTable("boats", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  requiresLicense: boolean("requires_license").notNull(),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }).notNull(),
  deposit: decimal("deposit", { precision: 10, scale: 2 }).notNull(),
  specifications: json("specifications"), // Engine, length, etc.
  equipment: json("equipment"), // Array of equipment items
  isActive: boolean("is_active").notNull().default(true),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
}));

// Note: booking_holds functionality unified into bookings table with 'hold' status

export const bookingExtras = pgTable("booking_extras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  extraName: text("extra_name").notNull(),
  extraPrice: decimal("extra_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  passwordHash: true,
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
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
