// Merch shop catalogue — collaboration with local designer Laura Cabanas
// (https://www.lauracabanas.com/, Lloret de Mar): the "Costa Brava Culture"
// capsule (tee in two colors + tote bag) sold to rental customers and locals.
//
// This module is the single source of truth for the STATIC shape of the
// catalogue: product ids, SKUs, colors, sizes, image paths, default prices
// and the seed stock. Live price/stock/active live in the DB tables
// `shop_products` / `shop_variants` (seeded idempotently from this module by
// server/migrations/applyShopSeedEnsure.ts and editable from the CRM).
//
// Visible texts (product names, descriptions, color/size labels) are NOT
// here: they live in the i18n bundles under `shopPage.*`.

export const SHOP_COLORS = ["butter", "navy", "royal"] as const;
export type ShopColor = (typeof SHOP_COLORS)[number];

export const SHOP_SIZES = ["S", "M", "L", "XL"] as const;
export type ShopSize = (typeof SHOP_SIZES)[number];

export interface ShopVariantDef {
  /** Stable SKU, primary key of `shop_variants` (e.g. "tee-butter-S"). */
  sku: string;
  color: ShopColor;
  size?: ShopSize;
}

/** How a gallery frame should be labelled in the thumbnail strip. */
export type ShopShotKind = "editorial" | "front" | "back";

export interface ShopShot {
  src: string;
  kind: ShopShotKind;
}

export interface ShopProductImage {
  /** Gallery for this colour, first frame leads. */
  shots: ShopShot[];
}

export interface ShopProductDef {
  /** Stable id, primary key of `shop_products`. */
  id: string;
  /** i18n key under t.shopPage.products.<key> for name/description. */
  i18nKey: string;
  /** Default price in euro cents (seed value; CRM can override in DB). */
  defaultPriceCents: number;
  hasSizes: boolean;
  colors: ShopColor[];
  /** Image paths under client/public, per color. */
  images: Record<string, ShopProductImage>;
  variants: ShopVariantDef[];
}

const TEE_VARIANTS: ShopVariantDef[] = (["butter", "navy"] as const).flatMap(
  (color) =>
    SHOP_SIZES.map((size) => ({ sku: `tee-${color}-${size}`, color, size })),
);

export const SHOP_PRODUCTS: ShopProductDef[] = [
  {
    id: "camiseta-costa-brava-culture",
    i18nKey: "tee",
    defaultPriceCents: 2500,
    hasSizes: true,
    colors: ["butter", "navy"],
    images: {
      butter: {
        shots: [
          { src: "/images/shop/camiseta-costa-brava-culture-butter-editorial.webp", kind: "editorial" },
          { src: "/images/shop/camiseta-costa-brava-culture-butter-front.webp", kind: "front" },
          { src: "/images/shop/camiseta-costa-brava-culture-butter-back.webp", kind: "back" },
        ],
      },
      navy: {
        shots: [
          { src: "/images/shop/camiseta-costa-brava-culture-navy-editorial.webp", kind: "editorial" },
          { src: "/images/shop/camiseta-costa-brava-culture-navy-front.webp", kind: "front" },
          { src: "/images/shop/camiseta-costa-brava-culture-navy-back.webp", kind: "back" },
        ],
      },
    },
    variants: TEE_VARIANTS,
  },
  {
    id: "tote-bag-costa-brava",
    i18nKey: "tote",
    defaultPriceCents: 1000,
    hasSizes: false,
    colors: ["royal"],
    images: {
      royal: {
        shots: [
          { src: "/images/shop/tote-bag-costa-brava-editorial.webp", kind: "editorial" },
          { src: "/images/shop/tote-bag-costa-brava-royal.webp", kind: "front" },
        ],
      },
    },
    variants: [{ sku: "tote-royal", color: "royal" }],
  },
];

/** Product ids the "tee + tote" bundle is built from. */
export const PACK_TEE_PRODUCT_ID = "camiseta-costa-brava-culture";
export const PACK_TOTE_PRODUCT_ID = "tote-bag-costa-brava";

/** Flat shipping rate for Spain in euro cents (overridable via env). */
export const DEFAULT_SHIPPING_FLAT_CENTS = 495;

/** Discount in euro cents applied per tee+tote pair in the cart. */
export const DEFAULT_PACK_DISCOUNT_CENTS = 500;

