import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, serial, decimal, timestamp, date, boolean, json, jsonb, index, unique, uniqueIndex, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ===== TENANTS (Multi-tenant SaaS) =====

export const TENANT_PLANS = {
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type TenantPlan = typeof TENANT_PLANS[keyof typeof TENANT_PLANS];

export const TENANT_STATUSES = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
} as const;

export type TenantStatus = typeof TENANT_STATUSES[keyof typeof TENANT_STATUSES];

export interface TenantSettings {
  timezone: string;
  currency: string;
  languages: string[];
  seasonDates?: {
    low?: { start: string; end: string };
    mid?: { start: string; end: string };
    high?: { start: string; end: string };
  };
}

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  domain: text("domain"),
  logo: text("logo"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#0077B6"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#00B4D8"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  settings: jsonb("settings").$type<TenantSettings>().default({
    timezone: "Europe/Madrid",
    currency: "EUR",
    languages: ["es", "en"],
  }),
  plan: text("plan").notNull().default("starter"), // 'starter' | 'pro' | 'enterprise'
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("trial"), // 'trial' | 'active' | 'suspended' | 'cancelled'
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  slugIdx: index("tenants_slug_idx").on(table.slug),
  statusIdx: index("tenants_status_idx").on(table.status),
}));

export const insertTenantSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Solo letras minusculas, numeros y guiones"),
  domain: z.string().optional().or(z.null()),
  logo: z.string().optional().or(z.null()),
  primaryColor: z.string().max(7).optional(),
  secondaryColor: z.string().max(7).optional(),
  email: z.string().email().optional().or(z.null()),
  phone: z.string().optional().or(z.null()),
  address: z.string().optional().or(z.null()),
  settings: z.object({
    timezone: z.string(),
    currency: z.string(),
    languages: z.array(z.string()),
    seasonDates: z.object({
      low: z.object({ start: z.string(), end: z.string() }).optional(),
      mid: z.object({ start: z.string(), end: z.string() }).optional(),
      high: z.object({ start: z.string(), end: z.string() }).optional(),
    }).optional(),
  }).optional(),
  plan: z.enum(["starter", "pro", "enterprise"]).optional().default("starter"),
  status: z.enum(["trial", "active", "suspended", "cancelled"]).optional().default("trial"),
  trialEndsAt: z.coerce.date().optional().or(z.null()),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().optional().or(z.null()),
  logo: z.string().optional().or(z.null()),
  primaryColor: z.string().max(7).optional(),
  secondaryColor: z.string().max(7).optional(),
  email: z.string().email().optional().or(z.null()),
  phone: z.string().optional().or(z.null()),
  address: z.string().optional().or(z.null()),
  settings: z.object({
    timezone: z.string(),
    currency: z.string(),
    languages: z.array(z.string()),
    seasonDates: z.object({
      low: z.object({ start: z.string(), end: z.string() }).optional(),
      mid: z.object({ start: z.string(), end: z.string() }).optional(),
      high: z.object({ start: z.string(), end: z.string() }).optional(),
    }).optional(),
  }).optional(),
  plan: z.enum(["starter", "pro", "enterprise"]).optional(),
  stripeCustomerId: z.string().optional().or(z.null()),
  stripeSubscriptionId: z.string().optional().or(z.null()),
  status: z.enum(["trial", "active", "suspended", "cancelled"]).optional(),
  trialEndsAt: z.coerce.date().optional().or(z.null()),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type UpdateTenant = z.infer<typeof updateTenantSchema>;

// ===== USERS (Multi-tenant auth) =====

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("employee"), // 'owner' | 'admin' | 'employee'
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  emailTenantIdx: unique("users_email_tenant_idx").on(table.email, table.tenantId),
  tenantIdx: index("users_tenant_idx").on(table.tenantId),
}));

export const insertUserSchema = z.object({
  tenantId: z.string().min(1),
  email: z.string().email("Email invalido"),
  passwordHash: z.string().min(1),
  role: z.enum(["owner", "admin", "employee"]).optional().default("employee"),
  firstName: z.string().optional().or(z.null()),
  lastName: z.string().optional().or(z.null()),
  avatarUrl: z.string().optional().or(z.null()),
});

export const updateUserSchema = z.object({
  firstName: z.string().optional().or(z.null()),
  lastName: z.string().optional().or(z.null()),
  avatarUrl: z.string().optional().or(z.null()),
  role: z.enum(["owner", "admin", "employee"]).optional(),
  isActive: z.boolean().optional(),
});

export type SaasUser = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

// ===== REFRESH TOKENS =====

export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  userIdx: index("refresh_tokens_user_idx").on(table.userId),
  tokenIdx: index("refresh_tokens_token_idx").on(table.token),
  expiresIdx: index("refresh_tokens_expires_idx").on(table.expiresAt),
}));

export type RefreshToken = typeof refreshTokens.$inferSelect;

// ===== PASSWORD RESET TOKENS =====

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  tokenIdx: index("password_reset_token_idx").on(table.token),
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Admin users (existing system - for CRM access)
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("employee"), // 'admin' | 'employee'
  displayName: text("display_name"),
  pin: text("pin"), // bcrypt-hashed 6-digit PIN for CRM login
  allowedTabs: json("allowed_tabs").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
}, (table) => ({
  tenantIdx: index("admin_users_tenant_id_idx").on(table.tenantId),
}));

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
  tenantId: varchar("tenant_id").references(() => tenants.id),
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
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  requiresLicense: boolean("requires_license").notNull(),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }),
  deposit: decimal("deposit", { precision: 10, scale: 2 }).notNull(),
  displayOrder: integer("display_order").default(999),
  
  // Extended boat information
  imageUrl: text("image_url"), // Main boat image
  imageGallery: text("image_gallery").array(), // Additional images
  imageGalleryTablet: text("image_gallery_tablet").array(), // Tablet-optimized images
  imageGalleryMobile: text("image_gallery_mobile").array(), // Mobile-optimized images
  subtitle: text("subtitle"), // e.g., "¡Barco sin licencia para alquilar en Blanes!"
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

  // License type: none, navegacion, pnb, per, patron_yate, capitan_yate
  licenseType: text("license_type").default("none"),

  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  isActiveIdx: index("boats_is_active_idx").on(table.isActive),
  tenantIdx: index("boats_tenant_id_idx").on(table.tenantId),
}));

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
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
  bookingStatus: text("booking_status").notNull().default("draft"), // draft, hold, pending_payment, confirmed, cancelled, completed
  source: text("source").notNull().default("web"), // web, admin
  couponCode: text("coupon_code"), // Optional discount code
  refundStatus: text("refund_status"), // null, requested, processing, completed
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }), // Amount refunded if any
  sessionId: text("session_id"), // Browser session for holds
  expiresAt: timestamp("expires_at", { withTimezone: true }), // Expiration time for holds
  whatsappConfirmationSent: boolean("whatsapp_confirmation_sent").notNull().default(false),
  whatsappReminderSent: boolean("whatsapp_reminder_sent").notNull().default(false),
  emailReminderSent: boolean("email_reminder_sent").notNull().default(false),
  emailThankYouSent: boolean("email_thank_you_sent").notNull().default(false),
  whatsappThankYouSent: boolean("whatsapp_thank_you_sent").notNull().default(false),
  // Post-rental flywheel tracking
  reviewRequestSent: boolean("review_request_sent").notNull().default(false),
  referralCodeSent: boolean("referral_code_sent").notNull().default(false),
  earlyBirdOfferSent: boolean("early_bird_offer_sent").notNull().default(false),
  recoveryEmailSent: boolean("recovery_email_sent").notNull().default(false), // Abandoned booking recovery email
  notes: text("notes"),
  cancelationToken: text("cancelation_token").unique(), // UUID for cancel-without-login flow
  language: text("language").default("es"), // ISO 639-1: es, en, fr, de, nl, it, ru, ca
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
  tenantIdx: index("bookings_tenant_id_idx").on(table.tenantId),
}));

// Note: booking_holds functionality unified into bookings table with 'hold' status

export const bookingExtras = pgTable("booking_extras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  extraName: text("extra_name").notNull(),
  extraPrice: decimal("extra_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
}, (table) => ({
  bookingIdx: index("booking_extras_booking_idx").on(table.bookingId),
  tenantIdx: index("booking_extras_tenant_id_idx").on(table.tenantId),
}));

// Page visits analytics
export const pageVisits = pgTable("page_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  pagePath: text("page_path").notNull(),
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
  tenantIdx: index("page_visits_tenant_id_idx").on(table.tenantId),
}));

// Zod schemas for validation
export const insertAdminUserSchema = createInsertSchema(adminUsers).pick({
  username: true,
  passwordHash: true,
  role: true,
  displayName: true,
  pin: true,
  allowedTabs: true,
});

export const ASSIGNABLE_TABS = [
  "dashboard", "calendar", "bookings", "customers", "inquiries",
  "fleet", "maintenance", "inventory", "reports", "gallery",
  "blog", "giftcards", "discounts", "analytics",
] as const;

