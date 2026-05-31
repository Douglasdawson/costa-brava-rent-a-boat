// server/seo/executors/runner.ts
import { db } from "../../db";
import { seoExperiments, seoCampaigns } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";
import { runDailyAnalysis } from "../strategist/agent";
import { updateMeta } from "./meta";
import { addFaq } from "./faq";
import { addInternalLink } from "./internalLink";
import { updateSchema } from "./schema";

export type ExecutorAction = {
  page: string;
  details: string;
  hypothesis: string;
  campaignId: number | null;
};

export type Executor = (
  action: ExecutorAction,
  opts?: { dryRun?: boolean },
) => Promise<{ previousValue: string; newValue: string }>;

export const executors: Record<string, Executor> = {
  meta_title: updateMeta,
  meta_description: updateMeta,
  faq_add: addFaq,
  internal_link: addInternalLink,
  schema_update: updateSchema,
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

  const gated = SEO_CONFIG.approvalRequired;
  logger.info(
    `[SEO:Executor] Processing ${actions.length} actions (max ${maxActions}/week, approvalRequired=${gated})`,
  );

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

      // Approval gate: stage a dry-run preview as `pending_approval` instead of
      // mutating the DB. An admin applies it from the CRM (see applyExperiment).
      // The change is materialised (and measureAt set) only on approval.
      const result = await executor(
        { page: action.page, details: action.details, hypothesis: action.hypothesis, campaignId },
        { dryRun: gated },
      );

      const measureAt = gated ? null : (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d; })();

      await db.insert(seoExperiments).values({
        campaignId,
        type: action.type,
        page: action.page,
        hypothesis: action.hypothesis,
        action: action.details,
        previousValue: result.previousValue,
        newValue: result.newValue,
        status: gated ? "pending_approval" : "running",
        executedAt: gated ? null : new Date(),
        measureAt,
        agentReasoning: decisions.reasoning,
      });

      logger.info(
        `[SEO:Executor] ${gated ? "Staged for approval" : "Executed"}: ${action.type} on ${action.page}`,
      );
    } catch (error) {
      logger.error(`[SEO:Executor] Failed: ${action.type} on ${action.page}`, { error: String(error) });
    }
  }
}
