/**
 * Blog Topic Engine
 *
 * Selects the next blog topic by analyzing WhatsApp conversations,
 * page visit analytics, existing posts, cluster status, and business context.
 * Uses Claude Sonnet for final topic selection.
 */

import Anthropic from "@anthropic-ai/sdk";
import { desc, sql, count, eq, gte, and } from "drizzle-orm";
import { db } from "../mcp/shared/db.js";
import * as schema from "../../shared/schema.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = ["es", "en", "fr", "de", "it", "nl", "ru", "ca"] as const;

const TOPIC_CATEGORIES = ["Destinos", "Guias", "Consejos", "Actividades", "Costa Brava"] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopicSuggestion {
  topic: string;       // Full title in Spanish
  slug: string;        // URL-friendly slug
  category: string;    // Destinos | Guias | Consejos | Actividades | Costa Brava
  keywords: string[];  // 5 SEO keywords
  clusterName: string; // Cluster name
  type: "pillar" | "satellite";
  reasoning: string;   // Why this topic
}

// ---------------------------------------------------------------------------
// Internal helper: WhatsApp conversation insights
// ---------------------------------------------------------------------------

async function getWhatsappInsights(): Promise<string> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Get conversation state distribution
    const stateDistribution = await db
      .select({
        state: schema.chatbotConversations.currentState,
        total: count(),
      })
      .from(schema.chatbotConversations)
      .where(gte(schema.chatbotConversations.lastMessageAt, ninetyDaysAgo))
      .groupBy(schema.chatbotConversations.currentState)
      .orderBy(desc(count()));

    // Get total conversations and average messages
    const totals = await db
      .select({
        totalConversations: count(),
        avgMessages: sql<number>`ROUND(AVG(${schema.chatbotConversations.messagesCount}), 1)`,
      })
      .from(schema.chatbotConversations)
      .where(gte(schema.chatbotConversations.lastMessageAt, ninetyDaysAgo));

    // Get language distribution
    const langDistribution = await db
      .select({
        language: schema.chatbotConversations.language,
        total: count(),
      })
      .from(schema.chatbotConversations)
      .where(gte(schema.chatbotConversations.lastMessageAt, ninetyDaysAgo))
      .groupBy(schema.chatbotConversations.language)
      .orderBy(desc(count()));

    // Get boats most asked about
    const boatInterest = await db
      .select({
        boatId: schema.chatbotConversations.selectedBoatId,
        total: count(),
      })
      .from(schema.chatbotConversations)
      .where(
        and(
          gte(schema.chatbotConversations.lastMessageAt, ninetyDaysAgo),
          sql`${schema.chatbotConversations.selectedBoatId} IS NOT NULL`
        )
      )
      .groupBy(schema.chatbotConversations.selectedBoatId)
      .orderBy(desc(count()));

    const stats = totals[0];
    const statesStr = stateDistribution
      .map((s) => `  - ${s.state}: ${s.total}`)
      .join("\n");
    const langsStr = langDistribution
      .map((l) => `  - ${l.language}: ${l.total}`)
      .join("\n");
    const boatsStr = boatInterest
      .map((b) => `  - Boat ${b.boatId}: ${b.total} inquiries`)
      .join("\n");

    return [
      `WhatsApp Chatbot Insights (last 90 days):`,
      `Total conversations: ${stats?.totalConversations ?? 0}`,
      `Average messages per conversation: ${stats?.avgMessages ?? 0}`,
      ``,
      `Conversation states (what users ask about):`,
      statesStr || "  No data",
      ``,
      `Languages:`,
      langsStr || "  No data",
      ``,
      `Boat interest:`,
      boatsStr || "  No data",
    ].join("\n");
  } catch (error) {
    return "WhatsApp insights: unavailable (table may be empty or not yet created)";
  }
}

// ---------------------------------------------------------------------------
// Internal helper: Page visit insights
// ---------------------------------------------------------------------------

