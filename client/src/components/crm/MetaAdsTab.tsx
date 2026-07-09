import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  Loader2,
  AlertTriangle,
  Eye,
  MousePointerClick,
  Euro,
  Repeat,
  Target,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "./shared/StatCard";

interface MetaAdsTabProps {
  adminToken: string;
}

type Preset = "last_7d" | "last_30d" | "maximum";

interface AdInsight {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reach: number;
  frequency: number;
  results: { landingPageViews: number; leads: number; purchases: number; linkClicks: number };
  costPerResult: {
    landingPageView: number | null;
    lead: number | null;
    purchase: number | null;
    linkClick: number | null;
  };
}

interface Flag {
  scope: string;
  level: "good" | "warn" | "info";
  message: string;
}

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  effectiveStatus: string;
  objective: string;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  insight: AdInsight;
  flags: Flag[];
}

interface StatusResponse {
  configured: boolean;
  accountId: string;
  tokenSource?: "ads" | "capi" | null;
  hint?: string;
  verification?: {
    ok: boolean;
    source: "ads" | "capi" | null;
    accountName?: string;
    currency?: string;
    accountStatusLabel?: string;
    error?: string;
    hint?: string;
  };
}

interface OverviewResponse {
  configured: boolean;
  preset?: Preset;
  currency?: string;
  avgTicket?: number;
  account?: {
    info: {
      name: string;
      currency: string;
      accountStatusLabel: string;
      amountSpentAllTime: number;
    };
    insight: AdInsight;
  };
  campaigns?: CampaignRow[];
  flags?: Flag[];
  error?: string;
  hint?: string;
}

interface AttributionResponse {
  configured: boolean;
  reason?: string;
  attribution?: {
    sessions: number;
    users: number;
    events: { generate_lead: number; booking_request_submitted: number; purchase: number };
    bySource: Array<{ source: string; medium: string; sessions: number }>;
  };
  spend?: number | null;
  avgTicket?: number;
  leads?: number;
  costPerLead?: number | null;
  verdict?: { level: "good" | "warn" | "info"; message: string };
  error?: string;
}

interface RoasChannel {
  channel: string;
  leads: number;
  bookings: number;
  revenue: number;
  conversionRate: number;
}
interface RoasResponse {
  configured: boolean;
  reason?: string;
  windowed?: boolean;
  since?: string;
  totalLeads?: number;
  totalBookings?: number;
  channels?: RoasChannel[];
  meta?: {
    leads: number;
    bookings: number;
    revenue: number;
    spend: number;
    roas: number | null;
    costPerLead: number | null;
    costPerBooking: number | null;
  };
  bookings?: Array<{
    channel: string;
    tripDate: string;
    total: number;
    boatType: string | null;
  }>;
  error?: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  meta: "Meta (pago)",
  instagram: "Instagram",
  fbclid: "Facebook (fbclid)",
  chatgpt: "ChatGPT",
  ai_search: "IA / buscadores",
  otros: "Otros",
};
const channelLabel = (c: string) => CHANNEL_LABELS[c] || c;

const PRESET_LABELS: Record<Preset, string> = {
  last_7d: "7 dias",
  last_30d: "30 dias",
  maximum: "Todo",
};

const FLAG_DOT: Record<Flag["level"], string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  info: "bg-muted-foreground/40",
};

const credentialOpts = { credentials: "include" as const };

