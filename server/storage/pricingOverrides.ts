import {
  db, eq, and, or, gte, lte, isNull, desc, sql,
  pricingOverrides,
  type PricingOverride,
  type InsertPricingOverride,
} from "./base";
import type { PricingOverrideRule } from "@shared/pricing";

export interface ListPricingOverridesFilters {
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
  boatId?: string;
  includeInactive?: boolean;
  tenantId?: string;
}

/**
 * Map a DB row to the reduced PricingOverrideRule used by shared/pricing.ts
 * (decouples the pure pricing module from drizzle types).
 */
function toRule(row: PricingOverride): PricingOverrideRule {
  return {
    id: row.id,
    boatId: row.boatId,
    dateStart: row.dateStart,
    dateEnd: row.dateEnd,
    weekdayFilter: row.weekdayFilter ?? null,
    direction: row.direction as PricingOverrideRule["direction"],
    adjustmentType: row.adjustmentType as PricingOverrideRule["adjustmentType"],
    adjustmentValue: parseFloat(row.adjustmentValue),
    priority: row.priority,
    label: row.label,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

export async function listPricingOverrides(
  filters: ListPricingOverridesFilters = {},
): Promise<PricingOverride[]> {
  const conditions = [];
  if (!filters.includeInactive) {
    conditions.push(eq(pricingOverrides.isActive, true));
  }
  if (filters.from) {
    // overlap: row.date_end >= from
    conditions.push(gte(pricingOverrides.dateEnd, filters.from));
  }
  if (filters.to) {
    // overlap: row.date_start <= to
    conditions.push(lte(pricingOverrides.dateStart, filters.to));
  }
  if (filters.boatId) {
    // include both boat-specific and global rules for that boat
    conditions.push(or(eq(pricingOverrides.boatId, filters.boatId), isNull(pricingOverrides.boatId))!);
  }
  if (filters.tenantId !== undefined) {
    if (filters.tenantId === null) {
      conditions.push(isNull(pricingOverrides.tenantId));
    } else {
      conditions.push(eq(pricingOverrides.tenantId, filters.tenantId));
    }
  }

  const query = conditions.length > 0
    ? db.select().from(pricingOverrides).where(and(...conditions))
    : db.select().from(pricingOverrides);

  return query.orderBy(desc(pricingOverrides.priority), desc(pricingOverrides.createdAt));
}

export async function getPricingOverride(id: string): Promise<PricingOverride | undefined> {
  const [row] = await db
    .select()
    .from(pricingOverrides)
    .where(eq(pricingOverrides.id, id))
    .limit(1);
  return row;
}

export async function createPricingOverride(data: InsertPricingOverride): Promise<PricingOverride> {
  const [created] = await db
    .insert(pricingOverrides)
    .values(data)
    .returning();
  return created;
}

export async function updatePricingOverride(
  id: string,
  patch: Partial<InsertPricingOverride>,
): Promise<PricingOverride | undefined> {
  const [updated] = await db
    .update(pricingOverrides)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(pricingOverrides.id, id))
    .returning();
  return updated;
}

export async function deactivatePricingOverride(id: string): Promise<PricingOverride | undefined> {
  const [updated] = await db
    .update(pricingOverrides)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(pricingOverrides.id, id))
    .returning();
  return updated;
}

/**
 * Load all overrides that are potentially applicable to the given date and boat.
 * Returns rules in PricingOverrideRule format (consumable by selectApplicableOverride).
 *
 * Filters at SQL level: is_active=true, date in [date_start, date_end], scope matches.
 * The final resolution (specificity, priority, recency) happens in pure code via
 * selectApplicableOverride() in shared/pricing.ts.
 */
export async function loadActiveOverridesForDate(
  date: Date,
  boatId?: string,
): Promise<PricingOverrideRule[]> {
  const dateStr = date.toISOString().split("T")[0]; // approximate; refined in pure layer for TZ
  const conditions = [
    eq(pricingOverrides.isActive, true),
    lte(pricingOverrides.dateStart, dateStr),
    gte(pricingOverrides.dateEnd, dateStr),
  ];
  if (boatId) {
    conditions.push(or(eq(pricingOverrides.boatId, boatId), isNull(pricingOverrides.boatId))!);
  }
  const rows = await db
    .select()
    .from(pricingOverrides)
    .where(and(...conditions));
  return rows.map(toRule);
}

/**
 * Variant for batch loading — useful for the public calendar endpoint that
 * iterates a date range. Returns rules whose [date_start, date_end] overlaps
 * with [from, to].
 */
export async function loadActiveOverridesForRange(
  from: string, // YYYY-MM-DD
  to: string, // YYYY-MM-DD
  boatId?: string,
): Promise<PricingOverrideRule[]> {
  const conditions = [
    eq(pricingOverrides.isActive, true),
    lte(pricingOverrides.dateStart, to),
    gte(pricingOverrides.dateEnd, from),
  ];
  if (boatId) {
    conditions.push(or(eq(pricingOverrides.boatId, boatId), isNull(pricingOverrides.boatId))!);
  }
  const rows = await db
    .select()
    .from(pricingOverrides)
    .where(and(...conditions));
  return rows.map(toRule);
}
