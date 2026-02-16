import type { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertTenantSchema } from "@shared/schema";

const BCRYPT_ROUNDS = 10;

const updateCustomerProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phonePrefix: z.string().max(10).optional(),
  phoneNumber: z.string().max(20).optional(),
  nationality: z.string().max(50).optional(),
  preferredLanguage: z.string().max(10).optional(),
});

// ===== SaaS Auth Schemas =====

const registerSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  firstName: z.string().min(1, "Nombre requerido").max(100),
  lastName: z.string().min(1, "Apellido requerido").max(100),
  companyName: z.string().min(2, "Nombre de empresa requerido").max(200),
});

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "Contraseña requerida"),
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
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

// JWT secret - MUST be set via environment variable. No fallback allowed.
if (!process.env.JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable is not set. " +
    "The server cannot start without a secure JWT secret. " +
    "Set JWT_SECRET in your environment variables before starting the server."
  );
}
const JWT_SECRET: string = process.env.JWT_SECRET;

// ===== JWT Payload Interfaces =====

// Legacy admin JWT payload (backward compat)
interface AdminJwtPayload {
  userId: string;
  role: string;
  username: string;
  iat?: number;
  exp?: number;
}

// New SaaS JWT payload with tenantId
interface SaasJwtPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Union type for any JWT payload
type JwtPayload = AdminJwtPayload | SaasJwtPayload;

// Token metadata for session tracking (not used for auth verification)
interface TokenMeta {
  createdAt: number;
  role: string;
  username: string;
  userId: string;
}

// In-memory store for active session tracking
const activeSessions = new Map<string, TokenMeta>();

// Blacklisted tokens (logged out before expiry)
const blacklistedTokens = new Set<string>();

