# SEO Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an autonomous, agent-driven SEO engine that monitors rankings, analyzes competitors, executes optimizations, and learns from results — all integrated into the existing Express server.

**Architecture:** Separate worker process (`server/seo/worker.ts`) sharing the same codebase and Neon DB. Claude API as the brain (Sonnet daily, Opus weekly). Data collectors feed a knowledge base; strategist agent decides actions; executors apply changes; feedback loop measures impact.

**Tech Stack:** Node.js + tsx, node-cron, Drizzle ORM + Neon, Claude API (@anthropic-ai/sdk), ValueSERP API, Twilio (WhatsApp alerts), existing React + shadcn/ui CRM.

**Design Doc:** `docs/plans/2026-03-15-seo-engine-design.md`

---

## Phase 1: Foundation (DB Schema + Worker Skeleton)

### Task 1.1: Create SEO database schema

**Files:**
- Modify: `shared/schema.ts` (append at end)

**Step 1: Add all SEO tables to schema**

Add after the last table definition in `shared/schema.ts`:

```typescript
// ============================================================
// SEO ENGINE TABLES
// ============================================================

// Core tracking
export const seoKeywords = pgTable("seo_keywords", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  language: text("language").notNull().default("es"),
  intent: text("intent"), // transactional, informational, navigational
  cluster: text("cluster"), // keyword cluster grouping
  tracked: boolean("tracked").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  keywordLangIdx: uniqueIndex("seo_keywords_keyword_lang_idx").on(table.keyword, table.language),
}));

export const seoRankings = pgTable("seo_rankings", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").notNull(),
  date: date("date").notNull(),
  position: decimal("position", { precision: 5, scale: 2 }),
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  ctr: decimal("ctr", { precision: 5, scale: 4 }),
  page: text("page"), // which page ranks for this keyword
  device: text("device").default("all"), // mobile, desktop, all
  source: text("source").notNull().default("gsc"), // gsc, serp
}, (table) => ({
  keywordDateIdx: uniqueIndex("seo_rankings_kw_date_device_idx").on(table.keywordId, table.date, table.device, table.source),
}));

export const seoPages = pgTable("seo_pages", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().unique(),
  title: text("title"),
  description: text("description"),
  wordCount: integer("word_count"),
  lastCrawled: timestamp("last_crawled", { withTimezone: true }),
  lastModified: timestamp("last_modified", { withTimezone: true }),
  status: integer("status"), // HTTP status code
  loadTimeMs: integer("load_time_ms"),
  hasSchemaOrg: boolean("has_schema_org").default(false),
  schemaTypes: text("schema_types"), // comma-separated: Product,FAQPage,etc
  internalLinksIn: integer("internal_links_in").default(0),
  internalLinksOut: integer("internal_links_out").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const seoCompetitors = pgTable("seo_competitors", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull().default("local"), // local, platform
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const seoCompetitorRankings = pgTable("seo_competitor_rankings", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitor_id").notNull(),
  keywordId: integer("keyword_id").notNull(),
  date: date("date").notNull(),
  position: decimal("position", { precision: 5, scale: 2 }),
  url: text("url"),
}, (table) => ({
  compKwDateIdx: uniqueIndex("seo_comp_rankings_idx").on(table.competitorId, table.keywordId, table.date),
}));

export const seoSerpFeatures = pgTable("seo_serp_features", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id").notNull(),
  date: date("date").notNull(),
  features: jsonb("features").notNull(), // { faq: true, localPack: true, images: false, aiOverview: true, ... }
  ownsFaq: boolean("owns_faq").default(false),
  ownsLocalPack: boolean("owns_local_pack").default(false),
  ownsImages: boolean("owns_images").default(false),
  ownsAiOverview: boolean("owns_ai_overview").default(false),
}, (table) => ({
  kwDateIdx: uniqueIndex("seo_serp_features_idx").on(table.keywordId, table.date),
}));

// Intelligence
export const seoCampaigns = pgTable("seo_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  objective: text("objective").notNull(),
  cluster: text("cluster"), // related keyword cluster
  status: text("status").notNull().default("active"), // active, paused, completed, cancelled
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  weeklyActionBudget: integer("weekly_action_budget").default(2),
  progress: jsonb("progress"), // { week1: { planned: [...], done: [...] }, ... }
  results: jsonb("results"), // { clicksGained: 0, revenueGained: 0, positionsImproved: [] }
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const seoExperiments = pgTable("seo_experiments", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id"),
  type: text("type").notNull(), // meta_title, meta_description, content_expansion, faq_add, internal_link, new_page, schema_update
  page: text("page").notNull(), // affected page path
  hypothesis: text("hypothesis").notNull(),
  action: text("action").notNull(), // what was changed
  previousValue: text("previous_value"), // what it was before
  newValue: text("new_value"), // what it is now
  status: text("status").notNull().default("running"), // running, measuring, success, failure, inconclusive
  executedAt: timestamp("executed_at", { withTimezone: true }).notNull().default(sql`now()`),
  measureAt: timestamp("measure_at", { withTimezone: true }), // when to check results
  baselineMetrics: jsonb("baseline_metrics"), // { position: 5, ctr: 0.04, clicks: 120 }
  resultMetrics: jsonb("result_metrics"), // same structure, measured later
  learning: text("learning"), // extracted insight
  agentReasoning: text("agent_reasoning"), // why the agent chose this action
});

export const seoConversions = pgTable("seo_conversions", {
  id: serial("id").primaryKey(),
  keywordId: integer("keyword_id"),
  page: text("page").notNull(),
  bookingId: integer("booking_id"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }),
  date: date("date").notNull(),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const seoLearnings = pgTable("seo_learnings", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id"),
  category: text("category").notNull(), // titles, descriptions, content, links, schema, general
  insight: text("insight").notNull(), // "titles with price improve CTR +15%"
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  applicableTo: text("applicable_to"), // page pattern or keyword cluster
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Content-as-data
export const seoMeta = pgTable("seo_meta", {
  id: serial("id").primaryKey(),
  page: text("page").notNull(),
  language: text("language").notNull().default("es"),
  title: text("title"),
  description: text("description"),
  keywords: text("keywords"),
  updatedBy: text("updated_by").default("system"), // system or manual
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  pageLangIdx: uniqueIndex("seo_meta_page_lang_idx").on(table.page, table.language),
}));

export const seoFaqs = pgTable("seo_faqs", {
  id: serial("id").primaryKey(),
  page: text("page").notNull(),
  language: text("language").notNull().default("es"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const seoLinks = pgTable("seo_links", {
  id: serial("id").primaryKey(),
  fromPage: text("from_page").notNull(),
  toPage: text("to_page").notNull(),
  anchorText: text("anchor_text").notNull(),
  context: text("context"), // surrounding sentence
  autoGenerated: boolean("auto_generated").notNull().default(true),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  fromToIdx: uniqueIndex("seo_links_from_to_idx").on(table.fromPage, table.toPage, table.anchorText),
}));

// Monitoring
export const seoGeo = pgTable("seo_geo", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  engine: text("engine").notNull(), // perplexity, google_ai, chatgpt
  date: date("date").notNull(),
  cited: boolean("cited").notNull().default(false),
  mentionedWithoutLink: boolean("mentioned_without_link").default(false),
  citedUrl: text("cited_url"),
  position: integer("position"), // position in sources list
  competitorsCited: jsonb("competitors_cited"), // [{ domain, position }]
  analysis: text("analysis"), // AI analysis of why/why not cited
}, (table) => ({
  queryEngineDateIdx: uniqueIndex("seo_geo_idx").on(table.query, table.engine, table.date),
}));

export const seoAlerts = pgTable("seo_alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // ranking_drop, technical_error, competitor_surge, opportunity, campaign_complete
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // structured data related to alert
  status: text("status").notNull().default("new"), // new, sent, acknowledged, resolved
  sentVia: text("sent_via"), // whatsapp, dashboard, both
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const seoReports = pgTable("seo_reports", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("weekly"), // weekly, monthly, campaign
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  summary: text("summary").notNull(), // human-readable summary
  data: jsonb("data").notNull(), // full report data
  sentVia: text("sent_via"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const seoHealthChecks = pgTable("seo_health_checks", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  status: integer("status").notNull(), // HTTP status
  loadTimeMs: integer("load_time_ms"),
  hasMetaTitle: boolean("has_meta_title").default(false),
  hasMetaDescription: boolean("has_meta_description").default(false),
  hasCanonical: boolean("has_canonical").default(false),
  hasHreflang: boolean("has_hreflang").default(false),
  hasSchemaOrg: boolean("has_schema_org").default(false),
  issues: jsonb("issues"), // [{ type: "missing_meta", detail: "..." }]
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().default(sql`now()`),
});
```

