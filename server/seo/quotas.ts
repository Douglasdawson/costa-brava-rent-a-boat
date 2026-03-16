import { logger } from "../lib/logger";
import { SEO_CONFIG } from "./config";

interface QuotaUsage {
  tokensUsed: number;
  serpQueries: number;
  perplexityCalls: number;
  date: string;
}

const usage: QuotaUsage = {
  tokensUsed: 0,
  serpQueries: 0,
  perplexityCalls: 0,
  date: new Date().toISOString().split("T")[0],
};

function resetIfNewDay(): void {
  const today = new Date().toISOString().split("T")[0];
  if (usage.date !== today) {
    usage.tokensUsed = 0;
    usage.serpQueries = 0;
    usage.perplexityCalls = 0;
    usage.date = today;
  }
}

export function trackTokens(count: number): void {
  resetIfNewDay();
  usage.tokensUsed += count;
  if (usage.tokensUsed > SEO_CONFIG.maxTokensPerDay) {
    logger.warn(`[SEO:Quota] Token limit exceeded: ${usage.tokensUsed}/${SEO_CONFIG.maxTokensPerDay}`);
  }
}

export function trackSerpQuery(): boolean {
  resetIfNewDay();
  usage.serpQueries++;
  if (usage.serpQueries > SEO_CONFIG.maxSerpQueriesPerDay) {
    logger.warn(`[SEO:Quota] SERP query limit exceeded: ${usage.serpQueries}/${SEO_CONFIG.maxSerpQueriesPerDay}`);
    return false;
  }
  return true;
}

export function trackPerplexityCall(): void {
  resetIfNewDay();
  usage.perplexityCalls++;
}

export function getQuotaUsage(): QuotaUsage {
  resetIfNewDay();
  return { ...usage };
}