async function getPageVisitsInsights(): Promise<string> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Top 20 blog pages by visits
    const topPages = await db
      .select({
        pagePath: schema.pageVisits.pagePath,
        visits: count(),
      })
      .from(schema.pageVisits)
      .where(
        and(
          gte(schema.pageVisits.visitedAt, thirtyDaysAgo),
          sql`${schema.pageVisits.pagePath} LIKE '/blog%'`
        )
      )
      .groupBy(schema.pageVisits.pagePath)
      .orderBy(desc(count()))
      .limit(20);

    // Top non-blog pages for context on user interests
    const topOtherPages = await db
      .select({
        pagePath: schema.pageVisits.pagePath,
        visits: count(),
      })
      .from(schema.pageVisits)
      .where(
        and(
          gte(schema.pageVisits.visitedAt, thirtyDaysAgo),
          sql`${schema.pageVisits.pagePath} NOT LIKE '/blog%'`
        )
      )
      .groupBy(schema.pageVisits.pagePath)
      .orderBy(desc(count()))
      .limit(10);

    const blogStr = topPages.length > 0
      ? topPages.map((p) => `  - ${p.pagePath}: ${p.visits} visits`).join("\n")
      : "  No blog visits recorded";

    const otherStr = topOtherPages.length > 0
      ? topOtherPages.map((p) => `  - ${p.pagePath}: ${p.visits} visits`).join("\n")
      : "  No page visits recorded";

    return [
      `Page Visit Analytics (last 30 days):`,
      ``,
      `Top blog pages:`,
      blogStr,
      ``,
      `Top non-blog pages (user interest signals):`,
      otherStr,
    ].join("\n");
  } catch (error) {
    return "Page visit insights: unavailable (table may be empty or not yet created)";
  }
}

// ---------------------------------------------------------------------------
// Internal helper: Existing posts summary
// ---------------------------------------------------------------------------

async function getExistingPostsSummary(): Promise<string> {
  try {
    const posts = await db
      .select({
        title: schema.blogPosts.title,
        slug: schema.blogPosts.slug,
        category: schema.blogPosts.category,
        tags: schema.blogPosts.tags,
        isPublished: schema.blogPosts.isPublished,
        createdAt: schema.blogPosts.createdAt,
      })
      .from(schema.blogPosts)
      .orderBy(desc(schema.blogPosts.createdAt));

    if (posts.length === 0) {
      return "Existing blog posts: none yet (fresh start)";
    }

    const postsStr = posts
      .map((p) => {
        const status = p.isPublished ? "published" : "draft";
        const tags = p.tags?.join(", ") ?? "no tags";
        return `  - [${status}] "${p.title}" (/${p.slug}) | Category: ${p.category} | Tags: ${tags}`;
      })
      .join("\n");

    const publishedCount = posts.filter((p) => p.isPublished).length;

    return [
      `Existing Blog Posts (${posts.length} total, ${publishedCount} published):`,
      postsStr,
    ].join("\n");
  } catch (error) {
    return "Existing posts: unavailable (table may be empty or not yet created)";
  }
}

// ---------------------------------------------------------------------------
// Internal helper: Clusters summary
// ---------------------------------------------------------------------------

async function getClustersSummary(): Promise<string> {
  try {
    const clusters = await db
      .select()
      .from(schema.blogClusters)
      .orderBy(desc(schema.blogClusters.createdAt));

    if (clusters.length === 0) {
      return "Blog clusters: none defined yet (will create new ones)";
    }

    const clustersStr = clusters
      .map((c) => {
        const planned = c.plannedTopics?.length ?? 0;
        const completed = c.completedCount;
        const status = c.isComplete ? "COMPLETE" : `${completed}/${planned} done`;
        const hasPillar = c.pillarPostId ? "has pillar" : "needs pillar";
        const keywords = c.keywords?.join(", ") ?? "no keywords";
        return `  - "${c.name}" [${status}, ${hasPillar}] Keywords: ${keywords}`;
      })
      .join("\n");

    return [
      `Blog Clusters (${clusters.length} total):`,
      clustersStr,
    ].join("\n");
  } catch (error) {
    return "Clusters: unavailable (table may be empty or not yet created)";
  }
}