**Step 2: Push schema to database**

Run: `npm run db:push`
Expected: All new `seo_*` tables created in Neon.

**Step 3: Commit**

```bash
git add shared/schema.ts
git commit -m "feat(seo-engine): add 16 SEO knowledge base tables"
```

---

### Task 1.2: Create worker process skeleton

**Files:**
- Create: `server/seo/worker.ts`
- Create: `server/seo/config.ts`
- Modify: `package.json` (add script)

**Step 1: Create SEO config**

```typescript
// server/seo/config.ts
import { logger } from "../lib/logger";

export const SEO_CONFIG = {
  // API Keys (from env)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  valueSerpApiKey: process.env.VALUESERP_API_KEY || "",
  perplexityApiKey: process.env.PERPLEXITY_API_KEY || "",

  // Competitors
  competitors: [
    { domain: "clickandboat.com", name: "Click&Boat", type: "platform" as const },
    { domain: "samboat.es", name: "SamBoat", type: "platform" as const },
    { domain: "blanesboats.com", name: "Blanes Boats", type: "local" as const },
    { domain: "ericboatsblanes.com", name: "Eric Boats", type: "local" as const },
    { domain: "rentaboatblanes.com", name: "Rent a Boat Blanes", type: "local" as const },
  ],

  // Site
  siteUrl: process.env.GSC_SITE_URL || "sc-domain:costabravarentaboat.com",
  baseUrl: process.env.BASE_URL || "https://costabravarentaboat.com",

  // Scheduling
  cron: {
    gscSync: "15 */6 * * *",           // Every 6h at :15
    serpTracking: "0 6 * * *",          // Daily 6am
    competitorCheck: "0 7 * * *",       // Daily 7am
    siteHealth: "30 */6 * * *",         // Every 6h at :30
    geoMonitor: "0 8 * * 1",           // Monday 8am
    dailyAnalysis: "0 9 * * *",         // Daily 9am (Sonnet)
    weeklyStrategy: "0 10 * * 1",       // Monday 10am (Opus)
    executeActions: "0 10 * * 2,4",     // Tue/Thu 10am
    experimentReview: "0 11 * * *",     // Daily 11am
    revenueCorrelation: "0 0 * * *",    // Midnight
    weeklyReport: "0 20 * * 0",         // Sunday 8pm
    alertCheck: "45 */6 * * *",         // Every 6h at :45
  },

  // Budgets
  maxActionsPerWeek: 3,
  maxSerpQueriesPerDay: 50,
  maxTokensPerDay: 100000,

  // Seasonality
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
```

**Step 2: Create worker entry point**

```typescript
// server/seo/worker.ts
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
  // registerJob("serp-tracking", schedules.serpTracking, async () => {
  //   const { trackSerps } = await import("./collectors/serp");
  //   await trackSerps();
  // });

  // registerJob("competitor-check", schedules.competitorCheck, async () => {
  //   const { checkCompetitors } = await import("./collectors/competitors");
  //   await checkCompetitors();
  // });

  // Phase 3: Brain
  // registerJob("daily-analysis", schedules.dailyAnalysis, async () => {
  //   const { runDailyAnalysis } = await import("./strategist/agent");
  //   await runDailyAnalysis();
  // });

  // registerJob("weekly-strategy", schedules.weeklyStrategy, async () => {
  //   const { runWeeklyStrategy } = await import("./strategist/agent");
  //   await runWeeklyStrategy();
  // });

  // Phase 4: Execution
  // registerJob("execute-actions", schedules.executeActions, async () => {
  //   const { executeScheduledActions } = await import("./executors/runner");
  //   await executeScheduledActions();
  // });

  // Phase 5: Feedback
  // registerJob("experiment-review", schedules.experimentReview, async () => {
  //   const { reviewExperiments } = await import("./feedback/experiments");
  //   await reviewExperiments();
  // });

  // registerJob("revenue-correlation", schedules.revenueCorrelation, async () => {
  //   const { correlateRevenue } = await import("./feedback/revenue");
  //   await correlateRevenue();
  // });

  // Phase 6: GEO
  // registerJob("geo-monitor", schedules.geoMonitor, async () => {
  //   const { monitorGeo } = await import("./collectors/geo");
  //   await monitorGeo();
  // });

  // Phase 7: Reporting
  // registerJob("weekly-report", schedules.weeklyReport, async () => {
  //   const { generateWeeklyReport } = await import("./reports/weekly");
  //   await generateWeeklyReport();
  // });

  // registerJob("alert-check", schedules.alertCheck, async () => {
  //   const { checkAlerts } = await import("./alerts/engine");
  //   await checkAlerts();
  // });

  logger.info(`[SEO] Worker started with ${scheduledTasks.length} jobs. Season mode: ${SEO_CONFIG.getSeasonMode()}`);
}

export function stopSeoWorker(): void {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks.length = 0;
  logger.info("[SEO] Worker stopped");
}
```

**Step 3: Add npm script and integrate with server**

In `package.json`, add to scripts:
```json
"seo:worker": "NODE_ENV=production tsx server/seo/worker.ts"
```

In `server/index.ts`, import and start the SEO worker alongside the existing scheduler:
```typescript
import { startSeoWorker, stopSeoWorker } from "./seo/worker";
```

Add `startSeoWorker()` call after the existing scheduler starts.
Add `stopSeoWorker()` to the graceful shutdown handler.

**Step 4: Commit**

```bash
git add server/seo/worker.ts server/seo/config.ts package.json server/index.ts
git commit -m "feat(seo-engine): add worker process skeleton with cron orchestrator"
```

---

### Task 1.3: Build GSC data collector

**Files:**
- Create: `server/seo/collectors/gsc.ts`

**Step 1: Implement GSC collector**

This collector enhances the existing `googleAnalyticsService.ts` by storing keyword-level data in the new `seoKeywords` and `seoRankings` tables instead of just the flat `analyticsSnapshots` JSONB.

```typescript
// server/seo/collectors/gsc.ts
import { db } from "../../db";
import { seoKeywords, seoRankings } from "../../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { isConfigured } from "../../services/googleAnalyticsService";
import { google } from "googleapis";
import { config } from "../../config";

function getAuth() {
  return new google.auth.JWT({
    email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

export async function collectGscData(): Promise<void> {
  if (!isConfigured()) {
    logger.warn("[SEO:GSC] Google API not configured, skipping");
    return;
  }

  const auth = getAuth();
  const searchconsole = google.searchconsole({ version: "v1", auth });
  const siteUrl = config.GSC_SITE_URL || "sc-domain:costabravarentaboat.com";

  // Fetch last 7 days of data (GSC has ~3 day delay)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 3);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  try {
    // Fetch keyword data with page dimensions
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ["query", "page", "date"],
        rowLimit: 1000,
        dataState: "final",
      },
    });

    const rows = response.data.rows || [];
    logger.info(`[SEO:GSC] Fetched ${rows.length} keyword-page-date rows`);

    let keywordsUpserted = 0;
    let rankingsUpserted = 0;

    for (const row of rows) {
      const [keyword, page, date] = row.keys || [];
      if (!keyword || !page || !date) continue;

      // Upsert keyword
      const [kw] = await db
        .insert(seoKeywords)
        .values({ keyword, language: "es" })
        .onConflictDoUpdate({
          target: [seoKeywords.keyword, seoKeywords.language],
          set: { tracked: true },
        })
        .returning({ id: seoKeywords.id });

      keywordsUpserted++;

      // Strip domain from page URL to get path
      const pagePath = page.replace(/^https?:\/\/[^/]+/, "") || "/";

      // Upsert ranking
      await db
        .insert(seoRankings)
        .values({
          keywordId: kw.id,
          date,
          position: String(row.position || 0),
          clicks: Math.round(row.clicks || 0),
          impressions: Math.round(row.impressions || 0),
          ctr: String(row.ctr || 0),
          page: pagePath,
          device: "all",
          source: "gsc",
        })
        .onConflictDoUpdate({
          target: [seoRankings.keywordId, seoRankings.date, seoRankings.device, seoRankings.source],
          set: {
            position: String(row.position || 0),
            clicks: Math.round(row.clicks || 0),
            impressions: Math.round(row.impressions || 0),
            ctr: String(row.ctr || 0),
            page: pagePath,
          },
        });

      rankingsUpserted++;
    }

    logger.info(`[SEO:GSC] Synced ${keywordsUpserted} keywords, ${rankingsUpserted} rankings`);
  } catch (error) {
    logger.error("[SEO:GSC] Failed to collect data", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

**Step 2: Commit**

```bash
git add server/seo/collectors/gsc.ts
git commit -m "feat(seo-engine): add GSC data collector for keyword rankings"
```

---

### Task 1.4: Build site health crawler

**Files:**
- Create: `server/seo/collectors/health.ts`

**Step 1: Implement health checker**

```typescript
// server/seo/collectors/health.ts
import { db } from "../../db";
import { seoHealthChecks, seoPages, seoAlerts } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";

