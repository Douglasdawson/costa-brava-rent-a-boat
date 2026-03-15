import cron, { type ScheduledTask } from "node-cron";
import { logger } from "../lib/logger";
import { SEO_CONFIG, validateConfig } from "./config";

const scheduledTasks: ScheduledTask[] = [];

function registerJob(name: string, cronExpr: string, handler: () => Promise<void>): void {
  const task = cron.schedule(cronExpr, async () => {
    const start = Date.now();
    logger.info(`[SEO] Starting job: ${name}`);
    try {
      await handler();
      logger.info(`[SEO] Completed job: ${name} in ${Date.now() - start}ms`);
    } catch (error) {
      logger.error(`[SEO] Failed job: ${name}`, { error: error instanceof Error ? error.message : String(error) });
    }
  });
  scheduledTasks.push(task);
  logger.info(`[SEO] Registered job: ${name} (${cronExpr})`);
}

export function startSeoWorker(): void {
  logger.info("[SEO] Starting SEO Engine worker...");
  const configured = validateConfig();
  if (!configured) {
    logger.warn("[SEO] Running in limited mode (missing API keys)");
  }

  const { cron: schedules } = SEO_CONFIG;

  // Phase 1: Data collection
  registerJob("gsc-sync", schedules.gscSync, async () => {
    const { collectGscData } = await import("./collectors/gsc");
    await collectGscData();
  });

  registerJob("site-health", schedules.siteHealth, async () => {
    const { checkSiteHealth } = await import("./collectors/health");
    await checkSiteHealth();
  });

  // Phase 2: Intelligence (uncomment as implemented)
  // registerJob("serp-tracking", schedules.serpTracking, ...);
  // registerJob("competitor-check", schedules.competitorCheck, ...);

  // Phase 3: Brain
  // registerJob("daily-analysis", schedules.dailyAnalysis, ...);
  // registerJob("weekly-strategy", schedules.weeklyStrategy, ...);

  // Phase 4: Execution
  registerJob("execute-actions", schedules.executeActions, async () => {
    const { executeScheduledActions } = await import("./executors/runner");
    await executeScheduledActions();
  });

  // Phase 5: Feedback
  // registerJob("experiment-review", schedules.experimentReview, ...);
  // registerJob("revenue-correlation", schedules.revenueCorrelation, ...);

  // Phase 6: GEO
  // registerJob("geo-monitor", schedules.geoMonitor, ...);

  // Phase 7: Reporting
  registerJob("weekly-report", schedules.weeklyReport, async () => {
    const { generateWeeklyReport } = await import("./reports/weekly");
    await generateWeeklyReport();
  });

  registerJob("alert-check", schedules.alertCheck, async () => {
    const { checkAlerts } = await import("./alerts/engine");
    await checkAlerts();
  });

  logger.info(`[SEO] Worker started with ${scheduledTasks.length} jobs. Season mode: ${SEO_CONFIG.getSeasonMode()}`);
}

export function stopSeoWorker(): void {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks.length = 0;
  logger.info("[SEO] Worker stopped");
}
