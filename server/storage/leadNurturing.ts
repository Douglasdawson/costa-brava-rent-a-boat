import {
  db, eq, and, gte, lte, desc, sql,
  aiChatSessions, leadNurturingLog, newsletterSubscribers,
  type AiChatSession, type LeadNurturingLog, type InsertLeadNurturingLog,
} from "./base";

/**
 * A lead ready for nurturing: the session plus how recently it was nurtured.
 */
export interface NurturableLead {
  session: AiChatSession;
  lastNurturedAt: Date | null;
}

/**
 * Get leads for automated nurturing.
 *
 * Returns AI chat sessions grouped by phone number (latest session per phone)
 * that have a lead score and whose last message falls within the specified idle window.
 *
 * @param minScore - Minimum intent score to include
 * @param maxScore - Maximum intent score (exclusive upper bound, use 101 for "no cap")
 * @param idleMinutes - Minimum minutes since last message
 * @param tenantId - Optional tenant filter
 */
export async function getLeadsForNurturing(
  minScore: number,
  maxScore: number,
  idleMinutes: number,
  tenantId?: string,
): Promise<NurturableLead[]> {
  const idleSince = new Date(Date.now() - idleMinutes * 60 * 1000);

  const conditions = [
    gte(aiChatSessions.intentScore, minScore),
    lte(aiChatSessions.intentScore, maxScore),
    lte(aiChatSessions.lastMessageAt, idleSince),
  ];
  if (tenantId) {
    conditions.push(eq(aiChatSessions.tenantId, tenantId));
  }

  // Get matching sessions ordered by score descending
  const sessions = await db.select()
    .from(aiChatSessions)
    .where(and(...conditions))
    .orderBy(desc(aiChatSessions.intentScore))
    .limit(50);

  // For each session, find the most recent nurturing action
  const results: NurturableLead[] = [];
  for (const session of sessions) {
    const [lastLog] = await db.select()
      .from(leadNurturingLog)
      .where(eq(leadNurturingLog.sessionId, session.id))
      .orderBy(desc(leadNurturingLog.createdAt))
      .limit(1);

    results.push({
      session,
      lastNurturedAt: lastLog?.createdAt ?? null,
    });
  }

  return results;
}

/**
 * Record a nurturing action so we don't repeat it within 24h.
 */
export async function markLeadNurtured(
  data: InsertLeadNurturingLog,
): Promise<LeadNurturingLog> {
  const [log] = await db.insert(leadNurturingLog).values(data).returning();
  return log;
}

/**
 * Check if a lead has been nurtured within the last N hours.
 */
export async function wasNurturedRecently(
  sessionId: string,
  withinHours: number = 24,
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);
  const [recent] = await db.select({ id: leadNurturingLog.id })
    .from(leadNurturingLog)
    .where(and(
      eq(leadNurturingLog.sessionId, sessionId),
      gte(leadNurturingLog.createdAt, since),
    ))
    .limit(1);

  return !!recent;
}

/**
 * Check if a phone number is already subscribed to the newsletter.
 * We don't have phone-to-email mapping in newsletter, so we check by session email.
 * Returns true if the email from the chatbot conversation is already subscribed.
 */
export async function isAlreadySubscribed(email: string): Promise<boolean> {
  const [existing] = await db.select({ id: newsletterSubscribers.id })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email.toLowerCase().trim()))
    .limit(1);
  return !!existing;
}

/**
 * Get nurturing stats for the admin dashboard.
 */
export async function getNurturingStats(tenantId?: string): Promise<{
  totalNurtured: number;
  hotSent: number;
  warmSent: number;
  coldTagged: number;
  last24h: number;
}> {
  const conditions = tenantId
    ? [eq(leadNurturingLog.tenantId, tenantId)]
    : [];

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stats = await db.select({
    totalNurtured: sql<number>`count(*)`,
    hotSent: sql<number>`sum(case when action = 'hot_availability' then 1 else 0 end)`,
    warmSent: sql<number>`sum(case when action = 'warm_discount' then 1 else 0 end)`,
    coldTagged: sql<number>`sum(case when action = 'cold_newsletter' then 1 else 0 end)`,
    last24h: sql<number>`sum(case when created_at >= ${last24h} then 1 else 0 end)`,
  }).from(leadNurturingLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    totalNurtured: Number(stats[0]?.totalNurtured) || 0,
    hotSent: Number(stats[0]?.hotSent) || 0,
    warmSent: Number(stats[0]?.warmSent) || 0,
    coldTagged: Number(stats[0]?.coldTagged) || 0,
    last24h: Number(stats[0]?.last24h) || 0,
  };
}
