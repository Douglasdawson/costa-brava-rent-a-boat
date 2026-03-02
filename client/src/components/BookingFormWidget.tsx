import { useState, useEffect, useRef, useMemo } from "react";
import { Package, Crown, Zap, Snowflake, Eye, Waves, CircleParking, Beer } from "lucide-react";
import { openWhatsApp } from "@/utils/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { trackBookingStarted } from "@/utils/analytics";
import { BOAT_DATA, EXTRA_PACKS } from "@shared/boatData";
import { calculateExtrasPrice, calculatePackSavings } from "@shared/pricing";
import BookingWizardMobile from "@/components/BookingWizardMobile";
import BookingFormDesktop from "@/components/BookingFormDesktop";
import { useIsMobile } from "@/hooks/use-mobile";

// Common phone prefixes (prioritized by Costa Brava tourism)
const PHONE_PREFIXES = [
  { code: "+34", flag: "\u{1F1EA}\u{1F1F8}", country: "Spain" },
  { code: "+33", flag: "\u{1F1EB}\u{1F1F7}", country: "France" },
  { code: "+44", flag: "\u{1F1EC}\u{1F1E7}", country: "United Kingdom" },
  { code: "+49", flag: "\u{1F1E9}\u{1F1EA}", country: "Germany" },
  { code: "+31", flag: "\u{1F1F3}\u{1F1F1}", country: "Netherlands" },
  { code: "+32", flag: "\u{1F1E7}\u{1F1EA}", country: "Belgium" },
  { code: "+39", flag: "\u{1F1EE}\u{1F1F9}", country: "Italy" },
  { code: "+351", flag: "\u{1F1F5}\u{1F1F9}", country: "Portugal" },
  { code: "+41", flag: "\u{1F1E8}\u{1F1ED}", country: "Switzerland" },
  { code: "+43", flag: "\u{1F1E6}\u{1F1F9}", country: "Austria" },
  { code: "+46", flag: "\u{1F1F8}\u{1F1EA}", country: "Sweden" },
  { code: "+47", flag: "\u{1F1F3}\u{1F1F4}", country: "Norway" },
  { code: "+45", flag: "\u{1F1E9}\u{1F1F0}", country: "Denmark" },
  { code: "+358", flag: "\u{1F1EB}\u{1F1EE}", country: "Finland" },
  { code: "+48", flag: "\u{1F1F5}\u{1F1F1}", country: "Poland" },
  { code: "+420", flag: "\u{1F1E8}\u{1F1FF}", country: "Czech Republic" },
  { code: "+7", flag: "\u{1F1F7}\u{1F1FA}", country: "Russia" },
  { code: "+380", flag: "\u{1F1FA}\u{1F1E6}", country: "Ukraine" },
  { code: "+353", flag: "\u{1F1EE}\u{1F1EA}", country: "Ireland" },
  { code: "+1", flag: "\u{1F1FA}\u{1F1F8}", country: "United States" },
  { code: "+52", flag: "\u{1F1F2}\u{1F1FD}", country: "Mexico" },
  { code: "+54", flag: "\u{1F1E6}\u{1F1F7}", country: "Argentina" },
  { code: "+55", flag: "\u{1F1E7}\u{1F1F7}", country: "Brazil" },
  { code: "+56", flag: "\u{1F1E8}\u{1F1F1}", country: "Chile" },
  { code: "+57", flag: "\u{1F1E8}\u{1F1F4}", country: "Colombia" },
  { code: "+90", flag: "\u{1F1F9}\u{1F1F7}", country: "Turkey" },
  { code: "+972", flag: "\u{1F1EE}\u{1F1F1}", country: "Israel" },
  { code: "+971", flag: "\u{1F1E6}\u{1F1EA}", country: "United Arab Emirates" },
  { code: "+966", flag: "\u{1F1F8}\u{1F1E6}", country: "Saudi Arabia" },
  { code: "+61", flag: "\u{1F1E6}\u{1F1FA}", country: "Australia" },
  { code: "+81", flag: "\u{1F1EF}\u{1F1F5}", country: "Japan" },
  { code: "+82", flag: "\u{1F1F0}\u{1F1F7}", country: "South Korea" },
  { code: "+86", flag: "\u{1F1E8}\u{1F1F3}", country: "China" },
  { code: "+91", flag: "\u{1F1EE}\u{1F1F3}", country: "India" },
  { code: "+60", flag: "\u{1F1F2}\u{1F1FE}", country: "Malaysia" },
  { code: "+65", flag: "\u{1F1F8}\u{1F1EC}", country: "Singapore" },
  { code: "+66", flag: "\u{1F1F9}\u{1F1ED}", country: "Thailand" },
  { code: "+62", flag: "\u{1F1EE}\u{1F1E9}", country: "Indonesia" },
  { code: "+63", flag: "\u{1F1F5}\u{1F1ED}", country: "Philippines" },
  { code: "+212", flag: "\u{1F1F2}\u{1F1E6}", country: "Morocco" },
  { code: "+27", flag: "\u{1F1FF}\u{1F1E6}", country: "South Africa" },
  { code: "+20", flag: "\u{1F1EA}\u{1F1EC}", country: "Egypt" },
  { code: "+234", flag: "\u{1F1F3}\u{1F1EC}", country: "Nigeria" },
  { code: "+254", flag: "\u{1F1F0}\u{1F1EA}", country: "Kenya" },
  { code: "+30", flag: "\u{1F1EC}\u{1F1F7}", country: "Greece" },
  { code: "+36", flag: "\u{1F1ED}\u{1F1FA}", country: "Hungary" },
  { code: "+40", flag: "\u{1F1F7}\u{1F1F4}", country: "Romania" },
  { code: "+359", flag: "\u{1F1E7}\u{1F1EC}", country: "Bulgaria" },
  { code: "+385", flag: "\u{1F1ED}\u{1F1F7}", country: "Croatia" },
  { code: "+386", flag: "\u{1F1F8}\u{1F1EE}", country: "Slovenia" },
  { code: "+381", flag: "\u{1F1F7}\u{1F1F8}", country: "Serbia" },
  { code: "+370", flag: "\u{1F1F1}\u{1F1F9}", country: "Lithuania" },
  { code: "+371", flag: "\u{1F1F1}\u{1F1FB}", country: "Latvia" },
  { code: "+372", flag: "\u{1F1EA}\u{1F1EA}", country: "Estonia" },
  { code: "+421", flag: "\u{1F1F8}\u{1F1F0}", country: "Slovakia" },
  { code: "+376", flag: "\u{1F1E6}\u{1F1E9}", country: "Andorra" },
  { code: "+352", flag: "\u{1F1F1}\u{1F1FA}", country: "Luxembourg" },
  { code: "+356", flag: "\u{1F1F2}\u{1F1F9}", country: "Malta" },
  { code: "+357", flag: "\u{1F1E8}\u{1F1FE}", country: "Cyprus" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
];

// Map icon name strings from boatData to Lucide icon components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Crown,
  Zap,
  Snowflake,
  Eye,
  Waves,
  CircleParking,
  Beer,
};

