import {
  adminUsers, customerUsers, customers, boats, bookings, bookingExtras, testimonials,
  blogPosts, destinations, chatbotConversations, clientPhotos,
  type AdminUser, type InsertAdminUser,
  type CustomerUser, type UpsertCustomerUser,
  type Customer, type InsertCustomer,
  type Boat, type InsertBoat,
  type Booking, type InsertBooking,
  type BookingExtra, type InsertBookingExtra,
  type Testimonial, type InsertTestimonial,
  type BlogPost, type InsertBlogPost,
  type Destination, type InsertDestination,
  type ChatbotConversation, type InsertChatbotConversation, type UpdateChatbotConversation,
  type ClientPhoto, type InsertClientPhoto,
  giftCards,
  type GiftCard, type InsertGiftCard,
  discountCodes,
  type DiscountCode, type InsertDiscountCode,
  crmCustomers,
  type CrmCustomer, type UpdateCrmCustomer,
  checkins,
  type Checkin, type InsertCheckin,
  maintenanceLogs,
  type MaintenanceLog, type InsertMaintenanceLog, type UpdateMaintenanceLog,
  boatDocuments,
  type BoatDocument, type InsertBoatDocument, type UpdateBoatDocument,
  inventoryItems,
  type InventoryItem, type InsertInventoryItem, type UpdateInventoryItem,
  inventoryMovements,
  type InventoryMovement, type InsertInventoryMovement,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, between, inArray, sql, or, isNull, desc, asc, ilike } from "drizzle-orm";
