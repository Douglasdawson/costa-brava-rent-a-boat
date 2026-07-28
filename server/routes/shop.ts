import type { Express } from "express";
import { randomUUID } from "crypto";
import type Stripe from "stripe";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { shopRepo } from "../storage";
import { getStripe } from "./payments";
import {
  getShopVariant,
  formatOrderNumber,
  computeCartTotals,
  SHOP_MAX_QTY_PER_ITEM,
  DEFAULT_SHIPPING_FLAT_CENTS,
  DEFAULT_PACK_DISCOUNT_CENTS,
  DEFAULT_FREE_SHIPPING_MIN_CENTS,
} from "@shared/shopData";
import { getLocalizedPath } from "@shared/i18n-routes";
import type { LangCode } from "@shared/seoConstants";
import { SUPPORTED_LANGUAGES } from "@shared/seoConstants";
import type { ShopOrder, ShopOrderItem } from "@shared/schema";
import { logger } from "../lib/logger";
import { pushCrmMerchSale } from "../lib/crmDamarMerch";
import { getShopStrings, shopItemLabel } from "../lib/shopStrings";
import { sendTelegramMessage } from "../seo/alerts/telegram";
import {
  sendShopOrderConfirmation,
  sendShopOrderOwnerNotification,
} from "../services/emailService";

// Stripe Checkout supported locales (subset we use). Catalan is not
// supported by Checkout, so it falls back to Spanish.
const STRIPE_LOCALES: Partial<Record<LangCode, Stripe.Checkout.SessionCreateParams.Locale>> = {
  es: "es", en: "en", fr: "fr", de: "de", nl: "nl", it: "it", ru: "ru", ca: "es",
};

function isLangCode(value: string): value is LangCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function envCents(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const shippingFlatCents = () => envCents("SHOP_SHIPPING_FLAT_CENTS", DEFAULT_SHIPPING_FLAT_CENTS);
const packDiscountCents = () => envCents("SHOP_PACK_DISCOUNT_CENTS", DEFAULT_PACK_DISCOUNT_CENTS);
const freeShippingMinCents = () =>
  envCents("SHOP_FREE_SHIPPING_MIN_CENTS", DEFAULT_FREE_SHIPPING_MIN_CENTS);

/**
 * The two commercial levers, resolved server-side and echoed to the client in
 * /api/shop/catalog. The page previews the same numbers it will be charged, so
 * changing an env var can never leave the cart promising a discount checkout
 * does not apply.
 */
export function shopOfferConfig() {
  return {
    shippingFlatCents: shippingFlatCents(),
    packDiscountCents: packDiscountCents(),
    freeShippingMinCents: freeShippingMinCents(),
  };
}

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        sku: z.string().min(1).max(40),
        quantity: z.number().int().min(1).max(SHOP_MAX_QTY_PER_ITEM),
      }),
    )
    .min(1)
    .max(20),
  language: z.string().min(2).max(5),
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Intenta de nuevo en unos minutos." },
});

