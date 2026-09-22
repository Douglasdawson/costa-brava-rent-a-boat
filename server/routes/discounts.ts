import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";
import { requireAdminSession, requireTabAccess } from "./auth";
import { z } from "zod";
import crypto from "crypto";
import { logger } from "../lib/logger";
import { validatePromoCode } from "../lib/discountValidation";

const validateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de validacion. Intenta de nuevo en unos minutos." },
});

// Validation schemas
const validateCodeSchema = z.object({
  code: z.string().min(1, "El codigo de descuento es requerido").max(30),
  // Optional context: phone-bound (alumni) codes need the customer's phone, and
  // licensedOnly codes need the boat to say whether they apply.
  phone: z.string().max(40).optional(),
  boatId: z.string().max(64).optional(),
});

// Escola Nàutica Blanes pushes each student's personal code with its current percentage
// (10 base + 10 per referred friend, capped at 30 on their side). Same shared secret as the
// CRM bridge (CRM_API_KEY); the route sits in the CSRF skip-list, no cookie involved.
const alumniCodeSchema = z.object({
  codigo: z.string().min(4).max(30).regex(/^[A-Za-z0-9-]+$/, "Codigo invalido"),
  telefono: z.string().min(6).max(40),
  percent: z.number().int().min(1).max(30),
  source: z.string().max(30).optional(),
  isActive: z.boolean().optional(),
});

const alumniLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Intenta de nuevo en unos minutos." },
});

function apiKeyMatches(provided: unknown, configured: string | undefined): boolean {
  if (!configured || typeof provided !== "string") return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(configured).digest();
  return crypto.timingSafeEqual(a, b);
}

