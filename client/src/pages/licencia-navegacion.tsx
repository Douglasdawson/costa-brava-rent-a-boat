import { useState, useEffect } from "react";
import {
  Anchor,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  LifeBuoy,
} from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
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
import { getLocalizedPath } from "@shared/i18n-routes";

const NAVY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

const WHATSAPP_NUMBER = "34611500372";

/**
 * Pillar page for the Licencia de Navegación (titulín): what it is, what it
 * allows, how to get it, and why it matters from 2026-10-01 (RD 1188/2025
 * requires every rental customer to hold a nautical title).
 *
 * Since the 2026-08 pivot this page sells the titulín + rental pack: we arrange
 * the course and combine it with the first rental. No price is published yet
 * (the nautical school side is still pre-launch), so every CTA routes to
 * WhatsApp for a quote. Add the price here when it is closed.
 */
export default function NavigationLicensePage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const p = t.navigationLicensePage;

  const hreflangLinks = generateHreflangLinks("navigationLicense");
  const canonical = generateCanonicalUrl("navigationLicense", language);
  const licensedFleetPath = getLocalizedPath("categoryLicensed", language);
  const captainedPath = getLocalizedPath("categoryCaptained", language);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(p?.whatsappMessage || "")}`;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const heroImage =
    "/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-pareja-navegando.webp";
  const fleetImage =
    "/images/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-amigos-snorkel.webp";

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: p?.navLabel || "Titulín", url: canonical },
    ]),
    generateFAQSchema((p?.faq || []).map((f) => ({ question: f.q, answer: f.a }))),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={p?.seoTitle || p?.hero?.title || "Licencia de Navegación (Titulín)"}
        description={p?.seoDescription || p?.hero?.subtitle || ""}
        keywords={p?.navLabel}
        canonical={canonical}
        ogImage={`${BASE_DOMAIN}${heroImage}`}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      {/* HERO */}
      <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden pb-16 pt-28">
        <img
          src={heroImage}
          alt={p?.hero?.title || "Licencia de Navegación en Blanes"}
          width={1180}
          height={750}
          decoding="async"
          draggable={false}
          className={`absolute inset-0 -z-10 h-full w-full object-cover will-change-transform transition-transform duration-[1200ms] ease-out ${mounted ? "scale-100" : "scale-[1.06]"}`}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/65" />

        <div
          className={`mx-auto w-full max-w-3xl px-4 text-center text-white transition-all duration-700 ease-out sm:px-6 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight [text-shadow:0_2px_18px_hsl(215_45%_12%/0.5)] sm:text-5xl lg:text-6xl">
            {p?.hero?.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/90 [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
            {p?.hero?.subtitle}
          </p>
          <div className="mt-8">
            <a href={whatsappUrl} target="_blank" rel="noopener" className={`${NAVY_CTA} min-h-12 px-9 text-base`}>
              {p?.ctaButton}
              <SiWhatsapp className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {(p?.chips || []).map((chip) => (
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

      {/* NEW RULE (RD 1188/2025) */}
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-6 text-primary-foreground sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <CalendarClock className="h-5 w-5" />
            </span>
            <h2 className="font-heading text-xl font-bold sm:text-2xl">{p?.newRule?.title}</h2>
          </div>
          <p className="mt-5 leading-relaxed text-primary-foreground/90">{p?.newRule?.body}</p>
          <p className="mt-4 rounded-xl bg-white/10 p-4 text-sm leading-relaxed text-primary-foreground/95">
            {p?.newRule?.note}
          </p>
        </div>
      </section>

      {/* WHAT IT IS + WHAT IT ALLOWS */}
      <section className="bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </span>
            <h2 className="mt-4 font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {p?.whatIs?.title}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{p?.whatIs?.body}</p>
          </div>
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Anchor className="h-5 w-5 text-primary" />
            </span>
            <h2 className="mt-4 font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {p?.allows?.title}
            </h2>
            <ul className="mt-4 space-y-3">
              {(p?.allows?.items || []).map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                  <span className="leading-relaxed text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p?.allows?.note}</p>
          </div>
        </div>
      </section>

      {/* COURSE STEPS (a real sequence: theory → practice → licence) */}
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {p?.course?.title}
          </h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {(p?.course?.steps || []).map((step, i) => (
              <li key={step.title} className="rounded-xl border border-border bg-card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cta font-heading text-sm font-bold text-cta-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-heading font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-8 max-w-2xl text-center leading-relaxed text-muted-foreground">
            {p?.course?.note}
          </p>
        </div>
      </section>

      {/* FLEET BRIDGE */}
      <section className="bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-4xl items-center gap-8 lg:grid-cols-2">
          <img
            src={fleetImage}
            alt={p?.fleet?.title || "Trimarchi 57S en la Costa Brava"}
            width={800}
            height={600}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {p?.fleet?.title}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{p?.fleet?.body}</p>
            <a href={licensedFleetPath} className={`${NAVY_CTA} mt-6 min-h-12 px-8 text-base`}>
              {p?.fleet?.cta}
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {(p?.faq || []).length > 0 && (
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {p?.faqTitle}
            </h2>
            <dl className="mt-8 divide-y divide-border">
              {(p?.faq || []).map((f) => (
                <div key={f.q} className="py-5 first:pt-0 last:pb-0">
                  <dt className="font-heading font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1.5 leading-relaxed text-muted-foreground">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* NO-LICENCE ALTERNATIVE (captained excursion) */}
      <section className="bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <LifeBuoy className="h-5 w-5 text-success" />
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              {p?.alternative?.title}
            </h2>
          </div>
          <p className="mt-4 leading-relaxed text-muted-foreground">{p?.alternative?.body}</p>
          <a
            href={captainedPath}
            className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            {p?.alternative?.cta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {p?.ctaTitle}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{p?.ctaText}</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener"
            className={`${NAVY_CTA} mt-6 min-h-12 px-9 text-base`}
          >
            {p?.ctaButton}
            <SiWhatsapp className="h-5 w-5" aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-6px_24px_-8px_hsl(215_45%_20%/0.3)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="flex items-center gap-2 leading-tight">
            <GraduationCap className="h-4 w-4 flex-shrink-0 text-success" />
            <p className="text-sm font-bold text-foreground">{p?.chips?.[0]}</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener"
            className={`${NAVY_CTA} min-h-11 flex-shrink-0 px-6 text-sm`}
          >
            {p?.navLabel}
            <SiWhatsapp className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="h-20 lg:hidden" />

      <Footer />
    </div>
  );
}
