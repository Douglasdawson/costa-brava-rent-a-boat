import type { Express } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "../storage";
import { requireAdminSession, requireOwner } from "./auth";
import { logger } from "../lib/logger";

const BCRYPT_ROUNDS = 10;

const createEmployeeSchema = z.object({
  username: z.string().min(1, "Usuario requerido").max(50),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres").max(128),
  displayName: z.string().max(100).optional(),
  role: z.enum(["admin", "employee"]).optional(),
});

const updateEmployeeSchema = z.object({
  displayName: z.string().max(100).optional(),
  role: z.enum(["admin", "employee"]).optional(),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres").max(128).optional(),
  isActive: z.boolean().optional(),
});

export function registerEmployeeRoutes(app: Express) {
  // List all employees (admin only)
  app.get("/api/admin/employees", requireAdminSession, requireOwner, async (_req, res) => {
    try {
      const employees = await storage.getAllAdminUsers();
      // Remove password hashes from response
      const sanitized = employees.map(({ passwordHash, ...rest }) => rest);
      res.json(sanitized);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Employees] Error fetching employees", { error: message });
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

      const { username, password, displayName, role } = parsed.data;

      // Check if username already exists
      const existing = await storage.getAdminUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "El nombre de usuario ya existe" });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const employee = await storage.createAdminUser({
        username,
        passwordHash,
        displayName: displayName || username,
        role: role === "admin" ? "admin" : "employee",
      });

      const { passwordHash: _, ...sanitized } = employee;
      res.status(201).json(sanitized);
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

      const { displayName, role, password, isActive } = parsed.data;

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

      const updated = await storage.updateAdminUser(id, updates);
      if (!updated) {
        return res.status(500).json({ message: "Error actualizando empleado" });
      }

      const { passwordHash: _, ...sanitized } = updated;
      res.json(sanitized);
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
      res.json({ message: "Empleado desactivado correctamente" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Employees] Error deactivating employee", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
