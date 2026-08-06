import { Star, Fuel, Shield, Waves } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { Translations } from "@/lib/translations";
import { BUSINESS_RATING, BUSINESS_REVIEW_COUNT, GBP_PROFILE_URL } from "@shared/businessProfile";

interface BoatHeroChipsProps {
  t: Translations;
  /**
   * Whether THIS boat includes fuel (use `boatIncludesFuel` from
   * shared/boatData). Captained boats have requiresLicense=false but do NOT
   * include fuel, so the chip cannot branch on requiresLicense alone.
   */
  fuelIncluded: boolean;
}

/**
 * Trust + risk-reversal strip rendered right under the hero, above the fold on
 * every supported viewport (verified on iPhone SE 320px through desktop 1920px).
 *
 * Three chips:
 *  1. Star rating + review count from `shared/businessProfile` (canonical source).
 *  2. Fuel + insurance OR insurance-only depending on `fuelIncluded`
 *     (only self-drive licence-free boats include fuel; licensed boats and
 *     the captained excursion do not — see shared/boatData.boatIncludesFuel).
 *  3. Weather rescheduling — wording stays neutral ("if the sea doesn't cooperate")
 *     to honor the policy that only Costa Brava's staff calls bad weather, not
 *     the customer.
 *
 * The free-date-change chip was dropped on 2026-07-26 by the owner. The policy
 * itself stands (see `CondicionesGenerales.tsx`); it just no longer rides in the
 * hero, so `t.boatDetail.heroChipDateChange` is unused here on purpose.
 *
 * Layout: centred flex-wrap at every width. It was a 2-column grid while there
 * were four chips (a tidy 2x2 on phones); with three, the grid left an orphan
 * in the bottom-left cell. Verified from 320px up. No shadow at rest
 * (DESIGN.md Earned Depth).
 */
export function BoatHeroChips({ t, fuelIncluded }: BoatHeroChipsProps) {
  const { language } = useLanguage();
  const rating = new Intl.NumberFormat(language, { minimumFractionDigits: 1 }).format(BUSINESS_RATING);
  const count = new Intl.NumberFormat(language).format(BUSINESS_REVIEW_COUNT);
  const reviewsLabel = (t.boatDetail.heroChipReviews || "{rating} · {count} reseñas en Google")
    .replace("{rating}", rating)
    .replace("{count}", count);

  const chips = [
    {
      Icon: Star,
      label: reviewsLabel,
      iconClass: "fill-amber-400 text-amber-400",
    },
    fuelIncluded
      ? {
          Icon: Fuel,
          label: t.boatDetail.heroChipFuelInsurance,
          iconClass: "text-cta",
        }
      : {
          Icon: Shield,
          label: t.boatDetail.heroChipInsurance,
          iconClass: "text-cta",
        },
    {
      Icon: Waves,
      label: t.boatDetail.heroChipWeather,
      iconClass: "text-cta",
    },
  ];

  return (
    <ul
      className="mt-3 flex flex-wrap justify-center gap-2"
      aria-label={t.boatDetail.heroChipsLabel}
    >
      {chips.map((chip, i) => {
        const content = (
          <>
            <chip.Icon
              className={`mt-0.5 w-3.5 h-3.5 shrink-0 ${chip.iconClass}`}
              aria-hidden="true"
            />
            <span className="text-balance">{chip.label}</span>
          </>
        );
        return (
          <li key={i} className="inline-flex">
            {i === 0 ? (
              <a
                href={GBP_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1.5 rounded-full border border-border/70 bg-muted/70 px-3 py-1.5 pointer-coarse:min-h-11 pointer-coarse:items-center text-xs leading-snug text-foreground hover:border-foreground/40 transition-colors"
              >
                {content}
              </a>
            ) : (
              <span className="inline-flex items-start gap-1.5 rounded-full border border-border/70 bg-muted/70 px-3 py-1.5 text-xs leading-snug text-foreground">
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
