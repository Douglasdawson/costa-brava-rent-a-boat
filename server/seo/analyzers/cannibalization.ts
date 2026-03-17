// Keyword cannibalization detector
import { db } from "../../db";
import { seoKeywords, seoRankings } from "../../../shared/schema";
import { eq, gte } from "drizzle-orm";
import { logger } from "../../lib/logger";

interface CannibalizationConflict {
  keyword: string;
  pages: Array<{ page: string; position: number; clicks: number }>;
}

export async function detectCannibalization(): Promise<CannibalizationConflict[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = sevenDaysAgo.toISOString().split("T")[0];

  // Find keywords ranking on multiple pages
  const rows = await db
    .select({
      keyword: seoKeywords.keyword,
      page: seoRankings.page,
      position: seoRankings.position,
      clicks: seoRankings.clicks,
    })
    .from(seoRankings)
    .innerJoin(seoKeywords, eq(seoRankings.keywordId, seoKeywords.id))
    .where(gte(seoRankings.date, dateStr))
    .orderBy(seoKeywords.keyword, seoRankings.position);

  // Group by keyword
  const keywordPages = new Map<string, Array<{ page: string; position: number; clicks: number }>>();
  for (const row of rows) {
    if (!row.page || !row.position) continue;
    const pages = keywordPages.get(row.keyword) || [];
    // Deduplicate same page
    if (!pages.find(p => p.page === row.page)) {
      pages.push({
        page: row.page,
        position: Number(row.position),
        clicks: row.clicks || 0,
      });
    }
    keywordPages.set(row.keyword, pages);
  }

  // Filter: only keywords with 2+ pages ranking, both in top 50
  const conflicts: CannibalizationConflict[] = [];
  keywordPages.forEach((pages, keyword) => {
    const relevant = pages.filter((p: { position: number }) => p.position <= 50);
    if (relevant.length >= 2) {
      conflicts.push({
        keyword,
        pages: relevant.sort((a: { position: number }, b: { position: number }) => a.position - b.position),
      });
    }
  });

  logger.info(`[SEO:Cannibalization] Found ${conflicts.length} keyword conflicts`);
  return conflicts;
}
