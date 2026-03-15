// server/seo/executors/runner.ts
import { db } from "../../db";
import { seoExperiments, seoCampaigns } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";
import { runDailyAnalysis } from "../strategist/agent";
import { updateMeta } from "./meta";

type Executor = (action: {
  page: string;
  details: string;
  hypothesis: string;
  campaignId: number | null;
}) => Promise<{ previousValue: string; newValue: string }>;

const executors: Record<string, Executor> = {
  meta_title: updateMeta,
  meta_description: updateMeta,
  // Future phases:
  // content_expansion: expandContent,
  // faq_add: addFaq,
  // internal_link: addInternalLink,
  // new_page: createPage,
  // schema_update: updateSchema,
};

export async function executeScheduledActions(): Promise<void> {
  // Get latest strategy decisions
  const decisions = await runDailyAnalysis();
  if (!decisions || decisions.immediateActions.length === 0) {
    logger.info("[SEO:Executor] No actions to execute");
    return;
  }

  const maxActions = SEO_CONFIG.getMaxActionsPerWeek();
  const actions = decisions.immediateActions
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxActions);

  logger.info(`[SEO:Executor] Executing ${actions.length} actions (max ${maxActions}/week)`);

  for (const action of actions) {
    const executor = executors[action.type];
    if (!executor) {
      logger.warn(`[SEO:Executor] No executor for type: ${action.type}`);
      continue;
    }

    try {
      // Find related campaign
      let campaignId: number | null = null;
      if (action.campaignName) {
        const [campaign] = await db
          .select({ id: seoCampaigns.id })
          .from(seoCampaigns)
          .where(eq(seoCampaigns.name, action.campaignName))
          .limit(1);
        campaignId = campaign?.id || null;
      }

      const result = await executor({
        page: action.page,
        details: action.details,
        hypothesis: action.hypothesis,
        campaignId,
      });

      // Record experiment with 14-day measurement window
      const measureAt = new Date();
      measureAt.setDate(measureAt.getDate() + 14);

      await db.insert(seoExperiments).values({
        campaignId,
        type: action.type,
        page: action.page,
        hypothesis: action.hypothesis,
        action: action.details,
        previousValue: result.previousValue,
        newValue: result.newValue,
        status: "running",
        measureAt,
        agentReasoning: decisions.reasoning,
      });

      logger.info(`[SEO:Executor] Executed: ${action.type} on ${action.page}`);
    } catch (error) {
      logger.error(`[SEO:Executor] Failed: ${action.type} on ${action.page}`, { error: String(error) });
    }
  }
}
