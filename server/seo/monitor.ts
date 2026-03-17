// SEO Engine self-monitoring — tracks job executions and detects failures
import { db } from "../db";
import { seoEngineRuns, seoAlerts } from "../../shared/schema";
import { eq, and, gte, desc, lt } from "drizzle-orm";
import { logger } from "../lib/logger";
import { checkQuotaUsage } from "./quotas";

// Record job start
export async function recordJobStart(jobName: string): Promise<number> {
  const [run] = await db
    .insert(seoEngineRuns)
    .values({
      jobName,
      startedAt: new Date(),
      status: "running",
    })
    .returning();
  return run.id;
}

// Record job completion
export async function recordJobEnd(runId: number, success: boolean, error?: string): Promise<void> {
  const now = new Date();

  // Get start time to calculate duration
  const [run] = await db
    .select({ startedAt: seoEngineRuns.startedAt })
    .from(seoEngineRuns)
    .where(eq(seoEngineRuns.id, runId))
    .limit(1);

  const durationMs = run ? now.getTime() - run.startedAt.getTime() : 0;

  await db
    .update(seoEngineRuns)
    .set({
      finishedAt: now,
      status: success ? "success" : "failed",
      error: error || null,
      durationMs,
    })
    .where(eq(seoEngineRuns.id, runId));
}

// Check for stale/failed jobs and create alerts
export async function checkEngineHealth(): Promise<void> {
  const now = new Date();

  // Expected job intervals (in hours) — if no run in 2x interval, alert
  const jobIntervals: Record<string, number> = {
    "gsc-sync": 12,       // runs every 6h, alert if none in 12h
    "site-health": 12,    // runs every 6h
    "serp-tracking": 48,  // runs daily, alert if none in 48h
    "competitor-check": 48,
    "daily-analysis": 48,
    "execute-actions": 168, // runs 2x/week, alert if none in 7 days
    "experiment-review": 48,
    "revenue-correlation": 48,
    "alert-check": 12,
  };

  for (const [jobName, maxHours] of Object.entries(jobIntervals)) {
    const cutoff = new Date(now.getTime() - maxHours * 60 * 60 * 1000);

    const [lastRun] = await db
      .select()
      .from(seoEngineRuns)
      .where(
        and(
          eq(seoEngineRuns.jobName, jobName),
          gte(seoEngineRuns.startedAt, cutoff),
        )
      )
      .orderBy(desc(seoEngineRuns.startedAt))
      .limit(1);

    if (!lastRun) {
      // Job hasn't run within expected window
      await createEngineAlert(
        `Job "${jobName}" no ha ejecutado en ${maxHours}h`,
        "high",
      );
    } else if (lastRun.status === "failed") {
      await createEngineAlert(
        `Job "${jobName}" fallo: ${lastRun.error || "error desconocido"}`,
        "high",
      );
    }
  }

  // Check for quota exhaustion
  try {
    const quotaStatus = checkQuotaUsage();
    if (quotaStatus.tokensUsedPercent > 80) {
      await createEngineAlert(
        `Quota de tokens al ${quotaStatus.tokensUsedPercent}% (${quotaStatus.tokensUsed}/${quotaStatus.tokensLimit})`,
        "medium",
      );
    }
    if (quotaStatus.serpUsedPercent > 80) {
      await createEngineAlert(
        `Quota SERP al ${quotaStatus.serpUsedPercent}% (${quotaStatus.serpUsed}/${quotaStatus.serpLimit})`,
        "medium",
      );
    }
  } catch {
    // quotas module may not expose these — skip
  }

  // Clean old runs (keep last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  await db
    .delete(seoEngineRuns)
    .where(lt(seoEngineRuns.createdAt, thirtyDaysAgo));
}

async function createEngineAlert(message: string, severity: string): Promise<void> {
  // Check if same alert already exists in last 24h (dedupe)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [existing] = await db
    .select()
    .from(seoAlerts)
    .where(
      and(
        eq(seoAlerts.title, message),
        gte(seoAlerts.createdAt, oneDayAgo),
      )
    )
    .limit(1);

  if (existing) return; // Already alerted

  await db.insert(seoAlerts).values({
    type: "engine_health",
    severity,
    title: message,
  });

  logger.warn(`[SEO:Monitor] ${severity}: ${message}`);
}

// Get engine health status for dashboard
export async function getEngineHealthStatus(): Promise<{
  jobs: Array<{
    name: string;
    lastRun: string | null;
    lastStatus: string;
    lastDurationMs: number | null;
  }>;
  recentFailures: number;
  totalRunsToday: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get latest run per job
  const latestRuns = await db
    .select()
    .from(seoEngineRuns)
    .orderBy(desc(seoEngineRuns.startedAt))
    .limit(50);

  const jobMap = new Map<string, typeof latestRuns[0]>();
  for (const run of latestRuns) {
    if (!jobMap.has(run.jobName)) {
      jobMap.set(run.jobName, run);
    }
  }

  const jobs = Array.from(jobMap.entries()).map(([name, run]) => ({
    name,
    lastRun: run.startedAt.toISOString(),
    lastStatus: run.status,
    lastDurationMs: run.durationMs,
  }));

  // Count failures in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const failures = latestRuns.filter(
    r => r.status === "failed" && r.startedAt >= oneDayAgo
  ).length;

  // Count runs today
  const todayRuns = latestRuns.filter(r => r.startedAt >= today).length;

  return {
    jobs,
    recentFailures: failures,
    totalRunsToday: todayRuns,
  };
}