export type AssignableTab = typeof ASSIGNABLE_TABS[number];

export const upsertCustomerUserSchema = createInsertSchema(customerUsers);
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBoatSchema = createInsertSchema(boats);

// Update boat schema for PATCH requests with proper JSON validation
export const updateBoatSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.coerce.number().min(1).optional(),
  requiresLicense: z.coerce.boolean().optional(),
  licenseType: z.enum(["none", "navegacion", "pnb", "per", "patron_yate", "capitan_yate"]).optional(),
  deposit: z.string().optional(),
  displayOrder: z.number().nullable().optional(),
  isActive: z.coerce.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
  imageGallery: z.array(z.string()).nullable().optional(),
  imageGalleryTablet: z.array(z.string()).nullable().optional(),
  imageGalleryMobile: z.array(z.string()).nullable().optional(),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  specifications: z.object({
    model: z.string().default(""),
    length: z.string().default(""),
    beam: z.string().default(""),
    engine: z.string().default(""),
    fuel: z.string().default(""),
    capacity: z.string().default(""),
    deposit: z.string().default(""),
  }).nullable().optional(),
  equipment: z.array(z.string()).nullable().optional(),
  included: z.array(z.string()).nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
  pricing: z.object({
    BAJA: z.object({ period: z.string(), prices: z.record(z.number()) }),
    MEDIA: z.object({ period: z.string(), prices: z.record(z.number()) }),
    ALTA: z.object({ period: z.string(), prices: z.record(z.number()) }),
  }).nullable().optional(),
  extras: z.array(z.object({
    name: z.string(),
    price: z.string(),
    icon: z.string().default(""),
  })).nullable().optional(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  whatsappConfirmationSent: true,
  whatsappReminderSent: true,
  emailReminderSent: true,
  emailThankYouSent: true,
  whatsappThankYouSent: true,
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
  bookingStatus: z.enum(['draft', 'hold', 'pending_payment', 'confirmed', 'cancelled', 'completed']),
  source: z.enum(['web', 'admin']),
  language: z.string().max(5).optional(),
  cancelationToken: z.string().uuid().optional(),
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
  bookingStatus: z.enum(['draft', 'hold', 'pending_payment', 'confirmed', 'cancelled', 'completed']).optional(),
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
export type UpdateBoat = z.infer<typeof updateBoatSchema>;
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
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
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

// Testimonials table for customer reviews
export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  customerName: varchar("customer_name").notNull(),
  boatId: varchar("boat_id").references(() => boats.id),
  boatName: varchar("boat_name"), // Denormalized for display even if boat deleted
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull().default(sql`now()`),
  isVerified: boolean("is_verified").notNull().default(false), // Admin verification
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Insert schemas
export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
  isVerified: true, // Prevent users from self-verifying - must be done by admin
}).extend({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, "El comentario debe tener al menos 10 caracteres").max(5000),
});

// Types
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

// Blog Posts table for SEO content
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"), // Short summary for cards
  content: text("content").notNull(), // Full article content (supports Markdown)
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Guías", "Destinos", "Consejos"
  author: varchar("author", { length: 255 }).notNull().default("Costa Brava Rent a Boat"),
  featuredImage: text("featured_image"), // Main article image URL
  metaDescription: varchar("meta_description", { length: 160 }), // SEO description
  tags: text("tags").array(), // SEO tags/keywords
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  // Multi-language support (autopilot)
  titleByLang: jsonb("title_by_lang").$type<Record<string, string>>(),
  contentByLang: jsonb("content_by_lang").$type<Record<string, string>>(),
  excerptByLang: jsonb("excerpt_by_lang").$type<Record<string, string>>(),
  metaDescByLang: jsonb("meta_desc_by_lang").$type<Record<string, string>>(),
  featuredImageAltByLang: jsonb("featured_image_alt_by_lang").$type<Record<string, string>>(),
  // Autopilot metadata
  clusterId: varchar("cluster_id"),
  isAutoGenerated: boolean("is_auto_generated").notNull().default(false),
  seoScore: integer("seo_score"),
}, (table) => ({
  publishedAtIdx: index("blog_published_idx").on(table.publishedAt),
  categoryIdx: index("blog_posts_category_idx").on(table.category),
  tenantIdx: index("blog_posts_tenant_id_idx").on(table.tenantId),
}));

// Destinations landing pages for SEO
export const destinations = pgTable("destinations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Cala Bona"
  slug: varchar("slug", { length: 255 }).notNull().unique(), // e.g., "cala-bona"
  description: text("description").notNull(), // Short intro
  content: text("content").notNull(), // Full page content (supports Markdown)
  coordinates: json("coordinates").$type<{ lat: number; lng: number }>(), // GPS coordinates
  featuredImage: text("featured_image"), // Main destination image
  imageGallery: text("image_gallery").array(), // Additional images
  metaDescription: varchar("meta_description", { length: 160 }), // SEO description
  nearbyAttractions: text("nearby_attractions").array(), // List of nearby points of interest
  distanceFromPort: varchar("distance_from_port", { length: 100 }), // e.g., "2.5 km"
  recommendedBoats: text("recommended_boats").array(), // Boat IDs that work well for this destination
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  tenantIdx: index("destinations_tenant_id_idx").on(table.tenantId),
}));

// Insert schemas for blog and destinations
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(10, "El título debe tener al menos 10 caracteres").max(255),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/, "El slug debe contener solo letras minúsculas, números y guiones"),
  content: z.string().min(100, "El contenido debe tener al menos 100 caracteres"),
  category: z.string().min(1, "La categoría es obligatoria"),
  metaDescription: z.string().max(160).optional(),
});

export const insertDestinationSchema = createInsertSchema(destinations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/, "El slug debe contener solo letras minúsculas, números y guiones"),
  description: z.string().min(50, "La descripción debe tener al menos 50 caracteres"),
  content: z.string().min(100, "El contenido debe tener al menos 100 caracteres"),
  metaDescription: z.string().max(160).optional(),
});

// Types
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = z.infer<typeof insertDestinationSchema>;

// Client Photos (gallery)
export const clientPhotos = pgTable("client_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  boatName: varchar("boat_name", { length: 255 }),
  boatId: varchar("boat_id").references(() => boats.id),
  tripDate: timestamp("trip_date", { withTimezone: true }),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
}, (table) => ({
  tenantIdx: index("client_photos_tenant_id_idx").on(table.tenantId),
}));

export const insertClientPhotoSchema = createInsertSchema(clientPhotos).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  isApproved: true,
});

export type ClientPhoto = typeof clientPhotos.$inferSelect;
export type InsertClientPhoto = z.infer<typeof insertClientPhotoSchema>;

// ===== GIFT CARDS =====

export const giftCards = pgTable("gift_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  code: varchar("code", { length: 20 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  purchaserName: text("purchaser_name").notNull(),
  purchaserEmail: text("purchaser_email").notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  personalMessage: text("personal_message"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, completed, failed
  status: text("status").notNull().default("pending"), // pending, active, used, expired, cancelled
  usedBookingId: varchar("used_booking_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  tenantIdx: index("gift_cards_tenant_id_idx").on(table.tenantId),
}));

export const insertGiftCardSchema = createInsertSchema(giftCards).omit({
  id: true,
  createdAt: true,
});

export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;

// ===== DISCOUNT CODES =====

export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  code: varchar("code", { length: 30 }).notNull().unique(),
  discountPercent: integer("discount_percent").notNull(), // e.g., 10 for 10%
  maxUses: integer("max_uses").notNull().default(1),
  currentUses: integer("current_uses").notNull().default(0),
  customerEmail: text("customer_email"), // null = universal, set = specific customer
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  tenantIdx: index("discount_codes_tenant_id_idx").on(table.tenantId),
}));

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({
  id: true,
  createdAt: true,
  currentUses: true,
});

export const selectDiscountCodeSchema = createSelectSchema(discountCodes);

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;

// ===== WHATSAPP CHATBOT =====

// Conversation states for the chatbot flow
export const CHATBOT_STATES = {
  WELCOME: 'welcome',
  MAIN_MENU: 'main_menu',
  LIST_BOATS: 'list_boats',
  BOAT_DETAIL: 'boat_detail',
  CHECK_AVAILABILITY: 'check_availability',
  SELECT_BOAT_FOR_CHECK: 'select_boat_for_check',
  SHOW_AVAILABILITY: 'show_availability',
  SHOW_PRICES: 'show_prices',
  START_BOOKING: 'start_booking',
  BOOKING_DATE: 'booking_date',
  BOOKING_BOAT: 'booking_boat',
  BOOKING_TIME: 'booking_time',
  BOOKING_DURATION: 'booking_duration',
  BOOKING_PEOPLE: 'booking_people',
  BOOKING_EXTRAS: 'booking_extras',
  BOOKING_CONTACT_NAME: 'booking_contact_name',
  BOOKING_CONTACT_EMAIL: 'booking_contact_email',
  BOOKING_CONFIRM: 'booking_confirm',
  BOOKING_PAYMENT: 'booking_payment',
  AGENT_HANDOFF: 'agent_handoff',
} as const;

