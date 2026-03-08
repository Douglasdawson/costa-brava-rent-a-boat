import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslations } from "@/lib/translations";

// Season operational dates (based on real business data from pricing.ts)
const SEASON_START_MONTH = 4; // April
const SEASON_END_MONTH = 10; // October
const SPRING_END_MONTH = 6; // June 1st marks end of spring pricing
const PEAK_START_MONTH = 6; // June

type SeasonPhase = "offseason" | "early" | "peak" | "end";

function getSeasonPhase(now: Date): SeasonPhase {
  const month = now.getMonth() + 1; // 1-12
  if (month >= 11 || month <= 3) return "offseason";
  if (month >= SEASON_START_MONTH && month <= 5) return "early";
  if (month === SEASON_END_MONTH) return "end";
  return "peak"; // June-September
}

function getCountdownTarget(phase: SeasonPhase, now: Date): Date {
  const year = now.getFullYear();
  switch (phase) {
    case "offseason":
      // Count down to April 1 of next year (or current year if Jan-Mar)
      const targetYear = now.getMonth() + 1 <= 3 ? year : year + 1;
      return new Date(targetYear, SEASON_START_MONTH - 1, 1);
    case "early":
      // Count down to June 1
      return new Date(year, SPRING_END_MONTH - 1, 1);
    case "peak":
      // Count down to October 31
      return new Date(year, SEASON_END_MONTH, 0); // Last day of October
    case "end":
      // Count down to October 31
      return new Date(year, SEASON_END_MONTH, 0);
  }
}

function formatCountdown(ms: number): { days: number; hours: number; minutes: number } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return { days, hours, minutes };
}

// Paths where the banner should NOT appear
const HIDDEN_PATHS = ["/admin", "/crm", "/reservar", "/login", "/onboarding"];

const STORAGE_KEY = "seasonBannerDismissed";

export function SeasonBanner() {
  const [location] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const t = useTranslations();

  const now = new Date();
  const phase = getSeasonPhase(now);
  const target = getCountdownTarget(phase, now);

  // Check if should be hidden on current path
  const shouldHide = HIDDEN_PATHS.some(p => location.startsWith(p));

  // Check sessionStorage for dismissal
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem(STORAGE_KEY);
    if (wasDismissed) setDismissed(true);
  }, []);

  // Live countdown timer
  useEffect(() => {
    const update = () => {
      const diff = target.getTime() - Date.now();
      setCountdown(formatCountdown(diff));
    };
    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [target.getTime()]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }, []);

  const handleCTA = useCallback(() => {
    const fleetSection = document.getElementById("fleet");
    if (fleetSection) {
      fleetSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#fleet";
    }
  }, []);

  if (shouldHide || dismissed) return null;

  const sb = t.seasonBanner;
  if (!sb) return null;

  const { days, hours, minutes } = countdown;

  // Build the message based on season phase
  let message = "";
  let ctaLabel = sb.viewBoats;
  let gradientClass = "";

  switch (phase) {
    case "offseason":
      message = sb.earlyBird
        .replace("{year}", String(target.getFullYear()))
        .replace("{days}", String(days));
      gradientClass = "from-[hsl(210,35%,25%)] to-[hsl(210,45%,35%)]";
      ctaLabel = sb.viewBoats;
      break;
    case "early":
      message = sb.springPrices;
      gradientClass = "from-[hsl(210,35%,25%)] to-[hsl(200,40%,40%)]";
      ctaLabel = sb.bookNow;
      break;
    case "peak":
      message = sb.daysLeft.replace("{n}", String(days));
      gradientClass = "from-[hsl(15,60%,45%)] to-[hsl(25,70%,55%)]";
      ctaLabel = sb.bookNow;
      break;
    case "end":
      message = `${sb.lastDays} - ${sb.dontMissIt}`;
      gradientClass = "from-[hsl(10,55%,40%)] to-[hsl(20,65%,50%)]";
      ctaLabel = sb.bookNow;
      break;
  }

  const countdownDisplay = `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;

  return (
    <div
      className={`w-full bg-gradient-to-r ${gradientClass} text-white relative z-40`}
      role="banner"
      aria-label="Season information"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm min-h-[2.5rem]">
        {/* Message */}
        <span className="font-sans font-medium text-center">
          {message}
        </span>

        {/* Countdown */}
        <span className="font-mono text-xs bg-white/15 rounded px-2 py-0.5 tracking-wider whitespace-nowrap">
          {countdownDisplay}
        </span>

        {/* CTA Button */}
        <button
          onClick={handleCTA}
          className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-3 py-0.5 text-xs font-semibold whitespace-nowrap"
        >
          {ctaLabel}
          <ChevronRight className="h-3 w-3" />
        </button>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default SeasonBanner;
