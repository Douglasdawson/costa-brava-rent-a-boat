import { useState, useEffect } from "react";
import { ArrowRight, ShieldCheck, Fuel, Clock, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import ReviewsSection from "@/components/ReviewsSection";
import RelatedContent from "@/components/RelatedContent";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  generateHreflangLinks,
  generateCanonicalUrl,
  BASE_DOMAIN,
} from "@/utils/seo-config";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
} from "@/utils/seo-schemas";
import { JETSKI_PRODUCTS } from "@shared/jetskiProducts";

const NAVY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const excursion = JETSKI_PRODUCTS.find((p) => p.pageKey === "jetskiExcursion");
  // Dedicated 4K hero (golden-hour Costa Brava jet ski), served as responsive WebP.
  const heroImage = "/images/jetski-hub/jet-ski-blanes-hero.webp";
  const heroSrcSet =
    "/images/jetski-hub/jet-ski-blanes-hero-1600.webp 1600w, /images/jetski-hub/jet-ski-blanes-hero.webp 2560w";
  const heroAlt = excursion?.altText ?? "Moto de agua al atardecer en la Costa Brava";

  // Experience cards from the canonical catalogue + translated copy.
  const cards = JETSKI_PRODUCTS.map((p) => {
    const copyKey = (p.pageKey === "jetskiCircuito" ? "circuito" : "excursion") as
      | "circuito"
      | "excursion";
    const copy = t.jetskiLanding?.[copyKey];
    return {
      id: p.id,
      href: localizedPath(p.pageKey),
      image: p.image,
      alt: p.altText,
      title: copy?.navLabel || p.name,
      subtitle: copy?.hero?.subtitle || p.subtitle,
      minPrice: Math.min(...p.slots.map((s) => s.price)),
    };
  });

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
    generateFAQSchema((h?.faq || []).map((f) => ({ question: f.q, answer: f.a }))),
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

      {/* HERO — full-bleed coastal photography, the Salt Memory entry */}
      <section className="relative isolate flex min-h-[80vh] items-center overflow-hidden pb-20 pt-28">
        <img
          src={heroImage}
          srcSet={heroSrcSet}
          sizes="100vw"
          alt={heroAlt}
          width={2560}
          height={1440}
          decoding="async"
          draggable={false}
          className={`absolute inset-0 -z-10 h-full w-full object-cover will-change-transform transition-transform duration-[1400ms] ease-out ${mounted ? "scale-100" : "scale-[1.08]"}`}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/40 to-black/70" />

        <div
          className={`mx-auto w-full max-w-3xl px-4 text-center text-white transition-all duration-700 ease-out sm:px-6 ${mounted ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
        >
          <h1 className="font-heading text-4xl font-bold leading-[1.04] tracking-tight [text-shadow:0_2px_20px_hsl(215_45%_12%/0.55)] sm:text-5xl lg:text-6xl">
            {h?.hero?.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/90 [text-shadow:0_1px_12px_hsl(215_45%_12%/0.5)]">
            {h?.hero?.subtitle}
          </p>
          <div className="mt-8">
            <a href="#experiencias" className={`${NAVY_CTA} min-h-12 px-9 text-base`}>
              {h?.productsTitle || "Ver experiencias"}
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* EXPERIENCES — two image-led ways in */}
      <section id="experiencias" className="scroll-mt-24 px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              {h?.productsTitle || "Nuestras experiencias en moto de agua"}
            </h2>
            {h?.intro && (
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {h.intro}
              </p>
            )}
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8">
            {cards.map((c) => (
              <a
                key={c.id}
                href={c.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-300 ease-out [@media(hover:hover)]:hover:-translate-y-1.5 [@media(hover:hover)]:hover:shadow-[0_18px_40px_-12px_hsl(215_45%_20%/0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[16/11] overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.alt}
                    width={760}
                    height={522}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover will-change-transform transition-transform duration-[600ms] ease-out group-hover:scale-[1.05]"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    {t.boats?.withoutLicense || "Sin licencia"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-5 sm:p-6">
                  <h3 className="font-heading text-xl font-semibold text-foreground">
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
                      <span className="font-heading text-2xl font-bold text-cta">
                        {c.minPrice}€
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {t.jetskiLanding?.ctaRequest || "Ver"}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Quiet facts row — all real, no fabricated urgency */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              {t.boats?.withoutLicense || "Sin licencia"}
            </span>
            <span className="inline-flex items-center gap-2">
              <Fuel className="h-4 w-4 text-success" />
              {t.boatDetail?.fuelIncluded || "Combustible incluido"}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              1-2
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              09:00 - 20:00
            </span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {(h?.faq || []).length > 0 && (
        <section className="bg-muted/40 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-heading text-3xl font-bold text-foreground sm:text-4xl">
              {h?.faqTitle || "Preguntas frecuentes"}
            </h2>
            <dl className="mt-10 divide-y divide-border">
              {h!.faq.map((f) => (
                <div key={f.q} className="py-5 first:pt-0 last:pb-0">
                  <dt className="font-heading text-lg font-semibold text-foreground">
                    {f.q}
                  </dt>
                  <dd className="mt-2 leading-relaxed text-muted-foreground">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <ReviewsSection />
      <RelatedContent currentPage="jetskiHub" />
      <Footer />
    </div>
  );
}
