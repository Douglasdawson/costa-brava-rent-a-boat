/**
 * In-memory cache for LIVE shop prices and availability.
 *
 * Same job and same shape as fleetStatsCache: the SSR meta/JSON-LD generator
 * cannot await a DB lookup per request, but a Product schema that advertises a
 * stale price is worse than none (Google drops the rich result and can flag the
 * page for price mismatch). Loaded at startup from `shop_products` /
 * `shop_variants` and refreshed hourly.
 *
 * Source of truth: the DB rows, which the CRM edits. When the DB is unreachable
 * we fall back to the static catalogue's seed prices and assume in stock, which
 * is the same thing the client does while /api/shop/catalog is in flight.
 */

import { shopRepo } from "../storage";
import { logger } from "./logger";
import { SHOP_PRODUCTS } from "../../shared/shopData";

export interface ShopProductStats {
  productId: string;
  priceCents: number;
  /** Availability per colourway: true when at least one size is buyable. */
  inStockByColor: Record<string, boolean>;
}

function fallback(): ShopProductStats[] {
  return SHOP_PRODUCTS.map((product) => ({
    productId: product.id,
    priceCents: product.defaultPriceCents,
    inStockByColor: Object.fromEntries(product.colors.map((c) => [c, true])),
  }));
}

let cached: ShopProductStats[] = fallback();
let lastLoadedAt = 0;
let lastAttemptAt = 0;
let loadingPromise: Promise<void> | null = null;
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const RETRY_BACKOFF_MS = 30 * 1000;

function triggerRefresh(): void {
  if (loadingPromise) return;
  lastAttemptAt = Date.now();
  loadingPromise = loadFromDb().finally(() => {
    loadingPromise = null;
  });
}

async function loadFromDb(): Promise<void> {
  try {
    const catalog = await shopRepo.getShopCatalog();
    if (catalog.length === 0) {
      logger.warn("[shopStatsCache] Empty catalog in DB, keeping fallback");
      lastLoadedAt = Date.now();
      return;
    }
    cached = SHOP_PRODUCTS.map((product) => {
      const row = catalog.find((p) => p.id === product.id);
      const inStockByColor: Record<string, boolean> = {};
      for (const color of product.colors) {
        const variants = (row?.variants ?? []).filter((v) => v.color === color);
        inStockByColor[color] =
          Boolean(row?.active) && variants.some((v) => v.active && v.stock > 0);
      }
      return {
        productId: product.id,
        priceCents: row?.priceCents ?? product.defaultPriceCents,
        inStockByColor,
      };
    });
    lastLoadedAt = Date.now();
    logger.info("[shopStatsCache] Loaded", { products: cached.length });
  } catch (error: unknown) {
    logger.error("[shopStatsCache] Load error", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

/** Synchronous accessor for SSR generators; refreshes in the background if stale. */
export function getShopStats(): ShopProductStats[] {
  const now = Date.now();
  if (now - lastLoadedAt > REFRESH_INTERVAL_MS && now - lastAttemptAt > RETRY_BACKOFF_MS) {
    triggerRefresh();
  }
  return cached;
}

/** Initialize the cache at server startup. Awaited from startScheduledServices. */
export async function initShopStatsCache(): Promise<void> {
  await loadFromDb();
}
