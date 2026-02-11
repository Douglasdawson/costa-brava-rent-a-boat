import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

// Token data now includes role and username
interface TokenData {
  createdAt: number;
  expiresAt: number;
  role: string;
  username: string;
}

// In-memory store for valid admin tokens with expiration
const adminTokens = new Map<string, TokenData>();
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Clean expired tokens periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(adminTokens.entries());
  for (const [token, data] of entries) {
    if (now > data.expiresAt) {
      adminTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

export function generateAdminToken(role: string = "admin", username: string = "admin"): string {
  const token = `admin_${crypto.randomBytes(32).toString("hex")}`;
  adminTokens.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
    role,
    username,
  });
  return token;
}

// Helper to get token data from request
function getTokenData(req: Request): TokenData | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  const tokenData = adminTokens.get(token);
  if (!tokenData || Date.now() > tokenData.expiresAt) return null;
  return tokenData;
}

// Admin session middleware - verifies token exists in store
export const requireAdminSession = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = authHeader.substring(7);
  const tokenData = adminTokens.get(token);

  if (!tokenData) {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }

  if (Date.now() > tokenData.expiresAt) {
    adminTokens.delete(token);
    return res.status(401).json({ message: "Token expirado" });
  }

  next();
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

  // Logout endpoint
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

      const updates = req.body;
      const updatedCustomer = await storage.updateCustomer(customer.id, updates);

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

      // Successful login - reset attempts and generate verified token
      loginAttempts.delete(clientIp);
      const token = generateAdminToken("admin", "admin");

      res.json({
        success: true,
        token,
        role: "admin",
        username: "admin",
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
      const token = generateAdminToken(user.role, user.username);

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