interface HealthResult {
  url: string;
  status: number;
  loadTimeMs: number;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  hasCanonical: boolean;
  hasHreflang: boolean;
  hasSchemaOrg: boolean;
  issues: Array<{ type: string; detail: string }>;
}

async function crawlUrl(url: string): Promise<HealthResult> {
  const start = Date.now();
  const issues: Array<{ type: string; detail: string }> = [];

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "SEOEngine-HealthCheck/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    const loadTimeMs = Date.now() - start;
    const html = await response.text();

    const hasMetaTitle = /<title[^>]*>.+<\/title>/i.test(html);
    const hasMetaDescription = /<meta[^>]*name=["']description["'][^>]*>/i.test(html);
    const hasCanonical = /<link[^>]*rel=["']canonical["'][^>]*>/i.test(html);
    const hasHreflang = /<link[^>]*hreflang=/i.test(html);
    const hasSchemaOrg = /application\/ld\+json/i.test(html);

    if (!hasMetaTitle) issues.push({ type: "missing_title", detail: "No <title> tag found" });
    if (!hasMetaDescription) issues.push({ type: "missing_meta_description", detail: "No meta description found" });
    if (!hasCanonical) issues.push({ type: "missing_canonical", detail: "No canonical link found" });
    if (response.status >= 400) issues.push({ type: "http_error", detail: `HTTP ${response.status}` });
    if (loadTimeMs > 3000) issues.push({ type: "slow_response", detail: `${loadTimeMs}ms (>3s)` });

    return {
      url,
      status: response.status,
      loadTimeMs,
      hasMetaTitle,
      hasMetaDescription,
      hasCanonical,
      hasHreflang,
      hasSchemaOrg,
      issues,
    };
  } catch (error) {
    return {
      url,
      status: 0,
      loadTimeMs: Date.now() - start,
      hasMetaTitle: false,
      hasMetaDescription: false,
      hasCanonical: false,
      hasHreflang: false,
      hasSchemaOrg: false,
      issues: [{ type: "fetch_error", detail: error instanceof Error ? error.message : String(error) }],
    };
  }
}

// Critical pages to always check
const CRITICAL_PAGES = [
  "/",
  "/reservar",
  "/flota",
  "/precios",
  "/faq",
  "/contacto",
  "/galeria",
  "/rutas",
  "/tarjetas-regalo",
  "/testimonios",
  "/blog",
  "/blanes",
  "/lloret-de-mar",
  "/tossa-de-mar",
  "/barcelona",
  "/alquiler-barcos-costa-brava",
];

export async function checkSiteHealth(): Promise<void> {
  const baseUrl = SEO_CONFIG.baseUrl;
  logger.info(`[SEO:Health] Starting health check for ${CRITICAL_PAGES.length} pages`);

  let totalIssues = 0;
  let criticalIssues = 0;

  for (const path of CRITICAL_PAGES) {
    const url = `${baseUrl}${path}`;
    const result = await crawlUrl(url);

    // Store health check
    await db.insert(seoHealthChecks).values({
      url: path,
      status: result.status,
      loadTimeMs: result.loadTimeMs,
      hasMetaTitle: result.hasMetaTitle,
      hasMetaDescription: result.hasMetaDescription,
      hasCanonical: result.hasCanonical,
      hasHreflang: result.hasHreflang,
      hasSchemaOrg: result.hasSchemaOrg,
      issues: result.issues,
    });

    // Update seoPages table
    await db
      .insert(seoPages)
      .values({
        path,
        status: result.status,
        loadTimeMs: result.loadTimeMs,
        hasSchemaOrg: result.hasSchemaOrg,
        lastCrawled: new Date(),
      })
      .onConflictDoUpdate({
        target: seoPages.path,
        set: {
          status: result.status,
          loadTimeMs: result.loadTimeMs,
          hasSchemaOrg: result.hasSchemaOrg,
          lastCrawled: new Date(),
        },
      });

    // Generate alerts for critical issues
    if (result.status === 0 || result.status >= 500) {
      criticalIssues++;
      await db.insert(seoAlerts).values({
        type: "technical_error",
        severity: "critical",
        title: `Page down: ${path}`,
        message: `${path} returned HTTP ${result.status}. Issues: ${result.issues.map(i => i.detail).join(", ")}`,
        data: result,
        status: "new",
      });
    }

    totalIssues += result.issues.length;

    // Small delay between requests to avoid self-DoS
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  logger.info(`[SEO:Health] Check complete. ${totalIssues} issues found, ${criticalIssues} critical`);
}
```

**Step 2: Commit**

```bash
git add server/seo/collectors/health.ts
git commit -m "feat(seo-engine): add site health crawler with alerting"
```

---

### Task 1.5: Seed competitors in database

**Files:**
- Create: `server/seo/seed.ts`

**Step 1: Create seed script**

```typescript
// server/seo/seed.ts
import { db } from "../db";
import { seoCompetitors } from "../../shared/schema";
import { SEO_CONFIG } from "./config";
import { logger } from "../lib/logger";

export async function seedCompetitors(): Promise<void> {
  for (const comp of SEO_CONFIG.competitors) {
    await db
      .insert(seoCompetitors)
      .values({
        domain: comp.domain,
        name: comp.name,
        type: comp.type,
      })
      .onConflictDoUpdate({
        target: seoCompetitors.domain,
        set: { name: comp.name, type: comp.type, active: true },
      });
  }
  logger.info(`[SEO] Seeded ${SEO_CONFIG.competitors.length} competitors`);
}
```

Add a call to `seedCompetitors()` at the start of `startSeoWorker()` in `worker.ts`.

**Step 2: Commit**

```bash
git add server/seo/seed.ts server/seo/worker.ts
git commit -m "feat(seo-engine): add competitor seeding"
```

---

## Phase 2: Intelligence (SERP Tracking + Competitors)

### Task 2.1: Integrate ValueSERP API for keyword tracking

**Files:**
- Create: `server/seo/collectors/serp.ts`

**Step 1: Implement SERP tracker**

Uses ValueSERP API to track keyword positions for both our site and competitors, plus detect SERP features.

```typescript
// server/seo/collectors/serp.ts
import { db } from "../../db";
import { seoKeywords, seoRankings, seoSerpFeatures, seoCompetitorRankings, seoCompetitors } from "../../../shared/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";

interface ValueSerpResult {
  search_parameters: { q: string };
  organic_results: Array<{
    position: number;
    link: string;
    domain: string;
    title: string;
    snippet: string;
  }>;
  related_questions?: Array<{ question: string }>;
  knowledge_graph?: Record<string, unknown>;
  local_results?: Array<Record<string, unknown>>;
  inline_images?: Array<Record<string, unknown>>;
  ai_overview?: Record<string, unknown>;
}

async function queryValueSerp(keyword: string, location: string = "Girona,Catalonia,Spain"): Promise<ValueSerpResult | null> {
  const apiKey = SEO_CONFIG.valueSerpApiKey;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    api_key: apiKey,
    q: keyword,
    location,
    gl: "es",
    hl: "es",
    num: "20",
    include_ai_overview: "true",
  });

  try {
    const response = await fetch(`https://api.valueserp.com/search?${params}`);
    if (!response.ok) {
      logger.error(`[SEO:SERP] ValueSERP API error: ${response.status}`);
      return null;
    }
    return await response.json() as ValueSerpResult;
  } catch (error) {
    logger.error("[SEO:SERP] ValueSERP request failed", { error: String(error) });
    return null;
  }
}

