import { useState, useEffect, useRef, useMemo } from "react";
import { Package, Crown, Zap, Snowflake, Eye, Waves, CircleParking, Beer } from "lucide-react";
import { openWhatsApp } from "@/utils/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { trackBookingStarted } from "@/utils/analytics";
import { getStoredUtm } from "@/hooks/useUtmCapture";
import { BOAT_DATA, EXTRA_PACKS } from "@shared/boatData";
import { calculateExtrasPrice, calculatePackSavings } from "@shared/pricing";
import BookingWizardMobile from "@/components/BookingWizardMobile";
import BookingFormDesktop from "@/components/BookingFormDesktop";
import { useIsMobile } from "@/hooks/use-mobile";

// Phone prefixes — Costa Brava tourism priorities first, then all countries A-Z
const PHONE_PREFIXES = [
  // Priority: top tourism origins for Costa Brava
  { code: "+34", flag: "\u{1F1EA}\u{1F1F8}", country: "Spain" },
  { code: "+33", flag: "\u{1F1EB}\u{1F1F7}", country: "France" },
  { code: "+44", flag: "\u{1F1EC}\u{1F1E7}", country: "United Kingdom" },
  { code: "+49", flag: "\u{1F1E9}\u{1F1EA}", country: "Germany" },
  { code: "+31", flag: "\u{1F1F3}\u{1F1F1}", country: "Netherlands" },
  { code: "+32", flag: "\u{1F1E7}\u{1F1EA}", country: "Belgium" },
  { code: "+39", flag: "\u{1F1EE}\u{1F1F9}", country: "Italy" },
  { code: "+351", flag: "\u{1F1F5}\u{1F1F9}", country: "Portugal" },
  { code: "+41", flag: "\u{1F1E8}\u{1F1ED}", country: "Switzerland" },
  { code: "+1", flag: "\u{1F1FA}\u{1F1F8}", country: "United States" },
  // All countries A-Z
  { code: "+93", flag: "\u{1F1E6}\u{1F1EB}", country: "Afghanistan" },
  { code: "+355", flag: "\u{1F1E6}\u{1F1F1}", country: "Albania" },
  { code: "+213", flag: "\u{1F1E9}\u{1F1FF}", country: "Algeria" },
  { code: "+376", flag: "\u{1F1E6}\u{1F1E9}", country: "Andorra" },
  { code: "+244", flag: "\u{1F1E6}\u{1F1F4}", country: "Angola" },
  { code: "+1268", flag: "\u{1F1E6}\u{1F1EC}", country: "Antigua and Barbuda" },
  { code: "+54", flag: "\u{1F1E6}\u{1F1F7}", country: "Argentina" },
  { code: "+374", flag: "\u{1F1E6}\u{1F1F2}", country: "Armenia" },
  { code: "+61", flag: "\u{1F1E6}\u{1F1FA}", country: "Australia" },
  { code: "+43", flag: "\u{1F1E6}\u{1F1F9}", country: "Austria" },
  { code: "+994", flag: "\u{1F1E6}\u{1F1FF}", country: "Azerbaijan" },
  { code: "+1242", flag: "\u{1F1E7}\u{1F1F8}", country: "Bahamas" },
  { code: "+973", flag: "\u{1F1E7}\u{1F1ED}", country: "Bahrain" },
  { code: "+880", flag: "\u{1F1E7}\u{1F1E9}", country: "Bangladesh" },
  { code: "+1246", flag: "\u{1F1E7}\u{1F1E7}", country: "Barbados" },
  { code: "+375", flag: "\u{1F1E7}\u{1F1FE}", country: "Belarus" },
  { code: "+501", flag: "\u{1F1E7}\u{1F1FF}", country: "Belize" },
  { code: "+229", flag: "\u{1F1E7}\u{1F1EF}", country: "Benin" },
  { code: "+975", flag: "\u{1F1E7}\u{1F1F9}", country: "Bhutan" },
  { code: "+591", flag: "\u{1F1E7}\u{1F1F4}", country: "Bolivia" },
  { code: "+387", flag: "\u{1F1E7}\u{1F1E6}", country: "Bosnia and Herzegovina" },
  { code: "+267", flag: "\u{1F1E7}\u{1F1FC}", country: "Botswana" },
  { code: "+55", flag: "\u{1F1E7}\u{1F1F7}", country: "Brazil" },
  { code: "+673", flag: "\u{1F1E7}\u{1F1F3}", country: "Brunei" },
  { code: "+359", flag: "\u{1F1E7}\u{1F1EC}", country: "Bulgaria" },
  { code: "+226", flag: "\u{1F1E7}\u{1F1EB}", country: "Burkina Faso" },
  { code: "+257", flag: "\u{1F1E7}\u{1F1EE}", country: "Burundi" },
  { code: "+855", flag: "\u{1F1F0}\u{1F1ED}", country: "Cambodia" },
  { code: "+237", flag: "\u{1F1E8}\u{1F1F2}", country: "Cameroon" },
  { code: "+1", flag: "\u{1F1E8}\u{1F1E6}", country: "Canada" },
  { code: "+238", flag: "\u{1F1E8}\u{1F1FB}", country: "Cape Verde" },
  { code: "+236", flag: "\u{1F1E8}\u{1F1EB}", country: "Central African Republic" },
  { code: "+235", flag: "\u{1F1F9}\u{1F1E9}", country: "Chad" },
  { code: "+56", flag: "\u{1F1E8}\u{1F1F1}", country: "Chile" },
  { code: "+86", flag: "\u{1F1E8}\u{1F1F3}", country: "China" },
  { code: "+57", flag: "\u{1F1E8}\u{1F1F4}", country: "Colombia" },
  { code: "+269", flag: "\u{1F1F0}\u{1F1F2}", country: "Comoros" },
  { code: "+242", flag: "\u{1F1E8}\u{1F1EC}", country: "Congo" },
  { code: "+243", flag: "\u{1F1E8}\u{1F1E9}", country: "Congo (DRC)" },
  { code: "+506", flag: "\u{1F1E8}\u{1F1F7}", country: "Costa Rica" },
  { code: "+385", flag: "\u{1F1ED}\u{1F1F7}", country: "Croatia" },
  { code: "+53", flag: "\u{1F1E8}\u{1F1FA}", country: "Cuba" },
  { code: "+357", flag: "\u{1F1E8}\u{1F1FE}", country: "Cyprus" },
  { code: "+420", flag: "\u{1F1E8}\u{1F1FF}", country: "Czech Republic" },
  { code: "+45", flag: "\u{1F1E9}\u{1F1F0}", country: "Denmark" },
  { code: "+253", flag: "\u{1F1E9}\u{1F1EF}", country: "Djibouti" },
  { code: "+1767", flag: "\u{1F1E9}\u{1F1F2}", country: "Dominica" },
  { code: "+1809", flag: "\u{1F1E9}\u{1F1F4}", country: "Dominican Republic" },
  { code: "+593", flag: "\u{1F1EA}\u{1F1E8}", country: "Ecuador" },
  { code: "+20", flag: "\u{1F1EA}\u{1F1EC}", country: "Egypt" },
  { code: "+503", flag: "\u{1F1F8}\u{1F1FB}", country: "El Salvador" },
  { code: "+240", flag: "\u{1F1EC}\u{1F1F6}", country: "Equatorial Guinea" },
  { code: "+291", flag: "\u{1F1EA}\u{1F1F7}", country: "Eritrea" },
  { code: "+372", flag: "\u{1F1EA}\u{1F1EA}", country: "Estonia" },
  { code: "+268", flag: "\u{1F1F8}\u{1F1FF}", country: "Eswatini" },
  { code: "+251", flag: "\u{1F1EA}\u{1F1F9}", country: "Ethiopia" },
  { code: "+679", flag: "\u{1F1EB}\u{1F1EF}", country: "Fiji" },
  { code: "+358", flag: "\u{1F1EB}\u{1F1EE}", country: "Finland" },
  { code: "+241", flag: "\u{1F1EC}\u{1F1E6}", country: "Gabon" },
  { code: "+220", flag: "\u{1F1EC}\u{1F1F2}", country: "Gambia" },
  { code: "+995", flag: "\u{1F1EC}\u{1F1EA}", country: "Georgia" },
  { code: "+233", flag: "\u{1F1EC}\u{1F1ED}", country: "Ghana" },
  { code: "+30", flag: "\u{1F1EC}\u{1F1F7}", country: "Greece" },
  { code: "+1473", flag: "\u{1F1EC}\u{1F1E9}", country: "Grenada" },
  { code: "+502", flag: "\u{1F1EC}\u{1F1F9}", country: "Guatemala" },
  { code: "+224", flag: "\u{1F1EC}\u{1F1F3}", country: "Guinea" },
  { code: "+245", flag: "\u{1F1EC}\u{1F1FC}", country: "Guinea-Bissau" },
  { code: "+592", flag: "\u{1F1EC}\u{1F1FE}", country: "Guyana" },
  { code: "+509", flag: "\u{1F1ED}\u{1F1F9}", country: "Haiti" },
  { code: "+504", flag: "\u{1F1ED}\u{1F1F3}", country: "Honduras" },
  { code: "+852", flag: "\u{1F1ED}\u{1F1F0}", country: "Hong Kong" },
  { code: "+36", flag: "\u{1F1ED}\u{1F1FA}", country: "Hungary" },
  { code: "+354", flag: "\u{1F1EE}\u{1F1F8}", country: "Iceland" },
  { code: "+91", flag: "\u{1F1EE}\u{1F1F3}", country: "India" },
  { code: "+62", flag: "\u{1F1EE}\u{1F1E9}", country: "Indonesia" },
  { code: "+98", flag: "\u{1F1EE}\u{1F1F7}", country: "Iran" },
  { code: "+964", flag: "\u{1F1EE}\u{1F1F6}", country: "Iraq" },
  { code: "+353", flag: "\u{1F1EE}\u{1F1EA}", country: "Ireland" },
  { code: "+972", flag: "\u{1F1EE}\u{1F1F1}", country: "Israel" },
  { code: "+225", flag: "\u{1F1E8}\u{1F1EE}", country: "Ivory Coast" },
  { code: "+1876", flag: "\u{1F1EF}\u{1F1F2}", country: "Jamaica" },
  { code: "+81", flag: "\u{1F1EF}\u{1F1F5}", country: "Japan" },
  { code: "+962", flag: "\u{1F1EF}\u{1F1F4}", country: "Jordan" },
  { code: "+7", flag: "\u{1F1F0}\u{1F1FF}", country: "Kazakhstan" },
  { code: "+254", flag: "\u{1F1F0}\u{1F1EA}", country: "Kenya" },
  { code: "+686", flag: "\u{1F1F0}\u{1F1EE}", country: "Kiribati" },
  { code: "+383", flag: "\u{1F1FD}\u{1F1F0}", country: "Kosovo" },
  { code: "+965", flag: "\u{1F1F0}\u{1F1FC}", country: "Kuwait" },
  { code: "+996", flag: "\u{1F1F0}\u{1F1EC}", country: "Kyrgyzstan" },
  { code: "+856", flag: "\u{1F1F1}\u{1F1E6}", country: "Laos" },
  { code: "+371", flag: "\u{1F1F1}\u{1F1FB}", country: "Latvia" },
  { code: "+961", flag: "\u{1F1F1}\u{1F1E7}", country: "Lebanon" },
  { code: "+266", flag: "\u{1F1F1}\u{1F1F8}", country: "Lesotho" },
  { code: "+231", flag: "\u{1F1F1}\u{1F1F7}", country: "Liberia" },
  { code: "+218", flag: "\u{1F1F1}\u{1F1FE}", country: "Libya" },
  { code: "+423", flag: "\u{1F1F1}\u{1F1EE}", country: "Liechtenstein" },
  { code: "+370", flag: "\u{1F1F1}\u{1F1F9}", country: "Lithuania" },
  { code: "+352", flag: "\u{1F1F1}\u{1F1FA}", country: "Luxembourg" },
  { code: "+853", flag: "\u{1F1F2}\u{1F1F4}", country: "Macau" },
  { code: "+261", flag: "\u{1F1F2}\u{1F1EC}", country: "Madagascar" },
  { code: "+265", flag: "\u{1F1F2}\u{1F1FC}", country: "Malawi" },
  { code: "+60", flag: "\u{1F1F2}\u{1F1FE}", country: "Malaysia" },
  { code: "+960", flag: "\u{1F1F2}\u{1F1FB}", country: "Maldives" },
  { code: "+223", flag: "\u{1F1F2}\u{1F1F1}", country: "Mali" },
  { code: "+356", flag: "\u{1F1F2}\u{1F1F9}", country: "Malta" },
  { code: "+692", flag: "\u{1F1F2}\u{1F1ED}", country: "Marshall Islands" },
  { code: "+222", flag: "\u{1F1F2}\u{1F1F7}", country: "Mauritania" },
  { code: "+230", flag: "\u{1F1F2}\u{1F1FA}", country: "Mauritius" },
  { code: "+52", flag: "\u{1F1F2}\u{1F1FD}", country: "Mexico" },
  { code: "+691", flag: "\u{1F1EB}\u{1F1F2}", country: "Micronesia" },
  { code: "+373", flag: "\u{1F1F2}\u{1F1E9}", country: "Moldova" },
  { code: "+377", flag: "\u{1F1F2}\u{1F1E8}", country: "Monaco" },
  { code: "+976", flag: "\u{1F1F2}\u{1F1F3}", country: "Mongolia" },
  { code: "+382", flag: "\u{1F1F2}\u{1F1EA}", country: "Montenegro" },
  { code: "+212", flag: "\u{1F1F2}\u{1F1E6}", country: "Morocco" },
  { code: "+258", flag: "\u{1F1F2}\u{1F1FF}", country: "Mozambique" },
  { code: "+95", flag: "\u{1F1F2}\u{1F1F2}", country: "Myanmar" },
  { code: "+264", flag: "\u{1F1F3}\u{1F1E6}", country: "Namibia" },
  { code: "+674", flag: "\u{1F1F3}\u{1F1F7}", country: "Nauru" },
  { code: "+977", flag: "\u{1F1F3}\u{1F1F5}", country: "Nepal" },
  { code: "+64", flag: "\u{1F1F3}\u{1F1FF}", country: "New Zealand" },
  { code: "+505", flag: "\u{1F1F3}\u{1F1EE}", country: "Nicaragua" },
  { code: "+227", flag: "\u{1F1F3}\u{1F1EA}", country: "Niger" },
  { code: "+234", flag: "\u{1F1F3}\u{1F1EC}", country: "Nigeria" },
  { code: "+850", flag: "\u{1F1F0}\u{1F1F5}", country: "North Korea" },
  { code: "+389", flag: "\u{1F1F2}\u{1F1F0}", country: "North Macedonia" },
  { code: "+47", flag: "\u{1F1F3}\u{1F1F4}", country: "Norway" },
  { code: "+968", flag: "\u{1F1F4}\u{1F1F2}", country: "Oman" },
  { code: "+92", flag: "\u{1F1F5}\u{1F1F0}", country: "Pakistan" },
  { code: "+680", flag: "\u{1F1F5}\u{1F1FC}", country: "Palau" },
  { code: "+970", flag: "\u{1F1F5}\u{1F1F8}", country: "Palestine" },
  { code: "+507", flag: "\u{1F1F5}\u{1F1E6}", country: "Panama" },
  { code: "+675", flag: "\u{1F1F5}\u{1F1EC}", country: "Papua New Guinea" },
  { code: "+595", flag: "\u{1F1F5}\u{1F1FE}", country: "Paraguay" },
  { code: "+51", flag: "\u{1F1F5}\u{1F1EA}", country: "Peru" },
  { code: "+63", flag: "\u{1F1F5}\u{1F1ED}", country: "Philippines" },
  { code: "+48", flag: "\u{1F1F5}\u{1F1F1}", country: "Poland" },
  { code: "+974", flag: "\u{1F1F6}\u{1F1E6}", country: "Qatar" },
  { code: "+40", flag: "\u{1F1F7}\u{1F1F4}", country: "Romania" },
  { code: "+7", flag: "\u{1F1F7}\u{1F1FA}", country: "Russia" },
  { code: "+250", flag: "\u{1F1F7}\u{1F1FC}", country: "Rwanda" },
  { code: "+1869", flag: "\u{1F1F0}\u{1F1F3}", country: "Saint Kitts and Nevis" },
  { code: "+1758", flag: "\u{1F1F1}\u{1F1E8}", country: "Saint Lucia" },
  { code: "+1784", flag: "\u{1F1FB}\u{1F1E8}", country: "Saint Vincent" },
  { code: "+685", flag: "\u{1F1FC}\u{1F1F8}", country: "Samoa" },
  { code: "+378", flag: "\u{1F1F8}\u{1F1F2}", country: "San Marino" },
  { code: "+239", flag: "\u{1F1F8}\u{1F1F9}", country: "Sao Tome and Principe" },
  { code: "+966", flag: "\u{1F1F8}\u{1F1E6}", country: "Saudi Arabia" },
  { code: "+221", flag: "\u{1F1F8}\u{1F1F3}", country: "Senegal" },
  { code: "+381", flag: "\u{1F1F7}\u{1F1F8}", country: "Serbia" },
  { code: "+248", flag: "\u{1F1F8}\u{1F1E8}", country: "Seychelles" },
  { code: "+232", flag: "\u{1F1F8}\u{1F1F1}", country: "Sierra Leone" },
  { code: "+65", flag: "\u{1F1F8}\u{1F1EC}", country: "Singapore" },
  { code: "+421", flag: "\u{1F1F8}\u{1F1F0}", country: "Slovakia" },
  { code: "+386", flag: "\u{1F1F8}\u{1F1EE}", country: "Slovenia" },
  { code: "+677", flag: "\u{1F1F8}\u{1F1E7}", country: "Solomon Islands" },
  { code: "+252", flag: "\u{1F1F8}\u{1F1F4}", country: "Somalia" },
  { code: "+27", flag: "\u{1F1FF}\u{1F1E6}", country: "South Africa" },
  { code: "+82", flag: "\u{1F1F0}\u{1F1F7}", country: "South Korea" },
  { code: "+211", flag: "\u{1F1F8}\u{1F1F8}", country: "South Sudan" },
  { code: "+94", flag: "\u{1F1F1}\u{1F1F0}", country: "Sri Lanka" },
  { code: "+249", flag: "\u{1F1F8}\u{1F1E9}", country: "Sudan" },
  { code: "+597", flag: "\u{1F1F8}\u{1F1F7}", country: "Suriname" },
  { code: "+46", flag: "\u{1F1F8}\u{1F1EA}", country: "Sweden" },
  { code: "+963", flag: "\u{1F1F8}\u{1F1FE}", country: "Syria" },
  { code: "+886", flag: "\u{1F1F9}\u{1F1FC}", country: "Taiwan" },
  { code: "+992", flag: "\u{1F1F9}\u{1F1EF}", country: "Tajikistan" },
  { code: "+255", flag: "\u{1F1F9}\u{1F1FF}", country: "Tanzania" },
  { code: "+66", flag: "\u{1F1F9}\u{1F1ED}", country: "Thailand" },
  { code: "+670", flag: "\u{1F1F9}\u{1F1F1}", country: "Timor-Leste" },
  { code: "+228", flag: "\u{1F1F9}\u{1F1EC}", country: "Togo" },
  { code: "+676", flag: "\u{1F1F9}\u{1F1F4}", country: "Tonga" },
  { code: "+1868", flag: "\u{1F1F9}\u{1F1F9}", country: "Trinidad and Tobago" },
  { code: "+216", flag: "\u{1F1F9}\u{1F1F3}", country: "Tunisia" },
  { code: "+90", flag: "\u{1F1F9}\u{1F1F7}", country: "Turkey" },
  { code: "+993", flag: "\u{1F1F9}\u{1F1F2}", country: "Turkmenistan" },
  { code: "+688", flag: "\u{1F1F9}\u{1F1FB}", country: "Tuvalu" },
  { code: "+256", flag: "\u{1F1FA}\u{1F1EC}", country: "Uganda" },
  { code: "+380", flag: "\u{1F1FA}\u{1F1E6}", country: "Ukraine" },
  { code: "+971", flag: "\u{1F1E6}\u{1F1EA}", country: "United Arab Emirates" },
  { code: "+598", flag: "\u{1F1FA}\u{1F1FE}", country: "Uruguay" },
  { code: "+998", flag: "\u{1F1FA}\u{1F1FF}", country: "Uzbekistan" },
  { code: "+678", flag: "\u{1F1FB}\u{1F1FA}", country: "Vanuatu" },
  { code: "+379", flag: "\u{1F1FB}\u{1F1E6}", country: "Vatican City" },
  { code: "+58", flag: "\u{1F1FB}\u{1F1EA}", country: "Venezuela" },
  { code: "+84", flag: "\u{1F1FB}\u{1F1F3}", country: "Vietnam" },
  { code: "+967", flag: "\u{1F1FE}\u{1F1EA}", country: "Yemen" },
  { code: "+260", flag: "\u{1F1FF}\u{1F1F2}", country: "Zambia" },
  { code: "+263", flag: "\u{1F1FF}\u{1F1FC}", country: "Zimbabwe" },
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
  const [numberOfPeople, setNumberOfPeople] = useState("0");
  const [preferredTime, setPreferredTime] = useState(prefillTime || "");
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<"with" | "without">("without");
  const [selectedBoat, setSelectedBoat] = useState<string>(preSelectedBoatId || "");
  const [selectedDate, setSelectedDate] = useState(prefillDate || "");
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
    // Step 3 (Extras) has no validation — always allow advancing
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

*MIS DATOS*
Nombre: ${fullName}
Tel: ${phone}
Email: ${email.trim()}

*MI PETICIÓN DE RESERVA*
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

    trackBookingStarted(selectedBoat, selectedBoatInfo?.name || selectedBoat, getStoredUtm());

    // Open WhatsApp immediately (must be synchronous with user click to avoid popup blocker)
    const message = createWhatsAppBookingMessage();
    openWhatsApp(message);

    // Save inquiry to database after opening WhatsApp (fire-and-forget to avoid popup blocker)
    try {
      const price = getBookingPrice();
      const codeDiscount = getCodeDiscount();
      const total = price ? price + totalExtrasPrice - codeDiscount : null;
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
      }).catch(() => {});
    } catch {
      // Silent fail
    }

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
