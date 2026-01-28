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
  displayOrder: integer("display_order").default(999),
  
  // Extended boat information
  imageUrl: text("image_url"), // Main boat image
  imageGallery: text("image_gallery").array(), // Additional images
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

// Testimonials table for customer reviews
export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  comment: z.string().min(10, "El comentario debe tener al menos 10 caracteres"),
});

// Types
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

// Blog Posts table for SEO content
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

// Destinations landing pages for SEO
export const destinations = pgTable("destinations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

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

// Re-export chat models for AI integrations
export { conversations, messages } from "@shared/models/chat";
