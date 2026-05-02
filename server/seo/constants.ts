// Shared SEO constants — single source of truth
// Used by robots.ts, seoInjector.ts, and aiBotLogger middleware

export const AI_CRAWLER_NAMES = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot", "Google-Extended",
  "PerplexityBot", "ClaudeBot", "Claude-Web", "Anthropic",
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
