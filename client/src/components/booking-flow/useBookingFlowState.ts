import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSeason } from "@shared/pricing";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { PHONE_PREFIXES, filterPhonePrefixes } from "@/utils/phone-prefixes";
import type { Boat } from "@shared/schema";
import type { BookingFlowProps, Customer, CustomerData, Quote, Duration, TimeSlot, Extra } from "./types";

const nationalities = [
  "Afgana", "Albanesa", "Alemana", "Andorrana", "Angoleña", "Argentina", "Armenia", "Australiana", "Austríaca",
  "Azerbaiyana", "Bahameña", "Bangladesí", "Barbadense", "Bareiní", "Belga", "Beliceña", "Beninesa", "Bielorrusa",
  "Boliviana", "Bosnia", "Botsuanesa", "Brasileña", "Británica", "Bruneana", "Búlgara", "Burkinesa", "Burundesa",
  "Caboverdiana", "Camboyana", "Camerunesa", "Canadiense", "Catarí", "Chadiana", "Checa", "Chilena", "China", "Chipriota",
  "Colombiana", "Comorense", "Congoleña", "Coreana", "Costarricense", "Croata", "Cubana", "Danesa", "Dominicana", "Ecuatoriana",
  "Egipcia", "Salvadoreña", "Emiratí", "Eritrea", "Escocesa", "Eslovaca", "Eslovena", "Española", "Estadounidense", "Estonia",
  "Etíope", "Filipina", "Finlandesa", "Fiyiana", "Francesa", "Gabonesa", "Gambiana", "Georgiana", "Ghanesa", "Granadina",
  "Griega", "Guatemalteca", "Guineana", "Guyanesa", "Haitiana", "Hondureña", "Húngara", "India", "Indonesia", "Iraní",
  "Iraquí", "Irlandesa", "Islandesa", "Israelí", "Italiana", "Jamaicana", "Japonesa", "Jordana", "Kazaja", "Keniana",
  "Kirguisa", "Kuwaití", "Laosiana", "Lesothense", "Letona", "Libanesa", "Liberiana", "Libia", "Liechtensteiniana",
  "Lituana", "Luxemburguesa", "Macedónica", "Madagascarense", "Malasia", "Malauí", "Maldiva", "Maliense", "Maltesa", "Marroquí",
  "Marshallesa", "Mauriciana", "Mauritana", "Mexicana", "Moldava", "Monegasca", "Mongola", "Montenegrina", "Mozambiqueña",
  "Namibia", "Nauruana", "Nepalesa", "Nicaragüense", "Nigerina", "Nigeriana", "Norcoreana", "Noruega", "Neozelandesa", "Omaní",
  "Pakistaní", "Palauana", "Palestina", "Panameña", "Paraguaya", "Peruana", "Polaca", "Portuguesa", "Puertorriqueña",
  "Rumana", "Rusa", "Ruandesa", "Salomonense", "Salvadoreña", "Samoana", "Sanmarinense", "Santotomense", "Saudí", "Senegalesa",
  "Serbia", "Seychellense", "Sierraleonesa", "Singapurense", "Siria", "Somalí", "Srilanquesa", "Suaza", "Sudafricana", "Sudanesa",
  "Sueca", "Suiza", "Surinamesa", "Tailandesa", "Tanzana", "Tayika", "Timorense", "Togolesa", "Tongana", "Trinitense",
  "Tunecina", "Turca", "Turcomena", "Tuvaluana", "Ucraniana", "Ugandesa", "Uruguaya", "Uzbeka", "Vanuatuense", "Vaticana",
  "Venezolana", "Vietnamita", "Yemení", "Yibutiana", "Zambiana", "Zimbabuense"
];

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 9; hour <= 17; hour++) {
    slots.push({
      id: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour.toString().padStart(2, '0')}:00`,
      available: true
    });
  }
  return slots;
}

export function useBookingFlowState(props: BookingFlowProps) {
  const {
    boatId = "astec-480",
    initialDate = "",
    initialDuration = "2h",
    initialTime = "",
    initialCustomerData = {}
  } = props;

  const { toast } = useToast();
  const t = useTranslations();

  // Core state
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedBoat, setSelectedBoat] = useState(boatId);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [duration, setDuration] = useState(initialDuration);
  const [licenseFilter, setLicenseFilter] = useState<"all" | "with" | "without">("all");
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [customerData, setCustomerData] = useState<CustomerData>({
    customerName: initialCustomerData.firstName || "",
    customerSurname: initialCustomerData.lastName || "",
    customerEmail: initialCustomerData.email || "",
    customerPhone: initialCustomerData.phoneNumber || "",
    phonePrefix: initialCustomerData.phonePrefix || "+34",
    customerNationality: "",
    numberOfPeople: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [phonePrefixSearch, setPhonePrefixSearch] = useState("");
  const [showPhonePrefixDropdown, setShowPhonePrefixDropdown] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Auth & profile
  const { isAuthenticated } = useAuth();
  const { data: customerProfile } = useQuery<Customer>({
    queryKey: ["/api/customer/profile"],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (customerProfile) {
      setCustomerData(prev => ({
        customerName: prev.customerName || customerProfile.firstName || "",
        customerSurname: prev.customerSurname || customerProfile.lastName || "",
        customerEmail: prev.customerEmail || customerProfile.email || "",
        customerPhone: prev.customerPhone || customerProfile.phoneNumber || "",
        phonePrefix: prev.phonePrefix !== "+34" ? prev.phonePrefix : (customerProfile.phonePrefix || "+34"),
        customerNationality: prev.customerNationality || customerProfile.nationality || "",
        numberOfPeople: prev.numberOfPeople
      }));
    }
  }, [customerProfile]);

  // Fetch boats
  const { data: boats = [] } = useQuery<Boat[]>({
    queryKey: ['/api/boats']
  });

  const timeSlots = generateTimeSlots();

  const availableExtras: Extra[] = [
    { id: "parking", name: t.booking?.extrasDetails?.parking?.name || "Parking dentro del puerto", price: 10, description: t.booking?.extrasDetails?.parking?.description || "Parking seguro en el puerto" },
    { id: "cooler", name: t.booking?.extrasDetails?.cooler?.name || "Nevera", price: 5, description: t.booking?.extrasDetails?.cooler?.description || "Nevera con hielo" },
    { id: "snorkel", name: t.booking?.extrasDetails?.snorkel?.name || "Equipo snorkel", price: 7.5, description: t.booking?.extrasDetails?.snorkel?.description || "Equipo de snorkel completo" },
    { id: "paddle", name: t.booking?.extrasDetails?.paddle?.name || "Tabla de paddlesurf", price: 25, description: t.booking?.extrasDetails?.paddle?.description || "Tabla de paddle surf" },
    { id: "seascooter", name: t.booking?.extrasDetails?.seascooter?.name || "Seascooter", price: 50, description: t.booking?.extrasDetails?.seascooter?.description || "Scooter acuático" }
  ];

  // Debounce search values so filtering only runs after 200ms of inactivity,
  // while the input fields remain immediately responsive to typing
  const debouncedPhoneSearch = useDebounce(phonePrefixSearch, 200);
  const debouncedNationalitySearch = useDebounce(nationalitySearch, 200);

  const filteredPhoneCountries = useMemo(
    () => filterPhonePrefixes(PHONE_PREFIXES, debouncedPhoneSearch),
    [debouncedPhoneSearch]
  );

  const filteredNationalities = useMemo(
    () => nationalities.filter(nationality =>
      nationality.toLowerCase().includes(debouncedNationalitySearch.toLowerCase())
    ),
    [debouncedNationalitySearch]
  );

  const allBoats = boats || [];

  const availableBoats = useMemo(() => {
    if (licenseFilter === "all") return allBoats;
    return allBoats.filter((boat: Boat) => {
      const requiresLicense = boat.requiresLicense !== undefined
        ? !!boat.requiresLicense
        : boat.subtitle?.includes("Con Licencia");
      if (licenseFilter === "with") return requiresLicense;
      if (licenseFilter === "without") return !requiresLicense;
      return true;
    });
  }, [allBoats, licenseFilter]);

  const getMaxCapacity = (bId: string): number => {
    const boat = availableBoats.find((b: Boat) => b.id === bId);
    if (boat && boat.capacity) return boat.capacity;
    switch (bId) {
      case "astec-400": return 4;
      case "solar-450": case "remus-450": case "astec-480": case "remus-450-ii": return 5;
      case "pacific-craft-625": case "trimarchi-57s": return 7;
      case "mingolla-brava-19": return 6;
      default: return 4;
    }
  };

  const maxCapacity = getMaxCapacity(selectedBoat);

  useEffect(() => {
    if (customerData.numberOfPeople > maxCapacity && maxCapacity > 0) {
      setCustomerData(prev => ({...prev, numberOfPeople: Math.min(prev.numberOfPeople, maxCapacity)}));
    }
  }, [selectedBoat, maxCapacity]);

  const durations: Duration[] = useMemo(() => {
    if (!selectedBoat || !selectedDate) {
      return [
        { id: "1h", label: t.booking.oneHour, price: 70 },
        { id: "2h", label: t.booking.twoHours, price: 80 },
        { id: "3h", label: t.booking.threeHours, price: 90 },
        { id: "4h", label: t.booking.fourHours, price: 120 },
        { id: "6h", label: t.booking.sixHours, price: 150 },
        { id: "8h", label: t.booking.eightHours, price: 180 }
      ];
    }
    try {
      const boat = availableBoats.find((b: Boat) => b.id === selectedBoat);
      if (!boat) throw new Error(`Boat ${selectedBoat} not found`);

      if (boat.pricing) {
        const season = getSeason(new Date(selectedDate));
        const seasonPrices = boat.pricing[season]?.prices;
        if (!seasonPrices) throw new Error(`No pricing found for season ${season}`);
        return [
          { id: "1h", label: t.booking.oneHour, price: seasonPrices["1h"] || 70 },
          { id: "2h", label: t.booking.twoHours, price: seasonPrices["2h"] || 80 },
          { id: "3h", label: t.booking.threeHours, price: seasonPrices["3h"] || 90 },
          { id: "4h", label: t.booking.fourHours, price: seasonPrices["4h"] || 120 },
          { id: "6h", label: t.booking.sixHours, price: seasonPrices["6h"] || 150 },
          { id: "8h", label: t.booking.eightHours, price: seasonPrices["8h"] || 180 }
        ];
      } else if (boat.pricePerHour) {
        const basePrice = parseFloat(boat.pricePerHour);
        return [
          { id: "1h", label: t.booking.oneHour, price: basePrice },
          { id: "2h", label: t.booking.twoHours, price: Math.round(basePrice * 1.8) },
          { id: "3h", label: t.booking.threeHours, price: Math.round(basePrice * 2.5) },
          { id: "4h", label: t.booking.fourHours, price: Math.round(basePrice * 3.2) },
          { id: "6h", label: t.booking.sixHours, price: Math.round(basePrice * 4.5) },
          { id: "8h", label: t.booking.eightHours, price: Math.round(basePrice * 5.8) },
        ];
      } else {
        throw new Error(`Boat ${selectedBoat} has no pricing data`);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error calculating durations:', error);
      return [
        { id: "1h", label: t.booking.oneHour, price: 70 },
        { id: "2h", label: t.booking.twoHours, price: 80 },
        { id: "3h", label: t.booking.threeHours, price: 90 },
        { id: "4h", label: t.booking.fourHours, price: 120 },
        { id: "6h", label: t.booking.sixHours, price: 150 },
        { id: "8h", label: t.booking.eightHours, price: 180 }
      ];
    }
  }, [selectedBoat, selectedDate, availableBoats, t.booking]);

  const getAvailableDurations = (startTime: string): Duration[] => {
    if (!startTime) return durations;
    const [startHour] = startTime.split(':').map(Number);
    const maxReturnHour = 19;
    return durations.filter(dur => {
      const durationHours = parseInt(dur.id.replace('h', ''));
      return startHour + durationHours <= maxReturnHour;
    });
  };

  const updateExtra = (extraId: string, increment: boolean) => {
    setExtras(prev => ({
      ...prev,
      [extraId]: Math.max(0, (prev[extraId] || 0) + (increment ? 1 : -1))
    }));
  };

  const calculateTotal = () => {
    if (quote) return quote.total;
    const basePrice = durations.find(d => d.id === duration)?.price || 0;
    const extrasTotal = Object.entries(extras).reduce((total, [id, quantity]) => {
      const extra = availableExtras.find(e => e.id === id);
      return total + (extra ? extra.price * quantity : 0);
    }, 0);
    return basePrice + extrasTotal;
  };

  return {
    // State
    step, setStep,
    selectedDate, setSelectedDate,
    selectedBoat, setSelectedBoat,
    selectedTime, setSelectedTime,
    duration, setDuration,
    licenseFilter, setLicenseFilter,
    extras, updateExtra,
    customerData, setCustomerData,
    isLoading, setIsLoading,
    phonePrefixSearch, setPhonePrefixSearch,
    showPhonePrefixDropdown, setShowPhonePrefixDropdown,
    nationalitySearch, setNationalitySearch,
    showNationalityDropdown, setShowNationalityDropdown,
    quote, setQuote,
    holdId, setHoldId,
    paymentIntentId, setPaymentIntentId,
    isProcessingPayment, setIsProcessingPayment,
    // Derived
    availableBoats,
    availableExtras,
    durations,
    timeSlots,
    maxCapacity,
    filteredPhoneCountries,
    filteredNationalities,
    // Helpers
    getAvailableDurations,
    calculateTotal,
    t,
    toast,
  };
}

export type BookingFlowStateReturn = ReturnType<typeof useBookingFlowState>;
