import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/translations";
import { trackBookingFormOpen } from "@/utils/analytics";
import { BookingModalContext } from "./bookingModalContext";
import type { BookingPrefillData } from "./bookingModalContext";

// Re-export for backwards compatibility
export { useBookingModal } from "./bookingModalContext";
export type { BookingPrefillData } from "./bookingModalContext";

const BookingFormWidget = lazy(() => import("@/components/BookingFormWidget"));

export function BookingModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBoatId, setSelectedBoatId] = useState<string | undefined>(undefined);
  const [prefillData, setPrefillData] = useState<BookingPrefillData | undefined>(undefined);
  const t = useTranslations();

  const openBookingModal = useCallback((boatId?: string, prefill?: BookingPrefillData) => {
    trackBookingFormOpen(boatId);
    setSelectedBoatId(boatId);
    setPrefillData(prefill);
    setIsOpen(true);
    // Store booking-started signal for session-aware exit intent
    if (boatId) {
      try {
        sessionStorage.setItem("cbrb_bookingStarted", boatId);
      } catch { /* sessionStorage unavailable */ }
    }
  }, []);

  const closeBookingModal = useCallback(() => {
    setIsOpen(false);
    setSelectedBoatId(undefined);
    setPrefillData(undefined);
  }, []);

  // Memoize the context value so consumers don't re-render when the provider
  // re-renders for unrelated reasons. openBookingModal/closeBookingModal are
  // already stable via useCallback, so this only changes when isOpen flips.
  const contextValue = useMemo(
    () => ({ isOpen, openBookingModal, closeBookingModal }),
    [isOpen, openBookingModal, closeBookingModal],
  );

  return (
    <BookingModalContext.Provider value={contextValue}>
      {children}

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          closeBookingModal();
        }
      }}>
        <DialogPortal>
          <DialogOverlay />
          {/* Floating card, same pattern as BoatQuickView: margin all around and rounded
              corners at every size, never taller than the window. Fixed height (not h-fit):
              the six steps differ in content height, so a fitted card would make the header
              and the CTA jump on every step. Built on the Radix primitive instead of
              DialogContent so no `!important` has to undo its centring transform. Safe-area
              insets keep it clear of the notch and the home bar. */}
          <DialogPrimitive.Content
            tabIndex={-1}
            onOpenAutoFocus={e => {
              e.preventDefault();
              (e.currentTarget as HTMLElement).focus();
            }}
            className={cn(
              "booking-modal fixed z-50 m-auto flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground focus:outline-none",
              "top-[max(0.75rem,env(safe-area-inset-top))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] md:inset-6",
              "h-[min(56rem,calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] md:h-[min(56rem,calc(100dvh-3rem))]",
              "max-w-none md:max-w-4xl"
            )}
          >
            <DialogTitle className="sr-only">{t.booking.title}</DialogTitle>
            <DialogDescription className="sr-only">{t.booking.modalSubtitle}</DialogDescription>
            <Suspense fallback={
              <div className="flex flex-col gap-4 p-6 sm:p-8 animate-pulse" aria-hidden="true">
                <div className="h-1.5 w-full rounded-full bg-muted" />
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-32 w-full rounded-2xl bg-muted/60 mt-4" />
                <div className="h-24 w-full rounded-2xl bg-muted/60" />
                <div className="h-24 w-full rounded-2xl bg-muted/60" />
              </div>
            }>
              <BookingFormWidget
                preSelectedBoatId={selectedBoatId}
                prefillDate={prefillData?.date}
                prefillTime={prefillData?.time}
                prefillDuration={prefillData?.duration}
                onClose={closeBookingModal}
              />
            </Suspense>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </BookingModalContext.Provider>
  );
}
