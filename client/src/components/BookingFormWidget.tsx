import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Anchor, Clock, User, Mail, Phone as PhoneIcon, ChevronDown, Search } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { openWhatsApp } from "@/utils/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/translations";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { getBoatImage } from "@/utils/boatImages";

// Lista completa de prefijos telefónicos
const PHONE_PREFIXES = [
  { code: "+93", flag: "🇦🇫", country: "Afghanistan" },
  { code: "+355", flag: "🇦🇱", country: "Albania" },
  { code: "+213", flag: "🇩🇿", country: "Algeria" },
  { code: "+1-684", flag: "🇦🇸", country: "American Samoa" },
  { code: "+376", flag: "🇦🇩", country: "Andorra" },
  { code: "+244", flag: "🇦🇴", country: "Angola" },
  { code: "+1-264", flag: "🇦🇮", country: "Anguilla" },
  { code: "+1-268", flag: "🇦🇬", country: "Antigua & Barbuda" },
  { code: "+54", flag: "🇦🇷", country: "Argentina" },
  { code: "+374", flag: "🇦🇲", country: "Armenia" },
  { code: "+297", flag: "🇦🇼", country: "Aruba" },
  { code: "+61", flag: "🇦🇺", country: "Australia" },
  { code: "+43", flag: "🇦🇹", country: "Austria" },
  { code: "+994", flag: "🇦🇿", country: "Azerbaijan" },
  { code: "+1-242", flag: "🇧🇸", country: "Bahamas" },
  { code: "+973", flag: "🇧🇭", country: "Bahrain" },
  { code: "+880", flag: "🇧🇩", country: "Bangladesh" },
  { code: "+1-246", flag: "🇧🇧", country: "Barbados" },
  { code: "+375", flag: "🇧🇾", country: "Belarus" },
  { code: "+32", flag: "🇧🇪", country: "Belgium" },
  { code: "+501", flag: "🇧🇿", country: "Belize" },
  { code: "+229", flag: "🇧🇯", country: "Benin" },
  { code: "+1-441", flag: "🇧🇲", country: "Bermuda" },
  { code: "+975", flag: "🇧🇹", country: "Bhutan" },
  { code: "+591", flag: "🇧🇴", country: "Bolivia" },
  { code: "+387", flag: "🇧🇦", country: "Bosnia & Herzegovina" },
  { code: "+267", flag: "🇧🇼", country: "Botswana" },
  { code: "+55", flag: "🇧🇷", country: "Brazil" },
  { code: "+1-284", flag: "🇻🇬", country: "British Virgin Islands" },
  { code: "+673", flag: "🇧🇳", country: "Brunei" },
  { code: "+359", flag: "🇧🇬", country: "Bulgaria" },
  { code: "+226", flag: "🇧🇫", country: "Burkina Faso" },
  { code: "+257", flag: "🇧🇮", country: "Burundi" },
  { code: "+855", flag: "🇰🇭", country: "Cambodia" },
  { code: "+237", flag: "🇨🇲", country: "Cameroon" },
  { code: "+1", flag: "🇨🇦", country: "Canada" },
  { code: "+238", flag: "🇨🇻", country: "Cape Verde" },
  { code: "+1-345", flag: "🇰🇾", country: "Cayman Islands" },
  { code: "+236", flag: "🇨🇫", country: "Central African Rep." },
  { code: "+235", flag: "🇹🇩", country: "Chad" },
  { code: "+56", flag: "🇨🇱", country: "Chile" },
  { code: "+86", flag: "🇨🇳", country: "China" },
  { code: "+57", flag: "🇨🇴", country: "Colombia" },
  { code: "+269", flag: "🇰🇲", country: "Comoros" },
  { code: "+242", flag: "🇨🇬", country: "Congo" },
  { code: "+243", flag: "🇨🇩", country: "Congo, DR" },
  { code: "+682", flag: "🇨🇰", country: "Cook Islands" },
  { code: "+506", flag: "🇨🇷", country: "Costa Rica" },
  { code: "+385", flag: "🇭🇷", country: "Croatia" },
  { code: "+53", flag: "🇨🇺", country: "Cuba" },
  { code: "+599", flag: "🇨🇼", country: "Curaçao" },
  { code: "+357", flag: "🇨🇾", country: "Cyprus" },
  { code: "+420", flag: "🇨🇿", country: "Czech Republic" },
  { code: "+45", flag: "🇩🇰", country: "Denmark" },
  { code: "+253", flag: "🇩🇯", country: "Djibouti" },
  { code: "+1-767", flag: "🇩🇲", country: "Dominica" },
  { code: "+1-809", flag: "🇩🇴", country: "Dominican Republic" },
  { code: "+593", flag: "🇪🇨", country: "Ecuador" },
  { code: "+20", flag: "🇪🇬", country: "Egypt" },
  { code: "+503", flag: "🇸🇻", country: "El Salvador" },
  { code: "+240", flag: "🇬🇶", country: "Equatorial Guinea" },
  { code: "+291", flag: "🇪🇷", country: "Eritrea" },
  { code: "+372", flag: "🇪🇪", country: "Estonia" },
  { code: "+268", flag: "🇸🇿", country: "Eswatini" },
  { code: "+251", flag: "🇪🇹", country: "Ethiopia" },
  { code: "+500", flag: "🇫🇰", country: "Falkland Islands" },
  { code: "+298", flag: "🇫🇴", country: "Faroe Islands" },
  { code: "+679", flag: "🇫🇯", country: "Fiji" },
  { code: "+358", flag: "🇫🇮", country: "Finland" },
  { code: "+33", flag: "🇫🇷", country: "France" },
  { code: "+594", flag: "🇬🇫", country: "French Guiana" },
  { code: "+689", flag: "🇵🇫", country: "French Polynesia" },
  { code: "+241", flag: "🇬🇦", country: "Gabon" },
  { code: "+220", flag: "🇬🇲", country: "Gambia" },
  { code: "+995", flag: "🇬🇪", country: "Georgia" },
  { code: "+49", flag: "🇩🇪", country: "Germany" },
  { code: "+233", flag: "🇬🇭", country: "Ghana" },
  { code: "+350", flag: "🇬🇮", country: "Gibraltar" },
  { code: "+30", flag: "🇬🇷", country: "Greece" },
  { code: "+299", flag: "🇬🇱", country: "Greenland" },
  { code: "+1-473", flag: "🇬🇩", country: "Grenada" },
  { code: "+590", flag: "🇬🇵", country: "Guadeloupe" },
  { code: "+1-671", flag: "🇬🇺", country: "Guam" },
  { code: "+502", flag: "🇬🇹", country: "Guatemala" },
  { code: "+224", flag: "🇬🇳", country: "Guinea" },
  { code: "+245", flag: "🇬🇼", country: "Guinea-Bissau" },
  { code: "+592", flag: "🇬🇾", country: "Guyana" },
  { code: "+509", flag: "🇭🇹", country: "Haiti" },
  { code: "+504", flag: "🇭🇳", country: "Honduras" },
  { code: "+852", flag: "🇭🇰", country: "Hong Kong" },
  { code: "+36", flag: "🇭🇺", country: "Hungary" },
  { code: "+354", flag: "🇮🇸", country: "Iceland" },
  { code: "+91", flag: "🇮🇳", country: "India" },
  { code: "+62", flag: "🇮🇩", country: "Indonesia" },
  { code: "+98", flag: "🇮🇷", country: "Iran" },
  { code: "+964", flag: "🇮🇶", country: "Iraq" },
  { code: "+353", flag: "🇮🇪", country: "Ireland" },
  { code: "+972", flag: "🇮🇱", country: "Israel" },
  { code: "+39", flag: "🇮🇹", country: "Italy" },
  { code: "+225", flag: "🇨🇮", country: "Ivory Coast" },
  { code: "+1-876", flag: "🇯🇲", country: "Jamaica" },
  { code: "+81", flag: "🇯🇵", country: "Japan" },
  { code: "+962", flag: "🇯🇴", country: "Jordan" },
  { code: "+7", flag: "🇰🇿", country: "Kazakhstan" },
  { code: "+254", flag: "🇰🇪", country: "Kenya" },
  { code: "+686", flag: "🇰🇮", country: "Kiribati" },
  { code: "+850", flag: "🇰🇵", country: "North Korea" },
  { code: "+82", flag: "🇰🇷", country: "South Korea" },
  { code: "+383", flag: "🇽🇰", country: "Kosovo" },
  { code: "+965", flag: "🇰🇼", country: "Kuwait" },
  { code: "+996", flag: "🇰🇬", country: "Kyrgyzstan" },
  { code: "+856", flag: "🇱🇦", country: "Laos" },
  { code: "+371", flag: "🇱🇻", country: "Latvia" },
  { code: "+961", flag: "🇱🇧", country: "Lebanon" },
  { code: "+266", flag: "🇱🇸", country: "Lesotho" },
  { code: "+231", flag: "🇱🇷", country: "Liberia" },
  { code: "+218", flag: "🇱🇾", country: "Libya" },
  { code: "+423", flag: "🇱🇮", country: "Liechtenstein" },
  { code: "+370", flag: "🇱🇹", country: "Lithuania" },
  { code: "+352", flag: "🇱🇺", country: "Luxembourg" },
  { code: "+853", flag: "🇲🇴", country: "Macau" },
  { code: "+261", flag: "🇲🇬", country: "Madagascar" },
  { code: "+265", flag: "🇲🇼", country: "Malawi" },
  { code: "+60", flag: "🇲🇾", country: "Malaysia" },
  { code: "+960", flag: "🇲🇻", country: "Maldives" },
  { code: "+223", flag: "🇲🇱", country: "Mali" },
  { code: "+356", flag: "🇲🇹", country: "Malta" },
  { code: "+692", flag: "🇲🇭", country: "Marshall Islands" },
  { code: "+596", flag: "🇲🇶", country: "Martinique" },
  { code: "+222", flag: "🇲🇷", country: "Mauritania" },
  { code: "+230", flag: "🇲🇺", country: "Mauritius" },
  { code: "+262", flag: "🇾🇹", country: "Mayotte" },
  { code: "+52", flag: "🇲🇽", country: "Mexico" },
  { code: "+691", flag: "🇫🇲", country: "Micronesia" },
  { code: "+373", flag: "🇲🇩", country: "Moldova" },
  { code: "+377", flag: "🇲🇨", country: "Monaco" },
  { code: "+976", flag: "🇲🇳", country: "Mongolia" },
  { code: "+382", flag: "🇲🇪", country: "Montenegro" },
  { code: "+1-664", flag: "🇲🇸", country: "Montserrat" },
  { code: "+212", flag: "🇲🇦", country: "Morocco" },
  { code: "+258", flag: "🇲🇿", country: "Mozambique" },
  { code: "+95", flag: "🇲🇲", country: "Myanmar" },
  { code: "+264", flag: "🇳🇦", country: "Namibia" },
  { code: "+674", flag: "🇳🇷", country: "Nauru" },
  { code: "+977", flag: "🇳🇵", country: "Nepal" },
  { code: "+31", flag: "🇳🇱", country: "Netherlands" },
  { code: "+687", flag: "🇳🇨", country: "New Caledonia" },
  { code: "+64", flag: "🇳🇿", country: "New Zealand" },
  { code: "+505", flag: "🇳🇮", country: "Nicaragua" },
  { code: "+227", flag: "🇳🇪", country: "Niger" },
  { code: "+234", flag: "🇳🇬", country: "Nigeria" },
  { code: "+683", flag: "🇳🇺", country: "Niue" },
  { code: "+672", flag: "🇳🇫", country: "Norfolk Island" },
  { code: "+389", flag: "🇲🇰", country: "North Macedonia" },
  { code: "+1-670", flag: "🇲🇵", country: "Northern Mariana Islands" },
  { code: "+47", flag: "🇳🇴", country: "Norway" },
  { code: "+968", flag: "🇴🇲", country: "Oman" },
  { code: "+92", flag: "🇵🇰", country: "Pakistan" },
  { code: "+680", flag: "🇵🇼", country: "Palau" },
  { code: "+970", flag: "🇵🇸", country: "Palestine" },
  { code: "+507", flag: "🇵🇦", country: "Panama" },
  { code: "+675", flag: "🇵🇬", country: "Papua New Guinea" },
  { code: "+595", flag: "🇵🇾", country: "Paraguay" },
  { code: "+51", flag: "🇵🇪", country: "Peru" },
  { code: "+63", flag: "🇵🇭", country: "Philippines" },
  { code: "+48", flag: "🇵🇱", country: "Poland" },
  { code: "+351", flag: "🇵🇹", country: "Portugal" },
  { code: "+1-787", flag: "🇵🇷", country: "Puerto Rico" },
  { code: "+974", flag: "🇶🇦", country: "Qatar" },
  { code: "+40", flag: "🇷🇴", country: "Romania" },
  { code: "+7", flag: "🇷🇺", country: "Russia" },
  { code: "+250", flag: "🇷🇼", country: "Rwanda" },
  { code: "+290", flag: "🇸🇭", country: "Saint Helena" },
  { code: "+1-869", flag: "🇰🇳", country: "Saint Kitts & Nevis" },
  { code: "+1-758", flag: "🇱🇨", country: "Saint Lucia" },
  { code: "+508", flag: "🇵🇲", country: "Saint Pierre & Miquelon" },
  { code: "+1-784", flag: "🇻🇨", country: "Saint Vincent & Grenadines" },
  { code: "+685", flag: "🇼🇸", country: "Samoa" },
  { code: "+378", flag: "🇸🇲", country: "San Marino" },
  { code: "+239", flag: "🇸🇹", country: "São Tomé & Príncipe" },
  { code: "+966", flag: "🇸🇦", country: "Saudi Arabia" },
  { code: "+221", flag: "🇸🇳", country: "Senegal" },
  { code: "+381", flag: "🇷🇸", country: "Serbia" },
  { code: "+248", flag: "🇸🇨", country: "Seychelles" },
  { code: "+232", flag: "🇸🇱", country: "Sierra Leone" },
  { code: "+65", flag: "🇸🇬", country: "Singapore" },
  { code: "+1-721", flag: "🇸🇽", country: "Sint Maarten" },
  { code: "+421", flag: "🇸🇰", country: "Slovakia" },
  { code: "+386", flag: "🇸🇮", country: "Slovenia" },
  { code: "+677", flag: "🇸🇧", country: "Solomon Islands" },
  { code: "+252", flag: "🇸🇴", country: "Somalia" },
  { code: "+27", flag: "🇿🇦", country: "South Africa" },
  { code: "+211", flag: "🇸🇸", country: "South Sudan" },
  { code: "+34", flag: "🇪🇸", country: "Spain" },
  { code: "+94", flag: "🇱🇰", country: "Sri Lanka" },
  { code: "+249", flag: "🇸🇩", country: "Sudan" },
  { code: "+597", flag: "🇸🇷", country: "Suriname" },
  { code: "+46", flag: "🇸🇪", country: "Sweden" },
  { code: "+41", flag: "🇨🇭", country: "Switzerland" },
  { code: "+963", flag: "🇸🇾", country: "Syria" },
  { code: "+886", flag: "🇹🇼", country: "Taiwan" },
  { code: "+992", flag: "🇹🇯", country: "Tajikistan" },
  { code: "+255", flag: "🇹🇿", country: "Tanzania" },
  { code: "+66", flag: "🇹🇭", country: "Thailand" },
  { code: "+670", flag: "🇹🇱", country: "Timor-Leste" },
  { code: "+228", flag: "🇹🇬", country: "Togo" },
  { code: "+690", flag: "🇹🇰", country: "Tokelau" },
  { code: "+676", flag: "🇹🇴", country: "Tonga" },
  { code: "+1-868", flag: "🇹🇹", country: "Trinidad & Tobago" },
  { code: "+216", flag: "🇹🇳", country: "Tunisia" },
  { code: "+90", flag: "🇹🇷", country: "Turkey" },
  { code: "+993", flag: "🇹🇲", country: "Turkmenistan" },
  { code: "+1-649", flag: "🇹🇨", country: "Turks & Caicos Islands" },
  { code: "+688", flag: "🇹🇻", country: "Tuvalu" },
  { code: "+256", flag: "🇺🇬", country: "Uganda" },
  { code: "+380", flag: "🇺🇦", country: "Ukraine" },
  { code: "+971", flag: "🇦🇪", country: "United Arab Emirates" },
  { code: "+44", flag: "🇬🇧", country: "United Kingdom" },
  { code: "+1", flag: "🇺🇸", country: "United States" },
  { code: "+598", flag: "🇺🇾", country: "Uruguay" },
  { code: "+1-340", flag: "🇻🇮", country: "US Virgin Islands" },
  { code: "+998", flag: "🇺🇿", country: "Uzbekistan" },
  { code: "+678", flag: "🇻🇺", country: "Vanuatu" },
  { code: "+58", flag: "🇻🇪", country: "Venezuela" },
  { code: "+84", flag: "🇻🇳", country: "Vietnam" },
  { code: "+681", flag: "🇼🇫", country: "Wallis & Futuna" },
  { code: "+967", flag: "🇾🇪", country: "Yemen" },
  { code: "+260", flag: "🇿🇲", country: "Zambia" },
  { code: "+263", flag: "🇿🇼", country: "Zimbabwe" },
];

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
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<"with" | "without">("without");
  const [selectedBoat, setSelectedBoat] = useState<string>(preSelectedBoatId || "");
  const [selectedDate, setSelectedDate] = useState(() => getLocalISODate());
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  
  const { toast } = useToast();
  const t = useTranslations();

  // Update boat when preSelectedBoatId changes
  useEffect(() => {
    if (preSelectedBoatId) {
      setSelectedBoat(preSelectedBoatId);
    }
  }, [preSelectedBoatId]);

  // Filtrar prefijos por búsqueda
  const filteredPrefixes = PHONE_PREFIXES.filter(prefix => 
    prefix.code.replace(/[+-]/g, '').includes(prefixSearch.replace(/[+-]/g, ''))
  );

  // Obtener info del prefijo seleccionado
  const selectedPrefixInfo = PHONE_PREFIXES.find(p => p.code === phonePrefix);

  // Fetch all boats from API
  const { data: allBoats = [], isLoading: isLoadingBoats } = useQuery<Boat[]>({
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
          { value: "2h", label: "2 horas" },
          { value: "4h", label: "4 horas - Media día" },
          { value: "8h", label: "8 horas - Día completo" },
        ];
      } else if (licenseFilter === "without") {
        return [
          { value: "1h", label: "1 hora" },
          { value: "2h", label: "2 horas" },
          { value: "3h", label: "3 horas" },
          { value: "4h", label: "4 horas - Media día" },
          { value: "6h", label: "6 horas" },
          { value: "8h", label: "8 horas - Día completo" },
        ];
      }
      return [
        { value: "1h", label: "1 hora" },
        { value: "2h", label: "2 horas" },
        { value: "3h", label: "3 horas" },
        { value: "4h", label: "4 horas - Media día" },
        { value: "6h", label: "6 horas" },
        { value: "8h", label: "8 horas - Día completo" },
      ];
    }

    if (selectedBoatInfo.requiresLicense) {
      return [
        { value: "2h", label: formatLabel("2h", "2 horas") },
        { value: "4h", label: formatLabel("4h", "4 horas - Media día") },
        { value: "8h", label: formatLabel("8h", "8 horas - Día completo") },
      ];
    } else {
      return [
        { value: "1h", label: formatLabel("1h", "1 hora") },
        { value: "2h", label: formatLabel("2h", "2 horas") },
        { value: "3h", label: formatLabel("3h", "3 horas") },
        { value: "4h", label: formatLabel("4h", "4 horas - Media día") },
        { value: "6h", label: formatLabel("6h", "6 horas") },
        { value: "8h", label: formatLabel("8h", "8 horas - Día completo") },
      ];
    }
  };

  // Reset duration when date changes to ensure correct seasonal pricing
  useEffect(() => {
    // Always reset duration when date changes to show updated prices
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

  // Create WhatsApp message
  const createWhatsAppBookingMessage = () => {
    const isSpanish = phonePrefix === '+34';
    const price = getBookingPrice();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const phone = `${phonePrefix} ${phoneNumber.trim()}`;
    const boatName = selectedBoatInfo?.name || selectedBoat;
    const formattedDate = isSpanish ? formatDateSpanish(selectedDate) : formatDateEnglish(selectedDate);
    
    const durationOption = getDurationOptions().find(opt => opt.value === selectedDuration);
    const durationText = durationOption?.label.split(' - ')[0] || selectedDuration;
    
    if (isSpanish) {
      return `Hola! Me gustaría saber si es posible alquilar este barco:

* 📋 Nombre: ${fullName}
* 📞 Teléfono: ${phone}
* ✉️ Email: ${email.trim()}
* ⛵ Barco: ${boatName}
* 📅 Fecha: ${formattedDate}
* ⏰ Duración: ${durationText}
* 💰 Precio: ${price}€`;
    } else {
      return `Hello! I would like to know if it's possible to rent this boat:

* 📋 Name: ${fullName}
* 📞 Phone: ${phone}
* ✉️ Email: ${email.trim()}
* ⛵ Boat: ${boatName}
* 📅 Date: ${formattedDate}
* ⏰ Duration: ${durationText}
* 💰 Price: ${price}€`;
    }
  };

  const handleBookingSearch = () => {
    // Validate all fields
    if (!firstName.trim()) {
      toast({
        title: "Campo vacío: Nombre",
        description: "Por favor ingresa tu nombre",
        variant: "destructive",
      });
      return;
    }

    if (!lastName.trim()) {
      toast({
        title: "Campo vacío: Apellidos",
        description: "Por favor ingresa tus apellidos",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Campo vacío: Teléfono",
        description: "Por favor ingresa tu número de teléfono",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Campo vacío: Email",
        description: "Por favor ingresa tu correo electrónico",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedDate) {
      toast({
        title: "Campo vacío: Fecha",
        description: "Por favor selecciona una fecha para tu alquiler",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedBoat) {
      toast({
        title: "Campo vacío: Barco", 
        description: "Por favor selecciona una embarcación",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedDuration) {
      toast({
        title: "Campo vacío: Duración",
        description: "Por favor selecciona la duración del alquiler",
        variant: "destructive",
      });
      return;
    }

    // Create and send WhatsApp message
    const message = createWhatsAppBookingMessage();
    openWhatsApp(message);
    
    // Close modal if provided
    if (onClose) {
      onClose();
    }
  };

  return (
    <Card id="booking-form" className="bg-white/75 backdrop-blur-md p-3 sm:p-4 w-full shadow-2xl border-0">
      {/* Only show header when hideHeader is false */}
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
          <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
            <label htmlFor="first-name" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              Nombre
            </label>
            <input
              type="text"
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej: Juan"
              autoComplete="given-name"
              className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm sm:text-sm text-center md:text-left"
              data-testid="input-first-name"
            />
          </div>

          {/* Last Name */}
          <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
            <label htmlFor="last-name" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              Apellidos
            </label>
            <input
              type="text"
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej: García López"
              autoComplete="family-name"
              className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm sm:text-sm text-center md:text-left"
              data-testid="input-last-name"
            />
          </div>

          {/* Phone Number */}
          <div className="col-span-2 lg:col-span-1 bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
            <label htmlFor="phone-number" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <PhoneIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              Teléfono
            </label>
            <div className="flex gap-1">
              <div className="relative w-20 sm:w-24 lg:w-24">
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
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    <div className="p-2 border-b sticky top-0 bg-white">
                      <input
                        type="text"
                        value={prefixSearch}
                        onChange={(e) => setPrefixSearch(e.target.value)}
                        placeholder="Buscar código..."
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        data-testid="input-prefix-search"
                      />
                    </div>
                    <div>
                      {filteredPrefixes.map((prefix) => (
                        <button
                          key={prefix.code}
                          type="button"
                          onClick={() => {
                            setPhonePrefix(prefix.code);
                            setShowPrefixDropdown(false);
                            setPrefixSearch("");
                          }}
                          className="w-full p-2 hover:bg-gray-100 text-left flex items-center gap-2 text-sm transition-colors"
                          data-testid={`option-prefix-${prefix.code}`}
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
                placeholder="123456789"
                autoComplete="tel"
                className="flex-1 p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm"
                data-testid="input-phone-number"
              />
            </div>
          </div>

          {/* Email */}
          <div className="col-span-2 lg:col-span-1 bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
            <label htmlFor="email" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm text-center md:text-left"
              data-testid="input-email"
            />
          </div>
        </div>
      </div>

      {/* Booking Details Section */}
      <div className="bg-gray-50/80 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Date */}
          <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
            <label htmlFor="booking-date" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              Fecha
            </label>
            <input
              type="date"
              id="booking-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getLocalISODate()}
              className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm"
              data-testid="input-booking-date"
            />
          </div>

          {/* Boat Selection */}
          <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
            <label htmlFor="boat-select" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <Anchor className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              Barco
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
                    Sin Licencia
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
                    Con Licencia
                  </button>
                </div>
              )}
              <select
                id="boat-select"
                value={selectedBoat}
                onChange={(e) => setSelectedBoat(e.target.value)}
                disabled={!!preSelectedBoatId}
                className="clean-select w-full p-2 sm:p-2.5 border-0 !bg-white rounded-md focus:outline-none text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm disabled:opacity-60"
                data-testid="select-boat"
              >
                <option value="">Seleccionar...</option>
                {filteredBoats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
            <label htmlFor="duration-select" className="flex items-center justify-center md:justify-start text-xs [@media(min-width:400px)]:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              </div>
              Duración
            </label>
            <select
              id="duration-select"
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
              className="clean-select w-full p-2 sm:p-2.5 border-0 !bg-white rounded-md focus:outline-none text-gray-900 font-medium text-xs [@media(min-width:400px)]:text-sm"
              data-testid="select-duration"
            >
              <option value="">Seleccionar...</option>
              {getDurationOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedBoat && (
              <p className="text-[10px] text-gray-500 mt-1 text-center md:text-left">
                Los precios se actualizan según la fecha
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        onClick={handleBookingSearch} 
        className="w-full py-5 sm:py-6 md:py-4 text-sm sm:text-base md:text-sm font-semibold shadow-lg"
        data-testid="button-submit-booking"
      >
        <SiWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        ENVIAR PETICIÓN DE RESERVA
      </Button>
    </Card>
  );
}
