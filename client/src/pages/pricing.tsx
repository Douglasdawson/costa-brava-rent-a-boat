import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Users,
  Anchor,
  Fuel,
  ArrowRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import type { Boat } from "@shared/schema";
import { getMinActivePrice } from "@shared/pricing";

type SeasonKey = "BAJA" | "MEDIA" | "ALTA";

const SEASON_LABELS: Record<SeasonKey, string> = {
  BAJA: "Abr-Jun, Sep-Oct",
  MEDIA: "Julio",
  ALTA: "Agosto",
};

const SEASON_NAMES: Record<SeasonKey, string> = {
  BAJA: "Temporada Baja",
  MEDIA: "Temporada Media",
  ALTA: "Temporada Alta",
};

function getMinPrice(boat: Boat, season: SeasonKey): number | null {
  if (!boat.pricing) return null;
  const seasonData = (boat.pricing as Record<SeasonKey, { period: string; prices: Record<string, number> }>)[season];
  return getMinActivePrice(seasonData?.prices);
}

/** Cheapest active price for a given duration across a list of boats, or null. */
function minPriceAcrossBoats(
  boats: Boat[],
  duration: string,
  season: SeasonKey,
): number | null {
  let min = Infinity;
  for (const b of boats) {
    const pricing = b.pricing as Record<SeasonKey, { prices: Record<string, number | null | undefined> }> | null;
    const p = pricing?.[season]?.prices?.[duration];
    if (typeof p === "number" && p > 0 && p < min) min = p;
  }
  return Number.isFinite(min) ? min : null;
}

function formatPrice(price: number | null): string {
  if (price === null) return "-";
  return `${price}\u20AC`;
}

const LICENSE_TYPE_LABELS: Record<string, string> = {
  none: "Sin licencia",
  navegacion: "Lic. Navegación",
  pnb: "PNB requerido",
  per: "PER requerido",
  patron_yate: "Patrón de Yate",
  capitan_yate: "Capitán de Yate",
};

function getLicenseLabel(boat: Boat): string {
  const lt = (boat as Boat & { licenseType?: string }).licenseType;
  if (lt && lt !== "none") {
    return LICENSE_TYPE_LABELS[lt] || lt;
  }
  if (!boat.requiresLicense) return "Sin licencia";
  const licenseFeature = (boat.features as string[] | null)?.find(
    (f) => f.toLowerCase().includes("licencia") || f.toLowerCase().includes("license")
  );
  return licenseFeature || "Con licencia";
}

