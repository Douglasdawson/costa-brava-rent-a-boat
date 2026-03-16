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

  const { rows: statsRows } = await db.execute(sql`
    SELECT
      COUNT(*)::int AS bookings_count,
      COALESCE(SUM(CASE WHEN booking_status = 'confirmed' THEN total_amount::numeric ELSE 0 END), 0) AS revenue,
      COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END)::int AS confirmed_bookings,
      COUNT(CASE WHEN booking_status = 'pending_payment' THEN 1 END)::int AS pending_bookings
    FROM bookings
    WHERE booking_date >= ${start}
      AND booking_date <= ${end}
      AND booking_status IN ('confirmed', 'pending_payment')
  `);
  const result = statsRows[0] as Record<string, unknown>;

  return {
    bookingsCount: Number(result.bookings_count) || 0,
    revenue: Math.round(Number(result.revenue) * 100) / 100,
    confirmedBookings: Number(result.confirmed_bookings) || 0,
    pendingBookings: Number(result.pending_bookings) || 0,
  };
}

export async function getFleetAvailability(): Promise<{
  totalBoats: number;
  availableBoats: number;
}> {
  const now = new Date();

  const { rows: fleetRows } = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM boats WHERE is_active = true) AS total_boats,
      (
        SELECT COUNT(*)::int FROM boats
        WHERE is_active = true
          AND id NOT IN (
            SELECT DISTINCT boat_id FROM bookings
            WHERE start_time <= ${now}
              AND end_time >= ${now}
              AND booking_status IN ('confirmed', 'pending_payment')
          )
      ) AS available_boats
  `);
  const result = fleetRows[0] as Record<string, unknown>;

  return {
    totalBoats: Number(result.total_boats) || 0,
    availableBoats: Number(result.available_boats) || 0,
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

  // Use date_trunc for grouping at SQL level
  const truncUnit = groupByWeek ? "week" : "day";

  const { rows: trendRows } = await db.execute(sql`
    SELECT
      date_trunc(${truncUnit}, booking_date)::date::text AS period_date,
      COALESCE(SUM(CASE WHEN booking_status = 'confirmed' THEN total_amount::numeric ELSE 0 END), 0) AS revenue,
      COUNT(*)::int AS bookings
    FROM bookings
    WHERE booking_date >= ${startDate}
      AND booking_date <= ${now}
      AND booking_status IN ('confirmed', 'pending_payment')
    GROUP BY 1
    ORDER BY 1
  `);

  // Build a lookup from the SQL results
  const dataMap = new Map<string, { revenue: number; bookings: number }>();
  for (const row of trendRows) {
    const r = row as { period_date: string; revenue: string | number; bookings: number };
    dataMap.set(r.period_date, {
      revenue: Math.round(Number(r.revenue) * 100) / 100,
      bookings: Number(r.bookings),
    });
  }

  // Fill in all dates/weeks in the range to maintain the same output shape
  const result: Array<{ date: string; revenue: number; bookings: number }> = [];
  const cursor = new Date(startDate);
  const stepDays = groupByWeek ? 7 : 1;

  // For weekly grouping, align cursor to Monday (same as date_trunc('week') in PostgreSQL)
  if (groupByWeek) {
    const day = cursor.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    cursor.setDate(cursor.getDate() + diff);
  }

  while (cursor <= now) {
    const key = cursor.toISOString().split("T")[0];
    const entry = dataMap.get(key) || { revenue: 0, bookings: 0 };
    result.push({
      date: key,
      revenue: entry.revenue,
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

  const totalDaysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const operatingHoursPerDay = 10;
  const totalAvailableHours = totalDaysInPeriod * operatingHoursPerDay;

  // Single query: join boats with aggregated booking stats
  const { rows: boatRows } = await db.execute(sql`
    SELECT
      b.id AS boat_id,
      b.name AS boat_name,
      COALESCE(SUM(CASE WHEN bk.booking_status = 'confirmed' THEN bk.total_amount::numeric ELSE 0 END), 0) AS revenue,
      COUNT(bk.id)::int AS bookings,
      COALESCE(SUM(bk.total_hours), 0)::int AS hours
    FROM boats b
    LEFT JOIN bookings bk
      ON bk.boat_id = b.id
      AND bk.booking_date >= ${startDate}
      AND bk.booking_date <= ${now}
      AND bk.booking_status IN ('confirmed', 'pending_payment')
    WHERE b.is_active = true
    GROUP BY b.id, b.name
    ORDER BY revenue DESC
  `);

  return (boatRows as unknown as Array<{
    boat_id: string;
    boat_name: string;
    revenue: string | number;
    bookings: number;
    hours: number;
  }>).map(row => {
    const hours = Number(row.hours);
    const utilization = totalAvailableHours > 0
      ? Math.round((hours / totalAvailableHours) * 100)
      : 0;

    return {
      boatId: row.boat_id,
      boatName: row.boat_name,
      revenue: Math.round(Number(row.revenue) * 100) / 100,
      bookings: Number(row.bookings),
      hours,
      utilization: Math.min(utilization, 100),
    };
  });
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

  const { rows: statusRows } = await db.execute(sql`
    SELECT
      booking_status,
      COUNT(*)::int AS cnt
    FROM bookings
    WHERE booking_date >= ${start}
      AND booking_date <= ${end}
    GROUP BY booking_status
  `);

  const distribution = {
    confirmed: 0,
    pending_payment: 0,
    hold: 0,
    cancelled: 0,
    completed: 0,
    draft: 0,
  };

  for (const row of statusRows) {
    const r = row as { booking_status: string; cnt: number };
    const status = r.booking_status as keyof typeof distribution;
    if (status in distribution) {
      distribution[status] = Number(r.cnt);
    }
  }

  return distribution;
}
