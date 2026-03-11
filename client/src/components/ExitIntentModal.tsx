import { useState, useEffect, useCallback } from "react";
import { X, Gift } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useBookingModal } from "@/hooks/bookingModalContext";

export function ExitIntentModal() {
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
  };

  const handleBookNow = () => {
    setShow(false);
    setDismissed(true);
    openBookingModal(undefined, { coupon: "BIENVENIDO10" });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleDismiss}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          aria-label="Cerrar"
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

          <h3 className="font-heading text-2xl font-medium text-foreground mb-2">
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
          >
            {t.exitIntent?.bookNow}
          </button>

          <button
            onClick={handleDismiss}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.exitIntent?.noThanks}
          </button>
        </div>
      </div>
    </div>
  );
}
