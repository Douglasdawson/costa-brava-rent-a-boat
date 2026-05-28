import { useMemo } from "react";
import { useBoatPricingForDate } from "./useBoatPricingForDate";
import type { Duration } from "@shared/pricing";

const ALL_DURATIONS: Duration[] = ["1h", "2h", "3h", "4h", "6h", "8h"];

export interface BoatPricingAllDurations {
  /**
   * Final price (post weekend surcharge + override) keyed by duration.
   * A duration is absent when the boat doesn't offer it on the date, or
   * until the API response has loaded.
   */
  prices: Partial<Record<Duration, number>>;
  /** True once at least one duration resolved from the pricing engine for this boat+date. */
  isForDate: boolean;
}

/**
 * Resolves the date-aware price for every duration of a boat in one place, so the
 * booking wizard shows the exact same figures as the public pricing calendar
 * (`/api/pricing/calendar` → `calculatePricingBreakdown`): weekend surcharge and
 * any active pricing override included.
 *
 * Mirrors the multi-query pattern of `useBoatLowestPriceForDate` (one query per
 * duration; react-query dedupes and caches each for 5 min). Callers must fall back
 * to the static catalog price for any duration missing from `prices` (not loaded
 * yet, or not offered on the date).
 */
export function useBoatPricingAllDurations(
  boatId: string | null | undefined,
  date: string | null | undefined,
): BoatPricingAllDurations {
  const enabled = !!boatId && !!date;

  const p1h = useBoatPricingForDate({ boatId, date, duration: "1h", enabled });
  const p2h = useBoatPricingForDate({ boatId, date, duration: "2h", enabled });
  const p3h = useBoatPricingForDate({ boatId, date, duration: "3h", enabled });
  const p4h = useBoatPricingForDate({ boatId, date, duration: "4h", enabled });
  const p6h = useBoatPricingForDate({ boatId, date, duration: "6h", enabled });
  const p8h = useBoatPricingForDate({ boatId, date, duration: "8h", enabled });

  return useMemo(() => {
    const byDuration: Record<Duration, { finalPrice: number | null }> = {
      "1h": p1h,
      "2h": p2h,
      "3h": p3h,
      "4h": p4h,
      "6h": p6h,
      "8h": p8h,
    };
    const prices: Partial<Record<Duration, number>> = {};
    let isForDate = false;
    for (const d of ALL_DURATIONS) {
      const fp = byDuration[d].finalPrice;
      if (fp !== null) {
        prices[d] = fp;
        isForDate = true;
      }
    }
    return { prices, isForDate };
  }, [p1h, p2h, p3h, p4h, p6h, p8h]);
}
