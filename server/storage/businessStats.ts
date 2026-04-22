import {
  db, sql,
  businessStats,
  type BusinessStats, type InsertBusinessStats,
} from "./base";

const SINGLETON_ID = 1;

export async function getBusinessStats(): Promise<BusinessStats | null> {
  const rows = await db.select().from(businessStats).limit(1);
  return rows[0] ?? null;
}

export async function upsertBusinessStats(payload: Omit<InsertBusinessStats, "id" | "lastSyncedAt">): Promise<BusinessStats> {
  const [row] = await db
    .insert(businessStats)
    .values({
      id: SINGLETON_ID,
      ...payload,
      lastSyncedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: businessStats.id,
      set: {
        placeId: payload.placeId,
        rating: payload.rating,
        userRatingCount: payload.userRatingCount,
        displayName: payload.displayName,
        internationalPhoneNumber: payload.internationalPhoneNumber,
        websiteUri: payload.websiteUri,
        weekdayHours: payload.weekdayHours,
        recentReviews: payload.recentReviews,
        rawPayload: payload.rawPayload,
        lastSyncedAt: sql`now()`,
        syncSource: payload.syncSource ?? "places_api_new",
      },
    })
    .returning();
  return row;
}
