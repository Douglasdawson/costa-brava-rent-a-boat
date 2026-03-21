// Shared SEO constants — single source of truth
// Used by robots.ts and seoInjector.ts

export const AI_CRAWLER_NAMES = [
  "GPTBot", "ChatGPT-User", "Google-Extended", "PerplexityBot",
  "ClaudeBot", "Claude-Web", "Anthropic", "Applebot-Extended",
  "CCBot", "Bytespider", "cohere-ai", "Meta-ExternalAgent",
  "Amazonbot", "YouBot", "Timpibot", "AI2Bot", "Diffbot",
  "ImagesiftBot", "Omgili",
] as const;

export type AICrawlerName = typeof AI_CRAWLER_NAMES[number];
