import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { eq, and, desc, sql, count, gte, ilike } from "drizzle-orm";
import { db } from "./shared/db.js";
import * as schema from "../../shared/schema.js";
import { runAutopilotPipeline, publishMatureDrafts, getConfig } from "../services/blogAutopilot.js";
import { generateTopicQueue } from "../services/blogTopicEngine.js";

const server = new McpServer({
  name: "costa-brava-content",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// 1. list_blog_posts
// ---------------------------------------------------------------------------
server.tool(
  "list_blog_posts",
  "List all blog posts with optional filters by publication status and category",
  {
    status: z
      .enum(["published", "draft", "all"])
      .optional()
      .describe("Filter by publication status. Defaults to 'all'."),
    category: z
      .string()
      .optional()
      .describe("Filter by category (case-insensitive partial match)."),
  },
  async ({ status, category }) => {
    const conditions = [];

    if (status === "published") {
      conditions.push(eq(schema.blogPosts.isPublished, true));
    } else if (status === "draft") {
      conditions.push(eq(schema.blogPosts.isPublished, false));
    }

    if (category) {
      conditions.push(ilike(schema.blogPosts.category, `%${category}%`));
    }

    const posts = await db
      .select({
        id: schema.blogPosts.id,
        title: schema.blogPosts.title,
        slug: schema.blogPosts.slug,
        excerpt: schema.blogPosts.excerpt,
        category: schema.blogPosts.category,
        author: schema.blogPosts.author,
        isPublished: schema.blogPosts.isPublished,
        publishedAt: schema.blogPosts.publishedAt,
        tags: schema.blogPosts.tags,
        createdAt: schema.blogPosts.createdAt,
        updatedAt: schema.blogPosts.updatedAt,
      })
      .from(schema.blogPosts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.blogPosts.createdAt));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { count: posts.length, posts },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 2. create_blog_post
// ---------------------------------------------------------------------------
server.tool(
  "create_blog_post",
  "Create a new blog post. Content supports Markdown.",
  {
    title: z.string().min(10).describe("Post title (min 10 chars)"),
    slug: z
      .string()
      .min(3)
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only")
      .describe("URL slug, e.g. 'best-coves-costa-brava'"),
    content: z.string().min(100).describe("Full article content in Markdown (min 100 chars)"),
    category: z.string().min(1).describe("Category, e.g. 'Guias', 'Destinos', 'Consejos'"),
    excerpt: z.string().optional().describe("Short summary for cards/listings"),
    metaDescription: z
      .string()
      .max(160)
      .optional()
      .describe("SEO meta description (max 160 chars)"),
    tags: z.array(z.string()).optional().describe("Array of SEO tags/keywords"),
    isPublished: z
      .boolean()
      .optional()
      .describe("Publish immediately. Defaults to false (draft)."),
  },
  async ({ title, slug, content, category, excerpt, metaDescription, tags, isPublished }) => {
    try {
      const now = new Date();
      const published = isPublished ?? false;

      const [post] = await db
        .insert(schema.blogPosts)
        .values({
          title,
          slug,
          content,
          category,
          excerpt: excerpt ?? null,
          metaDescription: metaDescription ?? null,
          tags: tags ?? null,
          isPublished: published,
          publishedAt: published ? now : null,
          author: "Costa Brava Rent a Boat",
        })
        .returning();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { success: true, message: `Blog post "${title}" created`, post },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error creating blog post: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// 3. update_blog_post
// ---------------------------------------------------------------------------
server.tool(
  "update_blog_post",
  "Update an existing blog post by its ID. Only provided fields are updated.",
  {
    postId: z.string().describe("The blog post ID to update"),
    title: z.string().min(10).optional().describe("New title"),
    content: z.string().min(100).optional().describe("New Markdown content"),
    excerpt: z.string().optional().describe("New excerpt"),
    category: z.string().optional().describe("New category"),
    metaDescription: z.string().max(160).optional().describe("New SEO meta description"),
    tags: z.array(z.string()).optional().describe("New tags array"),
    isPublished: z.boolean().optional().describe("Set publication status"),
  },
  async ({ postId, title, content, excerpt, category, metaDescription, tags, isPublished }) => {
    try {
      // Check the post exists
      const [existing] = await db
        .select({ id: schema.blogPosts.id, isPublished: schema.blogPosts.isPublished })
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.id, postId));

      if (!existing) {
        return {
          content: [{ type: "text" as const, text: `Blog post with ID "${postId}" not found.` }],
          isError: true,
        };
      }

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (excerpt !== undefined) updates.excerpt = excerpt;
      if (category !== undefined) updates.category = category;
      if (metaDescription !== undefined) updates.metaDescription = metaDescription;
      if (tags !== undefined) updates.tags = tags;
      if (isPublished !== undefined) {
        updates.isPublished = isPublished;
        // Set publishedAt when first published
        if (isPublished && !existing.isPublished) {
          updates.publishedAt = new Date();
        }
      }

      const [updated] = await db
        .update(schema.blogPosts)
        .set(updates)
        .where(eq(schema.blogPosts.id, postId))
        .returning();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { success: true, message: `Blog post "${postId}" updated`, post: updated },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error updating blog post: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// 4. list_destinations
// ---------------------------------------------------------------------------
server.tool(
  "list_destinations",
  "List all destination pages with optional filter by publication status",
  {
    status: z
      .enum(["published", "draft", "all"])
      .optional()
      .describe("Filter by publication status. Defaults to 'all'."),
  },
  async ({ status }) => {
    const conditions = [];

    if (status === "published") {
      conditions.push(eq(schema.destinations.isPublished, true));
    } else if (status === "draft") {
      conditions.push(eq(schema.destinations.isPublished, false));
    }

    const items = await db
      .select({
        id: schema.destinations.id,
        name: schema.destinations.name,
        slug: schema.destinations.slug,
        description: schema.destinations.description,
        coordinates: schema.destinations.coordinates,
        distanceFromPort: schema.destinations.distanceFromPort,
        isPublished: schema.destinations.isPublished,
        nearbyAttractions: schema.destinations.nearbyAttractions,
        recommendedBoats: schema.destinations.recommendedBoats,
        createdAt: schema.destinations.createdAt,
        updatedAt: schema.destinations.updatedAt,
      })
      .from(schema.destinations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.destinations.createdAt));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { count: items.length, destinations: items },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 5. create_destination
// ---------------------------------------------------------------------------
server.tool(
  "create_destination",
  "Create a new destination landing page for SEO. Content supports Markdown.",
  {
    name: z.string().min(3).describe("Destination name, e.g. 'Cala Bona'"),
    slug: z
      .string()
      .min(3)
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only")
      .describe("URL slug, e.g. 'cala-bona'"),
    description: z.string().min(50).describe("Short intro/description (min 50 chars)"),
    content: z.string().min(100).describe("Full page content in Markdown (min 100 chars)"),
    metaDescription: z
      .string()
      .max(160)
      .optional()
      .describe("SEO meta description (max 160 chars)"),
    coordinates: z
      .object({ lat: z.number(), lng: z.number() })
      .optional()
      .describe("GPS coordinates { lat, lng }"),
    distanceFromPort: z
      .string()
      .optional()
      .describe("Distance from Blanes port, e.g. '2.5 km'"),
    nearbyAttractions: z
      .array(z.string())
      .optional()
      .describe("List of nearby points of interest"),
    recommendedBoats: z
      .array(z.string())
      .optional()
      .describe("Array of boat IDs recommended for this destination"),
  },
  async ({
    name,
    slug,
    description,
    content,
    metaDescription,
    coordinates,
    distanceFromPort,
    nearbyAttractions,
    recommendedBoats,
  }) => {
    try {
      const [destination] = await db
        .insert(schema.destinations)
        .values({
          name,
          slug,
          description,
          content,
          metaDescription: metaDescription ?? null,
          coordinates: coordinates ?? null,
          distanceFromPort: distanceFromPort ?? null,
          nearbyAttractions: nearbyAttractions ?? null,
          recommendedBoats: recommendedBoats ?? null,
          isPublished: true,
        })
        .returning();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { success: true, message: `Destination "${name}" created`, destination },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error creating destination: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// 6. get_page_visits
// ---------------------------------------------------------------------------
server.tool(
  "get_page_visits",
  "Get analytics data for page visits. Supports filtering by path and time period, with grouping options.",
  {
    pagePath: z
      .string()
      .optional()
      .describe("Filter by page path (partial match, e.g. '/blog')"),
    period: z
      .enum(["today", "week", "month"])
      .optional()
      .describe("Time period filter. Defaults to 'month'."),
    groupBy: z
      .enum(["page", "device", "country", "referrer"])
      .optional()
      .describe("Group results by this dimension. Defaults to 'page'."),
  },
  async ({ pagePath, period, groupBy }) => {
    const effectivePeriod = period ?? "month";
    const effectiveGroupBy = groupBy ?? "page";

    // Calculate start date
    const now = new Date();
    let startDate: Date;
    if (effectivePeriod === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (effectivePeriod === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Map groupBy to the actual column
    const groupColumn = {
      page: schema.pageVisits.pagePath,
      device: schema.pageVisits.deviceType,
      country: schema.pageVisits.country,
      referrer: schema.pageVisits.referrer,
    }[effectiveGroupBy];

    const conditions = [gte(schema.pageVisits.visitedAt, startDate)];

    if (pagePath) {
      conditions.push(ilike(schema.pageVisits.pagePath, `%${pagePath}%`));
    }

    const results = await db
      .select({
        dimension: groupColumn,
        visits: count(),
      })
      .from(schema.pageVisits)
      .where(and(...conditions))
      .groupBy(groupColumn)
      .orderBy(desc(count()));

    // Also get total visits for the period
    const [totals] = await db
      .select({ total: count() })
      .from(schema.pageVisits)
      .where(and(...conditions));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              period: effectivePeriod,
              groupBy: effectiveGroupBy,
              totalVisits: totals?.total ?? 0,
              breakdown: results,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 7. get_seo_audit
// ---------------------------------------------------------------------------
server.tool(
  "get_seo_audit",
  "Run a basic SEO audit on a blog post or destination page by its slug. Checks title, meta description, content length, images, and more.",
  {
    slug: z.string().describe("The slug of the blog post or destination to audit"),
  },
  async ({ slug }) => {
    // Try blog post first, then destination
    const [blogPost] = await db
      .select()
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.slug, slug));

    const [destination] = await db
      .select()
      .from(schema.destinations)
      .where(eq(schema.destinations.slug, slug));

    const item = blogPost ?? destination;

    if (!item) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No blog post or destination found with slug "${slug}".`,
          },
        ],
        isError: true,
      };
    }

    const contentType = blogPost ? "blog_post" : "destination";
    const issues: string[] = [];
    const passed: string[] = [];

    // Title check
    const title = "title" in item ? item.title : ("name" in item ? (item as typeof destination).name : "");
    if (!title || title.length === 0) {
      issues.push("CRITICAL: Missing title/name");
    } else if (title.length < 30) {
      issues.push(`WARNING: Title is short (${title.length} chars). Aim for 50-60 chars for SEO.`);
    } else if (title.length > 70) {
      issues.push(`WARNING: Title may be too long (${title.length} chars). Search engines truncate around 60 chars.`);
    } else {
      passed.push(`Title length OK (${title.length} chars)`);
    }

    // Meta description check
    const metaDesc = item.metaDescription;
    if (!metaDesc || metaDesc.length === 0) {
      issues.push("CRITICAL: Missing meta description. Search engines will auto-generate one.");
    } else if (metaDesc.length < 120) {
      issues.push(`WARNING: Meta description is short (${metaDesc.length} chars). Aim for 150-160 chars.`);
    } else if (metaDesc.length > 160) {
      issues.push(`WARNING: Meta description too long (${metaDesc.length} chars). Will be truncated at 160 chars.`);
    } else {
      passed.push(`Meta description length OK (${metaDesc.length} chars)`);
    }

    // Content length check
    const content = item.content ?? "";
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) {
      issues.push(`CRITICAL: Content is very thin (${wordCount} words). Aim for at least 300 words.`);
    } else if (wordCount < 300) {
      issues.push(`WARNING: Content is short (${wordCount} words). Aim for 600+ words for better SEO.`);
    } else if (wordCount < 600) {
      issues.push(`INFO: Content length is acceptable (${wordCount} words). 600+ words is ideal.`);
    } else {
      passed.push(`Content length excellent (${wordCount} words)`);
    }

    // Image check
    const featuredImage = item.featuredImage;
    if (!featuredImage) {
      issues.push("WARNING: No featured image set. Images improve engagement and SEO.");
    } else {
      passed.push("Featured image present");
    }

    // Content has headings (Markdown h2/h3)
    const hasHeadings = /^#{2,3}\s/m.test(content);
    if (!hasHeadings) {
      issues.push("WARNING: No H2/H3 headings found in content. Headings improve readability and SEO.");
    } else {
      passed.push("Content has structured headings");
    }

    // Content has internal links
    const hasLinks = /\[.*?\]\(.*?\)/.test(content);
    if (!hasLinks) {
      issues.push("INFO: No Markdown links found in content. Internal linking improves SEO.");
    } else {
      passed.push("Content contains links");
    }

    // Blog-specific checks
    if (blogPost) {
      if (!blogPost.excerpt || blogPost.excerpt.length === 0) {
        issues.push("WARNING: No excerpt set. Excerpts are used for social sharing and blog listings.");
      } else {
        passed.push("Excerpt present");
      }

      if (!blogPost.tags || blogPost.tags.length === 0) {
        issues.push("INFO: No tags set. Tags help with content organization and internal linking.");
      } else {
        passed.push(`Tags present (${blogPost.tags.length} tags)`);
      }

      if (!blogPost.isPublished) {
        issues.push("INFO: Post is in draft status (not published).");
      }
    }

    // Destination-specific checks
    if (destination) {
      if (!destination.coordinates) {
        issues.push("INFO: No GPS coordinates set. Coordinates enable map features.");
      } else {
        passed.push("GPS coordinates present");
      }

      if (!destination.nearbyAttractions || destination.nearbyAttractions.length === 0) {
        issues.push("INFO: No nearby attractions listed. These enrich the page content.");
      } else {
        passed.push(`Nearby attractions listed (${destination.nearbyAttractions.length})`);
      }

      const gallery = "imageGallery" in destination ? (destination as typeof destination).imageGallery : null;
      if (!gallery || gallery.length === 0) {
        issues.push("INFO: No image gallery. Multiple images improve engagement.");
      } else {
        passed.push(`Image gallery present (${gallery.length} images)`);
      }
    }

    // Score calculation
    const criticalCount = issues.filter((i) => i.startsWith("CRITICAL")).length;
    const warningCount = issues.filter((i) => i.startsWith("WARNING")).length;
    const infoCount = issues.filter((i) => i.startsWith("INFO")).length;

    let score = 100;
    score -= criticalCount * 25;
    score -= warningCount * 10;
    score -= infoCount * 3;
    score = Math.max(0, Math.min(100, score));

    let rating: string;
    if (score >= 90) rating = "Excellent";
    else if (score >= 70) rating = "Good";
    else if (score >= 50) rating = "Needs Improvement";
    else rating = "Poor";

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              slug,
              contentType,
              title,
              score,
              rating,
              summary: {
                critical: criticalCount,
                warnings: warningCount,
                info: infoCount,
                passed: passed.length,
              },
              issues,
              passed,
              meta: {
                wordCount,
                metaDescriptionLength: metaDesc?.length ?? 0,
                titleLength: title.length,
                hasHeadings,
                hasLinks,
                hasFeaturedImage: !!featuredImage,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 8. autopilot_status
// ---------------------------------------------------------------------------
server.tool(
  "autopilot_status",
  "Get the current status of the blog autopilot: enabled/disabled, season, next run, monthly stats, and estimated costs.",
  {},
  async () => {
    try {
      const config = await getConfig();
      const currentMonth = new Date().getMonth() + 1; // 1-indexed
      const inSeason =
        config.seasonStartMonth <= config.seasonEndMonth
          ? currentMonth >= config.seasonStartMonth && currentMonth <= config.seasonEndMonth
          : currentMonth >= config.seasonStartMonth || currentMonth <= config.seasonEndMonth;

      // Monthly stats from log
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const logEntries = await db
        .select()
        .from(schema.blogAutopilotLog)
        .where(gte(schema.blogAutopilotLog.createdAt, monthStart));

      const successCount = logEntries.filter(
        (e) => e.status === "success" && (e.type === "new" || e.type === "manual"),
      ).length;
      const refreshCount = logEntries.filter(
        (e) => e.status === "success" && e.type === "refresh",
      ).length;
      const errorCount = logEntries.filter((e) => e.status === "error").length;

      const totalInputTokens = logEntries.reduce((s, e) => s + (e.tokensInput ?? 0), 0);
      const totalOutputTokens = logEntries.reduce((s, e) => s + (e.tokensOutput ?? 0), 0);
      const estimatedCost =
        (totalInputTokens * 3) / 1_000_000 + (totalOutputTokens * 15) / 1_000_000;

      // Pending drafts
      const [pendingResult] = await db
        .select({ count: count() })
        .from(schema.blogPosts)
        .where(
          and(
            eq(schema.blogPosts.isPublished, false),
            eq(schema.blogPosts.isAutoGenerated, true),
          ),
        );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                enabled: config.isEnabled,
                inSeason,
                currentMonth,
                seasonRange: `${config.seasonStartMonth}-${config.seasonEndMonth}`,
                schedule: config.cronSchedule,
                model: config.model,
                languages: config.languages,
                publishDelayHours: config.publishDelayHours,
                monthlyStats: {
                  newPosts: successCount,
                  refreshes: refreshCount,
                  errors: errorCount,
                  totalInputTokens,
                  totalOutputTokens,
                  estimatedCostUsd: `$${estimatedCost.toFixed(4)}`,
                },
                pendingDrafts: pendingResult?.count ?? 0,
                apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
                unsplashConfigured: !!process.env.UNSPLASH_ACCESS_KEY,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// 9. autopilot_configure
// ---------------------------------------------------------------------------
server.tool(
  "autopilot_configure",
  "Update blog autopilot configuration. Only provided fields are updated.",
  {
    isEnabled: z.boolean().optional().describe("Enable or disable the autopilot"),
    cronSchedule: z.string().optional().describe("Cron schedule expression"),
    model: z.string().optional().describe("AI model to use for generation"),
    languages: z
      .array(z.string())
      .optional()
      .describe("Array of language codes to generate content in"),
    maxPostsPerWeek: z
      .number()
      .int()
      .min(1)
      .max(14)
      .optional()
      .describe("Maximum posts generated per week (1-14)"),
    seasonStartMonth: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe("Season start month (1-12)"),
    seasonEndMonth: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe("Season end month (1-12)"),
    publishDelayHours: z
      .number()
      .int()
      .min(0)
      .max(168)
      .optional()
      .describe("Hours to wait before auto-publishing a draft (0-168)"),
    minSeoScore: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .describe("Minimum SEO score required to publish (0-100)"),
    refreshRatio: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Every N posts, do a refresh instead of a new post"),
    unsplashEnabled: z
      .boolean()
      .optional()
      .describe("Enable fetching images from Unsplash"),
    useWhatsappTopics: z
      .boolean()
      .optional()
      .describe("Use WhatsApp conversation topics for content ideas"),
  },
  async (params) => {
    try {
      const config = await getConfig();
      const updates: Record<string, unknown> = { updatedAt: new Date() };

      if (params.isEnabled !== undefined) updates.isEnabled = params.isEnabled;
      if (params.cronSchedule !== undefined) updates.cronSchedule = params.cronSchedule;
      if (params.model !== undefined) updates.model = params.model;
      if (params.languages !== undefined) updates.languages = params.languages;
      if (params.maxPostsPerWeek !== undefined) updates.maxPostsPerWeek = params.maxPostsPerWeek;
      if (params.seasonStartMonth !== undefined) updates.seasonStartMonth = params.seasonStartMonth;
      if (params.seasonEndMonth !== undefined) updates.seasonEndMonth = params.seasonEndMonth;
      if (params.publishDelayHours !== undefined)
        updates.publishDelayHours = params.publishDelayHours;
      if (params.minSeoScore !== undefined) updates.minSeoScore = params.minSeoScore;
      if (params.refreshRatio !== undefined) updates.refreshRatio = params.refreshRatio;
      if (params.unsplashEnabled !== undefined) updates.unsplashEnabled = params.unsplashEnabled;
      if (params.useWhatsappTopics !== undefined)
        updates.useWhatsappTopics = params.useWhatsappTopics;

      const [updated] = await db
        .update(schema.blogAutopilotConfig)
        .set(updates)
        .where(eq(schema.blogAutopilotConfig.id, config.id))
        .returning();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { success: true, message: "Autopilot configuration updated", config: updated },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// 10. autopilot_generate_now
// ---------------------------------------------------------------------------
server.tool(
  "autopilot_generate_now",
  "Force immediate generation of a blog post, ignoring season and weekly limits.",
  {
    type: z
      .enum(["new", "refresh"])
      .optional()
      .describe("Type of generation: 'new' for a fresh post, 'refresh' to update an existing one. Defaults to 'new'."),
  },
  async ({ type }) => {
    try {
      const result = await runAutopilotPipeline({
        forceGeneration: true,
        type: type || "manual",
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// 11. autopilot_queue
// ---------------------------------------------------------------------------
server.tool(
  "autopilot_queue",
  "View or manage the topic queue. Can list planned topics, regenerate the queue, or discard a topic.",
  {
    action: z
      .enum(["list", "regenerate", "discard"])
      .describe("Action to perform on the queue"),
    topicId: z
      .string()
      .optional()
      .describe("Topic ID to discard (required when action is 'discard')"),
  },
  async ({ action, topicId }) => {
    try {
      if (action === "list") {
        const topics = await db
          .select()
          .from(schema.blogAutopilotQueue)
          .where(eq(schema.blogAutopilotQueue.status, "planned"))
          .orderBy(schema.blogAutopilotQueue.priority);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ count: topics.length, topics }, null, 2),
            },
          ],
        };
      }

      if (action === "regenerate") {
        // Mark existing planned topics as discarded
        await db
          .update(schema.blogAutopilotQueue)
          .set({ status: "discarded" })
          .where(eq(schema.blogAutopilotQueue.status, "planned"));

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return {
            content: [
              { type: "text" as const, text: "Error: ANTHROPIC_API_KEY is not configured" },
            ],
            isError: true,
          };
        }

        const newTopics = await generateTopicQueue(apiKey, 6);

        // Insert new topics into queue
        for (let i = 0; i < newTopics.length; i++) {
          const t = newTopics[i];
          // Resolve cluster name to ID if possible
          let clusterId: string | null = null;
          if (t.clusterName) {
            const [cluster] = await db
              .select({ id: schema.blogClusters.id })
              .from(schema.blogClusters)
              .where(eq(schema.blogClusters.name, t.clusterName))
              .limit(1);
            clusterId = cluster?.id ?? null;
          }
          await db.insert(schema.blogAutopilotQueue).values({
            topic: t.topic,
            keywords: t.keywords,
            type: t.type,
            clusterId,
            priority: i,
            status: "planned",
          });
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Regenerated queue with ${newTopics.length} topics`,
                  topics: newTopics,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      if (action === "discard") {
        if (!topicId) {
          return {
            content: [
              { type: "text" as const, text: "Error: topicId is required for discard action" },
            ],
            isError: true,
          };
        }

        const [updated] = await db
          .update(schema.blogAutopilotQueue)
          .set({ status: "discarded" })
          .where(eq(schema.blogAutopilotQueue.id, topicId))
          .returning();

        if (!updated) {
          return {
            content: [
              { type: "text" as const, text: `Error: Topic with ID "${topicId}" not found` },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { success: true, message: `Topic "${topicId}" discarded`, topic: updated },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [{ type: "text" as const, text: "Error: Unknown action" }],
        isError: true,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// 12. autopilot_history
// ---------------------------------------------------------------------------
server.tool(
  "autopilot_history",
  "View recent autopilot execution history with costs and performance metrics.",
  {
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Number of entries to return (1-50, default 10)"),
  },
  async ({ limit }) => {
    try {
      const effectiveLimit = limit ?? 10;

      const entries = await db
        .select()
        .from(schema.blogAutopilotLog)
        .orderBy(desc(schema.blogAutopilotLog.createdAt))
        .limit(effectiveLimit);

      const totalInputTokens = entries.reduce((s, e) => s + (e.tokensInput ?? 0), 0);
      const totalOutputTokens = entries.reduce((s, e) => s + (e.tokensOutput ?? 0), 0);
      const totalCost =
        (totalInputTokens * 3) / 1_000_000 + (totalOutputTokens * 15) / 1_000_000;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                count: entries.length,
                totalInputTokens,
                totalOutputTokens,
                totalCostUsd: `$${totalCost.toFixed(4)}`,
                entries,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// 13. autopilot_refresh_post
// ---------------------------------------------------------------------------
server.tool(
  "autopilot_refresh_post",
  "Force a content refresh of a specific blog post to improve its SEO performance.",
  {
    postId: z.string().describe("The blog post ID to refresh"),
  },
  async ({ postId }) => {
    try {
      // Verify the post exists
      const [post] = await db
        .select({ id: schema.blogPosts.id, title: schema.blogPosts.title })
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.id, postId));

      if (!post) {
        return {
          content: [
            { type: "text" as const, text: `Error: Blog post with ID "${postId}" not found` },
          ],
          isError: true,
        };
      }

      const result = await runAutopilotPipeline({
        forceGeneration: true,
        type: "refresh",
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: result.success,
                message: result.success
                  ? `Post "${post.title}" refresh initiated`
                  : result.error,
                result,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// 14. autopilot_cluster_status
// ---------------------------------------------------------------------------
server.tool(
  "autopilot_cluster_status",
  "View all topical clusters with their progress, posts, and traffic data.",
  {},
  async () => {
    try {
      const clusters = await db.select().from(schema.blogClusters);

      const enrichedClusters = await Promise.all(
        clusters.map(async (cluster) => {
          const posts = await db
            .select({
              id: schema.blogPosts.id,
              title: schema.blogPosts.title,
              slug: schema.blogPosts.slug,
              isPublished: schema.blogPosts.isPublished,
              publishedAt: schema.blogPosts.publishedAt,
              seoScore: schema.blogPosts.seoScore,
            })
            .from(schema.blogPosts)
            .where(eq(schema.blogPosts.clusterId, cluster.id));

          return {
            ...cluster,
            postCount: posts.length,
            publishedCount: posts.filter((p) => p.isPublished).length,
            avgSeoScore:
              posts.length > 0
                ? Math.round(
                    posts.reduce((s, p) => s + (p.seoScore ?? 0), 0) / posts.length,
                  )
                : null,
            posts,
          };
        }),
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { count: enrichedClusters.length, clusters: enrichedClusters },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Costa Brava Content MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