// ---------------------------------------------------------------------------
// Internal helper: Business context (boats + destinations)
// ---------------------------------------------------------------------------

async function getBusinessContext(): Promise<string> {
  try {
    const boatsList = await db
      .select({
        id: schema.boats.id,
        name: schema.boats.name,
        capacity: schema.boats.capacity,
        requiresLicense: schema.boats.requiresLicense,
      })
      .from(schema.boats);

    const destinationsList = await db
      .select({
        name: schema.destinations.name,
        slug: schema.destinations.slug,
      })
      .from(schema.destinations)
      .where(eq(schema.destinations.isPublished, true));

    const boatsStr = boatsList.length > 0
      ? boatsList
          .map((b) => `  - ${b.name} (capacity: ${b.capacity}, license: ${b.requiresLicense ? "required" : "not required"})`)
          .join("\n")
      : "  No boats in database";

    const destsStr = destinationsList.length > 0
      ? destinationsList.map((d) => `  - ${d.name} (/destinos/${d.slug})`).join("\n")
      : "  No published destinations";

    return [
      `Business Context:`,
      `Location: Puerto de Blanes, Costa Brava, Girona, Spain`,
      `Season: April - October`,
      ``,
      `Available boats:`,
      boatsStr,
      ``,
      `Published destinations (for internal linking):`,
      destsStr,
    ].join("\n");
  } catch (error) {
    return "Business context: unavailable (tables may be empty or not yet created)";
  }
}

// ---------------------------------------------------------------------------
// Internal helper: Queued topics
// ---------------------------------------------------------------------------

async function getQueuedTopics(): Promise<string> {
  try {
    const queued = await db
      .select({
        topic: schema.blogAutopilotQueue.topic,
        status: schema.blogAutopilotQueue.status,
        type: schema.blogAutopilotQueue.type,
      })
      .from(schema.blogAutopilotQueue)
      .where(
        sql`${schema.blogAutopilotQueue.status} IN ('planned', 'scheduled', 'writing')`
      );

    if (queued.length === 0) {
      return "Queued topics: none (queue is empty)";
    }

    const queuedStr = queued
      .map((q) => `  - [${q.status}] (${q.type}) "${q.topic}"`)
      .join("\n");

    return [
      `Already Queued Topics (${queued.length}):`,
      queuedStr,
    ].join("\n");
  } catch (error) {
    return "Queued topics: unavailable (table may be empty or not yet created)";
  }
}

// ---------------------------------------------------------------------------
// Internal helper: Gather all context
// ---------------------------------------------------------------------------

