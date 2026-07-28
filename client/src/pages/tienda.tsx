import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useShopCart } from "@/hooks/useShopCart";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  SHOP_PRODUCTS,
  SHOP_SIZES,
  getShopVariant,
  computeCartTotals,
  DEFAULT_SHOP_OFFERS,
  type CartTotals,
  type ShopColor,
  type ShopOffers,
  type ShopProductDef,
  type ShopShot,
} from "@shared/shopData";
import { apiRequest } from "@/lib/queryClient";
import { generateHreflangLinks, generateCanonicalUrl, BASE_DOMAIN } from "@/utils/seo-config";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/utils/seo-schemas";

/**
 * The capsule's own palette, scoped to this page. These are the two inks the
 * garments are actually printed in, not site tokens: the shop borrows the
 * product's colours instead of repeating the site chrome. Contrast measured:
 * white on ink 6.2:1, butter on ink 5.1:1, site foreground on butter 13.6:1.
 */
const SHOP_SURFACE = {
  "--shop-butter": "oklch(0.93 0.08 96)",
  "--shop-ink": "oklch(0.50 0.18 264)",
} as CSSProperties;

const NAVY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

/** CTA for the two drenched bands, where navy-on-dark would disappear. */
const BUTTER_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--shop-butter)] px-7 text-base font-semibold text-cta transition-transform duration-200 ease-out hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shop-butter)] focus-visible:ring-offset-2 motion-reduce:hover:scale-100";

const LAURA_CABANAS_URL = "https://www.lauracabanas.com/";

// Real garment colors for the swatch dot next to the color name. OKLCH so the
// physical fabric reads true; these are product attributes, not design tokens.
const COLOR_SWATCH: Record<string, string> = {
  butter: "oklch(0.92 0.07 96)",
  navy: "oklch(0.34 0.05 250)",
  royal: "oklch(0.50 0.18 264)",
};

interface CatalogVariant {
  sku: string;
  productId: string;
  color: string | null;
  size: string | null;
  stock: number;
  active: boolean;
}

interface CatalogProduct {
  id: string;
  priceCents: number;
  active: boolean;
  variants: CatalogVariant[];
}

interface CatalogResponse {
  products: CatalogProduct[];
  offers?: ShopOffers;
}

type OrderBanner = "success" | "pending" | "cancelled" | null;

/** What /api/shop/order-status returns: reference, lines and amounts, no personal data. */
interface OrderSummary {
  status: string;
  orderNumber: string;
  items: { sku: string; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  deliveryMethod: string;
}

function formatPrice(cents: number): string {
  const euros = cents / 100;
  return Number.isInteger(euros) ? `${euros} EUR` : `${euros.toFixed(2).replace(".", ",")} EUR`;
}

/** Fills a translated template like "Quedan {n}" without splitting the sentence. */
function fill(template: string, token: string, value: string): string {
  return template.replace(token, value);
}

export default function TiendaPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const s = t.shopPage;

  const hreflangLinks = generateHreflangLinks("tienda");
  const canonical = generateCanonicalUrl("tienda", language);

  const cart = useShopCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [unavailableSkus, setUnavailableSkus] = useState<string[]>([]);
  const [banner, setBanner] = useState<OrderBanner>(null);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const isMobile = useIsMobile();

  const { data: catalog, refetch: refetchCatalog } = useQuery<CatalogResponse>({
    queryKey: ["/api/shop/catalog"],
  });

  // Offer values come from the server so the cart can never promise a discount
  // checkout will not honour.
  const offers = catalog?.offers ?? DEFAULT_SHOP_OFFERS;

  const liveBySku = useMemo(() => {
    const map = new Map<string, { stock: number; active: boolean; priceCents: number; productActive: boolean }>();
    for (const product of catalog?.products ?? []) {
      for (const variant of product.variants) {
        map.set(variant.sku, {
          stock: variant.stock,
          active: variant.active,
          priceCents: product.priceCents,
          productActive: product.active,
        });
      }
    }
    return map;
  }, [catalog]);

