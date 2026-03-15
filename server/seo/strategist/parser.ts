// server/seo/strategist/parser.ts
import { logger } from "../../lib/logger";

export interface StrategyAction {
  type: string;
  page: string;
  hypothesis: string;
  details: string;
  priority: number;
  campaignName: string | null;
}

export interface CampaignUpdate {
  action: "create" | "update" | "pause" | "complete";
  name: string;
  objective: string;
  cluster: string;
  weeklyActions: Array<{ description: string; type: string; page: string; hypothesis: string }>;
}

export interface StrategyAlert {
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
}

export interface StrategyDecisions {
  reasoning: string;
  campaigns: CampaignUpdate[];
  immediateActions: StrategyAction[];
  alerts: StrategyAlert[];
  experimentsToReview: number[];
  summary: string;
}

export function parseStrategyDecisions(rawText: string): StrategyDecisions {
  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logger.error("[SEO:Parser] No JSON found in strategist response");
    return emptyDecisions("Failed to parse response");
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      reasoning: parsed.reasoning || "",
      campaigns: parsed.campaigns || [],
      immediateActions: (parsed.immediateActions || []).map((a: Record<string, unknown>) => ({
        type: String(a.type || ""),
        page: String(a.page || ""),
        hypothesis: String(a.hypothesis || ""),
        details: String(a.details || ""),
        priority: Number(a.priority || 3),
        campaignName: a.campaignName ? String(a.campaignName) : null,
      })),
      alerts: parsed.alerts || [],
      experimentsToReview: parsed.experimentsToReview || [],
      summary: parsed.summary || "",
    };
  } catch (error) {
    logger.error("[SEO:Parser] Failed to parse JSON", { error: String(error) });
    return emptyDecisions("JSON parse error");
  }
}

function emptyDecisions(reason: string): StrategyDecisions {
  return {
    reasoning: reason,
    campaigns: [],
    immediateActions: [],
    alerts: [],
    experimentsToReview: [],
    summary: reason,
  };
}