// Clean expired sessions and blacklisted tokens periodically
setInterval(() => {
  const sessionEntries = Array.from(activeSessions.entries());
  for (const [token] of sessionEntries) {
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      activeSessions.delete(token);
    }
  }
  const blacklistEntries = Array.from(blacklistedTokens);
  for (const token of blacklistEntries) {
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      blacklistedTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);

// Clean expired refresh tokens every 6 hours
setInterval(async () => {
  try {
    await storage.cleanupExpiredRefreshTokens();
  } catch {
    // Silent cleanup failure
  }
}, 6 * 60 * 60 * 1000);

// ===== Token Generation =====

// Legacy admin token (backward compat)
export function generateAdminToken(role: string = "admin", username: string = "admin", userId: string = "owner"): string {
  const token = jwt.sign(
    { userId, role, username } as AdminJwtPayload,
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  activeSessions.set(token, {
    createdAt: Date.now(),
    role,
    username,
    userId,
  });

  return token;
}

// New SaaS access token with tenantId
function generateAccessToken(userId: string, tenantId: string, role: string, email: string): string {
  return jwt.sign(
    { userId, tenantId, role, email } as SaasJwtPayload,
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// Generate a cryptographically secure refresh token
function generateRefreshTokenString(): string {
  return crypto.randomBytes(64).toString("hex");
}

// ===== Helpers =====

function getTokenData(req: Request): JwtPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  if (blacklistedTokens.has(token)) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Detect tenant from request (subdomain or header)
async function resolveTenantFromRequest(req: Request): Promise<string | null> {
  // 1. Check X-Tenant-Slug header (for API clients)
  const headerSlug = req.headers["x-tenant-slug"] as string | undefined;
  if (headerSlug) {
    const tenant = await storage.getTenantBySlug(headerSlug);
    return tenant?.id || null;
  }

  // 2. Check subdomain: empresa.nauticflow.app
  const host = req.hostname;
  if (host && host.includes(".")) {
    const parts = host.split(".");
    // Skip www, localhost, and IP addresses
    if (parts.length >= 2 && parts[0] !== "www" && !host.match(/^\d/)) {
      const subdomain = parts[0];
      const tenant = await storage.getTenantBySlug(subdomain);
      if (tenant) return tenant.id;
    }
  }

  // 3. Check custom domain
  if (host) {
    const allTenants = await storage.getAllTenants();
    const match = allTenants.find(t => t.domain === host);
    if (match) return match.id;
  }

  return null;
}

// ===== Middleware =====

// Admin session middleware - verifies JWT signature and expiry (supports both legacy and SaaS tokens)
export const requireAdminSession = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = authHeader.substring(7);

  if (blacklistedTokens.has(token)) {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).adminUser = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      activeSessions.delete(token);
      return res.status(401).json({ message: "Token expirado" });
    }
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
};

// SaaS auth middleware - requires SaaS JWT with tenantId
export const requireSaasAuth = (req: Request, res: Response, next: NextFunction) => {
  const tokenData = getTokenData(req);
  if (!tokenData || !("tenantId" in tokenData)) {
    return res.status(401).json({ message: "No autorizado" });
  }
  (req as any).saasUser = tokenData;
  next();
};

// Admin role middleware
export const requireAdminRole = (req: Request, res: Response, next: NextFunction) => {
  const tokenData = getTokenData(req);
  if (!tokenData) {
    return res.status(401).json({ message: "No autorizado" });
  }
  const role = "role" in tokenData ? tokenData.role : "";
  if (role !== "admin" && role !== "owner") {
    return res.status(403).json({ message: "Se requiere rol de administrador" });
  }
  next();
};

// Owner middleware - PIN login (Ivan) or SaaS owner
export const requireOwner = (req: Request, res: Response, next: NextFunction) => {
  const tokenData = getTokenData(req);
  if (!tokenData) {
    return res.status(401).json({ message: "No autorizado" });
  }
  // Legacy: check username
  if ("username" in tokenData && tokenData.username === "ivan") {
    return next();
  }
  // SaaS: check owner role
  if ("tenantId" in tokenData && tokenData.role === "owner") {
    return next();
  }
  return res.status(403).json({ message: "Solo el propietario puede realizar esta accion" });
};

// Tenant middleware - injects tenantId from JWT or subdomain
export const injectTenantId = async (req: Request, res: Response, next: NextFunction) => {
  // First try from JWT
  const tokenData = getTokenData(req);
  if (tokenData && "tenantId" in tokenData) {
    (req as any).tenantId = tokenData.tenantId;
    return next();
  }

  // Then try from subdomain/header
  const tenantId = await resolveTenantFromRequest(req);
  if (tenantId) {
    (req as any).tenantId = tenantId;
    return next();
  }

  return res.status(400).json({ message: "No se pudo determinar el tenant" });
};

// ===== Rate Limiting =====

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(clientIp: string, res: Response): boolean {
  const attempts = loginAttempts.get(clientIp);
  if (attempts) {
    if (Date.now() - attempts.firstAttempt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(clientIp);
    } else if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      res.status(429).json({
        message: "Demasiados intentos. Intenta de nuevo en 15 minutos.",
      });
      return false;
    }
  }
  return true;
}

function trackFailedAttempt(clientIp: string) {
  const current = loginAttempts.get(clientIp);
  if (current) {
    current.count++;
  } else {
    loginAttempts.set(clientIp, { count: 1, firstAttempt: Date.now() });
  }
}

// ===== Route Registration =====

export function registerAuthRoutes(app: Express) {

  // =============================================
  // NEW SAAS AUTH ENDPOINTS
  // =============================================

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
      res.status(500).json({ message: "Error al registrar: " + message });
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
        // (single-tenant mode or user accessing without subdomain)
        const allTenants = await storage.getAllTenants();
        for (const t of allTenants) {
          const found = await storage.getUserByEmail(normalizedEmail, t.id);
          if (found) {
            tenantId = t.id;
            break;
          }
        }
      }

      if (!tenantId) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "Email o contraseña incorrectos" });
      }

      const user = await storage.getUserByEmail(normalizedEmail, tenantId);
      if (!user || !user.isActive) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "Email o contraseña incorrectos" });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "Email o contraseña incorrectos" });
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
        } : null,
        message: "Login exitoso",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error durante login: " + message });
    }
  });

  // POST /api/auth/logout - Invalidate tokens
  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Blacklist access token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        blacklistedTokens.add(token);
        activeSessions.delete(token);
      }

      // Delete refresh token
      const { refreshToken } = req.body;
      if (refreshToken) {
        await storage.deleteRefreshToken(refreshToken);
      }

      res.json({ success: true, message: "Sesion cerrada correctamente" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error al cerrar sesion: " + message });
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
      res.status(500).json({ message: "Error al refrescar token: " + message });
    }
  });

  // GET /api/auth/me - Current user with tenant info
  app.get("/api/auth/me", requireSaasAuth, async (req, res) => {
    try {
      const saasUser = (req as any).saasUser as SaasJwtPayload;
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
      res.status(500).json({ message: "Error al obtener perfil: " + message });
    }
  });

  // PATCH /api/auth/profile - Update user profile
  app.patch("/api/auth/profile", requireSaasAuth, async (req, res) => {
    try {
      const saasUser = (req as any).saasUser as SaasJwtPayload;
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
      res.status(500).json({ message: "Error al actualizar perfil: " + message });
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
          message: "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
        });
      }

      // Generate reset token (expires in 1 hour)
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await storage.createPasswordResetToken(foundUser.id, resetToken, expiresAt);

      // TODO: Send email with reset link
      // For now, log the token in development
      if (process.env.NODE_ENV === "development") {
        console.log(`Password reset token for ${normalizedEmail}: ${resetToken}`);
      }

      res.json({
        success: true,
        message: "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error al solicitar restablecimiento: " + message });
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
        message: "Contraseña restablecida exitosamente",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error al restablecer contraseña: " + message });
    }
  });

  // POST /api/auth/migrate-admin-users - Migrate legacy admin_users to new users table
  app.post("/api/auth/migrate-admin-users", requireAdminSession, async (req, res) => {
    try {
      const { tenantId } = req.body;
      if (!tenantId) {
        // Try to get default tenant
        const defaultTenant = await storage.getTenantBySlug("costa-brava-rent-a-boat");
        if (!defaultTenant) {
          return res.status(400).json({ message: "tenantId requerido o seed-tenant primero" });
        }
        const result = await storage.migrateAdminUsersToUsers(defaultTenant.id);
        return res.json({ success: true, ...result, message: "Migracion completada" });
      }

      const result = await storage.migrateAdminUsersToUsers(tenantId);
      res.json({ success: true, ...result, message: "Migracion completada" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error al migrar usuarios: " + message });
    }
  });

  // =============================================
  // LEGACY AUTH ENDPOINTS (backward compatibility)
  // =============================================

  // Get current authenticated user (customer - Replit Auth)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getCustomerUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get customer profile
  app.get("/api/customer/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customer = await storage.getCustomerByUserId(userId);

      if (!customer) {
        return res.status(404).json({ message: "Customer profile not found" });
      }

      res.json(customer);
    } catch (error: unknown) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({ message: "Failed to fetch customer profile" });
    }
  });

  // Update customer profile
  app.patch("/api/customer/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customer = await storage.getCustomerByUserId(userId);

      if (!customer) {
        return res.status(404).json({ message: "Customer profile not found" });
      }

      const parsed = updateCustomerProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const updatedCustomer = await storage.updateCustomer(customer.id, parsed.data);
      res.json(updatedCustomer);
    } catch (error: unknown) {
      console.error("Error updating customer profile:", error);
      res.status(500).json({ message: "Failed to update customer profile" });
    }
  });

  // Get customer bookings
  app.get("/api/customer/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customer = await storage.getCustomerByUserId(userId);

      if (!customer) {
        return res.json([]);
      }

      const allBookings = await storage.getAllBookings();
      const customerBookings = allBookings.filter(
        booking =>
          booking.customerId === customer.id ||
          booking.customerEmail === customer.email ||
          booking.customerPhone === `${customer.phonePrefix}${customer.phoneNumber}`
      );

      res.json(customerBookings);
    } catch (error: unknown) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get current admin user info (legacy)
  app.get("/api/admin/me", requireAdminSession, async (req, res) => {
    const tokenData = getTokenData(req);
    if (!tokenData) {
      return res.status(401).json({ message: "No autorizado" });
    }

    // If SaaS token, return full user info
    if ("tenantId" in tokenData) {
      const user = await storage.getUserById(tokenData.userId);
      const tenant = user ? await storage.getTenant(user.tenantId) : null;
      return res.json({
        username: user?.email || tokenData.email,
        role: tokenData.role,
        firstName: user?.firstName,
        lastName: user?.lastName,
        tenantName: tenant?.name,
        tenantSlug: tenant?.slug,
      });
    }

    // Legacy admin token
    res.json({
      username: (tokenData as AdminJwtPayload).username,
      role: tokenData.role,
    });
  });

  // Admin logout - blacklist the JWT token (legacy)
  app.post("/api/admin/logout", requireAdminSession, (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      blacklistedTokens.add(token);
      activeSessions.delete(token);
    }
    res.json({ success: true, message: "Sesion cerrada correctamente" });
  });

  // PIN login (legacy - owner)
  app.post("/api/admin/login", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp, res)) return;

      const { pin } = req.body;
      const adminPin = process.env.ADMIN_PIN;

      if (!adminPin) {
        return res.status(503).json({ message: "Admin access not configured" });
      }

      if (pin !== adminPin) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "PIN incorrecto" });
      }

      loginAttempts.delete(clientIp);
      const token = generateAdminToken("admin", "ivan", "owner");

      res.json({
        success: true,
        token,
        role: "admin",
        username: "ivan",
        displayName: "Ivan",
        message: "Login successful",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error during login: " + message });
    }
  });

  // Username + password login (legacy)
  app.post("/api/admin/login-user", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp, res)) return;

      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña requeridos" });
      }

      const user = await storage.getAdminUserByUsername(username);

      if (!user || !user.isActive) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
      }

      await storage.updateAdminUser(user.id, { lastLoginAt: new Date() });

      loginAttempts.delete(clientIp);
      const token = generateAdminToken(user.role, user.username, user.id);

      res.json({
        success: true,
        token,
        role: user.role,
        username: user.username,
        displayName: user.displayName || user.username,
        message: "Login successful",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error during login: " + message });
    }
  });
}
