import {
  db, eq, and, gte, desc, inArray, sql,
  shopProducts, shopVariants, shopOrders, shopOrderItems,
  type ShopProductRow, type ShopVariantRow,
  type ShopOrder, type InsertShopOrder,
  type ShopOrderItem, type InsertShopOrderItem,
} from "./base";

export interface ShopCatalogProduct extends ShopProductRow {
  variants: ShopVariantRow[];
}

export interface ShopOrderWithItems extends ShopOrder {
  items: ShopOrderItem[];
}

export async function getShopCatalog(): Promise<ShopCatalogProduct[]> {
  const products = await db.select().from(shopProducts);
  const variants = await db.select().from(shopVariants);
  return products.map((p) => ({
    ...p,
    variants: variants.filter((v) => v.productId === p.id),
  }));
}

export async function getVariantsBySkus(skus: string[]): Promise<ShopVariantRow[]> {
  if (skus.length === 0) return [];
  return await db.select().from(shopVariants).where(inArray(shopVariants.sku, skus));
}

export async function getShopProductsByIds(ids: string[]): Promise<ShopProductRow[]> {
  if (ids.length === 0) return [];
  return await db.select().from(shopProducts).where(inArray(shopProducts.id, ids));
}

export async function createShopOrder(
  order: InsertShopOrder,
  items: Omit<InsertShopOrderItem, "orderId">[],
): Promise<ShopOrder> {
  return await db.transaction(async (tx) => {
    const [newOrder] = await tx.insert(shopOrders).values(order).returning();
    if (items.length > 0) {
      await tx
        .insert(shopOrderItems)
        .values(items.map((item) => ({ ...item, orderId: newOrder.id })));
    }
    return newOrder;
  });
}

export async function getShopOrderBySessionId(sessionId: string): Promise<ShopOrder | undefined> {
  const [order] = await db
    .select()
    .from(shopOrders)
    .where(eq(shopOrders.stripeSessionId, sessionId))
    .limit(1);
  return order || undefined;
}

export async function getShopOrderItems(orderId: string): Promise<ShopOrderItem[]> {
  return await db.select().from(shopOrderItems).where(eq(shopOrderItems.orderId, orderId));
}

export interface MarkOrderPaidResult {
  /** The paid order, or null if it was not in `pending` (already processed). */
  order: ShopOrder | null;
  items: ShopOrderItem[];
  /** SKUs whose stock could not be decremented (raced to zero). */
  stockShortfall: string[];
}

/**
 * Atomic pending → paid transition + stock decrement.
 * Idempotent: the status guard means a redelivered webhook (or the
 * order-status fallback racing the webhook) decrements stock exactly once.
 * A variant that raced to insufficient stock is reported in `stockShortfall`
 * but never blocks the order — the customer already paid.
 */
export async function markOrderPaid(
  orderId: string,
  details: {
    stripePaymentIntentId?: string;
    customerName?: string;
    customerEmail?: string;
    deliveryMethod?: string;
    shippingAddress?: unknown;
  },
): Promise<MarkOrderPaidResult> {
  return await db.transaction(async (tx) => {
    const [order] = await tx
      .update(shopOrders)
      .set({
        status: "paid",
        paidAt: new Date(),
        ...(details.stripePaymentIntentId
          ? { stripePaymentIntentId: details.stripePaymentIntentId }
          : {}),
        ...(details.customerName ? { customerName: details.customerName } : {}),
        ...(details.customerEmail ? { customerEmail: details.customerEmail } : {}),
        ...(details.deliveryMethod ? { deliveryMethod: details.deliveryMethod } : {}),
        ...(details.shippingAddress !== undefined
          ? { shippingAddress: details.shippingAddress }
          : {}),
      })
      .where(and(eq(shopOrders.id, orderId), eq(shopOrders.status, "pending")))
      .returning();

    if (!order) return { order: null, items: [], stockShortfall: [] };

    const items = await tx
      .select()
      .from(shopOrderItems)
      .where(eq(shopOrderItems.orderId, orderId));

    const stockShortfall: string[] = [];
    for (const item of items) {
      const decremented = await tx
        .update(shopVariants)
        .set({ stock: sql`${shopVariants.stock} - ${item.quantity}` })
        .where(and(eq(shopVariants.sku, item.sku), gte(shopVariants.stock, item.quantity)))
        .returning({ sku: shopVariants.sku });
      if (decremented.length === 0) stockShortfall.push(item.sku);
    }

    return { order, items, stockShortfall };
  });
}

/** Attach the real Stripe session id once the session is created. */
export async function updateShopOrderSessionId(
  orderId: string,
  sessionId: string,
): Promise<void> {
  await db
    .update(shopOrders)
    .set({ stripeSessionId: sessionId })
    .where(eq(shopOrders.id, orderId));
}

/** Persist shipping/total once Stripe reports the customer's choice. */
export async function updateShopOrderAmounts(
  orderId: string,
  amounts: { shippingCents: number; totalCents: number },
): Promise<void> {
  await db.update(shopOrders).set(amounts).where(eq(shopOrders.id, orderId));
}

/** pending → cancelled (used on checkout.session.expired). No stock to release. */
export async function markOrderCancelled(orderId: string): Promise<ShopOrder | undefined> {
  const [order] = await db
    .update(shopOrders)
    .set({ status: "cancelled" })
    .where(and(eq(shopOrders.id, orderId), eq(shopOrders.status, "pending")))
    .returning();
  return order || undefined;
}

export async function listShopOrders(status?: string): Promise<ShopOrderWithItems[]> {
  const orders = status
    ? await db.select().from(shopOrders).where(eq(shopOrders.status, status)).orderBy(desc(shopOrders.createdAt))
    : await db.select().from(shopOrders).orderBy(desc(shopOrders.createdAt));
  if (orders.length === 0) return [];
  const items = await db
    .select()
    .from(shopOrderItems)
    .where(inArray(shopOrderItems.orderId, orders.map((o) => o.id)));
  return orders.map((o) => ({
    ...o,
    items: items.filter((i) => i.orderId === o.id),
  }));
}

export async function updateShopOrderStatus(
  orderId: string,
  status: "fulfilled" | "cancelled",
): Promise<ShopOrder | undefined> {
  const [order] = await db
    .update(shopOrders)
    .set({
      status,
      ...(status === "fulfilled" ? { fulfilledAt: new Date() } : {}),
    })
    .where(eq(shopOrders.id, orderId))
    .returning();
  return order || undefined;
}

export async function updateShopVariant(
  sku: string,
  patch: { stock?: number; active?: boolean },
): Promise<ShopVariantRow | undefined> {
  const [variant] = await db
    .update(shopVariants)
    .set(patch)
    .where(eq(shopVariants.sku, sku))
    .returning();
  return variant || undefined;
}

export async function updateShopProduct(
  id: string,
  patch: { active?: boolean; priceCents?: number },
): Promise<ShopProductRow | undefined> {
  const [product] = await db
    .update(shopProducts)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(shopProducts.id, id))
    .returning();
  return product || undefined;
}
