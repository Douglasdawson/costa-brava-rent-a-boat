import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Anchor, Clock, User, Users, Mail, Phone as PhoneIcon, ChevronDown, Search, Package, Crown, Zap, Snowflake, Eye, Waves, CircleParking, Beer, Check, ChevronUp, Gift, Tag, Loader2, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { openWhatsApp } from "@/utils/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/translations";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { getBoatImage } from "@/utils/boatImages";
import { trackBookingStarted } from "@/utils/analytics";
import { BOAT_DATA, EXTRA_PACKS } from "@shared/boatData";
import { calculateExtrasPrice, calculatePackSavings } from "@shared/pricing";

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
  { code: "+354", flag: "\u{1F1EE}\u{1F1F8}", country: "Iceland" },
  { code: "+377", flag: "\u{1F1F2}\u{1F1E8}", country: "Monaco" },
  { code: "+350", flag: "\u{1F1EC}\u{1F1EE}", country: "Gibraltar" },
];

// Time slots from 9:00 to 18:00 in 30min increments
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
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
  onClose?: () => void;
  hideHeader?: boolean;
}

export default function BookingFormWidget({ preSelectedBoatId, onClose, hideHeader = false }: BookingFormWidgetProps) {
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
  const [numberOfPeople, setNumberOfPeople] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<"with" | "without">("without");
  const [selectedBoat, setSelectedBoat] = useState<string>(preSelectedBoatId || "");
  const [selectedDate, setSelectedDate] = useState(() => getLocalISODate());
  const [selectedDuration, setSelectedDuration] = useState<string>("");

  // Extras & Packs state
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState(false);

  // Gift card / discount code state
  const [showCodeSection, setShowCodeSection] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [validatedCode, setValidatedCode] = useState<{
    type: "gift_card" | "discount";
    code: string;
    value?: number;       // For gift cards: amount in EUR
    percentage?: number;  // For discounts: percentage off
  } | null>(null);
  const [codeError, setCodeError] = useState("");

  // Track which fields the user has interacted with (blurred)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const { toast } = useToast();
  const t = useTranslations();
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
  const { data: allBoats = [] } = useQuery<Boat[]>({
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
          { value: "4h", label: t.booking.fourHours || "4 horas - Media día" },
          { value: "8h", label: t.booking.eightHours || "8 horas - Día completo" },
        ];
      } else if (licenseFilter === "without") {
        return [
          { value: "1h", label: t.booking.oneHour || "1 hora" },
          { value: "2h", label: t.booking.twoHours || "2 horas" },
          { value: "3h", label: t.booking.threeHours || "3 horas" },
          { value: "4h", label: t.booking.fourHours || "4 horas - Media día" },
          { value: "6h", label: t.booking.sixHours || "6 horas" },
          { value: "8h", label: t.booking.eightHours || "8 horas - Día completo" },
        ];
      }
      return [
        { value: "1h", label: t.booking.oneHour || "1 hora" },
        { value: "2h", label: t.booking.twoHours || "2 horas" },
        { value: "3h", label: t.booking.threeHours || "3 horas" },
        { value: "4h", label: t.booking.fourHours || "4 horas - Media día" },
        { value: "6h", label: t.booking.sixHours || "6 horas" },
        { value: "8h", label: t.booking.eightHours || "8 horas - Día completo" },
      ];
    }

    if (selectedBoatInfo.requiresLicense) {
      return [
        { value: "2h", label: formatLabel("2h", t.booking.twoHours || "2 horas") },
        { value: "4h", label: formatLabel("4h", t.booking.fourHours || "4 horas - Media día") },
        { value: "8h", label: formatLabel("8h", t.booking.eightHours || "8 horas - Día completo") },
      ];
    } else {
      return [
        { value: "1h", label: formatLabel("1h", t.booking.oneHour || "1 hora") },
        { value: "2h", label: formatLabel("2h", t.booking.twoHours || "2 horas") },
        { value: "3h", label: formatLabel("3h", t.booking.threeHours || "3 horas") },
        { value: "4h", label: formatLabel("4h", t.booking.fourHours || "4 horas - Media día") },
        { value: "6h", label: formatLabel("6h", t.booking.sixHours || "6 horas") },
        { value: "8h", label: formatLabel("8h", t.booking.eightHours || "8 horas - Día completo") },
      ];
    }
  };

  // Reset duration when date changes to ensure correct seasonal pricing
  useEffect(() => {
    setSelectedDuration("");
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
    if (selectedPack === packId) {
      // Deselect pack
      setSelectedPack(null);
      setSelectedExtras([]);
    } else {
      setSelectedPack(packId);
      const pack = EXTRA_PACKS.find(p => p.id === packId);
      if (pack) {
        // Auto-select the extras included in this pack
        // Keep any extras that are NOT in the pack but were individually selected
        const nonPackExtras = selectedExtras.filter(e => !pack.extras.includes(e));
        setSelectedExtras([...pack.extras, ...nonPackExtras]);
      }
    }
  };

  // Handle individual extra toggle
  const handleExtraToggle = (extraName: string) => {
    // If this extra is part of the selected pack, do not allow toggling it off
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

  // Inline validation: returns error message for a given field, or empty string if valid
  const getFieldError = (field: string): string => {
    switch (field) {
      case 'firstName':
        return !firstName.trim() ? t.validation.required : '';
      case 'lastName':
        return !lastName.trim() ? t.validation.required : '';
      case 'email':
        if (!email.trim()) return t.validation.required;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t.validation.invalidEmail;
        return '';
      case 'phone':
        if (!phoneNumber.trim()) return t.validation.required;
        if (!/^\d+$/.test(phoneNumber.trim())) return t.validation.invalidPhone;
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

  // Check if a field should show an error (touched AND invalid)
  const showFieldError = (field: string): boolean => {
    return !!touched[field] && !!getFieldError(field);
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

  // Get season label for the WhatsApp message
  const getSeasonLabel = () => {
    const season = getCurrentSeason();
    if (season === "ALTA") return "Alta (Agosto)";
    if (season === "MEDIA") return "Media (Julio)";
    return "Baja (Abr-Jun, Sep-Oct)";
  };

  // Build extras text for WhatsApp message
  const buildExtrasText = (isSpanish: boolean) => {
    const parts: string[] = [];

    if (selectedPack) {
      const pack = EXTRA_PACKS.find(p => p.id === selectedPack);
      if (pack) {
        parts.push(`${isSpanish ? 'Pack' : 'Pack'}: ${isSpanish ? pack.name : pack.nameEN} (${pack.price}€)`);
      }
    }

    // Individual extras not in the pack
    const nonPackExtras = selectedExtras.filter(e => !extrasInPack.has(e));
    if (nonPackExtras.length > 0) {
      parts.push(`${isSpanish ? 'Extras' : 'Extras'}: ${nonPackExtras.join(', ')}`);
    }

    if (parts.length === 0) return '';
    return parts.join('\n');
  };

  // Create WhatsApp message with all booking details
  const createWhatsAppBookingMessage = () => {
    const isSpanish = phonePrefix === '+34';
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

    // Build code info block
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

  // Validate a gift card or discount code
  const handleValidateCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;

    setIsValidatingCode(true);
    setCodeError("");

    try {
      // Try gift card validation first
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

      // If gift card didn't work, try discount code
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

      // Neither worked - invalid code
      setCodeError(t.codeValidation.invalidCode);
    } catch {
      setCodeError(t.codeValidation.invalidCode);
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Remove validated code
  const handleRemoveCode = () => {
    setValidatedCode(null);
    setCodeInput("");
    setCodeError("");
  };

  // Calculate discount amount based on validated code
  const getCodeDiscount = (): number => {
    if (!validatedCode) return 0;
    const basePrice = getBookingPrice() || 0;
    const total = basePrice + totalExtrasPrice;

    if (validatedCode.type === "gift_card" && validatedCode.value) {
      // Gift card: apply up to the total amount
      return Math.min(validatedCode.value, total);
    }
    if (validatedCode.type === "discount" && validatedCode.percentage) {
      // Discount: percentage off the base price only
      return Math.round((basePrice * validatedCode.percentage) / 100);
    }
    return 0;
  };

  const handleBookingSearch = () => {
    // Mark all fields as touched so inline errors appear on submit attempt
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
    if (!email.trim()) {
      toast({ title: t.booking.emailRequired, description: t.booking.emailRequiredDesc, variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

    // Track booking started conversion event
    trackBookingStarted(selectedBoat, selectedBoatInfo?.name || selectedBoat);

    const message = createWhatsAppBookingMessage();
    openWhatsApp(message);

    if (onClose) {
      onClose();
    }
  };

  return (
    <Card id="booking-form" className="bg-white/75 backdrop-blur-md p-3 sm:p-4 w-full shadow-2xl border-0">
      {!hideHeader && (
        <div className="text-center mb-2 sm:mb-3">
          <h2 className="text-base sm:text-base lg:text-lg font-bold text-gray-900 mb-2 sm:mb-3">{t.booking.title}</h2>
          <p className="text-xs [@media(min-width:400px)]:text-sm text-gray-600">
            {t.booking.modalSubtitle}
          </p>
        </div>
      )}

      {/* Personal Information Section */}
      <div className="bg-gray-50/80 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {/* First Name */}
          <div className={`bg-white rounded-lg p-2 sm:p-3 shadow-sm border ${showFieldError('firstName') ? 'border-red-500' : 'border-gray-100'}`}>
            <label htmlFor="first-name" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              {t.booking.firstName}
            </label>
            <input
              type="text"
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => handleBlur('firstName')}
              placeholder="Ej: Juan"
              autoComplete="given-name"
              className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm sm:text-sm text-center md:text-left"
              data-testid="input-first-name"
            />
            {showFieldError('firstName') && (
              <p className="text-xs text-red-500 mt-1">{getFieldError('firstName')}</p>
            )}
          </div>

          {/* Last Name */}
          <div className={`bg-white rounded-lg p-2 sm:p-3 shadow-sm border ${showFieldError('lastName') ? 'border-red-500' : 'border-gray-100'}`}>
            <label htmlFor="last-name" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              {t.booking.lastName}
            </label>
            <input
              type="text"
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => handleBlur('lastName')}
              placeholder="Ej: Garcia Lopez"
              autoComplete="family-name"
              className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm sm:text-sm text-center md:text-left"
              data-testid="input-last-name"
            />
            {showFieldError('lastName') && (
              <p className="text-xs text-red-500 mt-1">{getFieldError('lastName')}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className={`col-span-2 lg:col-span-1 bg-white rounded-lg p-2 sm:p-3 shadow-sm border ${showFieldError('phone') ? 'border-red-500' : 'border-gray-100'}`}>
            <label htmlFor="phone-number" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <PhoneIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              {t.booking.phone}
            </label>
            <div className="flex gap-1">
              <div className="relative w-20 sm:w-24 lg:w-24" ref={prefixDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
                  className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm flex items-center justify-between"
                  data-testid="button-phone-prefix"
                >
                  <span>{selectedPrefixInfo?.flag} {phonePrefix}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showPrefixDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-[min(16rem,calc(100vw-3rem))] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    <div className="p-2 border-b sticky top-0 bg-white">
                      <input
                        type="text"
                        value={prefixSearch}
                        onChange={(e) => setPrefixSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        data-testid="input-prefix-search"
                      />
                    </div>
                    <div>
                      {filteredPrefixes.map((prefix) => (
                        <button
                          key={`${prefix.code}-${prefix.country}`}
                          type="button"
                          onClick={() => {
                            setPhonePrefix(prefix.code);
                            setShowPrefixDropdown(false);
                            setPrefixSearch("");
                          }}
                          className="w-full p-2 hover:bg-gray-100 text-left flex items-center gap-2 text-sm transition-colors"
                        >
                          <span className="text-lg">{prefix.flag}</span>
                          <span className="font-medium">{prefix.code}</span>
                          <span className="text-gray-600 text-xs">{prefix.country}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input
                type="tel"
                id="phone-number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="123456789"
                autoComplete="tel"
                className="flex-1 p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm"
                data-testid="input-phone-number"
              />
            </div>
            {showFieldError('phone') && (
              <p className="text-xs text-red-500 mt-1">{getFieldError('phone')}</p>
            )}
          </div>

          {/* Email */}
          <div className={`col-span-2 lg:col-span-1 bg-white rounded-lg p-2 sm:p-3 shadow-sm border ${showFieldError('email') ? 'border-red-500' : 'border-gray-100'}`}>
            <label htmlFor="email" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              {t.booking.emailLabel}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm text-center md:text-left"
              data-testid="input-email"
            />
            {showFieldError('email') && (
              <p className="text-xs text-red-500 mt-1">{getFieldError('email')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Section */}
      <div className="bg-gray-50/80 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Date */}
          <div className={`bg-white rounded-lg p-2 sm:p-3 shadow-sm border ${showFieldError('date') ? 'border-red-500' : 'border-gray-100'}`}>
            <label htmlFor="booking-date" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              {t.booking.date}
            </label>
            <input
              type="date"
              id="booking-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              onBlur={() => handleBlur('date')}
              min={getLocalISODate()}
              className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm"
              data-testid="input-booking-date"
            />
            {showFieldError('date') && (
              <p className="text-xs text-red-500 mt-1">{getFieldError('date')}</p>
            )}
          </div>

          {/* Preferred Time */}
          <div className={`bg-white rounded-lg p-2 sm:p-3 shadow-sm border ${showFieldError('time') ? 'border-red-500' : 'border-gray-100'}`}>
            <label htmlFor="preferred-time" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              {t.booking.preferredTime}
            </label>
            <select
              id="preferred-time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              onBlur={() => handleBlur('time')}
              className="clean-select w-full p-2 sm:p-2.5 border-0 !bg-white rounded-md focus:outline-none text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm"
              data-testid="select-preferred-time"
            >
              <option value="">{t.booking.selectTime}</option>
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>{time}h</option>
              ))}
            </select>
            {showFieldError('time') && (
              <p className="text-xs text-red-500 mt-1">{getFieldError('time')}</p>
            )}
          </div>

          {/* Boat Selection */}
          <div className={`col-span-2 bg-white rounded-lg p-2 sm:p-3 shadow-sm border ${showFieldError('boat') ? 'border-red-500' : 'border-gray-100'}`}>
            <label htmlFor="boat-select" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <Anchor className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              {t.booking.boat}
            </label>
            <div className="space-y-1">
              {!preSelectedBoatId && (
                <div className="flex gap-1 mb-1">
                  <button
                    type="button"
                    onClick={() => setLicenseFilter("without")}
                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      licenseFilter === "without"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    data-testid="button-filter-without"
                  >
                    {t.booking.withoutLicense}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLicenseFilter("with")}
                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      licenseFilter === "with"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    data-testid="button-filter-with"
                  >
                    {t.booking.withLicense}
                  </button>
                </div>
              )}
              <select
                id="boat-select"
                value={selectedBoat}
                onChange={(e) => setSelectedBoat(e.target.value)}
                onBlur={() => handleBlur('boat')}
                disabled={!!preSelectedBoatId}
                className="clean-select w-full p-2 sm:p-2.5 border-0 !bg-white rounded-md focus:outline-none text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm disabled:opacity-60"
                data-testid="select-boat"
              >
                <option value="">{t.booking.select}</option>
                {filteredBoats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.name}
                  </option>
                ))}
              </select>
            </div>
            {showFieldError('boat') && (
              <p className="text-xs text-red-500 mt-1">{getFieldError('boat')}</p>
            )}
          </div>

          {/* Duration */}
          <div className={`bg-white rounded-lg p-2 sm:p-3 shadow-sm border ${showFieldError('duration') ? 'border-red-500' : 'border-gray-100'}`}>
            <label htmlFor="duration-select" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              {t.booking.duration}
            </label>
            <select
              id="duration-select"
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
              onBlur={() => handleBlur('duration')}
              className="clean-select w-full p-2 sm:p-2.5 border-0 !bg-white rounded-md focus:outline-none text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm"
              data-testid="select-duration"
            >
              <option value="">{t.booking.select}</option>
              {getDurationOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedBoat && (
              <p className="text-[10px] text-gray-500 mt-1 text-center md:text-left">
                {t.booking.pricesUpdateByDate}
              </p>
            )}
            {showFieldError('duration') && (
              <p className="text-xs text-red-500 mt-1">{getFieldError('duration')}</p>
            )}
          </div>

          {/* Number of People */}
          <div className={`bg-white rounded-lg p-2 sm:p-3 shadow-sm border ${showFieldError('people') ? 'border-red-500' : 'border-gray-100'}`}>
            <label htmlFor="number-of-people" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              {t.booking.numberOfPeople}
            </label>
            <input
              type="number"
              id="number-of-people"
              value={numberOfPeople}
              onChange={(e) => {
                const val = e.target.value;
                const max = getMaxCapacity();
                if (val === "" || (parseInt(val) >= 1 && parseInt(val) <= max)) {
                  setNumberOfPeople(val);
                }
              }}
              onBlur={() => handleBlur('people')}
              min={1}
              max={getMaxCapacity()}
              placeholder={`1-${getMaxCapacity()}`}
              className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm text-center"
              data-testid="input-number-of-people"
            />
            {selectedBoatInfo && (
              <p className="text-[10px] text-gray-500 mt-1 text-center">
                max {selectedBoatInfo.capacity}
              </p>
            )}
            {showFieldError('people') && (
              <p className="text-xs text-red-500 mt-1">{getFieldError('people')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Extras & Packs Section - only show when a boat is selected */}
      {selectedBoat && boatExtras.length > 0 && (
        <div className="bg-gray-50/80 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
          {/* Collapsible header */}
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="w-full flex items-center justify-between text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1"
          >
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-primary" />
              {t.booking.extrasSection?.title || 'Extras y Packs'}
              {(selectedExtras.length > 0 || selectedPack) && (
                <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {selectedPack ? '1 pack' : ''}{selectedExtras.filter(e => !extrasInPack.has(e)).length > 0 ? `${selectedPack ? ' + ' : ''}${selectedExtras.filter(e => !extrasInPack.has(e)).length}` : ''}
                </span>
              )}
              {totalExtrasPrice > 0 && (
                <span className="text-primary font-bold text-xs">+{totalExtrasPrice}€</span>
              )}
            </span>
            {showExtras ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {showExtras && (
            <div className="space-y-3 mt-2">
              {/* Packs Section */}
              <div>
                <p className="text-[11px] [@media(min-width:400px)]:text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {t.booking.extrasSection?.packs || 'Packs con descuento'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {/* No pack option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPack(null);
                      setSelectedExtras([]);
                    }}
                    className={`relative p-2 sm:p-2.5 rounded-lg border-2 transition-all text-left ${
                      !selectedPack
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${!selectedPack ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                        {!selectedPack && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{t.booking.extrasSection?.noPack || 'Sin pack'}</span>
                    </div>
                  </button>

                  {/* Pack cards */}
                  {EXTRA_PACKS.map((pack) => {
                    const isSelected = selectedPack === pack.id;
                    const savings = calculatePackSavings(pack.id);
                    const IconComp = ICON_MAP[pack.icon] || Package;
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => handlePackSelect(pack.id)}
                        className={`relative p-2 sm:p-2.5 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {/* Savings badge */}
                        {savings > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            -{savings.toFixed(2).replace('.00', '')}€
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                            {isSelected && <Check className="w-2 h-2 text-white" />}
                          </div>
                          <IconComp className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-xs font-semibold text-gray-800 truncate">{pack.name}</span>
                        </div>
                        <div className="pl-5 space-y-0.5">
                          <p className="text-[10px] text-gray-500">
                            {t.booking.extrasSection?.included || 'Incluye'}: {pack.extras.join(', ')}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-primary">{pack.price}€</span>
                            <span className="text-[10px] text-gray-400 line-through">{pack.originalPrice}€</span>
                            {savings > 0 && (
                              <span className="text-[10px] text-green-600 font-medium">
                                {t.booking.extrasSection?.savings || 'Ahorras'} {savings.toFixed(2).replace('.00', '')}€
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Individual Extras Section */}
              <div>
                <p className="text-[11px] [@media(min-width:400px)]:text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {t.booking.extrasSection?.individual || 'Extras individuales'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                  {boatExtras.map((extra) => {
                    const isChecked = selectedExtras.includes(extra.name);
                    const isInPack = extrasInPack.has(extra.name);
                    const IconComp = ICON_MAP[extra.icon] || Package;
                    return (
                      <button
                        key={extra.name}
                        type="button"
                        onClick={() => handleExtraToggle(extra.name)}
                        disabled={isInPack}
                        className={`flex items-center gap-1.5 p-2 rounded-lg border transition-all text-left ${
                          isInPack
                            ? 'border-primary/40 bg-primary/10 opacity-75 cursor-not-allowed'
                            : isChecked
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                          isChecked || isInPack ? 'border-primary bg-primary' : 'border-gray-300'
                        }`}>
                          {(isChecked || isInPack) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <IconComp className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-gray-800 truncate">{extra.name}</p>
                          <p className="text-[10px] text-gray-500">{isInPack ? (t.booking.extrasSection?.packSelected || 'Pack') : extra.price}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gift Card / Discount Code Section */}
      <div className="bg-gray-50/80 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
        <button
          type="button"
          onClick={() => setShowCodeSection(!showCodeSection)}
          className="w-full flex items-center justify-between text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800"
        >
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary" />
            {t.codeValidation.haveCode}
            {validatedCode && (
              <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {t.codeValidation.applied}
              </span>
            )}
          </span>
          {showCodeSection ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {showCodeSection && (
          <div className="mt-2 space-y-2">
            {!validatedCode ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value.toUpperCase());
                      setCodeError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleValidateCode();
                      }
                    }}
                    placeholder={t.codeValidation.enterCode}
                    className="flex-1 p-2 sm:p-2.5 border border-gray-200 bg-white rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900 font-mono font-medium text-xs [@media(min-width:400px)]:text-sm uppercase tracking-wider"
                    data-testid="input-coupon-code"
                    disabled={isValidatingCode}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleValidateCode}
                    disabled={isValidatingCode || !codeInput.trim()}
                    className="px-4 h-auto"
                    data-testid="button-validate-code"
                  >
                    {isValidatingCode ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t.codeValidation.validate
                    )}
                  </Button>
                </div>
                {codeError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {codeError}
                  </p>
                )}
              </>
            ) : (
              <div className="bg-white border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    {validatedCode.type === "gift_card" ? (
                      <Gift className="w-4 h-4 text-green-600" />
                    ) : (
                      <Tag className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-700">
                      {validatedCode.type === "gift_card"
                        ? t.codeValidation.validGiftCard
                        : t.codeValidation.validDiscount}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono">{validatedCode.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-600">
                    {validatedCode.type === "gift_card"
                      ? `-${getCodeDiscount()}€`
                      : `-${validatedCode.percentage}%`}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCode}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label="Remove code"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleBookingSearch}
        className="w-full py-5 sm:py-6 md:py-4 text-sm sm:text-base md:text-sm font-semibold shadow-lg"
        data-testid="button-submit-booking"
      >
        <SiWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        {t.booking.sendBookingRequest}
      </Button>
    </Card>
  );
}
