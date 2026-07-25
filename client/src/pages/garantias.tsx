import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { TrustBadges } from "@/components/TrustBadges";
import { LastUpdated } from "@/components/LastUpdated";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { generateHreflangLinks, generateCanonicalUrl, getSEOConfig } from "@/utils/seo-config";
import { generateBreadcrumbSchema } from "@/utils/seo-schemas";
import { COVERAGE_PRICES_FALLBACK, type CoveragePrices } from "@shared/pricing";

const NAVY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

const HERO_IMAGE = "/images/blog/atardecer-mar.webp";

/**
 * Section wrapper with the repo's canonical scroll reveal. The exact classes
 * matter: index.css forces `opacity-0 / translate-y-* / blur-*` visible under
 * `@media (scripting: none)`, so any other pair would ship a blank page to
 * crawlers and no-JS visitors.
 */
function Reveal({ className = "", children }: { className?: string; children: ReactNode }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section
      ref={ref}
      className={`transition-[opacity,transform,filter] duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"
      } ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * /garantias — the two optional coverages, the objective bad-weather threshold
 * and what the customer gets with and without the guarantee. It is the page
 * step 5 of the booking wizard links to, so it has to carry the same weight as
 * the rest of the site, not read like a terms annex.
 */
export default function GarantiasPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const g = t.garantiasPage;
  const { openBookingModal } = useBookingModal();

  const { data: prices = COVERAGE_PRICES_FALLBACK } = useQuery<CoveragePrices>({
    queryKey: ["/api/coverage-prices"],
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const canonical = generateCanonicalUrl("garantias", language);
  const hreflangLinks = generateHreflangLinks("garantias");
  const seo = getSEOConfig("garantias", language);

  // Standard deposit comes from the CRM fleet (via the endpoint). When it is
  // missing we print nothing: the funnel's static catalog still carries figures
  // production replaced, and quoting one the contract contradicts is worse than
  // saying less.
  const depositRows = [
    {
      label: t.booking.withoutLicense,
      standard: prices.depositStandardSL,
      reduced: `${prices.depositAmountSL}€`,
      price: prices.depositPriceSL,
    },
    {
      label: t.booking.withLicense,
      standard: prices.depositStandardCL,
      reduced: `${prices.depositAmountCL}€`,
      price: prices.depositPriceCL,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seo.title}
        description={seo.description}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={generateBreadcrumbSchema([
          { name: t.nav.home, url: generateCanonicalUrl("home", language) },
          { name: g.navLabel, url: canonical },
        ])}
      />
      <Navigation />

      {/* HERO — the sea makes the argument; the page only publishes the rule. */}
      <section className="relative isolate flex min-h-[72svh] items-center overflow-hidden pb-16 pt-28">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable={false}
          className={`absolute inset-0 -z-10 h-full w-full object-cover object-[center_55%] will-change-transform transition-transform duration-[1200ms] ease-out ${
            mounted ? "scale-100" : "scale-[1.06]"
          }`}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/40 to-black/75" />

        <div
          className={`mx-auto w-full max-w-3xl px-4 text-white transition-all duration-700 ease-out sm:px-6 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/85 [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
            {g.navLabel}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-[1.05] tracking-tight [text-shadow:0_2px_18px_hsl(215_45%_12%/0.5)] sm:text-5xl">
            {g.heroTitle}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/90 [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
            {g.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="inline-flex items-baseline gap-2 rounded-full bg-black/25 px-4 py-2 text-sm ring-1 ring-white/20">
              <span className="font-medium text-white">{t.booking.coverages.weatherName}</span>
              <span className="font-bold text-white">{prices.weatherPrice}€</span>
            </span>
            <span className="inline-flex items-baseline gap-2 rounded-full bg-black/25 px-4 py-2 text-sm ring-1 ring-white/20">
              <span className="font-medium text-white">{t.booking.coverages.depositName}</span>
              <span className="font-bold text-white">
                {prices.depositPriceSL}-{prices.depositPriceCL}€
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* THE DECISION — same condition, two outcomes side by side. */}
      <Reveal className="px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {g.weatherTitle}
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {g.withoutLabel}
              </p>
              <p className="mt-3 text-foreground">{g.withoutBody}</p>
            </div>
            <div className="rounded-2xl border-2 border-cta bg-cta/5 p-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-cta">
                  {g.withLabel}
                </p>
                <span className="shrink-0 text-lg font-bold text-cta">{prices.weatherPrice}€</span>
              </div>
              <p className="mt-3 text-foreground">{g.withBody}</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* THE THRESHOLD — the signature: the measured value leads each row. */}
      <Reveal className="border-y border-border bg-muted/40 px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {g.criteriaTitle}
          </h2>
          <dl className="mt-7">
            {g.criteria.map((text, i) => (
              <div
                key={text}
                className="flex flex-col gap-2 border-t border-border py-5 sm:flex-row sm:gap-8"
              >
                <dt className="shrink-0 font-mono text-sm font-bold uppercase tracking-wider text-cta sm:w-28 sm:pt-0.5">
                  {g.criteriaMarks[i]}
                </dt>
                <dd className="text-foreground">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      {/* REDUCED DEPOSIT — real numbers, per boat tier. */}
      <Reveal className="px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {g.depositTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">{g.depositBody}</p>
          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 text-sm font-semibold text-muted-foreground">
                    {t.booking.boat}
                  </th>
                  <th className="py-3 pr-4 text-sm font-semibold text-muted-foreground">
                    {g.colStandard}
                  </th>
                  <th className="py-3 text-sm font-semibold text-muted-foreground">
                    {g.colReduced}
                  </th>
                </tr>
              </thead>
              <tbody>
                {depositRows.map(row => (
                  <tr key={row.label} className="border-b border-border">
                    <td className="py-4 pr-4 font-medium text-foreground">{row.label}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{row.standard ?? "—"}</td>
                    <td className="py-4">
                      <span className="font-bold text-foreground">{row.reduced}</span>
                      <span className="ml-2 text-sm text-muted-foreground">+{row.price}€</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{g.notInsurance}</p>
          <div className="mt-8">
            <LastUpdated date="2026-07-25" />
          </div>
        </div>
      </Reveal>

      {/* CLOSE — the decision belongs in the booking flow, so send them there. */}
      <Reveal className="bg-primary px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-2xl font-bold text-primary-foreground sm:text-3xl">
            {g.ctaTitle}
          </h2>
          <button
            type="button"
            onClick={() => openBookingModal()}
            className={`${NAVY_CTA} mt-7 min-h-12 bg-background px-8 text-base text-foreground hover:bg-background/90`}
          >
            {g.ctaLabel}
          </button>
        </div>
      </Reveal>

      <div className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <TrustBadges t={t} />
        </div>
      </div>

      {/* Sticky CTA on phones: the page is long enough that the close scrolls away. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => openBookingModal()}
          className={`${NAVY_CTA} min-h-12 w-full px-6 text-base`}
        >
          {g.ctaLabel}
        </button>
      </div>
      <div className="h-20 lg:hidden" />

      <Footer />
    </div>
  );
}
