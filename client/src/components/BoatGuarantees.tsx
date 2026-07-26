import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCoveragePrices } from "@/hooks/useCoveragePrices";
import { coverageDepositTier } from "@shared/pricing";

interface BoatGuaranteesProps {
  requiresLicense: boolean;
  /** This boat's own standard deposit label ("200€"), used only as a veto. */
  boatDeposit?: string;
}

const digits = (value?: string) => {
  const n = value?.replace(/[^0-9]/g, "");
  return n ? Number(n) : null;
};

/**
 * The two optional guarantees, priced for THIS boat, placed under the calendar.
 *
 * Why here and not in the hero or the FAQ: the visitor has just picked a day and
 * seen its price, which is the moment "and if the weather turns on that day?"
 * arrives. It is also the first time the page names a deposit at all — the boat
 * page never mentioned one, so the customer used to meet the 200€ hold at the
 * last step of the wizard or at the pier. It is framed as a reduction, never as
 * a charge: the sentence the figures make is "you can leave 100 instead of 200".
 *
 * Both halves share one skeleton — name + price, rule, the figure that matters,
 * then the plain-language rule — so they read as two facets of one offer rather
 * than two plans in a pricing table. The deposit half leads with the transform
 * (200 → 100) because that is the number this page owns; the weather half leads
 * with the published threshold, which is what makes the guarantee credible.
 *
 * Every string already exists in the 8 locales (garantiasPage + the wizard's
 * coverage labels), so this ships translated and can never drift away from
 * /garantias, which develops the same rules in full.
 */
export default function BoatGuarantees({ requiresLicense, boatDeposit }: BoatGuaranteesProps) {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const { ref, isVisible } = useScrollReveal();
  const prices = useCoveragePrices();
  const g = t.garantiasPage;
  const c = t.booking.coverages;

  const tier = coverageDepositTier(prices, requiresLicense);

  // The standard deposit is quoted only when two independent sources agree: the
  // CRM fleet (via the coverage endpoint) and this boat's own record. They
  // disagree for the captained excursion, which is licence-free yet holds 500€
  // while the tier maths treat it as a 200€ boat. Rather than print a figure the
  // contract could contradict, the whole deposit half stands down.
  const standard = digits(tier.standard);
  const own = digits(boatDeposit);
  const showDeposit = standard != null && own != null && standard === own;

  const marks = g.criteriaMarks ?? [];

  return (
    <section
      ref={ref}
      className={`mb-8 transition-[opacity,transform,filter] duration-500 ${
        isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"
      }`}
      aria-label={g.navLabel}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className={`grid ${showDeposit ? "md:grid-cols-2" : ""} divide-y divide-border md:divide-x md:divide-y-0`}>
          {showDeposit && (
            <div className="p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {c.depositName}
                </h3>
                <span className="shrink-0 font-mono text-3xl font-bold tabular-nums leading-none text-cta sm:text-4xl">
                  {tier.price}€
                </span>
              </div>

              {/* The transform, in the page's figure voice. Two labelled
                  amounts and an arrow: no strikethrough, which would read as a
                  discount sticker rather than a different deposit. Both figures
                  stay neutral so the only accented number in the half is the
                  price; the palette is all dark navy, so emphasis has to come
                  from scale, not from inventing a brighter colour. */}
              <div className="mt-5 flex items-end gap-3 border-t border-border pt-5 sm:gap-4">
                <div>
                  <p className="font-mono text-xl font-bold tabular-nums leading-none text-muted-foreground sm:text-2xl">
                    {standard}€
                  </p>
                  <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">
                    {g.colStandard}
                  </p>
                </div>
                <ArrowRight
                  className="mb-4 h-4 w-4 shrink-0 text-muted-foreground sm:mb-5"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-mono text-xl font-bold tabular-nums leading-none text-foreground sm:text-2xl">
                    {tier.reducedTo}€
                  </p>
                  <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">
                    {g.colReduced}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
                {g.depositBody}
              </p>
            </div>
          )}

          <div className="p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-heading text-base font-semibold text-foreground">
                {c.weatherName}
              </h3>
              <span className="shrink-0 font-mono text-3xl font-bold tabular-nums leading-none text-cta sm:text-4xl">
                {prices.weatherPrice}€
              </span>
            </div>

            {/* The threshold is the argument: a guarantee that publishes when it
                fires is one the customer can check. */}
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-5">
              {marks.map((mark, i) => (
                <span key={mark} className="flex items-center gap-3">
                  {i > 0 && (
                    <span className="text-muted-foreground/60" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <span className="font-mono text-base font-bold tabular-nums text-cta sm:text-lg">
                    {mark}
                  </span>
                </span>
              ))}
            </div>

            {/* Two reading levels: what you get WITH the guarantee in roman,
                what happens without it in italics — same rule, lesser weight. */}
            <p className="mt-4 text-[13px] leading-relaxed text-foreground">{c.withBody}</p>
            <p className="mt-2 text-[13px] italic leading-relaxed text-muted-foreground">
              {c.withoutBody}
            </p>
          </div>
        </div>

        <div className="border-t border-border bg-muted/40 px-5 py-3.5 sm:px-6">
          <a
            href={localizedPath("garantias")}
            data-testid="boat-garantias-link"
            className="inline-flex items-center gap-2 rounded text-sm font-semibold text-cta transition-colors hover:text-cta/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
          >
            {t.booking.coveragesMoreInfo}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
