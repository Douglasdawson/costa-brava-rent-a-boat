import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "@/lib/translations";
import { trackEvent } from "@/utils/analytics";

interface LiveInterestIndicatorProps {
  boatId: string;
}

function getOrCreateToken(): string {
  const key = "cbrb_interest_token";
  let token = sessionStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem(key, token);
  }
  return token;
}

export function LiveInterestIndicator({ boatId }: LiveInterestIndicatorProps) {
  const [count, setCount] = useState(0);
  const t = useTranslations();
  const trackedRef = useRef(false);
  const tokenRef = useRef<string>("");
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendPing = useCallback(async () => {
    try {
      await fetch(`/api/boats/${boatId}/interest/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRef.current }),
      });
    } catch {
      // Silent fail — non-critical
    }
  }, [boatId]);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/boats/${boatId}/interest`);
      if (res.ok) {
        const data = await res.json();
        setCount(data.count ?? 0);
      }
    } catch {
      // Silent fail — non-critical
    }
  }, [boatId]);

  useEffect(() => {
    tokenRef.current = getOrCreateToken();
    trackedRef.current = false;

    // Initial ping + fetch
    sendPing();
    fetchCount();

    // Ping every 30s, fetch every 15s
    pingIntervalRef.current = setInterval(sendPing, 30_000);
    fetchIntervalRef.current = setInterval(fetchCount, 15_000);

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
    };
  }, [boatId, sendPing, fetchCount]);

  // Track event once per session per boat
  useEffect(() => {
    if (count >= 2 && !trackedRef.current) {
      trackedRef.current = true;
      trackEvent("live_interest_shown", { boat_id: boatId, count });
    }
  }, [count, boatId]);

  if (count < 2) return null;

  const text = (t.liveInterest?.viewing ?? "{count} personas mirando este barco ahora mismo").replace(
    "{count}",
    String(count)
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-in fade-in duration-300 bg-popular/10 border border-popular/30 rounded-lg px-3 py-2"
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-popular">
        <span className="w-1.5 h-1.5 rounded-full bg-popular animate-pulse" aria-hidden="true" />
        {text}
      </div>
    </div>
  );
}
