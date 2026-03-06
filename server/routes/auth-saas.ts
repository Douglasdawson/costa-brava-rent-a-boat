import type { Express } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import { storage } from "../storage";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../services/emailService";
import type { AuthenticatedRequest, SaasJwtPayload, JwtPayload } from "../types";
import { logger } from "../lib/logger";
import {
  BCRYPT_ROUNDS,
  JWT_SECRET,
  loginAttempts,
  checkRateLimit,
  trackFailedAttempt,
  generateAccessToken,
  generateRefreshTokenString,
  resolveTenantFromRequest,
  requireSaasAuth,
  requireAdminSession,
} from "./auth-middleware";

// ===== SaaS Auth Schemas =====

const registerSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
  firstName: z.string().min(1, "Nombre requerido").max(100),
  lastName: z.string().min(1, "Apellido requerido").max(100),
  companyName: z.string().min(2, "Nombre de empresa requerido").max(200),
});

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "Contrasena requerida"),
  tenantSlug: z.string().optional(), // Optional: resolve from subdomain
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().optional().or(z.null()),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalido"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
});

// ===== SaaS Auth Route Registration =====

export function registerSaasAuthRoutes(app: Express) {

  // POST /api/auth/register - Create new account + tenant in trial
  app.post("/api/auth/register", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp, res)) return;

      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { email, password, firstName, lastName, companyName } = parsed.data;

      // Generate slug from company name
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 100);

      // Check if slug already exists
      const existingTenant = await storage.getTenantBySlug(slug);
      if (existingTenant) {
        return res.status(409).json({ message: "Ya existe una empresa con ese nombre" });
      }

      // Create tenant with 14-day trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const tenant = await storage.createTenant({
        name: companyName,
        slug,
        email: email.toLowerCase().trim(),
        plan: "starter",
        status: "trial",
        trialEndsAt,
      });

      // Hash password and create owner user
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await storage.createUser({
        tenantId: tenant.id,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "owner",
        firstName,
        lastName,
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, tenant.id, user.role, user.email);
      const refreshTokenStr = generateRefreshTokenString();
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);
      await storage.createRefreshToken(user.id, refreshTokenStr, refreshExpiresAt);

      loginAttempts.delete(clientIp);

      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, firstName, companyName, trialEndsAt).catch((err) =>
        logger.error("[Auth] Failed to send welcome email", { error: err instanceof Error ? err.message : String(err) })
      );

      res.status(201).json({
        success: true,
        accessToken,
        refreshToken: refreshTokenStr,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          status: tenant.status,
          trialEndsAt: tenant.trialEndsAt,
        },
        message: "Cuenta creada exitosamente",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Auth] Error al registrar", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // POST /api/auth/login - Email + password login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp, res)) return;

      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { email, password, tenantSlug } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();

      // Resolve tenant
      let tenantId: string | null = null;

      if (tenantSlug) {
        const tenant = await storage.getTenantBySlug(tenantSlug);
        if (!tenant) {
          return res.status(404).json({ message: "Empresa no encontrada" });
        }
        tenantId = tenant.id;
      } else {
        // Try to resolve from subdomain
        tenantId = await resolveTenantFromRequest(req);
      }

      if (!tenantId) {
        // If no tenant context, try to find user across all tenants
        // (single-tenant mode or user accessing without subdomain).
        const allTenants = await storage.getAllTenants();
        const matchingTenants: string[] = [];

        for (const t of allTenants) {
          const found = await storage.getUserByEmail(normalizedEmail, t.id);
          if (found) {
            matchingTenants.push(t.id);
          }
        }

        if (matchingTenants.length === 1) {
          tenantId = matchingTenants[0];
        } else if (matchingTenants.length > 1) {
          return res.status(400).json({
            message: "Este email pertenece a varias empresas. Indica tenantSlug para iniciar sesion.",
          });
        }
      }

      if (!tenantId) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "Email o contrasena incorrectos" });
      }

      const user = await storage.getUserByEmail(normalizedEmail, tenantId);
      if (!user || !user.isActive) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "Email o contrasena incorrectos" });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "Email o contrasena incorrectos" });
      }

      // Check tenant status
      const tenant = await storage.getTenant(tenantId);
      if (tenant && (tenant.status === "suspended" || tenant.status === "cancelled")) {
        return res.status(403).json({ message: "La cuenta de la empresa esta suspendida" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, tenantId, user.role, user.email);
      const refreshTokenStr = generateRefreshTokenString();
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);
      await storage.createRefreshToken(user.id, refreshTokenStr, refreshExpiresAt);

      loginAttempts.delete(clientIp);

      res.json({
        success: true,
        accessToken,
        refreshToken: refreshTokenStr,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          status: tenant.status,
          logo: tenant.logo,
          primaryColor: tenant.primaryColor,
          trialEndsAt: tenant.trialEndsAt,
        } : null,
        message: "Login exitoso",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Auth] Error durante login", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // POST /api/auth/logout - Invalidate tokens
  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Blacklist access token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const decoded = jwt.decode(token) as JwtPayload | null;
        const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        await storage.blacklistToken(token, expiresAt);
        await storage.deleteAdminSession(token);
      }

      // Delete refresh token
      const { refreshToken } = req.body;
      if (refreshToken) {
        await storage.deleteRefreshToken(refreshToken);
      }

      res.json({ success: true, message: "Sesion cerrada correctamente" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Auth] Error al cerrar sesion", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // POST /api/auth/refresh-token - Get new access token
  app.post("/api/auth/refresh-token", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token requerido" });
      }

      const storedToken = await storage.getRefreshToken(refreshToken);
      if (!storedToken) {
        return res.status(401).json({ message: "Refresh token invalido" });
      }

      if (storedToken.expiresAt < new Date()) {
        await storage.deleteRefreshToken(refreshToken);
        return res.status(401).json({ message: "Refresh token expirado" });
      }

      const user = await storage.getUserById(storedToken.userId);
      if (!user || !user.isActive) {
        await storage.deleteRefreshToken(refreshToken);
        return res.status(401).json({ message: "Usuario no encontrado o inactivo" });
      }

      // Delete old refresh token and create new one (token rotation)
      await storage.deleteRefreshToken(refreshToken);
      const newRefreshTokenStr = generateRefreshTokenString();
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);
      await storage.createRefreshToken(user.id, newRefreshTokenStr, refreshExpiresAt);

      const accessToken = generateAccessToken(user.id, user.tenantId, user.role, user.email);

      res.json({
        success: true,
        accessToken,
        refreshToken: newRefreshTokenStr,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Auth] Error al refrescar token", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // GET /api/auth/me - Current user with tenant info
  app.get("/api/auth/me", requireSaasAuth, async (req, res) => {
    try {
      const saasUser = (req as AuthenticatedRequest).saasUser as SaasJwtPayload;
      const user = await storage.getUserById(saasUser.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const tenant = await storage.getTenant(user.tenantId);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          status: tenant.status,
          logo: tenant.logo,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          trialEndsAt: tenant.trialEndsAt,
        } : null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Auth] Error al obtener perfil", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // PATCH /api/auth/profile - Update user profile
  app.patch("/api/auth/profile", requireSaasAuth, async (req, res) => {
    try {
      const saasUser = (req as AuthenticatedRequest).saasUser as SaasJwtPayload;
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const updated = await storage.updateUser(saasUser.userId, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({
        success: true,
        user: {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          role: updated.role,
          avatarUrl: updated.avatarUrl,
        },
        message: "Perfil actualizado",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Auth] Error al actualizar perfil", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // POST /api/auth/forgot-password - Request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const normalizedEmail = parsed.data.email.toLowerCase().trim();

      // Find user across all tenants
      const allTenants = await storage.getAllTenants();
      let foundUser = null;

      for (const t of allTenants) {
        const user = await storage.getUserByEmail(normalizedEmail, t.id);
        if (user) {
          foundUser = user;
          break;
        }
      }

      // Always return success to prevent email enumeration
      if (!foundUser) {
        return res.json({
          success: true,
          message: "Si el email existe, recibiras instrucciones para restablecer tu contrasena",
        });
      }

      // Generate reset token (expires in 1 hour)
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await storage.createPasswordResetToken(foundUser.id, resetToken, expiresAt);

      const configuredResetUrl = process.env.AUTH_RESET_URL_BASE;
      const defaultResetUrl = `${req.protocol}://${req.get("host")}/reset-password`;
      const resetBaseUrl = (configuredResetUrl || defaultResetUrl).replace(/\/$/, "");
      const joiner = resetBaseUrl.includes("?") ? "&" : "?";
      const resetUrl = `${resetBaseUrl}${joiner}token=${encodeURIComponent(resetToken)}`;

      await sendPasswordResetEmail(
        normalizedEmail,
        foundUser.firstName || "cliente",
        resetUrl,
      );

      if (process.env.NODE_ENV === "development") {
        logger.debug("Password reset token generated", { email: normalizedEmail, resetToken });
      }

      res.json({
        success: true,
        message: "Si el email existe, recibiras instrucciones para restablecer tu contrasena",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Auth] Error al solicitar restablecimiento", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // POST /api/auth/reset-password - Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { token, password } = parsed.data;

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Token invalido o ya utilizado" });
      }

      if (resetToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Token expirado" });
      }

      // Update password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await storage.updateUser(resetToken.userId, { passwordHash });

      // Mark token as used
      await storage.markPasswordResetTokenUsed(token);

      // Invalidate all existing refresh tokens for security
      await storage.deleteUserRefreshTokens(resetToken.userId);

      res.json({
        success: true,
        message: "Contrasena restablecida exitosamente",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Auth] Error al restablecer contrasena", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // POST /api/auth/migrate-admin-users - Migrate legacy admin_users to new users table
  app.post("/api/auth/migrate-admin-users", requireAdminSession, async (req, res) => {
    try {
      const { tenantId } = req.body;
      if (!tenantId) {
        const defaultTenant = await storage.seedDefaultTenant();
        const result = await storage.migrateAdminUsersToUsers(defaultTenant.id);
        return res.json({ success: true, ...result, message: "Migracion completada" });
      }

      const result = await storage.migrateAdminUsersToUsers(tenantId);
      res.json({ success: true, ...result, message: "Migracion completada" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Auth] Error al migrar usuarios", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
