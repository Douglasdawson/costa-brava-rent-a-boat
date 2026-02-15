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
  type DiscountCode, type InsertDiscountCode
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, between, inArray, sql, or, isNull } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
