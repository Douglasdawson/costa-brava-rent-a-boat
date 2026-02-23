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
import { trackBookingFormOpen } from "@/utils/analytics";

export interface BookingPrefillData {
  date?: string;
  time?: string;
}

interface BookingModalContextType {
  isOpen: boolean;
  openBookingModal: (boatId?: string, prefill?: BookingPrefillData) => void;
  closeBookingModal: () => void;
}

const BookingModalContext = createContext<BookingModalContextType | null>(null);

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
        <DialogContent className="!max-w-none md:!max-w-xl !w-full md:!w-[600px] !h-[100dvh] md:!h-[88vh] !rounded-none md:!rounded-xl !p-0 !flex !flex-col overflow-hidden !left-0 md:!left-1/2 !top-0 md:!top-1/2 !translate-x-0 md:!-translate-x-1/2 !translate-y-0 md:!-translate-y-1/2">
          <DialogHeader className="space-y-1 py-4 px-4 sm:px-6 flex-shrink-0 border-b border-gray-100">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
              {t.booking.title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 text-center">
              {t.booking.modalSubtitle}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <BookingFormWidget
              preSelectedBoatId={selectedBoatId}
              prefillDate={prefillData?.date}
              prefillTime={prefillData?.time}
              onClose={closeBookingModal}
            />
          </div>
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
