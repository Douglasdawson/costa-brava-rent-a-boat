import { useState } from "react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  H2,
  Sheet,
  Rise,
  LeadText,
  CheckPanel,
  PhotoHero,
  FaqSheet,
} from "@/components/activity-kit";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import JetSkiRequestModal from "@/components/JetSkiRequestModal";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { generateHreflangLinks, generateCanonicalUrl, BASE_DOMAIN } from "@/utils/seo-config";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateTouristTripSchema,
} from "@/utils/seo-schemas";
import RelatedContent from "@/components/RelatedContent";
import ReviewsSection from "@/components/ReviewsSection";
import { getJetSkiProduct, type JetSkiProduct } from "@shared/jetskiProducts";
import type { PageKey } from "@shared/i18n-routes";
import { MobileStickyBar } from "@/components/MobileStickyBar";

const CTA_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

interface JetSkiLandingProps {
  productId: string;
  pageKey: PageKey;
  /** Key inside t.jetskiLanding for this product's copy (e.g. "circuito"). */
  copyKey: "circuito" | "excursion" | "efoil";
}

export default function JetSkiLanding({ productId, pageKey, copyKey }: JetSkiLandingProps) {
  const { language } = useLanguage();
  const t = useTranslations();
  const g = t.jetskiLanding;
  const c = g?.[copyKey];

  const product = getJetSkiProduct(productId) as JetSkiProduct;

  const hreflangLinks = generateHreflangLinks(pageKey);
  const canonical = generateCanonicalUrl(pageKey, language);

  const [open, setOpen] = useState(false);

  const minPrice = Math.min(...product.slots.map(s => s.price));
  // Translated list when the locale has it; the catalogue list is Spanish-only.
  const included = c?.included?.length ? c.included : (product.included ?? []);

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
      areaServed: ["Blanes", "Lloret de Mar", "Tossa de Mar", "Malgrat de Mar"].map(name => ({
        "@type": "City",
        name,
      })),
      // No aggregateRating: the business reviews are not reviews of this
      // product; Google can invalidate rich results for borrowed ratings.
      offers: product.slots.map(s => ({
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
            waypoints: [{ name: "Puerto de Blanes" }, { name: "Tossa de Mar" }],
          }),
        ]
      : []),
    generateFAQSchema((c?.faq || []).map(f => ({ question: f.q, answer: f.a }))),
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

      <PhotoHero
        minHeight="sm:min-h-[72svh]"
        media={
          <img
            src={product.image}
            alt={product.altText}
            width={1200}
            height={675}
            decoding="async"
            draggable={false}
          />
        }
        title={c?.hero?.title || product.name}
        subtitle={c?.hero?.subtitle || product.subtitle}
        actions={
          <div className="flex flex-col items-center gap-6">
            <span className="font-heading text-3xl font-semibold tracking-tight text-white [text-shadow:0_2px_16px_hsl(215_45%_12%/0.55)] sm:text-4xl">
              {g?.fromLabel || "desde"} {minPrice}€
            </span>
            <InteractiveHoverButton
              tone="dark"
              onClick={() => setOpen(true)}
              className="min-h-12 w-full px-9 text-base sm:w-auto"
            >
              {g?.ctaRequest || "Solicitar"}
            </InteractiveHoverButton>
          </div>
        }
        facts={c?.chips}
      />

      {/* INTRO */}
      {c?.intro && (
        <Sheet next="muted" className="py-12 sm:py-16">
          <Rise>
            <LeadText
              text={c.intro}
              className="mx-auto max-w-3xl text-center text-lg sm:text-xl [&>span:first-child]:text-xl sm:[&>span:first-child]:text-2xl"
            />
          </Rise>
        </Sheet>
      )}

      {/* CÓMO ES */}
      {(c?.how || []).length > 0 && (
        <Sheet tone="muted" next="page">
          <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <Rise>
              <h2 className={H2}>{c?.howTitle}</h2>
            </Rise>
            <Rise delay={0.1} className="space-y-5">
              {c!.how!.map(para => (
                <div key={para} className="border-t border-border pt-5">
                  <LeadText text={para} />
                </div>
              ))}
            </Rise>
          </div>
        </Sheet>
      )}

      {/* FRANJAS Y PRECIOS */}
      <Sheet next="muted" containerClassName="max-w-3xl">
        <Rise>
          <h2 className={H2}>{g?.slotsTitle || "Franjas y precios"}</h2>
          <ul className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
            {product.slots.map(slot => (
              <li
                key={slot.id}
                className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4 last:border-b-0 sm:px-6"
              >
                <span className="text-base text-foreground">
                  <span className="font-medium">{slot.label}</span>
                  {slot.price2 && g?.pricePerTwo && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({g.pricePerTwo.replace("{price}", String(slot.price2))})
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-heading text-lg font-semibold tabular-nums text-foreground">
                  {slot.price}€
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            {g?.specCapacity ?? product.specifications.capacity} · {t.boats.withoutLicense}
          </p>
          <div className="mt-8">
            <InteractiveHoverButton
              tone="dark"
              onClick={() => setOpen(true)}
              className="min-h-12 px-8 text-base"
            >
              {g?.ctaRequest || "Solicitar"}
            </InteractiveHoverButton>
            <p className="mt-2 text-xs text-muted-foreground">{g?.reassurance}</p>
          </div>
        </Rise>
      </Sheet>

      {/* REQUISITOS + INCLUYE */}
      {((c?.requirements || []).length > 0 || included.length > 0) && (
        <Sheet tone="muted" next="page">
          <Rise>
            <div className="grid gap-10 md:grid-cols-2">
              {(c?.requirements || []).length > 0 && (
                <div>
                  <h2 className={`${H2} mb-8`}>{g?.requirementsTitle || "Requisitos"}</h2>
                  <CheckPanel items={c!.requirements!} />
                </div>
              )}
              {included.length > 0 && (
                <div>
                  <h2 className={`${H2} mb-8`}>{g?.includedTitle || "Qué incluye"}</h2>
                  <CheckPanel items={included} />
                </div>
              )}
            </div>
          </Rise>
        </Sheet>
      )}

      {/* FAQ */}
      <FaqSheet
        idPrefix="jetski-faq"
        title={g?.faqTitle || "Preguntas frecuentes"}
        items={c?.faq || []}
        next="muted"
      />

      {/* Sticky mobile CTA */}
      <MobileStickyBar>
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">
              {g?.fromLabel || "desde"} {minPrice}€
            </p>
            <p className="text-xs text-muted-foreground">
              {g?.specCapacity ?? product.specifications.capacity}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`${CTA_CLASS} min-h-11 flex-shrink-0 px-6 text-sm`}
          >
            {g?.ctaRequest || "Solicitar"}
          </button>
        </div>
      </MobileStickyBar>

      <ReviewsSection />
      <RelatedContent currentPage={pageKey} />
      <Footer />

      <JetSkiRequestModal product={open ? product : null} onClose={() => setOpen(false)} />
    </div>
  );
}
