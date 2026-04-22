import { useQuery } from "@tanstack/react-query";
import {
  BUSINESS_RATING,
  BUSINESS_REVIEW_COUNT,
  BUSINESS_DISPLAY_NAME,
} from "@shared/businessProfile";

export interface BusinessStats {
  rating: number;
  userRatingCount: number;
  displayName: string | null;
  internationalPhoneNumber?: string | null;
  websiteUri?: string | null;
  weekdayHours?: string[] | null;
  recentReviews: Array<{
    rating: number;
    text: string;
    author: string;
    publishTime: string | null;
    relativeTime: string | null;
  }>;
  lastSyncedAt: string | null;
  isFallback: boolean;
}

const FALLBACK: BusinessStats = {
  rating: BUSINESS_RATING,
  userRatingCount: BUSINESS_REVIEW_COUNT,
  displayName: BUSINESS_DISPLAY_NAME,
  recentReviews: [],
  lastSyncedAt: null,
  isFallback: true,
};

/**
 * Hook to access the cached Google Business Profile stats.
 * Synced weekly from Google Places API (New).
 *
 * Uses React Query with 1h stale time — matches the Cache-Control header
 * the API serves. Re-fetches in background if stale.
 */
export function useBusinessStats() {
  return useQuery<BusinessStats>({
    queryKey: ["/api/business-stats"],
    queryFn: async () => {
      const res = await fetch("/api/business-stats");
      if (!res.ok) throw new Error("Failed to load business stats");
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // 1h
    gcTime: 24 * 60 * 60 * 1000, // 24h
    placeholderData: FALLBACK,
    refetchOnWindowFocus: false,
  });
}
