// Chatbot Self-Improvement Loop - Weekly insights from conversation analysis
import { db } from "../db";
import { aiChatSessions, aiChatMessages } from "@shared/schema";
import { sql, desc, eq, and, gte, lte, lt } from "drizzle-orm";
import { logger } from "../lib/logger";

// Uncertainty phrases the bot uses when it cannot answer a question
const UNCERTAINTY_PATTERNS = [
  "no tengo esa informacion",
  "no tengo esa información",
  "te recomiendo contactar",
  "contacta con nosotros",
  "contactanos",
  "contáctanos",
  "llama al",
  "no estoy seguro",
  "no puedo confirmar",
  "no dispongo de",
  "no tengo datos",
  "lo siento, no puedo",
  "fuera de mi alcance",
  "no tengo acceso",
  "te sugiero llamar",
  "pregunta directamente",
];

export interface ChatbotInsightsReport {
  period: { from: string; to: string };
  unansweredQuestions: Array<{
    userMessage: string;
    botResponse: string;
    sessionPhone: string;
    timestamp: string;
  }>;
  conversationDropoffs: Array<{
    lastBotMessage: string;
    detectedIntent: string | null;
    sessionPhone: string;
    lastMessageAt: string;
    totalMessages: number;
  }>;
  topRequestedTopics: Array<{
    intent: string;
    count: number;
  }>;
  summary: {
    totalSessions: number;
    totalMessages: number;
    unansweredCount: number;
    dropoffCount: number;
  };
}

/**
 * Analyze chatbot conversations from the last 7 days and generate an insights report.
 * Identifies unanswered questions, conversation drop-offs, and top requested topics.
 */
export async function generateWeeklyInsights(): Promise<ChatbotInsightsReport> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  logger.info("[ChatbotInsights] Generating weekly insights report", {
    from: weekAgo.toISOString(),
    to: now.toISOString(),
  });

  // 1. Find unanswered questions: bot messages containing uncertainty phrases
  const unansweredQuestions = await findUnansweredQuestions(weekAgo, now);

  // 2. Find conversation drop-offs: last message from bot with no follow-up in 24h+
  const dropoffs = await findConversationDropoffs(weekAgo, now);

  // 3. Top requested topics by detected intent
  const topTopics = await findTopRequestedTopics(weekAgo, now);

  // 4. Summary stats
  const summaryStats = await getSummaryStats(weekAgo, now);

  const report: ChatbotInsightsReport = {
    period: {
      from: weekAgo.toISOString(),
      to: now.toISOString(),
    },
    unansweredQuestions: unansweredQuestions.slice(0, 10),
    conversationDropoffs: dropoffs.slice(0, 5),
    topRequestedTopics: topTopics.slice(0, 10),
    summary: {
      totalSessions: summaryStats.totalSessions,
      totalMessages: summaryStats.totalMessages,
      unansweredCount: unansweredQuestions.length,
      dropoffCount: dropoffs.length,
    },
  };

  // Log the full report
  logger.info("[ChatbotInsights] Weekly report generated", {
    period: report.period,
    unansweredCount: report.summary.unansweredCount,
    dropoffCount: report.summary.dropoffCount,
    totalSessions: report.summary.totalSessions,
    totalMessages: report.summary.totalMessages,
    topTopics: report.topRequestedTopics.slice(0, 5).map(t => `${t.intent}: ${t.count}`),
    topUnanswered: report.unansweredQuestions.slice(0, 3).map(q => q.userMessage.substring(0, 80)),
    topDropoffs: report.conversationDropoffs.slice(0, 3).map(d => d.lastBotMessage.substring(0, 80)),
  });

  return report;
}

/**
 * Find bot responses that contain uncertainty/fallback patterns,
 * paired with the preceding user message that triggered them.
 */
async function findUnansweredQuestions(
  from: Date,
  to: Date,
): Promise<ChatbotInsightsReport["unansweredQuestions"]> {
  try {
    // Build SQL LIKE conditions for uncertainty patterns
    const likeConditions = UNCERTAINTY_PATTERNS.map(
      pattern => sql`lower(${aiChatMessages.content}) LIKE ${`%${pattern}%`}`
    );

    // Find assistant messages with uncertainty patterns in the time range
    const uncertainMessages = await db
      .select({
        id: aiChatMessages.id,
        sessionId: aiChatMessages.sessionId,
        content: aiChatMessages.content,
        createdAt: aiChatMessages.createdAt,
      })
      .from(aiChatMessages)
      .where(
        and(
          eq(aiChatMessages.role, "assistant"),
          gte(aiChatMessages.createdAt, from),
          lte(aiChatMessages.createdAt, to),
          sql`(${sql.join(likeConditions, sql` OR `)})`,
        )
      )
      .orderBy(desc(aiChatMessages.createdAt))
      .limit(50);

    // For each uncertain bot message, find the preceding user message
    const results: ChatbotInsightsReport["unansweredQuestions"] = [];

    for (const msg of uncertainMessages) {
      // Get the user message immediately before this bot response
      const [precedingUserMsg] = await db
        .select({
          content: aiChatMessages.content,
        })
        .from(aiChatMessages)
        .where(
          and(
            eq(aiChatMessages.sessionId, msg.sessionId),
            eq(aiChatMessages.role, "user"),
            lt(aiChatMessages.createdAt, msg.createdAt),
          )
        )
        .orderBy(desc(aiChatMessages.createdAt))
        .limit(1);

      // Get the phone number for context
      const [session] = await db
        .select({ phoneNumber: aiChatSessions.phoneNumber })
        .from(aiChatSessions)
        .where(eq(aiChatSessions.id, msg.sessionId))
        .limit(1);

      if (precedingUserMsg) {
        results.push({
          userMessage: precedingUserMsg.content,
          botResponse: msg.content.substring(0, 200),
          sessionPhone: session?.phoneNumber ?? "unknown",
          timestamp: msg.createdAt.toISOString(),
        });
      }
    }

    return results;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("[ChatbotInsights] Error finding unanswered questions", { error: errorMsg });
    return [];
  }
}

