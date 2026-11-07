import { useQuery } from "@tanstack/react-query";

export type LifetimeStats =
  | { available: false }
  | {
      available: true;
      sinceYear: number;
      seasons: number;
      rentals: number;
      customers: number;
    };

/** Lifetime rentals/customers from the CRM, via /api/business-stats/lifetime. */
export function useLifetimeStats() {
  return useQuery<LifetimeStats>({
    queryKey: ["/api/business-stats/lifetime"],
    queryFn: async () => {
      // ?v=2: response shape changed (years -> seasons); skips copies cached by browsers.
      const res = await fetch("/api/business-stats/lifetime?v=2");
      if (!res.ok) return { available: false };
      const d = (await res.json()) as Partial<Extract<LifetimeStats, { available: true }>>;
      const ok =
        d.available === true &&
        [d.seasons, d.rentals, d.customers, d.sinceYear].every(n => typeof n === "number");
      return ok ? (d as LifetimeStats) : { available: false };
    },
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