export async function trackSerps(): Promise<void> {
  // Get tracked keywords, prioritized by impressions
  const keywords = await db
    .select({
      id: seoKeywords.id,
      keyword: seoKeywords.keyword,
    })
    .from(seoKeywords)
    .where(eq(seoKeywords.tracked, true))
    .limit(SEO_CONFIG.maxSerpQueriesPerDay);

  const competitors = await db
    .select()
    .from(seoCompetitors)
    .where(eq(seoCompetitors.active, true));

  const competitorDomains = new Set(competitors.map(c => c.domain));
  const today = new Date().toISOString().split("T")[0];

  logger.info(`[SEO:SERP] Tracking ${keywords.length} keywords`);

  let tracked = 0;
  for (const kw of keywords) {
    const result = await queryValueSerp(kw.keyword);
    if (!result) continue;

    const organicResults = result.organic_results || [];

    // Find our position
    const ourResult = organicResults.find(r =>
      r.domain?.includes("costabravarentaboat")
    );

    if (ourResult) {
      await db
        .insert(seoRankings)
        .values({
          keywordId: kw.id,
          date: today,
          position: String(ourResult.position),
          page: new URL(ourResult.link).pathname,
          device: "all",
          source: "serp",
        })
        .onConflictDoUpdate({
          target: [seoRankings.keywordId, seoRankings.date, seoRankings.device, seoRankings.source],
          set: {
            position: String(ourResult.position),
            page: new URL(ourResult.link).pathname,
          },
        });
    }

    // Track competitor positions
    for (const organic of organicResults) {
      const compDomain = competitors.find(c => organic.domain?.includes(c.domain));
      if (compDomain) {
        await db
          .insert(seoCompetitorRankings)
          .values({
            competitorId: compDomain.id,
            keywordId: kw.id,
            date: today,
            position: String(organic.position),
            url: organic.link,
          })
          .onConflictDoUpdate({
            target: [seoCompetitorRankings.competitorId, seoCompetitorRankings.keywordId, seoCompetitorRankings.date],
            set: {
              position: String(organic.position),
              url: organic.link,
            },
          });
      }
    }

    // Track SERP features
    const features = {
      faq: !!result.related_questions?.length,
      localPack: !!result.local_results?.length,
      images: !!result.inline_images?.length,
      knowledgeGraph: !!result.knowledge_graph,
      aiOverview: !!result.ai_overview,
    };

    const ownsLocalPack = result.local_results?.some((lr: Record<string, unknown>) =>
      String(lr.title || "").toLowerCase().includes("costa brava rent")
    ) || false;

    await db
      .insert(seoSerpFeatures)
      .values({
        keywordId: kw.id,
        date: today,
        features,
        ownsFaq: false, // TODO: detect if our FAQ appears
        ownsLocalPack,
        ownsImages: false, // TODO: detect if our images appear
        ownsAiOverview: false,
      })
      .onConflictDoUpdate({
        target: [seoSerpFeatures.keywordId, seoSerpFeatures.date],
        set: { features, ownsLocalPack },
      });

    tracked++;

    // Rate limiting: 1 request per 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  logger.info(`[SEO:SERP] Tracked ${tracked} keywords via ValueSERP`);
}
```

**Step 2: Uncomment SERP job in worker.ts**

Uncomment the `serp-tracking` and `competitor-check` registerJob blocks.

**Step 3: Add VALUESERP_API_KEY to .env.example**

**Step 4: Commit**

```bash
git add server/seo/collectors/serp.ts server/seo/worker.ts
git commit -m "feat(seo-engine): add ValueSERP integration for SERP tracking"
```

---

### Task 2.2: Build competitor content crawler

**Files:**
- Create: `server/seo/collectors/competitors.ts`

**Step 1: Implement competitor content analysis**

```typescript
// server/seo/collectors/competitors.ts
import { db } from "../../db";
import { seoCompetitors, seoAlerts } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

interface CompetitorSnapshot {
  domain: string;
  title: string;
  description: string;
  wordCount: number;
  hasSchemaOrg: boolean;
  schemaTypes: string[];
  h1: string;
  h2s: string[];
}

async function crawlCompetitorPage(url: string): Promise<CompetitorSnapshot | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOEngine/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;
    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const h2Matches = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map(m => m[1]);

    // Strip HTML tags and count words
    const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const wordCount = textContent.split(" ").length;

    const schemaMatches = [...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map(m => m[1]);

    return {
      domain: new URL(url).hostname,
      title: titleMatch?.[1] || "",
      description: descMatch?.[1] || "",
      wordCount,
      hasSchemaOrg: schemaMatches.length > 0,
      schemaTypes: [...new Set(schemaMatches)],
      h1: h1Match?.[1] || "",
      h2s: h2Matches.slice(0, 10),
    };
  } catch (error) {
    logger.warn(`[SEO:Competitors] Failed to crawl ${url}: ${error}`);
    return null;
  }
}

