import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { TrustBadges } from "@/components/TrustBadges";
import { LastUpdated } from "@/components/LastUpdated";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { generateHreflangLinks, generateCanonicalUrl, getSEOConfig } from "@/utils/seo-config";
import { generateBreadcrumbSchema } from "@/utils/seo-schemas";
import { COVERAGE_PRICES_FALLBACK, type CoveragePrices } from "@shared/pricing";
import { MobileStickyBar } from "@/components/MobileStickyBar";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { H2, Rise, SHEET, Sheet, TONE_BG } from "@/components/page-kit";

const NAVY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

const HERO_IMAGE = "/images/blog/atardecer-mar.webp";

/**
 * Header of a guarantee record: the name, and its price in the page's mono
 * figure voice. Repeated once per guarantee, it is the device that tells the
 * reader "this is one of two things", which the page used to leave implicit.
 */
function RecordHeader({ name, price }: { name: string; price: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-foreground pb-4">
      <h2 className={H2}>{name}</h2>
      <p className="font-mono text-3xl font-semibold tabular-nums leading-none text-cta sm:text-4xl">
        {price}
      </p>
    </div>
  );
}

/** Sub-heading inside a record. Deliberately an h3: it belongs to the record. */
function RecordBlockTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-heading text-lg font-semibold text-foreground">{children}</h3>;
}

/**
 * /garantias — the two optional coverages, the objective bad-weather threshold
 * and what the customer gets with and without the guarantee. It is the page
 * step 5 of the booking wizard links to, so it has to carry the same weight as
 * the rest of the site, not read like a terms annex.
 *
 * Structure (rebuilt 2026-07-26, the previous one was reported as unclear): the
 * body is TWO records, one per guarantee, not four peer sections. It used to
 * run "what you get" / "when it applies" / "reduced deposit" / CTA as four h2s
 * of equal rank, so the first two — both about the weather guarantee — looked
 * unrelated, and the third switched product with no signal. The alternating
 * background now encodes that boundary instead of an arbitrary rhythm: one
 * guarantee per band.
 */