  const priceOf = useCallback(
    (product: ShopProductDef): number => {
      const live = liveBySku.get(product.variants[0]?.sku ?? "");
      return live?.priceCents ?? product.defaultPriceCents;
    },
    [liveBySku],
  );

  const skuAvailable = useCallback(
    (sku: string): boolean => {
      const live = liveBySku.get(sku);
      if (!live) return true; // catalog not loaded yet; server re-validates
      return live.active && live.productActive && live.stock > 0;
    },
    [liveBySku],
  );

  // Handle ?status=success|cancel back from Stripe Checkout. The session id is
  // kept in the URL afterwards (only ?status is dropped) so refreshing the page
  // still shows the order instead of wiping the only proof the buyer has.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const sessionId = params.get("session_id");
    if (!status && !sessionId) return;

    if (status === "cancel") {
      setBanner("cancelled");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (status === "success") cart.clear();

    if (!sessionId) {
      setBanner("success");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Only a redirect straight from Stripe proves the payment went through. On a
    // later reload (session_id alone in the URL) we trust nothing but the status
    // the API reports, or we would greet an expired order with "Order confirmed".
    const cameFromStripe = status === "success";
    setBanner("pending");
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/shop/order-status?session_id=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data: OrderSummary = await res.json();
          if (data.status === "paid" || data.status === "fulfilled") {
            setSummary(data);
            setBanner("success");
            return;
          }
          if (data.status === "cancelled") {
            setBanner("cancelled");
            return;
          }
        }
      } catch {
        // network hiccup: keep polling
      }
      if (attempts < 8) {
        setTimeout(poll, 1500);
      } else {
        // Still pending: from Stripe it means the order finalizes async, so keep
        // the confirmation. Reached any other way, say nothing rather than lie.
        setBanner(cameFromStripe ? "success" : null);
      }
    };
    void poll();

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?session_id=${encodeURIComponent(sessionId)}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Camiseta Costa Brava Culture · Azul marino · M" from a bare SKU.
  const itemLabel = (sku: string): string => {
    const entry = getShopVariant(sku);
    if (!entry) return sku;
    const name = entry.product.i18nKey === "tee" ? s.products.tee.name : s.products.tote.name;
    const colors = s.colors as Record<string, string>;
    const color = colors[entry.variant.color] ?? entry.variant.color;
    return [name, color, entry.variant.size].filter(Boolean).join(" · ");
  };

  const deliveryLabel = (method: string): string =>
    method === "shipping"
      ? s.delivery.shippingTitle
      : method === "pickup_laura"
        ? s.delivery.pickupLauraTitle
        : s.delivery.pickupTitle;

  const totals: CartTotals = useMemo(() => {
    const priced = cart.items.flatMap((item) => {
      const entry = getShopVariant(item.sku);
      if (!entry) return [];
      return [{ ...item, unitPriceCents: priceOf(entry.product) }];
    });
    return computeCartTotals(priced, offers);
  }, [cart.items, priceOf, offers]);

  const handleCheckout = async () => {
    if (cart.items.length === 0 || checkoutLoading) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    setUnavailableSkus([]);
    try {
      const res = await apiRequest("POST", "/api/shop/checkout", {
        items: cart.items,
        language,
      });
      const data: { url?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutError(s.cart.genericError);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      if (message.startsWith("409")) {
        try {
          const body: { outOfStock?: string[] } = JSON.parse(message.slice(message.indexOf("{")));
          setUnavailableSkus(body.outOfStock ?? []);
        } catch {
          setUnavailableSkus([]);
        }
        setCheckoutError(s.cart.itemUnavailable);
        void refetchCatalog();
      } else {
        setCheckoutError(s.cart.genericError);
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  // One entry per product+color: the two tee colors are two pieces on the page
  // (same DB product, variants filtered by color).
  const displayItems = SHOP_PRODUCTS.flatMap((product) =>
    product.colors.map((color) => ({ product, color })),
  );

  /** Adding opens the cart: silent adds are the main reason people add twice. */
  const handleAdd = (sku: string) => {
    cart.addItem(sku);
    setCheckoutError(null);
    setAnnouncement(`${s.cart.added}: ${itemLabel(sku)}`);
    setCartOpen(true);
  };

  const teePrice = priceOf(SHOP_PRODUCTS[0]);
  const totePrice = priceOf(SHOP_PRODUCTS[1]);
  const packBefore = teePrice + totePrice;
  const packAfter = packBefore - offers.packDiscountCents;
  const packSaving = offers.packDiscountCents + offers.shippingFlatCents;

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: s.navLabel, url: canonical },
    ]),
    ...displayItems.map(({ product, color }) => {
      const info = product.i18nKey === "tee" ? s.products.tee : s.products.tote;
      const colorVariants = product.variants.filter((v) => v.color === color);
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.colors.length > 1 ? `${info.name} (${s.colors[color]})` : info.name,
        description: info.description,
        image: (product.images[color]?.shots ?? []).map((shot) => `${BASE_DOMAIN}${shot.src}`),
        color: s.colors[color],
        brand: { "@type": "Brand", name: "Costa Brava Rent a Boat x Laura Cabanas" },
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          price: (priceOf(product) / 100).toFixed(2),
          availability: colorVariants.some((v) => skuAvailable(v.sku))
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: canonical,
        },
      };
    }),
    generateFAQSchema(s.faq.map((f) => ({ question: f.q, answer: f.a }))),
  ];

  return (
    <div className="min-h-screen bg-background" style={SHOP_SURFACE}>
      <SEO
        title={s.seoTitle}
        description={s.seoDescription}
        keywords={s.navLabel}
        canonical={canonical}
        ogImage={`${BASE_DOMAIN}/images/shop/camiseta-costa-brava-culture-butter-back.webp`}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation cartCount={cart.count} onCartClick={() => setCartOpen(true)} />

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Order status banners */}
      {banner && (
        <div className="px-4 pt-24 sm:px-6">
          <div
            className={`mx-auto flex max-w-3xl items-start gap-3 rounded-xl border p-4 ${
              banner === "cancelled"
                ? "border-border bg-muted/60"
                : "border-success/30 bg-success/10"
            }`}
            role="status"
          >
            {banner === "pending" ? (
              <Loader2 className="mt-0.5 h-5 w-5 flex-shrink-0 animate-spin text-success" />
            ) : banner === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
            ) : (
              <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className="font-heading font-semibold text-foreground">
                {banner === "cancelled" ? s.cancelled.title : banner === "pending" ? s.success.pending : s.success.title}
              </p>
              {banner !== "pending" && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {banner === "cancelled" ? s.cancelled.text : s.success.text}
                </p>
              )}
              {banner === "success" && summary && (
                <div className="mt-3 rounded-lg border border-border bg-background/60 p-3 text-sm">
                  <p className="font-semibold text-foreground">
                    {s.success.orderLabel} {summary.orderNumber}
                  </p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {summary.items.map((item) => (
                      <li key={item.sku} className="flex justify-between gap-3">
                        <span>
                          {itemLabel(item.sku)}
                          {item.quantity > 1 ? ` x${item.quantity}` : ""}
                        </span>
                        <span className="whitespace-nowrap">
                          {formatPrice(item.unitPriceCents * item.quantity)}
                        </span>
                      </li>
                    ))}
                    {summary.discountCents > 0 && (
                      <li className="flex justify-between gap-3 text-success">
                        <span>{s.success.discount}</span>
                        <span className="whitespace-nowrap">-{formatPrice(summary.discountCents)}</span>
                      </li>
                    )}
                    {summary.shippingCents > 0 && (
                      <li className="flex justify-between gap-3">
                        <span>{s.delivery.shippingTitle}</span>
                        <span className="whitespace-nowrap">{formatPrice(summary.shippingCents)}</span>
                      </li>
                    )}
                  </ul>
                  <p className="mt-2 flex justify-between gap-3 border-t border-border pt-2 font-semibold text-foreground">
                    <span>{s.success.total}</span>
                    <span className="whitespace-nowrap">{formatPrice(summary.totalCents)}</span>
                  </p>
                  {summary.shippingCents === 0 && (
                    <p className="mt-2 text-muted-foreground">{deliveryLabel(summary.deliveryMethod)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HERO: the capsule's own colour carries the fold, the photograph does
          the selling. No crop: the source frames are square and stay square. */}
      <section className={`bg-[var(--shop-butter)] ${banner ? "pt-8" : "pt-24 lg:pt-28"}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 pb-12 sm:px-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-24">
          <div className="order-1 -mx-5 sm:mx-0 lg:order-2">
            <picture>
              <source type="image/avif" srcSet="/images/shop/tienda-hero-duo.avif" />
              <img
                src="/images/shop/tienda-hero-duo.webp"
                alt="Dos amigos sentados en el pantalan del puerto de Blanes con la camiseta Costa Brava Culture en azul marino y amarillo mantequilla"
                width={1200}
                height={1200}
                // React 18 does not know the camelCase prop and warns; the
                // lowercase DOM attribute passes straight through.
                {...({ fetchpriority: "high" } as Record<string, string>)}
                decoding="async"
                className="aspect-square w-full object-cover object-[center_35%] sm:rounded-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
              />
            </picture>
          </div>

          <div className="order-2 lg:order-1">
            <h1 className="font-heading text-[clamp(2.75rem,8vw,4.75rem)] font-bold leading-[0.95] tracking-[-0.02em] text-foreground text-balance">
              {s.hero.title}
            </h1>
            <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-foreground/80">
              {s.hero.subtitle}
            </p>
            <p className="mt-6 text-base font-semibold text-foreground">{s.hero.limitedNote}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#piezas" className={`${NAVY_CTA} min-h-12 px-7 text-base`}>
                {s.hero.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
              <span className="text-sm font-medium text-foreground/70">
                {s.hero.meta} · {s.hero.collabBadge}
              </span>
            </div>
            <p className="mt-8 max-w-[46ch] border-t border-foreground/15 pt-5 text-sm text-foreground/70">
              {s.hero.credit}
            </p>
          </div>
        </div>
      </section>

      {/* THE PIECES: three editorial rows, alternating side. A three-cell card
          grid would read as a catalogue that ran out of products. */}
      <section id="piezas" className="scroll-mt-24">
        {displayItems.map(({ product, color }, index) => (
          <PieceRow
            key={`${product.id}-${color}`}
            product={product}
            color={color}
            price={priceOf(product)}
            mirrored={index % 2 === 1}
            skuAvailable={skuAvailable}
            stockOf={(sku) => liveBySku.get(sku)?.stock}
            onAdd={handleAdd}
          />
        ))}
      </section>

      {/* PACK: drenched in the print ink. A different visual world because it is
          a different offer, not another product. */}
      <section className="bg-[var(--shop-ink)] px-5 py-16 text-white sm:px-8 lg:py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[46ch]">
            <h2 className="font-heading text-[clamp(2rem,4.5vw,3rem)] font-bold leading-tight tracking-[-0.02em] text-balance">
              {s.pack.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--shop-butter)]">{s.pack.text}</p>
          </div>
          <div className="flex-shrink-0 lg:text-right">
            <p className="flex items-baseline gap-3 font-heading lg:justify-end">
              <span className="text-sm font-medium text-[var(--shop-butter)] line-through">
                {formatPrice(packBefore)}
              </span>
              <span className="text-5xl font-bold tabular-nums">{formatPrice(packAfter)}</span>
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--shop-butter)]">
              {s.pack.saving} {formatPrice(packSaving)}
            </p>
            <a href="#piezas" className={`${BUTTER_CTA} mt-6 min-h-12`}>
              {s.pack.cta}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* DESIGNER: the collaboration is the reason this exists, so it gets a
          band of its own instead of a footnote card. */}
      <section className="bg-[var(--shop-butter)] px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-foreground">
            {s.designer.title}
          </h2>
          <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-foreground/80">
            {s.designer.text}
          </p>
          <a
            href={LAURA_CABANAS_URL}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex items-center gap-1.5 font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
          >
            {s.designer.cta}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* DELIVERY: three rows of plain text. Icon-topped cards would be the
          third identical grid on one page. */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-bold tracking-[-0.01em] text-foreground">
            {s.delivery.title}
          </h2>
          <dl className="mt-8 border-t border-border">
            {[
              { title: s.delivery.pickupTitle, text: s.delivery.pickupText, price: 0 },
              { title: s.delivery.pickupLauraTitle, text: s.delivery.pickupLauraText, price: 0 },
              {
                title: s.delivery.shippingTitle,
                text: s.delivery.shippingText,
                price: offers.shippingFlatCents,
              },
            ].map((option) => (
              <div key={option.title} className="border-b border-border py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-heading font-semibold text-foreground">{option.title}</dt>
                  <dd className="flex-shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {option.price === 0 ? formatPrice(0) : formatPrice(option.price)}
                  </dd>
                </div>
                <dd className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
                  {option.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CROSS-SELL: the merch buyer is a warm boat lead and the page never
          said so. The illustration is literally one of the boats. */}
      <section className="bg-cta px-5 py-16 text-cta-foreground sm:px-8 lg:py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[46ch]">
            <h2 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-[-0.02em] text-balance">
              {s.boatCta.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-cta-foreground/80">{s.boatCta.text}</p>
          </div>
          <Link href={localizedPath("pricing")} className={`${BUTTER_CTA} min-h-12 flex-shrink-0`}>
            {s.boatCta.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-bold tracking-[-0.01em] text-foreground">
            {s.faqTitle}
          </h2>
          <dl className="mt-8 divide-y divide-border border-t border-border">
            {s.faq.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-heading font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-1.5 max-w-[68ch] leading-relaxed text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Cart: header icon and every add open this sheet (right drawer on
          desktop, bottom on mobile). */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={
            isMobile
              ? "max-h-[85vh] overflow-y-auto rounded-t-2xl"
              : "w-full overflow-y-auto sm:max-w-md"
          }
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-heading">
              <ShoppingBag className="h-5 w-5" />
              {s.cart.title}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-4">
            <CartPanel
              cart={cart}
              priceOf={priceOf}
              totals={totals}
              checkoutLoading={checkoutLoading}
              checkoutError={checkoutError}
              unavailableSkus={unavailableSkus}
              onCheckout={handleCheckout}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile checkout bar: only once there is something to check out. An
          always-on bar spends a fifth of a phone screen saying nothing. */}
      {cart.count > 0 && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-6px_24px_-8px_hsl(215_45%_20%/0.3)] backdrop-blur motion-safe:animate-in motion-safe:slide-in-from-bottom-4 lg:hidden">
            <div className="mx-auto flex max-w-md items-center justify-between gap-3">
              <p className="text-sm font-bold text-foreground">
                {cart.count} · {formatPrice(totals.payableCents)}
              </p>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className={`${NAVY_CTA} min-h-11 flex-shrink-0 px-6 text-sm`}
              >
                <ShoppingBag className="h-4 w-4" />
                {s.cart.checkout}
              </button>
            </div>
          </div>
          <div className="h-20 lg:hidden" />
        </>
      )}

      <Footer />
    </div>
  );
}

interface PieceRowProps {
  product: ShopProductDef;
  color: ShopColor;
  price: number;
  mirrored: boolean;
  skuAvailable: (sku: string) => boolean;
  stockOf: (sku: string) => number | undefined;
  onAdd: (sku: string) => void;
}

function PieceRow({
  product,
  color,
  price,
  mirrored,
  skuAvailable,
  stockOf,
  onAdd,
}: PieceRowProps) {
  const t = useTranslations();
  const s = t.shopPage;
  const [size, setSize] = useState<string | null>(product.hasSizes ? null : "");
  const [sizeMissing, setSizeMissing] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);

  const info = product.i18nKey === "tee" ? s.products.tee : s.products.tote;
  const shots = product.images[color]?.shots ?? [];

  const colorVariants = product.variants.filter((v) => v.color === color);
  const selectedSku = product.hasSizes
    ? size
      ? `tee-${color}-${size}`
      : null
    : colorVariants[0]?.sku ?? null;

  const selectedAvailable = selectedSku ? skuAvailable(selectedSku) : false;
  const selectedStock = selectedSku ? stockOf(selectedSku) : undefined;
  const allSoldOut = colorVariants.every((v) => !skuAvailable(v.sku));
  const otherColor = product.colors.find((c) => c !== color);

  // A disabled button that will not say why is a silent bounce: keep it live
  // and send the pointer back to the thing that is missing.
  const handleAddClick = () => {
    if (product.hasSizes && !size) {
      setSizeMissing(true);
      sizesRef.current?.querySelector("button")?.focus();
      return;
    }
    if (selectedSku && selectedAvailable) onAdd(selectedSku);
  };

  return (
    <article className="border-b border-border last:border-b-0">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-14">
        <div className={`-mx-5 sm:mx-0 lg:col-span-7 ${mirrored ? "lg:order-2" : ""}`}>
          <PieceGallery shots={shots} alt={`${info.name} - ${s.colors[color]}`} dimmed={allSoldOut} />
        </div>

        <div className={`lg:col-span-5 ${mirrored ? "lg:order-1" : ""}`}>
          <h2 className="font-heading text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.02em] text-foreground text-balance">
            {info.name}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span
                className="h-3.5 w-3.5 flex-shrink-0 rounded-full ring-1 ring-border"
                style={{ backgroundColor: COLOR_SWATCH[color] ?? "transparent" }}
                aria-hidden="true"
              />
              {s.colors[color]}
            </p>
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {formatPrice(price)}
            </p>
          </div>

          <p className="mt-5 max-w-[52ch] leading-relaxed text-muted-foreground">
            {info.description}
          </p>

          {otherColor && (
            <a
              href="#piezas"
              // py/-my pair widens the tap target to 40px without moving anything
              className="mt-4 inline-flex items-center gap-1.5 py-2.5 -my-2.5 text-sm font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {fill(s.alsoIn, "{color}", s.colors[otherColor])}
            </a>
          )}

          {product.hasSizes && (
            <div className="mt-8">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-semibold text-foreground">{s.sizeLabel}</p>
              </div>
              {/* The single biggest apparel objection, answered where it is
                  asked instead of at the bottom of the FAQ. */}
              <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                {s.fitNote}
              </p>
              <div ref={sizesRef} className="mt-4 flex flex-wrap gap-2.5">
                {SHOP_SIZES.map((sz) => {
                  const sku = `tee-${color}-${sz}`;
                  const available = skuAvailable(sku);
                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        setSize(sz);
                        setSizeMissing(false);
                      }}
                      aria-pressed={size === sz}
                      className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 ${
                        size === sz && available
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground hover:border-foreground/50"
                      } ${!available ? "line-through" : ""}`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
              {sizeMissing && (
                <p className="mt-3 text-sm font-semibold text-destructive" role="alert">
                  {s.selectSizeFirst}
                </p>
              )}
            </div>
          )}

          <div className="mt-8">
            {selectedSku && selectedAvailable && selectedStock !== undefined && selectedStock <= 3 && (
              <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-popular/10 px-3 py-1 text-xs font-semibold text-popular">
                <span className="h-1.5 w-1.5 rounded-full bg-popular" aria-hidden="true" />
                {fill(s.unitsLeft, "{n}", String(selectedStock))}
              </p>
            )}
            <button
              type="button"
              disabled={allSoldOut || (Boolean(selectedSku) && !selectedAvailable)}
              onClick={handleAddClick}
              className={`${NAVY_CTA} min-h-12 w-full px-6 text-base sm:w-auto sm:min-w-[16rem]`}
            >
              <ShoppingBag className="h-4 w-4" />
              {allSoldOut || (selectedSku && !selectedAvailable)
                ? s.outOfStock
                : `${s.addToCart} · ${formatPrice(price)}`}
            </button>

            <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
              <li>{s.trust.pickup}</li>
              <li>{s.trust.shipping}</li>
              <li>{s.trust.payment}</li>
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Square gallery over two kinds of source frame: the editorial photographs are
 * 1200x1200 and fill the frame, the flat mockups are 1200x1500 cutouts on white
 * and are contained inside it. Covering a 4:5 cutout in a square frame chops the
 * sleeves off the garment, which is the smaller version of the crop this page
 * was built to stop doing.
 */
function PieceGallery({
  shots,
  alt,
  dimmed,
}: {
  shots: ShopShot[];
  alt: string;
  dimmed: boolean;
}) {
  const t = useTranslations();
  const s = t.shopPage;
  const [active, setActive] = useState(0);

  const label = (shot: ShopShot): string =>
    shot.kind === "back" ? s.viewBack : shot.kind === "front" ? s.viewFront : s.viewEditorial;

  const isFlat = (shot: ShopShot): boolean => shot.kind !== "editorial";
  const fitClass = (shot: ShopShot): string =>
    isFlat(shot) ? "object-contain" : "object-cover";
  const frameClass = (shot: ShopShot): string =>
    isFlat(shot) ? "bg-white" : "bg-muted/30";

  const current = shots[active] ?? shots[0];
  if (!current) return null;

  return (
    // The frame is square, so capping its WIDTH caps its height with no crop.
    // Budget: viewport minus the fixed header, the row padding and this
    // thumbnail strip, so a laptop shows the whole piece and its buy button
    // instead of pushing the CTA under the fold. The cap lives here, on a child
    // of a stretched grid cell: putting `mx-auto` on the cell itself turns it
    // shrink-to-fit, and the width then collapses onto the thumbnail strip
    // (the tote, with two thumbs instead of three, rendered 172px wide).
    <div className="mx-auto w-full lg:max-w-[calc(100svh-18rem)]">
      <div className={`relative overflow-hidden sm:rounded-2xl ${frameClass(current)}`}>
        <picture>
          <source type="image/avif" srcSet={current.src.replace(".webp", ".avif")} />
          <img
            key={current.src}
            src={current.src}
            alt={`${alt} - ${label(current).toLowerCase()}`}
            width={1200}
            height={1200}
            loading="lazy"
            decoding="async"
            className={`aspect-square w-full ${fitClass(current)} motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 ${dimmed ? "opacity-90" : ""}`}
          />
        </picture>
        {dimmed && (
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/35">
            <span className="rounded-full bg-background px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground">
              {s.outOfStock}
            </span>
          </span>
        )}
      </div>

      {shots.length > 1 && (
        <div className="mt-3 flex gap-3 px-5 sm:px-0">
          {shots.map((shot, index) => (
            <button
              key={shot.src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={label(shot)}
              aria-pressed={index === active}
              className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg ring-1 transition-[box-shadow,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 ${frameClass(shot)} ${
                index === active ? "ring-2 ring-foreground" : "opacity-70 ring-border hover:opacity-100"
              }`}
            >
              <picture>
                <source type="image/avif" srcSet={shot.src.replace(".webp", ".avif")} />
                <img
                  src={shot.src}
                  alt=""
                  width={160}
                  height={160}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full ${fitClass(shot)}`}
                />
              </picture>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CartPanelProps {
  cart: ReturnType<typeof useShopCart>;
  priceOf: (product: ShopProductDef) => number;
  totals: CartTotals;
  checkoutLoading: boolean;
  checkoutError: string | null;
  unavailableSkus: string[];
  onCheckout: () => void;
}

function CartPanel({
  cart,
  priceOf,
  totals,
  checkoutLoading,
  checkoutError,
  unavailableSkus,
  onCheckout,
}: CartPanelProps) {
  const t = useTranslations();
  const s = t.shopPage;
  const { localizedPath } = useLanguage();

  if (cart.items.length === 0) {
    return <p className="text-sm leading-relaxed text-muted-foreground">{s.cart.empty}</p>;
  }

  const freeShippingProgress =
    totals.shippingCents === 0
      ? 1
      : Math.min(1, totals.payableCents / Math.max(1, totals.payableCents + totals.toFreeShippingCents));

  return (
    <div>
      <ul className="divide-y divide-border">
        {cart.items.map((item) => {
          const entry = getShopVariant(item.sku);
          if (!entry) return null;
          const info = entry.product.i18nKey === "tee" ? s.products.tee : s.products.tote;
          const colorLabel = s.colors[entry.variant.color];
          const unavailable = unavailableSkus.includes(item.sku);
          return (
            <li key={item.sku} className={`py-3 ${unavailable ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold leading-snug text-foreground">{info.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {colorLabel}
                    {entry.variant.size ? ` · ${entry.variant.size}` : ""}
                  </p>
                  {unavailable && (
                    <p className="mt-1 text-xs font-semibold text-destructive">{s.outOfStock}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => cart.removeItem(item.sku)}
                  aria-label={`${s.cart.remove}: ${info.name}`}
                  className="-m-2.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1" role="group" aria-label={s.cart.quantity}>
                  <button
                    type="button"
                    onClick={() => cart.setQuantity(item.sku, item.quantity - 1)}
                    aria-label="-1"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-foreground/50"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-7 text-center text-sm font-semibold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => cart.setQuantity(item.sku, item.quantity + 1)}
                    aria-label="+1"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-foreground/50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatPrice(priceOf(entry.product) * item.quantity)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 border-t border-border pt-3">
        {totals.discountCents > 0 && (
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-success">
            <span>{s.cart.discount}</span>
            <span className="tabular-nums">-{formatPrice(totals.discountCents)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="font-heading font-semibold text-foreground">{s.cart.subtotal}</p>
          <p className="font-heading text-lg font-bold tabular-nums text-foreground">
            {formatPrice(totals.payableCents)}
          </p>
        </div>

        {/* Free-delivery progress: the one nudge that reliably moves a 25 EUR
            cart to 35, and the reason the pack exists. */}
        <div className="mt-3">
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-[width] duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${Math.round(freeShippingProgress * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground">
            {totals.shippingCents === 0
              ? s.cart.freeShippingReached
              : fill(s.cart.toFreeShipping, "{importe}", formatPrice(totals.toFreeShippingCents))}
          </p>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.cart.shippingNote}</p>

        {checkoutError && (
          <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive" role="alert">
            {checkoutError}
          </p>
        )}

        <button
          type="button"
          disabled={checkoutLoading}
          onClick={onCheckout}
          className={`${NAVY_CTA} mt-4 min-h-12 w-full px-6 text-base`}
        >
          {checkoutLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {s.cart.checkoutLoading}
            </>
          ) : (
            <>
              {s.cart.checkout}
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">{s.cart.securePayment}</p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {s.cart.legalNote.split("{enlace}")[0]}
          <a
            href={localizedPath("termsConditions")}
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {s.cart.legalNoteLink}
          </a>
          {s.cart.legalNote.split("{enlace}")[1]}
        </p>
      </div>
    </div>
  );
}