export type ChatbotState = typeof CHATBOT_STATES[keyof typeof CHATBOT_STATES];

// WhatsApp Chatbot Conversations table
export const chatbotConversations = pgTable("chatbot_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  currentState: varchar("current_state", { length: 50 }).notNull().default('welcome'),
  language: varchar("language", { length: 5 }).notNull().default('es'),
  context: jsonb("context").default({}), // Additional context data

  // Booking flow data (stored during conversation)
  selectedBoatId: varchar("selected_boat_id", { length: 50 }),
  selectedDate: timestamp("selected_date", { withTimezone: true }),
  selectedStartTime: varchar("selected_start_time", { length: 10 }), // "10:00"
  selectedDuration: varchar("selected_duration", { length: 10 }), // "2h", "4h", etc.
  selectedExtras: text("selected_extras").array(),
  customerName: varchar("customer_name", { length: 100 }),
  customerEmail: varchar("customer_email", { length: 100 }),
  numberOfPeople: integer("number_of_people"),

  // Tracking
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().default(sql`now()`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  messagesCount: integer("messages_count").notNull().default(0),

  // Reference to created booking (if any)
  createdBookingId: varchar("created_booking_id").references(() => bookings.id),
}, (table) => ({
  phoneIdx: index("chatbot_phone_idx").on(table.phoneNumber),
  stateIdx: index("chatbot_state_idx").on(table.currentState),
  lastMessageIdx: index("chatbot_last_message_idx").on(table.lastMessageAt),
}));

// Insert schema for chatbot conversations
export const insertChatbotConversationSchema = createInsertSchema(chatbotConversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
  messagesCount: true,
});

export const updateChatbotConversationSchema = createInsertSchema(chatbotConversations).partial().omit({
  id: true,
  createdAt: true,
  phoneNumber: true, // Phone number should not be changed
});

// Types
export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = z.infer<typeof insertChatbotConversationSchema>;
export type UpdateChatbotConversation = z.infer<typeof updateChatbotConversationSchema>;

// ===== AI CHATBOT ENHANCED TABLES =====

// AI Chat Sessions - Persistent conversation sessions
export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  language: varchar("language", { length: 5 }).notNull().default('es'),
  
  // Session metadata
  profileName: varchar("profile_name", { length: 100 }),
  totalMessages: integer("total_messages").notNull().default(0),
  
  // Lead scoring
  intentScore: integer("intent_score").notNull().default(0), // 0-100 purchase intent
  isLead: boolean("is_lead").notNull().default(false),
  leadQuality: varchar("lead_quality", { length: 20 }), // 'hot', 'warm', 'cold'
  
  // Analytics
  topicsDiscussed: text("topics_discussed").array(),
  boatsViewed: text("boats_viewed").array(),
  
  // Timestamps
  firstMessageAt: timestamp("first_message_at", { withTimezone: true }).notNull().default(sql`now()`),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().default(sql`now()`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  phoneIdx: index("ai_chat_phone_idx").on(table.phoneNumber),
  leadIdx: index("ai_chat_lead_idx").on(table.isLead, table.intentScore),
  lastMsgIdx: index("ai_chat_last_msg_idx").on(table.lastMessageAt),
}));

// AI Chat Messages - Individual messages with metadata
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  sessionId: varchar("session_id").notNull().references(() => aiChatSessions.id, { onDelete: "cascade" }),
  
  // Message content
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  
  // AI analysis
  detectedIntent: varchar("detected_intent", { length: 50 }), // 'price_inquiry', 'availability', 'booking', etc.
  detectedBoatId: varchar("detected_boat_id", { length: 50 }),
  sentiment: varchar("sentiment", { length: 20 }), // 'positive', 'neutral', 'negative'
  
  // Token usage
  tokensUsed: integer("tokens_used"),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  sessionIdx: index("ai_msg_session_idx").on(table.sessionId),
  intentIdx: index("ai_msg_intent_idx").on(table.detectedIntent),
  createdIdx: index("ai_msg_created_idx").on(table.createdAt),
}));

// Knowledge Base - For RAG with embeddings
export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),

  // Content
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'faq', 'policy', 'route', 'boat_info', 'general'
  language: varchar("language", { length: 5 }).notNull().default('es'),
  
  // Embeddings for semantic search (stored as JSON array of floats)
  embedding: json("embedding").$type<number[]>(),
  
  // Metadata
  keywords: text("keywords").array(),
  priority: integer("priority").notNull().default(0), // Higher = more important
  isActive: boolean("is_active").notNull().default(true),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  categoryIdx: index("kb_category_idx").on(table.category),
  languageIdx: index("kb_language_idx").on(table.language),
  activeIdx: index("kb_active_idx").on(table.isActive),
}));

// Insert schemas
export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions).omit({
  id: true,
  createdAt: true,
  firstMessageAt: true,
  lastMessageAt: true,
  totalMessages: true,
});

export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type InsertAiChatSession = z.infer<typeof insertAiChatSessionSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type KnowledgeBaseEntry = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBaseEntry = z.infer<typeof insertKnowledgeBaseSchema>;

// ===== CRM CUSTOMERS (derived from bookings, managed by admin) =====

export const CUSTOMER_SEGMENTS = {
  NEW: 'new',
  RETURNING: 'returning',
  VIP: 'vip',
} as const;

export type CustomerSegment = typeof CUSTOMER_SEGMENTS[keyof typeof CUSTOMER_SEGMENTS];

export const crmCustomers = pgTable("crm_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  nationality: text("nationality"),
  documentId: text("document_id"),
  notes: text("notes"),
  segment: text("segment").notNull().default("new"), // 'new' | 'returning' | 'vip'
  tags: text("tags").array(),
  totalBookings: integer("total_bookings").notNull().default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull().default("0"),
  firstBookingDate: timestamp("first_booking_date", { withTimezone: true }),
  lastBookingDate: timestamp("last_booking_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  emailIdx: index("crm_customers_email_idx").on(table.email),
  phoneIdx: index("crm_customers_phone_idx").on(table.phone),
  segmentIdx: index("crm_customers_segment_idx").on(table.segment),
  nameIdx: index("crm_customers_name_idx").on(table.name, table.surname),
  tenantPhoneIdx: uniqueIndex("crm_customer_tenant_phone_idx").on(table.tenantId, table.phone),
  tenantIdx: index("crm_customers_tenant_id_idx").on(table.tenantId),
}));

export const insertCrmCustomerSchema = createInsertSchema(crmCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalBookings: true,
  totalSpent: true,
  firstBookingDate: true,
  lastBookingDate: true,
});

export const updateCrmCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  surname: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  phone: z.string().min(1).optional(),
  nationality: z.string().optional().or(z.null()),
  documentId: z.string().optional().or(z.null()),
  notes: z.string().optional().or(z.null()),
  segment: z.enum(["new", "returning", "vip"]).optional(),
  tags: z.array(z.string()).optional().or(z.null()),
});

export type CrmCustomer = typeof crmCustomers.$inferSelect;
export type InsertCrmCustomer = z.infer<typeof insertCrmCustomerSchema>;
export type UpdateCrmCustomer = z.infer<typeof updateCrmCustomerSchema>;

// ===== CHECK-IN / CHECK-OUT =====

export const CHECKIN_TYPES = {
  CHECKIN: 'checkin',
  CHECKOUT: 'checkout',
} as const;

export type CheckinType = typeof CHECKIN_TYPES[keyof typeof CHECKIN_TYPES];

export const FUEL_LEVELS = ['full', '3/4', '1/2', '1/4', 'empty'] as const;
export type FuelLevel = typeof FUEL_LEVELS[number];

export const CONDITION_LEVELS = ['excellent', 'good', 'fair', 'poor'] as const;
export type ConditionLevel = typeof CONDITION_LEVELS[number];

export interface ChecklistItem {
  item: string;
  checked: boolean;
}

export const checkins = pgTable("checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  boatId: varchar("boat_id").notNull().references(() => boats.id),
  type: text("type").notNull(), // 'checkin' | 'checkout'
  performedAt: timestamp("performed_at", { withTimezone: true }).notNull().default(sql`now()`),
  performedBy: text("performed_by"), // admin user name or ID
  fuelLevel: text("fuel_level").notNull(), // 'full' | '3/4' | '1/2' | '1/4' | 'empty'
  condition: text("condition").notNull(), // 'excellent' | 'good' | 'fair' | 'poor'
  engineHours: decimal("engine_hours", { precision: 10, scale: 1 }),
  notes: text("notes"),
  photos: text("photos").array(),
  signatureUrl: text("signature_url"), // data URL of signature image
  checklist: jsonb("checklist").$type<ChecklistItem[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  bookingIdx: index("checkins_booking_idx").on(table.bookingId),
  boatIdx: index("checkins_boat_idx").on(table.boatId),
  typeIdx: index("checkins_type_idx").on(table.type),
}));

