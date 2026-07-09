import type { Express } from "express";
import { randomUUID } from "crypto";
import type Stripe from "stripe";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { shopRepo } from "../storage";
import { getStripe } from "./payments";
import { getShopVariant, SHOP_MAX_QTY_PER_ITEM, DEFAULT_SHIPPING_FLAT_CENTS } from "@shared/shopData";
import { getLocalizedPath } from "@shared/i18n-routes";
import type { LangCode } from "@shared/seoConstants";
import { SUPPORTED_LANGUAGES } from "@shared/seoConstants";
import { logger } from "../lib/logger";
import { getShopStrings, shopItemLabel } from "../lib/shopStrings";
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

function shippingFlatCents(): number {
  const raw = process.env.SHOP_SHIPPING_FLAT_CENTS;
  if (!raw) return DEFAULT_SHIPPING_FLAT_CENTS;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_SHIPPING_FLAT_CENTS;
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
      res.json({ products });
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
      const subtotalCents = orderItems.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

      const order = await shopRepo.createShopOrder(
        {
          stripeSessionId: `pending-${randomUUID()}`,
          subtotalCents,
          shippingCents: 0,
          totalCents: subtotalCents,
          status: "pending",
          language: lang,
        },
        orderItems,
      );

      const baseUrl = process.env.APP_URL || "https://www.costabravarentaboat.com";
      const tiendaPath = getLocalizedPath("tienda", lang);
      const strings = getShopStrings(lang);

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
              display_name: strings.shipping,
              fixed_amount: { amount: shippingFlatCents(), currency: "eur" },
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
        metadata: { type: "shop_order", orderId: order.id },
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
            return res.json({ status: refreshed?.status ?? "paid" });
          }
        } catch (error: unknown) {
          logger.warn("[Shop] order-status fallback check failed", { error: error instanceof Error ? error.message : String(error) });
        }
      }

      res.json({ status: order.status });
    } catch (error: unknown) {
      logger.error("[Shop] Error fetching order status", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error al consultar el pedido" });
    }
  });

  logger.info("[Routes] Shop routes registered");
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

  // Both pickup options are 0 EUR, so the amount alone cannot tell them apart.
  // Read the chosen shipping rate's metadata.method (set at checkout creation),
  // re-retrieving the session with the rate expanded. Fall back to the amount.
  let deliveryMethod: string = shippingCents > 0 ? "shipping" : "pickup_port";
  try {
    const full = await getStripe().checkout.sessions.retrieve(session.id, {
      expand: ["shipping_cost.shipping_rate"],
    });
    const rate = full.shipping_cost?.shipping_rate;
    const method =
      rate && typeof rate !== "string" ? rate.metadata?.method : undefined;
    if (method === "pickup_port" || method === "pickup_laura" || method === "shipping") {
      deliveryMethod = method;
    }
  } catch (err: unknown) {
    logger.warn("[Shop] Could not resolve shipping method from rate metadata", {
      orderId,
      error: err instanceof Error ? err.message : String(err),
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
  sendShopOrderConfirmation(orderForEmail, result.items).catch((err: unknown) =>
    logger.error("[Shop] Error sending order confirmation email", { error: err instanceof Error ? err.message : String(err) }),
  );
  sendShopOrderOwnerNotification(orderForEmail, result.items, result.stockShortfall).catch((err: unknown) =>
    logger.error("[Shop] Error sending owner notification email", { error: err instanceof Error ? err.message : String(err) }),
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
