/**
 * AI Bot Visit Logger Middleware
 *
 * Records every HTTP request from a known LLM crawler (GPTBot, ClaudeBot,
 * PerplexityBot, etc.) AND search-engine indexing crawler (Googlebot, Bingbot,
 * etc.) to the ai_bot_visits table. Fire-and-forget — never blocks the
 * response. Used by /api/admin/seo/bot-visits to surface GEO + SEO crawl
 * presence over time. Social-preview unfurlers and generic bots are NOT
 * tracked (see SEARCH_ENGINE_BOT_NAMES in server/seo/constants).
 *
 * Reliability + status code (the design that lets us have both):
 *
 *  - We monkey-patch `res.end()` because it's the single point where:
 *      1. `res.statusCode` has been set definitively by Express handlers
 *      2. The response has NOT been dispatched to the network yet
 *      3. It's called exactly once for every response (send/json/redirect/
 *         sendStatus/sendFile/error 500 all funnel through it)
 *    So we fire the INSERT inside the patched end() — the promise is
 *    in-flight BEFORE the original end() ships bytes, which means Cloud Run
 *    can't recycle the request context before the DB write commits.
 *
 *  - We also subscribe to `res.on("close")` as a safety net for aborts
 *    (client disconnect mid-response). Both paths are guarded by a
 *    `captured` flag so the row is written exactly once.
 *
 * This replaces an earlier two-step approach (INSERT before next() with
 * statusCode=null + UPDATE on finish) that left status_code as NULL in
 * production because the finish callback was being recycled by the proxy.
 */

import type { Request, Response, NextFunction } from "express";
import { detectBotName } from "../seo/constants";
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
  const botName = detectBotName(ua);
  if (!botName || shouldSkip(req.path)) {
    next();
    return;
  }

  const path = req.path;
  const method = req.method;
  const lang = detectLangFromPath(path);

  logger.info("[ai-bot-visits] detected", { botName, path, method });

  // Single-fire guard: res.end may be called once and res.on("close") may
  // fire shortly after. Whichever fires first owns the insert.
  let captured = false;
  const fire = (statusCode: number | null, source: "end" | "close") => {
    if (captured) return;
    captured = true;
    void recordAiBotVisit({
      botName,
      userAgent: ua ?? "",
      path,
      method,
      lang,
      statusCode,
    }).catch((err) => {
      logger.error("[ai-bot-visits] insert error", {
        source,
        botName,
        path,
        statusCode,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  };

  // Primary: monkey-patch res.end so we run synchronously at the moment the
  // response is materialized — statusCode is final, and the insert promise
  // gets queued before originalEnd() flushes bytes to the socket.
  const originalEnd = res.end.bind(res);
  res.end = function (...args: Parameters<typeof originalEnd>) {
    fire(res.statusCode || 200, "end");
    return originalEnd(...args);
  } as typeof res.end;

  // Safety net: client aborts before res.end gets called. statusCode may
  // be 0 / unset here, which is OK — we record null in that case.
  res.on("close", () => {
    fire(res.statusCode || null, "close");
  });

  next();
}
