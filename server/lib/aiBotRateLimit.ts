/**
 * Selective rate limiting for AI crawlers.
 *
 * Strategy: each known crawler family gets its own per-IP window. This lets
 * us be generous with the engines that drive citation traffic (GPTBot,
 * ClaudeBot, Google-Extended, PerplexityBot) while protecting against the
 * heavyweight scrapers that don't train models we want to be in
 * (Bytespider, Amazonbot, CCBot — they consume bandwidth without driving
 * citations to our site).
 *
 * Throttled bots get a 429 with `Retry-After`. Human traffic is never
 * touched — the dispatcher matches on AI_CRAWLER_NAMES + the heavy-scraper
 * list and falls through (next()) for everyone else.
 *
 * Mount BEFORE registerRoutes so 429s are returned before the request hits
 * any handler. Loggable via aiBotLogger which already captures statusCode.
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// ---------------------------------------------------------------------------
// Tier definitions — UA substring match (case-insensitive). Order matters:
// first match wins so place tighter buckets first.
// ---------------------------------------------------------------------------

interface BotTier {
  name: string;
  uaPatterns: RegExp[];
  limitPerMinute: number;
}

const TIERS: BotTier[] = [
  {
    // OpenAI family — the engine that drives the most citation surface.
    name: "openai",
    uaPatterns: [/GPTBot/i, /ChatGPT-User/i, /OAI-SearchBot/i],
    limitPerMinute: 100,
  },
  {
    // Anthropic family — ClaudeBot etc. Same generosity as OpenAI.
    name: "anthropic",
    uaPatterns: [/ClaudeBot/i, /Claude-Web/i, /\bAnthropic\b/i],
    limitPerMinute: 100,
  },
  {
    // Google-Extended — Gemini training/grounding crawler. Largest budget
    // because Google AI Overviews still drive serious referral.
    name: "google-extended",
    uaPatterns: [/Google-Extended/i],
    limitPerMinute: 200,
  },
  {
    // Perplexity — emerging citation source, mid budget.
    name: "perplexity",
    uaPatterns: [/PerplexityBot/i],
    limitPerMinute: 50,
  },
  {
    // Apple — Applebot-Extended for Siri / Apple Intelligence.
    name: "apple-extended",
    uaPatterns: [/Applebot-Extended/i],
    limitPerMinute: 50,
  },
  {
    // Mistral, Cohere, You.com — smaller engines, modest budget.
    name: "mid-tier-ai",
    uaPatterns: [/MistralAI-User/i, /cohere-ai/i, /YouBot/i, /DuckAssistBot/i, /Meta-ExternalAgent/i],
    limitPerMinute: 30,
  },
  {
    // Heavy scrapers that don't train models we want exposure in. Tight
    // bucket — they get something, just not free reign. CCBot's data does
    // feed CommonCrawl which is used by some training pipelines, so 10/min
    // is high enough to keep us in the index without burning bandwidth.
    name: "heavy-scrapers",
    uaPatterns: [/Bytespider/i, /Amazonbot/i, /CCBot/i, /FacebookBot/i, /Diffbot/i, /AI2Bot/i, /Timpibot/i, /Omgili/i, /ImagesiftBot/i],
    limitPerMinute: 10,
  },
];

// ---------------------------------------------------------------------------
// Per-tier rate limiters — one instance per tier so each maintains its own
// in-memory counter.
// ---------------------------------------------------------------------------
const limiters = new Map<string, RequestHandler>();
for (const tier of TIERS) {
  limiters.set(
    tier.name,
    rateLimit({
      windowMs: 60_000,
      limit: tier.limitPerMinute,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      keyGenerator: (req: Request): string => {
        const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip;
        if (!ip) return `${tier.name}:unknown`;
        return `${tier.name}:${ipKeyGenerator(ip)}`;
      },
      handler: (req, res) => {
        res.status(429).json({
          error: "rate_limit_exceeded",
          tier: tier.name,
          limit_per_minute: tier.limitPerMinute,
          message: `AI crawler tier '${tier.name}' is capped at ${tier.limitPerMinute} requests per minute per IP.`,
        });
      },
      // Skip OPTIONS preflights so CORS-style probes don't burn quota.
      skip: (req) => req.method === "OPTIONS",
    }),
  );
}

function matchTier(ua: string): BotTier | null {
  for (const tier of TIERS) {
    if (tier.uaPatterns.some((p) => p.test(ua))) return tier;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Dispatcher middleware — selects the right limiter and runs it. For
// non-AI-bot traffic and OPTIONS preflights, calls next() immediately.
// ---------------------------------------------------------------------------
export function aiBotRateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "OPTIONS") return next();
  // Allowlist a few critical paths so we never throttle robots/sitemap/meta
  // (search engines rely on them being instantly accessible).
  const path = req.path;
  if (
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path.startsWith("/sitemap-") ||
    path === "/llms.txt" ||
    path === "/llms-full.txt" ||
    path === "/.well-known/agent.json" ||
    path === "/.well-known/security.txt" ||
    path === "/openapi.json"
  ) {
    return next();
  }

  const ua = req.headers["user-agent"]?.toString() ?? "";
  if (!ua) return next();
  const tier = matchTier(ua);
  if (!tier) return next();
  const limiter = limiters.get(tier.name);
  if (!limiter) return next();
  return limiter(req, res, next);
}

/** Exposed for tests and for a future admin endpoint that surfaces tier config. */
export function getAiBotRateLimitConfig(): Array<{ tier: string; limitPerMinute: number; patterns: string[] }> {
  return TIERS.map((t) => ({
    tier: t.name,
    limitPerMinute: t.limitPerMinute,
    patterns: t.uaPatterns.map((p) => p.source),
  }));
}
