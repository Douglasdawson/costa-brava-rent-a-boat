import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Anchor,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useShopCart } from "@/hooks/useShopCart";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  SHOP_PRODUCTS,
  SHOP_SIZES,
  getShopVariant,
  type ShopColor,
  type ShopProductDef,
} from "@shared/shopData";
import { apiRequest } from "@/lib/queryClient";
import { generateHreflangLinks, generateCanonicalUrl, BASE_DOMAIN } from "@/utils/seo-config";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/utils/seo-schemas";

const NAVY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const LAURA_CABANAS_URL = "https://www.lauracabanas.com/";

// Soft access gate while the shop is not open to the public. This is NOT real
// security (the code ships in the client bundle); it only keeps the page out of
// sight during early access. Remove the gate (and re-add SEO indexing) to launch.
const SHOP_GATE_PASSWORD = "0760";
const SHOP_GATE_KEY = "cbrb_shop_unlocked";

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
}

type OrderBanner = "success" | "pending" | "cancelled" | null;

function formatPrice(cents: number): string {
  const euros = cents / 100;
  return Number.isInteger(euros) ? `${euros} EUR` : `${euros.toFixed(2).replace(".", ",")} EUR`;
}

export default function TiendaPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const s = t.shopPage;

  const hreflangLinks = generateHreflangLinks("tienda");
  const canonical = generateCanonicalUrl("tienda", language);

  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SHOP_GATE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const cart = useShopCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [unavailableSkus, setUnavailableSkus] = useState<string[]>([]);
  const [banner, setBanner] = useState<OrderBanner>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: catalog, refetch: refetchCatalog } = useQuery<CatalogResponse>({
    queryKey: ["/api/shop/catalog"],
  });

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

  // Handle ?status=success|cancel back from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (!status) return;

    if (status === "cancel") {
      setBanner("cancelled");
    } else if (status === "success") {
      const sessionId = params.get("session_id");
      cart.clear();
      if (sessionId) {
        setBanner("pending");
        let attempts = 0;
        const poll = async () => {
          attempts++;
          try {
            const res = await fetch(`/api/shop/order-status?session_id=${encodeURIComponent(sessionId)}`);
            if (res.ok) {
              const data: { status: string } = await res.json();
              if (data.status === "paid" || data.status === "fulfilled") {
                setBanner("success");
                return;
              }
            }
          } catch {
            // network hiccup: keep polling
          }
          if (attempts < 8) {
            setTimeout(poll, 1500);
          } else {
            setBanner("success"); // payment went through on Stripe; order finalizes async
          }
        };
        void poll();
      } else {
        setBanner("success");
      }
    }

    window.history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotalCents = cart.items.reduce((sum, item) => {
    const entry = getShopVariant(item.sku);
    if (!entry) return sum;
    return sum + priceOf(entry.product) * item.quantity;
  }, 0);

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

  // One catalogue entry per product+color: the two tee colors sell as
  // separate cards (same DB product, variants filtered by color).
  const displayItems = SHOP_PRODUCTS.flatMap((product) =>
    product.colors.map((color) => ({ product, color })),
  );

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
        image: `${BASE_DOMAIN}${product.images[color]?.main ?? ""}`,
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

  const cartContent = (
    <CartPanel
      cart={cart}
      priceOf={priceOf}
      subtotalCents={subtotalCents}
      checkoutLoading={checkoutLoading}
      checkoutError={checkoutError}
      unavailableSkus={unavailableSkus}
      onCheckout={handleCheckout}
    />
  );

  if (!unlocked) {
    return (
      <ShopGate
        onUnlock={() => {
          try {
            sessionStorage.setItem(SHOP_GATE_KEY, "1");
          } catch {
            /* private mode: unlock holds for this render only */
          }
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={s.seoTitle}
        description={s.seoDescription}
        keywords={s.navLabel}
        canonical={canonical}
        robots="noindex, nofollow"
        ogImage={`${BASE_DOMAIN}/images/shop/camiseta-costa-brava-culture-butter-back.webp`}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation cartCount={cart.count} onCartClick={() => setCartOpen(true)} />

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
            <div>
              <p className="font-heading font-semibold text-foreground">
                {banner === "cancelled" ? s.cancelled.title : banner === "pending" ? s.success.pending : s.success.title}
              </p>
              {banner !== "pending" && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {banner === "cancelled" ? s.cancelled.text : s.success.text}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className={`px-4 ${banner ? "pt-10" : "pt-28"} pb-12 sm:px-6`}>
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary">
            <Anchor className="h-4 w-4" />
            {s.hero.collabBadge}
          </span>
          <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {s.hero.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {s.hero.subtitle}
          </p>
          <p className="mt-3 text-sm font-semibold text-popular">{s.hero.limitedNote}</p>
        </div>
        <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-border">
          <picture>
            <source type="image/avif" srcSet="/images/shop/tienda-hero-duo.avif" />
            <img
              src="/images/shop/tienda-hero-duo.webp"
              alt={`${s.hero.title} - ${s.hero.collabBadge}`}
              width={1200}
              height={1200}
              decoding="async"
              className="aspect-[4/3] w-full object-cover object-[center_30%] sm:aspect-[21/10]"
            />
          </picture>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {displayItems.map(({ product, color }) => (
              <ProductCard
                key={`${product.id}-${color}`}
                product={product}
                color={color}
                price={priceOf(product)}
                skuAvailable={skuAvailable}
                stockOf={(sku) => liveBySku.get(sku)?.stock}
                onAdd={(sku) => {
                  cart.addItem(sku);
                  setCheckoutError(null);
                }}
              />
            ))}

            {/* Delivery info */}
            <div className="rounded-2xl border border-border bg-muted/40 p-6 sm:col-span-2 lg:col-span-3">
              <h2 className="font-heading text-xl font-bold text-foreground">{s.delivery.title}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Anchor className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{s.delivery.pickupTitle}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.delivery.pickupText}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{s.delivery.pickupLauraTitle}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.delivery.pickupLauraText}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{s.delivery.shippingTitle}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.delivery.shippingText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESIGNER */}
      <section className="bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">{s.designer.title}</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{s.designer.text}</p>
          <a
            href={LAURA_CABANAS_URL}
            target="_blank"
            rel="noopener"
            className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            {s.designer.cta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {s.faqTitle}
          </h2>
          <dl className="mt-8 divide-y divide-border">
            {s.faq.map((f) => (
              <div key={f.q} className="py-5 first:pt-0 last:pb-0">
                <dt className="font-heading font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-1.5 leading-relaxed text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Cart: header icon opens this sheet (right drawer on desktop, bottom on mobile) */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-6px_24px_-8px_hsl(215_45%_20%/0.3)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <p className="text-sm font-bold text-foreground">
              {cart.count > 0 ? `${cart.count} · ${formatPrice(subtotalCents)}` : s.cart.title}
            </p>
            <SheetTrigger asChild>
              <button type="button" className={`${NAVY_CTA} min-h-11 flex-shrink-0 px-6 text-sm`}>
                <ShoppingBag className="h-4 w-4" />
                {s.cart.title}
                {cart.count > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                    {cart.count}
                  </span>
                )}
              </button>
            </SheetTrigger>
          </div>
        </div>
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
          <div className="mt-4 pb-4">{cartContent}</div>
        </SheetContent>
      </Sheet>
      <div className="h-20 lg:hidden" />

      <Footer />
    </div>
  );
}

/** Early-access gate: blurred editorial backdrop + password card. */
function ShopGate({ onUnlock }: { onUnlock: () => void }) {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const g = t.shopPage.gate;
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() === SHOP_GATE_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Blurred on-brand backdrop */}
      <picture>
        <source type="image/avif" srcSet="/images/shop/tienda-hero-duo.avif" />
        <img
          src="/images/shop/tienda-hero-duo.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
        />
      </picture>
      <div className="absolute inset-0 bg-background/70" aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card/95 p-7 text-center shadow-xl backdrop-blur sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-bold text-foreground">{g.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.subtitle}</p>
        <form onSubmit={submit} className="mt-6">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder={g.placeholder}
            aria-label={g.placeholder}
            aria-invalid={error}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-base text-foreground focus:border-cta focus:outline-none focus:ring-2 focus:ring-cta"
          />
          {error && (
            <p className="mt-2 text-sm font-medium text-destructive" role="alert">
              {g.error}
            </p>
          )}
          <button type="submit" className={`${NAVY_CTA} mt-4 min-h-12 w-full px-6 text-base`}>
            {g.button}
          </button>
        </form>
        <a
          href={localizedPath("home")}
          className="mt-5 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Costa Brava Rent a Boat
        </a>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: ShopProductDef;
  color: ShopColor;
  price: number;
  skuAvailable: (sku: string) => boolean;
  stockOf: (sku: string) => number | undefined;
  onAdd: (sku: string) => void;
}

function ProductCard({ product, color, price, skuAvailable, stockOf, onAdd }: ProductCardProps) {
  const t = useTranslations();
  const s = t.shopPage;
  const [size, setSize] = useState<string | null>(product.hasSizes ? null : "");
  const [showAlt, setShowAlt] = useState(false);

  const info = product.i18nKey === "tee" ? s.products.tee : s.products.tote;
  const images = product.images[color];
  const image = showAlt && images?.alt ? images.alt : images?.main;
  // Button label announces the view you would switch TO
  const toggleLabel = showAlt
    ? images?.altShowsBack
      ? s.viewFront
      : s.viewBack
    : images?.altShowsBack
      ? s.viewBack
      : s.viewFront;

  const colorVariants = product.variants.filter((v) => v.color === color);
  const selectedSku = product.hasSizes
    ? size
      ? `tee-${color}-${size}`
      : null
    : colorVariants[0]?.sku ?? null;

  const selectedAvailable = selectedSku ? skuAvailable(selectedSku) : false;
  const selectedStock = selectedSku ? stockOf(selectedSku) : undefined;
  const allSoldOut = colorVariants.every((v) => !skuAvailable(v.sku));

  return (
    <article className="group/card flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border/70 transition-[transform,box-shadow] duration-300 ease-out hover:ring-border motion-safe:hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-14px_hsl(215_45%_20%/0.22)]">
      <button
        type="button"
        onClick={() => images?.alt && setShowAlt((prev) => !prev)}
        className="group relative block aspect-[4/3] w-full overflow-hidden bg-muted/30"
        aria-label={toggleLabel}
      >
        <picture>
          <source type="image/avif" srcSet={image?.replace(".webp", ".avif")} />
          <img
            src={image}
            alt={`${info.name} - ${s.colors[color]}`}
            width={1200}
            height={1200}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${allSoldOut ? "opacity-90" : ""}`}
          />
        </picture>

        {images?.alt && (
          <>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-foreground/25 to-transparent" />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-foreground shadow-sm backdrop-blur-sm">
              <RefreshCw className="h-3 w-3" />
              {toggleLabel}
            </span>
          </>
        )}

        {allSoldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/35">
            <span className="rounded-full bg-background px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground">
              {s.outOfStock}
            </span>
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-[1.0625rem] font-semibold leading-snug text-foreground">
              {info.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <span
                className="h-3.5 w-3.5 flex-shrink-0 rounded-full ring-1 ring-border"
                style={{ backgroundColor: COLOR_SWATCH[color] ?? "transparent" }}
                aria-hidden="true"
              />
              {s.colors[color]}
            </p>
          </div>
          <p className="flex shrink-0 items-baseline gap-1 font-heading">
            <span className="text-xl font-bold tabular-nums text-foreground">{price / 100}</span>
            <span className="text-xs font-medium text-muted-foreground">EUR</span>
          </p>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {info.description}
        </p>

        {product.hasSizes && (
          <div className="mt-5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {s.sizeLabel}
            </p>
            <div className="mt-2 flex gap-2">
              {SHOP_SIZES.map((sz) => {
                const sku = `tee-${color}-${sz}`;
                const available = skuAvailable(sku);
                return (
                  <button
                    key={sz}
                    type="button"
                    disabled={!available}
                    onClick={() => setSize(sz)}
                    aria-pressed={size === sz}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 ${
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
          </div>
        )}

        <div className="mt-auto border-t border-border/60 pt-4">
          {selectedSku && selectedAvailable && selectedStock !== undefined && selectedStock <= 3 && (
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-popular/10 px-2.5 py-0.5 text-xs font-semibold text-popular">
              <span className="h-1.5 w-1.5 rounded-full bg-popular" aria-hidden="true" />
              {s.lowStock}
            </p>
          )}
          <button
            type="button"
            disabled={!selectedSku || !selectedAvailable}
            onClick={() => selectedSku && onAdd(selectedSku)}
            className={`${NAVY_CTA} min-h-11 w-full px-6 text-sm`}
          >
            <ShoppingBag className="h-4 w-4" />
            {selectedSku && !selectedAvailable ? s.outOfStock : s.addToCart}
          </button>
        </div>
      </div>
    </article>
  );
}

interface CartPanelProps {
  cart: ReturnType<typeof useShopCart>;
  priceOf: (product: ShopProductDef) => number;
  subtotalCents: number;
  checkoutLoading: boolean;
  checkoutError: string | null;
  unavailableSkus: string[];
  onCheckout: () => void;
}

function CartPanel({
  cart,
  priceOf,
  subtotalCents,
  checkoutLoading,
  checkoutError,
  unavailableSkus,
  onCheckout,
}: CartPanelProps) {
  const t = useTranslations();
  const s = t.shopPage;

  if (cart.items.length === 0) {
    return <p className="text-sm leading-relaxed text-muted-foreground">{s.cart.empty}</p>;
  }

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
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
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
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-foreground/50"
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
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-foreground/50"
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
        <div className="flex items-center justify-between">
          <p className="font-heading font-semibold text-foreground">{s.cart.subtotal}</p>
          <p className="font-heading text-lg font-bold text-foreground">{formatPrice(subtotalCents)}</p>
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
      </div>
    </div>
  );
}
