import type { Express } from "express";
import { requireAdminSession } from "./auth";
import { logger } from "../lib/logger";
import { getWhatsAppFromNumber, isTwilioConfigured } from "../whatsapp/twilioClient";
import { isMetaWhatsAppConfigured } from "../whatsapp/metaClient";

const SANDBOX_WHATSAPP_FROM = "whatsapp:+14155238886";

interface IntegrationStatus {
  configured: boolean;
  detail?: string;
}

/**
 * Mask a phone-ish string so the diagnostic never leaks a full number in logs
 * or to the client. The Twilio sandbox number is public, so it's shown as-is.
 */
function maskFrom(from: string): string {
  if (from === SANDBOX_WHATSAPP_FROM) return from;
  const digits = from.replace(/\D/g, "");
  if (digits.length <= 4) return "***";
  return `${from.slice(0, 5)}***${digits.slice(-3)}`;
}

/**
 * Computes the REAL state of every revenue-critical integration in the running
 * environment. The point: production runs on Replit with its own env vars, so
 * reading the local .env tells you nothing. A 2-minute `GET
 * /api/admin/integrations-health` answers "is the lead-notification path
 * actually alive in prod?" — the leading hypothesis for why warm leads go cold.
 *
 * Never returns secret values: only booleans and safe derived facts.
 */
function buildIntegrationsReport() {
  const sendgridConfigured = !!process.env.SENDGRID_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "costabravarentaboat@gmail.com";

  const twilioConfigured = isTwilioConfigured();
  const whatsappFrom = getWhatsAppFromNumber();
  const twilioIsSandbox = whatsappFrom === SANDBOX_WHATSAPP_FROM;

  const metaWhatsAppConfigured = isMetaWhatsAppConfigured();

  const ga4Configured = !!(process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET);

  const indexNowConfigured = !!process.env.INDEXNOW_KEY;
  const valueSerpConfigured = !!process.env.VALUESERP_API_KEY;
  const perplexityConfigured = !!process.env.PERPLEXITY_API_KEY;

  const gbpOAuthConfigured = !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );

  const integrations: Record<string, IntegrationStatus> = {
    leadNotificationEmail: {
      configured: sendgridConfigured,
      detail: sendgridConfigured
        ? `Avisos de leads se envían a ${adminEmail}`
        : "SENDGRID_API_KEY ausente: el equipo NO recibe email de nuevas solicitudes",
    },
    twilioWhatsApp: {
      configured: twilioConfigured && !twilioIsSandbox,
      detail: !twilioConfigured
        ? "Twilio sin credenciales: seguimiento automático por WhatsApp desactivado"
        : twilioIsSandbox
          ? "Twilio usa el número SANDBOX (+14155238886): los mensajes NO llegan a clientes reales"
          : `Twilio operativo desde ${maskFrom(whatsappFrom)}`,
    },
    metaWhatsApp: {
      configured: metaWhatsAppConfigured,
      detail: metaWhatsAppConfigured
        ? "Meta WhatsApp Cloud API configurada"
        : "Meta WhatsApp Cloud API sin configurar (META_WHATSAPP_TOKEN / META_WHATSAPP_PHONE_ID)",
    },
    ga4ServerSide: {
      configured: ga4Configured,
      detail: ga4Configured
        ? "GA4 Measurement Protocol activo (generate_lead + booking_request_submitted)"
        : "GA4_MEASUREMENT_ID / GA4_API_SECRET ausentes: conversiones server-side ciegas",
    },
    indexNow: {
      configured: indexNowConfigured,
      detail: indexNowConfigured
        ? "IndexNow activo (Bing/Yandex)"
        : "INDEXNOW_KEY ausente: indexación lenta en Bing/Yandex",
    },
    serpTracking: {
      configured: valueSerpConfigured,
      detail: valueSerpConfigured
        ? "ValueSerp activo"
        : "VALUESERP_API_KEY ausente: sin tracking de rankings/SERP",
    },
    aiMentions: {
      configured: perplexityConfigured,
      detail: perplexityConfigured
        ? "Perplexity activo (monitor de citas en IA)"
        : "PERPLEXITY_API_KEY ausente: GEO sin medición de share-of-voice",
    },
    gbpOAuth: {
      configured: gbpOAuthConfigured,
      detail: gbpOAuthConfigured
        ? "OAuth de Google Business Profile configurado; conectar en /crm/autopilot#connect-gbp"
        : "OAuth de GBP sin configurar: no medimos vistas/llamadas de Maps",
    },
  };

  // Revenue-critical issues bubble to the top so the verdict is readable at a glance.
  const criticalIssues: string[] = [];
  if (!sendgridConfigured) {
    criticalIssues.push(
      "Aviso de leads por EMAIL desactivado: solicitudes y consultas entran sin que el equipo reciba notificación."
    );
  }
  if (twilioConfigured && twilioIsSandbox) {
    criticalIssues.push(
      "Seguimiento automático por WhatsApp apunta al SANDBOX de Twilio: los recordatorios no llegan a clientes."
    );
  }
  if (!ga4Configured) {
    criticalIssues.push(
      "GA4 server-side apagado: sin visibilidad de conversiones reales del embudo."
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    isReplit: !!process.env.REPLIT_DOMAINS,
    integrations,
    criticalIssues,
    healthy: criticalIssues.length === 0,
  };
}

export function registerAdminIntegrationsRoutes(app: Express): void {
  // Admin-only: real config state of every revenue-critical integration in the
  // running environment. Booleans + safe derived facts only, never secrets.
  app.get("/api/admin/integrations-health", requireAdminSession, (_req, res) => {
    try {
      res.json(buildIntegrationsReport());
    } catch (error: unknown) {
      logger.error("[Admin] integrations-health failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}

/**
 * Logs a one-line verdict at startup so a deploy that silently lost an env var
 * is visible in the logs without anyone hitting the endpoint.
 */
export function logIntegrationsHealthOnStartup(): void {
  try {
    const report = buildIntegrationsReport();
    if (report.healthy) {
      logger.info("[Integrations] All revenue-critical integrations healthy");
    } else {
      logger.warn("[Integrations] Revenue-critical issues detected at startup", {
        issues: report.criticalIssues,
      });
    }
  } catch (error: unknown) {
    logger.error("[Integrations] startup health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
