import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { storage } from "../storage";
import { logger } from "../lib/logger";

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Intenta de nuevo mas tarde." },
});

const subscribeSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  language: z.string().min(2).max(5).default("es"),
  source: z.enum(["footer", "popup"]).default("footer"),
});

export function registerNewsletterRoutes(app: Express) {
  app.post("/api/newsletter/subscribe", submitLimiter, async (req, res) => {
    try {
      const parsed = subscribeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Email inválido" });
      }

      const { email, language, source } = parsed.data;
      const subscriber = await storage.createNewsletterSubscriber(email, language, source);
      res.status(201).json({ success: true, id: subscriber.id });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      // Unique constraint violation — already subscribed
      if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("23505")) {
        return res.status(409).json({ message: "Este email ya está suscrito" });
      }
      logger.error("[Newsletter] Error subscribing", { error: msg });
      res.status(500).json({ message: "Error al procesar la suscripción" });
    }
  });

  // Unsubscribe via link in newsletter emails
  app.get("/api/newsletter/unsubscribe", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).send("Email requerido");
      }
      await storage.unsubscribeNewsletter(email);
      res.send(`
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>Unsubscribed</title></head>
        <body style="font-family:Arial,sans-serif; text-align:center; padding:60px 20px;">
          <h2 style="color:#1e3a5f;">Has cancelado tu suscripcion</h2>
          <p style="color:#475569;">Ya no recibiras nuestro newsletter. Si cambias de opinion, puedes volver a suscribirte en nuestra web.</p>
          <a href="https://costabravarentaboat.com" style="color:#2563eb;">Volver a costabravarentaboat.com</a>
        </body></html>
      `);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("[Newsletter] Unsubscribe error", { error: msg });
      res.status(500).send("Error al procesar la solicitud");
    }
  });
}
