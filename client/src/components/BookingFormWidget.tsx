import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Package, Crown } from "lucide-react";
import SnorkelIcon from "@/components/icons/SnorkelIcon";
import SeascooterIcon from "@/components/icons/SeascooterIcon";
import ParkingIcon from "@/components/icons/ParkingIcon";
import PaddleSurfIcon from "@/components/icons/PaddleSurfIcon";
import NeveraIcon from "@/components/icons/NeveraIcon";
import BebidasIcon from "@/components/icons/BebidasIcon";
import { openWhatsApp } from "@/utils/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { trackBookingStarted } from "@/utils/analytics";
import { getStoredUtm } from "@/hooks/useUtmCapture";
import { BOAT_DATA, EXTRA_PACKS } from "@shared/boatData";
import { calculateExtrasPrice, calculatePackSavings, getAvailableDurationsForDate, type DurationOption } from "@shared/pricing";
import type { AutoDiscountResult } from "@shared/discounts";
import BookingWizardMobile from "@/components/BookingWizardMobile";
import BookingFormDesktop from "@/components/BookingFormDesktop";
import { BookingConfirmation } from "@/components/BookingConfirmation";
import { useIsMobile } from "@/hooks/use-mobile";
import { PHONE_PREFIXES, filterPhonePrefixes, findPrefixByCode } from "@/utils/phone-prefixes";
import { validateEmail, isValidEmail, validatePhone, validateRequired, validateBookingDate, getLocalISODate } from "@/utils/booking-validation";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
];

/** Availability data returned by GET /api/availability */
export interface SlotAvailability {
  availableSlots: { time: string; maxDuration: number }[];
  unavailableSlots: string[];
}

// Map icon name strings from boatData to Lucide icon components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Crown,
  Nevera: NeveraIcon,
  Snowflake: NeveraIcon,
  Snorkel: SnorkelIcon,
  Eye: SnorkelIcon,
  Seascooter: SeascooterIcon,
  Zap: SeascooterIcon,
  Parking: ParkingIcon,
  CircleParking: ParkingIcon,
  PaddleSurf: PaddleSurfIcon,
  Waves: PaddleSurfIcon,
  Bebidas: BebidasIcon,
  Beer: BebidasIcon,
};

interface BookingFormWidgetProps {
  preSelectedBoatId?: string;
  prefillDate?: string;
  prefillTime?: string;
  prefillCoupon?: string;
  onClose?: () => void;
  hideHeader?: boolean;
}

