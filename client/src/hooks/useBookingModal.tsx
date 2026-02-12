import { createContext, useContext, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslations } from "@/lib/translations";
import BookingFormWidget from "@/components/BookingFormWidget";

interface BookingModalContextType {
  openBookingModal: (boatId?: string) => void;
  closeBookingModal: () => void;
}

const BookingModalContext = createContext<BookingModalContextType | null>(null);

export function BookingModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBoatId, setSelectedBoatId] = useState<string | undefined>(undefined);
  const t = useTranslations();

  const openBookingModal = useCallback((boatId?: string) => {
    setSelectedBoatId(boatId);
    setIsOpen(true);
  }, []);

  const closeBookingModal = useCallback(() => {
    setIsOpen(false);
    setSelectedBoatId(undefined);
  }, []);

  return (
    <BookingModalContext.Provider value={{ openBookingModal, closeBookingModal }}>
      {children}

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          closeBookingModal();
        }
      }}>
        <DialogContent className="!max-w-none md:!max-w-4xl !w-full md:!w-[95vw] !h-[100dvh] md:!h-auto md:!max-h-[85vh] !rounded-none md:!rounded-lg overflow-y-auto p-3 sm:p-4 md:p-6 !left-0 md:!left-1/2 !top-0 md:!top-1/2 !translate-x-0 md:!-translate-x-1/2 !translate-y-0 md:!-translate-y-1/2">
          <DialogHeader className="space-y-1 py-4 sm:py-3">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
              {t.booking.title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 text-center">
              {t.booking.modalSubtitle}
            </DialogDescription>
          </DialogHeader>
          <BookingFormWidget
            preSelectedBoatId={selectedBoatId}
            onClose={closeBookingModal}
            hideHeader={true}
          />
        </DialogContent>
      </Dialog>
    </BookingModalContext.Provider>
  );
}

export function useBookingModal(): BookingModalContextType {
  const context = useContext(BookingModalContext);
  if (!context) {
    throw new Error("useBookingModal must be used within a BookingModalProvider");
  }
  return context;
}
