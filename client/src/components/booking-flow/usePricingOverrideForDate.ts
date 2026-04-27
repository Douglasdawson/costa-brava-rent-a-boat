import { useQuery } from "@tanstack/react-query";

interface PricingDay {
  date: string;
  basePrice: number;
  finalPrice: number;
  hasOverride: boolean;
  overrideLabel?: string;
}

interface PricingCalendarResponse {
  boatId: string;
  duration: string;
  days: PricingDay[];
}

interface UsePricingOverrideForDateResult {
  hasOverride: boolean;
  overrideLabel?: string;
  basePrice?: number;
  finalPrice?: number;
  /** Percent change vs base, rounded (e.g. 25 for +25%). Only set when hasOverride. */
  percentChange?: number;
}

/**
 * Detects whether the selected date has an active pricing override for the given boat.
 * Used by the booking flow to surface a small banner so the customer is not surprised
 * by a higher price at checkout. Single fetch with duration="2h" (any duration would
 * reveal the override).
 *
 * Returns hasOverride=false when boatId or selectedDate are missing.
 */
export function usePricingOverrideForDate(
  boatId: string | null | undefined,
  selectedDate: string | null | undefined,
): UsePricingOverrideForDateResult {
  const enabled = !!boatId && !!selectedDate;
  const { data } = useQuery<PricingCalendarResponse>({
    queryKey: ["/api/pricing/calendar", boatId, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: selectedDate!,
        to: selectedDate!,
        boatId: boatId!,
        duration: "2h",
      });
      const res = await fetch(`/api/pricing/calendar?${params.toString()}`);
      if (!res.ok) throw new Error("pricing fetch failed");
      return res.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // align with server Cache-Control
  });

  const day = data?.days?.[0];
  if (!day || !day.hasOverride) {
    return { hasOverride: false };
  }
  const percentChange = day.basePrice > 0
    ? Math.round(((day.finalPrice - day.basePrice) / day.basePrice) * 100)
    : 0;
  return {
    hasOverride: true,
    overrideLabel: day.overrideLabel,
    basePrice: day.basePrice,
    finalPrice: day.finalPrice,
    percentChange,
  };
}