export const insertCheckinSchema = z.object({
  bookingId: z.string().min(1, "Reserva requerida"),
  boatId: z.string().min(1, "Barco requerido"),
  type: z.enum(["checkin", "checkout"]),
  performedBy: z.string().optional(),
  fuelLevel: z.enum(["full", "3/4", "1/2", "1/4", "empty"]),
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  engineHours: z.string().optional().or(z.null()),
  notes: z.string().optional().or(z.null()),
  photos: z.array(z.string()).optional().or(z.null()),
  signatureUrl: z.string().optional().or(z.null()),
  checklist: z.array(z.object({
    item: z.string(),
    checked: z.boolean(),
  })).optional().or(z.null()),
});

export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;

// ===== MAINTENANCE LOGS =====

export const MAINTENANCE_TYPES = {
  PREVENTIVE: 'preventive',
  CORRECTIVE: 'corrective',
  INSPECTION: 'inspection',
} as const;

export type MaintenanceType = typeof MAINTENANCE_TYPES[keyof typeof MAINTENANCE_TYPES];

export const MAINTENANCE_STATUSES = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type MaintenanceStatus = typeof MAINTENANCE_STATUSES[keyof typeof MAINTENANCE_STATUSES];

export const maintenanceLogs = pgTable("maintenance_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  boatId: varchar("boat_id").notNull().references(() => boats.id),
  type: text("type").notNull(), // 'preventive' | 'corrective' | 'inspection'
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  nextDueDate: timestamp("next_due_date", { withTimezone: true }),
  status: text("status").notNull().default("scheduled"), // 'scheduled' | 'in_progress' | 'completed'
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  boatIdx: index("maintenance_boat_idx").on(table.boatId),
  statusIdx: index("maintenance_status_idx").on(table.status),
  dateIdx: index("maintenance_date_idx").on(table.date),
  nextDueIdx: index("maintenance_next_due_idx").on(table.nextDueDate),
}));

export const insertMaintenanceLogSchema = z.object({
  boatId: z.string().min(1, "Barco requerido"),
  type: z.enum(["preventive", "corrective", "inspection"]),
  description: z.string().min(3, "Descripcion requerida"),
  cost: z.string().optional().or(z.null()),
  date: z.coerce.date(),
  nextDueDate: z.coerce.date().optional().or(z.null()),
  status: z.enum(["scheduled", "in_progress", "completed"]).optional().default("scheduled"),
  notes: z.string().optional().or(z.null()),
  createdBy: z.string().optional().or(z.null()),
});

export const updateMaintenanceLogSchema = z.object({
  type: z.enum(["preventive", "corrective", "inspection"]).optional(),
  description: z.string().min(3).optional(),
  cost: z.string().optional().or(z.null()),
  date: z.coerce.date().optional(),
  nextDueDate: z.coerce.date().optional().or(z.null()),
  status: z.enum(["scheduled", "in_progress", "completed"]).optional(),
  notes: z.string().optional().or(z.null()),
});

export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type InsertMaintenanceLog = z.infer<typeof insertMaintenanceLogSchema>;
export type UpdateMaintenanceLog = z.infer<typeof updateMaintenanceLogSchema>;

// ===== BOAT DOCUMENTS =====

export const DOCUMENT_TYPES = {
  REGISTRATION: 'registration',
  INSURANCE: 'insurance',
  INSPECTION: 'inspection',
  LICENSE: 'license',
  OTHER: 'other',
} as const;

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];

export const boatDocuments = pgTable("boat_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  boatId: varchar("boat_id").notNull().references(() => boats.id),
  type: text("type").notNull(), // 'registration' | 'insurance' | 'inspection' | 'license' | 'other'
  name: text("name").notNull(),
  fileUrl: text("file_url"),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  boatIdx: index("boat_docs_boat_idx").on(table.boatId),
  typeIdx: index("boat_docs_type_idx").on(table.type),
  expiryIdx: index("boat_docs_expiry_idx").on(table.expiryDate),
}));

export const insertBoatDocumentSchema = z.object({
  boatId: z.string().min(1, "Barco requerido"),
  type: z.enum(["registration", "insurance", "inspection", "license", "other"]),
  name: z.string().min(1, "Nombre requerido"),
  fileUrl: z.string().optional().or(z.null()),
  expiryDate: z.coerce.date().optional().or(z.null()),
  notes: z.string().optional().or(z.null()),
});

export const updateBoatDocumentSchema = z.object({
  type: z.enum(["registration", "insurance", "inspection", "license", "other"]).optional(),
  name: z.string().min(1).optional(),
  fileUrl: z.string().optional().or(z.null()),
  expiryDate: z.coerce.date().optional().or(z.null()),
  notes: z.string().optional().or(z.null()),
});

export type BoatDocument = typeof boatDocuments.$inferSelect;
export type InsertBoatDocument = z.infer<typeof insertBoatDocumentSchema>;
export type UpdateBoatDocument = z.infer<typeof updateBoatDocumentSchema>;

// ===== INVENTORY =====

export const INVENTORY_STATUSES = {
  AVAILABLE: 'available',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

export type InventoryStatus = typeof INVENTORY_STATUSES[keyof typeof INVENTORY_STATUSES];

export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // e.g., 'water_sports', 'safety', 'comfort', 'navigation'
  totalStock: integer("total_stock").notNull().default(0),
  availableStock: integer("available_stock").notNull().default(0),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("available"), // 'available' | 'low_stock' | 'out_of_stock'
  minStockAlert: integer("min_stock_alert").notNull().default(1),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  categoryIdx: index("inventory_category_idx").on(table.category),
  statusIdx: index("inventory_status_idx").on(table.status),
  nameIdx: index("inventory_item_name_idx").on(table.name),
  tenantIdx: index("inventory_items_tenant_id_idx").on(table.tenantId),
}));

export const insertInventoryItemSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional().or(z.null()),
  category: z.string().min(1, "Categoria requerida"),
  totalStock: z.coerce.number().int().min(0).optional().default(0),
  availableStock: z.coerce.number().int().min(0).optional().default(0),
  pricePerUnit: z.string().optional().or(z.null()),
  minStockAlert: z.coerce.number().int().min(0).optional().default(1),
  imageUrl: z.string().optional().or(z.null()),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().or(z.null()),
  category: z.string().min(1).optional(),
  totalStock: z.coerce.number().int().min(0).optional(),
  availableStock: z.coerce.number().int().min(0).optional(),
  pricePerUnit: z.string().optional().or(z.null()),
  minStockAlert: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional().or(z.null()),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type UpdateInventoryItem = z.infer<typeof updateInventoryItemSchema>;

// ===== INVENTORY MOVEMENTS =====

export const MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out',
  ADJUSTMENT: 'adjustment',
} as const;

export type MovementType = typeof MOVEMENT_TYPES[keyof typeof MOVEMENT_TYPES];

export const inventoryMovements = pgTable("inventory_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  itemId: varchar("item_id").notNull().references(() => inventoryItems.id),
  type: text("type").notNull(), // 'in' | 'out' | 'adjustment'
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  bookingId: varchar("booking_id").references(() => bookings.id),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  itemIdx: index("movements_item_idx").on(table.itemId),
  typeIdx: index("movements_type_idx").on(table.type),
  bookingIdx: index("movements_booking_idx").on(table.bookingId),
  createdIdx: index("movements_created_idx").on(table.createdAt),
  tenantIdx: index("inventory_movements_tenant_id_idx").on(table.tenantId),
}));

export const insertInventoryMovementSchema = z.object({
  itemId: z.string().min(1, "Item requerido"),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.coerce.number().int().min(1, "Cantidad minima 1"),
  reason: z.string().optional().or(z.null()),
  bookingId: z.string().optional().or(z.null()),
  createdBy: z.string().optional().or(z.null()),
});

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;

// Re-export chat models for AI integrations
// ===== BLOG AUTOPILOT TABLES =====

