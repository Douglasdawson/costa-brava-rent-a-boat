// server/seo/feedback/experiments.ts
import { db } from "../../db";
import { seoExperiments, seoRankings, seoKeywords, seoLearnings } from "../../../shared/schema";
import { eq, and, gte, lte, desc, isNotNull, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";

export async function reviewExperiments(): Promise<void> {
  const now = new Date();

  // Find experiments that are ready to measure
  const readyExperiments = await db
    .select()
    .from(seoExperiments)
    .where(
      and(
        eq(seoExperiments.status, "running"),
        isNotNull(seoExperiments.measureAt),
        sql`${seoExperiments.measureAt} <= ${now}`,
      )
    );

  logger.info(`[SEO:Experiments] Reviewing ${readyExperiments.length} experiments`);

  for (const exp of readyExperiments) {
    // Get current metrics for the affected page
    const currentRankings = await db
      .select({
        position: seoRankings.position,
        clicks: seoRankings.clicks,
        impressions: seoRankings.impressions,
        ctr: seoRankings.ctr,
      })
      .from(seoRankings)
      .innerJoin(seoKeywords, eq(seoRankings.keywordId, seoKeywords.id))
      .where(
        and(
          eq(seoRankings.page, exp.page),
          gte(seoRankings.date, now.toISOString().split("T")[0]),
        )
      )
      .orderBy(desc(seoRankings.date))
      .limit(5);

    const baseline = exp.baselineMetrics as Record<string, number> | null;
    const currentAvg = currentRankings.reduce(
      (acc, r) => ({
        position: acc.position + Number(r.position || 0),
        clicks: acc.clicks + (r.clicks || 0),
        ctr: acc.ctr + Number(r.ctr || 0),
      }),
      { position: 0, clicks: 0, ctr: 0 }
    );

    if (currentRankings.length > 0) {
      currentAvg.position /= currentRankings.length;
      currentAvg.clicks /= currentRankings.length;
      currentAvg.ctr /= currentRankings.length;
    }

    // Determine success/failure
    const positionImproved = baseline ? currentAvg.position < (baseline.position || 100) : false;
    const ctrImproved = baseline ? currentAvg.ctr > (baseline.ctr || 0) : false;
    const status = (positionImproved || ctrImproved) ? "success" : "inconclusive";

    const learning = status === "success"
      ? `${exp.type} on ${exp.page}: hypothesis confirmed. Position ${baseline?.position || "?"} → ${currentAvg.position.toFixed(1)}, CTR ${((baseline?.ctr || 0) * 100).toFixed(1)}% → ${(currentAvg.ctr * 100).toFixed(1)}%`
      : null;

    // Update experiment
    await db
      .update(seoExperiments)
      .set({
        status,
        resultMetrics: currentAvg,
        learning,
      })
      .where(eq(seoExperiments.id, exp.id));

    // Store learning if successful
    if (learning) {
      await db.insert(seoLearnings).values({
        experimentId: exp.id,
        category: exp.type,
        insight: learning,
        confidence: "0.70",
        applicableTo: exp.page,
      });
    }

    logger.info(`[SEO:Experiments] Experiment #${exp.id}: ${status}`);
  }
}