export async function checkCompetitors(): Promise<void> {
  const competitors = await db
    .select()
    .from(seoCompetitors)
    .where(eq(seoCompetitors.active, true));

  logger.info(`[SEO:Competitors] Checking ${competitors.length} competitors`);

  for (const comp of competitors) {
    const snapshot = await crawlCompetitorPage(`https://${comp.domain}`);
    if (snapshot) {
      logger.info(`[SEO:Competitors] ${comp.name}: ${snapshot.wordCount} words, schemas: ${snapshot.schemaTypes.join(",")}`);
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  logger.info("[SEO:Competitors] Check complete");
}
```

**Step 2: Commit**

```bash
git add server/seo/collectors/competitors.ts
git commit -m "feat(seo-engine): add competitor content crawler"
```

---

## Phase 3: The Brain (Strategist Agent)

### Task 3.1: Build briefing assembler

**Files:**
- Create: `server/seo/strategist/briefing.ts`

**Step 1: Implement briefing builder**

Assembles all context from the knowledge base into a structured briefing for the Claude API.

```typescript
// server/seo/strategist/briefing.ts
import { db } from "../../db";
import {
  seoKeywords, seoRankings, seoCompetitors, seoCompetitorRankings,
  seoSerpFeatures, seoCampaigns, seoExperiments, seoLearnings,
  seoConversions, seoPages, seoGeo, seoAlerts, bookings,
} from "../../../shared/schema";
import { eq, desc, gte, and, sql, count } from "drizzle-orm";
import { SEO_CONFIG } from "../config";

export interface SeoBriefing {
  timestamp: string;
  seasonMode: string;
  maxActionsThisWeek: number;

  // Keyword landscape
  topKeywords: Array<{
    keyword: string;
    position: number;
    clicks: number;
    impressions: number;
    ctr: number;
    page: string;
    trend: string; // "up", "down", "stable"
    cluster: string | null;
    intent: string | null;
  }>;

  // Opportunities
  almostThere: Array<{ keyword: string; position: number; impressions: number; page: string }>;
  doorway: Array<{ keyword: string; position: number; impressions: number }>;
  losing: Array<{ keyword: string; positionChange: number; currentPosition: number }>;

  // Competitors
  competitorComparison: Array<{
    competitor: string;
    type: string;
    keywordsTheyBeatUs: Array<{ keyword: string; theirPosition: number; ourPosition: number }>;
  }>;

  // SERP features
  serpFeatureOpportunities: Array<{
    keyword: string;
    features: Record<string, boolean>;
    weOwn: string[];
    weMiss: string[];
  }>;

  // Active campaigns
  campaigns: Array<{
    name: string;
    objective: string;
    status: string;
    progress: unknown;
  }>;

  // Experiments
  runningExperiments: Array<{
    id: number;
    type: string;
    page: string;
    hypothesis: string;
    status: string;
    executedAt: string;
  }>;

  recentResults: Array<{
    type: string;
    page: string;
    hypothesis: string;
    result: string;
    learning: string | null;
  }>;

  // Learnings
  learnings: Array<{
    category: string;
    insight: string;
    confidence: number;
  }>;

  // Revenue data
  topRevenueKeywords: Array<{
    keyword: string;
    revenue: number;
    bookings: number;
  }>;

  // Technical health
  pagesWithIssues: Array<{
    path: string;
    issues: string[];
  }>;

  // GEO status
  geoStatus: Array<{
    query: string;
    engine: string;
    cited: boolean;
  }>;
}

export async function buildBriefing(): Promise<SeoBriefing> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dateStr = (d: Date) => d.toISOString().split("T")[0];

  // Fetch top keywords with latest rankings
  const topKeywordsRaw = await db
    .select({
      id: seoKeywords.id,
      keyword: seoKeywords.keyword,
      cluster: seoKeywords.cluster,
      intent: seoKeywords.intent,
      position: seoRankings.position,
      clicks: seoRankings.clicks,
      impressions: seoRankings.impressions,
      ctr: seoRankings.ctr,
      page: seoRankings.page,
      date: seoRankings.date,
    })
    .from(seoKeywords)
    .innerJoin(seoRankings, eq(seoKeywords.id, seoRankings.keywordId))
    .where(gte(seoRankings.date, dateStr(sevenDaysAgo)))
    .orderBy(desc(seoRankings.impressions))
    .limit(100);

  // Group by keyword, get latest
  const keywordMap = new Map<string, typeof topKeywordsRaw[0]>();
  for (const row of topKeywordsRaw) {
    const existing = keywordMap.get(row.keyword);
    if (!existing || row.date > existing.date) {
      keywordMap.set(row.keyword, row);
    }
  }

  const topKeywords = [...keywordMap.values()].map(row => ({
    keyword: row.keyword,
    position: Number(row.position || 0),
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: Number(row.ctr || 0),
    page: row.page || "",
    trend: "stable" as string,
    cluster: row.cluster,
    intent: row.intent,
  }));

  // Classify opportunities
  const almostThere = topKeywords.filter(k => k.position >= 4 && k.position <= 10 && k.impressions > 50);
  const doorway = topKeywords.filter(k => k.position >= 11 && k.position <= 20 && k.impressions > 100);

  // Active campaigns
  const campaigns = await db
    .select()
    .from(seoCampaigns)
    .where(eq(seoCampaigns.status, "active"));

  // Running experiments
  const runningExperiments = await db
    .select()
    .from(seoExperiments)
    .where(eq(seoExperiments.status, "running"))
    .orderBy(desc(seoExperiments.executedAt))
    .limit(10);

  // Recent completed experiments
  const recentResults = await db
    .select()
    .from(seoExperiments)
    .where(
      and(
        eq(seoExperiments.status, "success"),
        gte(seoExperiments.executedAt, thirtyDaysAgo),
      )
    )
    .orderBy(desc(seoExperiments.executedAt))
    .limit(10);

  // Learnings
  const learnings = await db
    .select()
    .from(seoLearnings)
    .orderBy(desc(seoLearnings.confidence))
    .limit(20);

  // Competitor data
  const competitors = await db
    .select()
    .from(seoCompetitors)
    .where(eq(seoCompetitors.active, true));

  // Pages with issues
  const pagesRaw = await db
    .select()
    .from(seoPages)
    .where(sql`${seoPages.status} >= 400 OR ${seoPages.loadTimeMs} > 3000`);

  // GEO status (latest per query+engine)
  const geoRaw = await db
    .select()
    .from(seoGeo)
    .orderBy(desc(seoGeo.date))
    .limit(20);

  return {
    timestamp: now.toISOString(),
    seasonMode: SEO_CONFIG.getSeasonMode(),
    maxActionsThisWeek: SEO_CONFIG.getMaxActionsPerWeek(),

    topKeywords,
    almostThere,
    doorway,
    losing: [], // TODO: calculate from ranking trend

    competitorComparison: competitors.map(c => ({
      competitor: c.name,
      type: c.type,
      keywordsTheyBeatUs: [],
    })),

    serpFeatureOpportunities: [],

    campaigns: campaigns.map(c => ({
      name: c.name,
      objective: c.objective,
      status: c.status,
      progress: c.progress,
    })),

    runningExperiments: runningExperiments.map(e => ({
      id: e.id,
      type: e.type,
      page: e.page,
      hypothesis: e.hypothesis,
      status: e.status,
      executedAt: e.executedAt.toISOString(),
    })),

    recentResults: recentResults.map(e => ({
      type: e.type,
      page: e.page,
      hypothesis: e.hypothesis,
      result: e.status,
      learning: e.learning,
    })),

    learnings: learnings.map(l => ({
      category: l.category,
      insight: l.insight,
      confidence: Number(l.confidence || 0),
    })),

    topRevenueKeywords: [],

    pagesWithIssues: pagesRaw.map(p => ({
      path: p.path,
      issues: [`status: ${p.status}`, `loadTime: ${p.loadTimeMs}ms`],
    })),

    geoStatus: geoRaw.map(g => ({
      query: g.query,
      engine: g.engine,
      cited: g.cited,
    })),
  };
}
```

**Step 2: Commit**

```bash
git add server/seo/strategist/briefing.ts
git commit -m "feat(seo-engine): add briefing assembler for strategist agent"
```

---

### Task 3.2: Build strategist agent (Claude API)

**Files:**
- Create: `server/seo/strategist/agent.ts`
- Create: `server/seo/strategist/parser.ts`

**Step 1: Implement strategist agent**

```typescript
// server/seo/strategist/agent.ts
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";
import { buildBriefing, type SeoBriefing } from "./briefing";
import { parseStrategyDecisions, type StrategyDecisions } from "./parser";
import { db } from "../../db";
import { seoCampaigns, seoExperiments } from "../../../shared/schema";

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
```

**Step 2: Implement decision parser**

```typescript
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
```

**Step 3: Uncomment brain jobs in worker.ts**

**Step 4: Commit**

```bash
git add server/seo/strategist/agent.ts server/seo/strategist/parser.ts server/seo/worker.ts
git commit -m "feat(seo-engine): add Claude-powered strategist agent with briefing system"
```

---

### Task 3.3: Build action executor runner

**Files:**
- Create: `server/seo/executors/runner.ts`
- Create: `server/seo/executors/meta.ts`

**Step 1: Create executor runner (orchestrates all executors)**

```typescript
// server/seo/executors/runner.ts
import { db } from "../../db";
import { seoExperiments, seoCampaigns } from "../../../shared/schema";
import { eq, and, lte } from "drizzle-orm";
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

      // Record experiment
      const measureAt = new Date();
      measureAt.setDate(measureAt.getDate() + 14); // Measure in 2 weeks

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
```

**Step 2: Create meta tag executor**

```typescript
// server/seo/executors/meta.ts
import { db } from "../../db";
import { seoMeta } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../../lib/logger";

export async function updateMeta(action: {
  page: string;
  details: string;
  hypothesis: string;
  campaignId: number | null;
}): Promise<{ previousValue: string; newValue: string }> {
  // Parse details - expected format: "title: New Title Here" or "description: New description here"
  const [field, ...valueParts] = action.details.split(": ");
  const newValue = valueParts.join(": ").trim();
  const fieldName = field.trim().toLowerCase();

  if (!["title", "description"].includes(fieldName)) {
    throw new Error(`Invalid meta field: ${fieldName}`);
  }

  // Get current value
  const [existing] = await db
    .select()
    .from(seoMeta)
    .where(and(eq(seoMeta.page, action.page), eq(seoMeta.language, "es")))
    .limit(1);

  const previousValue = existing
    ? (fieldName === "title" ? existing.title : existing.description) || ""
    : "";

  // Upsert new value
  const updateData = fieldName === "title"
    ? { title: newValue }
    : { description: newValue };

  await db
    .insert(seoMeta)
    .values({
      page: action.page,
      language: "es",
      ...updateData,
      updatedBy: "system",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [seoMeta.page, seoMeta.language],
      set: { ...updateData, updatedBy: "system", updatedAt: new Date() },
    });

  logger.info(`[SEO:Meta] Updated ${fieldName} for ${action.page}`);

  return { previousValue, newValue };
}
```

**Step 3: Uncomment executor job in worker.ts**

**Step 4: Commit**

```bash
git add server/seo/executors/runner.ts server/seo/executors/meta.ts server/seo/worker.ts
git commit -m "feat(seo-engine): add action executor with meta tag updater"
```

---

## Phase 4: Content-as-Data Migration

### Task 4.1: Integrate seoMeta with seoInjector

**Files:**
- Modify: `server/seoInjector.ts`

**Step 1: Add DB-first meta tag resolution**

In `seoInjector.ts`, before the hardcoded meta tag injection, check `seoMeta` table first. If a DB entry exists for the current page+language, use it. Otherwise fall back to the existing hardcoded values.

```typescript
// Add to seoInjector.ts imports
import { db } from "./db";
import { seoMeta } from "../shared/schema";
import { eq, and } from "drizzle-orm";

// Add function
async function getDbMeta(path: string, lang: string): Promise<{ title?: string; description?: string } | null> {
  try {
    const [meta] = await db
      .select()
      .from(seoMeta)
      .where(and(eq(seoMeta.page, path), eq(seoMeta.language, lang)))
      .limit(1);
    return meta ? { title: meta.title || undefined, description: meta.description || undefined } : null;
  } catch {
    return null; // Fallback to hardcoded if DB fails
  }
}
```

Then in the injection function, before setting title/description from the hardcoded config, call `getDbMeta()` and prefer its values if they exist.

**Step 2: Commit**

```bash
git add server/seoInjector.ts
git commit -m "feat(seo-engine): integrate seoMeta DB table with seoInjector"
```

---

## Phase 5: Feedback & Learning

### Task 5.1: Build experiment tracker

**Files:**
- Create: `server/seo/feedback/experiments.ts`

**Step 1: Implement experiment outcome measurement**

```typescript
// server/seo/feedback/experiments.ts
import { db } from "../../db";
import { seoExperiments, seoRankings, seoKeywords, seoLearnings } from "../../../shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { logger } from "../../lib/logger";

export async function reviewExperiments(): Promise<void> {
  const now = new Date();

  // Find experiments that are ready to measure
  const readyExperiments = await db
    .select()
    .from(seoExperiments)
    .where(
      and(
        eq(seoExperiments.status, "running"),
        lte(seoExperiments.measureAt, now),
      )
    );

  logger.info(`[SEO:Experiments] Reviewing ${readyExperiments.length} experiments`);

  for (const exp of readyExperiments) {
    // Get current metrics for the affected page
    const currentRankings = await db
      .select({
        position: seoRankings.position,
        clicks: seoRankings.clicks,
        impressions: seoRankings.impressions,
        ctr: seoRankings.ctr,
      })
      .from(seoRankings)
      .innerJoin(seoKeywords, eq(seoRankings.keywordId, seoKeywords.id))
      .where(
        and(
          eq(seoRankings.page, exp.page),
          gte(seoRankings.date, now.toISOString().split("T")[0]),
        )
      )
      .orderBy(desc(seoRankings.date))
      .limit(5);

    const baseline = exp.baselineMetrics as Record<string, number> | null;
    const currentAvg = currentRankings.reduce(
      (acc, r) => ({
        position: acc.position + Number(r.position || 0),
        clicks: acc.clicks + (r.clicks || 0),
        ctr: acc.ctr + Number(r.ctr || 0),
      }),
      { position: 0, clicks: 0, ctr: 0 }
    );

    if (currentRankings.length > 0) {
      currentAvg.position /= currentRankings.length;
      currentAvg.clicks /= currentRankings.length;
      currentAvg.ctr /= currentRankings.length;
    }

    // Determine success/failure
    const positionImproved = baseline ? currentAvg.position < (baseline.position || 100) : false;
    const ctrImproved = baseline ? currentAvg.ctr > (baseline.ctr || 0) : false;
    const status = (positionImproved || ctrImproved) ? "success" : "inconclusive";

    const learning = status === "success"
      ? `${exp.type} on ${exp.page}: hypothesis confirmed. Position ${baseline?.position || "?"} → ${currentAvg.position.toFixed(1)}, CTR ${((baseline?.ctr || 0) * 100).toFixed(1)}% → ${(currentAvg.ctr * 100).toFixed(1)}%`
      : null;

    // Update experiment
    await db
      .update(seoExperiments)
      .set({
        status,
        resultMetrics: currentAvg,
        learning,
      })
      .where(eq(seoExperiments.id, exp.id));

    // Store learning if successful
    if (learning) {
      await db.insert(seoLearnings).values({
        experimentId: exp.id,
        category: exp.type,
        insight: learning,
        confidence: "0.70",
        applicableTo: exp.page,
      });
    }

    logger.info(`[SEO:Experiments] Experiment #${exp.id}: ${status}`);
  }
}
```

**Step 2: Commit**

```bash
git add server/seo/feedback/experiments.ts
git commit -m "feat(seo-engine): add experiment outcome tracker with learning extraction"
```

---

### Task 5.2: Build revenue correlator

**Files:**
- Create: `server/seo/feedback/revenue.ts`

**Step 1: Implement keyword-to-booking correlation**

```typescript
// server/seo/feedback/revenue.ts
import { db } from "../../db";
import { seoConversions, seoKeywords, seoRankings, bookings, pageVisits } from "../../../shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";

export async function correlateRevenue(): Promise<void> {
  // Find bookings from last 24h
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const recentBookings = await db
    .select()
    .from(bookings)
    .where(gte(bookings.createdAt, yesterday));

  logger.info(`[SEO:Revenue] Correlating ${recentBookings.length} recent bookings`);

  let correlated = 0;
  for (const booking of recentBookings) {
    // Find page visit that led to this booking (within same session/timeframe)
    // Match by: same date, organic referrer containing a search keyword
    const visits = await db
      .select()
      .from(pageVisits)
      .where(
        and(
          gte(pageVisits.visitedAt, yesterday),
          sql`${pageVisits.referrer} LIKE '%google%' OR ${pageVisits.referrer} LIKE '%bing%'`,
        )
      )
      .orderBy(desc(pageVisits.visitedAt))
      .limit(5);

    if (visits.length > 0) {
      const visit = visits[0];
      // Try to match to a tracked keyword based on the landing page
      const matchingRanking = await db
        .select({ keywordId: seoRankings.keywordId })
        .from(seoRankings)
        .where(eq(seoRankings.page, visit.pagePath))
        .orderBy(desc(seoRankings.date))
        .limit(1);

      if (matchingRanking.length > 0) {
        await db.insert(seoConversions).values({
          keywordId: matchingRanking[0].keywordId,
          page: visit.pagePath,
          bookingId: booking.id,
          revenue: String(booking.totalPrice || 0),
          date: new Date().toISOString().split("T")[0],
        });
        correlated++;
      }
    }
  }

  logger.info(`[SEO:Revenue] Correlated ${correlated} bookings to keywords`);
}
```

**Step 2: Commit**

```bash
git add server/seo/feedback/revenue.ts
git commit -m "feat(seo-engine): add revenue-to-keyword correlation"
```

---

## Phase 6: GEO Monitor

### Task 6.1: Build AI citation monitor

**Files:**
- Create: `server/seo/collectors/geo.ts`

**Step 1: Implement Perplexity API monitoring**

```typescript
// server/seo/collectors/geo.ts
import { db } from "../../db";
import { seoGeo, seoKeywords } from "../../../shared/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";

const GEO_QUERIES = [
  "dónde alquilar un barco en la Costa Brava",
  "alquiler barco sin licencia Blanes",
  "boat rental Costa Brava",
  "alquilar barco Lloret de Mar",
  "rent a boat Blanes Spain",
  "excursión en barco Costa Brava precios",
  "best boat rental Costa Brava",
  "alquiler embarcación Blanes precio",
];

async function queryPerplexity(query: string): Promise<{
  cited: boolean;
  mentionedWithoutLink: boolean;
  citedUrl: string | null;
  position: number | null;
  competitorsCited: Array<{ domain: string; position: number }>;
  analysis: string;
} | null> {
  const apiKey = SEO_CONFIG.perplexityApiKey;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: query }],
        return_citations: true,
      }),
    });

    if (!response.ok) {
      logger.warn(`[SEO:GEO] Perplexity API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      citations?: string[];
    };

    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    const ourDomain = "costabravarentaboat";
    const cited = citations.some((c: string) => c.includes(ourDomain));
    const mentionedWithoutLink = !cited && content.toLowerCase().includes("costa brava rent");
    const citedUrl = citations.find((c: string) => c.includes(ourDomain)) || null;
    const position = citedUrl ? citations.indexOf(citedUrl) + 1 : null;

    // Check which competitors are cited
    const competitorsCited = SEO_CONFIG.competitors
      .map(comp => {
        const compCitation = citations.find((c: string) => c.includes(comp.domain));
        return compCitation
          ? { domain: comp.domain, position: citations.indexOf(compCitation) + 1 }
          : null;
      })
      .filter((c): c is { domain: string; position: number } => c !== null);

    return {
      cited,
      mentionedWithoutLink,
      citedUrl,
      position,
      competitorsCited,
      analysis: `Query: "${query}". ${cited ? `Cited at position ${position}` : "Not cited"}. ${competitorsCited.length} competitors cited.`,
    };
  } catch (error) {
    logger.error("[SEO:GEO] Perplexity query failed", { error: String(error) });
    return null;
  }
}

export async function monitorGeo(): Promise<void> {
  logger.info(`[SEO:GEO] Monitoring ${GEO_QUERIES.length} queries across AI engines`);

  const today = new Date().toISOString().split("T")[0];

  for (const query of GEO_QUERIES) {
    const result = await queryPerplexity(query);
    if (!result) continue;

    await db
      .insert(seoGeo)
      .values({
        query,
        engine: "perplexity",
        date: today,
        cited: result.cited,
        mentionedWithoutLink: result.mentionedWithoutLink,
        citedUrl: result.citedUrl,
        position: result.position,
        competitorsCited: result.competitorsCited,
        analysis: result.analysis,
      })
      .onConflictDoUpdate({
        target: [seoGeo.query, seoGeo.engine, seoGeo.date],
        set: {
          cited: result.cited,
          mentionedWithoutLink: result.mentionedWithoutLink,
          citedUrl: result.citedUrl,
          position: result.position,
          competitorsCited: result.competitorsCited,
          analysis: result.analysis,
        },
      });

    logger.info(`[SEO:GEO] "${query}" on Perplexity: ${result.cited ? "CITED" : "not cited"}`);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  logger.info("[SEO:GEO] Monitoring complete");
}
```

**Step 2: Uncomment GEO job in worker.ts, add PERPLEXITY_API_KEY to .env.example**

**Step 3: Commit**

```bash
git add server/seo/collectors/geo.ts server/seo/worker.ts
git commit -m "feat(seo-engine): add GEO monitor with Perplexity API integration"
```

---

## Phase 7: Alerts, Reports & MCP Server

### Task 7.1: Build WhatsApp alert system

**Files:**
- Create: `server/seo/alerts/engine.ts`
- Create: `server/seo/alerts/whatsapp.ts`

**Step 1: Implement alert engine**

```typescript
// server/seo/alerts/engine.ts
import { db } from "../../db";
import { seoAlerts, seoRankings, seoKeywords } from "../../../shared/schema";
import { eq, and, gte, desc, lt } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { sendSeoAlert } from "./whatsapp";

export async function checkAlerts(): Promise<void> {
  logger.info("[SEO:Alerts] Checking for anomalies...");

  // Check for significant ranking drops (>5 positions in 7 days)
  // This is a simplified version - the strategist agent handles complex analysis
  const newAlerts = await db
    .select()
    .from(seoAlerts)
    .where(eq(seoAlerts.status, "new"));

  for (const alert of newAlerts) {
    if (alert.severity === "critical" || alert.severity === "high") {
      await sendSeoAlert(alert.title, alert.message, alert.severity);
      await db
        .update(seoAlerts)
        .set({ status: "sent", sentVia: "whatsapp" })
        .where(eq(seoAlerts.id, alert.id));
    } else {
      // Low/medium alerts just go to dashboard
      await db
        .update(seoAlerts)
        .set({ status: "sent", sentVia: "dashboard" })
        .where(eq(seoAlerts.id, alert.id));
    }
  }

  logger.info(`[SEO:Alerts] Processed ${newAlerts.length} alerts`);
}
```

```typescript
// server/seo/alerts/whatsapp.ts
import { logger } from "../../lib/logger";

export async function sendSeoAlert(title: string, message: string, severity: string): Promise<void> {
  try {
    // Dynamic import to avoid issues if Twilio not configured
    const twilio = await import("twilio");
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

    const ownerPhone = process.env.OWNER_WHATSAPP || "+34611500372";
    const fromPhone = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    const emoji = severity === "critical" ? "🚨" : severity === "high" ? "⚠️" : "📊";

    await client.messages.create({
      body: `${emoji} SEO Alert: ${title}\n\n${message}`,
      from: fromPhone,
      to: `whatsapp:${ownerPhone}`,
    });

    logger.info(`[SEO:WhatsApp] Alert sent: ${title}`);
  } catch (error) {
    logger.warn(`[SEO:WhatsApp] Failed to send alert: ${error}`);
  }
}
```

**Step 2: Commit**

```bash
git add server/seo/alerts/engine.ts server/seo/alerts/whatsapp.ts
git commit -m "feat(seo-engine): add alert engine with WhatsApp notifications"
```

---

### Task 7.2: Build weekly report generator

**Files:**
- Create: `server/seo/reports/weekly.ts`

**Step 1: Implement weekly digest**

```typescript
// server/seo/reports/weekly.ts
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../../db";
import { seoReports } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { buildBriefing } from "../strategist/briefing";
import { sendSeoAlert } from "../alerts/whatsapp";

const client = new Anthropic();

export async function generateWeeklyReport(): Promise<void> {
  const briefing = await buildBriefing();

  logger.info("[SEO:Reports] Generating weekly report...");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Generate a concise weekly SEO report in Spanish for the business owner. Include:
1. Top 5 keywords and their position changes
2. Actions taken this week and their results
3. Active campaigns and progress
4. Top opportunities for next week
5. Any alerts or issues

Keep it short and actionable (max 500 words). Use plain text, no markdown.

Data:\n${JSON.stringify(briefing, null, 2)}`,
      }],
    });

    const summary = response.content[0].type === "text" ? response.content[0].text : "";

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    await db.insert(seoReports).values({
      type: "weekly",
      periodStart: weekAgo.toISOString().split("T")[0],
      periodEnd: now.toISOString().split("T")[0],
      summary,
      data: briefing,
      sentVia: "whatsapp",
    });

    // Send via WhatsApp
    await sendSeoAlert(
      "Informe SEO Semanal",
      summary,
      "low",
    );

    logger.info("[SEO:Reports] Weekly report generated and sent");
  } catch (error) {
    logger.error("[SEO:Reports] Failed to generate weekly report", { error: String(error) });
  }
}
```

**Step 2: Uncomment reporting + alert jobs in worker.ts**

**Step 3: Commit**

```bash
git add server/seo/reports/weekly.ts server/seo/worker.ts
git commit -m "feat(seo-engine): add AI-generated weekly SEO report"
```

---

### Task 7.3: Build SEO MCP server

**Files:**
- Create: `server/mcp/seo-engine-server.ts`

**Step 1: Implement MCP server with all tools**

```typescript
// server/mcp/seo-engine-server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { eq, desc, gte, and, sql, count } from "drizzle-orm";
import { db } from "./shared/db.js";
import * as schema from "../../shared/schema.js";

