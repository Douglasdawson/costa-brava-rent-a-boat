import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { eq, and, gte, lte, desc, sql, count, sum, like, or, ilike, isNull } from "drizzle-orm";
import { db } from "./shared/db.js";
import * as schema from "../../shared/schema.js";

// ===== Helper: compute date range from period =====

function getDateRange(period: "today" | "week" | "month"): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "week") {
    start.setDate(start.getDate() - 7);
  } else if (period === "month") {
    start.setMonth(start.getMonth() - 1);
  }
  // "today" keeps start as beginning of today

  return { start, end };
}

// ===== Create MCP Server =====

const server = new McpServer({
  name: "chatbot-manager",
  version: "1.0.0",
});

// ===== Tool 1: get_recent_conversations =====

server.tool(
  "get_recent_conversations",
  "Get recent AI chat sessions with optional filtering by language or date",
  {
    limit: z.number().min(1).max(100).default(20).describe("Number of sessions to return"),
    language: z.string().optional().describe("Filter by language code (e.g. 'es', 'en')"),
    date: z.string().optional().describe("Filter by date (ISO format, e.g. '2026-03-03')"),
  },
  async ({ limit, language, date }) => {
    const conditions = [];

    if (language) {
      conditions.push(eq(schema.aiChatSessions.language, language));
    }

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      conditions.push(gte(schema.aiChatSessions.lastMessageAt, dayStart));
      conditions.push(lte(schema.aiChatSessions.lastMessageAt, dayEnd));
    }

    const sessions = await db
      .select()
      .from(schema.aiChatSessions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.aiChatSessions.lastMessageAt))
      .limit(limit);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              count: sessions.length,
              sessions: sessions.map((s) => ({
                id: s.id,
                phoneNumber: s.phoneNumber,
                profileName: s.profileName,
                language: s.language,
                totalMessages: s.totalMessages,
                intentScore: s.intentScore,
                isLead: s.isLead,
                leadQuality: s.leadQuality,
                topicsDiscussed: s.topicsDiscussed,
                boatsViewed: s.boatsViewed,
                firstMessageAt: s.firstMessageAt,
                lastMessageAt: s.lastMessageAt,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===== Tool 2: get_conversation_detail =====

server.tool(
  "get_conversation_detail",
  "Get full conversation detail including all messages for a given session",
  {
    sessionId: z.string().describe("The AI chat session ID"),
  },
  async ({ sessionId }) => {
    const [session] = await db
      .select()
      .from(schema.aiChatSessions)
      .where(eq(schema.aiChatSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: "Session not found" }),
          },
        ],
      };
    }

    const messages = await db
      .select()
      .from(schema.aiChatMessages)
      .where(eq(schema.aiChatMessages.sessionId, sessionId))
      .orderBy(schema.aiChatMessages.createdAt);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              session: {
                id: session.id,
                phoneNumber: session.phoneNumber,
                profileName: session.profileName,
                language: session.language,
                totalMessages: session.totalMessages,
                intentScore: session.intentScore,
                isLead: session.isLead,
                leadQuality: session.leadQuality,
                topicsDiscussed: session.topicsDiscussed,
                boatsViewed: session.boatsViewed,
                firstMessageAt: session.firstMessageAt,
                lastMessageAt: session.lastMessageAt,
              },
              messages: messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                detectedIntent: m.detectedIntent,
                detectedBoatId: m.detectedBoatId,
                sentiment: m.sentiment,
                tokensUsed: m.tokensUsed,
                createdAt: m.createdAt,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===== Tool 3: get_intent_stats =====

server.tool(
  "get_intent_stats",
  "Get aggregated intent statistics for chatbot messages within a time period",
  {
    period: z.enum(["today", "week", "month"]).describe("Time period for stats"),
  },
  async ({ period }) => {
    const { start, end } = getDateRange(period);

    const intentRows = await db
      .select({
        intent: schema.aiChatMessages.detectedIntent,
        messageCount: count(),
      })
      .from(schema.aiChatMessages)
      .where(
        and(
          gte(schema.aiChatMessages.createdAt, start),
          lte(schema.aiChatMessages.createdAt, end),
          eq(schema.aiChatMessages.role, "user")
        )
      )
      .groupBy(schema.aiChatMessages.detectedIntent)
      .orderBy(desc(count()));

    const totalMessages = intentRows.reduce((acc, r) => acc + r.messageCount, 0);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              period,
              from: start.toISOString(),
              to: end.toISOString(),
              totalUserMessages: totalMessages,
              intents: intentRows.map((r) => ({
                intent: r.intent || "undetected",
                count: r.messageCount,
                percentage: totalMessages > 0
                  ? Math.round((r.messageCount / totalMessages) * 100 * 10) / 10
                  : 0,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===== Tool 4: get_unanswered_questions =====

server.tool(
  "get_unanswered_questions",
  "Get user messages with negative sentiment or no detected intent, indicating potential gaps in the chatbot knowledge",
  {
    limit: z.number().min(1).max(100).default(20).describe("Number of messages to return"),
  },
  async ({ limit }) => {
    const messages = await db
      .select({
        messageId: schema.aiChatMessages.id,
        sessionId: schema.aiChatMessages.sessionId,
        content: schema.aiChatMessages.content,
        detectedIntent: schema.aiChatMessages.detectedIntent,
        sentiment: schema.aiChatMessages.sentiment,
        createdAt: schema.aiChatMessages.createdAt,
        phoneNumber: schema.aiChatSessions.phoneNumber,
        profileName: schema.aiChatSessions.profileName,
      })
      .from(schema.aiChatMessages)
      .innerJoin(
        schema.aiChatSessions,
        eq(schema.aiChatMessages.sessionId, schema.aiChatSessions.id)
      )
      .where(
        and(
          eq(schema.aiChatMessages.role, "user"),
          or(
            eq(schema.aiChatMessages.sentiment, "negative"),
            isNull(schema.aiChatMessages.detectedIntent)
          )
        )
      )
      .orderBy(desc(schema.aiChatMessages.createdAt))
      .limit(limit);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              count: messages.length,
              messages: messages.map((m) => ({
                messageId: m.messageId,
                sessionId: m.sessionId,
                phoneNumber: m.phoneNumber,
                profileName: m.profileName,
                content: m.content,
                detectedIntent: m.detectedIntent,
                sentiment: m.sentiment,
                createdAt: m.createdAt,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===== Tool 5: update_knowledge_base =====

server.tool(
  "update_knowledge_base",
  "Update an existing knowledge base entry's content and optionally its title",
  {
    entryId: z.string().describe("The knowledge base entry ID to update"),
    content: z.string().describe("New content for the entry"),
    title: z.string().optional().describe("New title for the entry"),
  },
  async ({ entryId, content, title }) => {
    const [existing] = await db
      .select()
      .from(schema.knowledgeBase)
      .where(eq(schema.knowledgeBase.id, entryId))
      .limit(1);

    if (!existing) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: "Knowledge base entry not found" }),
          },
        ],
      };
    }

    const updateData: Record<string, unknown> = {
      content,
      updatedAt: new Date(),
      // Clear embedding so it gets regenerated on next use
      embedding: null,
    };

    if (title) {
      updateData.title = title;
    }

    const [updated] = await db
      .update(schema.knowledgeBase)
      .set(updateData)
      .where(eq(schema.knowledgeBase.id, entryId))
      .returning();

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              entry: {
                id: updated.id,
                title: updated.title,
                content: updated.content,
                category: updated.category,
                language: updated.language,
                keywords: updated.keywords,
                priority: updated.priority,
                isActive: updated.isActive,
                updatedAt: updated.updatedAt,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===== Tool 6: add_knowledge_entry =====

server.tool(
  "add_knowledge_entry",
  "Add a new entry to the chatbot knowledge base for RAG retrieval",
  {
    title: z.string().describe("Title of the knowledge base entry"),
    content: z.string().describe("Content of the knowledge base entry"),
    category: z
      .enum(["faq", "policy", "route", "boat_info", "general"])
      .describe("Category of the entry"),
    language: z.string().default("es").describe("Language code (default: 'es')"),
    keywords: z.array(z.string()).optional().describe("Keywords for search matching"),
    priority: z.number().optional().describe("Priority (higher = more important, default: 0)"),
  },
  async ({ title, content, category, language, keywords, priority }) => {
    const [entry] = await db
      .insert(schema.knowledgeBase)
      .values({
        title,
        content,
        category,
        language,
        keywords: keywords ?? null,
        priority: priority ?? 0,
        isActive: true,
      })
      .returning();

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              entry: {
                id: entry.id,
                title: entry.title,
                content: entry.content,
                category: entry.category,
                language: entry.language,
                keywords: entry.keywords,
                priority: entry.priority,
                isActive: entry.isActive,
                createdAt: entry.createdAt,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===== Tool 7: get_knowledge_base =====

server.tool(
  "get_knowledge_base",
  "List knowledge base entries with optional filtering by category and language",
  {
    category: z.string().optional().describe("Filter by category (faq, policy, route, boat_info, general)"),
    language: z.string().optional().describe("Filter by language code"),
  },
  async ({ category, language }) => {
    const conditions = [];

    if (category) {
      conditions.push(eq(schema.knowledgeBase.category, category));
    }
    if (language) {
      conditions.push(eq(schema.knowledgeBase.language, language));
    }

    const entries = await db
      .select({
        id: schema.knowledgeBase.id,
        title: schema.knowledgeBase.title,
        content: schema.knowledgeBase.content,
        category: schema.knowledgeBase.category,
        language: schema.knowledgeBase.language,
        keywords: schema.knowledgeBase.keywords,
        priority: schema.knowledgeBase.priority,
        isActive: schema.knowledgeBase.isActive,
        createdAt: schema.knowledgeBase.createdAt,
        updatedAt: schema.knowledgeBase.updatedAt,
      })
      .from(schema.knowledgeBase)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.knowledgeBase.priority), desc(schema.knowledgeBase.updatedAt));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              count: entries.length,
              entries,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===== Tool 8: get_chatbot_performance =====

server.tool(
  "get_chatbot_performance",
  "Get chatbot performance metrics: total sessions, average messages per session, lead conversion rate, and top intents",
  {
    period: z.enum(["today", "week", "month"]).describe("Time period for performance metrics"),
  },
  async ({ period }) => {
    const { start, end } = getDateRange(period);

    // Total sessions in period
    const [sessionStats] = await db
      .select({
        totalSessions: count(),
        totalMessages: sum(schema.aiChatSessions.totalMessages),
        totalLeads: sql<number>`count(*) filter (where ${schema.aiChatSessions.isLead} = true)`,
        avgIntentScore: sql<number>`round(avg(${schema.aiChatSessions.intentScore}), 1)`,
        hotLeads: sql<number>`count(*) filter (where ${schema.aiChatSessions.leadQuality} = 'hot')`,
        warmLeads: sql<number>`count(*) filter (where ${schema.aiChatSessions.leadQuality} = 'warm')`,
        coldLeads: sql<number>`count(*) filter (where ${schema.aiChatSessions.leadQuality} = 'cold')`,
      })
      .from(schema.aiChatSessions)
      .where(
        and(
          gte(schema.aiChatSessions.lastMessageAt, start),
          lte(schema.aiChatSessions.lastMessageAt, end)
        )
      );

    // Top intents in period
    const topIntents = await db
      .select({
        intent: schema.aiChatMessages.detectedIntent,
        messageCount: count(),
      })
      .from(schema.aiChatMessages)
      .where(
        and(
          gte(schema.aiChatMessages.createdAt, start),
          lte(schema.aiChatMessages.createdAt, end),
          eq(schema.aiChatMessages.role, "user")
        )
      )
      .groupBy(schema.aiChatMessages.detectedIntent)
      .orderBy(desc(count()))
      .limit(10);

    // Language breakdown
    const languageBreakdown = await db
      .select({
        language: schema.aiChatSessions.language,
        sessionCount: count(),
      })
      .from(schema.aiChatSessions)
      .where(
        and(
          gte(schema.aiChatSessions.lastMessageAt, start),
          lte(schema.aiChatSessions.lastMessageAt, end)
        )
      )
      .groupBy(schema.aiChatSessions.language)
      .orderBy(desc(count()));

    // Token usage in period
    const [tokenStats] = await db
      .select({
        totalTokens: sum(schema.aiChatMessages.tokensUsed),
        avgTokensPerMessage: sql<number>`round(avg(${schema.aiChatMessages.tokensUsed}), 0)`,
      })
      .from(schema.aiChatMessages)
      .where(
        and(
          gte(schema.aiChatMessages.createdAt, start),
          lte(schema.aiChatMessages.createdAt, end)
        )
      );

    const totalSessions = sessionStats.totalSessions ?? 0;
    const totalMessages = Number(sessionStats.totalMessages) || 0;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              period,
              from: start.toISOString(),
              to: end.toISOString(),
              overview: {
                totalSessions,
                totalMessages,
                avgMessagesPerSession:
                  totalSessions > 0
                    ? Math.round((totalMessages / totalSessions) * 10) / 10
                    : 0,
                avgIntentScore: sessionStats.avgIntentScore ?? 0,
              },
              leads: {
                totalLeads: sessionStats.totalLeads ?? 0,
                conversionRate:
                  totalSessions > 0
                    ? Math.round(((sessionStats.totalLeads ?? 0) / totalSessions) * 100 * 10) / 10
                    : 0,
                hot: sessionStats.hotLeads ?? 0,
                warm: sessionStats.warmLeads ?? 0,
                cold: sessionStats.coldLeads ?? 0,
              },
              topIntents: topIntents.map((r) => ({
                intent: r.intent || "undetected",
                count: r.messageCount,
              })),
              languageBreakdown: languageBreakdown.map((r) => ({
                language: r.language,
                sessions: r.sessionCount,
              })),
              tokenUsage: {
                totalTokens: Number(tokenStats?.totalTokens) || 0,
                avgTokensPerMessage: tokenStats?.avgTokensPerMessage ?? 0,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ===== Start server =====

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Chatbot MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
