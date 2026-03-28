import { logger } from "../lib/logger";

export const SEO_CONFIG = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  valueSerpApiKey: process.env.VALUESERP_API_KEY || "",
  perplexityApiKey: process.env.PERPLEXITY_API_KEY || "",

  competitors: [
    { domain: "clickandboat.com", name: "Click&Boat", type: "platform" as const },
    { domain: "samboat.es", name: "SamBoat", type: "platform" as const },
    { domain: "blanesboats.com", name: "Blanes Boats", type: "local" as const },
    { domain: "ericboatsblanes.com", name: "Eric Boats", type: "local" as const },
    { domain: "rentaboatblanes.com", name: "Rent a Boat Blanes", type: "local" as const },
  ],

  siteUrl: process.env.GSC_SITE_URL || "sc-domain:costabravarentaboat.com",
  baseUrl: process.env.BASE_URL || "https://www.costabravarentaboat.com",

  cron: {
    gscSync: "15 */6 * * *",
    serpTracking: "0 6 * * *",
    competitorCheck: "0 7 * * *",
    siteHealth: "30 */6 * * *",
    geoMonitor: "0 8 * * 1",
    dailyAnalysis: "0 9 * * *",
    weeklyStrategy: "0 10 * * 1",
    executeActions: "0 10 * * 2,4",
    experimentReview: "0 11 * * *",
    revenueCorrelation: "0 0 * * *",
    weeklyReport: "0 20 * * 0",
    semReport: "0 10 */5 * *",
    alertCheck: "45 */6 * * *",
  },

  maxActionsPerWeek: 3,
  maxSerpQueriesPerDay: 50,
  maxTokensPerDay: 100000,

  getSeasonMode(): "aggressive" | "protective" | "building" {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return "aggressive";
    if (month >= 6 && month <= 9) return "protective";
    return "building";
  },

  getMaxActionsPerWeek(): number {
    const mode = this.getSeasonMode();
    if (mode === "aggressive") return 5;
    if (mode === "protective") return 2;
    return 4;
  },
} as const;

export function validateConfig(): boolean {
  const missing: string[] = [];
  if (!SEO_CONFIG.anthropicApiKey) missing.push("ANTHROPIC_API_KEY");
  if (!SEO_CONFIG.valueSerpApiKey) missing.push("VALUESERP_API_KEY");
  if (missing.length > 0) {
    logger.warn(`SEO Engine: missing env vars: ${missing.join(", ")}. Some features disabled.`);
    return false;
  }
  return true;
}