import memoize from "memoizee";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Admin User methods (CRM access)
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser | undefined>;
  getAllAdminUsers(): Promise<AdminUser[]>;

  // Customer User methods (Replit Auth)
  getCustomerUser(id: string): Promise<CustomerUser | undefined>;
  upsertCustomerUser(user: UpsertCustomerUser): Promise<CustomerUser>;

  // Customer Profile methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByUserId(userId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Boat methods
  getAllBoats(): Promise<Boat[]>;
  getBoat(id: string): Promise<Boat | undefined>;
  createBoat(boat: InsertBoat): Promise<Boat>;
  updateBoat(id: string, boat: Partial<InsertBoat>): Promise<Boat | undefined>;

  // Booking methods
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getBookingsByDate(date: Date): Promise<Booking[]>;
  getBookingsByBoatAndDateRange(boatId: string, startDate: Date, endDate: Date): Promise<Booking[]>;
  updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined>;
  updateBookingPaymentStatus(id: string, status: string, stripePaymentIntentId?: string): Promise<Booking | undefined>;
  updateBookingWhatsAppStatus(id: string, confirmationSent?: boolean, reminderSent?: boolean): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;

  // Paginated bookings for admin CRM
  getPaginatedBookings(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    data: Booking[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  // Calendar bookings (all bookings in date range, no pagination)
  getBookingsForCalendar(params: {
    startDate: Date;
    endDate: Date;
    boatId?: string;
  }): Promise<Booking[]>;

  // Booking extras methods
  createBookingExtra(extra: InsertBookingExtra): Promise<BookingExtra>;
  getBookingExtras(bookingId: string): Promise<BookingExtra[]>;

  // Monthly bookings for availability calendar
  getMonthlyBookings(boatId: string, year: number, month: number): Promise<Booking[]>;

  // Availability check
  checkAvailability(boatId: string, startTime: Date, endTime: Date): Promise<boolean>;
  
  // Get overlapping bookings with buffer
  getOverlappingBookingsWithBuffer(boatId: string, startTime: Date, endTime: Date): Promise<Booking[]>;

  // Admin dashboard statistics
  getDashboardStats(startDate: Date, endDate: Date): Promise<{
    bookingsCount: number;
    revenue: number;
    confirmedBookings: number;
    pendingBookings: number;
  }>;

  // Enhanced dashboard stats with previous period comparison
  getDashboardStatsEnhanced(startDate: Date, endDate: Date): Promise<{
    bookingsCount: number;
    revenue: number;
    confirmedBookings: number;
    pendingBookings: number;
    previousPeriodRevenue: number;
    previousPeriodBookings: number;
    averageTicket: number;
    previousAverageTicket: number;
  }>;

  getFleetAvailability(): Promise<{
    totalBoats: number;
    availableBoats: number;
  }>;

  // Revenue trend data for charts
  getRevenueTrend(period: "30d" | "90d" | "365d"): Promise<Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>>;

  // Boats performance comparison
  getBoatsPerformance(period: "month" | "season" | "year"): Promise<Array<{
    boatId: string;
    boatName: string;
    revenue: number;
    bookings: number;
    hours: number;
    utilization: number;
  }>>;

  // Booking status distribution
  getStatusDistribution(startDate: Date, endDate: Date): Promise<{
    confirmed: number;
    pending_payment: number;
    hold: number;
    cancelled: number;
    completed: number;
    draft: number;
  }>;

  // Testimonial methods
  getTestimonials(): Promise<Testimonial[]>;
  getTestimonialsByBoat(boatId: string): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;

  // Blog Post methods
  getAllBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostsByCategory(category: string): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;

  // Destination methods
  getAllDestinations(): Promise<Destination[]>;
  getPublishedDestinations(): Promise<Destination[]>;
  getDestination(id: string): Promise<Destination | undefined>;
  getDestinationBySlug(slug: string): Promise<Destination | undefined>;
  createDestination(destination: InsertDestination): Promise<Destination>;
  updateDestination(id: string, destination: Partial<InsertDestination>): Promise<Destination | undefined>;
  deleteDestination(id: string): Promise<boolean>;

  // Client Photo (Gallery) methods
  getApprovedPhotos(): Promise<ClientPhoto[]>;
  getAllPhotos(): Promise<ClientPhoto[]>;
  createClientPhoto(photo: InsertClientPhoto): Promise<ClientPhoto>;
  updateClientPhoto(id: string, updates: Partial<ClientPhoto>): Promise<ClientPhoto | undefined>;
  deleteClientPhoto(id: string): Promise<boolean>;

  // Gift Card methods
  getAllGiftCards(): Promise<GiftCard[]>;
  getGiftCardByCode(code: string): Promise<GiftCard | undefined>;
  getGiftCardById(id: string): Promise<GiftCard | undefined>;
  createGiftCard(giftCard: InsertGiftCard): Promise<GiftCard>;
  updateGiftCard(id: string, updates: Partial<GiftCard>): Promise<GiftCard | undefined>;

  // Discount Code methods
  createDiscountCode(data: InsertDiscountCode): Promise<DiscountCode>;
  getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined>;
  useDiscountCode(code: string, bookingId: string): Promise<DiscountCode | undefined>;
  getDiscountCodes(): Promise<DiscountCode[]>;
  getDiscountCodesByEmail(email: string): Promise<DiscountCode[]>;
  generateRepeatCustomerCode(email: string, bookingId: string): Promise<DiscountCode>;

  // Email/scheduler methods
  getUpcomingBookingsForReminder(hoursAhead: number): Promise<Booking[]>;
  getCompletedBookingsForThankYou(hoursAfter: number): Promise<Booking[]>;
  isRepeatCustomer(email: string): Promise<boolean>;
  updateBookingEmailStatus(id: string, reminderSent?: boolean, thankYouSent?: boolean): Promise<Booking | undefined>;

  // Chatbot Conversation methods (WhatsApp)
  getChatbotConversation(phoneNumber: string): Promise<ChatbotConversation | undefined>;
  createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation>;
  updateChatbotConversation(phoneNumber: string, updates: UpdateChatbotConversation): Promise<ChatbotConversation | undefined>;
  resetChatbotConversation(phoneNumber: string): Promise<ChatbotConversation | undefined>;
  getOrCreateChatbotConversation(phoneNumber: string, language?: string): Promise<ChatbotConversation>;

  // CRM Customer methods
  upsertCrmCustomer(booking: Booking): Promise<CrmCustomer>;
  getPaginatedCrmCustomers(params: {
    page: number;
    limit: number;
    search?: string;
    segment?: string;
    nationality?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    data: CrmCustomer[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getCrmCustomerById(id: string): Promise<{ customer: CrmCustomer; bookings: Booking[] } | undefined>;
  updateCrmCustomer(id: string, data: UpdateCrmCustomer): Promise<CrmCustomer | undefined>;
  recalculateCustomerStats(customerId: string): Promise<CrmCustomer | undefined>;
  syncAllCustomersFromBookings(): Promise<{ created: number; updated: number }>;

  // Checkin methods
  createCheckin(data: InsertCheckin): Promise<Checkin>;
  getCheckinsByBooking(bookingId: string): Promise<Checkin[]>;
  getLatestCheckin(bookingId: string, type: string): Promise<Checkin | undefined>;

  // Maintenance methods
  createMaintenanceLog(data: InsertMaintenanceLog): Promise<MaintenanceLog>;
  getMaintenanceLogs(boatId?: string): Promise<MaintenanceLog[]>;
  getMaintenanceLog(id: string): Promise<MaintenanceLog | undefined>;
  updateMaintenanceLog(id: string, data: UpdateMaintenanceLog): Promise<MaintenanceLog | undefined>;
  deleteMaintenanceLog(id: string): Promise<boolean>;
  getUpcomingMaintenance(): Promise<MaintenanceLog[]>;

  // Boat document methods
  createBoatDocument(data: InsertBoatDocument): Promise<BoatDocument>;
  getBoatDocuments(boatId?: string): Promise<BoatDocument[]>;
  getBoatDocument(id: string): Promise<BoatDocument | undefined>;
  updateBoatDocument(id: string, data: UpdateBoatDocument): Promise<BoatDocument | undefined>;
  deleteBoatDocument(id: string): Promise<boolean>;
  getExpiringDocuments(daysAhead: number): Promise<BoatDocument[]>;

  // Inventory methods
  createInventoryItem(data: InsertInventoryItem): Promise<InventoryItem>;
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  updateInventoryItem(id: string, data: UpdateInventoryItem): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
  createInventoryMovement(data: InsertInventoryMovement): Promise<InventoryMovement>;
  getInventoryMovements(itemId: string): Promise<InventoryMovement[]>;
  getLowStockItems(): Promise<InventoryItem[]>;
}

// rewrite MemStorage to DatabaseStorage
export class DatabaseStorage implements IStorage {
  // Private cached versions of boat queries with 5 minute TTL
  private _getAllBoatsCached = memoize(
    async (): Promise<Boat[]> => {
      return await db.select().from(boats).where(eq(boats.isActive, true));
    },
    { maxAge: 5 * 60 * 1000, promise: true } // 5 minutes cache
  );

  private _getBoatCached = memoize(
    async (id: string): Promise<Boat | undefined> => {
      const [boat] = await db.select().from(boats).where(eq(boats.id, id));
      return boat || undefined;
    },
    { maxAge: 5 * 60 * 1000, promise: true } // 5 minutes cache
  );

  // Method to invalidate boat cache (called on create/update)
  private invalidateBoatCache() {
    this._getAllBoatsCached.clear();
    this._getBoatCached.clear();
  }

  // Admin User methods (CRM access)
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user || undefined;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user || undefined;
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db
      .insert(adminUsers)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser | undefined> {
    const [user] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning();
    return user || undefined;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers);
  }

  // Customer User methods (Replit Auth)
  async getCustomerUser(id: string): Promise<CustomerUser | undefined> {
    const [user] = await db.select().from(customerUsers).where(eq(customerUsers.id, id));
    return user || undefined;
  }

  async upsertCustomerUser(userData: UpsertCustomerUser): Promise<CustomerUser> {
    const [user] = await db
      .insert(customerUsers)
      .values(userData)
      .onConflictDoUpdate({
        target: customerUsers.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Customer Profile methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByUserId(userId: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.userId, userId));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  // Boat methods (with caching)
  async getAllBoats(): Promise<Boat[]> {
    return await this._getAllBoatsCached();
  }

  async getBoat(id: string): Promise<Boat | undefined> {
    return await this._getBoatCached(id);
  }

  async createBoat(boat: InsertBoat): Promise<Boat> {
    const [newBoat] = await db
      .insert(boats)
      .values(boat)
      .returning();
    this.invalidateBoatCache();
    return newBoat;
  }

  async updateBoat(id: string, boat: Partial<InsertBoat>): Promise<Boat | undefined> {
    const [updatedBoat] = await db
      .update(boats)
      .set(boat)
      .where(eq(boats.id, id))
      .returning();
    this.invalidateBoatCache();
    return updatedBoat || undefined;
  }

  // Booking methods
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking)
      .returning();
    return newBooking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingsByDate(date: Date): Promise<Booking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.startTime, startOfDay),
          lte(bookings.startTime, endOfDay),
          eq(bookings.bookingStatus, "confirmed")
        )
      );
  }

  async getBookingsByBoatAndDateRange(boatId: string, startDate: Date, endDate: Date): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.boatId, boatId),
          gte(bookings.startTime, startDate),
          lte(bookings.endTime, endDate),
          // Include all active booking statuses: hold, pending_payment, confirmed
          inArray(bookings.bookingStatus, ["hold", "pending_payment", "confirmed"])
        )
      );
  }

  // Get overlapping bookings using same buffer logic as availability check
  async getOverlappingBookingsWithBuffer(boatId: string, startTime: Date, endTime: Date): Promise<Booking[]> {
    // Apply same buffer logic as checkAvailability
    const isDevelopment = process.env.NODE_ENV === "development";
    const bufferMinutes = isDevelopment ? 5 : 20;
    const bufferStart = new Date(startTime.getTime() - bufferMinutes * 60 * 1000);
    const bufferEnd = new Date(endTime.getTime() + bufferMinutes * 60 * 1000);

    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.boatId, boatId),
          // Use proper overlap logic: existing.start <= bufferEnd AND existing.end >= bufferStart
          lte(bookings.startTime, bufferEnd),
          gte(bookings.endTime, bufferStart),
          // Include all active booking statuses: hold, pending_payment, confirmed
          inArray(bookings.bookingStatus, ["hold", "pending_payment", "confirmed"])
        )
      );
  }

  async updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking || undefined;
  }

  async updateBookingPaymentStatus(id: string, status: string, stripePaymentIntentId?: string): Promise<Booking | undefined> {
    const updateData: any = { paymentStatus: status };
    if (stripePaymentIntentId) {
      updateData.stripePaymentIntentId = stripePaymentIntentId;
    }

    const [updatedBooking] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking || undefined;
  }

  async updateBookingWhatsAppStatus(id: string, confirmationSent?: boolean, reminderSent?: boolean): Promise<Booking | undefined> {
    const updateData: any = {};
    if (confirmationSent !== undefined) {
      updateData.whatsappConfirmationSent = confirmationSent;
    }
    if (reminderSent !== undefined) {
      updateData.whatsappReminderSent = reminderSent;
    }

    const [updatedBooking] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking || undefined;
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getPaginatedBookings(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    data: Booking[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page, limit, status, search, sortBy = "startTime", sortOrder = "desc" } = params;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [];

    if (status && status !== "all") {
      conditions.push(eq(bookings.bookingStatus, status));
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${bookings.customerName}) LIKE ${searchLower}`,
          sql`LOWER(${bookings.customerSurname}) LIKE ${searchLower}`,
          sql`LOWER(COALESCE(${bookings.customerEmail}, '')) LIKE ${searchLower}`,
          sql`LOWER(${bookings.customerPhone}) LIKE ${searchLower}`,
          sql`LOWER(${bookings.boatId}) LIKE ${searchLower}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute count query
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(bookings)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Determine sort direction and column
    const sortColumnSql =
      sortBy === "createdAt" ? sql`${bookings.createdAt}`
      : sortBy === "bookingDate" ? sql`${bookings.bookingDate}`
      : sql`${bookings.startTime}`;

    const orderSql = sortOrder === "asc"
      ? sql`${sortColumnSql} ASC`
      : sql`${sortColumnSql} DESC`;

    // Execute paginated data query
    const data = await db
      .select()
      .from(bookings)
      .where(whereClause)
      .orderBy(orderSql)
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page,
      totalPages,
    };
  }

  // Calendar bookings: all bookings in a date range (no pagination)
  async getBookingsForCalendar(params: {
    startDate: Date;
    endDate: Date;
    boatId?: string;
  }): Promise<Booking[]> {
    const { startDate, endDate, boatId } = params;

    const conditions = [
      // Overlap logic: booking starts before range ends AND booking ends after range starts
      lte(bookings.startTime, endDate),
      gte(bookings.endTime, startDate),
    ];

    if (boatId) {
      conditions.push(eq(bookings.boatId, boatId));
    }

    return await db
      .select()
      .from(bookings)
      .where(and(...conditions));
  }

  // Booking extras methods
  async createBookingExtra(extra: InsertBookingExtra): Promise<BookingExtra> {
    const [newExtra] = await db
      .insert(bookingExtras)
      .values(extra)
      .returning();
    return newExtra;
  }

  async getBookingExtras(bookingId: string): Promise<BookingExtra[]> {
    return await db
      .select()
      .from(bookingExtras)
      .where(eq(bookingExtras.bookingId, bookingId));
  }

  // Boats that share the same physical vessel
  private readonly sharedBoatIds: Record<string, string[]> = {
    "pacific-craft-625": ["pacific-craft-625", "excursion-privada"],
    "excursion-privada": ["excursion-privada", "pacific-craft-625"],
  };

  private getBoatIdsToCheck(boatId: string): string[] {
    return this.sharedBoatIds[boatId] || [boatId];
  }

  // Monthly bookings for availability calendar
  async getMonthlyBookings(boatId: string, year: number, month: number): Promise<Booking[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const boatIds = this.getBoatIdsToCheck(boatId);

    return await db
      .select()
      .from(bookings)
      .where(
        and(
          inArray(bookings.boatId, boatIds),
          gte(bookings.startTime, startDate),
          lte(bookings.endTime, endDate),
          inArray(bookings.bookingStatus, ["hold", "pending_payment", "confirmed"])
        )
      );
  }

  // Availability check with 20-minute buffer
  async checkAvailability(boatId: string, startTime: Date, endTime: Date): Promise<boolean> {
    // In development mode, be more permissive to allow testing
    const isDevelopment = process.env.NODE_ENV === "development";

    // Reduce buffer in development for easier testing
    const bufferMinutes = isDevelopment ? 5 : 20;
    const bufferStart = new Date(startTime.getTime() - bufferMinutes * 60 * 1000);
    const bufferEnd = new Date(endTime.getTime() + bufferMinutes * 60 * 1000);
    const boatIds = this.getBoatIdsToCheck(boatId);

    const conflictingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          inArray(bookings.boatId, boatIds),
          // Check all active booking statuses: hold, pending_payment, confirmed
          inArray(bookings.bookingStatus, ["hold", "pending_payment", "confirmed"]),
          // Check for any overlap with buffer times
          and(
            lte(bookings.startTime, bufferEnd),
            gte(bookings.endTime, bufferStart)
          )
        )
      );

    // Add logging for debugging in development
    if (isDevelopment) {
      console.log(`Availability check for boat ${boatId}:`);
      console.log(`- Requested: ${startTime.toISOString()} to ${endTime.toISOString()}`);
      console.log(`- Buffer (${bufferMinutes}min): ${bufferStart.toISOString()} to ${bufferEnd.toISOString()}`);
      console.log(`- Conflicting bookings found: ${conflictingBookings.length}`);
      if (conflictingBookings.length > 0) {
        conflictingBookings.forEach((booking, i) => {
          console.log(`  ${i+1}. ${booking.startTime.toISOString()} to ${booking.endTime.toISOString()} (${booking.bookingStatus})`);
        });
      }
    }

    return conflictingBookings.length === 0;
  }

  // Clean up expired holds that block availability
  async cleanupExpiredHolds(): Promise<number> {
    const now = new Date();
    const expiredHolds = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.bookingStatus, "hold"), lte(bookings.expiresAt!, now)));

    if (expiredHolds.length === 0) return 0;

    await db
      .delete(bookings)
      .where(and(eq(bookings.bookingStatus, "hold"), lte(bookings.expiresAt!, now)));

    return expiredHolds.length;
  }

  // Admin dashboard statistics
  async getDashboardStats(startDate: Date, endDate: Date): Promise<{
    bookingsCount: number;
    revenue: number;
    confirmedBookings: number;
    pendingBookings: number;
  }> {
    const bookingsInRange = await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.bookingDate, startDate),
          lte(bookings.bookingDate, endDate),
          inArray(bookings.bookingStatus, ["confirmed", "pending_payment"])
        )
      );

    const confirmedBookings = bookingsInRange.filter(b => b.bookingStatus === "confirmed");
    const pendingBookings = bookingsInRange.filter(b => b.bookingStatus === "pending_payment");
    
    const revenue = confirmedBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.totalAmount);
    }, 0);

    return {
      bookingsCount: bookingsInRange.length,
      revenue: Math.round(revenue * 100) / 100,
      confirmedBookings: confirmedBookings.length,
      pendingBookings: pendingBookings.length,
    };
  }

  async getFleetAvailability(): Promise<{
    totalBoats: number;
    availableBoats: number;
  }> {
    const allBoats = await db.select().from(boats).where(eq(boats.isActive, true));
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Check which boats have active bookings right now
    const activeBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          lte(bookings.startTime, now),
          gte(bookings.endTime, now),
          inArray(bookings.bookingStatus, ["confirmed", "pending_payment"])
        )
      );

    const bookedBoatIds = new Set(activeBookings.map(b => b.boatId));
    const availableBoats = allBoats.filter(boat => !bookedBoatIds.has(boat.id));

    return {
      totalBoats: allBoats.length,
      availableBoats: availableBoats.length,
    };
  }

  // Enhanced dashboard stats with previous period comparison
  async getDashboardStatsEnhanced(startDate: Date, endDate: Date): Promise<{
    bookingsCount: number;
    revenue: number;
    confirmedBookings: number;
    pendingBookings: number;
    previousPeriodRevenue: number;
    previousPeriodBookings: number;
    averageTicket: number;
    previousAverageTicket: number;
  }> {
    // Current period stats
    const currentStats = await this.getDashboardStats(startDate, endDate);

    // Calculate previous period (same duration, shifted back)
    const periodMs = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - periodMs);
    const prevEnd = new Date(startDate.getTime() - 1); // 1ms before current start

    const prevStats = await this.getDashboardStats(prevStart, prevEnd);

    const averageTicket = currentStats.bookingsCount > 0
      ? Math.round((currentStats.revenue / currentStats.bookingsCount) * 100) / 100
      : 0;

    const previousAverageTicket = prevStats.bookingsCount > 0
      ? Math.round((prevStats.revenue / prevStats.bookingsCount) * 100) / 100
      : 0;

    return {
      ...currentStats,
      previousPeriodRevenue: prevStats.revenue,
      previousPeriodBookings: prevStats.bookingsCount,
      averageTicket,
      previousAverageTicket,
    };
  }

  // Revenue trend data for dashboard charts
  async getRevenueTrend(period: "30d" | "90d" | "365d"): Promise<Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>> {
    const now = new Date();
    let startDate: Date;
    let groupByWeek = false;

    switch (period) {
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupByWeek = true;
        break;
      case "365d":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupByWeek = true;
        break;
    }
    startDate.setHours(0, 0, 0, 0);

    const allBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.bookingDate, startDate),
          lte(bookings.bookingDate, now),
          inArray(bookings.bookingStatus, ["confirmed", "pending_payment"])
        )
      );

    // Group by day or week
    const grouped = new Map<string, { revenue: number; bookings: number }>();

    if (groupByWeek) {
      // Group by ISO week start (Monday)
      for (const b of allBookings) {
        const d = new Date(b.bookingDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const weekStart = new Date(d.setDate(diff));
        const key = weekStart.toISOString().split("T")[0];
        const entry = grouped.get(key) || { revenue: 0, bookings: 0 };
        if (b.bookingStatus === "confirmed") {
          entry.revenue += parseFloat(b.totalAmount);
        }
        entry.bookings += 1;
        grouped.set(key, entry);
      }
    } else {
      // Group by day
      for (const b of allBookings) {
        const key = new Date(b.bookingDate).toISOString().split("T")[0];
        const entry = grouped.get(key) || { revenue: 0, bookings: 0 };
        if (b.bookingStatus === "confirmed") {
          entry.revenue += parseFloat(b.totalAmount);
        }
        entry.bookings += 1;
        grouped.set(key, entry);
      }
    }

    // Fill missing dates/weeks with zeros
    const result: Array<{ date: string; revenue: number; bookings: number }> = [];
    const cursor = new Date(startDate);
    const stepDays = groupByWeek ? 7 : 1;

    while (cursor <= now) {
      const key = cursor.toISOString().split("T")[0];
      const entry = grouped.get(key) || { revenue: 0, bookings: 0 };
      result.push({
        date: key,
        revenue: Math.round(entry.revenue * 100) / 100,
        bookings: entry.bookings,
      });
      cursor.setDate(cursor.getDate() + stepDays);
    }

    return result;
  }

  // Boats performance comparison
  async getBoatsPerformance(period: "month" | "season" | "year"): Promise<Array<{
    boatId: string;
    boatName: string;
    revenue: number;
    bookings: number;
    hours: number;
    utilization: number;
  }>> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "season":
        // Season is April - October of current year
        startDate = new Date(now.getFullYear(), 3, 1); // April 1
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const allBoats = await db.select().from(boats).where(eq(boats.isActive, true));

    const periodBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.bookingDate, startDate),
          lte(bookings.bookingDate, now),
          inArray(bookings.bookingStatus, ["confirmed", "pending_payment"])
        )
      );

    // Calculate total available hours in period (assuming 10h operating day, April-October)
    const totalDaysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const operatingHoursPerDay = 10; // ~9AM to 7PM
    const totalAvailableHours = totalDaysInPeriod * operatingHoursPerDay;

    return allBoats.map(boat => {
      const boatBookings = periodBookings.filter(b => b.boatId === boat.id);
      const confirmedBookings = boatBookings.filter(b => b.bookingStatus === "confirmed");
      const revenue = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
      const totalHours = boatBookings.reduce((sum, b) => sum + (b.totalHours || 0), 0);
      const utilization = totalAvailableHours > 0
        ? Math.round((totalHours / totalAvailableHours) * 100)
        : 0;

      return {
        boatId: boat.id,
        boatName: boat.name,
        revenue: Math.round(revenue * 100) / 100,
        bookings: boatBookings.length,
        hours: totalHours,
        utilization: Math.min(utilization, 100), // Cap at 100%
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }

  // Booking status distribution
  async getStatusDistribution(startDate: Date, endDate: Date): Promise<{
    confirmed: number;
    pending_payment: number;
    hold: number;
    cancelled: number;
    completed: number;
    draft: number;
  }> {
    const allBookingsInRange = await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.bookingDate, startDate),
          lte(bookings.bookingDate, endDate)
        )
      );

    const distribution = {
      confirmed: 0,
      pending_payment: 0,
      hold: 0,
      cancelled: 0,
      completed: 0,
      draft: 0,
    };

    for (const b of allBookingsInRange) {
      const status = b.bookingStatus as keyof typeof distribution;
      if (status in distribution) {
        distribution[status] += 1;
      }
    }

    return distribution;
  }

  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials).where(eq(testimonials.isVerified, true));
  }

  async getTestimonialsByBoat(boatId: string): Promise<Testimonial[]> {
    return await db.select()
      .from(testimonials)
      .where(and(
        eq(testimonials.boatId, boatId),
        eq(testimonials.isVerified, true)
      ));
  }

  async createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
    const [testimonial] = await db
      .insert(testimonials)
      .values(insertTestimonial)
      .returning();
    return testimonial;
  }

  // Blog Post methods
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts);
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return await db.select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true));
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post || undefined;
  }

  async getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
    return await db.select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.category, category),
        eq(blogPosts.isPublished, true)
      ));
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db
      .insert(blogPosts)
      .values({
        ...insertPost,
        publishedAt: insertPost.isPublished ? new Date() : null
      })
      .returning();
    return post;
  }

  async updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    // Set publishedAt if changing to published
    if (updates.isPublished === true) {
      const existing = await this.getBlogPost(id);
      if (existing && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const [post] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();
    return post || undefined;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Destination methods
  async getAllDestinations(): Promise<Destination[]> {
    return await db.select().from(destinations);
  }

  async getPublishedDestinations(): Promise<Destination[]> {
    return await db.select()
      .from(destinations)
      .where(eq(destinations.isPublished, true));
  }

  async getDestination(id: string): Promise<Destination | undefined> {
    const [destination] = await db.select().from(destinations).where(eq(destinations.id, id));
    return destination || undefined;
  }

  async getDestinationBySlug(slug: string): Promise<Destination | undefined> {
    const [destination] = await db.select().from(destinations).where(eq(destinations.slug, slug));
    return destination || undefined;
  }

  async createDestination(insertDestination: InsertDestination): Promise<Destination> {
    const [destination] = await db
      .insert(destinations)
      .values(insertDestination)
      .returning();
    return destination;
  }

  async updateDestination(id: string, updates: Partial<InsertDestination>): Promise<Destination | undefined> {
    const [destination] = await db
      .update(destinations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(destinations.id, id))
      .returning();
    return destination || undefined;
  }

  async deleteDestination(id: string): Promise<boolean> {
    const result = await db.delete(destinations).where(eq(destinations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ===== CLIENT PHOTO (GALLERY) METHODS =====

  async getApprovedPhotos(): Promise<ClientPhoto[]> {
    return await db.select().from(clientPhotos).where(eq(clientPhotos.isApproved, true));
  }

  async getAllPhotos(): Promise<ClientPhoto[]> {
    return await db.select().from(clientPhotos);
  }

  async createClientPhoto(photo: InsertClientPhoto): Promise<ClientPhoto> {
    const [newPhoto] = await db.insert(clientPhotos).values(photo).returning();
    return newPhoto;
  }

  async updateClientPhoto(id: string, updates: Partial<ClientPhoto>): Promise<ClientPhoto | undefined> {
    const [updated] = await db.update(clientPhotos).set(updates).where(eq(clientPhotos.id, id)).returning();
    return updated || undefined;
  }

  async deleteClientPhoto(id: string): Promise<boolean> {
    const result = await db.delete(clientPhotos).where(eq(clientPhotos.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ===== GIFT CARD METHODS =====

  async getAllGiftCards(): Promise<GiftCard[]> {
    return await db.select().from(giftCards);
  }

  async getGiftCardByCode(code: string): Promise<GiftCard | undefined> {
    const [card] = await db.select().from(giftCards).where(eq(giftCards.code, code));
    return card;
  }

  async getGiftCardById(id: string): Promise<GiftCard | undefined> {
    const [card] = await db.select().from(giftCards).where(eq(giftCards.id, id));
    return card;
  }

  async createGiftCard(giftCard: InsertGiftCard): Promise<GiftCard> {
    const [created] = await db.insert(giftCards).values(giftCard).returning();
    return created;
  }

  async updateGiftCard(id: string, updates: Partial<GiftCard>): Promise<GiftCard | undefined> {
    const [updated] = await db.update(giftCards).set(updates).where(eq(giftCards.id, id)).returning();
    return updated;
  }

  // ===== DISCOUNT CODE METHODS =====

  async createDiscountCode(data: InsertDiscountCode): Promise<DiscountCode> {
    const [created] = await db.insert(discountCodes).values(data).returning();
    return created;
  }

  async getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined> {
    const [found] = await db
      .select()
      .from(discountCodes)
      .where(
        and(
          eq(discountCodes.code, code.toUpperCase().trim()),
          eq(discountCodes.isActive, true)
        )
      );
    return found || undefined;
  }

  async useDiscountCode(code: string, bookingId: string): Promise<DiscountCode | undefined> {
    const [updated] = await db
      .update(discountCodes)
      .set({ currentUses: sql`current_uses + 1` })
      .where(eq(discountCodes.code, code.toUpperCase().trim()))
      .returning();
    return updated || undefined;
  }

  async getDiscountCodes(): Promise<DiscountCode[]> {
    return await db.select().from(discountCodes);
  }

  async getDiscountCodesByEmail(email: string): Promise<DiscountCode[]> {
    return await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.customerEmail, email.toLowerCase().trim()));
  }

  async generateRepeatCustomerCode(email: string, bookingId: string): Promise<DiscountCode> {
    // Generate code: REPEAT-{first6 of email hash}
    const emailHash = email.toLowerCase().trim().split("").reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    }, 0);
    const hashStr = Math.abs(emailHash).toString(36).toUpperCase().slice(0, 6).padEnd(6, "X");
    const code = `REPEAT-${hashStr}`;

    // Expires in 12 months
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const [created] = await db
      .insert(discountCodes)
      .values({
        code,
        discountPercent: 10,
        maxUses: 1,
        customerEmail: email.toLowerCase().trim(),
        isActive: true,
        expiresAt,
      })
      .onConflictDoNothing({ target: discountCodes.code })
      .returning();

    // If code already existed (conflict), return the existing one
    if (!created) {
      const existing = await this.getDiscountCodeByCode(code);
      if (existing) return existing;
      // Fallback: generate with a suffix to avoid collision
      const fallbackCode = `REPEAT-${hashStr}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
      const [fallback] = await db
        .insert(discountCodes)
        .values({
          code: fallbackCode,
          discountPercent: 10,
          maxUses: 1,
          customerEmail: email.toLowerCase().trim(),
          isActive: true,
          expiresAt,
        })
        .returning();
      return fallback;
    }

    return created;
  }

  // ===== EMAIL / SCHEDULER METHODS =====

  /**
   * Get confirmed bookings starting within a time window around hoursAhead (22-26h),
   * where emailReminderSent is false and the customer has an email.
   */
  async getUpcomingBookingsForReminder(hoursAhead: number): Promise<Booking[]> {
    const now = new Date();
    // Window: hoursAhead - 2h to hoursAhead + 2h (e.g., 22h to 26h for hoursAhead=24)
    const windowStart = new Date(now.getTime() + (hoursAhead - 2) * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + (hoursAhead + 2) * 60 * 60 * 1000);

    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.bookingStatus, "confirmed"),
          eq(bookings.emailReminderSent, false),
          gte(bookings.startTime, windowStart),
          lte(bookings.startTime, windowEnd)
        )
      );
  }

  /**
   * Get confirmed bookings that ended within a time window around hoursAfter (22-26h ago),
   * where emailThankYouSent is false and the customer has an email.
   */
  async getCompletedBookingsForThankYou(hoursAfter: number): Promise<Booking[]> {
    const now = new Date();
    // Window: hoursAfter - 2h to hoursAfter + 2h ago
    const windowEnd = new Date(now.getTime() - (hoursAfter - 2) * 60 * 60 * 1000);
    const windowStart = new Date(now.getTime() - (hoursAfter + 2) * 60 * 60 * 1000);

    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.bookingStatus, "confirmed"),
          eq(bookings.emailThankYouSent, false),
          gte(bookings.endTime, windowStart),
          lte(bookings.endTime, windowEnd)
        )
      );
  }

  /**
   * Check if a customer email has previous confirmed bookings.
   */
  async isRepeatCustomer(email: string): Promise<boolean> {
    const result = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.customerEmail, email.toLowerCase().trim()),
          eq(bookings.bookingStatus, "confirmed")
        )
      )
      .limit(2); // Only need to know if there is more than 1

    return result.length > 1;
  }

  /**
   * Update email tracking flags on a booking.
   */
  async updateBookingEmailStatus(id: string, reminderSent?: boolean, thankYouSent?: boolean): Promise<Booking | undefined> {
    const updateData: Record<string, boolean> = {};
    if (reminderSent !== undefined) {
      updateData.emailReminderSent = reminderSent;
    }
    if (thankYouSent !== undefined) {
      updateData.emailThankYouSent = thankYouSent;
    }

    const [updatedBooking] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking || undefined;
  }

  // ===== CHATBOT CONVERSATION METHODS =====

  async getChatbotConversation(phoneNumber: string): Promise<ChatbotConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(chatbotConversations)
      .where(eq(chatbotConversations.phoneNumber, phoneNumber));
    return conversation || undefined;
  }

  async createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation> {
    const [newConversation] = await db
      .insert(chatbotConversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async updateChatbotConversation(
    phoneNumber: string,
    updates: UpdateChatbotConversation
  ): Promise<ChatbotConversation | undefined> {
    const [conversation] = await db
      .update(chatbotConversations)
      .set({
        ...updates,
        lastMessageAt: new Date(),
        messagesCount: sql`messages_count + 1`,
      })
      .where(eq(chatbotConversations.phoneNumber, phoneNumber))
      .returning();
    return conversation || undefined;
  }

  async resetChatbotConversation(phoneNumber: string): Promise<ChatbotConversation | undefined> {
    const [conversation] = await db
      .update(chatbotConversations)
      .set({
        currentState: 'welcome',
        selectedBoatId: null,
        selectedDate: null,
        selectedStartTime: null,
        selectedDuration: null,
        selectedExtras: null,
        customerName: null,
        customerEmail: null,
        numberOfPeople: null,
        context: {},
        lastMessageAt: new Date(),
      })
      .where(eq(chatbotConversations.phoneNumber, phoneNumber))
      .returning();
    return conversation || undefined;
  }

  async getOrCreateChatbotConversation(
    phoneNumber: string,
    language: string = 'es'
  ): Promise<ChatbotConversation> {
    // Try to get existing conversation
    let conversation = await this.getChatbotConversation(phoneNumber);

    if (!conversation) {
      // Create new conversation
      conversation = await this.createChatbotConversation({
        phoneNumber,
        language,
        currentState: 'welcome',
      });
    }

    return conversation;
  }

  // ===== CRM CUSTOMER METHODS =====

  /**
   * Upsert a CRM customer from a booking. Matches by phone or email.
   * Creates new customer if not found, updates stats if found.
   */
  async upsertCrmCustomer(booking: Booking): Promise<CrmCustomer> {
    // Try to find existing customer by phone or email
    const conditions = [eq(crmCustomers.phone, booking.customerPhone)];
    if (booking.customerEmail) {
      conditions.push(eq(crmCustomers.email, booking.customerEmail));
    }

    const [existing] = await db
      .select()
      .from(crmCustomers)
      .where(or(...conditions))
      .limit(1);

    if (existing) {
      // Recalculate stats for this customer
      return (await this.recalculateCustomerStats(existing.id)) || existing;
    }

    // Create new customer
    const [newCustomer] = await db
      .insert(crmCustomers)
      .values({
        name: booking.customerName,
        surname: booking.customerSurname,
        email: booking.customerEmail || null,
        phone: booking.customerPhone,
        nationality: booking.customerNationality,
        segment: "new",
        totalBookings: 1,
        totalSpent: booking.totalAmount,
        firstBookingDate: booking.startTime,
        lastBookingDate: booking.startTime,
      })
      .returning();

    return newCustomer;
  }

  async getPaginatedCrmCustomers(params: {
    page: number;
    limit: number;
    search?: string;
    segment?: string;
    nationality?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    data: CrmCustomer[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page, limit, search, segment, nationality, sortBy = "lastBookingDate", sortOrder = "desc" } = params;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (segment && segment !== "all") {
      conditions.push(eq(crmCustomers.segment, segment));
    }

    if (nationality && nationality !== "all") {
      conditions.push(eq(crmCustomers.nationality, nationality));
    }

    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${crmCustomers.name}) LIKE ${searchPattern}`,
          sql`LOWER(${crmCustomers.surname}) LIKE ${searchPattern}`,
          sql`LOWER(COALESCE(${crmCustomers.email}, '')) LIKE ${searchPattern}`,
          sql`LOWER(${crmCustomers.phone}) LIKE ${searchPattern}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count query
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(crmCustomers)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Sort column
    const sortColumnMap: Record<string, ReturnType<typeof sql>> = {
      name: sql`${crmCustomers.name}`,
      totalBookings: sql`${crmCustomers.totalBookings}`,
      totalSpent: sql`${crmCustomers.totalSpent}`,
      lastBookingDate: sql`${crmCustomers.lastBookingDate}`,
      createdAt: sql`${crmCustomers.createdAt}`,
    };
    const sortColumn = sortColumnMap[sortBy] || sql`${crmCustomers.lastBookingDate}`;
    const orderSql = sortOrder === "asc"
      ? sql`${sortColumn} ASC NULLS LAST`
      : sql`${sortColumn} DESC NULLS LAST`;

    const data = await db
      .select()
      .from(crmCustomers)
      .where(whereClause)
      .orderBy(orderSql)
      .limit(limit)
      .offset(offset);

    return { data, total, page, totalPages };
  }

  async getCrmCustomerById(id: string): Promise<{ customer: CrmCustomer; bookings: Booking[] } | undefined> {
    const [customer] = await db.select().from(crmCustomers).where(eq(crmCustomers.id, id));
    if (!customer) return undefined;

    // Find all bookings matching this customer by phone or email
    const conditions = [
      eq(bookings.customerPhone, customer.phone),
    ];
    if (customer.email) {
      conditions.push(eq(bookings.customerEmail, customer.email));
    }

    const customerBookings = await db
      .select()
      .from(bookings)
      .where(or(...conditions))
      .orderBy(sql`${bookings.startTime} DESC`);

    return { customer, bookings: customerBookings };
  }

  async updateCrmCustomer(id: string, data: UpdateCrmCustomer): Promise<CrmCustomer | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.surname !== undefined) updateData.surname = data.surname;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.nationality !== undefined) updateData.nationality = data.nationality || null;
    if (data.documentId !== undefined) updateData.documentId = data.documentId || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.segment !== undefined) updateData.segment = data.segment;
    if (data.tags !== undefined) updateData.tags = data.tags || null;

    const [updated] = await db
      .update(crmCustomers)
      .set(updateData)
      .where(eq(crmCustomers.id, id))
      .returning();

    return updated || undefined;
  }

  async recalculateCustomerStats(customerId: string): Promise<CrmCustomer | undefined> {
    const [customer] = await db.select().from(crmCustomers).where(eq(crmCustomers.id, customerId));
    if (!customer) return undefined;

    // Find matching bookings
    const conditions = [
      eq(bookings.customerPhone, customer.phone),
    ];
    if (customer.email) {
      conditions.push(eq(bookings.customerEmail, customer.email));
    }

    const customerBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          or(...conditions),
          inArray(bookings.bookingStatus, ["confirmed", "pending_payment"])
        )
      );

    const totalBookings = customerBookings.length;
    const totalSpent = customerBookings
      .filter(b => b.bookingStatus === "confirmed")
      .reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);

    const dates = customerBookings.map(b => new Date(b.startTime).getTime()).filter(Boolean);
    const firstBookingDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
    const lastBookingDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

    // Auto-segment: 1 booking = new, 2-3 = returning, 4+ or >1000 spent = vip
    let segment: string = customer.segment;
    if (customer.segment !== "vip" || totalBookings === 0) {
      if (totalBookings >= 4 || totalSpent >= 1000) {
        segment = "vip";
      } else if (totalBookings >= 2) {
        segment = "returning";
      } else {
        segment = "new";
      }
    }

    const [updated] = await db
      .update(crmCustomers)
      .set({
        totalBookings,
        totalSpent: totalSpent.toFixed(2),
        firstBookingDate,
        lastBookingDate,
        segment,
        updatedAt: new Date(),
      })
      .where(eq(crmCustomers.id, customerId))
      .returning();

    return updated || undefined;
  }

  async syncAllCustomersFromBookings(): Promise<{ created: number; updated: number }> {
    // Get all confirmed/pending bookings
    const allBookings = await db
      .select()
      .from(bookings)
      .where(
        inArray(bookings.bookingStatus, ["confirmed", "pending_payment"])
      );

    // Group bookings by unique customer (phone-based)
    const customerMap = new Map<string, Booking[]>();
    for (const booking of allBookings) {
      const key = booking.customerPhone;
      const existing = customerMap.get(key) || [];
      existing.push(booking);
      customerMap.set(key, existing);
    }

    let created = 0;
    let updated = 0;

    const entries = Array.from(customerMap.entries());
    for (const [phone, custBookings] of entries) {
      // Check if customer already exists
      const [existing] = await db
        .select()
        .from(crmCustomers)
        .where(eq(crmCustomers.phone, phone))
        .limit(1);

      // Use the most recent booking for name/nationality
      const sorted = [...custBookings].sort(
        (a: Booking, b: Booking) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      const latest = sorted[0];

      const totalBookings = custBookings.length;
      const totalSpent = custBookings
        .filter((b: Booking) => b.bookingStatus === "confirmed")
        .reduce((sum: number, b: Booking) => sum + parseFloat(b.totalAmount), 0);
      const dates = custBookings.map((b: Booking) => new Date(b.startTime).getTime());
      const firstBookingDate = new Date(Math.min(...dates));
      const lastBookingDate = new Date(Math.max(...dates));

      let segment = "new";
      if (totalBookings >= 4 || totalSpent >= 1000) {
        segment = "vip";
      } else if (totalBookings >= 2) {
        segment = "returning";
      }

      if (existing) {
        await db
          .update(crmCustomers)
          .set({
            name: latest.customerName,
            surname: latest.customerSurname,
            email: latest.customerEmail || existing.email,
            nationality: latest.customerNationality || existing.nationality,
            totalBookings,
            totalSpent: totalSpent.toFixed(2),
            firstBookingDate,
            lastBookingDate,
            segment: existing.segment === "vip" ? "vip" : segment,
            updatedAt: new Date(),
          })
          .where(eq(crmCustomers.id, existing.id));
        updated++;
      } else {
        await db
          .insert(crmCustomers)
          .values({
            name: latest.customerName,
            surname: latest.customerSurname,
            email: latest.customerEmail || null,
            phone: latest.customerPhone,
            nationality: latest.customerNationality,
            segment,
            totalBookings,
            totalSpent: totalSpent.toFixed(2),
            firstBookingDate,
            lastBookingDate,
          });
        created++;
      }
    }

    return { created, updated };
  }

  // ===== CHECKIN METHODS =====

  async createCheckin(data: InsertCheckin): Promise<Checkin> {
    const [newCheckin] = await db
      .insert(checkins)
      .values({
        bookingId: data.bookingId,
        boatId: data.boatId,
        type: data.type,
        performedBy: data.performedBy || null,
        fuelLevel: data.fuelLevel,
        condition: data.condition,
        engineHours: data.engineHours || null,
        notes: data.notes || null,
        photos: data.photos || null,
        signatureUrl: data.signatureUrl || null,
        checklist: data.checklist || null,
      })
      .returning();
    return newCheckin;
  }

  async getCheckinsByBooking(bookingId: string): Promise<Checkin[]> {
    return await db
      .select()
      .from(checkins)
      .where(eq(checkins.bookingId, bookingId))
      .orderBy(sql`${checkins.performedAt} ASC`);
  }

  async getLatestCheckin(bookingId: string, type: string): Promise<Checkin | undefined> {
    const [result] = await db
      .select()
      .from(checkins)
      .where(
        and(
          eq(checkins.bookingId, bookingId),
          eq(checkins.type, type)
        )
      )
      .orderBy(sql`${checkins.performedAt} DESC`)
      .limit(1);
    return result || undefined;
  }

  // ===== MAINTENANCE METHODS =====

  async createMaintenanceLog(data: InsertMaintenanceLog): Promise<MaintenanceLog> {
    const [log] = await db
      .insert(maintenanceLogs)
      .values({
        boatId: data.boatId,
        type: data.type,
        description: data.description,
        cost: data.cost || null,
        date: data.date,
        nextDueDate: data.nextDueDate || null,
        status: data.status || "scheduled",
        notes: data.notes || null,
        createdBy: data.createdBy || null,
      })
      .returning();
    return log;
  }

  async getMaintenanceLogs(boatId?: string): Promise<MaintenanceLog[]> {
    const conditions = [];
    if (boatId) {
      conditions.push(eq(maintenanceLogs.boatId, boatId));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(maintenanceLogs)
      .where(whereClause)
      .orderBy(sql`${maintenanceLogs.date} DESC`);
  }

  async getMaintenanceLog(id: string): Promise<MaintenanceLog | undefined> {
    const [log] = await db.select().from(maintenanceLogs).where(eq(maintenanceLogs.id, id));
    return log || undefined;
  }

  async updateMaintenanceLog(id: string, data: UpdateMaintenanceLog): Promise<MaintenanceLog | undefined> {
    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.cost !== undefined) updateData.cost = data.cost || null;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.nextDueDate !== undefined) updateData.nextDueDate = data.nextDueDate || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const [updated] = await db
      .update(maintenanceLogs)
      .set(updateData)
      .where(eq(maintenanceLogs.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMaintenanceLog(id: string): Promise<boolean> {
    const result = await db.delete(maintenanceLogs).where(eq(maintenanceLogs.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUpcomingMaintenance(): Promise<MaintenanceLog[]> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return await db
      .select()
      .from(maintenanceLogs)
      .where(
        and(
          inArray(maintenanceLogs.status, ["scheduled", "in_progress"]),
          lte(maintenanceLogs.date, thirtyDaysFromNow)
        )
      )
      .orderBy(sql`${maintenanceLogs.date} ASC`);
  }

  // ===== BOAT DOCUMENT METHODS =====

  async createBoatDocument(data: InsertBoatDocument): Promise<BoatDocument> {
    const [doc] = await db
      .insert(boatDocuments)
      .values({
        boatId: data.boatId,
        type: data.type,
        name: data.name,
        fileUrl: data.fileUrl || null,
        expiryDate: data.expiryDate || null,
        notes: data.notes || null,
      })
      .returning();
    return doc;
  }

  async getBoatDocuments(boatId?: string): Promise<BoatDocument[]> {
    const conditions = [];
    if (boatId) {
      conditions.push(eq(boatDocuments.boatId, boatId));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(boatDocuments)
      .where(whereClause)
      .orderBy(sql`${boatDocuments.expiryDate} ASC NULLS LAST`);
  }

  async getBoatDocument(id: string): Promise<BoatDocument | undefined> {
    const [doc] = await db.select().from(boatDocuments).where(eq(boatDocuments.id, id));
    return doc || undefined;
  }

  async updateBoatDocument(id: string, data: UpdateBoatDocument): Promise<BoatDocument | undefined> {
    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl || null;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const [updated] = await db
      .update(boatDocuments)
      .set(updateData)
      .where(eq(boatDocuments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBoatDocument(id: string): Promise<boolean> {
    const result = await db.delete(boatDocuments).where(eq(boatDocuments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getExpiringDocuments(daysAhead: number): Promise<BoatDocument[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return await db
      .select()
      .from(boatDocuments)
      .where(
        and(
          lte(boatDocuments.expiryDate!, futureDate),
          gte(boatDocuments.expiryDate!, new Date(0)) // has expiry date
        )
      )
      .orderBy(sql`${boatDocuments.expiryDate} ASC`);
  }

  // ===== INVENTORY METHODS =====

  async createInventoryItem(data: InsertInventoryItem): Promise<InventoryItem> {
    const status = this.calculateInventoryStatus(data.availableStock ?? 0, data.minStockAlert ?? 1);
    const [item] = await db
      .insert(inventoryItems)
      .values({
        name: data.name,
        description: data.description || null,
        category: data.category,
        totalStock: data.totalStock ?? 0,
        availableStock: data.availableStock ?? 0,
        pricePerUnit: data.pricePerUnit || null,
        status,
        minStockAlert: data.minStockAlert ?? 1,
        imageUrl: data.imageUrl || null,
      })
      .returning();
    return item;
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .orderBy(sql`${inventoryItems.category} ASC, ${inventoryItems.name} ASC`);
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async updateInventoryItem(id: string, data: UpdateInventoryItem): Promise<InventoryItem | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.totalStock !== undefined) updateData.totalStock = data.totalStock;
    if (data.availableStock !== undefined) updateData.availableStock = data.availableStock;
    if (data.pricePerUnit !== undefined) updateData.pricePerUnit = data.pricePerUnit || null;
    if (data.minStockAlert !== undefined) updateData.minStockAlert = data.minStockAlert;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;

    // Recalculate status
    const current = await this.getInventoryItem(id);
    if (current) {
      const available = (data.availableStock !== undefined ? data.availableStock : current.availableStock) as number;
      const minAlert = (data.minStockAlert !== undefined ? data.minStockAlert : current.minStockAlert) as number;
      updateData.status = this.calculateInventoryStatus(available, minAlert);
    }

    const [updated] = await db
      .update(inventoryItems)
      .set(updateData)
      .where(eq(inventoryItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    // Delete movements first
    await db.delete(inventoryMovements).where(eq(inventoryMovements.itemId, id));
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createInventoryMovement(data: InsertInventoryMovement): Promise<InventoryMovement> {
    const item = await this.getInventoryItem(data.itemId);
    if (!item) throw new Error("Item de inventario no encontrado");

    let newAvailable = item.availableStock;
    let newTotal = item.totalStock;

    if (data.type === "in") {
      newAvailable += data.quantity;
      newTotal += data.quantity;
    } else if (data.type === "out") {
      newAvailable -= data.quantity;
      if (newAvailable < 0) newAvailable = 0;
    } else {
      // adjustment: set available to the quantity
      newAvailable = data.quantity;
      newTotal = data.quantity;
    }

    // Create movement record
    const [movement] = await db
      .insert(inventoryMovements)
      .values({
        itemId: data.itemId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason || null,
        bookingId: data.bookingId || null,
        createdBy: data.createdBy || null,
      })
      .returning();

    // Update item stock
    const status = this.calculateInventoryStatus(newAvailable, item.minStockAlert);
    await db
      .update(inventoryItems)
      .set({
        availableStock: newAvailable,
        totalStock: newTotal,
        status,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, data.itemId));

    return movement;
  }

  async getInventoryMovements(itemId: string): Promise<InventoryMovement[]> {
    return await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.itemId, itemId))
      .orderBy(sql`${inventoryMovements.createdAt} DESC`);
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .where(inArray(inventoryItems.status, ["low_stock", "out_of_stock"]));
  }

  private calculateInventoryStatus(available: number, minAlert: number): string {
    if (available <= 0) return "out_of_stock";
    if (available <= minAlert) return "low_stock";
    return "available";
  }
}

export const storage = new DatabaseStorage();
