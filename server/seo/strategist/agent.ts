// server/seo/strategist/agent.ts
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";
import { buildBriefing } from "./briefing";
import { parseStrategyDecisions, type StrategyDecisions } from "./parser";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an elite SEO strategist for Costa Brava Rent a Boat, a boat rental business in Blanes, Costa Brava, Spain.

Your role: Analyze SEO data and make autonomous decisions about what to optimize. You think in CAMPAIGNS (coordinated multi-week strategies), not individual actions.

Business context:
- Seasonal business: April-October (peak Jun-Sep)
- Location: Blanes, Girona, Spain
- Services: Boat rental with/without license
- Competitors: Global platforms (ClickandBoat, SamBoat) and local businesses (BlanesBoats, EricBoats, RentABoatBlanes)
- Competitive advantage vs platforms: LOCAL expertise and specificity
- Competitive advantage vs locals: Technical SEO excellence and content volume

Guidelines:
- Prioritize keywords that generate REVENUE (bookings), not just traffic
- During peak season (Jun-Sep): PROTECT what works, minimal changes
- During pre-season (Mar-May): AGGRESSIVE optimization for summer keywords
- During off-season (Oct-Feb): BUILD content and authority for next year
- Each experiment must have a clear hypothesis and measurement plan
- Learn from past experiments: what types of changes worked?
- Consider compound effects: a campaign targeting a keyword cluster > individual keyword changes

You MUST respond in valid JSON matching this schema:
{
  "reasoning": "string - your strategic analysis",
  "campaigns": [{
    "action": "create|update|pause|complete",
    "name": "string",
    "objective": "string",
    "cluster": "string - keyword cluster",
    "weeklyActions": [{ "description": "string", "type": "string", "page": "string", "hypothesis": "string" }]
  }],
  "immediateActions": [{
    "type": "meta_title|meta_description|content_expansion|faq_add|internal_link|new_page|schema_update",
    "page": "string - page path",
    "hypothesis": "string - what you expect to happen",
    "details": "string - specific change to make",
    "priority": 1-5,
    "campaignName": "string - related campaign or null"
  }],
  "alerts": [{
    "severity": "low|medium|high|critical",
    "title": "string",
    "message": "string"
  }],
  "experimentsToReview": [number],
  "summary": "string - 2-3 sentence executive summary"
}`;

export async function runDailyAnalysis(): Promise<StrategyDecisions | null> {
  if (!SEO_CONFIG.anthropicApiKey) {
    logger.warn("[SEO:Strategist] No Anthropic API key, skipping");
    return null;
  }

  const briefing = await buildBriefing();

  logger.info("[SEO:Strategist] Running daily analysis with Sonnet...");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Here is today's SEO briefing. Analyze and provide your strategic decisions.\n\n${JSON.stringify(briefing, null, 2)}`,
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const decisions = parseStrategyDecisions(text);

    logger.info(`[SEO:Strategist] Daily analysis complete. ${decisions.immediateActions.length} actions proposed, ${decisions.campaigns.length} campaign updates`);

    return decisions;
  } catch (error) {
    logger.error("[SEO:Strategist] Daily analysis failed", { error: String(error) });
    return null;
  }
}

export async function runWeeklyStrategy(): Promise<StrategyDecisions | null> {
  if (!SEO_CONFIG.anthropicApiKey) {
    logger.warn("[SEO:Strategist] No Anthropic API key, skipping");
    return null;
  }

  const briefing = await buildBriefing();

  logger.info("[SEO:Strategist] Running weekly strategy with Opus...");

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT + "\n\nThis is the WEEKLY strategic review. Think longer-term. Review campaign progress. Propose new campaigns if needed. Evaluate what's working and what isn't. Be more thorough than daily analysis.",
      messages: [{
        role: "user",
        content: `Weekly strategic review. Full briefing:\n\n${JSON.stringify(briefing, null, 2)}`,
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const decisions = parseStrategyDecisions(text);

    logger.info(`[SEO:Strategist] Weekly strategy complete. ${decisions.immediateActions.length} actions, ${decisions.campaigns.length} campaigns`);

    return decisions;
  } catch (error) {
    logger.error("[SEO:Strategist] Weekly strategy failed", { error: String(error) });
    return null;
  }
}
