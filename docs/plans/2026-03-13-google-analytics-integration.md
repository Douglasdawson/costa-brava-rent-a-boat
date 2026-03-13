# Google Analytics & Search Console Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show Google Search Console and GA4 data inside the CRM admin panel (Reportes section + new SEO & Analytics tab), updated daily via cron.

**Architecture:** Service Account authenticates with Google APIs. A cron job runs every 6 hours, fetches GSC + GA4 metrics, and caches them in a `analytics_snapshots` JSONB table. Express endpoints serve cached data to the CRM frontend. Frontend renders charts with Recharts (already installed).

**Tech Stack:** `googleapis` npm package, PostgreSQL JSONB, node-cron (already installed), Recharts (already installed), React Query (already installed), shadcn/ui cards/tables.

---

## Task 1: Install googleapis and add env vars

**Files:**
- Modify: `package.json`
- Modify: `server/config.ts` (env validation schema, ~line 8-30)

**Step 1: Install googleapis**

Run: `npm install googleapis`

**Step 2: Add env vars to config schema**

In `server/config.ts`, add to the `envSchema` object:

```typescript
GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().optional(),
GOOGLE_ANALYTICS_PROPERTY_ID: z.string().optional(),
GSC_SITE_URL: z.string().optional(),
```

**Step 3: Commit**

```bash
git add package.json package-lock.json server/config.ts
git commit -m "feat: add googleapis dependency and Google env vars"
```

---

## Task 2: Add analytics_snapshots table

**Files:**
- Modify: `shared/schema.ts` — add table definition + types

**Step 1: Add table definition**

Add at the end of the tables section in `shared/schema.ts`:

```typescript
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  source: text("source").notNull(), // 'gsc' | 'ga4'
  metricType: text("metric_type").notNull(), // 'overview' | 'keywords' | 'pages' | 'traffic' | 'devices' | 'countries' | 'conversions'
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  uniqueSnapshot: unique("analytics_snapshot_unique").on(table.date, table.source, table.metricType),
}));

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
```

**Step 2: Push schema to DB**

Run: `npm run db:push`
Expected: Table `analytics_snapshots` created in Neon.

**Step 3: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add analytics_snapshots table for Google data cache"
```

---

## Task 3: Create Google Analytics service

**Files:**
- Create: `server/services/googleAnalyticsService.ts`

**Step 1: Create the service file**

```typescript
import { google } from "googleapis";
import { config } from "../config";
import { logger } from "../lib/logger";
import { db } from "../db";
import { analyticsSnapshots } from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// Initialize Google auth
function getGoogleAuth() {
  const email = config.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !key) {
    return null;
  }
  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics.readonly",
    ],
  });
}

function isConfigured(): boolean {
  return !!(config.GOOGLE_SERVICE_ACCOUNT_EMAIL && config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

// ==================== GSC Functions ====================

export async function fetchGSCOverview(startDate: string, endDate: string) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google API not configured");

  const searchconsole = google.searchconsole({ version: "v1", auth });
  const siteUrl = config.GSC_SITE_URL || "sc-domain:costabravarentaboat.com";

  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["date"],
      rowLimit: 500,
    },
  });

  const rows = response.data.rows || [];
  const totals = rows.reduce(
    (acc, row) => ({
      clicks: acc.clicks + (row.clicks || 0),
      impressions: acc.impressions + (row.impressions || 0),
      ctr: 0,
      position: 0,
    }),
    { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  );

  totals.ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
  totals.position =
    rows.length > 0 ? rows.reduce((sum, r) => sum + (r.position || 0), 0) / rows.length : 0;

  return {
    totals,
    daily: rows.map((row) => ({
      date: row.keys?.[0] || "",
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    })),
  };
}

