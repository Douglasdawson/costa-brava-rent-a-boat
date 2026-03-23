import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { isMobileNavOpen, isAnyModalOpen } from "@/utils/overlay-guards";
import { trackSocialProofDismissed } from "@/utils/analytics";

interface SocialProofActivity {
  name: string;
  nationality: string;
  boatName: string;
  people: number;
  hours: number;
  minutesAgo: number;
}

const FLAGS: Record<string, string> = {
  ES: "\u{1F1EA}\u{1F1F8}", FR: "\u{1F1EB}\u{1F1F7}", DE: "\u{1F1E9}\u{1F1EA}", GB: "\u{1F1EC}\u{1F1E7}",
  NL: "\u{1F1F3}\u{1F1F1}", IT: "\u{1F1EE}\u{1F1F9}", PT: "\u{1F1F5}\u{1F1F9}", BE: "\u{1F1E7}\u{1F1EA}",
  CH: "\u{1F1E8}\u{1F1ED}", AT: "\u{1F1E6}\u{1F1F9}", US: "\u{1F1FA}\u{1F1F8}", RU: "\u{1F1F7}\u{1F1FA}",
  SE: "\u{1F1F8}\u{1F1EA}", NO: "\u{1F1F3}\u{1F1F4}", DK: "\u{1F1E9}\u{1F1F0}", PL: "\u{1F1F5}\u{1F1F1}",
  CZ: "\u{1F1E8}\u{1F1FF}", IE: "\u{1F1EE}\u{1F1EA}",
};

const COUNTRY_NAMES: Record<string, string> = {
  ES: "España", FR: "Francia", DE: "Alemania", GB: "Reino Unido",
  NL: "Países Bajos", IT: "Italia", PT: "Portugal", BE: "Bélgica",
  CH: "Suiza", AT: "Austria", US: "EE.UU.", RU: "Rusia",
  SE: "Suecia", NO: "Noruega", DK: "Dinamarca", PL: "Polonia",
  CZ: "Chequia", IE: "Irlanda",
};

const SIMULATED_ACTIVITIES: SocialProofActivity[] = [
  { name: "María", nationality: "ES", boatName: "Astec 480", people: 4, hours: 4, minutesAgo: 23 },
  { name: "Thomas", nationality: "DE", boatName: "Solar 450", people: 3, hours: 3, minutesAgo: 87 },
  { name: "Sophie", nationality: "FR", boatName: "Remus 450", people: 5, hours: 6, minutesAgo: 156 },
  { name: "James", nationality: "GB", boatName: "Pacific Craft 625", people: 6, hours: 8, minutesAgo: 312 },
  { name: "Laura", nationality: "NL", boatName: "Astec 400", people: 2, hours: 3, minutesAgo: 45 },
  { name: "Marco", nationality: "IT", boatName: "Mingolla Brava 19", people: 7, hours: 8, minutesAgo: 198 },
  { name: "Anna", nationality: "SE", boatName: "Trimarchi 57S", people: 4, hours: 6, minutesAgo: 267 },
  { name: "Pedro", nationality: "PT", boatName: "Remus 450", people: 3, hours: 4, minutesAgo: 134 },
];

const HIDDEN_PATHS = ["/admin", "/crm", "/reservar"];

const SESSION_KEY = "socialProofCount";
const MAX_TOASTS_PER_SESSION = 4;
const INITIAL_DELAY_MS = 20_000;
const AUTO_DISMISS_MS = 5_000;
const MIN_INTERVAL_MS = 35_000;
const MAX_INTERVAL_MS = 50_000;

function getRandomInterval(): number {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
}

function formatTimeAgo(minutesAgo: number, t: ReturnType<typeof useTranslations>): string {
  const toast = t.socialProofToast;
  if (!toast) return "";

  if (minutesAgo < 60) {
    return toast.minutesAgo.replace("{n}", String(minutesAgo));
  }
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) {
    return toast.hoursAgo.replace("{n}", String(hours));
  }
  const days = Math.floor(hours / 24);
  if (days <= 7) {
    return toast.daysAgo.replace("{n}", String(days));
  }
  return toast.recently;
}

export function SocialProofToast() {
  const [location] = useLocation();
  const t = useTranslations();
  const [activities, setActivities] = useState<SocialProofActivity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [animState, setAnimState] = useState<"entering" | "visible" | "exiting">("entering");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if we should show on this path
  const shouldShow = !HIDDEN_PATHS.some((p) => location.startsWith(p));

  // Use simulated activities with randomized order and times
  useEffect(() => {
    const shuffled = [...SIMULATED_ACTIVITIES].sort(() => Math.random() - 0.5);
    // Randomize minutesAgo slightly so they feel fresh each session
    const randomized = shuffled.map(a => ({
      ...a,
      minutesAgo: Math.floor(a.minutesAgo * (0.7 + Math.random() * 0.6)),
    }));
    setActivities(randomized);
  }, []);

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
    if (activities.length === 0) return;
    if (isMobileNavOpen() || isAnyModalOpen()) return;

    setCurrentIndex((prev) => {
      const next = prev >= activities.length - 1 ? 0 : prev + 1;
      return next;
    });

    setVisible(true);
    setAnimState("entering");

    // Trigger enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimState("visible");
      });
    });

    incrementSessionCount();

    // Auto-dismiss after 5 seconds
    if (dismissRef.current) clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => {
      dismissToast();
    }, AUTO_DISMISS_MS);
  }, [activities, getSessionCount, incrementSessionCount, dismissToast]);

  // Schedule toasts
  useEffect(() => {
    if (!shouldShow || activities.length === 0) return;
    if (getSessionCount() >= MAX_TOASTS_PER_SESSION) return;

    // Initial delay for the first toast
    timerRef.current = setTimeout(() => {
      showNextToast();

      // Schedule subsequent toasts
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
  }, [shouldShow, activities, showNextToast, getSessionCount]);

  if (!shouldShow || !visible || activities.length === 0) return null;

  const activity = activities[currentIndex];
  const flag = FLAGS[activity.nationality] || "";
  const countryName = COUNTRY_NAMES[activity.nationality] || activity.nationality;
  const toast = t.socialProofToast;
  const bookedText = toast?.booked || "Reservo";
  const forPeopleText = toast?.forPeople?.replace("{n}", String(activity.people)) || `para ${activity.people} personas`;
  const fromText = toast?.from || "de";
  const timeAgoText = formatTimeAgo(activity.minutesAgo, t);

  // Animation styles (transition is handled by .social-proof-transition CSS class
  // so that @media (prefers-reduced-motion: reduce) can override it)
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
          {/* Flag */}
          <span className="text-2xl leading-none mt-0.5 flex-shrink-0" aria-hidden="true">
            {flag}
          </span>

          {/* Content */}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">
              {activity.name} {fromText} {countryName}
            </p>
            <p className="text-sm text-muted-foreground leading-tight mt-0.5">
              {bookedText} <span className="font-medium text-foreground">{activity.boatName}</span> {forPeopleText}
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
