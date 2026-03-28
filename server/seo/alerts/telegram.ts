// server/seo/alerts/telegram.ts
import { logger } from "../../lib/logger";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

export async function sendTelegramMessage(title: string, message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    logger.warn("[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID — skipping send");
    return;
  }

  // Telegram has a 4096 char limit per message — split if needed
  const fullText = `*${title}*\n\n${message}`;
  const chunks = splitMessage(fullText, 4000);

  for (const chunk of chunks) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: chunk,
          parse_mode: "Markdown",
        }),
      });

      if (!res.ok) {
        // Retry without Markdown if parsing fails
        const retry = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: chunk,
          }),
        });
        if (!retry.ok) {
          logger.warn(`[Telegram] Failed to send message: ${retry.status}`);
        }
      }
    } catch (error) {
      logger.warn(`[Telegram] Error sending message: ${error}`);
    }
  }

  logger.info(`[Telegram] Message sent: ${title}`);
}

function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    // Split at last newline before limit
    const cutPoint = remaining.lastIndexOf("\n", maxLength);
    const splitAt = cutPoint > maxLength * 0.5 ? cutPoint : maxLength;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  return chunks;
}
