import { Star, Fuel, Shield, RotateCcw, Waves } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { Translations } from "@/lib/translations";
import { BUSINESS_RATING, BUSINESS_REVIEW_COUNT } from "@shared/businessProfile";

interface BoatHeroChipsProps {
  t: Translations;
  requiresLicense: boolean;
}

/**
 * Trust + risk-reversal strip rendered right under the hero, above the fold on
 * every supported viewport (verified on iPhone SE 320px through desktop 1920px).
 *
 * Four chips:
 *  1. Star rating + review count from `shared/businessProfile` (canonical source).
 *  2. Fuel + insurance OR insurance-only depending on `requiresLicense`
 *     (licensed boats do not include fuel — see memory feedback_fuel_licensed_boats).
 *  3. Free date change with 7+ days notice — per `CondicionesGenerales.tsx`.
 *  4. Weather rescheduling — wording stays neutral ("if the sea doesn't cooperate")
 *     to honor the policy that only Costa Brava's staff calls bad weather, not
 *     the customer.
 *
 * Layout: grid-cols-2 on mobile (≤640px) so the four chips render as a tidy 2×2
 * block on any phone width without overflow. Flex-wrap on sm+ so chips size to
 * content and breathe horizontally. No shadow at rest (DESIGN.md Earned Depth).
 */
export function BoatHeroChips({ t, requiresLicense }: BoatHeroChipsProps) {
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
    requiresLicense
      ? {
          Icon: Shield,
          label: t.boatDetail.heroChipInsurance,
          iconClass: "text-cta",
        }
      : {
          Icon: Fuel,
          label: t.boatDetail.heroChipFuelInsurance,
          iconClass: "text-cta",
        },
    {
      Icon: RotateCcw,
      label: t.boatDetail.heroChipDateChange,
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
      className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      aria-label={t.boatDetail.heroChipsLabel}
    >
      {chips.map((chip, i) => (
        <li
          key={i}
          className="inline-flex items-start gap-1.5 rounded-full border border-border/70 bg-muted/70 px-3 py-1.5 text-xs leading-snug text-foreground"
        >
          <chip.Icon
            className={`mt-0.5 w-3.5 h-3.5 shrink-0 ${chip.iconClass}`}
            aria-hidden="true"
          />
          <span className="text-balance">{chip.label}</span>
        </li>
      ))}
    </ul>
  );
}
