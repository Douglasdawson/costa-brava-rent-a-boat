import { useState, useEffect, useCallback, useRef } from "react";
import { X, Gift, Copy, Check, HelpCircle, Anchor, ThumbsUp } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { trackExitIntentShown, trackExitIntentCtaClick, trackEvent } from "@/utils/analytics";
import { isMobileNavOpen, isAnyModalOpen, isCookieBannerVisible } from "@/utils/overlay-guards";
import { lockScroll, unlockScroll } from "@/utils/scroll-lock";
import { BOAT_DATA } from "@shared/boatData";

const EXIT_INTENT_EXCLUDED_SLUGS = [
  "privacy-policy", "politica-privacidad", "politique-confidentialite", "datenschutz", "privacybeleid", "informativa-privacy", "politica-privacitat", "politika-konfidentsialnosti",
  "terms-conditions", "terminos-condiciones", "conditions-generales", "agb", "algemene-voorwaarden", "termini-condizioni", "termes-condicions", "usloviya-ispolzovaniya",
  "cookies-policy", "politica-cookies", "politique-cookies", "cookie-richtlinie", "cookiebeleid", "informativa-cookie", "politika-cookie",
  "condiciones-generales", "general-conditions", "conditions-de-reservation", "allgemeine-bedingungen", "condicions-generals", "obshchie-usloviya",
  "accesibilidad", "accessibility", "accessibilite", "barrierefreiheit", "toegankelijkheid", "accessibilita", "accessibilitat", "dostupnost",
  "booking", "cancel", "login", "onboarding", "crm",
];

type ExitIntentVariant = "quiz" | "abandoned" | "quiz-result" | "default";

interface QuizResult {
  boatId: string;
  boatName: string;
}

function getBoatNameFromId(boatId: string): string {
  return BOAT_DATA[boatId]?.name ?? boatId;
}

/**
 * Determine which exit intent variant to show based on session signals.
 * Priority: quiz-result > abandoned > quiz > default
 */
function getExitIntentVariant(): { variant: ExitIntentVariant; boatId?: string; boatName?: string } {
  try {
    // 1. Quiz completed this session — show quiz-result variant
    const quizRaw = sessionStorage.getItem("cbrb_quizResult");
    if (quizRaw) {
      const parsed = JSON.parse(quizRaw) as QuizResult;
      if (parsed.boatId && parsed.boatName) {
        return { variant: "quiz-result", boatId: parsed.boatId, boatName: parsed.boatName };
      }
    }

    // 2. Booking started but not completed — show abandoned variant
    const bookingBoatId = sessionStorage.getItem("cbrb_bookingStarted");
    if (bookingBoatId) {
      return { variant: "abandoned", boatId: bookingBoatId, boatName: getBoatNameFromId(bookingBoatId) };
    }

    // 3. User has viewed boats but didn't start quiz or booking — show quiz variant
    const boatsViewed = parseInt(sessionStorage.getItem("cbrb_boatsViewed") || "0", 10);
    if (boatsViewed > 0) {
      return { variant: "quiz" };
    }
  } catch {
    // sessionStorage unavailable or parse error — fall through to default
  }

  return { variant: "default" };
}

function isExcludedPage(): boolean {
  const segments = window.location.pathname.split("/").filter(Boolean);
  const slug = segments[1] || "";
  return EXIT_INTENT_EXCLUDED_SLUGS.includes(slug);
}

