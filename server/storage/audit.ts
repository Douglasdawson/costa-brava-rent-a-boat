import { db, desc, auditLogs, type InsertAuditLog, type AuditLog } from "./base";

export async function createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
  const [log] = await db.insert(auditLogs).values(data).returning();
  return log;
}

export async function getRecentAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}