// Topical clusters for SEO content strategy
export const blogClusters = pgTable("blog_clusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  pillarPostId: varchar("pillar_post_id"),
  keywords: text("keywords").array(),
  plannedTopics: jsonb("planned_topics").$type<Array<{ topic: string; type: string }>>(),
  completedCount: integer("completed_count").notNull().default(0),
  isComplete: boolean("is_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Autopilot configuration (singleton row)
export const blogAutopilotConfig = pgTable("blog_autopilot_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isEnabled: boolean("is_enabled").notNull().default(true),
  cronSchedule: varchar("cron_schedule", { length: 50 }).notNull().default("0 9 * * 1,3,5"),
  model: varchar("model", { length: 100 }).notNull().default("claude-sonnet-4-6"),
  languages: text("languages").array().notNull().default(sql`ARRAY['es','en','fr','de','it','nl','ru','ca']`),
  maxPostsPerWeek: integer("max_posts_per_week").notNull().default(3),
  seasonStartMonth: integer("season_start_month").notNull().default(2),
  seasonEndMonth: integer("season_end_month").notNull().default(9),
  publishDelayHours: integer("publish_delay_hours").notNull().default(24),
  minSeoScore: integer("min_seo_score").notNull().default(90),
  refreshRatio: integer("refresh_ratio").notNull().default(4),
  unsplashEnabled: boolean("unsplash_enabled").notNull().default(true),
  useWhatsappTopics: boolean("use_whatsapp_topics").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Execution log for autopilot runs
export const blogAutopilotLog = pgTable("blog_autopilot_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id"),
  type: varchar("type", { length: 20 }).notNull().default("new"),
  topicChosen: text("topic_chosen"),
  clusterName: varchar("cluster_name", { length: 255 }),
  keywordsUsed: text("keywords_used").array(),
  modelUsed: varchar("model_used", { length: 100 }),
  tokensInput: integer("tokens_input"),
  tokensOutput: integer("tokens_output"),
  seoScore: integer("seo_score"),
  status: varchar("status", { length: 20 }).notNull().default("success"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Queue of planned topics for upcoming generation
export const blogAutopilotQueue = pgTable("blog_autopilot_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clusterId: varchar("cluster_id"),
  topic: text("topic").notNull(),
  keywords: text("keywords").array(),
  type: varchar("type", { length: 20 }).notNull().default("satellite"),
  priority: integer("priority").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("planned"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  postId: varchar("post_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Types
export type BlogCluster = typeof blogClusters.$inferSelect;
export type BlogAutopilotConfig = typeof blogAutopilotConfig.$inferSelect;
export type BlogAutopilotLog = typeof blogAutopilotLog.$inferSelect;
export type BlogAutopilotQueue = typeof blogAutopilotQueue.$inferSelect;

export { conversations, messages } from "@shared/models/chat";

// Newsletter subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  language: text("language").default("es"),
  source: text("source").default("footer"), // 'footer' | 'popup'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  isActive: boolean("is_active").notNull().default(true),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// ===== WHATSAPP BOOKING INQUIRIES =====

export const INQUIRY_STATUSES = {
  PENDING: 'pending',
  CONTACTED: 'contacted',
  CONVERTED: 'converted',
  LOST: 'lost',
} as const;

export type InquiryStatus = typeof INQUIRY_STATUSES[keyof typeof INQUIRY_STATUSES];

export const whatsappInquiries = pgTable("whatsapp_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  boatId: varchar("boat_id").notNull(),
  boatName: text("boat_name").notNull(),
  bookingDate: text("booking_date").notNull(),
  preferredTime: text("preferred_time"),
  duration: text("duration").notNull(),
  numberOfPeople: integer("number_of_people").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phonePrefix: text("phone_prefix").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  extras: jsonb("extras").$type<string[]>().default([]),
  packId: text("pack_id"),
  couponCode: text("coupon_code"),
  estimatedTotal: decimal("estimated_total", { precision: 10, scale: 2 }),
  language: text("language").default("es"),
  source: text("source").default("desktop"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  statusIdx: index("inquiry_status_idx").on(table.status),
  createdAtIdx: index("inquiry_created_at_idx").on(table.createdAt),
  phoneIdx: index("inquiry_phone_idx").on(table.phoneNumber),
  emailIdx: index("inquiry_email_idx").on(table.email),
  tenantIdx: index("whatsapp_inquiries_tenant_id_idx").on(table.tenantId),
}));

export const insertWhatsappInquirySchema = createInsertSchema(whatsappInquiries).omit({
  id: true,
  createdAt: true,
}).extend({
  notes: z.string().max(5000).optional().or(z.null()),
});

export const updateWhatsappInquirySchema = z.object({
  status: z.enum(["pending", "contacted", "converted", "lost"]).optional(),
  notes: z.string().max(5000).optional().or(z.null()),
});

export type WhatsappInquiry = typeof whatsappInquiries.$inferSelect;
export type InsertWhatsappInquiry = z.infer<typeof insertWhatsappInquirySchema>;
export type UpdateWhatsappInquiry = z.infer<typeof updateWhatsappInquirySchema>;

// Admin sessions (persisted across server restarts)
export const adminSessions = pgTable("admin_sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// Company configuration (single-row, replaces SaaS tenant settings for legacy admin)
export const companyConfig = pgTable("company_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  logo: text("logo"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#2B3E50"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#A8C4DD"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export type CompanyConfig = typeof companyConfig.$inferSelect;

// Token blacklist (logged out before expiry)
export const tokenBlacklist = pgTable("token_blacklist", {
  token: text("token").primaryKey(),
  blacklistedAt: timestamp("blacklisted_at", { withTimezone: true }).notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// ===== AUDIT LOG =====
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  username: varchar("username"),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("audit_logs_user_id_idx").on(table.userId),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ===== ANALYTICS SNAPSHOTS (Google Analytics / Search Console cache) =====

export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  source: text("source").notNull(),
  metricType: text("metric_type").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  uniqueSnapshot: unique("analytics_snapshot_unique").on(table.date, table.source, table.metricType),
}));

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;

// ============================================================
// SEO ENGINE TABLES

export const seoKeywords = pgTable("seo_keywords", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  language: varchar("language", { length: 5 }).notNull(),
  volume: integer("volume"),
  intent: text("intent"),
  cluster: text("cluster"),
  tracked: boolean("tracked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  uniqueIndex("seo_keywords_keyword_language_idx").on(table.keyword, table.language),
]);

export const seoRankings = pgTable("seo_rankings", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").notNull(),
  date: date("date").notNull(),
  position: decimal("position", { precision: 5, scale: 2 }),
  clicks: integer("clicks"),
  impressions: integer("impressions"),
  ctr: decimal("ctr", { precision: 5, scale: 4 }),
  page: text("page"),
  device: text("device"),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  uniqueIndex("seo_rankings_keyword_date_device_source_idx").on(table.keywordId, table.date, table.device, table.source),
  index("seo_rankings_keyword_id_idx").on(table.keywordId),
  index("seo_rankings_date_idx").on(table.date),
]);

export const seoPages = pgTable("seo_pages", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().unique(),
  title: text("title"),
  description: text("description"),
  wordCount: integer("word_count"),
  lastCrawled: timestamp("last_crawled", { withTimezone: true }),
  lastModified: timestamp("last_modified", { withTimezone: true }),
  status: integer("status"),
  loadTimeMs: integer("load_time_ms"),
  hasSchemaOrg: boolean("has_schema_org").notNull().default(false),
  schemaTypes: text("schema_types"),
  internalLinksIn: integer("internal_links_in"),
  internalLinksOut: integer("internal_links_out"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("seo_pages_path_idx").on(table.path),
]);

export const seoCompetitors = pgTable("seo_competitors", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull().unique(),
  name: text("name"),
  type: text("type"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const seoCompetitorRankings = pgTable("seo_competitor_rankings", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitor_id").notNull(),
  keywordId: integer("keyword_id").notNull(),
  date: date("date").notNull(),
  position: decimal("position", { precision: 5, scale: 2 }),
  url: text("url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  uniqueIndex("seo_competitor_rankings_comp_kw_date_idx").on(table.competitorId, table.keywordId, table.date),
  index("seo_competitor_rankings_competitor_id_idx").on(table.competitorId),
  index("seo_competitor_rankings_keyword_id_idx").on(table.keywordId),
]);

export const seoSerpFeatures = pgTable("seo_serp_features", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").notNull(),
  date: date("date").notNull(),
  features: jsonb("features"),
  ownsFaq: boolean("owns_faq").notNull().default(false),
  ownsLocalPack: boolean("owns_local_pack").notNull().default(false),
  ownsImages: boolean("owns_images").notNull().default(false),
  ownsAiOverview: boolean("owns_ai_overview").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  uniqueIndex("seo_serp_features_keyword_date_idx").on(table.keywordId, table.date),
  index("seo_serp_features_keyword_id_idx").on(table.keywordId),
]);

export const seoCampaigns = pgTable("seo_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  objective: text("objective"),
  cluster: text("cluster"),
  status: text("status"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  weeklyActionBudget: integer("weekly_action_budget"),
  progress: jsonb("progress"),
  results: jsonb("results"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const seoExperiments = pgTable("seo_experiments", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id"),
  type: text("type"),
  page: text("page"),
  hypothesis: text("hypothesis"),
  action: text("action"),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  status: text("status"),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  measureAt: timestamp("measure_at", { withTimezone: true }),
  baselineMetrics: jsonb("baseline_metrics"),
  resultMetrics: jsonb("result_metrics"),
  learning: text("learning"),
  agentReasoning: text("agent_reasoning"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("seo_experiments_campaign_id_idx").on(table.campaignId),
  index("seo_experiments_status_idx").on(table.status),
]);

export const seoConversions = pgTable("seo_conversions", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id"),
  page: text("page"),
  bookingId: integer("booking_id"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }),
  date: date("date"),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("seo_conversions_keyword_id_idx").on(table.keywordId),
  index("seo_conversions_date_idx").on(table.date),
]);

export const seoLearnings = pgTable("seo_learnings", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id"),
  category: text("category"),
  insight: text("insight").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  applicableTo: text("applicable_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("seo_learnings_experiment_id_idx").on(table.experimentId),
  index("seo_learnings_category_idx").on(table.category),
]);

export const seoMeta = pgTable("seo_meta", {
  id: serial("id").primaryKey(),
  page: text("page").notNull(),
  language: varchar("language", { length: 5 }).notNull(),
  title: text("title"),
  description: text("description"),
  keywords: text("keywords"),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  uniqueIndex("seo_meta_page_language_idx").on(table.page, table.language),
]);

export const seoFaqs = pgTable("seo_faqs", {
  id: serial("id").primaryKey(),
  page: text("page").notNull(),
  language: varchar("language", { length: 5 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("seo_faqs_page_language_idx").on(table.page, table.language),
]);

export const seoLinks = pgTable("seo_links", {
  id: serial("id").primaryKey(),
  fromPage: text("from_page").notNull(),
  toPage: text("to_page").notNull(),
  anchorText: text("anchor_text").notNull(),
  context: text("context"),
  autoGenerated: boolean("auto_generated").notNull().default(false),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  uniqueIndex("seo_links_from_to_anchor_idx").on(table.fromPage, table.toPage, table.anchorText),
  index("seo_links_from_page_idx").on(table.fromPage),
  index("seo_links_to_page_idx").on(table.toPage),
]);

export const seoGeo = pgTable("seo_geo", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  engine: text("engine").notNull(),
  date: date("date").notNull(),
  cited: boolean("cited").notNull().default(false),
  mentionedWithoutLink: boolean("mentioned_without_link").notNull().default(false),
  citedUrl: text("cited_url"),
  position: integer("position"),
  competitorsCited: jsonb("competitors_cited"),
  analysis: text("analysis"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  uniqueIndex("seo_geo_query_engine_date_idx").on(table.query, table.engine, table.date),
]);

export const seoAlerts = pgTable("seo_alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  data: jsonb("data"),
  status: text("status"),
  sentVia: text("sent_via"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [
  index("seo_alerts_type_idx").on(table.type),
  index("seo_alerts_severity_idx").on(table.severity),
  index("seo_alerts_status_idx").on(table.status),
]);

export const seoReports = pgTable("seo_reports", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  summary: text("summary"),
  data: jsonb("data"),
  sentVia: text("sent_via"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("seo_reports_type_idx").on(table.type),
  index("seo_reports_period_idx").on(table.periodStart, table.periodEnd),
]);

export const seoHealthChecks = pgTable("seo_health_checks", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  status: integer("status"),
  loadTimeMs: integer("load_time_ms"),
  hasMetaTitle: boolean("has_meta_title").notNull().default(false),
  hasMetaDescription: boolean("has_meta_description").notNull().default(false),
  hasCanonical: boolean("has_canonical").notNull().default(false),
  hasHreflang: boolean("has_hreflang").notNull().default(false),
  hasSchemaOrg: boolean("has_schema_org").notNull().default(false),
  issues: jsonb("issues"),
  checkedAt: timestamp("checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("seo_health_checks_url_idx").on(table.url),
  index("seo_health_checks_checked_at_idx").on(table.checkedAt),
]);

export const seoCwvMetrics = pgTable("seo_cwv_metrics", {
  id: serial("id").primaryKey(),
  page: text("page").notNull(),
  metricName: text("metric_name").notNull(), // CLS, LCP, INP, TTFB, FCP
  value: real("value").notNull(),
  rating: text("rating"), // good, needs-improvement, poor
  deviceType: text("device_type"),       // mobile, tablet, desktop
  navigationType: text("navigation_type"), // navigate, reload, back_forward
  connectionType: text("connection_type"), // 4g, 3g, wifi, unknown
  sampleSize: integer("sample_size").notNull().default(1),
  p75: real("p75"), // 75th percentile
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("seo_cwv_page_metric_idx").on(table.page, table.metricName),
]);

export type InsertSeoCwvMetric = typeof seoCwvMetrics.$inferInsert;

export const seoEngineRuns = pgTable("seo_engine_runs", {
  id: serial("id").primaryKey(),
  jobName: text("job_name").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull().default("running"), // running, success, failed
  error: text("error"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("seo_engine_runs_job_idx").on(table.jobName),
  index("seo_engine_runs_status_idx").on(table.status),
]);

export const seoRedirects = pgTable("seo_redirects", {
  id: serial("id").primaryKey(),
  fromPath: text("from_path").notNull().unique(),
  toPath: text("to_path").notNull(),
  statusCode: integer("status_code").notNull().default(301),
  hits: integer("hits").notNull().default(0),
  lastHitAt: timestamp("last_hit_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  createdBy: text("created_by").default("system"), // system or admin
}, (table) => [
  index("seo_redirects_from_idx").on(table.fromPath),
]);

// ===== MEMBERSHIPS (Boat Club) =====

export const MEMBERSHIP_PLANS = {
  ANNUAL: 'annual',
  SEASONAL: 'seasonal',
} as const;

export type MembershipPlan = typeof MEMBERSHIP_PLANS[keyof typeof MEMBERSHIP_PLANS];

export const MEMBERSHIP_STATUSES = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type MembershipStatus = typeof MEMBERSHIP_STATUSES[keyof typeof MEMBERSHIP_STATUSES];

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  customerId: varchar("customer_id").references(() => customers.id),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  plan: text("plan").notNull().default("annual"), // annual, seasonal
  status: text("status").notNull().default("active"), // active, expired, cancelled
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  discountPercent: integer("discount_percent").notNull().default(15),
  freeHoursRemaining: decimal("free_hours_remaining", { precision: 4, scale: 1 }).notNull().default("1"),
  priorityBooking: boolean("priority_booking").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  customerEmailIdx: index("memberships_customer_email_idx").on(table.customerEmail),
  statusIdx: index("memberships_status_idx").on(table.status),
  tenantIdx: index("memberships_tenant_id_idx").on(table.tenantId),
  endDateIdx: index("memberships_end_date_idx").on(table.endDate),
}));

export const insertMembershipSchema = z.object({
  tenantId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  customerEmail: z.string().email("Email invalido"),
  customerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  plan: z.enum(["annual", "seasonal"]).default("annual"),
  status: z.enum(["active", "expired", "cancelled"]).default("active"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Precio invalido"),
  stripeSubscriptionId: z.string().optional().nullable(),
  discountPercent: z.number().int().min(1).max(100).default(15),
  freeHoursRemaining: z.string().default("1"),
  priorityBooking: z.boolean().default(true),
});

export const updateMembershipSchema = z.object({
  customerEmail: z.string().email("Email invalido").optional(),
  customerName: z.string().min(2).optional(),
  plan: z.enum(["annual", "seasonal"]).optional(),
  status: z.enum(["active", "expired", "cancelled"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  stripeSubscriptionId: z.string().optional().nullable(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  freeHoursRemaining: z.string().optional(),
  priorityBooking: z.boolean().optional(),
});

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type UpdateMembership = z.infer<typeof updateMembershipSchema>;

// ===== A/B TESTING & EXPERIMENTS =====

export const EXPERIMENT_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
} as const;

export type ExperimentStatus = typeof EXPERIMENT_STATUS[keyof typeof EXPERIMENT_STATUS];

export interface ExperimentVariant {
  id: string;
  weight: number;
}

export const experiments = pgTable("experiments", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id),
  name: text("name").notNull().unique(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  variants: jsonb("variants").$type<ExperimentVariant[]>().notNull(),
  targetPages: text("target_pages").array(), // ["/", "/boats/*"]
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("experiments_status_idx").on(table.status),
  index("experiments_tenant_idx").on(table.tenantId),
]);

export const experimentAssignments = pgTable("experiment_assignments", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").notNull().references(() => experiments.id),
  sessionId: text("session_id").notNull(),
  variant: text("variant").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("exp_assign_experiment_idx").on(table.experimentId),
  index("exp_assign_session_idx").on(table.sessionId),
  unique("exp_assign_unique").on(table.experimentId, table.sessionId),
]);

export const experimentEvents = pgTable("experiment_events", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").notNull().references(() => experiments.id),
  sessionId: text("session_id").notNull(),
  variant: text("variant").notNull(),
  eventType: text("event_type").notNull(), // "view", "click", "booking_started", "booking_completed"
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("exp_events_experiment_idx").on(table.experimentId),
  index("exp_events_type_idx").on(table.eventType),
]);

// Zod schemas for experiments
export const insertExperimentSchema = z.object({
  tenantId: z.string().optional().nullable(),
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "paused", "completed"]).optional().default("draft"),
  variants: z.array(z.object({
    id: z.string().min(1),
    weight: z.number().int().min(0).max(100),
  })).min(2, "Se necesitan al menos 2 variantes").refine(
    (variants) => variants.reduce((sum, v) => sum + v.weight, 0) === 100,
    "Los pesos de las variantes deben sumar 100"
  ),
  targetPages: z.array(z.string()).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export const updateExperimentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
  variants: z.array(z.object({
    id: z.string().min(1),
    weight: z.number().int().min(0).max(100),
  })).min(2).refine(
    (variants) => variants.reduce((sum, v) => sum + v.weight, 0) === 100,
    "Los pesos de las variantes deben sumar 100"
  ).optional(),
  targetPages: z.array(z.string()).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export const trackExperimentEventSchema = z.object({
  experimentName: z.string().min(1),
  sessionId: z.string().min(1),
  variant: z.string().min(1),
  eventType: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export const assignExperimentSchema = z.object({
  experimentName: z.string().min(1),
  sessionId: z.string().min(1),
});

// Types
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;
export type UpdateExperiment = z.infer<typeof updateExperimentSchema>;
export type Experiment = typeof experiments.$inferSelect;
export type ExperimentAssignment = typeof experimentAssignments.$inferSelect;
export type ExperimentEvent = typeof experimentEvents.$inferSelect;

// ===== FEATURE FLAGS =====

/**
 * Conditions for conditional feature flag evaluation.
 * These allow fine-grained control beyond simple on/off.
 */
export interface FeatureFlagConditions {
  plan?: string[];           // Tenant must be on one of these plans
  minBookings?: number;      // Tenant must have at least this many bookings
  minBoats?: number;         // Tenant must have at least this many boats
  [key: string]: unknown;    // Extensible for future conditions
}

/**
 * Global feature flags: platform-wide defaults managed by super admin.
 * Tenants inherit these unless they have a tenant-specific override.
 */
export const globalFeatureFlags = pgTable("global_feature_flags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(false),
  rolloutPercent: integer("rollout_percent").notNull().default(0), // 0-100
  allowedPlans: text("allowed_plans").array(), // ["pro", "enterprise"]
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

/**
 * Per-tenant feature flag overrides.
 * When a tenant has an entry here, it takes priority over the global flag.
 */
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(false),
  rolloutPercent: integer("rollout_percent").notNull().default(100), // 0-100
  conditions: jsonb("conditions").$type<FeatureFlagConditions>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  unique("feature_flags_tenant_name").on(table.tenantId, table.name),
  index("feature_flags_tenant_idx").on(table.tenantId),
  index("feature_flags_name_idx").on(table.name),
]);

// Zod schemas for feature flags
export const insertGlobalFeatureFlagSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100)
    .regex(/^[a-z0-9_-]+$/, "Solo letras minusculas, numeros, guiones y guiones bajos"),
  description: z.string().max(500).optional().nullable(),
  enabled: z.boolean().optional().default(false),
  rolloutPercent: z.number().int().min(0).max(100).optional().default(0),
  allowedPlans: z.array(z.enum(["starter", "pro", "enterprise"])).optional().nullable(),
});

export const updateGlobalFeatureFlagSchema = z.object({
  description: z.string().max(500).optional().nullable(),
  enabled: z.boolean().optional(),
  rolloutPercent: z.number().int().min(0).max(100).optional(),
  allowedPlans: z.array(z.enum(["starter", "pro", "enterprise"])).optional().nullable(),
});

export const upsertFeatureFlagSchema = z.object({
  enabled: z.boolean(),
  description: z.string().max(500).optional().nullable(),
  rolloutPercent: z.number().int().min(0).max(100).optional().default(100),
  conditions: z.object({
    plan: z.array(z.string()).optional(),
    minBookings: z.number().int().min(0).optional(),
    minBoats: z.number().int().min(0).optional(),
  }).passthrough().optional().nullable(),
});

// Types
export type GlobalFeatureFlag = typeof globalFeatureFlags.$inferSelect;
export type InsertGlobalFeatureFlag = z.infer<typeof insertGlobalFeatureFlagSchema>;
export type UpdateGlobalFeatureFlag = z.infer<typeof updateGlobalFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type UpsertFeatureFlag = z.infer<typeof upsertFeatureFlagSchema>;

// ===== LEAD NURTURING LOG =====

export const NURTURING_ACTIONS = {
  HOT_AVAILABILITY: 'hot_availability',   // Sent availability + booking link
  WARM_DISCOUNT: 'warm_discount',         // Sent 10% discount code
  COLD_NEWSLETTER: 'cold_newsletter',     // Added to newsletter list
} as const;

export type NurturingAction = typeof NURTURING_ACTIONS[keyof typeof NURTURING_ACTIONS];

export const leadNurturingLog = pgTable("lead_nurturing_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  sessionId: varchar("session_id").notNull().references(() => aiChatSessions.id, { onDelete: "cascade" }),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  action: varchar("action", { length: 30 }).notNull(), // 'hot_availability' | 'warm_discount' | 'cold_newsletter'
  discountCode: varchar("discount_code", { length: 30 }), // Only for warm_discount actions
  messageSent: text("message_sent"), // The WhatsApp message text that was sent
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  phoneIdx: index("nurturing_phone_idx").on(table.phoneNumber),
  sessionIdx: index("nurturing_session_idx").on(table.sessionId),
  createdIdx: index("nurturing_created_idx").on(table.createdAt),
}));

export type LeadNurturingLog = typeof leadNurturingLog.$inferSelect;
export type InsertLeadNurturingLog = typeof leadNurturingLog.$inferInsert;

// ===== PARTNERSHIP CONTACTS (Hotel outreach) =====

export const PARTNERSHIP_TOWNS = ["blanes", "lloret", "tossa", "malgrat", "santa-susanna", "calella"] as const;
export type PartnershipTown = typeof PARTNERSHIP_TOWNS[number];

export const PARTNERSHIP_STATUSES = ["pending", "sent", "opened", "replied", "converted", "unsubscribed"] as const;
export type PartnershipStatus = typeof PARTNERSHIP_STATUSES[number];

export const partnershipContacts = pgTable("partnership_contacts", {
  id: serial("id").primaryKey(),
  hotelName: text("hotel_name").notNull(),
  contactName: text("contact_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  town: text("town").notNull(),
  website: text("website"),
  status: text("status").notNull().default("pending"),
  campaignId: text("campaign_id"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  emailIdx: uniqueIndex("partnership_email_idx").on(table.email),
  townIdx: index("partnership_town_idx").on(table.town),
  statusIdx: index("partnership_status_idx").on(table.status),
}));

export type PartnershipContact = typeof partnershipContacts.$inferSelect;
export type InsertPartnershipContact = typeof partnershipContacts.$inferInsert;

// ===== MCP TOKENS (for seo-autopilot public MCP server) =====

export const mcpTokens = pgTable("mcp_tokens", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),                                   // Friendly name e.g. "Cowork — home"
  tokenHash: text("token_hash").notNull(),                        // SHA-256 of the raw token + salt
  tokenPrefix: varchar("token_prefix", { length: 8 }).notNull(),  // First 8 chars of raw token (for display)
  scopes: jsonb("scopes").$type<string[]>().default([]),          // Optional future scoping
  createdBy: text("created_by"),                                  // Admin session id if available
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at", { withTimezone: true }),     // Null = no expiry
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  lastUsedIp: varchar("last_used_ip", { length: 64 }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  callCount: integer("call_count").notNull().default(0),
}, (table) => ({
  tokenHashIdx: uniqueIndex("mcp_tokens_hash_idx").on(table.tokenHash),
  activeIdx: index("mcp_tokens_active_idx").on(table.revokedAt),
}));

export type McpToken = typeof mcpTokens.$inferSelect;
export type InsertMcpToken = typeof mcpTokens.$inferInsert;

export const insertMcpTokenSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  expiresAt: z.string().datetime().optional().or(z.null()),
  scopes: z.array(z.string()).optional(),
});

// ===== DISTRIBUTION TRAY (content pending to publish across platforms) =====

export const DISTRIBUTION_PLATFORMS = [
  "medium",
  "linkedin",
  "reddit",
  "quora",
  "google_business",
  "tripadvisor",
  "foro_nautico",
  "outreach_email",
  "twitter",
  "instagram",
  "facebook",
] as const;

export type DistributionPlatform = typeof DISTRIBUTION_PLATFORMS[number];

export const DISTRIBUTION_STATUSES = [
  "pending",
  "scheduled",
  "published",
  "failed",
  "discarded",
] as const;

export type DistributionStatus = typeof DISTRIBUTION_STATUSES[number];

export const distributionTray = pgTable("distribution_tray", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),                               // Source blog post slug
  platform: varchar("platform", { length: 30 }).notNull(),   // One of DISTRIBUTION_PLATFORMS
  language: varchar("language", { length: 5 }).notNull().default("es"),
  title: text("title"),
  content: text("content").notNull(),                         // Markdown/text adapted to the platform
  targetUrl: text("target_url"),                              // For outreach: destination URL
  contactEmail: text("contact_email"),                        // For outreach: recipient email
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedUrl: text("published_url"),                        // Resulting URL after publishing
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  slugIdx: index("distribution_tray_slug_idx").on(table.slug),
  platformIdx: index("distribution_tray_platform_idx").on(table.platform),
  statusIdx: index("distribution_tray_status_idx").on(table.status),
  createdIdx: index("distribution_tray_created_idx").on(table.createdAt),
}));

export type DistributionTrayItem = typeof distributionTray.$inferSelect;
export type InsertDistributionTrayItem = typeof distributionTray.$inferInsert;

export const insertDistributionTraySchema = z.object({
  slug: z.string().min(1),
  platform: z.enum(DISTRIBUTION_PLATFORMS),
  language: z.string().length(2).default("es"),
  title: z.string().optional().or(z.null()),
  content: z.string().min(1),
  targetUrl: z.string().url().optional().or(z.null()),
  contactEmail: z.string().email().optional().or(z.null()),
  metadata: z.record(z.unknown()).optional(),
  status: z.enum(DISTRIBUTION_STATUSES).default("pending"),
  scheduledFor: z.string().datetime().optional().or(z.null()),
});

// ===== SEO AUTOPILOT AUDIT LOG =====

export const seoAutopilotAudit = pgTable("seo_autopilot_audit", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").references(() => mcpTokens.id, { onDelete: "set null" }),
  tool: varchar("tool", { length: 80 }).notNull(),
  params: jsonb("params").$type<Record<string, unknown>>(),
  success: boolean("success").notNull(),
  resultSize: integer("result_size"),
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
  ip: varchar("ip", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  tokenIdx: index("seo_autopilot_audit_token_idx").on(table.tokenId),
  toolIdx: index("seo_autopilot_audit_tool_idx").on(table.tool),
  createdIdx: index("seo_autopilot_audit_created_idx").on(table.createdAt),
}));

