import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
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
      className="rounded-b-2xl squircle-b bg-muted/40 py-16 sm:py-24"
      aria-labelledby="guarantees-title"
    >
      <div className="container mx-auto max-w-6xl px-4">
        {/* The argument: one claim, one supporting paragraph. */}
        <div className="mx-auto max-w-5xl text-center">
          <h2
            id="guarantees-title"
            className="font-heading text-h2 font-semibold tracking-tight text-foreground text-balance"
          >
            {g.heroTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
            {g.heroSubtitle}
          </p>
        </div>

        {/* The signature: the published threshold. The measured value leads each
            cell, so the argument is readable in three words before any prose. */}
        <h3 className="mt-12 text-center font-heading text-xl font-semibold tracking-tight text-foreground sm:mt-14">
          {g.criteriaTitle}
        </h3>
        <dl className="mt-6 grid divide-y divide-border rounded-2xl border border-border bg-background md:grid-cols-3 md:divide-x md:divide-y-0">
          {g.criteria.map((text, i) => (
            <div key={text} className="px-6 py-7 text-center sm:px-8 sm:py-9">
              <dt className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {g.criteriaMarks[i]}
              </dt>
              <dd className="mx-auto mt-3 max-w-xs text-base leading-snug text-muted-foreground text-pretty">
                {text}
              </dd>
            </div>
          ))}
        </dl>

        {/* What it costs, then the way in. Same figure-first grammar as the panel
            above, but navy so the section closes on its price and its action:
            the first panel answers "when", this one "how much". */}
        <div className="mt-4 grid items-stretch overflow-hidden rounded-2xl bg-primary text-primary-foreground dark:bg-[hsl(215_45%_16%)] md:mt-5 md:grid-cols-3">
          <dl className="contents">
            {priceRows.map(row => (
              <div
                key={row.label}
                className="flex flex-col items-center justify-center border-b border-primary-foreground/15 px-6 py-7 text-center sm:px-8 sm:py-9 md:border-b-0 md:border-r"
              >
                <dd className="font-heading text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
                  {row.value}
                </dd>
                <dt className="mt-2 text-base leading-snug text-primary-foreground/80">
                  {row.label}
                </dt>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-center px-6 py-7 sm:px-8 md:py-9">
            <InteractiveHoverButton
              tone="light"
              href={localizedPath("garantias")}
              data-testid="home-garantias-link"
              className="min-h-12 px-7 text-base"
            >
              {t.booking.coveragesMoreInfo}
            </InteractiveHoverButton>
          </div>
        </div>
      </div>
    </section>
  );
}