export function ExitIntentModal() {
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const variantRef = useRef<ReturnType<typeof getExitIntentVariant>>({ variant: "default" });

  const handleDismiss = useCallback(() => {
    setShow(false);
    setDismissed(true);
    unlockScroll("exit-intent");
  }, []);

  const tryShow = useCallback(() => {
    if (dismissed) return;
    if (sessionStorage.getItem("exitIntentShown")) return;
    if (isCookieBannerVisible()) return;
    if (isExcludedPage()) return;
    if (isMobileNavOpen()) return;
    if (isAnyModalOpen()) return;

    // Determine variant at the moment of showing
    variantRef.current = getExitIntentVariant();

    setShow(true);
    sessionStorage.setItem("exitIntentShown", "true");
    lockScroll("exit-intent");
    trackExitIntentShown();
    trackEvent("exit_intent_variant", { variant: variantRef.current.variant });
  }, [dismissed]);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0) tryShow();
  }, [tryShow]);

  // Guarantee scroll unlock on unmount (e.g. client-side navigation while modal is open)
  useEffect(() => {
    return () => unlockScroll("exit-intent");
  }, []);

  // Desktop: mouseleave after 15s delay
  useEffect(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 15000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  // Mobile: show after 90s (only if cookie banner dismissed and nav/modals closed)
  useEffect(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile) return;

    const timer = setTimeout(() => {
      // Extra safety: re-check nav and any blocking UI at fire time
      if (isMobileNavOpen() || isAnyModalOpen()) return;
      tryShow();
    }, 90000);

    return () => clearTimeout(timer);
  }, [tryShow]);

  // Close on Escape key
  useEffect(() => {
    if (!show) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [show, handleDismiss]);

  // Focus management: focus first button on open, restore focus on close
  useEffect(() => {
    if (show) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        const closeBtn = modalRef.current?.querySelector('button');
        closeBtn?.focus();
      }, 100);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [show]);

  // Focus trap: cycle Tab within modal
  useEffect(() => {
    if (!show) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [show]);

  const { variant, boatId, boatName } = variantRef.current;

  const handleCtaClick = () => {
    setShow(false);
    setDismissed(true);
    unlockScroll("exit-intent");
    trackExitIntentCtaClick();

    switch (variant) {
      case "quiz":
        // Open quiz modal — dispatch custom event for the Hero component to catch
        window.dispatchEvent(new CustomEvent("cbrb:openQuiz"));
        break;
      case "abandoned":
        openBookingModal(boatId, { coupon: "BIENVENIDO10" });
        break;
      case "quiz-result":
        openBookingModal(boatId, { coupon: "BIENVENIDO10" });
        break;
      case "default":
      default:
        openBookingModal(undefined, { coupon: "BIENVENIDO10" });
        break;
    }
  };

  // Helper to interpolate {boat} placeholder in translation strings
  const interpolateBoat = (text: string | undefined, name?: string): string => {
    if (!text) return "";
    return name ? text.replace("{boat}", name) : text;
  };

  // Variant-specific content config
  const variantConfig = {
    quiz: {
      Icon: HelpCircle,
      title: t.exitIntent?.quizTitle,
      subtitle: t.exitIntent?.quizSubtitle,
      cta: t.exitIntent?.quizCta,
      showCoupon: false,
    },
    abandoned: {
      Icon: Anchor,
      title: t.exitIntent?.abandonedTitle,
      subtitle: interpolateBoat(t.exitIntent?.abandonedSubtitle, boatName),
      cta: t.exitIntent?.abandonedCta,
      showCoupon: true,
    },
    "quiz-result": {
      Icon: ThumbsUp,
      title: t.exitIntent?.quizResultTitle,
      subtitle: interpolateBoat(t.exitIntent?.quizResultSubtitle, boatName),
      cta: t.exitIntent?.quizResultCta,
      showCoupon: true,
    },
    default: {
      Icon: Gift,
      title: t.exitIntent?.title,
      subtitle: t.exitIntent?.subtitle,
      cta: t.exitIntent?.bookNow,
      showCoupon: true,
    },
  };

  const config = variantConfig[variant];
  const VariantIcon = config.Icon;

  // Always render with CSS-based visibility to avoid CLS from DOM insertion/removal.
  // Using opacity + pointer-events instead of conditional mounting ensures no layout shift.
  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-200 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal={show}
      aria-hidden={!show}
      aria-labelledby="exit-intent-title"
      onClick={handleDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative bg-background rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-transform duration-200 ${
          show ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-2 text-muted-foreground/60 hover:text-muted-foreground z-10"
          aria-label={t.a11y.close}
          tabIndex={show ? 0 : -1}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-cta to-cta/60" />

        {/* Content */}
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-cta/10 flex items-center justify-center">
            <VariantIcon className="w-8 h-8 text-cta" />
          </div>

          <h3 id="exit-intent-title" className="font-heading text-2xl font-medium text-foreground mb-2">
            {config.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            {config.subtitle}
          </p>

          {/* Discount code display — only for variants that offer a coupon */}
          {config.showCoupon && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-1">{t.exitIntent?.useCode}</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("BIENVENIDO10").then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="inline-flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 hover:bg-muted transition-colors group mt-1 mb-1"
                tabIndex={show ? 0 : -1}
              >
                <span className="font-heading text-2xl font-bold text-foreground tracking-wider">BIENVENIDO10</span>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </button>
              <p className="text-xs text-muted-foreground mt-1">{t.exitIntent?.validFirstBooking}</p>
            </div>
          )}

          <button
            onClick={handleCtaClick}
            className="w-full bg-cta hover:bg-cta/90 text-white rounded-full py-3.5 font-medium cta-pulse cta-hover-lift"
            tabIndex={show ? 0 : -1}
          >
            {config.cta}
          </button>

          <button
            onClick={handleDismiss}
            className="mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={show ? 0 : -1}
          >
            {t.exitIntent?.noThanks}
          </button>
        </div>
      </div>
    </div>
  );
}
