import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface FeatureFlagEntry {
  name: string;
  enabled: boolean;
}

/**
 * Fetches all feature flags for the current tenant and caches them.
 * Returns whether a specific flag is enabled.
 *
 * Usage:
 * ```tsx
 * const isEnabled = useFeatureFlag("advanced-analytics");
 *
 * if (isEnabled) {
 *   return <AdvancedAnalyticsDashboard />;
 * }
 * return <BasicAnalytics />;
 * ```
 *
 * The flags are fetched once and cached for 5 minutes (staleTime default).
 * All components using different flag names share the same query cache entry.
 */
export function useFeatureFlag(flagName: string): boolean {
  const { data: flags } = useQuery<FeatureFlagEntry[]>({
    queryKey: ["/api/features"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutes — flags don't change often
    retry: false,
  });

  if (!flags || !Array.isArray(flags)) return false;

  const flag = flags.find((f) => f.name === flagName);
  return flag?.enabled ?? false;
}

/**
 * Returns all feature flags as a Map for bulk access.
 * Useful when checking multiple flags in a single component.
 *
 * Usage:
 * ```tsx
 * const { flags, isLoading } = useFeatureFlags();
 *
 * if (flags.get("whatsapp-chatbot")) { ... }
 * if (flags.get("stripe-connect")) { ... }
 * ```
 */
export function useFeatureFlags(): {
  flags: Map<string, boolean>;
  isLoading: boolean;
} {
  const { data: flagsArray, isLoading } = useQuery<FeatureFlagEntry[]>({
    queryKey: ["/api/features"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const flags = new Map<string, boolean>();
  if (flagsArray && Array.isArray(flagsArray)) {
    for (const f of flagsArray) {
      flags.set(f.name, f.enabled);
    }
  }

  return { flags, isLoading };
}
