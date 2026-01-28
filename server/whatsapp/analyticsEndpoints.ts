// Analytics Endpoints for WhatsApp Chatbot
import type { Express, Request, Response } from "express";
import { getChatAnalytics, getFrequentIntents, getHotLeads } from "./chatMemoryService";
import { db } from "../db";
import { aiChatSessions, aiChatMessages, knowledgeBase } from "@shared/schema";
import { desc, sql, eq } from "drizzle-orm";

export function registerChatbotAnalyticsRoutes(app: Express): void {
  // Get chatbot analytics summary
  app.get("/api/chatbot/analytics", async (req: Request, res: Response) => {
    try {
      const analytics = await getChatAnalytics();
      const frequentIntents = await getFrequentIntents(10);
      
      res.json({
        success: true,
        data: {
          ...analytics,
          frequentIntents,
        },
      });
    } catch (error: any) {
      console.error("[Analytics] Error getting analytics:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get hot leads for CRM
  app.get("/api/chatbot/leads", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const quality = req.query.quality as string; // 'hot', 'warm', 'cold'
      
      let leads = await getHotLeads(limit);
      
      // Filter by quality if specified
      if (quality && ['hot', 'warm', 'cold'].includes(quality)) {
        leads = leads.filter(l => l.leadQuality === quality);
      }
      
      res.json({
        success: true,
        data: leads.map(lead => ({
          id: lead.id,
          phoneNumber: lead.phoneNumber,
          profileName: lead.profileName,
          intentScore: lead.intentScore,
          leadQuality: lead.leadQuality,
          totalMessages: lead.totalMessages,
          topicsDiscussed: lead.topicsDiscussed,
          boatsViewed: lead.boatsViewed,
          lastMessageAt: lead.lastMessageAt,
          firstMessageAt: lead.firstMessageAt,
        })),
      });
    } catch (error: any) {
      console.error("[Analytics] Error getting leads:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get conversation history for a specific phone number
  app.get("/api/chatbot/conversations/:phoneNumber", async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.params;
      const decodedPhone = decodeURIComponent(phoneNumber);
      
      // Get session
      const [session] = await db.select()
        .from(aiChatSessions)
        .where(eq(aiChatSessions.phoneNumber, decodedPhone))
        .orderBy(desc(aiChatSessions.lastMessageAt))
        .limit(1);
      
      if (!session) {
        return res.status(404).json({ success: false, error: "Conversation not found" });
      }
      
      // Get messages
      const messages = await db.select()
        .from(aiChatMessages)
        .where(eq(aiChatMessages.sessionId, session.id))
        .orderBy(aiChatMessages.createdAt);
      
      res.json({
        success: true,
        data: {
          session: {
            id: session.id,
            phoneNumber: session.phoneNumber,
            profileName: session.profileName,
            language: session.language,
            intentScore: session.intentScore,
            leadQuality: session.leadQuality,
            totalMessages: session.totalMessages,
            topicsDiscussed: session.topicsDiscussed,
            boatsViewed: session.boatsViewed,
            firstMessageAt: session.firstMessageAt,
            lastMessageAt: session.lastMessageAt,
          },
          messages: messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            detectedIntent: m.detectedIntent,
            detectedBoatId: m.detectedBoatId,
            sentiment: m.sentiment,
            createdAt: m.createdAt,
          })),
        },
      });
    } catch (error: any) {
      console.error("[Analytics] Error getting conversation:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get knowledge base entries
  app.get("/api/chatbot/knowledge", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const language = (req.query.language as string) || "es";
      
      let query = db.select({
        id: knowledgeBase.id,
        title: knowledgeBase.title,
        content: knowledgeBase.content,
        category: knowledgeBase.category,
        language: knowledgeBase.language,
        keywords: knowledgeBase.keywords,
        priority: knowledgeBase.priority,
        isActive: knowledgeBase.isActive,
        createdAt: knowledgeBase.createdAt,
        updatedAt: knowledgeBase.updatedAt,
      }).from(knowledgeBase);
      
      const entries = await query.orderBy(desc(knowledgeBase.priority));
      
      // Filter in JS for flexibility
      let filtered = entries.filter(e => e.language === language);
      if (category) {
        filtered = filtered.filter(e => e.category === category);
      }
      
      res.json({
        success: true,
        data: filtered,
      });
    } catch (error: any) {
      console.error("[Analytics] Error getting knowledge base:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get recent conversations list
  app.get("/api/chatbot/conversations", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      const sessions = await db.select()
        .from(aiChatSessions)
        .orderBy(desc(aiChatSessions.lastMessageAt))
        .limit(limit);
      
      res.json({
        success: true,
        data: sessions.map(s => ({
          id: s.id,
          phoneNumber: s.phoneNumber,
          profileName: s.profileName,
          language: s.language,
          intentScore: s.intentScore,
          leadQuality: s.leadQuality,
          isLead: s.isLead,
          totalMessages: s.totalMessages,
          lastMessageAt: s.lastMessageAt,
          firstMessageAt: s.firstMessageAt,
        })),
      });
    } catch (error: any) {
      console.error("[Analytics] Error getting conversations:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
