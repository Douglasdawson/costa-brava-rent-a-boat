// server/seo/executors/meta.ts
import { db } from "../../db";
import { seoMeta } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { notifyPageChanged } from "../indexnow";

export async function updateMeta(action: {
  page: string;
  details: string;
  hypothesis: string;
  campaignId: number | null;
}): Promise<{ previousValue: string; newValue: string }> {
  // Parse details - expected format: "title: New Title Here" or "description: New description here"
  const [field, ...valueParts] = action.details.split(": ");
  const newValue = valueParts.join(": ").trim();
  const fieldName = field.trim().toLowerCase();

  if (!["title", "description"].includes(fieldName)) {
    throw new Error(`Invalid meta field: ${fieldName}`);
  }

  // Get current value
  const [existing] = await db
    .select()
    .from(seoMeta)
    .where(and(eq(seoMeta.page, action.page), eq(seoMeta.language, "es")))
    .limit(1);

  const previousValue = existing
    ? (fieldName === "title" ? existing.title : existing.description) || ""
    : "";

  // Upsert new value
  const updateData = fieldName === "title"
    ? { title: newValue }
    : { description: newValue };

  await db
    .insert(seoMeta)
    .values({
      page: action.page,
      language: "es",
      ...updateData,
      updatedBy: "system",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [seoMeta.page, seoMeta.language],
      set: { ...updateData, updatedBy: "system", updatedAt: new Date() },
    });

  logger.info(`[SEO:Meta] Updated ${fieldName} for ${action.page}`);

  // Notify search engines of the change
  await notifyPageChanged(action.page);

  return { previousValue, newValue };
}
