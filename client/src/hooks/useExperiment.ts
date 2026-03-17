import { useState, useEffect, useCallback, useRef } from "react";

const SESSION_KEY = "ab_session_id";
const ASSIGNMENT_PREFIX = "ab_variant_";

interface UseExperimentResult {
  /** The assigned variant ID, or null while loading / if experiment not found */
  variant: string | null;
  /** True while the initial assignment is being fetched */
  isLoading: boolean;
  /** Track a conversion event for this experiment */
  trackEvent: (eventType: string, metadata?: Record<string, unknown>) => void;
}

/**
 * Get or create a persistent session ID for A/B testing.
 * Stored in localStorage so the same visitor always gets the same variant.
 */
function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Hook for A/B testing experiments.
 *
 * Usage:
 * ```tsx
 * const { variant, isLoading, trackEvent } = useExperiment("hero-cta-color");
 *
 * if (isLoading) return <Skeleton />;
 * if (variant === "variant_a") return <BlueButton />;
 * return <GreenButton />; // control
 * ```
 */
export function useExperiment(experimentName: string): UseExperimentResult {
  const [variant, setVariant] = useState<string | null>(() => {
    // Check localStorage cache first to avoid flash of content
    if (typeof window === "undefined") return null;
    return localStorage.getItem(`${ASSIGNMENT_PREFIX}${experimentName}`);
  });
  const [isLoading, setIsLoading] = useState<boolean>(variant === null);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (!experimentName) return;

    const sessionId = getSessionId();
    sessionIdRef.current = sessionId;

    // If we already have a cached variant, skip the API call
    const cached = localStorage.getItem(`${ASSIGNMENT_PREFIX}${experimentName}`);
    if (cached) {
      setVariant(cached);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function assign() {
      try {
        const res = await fetch("/api/experiments/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experimentName, sessionId }),
        });

        if (!res.ok) {
          // Experiment not found or not active — silently fall back to null
          if (!cancelled) {
            setVariant(null);
            setIsLoading(false);
          }
          return;
        }

        const data = await res.json() as { variant: string };
        if (!cancelled) {
          localStorage.setItem(`${ASSIGNMENT_PREFIX}${experimentName}`, data.variant);
          setVariant(data.variant);
          setIsLoading(false);
        }
      } catch {
        // Network error — don't break the UI
        if (!cancelled) {
          setVariant(null);
          setIsLoading(false);
        }
      }
    }

    assign();

    return () => {
      cancelled = true;
    };
  }, [experimentName]);

  const trackEvent = useCallback(
    (eventType: string, metadata?: Record<string, unknown>) => {
      if (!variant || !experimentName) return;

      const sessionId = sessionIdRef.current || getSessionId();

      // Fire-and-forget: use sendBeacon if available for reliability on page unload,
      // otherwise fall back to fetch
      const payload = JSON.stringify({
        experimentName,
        sessionId,
        variant,
        eventType,
        metadata,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/experiments/track",
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        fetch("/api/experiments/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Silently ignore tracking errors
        });
      }
    },
    [variant, experimentName],
  );

  return { variant, isLoading, trackEvent };
}
