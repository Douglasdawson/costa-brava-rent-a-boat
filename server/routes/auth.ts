import type { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

const updateCustomerProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phonePrefix: z.string().max(10).optional(),
  phoneNumber: z.string().max(20).optional(),
  nationality: z.string().max(50).optional(),
  preferredLanguage: z.string().max(10).optional(),
});

// JWT secret - must be set via environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || "cbrb-admin-secret-change-in-production";

// JWT payload interface
interface JwtPayload {
  userId: string;
  role: string;
  username: string;
  iat?: number;
  exp?: number;
}

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
  // Clean expired sessions from tracking map
  const sessionEntries = Array.from(activeSessions.entries());
  for (const [token] of sessionEntries) {
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      activeSessions.delete(token);
    }
  }
  // Clean expired tokens from blacklist (no need to keep them after they expire)
  const blacklistEntries = Array.from(blacklistedTokens);
  for (const token of blacklistEntries) {
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      blacklistedTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

// Generate a signed JWT token
export function generateAdminToken(role: string = "admin", username: string = "admin", userId: string = "owner"): string {
  const token = jwt.sign(
    { userId, role, username } as JwtPayload,
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  // Track session metadata
  activeSessions.set(token, {
    createdAt: Date.now(),
    role,
    username,
    userId,
  });

  return token;
}

// Helper to extract and verify JWT from request, returns decoded payload or null
function getTokenData(req: Request): JwtPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);

  // Check if token has been blacklisted (logged out)
  if (blacklistedTokens.has(token)) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Admin session middleware - verifies JWT signature and expiry
export const requireAdminSession = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = authHeader.substring(7);

  // Check if token has been blacklisted (logged out)
  if (blacklistedTokens.has(token)) {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    // Attach decoded user info to request for downstream use
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

// Admin role middleware - requires 'admin' role for destructive operations
export const requireAdminRole = (req: Request, res: Response, next: NextFunction) => {
  const tokenData = getTokenData(req);
  if (!tokenData) {
    return res.status(401).json({ message: "No autorizado" });
  }
  if (tokenData.role !== "admin") {
    return res.status(403).json({ message: "Se requiere rol de administrador" });
  }
  next();
};

// Owner middleware - only Ivan (PIN login) can manage employees
export const requireOwner = (req: Request, res: Response, next: NextFunction) => {
  const tokenData = getTokenData(req);
  if (!tokenData) {
    return res.status(401).json({ message: "No autorizado" });
  }
  if (tokenData.username !== "ivan") {
    return res.status(403).json({ message: "Solo el propietario puede realizar esta accion" });
  }
  next();
};

export function registerAuthRoutes(app: Express) {
  // Get current authenticated user (customer)
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

  // Logout endpoint (customer - Replit Auth)
  app.post("/api/auth/logout", (req: any, res) => {
    res.json({
      message: "Logout initiated",
      redirectUrl: "/api/logout",
    });
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

  // Get current admin user info
  app.get("/api/admin/me", requireAdminSession, (req, res) => {
    const tokenData = getTokenData(req);
    if (!tokenData) {
      return res.status(401).json({ message: "No autorizado" });
    }
    res.json({
      username: tokenData.username,
      role: tokenData.role,
    });
  });

  // Admin logout - blacklist the JWT token
  app.post("/api/admin/logout", requireAdminSession, (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      blacklistedTokens.add(token);
      activeSessions.delete(token);
    }
    res.json({ success: true, message: "Sesion cerrada correctamente" });
  });

  // Admin login with rate limiting
  const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  // Rate limiting helper
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

  // PIN login (fallback, role = admin)
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

      // Successful login - reset attempts and generate signed JWT
      // PIN login is reserved for the owner (Ivan) - super admin
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

  // Username + password login
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

      // Update last login
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
