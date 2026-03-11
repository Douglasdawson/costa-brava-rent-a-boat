import {
  db, eq, and, or, gte, lte, lt, inArray, sql, isNull, desc,
  boats, bookings, bookingExtras, maintenanceLogs,
  type Boat, type Booking, type InsertBooking,
  type BookingExtra, type InsertBookingExtra,
} from "./base";

/** Lightweight type for social proof notifications — no sensitive data */
export interface SocialProofBooking {
  customerName: string;
  customerNationality: string;
  bookingDate: Date;
  startTime: Date;
  numberOfPeople: number;
  totalHours: number;
  boatId: string;
  boatName: string;
  createdAt: Date;
}
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";

// Boats that share the same physical vessel
const sharedBoatIds: Record<string, string[]> = {
  "pacific-craft-625": ["pacific-craft-625", "excursion-privada"],
  "excursion-privada": ["excursion-privada", "pacific-craft-625"],
};

function getBoatIdsToCheck(boatId: string): string[] {
  return sharedBoatIds[boatId] || [boatId];
}

export async function createBooking(booking: InsertBooking): Promise<Booking> {
  const [newBooking] = await db
    .insert(bookings)
    .values({
      ...booking,
      cancelationToken: booking.cancelationToken ?? randomUUID(),
    })
    .returning();
  return newBooking;
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  return booking || undefined;
}

export async function getBookingsByDate(date: Date): Promise<Booking[]> {
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

export async function getBookingsByBoatAndDateRange(boatId: string, startDate: Date, endDate: Date): Promise<Booking[]> {
  return await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.boatId, boatId),
        gte(bookings.startTime, startDate),
        lte(bookings.endTime, endDate),
        inArray(bookings.bookingStatus, ["hold", "pending_payment", "confirmed"])
      )
    );
}

export async function getOverlappingBookingsWithBuffer(boatId: string, startTime: Date, endTime: Date): Promise<Booking[]> {
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
        lte(bookings.startTime, bufferEnd),
        gte(bookings.endTime, bufferStart),
        inArray(bookings.bookingStatus, ["hold", "pending_payment", "confirmed"])
      )
    );
}

export async function updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
  const [updatedBooking] = await db
    .update(bookings)
    .set(updates)
    .where(eq(bookings.id, id))
    .returning();
  return updatedBooking || undefined;
}

export async function updateBookingPaymentStatus(id: string, status: string, stripePaymentIntentId?: string): Promise<Booking | undefined> {
  const updateData: Record<string, unknown> = { paymentStatus: status };
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

export async function updateBookingWhatsAppStatus(id: string, confirmationSent?: boolean, reminderSent?: boolean): Promise<Booking | undefined> {
  const updateData: Record<string, unknown> = {};
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

export async function getAllBookings(): Promise<Booking[]> {
  return await db.select().from(bookings);
}

export async function getConfirmedBookings(): Promise<Booking[]> {
  return await db
    .select()
    .from(bookings)
    .where(eq(bookings.bookingStatus, "confirmed"));
}

export async function getConfirmedBookingsWithEmail(): Promise<Booking[]> {
  return await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.bookingStatus, "confirmed"),
        sql`${bookings.customerEmail} IS NOT NULL AND ${bookings.customerEmail} != ''`
      )
    );
}

export async function getBookingsByCustomer(customerId: string, email: string | null, phone: string | null): Promise<Booking[]> {
  const conditions = [eq(bookings.customerId, customerId)];
  if (email) conditions.push(eq(bookings.customerEmail, email));
  if (phone) conditions.push(eq(bookings.customerPhone, phone));

  return await db
    .select()
    .from(bookings)
    .where(or(...conditions))
    .orderBy(sql`${bookings.startTime} DESC`);
}

export async function getBookingByCancelationToken(token: string): Promise<Booking | undefined> {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.cancelationToken, token));
  return booking || undefined;
}

