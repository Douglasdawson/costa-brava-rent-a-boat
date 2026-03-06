import {
  db, eq, and, gte, lte, inArray, sql,
  boats, bookings,
} from "./base";

export async function getDashboardStats(startDate: Date, endDate: Date): Promise<{
  bookingsCount: number;
  revenue: number;
  confirmedBookings: number;
  pendingBookings: number;
}> {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  const bookingsInRange = await db
    .select()
    .from(bookings)
    .where(
      and(
        gte(bookings.bookingDate, start),
        lte(bookings.bookingDate, end),
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

export async function getFleetAvailability(): Promise<{
  totalBoats: number;
  availableBoats: number;
}> {
  const allBoats = await db.select().from(boats).where(eq(boats.isActive, true));
  const now = new Date();

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

export async function getDashboardStatsEnhanced(startDate: Date, endDate: Date): Promise<{
  bookingsCount: number;
  revenue: number;
  confirmedBookings: number;
  pendingBookings: number;
  previousPeriodRevenue: number;
  previousPeriodBookings: number;
  averageTicket: number;
  previousAverageTicket: number;
}> {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  const currentStats = await getDashboardStats(start, end);

  const periodMs = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - periodMs);
  const prevEnd = new Date(start.getTime() - 1);

  const prevStats = await getDashboardStats(prevStart, prevEnd);

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

export async function getRevenueTrend(period: "30d" | "90d" | "365d"): Promise<Array<{
  date: string;
  revenue: number;
  bookings: number;
}>> {
  const now = new Date();
  let startDate: Date;
  let groupByWeek = false;

  switch (period) {
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      groupByWeek = true;
      break;
    case "365d":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      groupByWeek = true;
      break;
    case "30d":
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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

  const grouped = new Map<string, { revenue: number; bookings: number }>();

  if (groupByWeek) {
    for (const b of allBookings) {
      const d = new Date(b.bookingDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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

export async function getBoatsPerformance(period: "month" | "season" | "year"): Promise<Array<{
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
    case "season":
      startDate = new Date(now.getFullYear(), 3, 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "month":
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
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

  const totalDaysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const operatingHoursPerDay = 10;
  const totalAvailableHours = totalDaysInPeriod * operatingHoursPerDay;

  const bookingsByBoat = new Map<string, typeof periodBookings>();
  for (const b of periodBookings) {
    if (!bookingsByBoat.has(b.boatId)) bookingsByBoat.set(b.boatId, []);
    bookingsByBoat.get(b.boatId)!.push(b);
  }

  return allBoats.map(boat => {
    const boatBookings = bookingsByBoat.get(boat.id) || [];
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
      utilization: Math.min(utilization, 100),
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

export async function getStatusDistribution(startDate: Date, endDate: Date): Promise<{
  confirmed: number;
  pending_payment: number;
  hold: number;
  cancelled: number;
  completed: number;
  draft: number;
}> {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  const allBookingsInRange = await db
    .select()
    .from(bookings)
    .where(
      and(
        gte(bookings.bookingDate, start),
        lte(bookings.bookingDate, end)
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
