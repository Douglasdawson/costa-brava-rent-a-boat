import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { eq, and, gte, lte, desc, sql, count, sum, or, ilike } from "drizzle-orm";
import { db } from "./shared/db";
import * as schema from "../../shared/schema";

// ---------------------------------------------------------------------------
// Timezone helper: get current time anchored to Europe/Madrid
// ---------------------------------------------------------------------------

function madridNow(): Date {
  const now = new Date();
  return now;
}

function madridStartOfDay(dateStr?: string): Date {
  // Build an ISO string representing midnight in Madrid, then convert to UTC
  const target = dateStr ? new Date(dateStr) : new Date();
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(target.getDate()).padStart(2, "0");
  // Create a date string in Madrid timezone
  const madridMidnight = new Date(`${yyyy}-${mm}-${dd}T00:00:00+01:00`);
  // During CEST (last Sunday of March to last Sunday of October) offset is +02:00
  // Use Intl to determine current offset
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(target);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  // Get the offset by comparing local representation
  const madridDateStr = `${year}-${month}-${day}T00:00:00`;
  const utcEquivalent = new Date(madridDateStr + "Z");
  // Calculate offset: Madrid time = UTC + offset
  const sampleDate = new Date(`${year}-${month}-${day}T12:00:00Z`);
  const madridHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      hour12: false,
    }).format(sampleDate)
  );
  const utcHour = sampleDate.getUTCHours();
  const offsetHours = madridHour - utcHour;
  // Midnight in Madrid = midnight - offset in UTC
  const result = new Date(utcEquivalent.getTime() - offsetHours * 60 * 60 * 1000);
  return result;
}

function madridEndOfDay(dateStr?: string): Date {
  const start = madridStartOfDay(dateStr);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function madridToday(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
  });
  return formatter.format(new Date()); // Returns YYYY-MM-DD
}

function getWeekStart(): Date {
  const today = madridToday();
  const d = new Date(today);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = start of week
  d.setDate(d.getDate() - diff);
  return madridStartOfDay(d.toISOString().split("T")[0]);
}

function getMonthStart(): Date {
  const today = madridToday();
  const [y, m] = today.split("-");
  return madridStartOfDay(`${y}-${m}-01`);
}

function getSeasonStart(): Date {
  // Season runs April - October; use April 1 of current year
  const today = madridToday();
  const year = today.split("-")[0];
  return madridStartOfDay(`${year}-04-01`);
}

