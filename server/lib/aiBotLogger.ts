/**
 * AI Bot Visit Logger Middleware
 *
 * Records every HTTP request from a known LLM crawler (GPTBot, ClaudeBot,
 * PerplexityBot, etc.) to the ai_bot_visits table. Fire-and-forget — never
 * blocks the response. Used by /api/admin/seo/bot-visits to surface GEO
 * presence over time.
 *
 * Production reliability note: the insert is started BEFORE calling next()
 * so the DB write is in-flight before the response is dispatched. This
 * prevents the Cloud Run / Google Frontend proxy layer from recycling the
 * request context before the async write completes (which caused visits to
 * silently drop in production even though the middleware was firing).
 *
 * Status code: captured via res.on("finish") as a best-effort update
 * stored in a separate Promise chain that does NOT gate the primary insert.
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

  logger.info("[ai-bot-visits] detected", { botName, path, method });

  // Start the insert immediately — before next() — so the DB write is
  // in-flight before Express dispatches the response. This is the key
  // difference from the previous implementation where the insert only
  // started inside res.on("finish"), which could be recycled by the
  // Cloud Run proxy before the async callback ever ran.
  //
  // We record statusCode as null here; a best-effort finish hook will
  // attempt to capture it, but the primary record no longer depends on it.
  const insertPromise = recordAiBotVisit({
    botName,
    userAgent: ua ?? "",
    path,
    method,
    lang,
    statusCode: null,
  }).catch((err) => {
    logger.error("[ai-bot-visits] insert error", {
      botName,
      path,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  // Best-effort: if the finish event fires (it usually does in dev and on
  // direct connections), log the resolved status code for observability.
  // This does NOT affect whether the row was written — insertPromise is
  // already in-flight regardless.
  res.on("finish", () => {
    const code = res.statusCode;
    insertPromise.then(() => {
      if (code && code !== 200) {
        logger.info("[ai-bot-visits] response finished", { botName, path, statusCode: code });
      }
    }).catch(() => {});
  });

  next();
}
