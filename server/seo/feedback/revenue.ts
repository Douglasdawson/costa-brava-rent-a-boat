// server/seo/feedback/revenue.ts
import { db } from "../../db";
import { seoConversions, seoRankings, bookings, pageVisits } from "../../../shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";

export async function correlateRevenue(): Promise<void> {
  // Find bookings from last 24h
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const recentBookings = await db
    .select()
    .from(bookings)
    .where(gte(bookings.createdAt, yesterday));

  logger.info(`[SEO:Revenue] Correlating ${recentBookings.length} recent bookings`);

  let correlated = 0;
  for (const booking of recentBookings) {
    // Find page visit that led to this booking (within same session/timeframe)
    // Match by: same date, organic referrer containing a search keyword
    const visits = await db
      .select()
      .from(pageVisits)
      .where(
        and(
          gte(pageVisits.visitedAt, yesterday),
          sql`${pageVisits.referrer} LIKE '%google%' OR ${pageVisits.referrer} LIKE '%bing%'`,
        )
      )
      .orderBy(desc(pageVisits.visitedAt))
      .limit(5);

    if (visits.length > 0) {
      const visit = visits[0];
      // Try to match to a tracked keyword based on the landing page
      const matchingRanking = await db
        .select({ keywordId: seoRankings.keywordId })
        .from(seoRankings)
        .where(eq(seoRankings.page, visit.pagePath))
        .orderBy(desc(seoRankings.date))
        .limit(1);

      if (matchingRanking.length > 0) {
        await db.insert(seoConversions).values({
          keywordId: matchingRanking[0].keywordId,
          page: visit.pagePath,
          sessionId: booking.sessionId,
          revenue: String(booking.totalAmount || 0),
          date: new Date().toISOString().split("T")[0],
        });
        correlated++;
      }
    }
  }

  logger.info(`[SEO:Revenue] Correlated ${correlated} bookings to keywords`);
}