const server = new McpServer({
  name: "costa-brava-seo-engine",
  version: "1.0.0",
});

server.tool(
  "seo_dashboard",
  "Get current SEO metrics overview: top keywords, positions, active campaigns, recent alerts",
  {},
  async () => {
    const topKeywords = await db
      .select()
      .from(schema.seoRankings)
      .innerJoin(schema.seoKeywords, eq(schema.seoRankings.keywordId, schema.seoKeywords.id))
      .orderBy(desc(schema.seoRankings.impressions))
      .limit(20);

    const activeCampaigns = await db
      .select()
      .from(schema.seoCampaigns)
      .where(eq(schema.seoCampaigns.status, "active"));

    const recentAlerts = await db
      .select()
      .from(schema.seoAlerts)
      .orderBy(desc(schema.seoAlerts.createdAt))
      .limit(5);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ topKeywords, activeCampaigns, recentAlerts }, null, 2),
      }],
    };
  }
);

server.tool(
  "seo_keywords",
  "Get keyword rankings with optional filters",
  {
    cluster: z.string().optional().describe("Filter by keyword cluster"),
    minPosition: z.number().optional().describe("Minimum position (e.g., 1)"),
    maxPosition: z.number().optional().describe("Maximum position (e.g., 10)"),
    limit: z.number().optional().describe("Max results (default 50)"),
  },
  async ({ cluster, minPosition, maxPosition, limit }) => {
    let query = db
      .select()
      .from(schema.seoKeywords)
      .innerJoin(schema.seoRankings, eq(schema.seoKeywords.id, schema.seoRankings.keywordId))
      .orderBy(desc(schema.seoRankings.impressions))
      .limit(limit || 50);

    const results = await query;
    return {
      content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "seo_competitors",
  "Get competitor comparison report",
  {},
  async () => {
    const competitors = await db.select().from(schema.seoCompetitors);
    const rankings = await db
      .select()
      .from(schema.seoCompetitorRankings)
      .orderBy(desc(schema.seoCompetitorRankings.date))
      .limit(100);

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ competitors, rankings }, null, 2) }],
    };
  }
);