export async function cancelBookingByToken(token: string): Promise<{ booking: Booking; refundAmount: number; refundPercentage: number } | undefined> {
  const booking = await getBookingByCancelationToken(token);
  if (!booking) return undefined;

  if (!['confirmed', 'pending_payment'].includes(booking.bookingStatus)) return undefined;

  const hoursUntilStart = (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
  const totalAmount = parseFloat(booking.totalAmount);
  let refundPercentage = 0;
  let refundAmount = 0;
  if (hoursUntilStart >= 48) {
    refundPercentage = 100;
    refundAmount = totalAmount;
  } else if (hoursUntilStart >= 24) {
    refundPercentage = 50;
    refundAmount = Math.round(totalAmount * 0.5 * 100) / 100;
  }

  const [updated] = await db
    .update(bookings)
    .set({
      bookingStatus: 'cancelled',
      refundAmount: refundAmount.toString(),
      refundStatus: refundAmount > 0 ? 'requested' : null,
    })
    .where(
      and(
        eq(bookings.cancelationToken, token),
        inArray(bookings.bookingStatus, ['confirmed', 'pending_payment'])
      )
    )
    .returning();

  if (!updated) return undefined;
  return { booking: updated, refundAmount, refundPercentage };
}

export async function getPaginatedBookings(params: {
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

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(bookings)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const sortColumnSql =
    sortBy === "createdAt" ? sql`${bookings.createdAt}`
    : sortBy === "bookingDate" ? sql`${bookings.bookingDate}`
    : sortBy === "customerName" ? sql`${bookings.customerName}`
    : sortBy === "boatId" ? sql`${bookings.boatId}`
    : sortBy === "totalAmount" ? sql`CAST(${bookings.totalAmount} AS NUMERIC)`
    : sortBy === "bookingStatus" ? sql`${bookings.bookingStatus}`
    : sql`${bookings.startTime}`;

  const orderSql = sortOrder === "asc"
    ? sql`${sortColumnSql} ASC`
    : sql`${sortColumnSql} DESC`;

  const data = await db
    .select()
    .from(bookings)
    .where(whereClause)
    .orderBy(orderSql)
    .limit(limit)
    .offset(offset);

  return { data, total, page, totalPages };
}

export async function getBookingsForCalendar(params: {
  startDate: Date;
  endDate: Date;
  boatId?: string;
}): Promise<Booking[]> {
  const { startDate, endDate, boatId } = params;

  const conditions = [
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
export async function createBookingExtra(extra: InsertBookingExtra): Promise<BookingExtra> {
  const [newExtra] = await db
    .insert(bookingExtras)
    .values(extra)
    .returning();
  return newExtra;
}

export async function getBookingExtras(bookingId: string): Promise<BookingExtra[]> {
  return await db
    .select()
    .from(bookingExtras)
    .where(eq(bookingExtras.bookingId, bookingId));
}

export async function getDailyBookings(boatId: string, date: Date): Promise<Booking[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  const boatIds = getBoatIdsToCheck(boatId);

  return await db
    .select()
    .from(bookings)
    .where(
      and(
        inArray(bookings.boatId, boatIds),
        lte(bookings.startTime, endOfDay),
        gte(bookings.endTime, startOfDay),
        inArray(bookings.bookingStatus, ["hold", "pending_payment", "confirmed"])
      )
    );
}

export async function getMonthlyBookings(boatId: string, year: number, month: number): Promise<Booking[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const boatIds = getBoatIdsToCheck(boatId);

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

export async function checkAvailability(boatId: string, startTime: Date, endTime: Date): Promise<boolean> {
  const isDevelopment = process.env.NODE_ENV === "development";

  const [boat] = await db
    .select({ isActive: boats.isActive })
    .from(boats)
    .where(eq(boats.id, boatId));

  if (!boat || !boat.isActive) {
    if (isDevelopment) {
      logger.debug("Availability check: boat is inactive or not found", { boatId });
    }
    return false;
  }

  const bufferMinutes = isDevelopment ? 5 : 20;
  const bufferStart = new Date(startTime.getTime() - bufferMinutes * 60 * 1000);
  const bufferEnd = new Date(endTime.getTime() + bufferMinutes * 60 * 1000);
  const boatIds = getBoatIdsToCheck(boatId);

  const conflictingBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        inArray(bookings.boatId, boatIds),
        inArray(bookings.bookingStatus, ["hold", "pending_payment", "confirmed"]),
        and(
          lte(bookings.startTime, bufferEnd),
          gte(bookings.endTime, bufferStart)
        )
      )
    );

  if (isDevelopment) {
    logger.debug("Availability check for boat", {
      boatId,
      requested: `${startTime.toISOString()} to ${endTime.toISOString()}`,
      buffer: `${bufferMinutes}min: ${bufferStart.toISOString()} to ${bufferEnd.toISOString()}`,
      conflictingBookings: conflictingBookings.length,
      conflicts: conflictingBookings.map((booking, i) => ({
        index: i + 1,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.bookingStatus,
      })),
    });
  }

  if (conflictingBookings.length > 0) {
    return false;
  }

  const maintenanceConflicts = await db
    .select()
    .from(maintenanceLogs)
    .where(
      and(
        eq(maintenanceLogs.boatId, boatId),
        inArray(maintenanceLogs.status, ["scheduled", "in_progress"]),
        or(
          and(
            lte(maintenanceLogs.date, endTime),
            gte(maintenanceLogs.nextDueDate, startTime)
          ),
          and(
            isNull(maintenanceLogs.nextDueDate),
            gte(maintenanceLogs.date, startTime),
            lte(maintenanceLogs.date, endTime)
          )
        )
      )
    );

  if (isDevelopment) {
    logger.debug("Availability check maintenance conflicts", {
      boatId,
      maintenanceConflicts: maintenanceConflicts.length,
      conflicts: maintenanceConflicts.map((log, i) => ({
        index: i + 1,
        date: log.date.toISOString(),
        nextDueDate: log.nextDueDate ? log.nextDueDate.toISOString() : null,
        status: log.status,
      })),
    });
  }

  return maintenanceConflicts.length === 0;
}

/**
 * Atomically check availability and create a hold booking.
 * Uses a serializable transaction to prevent TOCTOU race conditions
 * where two concurrent requests both pass availability check.
 */
export async function checkAvailabilityAndCreateBooking(
  boatId: string,
  startTime: Date,
  endTime: Date,
  bookingData: InsertBooking
): Promise<{ available: true; booking: Booking } | { available: false; booking: null }> {
  const isDevelopment = process.env.NODE_ENV === "development";
  const bufferMinutes = isDevelopment ? 5 : 20;
  const bufferStart = new Date(startTime.getTime() - bufferMinutes * 60 * 1000);
  const bufferEnd = new Date(endTime.getTime() + bufferMinutes * 60 * 1000);
  const boatIds = getBoatIdsToCheck(boatId);

  return await db.transaction(async (tx) => {
    // Lock: SELECT FOR UPDATE on conflicting bookings to serialize concurrent requests
    const conflictingBookings = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          inArray(bookings.boatId, boatIds),
          inArray(bookings.bookingStatus, ["hold", "pending_payment", "confirmed"]),
          and(
            lte(bookings.startTime, bufferEnd),
            gte(bookings.endTime, bufferStart)
          )
        )
      )
      .for("update");

    if (conflictingBookings.length > 0) {
      return { available: false as const, booking: null };
    }

    // Check maintenance conflicts
    const maintenanceConflicts = await tx
      .select({ id: maintenanceLogs.id })
      .from(maintenanceLogs)
      .where(
        and(
          eq(maintenanceLogs.boatId, boatId),
          inArray(maintenanceLogs.status, ["scheduled", "in_progress"]),
          or(
            and(
              lte(maintenanceLogs.date, endTime),
              gte(maintenanceLogs.nextDueDate, startTime)
            ),
            and(
              isNull(maintenanceLogs.nextDueDate),
              gte(maintenanceLogs.date, startTime),
              lte(maintenanceLogs.date, endTime)
            )
          )
        )
      );

    if (maintenanceConflicts.length > 0) {
      return { available: false as const, booking: null };
    }

    // Create the booking within the same transaction
    const [newBooking] = await tx
      .insert(bookings)
      .values({
        ...bookingData,
        cancelationToken: bookingData.cancelationToken ?? randomUUID(),
      })
      .returning();

    return { available: true as const, booking: newBooking };
  });
}

export async function cleanupExpiredHolds(): Promise<number> {
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

// ===== EMAIL / SCHEDULER METHODS =====

export async function getUpcomingBookingsForReminder(hoursAhead: number): Promise<Booking[]> {
  const now = new Date();
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

export async function getCompletedBookingsForThankYou(hoursAfter: number): Promise<Booking[]> {
  const now = new Date();
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

export async function autoCompleteBookings(): Promise<number> {
  const now = new Date();
  const result = await db
    .update(bookings)
    .set({ bookingStatus: "completed" })
    .where(
      and(
        eq(bookings.bookingStatus, "confirmed"),
        lt(bookings.endTime, now)
      )
    )
    .returning({ id: bookings.id });
  return result.length;
}

export async function isRepeatCustomer(email: string): Promise<boolean> {
  const result = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.customerEmail, email.toLowerCase().trim()),
        eq(bookings.bookingStatus, "confirmed")
      )
    )
    .limit(2);

  return result.length > 1;
}

export async function updateBookingEmailStatus(id: string, reminderSent?: boolean, thankYouSent?: boolean): Promise<Booking | undefined> {
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

export async function updateBookingWhatsAppThankYouStatus(id: string, sent: boolean): Promise<void> {
  await db
    .update(bookings)
    .set({ whatsappThankYouSent: sent })
    .where(eq(bookings.id, id));
}

// ===== SOCIAL PROOF =====

export async function getRecentSocialProofBookings(): Promise<SocialProofBooking[]> {
  const now = new Date();
  const rows = await db
    .select({
      customerName: bookings.customerName,
      customerNationality: bookings.customerNationality,
      bookingDate: bookings.bookingDate,
      startTime: bookings.startTime,
      numberOfPeople: bookings.numberOfPeople,
      totalHours: bookings.totalHours,
      boatId: bookings.boatId,
      boatName: boats.name,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(boats, eq(bookings.boatId, boats.id))
    .where(
      and(
        eq(bookings.bookingStatus, "confirmed"),
        gte(bookings.bookingDate, now)
      )
    )
    .orderBy(desc(bookings.createdAt))
    .limit(20);

  return rows;
}