export type SeoAutopilotAudit = typeof seoAutopilotAudit.$inferSelect;
export type InsertSeoAutopilotAudit = typeof seoAutopilotAudit.$inferInsert;

// ===== WAR ROOM: INTEGRATION SCHEMAS =====
// Tables supporting external API integrations (GSC, GA4, PSI, SERP, AI search, GBP,
// YouTube, Instagram, TikTok, Pinterest, backlinks) and the nightly orchestrator.

// --- OAuth connections for APIs that require user OAuth flow ---
export const oauthConnections = pgTable("oauth_connections", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 40 }).notNull(), // gbp, youtube, instagram, tiktok, pinterest, bing_webmaster
  accountIdentifier: text("account_identifier"), // email, channel id, page id, location id
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  scopes: jsonb("scopes").$type<string[]>(),
  metadata: jsonb("metadata"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, expired, revoked, error
  lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
  lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
  lastErrorMessage: text("last_error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  providerIdx: index("oauth_connections_provider_idx").on(table.provider),
  providerAccountIdx: uniqueIndex("oauth_connections_provider_account_idx").on(table.provider, table.accountIdentifier),
}));

export type OAuthConnection = typeof oauthConnections.$inferSelect;
export type InsertOAuthConnection = typeof oauthConnections.$inferInsert;

