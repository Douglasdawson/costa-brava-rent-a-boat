import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { eq, and, desc, sql, count, gte, ilike } from "drizzle-orm";
import { db } from "./shared/db.js";
import * as schema from "../../shared/schema.js";

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
