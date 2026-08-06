import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCoveragePrices } from "@/hooks/useCoveragePrices";

/**
 * Home band for the two optional guarantees — the teaser for /garantias.
 *
 * It exists because the guarantees were reachable from exactly two places: the
 * footer and step 5 of the booking wizard. Adoption over the 60 days to
 * 2026-07-26 was 2 requests out of 452 (0.4%), against a 10-30% market
 * reference for a damage waiver. Somebody who never opens the wizard had no
 * way of knowing the weather cover exists.
 *
 * The argument the band makes is NOT "peace of mind" — every competitor says
 * that. It is that this guarantee publishes its trigger: an official AEMET
 * coastal warning, wind over 20 knots, or the skipper's call. So the threshold
 * is the hero device, set in the mono figure voice /garantias uses, and the
 * prose stays quiet beside it.
 *
 * Every string here already exists in the 8 locales (garantiasPage + the
 * wizard's coverage labels): the band ships translated without touching i18n,
 * and the copy cannot drift away from the page it links to.
 */
export default function GuaranteesSection() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const { ref, isVisible } = useScrollReveal();
  const prices = useCoveragePrices();
  const g = t.garantiasPage;

  // Both figures come from the CRM. The deposit cover has two tiers (licence
  // free / licensed), shown as a range exactly like the /garantias hero.
  const priceRows = [
    { label: t.booking.coverages.weatherName, value: `${prices.weatherPrice}€` },
    {
      label: t.booking.coverages.depositName,
      value:
        prices.depositPriceSL === prices.depositPriceCL
          ? `${prices.depositPriceSL}€`
          : `${prices.depositPriceSL}-${prices.depositPriceCL}€`,
    },
  ];

  return (
    <section
      ref={ref}
      className={`border-y border-border bg-muted/40 py-16 transition-[opacity,transform,filter] duration-500 sm:py-20 lg:py-24 ${
        isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-8 blur-[2px]"
      }`}
    >
      <div className="container mx-auto grid max-w-4xl grid-cols-1 gap-x-10 gap-y-9 px-4 lg:grid-cols-12">
        {/* The argument. */}
        <div className="lg:col-span-5 lg:row-start-1">
          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-cta">
            {g.navLabel}
          </p>
          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {g.heroTitle}
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{g.heroSubtitle}</p>
        </div>

        {/* The signature: the threshold as an instrument panel. The measured
            value leads each row — same device as the /garantias page, so the
            two read as one argument rather than a teaser and a landing page. */}
        <div className="lg:col-start-7 lg:col-span-6 lg:row-span-2 lg:row-start-1">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {g.criteriaTitle}
            </p>
            <dl className="mt-4">
              {g.criteria.map((text, i) => (
                <div key={text} className="border-t border-border py-3.5 first:border-t-0 first:pt-0">
                  <dt className="font-mono text-xl font-bold tabular-nums tracking-tight text-cta sm:text-2xl">
                    {g.criteriaMarks[i]}
                  </dt>
                  <dd className="mt-1 text-[13px] leading-snug text-muted-foreground">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* What it costs, then the way in. Prices sit under the argument and
            not inside the panel: the panel answers "when", this answers "how
            much", and merging them turns a spec sheet into a pricing card. */}
        <div className="lg:col-span-5 lg:row-start-2 lg:self-end">
          <dl>
            {priceRows.map(row => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-t border-border py-3"
              >
                <dt className="text-sm text-foreground">{row.label}</dt>
                <dd className="font-mono text-sm font-bold tabular-nums text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href={localizedPath("garantias")}
            data-testid="home-garantias-link"
            className="mt-5 inline-flex items-center gap-2 rounded text-sm font-semibold text-cta transition-colors hover:text-cta/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 pointer-coarse:py-3 pointer-coarse:-my-3"
          >
            {t.booking.coveragesMoreInfo}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
