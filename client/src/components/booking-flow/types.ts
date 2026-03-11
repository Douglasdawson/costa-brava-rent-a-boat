import type { Boat } from "@shared/schema";

export interface BookingFlowProps {
  boatId?: string;
  onClose?: () => void;
  initialDate?: string;
  initialDuration?: string;
  initialTime?: string;
  initialCustomerData?: {
    firstName?: string;
    lastName?: string;
    phonePrefix?: string;
    phoneNumber?: string;
    email?: string;
  };
}

export interface Customer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phonePrefix: string;
  phoneNumber: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
}

export interface CustomerData {
  customerName: string;
  customerSurname: string;
  customerEmail: string;
  customerPhone: string;
  phonePrefix: string;
  customerNationality: string;
  numberOfPeople: number;
}

export interface Quote {
  season?: string;
  basePrice?: number;
  selectedExtras?: string[];
  extrasPrice?: number;
  deposit?: number;
  subtotal?: number;
  total?: number;
  duration?: string;
  numberOfPeople?: number;
  [key: string]: unknown;
}

export interface Duration {
  id: string;
  label: string;
  price: number;
}

export interface TimeSlot {
  id: string;
  label: string;
  available: boolean;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface BookingFlowState {
  step: number;
  setStep: (step: number) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedBoat: string;
  setSelectedBoat: (boatId: string) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  licenseFilter: "all" | "with" | "without";
  setLicenseFilter: (filter: "all" | "with" | "without") => void;
  extras: Record<string, number>;
  updateExtra: (extraId: string, increment: boolean) => void;
  customerData: CustomerData;
  setCustomerData: React.Dispatch<React.SetStateAction<CustomerData>>;
  isLoading: boolean;
  phonePrefixSearch: string;
  setPhonePrefixSearch: (search: string) => void;
  showPhonePrefixDropdown: boolean;
  setShowPhonePrefixDropdown: (show: boolean) => void;
  nationalitySearch: string;
  setNationalitySearch: (search: string) => void;
  showNationalityDropdown: boolean;
  setShowNationalityDropdown: (show: boolean) => void;
  quote: Quote | null;
  holdId: string | null;
  // Derived data
  availableBoats: Boat[];
  availableExtras: Extra[];
  durations: Duration[];
  timeSlots: TimeSlot[];
  maxCapacity: number;
  // Actions
  getAvailableDurations: (startTime: string) => Duration[];
  calculateTotal: () => number | undefined;
  createQuote: () => Promise<boolean>;
  handlePayment: () => Promise<void>;
}
