import type { Express } from "express";
import express from "express";
import { requireAdminSession } from "./auth";

export async function registerWhatsAppRoutes(app: Express) {
  // Import WhatsApp webhook handlers
  const { handleWhatsAppWebhook, handleWebhookValidation, handleStatusCallback } = await import(
    "../whatsapp/webhookHandler"
  );

  // Main webhook endpoint for incoming WhatsApp messages
  app.post("/api/whatsapp/webhook", express.urlencoded({ extended: false }), handleWhatsAppWebhook);

  // Webhook validation endpoint (GET request from Twilio)
  app.get("/api/whatsapp/webhook", handleWebhookValidation);

  // Status callback for message delivery status
  app.post("/api/whatsapp/status", express.urlencoded({ extended: false }), handleStatusCallback);

  // Health check for WhatsApp integration (admin only, sanitized)
  app.get("/api/whatsapp/health", requireAdminSession, async (req, res) => {
    const { isTwilioConfigured } = await import("../whatsapp/twilioClient");
    const { isAIConfigured } = await import("../whatsapp/aiService");

    res.json({
      configured: isTwilioConfigured(),
      aiEnabled: isAIConfigured(),
      webhookUrl: `${process.env.BASE_URL || req.protocol + "://" + req.get("host")}/api/whatsapp/webhook`,
      diagnostics: {
        twilio: {
          hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
          hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
          hasFromNumber: !!process.env.TWILIO_WHATSAPP_FROM,
        },
        openai: {
          hasApiKey: !!process.env.OPENAI_API_KEY,
        },
        nodeEnv: process.env.NODE_ENV,
      },
    });
  });

  // Register chatbot analytics routes
  const { registerChatbotAnalyticsRoutes } = await import("../whatsapp/analyticsEndpoints");
  registerChatbotAnalyticsRoutes(app);

  // Seed knowledge base on startup (if not already seeded)
  const { isKnowledgeBaseSeeded, seedKnowledgeBase } = await import("../whatsapp/seedKnowledgeBase");
  isKnowledgeBaseSeeded().then(seeded => {
    if (!seeded) {
      console.log("[Startup] Knowledge base empty, seeding with default content...");
      seedKnowledgeBase().catch(err => console.error("[Startup] Error seeding knowledge base:", err));
    } else {
      console.log("[Startup] Knowledge base already seeded");
    }
  });
}