export default function PricingPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const seoConfig = getSEOConfig("pricing", language);
  const hreflangLinks = generateHreflangLinks("pricing");
  const canonical = generateCanonicalUrl("pricing", language);

  const { data: boats, isLoading } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });

  const activeBoats = (boats || [])
    .filter((boat) => boat.isActive)
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  const unlicensedBoats = activeBoats.filter((b) => !b.requiresLicense);
  const licensedBoats = activeBoats.filter((b) => b.requiresLicense);

  // Dynamic "desde X €" figures for FAQ + JSON-LD so they stay in sync with admin pricing.
  const noLic1h = {
    BAJA: minPriceAcrossBoats(unlicensedBoats, "1h", "BAJA"),
    MEDIA: minPriceAcrossBoats(unlicensedBoats, "1h", "MEDIA"),
    ALTA: minPriceAcrossBoats(unlicensedBoats, "1h", "ALTA"),
  };
  const lic2hBaja = minPriceAcrossBoats(licensedBoats, "2h", "BAJA");

  const priceTag = (v: number | null, unit: string) => (v !== null ? `${v} €${unit}` : "—");

  const noLicAnswer = `Los barcos sin licencia en Blanes cuestan desde ${priceTag(noLic1h.BAJA, "/hora")} en temporada baja (abril-junio, septiembre-octubre). En temporada media (julio) desde ${priceTag(noLic1h.MEDIA, "/hora")} y en temporada alta (agosto) desde ${priceTag(noLic1h.ALTA, "/hora")}. El precio incluye gasolina, seguro y equipo de seguridad.`;
  const licAnswer = `Los barcos con licencia en Blanes cuestan desde ${priceTag(lic2hBaja, "/2h")} en temporada baja. Requieren PER o título náutico equivalente. Son barcos más potentes con mayor autonomía para explorar la Costa Brava.`;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs?.home || "Inicio", url: "/" },
    { name: "Precios", url: "/precios" },
  ]);

  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Cuánto cuesta alquilar un barco sin licencia en Blanes?",
        acceptedAnswer: { "@type": "Answer", text: noLicAnswer },
      },
      {
        "@type": "Question",
        name: "¿La gasolina está incluida en el precio del alquiler?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí, todos nuestros barcos sin licencia incluyen la gasolina en el precio. Para los barcos con licencia, el combustible se paga aparte según el consumo real.",
        },
      },
      {
        "@type": "Question",
        name: "¿Hay diferencia de precio entre temporada baja y alta?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí. La temporada baja (abril-junio y septiembre-octubre) tiene los mejores precios. La temporada media es julio con precios intermedios, y la temporada alta es agosto con las tarifas más altas. Recomendamos reservar en temporada baja para la mejor relación calidad-precio.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cuánto cuesta alquilar un barco con licencia en Blanes?",
        acceptedAnswer: { "@type": "Answer", text: licAnswer },
      },
    ],
  };

  // Dynamic ItemList schema with Product entries for each boat
  const itemListSchema = activeBoats.length > 0 ? {
    "@type": "ItemList",
    "name": "Precios Alquiler de Barcos en Blanes",
    "numberOfItems": activeBoats.length,
    "itemListElement": activeBoats.map((boat, index) => {
      const allPrices = (["BAJA", "MEDIA", "ALTA"] as SeasonKey[])
        .map(s => getMinPrice(boat, s))
        .filter((p): p is number => p !== null);
      const lowPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
      const highPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;

      return {
        "@type": "ListItem",
        "position": index + 1,
        "name": boat.name,
        "url": `https://www.costabravarentaboat.com/barco/${boat.id}`,
        "item": {
          "@type": "Product",
          "name": `Alquiler ${boat.name} en Blanes`,
          "description": `Barco ${boat.name} para ${boat.capacity} personas${boat.requiresLicense ? " (requiere licencia)" : " (sin licencia)"}`,
          "brand": { "@type": "Brand", "name": "Costa Brava Rent a Boat" },
          ...(lowPrice && highPrice ? {
            "offers": {
              "@type": "AggregateOffer",
              "priceCurrency": "EUR",
              "lowPrice": lowPrice.toString(),
              "highPrice": highPrice.toString(),
              "offerCount": allPrices.length,
              "availability": "https://schema.org/InStock",
              "seller": { "@type": "Organization", "name": "Costa Brava Rent a Boat Blanes" }
            }
          } : {})
        }
      };
    })
  } : null;

  const graphItems = [breadcrumbSchema, faqSchema];
  if (itemListSchema) graphItems.push(itemListSchema);

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": graphItems,
  };

  return (
    <main id="main-content" className="min-h-screen">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        keywords={seoConfig.keywords}
        ogImage={seoConfig.image}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 pt-28 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            Precios Alquiler de Barcos en Blanes 2026
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
            Consulta y compara los precios de todos nuestros barcos. Temporada baja, media y alta.
            Barcos sin licencia con gasolina incluida.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Badge variant="outline" className="text-primary border-primary">
              <Fuel className="w-4 h-4 mr-2" />
              Gasolina incluida (sin licencia)
            </Badge>
            <Badge variant="outline" className="text-primary border-primary">
              <Anchor className="w-4 h-4 mr-2" />
              {activeBoats.length} embarcaciones disponibles
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm text-center mb-8">
            Puerto de Blanes — accesible desde{" "}
            <a href={localizedPath("locationMalgrat")} className="text-primary hover:underline">Malgrat de Mar</a> (10 min),{" "}
            <a href={localizedPath("locationSantaSusanna")} className="text-primary hover:underline">Santa Susanna</a> (15 min) y{" "}
            <a href={localizedPath("locationCalella")} className="text-primary hover:underline">Calella</a> (20 min en coche)
          </p>
        </div>
      </div>

      {/* Season legend */}
      <div className="bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            {(Object.keys(SEASON_LABELS) as SeasonKey[]).map((season) => (
              <div key={season} className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    season === "BAJA"
                      ? "bg-green-500"
                      : season === "MEDIA"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
                <span className="font-medium">{SEASON_NAMES[season]}</span>
                <span className="text-muted-foreground">({SEASON_LABELS[season]})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden lg:block">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Barco</TableHead>
                          <TableHead className="text-center">Capacidad</TableHead>
                          <TableHead className="text-center">Licencia</TableHead>
                          <TableHead className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mb-1" />
                              <span>Baja</span>
                              <span className="text-xs font-normal text-muted-foreground">
                                {SEASON_LABELS.BAJA}
                              </span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mb-1" />
                              <span>Media</span>
                              <span className="text-xs font-normal text-muted-foreground">
                                {SEASON_LABELS.MEDIA}
                              </span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="inline-block w-3 h-3 rounded-full bg-red-500 mb-1" />
                              <span>Alta</span>
                              <span className="text-xs font-normal text-muted-foreground">
                                {SEASON_LABELS.ALTA}
                              </span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center w-[140px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeBoats.map((boat) => {
                          const minBaja = getMinPrice(boat, "BAJA");
                          const minMedia = getMinPrice(boat, "MEDIA");
                          const minAlta = getMinPrice(boat, "ALTA");

                          return (
                            <TableRow key={boat.id}>
                              <TableCell className="font-medium">
                                <a
                                  href={localizedPath("boatDetail", boat.id)}
                                  className="hover:text-primary transition-colors underline-offset-2 hover:underline"
                                >
                                  {boat.name}
                                </a>
                                {!boat.requiresLicense && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs bg-green-100 text-green-800"
                                  >
                                    <Fuel className="w-3 h-3 mr-1" />
                                    Gasolina incl.
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                  {boat.capacity}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={boat.requiresLicense ? "default" : "outline"}
                                  className={
                                    boat.requiresLicense
                                      ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                      : "border-green-600 text-green-700"
                                  }
                                >
                                  {getLicenseLabel(boat)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {minBaja !== null ? (
                                  <span>
                                    Desde {formatPrice(minBaja)}<span className="text-sm font-normal">/h</span>
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {minMedia !== null ? (
                                  <span>
                                    Desde {formatPrice(minMedia)}<span className="text-sm font-normal">/h</span>
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {minAlta !== null ? (
                                  <span>
                                    Desde {formatPrice(minAlta)}<span className="text-sm font-normal">/h</span>
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  className="bg-cta hover:bg-cta/90 text-white"
                                  onClick={() => openBookingModal(boat.id)}
                                >
                                  Reservar
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile card view */}
              <div className="lg:hidden space-y-4">
                {activeBoats.map((boat) => {
                  const minBaja = getMinPrice(boat, "BAJA");
                  const minMedia = getMinPrice(boat, "MEDIA");
                  const minAlta = getMinPrice(boat, "ALTA");

                  return (
                    <Card key={boat.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <a
                              href={localizedPath("boatDetail", boat.id)}
                              className="text-lg font-semibold hover:text-primary transition-colors"
                            >
                              {boat.name}
                            </a>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {boat.capacity} personas
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={boat.requiresLicense ? "default" : "outline"}
                            className={
                              boat.requiresLicense
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "border-green-600 text-green-700"
                            }
                          >
                            {getLicenseLabel(boat)}
                          </Badge>
                        </div>
                        {!boat.requiresLicense && (
                          <Badge
                            variant="secondary"
                            className="w-fit text-xs bg-green-100 text-green-800 mt-2"
                          >
                            <Fuel className="w-3 h-3 mr-1" />
                            Gasolina incluida
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {(["BAJA", "MEDIA", "ALTA"] as SeasonKey[]).map((season) => {
                            const price = getMinPrice(boat, season);
                            return (
                              <div
                                key={season}
                                className="text-center rounded-lg bg-muted p-3"
                              >
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <span
                                    className={`inline-block w-2 h-2 rounded-full ${
                                      season === "BAJA"
                                        ? "bg-green-500"
                                        : season === "MEDIA"
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                    }`}
                                  />
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {season === "BAJA"
                                      ? "Baja"
                                      : season === "MEDIA"
                                        ? "Media"
                                        : "Alta"}
                                  </span>
                                </div>
                                <div className="font-bold text-lg">
                                  {price !== null ? `${formatPrice(price)}` : "-"}
                                </div>
                                {price !== null && (
                                  <div className="text-xs text-muted-foreground">/hora</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <Button
                          className="w-full bg-cta hover:bg-cta/90 text-white"
                          onClick={() => openBookingModal(boat.id)}
                        >
                          Reservar {boat.name}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Info section */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Que incluye el precio?</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Fuel className="w-4 h-4 text-green-600 mt-1 shrink-0" />
                    <span>
                      <strong>Gasolina incluida</strong> en barcos sin licencia
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Anchor className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <span>Seguro a todo riesgo y equipo de seguridad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <span>Formación de 15 minutos antes de zarpar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Anchor className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <span>Equipo de snorkel y paddle surf (según disponibilidad)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Información importante</h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    Los precios mostrados son el <strong>mínimo por hora</strong>. Según la
                    duración elegida, el precio por hora puede variar.
                  </li>
                  <li>
                    Se requiere una <strong>fianza</strong> que se devuelve al
                    finalizar el alquiler sin incidencias.
                  </li>
                  <li>
                    <strong>Cambio de fecha gratuito</strong> con un mínimo de 7 días de antelación.
                  </li>
                  <li>
                    Los barcos con licencia requieren <strong>PER o título náutico</strong>{" "}
                    equivalente en vigor.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* FAQ section */}
          <div className="mt-12">
            <h2 className="text-2xl font-heading font-bold text-center mb-8">
              Preguntas frecuentes sobre precios
            </h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">
                    ¿Cuánto cuesta alquilar un barco sin licencia en Blanes?
                  </h3>
                  <p className="text-muted-foreground">{noLicAnswer}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">
                    ¿La gasolina está incluida en el precio?
                  </h3>
                  <p className="text-muted-foreground">
                    Sí, todos nuestros barcos sin licencia incluyen la gasolina en el
                    precio. Para los barcos con licencia, el combustible se paga aparte
                    según el consumo real.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">
                    ¿Hay diferencia de precio entre temporada baja y alta?
                  </h3>
                  <p className="text-muted-foreground">
                    Sí. La temporada baja (abril-junio y septiembre-octubre) tiene los
                    mejores precios. La temporada media es julio con precios intermedios,
                    y la temporada alta es agosto con las tarifas más altas. Recomendamos
                    reservar en temporada baja para la mejor relación calidad-precio.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">
                    ¿Cuánto cuesta alquilar un barco con licencia?
                  </h3>
                  <p className="text-muted-foreground">{licAnswer}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <Card className="mt-12 bg-primary text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Reserva tu barco al mejor precio
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Elige tu barco, fecha y horario. Confirmación inmediata.
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => openBookingModal()}
              >
                <Anchor className="w-5 h-5 mr-2" />
                Reservar ahora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </main>
  );
}
