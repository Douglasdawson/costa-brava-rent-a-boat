import { google } from "googleapis";
import { config } from "../config";
import { logger } from "../lib/logger";
import { db } from "../db";
import { analyticsSnapshots } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Initialize Google auth
function getGoogleAuth() {
  const email = config.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !key) {
    return null;
  }
  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n"),
    scopes: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics.readonly",
    ],
  });
}

export function isConfigured(): boolean {
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

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours — data older than this is considered stale

export async function getCachedAnalytics(source: string, metricType: string): Promise<{
  data: unknown;
  cachedAt: Date;
  stale: boolean;
} | null> {
  const [latest] = await db
    .select()
    .from(analyticsSnapshots)
    .where(and(eq(analyticsSnapshots.source, source), eq(analyticsSnapshots.metricType, metricType)))
    .orderBy(desc(analyticsSnapshots.createdAt))
    .limit(1);

  if (!latest) return null;

  const age = Date.now() - new Date(latest.createdAt).getTime();
  return {
    data: latest.data,
    cachedAt: latest.createdAt,
    stale: age > CACHE_TTL_MS,
  };
}
