import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Clock, Users, Anchor } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import JetSkiRequestModal from "@/components/JetSkiRequestModal";
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
  generateTouristTripSchema,
} from "@/utils/seo-schemas";
import RelatedContent from "@/components/RelatedContent";
import ReviewsSection from "@/components/ReviewsSection";
import { getJetSkiProduct, type JetSkiProduct } from "@shared/jetskiProducts";
import {
  BUSINESS_RATING_STR,
  BUSINESS_REVIEW_COUNT_STR,
} from "@shared/businessProfile";
import type { PageKey } from "@shared/i18n-routes";

const CTA_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

interface JetSkiLandingProps {
  productId: string;
  pageKey: PageKey;
  /** Key inside t.jetskiLanding for this product's copy (e.g. "circuito"). */
  copyKey: "circuito" | "excursion";
}

export default function JetSkiLanding({ productId, pageKey, copyKey }: JetSkiLandingProps) {
  const { language } = useLanguage();
  const t = useTranslations();
  const g = t.jetskiLanding;
  const c = g?.[copyKey];

  const product = getJetSkiProduct(productId) as JetSkiProduct;

  const hreflangLinks = generateHreflangLinks(pageKey);
  const canonical = generateCanonicalUrl(pageKey, language);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [open, setOpen] = useState(false);

  const minPrice = Math.min(...product.slots.map((s) => s.price));

  // SEO meta built from the (already translated) i18n copy, so each locale gets
  // a native title/description without separate seo-config entries.
  const seoTitle =
    c?.seoTitle ||
    `${c?.hero?.title || product.name} | ${g?.fromLabel || "desde"} ${minPrice}€ · Blanes`;
  const seoDescription = c?.hero?.subtitle || product.subtitle;
  const seoKeywords = c?.navLabel || product.name;

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: c?.navLabel || product.name, url: canonical },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: product.name,
      serviceType: c?.navLabel || product.name,
      description: c?.hero?.subtitle || product.subtitle,
      url: canonical,
      image: `${BASE_DOMAIN}${product.image}`,
      provider: {
        "@type": "LocalBusiness",
        name: "Costa Brava Rent a Boat - Blanes",
        "@id": `${BASE_DOMAIN}/#business`,
      },
      areaServed: { "@type": "Place", name: "Blanes, Costa Brava" },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: BUSINESS_RATING_STR,
        reviewCount: BUSINESS_REVIEW_COUNT_STR,
      },
      offers: product.slots.map((s) => ({
        "@type": "Offer",
        name: `${product.name} · ${s.label}`,
        description: `${product.name} · ${s.label}`,
        price: String(s.price),
        priceCurrency: "EUR",
        priceValidUntil: "2026-10-31",
        availability: "https://schema.org/InStock",
        url: canonical,
      })),
    },
    ...(copyKey === "excursion"
      ? [
          generateTouristTripSchema({
            name: c?.hero?.title || product.name,
            description: c?.hero?.subtitle || product.subtitle,
            url: canonical,
            language,
            touristType: ["Water sports", "Adventure"],
            maximumAttendeeCapacity: 2,
            waypoints: [
              { name: "Puerto de Blanes" },
              { name: "Tossa de Mar" },
            ],
          }),
        ]
      : []),
    generateFAQSchema((c?.faq || []).map((f) => ({ question: f.q, answer: f.a }))),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={canonical}
        ogImage={`${BASE_DOMAIN}${product.image}`}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      {/* HERO */}
      <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden pb-16 pt-28">
        <img
          src={product.image}
          alt={product.altText}
          width={1200}
          height={675}
          decoding="async"
          draggable={false}
          className={`absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1200ms] ease-out ${mounted ? "scale-100" : "scale-[1.06]"}`}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/65" />

        <div className={`mx-auto w-full max-w-3xl px-4 text-center text-white transition-all duration-700 ease-out sm:px-6 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight [text-shadow:0_2px_18px_hsl(215_45%_12%/0.5)] sm:text-5xl lg:text-6xl">
            {c?.hero?.title || product.name}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/90 [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
            {c?.hero?.subtitle || product.subtitle}
          </p>
          <div className="mt-7 flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
            <span className="font-heading text-3xl font-extrabold text-white [text-shadow:0_2px_16px_hsl(215_45%_12%/0.55)] sm:text-4xl">
              {g?.fromLabel || "desde"} {minPrice}€
            </span>
          </div>
          <div className="mt-8">
            <button type="button" onClick={() => setOpen(true)} className={`${CTA_CLASS} min-h-12 px-9 text-base`}>
              {g?.ctaRequest || "Solicitar"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {(c?.chips || []).map((chip) => (
              <span key={chip} className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-sm text-white ring-1 ring-white/20">
                <CheckCircle2 className="h-4 w-4 text-white" />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* INTRO */}
      {c?.intro && (
        <section className="px-4 py-12 sm:px-6 lg:py-16">
          <p className="mx-auto max-w-2xl text-center text-lg text-muted-foreground">{c.intro}</p>
        </section>
      )}

      {/* FRANJAS Y PRECIOS */}
      <section className="bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {g?.slotsTitle || "Franjas y precios"}
          </h2>
          <div className="mt-8 space-y-3">
            {product.slots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
                <span className="flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{slot.label}</span>
                  {slot.priceNote && (
                    <span className="text-xs text-muted-foreground">({slot.priceNote})</span>
                  )}
                </span>
                <span className="font-heading text-lg font-bold text-cta">{slot.price}€</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{product.specifications.capacity}</span>
            <span className="inline-flex items-center gap-1.5"><Anchor className="h-4 w-4" />{t.boats.withoutLicense}</span>
          </div>
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setOpen(true)} className={`${CTA_CLASS} min-h-12 px-8 text-base`}>
              {g?.ctaRequest || "Solicitar"}
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="mt-2 text-xs text-muted-foreground">{g?.reassurance}</p>
          </div>
        </div>
      </section>

      {/* INCLUYE */}
      {product.included?.length > 0 && (
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {g?.includedTitle || "Qué incluye"}
            </h2>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {product.included.map((item) => (
                <li key={item} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ */}
      {(c?.faq || []).length > 0 && (
        <section className="bg-muted/40 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {g?.faqTitle || "Preguntas frecuentes"}
            </h2>
            <dl className="mt-8 divide-y divide-border">
              {c!.faq.map((f) => (
                <div key={f.q} className="py-5 first:pt-0 last:pb-0">
                  <dt className="font-heading font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1.5 text-muted-foreground">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-6px_24px_-8px_hsl(215_45%_20%/0.3)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">{g?.fromLabel || "desde"} {minPrice}€</p>
            <p className="text-xs text-muted-foreground">{product.specifications.capacity}</p>
          </div>
          <button type="button" onClick={() => setOpen(true)} className={`${CTA_CLASS} min-h-11 flex-shrink-0 px-6 text-sm`}>
            {g?.ctaRequest || "Solicitar"}
          </button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />

      <ReviewsSection />
      <RelatedContent currentPage={pageKey} />
      <Footer />

      <JetSkiRequestModal product={open ? product : null} onClose={() => setOpen(false)} />
    </div>
  );
}
