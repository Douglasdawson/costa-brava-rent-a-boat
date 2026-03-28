import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";
import { requireAdminSession, requireAdminRole, requireTabAccess } from "./auth";
import { getStripe } from "./payments";
import { z } from "zod";
import { logger } from "../lib/logger";
import { validatePromoCode } from "../lib/discountValidation";

const validateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de validacion. Intenta de nuevo en unos minutos." },
});

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
        logger.error("Stripe error for gift card", { error: message });
        res.status(503).json({
          message: "Servicio de pagos no disponible. Contacta por WhatsApp para comprar tu tarjeta regalo.",
          giftCardId: giftCard.id,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("Error purchasing gift card", { error: message });
      res.status(500).json({ message: "Error al crear la tarjeta regalo" });
    }
  });

  // Validate a gift card code (public)
  // Uses the shared validatePromoCode function as single source of truth
  app.post("/api/gift-cards/validate", validateLimiter, async (req, res) => {
    try {
      const parsed = validateCodeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Codigo requerido" });
      }

      const result = await validatePromoCode(parsed.data.code);

      // Only return gift card results from this endpoint (not discount codes)
      if (!result.valid || result.type !== "gift_card") {
        // Delay response to slow brute-force enumeration
        await new Promise(resolve => setTimeout(resolve, 300));
        return res.status(404).json({ message: result.error || "Codigo de tarjeta regalo no valido", valid: false });
      }

      // Fetch full gift card details for the response (recipient info, expiry)
      const giftCard = await storage.getGiftCardByCode(result.code!);
      if (!giftCard) {
        return res.status(404).json({ message: "Codigo de tarjeta regalo no valido", valid: false });
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
      logger.error("Error validating gift card", { error: message });
      res.status(500).json({ message: "Error al validar la tarjeta regalo" });
    }
  });

  // Admin: List all gift cards
  app.get("/api/admin/gift-cards", requireAdminSession, requireTabAccess("giftcards"), async (_req, res) => {
    try {
      const cards = await storage.getAllGiftCards();
      res.json(cards);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[GiftCards] Error fetching gift cards", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin: Update gift card status
  app.patch("/api/admin/gift-cards/:id", requireAdminSession, requireTabAccess("giftcards"), requireAdminRole, async (req, res) => {
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
      logger.error("[GiftCards] Error updating gift card", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
