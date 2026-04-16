import type { Express } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { z } from "zod";
import { storage } from "../storage";
import { logger } from "../lib/logger";

// HMAC token for unsubscribe links — encodes email to avoid exposing it in URL
export function generateNewsletterUnsubToken(email: string): string {
  const secret = process.env.JWT_SECRET || "newsletter-unsub-fallback";
  return crypto.createHmac("sha256", secret).update(email).digest("hex").slice(0, 16);
}

// Opaque unsubscribe token: base64(email) + "." + hmac — no email visible in URL
export function generateOpaqueUnsubToken(email: string): string {
  const emailB64 = Buffer.from(email).toString("base64url");
  const hmac = generateNewsletterUnsubToken(email);
  return `${emailB64}.${hmac}`;
}

export function parseOpaqueUnsubToken(token: string): string | null {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const emailB64 = token.substring(0, dotIndex);
  const hmac = token.substring(dotIndex + 1);
  try {
    const email = Buffer.from(emailB64, "base64url").toString("utf-8");
    const expected = generateNewsletterUnsubToken(email);
    if (expected.length !== hmac.length ||
        !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac))) return null;
    return email;
  } catch {
    return null;
  }
}

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
      // Honeypot anti-bot check
      if (req.body.website) {
        return res.json({ success: true });
      }

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
  // Supports two formats:
  //   New: ?token=<opaque> (email encoded inside token, not visible in URL)
  //   Legacy: ?email=<email>&token=<hmac> (for already-sent emails, backwards compatible)
  app.get("/api/newsletter/unsubscribe", async (req, res) => {
    try {
      let email: string | null = null;

      const opaqueToken = req.query.token as string | undefined;
      const legacyEmail = req.query.email as string | undefined;

      if (opaqueToken && !legacyEmail) {
        // New format: opaque token contains email
        email = parseOpaqueUnsubToken(opaqueToken);
      } else if (legacyEmail && opaqueToken) {
        // Legacy format: separate email + hmac token
        const expectedToken = generateNewsletterUnsubToken(legacyEmail);
        email = expectedToken.length === opaqueToken.length &&
          crypto.timingSafeEqual(Buffer.from(expectedToken), Buffer.from(opaqueToken))
          ? legacyEmail : null;
      }

      if (!email) {
        return res.status(400).send("Enlace de cancelación no válido");
      }
      await storage.unsubscribeNewsletter(email);
      res.send(`
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>Unsubscribed</title></head>
        <body style="font-family:Arial,sans-serif; text-align:center; padding:60px 20px;">
          <h2 style="color:#1e3a5f;">Has cancelado tu suscripcion</h2>
          <p style="color:#475569;">Ya no recibiras nuestro newsletter. Si cambias de opinion, puedes volver a suscribirte en nuestra web.</p>
          <a href="https://www.costabravarentaboat.com" style="color:#2563eb;">Volver a costabravarentaboat.com</a>
        </body></html>
      `);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("[Newsletter] Unsubscribe error", { error: msg });
      res.status(500).send("Error al procesar la solicitud");
    }
  });
}