function getPeriodRange(period: "today" | "week" | "month" | "season"): {
  start: Date;
  end: Date;
} {
  const todayStr = madridToday();
  switch (period) {
    case "today":
      return { start: madridStartOfDay(todayStr), end: madridEndOfDay(todayStr) };
    case "week":
      return { start: getWeekStart(), end: madridEndOfDay(todayStr) };
    case "month":
      return { start: getMonthStart(), end: madridEndOfDay(todayStr) };
    case "season":
      return { start: getSeasonStart(), end: madridEndOfDay(todayStr) };
  }
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatBooking(b: typeof schema.bookings.$inferSelect, boatName?: string) {
  return {
    id: b.id,
    boat: boatName ?? b.boatId,
    date: b.bookingDate?.toISOString().split("T")[0] ?? null,
    startTime: b.startTime?.toISOString() ?? null,
    endTime: b.endTime?.toISOString() ?? null,
    customer: `${b.customerName} ${b.customerSurname}`.trim(),
    phone: b.customerPhone,
    email: b.customerEmail,
    nationality: b.customerNationality,
    people: b.numberOfPeople,
    hours: b.totalHours,
    totalAmount: b.totalAmount ? `${b.totalAmount} EUR` : null,
    deposit: b.deposit ? `${b.deposit} EUR` : null,
    paymentStatus: b.paymentStatus,
    bookingStatus: b.bookingStatus,
    source: b.source,
    notes: b.notes,
    createdAt: b.createdAt?.toISOString() ?? null,
  };
}

function formatCustomer(c: typeof schema.crmCustomers.$inferSelect) {
  return {
    id: c.id,
    name: `${c.name} ${c.surname}`.trim(),
    email: c.email,
    phone: c.phone,
    nationality: c.nationality,
    segment: c.segment,
    totalBookings: c.totalBookings,
    totalSpent: c.totalSpent ? `${c.totalSpent} EUR` : "0 EUR",
    firstBooking: c.firstBookingDate?.toISOString().split("T")[0] ?? null,
    lastBooking: c.lastBookingDate?.toISOString().split("T")[0] ?? null,
  };
}

// ---------------------------------------------------------------------------
// MCP Server Setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "costa-brava-rent-a-boat",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// 1. get_today_bookings
// ---------------------------------------------------------------------------

server.tool(
  "get_today_bookings",
  "Get all bookings for today. Optionally filter by booking status.",
  {
    status: z
      .string()
      .optional()
      .describe(
        "Filter by booking status: draft, hold, pending_payment, confirmed, cancelled, completed"
      ),
  },
  async ({ status }) => {
    const todayStr = madridToday();
    const dayStart = madridStartOfDay(todayStr);
    const dayEnd = madridEndOfDay(todayStr);

    const conditions = [
      gte(schema.bookings.startTime, dayStart),
      lte(schema.bookings.startTime, dayEnd),
    ];
    if (status) {
      conditions.push(eq(schema.bookings.bookingStatus, status));
    }

    const results = await db
      .select({
        booking: schema.bookings,
        boatName: schema.boats.name,
      })
      .from(schema.bookings)
      .leftJoin(schema.boats, eq(schema.bookings.boatId, schema.boats.id))
      .where(and(...conditions))
      .orderBy(schema.bookings.startTime);

    const bookings = results.map((r) =>
      formatBooking(r.booking, r.boatName ?? undefined)
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              date: todayStr,
              totalBookings: bookings.length,
              filterStatus: status ?? "all",
              bookings,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 2. get_bookings_range
// ---------------------------------------------------------------------------

server.tool(
  "get_bookings_range",
  "Get bookings within a date range. Optionally filter by status or boat.",
  {
    startDate: z.string().describe("Start date in ISO format (YYYY-MM-DD)"),
    endDate: z.string().describe("End date in ISO format (YYYY-MM-DD)"),
    status: z
      .string()
      .optional()
      .describe("Filter by booking status"),
    boatId: z.string().optional().describe("Filter by boat ID"),
  },
  async ({ startDate, endDate, status, boatId }) => {
    const start = madridStartOfDay(startDate);
    const end = madridEndOfDay(endDate);

    const conditions = [
      gte(schema.bookings.startTime, start),
      lte(schema.bookings.startTime, end),
    ];
    if (status) {
      conditions.push(eq(schema.bookings.bookingStatus, status));
    }
    if (boatId) {
      conditions.push(eq(schema.bookings.boatId, boatId));
    }

    const results = await db
      .select({
        booking: schema.bookings,
        boatName: schema.boats.name,
      })
      .from(schema.bookings)
      .leftJoin(schema.boats, eq(schema.bookings.boatId, schema.boats.id))
      .where(and(...conditions))
      .orderBy(schema.bookings.startTime);

    const bookings = results.map((r) =>
      formatBooking(r.booking, r.boatName ?? undefined)
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              range: { from: startDate, to: endDate },
              totalBookings: bookings.length,
              filters: { status: status ?? "all", boatId: boatId ?? "all" },
              bookings,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 3. get_availability
// ---------------------------------------------------------------------------

server.tool(
  "get_availability",
  "Check boat availability for a specific date. Returns booked time slots and free hours.",
  {
    boatId: z.string().describe("The boat ID to check"),
    date: z.string().describe("Date in ISO format (YYYY-MM-DD)"),
  },
  async ({ boatId, date }) => {
    const dayStart = madridStartOfDay(date);
    const dayEnd = madridEndOfDay(date);

    // Fetch the boat
    const [boat] = await db
      .select()
      .from(schema.boats)
      .where(eq(schema.boats.id, boatId))
      .limit(1);

    if (!boat) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Boat ${boatId} not found` }),
          },
        ],
      };
    }

    // Fetch active bookings for that day (not cancelled/draft)
    const activeBookings = await db
      .select()
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.boatId, boatId),
          gte(schema.bookings.startTime, dayStart),
          lte(schema.bookings.startTime, dayEnd),
          sql`${schema.bookings.bookingStatus} IN ('hold', 'pending_payment', 'confirmed')`
        )
      )
      .orderBy(schema.bookings.startTime);

    const bookedSlots = activeBookings.map((b) => ({
      start: b.startTime?.toISOString() ?? null,
      end: b.endTime?.toISOString() ?? null,
      status: b.bookingStatus,
      customer: `${b.customerName} ${b.customerSurname}`.trim(),
    }));

    // Operating hours: 10:00 - 20:00 Madrid time (typical)
    const operatingHours = { open: "10:00", close: "20:00" };
    const totalOperatingHours = 10;
    const bookedHours = activeBookings.reduce(
      (sum, b) => sum + (b.totalHours ?? 0),
      0
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              boat: { id: boat.id, name: boat.name, capacity: boat.capacity },
              date,
              operatingHours,
              bookedSlots,
              summary: {
                totalSlots: bookedSlots.length,
                bookedHours,
                availableHours: Math.max(0, totalOperatingHours - bookedHours),
                isFullyBooked: bookedHours >= totalOperatingHours,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 4. get_fleet_status
// ---------------------------------------------------------------------------

server.tool(
  "get_fleet_status",
  "Get current status of all active boats with today's booking counts.",
  {},
  async () => {
    const todayStr = madridToday();
    const dayStart = madridStartOfDay(todayStr);
    const dayEnd = madridEndOfDay(todayStr);

    const allBoats = await db
      .select()
      .from(schema.boats)
      .where(eq(schema.boats.isActive, true))
      .orderBy(schema.boats.displayOrder);

    // Get today's bookings grouped by boat
    const todayBookings = await db
      .select({
        boatId: schema.bookings.boatId,
        count: count(),
        totalRevenue: sum(schema.bookings.totalAmount),
      })
      .from(schema.bookings)
      .where(
        and(
          gte(schema.bookings.startTime, dayStart),
          lte(schema.bookings.startTime, dayEnd),
          sql`${schema.bookings.bookingStatus} IN ('confirmed', 'completed')`
        )
      )
      .groupBy(schema.bookings.boatId);

    const bookingMap = new Map(
      todayBookings.map((b) => [
        b.boatId,
        { count: Number(b.count), revenue: b.totalRevenue ?? "0" },
      ])
    );

    const fleet = allBoats.map((boat) => {
      const stats = bookingMap.get(boat.id) ?? { count: 0, revenue: "0" };
      return {
        id: boat.id,
        name: boat.name,
        capacity: boat.capacity,
        requiresLicense: boat.requiresLicense,
        deposit: boat.deposit ? `${boat.deposit} EUR` : null,
        todayBookings: stats.count,
        todayRevenue: `${stats.revenue} EUR`,
      };
    });

    const totalBookingsToday = fleet.reduce((s, b) => s + b.todayBookings, 0);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              date: todayStr,
              activeBoats: fleet.length,
              totalBookingsToday,
              fleet,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 5. search_customer
// ---------------------------------------------------------------------------

server.tool(
  "search_customer",
  "Search CRM customers by name, email, or phone number.",
  {
    query: z.string().describe("Search query (name, email, or phone)"),
  },
  async ({ query }) => {
    const searchPattern = `%${query}%`;

    const results = await db
      .select()
      .from(schema.crmCustomers)
      .where(
        or(
          ilike(schema.crmCustomers.name, searchPattern),
          ilike(schema.crmCustomers.surname, searchPattern),
          ilike(schema.crmCustomers.email, searchPattern),
          ilike(schema.crmCustomers.phone, searchPattern)
        )
      )
      .orderBy(desc(schema.crmCustomers.lastBookingDate))
      .limit(20);

    const customers = results.map(formatCustomer);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              query,
              resultsCount: customers.length,
              customers,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 6. get_customer_history
// ---------------------------------------------------------------------------

server.tool(
  "get_customer_history",
  "Get full booking history for a CRM customer.",
  {
    customerId: z.string().describe("The CRM customer ID"),
  },
  async ({ customerId }) => {
    // Get customer details
    const [customer] = await db
      .select()
      .from(schema.crmCustomers)
      .where(eq(schema.crmCustomers.id, customerId))
      .limit(1);

    if (!customer) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Customer ${customerId} not found` }),
          },
        ],
      };
    }

    // Find bookings by matching phone or email
    const conditions = [];
    if (customer.phone) {
      conditions.push(eq(schema.bookings.customerPhone, customer.phone));
    }
    if (customer.email) {
      conditions.push(eq(schema.bookings.customerEmail, customer.email));
    }

    let bookingResults: Array<{
      booking: typeof schema.bookings.$inferSelect;
      boatName: string | null;
    }> = [];

    if (conditions.length > 0) {
      bookingResults = await db
        .select({
          booking: schema.bookings,
          boatName: schema.boats.name,
        })
        .from(schema.bookings)
        .leftJoin(schema.boats, eq(schema.bookings.boatId, schema.boats.id))
        .where(or(...conditions))
        .orderBy(desc(schema.bookings.startTime))
        .limit(50);
    }

    const bookings = bookingResults.map((r) =>
      formatBooking(r.booking, r.boatName ?? undefined)
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              customer: formatCustomer(customer),
              bookingsCount: bookings.length,
              bookings,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 7. get_revenue_summary
// ---------------------------------------------------------------------------

server.tool(
  "get_revenue_summary",
  "Get revenue summary for a given period (today, week, month, or season).",
  {
    period: z
      .enum(["today", "week", "month", "season"])
      .describe("Time period for the summary"),
  },
  async ({ period }) => {
    const { start, end } = getPeriodRange(period);

    // Only count confirmed/completed bookings for revenue
    const [revenue] = await db
      .select({
        totalRevenue: sum(schema.bookings.totalAmount),
        totalDeposits: sum(schema.bookings.deposit),
        totalExtras: sum(schema.bookings.extrasTotal),
        bookingCount: count(),
      })
      .from(schema.bookings)
      .where(
        and(
          gte(schema.bookings.startTime, start),
          lte(schema.bookings.startTime, end),
          sql`${schema.bookings.bookingStatus} IN ('confirmed', 'completed')`
        )
      );

    // Revenue by boat
    const byBoat = await db
      .select({
        boatId: schema.bookings.boatId,
        boatName: schema.boats.name,
        revenue: sum(schema.bookings.totalAmount),
        bookings: count(),
      })
      .from(schema.bookings)
      .leftJoin(schema.boats, eq(schema.bookings.boatId, schema.boats.id))
      .where(
        and(
          gte(schema.bookings.startTime, start),
          lte(schema.bookings.startTime, end),
          sql`${schema.bookings.bookingStatus} IN ('confirmed', 'completed')`
        )
      )
      .groupBy(schema.bookings.boatId, schema.boats.name)
      .orderBy(desc(sum(schema.bookings.totalAmount)));

    // Revenue by payment status
    const byPayment = await db
      .select({
        paymentStatus: schema.bookings.paymentStatus,
        total: sum(schema.bookings.totalAmount),
        count: count(),
      })
      .from(schema.bookings)
      .where(
        and(
          gte(schema.bookings.startTime, start),
          lte(schema.bookings.startTime, end),
          sql`${schema.bookings.bookingStatus} IN ('confirmed', 'completed')`
        )
      )
      .groupBy(schema.bookings.paymentStatus);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              period,
              range: {
                from: start.toISOString().split("T")[0],
                to: end.toISOString().split("T")[0],
              },
              totals: {
                revenue: `${revenue.totalRevenue ?? "0"} EUR`,
                deposits: `${revenue.totalDeposits ?? "0"} EUR`,
                extras: `${revenue.totalExtras ?? "0"} EUR`,
                confirmedBookings: Number(revenue.bookingCount),
              },
              byBoat: byBoat.map((b) => ({
                boat: b.boatName ?? b.boatId,
                revenue: `${b.revenue ?? "0"} EUR`,
                bookings: Number(b.bookings),
              })),
              byPaymentStatus: byPayment.map((p) => ({
                status: p.paymentStatus,
                total: `${p.total ?? "0"} EUR`,
                count: Number(p.count),
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 8. get_booking_stats
// ---------------------------------------------------------------------------

server.tool(
  "get_booking_stats",
  "Get booking statistics for a given period (counts by status, source, nationality).",
  {
    period: z
      .enum(["today", "week", "month", "season"])
      .describe("Time period for statistics"),
  },
  async ({ period }) => {
    const { start, end } = getPeriodRange(period);

    const baseCondition = and(
      gte(schema.bookings.startTime, start),
      lte(schema.bookings.startTime, end)
    );

    // By status
    const byStatus = await db
      .select({
        status: schema.bookings.bookingStatus,
        count: count(),
      })
      .from(schema.bookings)
      .where(baseCondition)
      .groupBy(schema.bookings.bookingStatus);

    // By source
    const bySource = await db
      .select({
        source: schema.bookings.source,
        count: count(),
      })
      .from(schema.bookings)
      .where(baseCondition)
      .groupBy(schema.bookings.source);

    // By nationality (top 10)
    const byNationality = await db
      .select({
        nationality: schema.bookings.customerNationality,
        count: count(),
      })
      .from(schema.bookings)
      .where(baseCondition)
      .groupBy(schema.bookings.customerNationality)
      .orderBy(desc(count()))
      .limit(10);

    // Average booking value
    const [avgStats] = await db
      .select({
        avgAmount: sql<string>`ROUND(AVG(${schema.bookings.totalAmount}::numeric), 2)`,
        avgHours: sql<string>`ROUND(AVG(${schema.bookings.totalHours}), 1)`,
        avgPeople: sql<string>`ROUND(AVG(${schema.bookings.numberOfPeople}), 1)`,
        totalBookings: count(),
      })
      .from(schema.bookings)
      .where(
        and(
          baseCondition,
          sql`${schema.bookings.bookingStatus} NOT IN ('draft', 'cancelled')`
        )
      );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              period,
              range: {
                from: start.toISOString().split("T")[0],
                to: end.toISOString().split("T")[0],
              },
              totalBookings: Number(avgStats.totalBookings),
              averages: {
                bookingValue: `${avgStats.avgAmount ?? "0"} EUR`,
                duration: `${avgStats.avgHours ?? "0"} hours`,
                groupSize: `${avgStats.avgPeople ?? "0"} people`,
              },
              byStatus: byStatus.map((s) => ({
                status: s.status,
                count: Number(s.count),
              })),
              bySource: bySource.map((s) => ({
                source: s.source,
                count: Number(s.count),
              })),
              topNationalities: byNationality.map((n) => ({
                nationality: n.nationality ?? "unknown",
                count: Number(n.count),
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 9. get_pending_payments
// ---------------------------------------------------------------------------

server.tool(
  "get_pending_payments",
  "Get all bookings with pending payment status that are confirmed or pending_payment.",
  {},
  async () => {
    const results = await db
      .select({
        booking: schema.bookings,
        boatName: schema.boats.name,
      })
      .from(schema.bookings)
      .leftJoin(schema.boats, eq(schema.bookings.boatId, schema.boats.id))
      .where(
        and(
          eq(schema.bookings.paymentStatus, "pending"),
          sql`${schema.bookings.bookingStatus} IN ('pending_payment', 'confirmed')`
        )
      )
      .orderBy(schema.bookings.startTime);

    const bookings = results.map((r) =>
      formatBooking(r.booking, r.boatName ?? undefined)
    );

    const totalPending = bookings.reduce((sum, b) => {
      const amount = parseFloat(b.totalAmount?.replace(" EUR", "") ?? "0");
      return sum + amount;
    }, 0);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              pendingCount: bookings.length,
              totalPendingAmount: `${totalPending.toFixed(2)} EUR`,
              bookings,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 10. get_upcoming_reminders
// ---------------------------------------------------------------------------

server.tool(
  "get_upcoming_reminders",
  "Get confirmed bookings starting within the next N hours. Useful for sending reminders.",
  {
    hours: z
      .number()
      .default(24)
      .describe("Look-ahead window in hours (default: 24)"),
  },
  async ({ hours }) => {
    const now = madridNow();
    const windowEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const results = await db
      .select({
        booking: schema.bookings,
        boatName: schema.boats.name,
      })
      .from(schema.bookings)
      .leftJoin(schema.boats, eq(schema.bookings.boatId, schema.boats.id))
      .where(
        and(
          gte(schema.bookings.startTime, now),
          lte(schema.bookings.startTime, windowEnd),
          eq(schema.bookings.bookingStatus, "confirmed")
        )
      )
      .orderBy(schema.bookings.startTime);

    const bookings = results.map((r) => {
      const formatted = formatBooking(r.booking, r.boatName ?? undefined);
      // Calculate hours until departure
      const startMs = r.booking.startTime?.getTime() ?? 0;
      const hoursUntil = Math.max(
        0,
        (startMs - now.getTime()) / (1000 * 60 * 60)
      );
      return {
        ...formatted,
        hoursUntilDeparture: Math.round(hoursUntil * 10) / 10,
        whatsappReminderSent: r.booking.whatsappReminderSent,
        emailReminderSent: r.booking.emailReminderSent,
      };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              windowHours: hours,
              now: now.toISOString(),
              upcomingCount: bookings.length,
              bookings,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Costa Brava Rent a Boat MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
