import type { Express } from "express";
import express from "express";

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

  // Health check for WhatsApp integration
  app.get("/api/whatsapp/health", async (req, res) => {
    const { isTwilioConfigured, getWhatsAppFromNumber } = await import("../whatsapp/twilioClient");
    const { isAIConfigured } = await import("../whatsapp/aiService");
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
    const openaiKey = process.env.OPENAI_API_KEY;

    res.json({
      configured: isTwilioConfigured(),
      aiEnabled: isAIConfigured(),
      webhookUrl: `${process.env.BASE_URL || req.protocol + "://" + req.get("host")}/api/whatsapp/webhook`,
      diagnostics: {
        twilio: {
          hasAccountSid: !!accountSid,
          accountSidPrefix: accountSid ? accountSid.substring(0, 4) : null,
          hasAuthToken: !!authToken,
          authTokenLength: authToken ? authToken.length : 0,
          hasFromNumber: !!fromNumber,
          fromNumber: getWhatsAppFromNumber(),
        },
        openai: {
          hasApiKey: !!openaiKey,
          apiKeyPrefix: openaiKey ? openaiKey.substring(0, 7) : null,
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
