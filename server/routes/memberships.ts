import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAdminSession } from "./auth";
import { logger } from "../lib/logger";
import * as membershipRepo from "../storage/memberships";
import { insertMembershipSchema, updateMembershipSchema } from "@shared/schema";

// Strict rate limit to prevent email enumeration
const membershipCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { active: false, error: "Demasiadas solicitudes" },
});

export function registerMembershipRoutes(app: Express) {
  // ===== PUBLIC ENDPOINTS =====

  /**
   * Check if an email has an active membership.
   * Returns minimal discount info only — no PII exposed.
   * Used during booking flow to auto-apply member discounts.
   */
  app.get("/api/memberships/check", membershipCheckLimiter, async (req, res) => {
    try {
      const emailSchema = z.object({
        email: z.string().email("Email invalido"),
      });

      const parsed = emailSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          active: false,
          error: "Email requerido y debe ser valido",
        });
      }

      const membership = await membershipRepo.getMembershipByEmail(parsed.data.email);

      if (!membership) {
        return res.json({ active: false });
      }

      // Only return what the booking flow needs — no PII, no internal IDs
      res.json({
        active: true,
        discountPercent: membership.discountPercent,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[Memberships] Error checking membership", { error: message });
      res.status(500).json({
        active: false,
        error: "Error al verificar la membresia",
      });
    }
  });

  // ===== ADMIN ENDPOINTS =====

  /**
   * List all memberships (admin).
   */
  app.get("/api/admin/memberships", requireAdminSession, async (_req, res) => {
    try {
      const all = await membershipRepo.getAllMemberships();
      res.json(all);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[Memberships] Error listing memberships", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * Get membership KPI stats (admin).
   */
  app.get("/api/admin/memberships/stats", requireAdminSession, async (_req, res) => {
    try {
      const stats = await membershipRepo.getMembershipStats();
      res.json(stats);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[Memberships] Error fetching membership stats", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * Create a new membership (admin).
   */
  app.post("/api/admin/memberships", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertMembershipSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      // Check for existing active membership for this email
      const existing = await membershipRepo.getMembershipByEmail(parsed.data.customerEmail);
      if (existing) {
        return res.status(409).json({
          message: "Este email ya tiene una membresia activa",
          existingMembership: {
            id: existing.id,
            plan: existing.plan,
            endDate: existing.endDate.toISOString(),
          },
        });
      }

      const membership = await membershipRepo.createMembership(parsed.data);

      logger.info("[Memberships] Membership created", {
        membershipId: membership.id,
        email: membership.customerEmail,
        plan: membership.plan,
        price: membership.price,
      });

      res.json({
        success: true,
        membership,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[Memberships] Error creating membership", { error: message });
      res.status(500).json({ message: "Error al crear la membresia" });
    }
  });

  /**
   * Update a membership (admin).
   */
  app.put("/api/admin/memberships/:id", requireAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }

      const parsed = updateMembershipSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const existing = await membershipRepo.getMembershipById(id);
      if (!existing) {
        return res.status(404).json({ message: "Membresia no encontrada" });
      }

      const updated = await membershipRepo.updateMembership(id, parsed.data);

      logger.info("[Memberships] Membership updated", {
        membershipId: id,
        updates: Object.keys(parsed.data),
      });

      res.json({
        success: true,
        membership: updated,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[Memberships] Error updating membership", { error: message });
      res.status(500).json({ message: "Error al actualizar la membresia" });
    }
  });

  /**
   * Deduct free hours from a membership (admin).
   * Typically called when a member uses their free hour benefit.
   */
  app.post("/api/admin/memberships/:id/deduct-hours", requireAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }

      const hoursSchema = z.object({
        hours: z.number().positive("Las horas deben ser positivas").max(8, "Maximo 8 horas"),
      });

      const parsed = hoursSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const updated = await membershipRepo.deductFreeHours(id, parsed.data.hours);
      if (!updated) {
        return res.status(400).json({
          message: "No se pueden deducir las horas: membresia no encontrada o horas insuficientes",
        });
      }

      logger.info("[Memberships] Free hours deducted", {
        membershipId: id,
        hoursDeducted: parsed.data.hours,
        remaining: updated.freeHoursRemaining,
      });

      res.json({
        success: true,
        membership: updated,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[Memberships] Error deducting free hours", { error: message });
      res.status(500).json({ message: "Error al deducir horas gratuitas" });
    }
  });
}
