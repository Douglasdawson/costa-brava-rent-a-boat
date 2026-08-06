import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useCoveragePrices } from "@/hooks/useCoveragePrices";
import { coverageDepositTier } from "@shared/pricing";

/**
 * "You can leave less": the reduced-deposit cover, shown wherever the site
 * states the standard deposit. Until now those pages announced a 200€ / 500€
 * deposit and said nothing about the cover that halves it, so the objection
 * landed without its answer.
 *
 * Only the cover's name is translated; the two figures carry the offer in any
 * language, and both come from the CRM through /api/coverage-prices.
 */
export function ReducedDepositLink({ requiresLicense }: { requiresLicense: boolean }) {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const tier = coverageDepositTier(useCoveragePrices(), requiresLicense);

  return (
    <a
      href={localizedPath("garantias")}
      data-testid="reduced-deposit-link"
      className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-cta transition-colors hover:text-cta/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 pointer-coarse:py-3 pointer-coarse:-my-3"
    >
      {t.booking.coverages.depositName}: {tier.reducedTo}€ (+{tier.price}€)
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}