export default function GarantiasPage() {
  const { language, localizedPath } = useLanguage();
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

      {/* HERO: photo sheet; the sea makes the argument and the page only publishes the rule. */}
      <div className={TONE_BG.background}>
        <section
          className={`relative isolate flex min-h-[100svh] items-center sm:min-h-[85svh] overflow-hidden ${SHEET} pb-16 pt-28`}
        >
          <img
            src={HERO_IMAGE}
            alt=""
            aria-hidden="true"
            decoding="async"
            draggable={false}
            className={`absolute inset-0 -z-10 h-full w-full object-cover object-[center_55%] will-change-transform transition-transform duration-[1200ms] ease-out motion-reduce:transition-none ${
              mounted ? "scale-100" : "scale-[1.06]"
            }`}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/40 to-black/75" />

          <div
            className={`mx-auto w-full max-w-3xl px-4 text-white transition-transform duration-700 ease-out motion-reduce:transition-none sm:px-6 ${
              mounted ? "translate-y-0" : "translate-y-4"
            }`}
          >
            <h1 className="font-heading text-display font-semibold text-balance [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_4px_24px_rgba(0,0,0,0.4)]">
              {g.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90 text-pretty [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
              {g.heroSubtitle}
            </p>
            {/* Both prices as one ruled strip, not loose pills. */}
            <dl className="mt-8 grid max-w-xl overflow-hidden rounded-2xl border border-white/25 bg-black/25 text-sm text-white sm:grid-cols-2">
              <div className="flex items-baseline justify-between gap-3 px-4 py-3.5">
                <dt className="font-medium">{t.booking.coverages.weatherName}</dt>
                <dd className="font-heading font-semibold tabular-nums">{prices.weatherPrice}€</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-white/25 px-4 py-3.5 sm:border-l sm:border-t-0">
                <dt className="font-medium">{t.booking.coverages.depositName}</dt>
                <dd className="font-heading font-semibold tabular-nums">
                  {prices.depositPriceSL}-{prices.depositPriceCL}€
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      {/* RECORD 1 — Garantía de mal tiempo. */}
      <Sheet tone="background" next="muted" aria-label={t.booking.coverages.weatherName}>
        <Rise className="container mx-auto max-w-3xl px-4">
          <RecordHeader name={t.booking.coverages.weatherName} price={`${prices.weatherPrice}€`} />

          {/* Same condition, two outcomes. One frame with a divider, not two
              cards: the subject IS the comparison. No figures inside the
              columns — the old layout put a made-up 0€ opposite the 10€, in the
              same slot and the same mono voice, which turned an outcome
              comparison into a two-plan pricing table with a free tier. The
              price is stated once, in the record header. */}
          <div className="mt-8">
            <RecordBlockTitle>{g.weatherTitle}</RecordBlockTitle>
            <div className="mt-4 grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2 sm:grid-rows-[auto_1fr]">
              <div className="border-b border-border p-4 sm:row-span-2 sm:grid sm:grid-rows-subgrid sm:border-b-0 sm:p-6">
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {g.withoutLabel}
                </p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-foreground">
                  {g.withoutBody}
                </p>
              </div>
              <div className="bg-cta/5 p-4 sm:row-span-2 sm:grid sm:grid-rows-subgrid sm:border-l sm:border-border sm:p-6">
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-cta">
                  {g.withLabel}
                </p>
                <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-foreground">
                  {g.withBody}
                </p>
              </div>
            </div>
          </div>

          {/* The threshold, nested in the record it belongs to. It used to be a
              full-bleed band, which made a supporting detail of guarantee #1
              look like a topic of its own rank. The signature stays: the
              measured value leads each row. */}
          <div className="mt-10">
            <RecordBlockTitle>{g.criteriaTitle}</RecordBlockTitle>
            <dl className="mt-4">
              {g.criteria.map((text, i) => (
                <div
                  key={text}
                  className="flex flex-col gap-1.5 border-t border-border py-4 sm:flex-row sm:gap-8"
                >
                  <dt className="shrink-0 font-mono text-sm font-bold uppercase tracking-wider text-cta sm:w-36 sm:pt-0.5">
                    {g.criteriaMarks[i]}
                  </dt>
                  <dd className="text-sm leading-relaxed text-foreground">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Rise>
      </Sheet>

      {/* RECORD 2 — Fianza reducida. Its own band: from here on the background
          change means "other guarantee", not just "other section". */}
      <Sheet tone="muted" next="background" aria-label={g.depositTitle}>
        <Rise className="container mx-auto max-w-3xl px-4">
          <RecordHeader
            name={g.depositTitle}
            price={
              prices.depositPriceSL === prices.depositPriceCL
                ? `${prices.depositPriceSL}€`
                : `${prices.depositPriceSL}-${prices.depositPriceCL}€`
            }
          />
          <p className="mt-6 max-w-2xl text-muted-foreground">{g.depositBody}</p>

          {/* Two rows, not a table: a <table> with two data rows is heavy
              furniture, and its "Barco" header held "Sin licencia" / "Con
              licencia", which are categories and not boats. Each row shows the
              same transform the boat pages use, so the reader meets one device
              twice instead of two spellings of one idea. */}
          {/* Legend for the transform, directly above the figures it explains:
              below the rows it was too far from them to do its job. */}
          <p className="mt-8 flex flex-wrap gap-x-4 text-xs text-muted-foreground sm:pl-40">
            <span>
              {g.colStandard} → {g.colReduced}
            </span>
          </p>
          <dl className="mt-2">
            {depositRows.map(row => (
              <div
                key={row.label}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-border py-5"
              >
                <dt className="w-full font-medium text-foreground sm:w-40">{row.label}</dt>
                <dd className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <span className="flex items-baseline gap-2.5">
                    {row.standard && (
                      <>
                        <span className="font-mono text-lg font-semibold tabular-nums text-muted-foreground">
                          {row.standard}
                        </span>
                        <ArrowRight
                          className="h-3.5 w-3.5 shrink-0 self-center text-muted-foreground"
                          aria-hidden="true"
                        />
                      </>
                    )}
                    <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
                      {row.reduced}
                    </span>
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-cta">
                    {row.price}€
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Rise>
      </Sheet>

      {/* Page-level footnote: the disclaimer covers BOTH guarantees, so it sits
          outside either record rather than at the tail of the second one. */}
      <Sheet tone="background" next="navy" className="py-10 sm:py-12" aria-label={g.navLabel}>
        <div className="container mx-auto max-w-3xl px-4">
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {g.notInsurance}
          </p>
          <div className="mt-5">
            <LastUpdated date="2026-07-25" />
          </div>
        </div>
      </Sheet>

      {/* CLOSE: the decision belongs in the booking flow, so send them there. */}
      <Sheet tone="navy" next="background" aria-labelledby="garantias-cta-title">
        <Rise className="container mx-auto max-w-3xl px-4 text-center">
          <h2 id="garantias-cta-title" className={H2}>
            {g.ctaTitle}
          </h2>
          <InteractiveHoverButton
            tone="light"
            onClick={() => openBookingModal()}
            className="mt-8 min-h-12 px-8 text-base"
          >
            {g.ctaLabel}
          </InteractiveHoverButton>
        </Rise>
      </Sheet>

      <Sheet
        tone="background"
        next="footer"
        className="py-10 sm:py-12"
        aria-label={g.conditionsLink}
      >
        <div className="container mx-auto max-w-3xl px-4">
          <TrustBadges t={t} />
          {/* Una garantia comercial que se vende debe poder leerse: el texto que
              la define vive en las condiciones generales, no en esta pagina. */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <a
              href={localizedPath("condicionesGenerales")}
              className="underline underline-offset-4 hover:text-foreground"
              data-testid="garantias-conditions-link"
            >
              {g.conditionsLink}
            </a>
          </p>
        </div>
      </Sheet>

      <div className="bg-foreground">
        {/* Sticky CTA on phones: the page is long enough that the close scrolls away. */}
        <MobileStickyBar>
          <button
            type="button"
            onClick={() => openBookingModal()}
            className={`${NAVY_CTA} min-h-12 w-full px-6 text-base`}
          >
            {g.ctaLabel}
          </button>
        </MobileStickyBar>
      </div>

      <Footer />
    </div>
  );
}
