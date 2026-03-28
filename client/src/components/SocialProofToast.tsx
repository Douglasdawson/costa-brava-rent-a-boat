import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { X, Star, Anchor } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { isMobileNavOpen, isAnyModalOpen } from "@/utils/overlay-guards";
import { trackSocialProofDismissed } from "@/utils/analytics";

interface RecentActivity {
  boatName: string;
  numberOfPeople: number;
  createdAt: string;
  country: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  ES: "\u{1F1EA}\u{1F1F8}", FR: "\u{1F1EB}\u{1F1F7}", DE: "\u{1F1E9}\u{1F1EA}",
  GB: "\u{1F1EC}\u{1F1E7}", UK: "\u{1F1EC}\u{1F1E7}", IT: "\u{1F1EE}\u{1F1F9}",
  NL: "\u{1F1F3}\u{1F1F1}", PT: "\u{1F1F5}\u{1F1F9}", BE: "\u{1F1E7}\u{1F1EA}",
  CH: "\u{1F1E8}\u{1F1ED}", US: "\u{1F1FA}\u{1F1F8}", RU: "\u{1F1F7}\u{1F1FA}",
};

function getFlag(country: string): string {
  if (!country) return "";
  const code = country.toUpperCase().trim();
  return COUNTRY_FLAGS[code] || "";
}

const HIDDEN_PATHS = ["/admin", "/crm", "/reservar"];

const SESSION_KEY = "socialProofCount";
const MAX_TOASTS_PER_SESSION = 3;
const INITIAL_DELAY_MS = 25_000;
const AUTO_DISMISS_MS = 5_000;
const MIN_INTERVAL_MS = 40_000;
const MAX_INTERVAL_MS = 55_000;

function getRandomInterval(): number {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
}

function formatTimeAgo(createdAt: string, t: ReturnType<typeof useTranslations>): string {
  const toast = t.socialProofToast;
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return toast?.recently || "Hace poco";
  }
  if (diffMinutes < 60) {
    return toast?.minutesAgo?.replace("{n}", String(diffMinutes)) || `Hace ${diffMinutes} min`;
  }
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) {
    return toast?.hoursAgo?.replace("{n}", String(hours)) || `Hace ${hours}h`;
  }
  const days = Math.floor(hours / 24);
  if (days <= 7) {
    return toast?.daysAgo?.replace("{n}", String(days)) || `Hace ${days} d`;
  }
  return toast?.recently || "Recientemente";
}

