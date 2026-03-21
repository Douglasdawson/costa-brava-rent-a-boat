import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireSaasAuth, requireOwner, requireAdminSession } from "./auth-middleware";
import type { AuthenticatedRequest, SaasJwtPayload } from "../types";
import { logger } from "../lib/logger";

// ===== Query Schemas =====

const metricsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// ===== Types =====

interface MonthlyRevenue {
  month: string;
  amount: number;
}

interface TenantMetrics {
  tenantId: string;
  tenantName: string;
  period: { from: string; to: string };
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    conversionRate: number;
  };
  revenue: {
    total: number;
    avgPerBooking: number;
    byMonth: MonthlyRevenue[];
  };
  chatbot: {
    conversations: number;
    bookingsFromChat: number;
    conversionRate: number;
  };
  customers: {
    total: number;
    returning: number;
    avgRating: number;
  };
}

// ===== Helper: Compute metrics for a tenant =====

async function computeTenantMetrics(
  tenantId: string,
  from: Date,
  to: Date,
): Promise<TenantMetrics> {
  const tenant = await storage.getTenant(tenantId);
  const tenantName = tenant?.name ?? "Unknown";

  // Fetch all bookings (we filter in-memory for the given tenant + period)
  // In a multi-tenant system with per-tenant DB rows, we would use a tenant-scoped query.
  // For now we use the global queries available in storage.
  const allBookings = await storage.getAllBookings();

  const periodBookings = allBookings.filter((b) => {
    const created = new Date(b.createdAt);
    return created >= from && created <= to;
  });

  const total = periodBookings.length;
  const confirmed = periodBookings.filter(
    (b) => b.bookingStatus === "confirmed" || b.bookingStatus === "completed",
  ).length;
  const cancelled = periodBookings.filter((b) => b.bookingStatus === "cancelled").length;
  const conversionRate = total > 0 ? Math.round((confirmed / total) * 100) / 100 : 0;

  // Revenue
  const revenueTotal = periodBookings
    .filter((b) => b.bookingStatus === "confirmed" || b.bookingStatus === "completed")
    .reduce((sum, b) => sum + (Number(b.totalAmount ?? 0)), 0);
  const avgPerBooking = confirmed > 0 ? Math.round(revenueTotal / confirmed) : 0;

  // Revenue by month
  const byMonthMap = new Map<string, number>();
  periodBookings
    .filter((b) => b.bookingStatus === "confirmed" || b.bookingStatus === "completed")
    .forEach((b) => {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + (Number(b.totalAmount ?? 0)));
    });
  const byMonth: MonthlyRevenue[] = Array.from(byMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  // Chatbot metrics
  // We approximate using whatsApp-sourced bookings
  const chatBookings = periodBookings.filter(
    (b) => b.source === "whatsapp" || b.source === "chatbot",
  ).length;
  // Conversations: rough estimate based on chatbot bookings (typically ~10-12x bookings)
  const estimatedConversations = chatBookings > 0 ? chatBookings * 12 : 0;
  const chatConversion =
    estimatedConversations > 0
      ? Math.round((chatBookings / estimatedConversations) * 1000) / 1000
      : 0;

  // Customer metrics
  const uniqueEmails = new Set<string>();
  const emailCounts = new Map<string, number>();
  periodBookings.forEach((b) => {
    const email = b.customerEmail?.toLowerCase();
    if (email) {
      uniqueEmails.add(email);
      emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
    }
  });
  const totalCustomers = uniqueEmails.size;
  const returningCustomers = Array.from(emailCounts.values()).filter((c) => c > 1).length;

  // Average rating from testimonials
  const testimonials = await storage.getTestimonials();
  const rated = testimonials.filter((t) => t.rating != null);
  const avgRating =
    rated.length > 0
      ? Math.round((rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length) * 10) / 10
      : 0;

  return {
    tenantId,
    tenantName,
    period: {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    },
    bookings: { total, confirmed, cancelled, conversionRate },
    revenue: { total: revenueTotal, avgPerBooking, byMonth },
    chatbot: {
      conversations: estimatedConversations,
      bookingsFromChat: chatBookings,
      conversionRate: chatConversion,
    },
    customers: {
      total: totalCustomers,
      returning: returningCustomers,
      avgRating,
    },
  };
}

// ===== Helper: Parse date range from query =====

function parseDateRange(query: Record<string, unknown>): { from: Date; to: Date } {
  const parsed = metricsQuerySchema.safeParse(query);
  const now = new Date();

  // Default: current season (April 1 - October 31)
  const defaultFrom = new Date(now.getFullYear(), 3, 1); // April 1
  const defaultTo = new Date(now.getFullYear(), 9, 31); // October 31

  if (!parsed.success) {
    return { from: defaultFrom, to: defaultTo };
  }

  return {
    from: parsed.data.from ?? defaultFrom,
    to: parsed.data.to ?? defaultTo,
  };
}

