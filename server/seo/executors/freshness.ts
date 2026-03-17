// Content freshness checker -- identifies stale content needing updates
import { db } from "../../db";
import { blogPosts } from "../../../shared/schema";
import { eq, lt } from "drizzle-orm";
import { logger } from "../../lib/logger";

interface StaleContent {
  slug: string;
  title: string;
  lastUpdated: Date;
  daysSinceUpdate: number;
}

export async function detectStaleContent(maxAgeDays: number = 90): Promise<StaleContent[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const stalePosts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      updatedAt: blogPosts.updatedAt,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true));

  const now = new Date();
  const stale: StaleContent[] = [];

  for (const post of stalePosts) {
    const lastUpdated = post.updatedAt || post.publishedAt;
    if (!lastUpdated || lastUpdated > cutoff) continue;

    const daysSinceUpdate = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    stale.push({
      slug: post.slug,
      title: post.title,
      lastUpdated,
      daysSinceUpdate,
    });
  }

  stale.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

  logger.info(`[SEO:Freshness] Found ${stale.length} stale blog posts (>${maxAgeDays} days)`);
  return stale;
}
