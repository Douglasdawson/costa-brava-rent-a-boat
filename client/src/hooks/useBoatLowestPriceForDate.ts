import { useMemo } from "react";
import { useBoatPricingForDate } from "./useBoatPricingForDate";

interface UseBoatLowestPriceForDateParams {
  boatId: string | null | undefined;
  selectedDate: Date | undefined;
  fallbackPrice: number;
}

interface UseBoatLowestPriceForDateResult {
  /** Resolved price: min across active durations for selectedDate, or fallback */
  price: number;
  /** True when the price came from a date-specific computation (not the fallback) */
  isForDate: boolean;
  /** True when any of the fetched durations had a pricing override applied */
  hasOverride: boolean;
  /** Backend-provided label for the override, if any */
  overrideLabel?: string;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Resolves the lowest applicable price for a boat across the four canonical durations,
 * factoring in pricing overrides for a specific date. Falls back to the static catalog
 * price when no date is selected or when the API returns no data.
 *
 * Used by surfaces that show "desde X€" labels and must stay consistent with the
 * pricing card below the fold once the user picks a date in the calendar.
 */
export function useBoatLowestPriceForDate({
  boatId,
  selectedDate,
  fallbackPrice,
}: UseBoatLowestPriceForDateParams): UseBoatLowestPriceForDateResult {
  const dateKey = selectedDate ? toDateKey(selectedDate) : null;
  const enabled = !!boatId && !!dateKey;

  const p1h = useBoatPricingForDate({ boatId, date: dateKey, duration: "1h", enabled });
  const p2h = useBoatPricingForDate({ boatId, date: dateKey, duration: "2h", enabled });
  const p4h = useBoatPricingForDate({ boatId, date: dateKey, duration: "4h", enabled });
  const p8h = useBoatPricingForDate({ boatId, date: dateKey, duration: "8h", enabled });

  return useMemo(() => {
    if (!enabled) {
      return { price: fallbackPrice, isForDate: false, hasOverride: false };
    }

    const results = [p1h, p2h, p4h, p8h].filter((r) => r.finalPrice !== null);
    if (results.length === 0) {
      // Still loading or no active durations for that date
      return { price: fallbackPrice, isForDate: false, hasOverride: false };
    }

    const minResult = results.reduce((min, r) =>
      r.finalPrice! < min.finalPrice! ? r : min
    );
    const overrideHit = results.find((r) => r.hasOverride);

    return {
      price: minResult.finalPrice!,
      isForDate: true,
      hasOverride: !!overrideHit,
      overrideLabel: overrideHit?.overrideLabel,
    };
  }, [enabled, fallbackPrice, p1h, p2h, p4h, p8h]);
}