export function SocialProofToast() {
  const [location] = useLocation();
  const t = useTranslations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [animState, setAnimState] = useState<"entering" | "visible" | "exiting">("entering");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldShow = !HIDDEN_PATHS.some((p) => location.startsWith(p));

  const { data: activities = [] } = useQuery<RecentActivity[]>({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const res = await fetch("/api/recent-activity");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  });

  const hasRealData = activities.length > 0;

  const getSessionCount = useCallback((): number => {
    try {
      return parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
    } catch {
      return 0;
    }
  }, []);

  const incrementSessionCount = useCallback(() => {
    try {
      const current = getSessionCount();
      sessionStorage.setItem(SESSION_KEY, String(current + 1));
    } catch {
      // sessionStorage not available
    }
  }, [getSessionCount]);

  const dismissToast = useCallback(() => {
    setAnimState("exiting");
    trackSocialProofDismissed();
    setTimeout(() => {
      setVisible(false);
      setAnimState("entering");
    }, 300);
  }, []);

  const showNextToast = useCallback(() => {
    if (getSessionCount() >= MAX_TOASTS_PER_SESSION) return;
    if (!hasRealData) return;
    if (isMobileNavOpen() || isAnyModalOpen()) return;

    setCurrentIndex((prev) => {
      const next = prev >= activities.length - 1 ? 0 : prev + 1;
      return next;
    });

    setVisible(true);
    setAnimState("entering");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimState("visible");
      });
    });

    incrementSessionCount();

    if (dismissRef.current) clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => {
      dismissToast();
    }, AUTO_DISMISS_MS);
  }, [activities, hasRealData, getSessionCount, incrementSessionCount, dismissToast]);

  // Schedule toasts only when we have real data
  useEffect(() => {
    if (!shouldShow || !hasRealData) return;
    if (getSessionCount() >= MAX_TOASTS_PER_SESSION) return;

    timerRef.current = setTimeout(() => {
      showNextToast();

      function scheduleNext() {
        if (getSessionCount() >= MAX_TOASTS_PER_SESSION) return;
        timerRef.current = setTimeout(() => {
          showNextToast();
          scheduleNext();
        }, getRandomInterval());
      }
      scheduleNext();
    }, INITIAL_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, [shouldShow, hasRealData, showNextToast, getSessionCount]);

  // If no real data, show nothing (no fake notifications)
  if (!shouldShow) return null;

  // Static trust badge fallback when no real booking data
  if (!hasRealData) {
    return <StaticTrustBadge />;
  }

  if (!visible) return null;

  const activity = activities[currentIndex];
  if (!activity) return null;

  const toast = t.socialProofToast;
  const flag = getFlag(activity.country);
  const bookedText = flag ? `${flag} Reservó` : (toast?.booked || "Nueva reserva");
  const forPeopleText = toast?.forPeople?.replace("{n}", String(activity.numberOfPeople)) || `para ${activity.numberOfPeople} personas`;
  const timeAgoText = formatTimeAgo(activity.createdAt, t);

  const animStyles: Record<string, React.CSSProperties> = {
    entering: {
      transform: "translateX(-100%)",
      opacity: 0,
    },
    visible: {
      transform: "translateX(0)",
      opacity: 1,
    },
    exiting: {
      transform: "translateY(10px)",
      opacity: 0,
    },
  };

  return (
    <div
      className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-4 md:right-auto z-50 max-w-sm mb-safe social-proof-transition"
      style={animStyles[animState]}
      role="status"
      aria-live="polite"
    >
      <div className="bg-background border border-border/50 rounded-xl shadow-lg p-3 pr-8 relative">
        {/* Close button */}
        <button
          onClick={dismissToast}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted/50"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-3">
          {/* Boat icon */}
          <span className="text-primary mt-0.5 flex-shrink-0" aria-hidden="true">
            <Anchor className="h-5 w-5" />
          </span>

          {/* Content */}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">
              {bookedText}
            </p>
            <p className="text-sm text-muted-foreground leading-tight mt-0.5">
              <span className="font-medium text-foreground">{activity.boatName}</span> {forPeopleText}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {timeAgoText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Static trust badge shown when no real booking data is available.
 * Displays once per session, auto-dismisses, and uses only verifiable claims.
 */
function StaticTrustBadge() {
  const [visible, setVisible] = useState(false);
  const [animState, setAnimState] = useState<"entering" | "visible" | "exiting">("entering");
  const SESSION_BADGE_KEY = "trustBadgeShown";

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_BADGE_KEY)) return;
    } catch {
      return;
    }

    const showTimer = setTimeout(() => {
      setVisible(true);
      setAnimState("entering");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimState("visible");
        });
      });

      try {
        sessionStorage.setItem(SESSION_BADGE_KEY, "1");
      } catch {
        // ignore
      }
    }, INITIAL_DELAY_MS);

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setAnimState("exiting");
      setTimeout(() => setVisible(false), 300);
    }, 6_000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const animStyles: Record<string, React.CSSProperties> = {
    entering: { transform: "translateX(-100%)", opacity: 0 },
    visible: { transform: "translateX(0)", opacity: 1 },
    exiting: { transform: "translateY(10px)", opacity: 0 },
  };

  return (
    <div
      className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-4 md:right-auto z-50 max-w-sm mb-safe social-proof-transition"
      style={animStyles[animState]}
      role="status"
      aria-live="polite"
    >
      <div className="bg-background border border-border/50 rounded-xl shadow-lg p-3 pr-2">
        <div className="flex items-center gap-3">
          <div className="flex text-amber-400 flex-shrink-0" aria-hidden="true">
            <Star className="h-4 w-4 fill-current" />
          </div>
          <p className="text-sm text-muted-foreground leading-tight">
            <span className="font-medium text-foreground">4.8</span> en Google
            <span className="mx-1.5 text-border">|</span>
            Puerto de Blanes
          </p>
        </div>
      </div>
    </div>
  );
}
