import { useQuery } from "@tanstack/react-query";
import { COVERAGE_PRICES_FALLBACK, type CoveragePrices } from "@shared/pricing";

/**
 * Prices of the two optional guarantees, which the owner edits in the CRM.
 *
 * Always resolves to a usable object: while the request is in flight, or when
 * the CRM is unreachable, it returns the static figures rather than leaving a
 * price hole on screen. `depositStandardSL/CL` stay undefined in that case on
 * purpose — see COVERAGE_PRICES_FALLBACK.
 */
export function useCoveragePrices(): CoveragePrices {
  const { data } = useQuery<CoveragePrices>({ queryKey: ["/api/coverage-prices"] });
  return data ?? COVERAGE_PRICES_FALLBACK;
}
