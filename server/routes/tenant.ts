import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "../storage";
import { requireSaasAuth } from "./auth";

const BCRYPT_ROUNDS = 10;

const updateTenantSettingsSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  email: z.string().email("Email invalido").optional().or(z.null()),
  phone: z.string().max(30).optional().or(z.null()),
  address: z.string().max(300).optional().or(z.null()),
  logo: z.string().optional().or(z.null()),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex invalido (ej: #0077B6)").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex invalido").optional(),
  settings: z.object({
    timezone: z.string(),
    currency: z.string(),
    languages: z.array(z.string()),
  }).partial().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres"),
  firstName: z.string().min(1, "Nombre requerido").max(100),
  lastName: z.string().min(1, "Apellido requerido").max(100),
  role: z.enum(["admin", "employee"]),
});

const updateMemberSchema = z.object({
  role: z.enum(["admin", "employee"]).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

export function registerTenantRoutes(app: Express) {
  // GET /api/tenant/settings - Get own tenant info
  app.get("/api/tenant/settings", requireSaasAuth, async (req: Request, res: Response) => {
    try {
      const saasUser = (req as any).saasUser;
      const tenant = await storage.getTenant(saasUser.tenantId);
      if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
      res.json({ tenant });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      res.status(500).json({ message });
    }
  });

  // PATCH /api/tenant/settings - Update tenant settings (owner only)
  app.patch("/api/tenant/settings", requireSaasAuth, async (req: Request, res: Response) => {
    try {
      const saasUser = (req as any).saasUser;
      if (saasUser.role !== "owner") {
        return res.status(403).json({ message: "Solo el propietario puede modificar la configuracion" });
      }

      const parsed = updateTenantSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const tenant = await storage.updateTenant(saasUser.tenantId, parsed.data);
      if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });

      res.json({ tenant, message: "Configuracion actualizada" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      res.status(500).json({ message });
    }
  });

  // GET /api/tenant/users - List users of the tenant (owner or admin)
  app.get("/api/tenant/users", requireSaasAuth, async (req: Request, res: Response) => {
    try {
      const saasUser = (req as any).saasUser;
      if (saasUser.role !== "owner" && saasUser.role !== "admin") {
        return res.status(403).json({ message: "Sin permisos" });
      }

      const tenantUsers = await storage.getUsersByTenant(saasUser.tenantId);
      const safeUsers = tenantUsers.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      }));

      res.json(safeUsers);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      res.status(500).json({ message });
    }
  });

  // POST /api/tenant/users - Create new team member (owner only)
  app.post("/api/tenant/users", requireSaasAuth, async (req: Request, res: Response) => {
    try {
      const saasUser = (req as any).saasUser;
      if (saasUser.role !== "owner") {
        return res.status(403).json({ message: "Solo el propietario puede invitar usuarios" });
      }

      const parsed = inviteUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { email, password, firstName, lastName, role } = parsed.data;

      const existing = await storage.getUserByEmail(email.toLowerCase().trim(), saasUser.tenantId);
      if (existing) {
        return res.status(409).json({ message: "Ya existe un usuario con ese email en tu empresa" });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await storage.createUser({
        tenantId: saasUser.tenantId,
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        firstName,
        lastName,
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        message: "Usuario creado correctamente",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      res.status(500).json({ message });
    }
  });

  // PATCH /api/tenant/users/:id - Update team member role / status (owner only)
  app.patch("/api/tenant/users/:id", requireSaasAuth, async (req: Request, res: Response) => {
    try {
      const saasUser = (req as any).saasUser;
      if (saasUser.role !== "owner") {
        return res.status(403).json({ message: "Solo el propietario puede modificar usuarios" });
      }

      const { id } = req.params;

      if (id === saasUser.userId) {
        return res.status(400).json({ message: "No puedes modificar tu propio usuario desde aqui" });
      }

      const targetUser = await storage.getUserById(id);
      if (!targetUser || targetUser.tenantId !== saasUser.tenantId) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (targetUser.role === "owner") {
        return res.status(403).json({ message: "No se puede modificar al propietario" });
      }

      const parsed = updateMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const updated = await storage.updateUser(id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });

      res.json({
        user: {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          role: updated.role,
          isActive: updated.isActive,
        },
        message: "Usuario actualizado",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      res.status(500).json({ message });
    }
  });
}
