/**
 * AI Bot Visit Logger Middleware
 *
 * Records every HTTP request from a known LLM crawler (GPTBot, ClaudeBot,
 * PerplexityBot, etc.) to the ai_bot_visits table. Fire-and-forget — never
 * blocks the response. Used by /api/admin/seo/bot-visits to surface GEO
 * presence over time.
 *
 * Observability: every detection emits a `logger.info` at "[ai-bot-visits]
 * detected" so we can verify the middleware is firing from Replit logs even
 * when the table is empty. Insert failures emit `logger.error` (stderr) with
 * the full error message — no silent fallback.
 */

import type { Request, Response, NextFunction } from "express";
import { detectAIBotName, isAICrawler } from "../seo/constants";
import { recordAiBotVisit } from "../storage/aiBotVisits";
import { logger } from "./logger";

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
  const path = req.path;
  const method = req.method;
  const lang = detectLangFromPath(path);

  // Observability: confirm the middleware is firing on every bot hit. Without
  // this it's impossible to tell from logs alone whether the middleware is
  // skipped (no row + no log) vs the insert is failing (no row + warn log).
  logger.info("[ai-bot-visits] detected", { botName, path, method });

  // Use a one-shot guard so the row isn't double-inserted when both `finish`
  // and `close` fire (close always fires; finish only when response completed
  // cleanly; redirects + connection drops trigger different combinations).
  let recorded = false;
  const record = (eventName: "finish" | "close") => {
    if (recorded) return;
    recorded = true;
    recordAiBotVisit({
      botName,
      userAgent: ua ?? "",
      path,
      method,
      lang,
      statusCode: res.statusCode || null,
    }).catch((err) => {
      // Surface uncaught insert errors on stderr (level=error) so they're
      // unmistakable in Replit logs. The storage layer already has its own
      // try/catch with logger.warn — this catches anything that escapes that.
      logger.error("[ai-bot-visits] uncaught record error", {
        eventName,
        botName,
        path,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  };

  res.on("finish", () => record("finish"));
  res.on("close", () => record("close"));

  next();
}
