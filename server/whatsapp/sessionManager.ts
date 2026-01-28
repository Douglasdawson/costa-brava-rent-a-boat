// WhatsApp Chatbot Session Manager
import { storage } from "../storage";
import { detectLanguage } from "./intentDetector";
import { CHATBOT_STATES, type ChatbotState, type ChatbotConversation } from "@shared/schema";
import type { SupportedLanguage } from "./translations";

export interface SessionContext {
  lastIntent?: string;
  lastBoatViewed?: string;
  availabilityDate?: string;
  [key: string]: any;
}

/**
 * Get or create a conversation session for a phone number
 */
export async function getSession(
  phoneNumber: string,
  initialMessage?: string
): Promise<ChatbotConversation> {
  // Normalize phone number (remove whatsapp: prefix if present)
  const normalizedPhone = phoneNumber.replace("whatsapp:", "");

  // Try to get existing conversation
  let conversation = await storage.getChatbotConversation(normalizedPhone);

  if (!conversation) {
    // Detect language from initial message
    const language = initialMessage ? detectLanguage(initialMessage) : "es";

    // Create new conversation
    conversation = await storage.createChatbotConversation({
      phoneNumber: normalizedPhone,
      language,
      currentState: CHATBOT_STATES.WELCOME,
    });

    console.log(`[Session] New conversation created for ${normalizedPhone}, language: ${language}`);
  } else {
    console.log(`[Session] Existing conversation found for ${normalizedPhone}, state: ${conversation.currentState}`);
  }

  return conversation;
}

/**
 * Update conversation state
 */
export async function updateState(
  phoneNumber: string,
  newState: ChatbotState,
  additionalUpdates?: Partial<ChatbotConversation>
): Promise<ChatbotConversation | undefined> {
  const normalizedPhone = phoneNumber.replace("whatsapp:", "");

  const updates: any = {
    currentState: newState,
    ...additionalUpdates,
  };

  const conversation = await storage.updateChatbotConversation(normalizedPhone, updates);

  if (conversation) {
    console.log(`[Session] State updated for ${normalizedPhone}: ${newState}`);
  }

  return conversation;
}

/**
 * Update session language
 */
export async function updateSessionLanguage(
  phoneNumber: string,
  language: string
): Promise<ChatbotConversation | undefined> {
  const normalizedPhone = phoneNumber.replace("whatsapp:", "");
  
  const conversation = await storage.updateChatbotConversation(normalizedPhone, {
    language,
  });
  
  if (conversation) {
    console.log(`[Session] Language updated for ${normalizedPhone}: ${language}`);
  }
  
  return conversation;
}

/**
 * Update conversation context (JSON field)
 */
export async function updateContext(
  phoneNumber: string,
  contextUpdates: Partial<SessionContext>
): Promise<ChatbotConversation | undefined> {
  const normalizedPhone = phoneNumber.replace("whatsapp:", "");

  const conversation = await storage.getChatbotConversation(normalizedPhone);
  if (!conversation) return undefined;

  const currentContext = (conversation.context as SessionContext) || {};
  const newContext = { ...currentContext, ...contextUpdates };

  return await storage.updateChatbotConversation(normalizedPhone, {
    context: newContext,
  });
}

/**
 * Update booking flow data
 */
export async function updateBookingData(
  phoneNumber: string,
  bookingData: {
    selectedBoatId?: string;
    selectedDate?: Date;
    selectedStartTime?: string;
    selectedDuration?: string;
    selectedExtras?: string[];
    customerName?: string;
    customerEmail?: string;
    numberOfPeople?: number;
  }
): Promise<ChatbotConversation | undefined> {
  const normalizedPhone = phoneNumber.replace("whatsapp:", "");
  return await storage.updateChatbotConversation(normalizedPhone, bookingData);
}

/**
 * Reset conversation to initial state
 */
export async function resetSession(phoneNumber: string): Promise<ChatbotConversation | undefined> {
  const normalizedPhone = phoneNumber.replace("whatsapp:", "");
  console.log(`[Session] Resetting conversation for ${normalizedPhone}`);
  return await storage.resetChatbotConversation(normalizedPhone);
}

/**
 * Update conversation language
 */
export async function updateLanguage(
  phoneNumber: string,
  language: SupportedLanguage
): Promise<ChatbotConversation | undefined> {
  const normalizedPhone = phoneNumber.replace("whatsapp:", "");
  return await storage.updateChatbotConversation(normalizedPhone, { language });
}

/**
 * Get current booking data from session
 */
export function getBookingData(conversation: ChatbotConversation) {
  return {
    boatId: conversation.selectedBoatId,
    date: conversation.selectedDate,
    startTime: conversation.selectedStartTime,
    duration: conversation.selectedDuration,
    extras: conversation.selectedExtras || [],
    customerName: conversation.customerName,
    customerEmail: conversation.customerEmail,
    numberOfPeople: conversation.numberOfPeople,
  };
}

/**
 * Check if a session is stale (no activity for more than 24 hours)
 */
export function isSessionStale(conversation: ChatbotConversation): boolean {
  const lastMessage = new Date(conversation.lastMessageAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastMessage.getTime()) / (1000 * 60 * 60);
  return hoursDiff > 24;
}

/**
 * Clear booking data but keep language and other settings
 */
export async function clearBookingData(
  phoneNumber: string
): Promise<ChatbotConversation | undefined> {
  const normalizedPhone = phoneNumber.replace("whatsapp:", "");
  return await storage.updateChatbotConversation(normalizedPhone, {
    selectedBoatId: null,
    selectedDate: null,
    selectedStartTime: null,
    selectedDuration: null,
    selectedExtras: null,
    customerName: null,
    customerEmail: null,
    numberOfPeople: null,
    currentState: CHATBOT_STATES.MAIN_MENU,
  });
}
