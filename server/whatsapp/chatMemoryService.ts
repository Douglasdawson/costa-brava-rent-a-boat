// Chat Memory Service - Persistent conversation storage
import { db } from "../db";
import { aiChatSessions, aiChatMessages } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Intent types for classification
export const INTENT_TYPES = {
  GREETING: 'greeting',
  PRICE_INQUIRY: 'price_inquiry',
  AVAILABILITY: 'availability',
  BOAT_INFO: 'boat_info',
  BOOKING_REQUEST: 'booking_request',
  ROUTE_INFO: 'route_info',
  GENERAL_QUESTION: 'general_question',
  FAREWELL: 'farewell',
} as const;

export type IntentType = typeof INTENT_TYPES[keyof typeof INTENT_TYPES];

// Get or create a chat session
export async function getOrCreateSession(
  phoneNumber: string,
  profileName?: string,
  language: string = 'es'
): Promise<{ id: string; isNew: boolean; history: Array<{ role: string; content: string }> }> {
  try {
    // Look for existing session
    const [existingSession] = await db.select()
      .from(aiChatSessions)
      .where(eq(aiChatSessions.phoneNumber, phoneNumber))
      .orderBy(desc(aiChatSessions.lastMessageAt))
      .limit(1);

    if (existingSession) {
      // Get last 10 messages for context
      const messages = await db.select()
        .from(aiChatMessages)
        .where(eq(aiChatMessages.sessionId, existingSession.id))
        .orderBy(desc(aiChatMessages.createdAt))
        .limit(10);

      // Reverse to get chronological order
      const history = messages.reverse().map(m => ({
        role: m.role,
        content: m.content,
      }));

      return { id: existingSession.id, isNew: false, history };
    }

    // Create new session
    const [newSession] = await db.insert(aiChatSessions).values({
      phoneNumber,
      profileName,
      language,
      totalMessages: 0,
      intentScore: 0,
      isLead: false,
    }).returning();

    return { id: newSession.id, isNew: true, history: [] };
  } catch (error: any) {
    console.error("[Memory] Error getting/creating session:", error.message);
    throw error;
  }
}

// Save a message to the session
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: {
    detectedIntent?: string;
    detectedBoatId?: string;
    sentiment?: string;
    tokensUsed?: number;
  }
): Promise<void> {
  try {
    await db.insert(aiChatMessages).values({
      sessionId,
      role,
      content,
      detectedIntent: metadata?.detectedIntent,
      detectedBoatId: metadata?.detectedBoatId,
      sentiment: metadata?.sentiment,
      tokensUsed: metadata?.tokensUsed,
    });

    // Update session stats
    await db.update(aiChatSessions)
      .set({
        lastMessageAt: new Date(),
        totalMessages: sql`${aiChatSessions.totalMessages} + 1`,
      })
      .where(eq(aiChatSessions.id, sessionId));
  } catch (error: any) {
    console.error("[Memory] Error saving message:", error.message);
  }
}

// Update lead scoring for a session
export async function updateLeadScore(
  sessionId: string,
  intentScore: number,
  boatId?: string,
  topic?: string
): Promise<void> {
  try {
    const updates: any = {
      intentScore,
      isLead: intentScore >= 50,
      leadQuality: intentScore >= 80 ? 'hot' : intentScore >= 50 ? 'warm' : 'cold',
    };

    // Update boats viewed if provided
    if (boatId) {
      updates.boatsViewed = sql`array_append(COALESCE(${aiChatSessions.boatsViewed}, ARRAY[]::text[]), ${boatId})`;
    }

    // Update topics discussed if provided
    if (topic) {
      updates.topicsDiscussed = sql`array_append(COALESCE(${aiChatSessions.topicsDiscussed}, ARRAY[]::text[]), ${topic})`;
    }

    await db.update(aiChatSessions)
      .set(updates)
      .where(eq(aiChatSessions.id, sessionId));
  } catch (error: any) {
    console.error("[Memory] Error updating lead score:", error.message);
  }
}

// Calculate intent score based on detected intent
export function calculateIntentScore(currentScore: number, intent: string): number {
  const intentScores: Record<string, number> = {
    booking_request: 30,
    availability: 20,
    price_inquiry: 15,
    boat_info: 10,
    route_info: 5,
    general_question: 2,
    greeting: 0,
    farewell: 0,
  };

  const scoreToAdd = intentScores[intent] || 0;
  return Math.min(100, currentScore + scoreToAdd);
}

// Get hot leads for the CRM
export async function getHotLeads(limit: number = 20): Promise<any[]> {
  try {
    return await db.select()
      .from(aiChatSessions)
      .where(and(
        eq(aiChatSessions.isLead, true),
        eq(aiChatSessions.leadQuality, 'hot')
      ))
      .orderBy(desc(aiChatSessions.intentScore), desc(aiChatSessions.lastMessageAt))
      .limit(limit);
  } catch (error: any) {
    console.error("[Memory] Error getting hot leads:", error.message);
    return [];
  }
}

// Get chat analytics
export async function getChatAnalytics(): Promise<{
  totalSessions: number;
  totalMessages: number;
  hotLeads: number;
  warmLeads: number;
  avgIntentScore: number;
}> {
  try {
    const stats = await db.select({
      totalSessions: sql<number>`count(*)`,
      hotLeads: sql<number>`sum(case when lead_quality = 'hot' then 1 else 0 end)`,
      warmLeads: sql<number>`sum(case when lead_quality = 'warm' then 1 else 0 end)`,
      avgIntentScore: sql<number>`avg(intent_score)`,
      totalMessages: sql<number>`sum(total_messages)`,
    }).from(aiChatSessions);

    return {
      totalSessions: Number(stats[0]?.totalSessions) || 0,
      totalMessages: Number(stats[0]?.totalMessages) || 0,
      hotLeads: Number(stats[0]?.hotLeads) || 0,
      warmLeads: Number(stats[0]?.warmLeads) || 0,
      avgIntentScore: Math.round(Number(stats[0]?.avgIntentScore) || 0),
    };
  } catch (error: any) {
    console.error("[Memory] Error getting analytics:", error.message);
    return { totalSessions: 0, totalMessages: 0, hotLeads: 0, warmLeads: 0, avgIntentScore: 0 };
  }
}

// Get frequent intents for analytics
export async function getFrequentIntents(limit: number = 10): Promise<Array<{ intent: string; count: number }>> {
  try {
    const results = await db.select({
      intent: aiChatMessages.detectedIntent,
      count: sql<number>`count(*)`,
    })
      .from(aiChatMessages)
      .where(sql`${aiChatMessages.detectedIntent} IS NOT NULL`)
      .groupBy(aiChatMessages.detectedIntent)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return results.map(r => ({
      intent: r.intent || 'unknown',
      count: Number(r.count),
    }));
  } catch (error: any) {
    console.error("[Memory] Error getting frequent intents:", error.message);
    return [];
  }
}
