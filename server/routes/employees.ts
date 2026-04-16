import type { Express } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import { storage } from "../storage";
import { requireAdminSession, requireOwner } from "./auth";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";
import { ASSIGNABLE_TABS } from "@shared/schema";

const BCRYPT_ROUNDS = 10;

const createEmployeeSchema = z.object({
  username: z.string().min(1, "Usuario requerido").max(50),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres").max(128),
  displayName: z.string().max(100).optional(),
  role: z.enum(["admin", "employee"]).optional(),
  pin: z.string().regex(/^\d{6}$/, "El PIN debe ser exactamente 6 digitos numericos").optional(),
  allowedTabs: z.array(z.string()).optional(),
});

const updateEmployeeSchema = z.object({
  displayName: z.string().max(100).optional(),
  role: z.enum(["admin", "employee"]).optional(),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres").max(128).optional(),
  isActive: z.boolean().optional(),
  pin: z.string().regex(/^\d{6}$/, "El PIN debe ser exactamente 6 digitos numericos").optional().nullable(),
  allowedTabs: z.array(z.string()).optional(),
});

async function isPinTaken(pin: string, excludeUserId?: string): Promise<boolean> {
  // Check against owner PIN
  const adminPin = process.env.ADMIN_PIN;
  if (adminPin && adminPin.length === pin.length &&
      crypto.timingSafeEqual(Buffer.from(pin), Buffer.from(adminPin))) return true;

  // Check against other users' PINs
  const usersWithPin = await storage.getAdminUsersWithPin();
  for (const user of usersWithPin) {
    if (excludeUserId && user.id === excludeUserId) continue;
    if (user.pin && await bcrypt.compare(pin, user.pin)) return true;
  }
  return false;
}

export function registerEmployeeRoutes(app: Express) {
  // List all employees (admin only)
  app.get("/api/admin/employees", requireAdminSession, requireOwner, async (_req, res) => {
    try {
      const employees = await storage.getAllAdminUsers();
      // Remove password hashes and PIN hashes from response, indicate if PIN is set
      const sanitized = employees.map(({ passwordHash, pin, ...rest }) => ({
        ...rest,
        hasPin: !!pin,
      }));
      res.json(sanitized);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Employees] Error fetching employees", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Check PIN uniqueness
  app.get("/api/admin/employees/check-pin/:pin", requireAdminSession, requireOwner, async (req, res) => {
    try {
      const { pin } = req.params;
      if (!/^\d{6}$/.test(pin)) {
        return res.status(400).json({ message: "PIN debe ser 6 digitos" });
      }
      const excludeUserId = req.query.excludeUserId as string | undefined;
      const taken = await isPinTaken(pin, excludeUserId);
      res.json({ available: !taken });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Employees] Error checking PIN", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Create employee (admin only)
  app.post("/api/admin/employees", requireAdminSession, requireOwner, async (req, res) => {
    try {
      const parsed = createEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { username, password, displayName, role, pin, allowedTabs } = parsed.data;

      // Check if username already exists
      const existing = await storage.getAdminUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "El nombre de usuario ya existe" });
      }

      // Validate and hash PIN if provided
      let pinHash: string | undefined;
      if (pin) {
        if (await isPinTaken(pin)) {
          return res.status(409).json({ message: "Este PIN ya esta en uso" });
        }
        pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
      }

      // Validate allowedTabs
      const validTabs = allowedTabs?.filter(t => (ASSIGNABLE_TABS as readonly string[]).includes(t)) || [];

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const employee = await storage.createAdminUser({
        username,
        passwordHash,
        displayName: displayName || username,
        role: role === "admin" ? "admin" : "employee",
        pin: pinHash,
        allowedTabs: validTabs,
      });

      const { passwordHash: _, pin: _pin, ...sanitized } = employee;
      res.status(201).json({ ...sanitized, hasPin: !!pinHash });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Employees] Error creating employee", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update employee (admin only)
  app.patch("/api/admin/employees/:id", requireAdminSession, requireOwner, async (req, res) => {
    try {
      const { id } = req.params;

      const parsed = updateEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { displayName, role, password, isActive, pin, allowedTabs } = parsed.data;

      const existing = await storage.getAdminUser(id);
      if (!existing) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      const updates: Record<string, unknown> = {};
      if (displayName !== undefined) updates.displayName = displayName;
      if (role !== undefined) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;
      if (password) {
        updates.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      }

      // Handle PIN update
      if (pin !== undefined) {
        if (pin === null) {
          updates.pin = null; // Remove PIN
        } else {
          if (await isPinTaken(pin, id)) {
            return res.status(409).json({ message: "Este PIN ya esta en uso" });
          }
          updates.pin = await bcrypt.hash(pin, BCRYPT_ROUNDS);
        }
      }

      // Handle allowedTabs
      if (allowedTabs !== undefined) {
        updates.allowedTabs = allowedTabs.filter(t => (ASSIGNABLE_TABS as readonly string[]).includes(t));
      }

      const updated = await storage.updateAdminUser(id, updates);
      if (!updated) {
        return res.status(500).json({ message: "Error actualizando empleado" });
      }

      if (role !== undefined && role !== existing.role) {
        audit(req, "role_change", "employee", id, { oldRole: existing.role, newRole: role });
      }

      const { passwordHash: _, pin: _pin, ...sanitized } = updated;
      res.json({ ...sanitized, hasPin: !!updated.pin });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Employees] Error updating employee", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Deactivate employee (admin only)
  app.delete("/api/admin/employees/:id", requireAdminSession, requireOwner, async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await storage.getAdminUser(id);
      if (!existing) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      await storage.updateAdminUser(id, { isActive: false });
      audit(req, "deactivate", "employee", id, { username: existing.username });
      res.json({ message: "Empleado desactivado correctamente" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Employees] Error deactivating employee", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
