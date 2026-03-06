// WhatsApp Webhook Handler - Main entry point for incoming messages
import type { Request, Response } from "express";
import { sendWhatsAppMessage, isTwilioConfigured } from "./twilioClient";
import { getSession, updateState, resetSession, isSessionStale, updateSessionLanguage } from "./sessionManager";
import { detectIntent, detectLanguage } from "./intentDetector";
import { processMessage } from "./messageRouter";
import { getTranslation, type ChatbotTranslations } from "./translations";
import { CHATBOT_STATES } from "@shared/schema";
import { getAIResponseEnhanced, isAIConfigured, getBoatImageUrl } from "./aiService";
import { sendWhatsAppMessageWithMedia } from "./twilioClient";
import { detectLanguageFromPhone, getWelcomeMessage, isGreeting } from "./languageDetector";
import { logger } from "../lib/logger";

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

    logger.info("Webhook message received", { from, profileName: profileName || "Unknown", messageBody });

    // Check if Twilio is configured
    if (!isTwilioConfigured()) {
      console.error("[Webhook] Twilio not configured - cannot respond");
      return;
    }

    // Process the message asynchronously
    await processIncomingMessage(from, messageBody, profileName);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Webhook] Error processing message:", errorMsg);
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
    
    // Detect language from phone prefix (primary) or message content (fallback)
    const phoneLanguage = detectLanguageFromPhone(from);
    const messageLanguage = detectLanguage(messageBody);
    const finalLang = messageLanguage || phoneLanguage || session.language || "es";
    
    logger.debug("Webhook language detection", { phoneLanguage, messageLanguage, finalLang });

    // Check if session is stale (>24h) and reset
    const wasStale = isSessionStale(session);
    if (wasStale) {
      logger.info("Webhook session stale, resetting", { from });
      await resetSession(from);
    }
    
    // Check if this is a new conversation or first message
    const isFirstMessage = session.messagesCount <= 1 || wasStale;
    const userIsGreeting = isGreeting(messageBody);
    
    // Send personalized welcome message for first-time users
    // Always send welcome on first message, then continue to process their question
    if (isFirstMessage) {
      // Persist the detected language to session
      await updateSessionLanguage(from, finalLang);
      
      const welcomeMessage = getWelcomeMessage(finalLang);
      logger.info("Webhook sending welcome message", { language: finalLang });
      await sendWhatsAppMessage(from, welcomeMessage);
      
      // If it's just a greeting, wait for their next message
      if (userIsGreeting) {
        return;
      }
      // Otherwise, continue to answer their question below
    }

    // Agent handoff — customer requests human assistance
    const agentHandoffTriggers = [
      'hablar con agente', 'hablar con persona', 'hablar con alguien',
      'speak to agent', 'speak to human', 'speak to person', 'talk to agent', 'talk to human',
      'parler avec un agent', 'parler avec quelqu',
      'mit einem mitarbeiter', 'mit jemandem sprechen',
      'parlare con un agente', 'parlare con una persona', 'parlare con qualcuno',
      'persona real', 'real person', 'personne réelle',
      'quiero un humano', 'necesito ayuda de una persona',
    ];
    const isAgentHandoff = agentHandoffTriggers.some(trigger =>
      messageBody.toLowerCase().includes(trigger)
    );

    if (isAgentHandoff) {
      const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER || 'whatsapp:+34611500372';
      const clientNumber = from.replace('whatsapp:', '');
      const clientName = profileName || 'Cliente';

      // Notify owner
      const ownerMessage = `[HANDOFF] Cliente solicita hablar con agente humano.\nCliente: ${clientName}\nTelefono: ${clientNumber}\nIdioma: ${finalLang}\nUltimo mensaje: "${messageBody}"`;
      try {
        await sendWhatsAppMessage(ownerNumber, ownerMessage);
        logger.info("Webhook agent handoff notification sent to owner", { from });
      } catch (handoffError: unknown) {
        const handoffMsg = handoffError instanceof Error ? handoffError.message : String(handoffError);
        console.error(`[Webhook] Could not notify owner for agent handoff: ${handoffMsg}`);
      }

      // Acknowledge to customer
      const ackMessages: Record<string, string> = {
        es: 'He notificado a nuestro equipo. Un agente se pondrá en contacto contigo en breve por WhatsApp. Gracias por tu paciencia.',
        en: 'I have notified our team. An agent will contact you shortly via WhatsApp. Thank you for your patience.',
        fr: "J'ai notifié notre équipe. Un agent vous contactera sous peu par WhatsApp. Merci de votre patience.",
        de: 'Ich habe unser Team benachrichtigt. Ein Mitarbeiter wird sich in Kürze per WhatsApp bei Ihnen melden. Danke für Ihre Geduld.',
        nl: 'Ik heb ons team op de hoogte gesteld. Een medewerker neemt binnenkort contact met u op via WhatsApp. Bedankt voor uw geduld.',
        it: 'Ho notificato il nostro team. Un agente vi contatterà a breve via WhatsApp. Grazie per la vostra pazienza.',
        ru: 'Я уведомил нашу команду. Агент свяжется с вами в ближайшее время через WhatsApp. Спасибо за терпение.',
        ca: 'He notificat el nostre equip. Un agent es posarà en contacte amb tu en breu per WhatsApp. Gràcies per la teva paciència.',
      };
      const ack = ackMessages[finalLang] || ackMessages.es;
      await sendWhatsAppMessage(from, ack);
      return;
    }

    // Detect intent for global commands (menu, cancel, greeting)
    const intent = detectIntent(messageBody, finalLang as any);
    const isInMainState = session.currentState === CHATBOT_STATES.WELCOME || 
                          session.currentState === CHATBOT_STATES.MAIN_MENU;

    // Handle global reset commands even in AI mode
    if (intent === "menu" || intent === "cancel" || (intent === "greeting" && !isInMainState)) {
      await resetSession(from);
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

    // AI-powered response with RAG, Memory, and Function Calling
    logger.info("Webhook using enhanced AI for response", { language: finalLang });

    // Get enhanced AI response (handles memory persistence internally)
    const result = await getAIResponseEnhanced(from, messageBody, finalLang, profileName);

    // Send AI response
    await sendWhatsAppMessage(from, result.response);

    // If a specific boat was detected and user seems interested, send image
    if (result.detectedBoatId && result.detectedIntent === 'boat_info') {
      const imageUrl = await getBoatImageUrl(result.detectedBoatId);
      if (imageUrl) {
        try {
          await sendWhatsAppMessageWithMedia(from, "", imageUrl);
        } catch (imgError: unknown) {
          const imgMsg = imgError instanceof Error ? imgError.message : String(imgError);
          console.warn(`[Webhook] Could not send boat image: ${imgMsg}`);
        }
      }
    }

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Webhook] Error processing message from ${from}:`, errorMsg);

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
  session: { messagesCount: number },
  t: ChatbotTranslations,
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
async function sendMainMenu(to: string, t: ChatbotTranslations): Promise<void> {
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

    logger.info("Message status update", { messageSid: MessageSid, to: To, status: MessageStatus });

    if (ErrorCode) {
      console.error(`[Status] Error ${ErrorCode}: ${ErrorMessage}`);
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Status] Error processing status callback:", errorMsg);
  }
}
