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
      // Average ticket (last 90 days of confirmed bookings) anchors the scale read.
      let avgTicket = 0;
      try {
        const { startDate, endDate } = dateRange(90);
        const stats = await getDashboardStatsEnhanced(new Date(startDate), new Date(endDate));
        avgTicket = stats.averageTicket;
      } catch (err) {
        logger.warn("[Meta Ads] could not load average ticket", {
          error: err instanceof Error ? err.message : String(err),
        });
      }

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

      // Average ticket for the scale verdict.
      let avgTicket = 0;
      try {
        const ninety = dateRange(90);
        const stats = await getDashboardStatsEnhanced(
          new Date(ninety.startDate),
          new Date(ninety.endDate)
        );
        avgTicket = stats.averageTicket;
      } catch {
        // non-fatal
      }

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
}
