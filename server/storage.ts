import { 
  users, boats, bookings, bookingExtras,
  type User, type InsertUser,
  type Boat, type InsertBoat,
  type Booking, type InsertBooking,
  type BookingExtra, type InsertBookingExtra
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, between } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Boat methods
  getAllBoats(): Promise<Boat[]>;
  getBoat(id: string): Promise<Boat | undefined>;
  createBoat(boat: InsertBoat): Promise<Boat>;
  updateBoat(id: string, boat: Partial<InsertBoat>): Promise<Boat | undefined>;

  // Booking methods
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByDate(date: Date): Promise<Booking[]>;
  getBookingsByBoatAndDateRange(boatId: string, startDate: Date, endDate: Date): Promise<Booking[]>;
  updateBookingPaymentStatus(id: string, status: string, stripePaymentIntentId?: string): Promise<Booking | undefined>;
  updateBookingWhatsAppStatus(id: string, confirmationSent?: boolean, reminderSent?: boolean): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;

  // Booking extras methods
  createBookingExtra(extra: InsertBookingExtra): Promise<BookingExtra>;
  getBookingExtras(bookingId: string): Promise<BookingExtra[]>;

  // Availability check
  checkAvailability(boatId: string, startTime: Date, endTime: Date): Promise<boolean>;
}

// rewrite MemStorage to DatabaseStorage
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Boat methods
  async getAllBoats(): Promise<Boat[]> {
    return await db.select().from(boats).where(eq(boats.isActive, true));
  }

  async getBoat(id: string): Promise<Boat | undefined> {
    const [boat] = await db.select().from(boats).where(eq(boats.id, id));
    return boat || undefined;
  }

  async createBoat(boat: InsertBoat): Promise<Boat> {
    const [newBoat] = await db
      .insert(boats)
      .values(boat)
      .returning();
    return newBoat;
  }

  async updateBoat(id: string, boat: Partial<InsertBoat>): Promise<Boat | undefined> {
    const [updatedBoat] = await db
      .update(boats)
      .set(boat)
      .where(eq(boats.id, id))
      .returning();
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
          eq(bookings.bookingStatus, "confirmed")
        )
      );
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
    // Add 20-minute buffer before and after
    const bufferStart = new Date(startTime.getTime() - 20 * 60 * 1000);
    const bufferEnd = new Date(endTime.getTime() + 20 * 60 * 1000);

    const conflictingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.boatId, boatId),
          eq(bookings.bookingStatus, "confirmed"),
          // Check for any overlap with buffer times
          and(
            lte(bookings.startTime, bufferEnd),
            gte(bookings.endTime, bufferStart)
          )
        )
      );

    return conflictingBookings.length === 0;
  }
}

export const storage = new DatabaseStorage();
