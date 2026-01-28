// Twilio WhatsApp Client Configuration
import Twilio from "twilio";

// Lazy initialization to avoid errors when credentials are not set
let twilioClient: Twilio.Twilio | null = null;

/**
 * Get or create the Twilio client instance
 * Throws error if credentials are not configured
 */
export function getTwilioClient(): Twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
      );
    }

    if (!accountSid.startsWith("AC")) {
      throw new Error("Invalid TWILIO_ACCOUNT_SID: must start with 'AC'");
    }

    twilioClient = Twilio(accountSid, authToken);
  }

  return twilioClient;
}

/**
 * Get the WhatsApp "from" number (sandbox or production)
 */
export function getWhatsAppFromNumber(): string {
  // Default to Twilio Sandbox number for development
  return process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
}

/**
 * Send a WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<string> {
  const client = getTwilioClient();
  const from = getWhatsAppFromNumber();

  // Ensure 'to' has WhatsApp prefix
  const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  try {
    const message = await client.messages.create({
      from,
      to: toNumber,
      body,
    });

    console.log(`[WhatsApp] Message sent to ${to}: ${message.sid}`);
    return message.sid;
  } catch (error: any) {
    console.error(`[WhatsApp] Error sending message to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Send a WhatsApp message with media (image)
 */
export async function sendWhatsAppMessageWithMedia(
  to: string,
  body: string,
  mediaUrl: string
): Promise<string> {
  const client = getTwilioClient();
  const from = getWhatsAppFromNumber();

  const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  try {
    const message = await client.messages.create({
      from,
      to: toNumber,
      body,
      mediaUrl: [mediaUrl],
    });

    console.log(`[WhatsApp] Media message sent to ${to}: ${message.sid}`);
    return message.sid;
  } catch (error: any) {
    console.error(`[WhatsApp] Error sending media message to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Check if Twilio is properly configured
 */
export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_ACCOUNT_SID.startsWith("AC")
  );
}