export function registerShopRoutes(app: Express) {
  // Public catalogue: live price/stock/active per variant (texts live in i18n)
  app.get("/api/shop/catalog", async (_req, res) => {
    try {
      const products = await shopRepo.getShopCatalog();
      res.json({ products, offers: shopOfferConfig() });
    } catch (error: unknown) {
      logger.error("[Shop] Error fetching catalog", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error al cargar el catalogo" });
    }
  });

  // Create a Stripe hosted Checkout Session for the cart
  app.post("/api/shop/checkout", checkoutLimiter, async (req, res) => {
    try {
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const lang: LangCode = isLangCode(parsed.data.language) ? parsed.data.language : "es";

      // Merge duplicate SKUs defensively
      const quantities = new Map<string, number>();
      for (const item of parsed.data.items) {
        quantities.set(item.sku, (quantities.get(item.sku) ?? 0) + item.quantity);
      }
      const skus = Array.from(quantities.keys());

      // Every SKU must exist in the static catalogue
      const unknown = skus.filter((sku) => !getShopVariant(sku));
      if (unknown.length > 0) {
        return res.status(400).json({ message: "Producto no valido", unknown });
      }

      // Re-read price/stock/active from DB — never trust the client
      const variants = await shopRepo.getVariantsBySkus(skus);
      const productIds = Array.from(new Set(variants.map((v) => v.productId)));
      const products = await shopRepo.getShopProductsByIds(productIds);
      const productById = new Map(products.map((p) => [p.id, p]));

      const outOfStock: string[] = [];
      for (const sku of skus) {
        const qty = quantities.get(sku) as number;
        const variant = variants.find((v) => v.sku === sku);
        const product = variant ? productById.get(variant.productId) : undefined;
        if (!variant || !product || !variant.active || !product.active || variant.stock < qty) {
          outOfStock.push(sku);
        }
      }
      if (outOfStock.length > 0) {
        return res.status(409).json({
          message: "Algunos articulos ya no estan disponibles",
          outOfStock,
        });
      }

      let stripeInstance: Stripe;
      try {
        stripeInstance = getStripe();
      } catch (error: unknown) {
        logger.error("[Shop] Stripe not configured", { error: error instanceof Error ? error.message : String(error) });
        return res.status(503).json({ message: "Servicio de pagos no disponible" });
      }

      // Build order rows with server-side prices
      const orderItems = skus.map((sku) => {
        const variant = variants.find((v) => v.sku === sku);
        const product = productById.get(variant?.productId ?? "");
        return {
          sku,
          productId: variant?.productId ?? "",
          quantity: quantities.get(sku) as number,
          unitPriceCents: product?.priceCents ?? 0,
        };
      });
      // Pack and free-shipping thresholds are decided here, never by the client,
      // with the same function the page used to preview them.
      const { subtotalCents, packs, discountCents, payableCents, shippingCents } =
        computeCartTotals(orderItems, shopOfferConfig());

      const order = await shopRepo.createShopOrder(
        {
          stripeSessionId: `pending-${randomUUID()}`,
          subtotalCents,
          discountCents,
          shippingCents: 0,
          totalCents: payableCents,
          status: "pending",
          language: lang,
        },
        orderItems,
      );

      const baseUrl = process.env.APP_URL || "https://www.costabravarentaboat.com";
      const tiendaPath = getLocalizedPath("tienda", lang);
      const strings = getShopStrings(lang);

      // Checkout has no inline discount: the reduction has to be a coupon object.
      // A single-use one per session keeps the line items at their real price, so
      // the receipt reads "camiseta 25, tote 10, pack -5" instead of quietly
      // selling the tote at 5.
      let packCoupon: string | undefined;
      if (discountCents > 0) {
        try {
          const coupon = await stripeInstance.coupons.create({
            amount_off: discountCents,
            currency: "eur",
            duration: "once",
            name: strings.packDiscount,
            max_redemptions: 1,
            metadata: { type: "shop_pack", orderId: order.id, packs: String(packs) },
          });
          packCoupon = coupon.id;
        } catch (error: unknown) {
          // Never block a sale over the discount: charge full price rather than fail.
          logger.error("[Shop] Could not create pack coupon, charging full price", {
            orderId: order.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      if (!packCoupon && discountCents > 0) {
        await shopRepo.updateShopOrderAmounts(order.id, {
          shippingCents: 0,
          totalCents: subtotalCents,
        });
      }

      const shippingLabel =
        shippingCents === 0 ? strings.shippingFree : strings.shipping;

      const session = await stripeInstance.checkout.sessions.create({
        mode: "payment",
        locale: STRIPE_LOCALES[lang] ?? "es",
        line_items: orderItems.map((item) => ({
          price_data: {
            currency: "eur",
            product_data: { name: shopItemLabel(item.sku, lang) },
            unit_amount: item.unitPriceCents,
          },
          quantity: item.quantity,
        })),
        ...(packCoupon ? { discounts: [{ coupon: packCoupon }] } : {}),
        shipping_address_collection: { allowed_countries: ["ES"] },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: strings.pickup,
              fixed_amount: { amount: 0, currency: "eur" },
              metadata: { method: "pickup_port" },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: strings.pickupLaura,
              fixed_amount: { amount: 0, currency: "eur" },
              metadata: { method: "pickup_laura" },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: shippingLabel,
              fixed_amount: { amount: shippingCents, currency: "eur" },
              delivery_estimate: {
                minimum: { unit: "business_day", value: 3 },
                maximum: { unit: "business_day", value: 7 },
              },
              metadata: { method: "shipping" },
            },
          },
        ],
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        success_url: `${baseUrl}${tiendaPath}?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}${tiendaPath}?status=cancel`,
        metadata: {
          type: "shop_order",
          orderId: order.id,
          // With free shipping every rate costs 0, so the amount alone stops
          // telling pickup and delivery apart. finalize() needs to know.
          freeShipping: shippingCents === 0 ? "1" : "0",
        },
      });

      await shopRepo.updateShopOrderSessionId(order.id, session.id);

      res.json({ url: session.url });
    } catch (error: unknown) {
      logger.error("[Shop] Error creating checkout session", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error al iniciar el pago" });
    }
  });

  // Order status polling for the success page. Includes a resilience
  // fallback: if the webhook never arrived (e.g. STRIPE_WEBHOOK_SECRET not
  // configured), we verify payment server-side against Stripe and finalize
  // the order through the same idempotent transition.
  app.get("/api/shop/order-status", async (req, res) => {
    try {
      const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
      if (!sessionId || !sessionId.startsWith("cs_")) {
        return res.status(400).json({ message: "session_id requerido" });
      }

      const order = await shopRepo.getShopOrderBySessionId(sessionId);
      if (!order) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      if (order.status === "pending") {
        try {
          const stripeInstance = getStripe();
          const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
          if (session.payment_status === "paid") {
            await finalizeShopOrderFromSession(order.id, session, "order-status-fallback");
            const refreshed = await shopRepo.getShopOrderBySessionId(sessionId);
            return res.json(await buildOrderSummary(refreshed ?? order));
          }
        } catch (error: unknown) {
          logger.warn("[Shop] order-status fallback check failed", { error: error instanceof Error ? error.message : String(error) });
        }
      }

      res.json(await buildOrderSummary(order));
    } catch (error: unknown) {
      logger.error("[Shop] Error fetching order status", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error al consultar el pedido" });
    }
  });

  logger.info("[Routes] Shop routes registered");
}

/**
 * What the success screen is allowed to see. Keyed only by the Stripe session id,
 * which lives in the buyer's own URL, so it deliberately leaves out everything
 * personal (name, email, shipping address) and carries only what the buyer
 * already knows: their reference, what they bought and what they paid.
 */
async function buildOrderSummary(order: {
  id: string;
  orderNumber: number;
  status: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  deliveryMethod: string;
}) {
  const items = await shopRepo.getShopOrderItems(order.id);
  return {
    status: order.status,
    orderNumber: formatOrderNumber(order.orderNumber),
    items: items.map((i) => ({
      sku: i.sku,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
    })),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    deliveryMethod: order.deliveryMethod,
  };
}

/**
 * Shared idempotent finalization: pending → paid + stock decrement + emails.
 * Called from the Stripe webhook and from the order-status fallback.
 */
async function finalizeShopOrderFromSession(
  orderId: string,
  session: Stripe.Checkout.Session,
  source: string,
): Promise<void> {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const shippingDetails = session.collected_information?.shipping_details ?? null;
  const shippingCents = session.shipping_cost?.amount_total ?? 0;

  // Both pickup options are 0 EUR, and once the order clears the free-shipping
  // threshold home delivery is 0 too, so the amount cannot tell them apart at
  // all. The chosen rate's metadata.method (set at checkout creation) is the
  // only reliable signal; the amount is a last resort.
  const freeShipping = session.metadata?.freeShipping === "1";
  let deliveryMethod: string = shippingCents > 0 ? "shipping" : "pickup_port";
  let methodResolved = false;
  try {
    const full = await getStripe().checkout.sessions.retrieve(session.id, {
      expand: ["shipping_cost.shipping_rate"],
    });
    const rate = full.shipping_cost?.shipping_rate;
    const method =
      rate && typeof rate !== "string" ? rate.metadata?.method : undefined;
    if (method === "pickup_port" || method === "pickup_laura" || method === "shipping") {
      deliveryMethod = method;
      methodResolved = true;
    }
  } catch (err: unknown) {
    logger.warn("[Shop] Could not resolve shipping method from rate metadata", {
      orderId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  if (!methodResolved && freeShipping) {
    // Unresolvable: guess "shipping", because forgetting to post a parcel is a
    // worse failure than expecting a pickup that turns out to be a delivery.
    deliveryMethod = "shipping";
    logger.error("[Shop] Delivery method unresolved on a free-shipping order, assuming shipping", {
      orderId,
    });
  }

  const result = await shopRepo.markOrderPaid(orderId, {
    stripePaymentIntentId: paymentIntentId,
    customerName: session.customer_details?.name ?? shippingDetails?.name ?? undefined,
    customerEmail: session.customer_details?.email ?? undefined,
    deliveryMethod,
    shippingAddress: shippingDetails,
  });

  if (!result.order) {
    logger.info("[Shop] Order already finalized, skipping", { orderId, source });
    return;
  }

  // Persist real shipping/total now that Stripe collected the choice
  await shopRepo.updateShopOrderAmounts(orderId, {
    shippingCents,
    totalCents: session.amount_total ?? result.order.subtotalCents + shippingCents,
  });

  logger.info("[Shop] Order paid", {
    orderId,
    source,
    deliveryMethod,
    totalCents: session.amount_total,
  });

  if (result.stockShortfall.length > 0) {
    logger.warn("[Shop] Stock shortfall after paid order — resolve manually", {
      orderId,
      skus: result.stockShortfall,
    });
  }

  // result.order was read BEFORE updateShopOrderAmounts, so its totalCents is still the
  // pre-shipping subtotal. Override both shippingCents AND totalCents so the customer
  // email shows the real amount charged (subtotal + shipping), not the subtotal.
  const emailTotalCents = session.amount_total ?? result.order.subtotalCents + shippingCents;
  const orderForEmail = { ...result.order, deliveryMethod, shippingCents, totalCents: emailTotalCents };
  // The CRM owns the physical inventory: write the sale into its ledger so the
  // counter stock and the shop stay on the same number (and Laura's profit
  // split counts the online sales too). Runs once per order: markOrderPaid's
  // pending -> paid guard already returned above on a redelivered webhook.
  pushCrmMerchSale(
    result.items.map((i) => ({ sku: i.sku, quantity: i.quantity, unitPriceCents: i.unitPriceCents })),
    formatOrderNumber(result.order.orderNumber),
  ).catch((err: unknown) =>
    logger.error("[Shop] Error recording sale in the CRM ledger", { error: err instanceof Error ? err.message : String(err) }),
  );
  notifyOwnerOnTelegram(orderForEmail, result.items, result.stockShortfall).catch((err: unknown) =>
    logger.error("[Shop] Error sending Telegram sale notification", { error: err instanceof Error ? err.message : String(err) }),
  );
  sendShopOrderConfirmation(orderForEmail, result.items).catch((err: unknown) =>
    logger.error("[Shop] Error sending order confirmation email", { error: err instanceof Error ? err.message : String(err) }),
  );
  sendShopOrderOwnerNotification(orderForEmail, result.items, result.stockShortfall).catch((err: unknown) =>
    logger.error("[Shop] Error sending owner notification email", { error: err instanceof Error ? err.message : String(err) }),
  );
}

/** Owner-facing delivery label, always Spanish (same wording as the owner email). */
function deliveryLabelEs(method: string): string {
  if (method === "shipping") return "Envio a domicilio";
  if (method === "pickup_laura") return "Recogida en Laura Cabanas (Lloret)";
  return "Recogida en el puerto de Blanes";
}

const eur = (cents: number): string => `${(cents / 100).toFixed(2).replace(".", ",")} EUR`;

/**
 * Body of the owner's sale notification. Pure so it can be asserted without a
 * network call; the sending wrapper is right below.
 */
export function buildSaleNotification(
  order: Pick<
    ShopOrder,
    | "orderNumber"
    | "totalCents"
    | "discountCents"
    | "shippingCents"
    | "deliveryMethod"
    | "customerName"
    | "customerEmail"
    | "shippingAddress"
  >,
  items: Pick<ShopOrderItem, "sku" | "quantity" | "unitPriceCents">[],
  stockShortfall: string[],
): string {
  const lines = items.map(
    (item) =>
      `- ${shopItemLabel(item.sku, "es")} x${item.quantity}  ${eur(item.unitPriceCents * item.quantity)}`,
  );

  const address = order.shippingAddress as {
    address?: { line1?: string; line2?: string; postal_code?: string; city?: string };
  } | null;
  const addressLine = address?.address
    ? [address.address.line1, address.address.line2, address.address.postal_code, address.address.city]
        .filter(Boolean)
        .join(", ")
    : "";

  const parts = [
    `Pedido ${formatOrderNumber(order.orderNumber)}  ${eur(order.totalCents)}`,
    "",
    ...lines,
  ];
  if (order.discountCents > 0) parts.push(`- Descuento pack  -${eur(order.discountCents)}`);
  if (order.shippingCents > 0) parts.push(`- Envio  ${eur(order.shippingCents)}`);
  parts.push("", `Entrega: ${deliveryLabelEs(order.deliveryMethod)}`);
  if (addressLine) parts.push(addressLine);
  parts.push(`Cliente: ${order.customerName || "(sin nombre)"}`);
  if (order.customerEmail) parts.push(order.customerEmail);
  if (stockShortfall.length > 0) {
    parts.push("", `ATENCION: stock insuficiente en ${stockShortfall.join(", ")}. Ya cobrado, resolver a mano.`);
  }

  return parts.join("\n");
}

/**
 * Telegram ping to the owner when an order is paid.
 *
 * The two emails below are the designed notification path, but SENDGRID_API_KEY
 * is not set in production, so today they send nothing and a sale reaches nobody
 * until someone opens the CRM. Telegram IS configured, so this is the channel
 * that actually fires. Best-effort by design: it is called fire-and-forget and a
 * failed ping must never touch an order that is already paid.
 */
async function notifyOwnerOnTelegram(
  order: ShopOrder,
  items: ShopOrderItem[],
  stockShortfall: string[],
): Promise<void> {
  await sendTelegramMessage(
    "Nueva venta en la tienda",
    buildSaleNotification(order, items, stockShortfall),
  );
}

/** Webhook handler: checkout.session.completed with metadata.type=shop_order */
export async function handleShopCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    logger.warn("[Shop] shop_order session without orderId metadata", { sessionId: session.id });
    return;
  }
  await finalizeShopOrderFromSession(orderId, session, "webhook");
}

/** Webhook handler: checkout.session.expired with metadata.type=shop_order */
export async function handleShopCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const cancelled = await shopRepo.markOrderCancelled(orderId);
  if (cancelled) {
    logger.info("[Shop] Pending order cancelled after session expiry", { orderId });
  }
}