/**
 * Cart subtotal (after the pack discount) from which home delivery is free.
 * Set below the discounted pack price on purpose: one tee plus one tote lands
 * exactly on free shipping, which is what makes the bundle worth building.
 */
export const DEFAULT_FREE_SHIPPING_MIN_CENTS = 3000;

/**
 * How many tee+tote pairs a cart contains. The discount is per pair, so two
 * tees and one tote is one pack, not two.
 */
export function countPacks(
  items: { sku: string; quantity: number }[],
): number {
  let tees = 0;
  let totes = 0;
  for (const item of items) {
    const entry = getShopVariant(item.sku);
    if (!entry) continue;
    if (entry.product.id === PACK_TEE_PRODUCT_ID) tees += item.quantity;
    else if (entry.product.id === PACK_TOTE_PRODUCT_ID) totes += item.quantity;
  }
  return Math.min(tees, totes);
}

/** The two offer levers, resolved server-side and echoed in /api/shop/catalog. */
export interface ShopOffers {
  shippingFlatCents: number;
  packDiscountCents: number;
  freeShippingMinCents: number;
}

export const DEFAULT_SHOP_OFFERS: ShopOffers = {
  shippingFlatCents: DEFAULT_SHIPPING_FLAT_CENTS,
  packDiscountCents: DEFAULT_PACK_DISCOUNT_CENTS,
  freeShippingMinCents: DEFAULT_FREE_SHIPPING_MIN_CENTS,
};

export interface CartTotals {
  /** Sum of the lines at full price. */
  subtotalCents: number;
  packs: number;
  discountCents: number;
  /** What the goods cost after the pack discount, before delivery. */
  payableCents: number;
  /** Home delivery cost for this cart (0 once the threshold is cleared). */
  shippingCents: number;
  /** Cents still missing for free delivery, 0 when already free. */
  toFreeShippingCents: number;
}

/**
 * Single source of truth for cart money. The page previews exactly what the
 * checkout endpoint will charge, so the two can never disagree.
 */
export function computeCartTotals(
  items: { sku: string; quantity: number; unitPriceCents: number }[],
  offers: ShopOffers = DEFAULT_SHOP_OFFERS,
): CartTotals {
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const packs = countPacks(items);
  const discountCents = Math.min(packs * offers.packDiscountCents, subtotalCents);
  const payableCents = subtotalCents - discountCents;
  const free = payableCents >= offers.freeShippingMinCents;
  return {
    subtotalCents,
    packs,
    discountCents,
    payableCents,
    shippingCents: free ? 0 : offers.shippingFlatCents,
    // An empty cart is not "5 EUR away from free shipping", it is just empty.
    toFreeShippingCents:
      free || subtotalCents === 0 ? 0 : offers.freeShippingMinCents - payableCents,
  };
}

/** Seed stock per SKU — only used when the variant row is missing in DB. */
export const DEFAULT_INITIAL_STOCK: Record<string, number> = {
  "tee-butter-S": 5,
  "tee-butter-M": 10,
  "tee-butter-L": 10,
  "tee-butter-XL": 5,
  "tee-navy-S": 5,
  "tee-navy-M": 10,
  "tee-navy-L": 10,
  "tee-navy-XL": 5,
  "tote-royal": 20,
};

/** Max units of a single SKU per order. */
export const SHOP_MAX_QTY_PER_ITEM = 10;

const VARIANT_INDEX = new Map(
  SHOP_PRODUCTS.flatMap((p) => p.variants.map((v) => [v.sku, { product: p, variant: v }])),
);

export function getShopProduct(id: string | null | undefined): ShopProductDef | null {
  if (!id) return null;
  return SHOP_PRODUCTS.find((p) => p.id === id) ?? null;
}

export function getShopVariant(
  sku: string | null | undefined,
): { product: ShopProductDef; variant: ShopVariantDef } | null {
  if (!sku) return null;
  return VARIANT_INDEX.get(sku) ?? null;
}

/**
 * Customer-facing order reference ("CB-0007"). The DB id is a UUID, which is
 * unreadable over WhatsApp; this is the number the customer quotes and the one
 * shown on the success screen, in emails and in the CRM.
 */
export function formatOrderNumber(orderNumber: number): string {
  return `CB-${String(orderNumber).padStart(4, "0")}`;
}
