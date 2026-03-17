import {
  db, eq, and, or, gte, lte, inArray, sql,
  bookings, crmCustomers,
  type Booking, type CrmCustomer, type UpdateCrmCustomer,
} from "./base";

export async function upsertCrmCustomer(booking: Booking, tenantId?: string): Promise<CrmCustomer> {
  const orConditions = [eq(crmCustomers.phone, booking.customerPhone)];
  if (booking.customerEmail) {
    orConditions.push(eq(crmCustomers.email, booking.customerEmail));
  }

  const conditions = [or(...orConditions)];
  if (tenantId) conditions.push(eq(crmCustomers.tenantId, tenantId));

  const [existing] = await db
    .select()
    .from(crmCustomers)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    return (await recalculateCustomerStats(existing.id)) || existing;
  }

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
      ...(tenantId ? { tenantId } : {}),
    })
    .returning();

  return newCustomer;
}

export async function getPaginatedCrmCustomers(params: {
  page: number;
  limit: number;
  search?: string;
  segment?: string;
  nationality?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tenantId?: string;
}): Promise<{
  data: CrmCustomer[];
  total: number;
  page: number;
  totalPages: number;
  bestCustomerName: string | null;
  bestCustomerSpent: string | null;
  totalSpentAll: string;
  totalCustomersAll: number;
}> {
  const { page, limit, search, segment, nationality, sortBy = "lastBookingDate", sortOrder = "desc", tenantId } = params;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (tenantId) {
    conditions.push(eq(crmCustomers.tenantId, tenantId));
  }

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

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(crmCustomers)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

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

  const tenantFilter = tenantId ? eq(crmCustomers.tenantId, tenantId) : undefined;

  const statsResult = await db
    .select({
      totalSpentAll: sql<string>`COALESCE(SUM(${crmCustomers.totalSpent}), 0)::text`,
      totalCustomers: sql<number>`COUNT(*)::int`,
    })
    .from(crmCustomers)
    .where(tenantFilter);

  const bestCustomerResult = await db
    .select({
      name: sql<string>`CONCAT(${crmCustomers.name}, ' ', ${crmCustomers.surname})`,
      totalSpent: sql<string>`${crmCustomers.totalSpent}::text`,
    })
    .from(crmCustomers)
    .where(tenantFilter)
    .orderBy(sql`${crmCustomers.totalSpent} DESC NULLS LAST`)
    .limit(1);

  const totalSpentAll = statsResult[0]?.totalSpentAll ?? "0";
  const totalCustomersAll = statsResult[0]?.totalCustomers ?? 0;
  const bestCustomerName = bestCustomerResult[0]?.name ?? null;
  const bestCustomerSpent = bestCustomerResult[0]?.totalSpent ?? null;

  return {
    data,
    total,
    page,
    totalPages,
    bestCustomerName,
    bestCustomerSpent,
    totalSpentAll,
    totalCustomersAll,
  };
}

export async function getCrmCustomerById(id: string): Promise<{ customer: CrmCustomer; bookings: Booking[] } | undefined> {
  const [customer] = await db.select().from(crmCustomers).where(eq(crmCustomers.id, id));
  if (!customer) return undefined;

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

export async function updateCrmCustomer(id: string, data: UpdateCrmCustomer): Promise<CrmCustomer | undefined> {
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

export async function recalculateCustomerStats(customerId: string): Promise<CrmCustomer | undefined> {
  const [customer] = await db.select().from(crmCustomers).where(eq(crmCustomers.id, customerId));
  if (!customer) return undefined;

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

export async function syncAllCustomersFromBookings(): Promise<{ created: number; updated: number }> {
  const allBookings = await db
    .select()
    .from(bookings)
    .where(
      inArray(bookings.bookingStatus, ["confirmed", "pending_payment"])
    );

  const customerMap = new Map<string, Booking[]>();
  for (const booking of allBookings) {
    const key = booking.customerPhone;
    const existing = customerMap.get(key) || [];
    existing.push(booking);
    customerMap.set(key, existing);
  }

  const entries = Array.from(customerMap.entries());
  const phones = entries.map(([phone]) => phone);
  if (phones.length === 0) return { created: 0, updated: 0 };

  const existingCustomers = await db.select().from(crmCustomers)
    .where(inArray(crmCustomers.phone, phones));
  const existingMap = new Map(existingCustomers.map(c => [c.phone, c]));

  // Separate into bulk insert and parallel update arrays
  const toInsert: Array<{
    name: string; surname: string; email: string | null; phone: string;
    nationality: string | null; segment: string; totalBookings: number;
    totalSpent: string; firstBookingDate: Date; lastBookingDate: Date;
  }> = [];
  const toUpdate: Array<{
    id: string; data: {
      name: string; surname: string; email: string | null;
      nationality: string | null; totalBookings: number; totalSpent: string;
      firstBookingDate: Date; lastBookingDate: Date; segment: string;
      updatedAt: Date;
    };
  }> = [];

  for (const [phone, custBookings] of entries) {
    const existing = existingMap.get(phone);

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
      toUpdate.push({
        id: existing.id,
        data: {
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
        },
      });
    } else {
      toInsert.push({
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
    }
  }

  await db.transaction(async (tx) => {
    // Bulk insert all new customers in a single statement
    if (toInsert.length > 0) {
      await tx.insert(crmCustomers).values(toInsert);
    }

    // Parallel updates — each targets a different row by id
    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map(({ id, data }) =>
          tx.update(crmCustomers).set(data).where(eq(crmCustomers.id, id))
        )
      );
    }
  });

  return { created: toInsert.length, updated: toUpdate.length };
}
