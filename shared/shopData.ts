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

export interface ShopProductImage {
  /** Main card image (editorial photo). */
  main: string;
  /** Optional alternate view (flat mockup of the other side). */
  alt?: string;
  /** True when the ALTERNATE image shows the back of the garment. */
  altShowsBack?: boolean;
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
    defaultPriceCents: 2000,
    hasSizes: true,
    colors: ["butter", "navy"],
    images: {
      butter: {
        main: "/images/shop/camiseta-costa-brava-culture-butter-editorial.webp",
        alt: "/images/shop/camiseta-costa-brava-culture-butter-back.webp",
        altShowsBack: true,
      },
      navy: {
        main: "/images/shop/camiseta-costa-brava-culture-navy-editorial.webp",
        alt: "/images/shop/camiseta-costa-brava-culture-navy-front.webp",
        altShowsBack: false,
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
        main: "/images/shop/tote-bag-costa-brava-editorial.webp",
      },
    },
    variants: [{ sku: "tote-royal", color: "royal" }],
  },
];

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

/** Flat shipping rate for Spain in euro cents (overridable via env). */
export const DEFAULT_SHIPPING_FLAT_CENTS = 495;

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