export default function BookingFormWidget({ preSelectedBoatId, prefillDate, prefillTime, prefillCoupon, onClose }: BookingFormWidgetProps) {
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+34");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("");
  const [preferredTime, setPreferredTime] = useState(prefillTime || "10:00");
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<"with" | "without">("without");
  const [selectedBoat, setSelectedBoat] = useState<string>(preSelectedBoatId || "");
  const [selectedDate, setSelectedDate] = useState(() => {
    if (prefillDate) return prefillDate;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSat = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
    const nextSat = new Date(today);
    nextSat.setDate(today.getDate() + daysUntilSat);
    const y = nextSat.getFullYear();
    const m = String(nextSat.getMonth() + 1).padStart(2, '0');
    const d = String(nextSat.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [selectedDuration, setSelectedDuration] = useState<string>("");

  // Extras & Packs state
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState(false);

  // RGPD consent
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Gift card / discount code state
  const [showCodeSection, setShowCodeSection] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [validatedCode, setValidatedCode] = useState<{
    type: "gift_card" | "discount";
    code: string;
    value?: number;
    percentage?: number;
  } | null>(null);
  const [codeError, setCodeError] = useState("");

  // Track which fields the user has interacted with (blurred)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Wizard step navigation
  const [currentStep, setCurrentStep] = useState(1);
  const prevSeasonRef = useRef<string>("");

  // Hold countdown: starts when user reaches step 4 (final step)
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [holdExpired, setHoldExpired] = useState(false);

  // Booking confirmation overlay
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    boatName: string;
    date: string;
    time: string;
    duration: string;
    people: number;
    price: number | null;
  } | null>(null);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // --- H2: sessionStorage persistence ---
  const STORAGE_KEY = "bookingFormState";
  const STORAGE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
  const hasRestoredRef = useRef(false);

  // Restore saved state on mount (only if < 30 minutes old)
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        timestamp: number;
        selectedBoat: string;
        selectedDate: string;
        preferredTime: string;
        selectedDuration: string;
        currentStep: number;
        selectedExtras: string[];
        selectedPack: string | null;
        firstName: string;
        lastName: string;
        phonePrefix: string;
        phoneNumber: string;
        email: string;
        numberOfPeople: string;
        licenseFilter: "with" | "without";
      };
      // Discard if too old
      if (Date.now() - saved.timestamp > STORAGE_MAX_AGE_MS) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      // Only restore if there's no pre-selected boat overriding, and the saved state has meaningful data
      if (saved.selectedBoat && !preSelectedBoatId) setSelectedBoat(saved.selectedBoat);
      if (saved.selectedDate && !prefillDate) setSelectedDate(saved.selectedDate);
      if (saved.preferredTime && !prefillTime) setPreferredTime(saved.preferredTime);
      if (saved.selectedDuration) setSelectedDuration(saved.selectedDuration);
      if (saved.selectedExtras?.length) setSelectedExtras(saved.selectedExtras);
      if (saved.selectedPack) setSelectedPack(saved.selectedPack);
      if (saved.firstName) setFirstName(saved.firstName);
      if (saved.lastName) setLastName(saved.lastName);
      if (saved.phonePrefix) setPhonePrefix(saved.phonePrefix);
      if (saved.phoneNumber) setPhoneNumber(saved.phoneNumber);
      if (saved.email) setEmail(saved.email);
      if (saved.numberOfPeople && saved.numberOfPeople !== "0") setNumberOfPeople(saved.numberOfPeople);
      if (saved.licenseFilter) setLicenseFilter(saved.licenseFilter);
      // Restore step, but cap at 1 less than saved so user re-confirms
      if (saved.currentStep > 1) setCurrentStep(Math.min(saved.currentStep, 4));
    } catch {
      // Silently ignore corrupted storage
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save form state to sessionStorage whenever key fields change
  useEffect(() => {
    // Don't save until restoration has happened
    if (!hasRestoredRef.current) return;
    try {
      const stateToSave = {
        timestamp: Date.now(),
        selectedBoat,
        selectedDate,
        preferredTime,
        selectedDuration,
        currentStep,
        selectedExtras,
        selectedPack,
        firstName,
        lastName,
        phonePrefix,
        phoneNumber,
        email,
        numberOfPeople,
        licenseFilter,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Silently ignore (e.g. storage full)
    }
  }, [
    selectedBoat, selectedDate, preferredTime, selectedDuration, currentStep,
    selectedExtras, selectedPack, firstName, lastName, phonePrefix, phoneNumber,
    email, numberOfPeople, licenseFilter,
  ]);

  // Clear sessionStorage on successful booking completion
  const clearBookingStorage = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const { toast } = useToast();
  const t = useTranslations();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const isSpanishLang = language === 'es' || language === 'ca';
  const prefixDropdownRef = useRef<HTMLDivElement>(null);

  // Update boat when preSelectedBoatId changes
  useEffect(() => {
    if (preSelectedBoatId) {
      setSelectedBoat(preSelectedBoatId);
    }
  }, [preSelectedBoatId]);

  // Auto-apply prefilled coupon code (from exit intent modal)
  useEffect(() => {
    if (prefillCoupon && !validatedCode) {
      setCodeInput(prefillCoupon);
      setShowCodeSection(true);
      // Auto-validate after a short delay to let the form render
      const timer = setTimeout(() => {
        const code = prefillCoupon.trim().toUpperCase();
        fetch("/api/discounts/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.valid) {
              setValidatedCode({
                type: "discount",
                code,
                percentage: data.discountPercent,
              });
            }
          })
          .catch(() => {
            toast({
              title: "Error al validar codigo",
              description: "No se pudo verificar el codigo de descuento. Intentalo de nuevo.",
              variant: "destructive",
            });
          });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [prefillCoupon]);

  // Close prefix dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (prefixDropdownRef.current && !prefixDropdownRef.current.contains(event.target as Node)) {
        setShowPrefixDropdown(false);
      }
    };
    if (showPrefixDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPrefixDropdown]);

  // Filter prefixes by search (using shared helper)
  const filteredPrefixes = filterPhonePrefixes(PHONE_PREFIXES, prefixSearch);

  // Get selected prefix info (using shared helper)
  const selectedPrefixInfo = findPrefixByCode(phonePrefix);

  // Fetch all boats from API
  const { data: allBoats = [], isLoading: isBoatsLoading } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });

  // Fetch real-time slot availability when boat + date are selected
  const { data: slotAvailability, isLoading: isAvailabilityLoading } = useQuery<SlotAvailability>({
    queryKey: ["/api/availability", selectedBoat, selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/availability?boatId=${encodeURIComponent(selectedBoat)}&date=${encodeURIComponent(selectedDate)}`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!selectedBoat && !!selectedDate,
    staleTime: 60_000, // matches server Cache-Control
    refetchOnWindowFocus: true,
  });

  // Build a set of unavailable time slots for quick lookup
  const unavailableTimeSlots = useMemo(() => {
    if (!slotAvailability) return new Set<string>();
    return new Set(slotAvailability.unavailableSlots);
  }, [slotAvailability]);

  // Build a map of time -> maxDuration for available slots
  const slotMaxDuration = useMemo(() => {
    const map = new Map<string, number>();
    if (slotAvailability) {
      for (const slot of slotAvailability.availableSlots) {
        map.set(slot.time, slot.maxDuration);
      }
    }
    return map;
  }, [slotAvailability]);

  // Get max duration for the currently selected time slot
  const selectedTimeMaxDuration = useMemo(() => {
    if (!preferredTime || !slotMaxDuration.has(preferredTime)) return null;
    return slotMaxDuration.get(preferredTime) ?? null;
  }, [preferredTime, slotMaxDuration]);

  // Reset time if it becomes unavailable
  useEffect(() => {
    if (preferredTime && unavailableTimeSlots.has(preferredTime)) {
      setPreferredTime("");
    }
  }, [unavailableTimeSlots, preferredTime]);

  // Reset duration if it exceeds maxDuration for the selected time slot
  useEffect(() => {
    if (selectedDuration && selectedTimeMaxDuration !== null) {
      const durationHours = parseInt(selectedDuration.replace("h", ""));
      if (durationHours > selectedTimeMaxDuration) {
        setSelectedDuration("");
      }
    }
  }, [selectedTimeMaxDuration, selectedDuration]);

  // Filter boats based on license selection
  const filteredBoats = allBoats.filter(boat => {
    if (licenseFilter === "with") return !!boat.requiresLicense;
    if (licenseFilter === "without") return !boat.requiresLicense;
    return true;
  });

  // Get selected boat info
  const selectedBoatInfo = allBoats.find(boat => boat.id === selectedBoat);

  // Update license filter based on pre-selected boat
  useEffect(() => {
    if (preSelectedBoatId && selectedBoatInfo) {
      setLicenseFilter(selectedBoatInfo.requiresLicense ? "with" : "without");
    }
  }, [preSelectedBoatId, selectedBoatInfo]);

  // Reset boat selection when license filter changes if current boat doesn't match filter
  useEffect(() => {
    if (selectedBoat && selectedBoatInfo && !preSelectedBoatId) {
      if (licenseFilter === "with" && !selectedBoatInfo.requiresLicense) {
        setSelectedBoat("");
      } else if (licenseFilter === "without" && !!selectedBoatInfo.requiresLicense) {
        setSelectedBoat("");
      }
    }
  }, [licenseFilter, selectedBoat, selectedBoatInfo, preSelectedBoatId]);

  // Helper function to get current season based on selected date
  const getCurrentSeason = () => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    const month = date.getMonth() + 1;
    if (month === 8) return "ALTA";
    if (month === 7) return "MEDIA";
    return "BAJA";
  };

  // Compute base price for auto-discount query (derived from state)
  const currentBasePrice = useMemo(() => {
    if (!selectedBoatInfo || !selectedDuration || !selectedBoatInfo.pricing) return null;
    const date = selectedDate ? new Date(selectedDate) : new Date();
    const month = date.getMonth() + 1;
    const season = month === 8 ? "ALTA" : month === 7 ? "MEDIA" : "BAJA";
    const seasonPricing = selectedBoatInfo.pricing[season];
    return seasonPricing?.prices[selectedDuration] || null;
  }, [selectedBoatInfo, selectedDuration, selectedDate]);

  // Fetch auto-discount (early-bird / flash deal) when boat, date, and price are known
  const { data: autoDiscount } = useQuery<AutoDiscountResult>({
    queryKey: ["/api/auto-discount/check", selectedBoat, selectedDate, currentBasePrice],
    queryFn: async () => {
      const res = await fetch(
        `/api/auto-discount/check?boatId=${encodeURIComponent(selectedBoat)}&date=${encodeURIComponent(selectedDate)}&price=${currentBasePrice}`
      );
      if (!res.ok) return { type: null, percentage: 0, amount: 0 };
      return res.json();
    },
    enabled: !!selectedBoat && !!selectedDate && currentBasePrice !== null && currentBasePrice > 0,
    staleTime: 30_000,
  });

  // Map duration keys to i18n labels
  const durationLabelMap: Record<string, string> = {
    "1h": t.booking.oneHour || "1 hora",
    "2h": t.booking.twoHours || "2 horas",
    "3h": t.booking.threeHours || "3 horas",
    "4h": t.booking.fourHours || "4 horas - Medio dia",
    "6h": t.booking.sixHours || "6 horas",
    "8h": t.booking.eightHours || "8 horas - Dia completo",
  };

  // Build the restriction tooltip for a disabled duration option
  const getRestrictionTooltip = (opt: DurationOption): string => {
    if (!opt.restrictionReason || !opt.minimumRequired) return '';
    const minLabel = durationLabelMap[opt.minimumRequired] || opt.minimumRequired;
    if (opt.restrictionReason === 'peakSeasonMinimum') {
      return t.wizard.durationMinPeakSeason.replace('{duration}', opt.minimumRequired);
    }
    return t.wizard.durationMinWeekend.replace('{duration}', opt.minimumRequired);
  };

  // Duration options based on boat, license, date, and season restrictions
  const getDurationOptions = (): { value: string; label: string; disabled?: boolean; disabledReason?: string }[] => {
    const getPriceForDuration = (durationKey: string) => {
      if (!selectedBoatInfo || !selectedBoatInfo.pricing) return null;

      const season = getCurrentSeason();
      const seasonPricing = selectedBoatInfo.pricing[season];
      return seasonPricing?.prices[durationKey] || null;
    };

    const formatLabel = (durationKey: string, baseLabel: string) => {
      const price = getPriceForDuration(durationKey);
      return price ? `${baseLabel} - ${price}€` : baseLabel;
    };

    // When we have both a boat and a date, use the shared date-aware filter
    if (selectedBoatInfo && selectedDate) {
      const date = new Date(selectedDate + 'T12:00:00');
      let durationAvailability: DurationOption[];
      try {
        durationAvailability = getAvailableDurationsForDate(selectedBoatInfo.id, date);
      } catch {
        // Outside operational season — fall back to showing all boat durations without restriction
        durationAvailability = [];
      }

      if (durationAvailability.length > 0) {
        return durationAvailability.map((opt) => {
          const baseLabel = durationLabelMap[opt.duration] || opt.duration;
          const label = formatLabel(opt.duration, baseLabel);
          if (!opt.available) {
            return {
              value: opt.duration,
              label: baseLabel,
              disabled: true,
              disabledReason: getRestrictionTooltip(opt),
            };
          }
          return { value: opt.duration, label };
        });
      }
    }

    // Fallback: no boat selected yet, or date not set — show generic options by license type
    if (!selectedBoatInfo) {
      if (licenseFilter === "with") {
        return [
          { value: "2h", label: t.booking.twoHours || "2 horas" },
          { value: "4h", label: t.booking.fourHours || "4 horas - Medio dia" },
          { value: "8h", label: t.booking.eightHours || "8 horas - Dia completo" },
        ];
      }
      return [
        { value: "1h", label: t.booking.oneHour || "1 hora" },
        { value: "2h", label: t.booking.twoHours || "2 horas" },
        { value: "3h", label: t.booking.threeHours || "3 horas" },
        { value: "4h", label: t.booking.fourHours || "4 horas - Medio dia" },
        { value: "6h", label: t.booking.sixHours || "6 horas" },
        { value: "8h", label: t.booking.eightHours || "8 horas - Dia completo" },
      ];
    }

    // Boat selected but no date — show boat-specific durations without restrictions
    if (selectedBoatInfo.requiresLicense) {
      return [
        { value: "2h", label: formatLabel("2h", t.booking.twoHours || "2 horas") },
        { value: "4h", label: formatLabel("4h", t.booking.fourHours || "4 horas - Medio dia") },
        { value: "8h", label: formatLabel("8h", t.booking.eightHours || "8 horas - Dia completo") },
      ];
    }
    return [
      { value: "1h", label: formatLabel("1h", t.booking.oneHour || "1 hora") },
      { value: "2h", label: formatLabel("2h", t.booking.twoHours || "2 horas") },
      { value: "3h", label: formatLabel("3h", t.booking.threeHours || "3 horas") },
      { value: "4h", label: formatLabel("4h", t.booking.fourHours || "4 horas - Medio dia") },
      { value: "6h", label: formatLabel("6h", t.booking.sixHours || "6 horas") },
      { value: "8h", label: formatLabel("8h", t.booking.eightHours || "8 horas - Dia completo") },
    ];
  };

  // Reset duration when the season changes OR when selected duration becomes disabled due to date change
  useEffect(() => {
    const newSeason = getCurrentSeason();
    if (prevSeasonRef.current && prevSeasonRef.current !== newSeason) {
      // Season changed — reset and auto-select first available
      const options = getDurationOptions();
      const firstAvailable = options.find(opt => !opt.disabled);
      setSelectedDuration(firstAvailable?.value || "");
    } else if (selectedDuration) {
      // Same season but date may have changed (e.g., weekday -> weekend)
      const options = getDurationOptions();
      const currentOpt = options.find(opt => opt.value === selectedDuration);
      if (currentOpt?.disabled) {
        // Auto-select the nearest available duration (prefer next higher)
        const currentIdx = options.findIndex(opt => opt.value === selectedDuration);
        const nextAvailable = options.slice(currentIdx + 1).find(opt => !opt.disabled)
          || options.find(opt => !opt.disabled);
        setSelectedDuration(nextAvailable?.value || "");
      }
    }
    prevSeasonRef.current = newSeason;
  }, [selectedDate]);

  // Reset duration if it's no longer valid or disabled when boat or license changes
  // Also set smart default when no duration is selected: 4h for no-licence, 8h for licence
  useEffect(() => {
    const validOptions = getDurationOptions();
    if (selectedDuration) {
      const currentOpt = validOptions.find(opt => opt.value === selectedDuration);
      if (!currentOpt || currentOpt.disabled) {
        const firstAvailable = validOptions.find(opt => !opt.disabled);
        setSelectedDuration(firstAvailable?.value || "");
      }
    } else if (selectedBoatInfo) {
      const defaultDuration = selectedBoatInfo.requiresLicense ? "8h" : "4h";
      const defaultOpt = validOptions.find(opt => opt.value === defaultDuration && !opt.disabled);
      if (defaultOpt) {
        setSelectedDuration(defaultOpt.value);
      } else {
        const firstAvailable = validOptions.find(opt => !opt.disabled);
        setSelectedDuration(firstAvailable?.value || "");
      }
    }
  }, [selectedBoat, selectedBoatInfo, licenseFilter]);

  // Helper function to get price
  const getBookingPrice = () => {
    if (!selectedBoatInfo || !selectedDuration || !selectedBoatInfo.pricing) return null;

    const season = getCurrentSeason();
    const seasonPricing = selectedBoatInfo.pricing[season];
    return seasonPricing?.prices[selectedDuration] || null;
  };

  // Get max capacity for selected boat
  const getMaxCapacity = () => {
    if (selectedBoatInfo) return selectedBoatInfo.capacity;
    return licenseFilter === "with" ? 8 : 7;
  };

  // Smart default: auto-select 4h duration (most popular) when boat changes
  // Only applies when duration is not already set by user or session restore
  useEffect(() => {
    if (!selectedBoat) return;
    // Don't override if user already has a valid duration selected
    if (selectedDuration) {
      const options = getDurationOptions();
      const currentValid = options.find(opt => opt.value === selectedDuration && !opt.disabled);
      if (currentValid) return;
    }
    const options = getDurationOptions();
    // Prefer 4h if available, otherwise pick the middle available option
    const fourHour = options.find(opt => opt.value === "4h" && !opt.disabled);
    if (fourHour) {
      setSelectedDuration("4h");
    } else {
      const available = options.filter(opt => !opt.disabled);
      if (available.length > 0) {
        const middleIdx = Math.floor(available.length / 2);
        setSelectedDuration(available[middleIdx].value);
      }
    }
  }, [selectedBoat]);

  // Reset extras when boat changes
  useEffect(() => {
    setSelectedExtras([]);
    setSelectedPack(null);
  }, [selectedBoat]);

  // Compute next available Saturday for suggestion text near calendar
  const nextSaturdayISO = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
    const daysUntilSat = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
    const nextSat = new Date(today);
    nextSat.setDate(today.getDate() + daysUntilSat);
    const y = nextSat.getFullYear();
    const m = String(nextSat.getMonth() + 1).padStart(2, '0');
    const d = String(nextSat.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Get the extras for the currently selected boat from BOAT_DATA
  const boatExtras = useMemo(() => {
    if (!selectedBoat || !BOAT_DATA[selectedBoat]) return [];
    return BOAT_DATA[selectedBoat].extras;
  }, [selectedBoat]);

  // Determine which extras are covered by the selected pack
  const extrasInPack = useMemo(() => {
    if (!selectedPack) return new Set<string>();
    const pack = EXTRA_PACKS.find(p => p.id === selectedPack);
    return new Set(pack?.extras || []);
  }, [selectedPack]);

  // Handle pack selection (radio-like behavior)
  const handlePackSelect = (packId: string) => {
    if (!packId) {
      setSelectedPack(null);
      setSelectedExtras([]);
      return;
    }
    if (selectedPack === packId) {
      setSelectedPack(null);
      setSelectedExtras([]);
    } else {
      setSelectedPack(packId);
      const pack = EXTRA_PACKS.find(p => p.id === packId);
      if (pack) {
        const nonPackExtras = selectedExtras.filter(e => !pack.extras.includes(e));
        setSelectedExtras([...pack.extras, ...nonPackExtras]);
      }
    }
  };

  // Handle individual extra toggle
  const handleExtraToggle = (extraName: string) => {
    if (extrasInPack.has(extraName)) return;

    setSelectedExtras(prev =>
      prev.includes(extraName)
        ? prev.filter(e => e !== extraName)
        : [...prev, extraName]
    );
  };

  // Calculate total extras price (packs + individual)
  const totalExtrasPrice = useMemo(() => {
    if (!selectedBoat || !BOAT_DATA[selectedBoat]) return 0;
    const packs = selectedPack ? [selectedPack] : [];
    return calculateExtrasPrice(selectedBoat, selectedExtras, packs);
  }, [selectedBoat, selectedExtras, selectedPack]);

  // Inline validation (using shared validators from booking-validation.ts)
  const getFieldError = (field: string): string => {
    switch (field) {
      case 'firstName':
        return validateRequired(firstName) ? t.validation.required : '';
      case 'lastName':
        return validateRequired(lastName) ? t.validation.required : '';
      case 'email': {
        const emailErr = validateEmail(email);
        if (emailErr === 'required') return t.validation.required;
        if (emailErr === 'invalid') return t.validation.invalidEmail;
        return '';
      }
      case 'phone': {
        const phoneErr = validatePhone(phoneNumber);
        if (phoneErr === 'required') return t.validation.required;
        if (phoneErr === 'invalid') return t.validation.invalidPhone;
        return '';
      }
      case 'date': {
        const dateErr = validateBookingDate(selectedDate, getLocalISODate());
        if (dateErr === 'required') return t.validation.required;
        if (dateErr === 'past') return t.validation.futureDate;
        return '';
      }
      case 'time':
        return !preferredTime ? t.validation.required : '';
      case 'duration':
        return !selectedDuration ? t.validation.required : '';
      case 'boat':
        return !selectedBoat ? t.validation.required : '';
      case 'people':
        if (!numberOfPeople) return t.validation.required;
        if (parseInt(numberOfPeople) < 1) return t.validation.minPeople;
        return '';
      default:
        return '';
    }
  };

  const showFieldError = (field: string): boolean => {
    return !!touched[field] && !!getFieldError(field);
  };

  // Step validation
  const canAdvanceFromStep1 = (): boolean => {
    return !!selectedBoat;
  };

  const canAdvanceFromStep2 = (): boolean => {
    const n = parseInt(numberOfPeople);
    return !!selectedDate && selectedDate >= getLocalISODate() && !!selectedDuration && !!preferredTime && !!numberOfPeople && n >= 1 && n <= getMaxCapacity();
  };

  const canAdvanceFromStep3 = (): boolean => {
    return (
      !validateRequired(firstName) &&
      !validateRequired(lastName) &&
      !validatePhone(phoneNumber) &&
      isValidEmail(email)
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!canAdvanceFromStep1()) {
        setTouched(prev => ({ ...prev, boat: true }));
        return;
      }
    }
    if (currentStep === 2) {
      if (!canAdvanceFromStep2()) {
        setTouched(prev => ({ ...prev, date: true, duration: true, time: true, people: true }));
        // Scroll to the first invalid field
        const n = parseInt(numberOfPeople);
        const firstInvalid = !selectedDate || selectedDate < getLocalISODate()
          ? 'field-date'
          : !preferredTime
          ? 'field-time'
          : !selectedDuration
          ? 'field-duration'
          : (!numberOfPeople || n < 1 || n > getMaxCapacity())
          ? 'field-people'
          : null;
        if (firstInvalid) {
          setTimeout(() => {
            document.getElementById(firstInvalid)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
        }
        return;
      }
    }
    // Step 3 (Extras) has no validation — always allow advancing
    // Start hold countdown when advancing to step 4 — only for licensed boats
    if (currentStep === 3 && !holdExpiresAt && selectedBoatInfo?.requiresLicense) {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      setHoldExpiresAt(expiresAt);
      setHoldExpired(false);
    }
    if (currentStep === 4) {
      if (!canAdvanceFromStep3()) {
        setTouched(prev => ({ ...prev, firstName: true, lastName: true, phone: true, email: true }));
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Helper functions to format date
  const formatDateSpanish = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const formatDateEnglish = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getSeasonLabel = () => {
    const season = getCurrentSeason();
    if (season === "ALTA") return t.boatDetail.seasonHigh;
    if (season === "MEDIA") return t.boatDetail.seasonMid;
    return t.boatDetail.seasonLow;
  };

  const buildExtrasText = (isSpanish: boolean) => {
    const parts: string[] = [];

    if (selectedPack) {
      const pack = EXTRA_PACKS.find(p => p.id === selectedPack);
      if (pack) {
        parts.push(`Pack: ${isSpanish ? pack.name : pack.nameEN} (${pack.price}€)`);
      }
    }

    const nonPackExtras = selectedExtras.filter(e => !extrasInPack.has(e));
    if (nonPackExtras.length > 0) {
      const boatExtras = selectedBoat && BOAT_DATA[selectedBoat] ? BOAT_DATA[selectedBoat].extras : [];
      nonPackExtras.forEach(extraName => {
        const extraData = boatExtras.find(e => e.name === extraName);
        const priceStr = extraData?.price ? ` (${extraData.price})` : '';
        parts.push(`· ${extraName}${priceStr}`);
      });
    }

    if (parts.length === 0) return '';
    return parts.join('\n');
  };

  const createWhatsAppBookingMessage = () => {
    const isSpanish = language === 'es' || language === 'ca';
    const price = getBookingPrice();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const phone = `${phonePrefix} ${phoneNumber.trim()}`;
    const boatName = selectedBoatInfo?.name || selectedBoat;
    const formattedDate = isSpanish ? formatDateSpanish(selectedDate) : formatDateEnglish(selectedDate);
    const capacity = selectedBoatInfo?.capacity || "?";
    const deposit = selectedBoatInfo?.specifications?.deposit || "?";

    const durationOption = getDurationOptions().find(opt => opt.value === selectedDuration);
    const durationText = durationOption?.label.split(' - ')[0] || selectedDuration;

    const extrasText = buildExtrasText(isSpanish);
    const extrasBlock = extrasText ? `\n${extrasText}\n${isSpanish ? 'Total extras' : 'Extras total'}: ${totalExtrasPrice}€` : '';

    const codeDiscount = getCodeDiscount();
    const autoDiscountAmount = autoDiscount?.type ? autoDiscount.amount : 0;
    const totalPrice = price ? price + totalExtrasPrice - codeDiscount - autoDiscountAmount : null;

    const separator = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄';

    let autoDiscountBlock = '';
    if (autoDiscount?.type) {
      const label = autoDiscount.type === 'early-bird'
        ? (isSpanish ? 'Descuento early-bird' : 'Early-bird discount')
        : (isSpanish ? 'Oferta flash' : 'Flash deal');
      autoDiscountBlock = `\n\n🏷️ *${label}*\n-${autoDiscountAmount}€ (-10%)`;
    }

    let codeBlock = '';
    if (validatedCode) {
      if (validatedCode.type === 'gift_card') {
        codeBlock = isSpanish
          ? `\n\n🎁 *Tarjeta regalo*\n${separator}\nCodigo: ${validatedCode.code}\nValor: -${codeDiscount}€`
          : `\n\n🎁 *Gift card*\n${separator}\nCode: ${validatedCode.code}\nValue: -${codeDiscount}€`;
      } else if (validatedCode.type === 'discount') {
        codeBlock = isSpanish
          ? `\n\n🏷️ *Descuento*\n${separator}\nCodigo: ${validatedCode.code}\nDescuento: ${validatedCode.percentage}% (-${codeDiscount}€)`
          : `\n\n🏷️ *Discount*\n${separator}\nCode: ${validatedCode.code}\nDiscount: ${validatedCode.percentage}% (-${codeDiscount}€)`;
      }
    }

    if (isSpanish) {
      return `⛵ *NUEVA RESERVA*

👤 *Datos del cliente*
${separator}
Nombre: ${fullName}
Tel: ${phone}
Email: ${email.trim()}

🚤 *Detalles de la reserva*
${separator}
Barco: ${boatName}
Fecha: ${formattedDate}
Hora: ${preferredTime}h
Duracion: ${durationText}
Nº de Personas: ${numberOfPeople}
Temporada: ${getSeasonLabel()}
Precio base: ${price ? price + '€' : 'Consultar'}${extrasBlock ? `\n\n🎒 *Extras*\n${separator}` + extrasBlock : ''}${autoDiscountBlock}${codeBlock}
${totalPrice ? `\n💰 *TOTAL: ${totalPrice}€*` : ''}
Fianza: ${deposit}

Quedo a la espera de confirmacion. ¡Gracias!`;
    } else {
      return `⛵ *NEW BOOKING*

👤 *Client details*
${separator}
Name: ${fullName}
Phone: ${phone}
Email: ${email.trim()}

🚤 *Booking details*
${separator}
Boat: ${boatName}
Date: ${formattedDate}
Time: ${preferredTime}h
Duration: ${durationText}
Nº of People: ${numberOfPeople}
Season: ${getSeasonLabel()}
Base price: ${price ? price + '€' : 'Ask'}${extrasBlock ? `\n\n🎒 *Extras*\n${separator}` + extrasBlock : ''}${autoDiscountBlock}${codeBlock}
${totalPrice ? `\n💰 *TOTAL: ${totalPrice}€*` : ''}
Deposit: ${deposit}

Looking forward to confirmation. Thanks!`;
    }
  };

  const handleValidateCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;

    setIsValidatingCode(true);
    setCodeError("");

    try {
      const giftCardRes = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (giftCardRes.ok) {
        const data = await giftCardRes.json();
        setValidatedCode({
          type: "gift_card",
          code,
          value: data.remainingBalance || data.amount,
        });
        setIsValidatingCode(false);
        return;
      }

      const discountRes = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (discountRes.ok) {
        const data = await discountRes.json();
        if (data.valid) {
          setValidatedCode({
            type: "discount",
            code,
            percentage: data.discountPercent,
          });
          setIsValidatingCode(false);
          return;
        }
      }

      setCodeError(t.codeValidation.invalidCode);
    } catch {
      setCodeError(t.codeValidation.invalidCode);
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveCode = () => {
    setValidatedCode(null);
    setCodeInput("");
    setCodeError("");
  };

  const getCodeDiscount = (): number => {
    if (!validatedCode) return 0;
    const basePrice = getBookingPrice() || 0;
    const total = basePrice + totalExtrasPrice;

    if (validatedCode.type === "gift_card" && validatedCode.value) {
      return Math.min(validatedCode.value, total);
    }
    if (validatedCode.type === "discount" && validatedCode.percentage) {
      return Math.round((basePrice * validatedCode.percentage) / 100);
    }
    return 0;
  };

  const handleBookingSearch = async (): Promise<void> => {
    setTouched({
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      date: true,
      time: true,
      boat: true,
      duration: true,
      people: true,
    });

    if (!firstName.trim()) {
      toast({ title: t.booking.firstNameRequired, description: t.booking.firstNameRequiredDesc, variant: "destructive" });
      return;
    }
    if (!lastName.trim()) {
      toast({ title: t.booking.lastNameRequired, description: t.booking.lastNameRequiredDesc, variant: "destructive" });
      return;
    }
    if (!phoneNumber.trim()) {
      toast({ title: t.booking.phoneRequired, description: t.booking.phoneRequiredDesc, variant: "destructive" });
      return;
    }
    if (validateEmail(email)) {
      toast({ title: t.booking.emailInvalid, description: t.booking.emailInvalidDesc, variant: "destructive" });
      return;
    }
    if (!selectedDate) {
      toast({ title: t.booking.dateRequired, description: t.booking.dateRequiredDesc, variant: "destructive" });
      return;
    }
    if (!selectedBoat) {
      toast({ title: t.booking.boatRequired, description: t.booking.boatRequiredDesc, variant: "destructive" });
      return;
    }
    if (!selectedDuration) {
      toast({ title: t.booking.durationRequired, description: t.booking.durationRequiredDesc, variant: "destructive" });
      return;
    }
    if (!numberOfPeople || parseInt(numberOfPeople) < 1) {
      toast({ title: t.booking.peopleRequired, description: t.booking.peopleRequiredDesc, variant: "destructive" });
      return;
    }
    if (!preferredTime) {
      toast({ title: t.booking.timeRequired, description: t.booking.timeRequiredDesc, variant: "destructive" });
      return;
    }

    trackBookingStarted(selectedBoat, selectedBoatInfo?.name || selectedBoat, getStoredUtm());

    // Open WhatsApp immediately (must be synchronous with user click to avoid popup blocker)
    const message = createWhatsAppBookingMessage();
    openWhatsApp(message);

    // Save inquiry to database after opening WhatsApp (fire-and-forget to avoid popup blocker)
    try {
      const price = getBookingPrice();
      const codeDiscount = getCodeDiscount();
      const autoDiscAmt = autoDiscount?.type ? autoDiscount.amount : 0;
      const total = price ? price + totalExtrasPrice - codeDiscount - autoDiscAmt : null;
      fetch('/api/booking-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boatId: selectedBoat,
          boatName: selectedBoatInfo?.name || selectedBoat,
          bookingDate: selectedDate,
          preferredTime: preferredTime || null,
          duration: selectedDuration,
          numberOfPeople: parseInt(numberOfPeople) || 0,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phonePrefix,
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || null,
          extras: selectedExtras.length > 0 ? selectedExtras : [],
          packId: selectedPack || null,
          couponCode: validatedCode?.code || null,
          estimatedTotal: total ? total.toFixed(2) : null,
          language,
          source: isMobile ? 'mobile' : 'desktop',
        }),
      }).catch(() => {
        toast({
          title: "Error al guardar consulta",
          description: "Tu solicitud de WhatsApp fue enviada, pero no pudimos registrarla internamente.",
          variant: "destructive",
        });
      });
    } catch {
      // Silent fail - WhatsApp was already opened
    }

    toast({
      title: isSpanishLang ? 'Solicitud enviada por WhatsApp' : 'Request sent via WhatsApp',
      description: isSpanishLang
        ? 'Revisa WhatsApp para confirmar tu reserva con nosotros.'
        : 'Check WhatsApp to confirm your booking with us.',
    });

    // Show the enhanced confirmation overlay (peak-end rule)
    const bookingPrice = getBookingPrice();
    const discount = getCodeDiscount();
    const autoDiscFinal = autoDiscount?.type ? autoDiscount.amount : 0;
    const finalPrice = bookingPrice ? bookingPrice + totalExtrasPrice - discount - autoDiscFinal : null;
    setConfirmationData({
      boatName: selectedBoatInfo?.name || selectedBoat,
      date: selectedDate,
      time: preferredTime,
      duration: selectedDuration,
      people: parseInt(numberOfPeople) || 0,
      price: finalPrice,
    });
    setShowConfirmation(true);

    // Clear persisted form state on successful booking
    clearBookingStorage();

    setCurrentStep(1);
  };

  const handleHoldExpired = () => {
    setHoldExpired(true);
  };

  // Soft recovery: go back to step 1 and reset the hold timer so user can re-verify
  const handleHoldVerify = () => {
    setCurrentStep(1);
    setHoldExpiresAt(null);
    setHoldExpired(false);
  };

  const sharedProps = {
    currentStep,
    onNext: handleNextStep,
    onBack: handlePrevStep,
    onGoToStep: setCurrentStep,
    holdExpiresAt,
    holdExpired,
    onHoldExpired: handleHoldExpired,
    onHoldVerify: handleHoldVerify,
    firstName, setFirstName,
    lastName, setLastName,
    phonePrefix, setPhonePrefix,
    phoneNumber, setPhoneNumber,
    email, setEmail,
    showPrefixDropdown, setShowPrefixDropdown,
    prefixSearch, setPrefixSearch,
    prefixDropdownRef,
    filteredPrefixes,
    selectedPrefixInfo,
    licenseFilter, setLicenseFilter,
    selectedBoat, setSelectedBoat,
    selectedDate, setSelectedDate,
    selectedDuration, setSelectedDuration,
    preferredTime, setPreferredTime,
    numberOfPeople, setNumberOfPeople,
    filteredBoats,
    isBoatsLoading,
    selectedBoatInfo,
    getDurationOptions,
    getMaxCapacity,
    getLocalISODate,
    preSelectedBoatId,
    timeSlots: TIME_SLOTS,
    unavailableTimeSlots,
    slotMaxDuration,
    selectedTimeMaxDuration,
    isAvailabilityLoading,
    boatExtras,
    selectedExtras,
    selectedPack,
    showExtras, setShowExtras,
    extrasInPack,
    totalExtrasPrice,
    handlePackSelect,
    handleExtraToggle,
    showCodeSection, setShowCodeSection,
    codeInput, setCodeInput,
    isValidatingCode,
    validatedCode,
    codeError,
    handleValidateCode,
    handleRemoveCode,
    getCodeDiscount,
    getBookingPrice,
    autoDiscount: autoDiscount || null,
    handleBookingSearch,
    privacyConsent, setPrivacyConsent,
    showFieldError,
    getFieldError,
    handleBlur,
    t,
    iconMap: ICON_MAP,
    calculatePackSavings,
    isSpanishLang,
    language,
    nextSaturdayISO,
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationData(null);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {isMobile ? (
        <BookingWizardMobile {...sharedProps} />
      ) : (
        <BookingFormDesktop {...sharedProps} />
      )}
      {showConfirmation && confirmationData && (
        <BookingConfirmation
          boatName={confirmationData.boatName}
          date={confirmationData.date}
          time={confirmationData.time}
          duration={confirmationData.duration}
          people={confirmationData.people}
          price={confirmationData.price}
          onClose={handleCloseConfirmation}
        />
      )}
    </>
  );
}
