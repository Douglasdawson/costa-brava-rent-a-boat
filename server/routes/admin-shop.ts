import type { Express } from "express";
import { z } from "zod";
import { shopRepo } from "../storage";
import { requireAdminSession, requireTabAccess } from "./auth-middleware";
import { logger } from "../lib/logger";

const updateOrderSchema = z.object({
  status: z.enum(["fulfilled", "cancelled"]),
});

const updateVariantSchema = z.object({
  stock: z.number().int().min(0).max(10000).optional(),
  active: z.boolean().optional(),
}).refine((data) => data.stock !== undefined || data.active !== undefined, {
  message: "stock o active es requerido",
});

const updateProductSchema = z.object({
  priceCents: z.number().int().min(0).max(1000000).optional(),
  active: z.boolean().optional(),
}).refine((data) => data.priceCents !== undefined || data.active !== undefined, {
  message: "priceCents o active es requerido",
});

export function registerAdminShopRoutes(app: Express) {
  // List orders, optionally filtered by status
  app.get("/api/admin/shop/orders", requireAdminSession, requireTabAccess("shop"), async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const orders = await shopRepo.listShopOrders(status);
      res.json({ orders });
    } catch (error: unknown) {
      logger.error("[AdminShop] Error listing orders", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Mark an order fulfilled / cancelled
  app.patch("/api/admin/shop/orders/:id", requireAdminSession, requireTabAccess("shop"), async (req, res) => {
    try {
      const parsed = updateOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const updated = await shopRepo.updateShopOrderStatus(req.params.id, parsed.data.status);
      if (!updated) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      res.json(updated);
    } catch (error: unknown) {
      logger.error("[AdminShop] Error updating order", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Inventory: products with their variants
  app.get("/api/admin/shop/inventory", requireAdminSession, requireTabAccess("shop"), async (_req, res) => {
    try {
      const products = await shopRepo.getShopCatalog();
      res.json({ products });
    } catch (error: unknown) {
      logger.error("[AdminShop] Error fetching inventory", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update a variant (stock / active)
  app.patch("/api/admin/shop/variants/:sku", requireAdminSession, requireTabAccess("shop"), async (req, res) => {
    try {
      const parsed = updateVariantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const updated = await shopRepo.updateShopVariant(req.params.sku, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Variante no encontrada" });
      }
      res.json(updated);
    } catch (error: unknown) {
      logger.error("[AdminShop] Error updating variant", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update a product (price / active)
  app.patch("/api/admin/shop/products/:id", requireAdminSession, requireTabAccess("shop"), async (req, res) => {
    try {
      const parsed = updateProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const updated = await shopRepo.updateShopProduct(req.params.id, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json(updated);
    } catch (error: unknown) {
      logger.error("[AdminShop] Error updating product", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
