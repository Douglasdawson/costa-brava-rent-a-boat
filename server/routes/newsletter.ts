import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";

const subscribeSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  language: z.string().min(2).max(5).default("es"),
  source: z.string().max(32).default("footer"),
});

export function registerNewsletterRoutes(app: Express) {
  app.post("/api/newsletter/subscribe", async (req, res) => {
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
      console.error("[Newsletter] Error subscribing:", msg);
      res.status(500).json({ message: "Error al procesar la suscripción" });
    }
  });
}
