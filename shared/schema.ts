import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, completed, failed
  bookingStatus: text("booking_status").notNull().default("confirmed"), // confirmed, cancelled
  whatsappConfirmationSent: boolean("whatsapp_confirmation_sent").notNull().default(false),
  whatsappReminderSent: boolean("whatsapp_reminder_sent").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

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
  password: true,
});

export const insertBoatSchema = createInsertSchema(boats);

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  whatsappConfirmationSent: true,
  whatsappReminderSent: true,
}).extend({
  // Custom validation for booking form
  customerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  customerSurname: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  customerPhone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  customerEmail: z.string().email("Email inválido").optional(),
  numberOfPeople: z.number().min(1, "Debe ser al menos 1 persona"),
  totalHours: z.number().min(1, "Debe ser al menos 1 hora"),
});

export const insertBookingExtraSchema = createInsertSchema(bookingExtras).omit({
  id: true,
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