server.tool(
  "seo_campaigns",
  "Get active campaigns with progress",
  {},
  async () => {
    const campaigns = await db.select().from(schema.seoCampaigns);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(campaigns, null, 2) }],
    };
  }
);

server.tool(
  "seo_experiments",
  "Get experiment history with results and learnings",
  {
    status: z.string().optional().describe("Filter by status: running, success, failure, inconclusive"),
    limit: z.number().optional().describe("Max results (default 20)"),
  },
  async ({ status, limit }) => {
    const experiments = await db
      .select()
      .from(schema.seoExperiments)
      .orderBy(desc(schema.seoExperiments.executedAt))
      .limit(limit || 20);

    return {
      content: [{ type: "text" as const, text: JSON.stringify(experiments, null, 2) }],
    };
  }
);

server.tool(
  "seo_geo_status",
  "Get AI citation status across engines (Perplexity, Google AI, ChatGPT)",
  {},
  async () => {
    const geoData = await db
      .select()
      .from(schema.seoGeo)
      .orderBy(desc(schema.seoGeo.date))
      .limit(50);

    return {
      content: [{ type: "text" as const, text: JSON.stringify(geoData, null, 2) }],
    };
  }
);

server.tool(
  "seo_revenue",
  "Get revenue attribution by keyword",
  {},
  async () => {
    const conversions = await db
      .select()
      .from(schema.seoConversions)
      .innerJoin(schema.seoKeywords, eq(schema.seoConversions.keywordId, schema.seoKeywords.id))
      .orderBy(desc(schema.seoConversions.revenue))
      .limit(50);

    return {
      content: [{ type: "text" as const, text: JSON.stringify(conversions, null, 2) }],
    };
  }
);