function money(value: number | null | undefined, currency = "EUR"): string {
  if (value == null) return "--";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function statusBadge(effectiveStatus: string) {
  const s = effectiveStatus.toUpperCase();
  if (s === "ACTIVE") return <Badge className="bg-emerald-500 hover:bg-emerald-500">Activa</Badge>;
  if (s === "PAUSED" || s === "CAMPAIGN_PAUSED") return <Badge variant="secondary">Pausada</Badge>;
  if (s.includes("DISAPPROVED") || s.includes("REJECTED") || s.includes("WITH_ISSUES"))
    return <Badge variant="destructive">{s}</Badge>;
  return <Badge variant="outline">{s}</Badge>;
}

export function MetaAdsTab({ adminToken: _adminToken }: MetaAdsTabProps) {
  const [preset, setPreset] = useState<Preset>("last_7d");

  const { data: status, isLoading: statusLoading } = useQuery<StatusResponse>({
    queryKey: ["/api/admin/ads/status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ads/status", credentialOpts);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const { data: overview, isLoading: overviewLoading } = useQuery<OverviewResponse>({
    queryKey: ["/api/admin/ads/overview", preset],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ads/overview?preset=${preset}`, credentialOpts);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const { data: attribution, isLoading: attributionLoading } = useQuery<AttributionResponse>({
    queryKey: ["/api/admin/ads/attribution", preset],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ads/attribution?preset=${preset}`, credentialOpts);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const { data: roas } = useQuery<RoasResponse>({
    queryKey: ["/api/admin/ads/roas"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ads/roas", credentialOpts);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const adsConfigured = status?.configured && status?.verification?.ok;
  const currency = overview?.currency || status?.verification?.currency || "EUR";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Anuncios de Meta
          </h2>
          <p className="text-sm text-muted-foreground">
            Rendimiento real de Facebook e Instagram Ads (solo lectura).
          </p>
        </div>
        <div className="flex gap-1">
          {(Object.keys(PRESET_LABELS) as Preset[]).map(p => (
            <Button
              key={p}
              size="sm"
              variant={preset === p ? "default" : "outline"}
              onClick={() => setPreset(p)}
              data-testid={`ads-preset-${p}`}
            >
              {PRESET_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* Token not configured / failed verification */}
      {!statusLoading && !adsConfigured && (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Conexion con Meta Ads no
              disponible
            </CardTitle>
            <CardDescription>
              {status?.verification?.error ||
                status?.hint ||
                "Falta el token de lectura de anuncios."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>{status?.verification?.hint || status?.hint}</p>
            <p>
              Cuenta configurada: <code className="text-foreground">{status?.accountId}</code>
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                En Meta Business Settings &gt; Usuarios &gt; Usuarios del sistema, genera un token
                con permiso <code>ads_read</code> y la cuenta publicitaria asignada.
              </li>
              <li>
                Ponlo en la variable <code>META_ADS_ACCESS_TOKEN</code> (en local y en Replit) y
                vuelve a publicar.
              </li>
            </ol>
            <p className="text-xs">
              El panel de atribucion de GA4 (abajo) funciona aunque esto no este conectado.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Account-level metrics */}
      {adsConfigured && overview?.configured && overview.account && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              title="Gasto"
              value={money(overview.account.insight.spend, currency)}
              icon={<Euro className="h-4 w-4" />}
            />
            <StatCard
              title="Impresiones"
              value={overview.account.insight.impressions.toLocaleString("es-ES")}
              icon={<Eye className="h-4 w-4" />}
            />
            <StatCard
              title="Clics"
              value={overview.account.insight.clicks.toLocaleString("es-ES")}
              icon={<MousePointerClick className="h-4 w-4" />}
            />
            <StatCard
              title="CTR"
              value={`${overview.account.insight.ctr.toFixed(2)}%`}
              status={
                overview.account.insight.ctr >= 1
                  ? "good"
                  : overview.account.insight.ctr > 0
                    ? "warn"
                    : "neutral"
              }
              icon={<Target className="h-4 w-4" />}
            />
            <StatCard
              title="CPM"
              value={money(overview.account.insight.cpm, currency)}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              title="Frecuencia"
              value={overview.account.insight.frequency.toFixed(1)}
              status={overview.account.insight.frequency > 3 ? "warn" : "neutral"}
              icon={<Repeat className="h-4 w-4" />}
            />
          </div>

          {/* Campaigns table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campanas</CardTitle>
              <CardDescription>
                Periodo {PRESET_LABELS[preset]} · ticket medio {money(overview.avgTicket, currency)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overview.campaigns && overview.campaigns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campana</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Objetivo</TableHead>
                      <TableHead className="text-right">Presup./dia</TableHead>
                      <TableHead className="text-right">Gasto</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Coste/lead</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.campaigns.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium max-w-[220px] truncate">
                          {c.name}
                        </TableCell>
                        <TableCell>{statusBadge(c.effectiveStatus)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.objective}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.dailyBudget != null ? money(c.dailyBudget, currency) : "--"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {money(c.insight.spend, currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.insight.ctr.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.insight.results.leads || "--"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {money(c.insight.costPerResult.lead, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay campanas en la cuenta para este periodo.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Expert reads */}
          {overview.flags && overview.flags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" /> Lecturas de experto
                </CardTitle>
                <CardDescription>Diagnostico automatico de lo que conviene hacer.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {overview.flags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${FLAG_DOT[f.level]}`}
                      />
                      <span>
                        <span className="text-muted-foreground">[{f.scope}]</span> {f.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Overview error (token works but a fetch failed) */}
      {adsConfigured && overview && overview.configured === true && overview.error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">
            {overview.error}{" "}
            {overview.hint && <span className="text-muted-foreground">— {overview.hint}</span>}
          </CardContent>
        </Card>
      )}

      {/* GA4 attribution (independent of the ads token) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> Atribucion real (GA4)
          </CardTitle>
          <CardDescription>
            Trafico y conversiones que GA4 atribuye a Meta. Es la verdad downstream: leads y
            solicitudes reales, no solo eventos del Pixel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attributionLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : !attribution?.configured ? (
            <p className="text-sm text-muted-foreground">
              GA4 no esta configurado, no se puede medir atribucion.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  title="Sesiones Meta"
                  value={(attribution.attribution?.sessions ?? 0).toLocaleString("es-ES")}
                />
                <StatCard
                  title="Leads (form)"
                  value={attribution.attribution?.events.generate_lead ?? 0}
                />
                <StatCard
                  title="Solicitudes reserva"
                  value={attribution.attribution?.events.booking_request_submitted ?? 0}
                />
                <StatCard
                  title="Coste/lead"
                  value={money(attribution.costPerLead ?? null, currency)}
                  description={
                    attribution.spend != null
                      ? `gasto ${money(attribution.spend, currency)}`
                      : "sin gasto conectado"
                  }
                />
              </div>
              {attribution.verdict && (
                <div className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${FLAG_DOT[attribution.verdict.level]}`}
                  />
                  <span>{attribution.verdict.message}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closed loop: attributed leads matched to real crmdamar bookings, by channel */}
      {roas?.configured && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Euro className="h-4 w-4" /> Retorno real por canal (reservas de crmdamar)
            </CardTitle>
            <CardDescription>
              Cada solicitud con origen etiquetado (utm o fbclid) cruzada por telefono o email contra
              las reservas confirmadas reales, dentro de una ventana desde la fecha del lead. Solo
              lectura. Datos desde {roas.since || "2026-06-28"}. El ROAS compara el gasto solo con la
              campana de pago (utm=meta); Instagram y fbclid se muestran aparte porque suelen ser
              trafico organico, no de anuncios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Meta paid rollup vs spend */}
            {roas.meta && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  title="Gasto campana"
                  value={money(roas.meta.spend ?? 0, currency)}
                  description="anuncios de pago en la ventana"
                />
                <StatCard
                  title="Reservas de pago"
                  value={roas.meta.bookings ?? 0}
                  description={`de ${roas.meta.leads} solicitudes utm=meta`}
                />
                <StatCard
                  title="Coste / reserva"
                  value={
                    roas.meta.costPerBooking != null
                      ? money(roas.meta.costPerBooking, currency)
                      : "sin reservas aun"
                  }
                />
                <StatCard
                  title="ROAS de pago"
                  value={roas.meta.roas != null ? `${roas.meta.roas.toFixed(2)}x` : "--"}
                  description={`${money(roas.meta.revenue ?? 0, currency)} atribuidos`}
                  status={
                    roas.meta.roas != null ? (roas.meta.roas >= 1 ? "good" : "warn") : "neutral"
                  }
                />
              </div>
            )}

            {/* Per-channel breakdown */}
            {roas.channels && roas.channels.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-3 font-medium">Canal</th>
                      <th className="py-2 px-3 font-medium text-right">Solicitudes</th>
                      <th className="py-2 px-3 font-medium text-right">Reservas</th>
                      <th className="py-2 px-3 font-medium text-right">Conversion</th>
                      <th className="py-2 pl-3 font-medium text-right">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roas.channels.map(c => (
                      <tr key={c.channel} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{channelLabel(c.channel)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{c.leads}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{c.bookings}</td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {c.conversionRate.toFixed(0)}%
                        </td>
                        <td className="py-2 pl-3 text-right tabular-nums">
                          {money(c.revenue, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Transparent list of matched bookings */}
            {roas.bookings && roas.bookings.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Reservas casadas ({roas.bookings.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {roas.bookings.map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
                    >
                      <span className="font-medium">{channelLabel(b.channel)}</span>
                      <span className="text-muted-foreground">
                        {b.tripDate.slice(0, 10)} · {money(b.total, currency)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(roas.totalBookings ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">
                Aun no hay reservas casadas con solicitudes etiquetadas. El panel se llena segun se
                confirman reservas de leads con origen conocido.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {(statusLoading || overviewLoading) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando datos de Meta...
        </div>
      )}
    </div>
  );
}
