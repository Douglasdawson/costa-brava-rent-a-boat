import { useState, useEffect } from "react";
import {
  Anchor,
  CalendarCheck,
  CheckCircle2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
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

const WHATSAPP_NUMBER = "34611500372";

/**
 * Temporary landing for the Blanes fireworks competition boat trip
 * (July 25-26). Reached from Instagram; not linked from the nav.
 */
export default function FuegosBlanesPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const s = t.fuegosBlanesPage;

  const hreflangLinks = generateHreflangLinks("fuegosBlanes");
  const canonical = generateCanonicalUrl("fuegosBlanes", language);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(s?.whatsappMessage || "")}`;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const heroImage = "/images/fuegos/fuegos-blanes-desde-el-mar.webp";

  const eventDates: Array<{ startDate: string; name?: string }> = [
    { startDate: "2026-07-25" },
    { startDate: "2026-07-26" },
  ];

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: s?.navLabel || "Fuegos de Blanes", url: canonical },
    ]),
    ...eventDates.map(({ startDate }) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: s?.hero?.title,
      description: s?.seoDescription,
      startDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      image: `${BASE_DOMAIN}${heroImage}`,
      url: canonical,
      location: {
        "@type": "Place",
        name: "Puerto de Blanes",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Blanes",
          addressRegion: "Girona",
          addressCountry: "ES",
        },
      },
      offers: {
        "@type": "Offer",
        price: "60",
        priceCurrency: "EUR",
        availability: "https://schema.org/LimitedAvailability",
        url: canonical,
      },
      organizer: {
        "@type": "LocalBusiness",
        name: "Costa Brava Rent a Boat - Blanes",
        url: BASE_DOMAIN,
      },
    })),
    generateFAQSchema((s?.faq || []).map((f) => ({ question: f.q, answer: f.a }))),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={s?.seoTitle || s?.hero?.title || "Fuegos de Blanes desde el barco"}
        description={s?.seoDescription || s?.hero?.subtitle || ""}
        keywords={s?.navLabel}
        canonical={canonical}
        ogImage={`${BASE_DOMAIN}${heroImage}`}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      {/* HERO */}
      <section className="relative isolate flex min-h-[78vh] items-center overflow-hidden pb-16 pt-28">
        <img
          src={heroImage}
          alt={s?.hero?.title || "Fuegos de Blanes desde el mar"}
          width={1080}
          height={1935}
          decoding="async"
          draggable={false}
          className={`absolute inset-0 -z-10 h-full w-full object-cover object-[center_62%] will-change-transform transition-transform duration-[1200ms] ease-out ${mounted ? "scale-100" : "scale-[1.06]"}`}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/35 to-black/70" />

        <div
          className={`mx-auto w-full max-w-3xl px-4 text-center text-white transition-all duration-700 ease-out sm:px-6 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/85 [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
            {s?.hero?.eyebrow}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-[1.05] tracking-tight [text-shadow:0_2px_18px_hsl(215_45%_12%/0.5)] sm:text-5xl lg:text-6xl">
            {s?.hero?.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/90 [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
            {s?.hero?.subtitle}
          </p>
          <div className="mt-8">
            <a href={whatsappUrl} target="_blank" rel="noopener" className={`${NAVY_CTA} min-h-12 px-9 text-base`}>
              {s?.cta}
              <MessageCircle className="h-5 w-5" />
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
          <p className="mx-auto max-w-2xl text-center text-lg text-muted-foreground">{s.intro}</p>
        </section>
      )}

      {/* PRICE + INCLUDES */}
      <section className="bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="font-heading text-6xl font-bold text-foreground">{s?.priceLabel}</p>
            <p className="mt-2 text-muted-foreground">{s?.priceMeta}</p>
          </div>
          <h2 className="mt-10 text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {s?.includesTitle}
          </h2>
          <ul className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
            {(s?.includes || []).map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {s?.detailsTitle}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {(s?.details || []).map((d, i) => (
              <div key={d.name} className="rounded-xl border border-border bg-card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  {i === 0 ? (
                    <Anchor className="h-5 w-5 text-primary" />
                  ) : i === 1 ? (
                    <Sparkles className="h-5 w-5 text-primary" />
                  ) : (
                    <MessageCircle className="h-5 w-5 text-primary" />
                  )}
                </span>
                <h3 className="mt-3 font-heading font-semibold text-foreground">{d.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAM */}
      <section className="bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {s?.programTitle}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {(s?.program || []).map((p) => (
              <div key={p.day} className="rounded-xl border border-border bg-card p-5 text-center">
                <p className="font-heading text-lg font-bold text-foreground">{p.day}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.pyro}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a href={whatsappUrl} target="_blank" rel="noopener" className={`${NAVY_CTA} min-h-12 px-8 text-base`}>
              {s?.cta}
              <MessageCircle className="h-5 w-5" />
            </a>
            <p className="mt-2 text-xs text-muted-foreground">{s?.ctaNote}</p>
          </div>
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
            <p className="text-sm font-bold text-foreground">{s?.priceLabel} {s?.priceMeta}</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener"
            className={`${NAVY_CTA} min-h-11 flex-shrink-0 px-6 text-sm`}
          >
            {s?.cta}
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div className="h-20 lg:hidden" />

      <Footer />
    </div>
  );
}
