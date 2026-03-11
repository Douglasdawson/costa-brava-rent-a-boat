import { createContext, useContext } from "react";

export interface BookingPrefillData {
  date?: string;
  time?: string;
  coupon?: string;
}

export interface BookingModalContextType {
  isOpen: boolean;
  openBookingModal: (boatId?: string, prefill?: BookingPrefillData) => void;
  closeBookingModal: () => void;
}

export const BookingModalContext = createContext<BookingModalContextType | null>(null);

// Safe fallback for HMR — avoids crash when provider temporarily unmounts
const fallback: BookingModalContextType = {
  isOpen: false,
  openBookingModal: () => {},
  closeBookingModal: () => {},
};

export function useBookingModal(): BookingModalContextType {
  const context = useContext(BookingModalContext);
  return context ?? fallback;
}
