import {
  db, eq, and, sql, desc, gte,
  memberships,
  type Membership, type InsertMembership,
} from "./base";

// ===== MEMBERSHIP METHODS =====

export async function createMembership(data: InsertMembership): Promise<Membership> {
  const [created] = await db
    .insert(memberships)
    .values(data)
    .returning();
  return created;
}

export async function getMembershipById(id: number): Promise<Membership | undefined> {
  const [found] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.id, id));
  return found;
}

/**
 * Get active membership for a customer email.
 * An active membership has status='active' and endDate in the future.
 */
export async function getMembershipByEmail(
  email: string,
  tenantId?: string,
): Promise<Membership | undefined> {
  const conditions = [
    eq(memberships.customerEmail, email.toLowerCase().trim()),
    eq(memberships.status, "active"),
    gte(memberships.endDate, new Date()),
  ];
  if (tenantId) {
    conditions.push(eq(memberships.tenantId, tenantId));
  }

  const [found] = await db
    .select()
    .from(memberships)
    .where(and(...conditions))
    .orderBy(desc(memberships.endDate))
    .limit(1);
  return found;
}

/**
 * Get all active memberships (status=active and not expired).
 */
export async function getActiveMemberships(tenantId?: string): Promise<Membership[]> {
  const conditions = [
    eq(memberships.status, "active"),
    gte(memberships.endDate, new Date()),
  ];
  if (tenantId) {
    conditions.push(eq(memberships.tenantId, tenantId));
  }

  return await db
    .select()
    .from(memberships)
    .where(and(...conditions))
    .orderBy(desc(memberships.createdAt));
}

/**
 * Get all memberships (including expired/cancelled) for admin listing.
 */
export async function getAllMemberships(tenantId?: string): Promise<Membership[]> {
  if (tenantId) {
    return await db
      .select()
      .from(memberships)
      .where(eq(memberships.tenantId, tenantId))
      .orderBy(desc(memberships.createdAt));
  }
  return await db
    .select()
    .from(memberships)
    .orderBy(desc(memberships.createdAt));
}

export async function updateMembership(
  id: number,
  updates: Partial<Membership>,
): Promise<Membership | undefined> {
  const [updated] = await db
    .update(memberships)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(memberships.id, id))
    .returning();
  return updated;
}

/**
 * Deduct free hours from a membership.
 * Returns the updated membership, or undefined if not found / insufficient hours.
 */
export async function deductFreeHours(
  id: number,
  hours: number,
): Promise<Membership | undefined> {
  const membership = await getMembershipById(id);
  if (!membership) return undefined;

  const remaining = parseFloat(membership.freeHoursRemaining);
  if (remaining < hours) return undefined;

  const [updated] = await db
    .update(memberships)
    .set({
      freeHoursRemaining: (remaining - hours).toFixed(1),
      updatedAt: new Date(),
    })
    .where(eq(memberships.id, id))
    .returning();
  return updated;
}

/**
 * Membership KPI stats for admin dashboard.
 */
export interface MembershipStats {
  totalActive: number;
  totalExpired: number;
  totalCancelled: number;
  totalRevenue: number;
  averageDiscount: number;
  freeHoursUsed: number;
}

export async function getMembershipStats(tenantId?: string): Promise<MembershipStats> {
  const tenantCondition = tenantId
    ? sql`AND tenant_id = ${tenantId}`
    : sql``;

  const result = (await db.execute<{
    total_active: string;
    total_expired: string;
    total_cancelled: string;
    total_revenue: string;
    avg_discount: string;
    free_hours_used: string;
  }>(sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'active' AND end_date >= NOW()) AS total_active,
      COUNT(*) FILTER (WHERE status = 'expired' OR (status = 'active' AND end_date < NOW())) AS total_expired,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS total_cancelled,
      COALESCE(SUM(price::numeric), 0) AS total_revenue,
      COALESCE(AVG(discount_percent), 0) AS avg_discount,
      COALESCE(SUM(1.0 - free_hours_remaining::numeric), 0) AS free_hours_used
    FROM memberships
    WHERE 1=1 ${tenantCondition}
  `)).rows[0];

  if (!result) {
    return {
      totalActive: 0,
      totalExpired: 0,
      totalCancelled: 0,
      totalRevenue: 0,
      averageDiscount: 0,
      freeHoursUsed: 0,
    };
  }

  return {
    totalActive: parseInt(String(result.total_active) || "0", 10),
    totalExpired: parseInt(String(result.total_expired) || "0", 10),
    totalCancelled: parseInt(String(result.total_cancelled) || "0", 10),
    totalRevenue: parseFloat(String(result.total_revenue) || "0"),
    averageDiscount: parseFloat(parseFloat(String(result.avg_discount) || "0").toFixed(1)),
    freeHoursUsed: parseFloat(parseFloat(String(result.free_hours_used) || "0").toFixed(1)),
  };
}

/**
 * Auto-expire memberships whose endDate has passed but status is still 'active'.
 * Called periodically or on demand.
 */
export async function expireOverdueMemberships(): Promise<number> {
  const result = await db
    .update(memberships)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(memberships.status, "active"),
        sql`end_date < NOW()`,
      ),
    )
    .returning();
  return result.length;
}
