import { ArrowRight, ShieldCheck, Fuel, Clock, Users } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { H2, Sheet, Rise, LeadText, PhotoHero, FaqSheet } from "@/components/activity-kit";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import ReviewsSection from "@/components/ReviewsSection";
import RelatedContent from "@/components/RelatedContent";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { generateHreflangLinks, generateCanonicalUrl, BASE_DOMAIN } from "@/utils/seo-config";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/utils/seo-schemas";
import { JETSKI_PRODUCTS } from "@shared/jetskiProducts";

/**
 * Hub / category page targeting the head term "alquiler de moto de agua en
 * Blanes". Photography-led (The Salt Memory): an immersive coastal hero, then
 * two image-led experience cards that funnel to the booking landings. Resold
 * partner product, described as our own offering. Never "partner/reventa" public.
 */
export default function JetSkiBlanesHub() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const h = t.jetskiHub;

  const hreflangLinks = generateHreflangLinks("jetskiHub");
  const canonical = generateCanonicalUrl("jetskiHub", language);

  const excursion = JETSKI_PRODUCTS.find(p => p.pageKey === "jetskiExcursion");
  // Dedicated 4K hero (golden-hour Costa Brava jet ski), served as responsive WebP.
  const heroImage = "/images/jetski-hub/jet-ski-blanes-hero.webp";
  const heroSrcSet =
    "/images/jetski-hub/jet-ski-blanes-hero-800.webp 800w, /images/jetski-hub/jet-ski-blanes-hero-1600.webp 1600w, /images/jetski-hub/jet-ski-blanes-hero.webp 2560w";
  const heroSrcSetAvif =
    "/images/jetski-hub/jet-ski-blanes-hero-800.avif 800w, /images/jetski-hub/jet-ski-blanes-hero-1600.avif 1600w";
  const heroAlt = excursion?.altText ?? "Moto de agua al atardecer en la Costa Brava";

  // Experience cards from the canonical catalogue + translated copy.
  //
  // The copy key is looked up, not inferred. It used to be
  // `pageKey === "jetskiCircuito" ? "circuito" : "excursion"`, a binary over an
  // open set: the e-foil product added on 2026-07-26 fell into the else branch
  // and shipped with the jet ski excursion's title and description over its own
  // photo and price. An unknown product now falls back to its own catalogue
  // name instead of borrowing a sibling's.
  const COPY_KEY_BY_PAGE: Record<string, "circuito" | "excursion" | "efoil"> = {
    jetskiCircuito: "circuito",
    jetskiExcursion: "excursion",
    efoilBlanes: "efoil",
  };
  const cards = JETSKI_PRODUCTS.map(p => {
    const copyKey = COPY_KEY_BY_PAGE[p.pageKey];
    const copy = copyKey ? t.jetskiLanding?.[copyKey] : undefined;
    return {
      id: p.id,
      href: localizedPath(p.pageKey),
      image: p.image,
      alt: p.altText,
      title: copy?.navLabel || p.name,
      subtitle: copy?.hero?.subtitle || p.subtitle,
      minPrice: Math.min(...p.slots.map(s => s.price)),
    };
  });

  const jl = t.jetskiLanding;
  const pricedProducts = JETSKI_PRODUCTS.map((p, i) => ({
    id: p.id,
    href: cards[i].href,
    title: cards[i].title,
    slots: p.slots,
    hasTwo: p.slots.some(s => s.price2),
  }));

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: h?.navLabel || "Jet ski", url: canonical },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: h?.hero?.title,
      description: h?.hero?.subtitle,
      url: canonical,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: cards.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.title,
          url: `${BASE_DOMAIN}${c.href}`,
        })),
      },
    },
    generateFAQSchema((h?.faq || []).map(f => ({ question: f.q, answer: f.a }))),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={h?.seoTitle || h?.hero?.title || "Alquiler de moto de agua en Blanes"}
        description={h?.hero?.subtitle || ""}
        keywords={h?.navLabel}
        canonical={canonical}
        ogImage={`${BASE_DOMAIN}${heroImage}`}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      {/* HERO: full-bleed coastal photography. Full viewport: `svh` (not `vh`) so the mobile
          browser chrome doesn't push the bottom of the gradient off screen. */}
      <PhotoHero
        minHeight="sm:min-h-[100svh]"
        media={
          <picture>
            <source type="image/avif" srcSet={heroSrcSetAvif} sizes="100vw" />
            <img
              src={heroImage}
              srcSet={heroSrcSet}
              sizes="100vw"
              alt={heroAlt}
              width={2560}
              height={1440}
              decoding="async"
              draggable={false}
            />
          </picture>
        }
        title={h?.hero?.title}
        subtitle={h?.hero?.subtitle}
        actions={
          <InteractiveHoverButton
            tone="dark"
            href="#experiencias"
            className="min-h-12 w-full px-9 text-base sm:w-auto"
          >
            {h?.hero?.cta || "Ver experiencias"}
          </InteractiveHoverButton>
        }
      />

      {/* EXPERIENCES: image-led ways in */}
      <Sheet id="experiencias" next="muted" className="scroll-mt-24">
        <Rise className="mx-auto max-w-4xl text-center">
          <h2 className={H2}>{h?.productsTitle || "Nuestras experiencias en moto de agua"}</h2>
          {h?.intro && (
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground text-balance">
              {h.intro}
            </p>
          )}
        </Rise>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {cards.map(c => (
            <Rise key={c.id} className="flex">
              <a
                href={c.href}
                className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 motion-reduce:transition-none [@media(hover:hover)]:hover:border-foreground/30"
              >
                <div className="relative aspect-[16/11] overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.alt}
                    width={760}
                    height={522}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover will-change-transform transition-transform duration-[600ms] ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    {t.boats?.withoutLicense || "Sin licencia"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-5 sm:p-6">
                  <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                    {c.title}
                  </h3>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {c.subtitle}
                  </p>
                  <div className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {t.jetskiLanding?.fromLabel || "desde"}
                      </span>
                      <span className="font-heading text-2xl font-semibold tabular-nums text-foreground">
                        {c.minPrice}€
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {t.jetskiLanding?.ctaRequest || "Ver"}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 motion-reduce:transition-none group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </a>
            </Rise>
          ))}
        </div>

        {/* Quiet facts, all real, as one ruled strip */}
        <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card text-sm text-muted-foreground sm:grid-cols-4 sm:divide-x sm:divide-border [&>li:nth-child(n+3)]:border-t [&>li:nth-child(n+3)]:border-border sm:[&>li:nth-child(n+3)]:border-t-0 [&>li:nth-child(even)]:border-l [&>li:nth-child(even)]:border-border sm:[&>li:nth-child(even)]:border-l-0">
          <li className="flex items-center justify-center gap-2 px-3 py-3.5">
            <ShieldCheck className="h-4 w-4 text-success" />
            {t.boats?.withoutLicense || "Sin licencia"}
          </li>
          <li className="flex items-center justify-center gap-2 px-3 py-3.5">
            <Fuel className="h-4 w-4 text-success" />
            {t.boatDetail?.fuelIncluded || "Combustible incluido"}
          </li>
          <li className="flex items-center justify-center gap-2 px-3 py-3.5">
            <Users className="h-4 w-4" />
            1-2
          </li>
          <li className="flex items-center justify-center gap-2 px-3 py-3.5">
            <Clock className="h-4 w-4" />
            09:00 - 20:00
          </li>
        </ul>
      </Sheet>

      {/* PRECIOS: every slot, straight from the catalogue. One card per product; real tables. */}
      <Sheet tone="muted" next="page">
        <Rise>
          <h2 className={H2}>{h?.pricesTitle || "Precios"}</h2>
        </Rise>
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-3">
          {pricedProducts.map(p => (
            <Rise key={p.id}>
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <h3 className="border-b border-border">
                  <a
                    href={p.href}
                    className="group flex items-center justify-between gap-3 px-5 py-4 font-heading text-lg font-semibold tracking-tight text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cta motion-reduce:transition-none sm:px-6 [@media(hover:hover)]:hover:bg-muted/60"
                  >
                    {p.title}
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </a>
                </h3>
                <table className="w-full text-left text-base">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b border-border bg-muted/40">
                      <th scope="col" className="py-2.5 pl-5 pr-3 font-medium sm:pl-6">
                        {jl?.priceColDuration || "Duración"}
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">
                        {jl?.priceColOne || "1 persona"}
                      </th>
                      {p.hasTwo && (
                        <th scope="col" className="py-2.5 pl-3 pr-5 text-right font-medium sm:pr-6">
                          {jl?.priceColTwo || "2 personas"}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {p.slots.map(s => (
                      <tr key={s.id} className="border-b border-border last:border-b-0">
                        <th
                          scope="row"
                          className="py-3 pl-5 pr-3 text-left font-normal text-foreground sm:pl-6"
                        >
                          {s.label}
                        </th>
                        <td
                          className={`px-3 py-3 text-right font-semibold tabular-nums text-foreground ${p.hasTwo ? "" : "pr-5 sm:pr-6"}`}
                        >
                          {s.price}€
                        </td>
                        {p.hasTwo && (
                          <td className="py-3 pl-3 pr-5 text-right font-semibold tabular-nums text-foreground sm:pr-6">
                            {s.price2 ? `${s.price2}€` : "-"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Rise>
          ))}
        </div>
      </Sheet>

      {/* GUÍA: two columns of short blocks, the first sentence of each as the point */}
      {(h?.guide || []).length > 0 && (
        <Sheet next="muted">
          <div className="grid gap-x-14 gap-y-10 md:grid-cols-2">
            {h!.guide!.map(g => (
              <Rise key={g.title} className="border-t border-border pt-6">
                <h2 className="font-heading text-xl font-semibold tracking-tight text-balance text-foreground">
                  {g.title}
                </h2>
                <LeadText text={g.text} className="mt-3" />
              </Rise>
            ))}
          </div>
        </Sheet>
      )}

      {/* FAQ */}
      <FaqSheet
        idPrefix="jetski-hub-faq"
        title={h?.faqTitle || "Preguntas frecuentes"}
        items={h?.faq || []}
        tone="muted"
        next="muted"
      />

      <ReviewsSection />
      <RelatedContent currentPage="jetskiHub" />
      <Footer />
    </div>
  );
}