export async function fetchGSCKeywords(startDate: string, endDate: string, limit = 50) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google API not configured");

  const searchconsole = google.searchconsole({ version: "v1", auth });
  const siteUrl = config.GSC_SITE_URL || "sc-domain:costabravarentaboat.com";

  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: limit,
      orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
    },
  });

  return (response.data.rows || []).map((row) => ({
    keyword: row.keys?.[0] || "",
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

export async function fetchGSCPages(startDate: string, endDate: string, limit = 50) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google API not configured");

  const searchconsole = google.searchconsole({ version: "v1", auth });
  const siteUrl = config.GSC_SITE_URL || "sc-domain:costabravarentaboat.com";

  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: limit,
      orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
    },
  });

  return (response.data.rows || []).map((row) => ({
    page: row.keys?.[0] || "",
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

// ==================== GA4 Functions ====================

export async function fetchGA4Overview(startDate: string, endDate: string) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google API not configured");

  const propertyId = config.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!propertyId) throw new Error("GA4 property ID not configured");

  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const response = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "newUsers" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
        { name: "screenPageViews" },
      ],
    },
  });

  const row = response.data.rows?.[0];
  const values = row?.metricValues || [];
  return {
    activeUsers: parseInt(values[0]?.value || "0"),
    sessions: parseInt(values[1]?.value || "0"),
    newUsers: parseInt(values[2]?.value || "0"),
    bounceRate: parseFloat(values[3]?.value || "0"),
    avgSessionDuration: parseFloat(values[4]?.value || "0"),
    pageViews: parseInt(values[5]?.value || "0"),
  };
}

export async function fetchGA4TrafficSources(startDate: string, endDate: string) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google API not configured");

  const propertyId = config.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!propertyId) throw new Error("GA4 property ID not configured");

  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const response = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    },
  });

  return (response.data.rows || []).map((row) => ({
    channel: row.dimensionValues?.[0]?.value || "unknown",
    sessions: parseInt(row.metricValues?.[0]?.value || "0"),
    users: parseInt(row.metricValues?.[1]?.value || "0"),
  }));
}

export async function fetchGA4Devices(startDate: string, endDate: string) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google API not configured");

  const propertyId = config.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!propertyId) throw new Error("GA4 property ID not configured");

  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const response = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    },
  });

  return (response.data.rows || []).map((row) => ({
    device: row.dimensionValues?.[0]?.value || "unknown",
    sessions: parseInt(row.metricValues?.[0]?.value || "0"),
    users: parseInt(row.metricValues?.[1]?.value || "0"),
  }));
}

export async function fetchGA4Countries(startDate: string, endDate: string, limit = 10) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google API not configured");

  const propertyId = config.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!propertyId) throw new Error("GA4 property ID not configured");

  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const response = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit,
    },
  });

  return (response.data.rows || []).map((row) => ({
    country: row.dimensionValues?.[0]?.value || "unknown",
    users: parseInt(row.metricValues?.[0]?.value || "0"),
    sessions: parseInt(row.metricValues?.[1]?.value || "0"),
  }));
}

export async function fetchGA4Conversions(startDate: string, endDate: string) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google API not configured");

  const propertyId = config.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!propertyId) throw new Error("GA4 property ID not configured");

  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const response = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: {
            values: ["booking_started", "purchase", "whatsapp_click", "phone_click", "generate_lead"],
          },
        },
      },
    },
  });

  return (response.data.rows || []).map((row) => ({
    event: row.dimensionValues?.[0]?.value || "unknown",
    count: parseInt(row.metricValues?.[0]?.value || "0"),
  }));
}

// ==================== GA4 Daily Trend ====================

export async function fetchGA4DailyTrend(startDate: string, endDate: string) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error("Google API not configured");

  const propertyId = config.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!propertyId) throw new Error("GA4 property ID not configured");

  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });

  const response = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    },
  });

  return (response.data.rows || []).map((row) => ({
    date: row.dimensionValues?.[0]?.value || "",
    users: parseInt(row.metricValues?.[0]?.value || "0"),
    sessions: parseInt(row.metricValues?.[1]?.value || "0"),
    pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
  }));
}

