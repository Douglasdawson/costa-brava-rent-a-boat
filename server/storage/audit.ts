import { db, desc, eq, auditLogs, type InsertAuditLog, type AuditLog } from "./base";

export async function createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
  const [log] = await db.insert(auditLogs).values(data).returning();
  return log;
}

export async function getRecentAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function listAuditLogsByResource(
  resource: string,
  limit: number = 50,
): Promise<AuditLog[]> {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.resource, resource))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
