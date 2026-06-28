import { logger } from "../lib/logger";

// Read-only client for the Meta Marketing API (Graph API).
// Reads ad performance back into the CRM (campaigns, spend, CTR, results).
// It NEVER mutates campaigns: every call is a GET.
//
// Token resolution: META_ADS_ACCESS_TOKEN (a System User token with `ads_read`)
// takes precedence; if absent we fall back to META_CAPI_ACCESS_TOKEN, which may
// or may not carry `ads_read` (the /status endpoint reports which one is in use
// and whether it actually works).

const API_VERSION = "v21.0";
const DEFAULT_AD_ACCOUNT_ID = "act_10212525544363556";

export type DatePreset = "last_7d" | "last_30d" | "maximum";
export const DATE_PRESETS: DatePreset[] = ["last_7d", "last_30d", "maximum"];

export class MetaAdsError extends Error {
  code?: number;
  type?: string;
  constructor(message: string, code?: number, type?: string) {
    super(message);
    this.name = "MetaAdsError";
    this.code = code;
    this.type = type;
  }
}

// ==================== Credentials ====================

export type AdsTokenSource = "ads" | "capi" | null;

export function getAdsToken(): { token: string | null; source: AdsTokenSource } {
  if (process.env.META_ADS_ACCESS_TOKEN) {
    return { token: process.env.META_ADS_ACCESS_TOKEN, source: "ads" };
  }
  if (process.env.META_CAPI_ACCESS_TOKEN) {
    return { token: process.env.META_CAPI_ACCESS_TOKEN, source: "capi" };
  }
  return { token: null, source: null };
}

export function getAdAccountId(): string {
  const raw = (process.env.META_AD_ACCOUNT_ID || DEFAULT_AD_ACCOUNT_ID).trim();
  return raw.startsWith("act_") ? raw : `act_${raw}`;
}

export function isAdsConfigured(): boolean {
  return getAdsToken().token !== null;
}

// ==================== Graph API plumbing ====================

async function graphGet<T = Record<string, unknown>>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  const { token } = getAdsToken();
  if (!token) {
    throw new MetaAdsError("Meta Ads access token not configured");
  }

  const url = new URL(`https://graph.facebook.com/${API_VERSION}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", token);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (error) {
    throw new MetaAdsError(
      `Network error contacting Meta Graph API: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const json = (await response.json()) as {
    error?: { message?: string; code?: number; type?: string };
  } & T;

  if (!response.ok || json.error) {
    const err = json.error || {};
    logger.error("[Meta Ads] Graph API error", {
      path,
      status: response.status,
      code: err.code,
      type: err.type,
      message: err.message,
    });
    throw new MetaAdsError(err.message || `Graph API error ${response.status}`, err.code, err.type);
  }

  return json;
}

// ==================== Insight normalization ====================

interface RawAction {
  action_type: string;
  value: string;
}

interface RawInsightRow {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  frequency?: string;
  actions?: RawAction[];
  cost_per_action_type?: RawAction[];
}

export interface AdInsight {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number; // percent (Meta returns it as a percentage already)
  cpc: number;
  cpm: number;
  reach: number;
  frequency: number;
  results: {
    landingPageViews: number;
    leads: number;
    purchases: number;
    linkClicks: number;
  };
  costPerResult: {
    landingPageView: number | null;
    lead: number | null;
    purchase: number | null;
    linkClick: number | null;
  };
}

const num = (v: string | undefined): number => {
  const n = parseFloat(v || "0");
  return Number.isFinite(n) ? n : 0;
};

function sumActions(actions: RawAction[] | undefined, keys: string[]): number {
  if (!actions) return 0;
  return actions
    .filter(a => keys.includes(a.action_type))
    .reduce((acc, a) => acc + num(a.value), 0);
}

function pickCost(costs: RawAction[] | undefined, keys: string[]): number | null {
  if (!costs) return null;
  const match = costs.find(c => keys.includes(c.action_type));
  return match ? num(match.value) : null;
}

// Meta groups lead/purchase results under several pixel/onsite action types.
const LEAD_KEYS = ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"];
const PURCHASE_KEYS = ["purchase", "onsite_web_purchase", "offsite_conversion.fb_pixel_purchase"];
const LPV_KEYS = ["landing_page_view"];
const LINK_CLICK_KEYS = ["link_click"];

export function normalizeInsightRow(row: RawInsightRow): AdInsight {
  return {
    spend: num(row.spend),
    impressions: num(row.impressions),
    clicks: num(row.clicks),
    ctr: num(row.ctr),
    cpc: num(row.cpc),
    cpm: num(row.cpm),
    reach: num(row.reach),
    frequency: num(row.frequency),
    results: {
      landingPageViews: sumActions(row.actions, LPV_KEYS),
      leads: sumActions(row.actions, LEAD_KEYS),
      purchases: sumActions(row.actions, PURCHASE_KEYS),
      linkClicks: sumActions(row.actions, LINK_CLICK_KEYS),
    },
    costPerResult: {
      landingPageView: pickCost(row.cost_per_action_type, LPV_KEYS),
      lead: pickCost(row.cost_per_action_type, LEAD_KEYS),
      purchase: pickCost(row.cost_per_action_type, PURCHASE_KEYS),
      linkClick: pickCost(row.cost_per_action_type, LINK_CLICK_KEYS),
    },
  };
}