// --- GSC queries time-series (full-fidelity daily extract from Search Console) ---
export const gscQueries = pgTable("gsc_queries", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  query: text("query").notNull(),
  page: text("page"),
  country: varchar("country", { length: 3 }), // ISO 3166-1 alpha-3
  device: varchar("device", { length: 12 }), // mobile, desktop, tablet
  clicks: integer("clicks").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  ctr: decimal("ctr", { precision: 6, scale: 5 }),
  position: decimal("position", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  dateIdx: index("gsc_queries_date_idx").on(table.date),
  queryIdx: index("gsc_queries_query_idx").on(table.query),
  pageIdx: index("gsc_queries_page_idx").on(table.page),
  uniqRow: uniqueIndex("gsc_queries_unique_idx").on(table.date, table.query, table.page, table.country, table.device),
}));

export type GscQueryRow = typeof gscQueries.$inferSelect;
export type InsertGscQueryRow = typeof gscQueries.$inferInsert;

// --- GA4 daily metrics per (date, landing_page, source/medium, country, device) ---
export const ga4DailyMetrics = pgTable("ga4_daily_metrics", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  landingPage: text("landing_page"),
  source: text("source"),
  medium: text("medium"),
  country: varchar("country", { length: 3 }),
  deviceCategory: varchar("device_category", { length: 12 }),
  sessions: integer("sessions").notNull().default(0),
  totalUsers: integer("total_users").notNull().default(0),
  newUsers: integer("new_users").notNull().default(0),
  engagedSessions: integer("engaged_sessions").notNull().default(0),
  engagementRate: decimal("engagement_rate", { precision: 6, scale: 5 }),
  averageSessionDuration: decimal("average_session_duration", { precision: 10, scale: 2 }),
  screenPageViewsPerSession: decimal("screen_page_views_per_session", { precision: 8, scale: 2 }),
  conversions: integer("conversions").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  dateIdx: index("ga4_daily_date_idx").on(table.date),
  landingIdx: index("ga4_daily_landing_idx").on(table.landingPage),
  sourceIdx: index("ga4_daily_source_idx").on(table.source, table.medium),
  uniqRow: uniqueIndex("ga4_daily_unique_idx").on(table.date, table.landingPage, table.source, table.medium, table.country, table.deviceCategory),
}));

