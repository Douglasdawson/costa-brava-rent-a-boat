import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, Globe, AlertCircle, TrendingUp, Languages, Clock } from "lucide-react";
import { StatCard } from "./shared/StatCard";
import { useBusinessStats } from "@/hooks/useBusinessStats";

interface Competitor {
  name: string;
  slug: string;
  url: string;
  phone: string;
  address: string;
  threatLevel: "high" | "mid" | "low";
  rating: number | null;
  reviewCount: number | null;
  fleetSize: string;
  priceFrom: string;
  licensed: boolean;
  privateTour: boolean;
  languages: string[];
  highlights: string[];
  weakPoints: string[];
  lastResearched: string;
}

// Data source: docs/sales/battlecard-2026-04-22.html
// Update manually after monthly competitor refresh (no scraping to avoid legal/maintenance burden).
const COMPETITORS: Competitor[] = [
  {
    name: "EricBoats",
    slug: "ericboats",
    url: "https://ericboatsblanes.com",
    phone: "+34 696 409 149",
    address: "Esplanada del Port, Blanes",
    threatLevel: "high",
    rating: null,
    reviewCount: null,
    fleetSize: "12 modelos (4.5–7.4m)",
    priceFrom: "80 €/h",
    licensed: true,
    privateTour: true,
    languages: ["es", "en", "ca"],
    highlights: ["Flota más amplia de Blanes", "Cobra RIB 700 (12 pax, 250hp)", "8 años en Sitges"],
    weakPoints: ["Solo 3 idiomas", "Entry más caro (80€ vs 70€)", "No son 100% locales"],
    lastResearched: "2026-04-22",
  },
  {
    name: "Rent a Boat Blanes",
    slug: "rent-a-boat-blanes",
    url: "https://www.rentaboatblanes.com",
    phone: "+34 601 909 910",
    address: "Esplanada del Port, Blanes",
    threatLevel: "high",
    rating: null,
    reviewCount: null,
    fleetSize: "5 barcos (Estable/Marion)",
    priceFrom: "80 €/h",
    licensed: false,
    privateTour: false,
    languages: ["es", "en", "ca", "fr"],
    highlights: ["Horario 9-21h 7 días", "Mismo muelle que nosotros", "Nombre SEO similar"],
    weakPoints: ["Solo sin licencia", "No tiene excursión privada", "4 idiomas solo"],
    lastResearched: "2026-04-22",
  },
  {
    name: "Blanes Boats",
    slug: "blanes-boats",
    url: "https://www.blanesboats.com",
    phone: "+34 690 222 118",
    address: "Pg. de Mestrança 116, Blanes",
    threatLevel: "mid",
    rating: null,
    reviewCount: null,
    fleetSize: "6 Voraz 450 + Pacific Craft 670",
    priceFrom: "~80 €/h",
    licensed: true,
    privateTour: true,
    languages: ["es", "en", "ca", "fr"],
    highlights: ["Pesca profesional (3 modalidades)", "Capitán profesional incluido", "4 idiomas"],
    weakPoints: ["Flota sin-licencia = Voraz duplicado", "No cubre DE/NL/IT/RU"],
    lastResearched: "2026-04-22",
  },
];

const threatLabel = {
  high: { text: "Alto riesgo", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  mid: { text: "Riesgo medio", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  low: { text: "Bajo riesgo", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
} as const;

export function CompetitionTab() {
  const { data: stats, isLoading } = useBusinessStats();

  const ourRating = stats?.rating ?? null;
  const ourReviews = stats?.userRatingCount ?? null;
  const lastSynced = stats?.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleDateString("es-ES") : "—";

  return (
    <div className="space-y-6" data-testid="competition-tab">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-heading">Competencia · Blanes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor de competidores directos. Datos actualizados manualmente tras research mensual.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Último refresh: 2026-04-22 · Fuente:{" "}
          <a
            href="/docs/sales/battlecard-2026-04-22.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Battlecard completo
          </a>
        </p>
      </div>

      {/* Nuestros KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Nuestro rating GBP"
          value={isLoading ? "-" : ourRating !== null ? ourRating.toFixed(2) : "N/A"}
          description={`${ourReviews ?? "-"} resenas · Sync ${lastSynced}`}
          icon={<Star className="h-4 w-4" />}
        />
        <StatCard
          title="Objetivo resenas/mes"
          value="+10"
          description="Meta del plan 90d (+30 total)"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Nuestro foso idioma"
          value="8"
          description="Max. competencia: 4 (DE/NL/IT/RU desatendidos)"
          icon={<Languages className="h-4 w-4" />}
        />
      </div>

      {/* Alerta confusión nominal */}
      <Card className="border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Riesgo activo: confusión nominal
              </h3>
              <p className="text-sm text-red-800/90 dark:text-red-200/90 mt-1">
                "Rent a Boat Blanes" (rentaboatblanes.com) opera desde el mismo muelle con marca casi idéntica.
                Verifica mensualmente que <strong>Ads de marca defensiva</strong> estén activos y tu GBP tenga{" "}
                <strong>más reseñas recientes que ellos</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista competidores */}
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Competidores directos</h3>
        {COMPETITORS.map((c) => (
          <Card key={c.slug} data-testid={`competitor-${c.slug}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-lg font-semibold">{c.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {c.address}
                </p>
              </div>
              <Badge className={threatLabel[c.threatLevel].cls} variant="secondary">
                {threatLabel[c.threatLevel].text}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">Flota</span>
                  <p className="font-medium mt-0.5">{c.fleetSize}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">Desde</span>
                  <p className="font-medium mt-0.5">{c.priceFrom}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">Licencia</span>
                  <p className="font-medium mt-0.5">{c.licensed ? "Sí" : "No"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">Excursión priv.</span>
                  <p className="font-medium mt-0.5">{c.privateTour ? "Sí" : "No"}</p>
                </div>
              </div>

              {/* Idiomas */}
              <div className="flex items-center gap-2 text-sm">
                <Languages className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Idiomas:</span>
                {c.languages.map((l) => (
                  <Badge key={l} variant="outline" className="text-xs">
                    {l.toUpperCase()}
                  </Badge>
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  (tú: 8 · ventaja {8 - c.languages.length})
                </span>
              </div>

              {/* Highlights + Weak points */}
              <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                    Dónde ganan
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {c.highlights.map((h, i) => (
                      <li key={i} className="text-muted-foreground">
                        · {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
                    Dónde ganamos
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {c.weakPoints.map((w, i) => (
                      <li key={i} className="text-muted-foreground">
                        · {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer links */}
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <Button asChild variant="outline" size="sm">
                  <a href={c.url} target="_blank" rel="noopener noreferrer" data-testid={`competitor-link-${c.slug}`}>
                    <Globe className="w-3 h-3 mr-1.5" />
                    Web
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`}>
                    <Phone className="w-3 h-3 mr-1.5" />
                    {c.phone}
                  </a>
                </Button>
                <span className="text-xs text-muted-foreground ml-auto self-center">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Research: {c.lastResearched}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Próximas mejoras */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-2">Próximas mejoras de este dashboard</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>· Tracking automático de reseñas GBP de competidores (vía Places API)</li>
            <li>· Histórico mensual con gráfica delta rating/reviews</li>
            <li>· Alertas por email si un competidor baja precio o cambia flota</li>
            <li>· Integración con batallacard interactivo directo desde tab</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
