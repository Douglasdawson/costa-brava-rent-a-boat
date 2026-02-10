import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

// Admin session middleware
export const requireAdminSession = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = authHeader.substring(7);

  if (!token.startsWith("admin_")) {
    return res.status(401).json({ message: "Token inválido" });
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

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { pin } = req.body;
      const adminPin = process.env.ADMIN_PIN;

      if (!adminPin) {
        return res.status(503).json({ message: "Admin access not configured" });
      }

      if (pin !== adminPin) {
        return res.status(401).json({ message: "PIN incorrecto" });
      }

      const token = `admin_${Date.now()}_${Math.random().toString(36)}`;

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
