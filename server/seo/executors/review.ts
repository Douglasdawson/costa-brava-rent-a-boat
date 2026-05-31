// server/seo/executors/review.ts
//
// Human review layer for the autonomous SEO executor loop. When
// SEO_CONFIG.approvalRequired is on, strategist actions are staged as
// `pending_approval` experiments (a dry-run preview, no DB mutation) by
// runner.ts. This module lets an admin list, approve (apply for real),
// reject, or roll back those experiments from the CRM.
//
// Rollback is migration-free:
//   - meta_title / meta_description / schema_update → re-upsert previousValue.
//   - faq_add  → deactivate the rows inserted by this apply (page + createdAt
//                >= executedAt; the apply stamps executedAt right before insert).
//   - internal_link → deactivate the row matching (fromPage,toPage,anchorText).

import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "../../db";
import { seoExperiments, seoMeta, seoFaqs, seoLinks } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { executors, type ExecutorAction } from "./runner";

type Experiment = typeof seoExperiments.$inferSelect;

const MEASUREMENT_WINDOW_DAYS = 14;

function actionFromExperiment(exp: Experiment): ExecutorAction {
  return {
    page: exp.page ?? "",
    details: exp.action ?? "",
    hypothesis: exp.hypothesis ?? "",
    campaignId: exp.campaignId ?? null,
  };
}

/** List experiments, optionally filtered by status, newest first. */
export async function listExperiments(
  status?: string,
  limit = 100,
): Promise<Experiment[]> {
  const rows = await db
    .select()
    .from(seoExperiments)
    .where(status ? eq(seoExperiments.status, status) : undefined)
    .orderBy(desc(seoExperiments.createdAt))
    .limit(limit);
  return rows;
}

async function loadExperiment(id: number): Promise<Experiment> {
  const [exp] = await db.select().from(seoExperiments).where(eq(seoExperiments.id, id)).limit(1);
  if (!exp) throw new Error(`Experiment ${id} not found`);
  return exp;
}

/**
 * Approve a pending experiment: run its executor FOR REAL, then mark it
 * running with a fresh measurement window. previousValue/newValue are
 * refreshed from the real run (the staged preview may be stale).
 */
export async function applyExperiment(id: number): Promise<Experiment> {
  const exp = await loadExperiment(id);
  if (exp.status !== "pending_approval") {
    throw new Error(`Experiment ${id} is not pending approval (status=${exp.status})`);
  }
  const executor = exp.type ? executors[exp.type] : undefined;
  if (!executor) throw new Error(`No executor for type: ${exp.type}`);

  // Stamp executedAt BEFORE applying so faq rollback can scope inserted rows.
  const executedAt = new Date();
  const result = await executor(actionFromExperiment(exp), { dryRun: false });

  const measureAt = new Date(executedAt);
  measureAt.setDate(measureAt.getDate() + MEASUREMENT_WINDOW_DAYS);

  const [updated] = await db
    .update(seoExperiments)
    .set({
      status: "running",
      executedAt,
      measureAt,
      previousValue: result.previousValue,
      newValue: result.newValue,
    })
    .where(eq(seoExperiments.id, id))
    .returning();

  logger.info(`[SEO:Review] Approved + applied experiment ${id}: ${exp.type} on ${exp.page}`);
  return updated;
}

/** Reject a pending experiment without applying anything. */
export async function rejectExperiment(id: number, reason?: string): Promise<Experiment> {
  const exp = await loadExperiment(id);
  if (exp.status !== "pending_approval") {
    throw new Error(`Experiment ${id} is not pending approval (status=${exp.status})`);
  }
  const [updated] = await db
    .update(seoExperiments)
    .set({ status: "rejected", learning: reason ? `Rejected: ${reason}` : "Rejected" })
    .where(eq(seoExperiments.id, id))
    .returning();
  logger.info(`[SEO:Review] Rejected experiment ${id}: ${exp.type} on ${exp.page}`);
  return updated;
}

/** Roll back an applied (running) experiment, restoring the previous state. */
export async function rollbackExperiment(id: number): Promise<Experiment> {
  const exp = await loadExperiment(id);
  if (exp.status !== "running") {
    throw new Error(`Experiment ${id} is not in a rollbackable state (status=${exp.status})`);
  }
  const page = exp.page ?? "";

  switch (exp.type) {
    case "meta_title":
    case "meta_description": {
      const field = exp.type === "meta_title" ? "title" : "description";
      const value = exp.previousValue ?? "";
      await db
        .insert(seoMeta)
        .values({ page, language: "es", [field]: value, updatedBy: "system", updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [seoMeta.page, seoMeta.language],
          set: { [field]: value, updatedBy: "system", updatedAt: new Date() },
        });
      break;
    }
    case "schema_update": {
      const value = exp.previousValue ?? "";
      await db
        .insert(seoMeta)
        .values({ page, language: "es", keywords: value, updatedBy: "system", updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [seoMeta.page, seoMeta.language],
          set: { keywords: value, updatedBy: "system", updatedAt: new Date() },
        });
      break;
    }
    case "faq_add": {
      // Deactivate the locale rows inserted by this apply. executedAt was
      // stamped immediately before the inserts, so createdAt >= executedAt
      // scopes exactly this batch for the page.
      if (!exp.executedAt) throw new Error(`Experiment ${id} has no executedAt; cannot scope FAQ rollback`);
      await db
        .update(seoFaqs)
        .set({ active: false })
        .where(and(eq(seoFaqs.page, page), gte(seoFaqs.createdAt, exp.executedAt)));
      break;
    }
    case "internal_link": {
      // Parse the target/anchor back out of the stored action to match the row.
      let toPage = "";
      let anchorText = "";
      let fromPage = page;
      for (const line of (exp.action ?? "").split("\n")) {
        const t = line.trim();
        if (t.toLowerCase().startsWith("from:")) fromPage = t.slice("from:".length).trim() || page;
        else if (t.toLowerCase().startsWith("to:")) toPage = t.slice("to:".length).trim();
        else if (t.toLowerCase().startsWith("anchor:")) anchorText = t.slice("anchor:".length).trim();
      }
      if (toPage && anchorText) {
        await db
          .update(seoLinks)
          .set({ active: false })
          .where(and(eq(seoLinks.fromPage, fromPage), eq(seoLinks.toPage, toPage), eq(seoLinks.anchorText, anchorText)));
      }
      break;
    }
    default:
      throw new Error(`Cannot roll back unknown experiment type: ${exp.type}`);
  }

  const [updated] = await db
    .update(seoExperiments)
    .set({ status: "rolled_back" })
    .where(eq(seoExperiments.id, id))
    .returning();

  logger.info(`[SEO:Review] Rolled back experiment ${id}: ${exp.type} on ${exp.page}`);
  return updated;
}
