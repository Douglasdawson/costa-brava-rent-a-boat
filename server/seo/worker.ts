import cron, { type ScheduledTask } from "node-cron";
import { logger } from "../lib/logger";
import { SEO_CONFIG, validateConfig } from "./config";
import { seedCompetitors } from "./seed";

const scheduledTasks: ScheduledTask[] = [];

function registerJob(name: string, cronExpr: string, handler: () => Promise<void>): void {
  const task = cron.schedule(cronExpr, async () => {
    const start = Date.now();
    let runId: number | null = null;
    logger.info(`[SEO] Starting job: ${name}`);
    try {
      const { recordJobStart } = await import("./monitor");
      runId = await recordJobStart(name);
    } catch {
      // monitor table may not exist yet
    }
    try {
      await handler();
      logger.info(`[SEO] Completed job: ${name} in ${Date.now() - start}ms`);
      if (runId !== null) {
        const { recordJobEnd } = await import("./monitor");
        await recordJobEnd(runId, true);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[SEO] Failed job: ${name}`, { error: errMsg });
      if (runId !== null) {
        try {
          const { recordJobEnd } = await import("./monitor");
          await recordJobEnd(runId, false, errMsg);
        } catch { /* ignore monitor errors */ }
      }
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

  // Seed competitor data on startup
  seedCompetitors().catch(err => logger.warn("[SEO] Failed to seed competitors", { error: String(err) }));

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

  // Phase 2: Intelligence
  registerJob("serp-tracking", schedules.serpTracking, async () => {
    const { trackSerps } = await import("./collectors/serp");
    await trackSerps();
  });

  registerJob("competitor-check", schedules.competitorCheck, async () => {
    const { checkCompetitors } = await import("./collectors/competitors");
    await checkCompetitors();
  });

  // Phase 3: Brain
  registerJob("daily-analysis", schedules.dailyAnalysis, async () => {
    const { runDailyAnalysis } = await import("./strategist/agent");
    await runDailyAnalysis();
  });

  registerJob("weekly-strategy", schedules.weeklyStrategy, async () => {
    const { runWeeklyStrategy } = await import("./strategist/agent");
    await runWeeklyStrategy();
  });

  // Phase 4: Execution
  registerJob("execute-actions", schedules.executeActions, async () => {
    const { executeScheduledActions } = await import("./executors/runner");
    await executeScheduledActions();
  });

  // Phase 5: Feedback
  registerJob("experiment-review", schedules.experimentReview, async () => {
    const { reviewExperiments } = await import("./feedback/experiments");
    await reviewExperiments();
  });

  registerJob("revenue-correlation", schedules.revenueCorrelation, async () => {
    const { correlateRevenue } = await import("./feedback/revenue");
    await correlateRevenue();
  });

  // Phase 6: GEO
  registerJob("geo-monitor", schedules.geoMonitor, async () => {
    const { monitorGeo } = await import("./collectors/geo");
    await monitorGeo();
  });

  // Phase 7: Reporting
  registerJob("weekly-report", schedules.weeklyReport, async () => {
    const { generateWeeklyReport } = await import("./reports/weekly");
    await generateWeeklyReport();
  });

  registerJob("sem-report", schedules.semReport, async () => {
    const { generateSemReport } = await import("./reports/sem");
    await generateSemReport();
  });

  registerJob("alert-check", schedules.alertCheck, async () => {
    const { checkAlerts } = await import("./alerts/engine");
    await checkAlerts();
  });

  // Self-monitoring: check engine health every 6 hours
  registerJob("engine-health", "0 */6 * * *", async () => {
    const { checkEngineHealth } = await import("./monitor");
    await checkEngineHealth();
  });

  // Schema validation (weekly on Wednesday at 3am)
  registerJob("schema-validation", "0 3 * * 3", async () => {
    const { validateAllSchemas } = await import("./validators/schema");
    await validateAllSchemas();
  });

  // Link rot detection (weekly on Sunday at 3am)
  registerJob("link-rot-check", "0 3 * * 0", async () => {
    const { detectLinkRot } = await import("./collectors/linkrot");
    await detectLinkRot();
  });

  // Content freshness check (weekly on Monday at 4am)
  registerJob("content-freshness", "0 4 * * 1", async () => {
    const { detectStaleContent } = await import("./executors/freshness");
    await detectStaleContent();
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
