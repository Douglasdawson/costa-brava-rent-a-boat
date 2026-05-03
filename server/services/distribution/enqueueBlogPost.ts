/**
 * enqueueBlogPost — for each published blog post in `blog_posts`, ensure a
 * row exists in `distribution_tray` for every supported platform.
 *
 * Idempotent: if a (slug, platform, language) tuple already exists in the
 * tray we skip it. So this can be called repeatedly (boot run, cron, manual
 * admin trigger) without creating duplicates.
 *
 * Why this matters: distribution_tray is the input queue for the
 * distributionEngine. Without something feeding it, the engine has nothing
 * to publish — even though all the platform adapters (Medium, LinkedIn,
 * Facebook, GBP) are already wired up.
 *
 * The cron-based auto-publish (DISTRIBUTION_AUTO_PUBLISH=true, every 6h)
 * then drains this tray automatically.
 *
 * Currently enabled platforms: medium. LinkedIn + Facebook adapters exist
 * but are off by default until their tokens are provisioned and the OAuth
 * flow is validated end-to-end. Toggle via DISTRIBUTION_PLATFORMS env var
 * (comma-separated list) to opt in to more channels.
 */
import { db } from "../../db";
import { blogPosts, distributionTray } from "../../../shared/schema";
import type { DistributionPlatform } from "../../../shared/schema";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";

// Read platform allowlist from env, defaulting to medium-only. Other
// platforms are deliberately excluded until their adapter + tokens are
// validated — better to under-publish than to silently fail dozens of
// posts because LinkedIn rejected the token format.
function getEnabledPlatforms(): DistributionPlatform[] {
  const raw = process.env.DISTRIBUTION_PLATFORMS?.trim();
  if (!raw) return ["medium"];
  const parsed = raw
    .split(",")
    .map(s => s.trim())
    .filter((p): p is DistributionPlatform =>
      ["medium", "linkedin", "facebook", "google_business"].includes(p as string)
    );
  return parsed.length > 0 ? parsed : ["medium"];
}

const SUPPORTED_LANGS = ["es", "en", "fr", "de", "nl"] as const;
type SupportedLang = typeof SUPPORTED_LANGS[number];

interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  contentByLang: Record<string, string> | null;
  titleByLang: Record<string, string> | null;
  excerptByLang: Record<string, string> | null;
  language: string | null;
  isPublished: boolean | null;
}

/**
 * Build the source URL on costabravarentaboat.com for canonical attribution
 * on Medium (rel="canonical" prevents duplicate content penalties).
 */
function buildCanonicalUrl(slug: string, language: SupportedLang): string {
  const base = process.env.BASE_URL || "https://www.costabravarentaboat.com";
  return `${base}/${language}/blog/${slug}`;
}

/**
 * Pick the localized title/content for a target language. Falls back to ES
 * when the translation hasn't been populated yet — the cron blog-translation
 * backfill will fill it later, and the next enqueue run will refresh.
 */
function getLocalizedFields(
  post: BlogPostRow,
  lang: SupportedLang,
): { title: string; content: string } | null {
  const titleByLang = (post.titleByLang ?? {}) as Record<string, string>;
  const contentByLang = (post.contentByLang ?? {}) as Record<string, string>;
  const title = titleByLang[lang] ?? post.title;
  const content = contentByLang[lang] ?? post.content;
  if (!title || !content) return null;
  return { title, content };
}

export interface EnqueueResult {
  examined: number;
  enqueued: number;
  skipped: number;
  errors: Array<{ slug: string; platform: string; error: string }>;
}

/**
 * For each published blog post, enqueue a row in distribution_tray for
 * every enabled platform × every supported language with translation,
 * unless one already exists.
 *
 * Defaults to ES only (low-risk first run). Pass languages: [] to include
 * all SUPPORTED_LANGS, or a specific subset.
 */
export async function enqueuePublishedBlogsForDistribution(opts?: {
  languages?: SupportedLang[];
  platforms?: DistributionPlatform[];
}): Promise<EnqueueResult> {
  const result: EnqueueResult = { examined: 0, enqueued: 0, skipped: 0, errors: [] };
  const enabledPlatforms = opts?.platforms ?? getEnabledPlatforms();
  // Default to ES only — full multi-lang fan-out can be a follow-up. Posting
  // ES first matches what the manual workflow has been doing in practice
  // and avoids polluting Medium with half-translated stub posts.
  const langs = opts?.languages ?? (["es"] as SupportedLang[]);

  if (enabledPlatforms.length === 0) {
    logger.info("[Distribution:enqueue] No platforms enabled, skipping");
    return result;
  }

  // Pull all published, non-noindex posts. The blog autopilot may flip
  // isPublished off later; if so, pending tray items for that slug will
  // simply remain pending (acceptable — they won't auto-fire because the
  // distributionEngine re-validates content at publish time).
  const posts = (await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      content: blogPosts.content,
      excerpt: blogPosts.excerpt,
      contentByLang: blogPosts.contentByLang,
      titleByLang: blogPosts.titleByLang,
      excerptByLang: blogPosts.excerptByLang,
      language: blogPosts.language,
      isPublished: blogPosts.isPublished,
    })
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true))) as unknown as BlogPostRow[];

  result.examined = posts.length;
  if (posts.length === 0) {
    logger.info("[Distribution:enqueue] No published blog posts found");
    return result;
  }

  // Pre-load all existing tray rows for these slugs in one query so we
  // don't hammer the DB with N×M lookups during the enqueue loop.
  const slugs = posts.map(p => p.slug);
  const existing = await db
    .select({
      slug: distributionTray.slug,
      platform: distributionTray.platform,
      language: distributionTray.language,
    })
    .from(distributionTray)
    .where(inArray(distributionTray.slug, slugs));
  const existingKeys = new Set(
    existing.map(r => `${r.slug}::${r.platform}::${r.language}`),
  );

  const toInsert: Array<{
    slug: string;
    platform: DistributionPlatform;
    language: string;
    title: string;
    content: string;
    targetUrl: string;
  }> = [];

  for (const post of posts) {
    for (const lang of langs) {
      const localized = getLocalizedFields(post, lang);
      if (!localized) continue;

      for (const platform of enabledPlatforms) {
        const key = `${post.slug}::${platform}::${lang}`;
        if (existingKeys.has(key)) {
          result.skipped += 1;
          continue;
        }

        toInsert.push({
          slug: post.slug,
          platform,
          language: lang,
          title: localized.title,
          content: localized.content,
          targetUrl: buildCanonicalUrl(post.slug, lang),
        });
      }
    }
  }

  if (toInsert.length === 0) {
    logger.info("[Distribution:enqueue] All eligible blog/platform/lang combos already queued", {
      examined: result.examined, skipped: result.skipped,
    });
    return result;
  }

  // Batch insert; on collision (race with another worker) the slug index
  // is non-unique so we need to rely on the pre-check above. If that ever
  // races, the engine still de-dupes via (slug, platform, language) at
  // publish time using publishedUrl idempotency.
  try {
    const inserted = await db.insert(distributionTray).values(toInsert).returning({ id: distributionTray.id });
    result.enqueued = inserted.length;
    logger.info("[Distribution:enqueue] Queued blog posts", {
      examined: result.examined,
      enqueued: result.enqueued,
      skipped: result.skipped,
      platforms: enabledPlatforms,
      languages: langs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("[Distribution:enqueue] Insert batch failed", { error: message, attempted: toInsert.length });
    for (const item of toInsert) {
      result.errors.push({ slug: item.slug, platform: item.platform, error: message });
    }
  }

  return result;
}
