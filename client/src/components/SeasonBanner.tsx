import { useState, useEffect, useCallback } from "react";
import { X, Anchor, ChevronRight, Users, Copy, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/useBookingModal";

const SEASON_START_MONTH = 4;
const SEASON_END_MONTH = 10;
const SPRING_END_MONTH = 6;

type SeasonPhase = "offseason" | "early" | "peak" | "end";

function getSeasonPhase(now: Date): SeasonPhase {
  const month = now.getMonth() + 1;
  if (month >= 11 || month <= 3) return "offseason";
  if (month >= SEASON_START_MONTH && month <= 5) return "early";
  if (month === SEASON_END_MONTH) return "end";
  return "peak";
}

function getCountdownTarget(phase: SeasonPhase, now: Date): Date {
  const year = now.getFullYear();
  switch (phase) {
    case "offseason": {
      const targetYear = now.getMonth() + 1 <= 3 ? year : year + 1;
      return new Date(targetYear, SEASON_START_MONTH - 1, 1);
    }
    case "early":
      return new Date(year, SPRING_END_MONTH - 1, 1);
    case "peak":
      return new Date(year, SEASON_END_MONTH, 0);
    case "end":
      return new Date(year, SEASON_END_MONTH, 0);
  }
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const HIDDEN_PATHS = ["/admin", "/crm", "/reservar", "/login", "/onboarding"];
const STORAGE_KEY = "seasonPopupSeen";
const SHOW_DELAY_MS = 2500;

export function SeasonBanner() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [copied, setCopied] = useState(false);
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();

  const now = new Date();
  const phase = getSeasonPhase(now);
  const target = getCountdownTarget(phase, now);
  const shouldHide = HIDDEN_PATHS.some(p => location.startsWith(p));

  useEffect(() => {
    const wasSeen = localStorage.getItem(STORAGE_KEY);
    if (wasSeen || shouldHide) return;
    const timer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setAnimateIn(true));
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldHide]);

  useEffect(() => {
    if (!visible) return;
    const update = () => setCountdown(formatCountdown(target.getTime() - Date.now()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [visible, target.getTime()]);

  const handleDismiss = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(STORAGE_KEY, "1");
    }, 300);
  }, []);

  const handleCTA = useCallback(() => {
    // Mark as seen immediately
    localStorage.setItem(STORAGE_KEY, "1");
    setAnimateIn(false);

    setTimeout(() => {
      setVisible(false);

      if (phase === "offseason") {
        // Navigate to homepage first if not there, then scroll
        if (window.location.pathname !== "/") {
          window.location.href = "/#fleet";
          return;
        }
        // Already on homepage — scroll to fleet
        const fleet = document.getElementById("fleet");
        if (fleet) {
          fleet.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        openBookingModal();
      }
    }, 300);
  }, [phase, openBookingModal]);

  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleDismiss(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [visible, handleDismiss]);

  if (!visible) return null;

  const sb = t.seasonBanner;
  if (!sb) return null;

  const { days, hours, minutes, seconds } = countdown;

  let headline = "";
  let subtitle = "";
  let ctaLabel = "";
  let scarcityText = "";
  let priceAnchor = "";

  switch (phase) {
    case "offseason":
      headline = `Temporada ${target.getFullYear()}`;
      subtitle = sb.earlyBird.replace("{year}", String(target.getFullYear())).replace("{days}", String(days));
      ctaLabel = "Elige tu barco";
      scarcityText = "Plazas limitadas para el verano";
      priceAnchor = "Desde 70\u20AC/dia";
      break;
    case "early":
      headline = sb.springPrices.split(" - ")[0] || sb.springPrices;
      subtitle = sb.springPrices;
      ctaLabel = "Reserva tu dia";
      scarcityText = "Las mejores fechas se agotan primero";
      priceAnchor = "Desde 70\u20AC/dia";
      break;
    case "peak":
      headline = sb.daysLeft.replace("{n}", String(days)).split(" - ")[0] || sb.daysLeft;
      subtitle = sb.daysLeft.replace("{n}", String(days));
      ctaLabel = "Ver fechas libres";
      scarcityText = "Ultimas plazas disponibles";
      priceAnchor = "Desde 70\u20AC/dia";
      break;
    case "end":
      headline = sb.lastDays;
      subtitle = sb.dontMissIt;
      ctaLabel = "Reservar ahora";
      scarcityText = "Temporada a punto de cerrar";
      priceAnchor = "Desde 70\u20AC/dia";
      break;
  }

  const units = [
    { value: days, label: "dias" },
    { value: hours, label: "horas" },
    { value: minutes, label: "min" },
    { value: seconds, label: "seg" },
  ];

  return (
    <>
      {/* Shimmer + pulse keyframes */}
      <style>{`
        @keyframes seasonShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes seasonPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168, 196, 221, 0.4); }
          50% { box-shadow: 0 0 20px 6px rgba(168, 196, 221, 0.25); }
        }
        @keyframes countdownPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .season-cta-btn {
          animation: seasonPulse 2.5s ease-in-out infinite;
        }
        .season-cta-btn:hover {
          animation: none;
        }
        .countdown-tick {
          animation: countdownPop 0.3s ease-out;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
          animateIn ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
        }`}
        onClick={handleDismiss}
        role="dialog"
        aria-modal="true"
        aria-label="Season information"
      >
        <div
          className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            animateIn ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
          }`}
          style={{ background: "linear-gradient(135deg, hsl(210 40% 16%) 0%, hsl(210 45% 24%) 50%, hsl(200 35% 20%) 100%)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 text-white/40 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="px-6 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10 text-center">
            {/* Anchor icon */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-white/15 mb-5">
              <Anchor className="w-6 h-6 text-[#A8C4DD]" />
            </div>

            {/* Headline */}
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
              {headline}
            </h2>

            {/* Subtitle */}
            <p className="text-white/60 text-sm sm:text-base font-light mb-6 max-w-xs mx-auto leading-relaxed">
              {subtitle}
            </p>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
              {units.map((unit) => (
                <div key={unit.label} className="flex flex-col items-center">
                  <div className="bg-white/10 rounded-xl w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] flex items-center justify-center">
                    <span key={unit.value} className="countdown-tick font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
                      {String(unit.value).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest mt-2 font-medium">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Scarcity line */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-amber-400/80" />
              <span className="text-amber-400/80 text-xs font-medium tracking-wide">
                {scarcityText}
              </span>
            </div>

            {/* Price anchor */}
            <p className="text-white/50 text-xs mb-4">
              {priceAnchor} · Gasolina incluida
            </p>

            {/* Discount code */}
            <div className="mb-6">
              <p className="text-white/50 text-[11px] mb-2 tracking-wide">10% de descuento con el codigo:</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("BIENVENIDO10");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2 hover:bg-white/15 transition-colors group"
              >
                <span className="font-mono text-sm font-bold text-white tracking-widest">BIENVENIDO10</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
                )}
              </button>
            </div>

            {/* CTA Button with pulse glow + shimmer */}
            <button
              onClick={handleCTA}
              className="season-cta-btn relative inline-flex items-center gap-2 bg-cta hover:bg-cta/85 text-white rounded-full px-10 py-4 text-base font-semibold transition-all hover:scale-[1.03] active:scale-[0.98] overflow-hidden"
            >
              {/* Shimmer overlay */}
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                  animation: "seasonShimmer 3s ease-in-out infinite",
                }}
              />
              <span className="relative z-10 flex items-center gap-2">
                {ctaLabel}
                <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            {/* Dismiss text */}
            <p className="text-white/25 text-xs mt-5 cursor-pointer hover:text-white/45 transition-colors" onClick={handleDismiss}>
              Ahora no, gracias
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default SeasonBanner;
