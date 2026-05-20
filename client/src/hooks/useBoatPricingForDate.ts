import { useQuery } from "@tanstack/react-query";

interface UseBoatPricingForDateParams {
  boatId: string | null | undefined;
  date: string | null | undefined;
  duration?: string;
  enabled?: boolean;
}

interface UseBoatPricingForDateResult {
  finalPrice: number | null;
  basePrice: number | null;
  hasOverride: boolean;
  overrideLabel?: string;
}

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

/**
 * Fetches real pricing for a specific boat+date combination.
 * Returns finalPrice (after any override), hasOverride flag, and overrideLabel.
 * Used by booking flow boat cards and duration step to show accurate prices.
 */
export function useBoatPricingForDate({
  boatId,
  date,
  duration = "4h",
  enabled = true,
}: UseBoatPricingForDateParams): UseBoatPricingForDateResult {
  const canFetch = enabled && !!boatId && !!date;

  const { data } = useQuery<PricingCalendarResponse>({
    queryKey: ["/api/pricing/calendar", boatId, date, duration],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: date!,
        to: date!,
        boatId: boatId!,
        duration,
      });
      const res = await fetch(`/api/pricing/calendar?${params.toString()}`);
      if (!res.ok) throw new Error("pricing fetch failed");
      return res.json();
    },
    enabled: canFetch,
    staleTime: 5 * 60 * 1000,
  });

  const day = data?.days?.[0];
  if (!day) {
    return { finalPrice: null, basePrice: null, hasOverride: false };
  }

  return {
    finalPrice: day.finalPrice,
    basePrice: day.basePrice,
    hasOverride: day.hasOverride,
    overrideLabel: day.overrideLabel,
  };
}