async function gatherAllContext(): Promise<string> {
  // Run all data gathering in parallel for performance
  const [
    whatsappInsights,
    pageVisitsInsights,
    existingPosts,
    clustersSummary,
    businessContext,
    queuedTopics,
  ] = await Promise.all([
    getWhatsappInsights(),
    getPageVisitsInsights(),
    getExistingPostsSummary(),
    getClustersSummary(),
    getBusinessContext(),
    getQueuedTopics(),
  ]);

  return [
    whatsappInsights,
    "",
    "---",
    "",
    pageVisitsInsights,
    "",
    "---",
    "",
    existingPosts,
    "",
    "---",
    "",
    clustersSummary,
    "",
    "---",
    "",
    businessContext,
    "",
    "---",
    "",
    queuedTopics,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Exported: selectNextTopic
// ---------------------------------------------------------------------------

export async function selectNextTopic(anthropicApiKey: string): Promise<TopicSuggestion> {
  const context = await gatherAllContext();

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an SEO content strategist for a boat rental business in Blanes, Costa Brava, Spain.

Based on the following data, select the single BEST next blog topic to write. Prioritize:
1. Topics that fill gaps in existing content (no duplicates)
2. Topics aligned with what WhatsApp users are asking about
3. Topics for pages/destinations that get traffic but have no blog content
4. Pillar posts for clusters that don't have one yet
5. Satellite posts for incomplete clusters
6. Seasonal relevance (current month: ${new Date().toLocaleString("en", { month: "long" })})
7. Long-tail SEO opportunity

IMPORTANT: Do NOT suggest topics that already exist as published posts or are already in the queue.

Categories must be one of: ${TOPIC_CATEGORIES.join(", ")}

DATA:
${context}

Respond with ONLY a JSON object (no markdown, no wrapping):
{
  "topic": "Full title in Spanish",
  "slug": "url-friendly-slug-in-spanish",
  "category": "one of the categories above",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "clusterName": "name of the cluster this belongs to (existing or new)",
  "type": "pillar or satellite",
  "reasoning": "Brief explanation of why this is the best next topic"
}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const suggestion: TopicSuggestion = JSON.parse(textBlock.text);
  return suggestion;
}

// ---------------------------------------------------------------------------
// Exported: generateTopicQueue
// ---------------------------------------------------------------------------

export async function generateTopicQueue(
  anthropicApiKey: string,
  topicCount: number = 6,
): Promise<TopicSuggestion[]> {
  const context = await gatherAllContext();

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an SEO content strategist for a boat rental business in Blanes, Costa Brava, Spain.

Based on the following data, generate a queue of ${topicCount} blog topics to write next. Order them by priority (best first). Ensure:
1. No duplicates with existing posts or queued topics
2. A mix of pillar and satellite posts
3. Good cluster coverage (don't put all topics in one cluster)
4. Seasonal relevance (current month: ${new Date().toLocaleString("en", { month: "long" })})
5. Balance between categories: ${TOPIC_CATEGORIES.join(", ")}
6. Prioritize clusters that need a pillar post
7. Include long-tail SEO keywords

DATA:
${context}

Respond with ONLY a JSON array (no markdown, no wrapping):
[
  {
    "topic": "Full title in Spanish",
    "slug": "url-friendly-slug-in-spanish",
    "category": "one of the categories",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "clusterName": "cluster name (existing or new)",
    "type": "pillar or satellite",
    "reasoning": "Brief explanation"
  }
]`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const suggestions: TopicSuggestion[] = JSON.parse(textBlock.text);
  return suggestions;
}

// ---------------------------------------------------------------------------
// Exported: findPostToRefresh
// ---------------------------------------------------------------------------

export async function findPostToRefresh(): Promise<{
  postId: string;
  title: string;
  slug: string;
  visits: number;
  daysSinceCreation: number;
} | null> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all published posts older than 30 days
    const oldPosts = await db
      .select({
        id: schema.blogPosts.id,
        title: schema.blogPosts.title,
        slug: schema.blogPosts.slug,
        createdAt: schema.blogPosts.createdAt,
      })
      .from(schema.blogPosts)
      .where(
        and(
          eq(schema.blogPosts.isPublished, true),
          sql`${schema.blogPosts.createdAt} < ${thirtyDaysAgo}`
        )
      );

    if (oldPosts.length === 0) {
      return null;
    }

    // For each post, count page visits
    const postsWithVisits = await Promise.all(
      oldPosts.map(async (post) => {
        const visitResult = await db
          .select({ visits: count() })
          .from(schema.pageVisits)
          .where(
            sql`${schema.pageVisits.pagePath} LIKE ${`/blog/${post.slug}%`}`
          );

        const visits = visitResult[0]?.visits ?? 0;
        const daysSinceCreation = Math.floor(
          (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          postId: post.id,
          title: post.title,
          slug: post.slug,
          visits,
          daysSinceCreation,
        };
      })
    );

    // Sort by fewest visits (worst performing)
    postsWithVisits.sort((a, b) => a.visits - b.visits);

    return postsWithVisits[0] ?? null;
  } catch (error) {
    console.log("[BlogTopicEngine] findPostToRefresh error:", error);
    return null;
  }
}
