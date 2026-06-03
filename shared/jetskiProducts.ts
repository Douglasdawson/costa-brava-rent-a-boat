// Jet ski products resold on behalf of our pantalán partner "Jet Ski Blanes"
// (https://jetskiblanes.com). These are NOT part of the per-hour boat-rental
// pricing engine: they are fixed closed time-slots at a flat resale price
// (the partner's price +10%, rounded up to the nearest 5€).
//
// They surface in the fleet section and admin fleet as rows in the `boats`
// table (seeded idempotently from this module — see
// server/migrations/applyBoatsSeedEnsure.ts), but their booking request goes
// through the lightweight inquiry flow (POST /api/booking-inquiries), like the
// "salida compartida" landing — never through /api/quote or shared/pricing.ts.
//
// This module is the single source of truth for the jet ski catalogue.

/** A fixed, closed time-slot offered for a jet ski product. */
export interface JetSkiSlot {
  /** Stable key, also used as the price key in the seeded `pricing` JSON. */
  id: string;
  /** Human label shown in the request modal (e.g. "15 min", "1 h"). */
  label: string;
  /** Duration in minutes (metadata; not used for pricing). */
  minutes: number;
  /** Flat resale price in EUR for this slot (partner +10%, ceil to 5€). */
  price: number;
  /** Price for 2 people, when the slot is priced per person (e.g. the 15-min
   * circuit: 65€ for 1, 80€ for 2). Omitted when the slot price already covers
   * 1-2 people on the same craft. */
  price2?: number;
  /** Optional clarification shown next to the slot (e.g. per-person split). */
  priceNote?: string;
}

/** A jet ski product resold from the partner, modelled as a fleet item. */
export interface JetSkiProduct {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  /** Canonical image path under /images/boats/<id>/...webp */
  image: string;
  capacity: number;
  specifications: {
    model: string;
    length: string;
    beam: string;
    engine: string;
    fuel: string;
    capacity: string;
    deposit: string;
  };
  included: string[];
  features: string[];
  slots: JetSkiSlot[];
}

export const JETSKI_PRODUCTS: JetSkiProduct[] = [
  {
    id: "jetski-circuito",
    name: "Circuito en Jet Ski",
    subtitle: "Sin licencia · 1-2 personas · Aprende a pilotar en circuito vigilado",
    description:
      "Ponte a los mandos de una moto de agua en un circuito balizado frente a Blanes, con monitor vigilando en todo momento. Ideal para una primera toma de contacto: desde 15 minutos, sin licencia y con briefing y chaleco incluidos. Producto operado por nuestro partner Jet Ski Blanes, en el mismo pantalán.",
    image:
      "/images/boats/jetski-circuito/jet-ski-circuito-blanes-costa-brava.webp",
    capacity: 2,
    specifications: {
      model: "Moto de agua (jet ski)",
      length: "—",
      beam: "—",
      engine: "Moto de agua con monitor",
      fuel: "Combustible incluido",
      capacity: "1-2 personas",
      deposit: "—",
    },
    included: [
      "Chaleco salvavidas",
      "Monitor y vigilancia",
      "Briefing de seguridad",
      "Combustible",
    ],
    features: [
      "Sin licencia requerida",
      "Desde 15 minutos",
      "Monitor incluido",
      "1-2 personas por moto",
    ],
    slots: [
      { id: "15min", label: "15 min", minutes: 15, price: 65, price2: 80, priceNote: "1 persona · 80€ los 2" },
      { id: "30min", label: "30 min", minutes: 30, price: 110 },
      { id: "60min", label: "60 min", minutes: 60, price: 190 },
    ],
  },
  {
    id: "jetski-excursion-monitor",
    name: "Excursión en Jet Ski con Monitor",
    subtitle: "Sin licencia · 1-2 personas · Ruta guiada Blanes → Tossa de Mar",
    description:
      "Recorre la Costa Brava en moto de agua acompañado por un monitor titulado, con ruta guiada desde Blanes hacia Tossa de Mar. Sin licencia: el guía va contigo en todo momento. Incluye combustible, seguro de responsabilidad civil, chaleco y briefing. Producto operado por nuestro partner Jet Ski Blanes, en el mismo pantalán.",
    image:
      "/images/boats/jetski-excursion-monitor/jet-ski-excursion-monitor-blanes-tossa.webp",
    capacity: 2,
    specifications: {
      model: "Moto de agua (jet ski)",
      length: "—",
      beam: "—",
      engine: "Moto de agua con monitor titulado",
      fuel: "Combustible incluido",
      capacity: "1-2 personas",
      deposit: "—",
    },
    included: [
      "Combustible",
      "Seguro de responsabilidad civil",
      "Monitor titulado / guía",
      "Chaleco salvavidas",
      "Briefing de seguridad",
    ],
    features: [
      "Sin licencia requerida",
      "Ruta guiada a Tossa de Mar",
      "Monitor incluido",
      "1-2 personas por moto",
    ],
    slots: [
      { id: "1h", label: "1 h", minutes: 60, price: 190 },
      { id: "2h", label: "2 h", minutes: 120, price: 330 },
    ],
  },
];

/** Set of jet ski boat ids — used to branch UI and exclude from hourly flows. */
export const JETSKI_BOAT_IDS = new Set<string>(
  JETSKI_PRODUCTS.map((p) => p.id),
);

/** Whether a boat id corresponds to a resold jet ski product. */
export function isJetSkiProduct(id: string | null | undefined): boolean {
  return !!id && JETSKI_BOAT_IDS.has(id);
}

/** Look up a jet ski product by id (null when not a jet ski). */
export function getJetSkiProduct(
  id: string | null | undefined,
): JetSkiProduct | null {
  if (!id) return null;
  return JETSKI_PRODUCTS.find((p) => p.id === id) ?? null;
}

/**
 * Build the seasonal `pricing` JSON for the boats table from a product's slots.
 * The three seasons are identical (flat resale price); the slot ids become the
 * duration keys so getMinActivePrice/getBoatCatalogMinPrice render the right
 * "desde X€" on fleet cards. These keys never reach the per-hour pricing engine
 * because jet ski ids are filtered out of every hourly booking flow.
 */
export function buildJetSkiPricing(product: JetSkiProduct): {
  BAJA: { period: string; prices: Record<string, number> };
  MEDIA: { period: string; prices: Record<string, number> };
  ALTA: { period: string; prices: Record<string, number> };
} {
  const prices: Record<string, number> = {};
  for (const slot of product.slots) prices[slot.id] = slot.price;
  const block = { period: "", prices };
  return { BAJA: block, MEDIA: { ...block }, ALTA: { ...block } };
}