// ==================== Cache / Sync ====================

export async function syncAllAnalytics() {
  if (!isConfigured()) {
    logger.warn("[Analytics] Google API not configured, skipping sync");
    return;
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];

  try {
    logger.info("[Analytics] Starting Google data sync");

    const [gscOverview, gscKeywords, gscPages, ga4Overview, ga4Traffic, ga4Devices, ga4Countries, ga4Conversions, ga4Trend] =
      await Promise.allSettled([
        fetchGSCOverview(start, end),
        fetchGSCKeywords(start, end, 100),
        fetchGSCPages(start, end, 100),
        fetchGA4Overview(start, end),
        fetchGA4TrafficSources(start, end),
        fetchGA4Devices(start, end),
        fetchGA4Countries(start, end, 20),
        fetchGA4Conversions(start, end),
        fetchGA4DailyTrend(start, end),
      ]);

    const today = new Date().toISOString().split("T")[0];

    const upserts = [
      { source: "gsc", metricType: "overview", result: gscOverview },
      { source: "gsc", metricType: "keywords", result: gscKeywords },
      { source: "gsc", metricType: "pages", result: gscPages },
      { source: "ga4", metricType: "overview", result: ga4Overview },
      { source: "ga4", metricType: "traffic", result: ga4Traffic },
      { source: "ga4", metricType: "devices", result: ga4Devices },
      { source: "ga4", metricType: "countries", result: ga4Countries },
      { source: "ga4", metricType: "conversions", result: ga4Conversions },
      { source: "ga4", metricType: "trend", result: ga4Trend },
    ];

    for (const { source, metricType, result } of upserts) {
      if (result.status === "fulfilled") {
        await db
          .insert(analyticsSnapshots)
          .values({
            date: today,
            source,
            metricType,
            data: result.value,
          })
          .onConflictDoUpdate({
            target: [analyticsSnapshots.date, analyticsSnapshots.source, analyticsSnapshots.metricType],
            set: { data: result.value, createdAt: new Date() },
          });
      } else {
        logger.error(`[Analytics] Failed to fetch ${source}/${metricType}`, { error: result.reason?.message });
      }
    }

    logger.info("[Analytics] Google data sync completed");
  } catch (error) {
    logger.error("[Analytics] Sync failed", { error: error instanceof Error ? error.message : String(error) });
  }
}

