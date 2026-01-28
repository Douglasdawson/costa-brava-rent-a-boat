// WhatsApp Chatbot Module - Main exports
export { getTwilioClient, sendWhatsAppMessage, sendWhatsAppMessageWithMedia, isTwilioConfigured } from "./twilioClient";
export { handleWhatsAppWebhook, handleWebhookValidation, handleStatusCallback } from "./webhookHandler";
export { detectIntent, detectLanguage, isNumberSelection, parseDate, parseEmail, parseNumber } from "./intentDetector";
export { getSession, updateState, resetSession, updateBookingData, clearBookingData } from "./sessionManager";
export { TRANSLATIONS, getTranslation, formatMessage, type SupportedLanguage } from "./translations";
