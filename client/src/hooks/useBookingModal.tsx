import { useState, useCallback, lazy, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

  return (
    <BookingModalContext.Provider value={{ isOpen, openBookingModal, closeBookingModal }}>
      {children}

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          closeBookingModal();
        }
      }}>
        <DialogContent className="!max-w-none md:!max-w-2xl !w-full md:!w-[calc(100vw-48px)] lg:!w-[680px] xl:!w-[760px] !h-[100dvh] md:!h-[90vh] !rounded-none md:!rounded-2xl !p-0 !gap-0 !flex !flex-col overflow-hidden !left-0 md:!left-1/2 !top-0 md:!top-1/2 !translate-x-0 md:!-translate-x-1/2 !translate-y-0 md:!-translate-y-1/2 pt-safe pb-safe bg-background">
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
              prefillCoupon={prefillData?.coupon}
              onClose={closeBookingModal}
            />
          </Suspense>
        </DialogContent>
      </Dialog>
    </BookingModalContext.Provider>
  );
}