// ===== Route Registration =====

export function registerTenantMetricsRoutes(app: Express) {
  /**
   * GET /api/admin/tenants/:tenantId/metrics
   * Tenant owner can view their own metrics.
   * Protected by requireSaasAuth + requireOwner.
   */
  app.get(
    "/api/admin/tenants/:tenantId/metrics",
    requireSaasAuth,
    requireOwner,
    async (req: Request, res: Response) => {
      try {
        const { tenantId } = req.params;
        const saasUser = (req as AuthenticatedRequest).saasUser as SaasJwtPayload;

        // Owners can only view their own tenant metrics
        if (saasUser.tenantId !== tenantId) {
          return res.status(403).json({
            message: "Solo puedes ver las metricas de tu propia empresa",
          });
        }

        const { from, to } = parseDateRange(req.query as Record<string, unknown>);
        const metrics = await computeTenantMetrics(tenantId, from, to);

        res.json(metrics);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.error("[TenantMetrics] Error fetching tenant metrics", { error: message });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  /**
   * GET /api/super-admin/tenants/metrics
   * Aggregated metrics across all tenants (super admin view).
   * Protected by requireAdminSession (legacy PIN owner / SaaS owner).
   */
  app.get(
    "/api/super-admin/tenants/metrics",
    requireAdminSession,
    async (req: Request, res: Response) => {
      try {
        const { from, to } = parseDateRange(req.query as Record<string, unknown>);

        const allTenants = await storage.getAllTenants();

        const tenantsMetrics: TenantMetrics[] = [];
        const aggregated = {
          totalTenants: allTenants.length,
          activeTenants: 0,
          trialTenants: 0,
          period: {
            from: from.toISOString().split("T")[0],
            to: to.toISOString().split("T")[0],
          },
          bookings: { total: 0, confirmed: 0, cancelled: 0, conversionRate: 0 },
          revenue: { total: 0, avgPerBooking: 0, byMonth: [] as MonthlyRevenue[] },
          chatbot: { conversations: 0, bookingsFromChat: 0, conversionRate: 0 },
          customers: { total: 0, returning: 0, avgRating: 0 },
        };

        for (const tenant of allTenants) {
          if (tenant.status === "active" || tenant.status === "trial") {
            if (tenant.status === "active") aggregated.activeTenants++;
            if (tenant.status === "trial") aggregated.trialTenants++;

            const metrics = await computeTenantMetrics(tenant.id, from, to);
            tenantsMetrics.push(metrics);

            aggregated.bookings.total += metrics.bookings.total;
            aggregated.bookings.confirmed += metrics.bookings.confirmed;
            aggregated.bookings.cancelled += metrics.bookings.cancelled;
            aggregated.revenue.total += metrics.revenue.total;
            aggregated.chatbot.conversations += metrics.chatbot.conversations;
            aggregated.chatbot.bookingsFromChat += metrics.chatbot.bookingsFromChat;
            aggregated.customers.total += metrics.customers.total;
            aggregated.customers.returning += metrics.customers.returning;
          }
        }

        // Compute derived aggregates
        if (aggregated.bookings.total > 0) {
          aggregated.bookings.conversionRate =
            Math.round((aggregated.bookings.confirmed / aggregated.bookings.total) * 100) / 100;
        }
        if (aggregated.bookings.confirmed > 0) {
          aggregated.revenue.avgPerBooking =
            Math.round(aggregated.revenue.total / aggregated.bookings.confirmed);
        }
        if (aggregated.chatbot.conversations > 0) {
          aggregated.chatbot.conversionRate =
            Math.round(
              (aggregated.chatbot.bookingsFromChat / aggregated.chatbot.conversations) * 1000,
            ) / 1000;
        }

        // Aggregate monthly revenue across all tenants
        const monthMap = new Map<string, number>();
        tenantsMetrics.forEach((tm) => {
          tm.revenue.byMonth.forEach((m) => {
            monthMap.set(m.month, (monthMap.get(m.month) ?? 0) + m.amount);
          });
        });
        aggregated.revenue.byMonth = Array.from(monthMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, amount]) => ({ month, amount }));

        // Average rating across all tenants with ratings
        const tenantRatings = tenantsMetrics
          .map((tm) => tm.customers.avgRating)
          .filter((r) => r > 0);
        if (tenantRatings.length > 0) {
          aggregated.customers.avgRating =
            Math.round(
              (tenantRatings.reduce((s, r) => s + r, 0) / tenantRatings.length) * 10,
            ) / 10;
        }

        res.json({
          aggregated,
          tenants: tenantsMetrics,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.error("[TenantMetrics] Error fetching super admin metrics", { error: message });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );
}
