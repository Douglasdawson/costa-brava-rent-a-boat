import type { Express } from "express";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { requireAdminSession, requireAdminRole } from "./auth";

const BCRYPT_ROUNDS = 10;

export function registerEmployeeRoutes(app: Express) {
  // List all employees (admin only)
  app.get("/api/admin/employees", requireAdminSession, requireAdminRole, async (_req, res) => {
    try {
      const employees = await storage.getAllAdminUsers();
      // Remove password hashes from response
      const sanitized = employees.map(({ passwordHash, ...rest }) => rest);
      res.json(sanitized);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching employees: " + message });
    }
  });

  // Create employee (admin only)
  app.post("/api/admin/employees", requireAdminSession, requireAdminRole, async (req, res) => {
    try {
      const { username, password, displayName, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña requeridos" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      }

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
      res.status(500).json({ message: "Error creating employee: " + message });
    }
  });

  // Update employee (admin only)
  app.patch("/api/admin/employees/:id", requireAdminSession, requireAdminRole, async (req, res) => {
    try {
      const { id } = req.params;
      const { displayName, role, password, isActive } = req.body;

      const existing = await storage.getAdminUser(id);
      if (!existing) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      const updates: Record<string, unknown> = {};
      if (displayName !== undefined) updates.displayName = displayName;
      if (role !== undefined) updates.role = role === "admin" ? "admin" : "employee";
      if (isActive !== undefined) updates.isActive = isActive;
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
        }
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
      res.status(500).json({ message: "Error updating employee: " + message });
    }
  });

  // Deactivate employee (admin only)
  app.delete("/api/admin/employees/:id", requireAdminSession, requireAdminRole, async (req, res) => {
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
      res.status(500).json({ message: "Error deactivating employee: " + message });
    }
  });
}
