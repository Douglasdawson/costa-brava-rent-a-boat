import {
  db, eq, and, or, sql,
  whatsappInquiries,
  type WhatsappInquiry, type InsertWhatsappInquiry, type UpdateWhatsappInquiry,
} from "./base";

export async function getWhatsappInquiry(id: string, tenantId?: string): Promise<WhatsappInquiry | undefined> {
  const conditions = [eq(whatsappInquiries.id, id)];
  if (tenantId) conditions.push(eq(whatsappInquiries.tenantId, tenantId));
  const [inquiry] = await db.select().from(whatsappInquiries).where(and(...conditions));
  return inquiry;
}

export async function createWhatsappInquiry(data: InsertWhatsappInquiry): Promise<WhatsappInquiry> {
  const [inquiry] = await db.insert(whatsappInquiries).values(data).returning();
  return inquiry;
}

export async function getPaginatedInquiries(params: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  tenantId?: string;
}): Promise<{ data: WhatsappInquiry[]; total: number; page: number; totalPages: number }> {
  const { page, limit, status, search, tenantId } = params;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (tenantId) {
    conditions.push(eq(whatsappInquiries.tenantId, tenantId));
  }
  if (status && status !== "all") {
    conditions.push(eq(whatsappInquiries.status, status));
  }
  if (search) {
    const searchLower = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${whatsappInquiries.firstName}) LIKE ${searchLower}`,
        sql`LOWER(${whatsappInquiries.lastName}) LIKE ${searchLower}`,
        sql`LOWER(COALESCE(${whatsappInquiries.email}, '')) LIKE ${searchLower}`,
        sql`LOWER(${whatsappInquiries.phoneNumber}) LIKE ${searchLower}`,
        sql`LOWER(${whatsappInquiries.boatName}) LIKE ${searchLower}`
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(whatsappInquiries)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const data = await db
    .select()
    .from(whatsappInquiries)
    .where(whereClause)
    .orderBy(sql`${whatsappInquiries.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  return { data, total, page, totalPages };
}

export async function updateWhatsappInquiry(id: string, data: UpdateWhatsappInquiry): Promise<WhatsappInquiry | undefined> {
  const [updated] = await db
    .update(whatsappInquiries)
    .set(data)
    .where(eq(whatsappInquiries.id, id))
    .returning();
  return updated;
}

export async function deleteWhatsappInquiry(id: string): Promise<boolean> {
  const [deleted] = await db
    .delete(whatsappInquiries)
    .where(eq(whatsappInquiries.id, id))
    .returning();
  return !!deleted;
}