export async function getCachedAnalytics(source: string, metricType: string) {
  const [latest] = await db
    .select()
    .from(analyticsSnapshots)
    .where(and(eq(analyticsSnapshots.source, source), eq(analyticsSnapshots.metricType, metricType)))
    .orderBy(desc(analyticsSnapshots.createdAt))
    .limit(1);

  return latest?.data || null;
}
```

**Step 2: Commit**

```bash
git add server/services/googleAnalyticsService.ts
git commit -m "feat: add Google Analytics/Search Console service with caching"
```

---

## Task 4: Create admin analytics API routes

**Files:**
- Create: `server/routes/admin-analytics.ts`
- Modify: `server/routes/index.ts` — register new routes

**Step 1: Create the routes file**

```typescript
import type { Express } from "express";
import { requireAdminSession } from "./auth";
import { logger } from "../lib/logger";
import {
  getCachedAnalytics,
  syncAllAnalytics,
  fetchGSCOverview,
  fetchGSCKeywords,
  fetchGSCPages,
  fetchGA4Overview,
  fetchGA4TrafficSources,
  fetchGA4Devices,
  fetchGA4Countries,
  fetchGA4Conversions,
  fetchGA4DailyTrend,
} from "../services/googleAnalyticsService";
import { config } from "../config";

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function isGoogleConfigured(): boolean {
  return !!(config.GOOGLE_SERVICE_ACCOUNT_EMAIL && config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

export function registerAnalyticsRoutes(app: Express) {
  // Check if Google API is configured
  app.get("/api/admin/analytics/status", requireAdminSession, async (_req, res) => {
    res.json({
      configured: isGoogleConfigured(),
      hasGSC: !!(config.GSC_SITE_URL),
      hasGA4: !!(config.GOOGLE_ANALYTICS_PROPERTY_ID),
    });
  });

  // Combined overview (GSC + GA4)
  app.get("/api/admin/analytics/overview", requireAdminSession, async (_req, res) => {
    try {
      const [gscData, ga4Data] = await Promise.all([
        getCachedAnalytics("gsc", "overview"),
        getCachedAnalytics("ga4", "overview"),
      ]);

      if (!gscData && !ga4Data && isGoogleConfigured()) {
        // No cache, try live fetch
        const { startDate, endDate } = getDateRange(28);
        const [gscLive, ga4Live] = await Promise.allSettled([
          fetchGSCOverview(startDate, endDate),
          fetchGA4Overview(startDate, endDate),
        ]);
        return res.json({
          gsc: gscLive.status === "fulfilled" ? gscLive.value : null,
          ga4: ga4Live.status === "fulfilled" ? ga4Live.value : null,
          cached: false,
        });
      }

      res.json({ gsc: gscData, ga4: ga4Data, cached: true });
    } catch (error) {
      logger.error("[Analytics] Error fetching overview", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo datos de analytics" });
    }
  });

  // GSC Keywords
  app.get("/api/admin/analytics/keywords", requireAdminSession, async (req, res) => {
    try {
      const cached = await getCachedAnalytics("gsc", "keywords");
      if (cached) return res.json({ data: cached, cached: true });

      if (!isGoogleConfigured()) return res.json({ data: [], cached: false });

      const days = parseInt(req.query.days as string) || 28;
      const { startDate, endDate } = getDateRange(days);
      const data = await fetchGSCKeywords(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error) {
      logger.error("[Analytics] Error fetching keywords", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo keywords" });
    }
  });

  // GSC Pages
  app.get("/api/admin/analytics/pages", requireAdminSession, async (req, res) => {
    try {
      const cached = await getCachedAnalytics("gsc", "pages");
      if (cached) return res.json({ data: cached, cached: true });

      if (!isGoogleConfigured()) return res.json({ data: [], cached: false });

      const days = parseInt(req.query.days as string) || 28;
      const { startDate, endDate } = getDateRange(days);
      const data = await fetchGSCPages(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error) {
      logger.error("[Analytics] Error fetching pages", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo páginas" });
    }
  });

  // GA4 Traffic sources
  app.get("/api/admin/analytics/traffic", requireAdminSession, async (req, res) => {
    try {
      const cached = await getCachedAnalytics("ga4", "traffic");
      if (cached) return res.json({ data: cached, cached: true });

      if (!isGoogleConfigured()) return res.json({ data: [], cached: false });

      const days = parseInt(req.query.days as string) || 28;
      const { startDate, endDate } = getDateRange(days);
      const data = await fetchGA4TrafficSources(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error) {
      logger.error("[Analytics] Error fetching traffic", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo tráfico" });
    }
  });

  // GA4 Devices
  app.get("/api/admin/analytics/devices", requireAdminSession, async (_req, res) => {
    try {
      const cached = await getCachedAnalytics("ga4", "devices");
      if (cached) return res.json({ data: cached, cached: true });

      if (!isGoogleConfigured()) return res.json({ data: [], cached: false });

      const { startDate, endDate } = getDateRange(28);
      const data = await fetchGA4Devices(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error) {
      logger.error("[Analytics] Error fetching devices", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo dispositivos" });
    }
  });

  // GA4 Countries
  app.get("/api/admin/analytics/countries", requireAdminSession, async (_req, res) => {
    try {
      const cached = await getCachedAnalytics("ga4", "countries");
      if (cached) return res.json({ data: cached, cached: true });

      if (!isGoogleConfigured()) return res.json({ data: [], cached: false });

      const { startDate, endDate } = getDateRange(28);
      const data = await fetchGA4Countries(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error) {
      logger.error("[Analytics] Error fetching countries", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo países" });
    }
  });

  // GA4 Conversions
  app.get("/api/admin/analytics/conversions", requireAdminSession, async (_req, res) => {
    try {
      const cached = await getCachedAnalytics("ga4", "conversions");
      if (cached) return res.json({ data: cached, cached: true });

      if (!isGoogleConfigured()) return res.json({ data: [], cached: false });

      const { startDate, endDate } = getDateRange(28);
      const data = await fetchGA4Conversions(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error) {
      logger.error("[Analytics] Error fetching conversions", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo conversiones" });
    }
  });

  // GA4 Trends (for charts)
  app.get("/api/admin/analytics/trends", requireAdminSession, async (req, res) => {
    try {
      const gscTrend = await getCachedAnalytics("gsc", "overview");
      const ga4Trend = await getCachedAnalytics("ga4", "trend");

      if (gscTrend || ga4Trend) {
        return res.json({
          gsc: gscTrend ? (gscTrend as any).daily || [] : [],
          ga4: ga4Trend || [],
          cached: true,
        });
      }

      if (!isGoogleConfigured()) return res.json({ gsc: [], ga4: [], cached: false });

      const days = parseInt(req.query.days as string) || 30;
      const { startDate, endDate } = getDateRange(days);
      const [gscData, ga4Data] = await Promise.allSettled([
        fetchGSCOverview(startDate, endDate),
        fetchGA4DailyTrend(startDate, endDate),
      ]);

      res.json({
        gsc: gscData.status === "fulfilled" ? gscData.value.daily : [],
        ga4: ga4Data.status === "fulfilled" ? ga4Data.value : [],
        cached: false,
      });
    } catch (error) {
      logger.error("[Analytics] Error fetching trends", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo tendencias" });
    }
  });

  // Manual sync trigger
  app.post("/api/admin/analytics/sync", requireAdminSession, async (_req, res) => {
    try {
      if (!isGoogleConfigured()) {
        return res.status(400).json({ message: "Google API no configurada. Añade las variables de entorno." });
      }
      await syncAllAnalytics();
      res.json({ message: "Sincronización completada" });
    } catch (error) {
      logger.error("[Analytics] Manual sync failed", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error en la sincronización" });
    }
  });
}
```

**Step 2: Register in route index**

In `server/routes/index.ts`, add import and registration:

```typescript
import { registerAnalyticsRoutes } from "./admin-analytics";
```

And in `registerRoutes()`:

```typescript
registerAnalyticsRoutes(app);
```

**Step 3: Commit**

```bash
git add server/routes/admin-analytics.ts server/routes/index.ts
git commit -m "feat: add admin analytics API endpoints with cache fallback"
```

---

## Task 5: Add cron job for analytics sync

**Files:**
- Modify: `server/services/schedulerService.ts`

**Step 1: Add import and cron job**

Add import at top:

```typescript
import { syncAllAnalytics } from "./googleAnalyticsService";
```

Add cron job inside `startScheduler()` function, after the existing cron jobs:

```typescript
// Google Analytics sync - every 6 hours at minute 15
scheduledTasks.push(cron.schedule("15 */6 * * *", async () => {
  logger.info("[Scheduler] Running Google Analytics sync");
  try {
    await syncAllAnalytics();
  } catch (error) {
    logger.error("[Scheduler] Analytics sync failed", { error: error instanceof Error ? error.message : String(error) });
  }
}));
```

**Step 2: Commit**

```bash
git add server/services/schedulerService.ts
git commit -m "feat: add Google Analytics sync cron job (every 6 hours)"
```

---

## Task 6: Create AnalyticsTab CRM component

**Files:**
- Create: `client/src/components/crm/AnalyticsTab.tsx`

This is the largest file. It contains:
- Overview section with KPI cards
- Keywords table
- Pages table
- Traffic donut chart
- Devices donut chart
- Countries table
- Conversions section
- Trend chart

Use Recharts (already installed) for charts, shadcn Card/Table for layout, react-query for data fetching. Follow exact pattern from `ReportsTab.tsx`:
- Props: `{ adminToken: string }`
- `useQuery` with Authorization header
- Cards with `CardHeader`/`CardContent`
- Internal tab navigation with `useState` for sub-sections

The component should show a friendly "Google API no configurada" message with setup instructions when `/api/admin/analytics/status` returns `configured: false`.

**Step 1: Create the component** (full implementation — large file, ~600 lines with all sub-sections)

**Step 2: Commit**

```bash
git add client/src/components/crm/AnalyticsTab.tsx
git commit -m "feat: add SEO & Analytics CRM tab with charts and tables"
```

---

## Task 7: Register tab in CRM layout and dashboard

**Files:**
- Modify: `client/src/components/crm/AdminLayout.tsx` — add tab definition
- Modify: `client/src/components/CRMDashboard.tsx` — render tab component

**Step 1: Add tab to AdminLayout.tsx**

In `ADMIN_TABS` array, add:

```typescript
{ id: "analytics", label: "SEO", icon: BarChart3 },
```

Import `BarChart3` from `lucide-react` if not already imported.

Add `"analytics"` to the `negocioTabs` group (in the secondary groups section).

**Step 2: Render tab in CRMDashboard.tsx**

Add import:

```typescript
import { AnalyticsTab } from "./crm/AnalyticsTab";
```

Add conditional render alongside other tabs:

```typescript
{selectedTab === "analytics" && (
  <AnalyticsTab adminToken={adminToken} />
)}
```

**Step 3: Commit**

```bash
git add client/src/components/crm/AdminLayout.tsx client/src/components/CRMDashboard.tsx
git commit -m "feat: register SEO & Analytics tab in CRM layout"
```

---

## Task 8: Add Google summary to Reportes tab

**Files:**
- Modify: `client/src/components/crm/ReportsTab.tsx` — add Google KPI section

**Step 1: Add a "Google Search" section**

At the top of the Reportes tab, add a section with 4 KPI cards:
- Clics orgánicos
- Impresiones
- CTR medio
- Posición media

Fetch from `/api/admin/analytics/overview`. Show "No configurado" if Google API is not set up.

Add a "Ver más en SEO & Analytics" link that switches to the analytics tab.

**Step 2: Commit**

```bash
git add client/src/components/crm/ReportsTab.tsx
git commit -m "feat: add Google Search KPIs to Reportes tab"
```

---

## Task 9: Verify and test

**Step 1: Run type check**

Run: `npm run check`
Expected: No TypeScript errors

**Step 2: Run dev server**

Run: `npm run dev`
Expected: Server starts without errors

**Step 3: Test without Google credentials**

- Open CRM → SEO & Analytics tab
- Expected: "Google API no configurada" message with setup instructions
- Open CRM → Reportes tab
- Expected: Google section shows "No configurado" gracefully

**Step 4: Commit any fixes**

---

## Post-Implementation: Manual Setup (User)

After the code is deployed, the user needs to:

1. Go to https://console.cloud.google.com
2. Create or select a project
3. Enable **Search Console API** and **Google Analytics Data API**
4. Create a **Service Account** → download the JSON key
5. In GSC: Add the service account email as a user (Full permission)
6. In GA4: Admin → Property → Property Access Management → Add the service account email (Viewer)
7. Set environment variables in Replit:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - `GOOGLE_ANALYTICS_PROPERTY_ID=384574154`
   - `GSC_SITE_URL=sc-domain:costabravarentaboat.com`
8. In CRM → SEO & Analytics → click "Sincronizar ahora" to trigger first sync