/**
 * Find conversations where the user stopped responding after a bot message.
 * A drop-off is defined as: last message in session is from the assistant,
 * and no follow-up within 24 hours.
 */
async function findConversationDropoffs(
  from: Date,
  to: Date,
): Promise<ChatbotInsightsReport["conversationDropoffs"]> {
  try {
    // Get sessions active in the period where the last message was from the bot
    // and the session has been inactive for 24h+
    const cutoff = new Date(to);
    cutoff.setHours(cutoff.getHours() - 24);

    const staleSessions = await db
      .select({
        id: aiChatSessions.id,
        phoneNumber: aiChatSessions.phoneNumber,
        totalMessages: aiChatSessions.totalMessages,
        lastMessageAt: aiChatSessions.lastMessageAt,
      })
      .from(aiChatSessions)
      .where(
        and(
          gte(aiChatSessions.lastMessageAt, from),
          lte(aiChatSessions.lastMessageAt, cutoff),
        )
      )
      .orderBy(desc(aiChatSessions.lastMessageAt))
      .limit(100);

    const results: ChatbotInsightsReport["conversationDropoffs"] = [];

    for (const session of staleSessions) {
      // Get the last message in this session
      const [lastMsg] = await db
        .select({
          role: aiChatMessages.role,
          content: aiChatMessages.content,
          detectedIntent: aiChatMessages.detectedIntent,
        })
        .from(aiChatMessages)
        .where(eq(aiChatMessages.sessionId, session.id))
        .orderBy(desc(aiChatMessages.createdAt))
        .limit(1);

      // Only count as drop-off if last message was from the assistant
      if (lastMsg && lastMsg.role === "assistant") {
        results.push({
          lastBotMessage: lastMsg.content.substring(0, 200),
          detectedIntent: lastMsg.detectedIntent,
          sessionPhone: session.phoneNumber,
          lastMessageAt: session.lastMessageAt.toISOString(),
          totalMessages: session.totalMessages,
        });
      }
    }

    return results;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("[ChatbotInsights] Error finding dropoffs", { error: errorMsg });
    return [];
  }
}

/**
 * Group user messages by detected intent and count frequency.
 */
async function findTopRequestedTopics(
  from: Date,
  to: Date,
): Promise<ChatbotInsightsReport["topRequestedTopics"]> {
  try {
    const intentCounts = await db
      .select({
        intent: aiChatMessages.detectedIntent,
        count: sql<number>`count(*)::int`,
      })
      .from(aiChatMessages)
      .where(
        and(
          eq(aiChatMessages.role, "user"),
          gte(aiChatMessages.createdAt, from),
          lte(aiChatMessages.createdAt, to),
          sql`${aiChatMessages.detectedIntent} IS NOT NULL`,
        )
      )
      .groupBy(aiChatMessages.detectedIntent)
      .orderBy(sql`count(*) DESC`)
      .limit(20);

    return intentCounts.map(row => ({
      intent: row.intent ?? "unknown",
      count: row.count,
    }));
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("[ChatbotInsights] Error finding top topics", { error: errorMsg });
    return [];
  }
}

/**
 * Get summary statistics for the period.
 */
async function getSummaryStats(
  from: Date,
  to: Date,
): Promise<{ totalSessions: number; totalMessages: number }> {
  try {
    const [sessionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiChatSessions)
      .where(
        and(
          gte(aiChatSessions.lastMessageAt, from),
          lte(aiChatSessions.lastMessageAt, to),
        )
      );

    const [messageCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiChatMessages)
      .where(
        and(
          gte(aiChatMessages.createdAt, from),
          lte(aiChatMessages.createdAt, to),
        )
      );

    return {
      totalSessions: sessionCount?.count ?? 0,
      totalMessages: messageCount?.count ?? 0,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("[ChatbotInsights] Error getting summary stats", { error: errorMsg });
    return { totalSessions: 0, totalMessages: 0 };
  }
}