interface BookingFormWidgetProps {
  preSelectedBoatId?: string;
  prefillDate?: string;
  prefillTime?: string;
  onClose?: () => void;
  hideHeader?: boolean;
}

export default function BookingFormWidget({ preSelectedBoatId, prefillDate, prefillTime, onClose }: BookingFormWidgetProps) {
  const getLocalISODate = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+34");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("2");
  const [preferredTime, setPreferredTime] = useState(prefillTime || "");
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<"with" | "without">("without");
  const [selectedBoat, setSelectedBoat] = useState<string>(preSelectedBoatId || "");
  const [selectedDate, setSelectedDate] = useState(() => prefillDate || getLocalISODate());
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

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

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

  // Filter prefixes by search
  const filteredPrefixes = PHONE_PREFIXES.filter(prefix =>
    prefix.code.replace(/[+-]/g, '').includes(prefixSearch.replace(/[+-]/g, '')) ||
    prefix.country.toLowerCase().includes(prefixSearch.toLowerCase())
  );

  // Get selected prefix info
  const selectedPrefixInfo = PHONE_PREFIXES.find(p => p.code === phonePrefix);

  // Fetch all boats from API
  const { data: allBoats = [], isLoading: isBoatsLoading } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });

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

  // Duration options based on license requirement
  const getDurationOptions = () => {
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

    if (!selectedBoatInfo) {
      if (licenseFilter === "with") {
        return [
          { value: "2h", label: t.booking.twoHours || "2 horas" },
          { value: "4h", label: t.booking.fourHours || "4 horas - Medio día" },
          { value: "8h", label: t.booking.eightHours || "8 horas - Día completo" },
        ];
      } else if (licenseFilter === "without") {
        return [
          { value: "1h", label: t.booking.oneHour || "1 hora" },
          { value: "2h", label: t.booking.twoHours || "2 horas" },
          { value: "3h", label: t.booking.threeHours || "3 horas" },
          { value: "4h", label: t.booking.fourHours || "4 horas - Medio día" },
          { value: "6h", label: t.booking.sixHours || "6 horas" },
          { value: "8h", label: t.booking.eightHours || "8 horas - Día completo" },
        ];
      }
      return [
        { value: "1h", label: t.booking.oneHour || "1 hora" },
        { value: "2h", label: t.booking.twoHours || "2 horas" },
        { value: "3h", label: t.booking.threeHours || "3 horas" },
        { value: "4h", label: t.booking.fourHours || "4 horas - Medio día" },
        { value: "6h", label: t.booking.sixHours || "6 horas" },
        { value: "8h", label: t.booking.eightHours || "8 horas - Día completo" },
      ];
    }

    if (selectedBoatInfo.requiresLicense) {
      return [
        { value: "2h", label: formatLabel("2h", t.booking.twoHours || "2 horas") },
        { value: "4h", label: formatLabel("4h", t.booking.fourHours || "4 horas - Medio día") },
        { value: "8h", label: formatLabel("8h", t.booking.eightHours || "8 horas - Día completo") },
      ];
    } else {
      return [
        { value: "1h", label: formatLabel("1h", t.booking.oneHour || "1 hora") },
        { value: "2h", label: formatLabel("2h", t.booking.twoHours || "2 horas") },
        { value: "3h", label: formatLabel("3h", t.booking.threeHours || "3 horas") },
        { value: "4h", label: formatLabel("4h", t.booking.fourHours || "4 horas - Medio día") },
        { value: "6h", label: formatLabel("6h", t.booking.sixHours || "6 horas") },
        { value: "8h", label: formatLabel("8h", t.booking.eightHours || "8 horas - Día completo") },
      ];
    }
  };

  // Reset duration only when the season changes (not on every date change within the same season)
  useEffect(() => {
    const newSeason = getCurrentSeason();
    if (prevSeasonRef.current && prevSeasonRef.current !== newSeason) {
      setSelectedDuration("");
    }
    prevSeasonRef.current = newSeason;
  }, [selectedDate]);

  // Reset duration if it's no longer valid when boat or license changes
  useEffect(() => {
    if (selectedDuration) {
      const validOptions = getDurationOptions();
      const isValid = validOptions.some(opt => opt.value === selectedDuration);
      if (!isValid) {
        setSelectedDuration("");
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

  // Reset extras when boat changes
  useEffect(() => {
    setSelectedExtras([]);
    setSelectedPack(null);
  }, [selectedBoat]);

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

  // Inline validation
  const getFieldError = (field: string): string => {
    switch (field) {
      case 'firstName':
        return !firstName.trim() ? t.validation.required : '';
      case 'lastName':
        return !lastName.trim() ? t.validation.required : '';
      case 'email':
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t.validation.invalidEmail;
        return '';
      case 'phone':
        if (!phoneNumber.trim()) return t.validation.required;
        if (!/^\d+$/.test(phoneNumber.trim())) return t.validation.invalidPhone;
        if (phoneNumber.trim().length < 6) return t.validation.invalidPhone;
        return '';
      case 'date':
        if (!selectedDate) return t.validation.required;
        if (selectedDate < getLocalISODate()) return t.validation.futureDate;
        return '';
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
    return !!selectedBoat && !!selectedDate && selectedDate >= getLocalISODate();
  };

  const canAdvanceFromStep2 = (): boolean => {
    const n = parseInt(numberOfPeople);
    return !!selectedDuration && !!preferredTime && !!numberOfPeople && n >= 1 && n <= getMaxCapacity();
  };

  const canAdvanceFromStep3 = (): boolean => {
    const emailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phone = phoneNumber.trim();
    return (
      !!firstName.trim() &&
      !!lastName.trim() &&
      !!phone &&
      /^\d+$/.test(phone) &&
      phone.length >= 6 &&
      emailValid
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!canAdvanceFromStep1()) {
        setTouched(prev => ({ ...prev, boat: true, date: true }));
        return;
      }
    }
    if (currentStep === 2) {
      if (!canAdvanceFromStep2()) {
        setTouched(prev => ({ ...prev, duration: true, time: true, people: true }));
        return;
      }
    }
    if (currentStep === 3) {
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
      parts.push(`Extras: ${nonPackExtras.join(', ')}`);
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
    const totalPrice = price ? price + totalExtrasPrice - codeDiscount : null;

    let codeBlock = '';
    if (validatedCode) {
      if (validatedCode.type === 'gift_card') {
        codeBlock = isSpanish
          ? `\n\n*TARJETA REGALO*\nCodigo: ${validatedCode.code}\nValor: -${codeDiscount}€`
          : `\n\n*GIFT CARD*\nCode: ${validatedCode.code}\nValue: -${codeDiscount}€`;
      } else if (validatedCode.type === 'discount') {
        codeBlock = isSpanish
          ? `\n\n*DESCUENTO*\nCodigo: ${validatedCode.code}\nDescuento: ${validatedCode.percentage}% (-${codeDiscount}€)`
          : `\n\n*DISCOUNT*\nCode: ${validatedCode.code}\nDiscount: ${validatedCode.percentage}% (-${codeDiscount}€)`;
      }
    }

    if (isSpanish) {
      return `Hola! Me gustaría reservar un barco:

*DATOS DEL CLIENTE*
Nombre: ${fullName}
Tel: ${phone}
Email: ${email.trim()}

*DETALLES DE LA RESERVA*
Barco: ${boatName}
Fecha: ${formattedDate}
Hora inicio: ${preferredTime}h
Duracion: ${durationText}
Personas: ${numberOfPeople} de ${capacity} max
Temporada: ${getSeasonLabel()}
Precio base: ${price ? price + '€' : 'Consultar'}${extrasBlock ? '\n\n*EXTRAS*' + extrasBlock : ''}${codeBlock}
${totalPrice ? `\n*PRECIO TOTAL: ${totalPrice}€*` : ''}
Fianza: ${deposit}

Quedo a la espera de confirmacion. Gracias!`;
    } else {
      return `Hello! I would like to book a boat:

*CLIENT DETAILS*
Name: ${fullName}
Phone: ${phone}
Email: ${email.trim()}

*BOOKING DETAILS*
Boat: ${boatName}
Date: ${formattedDate}
Start time: ${preferredTime}h
Duration: ${durationText}
People: ${numberOfPeople} of ${capacity} max
Season: ${getSeasonLabel()}
Base price: ${price ? price + '€' : 'Ask'}${extrasBlock ? '\n\n*EXTRAS*' + extrasBlock : ''}${codeBlock}
${totalPrice ? `\n*TOTAL PRICE: ${totalPrice}€*` : ''}
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
        setValidatedCode({
          type: "discount",
          code,
          percentage: data.percentage || data.discount,
        });
        setIsValidatingCode(false);
        return;
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
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

    // Soft availability check — warn if boat appears fully booked, but don't block
    try {
      const month = selectedDate.substring(0, 7);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`/api/boats/${selectedBoat}/availability?month=${month}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const dayData = data.days?.[selectedDate];
        if (dayData?.status === 'booked') {
          toast({
            title: isSpanishLang ? 'Posible conflicto de disponibilidad' : 'Possible availability conflict',
            description: isSpanishLang
              ? 'Ese día el barco puede estar ocupado. Lo confirmaremos por WhatsApp.'
              : 'The boat may already be booked that day. We will confirm via WhatsApp.',
            variant: 'destructive',
          });
        }
      }
    } catch {
      // Network timeout or error — proceed anyway
    }

    trackBookingStarted(selectedBoat, selectedBoatInfo?.name || selectedBoat);

    const message = createWhatsAppBookingMessage();
    openWhatsApp(message);

    toast({
      title: isSpanishLang ? 'Solicitud enviada por WhatsApp' : 'Request sent via WhatsApp',
      description: isSpanishLang
        ? 'Revisa WhatsApp para confirmar tu reserva con nosotros.'
        : 'Check WhatsApp to confirm your booking with us.',
    });

    setCurrentStep(1);
    if (onClose) {
      onClose();
    }
  };

  const sharedProps = {
    currentStep,
    onNext: handleNextStep,
    onBack: handlePrevStep,
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
  };

  if (isMobile) {
    return <BookingWizardMobile {...sharedProps} />;
  }
  return <BookingFormDesktop {...sharedProps} />;
}
