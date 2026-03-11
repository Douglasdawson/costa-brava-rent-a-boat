import type { Express } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import type { AuthenticatedRequest, AdminJwtPayload, SaasJwtPayload, JwtPayload } from "../types";
import { logger } from "../lib/logger";
import {
  JWT_SECRET,
  loginAttempts,
  checkRateLimit,
  trackFailedAttempt,
  getTokenData,
  generateAdminToken,
  requireAdminSession,
} from "./auth-middleware";

const updateCustomerProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phonePrefix: z.string().max(10).optional(),
  phoneNumber: z.string().max(20).optional(),
  nationality: z.string().max(50).optional(),
  preferredLanguage: z.string().max(10).optional(),
});

// ===== Legacy + Customer Auth Route Registration =====

export function registerLegacyAuthRoutes(app: Express) {

  // Get current authenticated user (customer - Replit Auth)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getCustomerUser(userId);
      res.json(user);
    } catch (error) {
      logger.error("Error fetching user", { error: error instanceof Error ? error.message : String(error) });
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
      logger.error("Error fetching customer profile", { error: error instanceof Error ? error.message : String(error) });
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
      logger.error("Error updating customer profile", { error: error instanceof Error ? error.message : String(error) });
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

      const phone = customer.phonePrefix && customer.phoneNumber
        ? `${customer.phonePrefix}${customer.phoneNumber}`
        : null;
      const customerBookings = await storage.getBookingsByCustomer(
        customer.id,
        customer.email ?? null,
        phone
      );

      res.json(customerBookings);
    } catch (error: unknown) {
      logger.error("Error fetching customer bookings", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get current admin user info (legacy)
  app.get("/api/admin/me", requireAdminSession, async (req, res) => {
    const tokenData = await getTokenData(req);
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
  app.post("/api/admin/logout", requireAdminSession, async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token) as JwtPayload | null;
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.blacklistToken(token, expiresAt);
      await storage.deleteAdminSession(token);
    }
    res.json({ success: true, message: "Sesion cerrada correctamente" });
  });

  // PIN login (legacy - owner + user PINs)
  app.post("/api/admin/login", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp, res)) return;

      const { pin } = req.body;
      const adminPin = process.env.ADMIN_PIN;

      if (!adminPin) {
        return res.status(503).json({ message: "Admin access not configured" });
      }

      // 1. Check owner PIN (ADMIN_PIN env var) — timing-safe comparison
      const pinBuffer = Buffer.from(String(pin || '').padEnd(64, '\0'));
      const adminPinBuffer = Buffer.from(String(adminPin).padEnd(64, '\0'));
      if (crypto.timingSafeEqual(pinBuffer, adminPinBuffer)) {
        loginAttempts.delete(clientIp);
        const token = generateAdminToken("owner", "ivan", "owner");

        return res.json({
          success: true,
          token,
          role: "owner",
          username: "ivan",
          displayName: "Ivan",
          allowedTabs: null, // null = full access (owner)
          message: "Login successful",
        });
      }

      // 2. Check user PINs in admin_users table
      const usersWithPin = await storage.getAdminUsersWithPin();
      let matchedUser = null;
      for (const user of usersWithPin) {
        if (user.pin && await bcrypt.compare(String(pin), user.pin)) {
          matchedUser = user;
          break;
        }
      }

      if (!matchedUser) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "PIN incorrecto" });
      }

      // Update last login
      await storage.updateAdminUser(matchedUser.id, { lastLoginAt: new Date() });

      loginAttempts.delete(clientIp);
      const allowedTabs = (matchedUser.allowedTabs as string[]) || [];
      const token = generateAdminToken(matchedUser.role, matchedUser.username, matchedUser.id, allowedTabs);

      res.json({
        success: true,
        token,
        role: matchedUser.role,
        username: matchedUser.username,
        displayName: matchedUser.displayName || matchedUser.username,
        allowedTabs,
        message: "Login successful",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Auth] Error during PIN login", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Username + password login (legacy)
  app.post("/api/admin/login-user", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(clientIp, res)) return;

      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contrasena requeridos" });
      }

      const user = await storage.getAdminUserByUsername(username);

      if (!user || !user.isActive) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "Usuario o contrasena incorrectos" });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        trackFailedAttempt(clientIp);
        return res.status(401).json({ message: "Usuario o contrasena incorrectos" });
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
      logger.error("[Auth] Error during user login", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
