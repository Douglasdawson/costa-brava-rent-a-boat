import type { Express } from "express";
import { requireAdminSession } from "./auth-middleware";
import { logger } from "../lib/logger";
import {
  isAdsConfigured,
  getAdsToken,
  getAdAccountId,
  verifyToken,
  fetchAccountInfo,
  fetchAccountInsights,
  fetchAccountInsightsSince,
  fetchCampaigns,
  fetchCampaignInsights,
  MetaAdsError,
  DATE_PRESETS,
  type DatePreset,
  type AdInsight,
  type AdCampaign,
} from "../services/metaAdsService";
import {
  isConfigured as isGoogleConfigured,
  fetchGA4MetaAttribution,
} from "../services/googleAnalyticsService";
import { getDashboardStatsEnhanced } from "../storage/analytics";
import {
  getCrmDamarBookingStats,
  matchAttributedBookings,
  isCrmDamarConfigured,
  type LeadForMatch,
} from "../lib/crmDamarStats";
import { pool } from "../db";

// Classify an inquiry's captured attribution into a marketing channel.
function classifyChannel(utmSource: string | null, fbclid: string | null): string {
  const s = (utmSource || "").toLowerCase();
  if (s.includes("meta") || s.includes("facebook")) return "meta";
  if (s === "ig" || s.includes("instagram")) return "instagram";
  if (s.includes("chatgpt") || s.includes("openai")) return "chatgpt";
  if (s.includes("google") || s.includes("gemini") || s.includes("perplexity")) return "ai_search";
  if (!s && fbclid) return "fbclid";
  return s || "otros";
}
// The paid campaign carries utm_source=meta (the LEADS LPV link is tagged that
// way). Organic Instagram arrives as utm=ig and fbclid-only is ambiguous, so the
// ROAS denominator (ad spend) is compared ONLY against utm=meta revenue —
// crediting organic social to ad spend would inflate ROAS. The per-channel table
// shows everything; the rollup isolates what the spend actually bought.
const META_PAID = new Set(["meta"]);

function parsePreset(value: unknown): DatePreset {
  return DATE_PRESETS.includes(value as DatePreset) ? (value as DatePreset) : "last_7d";
}

function presetToDays(preset: DatePreset): number {
  if (preset === "last_7d") return 7;
  if (preset === "last_30d") return 30;
  return 365;
}

function dateRange(days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
}

