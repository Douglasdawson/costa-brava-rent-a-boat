import type { Express, Request } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { updateCrmCustomerSchema, insertCheckinSchema } from "@shared/schema";
import { requireAdminSession, requireTabAccess } from "./auth";
import { format } from "date-fns";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";

interface AuthenticatedRequest extends Request {
  adminUser?: {
    username: string;
    role?: string;
    tenantId?: string;
  };
}

const paginatedCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  search: z.string().optional(),
  segment: z.string().optional(),
  nationality: z.string().optional(),
  sortBy: z.enum(["name", "totalBookings", "totalSpent", "lastBookingDate", "createdAt"]).optional().default("lastBookingDate"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export function registerAdminCustomerRoutes(app: Express) {
  // ===== CRM CUSTOMER MANAGEMENT =====

  // Paginated customers list with search and filters
  app.get("/api/admin/customers", requireAdminSession, requireTabAccess("customers"), async (req, res) => {
    try {
      const queryParsed = paginatedCustomersQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Parametros invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const result = await storage.getPaginatedCrmCustomers(queryParsed.data);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching customers", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get single customer profile with booking history
  app.get("/api/admin/customers/:id", requireAdminSession, requireTabAccess("customers"), async (req, res) => {
    try {
      const result = await storage.getCrmCustomerById(req.params.id);
      if (!result) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching customer", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update customer (notes, tags, nationality, documentId, etc.)
  app.patch("/api/admin/customers/:id", requireAdminSession, requireTabAccess("customers"), async (req, res) => {
    try {
      const parsed = updateCrmCustomerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const updated = await storage.updateCrmCustomer(req.params.id, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      audit(req, "update", "customer", req.params.id, { fields: Object.keys(parsed.data) });
      res.json({ success: true, customer: updated, message: "Cliente actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error updating customer", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Sync all customers from bookings data
  app.post("/api/admin/customers/sync", requireAdminSession, requireTabAccess("customers"), async (req, res) => {
    try {
      const result = await storage.syncAllCustomersFromBookings();
      res.json({
        success: true,
        message: `Sincronizacion completada: ${result.created} creados, ${result.updated} actualizados`,
        ...result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error syncing customers", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Export customers as CSV
  app.get("/api/admin/customers/export", requireAdminSession, requireTabAccess("customers"), async (req, res) => {
    try {
      const result = await storage.getPaginatedCrmCustomers({
        page: 1,
        limit: 10000,
        sortBy: "totalSpent",
        sortOrder: "desc",
      });

      const headers = [
        "Nombre", "Apellidos", "Email", "Telefono", "Nacionalidad",
        "Documento", "Segmento", "Total Reservas", "Total Gastado",
        "Primera Reserva", "Ultima Reserva", "Notas", "Tags"
      ];

      const rows = result.data.map((c) => [
        c.name,
        c.surname,
        c.email || "",
        c.phone,
        c.nationality || "",
        c.documentId || "",
        c.segment,
        String(c.totalBookings),
        c.totalSpent,
        c.firstBookingDate ? format(new Date(c.firstBookingDate), "dd/MM/yyyy") : "",
        c.lastBookingDate ? format(new Date(c.lastBookingDate), "dd/MM/yyyy") : "",
        (c.notes || "").replace(/"/g, '""'),
        (c.tags || []).join(", "),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
      ].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=clientes_${format(new Date(), "yyyy-MM-dd")}.csv`);
      res.send("\uFEFF" + csvContent);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error exporting customers", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== CHECK-IN / CHECK-OUT =====

  // Create check-in or check-out
  app.post("/api/admin/checkins", requireAdminSession, requireTabAccess("customers"), async (req, res) => {
    try {
      const parsed = insertCheckinSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      // Verify booking exists
      const booking = await storage.getBooking(parsed.data.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      // Check for duplicates
      const existing = await storage.getLatestCheckin(parsed.data.bookingId, parsed.data.type);
      if (existing) {
        return res.status(409).json({
          message: `Ya existe un ${parsed.data.type === "checkin" ? "check-in" : "check-out"} para esta reserva`,
        });
      }

      // Set performedBy from JWT token
      const adminUser = (req as AuthenticatedRequest).adminUser;
      const checkinData = {
        ...parsed.data,
        performedBy: adminUser?.username || "admin",
      };

      const newCheckin = await storage.createCheckin(checkinData);

      res.status(201).json({
        success: true,
        checkin: newCheckin,
        message: `${parsed.data.type === "checkin" ? "Check-in" : "Check-out"} registrado correctamente`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error creating checkin", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get check-ins for a booking
  app.get("/api/admin/checkins/booking/:bookingId", requireAdminSession, requireTabAccess("customers"), async (req, res) => {
    try {
      const checkinsList = await storage.getCheckinsByBooking(req.params.bookingId);
      res.json(checkinsList);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching checkins", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
