// Shared SEO constants — single source of truth
// Used by robots.ts, seoInjector.ts, and aiBotLogger middleware

export const AI_CRAWLER_NAMES = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot", "Google-Extended",
  // Specific tokens BEFORE generic ones: detectAIBotName returns the first
  // match, and Claude-SearchBot/Claude-User UAs also contain "Anthropic".
  "PerplexityBot", "Perplexity-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User", "Claude-Web", "Anthropic",
  "Applebot-Extended", "CCBot", "Bytespider", "cohere-ai",
  "Meta-ExternalAgent", "FacebookBot", "Amazonbot", "YouBot",
  "Timpibot", "AI2Bot", "Diffbot", "ImagesiftBot", "Omgili",
  "DuckAssistBot", "MistralAI-User",
] as const;

export type AICrawlerName = typeof AI_CRAWLER_NAMES[number];

const AI_BOT_PATTERNS = AI_CRAWLER_NAMES.map((name) => new RegExp(name, "i"));

export function isAICrawler(userAgent: string | undefined | null): boolean {
  if (!userAgent) return false;
  return AI_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function detectAIBotName(userAgent: string | undefined | null): AICrawlerName | null {
  if (!userAgent) return null;
  for (const name of AI_CRAWLER_NAMES) {
    if (new RegExp(name, "i").test(userAgent)) return name;
  }
  return null;
}

// Classic search-engine + social-preview crawlers. Kept separate from the AI
// crawler list because they drive indexing/link-unfurling, not LLM training.
// Used by the root language-negotiation handler so bots always get the
// canonical 301 -> /es/ (SEO consolidation, see server/index.ts) instead of an
// Accept-Language redirect.
export const SEARCH_SOCIAL_BOT_NAMES = [
  // Search engines
  "Googlebot", "Storebot-Google", "Google-InspectionTool", "AdsBot-Google",
  "Bingbot", "BingPreview", "DuckDuckBot", "DuckDuckGo", "YandexBot",
  "Baiduspider", "Applebot", "Slurp", "Sogou", "Exabot", "SeznamBot",
  // Social / messaging unfurlers
  "facebookexternalhit", "Facebot", "Twitterbot", "LinkedInBot",
  "WhatsApp", "Slackbot", "TelegramBot", "Discordbot", "Pinterest",
  "redditbot", "SkypeUriPreview", "vkShare",
  // Generic
  "bot", "crawler", "spider",
] as const;

const SEARCH_SOCIAL_BOT_PATTERNS = SEARCH_SOCIAL_BOT_NAMES.map(
  (name) => new RegExp(name, "i"),
);

export function isSearchOrSocialBot(userAgent: string | undefined | null): boolean {
  if (!userAgent) return false;
  return SEARCH_SOCIAL_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// Search-engine indexing crawlers we track in ai_bot_visits ALONGSIDE the AI
// crawlers. Deliberately a curated subset of SEARCH_SOCIAL_BOT_NAMES: it
// EXCLUDES social-preview unfurlers (WhatsApp, Slackbot, Twitterbot, etc.) and
// the generic "bot"/"crawler"/"spider" catch-alls, which would flood the table
// without reflecting indexing intent. Specific tokens BEFORE generic ones so
// detectSearchEngineBotName returns the most precise match first.
export const SEARCH_ENGINE_BOT_NAMES = [
  "Googlebot", "Storebot-Google", "Google-InspectionTool", "AdsBot-Google",
  "Bingbot", "BingPreview",
  "DuckDuckBot", "YandexBot", "Baiduspider", "Applebot",
  "SeznamBot", "Sogou", "Slurp",
] as const;

export type SearchEngineBotName = typeof SEARCH_ENGINE_BOT_NAMES[number];

const SEARCH_ENGINE_BOT_PATTERNS = SEARCH_ENGINE_BOT_NAMES.map(
  (name) => new RegExp(name, "i"),
);

export function isSearchEngineBot(userAgent: string | undefined | null): boolean {
  if (!userAgent) return false;
  return SEARCH_ENGINE_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function detectSearchEngineBotName(
  userAgent: string | undefined | null,
): SearchEngineBotName | null {
  if (!userAgent) return null;
  for (const name of SEARCH_ENGINE_BOT_NAMES) {
    if (new RegExp(name, "i").test(userAgent)) return name;
  }
  return null;
}

export type TrackedBotName = AICrawlerName | SearchEngineBotName;

// Combined name detector for the ai_bot_visits logger. AI crawlers are checked
// FIRST because their tokens are more specific (e.g. "Applebot-Extended" must
// win over the search-engine "Applebot"). Returns null for clients we don't
// track, which the logger uses as its skip gate.
export function detectBotName(
  userAgent: string | undefined | null,
): TrackedBotName | null {
  return detectAIBotName(userAgent) ?? detectSearchEngineBotName(userAgent);
}

// Any non-human client: AI crawlers + search/social bots. The root redirect
// uses this to keep crawlers on the consolidated /es/ canonical while humans
// get language-negotiated.
export function isCrawler(userAgent: string | undefined | null): boolean {
  return isAICrawler(userAgent) || isSearchOrSocialBot(userAgent);
}
