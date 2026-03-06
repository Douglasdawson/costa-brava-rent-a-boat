import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireSuperAdmin } from "./auth";
import { logger } from "../lib/logger";

const PLAN_PRICES: Record<string, number> = {
  starter: 49,
  pro: 99,
  enterprise: 199,
};

const updateTenantAdminSchema = z.object({
  status: z.enum(["trial", "active", "suspended", "cancelled"]).optional(),
  plan: z.enum(["starter", "pro", "enterprise"]).optional(),
});

export function registerSuperAdminRoutes(app: Express) {
  // GET /api/superadmin/stats - Global platform metrics
  app.get("/api/superadmin/stats", requireSuperAdmin, async (_req: Request, res: Response) => {
    try {
      const allTenants = await storage.getAllTenants();

      const byStatus = { trial: 0, active: 0, suspended: 0, cancelled: 0 };
      const byPlan = { starter: 0, pro: 0, enterprise: 0 };
      let mrrEstimate = 0;

      for (const t of allTenants) {
        const statusKey = t.status as keyof typeof byStatus;
        if (statusKey in byStatus) byStatus[statusKey]++;

        const planKey = t.plan as keyof typeof byPlan;
        if (planKey in byPlan) byPlan[planKey]++;

        if (t.status === "active") {
          mrrEstimate += PLAN_PRICES[t.plan] || 0;
        }
      }

      res.json({
        totalTenants: allTenants.length,
        byStatus,
        byPlan,
        mrrEstimate,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[SuperAdmin] Error fetching stats", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // GET /api/superadmin/tenants - All tenants list
  app.get("/api/superadmin/tenants", requireSuperAdmin, async (_req: Request, res: Response) => {
    try {
      const allTenants = await storage.getAllTenants();

      // Get user counts per tenant in parallel
      const tenantsWithCounts = await Promise.all(
        allTenants.map(async (t) => {
          const users = await storage.getUsersByTenant(t.id);
          return {
            id: t.id,
            name: t.name,
            slug: t.slug,
            email: t.email,
            plan: t.plan,
            status: t.status,
            trialEndsAt: t.trialEndsAt,
            createdAt: t.createdAt,
            usersCount: users.length,
          };
        })
      );

      // Sort by creation date (newest first)
      tenantsWithCounts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json(tenantsWithCounts);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[SuperAdmin] Error fetching tenants", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // PATCH /api/superadmin/tenants/:id - Update tenant status or plan
  app.patch("/api/superadmin/tenants/:id", requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const parsed = updateTenantAdminSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const existing = await storage.getTenant(id);
      if (!existing) {
        return res.status(404).json({ message: "Tenant no encontrado" });
      }

      const updated = await storage.updateTenant(id, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Tenant no encontrado" });
      }

      res.json({ tenant: updated, message: "Tenant actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[SuperAdmin] Error updating tenant", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
