import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAdminSession, requireTabAccess } from "./auth";
import { logger } from "../lib/logger";

const adminStatsQuerySchema = z.object({
  period: z.enum(["today", "week", "month", "season", "year"]).optional().default("today"),
});

const revenueTrendQuerySchema = z.object({
  period: z.enum(["30d", "90d", "365d"]).optional().default("30d"),
});

const boatsPerformanceQuerySchema = z.object({
  period: z.enum(["month", "season", "year"]).optional().default("month"),
});

const statusDistributionQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export function registerAdminStatsRoutes(app: Express) {
  // ===== DASHBOARD STATS =====

  app.get("/api/admin/stats", requireAdminSession, requireTabAccess("reports"), async (req, res) => {
    try {
      const queryParsed = adminStatsQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const { period } = queryParsed.data;

      const now = new Date();
      let startDate = new Date(now);
      let endDate = new Date(now);

      if (period === "today") {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === "week") {
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === "month") {
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === "season") {
        // Season: April 1 to October 31 of current year
        startDate = new Date(now.getFullYear(), 3, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const stats = await storage.getDashboardStatsEnhanced(startDate, endDate);
      const fleet = await storage.getFleetAvailability();

      res.json({
        ...stats,
        ...fleet,
        period,
      });
    } catch (error: unknown) {
      logger.error("[Admin] Error fetching dashboard stats", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Revenue trend for charts
  app.get("/api/admin/stats/revenue-trend", requireAdminSession, requireTabAccess("reports"), async (req, res) => {
    try {
      const queryParsed = revenueTrendQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }
      const trend = await storage.getRevenueTrend(queryParsed.data.period);
      res.json(trend);
    } catch (error: unknown) {
      logger.error("[Admin] Error fetching revenue trend", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Boats performance comparison
  app.get("/api/admin/stats/boats-performance", requireAdminSession, requireTabAccess("reports"), async (req, res) => {
    try {
      const queryParsed = boatsPerformanceQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }
      const performance = await storage.getBoatsPerformance(queryParsed.data.period);
      res.json(performance);
    } catch (error: unknown) {
      logger.error("[Admin] Error fetching boats performance", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Status distribution
  app.get("/api/admin/stats/status-distribution", requireAdminSession, requireTabAccess("reports"), async (req, res) => {
    try {
      const queryParsed = statusDistributionQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const now = new Date();
      const startDate = queryParsed.data.startDate || new Date(now.getFullYear(), 0, 1);
      const endDate = queryParsed.data.endDate || now;

      const distribution = await storage.getStatusDistribution(startDate, endDate);
      res.json(distribution);
    } catch (error: unknown) {
      logger.error("[Admin] Error fetching status distribution", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== REPORTS =====

  app.get("/api/admin/reports/fleet-utilization", requireAdminSession, requireTabAccess("reports"), async (req, res) => {
    try {
      const period = (req.query.period as string) || "season";
      const performance = await storage.getBoatsPerformance(period as "month" | "season" | "year");
      const maintenanceLogs = await storage.getMaintenanceLogs();
      const maintenanceCosts = new Map<string, number>();
      for (const log of maintenanceLogs) {
        const cost = parseFloat(log.cost || "0");
        maintenanceCosts.set(log.boatId, (maintenanceCosts.get(log.boatId) || 0) + cost);
      }

      const data = performance.map(boat => ({
        ...boat,
        maintenanceCost: Math.round((maintenanceCosts.get(boat.boatId) || 0) * 100) / 100,
        netRevenue: Math.round((boat.revenue - (maintenanceCosts.get(boat.boatId) || 0)) * 100) / 100,
      }));

      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error generating fleet report", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/reports/maintenance-summary", requireAdminSession, requireTabAccess("reports"), async (req, res) => {
    try {
      const logs = await storage.getMaintenanceLogs();
      const completed = logs.filter(l => l.status === "completed");
      const scheduled = logs.filter(l => l.status === "scheduled");
      const inProgress = logs.filter(l => l.status === "in_progress");
      const totalCost = completed.reduce((sum, l) => sum + parseFloat(l.cost || "0"), 0);
      const byType = {
        preventive: logs.filter(l => l.type === "preventive").length,
        corrective: logs.filter(l => l.type === "corrective").length,
        inspection: logs.filter(l => l.type === "inspection").length,
      };

      res.json({
        total: logs.length,
        completed: completed.length,
        scheduled: scheduled.length,
        inProgress: inProgress.length,
        totalCost: Math.round(totalCost * 100) / 100,
        byType,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error generating maintenance report", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/reports/top-customers", requireAdminSession, requireTabAccess("reports"), async (req, res) => {
    try {
      const result = await storage.getPaginatedCrmCustomers({
        page: 1,
        limit: 20,
        sortBy: "totalSpent",
        sortOrder: "desc",
      });
      res.json(result.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching top customers", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
