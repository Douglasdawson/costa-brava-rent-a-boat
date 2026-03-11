import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { storage } from "../storage";
import type { AuthenticatedRequest, AdminJwtPayload, SaasJwtPayload, JwtPayload } from "../types";

// ===== Constants =====

export const BCRYPT_ROUNDS = 10;

// JWT secret - MUST be set via environment variable. No fallback allowed.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "FATAL: JWT_SECRET must be set and at least 32 characters long. " +
    "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}
export const JWT_SECRET: string = process.env.JWT_SECRET;

// ===== Types =====

export type StoredSaasUser = NonNullable<Awaited<ReturnType<typeof storage.getUserById>>>;

// ===== Rate Limiting =====

export const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(clientIp: string, res: Response): boolean {
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

export function trackFailedAttempt(clientIp: string) {
  const current = loginAttempts.get(clientIp);
  if (current) {
    current.count++;
  } else {
    loginAttempts.set(clientIp, { count: 1, firstAttempt: Date.now() });
  }
}

// ===== Cleanup Intervals =====

// Clean expired sessions and blacklisted tokens every hour
setInterval(async () => {
  try {
    await storage.cleanupExpiredSessions();
  } catch {
    // Silent cleanup failure
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
export function generateAdminToken(role: string = "admin", username: string = "admin", userId: string = "owner", allowedTabs?: string[]): string {
  const payload: AdminJwtPayload = { userId, role, username };
  if (allowedTabs) payload.allowedTabs = allowedTabs;
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  storage.createAdminSession(token, userId, role, username, expiresAt).catch(() => {});

  return token;
}

// Middleware to check if the user has access to a specific CRM tab
export function requireTabAccess(tabName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return res.status(401).json({ message: "No autorizado" });
    }
    // Owner (legacy PIN login) always has full access
    if ("username" in tokenData && tokenData.username === "ivan") {
      return next();
    }
    // SaaS owner always has full access
    if ("tenantId" in tokenData && tokenData.role === "owner") {
      return next();
    }
    // Check allowedTabs for legacy admin tokens
    if ("allowedTabs" in tokenData && tokenData.allowedTabs) {
      if (!tokenData.allowedTabs.includes(tabName)) {
        return res.status(403).json({ message: "No tienes acceso a esta seccion" });
      }
    }
    next();
  };
}

// New SaaS access token with tenantId
export function generateAccessToken(userId: string, tenantId: string, role: string, email: string): string {
  return jwt.sign(
    { userId, tenantId, role, email } as SaasJwtPayload,
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

// Generate a cryptographically secure refresh token
export function generateRefreshTokenString(): string {
  return crypto.randomBytes(64).toString("hex");
}

// ===== Internal Helpers =====

export async function getTokenData(req: Request): Promise<JwtPayload | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  if (await storage.isTokenBlacklisted(token)) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function validateSaasTokenData(
  tokenData: JwtPayload | null,
): Promise<{ token: SaasJwtPayload; user: StoredSaasUser } | null> {
  if (!tokenData || !("tenantId" in tokenData)) {
    return null;
  }

  const user = await storage.getUserById(tokenData.userId);
  if (!user || !user.isActive) {
    return null;
  }

  if (user.tenantId !== tokenData.tenantId) {
    return null;
  }

  const freshTokenData: SaasJwtPayload = {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
    iat: tokenData.iat,
    exp: tokenData.exp,
  };

  return { token: freshTokenData, user };
}

// Detect tenant from request (subdomain or header)
export async function resolveTenantFromRequest(req: Request): Promise<string | null> {
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
export const requireAdminSession = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = authHeader.substring(7);

  if (await storage.isTokenBlacklisted(token)) {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if ("tenantId" in decoded) {
      const validated = await validateSaasTokenData(decoded);
      if (!validated) {
        return res.status(401).json({ message: "Token invalido o expirado" });
      }

      if (validated.user.role !== "owner" && validated.user.role !== "admin") {
        return res.status(403).json({ message: "Se requiere rol de administrador" });
      }

      const authReq = req as AuthenticatedRequest;
      authReq.tenantId = validated.user.tenantId;
      authReq.saasUser = validated.token;
      authReq.adminUser = validated.token;
      return next();
    }

    (req as AuthenticatedRequest).adminUser = decoded;
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      storage.deleteAdminSession(token).catch(() => {});
      return res.status(401).json({ message: "Token expirado" });
    }
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
};

// SaaS auth middleware - requires SaaS JWT with tenantId
export const requireSaasAuth = async (req: Request, res: Response, next: NextFunction) => {
  const tokenData = await getTokenData(req);
  const validated = await validateSaasTokenData(tokenData);

  if (!validated) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const authReq = req as AuthenticatedRequest;
  authReq.saasUser = validated.token;
  authReq.tenantId = validated.user.tenantId;
  authReq.authUser = validated.user;
  next();
};

// Admin role middleware
export const requireAdminRole = async (req: Request, res: Response, next: NextFunction) => {
  const tokenData = await getTokenData(req);
  if (!tokenData) {
    return res.status(401).json({ message: "No autorizado" });
  }
  const role = "role" in tokenData ? tokenData.role : "";
  if (role !== "admin" && role !== "owner") {
    return res.status(403).json({ message: "Se requiere rol de administrador" });
  }
  next();
};

// Super admin middleware - platform admin only (legacy tokens without tenantId)
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const tokenData = await getTokenData(req);
  if (!tokenData) {
    return res.status(401).json({ message: "No autorizado" });
  }
  // SaaS users (with tenantId) are NOT super admins
  if ("tenantId" in tokenData) {
    return res.status(403).json({ message: "Acceso solo para administradores de plataforma" });
  }
  // Must have admin or owner role
  if (tokenData.role !== "admin" && tokenData.role !== "owner") {
    return res.status(403).json({ message: "Se requiere rol de administrador de plataforma" });
  }
  next();
};

// Owner middleware - PIN login (Ivan) or SaaS owner
export const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
  const tokenData = await getTokenData(req);
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
  const tokenData = await getTokenData(req);
  if (tokenData && "tenantId" in tokenData) {
    const validated = await validateSaasTokenData(tokenData);
    if (!validated) {
      return res.status(401).json({ message: "Token invalido o expirado" });
    }

    const authReq = req as AuthenticatedRequest;
    authReq.tenantId = validated.user.tenantId;
    authReq.saasUser = validated.token;
    authReq.authUser = validated.user;
    return next();
  }

  // Then try from subdomain/header
  const tenantId = await resolveTenantFromRequest(req);
  if (tenantId) {
    (req as AuthenticatedRequest).tenantId = tenantId;
    return next();
  }

  return res.status(400).json({ message: "No se pudo determinar el tenant" });
};
