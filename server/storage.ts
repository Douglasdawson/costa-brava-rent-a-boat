import { 
  adminUsers, customerUsers, customers, boats, bookings, bookingExtras,
  type AdminUser, type InsertAdminUser,
  type CustomerUser, type UpsertCustomerUser,
  type Customer, type InsertCustomer,
  type Boat, type InsertBoat,
  type Booking, type InsertBooking,
  type BookingExtra, type InsertBookingExtra
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, between, inArray } from "drizzle-orm";
import memoize from "memoizee";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Admin User methods (CRM access)
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;

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

  // Booking extras methods
  createBookingExtra(extra: InsertBookingExtra): Promise<BookingExtra>;
  getBookingExtras(bookingId: string): Promise<BookingExtra[]>;

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
  
  getFleetAvailability(): Promise<{
    totalBoats: number;
    availableBoats: number;
  }>;
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

  // Availability check with 20-minute buffer
  async checkAvailability(boatId: string, startTime: Date, endTime: Date): Promise<boolean> {
    // In development mode, be more permissive to allow testing
    const isDevelopment = process.env.NODE_ENV === "development";
    
    // Reduce buffer in development for easier testing
    const bufferMinutes = isDevelopment ? 5 : 20;
    const bufferStart = new Date(startTime.getTime() - bufferMinutes * 60 * 1000);
    const bufferEnd = new Date(endTime.getTime() + bufferMinutes * 60 * 1000);

    const conflictingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.boatId, boatId),
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
}

export const storage = new DatabaseStorage();
