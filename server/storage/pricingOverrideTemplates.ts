import {
  db, eq, and, desc,
  pricingOverrideTemplates,
  type PricingOverrideTemplate,
  type InsertPricingOverrideTemplate,
} from "./base";

export async function listPricingOverrideTemplates(
  includeInactive = false,
): Promise<PricingOverrideTemplate[]> {
  const query = includeInactive
    ? db.select().from(pricingOverrideTemplates)
    : db.select().from(pricingOverrideTemplates).where(eq(pricingOverrideTemplates.isActive, true));
  return query.orderBy(desc(pricingOverrideTemplates.createdAt));
}

export async function getPricingOverrideTemplate(
  id: string,
): Promise<PricingOverrideTemplate | undefined> {
  const [row] = await db
    .select()
    .from(pricingOverrideTemplates)
    .where(eq(pricingOverrideTemplates.id, id))
    .limit(1);
  return row;
}

export async function createPricingOverrideTemplate(
  data: InsertPricingOverrideTemplate,
): Promise<PricingOverrideTemplate> {
  const [created] = await db
    .insert(pricingOverrideTemplates)
    .values(data)
    .returning();
  return created;
}

export async function updatePricingOverrideTemplate(
  id: string,
  patch: Partial<InsertPricingOverrideTemplate>,
): Promise<PricingOverrideTemplate | undefined> {
  const [updated] = await db
    .update(pricingOverrideTemplates)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(pricingOverrideTemplates.id, id))
    .returning();
  return updated;
}

export async function deactivatePricingOverrideTemplate(
  id: string,
): Promise<PricingOverrideTemplate | undefined> {
  const [updated] = await db
    .update(pricingOverrideTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(pricingOverrideTemplates.id, id), eq(pricingOverrideTemplates.isActive, true)))
    .returning();
  return updated;
}