server.tool(
  "seo_force_analysis",
  "Trigger immediate SEO strategist analysis (runs Claude API call)",
  {},
  async () => {
    try {
      const { runDailyAnalysis } = await import("../seo/strategist/agent.js");
      const decisions = await runDailyAnalysis();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(decisions, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error}` }],
      };
    }
  }
);

server.tool(
  "seo_alerts",
  "Get active alerts",
  {
    status: z.string().optional().describe("Filter: new, sent, acknowledged, resolved"),
  },
  async ({ status }) => {
    const alerts = await db
      .select()
      .from(schema.seoAlerts)
      .orderBy(desc(schema.seoAlerts.createdAt))
      .limit(20);

    return {
      content: [{ type: "text" as const, text: JSON.stringify(alerts, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

**Step 2: Register MCP server in `.claude/settings.json`**

Add entry:
```json
"seo-engine": {
  "command": "npx",
  "args": ["tsx", "server/mcp/seo-engine-server.ts"],
  "cwd": "/Users/macbookpro/costa-brava-rent-a-boat"
}
```

**Step 3: Commit**

```bash
git add server/mcp/seo-engine-server.ts .claude/settings.json
git commit -m "feat(seo-engine): add SEO MCP server with 9 tools"
```

---

### Task 7.4: Build CRM dashboard API routes

**Files:**
- Create: `server/routes/admin-seo.ts`
- Modify: `server/routes/admin.ts` (register new route module)

**Step 1: Create admin SEO routes**

```typescript
// server/routes/admin-seo.ts
import type { Express } from "express";
import { db } from "../db";
import {
  seoKeywords, seoRankings, seoCompetitors, seoCompetitorRankings,
  seoSerpFeatures, seoCampaigns, seoExperiments, seoConversions,
  seoLearnings, seoAlerts, seoReports, seoGeo, seoHealthChecks,
} from "../../shared/schema";
import { eq, desc, gte, and, sql, count } from "drizzle-orm";
import { requireAdminSession } from "./auth-middleware";

export function registerSeoRoutes(app: Express): void {

  // Dashboard overview
  app.get("/api/admin/seo/dashboard", requireAdminSession, async (_req, res) => {
    try {
      const [keywordCount] = await db.select({ count: count() }).from(seoKeywords);
      const [campaignCount] = await db.select({ count: count() }).from(seoCampaigns).where(eq(seoCampaigns.status, "active"));
      const [experimentCount] = await db.select({ count: count() }).from(seoExperiments).where(eq(seoExperiments.status, "running"));
      const [alertCount] = await db.select({ count: count() }).from(seoAlerts).where(eq(seoAlerts.status, "new"));

      const topKeywords = await db
        .select()
        .from(seoRankings)
        .innerJoin(seoKeywords, eq(seoRankings.keywordId, seoKeywords.id))
        .orderBy(desc(seoRankings.impressions))
        .limit(10);

      res.json({
        stats: {
          trackedKeywords: keywordCount.count,
          activeCampaigns: campaignCount.count,
          runningExperiments: experimentCount.count,
          pendingAlerts: alertCount.count,
        },
        topKeywords,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching SEO dashboard" });
    }
  });

  // Keywords
  app.get("/api/admin/seo/keywords", requireAdminSession, async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 50;
      const keywords = await db
        .select()
        .from(seoKeywords)
        .innerJoin(seoRankings, eq(seoKeywords.id, seoRankings.keywordId))
        .orderBy(desc(seoRankings.impressions))
        .limit(limit);
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching keywords" });
    }
  });

  // Campaigns
  app.get("/api/admin/seo/campaigns", requireAdminSession, async (_req, res) => {
    try {
      const campaigns = await db.select().from(seoCampaigns).orderBy(desc(seoCampaigns.createdAt));
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaigns" });
    }
  });

  // Experiments
  app.get("/api/admin/seo/experiments", requireAdminSession, async (_req, res) => {
    try {
      const experiments = await db.select().from(seoExperiments).orderBy(desc(seoExperiments.executedAt)).limit(50);
      res.json(experiments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching experiments" });
    }
  });

  // Competitors
  app.get("/api/admin/seo/competitors", requireAdminSession, async (_req, res) => {
    try {
      const competitors = await db.select().from(seoCompetitors);
      res.json(competitors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching competitors" });
    }
  });

  // Alerts
  app.get("/api/admin/seo/alerts", requireAdminSession, async (_req, res) => {
    try {
      const alerts = await db.select().from(seoAlerts).orderBy(desc(seoAlerts.createdAt)).limit(50);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching alerts" });
    }
  });

  // Acknowledge alert
  app.post("/api/admin/seo/alerts/:id/acknowledge", requireAdminSession, async (req, res) => {
    try {
      const [alert] = await db
        .update(seoAlerts)
        .set({ status: "acknowledged" })
        .where(eq(seoAlerts.id, Number(req.params.id)))
        .returning();
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Error acknowledging alert" });
    }
  });

  // Reports
  app.get("/api/admin/seo/reports", requireAdminSession, async (_req, res) => {
    try {
      const reports = await db.select().from(seoReports).orderBy(desc(seoReports.createdAt)).limit(20);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reports" });
    }
  });

  // GEO status
  app.get("/api/admin/seo/geo", requireAdminSession, async (_req, res) => {
    try {
      const geo = await db.select().from(seoGeo).orderBy(desc(seoGeo.date)).limit(50);
      res.json(geo);
    } catch (error) {
      res.status(500).json({ message: "Error fetching GEO status" });
    }
  });

  // Health checks
  app.get("/api/admin/seo/health", requireAdminSession, async (_req, res) => {
    try {
      const checks = await db.select().from(seoHealthChecks).orderBy(desc(seoHealthChecks.checkedAt)).limit(50);
      res.json(checks);
    } catch (error) {
      res.status(500).json({ message: "Error fetching health checks" });
    }
  });

  // Revenue attribution
  app.get("/api/admin/seo/revenue", requireAdminSession, async (_req, res) => {
    try {
      const revenue = await db
        .select()
        .from(seoConversions)
        .innerJoin(seoKeywords, eq(seoConversions.keywordId, seoKeywords.id))
        .orderBy(desc(seoConversions.revenue))
        .limit(50);
      res.json(revenue);
    } catch (error) {
      res.status(500).json({ message: "Error fetching revenue data" });
    }
  });

  // Learnings
  app.get("/api/admin/seo/learnings", requireAdminSession, async (_req, res) => {
    try {
      const learnings = await db.select().from(seoLearnings).orderBy(desc(seoLearnings.confidence)).limit(50);
      res.json(learnings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching learnings" });
    }
  });
}
```

**Step 2: Register in admin.ts**

Add `registerSeoRoutes(app)` to the admin routes registration.

**Step 3: Commit**

```bash
git add server/routes/admin-seo.ts server/routes/admin.ts
git commit -m "feat(seo-engine): add CRM dashboard API routes (13 endpoints)"
```

---

## Post-implementation

### Task 8.1: Verify everything works

**Step 1: Push schema**
Run: `npm run db:push`

**Step 2: TypeScript check**
Run: `NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit`
Expected: No new errors (only pre-existing googleAnalyticsService.ts errors)

**Step 3: Start dev server**
Run: `npm run dev`
Expected: Server starts, logs show `[SEO] Worker started with N jobs`

**Step 4: Verify GSC sync**
Manually trigger GSC collector and verify data in `seo_keywords` table.

**Step 5: Verify health crawler**
Check that `seo_health_checks` table gets populated.

**Step 6: Test admin API**
```bash
curl -H "Authorization: Bearer <token>" localhost:5000/api/admin/seo/dashboard
```

---

## Summary

| Phase | Tasks | Key deliverables |
|-------|-------|-----------------|
| 1: Foundation | 1.1-1.5 | 16 DB tables, worker skeleton, GSC collector, health crawler, competitor seed |
| 2: Intelligence | 2.1-2.2 | ValueSERP integration, SERP tracking, competitor crawler |
| 3: Brain | 3.1-3.3 | Briefing assembler, Claude strategist agent, action executor |
| 4: Content-as-data | 4.1 | seoMeta integration with seoInjector |
| 5: Feedback | 5.1-5.2 | Experiment tracker, revenue correlator |
| 6: GEO | 6.1 | Perplexity API monitor |
| 7: Output | 7.1-7.4 | WhatsApp alerts, weekly reports, MCP server (9 tools), CRM API (13 endpoints) |

**Total: 16 tasks, ~20 new files, 16 new DB tables, 9 MCP tools, 13 API endpoints**
