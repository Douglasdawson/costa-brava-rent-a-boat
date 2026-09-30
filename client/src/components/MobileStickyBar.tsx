import { useCallback, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { useTranslations } from "@/lib/translations";
import { useThrottledScroll } from "@/hooks/useThrottledScroll";

interface MobileStickyBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fixed bottom CTA bar for phones/tablets (hidden from lg). Renders its own
 * spacer so the bar never covers the end of the page. `data-sticky-cta` lets
 * WhatsAppFloatingButton and ScrollToTop lift themselves above it.
 */
export function MobileStickyBar({ children, className = "" }: MobileStickyBarProps) {
  return (
    <>
      <div
        data-sticky-cta
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-6px_24px_-8px_hsl(215_45%_20%/0.3)] backdrop-blur lg:hidden ${className}`}
      >
        <div className="mx-auto max-w-md">{children}</div>
      </div>
      <div className="h-20 lg:hidden" />
    </>
  );
}

// Past the hero, whose own CTA would otherwise be duplicated on screen.
const BOOKING_BAR_SCROLL_THRESHOLD = 600;

/** Sticky bar with a single primary CTA that opens the booking modal. */
export function BookingStickyBar() {
  const t = useTranslations();
  const { openBookingModal, isOpen } = useBookingModal();
  const [pastHero, setPastHero] = useState(false);
  const handleScroll = useCallback(
    (scrollY: number) => setPastHero(scrollY > BOOKING_BAR_SCROLL_THRESHOLD),
    []
  );
  useThrottledScroll(handleScroll);

  if (!pastHero || isOpen) return null;
  return (
    <MobileStickyBar>
      <Button
        onClick={() => openBookingModal()}
        className="w-full bg-cta hover:bg-cta/90 text-cta-foreground rounded-full min-h-12 text-base btn-elevated"
        data-testid="button-sticky-book"
      >
        {t.nav.bookNow}
      </Button>
    </MobileStickyBar>
  );
}
