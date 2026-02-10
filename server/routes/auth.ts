import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

// In-memory store for valid admin tokens with expiration
const adminTokens = new Map<string, { createdAt: number; expiresAt: number }>();
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Clean expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of adminTokens) {
    if (now > data.expiresAt) {
      adminTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

export function generateAdminToken(): string {
  const token = `admin_${crypto.randomBytes(32).toString("hex")}`;
  adminTokens.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Admin login with rate limiting
  const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  app.post("/api/admin/login", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";

      // Check rate limit
      const attempts = loginAttempts.get(clientIp);
      if (attempts) {
        if (Date.now() - attempts.firstAttempt > LOGIN_WINDOW_MS) {
          loginAttempts.delete(clientIp);
        } else if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
          return res.status(429).json({
            message: "Demasiados intentos. Intenta de nuevo en 15 minutos.",
          });
        }
      }

      const { pin } = req.body;
      const adminPin = process.env.ADMIN_PIN;

      if (!adminPin) {
        return res.status(503).json({ message: "Admin access not configured" });
      }

      if (pin !== adminPin) {
        // Track failed attempt
        const current = loginAttempts.get(clientIp);
        if (current) {
          current.count++;
        } else {
          loginAttempts.set(clientIp, { count: 1, firstAttempt: Date.now() });
        }
        return res.status(401).json({ message: "PIN incorrecto" });
      }

      // Successful login - reset attempts and generate verified token
      loginAttempts.delete(clientIp);
      const token = generateAdminToken();

      res.json({
        success: true,
        token,
        message: "Login successful",
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error during login: " + error.message });
    }
  });
}
