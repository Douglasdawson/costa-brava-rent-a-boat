import { useState, useEffect, useCallback, useRef } from "react";
import { X, Gift } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";

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
  }, []);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger when mouse exits through the top of the viewport
    if (e.clientY <= 0 && !dismissed) {
      // Check if already shown in this session
      const shown = sessionStorage.getItem("exitIntentShown");
      if (!shown) {
        setShow(true);
        sessionStorage.setItem("exitIntentShown", "true");
      }
    }
  }, [dismissed]);

  useEffect(() => {
    // Only add listener after a delay (don't show immediately)
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 15000); // 15 second delay before enabling

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

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
    openBookingModal(undefined, { coupon: "BIENVENIDO10" });
  };

  // Always render with CSS-based visibility to avoid CLS from DOM insertion/removal.
  // Using opacity + pointer-events instead of conditional mounting ensures no layout shift.
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${
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
            className="w-full bg-cta hover:bg-cta/90 text-white rounded-full py-3.5 font-medium transition-colors cta-pulse"
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
