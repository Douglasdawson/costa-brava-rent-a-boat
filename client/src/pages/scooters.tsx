import { useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Bike,
  MapPin,
  CalendarCheck,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
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

const NAVY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

const COAST_RENT_URL = "https://coastrent.es";

/**
 * Bridge page for road scooter/motorbike rental in Lloret de Mar. The service
 * is operated by Coast Rent (sister business we openly recommend); the CTA
 * deep-links to their site in the visitor's language.
 */
export default function ScootersPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const s = t.scootersPage;

  const hreflangLinks = generateHreflangLinks("scooters");
  const canonical = generateCanonicalUrl("scooters", language);
  const coastRentUrl = `${COAST_RENT_URL}/${language}`;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const heroImage = "/images/scooters/alquiler-scooter-lloret-de-mar-costa-brava.webp";
  const heroImageMobile =
    "/images/scooters/alquiler-scooter-lloret-de-mar-costa-brava-mobile.webp";

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: s?.navLabel || "Scooters", url: canonical },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: s?.hero?.title,
      serviceType: s?.navLabel,
      description: s?.seoDescription,
      url: canonical,
      image: `${BASE_DOMAIN}${heroImage}`,
      provider: {
        "@type": "LocalBusiness",
        name: "Coast Rent",
        url: COAST_RENT_URL,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Lloret de Mar",
          addressRegion: "Girona",
          addressCountry: "ES",
        },
      },
      areaServed: { "@type": "Place", name: "Lloret de Mar, Costa Brava" },
    },
    generateFAQSchema((s?.faq || []).map((f) => ({ question: f.q, answer: f.a }))),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={s?.seoTitle || s?.hero?.title || "Alquiler de scooters en Lloret de Mar"}
        description={s?.seoDescription || s?.hero?.subtitle || ""}
        keywords={s?.navLabel}
        canonical={canonical}
        ogImage={`${BASE_DOMAIN}${heroImage}`}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      {/* HERO */}
      <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden pb-16 pt-28">
        <picture>
          <source media="(max-width: 640px)" srcSet={heroImageMobile} />
          <img
            src={heroImage}
            alt={s?.hero?.title || "Alquiler de scooters en Lloret de Mar"}
            width={1920}
            height={1072}
            decoding="async"
            draggable={false}
            className={`absolute inset-0 -z-10 h-full w-full object-cover will-change-transform transition-transform duration-[1200ms] ease-out ${mounted ? "scale-100" : "scale-[1.06]"}`}
          />
        </picture>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/65" />

        <div
          className={`mx-auto w-full max-w-3xl px-4 text-center text-white transition-all duration-700 ease-out sm:px-6 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight [text-shadow:0_2px_18px_hsl(215_45%_12%/0.5)] sm:text-5xl lg:text-6xl">
            {s?.hero?.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/90 [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
            {s?.hero?.subtitle}
          </p>
          <div className="mt-8">
            <a
              href={coastRentUrl}
              target="_blank"
              rel="noopener"
              className={`${NAVY_CTA} min-h-12 px-9 text-base`}
            >
              {s?.cta}
              <ExternalLink className="h-5 w-5" />
            </a>
            <p className="mt-2 text-xs text-white/70">{s?.ctaNote}</p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {(s?.chips || []).map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-sm text-white ring-1 ring-white/20"
              >
                <CheckCircle2 className="h-4 w-4 text-white" />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* INTRO */}
      {s?.intro && (
        <section className="px-4 py-12 sm:px-6 lg:py-16">
          <p className="mx-auto max-w-2xl text-center text-lg text-muted-foreground">
            {s.intro}
          </p>
        </section>
      )}

      {/* VEHICLES */}
      <section className="bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {s?.vehiclesTitle}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {(s?.vehicles || []).map((v) => (
              <div
                key={v.name}
                className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-5"
              >
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bike className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{v.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {v.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a
              href={coastRentUrl}
              target="_blank"
              rel="noopener"
              className={`${NAVY_CTA} min-h-12 px-8 text-base`}
            >
              {s?.cta}
              <ExternalLink className="h-5 w-5" />
            </a>
            <p className="mt-2 text-xs text-muted-foreground">{s?.ctaNote}</p>
          </div>
        </div>
      </section>

      {/* COMBINE SEA + ROAD */}
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </span>
          <h2 className="mt-4 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {s?.combineTitle}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {s?.combineText}
          </p>
        </div>
      </section>

      {/* OPERATED BY COAST RENT */}
      <section className="bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <ShieldCheck className="h-5 w-5 text-success" />
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              {s?.operatedByTitle}
            </h2>
          </div>
          <p className="mt-4 leading-relaxed text-muted-foreground">{s?.operatedByText}</p>
          <a
            href={coastRentUrl}
            target="_blank"
            rel="noopener"
            className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            coastrent.es
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* FAQ */}
      {(s?.faq || []).length > 0 && (
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {s?.faqTitle}
            </h2>
            <dl className="mt-8 divide-y divide-border">
              {(s?.faq || []).map((f) => (
                <div key={f.q} className="py-5 first:pt-0 last:pb-0">
                  <dt className="font-heading font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1.5 leading-relaxed text-muted-foreground">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-6px_24px_-8px_hsl(215_45%_20%/0.3)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="flex items-center gap-2 leading-tight">
            <CalendarCheck className="h-4 w-4 flex-shrink-0 text-success" />
            <p className="text-sm font-bold text-foreground">{s?.chips?.[0]}</p>
          </div>
          <a
            href={coastRentUrl}
            target="_blank"
            rel="noopener"
            className={`${NAVY_CTA} min-h-11 flex-shrink-0 px-6 text-sm`}
          >
            {s?.navLabel}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div className="h-20 lg:hidden" />

      <RelatedContent currentPage="scooters" />
      <Footer />
    </div>
  );
}
