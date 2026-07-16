import { useQuery } from "@tanstack/react-query";

export type DayStatus = "available" | "partial" | "booked";

interface FleetAvailabilityResponse {
  date: string;
  boats: Record<string, { status: DayStatus; availableSlots: number; totalSlots: number }>;
}

/**
 * One request for the WHOLE fleet's day status on a given date — used by the
 * booking wizard's boat-selection step so the customer sees available/partial/
 * booked per boat before picking one, instead of only discovering it two steps
 * later when the hour picker turns out to be all "Reservado".
 */
export function useFleetAvailabilityForDate(dateKey: string | undefined) {
  const { data, isLoading } = useQuery<FleetAvailabilityResponse>({
    queryKey: ["/api/fleet-availability", dateKey],
    queryFn: async () => {
      const response = await fetch(`/api/fleet-availability?date=${dateKey}`);
      if (!response.ok) throw new Error("Error fetching fleet availability");
      return response.json();
    },
    enabled: !!dateKey,
    staleTime: 60_000,
  });

  return { boats: data?.boats, isLoading };
}