export type Ga4DailyMetric = typeof ga4DailyMetrics.$inferSelect;
export type InsertGa4DailyMetric = typeof ga4DailyMetrics.$inferInsert;

// --- PSI measurements: lab + field data for CWV tracking per URL/strategy ---
export const psiMeasurements = pgTable("psi_measurements", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  strategy: varchar("strategy", { length: 10 }).notNull(), // mobile, desktop
  performanceScore: integer("performance_score"), // 0-100
  accessibilityScore: integer("accessibility_score"),
  bestPracticesScore: integer("best_practices_score"),
  seoScore: integer("seo_score"),
  // Field data (CrUX origin summary)
  lcpMs: integer("lcp_ms"),
  clsScore: real("cls_score"),
  inpMs: integer("inp_ms"),
  ttfbMs: integer("ttfb_ms"),
  fcpMs: integer("fcp_ms"),
  // Lab data (Lighthouse synthetic)
  labLcpMs: integer("lab_lcp_ms"),
  labClsScore: real("lab_cls_score"),
  labTbtMs: integer("lab_tbt_ms"),
  labFcpMs: integer("lab_fcp_ms"),
  labSiMs: integer("lab_si_ms"),
  audits: jsonb("audits"),
  measuredAt: timestamp("measured_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  urlIdx: index("psi_url_idx").on(table.url),
  measuredAtIdx: index("psi_measured_at_idx").on(table.measuredAt),
  urlStrategyIdx: index("psi_url_strategy_idx").on(table.url, table.strategy),
}));

export type PsiMeasurement = typeof psiMeasurements.$inferSelect;
export type InsertPsiMeasurement = typeof psiMeasurements.$inferInsert;

// --- SERP snapshots: top 20 results per keyword per day (DataForSEO/ValueSERP) ---
export const serpSnapshots = pgTable("serp_snapshots", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").notNull(),
  date: date("date").notNull(),
  searchEngine: varchar("search_engine", { length: 20 }).notNull().default("google"),
  location: text("location"),
  language: varchar("language", { length: 5 }),
  position: integer("position").notNull(), // 1-20
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  domain: text("domain"),
  resultType: varchar("result_type", { length: 30 }), // organic, local_pack, featured_snippet, video, images, ai_overview, people_also_ask
  isOwn: boolean("is_own").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  keywordDateIdx: index("serp_snapshots_keyword_date_idx").on(table.keywordId, table.date),
  dateIdx: index("serp_snapshots_date_idx").on(table.date),
  domainIdx: index("serp_snapshots_domain_idx").on(table.domain),
}));

export type SerpSnapshot = typeof serpSnapshots.$inferSelect;
export type InsertSerpSnapshot = typeof serpSnapshots.$inferInsert;

// --- War Room suggestions (F6 orchestrator output) ---
export const warRoomSuggestions = pgTable("war_room_suggestions", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 40 }).notNull(), // content_update, cta_optimization, internal_linking, new_content, outreach, distribution, technical_fix
  priority: varchar("priority", { length: 10 }).notNull(), // critical, high, medium, low
  estimatedImpact: varchar("estimated_impact", { length: 20 }), // traffic_high, traffic_medium, conversions, brand
  title: text("title").notNull(),
  rationale: text("rationale").notNull(),
  data: jsonb("data"),
  recommendedActions: jsonb("recommended_actions"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, done, snoozed
  snoozeUntil: timestamp("snooze_until", { withTimezone: true }),
  approvedBy: text("approved_by"),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  executionResult: jsonb("execution_result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  statusIdx: index("war_room_suggestions_status_idx").on(table.status),
  priorityIdx: index("war_room_suggestions_priority_idx").on(table.priority),
  categoryIdx: index("war_room_suggestions_category_idx").on(table.category),
  createdIdx: index("war_room_suggestions_created_idx").on(table.createdAt),
}));

export type WarRoomSuggestion = typeof warRoomSuggestions.$inferSelect;
export type InsertWarRoomSuggestion = typeof warRoomSuggestions.$inferInsert;
