import { useQuery } from "@tanstack/react-query";

export interface AvailabilityDayData {
  status: string; // "available" | "partial" | "booked" | "off_season" | "past"
  slots: { time: string; available: boolean }[];
}

interface AvailabilityApiResponse {
  boatId: string;
  month: string;
  days: Record<string, AvailabilityDayData>;
}

/**
 * Fetches a boat's monthly availability (day status + hourly slots).
 * Shared by AvailabilityCalendar (day coloring) and the pricing panel
 * (occupied-hours summary) — same queryKey, so TanStack Query serves both
 * from one network request when they're mounted together.
 */
export function useBoatAvailability(boatId: string | undefined, monthKey: string) {
  const shouldFetch = !!boatId;

  const { data, isLoading } = useQuery<AvailabilityApiResponse>({
    queryKey: ["/api/boats", boatId, "availability", monthKey],
    queryFn: async () => {
      const response = await fetch(`/api/boats/${boatId}/availability?month=${monthKey}`);
      if (!response.ok) throw new Error("Error fetching availability");
      return response.json();
    },
    enabled: shouldFetch,
    staleTime: 60_000, // 1 minute
  });

  return { days: data?.days, isLoading };
}
