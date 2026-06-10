// server/seo/executors/runner.ts
import { db } from "../../db";
import { seoExperiments, seoCampaigns, seoAlerts } from "../../../shared/schema";
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

// Persist the strategist's campaign decisions. Until 2026-06-10 campaigns were
// parsed but NEVER written anywhere (seo_campaigns had 0 rows ever), so the
// campaignId lookup below always missed and the briefing's "active campaigns"
// section was permanently empty — the brain's output evaporated each run.
export async function syncCampaigns(
  campaigns: Array<{ action: string; name: string; objective: string; cluster: string }>,
): Promise<void> {
  for (const c of campaigns) {
    if (!c.name) continue;
    try {
      const [existing] = await db
        .select({ id: seoCampaigns.id })
        .from(seoCampaigns)
        .where(eq(seoCampaigns.name, c.name))
        .limit(1);

      if (c.action === "create" && !existing) {
        await db.insert(seoCampaigns).values({
          name: c.name,
          objective: c.objective || null,
          cluster: c.cluster || null,
          status: "active",
          startDate: new Date().toISOString().slice(0, 10),
        });
        logger.info(`[SEO:Executor] Campaign created: ${c.name}`);
      } else if (existing && (c.action === "pause" || c.action === "complete")) {
        await db
          .update(seoCampaigns)
          .set({
            status: c.action === "pause" ? "paused" : "completed",
            endDate: c.action === "complete" ? new Date().toISOString().slice(0, 10) : null,
          })
          .where(eq(seoCampaigns.id, existing.id));
        logger.info(`[SEO:Executor] Campaign ${c.action}d: ${c.name}`);
      } else if (existing && c.action === "update") {
        await db
          .update(seoCampaigns)
          .set({ objective: c.objective || null, cluster: c.cluster || null })
          .where(eq(seoCampaigns.id, existing.id));
      }
    } catch (error) {
      logger.error(`[SEO:Executor] Campaign sync failed: ${c.name}`, { error: String(error) });
    }
  }
}

// Persist strategist alerts so they flow through the alert engine
// (Telegram/WhatsApp for critical/high, dashboard otherwise). Previously
// parsed and dropped.
export async function persistStrategyAlerts(
  alerts: Array<{ severity: string; title: string; message: string }>,
): Promise<void> {
  for (const alert of alerts) {
    if (!alert.title) continue;
    try {
      await db.insert(seoAlerts).values({
        type: "strategist",
        severity: alert.severity || "low",
        title: alert.title,
        message: alert.message || null,
        status: "new",
      });
    } catch (error) {
      logger.error(`[SEO:Executor] Alert persist failed: ${alert.title}`, { error: String(error) });
    }
  }
}

// Shared persistence for daily/weekly strategist runs (campaigns + alerts).
// Called by the worker jobs so the 09:00 analysis isn't discarded in memory.
export async function persistStrategyDecisions(
  decisions: { campaigns: Array<{ action: string; name: string; objective: string; cluster: string }>; alerts: Array<{ severity: string; title: string; message: string }> } | null,
): Promise<void> {
  if (!decisions) return;
  await syncCampaigns(decisions.campaigns);
  await persistStrategyAlerts(decisions.alerts);
}

export async function executeScheduledActions(): Promise<void> {
  // Get latest strategy decisions
  const decisions = await runDailyAnalysis();
  if (!decisions) {
    logger.info("[SEO:Executor] No decisions (strategist unavailable)");
    return;
  }

  // Persist campaigns FIRST so the campaignId lookup below can resolve them.
  await syncCampaigns(decisions.campaigns);
  await persistStrategyAlerts(decisions.alerts);

  if (decisions.immediateActions.length === 0) {
    logger.warn(
      `[SEO:Executor] Strategist returned 0 immediate actions (summary: ${(decisions.summary || "").slice(0, 200)})`,
    );
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