const INSIGHT_FIELDS =
  "spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type";

// ==================== Public reads ====================

export interface AdAccountInfo {
  id: string;
  name: string;
  accountStatus: number;
  accountStatusLabel: string;
  currency: string;
  amountSpentAllTime: number; // major units
}

const ACCOUNT_STATUS_LABELS: Record<number, string> = {
  1: "active",
  2: "disabled",
  3: "unsettled",
  7: "pending_risk_review",
  8: "pending_settlement",
  9: "in_grace_period",
  100: "pending_closure",
  101: "closed",
  201: "any_active",
  202: "any_closed",
};

export async function fetchAccountInfo(): Promise<AdAccountInfo> {
  const data = await graphGet<{
    id: string;
    name?: string;
    account_status?: number;
    currency?: string;
    amount_spent?: string;
  }>(getAdAccountId(), { fields: "name,account_status,currency,amount_spent" });

  const status = data.account_status ?? 0;
  return {
    id: data.id,
    name: data.name || getAdAccountId(),
    accountStatus: status,
    accountStatusLabel: ACCOUNT_STATUS_LABELS[status] || `status_${status}`,
    currency: data.currency || "EUR",
    // amount_spent comes back in the account currency's minor unit (cents).
    amountSpentAllTime: num(data.amount_spent) / 100,
  };
}

export interface TokenVerification {
  ok: boolean;
  source: AdsTokenSource;
  accountName?: string;
  currency?: string;
  accountStatusLabel?: string;
  error?: string;
  hint?: string;
}

export async function verifyToken(): Promise<TokenVerification> {
  const { source } = getAdsToken();
  if (source === null) {
    return {
      ok: false,
      source,
      error: "No Meta access token configured",
      hint: "Set META_ADS_ACCESS_TOKEN",
    };
  }
  try {
    const info = await fetchAccountInfo();
    return {
      ok: true,
      source,
      accountName: info.name,
      currency: info.currency,
      accountStatusLabel: info.accountStatusLabel,
    };
  } catch (error) {
    const e = error instanceof MetaAdsError ? error : new MetaAdsError(String(error));
    let hint: string | undefined;
    if (e.code === 190) {
      hint = "Token invalid or expired. Generate a new token.";
    } else if (e.code === 200 || e.code === 10 || e.code === 803) {
      hint =
        source === "capi"
          ? "The CAPI token lacks ads_read. Create a System User token with ads_read on this ad account and set META_ADS_ACCESS_TOKEN."
          : "Token is missing the ads_read permission for this ad account.";
    } else if (e.code === 100) {
      hint = "Ad account id not found. Check META_AD_ACCOUNT_ID (must include the act_ prefix).";
    }
    return { ok: false, source, error: e.message, hint };
  }
}

export async function fetchAccountInsights(preset: DatePreset): Promise<AdInsight> {
  const data = await graphGet<{ data?: RawInsightRow[] }>(`${getAdAccountId()}/insights`, {
    level: "account",
    date_preset: preset,
    fields: INSIGHT_FIELDS,
  });
  const row = data.data?.[0];
  // No spend in the window → Meta returns an empty array, not a zero row.
  return row ? normalizeInsightRow(row) : normalizeInsightRow({});
}

export interface AdCampaign {
  id: string;
  name: string;
  status: string;
  effectiveStatus: string;
  objective: string;
  dailyBudget: number | null; // major units
  lifetimeBudget: number | null; // major units
  startTime: string | null;
  stopTime: string | null;
}

export async function fetchCampaigns(): Promise<AdCampaign[]> {
  const data = await graphGet<{
    data?: Array<{
      id: string;
      name?: string;
      status?: string;
      effective_status?: string;
      objective?: string;
      daily_budget?: string;
      lifetime_budget?: string;
      start_time?: string;
      stop_time?: string;
    }>;
  }>(`${getAdAccountId()}/campaigns`, {
    fields:
      "name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time",
    limit: "100",
  });

  return (data.data || []).map(c => ({
    id: c.id,
    name: c.name || "(sin nombre)",
    status: c.status || "UNKNOWN",
    effectiveStatus: c.effective_status || c.status || "UNKNOWN",
    objective: c.objective || "UNKNOWN",
    // Budgets come back in minor units (cents) of the account currency.
    dailyBudget: c.daily_budget ? num(c.daily_budget) / 100 : null,
    lifetimeBudget: c.lifetime_budget ? num(c.lifetime_budget) / 100 : null,
    startTime: c.start_time || null,
    stopTime: c.stop_time || null,
  }));
}

export async function fetchCampaignInsights(preset: DatePreset): Promise<Map<string, AdInsight>> {
  const data = await graphGet<{ data?: RawInsightRow[] }>(`${getAdAccountId()}/insights`, {
    level: "campaign",
    date_preset: preset,
    fields: `campaign_id,campaign_name,${INSIGHT_FIELDS}`,
    limit: "100",
  });

  const byCampaign = new Map<string, AdInsight>();
  for (const row of data.data || []) {
    if (row.campaign_id) {
      byCampaign.set(row.campaign_id, normalizeInsightRow(row));
    }
  }
  return byCampaign;
}
