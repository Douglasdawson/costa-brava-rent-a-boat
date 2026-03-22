import { useState, useEffect, useCallback, useRef } from "react";
import { X, Gift } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { trackExitIntentShown, trackExitIntentCtaClick } from "@/utils/analytics";

function isCookieBannerVisible(): boolean {
  return !localStorage.getItem("cookieConsent");
}

function isMobileNavOpen(): boolean {
  const btn = document.querySelector<HTMLElement>('[data-testid="button-mobile-menu"]');
  return btn?.getAttribute("aria-expanded") === "true";
}

function isAnyModalOpen(): boolean {
  return document.body.style.overflow === "hidden";
}

const EXIT_INTENT_EXCLUDED_SLUGS = [
  "privacy-policy", "politica-privacidad", "politique-confidentialite", "datenschutz", "privacybeleid", "informativa-privacy", "politica-privacitat", "politika-konfidentsialnosti",
  "terms-conditions", "terminos-condiciones", "conditions-generales", "agb", "algemene-voorwaarden", "termini-condizioni", "termes-condicions", "usloviya-ispolzovaniya",
  "cookies-policy", "politica-cookies", "politique-cookies", "cookie-richtlinie", "cookiebeleid", "informativa-cookie", "politika-cookie",
  "condiciones-generales", "general-conditions", "conditions-de-reservation", "allgemeine-bedingungen", "condicions-generals", "obshchie-usloviya",
  "accesibilidad", "accessibility", "accessibilite", "barrierefreiheit", "toegankelijkheid", "accessibilita", "accessibilitat", "dostupnost",
  "booking", "cancel", "login", "onboarding", "crm",
];

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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleDismiss = useCallback(() => {
    setShow(false);
    setDismissed(true);
    document.body.style.overflow = "";
  }, []);

  const tryShow = useCallback(() => {
    if (dismissed) return;
    if (sessionStorage.getItem("exitIntentShown")) return;
    if (isCookieBannerVisible()) return;
    if (isExcludedPage()) return;
    if (isMobileNavOpen()) return;
    if (isAnyModalOpen()) return;
    setShow(true);
    sessionStorage.setItem("exitIntentShown", "true");
    document.body.style.overflow = "hidden";
    trackExitIntentShown();
  }, [dismissed]);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0) tryShow();
  }, [tryShow]);

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

  // Mobile: show after 50s (only if cookie banner dismissed and nav/modals closed)
  useEffect(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile) return;

    const timer = setTimeout(() => {
      // Extra safety: re-check nav and any blocking UI at fire time
      if (isMobileNavOpen() || isAnyModalOpen()) return;
      tryShow();
    }, 50000);

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

  const handleBookNow = () => {
    setShow(false);
    setDismissed(true);
    document.body.style.overflow = "";
    trackExitIntentCtaClick();
    openBookingModal(undefined, { coupon: "BIENVENIDO10" });
  };

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
          className="absolute top-4 right-4 text-muted-foreground/60 hover:text-muted-foreground z-10"
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
            <Gift className="w-8 h-8 text-cta" />
          </div>

          <h3 id="exit-intent-title" className="font-heading text-2xl font-medium text-foreground mb-2">
            {t.exitIntent?.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            {t.exitIntent?.subtitle}
          </p>

          {/* Discount code display */}
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-xs text-muted-foreground mb-1">{t.exitIntent?.useCode}</p>
            <p className="font-heading text-2xl font-bold text-foreground tracking-wider">BIENVENIDO10</p>
            <p className="text-xs text-muted-foreground mt-1">{t.exitIntent?.validFirstBooking}</p>
          </div>

          <button
            onClick={handleBookNow}
            className="w-full bg-cta hover:bg-cta/90 text-white rounded-full py-3.5 font-medium cta-pulse cta-hover-lift"
            tabIndex={show ? 0 : -1}
          >
            {t.exitIntent?.bookNow}
          </button>

          <button
            onClick={handleDismiss}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={show ? 0 : -1}
          >
            {t.exitIntent?.noThanks}
          </button>
        </div>
      </div>
    </div>
  );
}