// Average ticket anchors the scale read (cost per lead vs ticket). The REAL
// confirmed bookings live in crmdamar, not in this app's DB (which only stores
// requests), so prefer crmdamar's value and fall back to the local 90-day stat.
async function resolveAvgTicket(): Promise<number> {
  try {
    const damar = await getCrmDamarBookingStats();
    if (damar && damar.avgTicket > 0) return damar.avgTicket;
  } catch {
    // fall through to local
  }
  try {
    const { startDate, endDate } = dateRange(90);
    const stats = await getDashboardStatsEnhanced(new Date(startDate), new Date(endDate));
    return stats.averageTicket;
  } catch (err) {
    logger.warn("[Meta Ads] could not load average ticket", {
      error: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

// ==================== Expert reads (flags) ====================

type Flag = { scope: string; level: "good" | "warn" | "info"; message: string };

interface CampaignRow extends AdCampaign {
  insight: AdInsight;
  flags: Flag[];
}

function buildCampaignFlags(
  c: AdCampaign,
  ins: AdInsight,
  preset: DatePreset,
  avgTicket: number
): Flag[] {
  const flags: Flag[] = [];
  const active = c.effectiveStatus === "ACTIVE";

  if (!active) {
    flags.push({
      scope: c.name,
      level: "info",
      message: `Estado ${c.effectiveStatus} (no esta entregando).`,
    });
  }

  // Active but not spending → not delivering (small audience / low bid / in review).
  if (active && ins.spend < 0.5 && ins.impressions < 50) {
    flags.push({
      scope: c.name,
      level: "warn",
      message: "Activa pero sin entrega: audiencia demasiado pequena, puja baja o aun en revision.",
    });
  }

  // Weak creative: low CTR with enough impressions to judge.
  if (ins.impressions >= 500 && ins.ctr > 0 && ins.ctr < 1) {
    flags.push({
      scope: c.name,
      level: "warn",
      message: `CTR ${ins.ctr.toFixed(2)}% bajo: creativo o segmentacion flojos.`,
    });
  }

  // Audience fatigue.
  if (ins.frequency > 3) {
    flags.push({
      scope: c.name,
      level: "warn",
      message: `Frecuencia ${ins.frequency.toFixed(1)}: fatiga de audiencia, amplia la ventana (14 -> 30/60 dias).`,
    });
  }

  // Learning-limited: Sales/conversion objective with too few weekly results.
  const weeklyResults = ins.results.leads + ins.results.purchases || ins.results.landingPageViews;
  const days = presetToDays(preset);
  const perWeek = days > 0 ? (weeklyResults / days) * 7 : weeklyResults;
  if (
    active &&
    /CONVERSION|SALES|OUTCOME_SALES|LEAD/i.test(c.objective) &&
    perWeek < 50 &&
    ins.spend > 1
  ) {
    flags.push({
      scope: c.name,
      level: "warn",
      message:
        "Pocos resultados/semana para salir de aprendizaje: optimiza por Landing Page Views hasta tener senal.",
    });
  }

  // Scale signal: cost per lead vs average ticket.
  const cpl = ins.costPerResult.lead;
  if (cpl != null && cpl > 0 && avgTicket > 0) {
    if (cpl < avgTicket) {
      flags.push({
        scope: c.name,
        level: "good",
        message: `Coste por lead ${cpl.toFixed(2)} < ticket medio ${avgTicket.toFixed(0)}: senal verde para subir presupuesto.`,
      });
    } else {
      flags.push({
        scope: c.name,
        level: "warn",
        message: `Coste por lead ${cpl.toFixed(2)} >= ticket medio ${avgTicket.toFixed(0)}: no escalar aun, optimiza antes.`,
      });
    }
  }

  return flags;
}

function buildAccountFlags(campaigns: CampaignRow[], account: AdInsight): Flag[] {
  const flags: Flag[] = [];
  if (campaigns.length === 0) {
    flags.push({ scope: "cuenta", level: "info", message: "No hay campanas en la cuenta." });
    return flags;
  }
  const anyActive = campaigns.some(c => c.effectiveStatus === "ACTIVE");
  if (!anyActive) {
    flags.push({ scope: "cuenta", level: "info", message: "Ninguna campana activa ahora mismo." });
  }
  if (anyActive && account.spend < 0.5) {
    flags.push({
      scope: "cuenta",
      level: "warn",
      message:
        "Hay campanas activas pero sin gasto: revisa estado de entrega, puja y tamano de audiencia.",
    });
  }
  return flags;
}

function mapMetaError(error: unknown) {
  const e = error instanceof MetaAdsError ? error : null;
  const message = e?.message || (error instanceof Error ? error.message : String(error));
  let hint: string | undefined;
  if (e?.code === 190) hint = "Token invalido o caducado.";
  else if (e?.code === 200 || e?.code === 10 || e?.code === 803)
    hint = "Al token le falta el permiso ads_read sobre esta cuenta.";
  else if (e?.code === 100)
    hint = "Cuenta no encontrada: revisa META_AD_ACCOUNT_ID (con prefijo act_).";
  return { message, hint, code: e?.code };
}

// ==================== Routes ====================

export function registerAdsRoutes(app: Express) {
  // Configuration + token health.
  app.get("/api/admin/ads/status", requireAdminSession, async (_req, res) => {
    try {
      if (!isAdsConfigured()) {
        return res.json({
          configured: false,
          accountId: getAdAccountId(),
          hint: "Falta el token. Crea un System User token con ads_read y ponlo en META_ADS_ACCESS_TOKEN.",
        });
      }
      const verification = await verifyToken();
      res.json({
        configured: true,
        accountId: getAdAccountId(),
        tokenSource: getAdsToken().source,
        verification,
      });
    } catch (error) {
      logger.error("[Meta Ads] status error", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ message: "Error comprobando el estado de Meta Ads" });
    }
  });

  // Overview: account insights + campaigns merged with insights + expert flags.
  app.get("/api/admin/ads/overview", requireAdminSession, async (req, res) => {
    const preset = parsePreset(req.query.preset);
    if (!isAdsConfigured()) {
      return res.json({ configured: false });
    }
    try {
      const avgTicket = await resolveAvgTicket();

      const [account, accountInsight, campaigns, campaignInsights] = await Promise.all([
        fetchAccountInfo(),
        fetchAccountInsights(preset),
        fetchCampaigns(),
        fetchCampaignInsights(preset),
      ]);

      const emptyInsight = (): AdInsight => ({
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: 0,
        frequency: 0,
        results: { landingPageViews: 0, leads: 0, purchases: 0, linkClicks: 0 },
        costPerResult: { landingPageView: null, lead: null, purchase: null, linkClick: null },
      });

      const rows: CampaignRow[] = campaigns
        .map(c => {
          const insight = campaignInsights.get(c.id) ?? emptyInsight();
          return { ...c, insight, flags: buildCampaignFlags(c, insight, preset, avgTicket) };
        })
        .sort((a, b) => b.insight.spend - a.insight.spend);

      res.json({
        configured: true,
        preset,
        currency: account.currency,
        avgTicket,
        account: { info: account, insight: accountInsight },
        campaigns: rows,
        flags: [...buildAccountFlags(rows, accountInsight), ...rows.flatMap(r => r.flags)],
      });
    } catch (error) {
      const mapped = mapMetaError(error);
      logger.error("[Meta Ads] overview error", mapped);
      res.status(502).json({ configured: true, error: mapped.message, hint: mapped.hint });
    }
  });

  // Attribution: GA4 meta-attributed sessions + real conversions, with cost-per-lead vs ticket.
  app.get("/api/admin/ads/attribution", requireAdminSession, async (req, res) => {
    const preset = parsePreset(req.query.preset);
    if (!isGoogleConfigured()) {
      return res.json({ configured: false, reason: "ga4_not_configured" });
    }
    try {
      const { startDate, endDate } = dateRange(presetToDays(preset));
      const attribution = await fetchGA4MetaAttribution(startDate, endDate);

      // Average ticket for the scale verdict (real value from crmdamar, local fallback).
      const avgTicket = await resolveAvgTicket();

      // Spend for the same window (if the Ads token works) → real cost per GA4 lead.
      let spend: number | null = null;
      if (isAdsConfigured()) {
        try {
          spend = (await fetchAccountInsights(preset)).spend;
        } catch {
          spend = null;
        }
      }

      const leads = attribution.events.generate_lead + attribution.events.booking_request_submitted;
      const costPerLead =
        spend != null && leads > 0 ? Math.round((spend / leads) * 100) / 100 : null;

      let verdict: { level: "good" | "warn" | "info"; message: string };
      if (leads === 0) {
        verdict = {
          level: "info",
          message: "Sin leads atribuidos a Meta en el periodo: aun no hay senal para decidir.",
        };
      } else if (costPerLead != null && avgTicket > 0) {
        verdict =
          costPerLead < avgTicket
            ? {
                level: "good",
                message: `Coste por lead ${costPerLead.toFixed(2)} < ticket medio ${avgTicket.toFixed(0)}: rentable, se puede escalar.`,
              }
            : {
                level: "warn",
                message: `Coste por lead ${costPerLead.toFixed(2)} >= ticket medio ${avgTicket.toFixed(0)}: optimiza antes de escalar.`,
              };
      } else {
        verdict = {
          level: "info",
          message: `${leads} leads atribuidos a Meta. Conecta el token de Ads para ver el coste por lead.`,
        };
      }

      res.json({
        configured: true,
        preset,
        attribution,
        spend,
        avgTicket,
        leads,
        costPerLead,
        verdict,
      });
    } catch (error) {
      logger.error("[Meta Ads] attribution error", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(502).json({ configured: true, error: "Error obteniendo atribucion de GA4" });
    }
  });

  // ROAS / closed loop, per channel. Take EVERY attributed inquiry (any utm or
  // fbclid), contact-match it against crmdamar's confirmed bookings within a time
  // window, and break down leads/bookings/revenue by marketing channel — so the
  // real question ("which channel actually produces paid bookings?") is answered,
  // not just Meta. Read-only; the loop-close is display-only (no writes).
  // Forward-looking: only inquiries created after attribution capture shipped
  // (2026-06-28) carry utm, so history before that is not counted.
  const ATTRIBUTION_SINCE = "2026-06-28";
  app.get("/api/admin/ads/roas", requireAdminSession, async (_req, res) => {
    if (!isCrmDamarConfigured()) {
      return res.json({ configured: false, reason: "crmdamar_not_configured" });
    }
    try {
      const result = await pool.query(
        `SELECT id, created_at, utm_source, utm_campaign, fbclid, lower(email) AS email,
                right(regexp_replace(coalesce(phone_prefix,'') || coalesce(phone_number,''), '[^0-9]', '', 'g'), 9) AS phone9
         FROM whatsapp_inquiries
         WHERE created_at >= $1
           AND (utm_source IS NOT NULL OR fbclid IS NOT NULL)
         ORDER BY created_at ASC`,
        [ATTRIBUTION_SINCE]
      );
      const rows = result.rows as Array<{
        id: string;
        created_at: Date;
        utm_source: string | null;
        utm_campaign: string | null;
        fbclid: string | null;
        email: string | null;
        phone9: string | null;
      }>;

      // Channel per inquiry, keyed by id. First-touch order (ASC) means the
      // earliest lead of a repeat contact wins the booking credit.
      const channelById = new Map<string, string>();
      const leads: LeadForMatch[] = rows.map(r => {
        channelById.set(r.id, classifyChannel(r.utm_source, r.fbclid));
        return {
          inquiryId: r.id,
          createdAt: new Date(r.created_at),
          email: r.email,
          phone9: r.phone9,
        };
      });

      const matches = await matchAttributedBookings(leads);

      // Aggregate per channel. Each channel: leads seen + unique bookings +
      // revenue. `matches` is already deduped by booking across all leads.
      type Agg = { leads: number; bookings: number; revenue: number };
      const byChannel = new Map<string, Agg>();
      const ensure = (ch: string): Agg => {
        let a = byChannel.get(ch);
        if (!a) {
          a = { leads: 0, bookings: 0, revenue: 0 };
          byChannel.set(ch, a);
        }
        return a;
      };
      for (const ch of channelById.values()) ensure(ch).leads += 1;
      for (const m of matches) {
        const ch = channelById.get(m.inquiryId) || "otros";
        const a = ensure(ch);
        a.bookings += 1;
        a.revenue = Math.round((a.revenue + m.total) * 100) / 100;
      }

      const channels = [...byChannel.entries()]
        .map(([channel, a]) => ({
          channel,
          leads: a.leads,
          bookings: a.bookings,
          revenue: a.revenue,
          conversionRate: a.leads > 0 ? Math.round((a.bookings / a.leads) * 1000) / 10 : 0,
        }))
        .sort((x, y) => y.revenue - x.revenue || y.leads - x.leads);

      // Meta-paid rollup (meta + instagram + fbclid) vs actual Meta spend.
      const metaAgg = channels
        .filter(c => META_PAID.has(c.channel))
        .reduce(
          (acc, c) => ({
            leads: acc.leads + c.leads,
            bookings: acc.bookings + c.bookings,
            revenue: Math.round((acc.revenue + c.revenue) * 100) / 100,
          }),
          { leads: 0, bookings: 0, revenue: 0 }
        );

      // Spend must match the attribution window, NOT all-time. The "maximum"
      // preset spans years/65 campaigns and would crush ROAS to a meaningless
      // number. Align it with `since` so €spend and €revenue cover the same days.
      let spend = 0;
      try {
        spend = (await fetchAccountInsightsSince(ATTRIBUTION_SINCE)).spend;
      } catch {
        // Meta token may be unavailable; ROAS just won't be computed.
      }
      const meta = {
        ...metaAgg,
        spend,
        roas: spend > 0 ? Math.round((metaAgg.revenue / spend) * 100) / 100 : null,
        costPerLead: metaAgg.leads > 0 ? Math.round((spend / metaAgg.leads) * 100) / 100 : null,
        costPerBooking:
          metaAgg.bookings > 0 ? Math.round((spend / metaAgg.bookings) * 100) / 100 : null,
      };

      // Transparent list of the matched bookings (for the panel).
      const bookings = matches
        .map(m => ({
          channel: channelById.get(m.inquiryId) || "otros",
          tripDate: m.tripDate,
          total: m.total,
          boatType: m.boatType,
        }))
        .sort((a, b) => b.total - a.total);

      res.json({
        configured: true,
        windowed: true,
        since: ATTRIBUTION_SINCE,
        totalLeads: rows.length,
        totalBookings: matches.length,
        channels,
        meta,
        bookings,
      });
    } catch (error) {
      logger.error("[Meta Ads] roas error", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ configured: true, error: "Error calculando ROAS atribuido" });
    }
  });
}