const createDiscountSchema = z.object({
  code: z.string().min(2, "El codigo debe tener al menos 2 caracteres").max(30)
    .regex(/^[A-Z0-9-]+$/, "El codigo debe contener solo letras mayusculas, numeros y guiones"),
  discountPercent: z.number().int().min(1, "El descuento debe ser al menos 1%").max(100, "El descuento no puede superar 100%"),
  maxUses: z.number().int().min(1, "Debe permitir al menos 1 uso").default(1),
  // Solo una ETIQUETA para saber a quien se le dio: validatePromoCode NO lo mira,
  // asi que un codigo con email sigue siendo canjeable por cualquiera.
  customerEmail: z.string().email("Email invalido").optional().nullable(),
  // ESTE si ata el codigo a una persona: validatePromoCode compara los ultimos
  // 9 digitos contra el telefono que el cliente teclea en el wizard.
  customerPhone: z.string().min(6, "Telefono demasiado corto").max(40).optional().nullable(),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export function registerDiscountRoutes(app: Express) {
  // ===== SISTER SCHOOL (server-to-server) =====

  app.post("/api/crm/alumni-code", alumniLimiter, async (req, res) => {
    if (!apiKeyMatches(req.headers["x-api-key"], process.env.CRM_API_KEY)) {
      return res.status(401).json({ message: "No autorizado" });
    }
    const parsed = alumniCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
    }
    try {
      const row = await storage.upsertAlumniCode({
        code: parsed.data.codigo,
        phone: parsed.data.telefono,
        percent: parsed.data.percent,
        isActive: parsed.data.isActive,
      });
      logger.info("[AlumniCode] upserted", { code: row.code, percent: row.discountPercent, active: row.isActive, source: parsed.data.source });
      res.json({ ok: true, code: row.code, percent: row.discountPercent, isActive: row.isActive });
    } catch (error: unknown) {
      logger.error("[AlumniCode] upsert failed", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "No se pudo guardar el codigo" });
    }
  });

  // ===== PUBLIC ENDPOINTS =====

  // Validate a discount code (public - customers validate during booking)
  // Uses the shared validatePromoCode function as single source of truth
  app.post("/api/discounts/validate", validateLimiter, async (req, res) => {
    try {
      const parsed = validateCodeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          valid: false,
          errorCode: "missing",
          error: "Codigo de descuento requerido",
        });
      }

      const result = await validatePromoCode(parsed.data.code, { phone: parsed.data.phone, boatId: parsed.data.boatId });

      // Only return discount and friend-code results here (not gift cards, which
      // have their own endpoint). A friend code carries no discountPercent.
      if (!result.valid || (result.type !== "discount" && result.type !== "referral")) {
        // Delay response to slow brute-force enumeration
        await new Promise(resolve => setTimeout(resolve, 300));
        return res.json({
          valid: false,
          // P2.4: surface the discriminated errorCode so the client picks the
          // right i18n string (not_found vs expired vs consumed vs inactive)
          // instead of showing "Código inválido" for every failure mode.
          errorCode: result.errorCode ?? "not_found",
          error: result.error || "Codigo de descuento no valido",
        });
      }

      return res.json({
        valid: true,
        type: result.type,
        discountPercent: result.discountPercent,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("Error validating discount code", { error: message });
      res.status(500).json({
        valid: false,
        error: "Error al validar el codigo de descuento",
      });
    }
  });

  // ===== ADMIN ENDPOINTS =====

  // List all discount codes
  app.get("/api/admin/discounts", requireAdminSession, requireTabAccess("discounts"), async (_req, res) => {
    try {
      const codes = await storage.getDiscountCodes();
      res.json(codes);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("[Discounts] Error fetching discount codes", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Create a new discount code
  app.post("/api/admin/discounts", requireAdminSession, requireTabAccess("discounts"), async (req, res) => {
    try {
      const parsed = createDiscountSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { code, discountPercent, maxUses, customerEmail, customerPhone, expiresAt } = parsed.data;

      // Check if code already exists
      const existing = await storage.getDiscountCodeByCode(code);
      if (existing) {
        return res.status(409).json({ message: "Ya existe un codigo de descuento con ese nombre" });
      }

      const discountCode = await storage.createDiscountCode({
        code: code.toUpperCase().trim(),
        discountPercent,
        maxUses,
        customerEmail: customerEmail ? customerEmail.toLowerCase().trim() : null,
        customerPhone: customerPhone ? customerPhone.trim() : null,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      res.json({
        success: true,
        discountCode,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("Error creating discount code", { error: message });
      res.status(500).json({ message: "Error al crear el codigo de descuento" });
    }
  });

  // Deactivate a discount code
  app.delete("/api/admin/discounts/:id", requireAdminSession, requireTabAccess("discounts"), async (req, res) => {
    try {
      const { id } = req.params;

      // Find the code and deactivate it
      const codes = await storage.getDiscountCodes();
      const code = codes.find((c) => c.id === id);

      if (!code) {
        return res.status(404).json({ message: "Codigo de descuento no encontrado" });
      }

      // We deactivate by setting isActive to false via direct DB update
      const { db } = await import("../db");
      const { discountCodes } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [updated] = await db
        .update(discountCodes)
        .set({ isActive: false })
        .where(eq(discountCodes.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Codigo de descuento no encontrado" });
      }

      res.json({
        success: true,
        message: "Codigo de descuento desactivado",
        discountCode: updated,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("Error deactivating discount code", { error: message });
      res.status(500).json({ message: "Error al desactivar el codigo de descuento" });
    }
  });

  // Pre-season campaign: generate codes for all past customers
  app.post("/api/admin/discounts/pre-season-campaign", requireAdminSession, requireTabAccess("discounts"), async (_req, res) => {
    try {
      // Get confirmed bookings that have an email address
      const confirmedBookings = await storage.getConfirmedBookingsWithEmail();

      // Extract unique customer emails with their names
      const customerMap = new Map<string, { email: string; name: string }>();
      for (const booking of confirmedBookings) {
        if (booking.customerEmail) {
          const emailKey = booking.customerEmail.toLowerCase().trim();
          if (!customerMap.has(emailKey)) {
            customerMap.set(emailKey, {
              email: emailKey,
              name: `${booking.customerName} ${booking.customerSurname}`,
            });
          }
        }
      }

      const currentYear = new Date().getFullYear();
      const results: Array<{
        email: string;
        name: string;
        code: string;
        discountPercent: number;
      }> = [];

      // Expires end of June of the current year (start of high season)
      const expiresAt = new Date(currentYear, 5, 30, 23, 59, 59); // June 30

      const customers = Array.from(customerMap.values());
      for (const customer of customers) {
        // Generate code: SPRING-{first6 of email hash}-{year}
        const hash = crypto
          .createHash("md5")
          .update(customer.email)
          .digest("hex")
          .slice(0, 6)
          .toUpperCase();
        const code = `SPRING-${hash}-${currentYear}`;

        try {
          // Check if code already exists
          const existing = await storage.getDiscountCodeByCode(code);
          if (existing) {
            // Already generated for this customer this year
            results.push({
              email: customer.email,
              name: customer.name,
              code: existing.code,
              discountPercent: existing.discountPercent,
            });
            continue;
          }

          const discountCode = await storage.createDiscountCode({
            code,
            discountPercent: 10,
            maxUses: 1,
            customerEmail: customer.email,
            isActive: true,
            expiresAt,
          });

          results.push({
            email: customer.email,
            name: customer.name,
            code: discountCode.code,
            discountPercent: discountCode.discountPercent,
          });
        } catch (codeError: unknown) {
          // Skip this customer if there was a unique constraint violation
          const msg = codeError instanceof Error ? codeError.message : "";
          logger.error(`Error generating code for ${customer.email}`, { error: msg });
        }
      }

      res.json({
        success: true,
        customersFound: customerMap.size,
        codesGenerated: results.length,
        codes: results,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logger.error("Error in pre-season campaign", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
