// WhatsApp Webhook Handler - Main entry point for incoming messages
import type { Request, Response } from "express";
import { sendWhatsAppMessage, isTwilioConfigured } from "./twilioClient";
import { getSession, updateState, resetSession, isSessionStale } from "./sessionManager";
import { detectIntent, detectLanguage } from "./intentDetector";
import { processMessage } from "./messageRouter";
import { getTranslation } from "./translations";
import { CHATBOT_STATES } from "@shared/schema";
import { getAIResponse, isAIConfigured } from "./aiService";

// In-memory conversation history for AI context (per phone number)
const conversationHistory: Map<string, Array<{ role: "user" | "assistant"; content: string }>> = new Map();

/**
 * Twilio WhatsApp Webhook Request Body
 */
interface TwilioWebhookBody {
  MessageSid: string;
  AccountSid: string;
  From: string; // whatsapp:+34XXXXXXXXX
  To: string;
  Body: string;
  NumMedia: string;
  ProfileName?: string;
  WaId?: string; // WhatsApp ID (phone number without +)
}

/**
 * Main webhook handler for incoming WhatsApp messages
 */
export async function handleWhatsAppWebhook(req: Request, res: Response) {
  // Always respond quickly to Twilio to prevent timeout
  res.type("text/xml").send("<Response></Response>");

  try {
    const body = req.body as TwilioWebhookBody;
    const { From: from, Body: messageBody, ProfileName: profileName } = body;

    if (!from || !messageBody) {
      console.error("[Webhook] Missing required fields:", { from, messageBody });
      return;
    }

    console.log(`[Webhook] Message from ${from} (${profileName || "Unknown"}): ${messageBody}`);

    // Check if Twilio is configured
    if (!isTwilioConfigured()) {
      console.error("[Webhook] Twilio not configured - cannot respond");
      return;
    }

    // Process the message asynchronously
    await processIncomingMessage(from, messageBody, profileName);
  } catch (error: any) {
    console.error("[Webhook] Error processing message:", error.message);
  }
}

/**
 * Process an incoming WhatsApp message
 * Now uses AI-powered responses for natural language understanding
 */
async function processIncomingMessage(
  from: string,
  messageBody: string,
  profileName?: string
): Promise<void> {
  try {
    // Get or create session
    const session = await getSession(from, messageBody);
    const language = session.language || "es";

    // Check if session is stale (>24h) and reset conversation history
    if (isSessionStale(session)) {
      console.log(`[Webhook] Session stale for ${from}, resetting`);
      await resetSession(from);
      conversationHistory.delete(from);
    }

    // Detect language from message if not set
    const detectedLang = detectLanguage(messageBody);
    const finalLang = detectedLang || language;

    // Detect intent for global commands (menu, cancel, greeting)
    const intent = detectIntent(messageBody, finalLang as any);
    const isInMainState = session.currentState === CHATBOT_STATES.WELCOME || 
                          session.currentState === CHATBOT_STATES.MAIN_MENU;

    // Handle global reset commands even in AI mode
    if (intent === "menu" || intent === "cancel" || (intent === "greeting" && !isInMainState)) {
      await resetSession(from);
      conversationHistory.delete(from); // Clear AI history too
      const freshSession = await getSession(from);
      const t = getTranslation(freshSession.language as any);
      await sendMainMenu(from, t);
      return;
    }

    // Check if AI is configured
    if (!isAIConfigured()) {
      console.warn("[Webhook] OpenAI not configured, falling back to menu-based flow");
      // Fall back to traditional menu-based flow
      const response = await processMessage(session, messageBody, intent);
      if (response) {
        await sendWhatsAppMessage(from, response);
      }
      return;
    }

    // AI-powered response
    console.log(`[Webhook] Using AI for response (lang: ${finalLang})`);

    // Get conversation history for this user
    const history = conversationHistory.get(from) || [];

    // Get AI response
    const aiResponse = await getAIResponse(messageBody, history, finalLang);

    // Update conversation history
    history.push({ role: "user", content: messageBody });
    history.push({ role: "assistant", content: aiResponse });
    
    // Keep only last 20 messages to prevent memory bloat
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    conversationHistory.set(from, history);

    // Send AI response
    await sendWhatsAppMessage(from, aiResponse);

  } catch (error: any) {
    console.error(`[Webhook] Error processing message from ${from}:`, error.message);

    // Send error message to user
    try {
      const session = await getSession(from);
      const t = getTranslation(session.language as any);
      await sendWhatsAppMessage(from, t.error);
    } catch {
      console.error("[Webhook] Failed to send error message");
    }
  }
}

/**
 * Send welcome message for new or reset conversations
 */
async function sendWelcomeMessage(
  to: string,
  session: any,
  t: any,
  profileName?: string
): Promise<void> {
  // Update state to main menu
  await updateState(to, CHATBOT_STATES.MAIN_MENU);

  const greeting = session.messagesCount > 1 ? t.welcomeBack : t.welcome;
  const menu = `${t.mainMenuTitle}\n\n${t.mainMenuOptions.join("\n")}`;

  await sendWhatsAppMessage(to, `${greeting}\n\n${menu}`);
}

/**
 * Send main menu
 */
async function sendMainMenu(to: string, t: any): Promise<void> {
  await updateState(to, CHATBOT_STATES.MAIN_MENU);

  const menu = `${t.mainMenuTitle}\n\n${t.mainMenuOptions.join("\n")}`;
  await sendWhatsAppMessage(to, menu);
}

/**
 * Webhook validation endpoint for Twilio
 */
export function handleWebhookValidation(req: Request, res: Response) {
  // Twilio doesn't use challenge-response like Meta
  // Just return 200 OK
  res.status(200).send("OK");
}

/**
 * Status callback handler for message delivery status
 */
export async function handleStatusCallback(req: Request, res: Response) {
  res.sendStatus(200);

  try {
    const { MessageSid, MessageStatus, To, ErrorCode, ErrorMessage } = req.body;

    console.log(`[Status] Message ${MessageSid} to ${To}: ${MessageStatus}`);

    if (ErrorCode) {
      console.error(`[Status] Error ${ErrorCode}: ${ErrorMessage}`);
    }
  } catch (error: any) {
    console.error("[Status] Error processing status callback:", error.message);
  }
}
