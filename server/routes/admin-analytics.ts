import type { Express, Request } from "express";
import { requireAdminSession } from "./auth";
import { logger } from "../lib/logger";
import { getYieldAnalytics } from "../storage/analytics";
import type { AuthenticatedRequest } from "../types";
import {
  getCachedAnalytics,
  syncAllAnalytics,
  isConfigured,
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

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export function registerAnalyticsRoutes(app: Express) {
  // Status: check if Google Analytics services are configured
  app.get("/api/admin/analytics/status", requireAdminSession, async (_req, res) => {
    try {
      const configured = isConfigured();
      res.json({ configured, hasGSC: configured, hasGA4: configured });
    } catch (error: unknown) {
      logger.error("[Analytics] Error checking status", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo estado de analytics" });
    }
  });

  // Overview: combined GSC + GA4 overview
  app.get("/api/admin/analytics/overview", requireAdminSession, async (_req, res) => {
    try {
      const cachedGSC = await getCachedAnalytics("gsc", "overview");
      const cachedGA4 = await getCachedAnalytics("ga4", "overview");
      if (cachedGSC && cachedGA4) {
        return res.json({ data: { gsc: cachedGSC.data, ga4: cachedGA4.data }, cached: true, stale: cachedGSC.stale || cachedGA4.stale, cachedAt: cachedGSC.cachedAt });
      }
      if (!isConfigured()) {
        return res.json({ data: { gsc: null, ga4: null }, cached: false, configured: false });
      }
      const { startDate, endDate } = getDateRange(28);
      const [gsc, ga4] = await Promise.all([
        fetchGSCOverview(startDate, endDate),
        fetchGA4Overview(startDate, endDate),
      ]);
      res.json({ data: { gsc, ga4 }, cached: false });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : "";
      logger.error("[Analytics] Error fetching overview", { error: errMsg, stack: errStack });
      res.status(500).json({ message: "Error obteniendo datos de overview", error: errMsg });
    }
  });

  // GSC Keywords
  app.get("/api/admin/analytics/keywords", requireAdminSession, async (req, res) => {
    try {
      const cached = await getCachedAnalytics("gsc", "keywords");
      if (cached) return res.json({ data: cached.data, cached: true, stale: cached.stale, cachedAt: cached.cachedAt });
      if (!isConfigured()) return res.json({ data: [], cached: false, configured: false });
      const days = parseInt(req.query.days as string) || 28;
      const { startDate, endDate } = getDateRange(days);
      const data = await fetchGSCKeywords(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error: unknown) {
      logger.error("[Analytics] Error fetching keywords", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo datos de keywords" });
    }
  });

  // GSC Pages
  app.get("/api/admin/analytics/pages", requireAdminSession, async (req, res) => {
    try {
      const cached = await getCachedAnalytics("gsc", "pages");
      if (cached) return res.json({ data: cached.data, cached: true, stale: cached.stale, cachedAt: cached.cachedAt });
      if (!isConfigured()) return res.json({ data: [], cached: false, configured: false });
      const days = parseInt(req.query.days as string) || 28;
      const { startDate, endDate } = getDateRange(days);
      const data = await fetchGSCPages(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error: unknown) {
      logger.error("[Analytics] Error fetching pages", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo datos de pages" });
    }
  });

  // GA4 Traffic Sources
  app.get("/api/admin/analytics/traffic", requireAdminSession, async (req, res) => {
    try {
      const cached = await getCachedAnalytics("ga4", "traffic");
      if (cached) return res.json({ data: cached.data, cached: true, stale: cached.stale, cachedAt: cached.cachedAt });
      if (!isConfigured()) return res.json({ data: [], cached: false, configured: false });
      const days = parseInt(req.query.days as string) || 28;
      const { startDate, endDate } = getDateRange(days);
      const data = await fetchGA4TrafficSources(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error: unknown) {
      logger.error("[Analytics] Error fetching traffic sources", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo datos de traffic" });
    }
  });

  // GA4 Devices
  app.get("/api/admin/analytics/devices", requireAdminSession, async (_req, res) => {
    try {
      const cached = await getCachedAnalytics("ga4", "devices");
      if (cached) return res.json({ data: cached.data, cached: true, stale: cached.stale, cachedAt: cached.cachedAt });
      if (!isConfigured()) return res.json({ data: [], cached: false, configured: false });
      const { startDate, endDate } = getDateRange(28);
      const data = await fetchGA4Devices(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error: unknown) {
      logger.error("[Analytics] Error fetching devices", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo datos de devices" });
    }
  });

  // GA4 Countries
  app.get("/api/admin/analytics/countries", requireAdminSession, async (_req, res) => {
    try {
      const cached = await getCachedAnalytics("ga4", "countries");
      if (cached) return res.json({ data: cached.data, cached: true, stale: cached.stale, cachedAt: cached.cachedAt });
      if (!isConfigured()) return res.json({ data: [], cached: false, configured: false });
      const { startDate, endDate } = getDateRange(28);
      const data = await fetchGA4Countries(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error: unknown) {
      logger.error("[Analytics] Error fetching countries", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo datos de countries" });
    }
  });

  // GA4 Conversions
  app.get("/api/admin/analytics/conversions", requireAdminSession, async (_req, res) => {
    try {
      const cached = await getCachedAnalytics("ga4", "conversions");
      if (cached) return res.json({ data: cached.data, cached: true, stale: cached.stale, cachedAt: cached.cachedAt });
      if (!isConfigured()) return res.json({ data: [], cached: false, configured: false });
      const { startDate, endDate } = getDateRange(28);
      const data = await fetchGA4Conversions(startDate, endDate);
      res.json({ data, cached: false });
    } catch (error: unknown) {
      logger.error("[Analytics] Error fetching conversions", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo datos de conversions" });
    }
  });

  // Trends: GSC daily + GA4 daily for chart rendering
  app.get("/api/admin/analytics/trends", requireAdminSession, async (req, res) => {
    try {
      const cachedGSC = await getCachedAnalytics("gsc", "daily_trend");
      const cachedGA4 = await getCachedAnalytics("ga4", "daily_trend");
      if (cachedGSC && cachedGA4) {
        return res.json({ data: { gsc: cachedGSC.data, ga4: cachedGA4.data }, cached: true, stale: cachedGSC.stale || cachedGA4.stale, cachedAt: cachedGSC.cachedAt });
      }
      if (!isConfigured()) {
        return res.json({ data: { gsc: [], ga4: [] }, cached: false, configured: false });
      }
      const days = parseInt(req.query.days as string) || 30;
      const { startDate, endDate } = getDateRange(days);
      const [gsc, ga4] = await Promise.all([
        fetchGSCOverview(startDate, endDate),
        fetchGA4DailyTrend(startDate, endDate),
      ]);
      res.json({ data: { gsc, ga4 }, cached: false });
    } catch (error: unknown) {
      logger.error("[Analytics] Error fetching trends", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error obteniendo datos de trends" });
    }
  });

  // Manual sync trigger
  app.post("/api/admin/analytics/sync", requireAdminSession, async (_req, res) => {
    try {
      if (!isConfigured()) {
        return res.status(400).json({ message: "Google Analytics no esta configurado" });
      }
      await syncAllAnalytics();
      res.json({ success: true, message: "Sincronizacion completada" });
    } catch (error: unknown) {
      logger.error("[Analytics] Error during manual sync", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error durante la sincronizacion" });
    }
  });

  // Yield Management: revenue per boat hour
  // GET /api/admin/analytics/yield?from=2026-04-01&to=2026-10-31
  app.get("/api/admin/analytics/yield", requireAdminSession, async (req: Request, res) => {
    try {
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const tenantId = (req as AuthenticatedRequest).tenantId;

      // Validate date format if provided
      if (from && isNaN(Date.parse(from))) {
        return res.status(400).json({ message: "Parametro 'from' no es una fecha valida (YYYY-MM-DD)" });
      }
      if (to && isNaN(Date.parse(to))) {
        return res.status(400).json({ message: "Parametro 'to' no es una fecha valida (YYYY-MM-DD)" });
      }

      const data = await getYieldAnalytics(from, to, tenantId);
      res.json(data);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("[Analytics] Error fetching yield data", { error: errMsg });
      res.status(500).json({ message: "Error obteniendo datos de yield management" });
    }
  });
}
