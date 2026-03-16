// server/seo/executors/schema.ts
import { db } from "../../db";
import { seoMeta } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../../lib/logger";

export async function updateSchema(action: {
  page: string;
  details: string;
  hypothesis: string;
  campaignId: number | null;
}): Promise<{ previousValue: string; newValue: string }> {
  // Get existing seoMeta row for this page
  const [existing] = await db
    .select()
    .from(seoMeta)
    .where(and(eq(seoMeta.page, action.page), eq(seoMeta.language, "es")))
    .limit(1);

  const previousValue = existing?.keywords || "";

  // Upsert keywords field with schema markup instructions
  await db
    .insert(seoMeta)
    .values({
      page: action.page,
      language: "es",
      keywords: action.details,
      updatedBy: "system",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [seoMeta.page, seoMeta.language],
      set: { keywords: action.details, updatedBy: "system", updatedAt: new Date() },
    });

  logger.info(`[SEO:Schema] Updated schema markup for ${action.page}`);

  return { previousValue, newValue: action.details };
}
