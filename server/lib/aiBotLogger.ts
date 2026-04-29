/**
 * AI Bot Visit Logger Middleware
 *
 * Records every HTTP request from a known LLM crawler (GPTBot, ClaudeBot,
 * PerplexityBot, etc.) to the ai_bot_visits table. Fire-and-forget — never
 * blocks the response. Used by /api/admin/seo/bot-visits to surface GEO
 * presence over time.
 */

import type { Request, Response, NextFunction } from "express";
import { detectAIBotName, isAICrawler } from "../seo/constants";
import { recordAiBotVisit } from "../storage/aiBotVisits";

// Skip noisy paths that don't reflect content indexing intent — keeps the
// table small and the dashboard signal-rich.
const SKIP_PATHS = [
  "/api/",
  "/assets/",
  "/images/",
  "/fonts/",
  "/favicon",
  "/sw.js",
  "/manifest.json",
];

function shouldSkip(path: string): boolean {
  if (path.includes(".")) {
    // Static asset extensions — don't log image/CSS/JS hits
    if (/\.(?:png|jpe?g|webp|avif|svg|gif|ico|css|js|map|woff2?|ttf|otf|mp4|webm)$/i.test(path)) {
      return true;
    }
  }
  return SKIP_PATHS.some((p) => path.startsWith(p));
}

function detectLangFromPath(path: string): string | null {
  const m = path.match(/^\/([a-z]{2})(?:\/|$)/i);
  if (!m) return null;
  const code = m[1].toLowerCase();
  if (["es", "en", "ca", "fr", "de", "nl", "it", "ru"].includes(code)) return code;
  return null;
}

export function aiBotLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ua = req.get("user-agent");
  if (!isAICrawler(ua) || shouldSkip(req.path)) {
    next();
    return;
  }

  const botName = detectAIBotName(ua) ?? "unknown";

  // Capture status code after the response finishes — gives a complete record.
  res.on("finish", () => {
    void recordAiBotVisit({
      botName,
      userAgent: ua ?? "",
      path: req.path,
      method: req.method,
      lang: detectLangFromPath(req.path),
      statusCode: res.statusCode,
    });
  });

  next();
}
