import { neon } from "@neondatabase/serverless";
import { logger } from "./logger";
import { SHOP_PRODUCTS, type ShopColor } from "@shared/shopData";

// Stock bridge to the operational CRM (crmdamar), where the physical merch
// inventory is counted. `merch_movimientos` there is the append-only ledger
// (entrada / venta / ajuste) and `merch_articulos` the catalogue; the web shop
// only ever mirrored a seeded number, so the two drifted the moment Laura sold
// a tee over the counter.
//
// Direction of truth:
//   CRM  -> web   stock is pulled into `shop_variants.stock` (see storage/shop.ts)
//   web  -> CRM   an online sale is written back as a `venta` movement, so the
//                 next pull already accounts for it (no double counting).
//
// Uses CRMDAMAR_DATABASE_URL, same connection as crmDamarStats.ts. Unlike that
// module this one WRITES, but only into merch_movimientos, and only online sales.

/**
 * CRM article name per shop colour. The CRM uses the supplier's (KTK Shirts)
 * codes: AM = amarillo -> butter, DN -> navy, RB = royal blue -> tote bag.
 * If Laura renames an article in the CRM, fix it here: an unmatched SKU is
 * skipped (stock left as-is), never zeroed.
 */
const CRM_ARTICLE_NAME: Record<ShopColor, string> = {
  butter: "Camiseta Oversize Boxy AM",
  navy: "Camiseta Oversize Boxy DN",
  royal: "Bolsa Mountain RB",
};

/** Size label the CRM uses for a product without sizes (the tote). */
const CRM_ONE_SIZE = "Única";

export interface CrmArticleKey {
  nombre: string;
  talla: string;
}

/** (nombre, talla) identifying a SKU in the CRM, or null if the colour is unmapped. */
export function crmArticleForSku(sku: string): CrmArticleKey | null {
  for (const product of SHOP_PRODUCTS) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (!variant) continue;
    const nombre = CRM_ARTICLE_NAME[variant.color];
    if (!nombre) return null;
    return { nombre, talla: variant.size ?? CRM_ONE_SIZE };
  }
  return null;
}

const keyOf = (nombre: string, talla: string) => `${nombre}||${talla}`;

export function isCrmMerchConfigured(): boolean {
  return !!process.env.CRMDAMAR_DATABASE_URL;
}

/**
 * Live stock per SKU as counted by the CRM ledger.
 * A deactivated article reports 0 (so deactivating it in the CRM empties the
 * web shelf too). SKUs with no CRM article are absent from the map: the caller
 * must leave those alone rather than assume zero.
 * Returns null when the bridge is not configured or the CRM is unreachable.
 */
export async function fetchCrmMerchStock(): Promise<Map<string, number> | null> {
  const url = process.env.CRMDAMAR_DATABASE_URL;
  if (!url) return null;

  try {
    const sql = neon(url);
    const rows = (await sql`
      SELECT a.nombre, a.talla, a.activo,
             COALESCE(SUM(
               CASE WHEN m.tipo = 'entrada' THEN m.cantidad
                    WHEN m.tipo = 'venta' THEN -m.cantidad
                    ELSE m.cantidad END
             ), 0)::int AS stock
      FROM merch_articulos a
      LEFT JOIN merch_movimientos m ON m.articulo_id = a.id
      GROUP BY a.id, a.nombre, a.talla, a.activo`) as Array<Record<string, unknown>>;

    const byArticle = new Map<string, number>();
    for (const row of rows) {
      const stock = row.activo === false ? 0 : Math.max(0, Number(row.stock) || 0);
      byArticle.set(keyOf(String(row.nombre), String(row.talla)), stock);
    }

    const bySku = new Map<string, number>();
    for (const product of SHOP_PRODUCTS) {
      for (const variant of product.variants) {
        const article = crmArticleForSku(variant.sku);
        if (!article) continue;
        const stock = byArticle.get(keyOf(article.nombre, article.talla));
        if (stock === undefined) {
          logger.warn("[crmdamar] merch article not found for SKU", {
            sku: variant.sku,
            ...article,
          });
          continue;
        }
        bySku.set(variant.sku, stock);
      }
    }
    return bySku;
  } catch (error) {
    logger.warn("[crmdamar] merch stock query error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/** DD/MM/YYYY, the CRM's canonical date format. */
function crmDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export interface CrmSaleLine {
  sku: string;
  quantity: number;
  unitPriceCents: number;
}

/**
 * Record an online sale in the CRM ledger, one `venta` movement per line, at
 * the price actually charged online (which is what the profit split with Laura
 * is computed from, so never the CRM's counter price).
 *
 * Called once per order thanks to markOrderPaid's pending -> paid guard; a
 * redelivered Stripe webhook does not reach this. Best effort: a failure is
 * logged, never thrown, because the customer has already paid.
 */
export async function pushCrmMerchSale(
  lines: CrmSaleLine[],
  reference: string,
): Promise<void> {
  const url = process.env.CRMDAMAR_DATABASE_URL;
  if (!url || lines.length === 0) return;

  const sql = neon(url);
  const fecha = crmDate(new Date());
  const motivo = `Tienda web (pedido ${reference})`;

  for (const line of lines) {
    const article = crmArticleForSku(line.sku);
    if (!article) {
      logger.warn("[crmdamar] no CRM article mapped for sold SKU", { sku: line.sku, reference });
      continue;
    }
    const precio = line.unitPriceCents / 100;
    const importe = Math.round(precio * line.quantity * 100) / 100;
    try {
      const inserted = await sql`
        INSERT INTO merch_movimientos
          (articulo_id, tipo, cantidad, precio_unitario, importe, motivo, fecha, registrado_por)
        SELECT a.id, 'venta', ${line.quantity}, ${precio}, ${importe}, ${motivo}, ${fecha}, 'Tienda web'
        FROM merch_articulos a
        WHERE a.nombre = ${article.nombre} AND a.talla = ${article.talla}
        LIMIT 1
        RETURNING id`;
      if ((inserted as unknown[]).length === 0) {
        logger.warn("[crmdamar] merch article not found, sale not recorded", {
          sku: line.sku,
          reference,
          ...article,
        });
      }
    } catch (error) {
      logger.error("[crmdamar] failed to record online sale in CRM ledger", {
        sku: line.sku,
        reference,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
