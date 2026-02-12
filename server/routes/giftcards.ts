import type { Express } from "express";
import { storage } from "../storage";
import { requireAdminSession, requireAdminRole } from "./auth";
import { getStripe } from "./payments";
import { z } from "zod";

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CB-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const purchaseSchema = z.object({
  amount: z.number().min(10).max(1000),
  purchaserName: z.string().min(1).max(100),
  purchaserEmail: z.string().email(),
  recipientName: z.string().min(1).max(100),
  recipientEmail: z.string().email(),
  personalMessage: z.string().max(500).optional(),
});

const validateCodeSchema = z.object({
  code: z.string().min(1),
});

const updateGiftCardSchema = z.object({
  status: z.enum(["pending", "active", "used", "expired", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
});

export function registerGiftCardRoutes(app: Express) {
  // Purchase a gift card (public)
  app.post("/api/gift-cards/purchase", async (req, res) => {
    try {
      const parsed = purchaseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { amount, purchaserName, purchaserEmail, recipientName, recipientEmail, personalMessage } = parsed.data;

      // Generate unique code
      let code = generateGiftCardCode();
      let existing = await storage.getGiftCardByCode(code);
      let attempts = 0;
      while (existing && attempts < 10) {
        code = generateGiftCardCode();
        existing = await storage.getGiftCardByCode(code);
        attempts++;
      }

      // Expires in 1 year
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Create gift card in DB
      const giftCard = await storage.createGiftCard({
        code,
        amount: amount.toFixed(2),
        remainingAmount: amount.toFixed(2),
        purchaserName,
        purchaserEmail,
        recipientName,
        recipientEmail,
        personalMessage: personalMessage || null,
        stripePaymentIntentId: null,
        paymentStatus: "pending",
        status: "pending",
        usedBookingId: null,
        expiresAt,
      });

      // Create Stripe PaymentIntent
      try {
        const stripe = getStripe();
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "eur",
          metadata: {
            type: "gift_card",
            giftCardId: giftCard.id,
            giftCardCode: code,
          },
          description: `Tarjeta regalo ${code} - ${amount}EUR para ${recipientName}`,
        });

        await storage.updateGiftCard(giftCard.id, {
          stripePaymentIntentId: paymentIntent.id,
        });

        res.json({
          success: true,
          giftCardId: giftCard.id,
          clientSecret: paymentIntent.client_secret,
          code,
        });
      } catch (stripeError: unknown) {
        // If Stripe fails, still return the gift card for manual payment
        const message = stripeError instanceof Error ? stripeError.message : "Error desconocido";
        console.error("Stripe error for gift card:", message);
        res.status(503).json({
          message: "Servicio de pagos no disponible. Contacta por WhatsApp para comprar tu tarjeta regalo.",
          giftCardId: giftCard.id,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error purchasing gift card:", message);
      res.status(500).json({ message: "Error al crear la tarjeta regalo" });
    }
  });

  // Validate a gift card code (public)
  app.post("/api/gift-cards/validate", async (req, res) => {
    try {
      const parsed = validateCodeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Codigo requerido" });
      }

      const giftCard = await storage.getGiftCardByCode(parsed.data.code.toUpperCase().trim());
      if (!giftCard) {
        return res.status(404).json({ message: "Codigo de tarjeta regalo no valido", valid: false });
      }

      if (giftCard.status === "expired" || new Date() > giftCard.expiresAt) {
        return res.json({ valid: false, message: "Esta tarjeta regalo ha expirado" });
      }

      if (giftCard.status === "used") {
        return res.json({ valid: false, message: "Esta tarjeta regalo ya ha sido utilizada" });
      }

      if (giftCard.status === "cancelled") {
        return res.json({ valid: false, message: "Esta tarjeta regalo ha sido cancelada" });
      }

      if (giftCard.paymentStatus !== "completed") {
        return res.json({ valid: false, message: "Esta tarjeta regalo no esta activada" });
      }

      res.json({
        valid: true,
        code: giftCard.code,
        remainingAmount: giftCard.remainingAmount,
        recipientName: giftCard.recipientName,
        expiresAt: giftCard.expiresAt,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error validating gift card:", message);
      res.status(500).json({ message: "Error al validar la tarjeta regalo" });
    }
  });

  // Admin: List all gift cards
  app.get("/api/admin/gift-cards", requireAdminSession, async (_req, res) => {
    try {
      const cards = await storage.getAllGiftCards();
      res.json(cards);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      res.status(500).json({ message: "Error al obtener tarjetas regalo: " + message });
    }
  });

  // Admin: Update gift card status
  app.patch("/api/admin/gift-cards/:id", requireAdminSession, requireAdminRole, async (req, res) => {
    try {
      const { id } = req.params;

      const parsed = updateGiftCardSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { status, paymentStatus } = parsed.data;

      const updates: Record<string, string> = {};
      if (status) updates.status = status;
      if (paymentStatus) updates.paymentStatus = paymentStatus;

      const updated = await storage.updateGiftCard(id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Tarjeta regalo no encontrada" });
      }

      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      res.status(500).json({ message: "Error al actualizar tarjeta regalo: " + message });
    }
  });
}
