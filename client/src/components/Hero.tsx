import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Anchor, Clock, MapPin, User, Mail, Phone as PhoneIcon, ChevronDown, Search, Shield, Star, CheckCircle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { openWhatsApp } from "@/utils/whatsapp";
import { BUSINESS_LOCATION } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTranslations } from "@/lib/translations";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { BOAT_DATA } from "@shared/boatData";
import heroImage from "../assets/generated_images/Mediterranean_coastal_hero_scene_8df465c2.png";

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

export default function Hero() {
  // Helper function to get local date in YYYY-MM-DD format
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
  const [licenseFilter, setLicenseFilter] = useState<"all" | "with" | "without">("all");
  const [selectedBoat, setSelectedBoat] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(() => getLocalISODate());
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = useTranslations();

  // Filtrar prefijos por búsqueda (números del código)
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
    if (licenseFilter === "all") return true;
    if (licenseFilter === "with") return boat.requiresLicense === true;
    if (licenseFilter === "without") return boat.requiresLicense === false;
    return true;
  });

  // Get selected boat info
  const selectedBoatInfo = allBoats.find(boat => boat.id === selectedBoat);

  // Reset boat selection when license filter changes if current boat doesn't match filter
  useEffect(() => {
    if (selectedBoat && selectedBoatInfo) {
      if (licenseFilter === "with" && !selectedBoatInfo.requiresLicense) {
        setSelectedBoat("");
      } else if (licenseFilter === "without" && selectedBoatInfo.requiresLicense) {
        setSelectedBoat("");
      }
    }
  }, [licenseFilter, selectedBoat, selectedBoatInfo]);

  // Helper function to get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1; // 1-12
    if (month === 8) return "ALTA"; // Agosto
    if (month === 7) return "MEDIA"; // Julio
    return "BAJA"; // Abril-Junio, Septiembre-Cierre
  };

  // Duration options based on license requirement
  const getDurationOptions = () => {
    // Helper function to get price for duration from BOAT_DATA
    const getPriceForDuration = (durationKey: string) => {
      if (!selectedBoatInfo) return null;
      const boatData = BOAT_DATA[selectedBoatInfo.id];
      if (!boatData) return null;
      
      const season = getCurrentSeason();
      const seasonPricing = boatData.pricing[season];
      return seasonPricing?.prices[durationKey] || null;
    };

    // Helper function to format label with price
    const formatLabel = (durationKey: string, baseLabel: string) => {
      const price = getPriceForDuration(durationKey);
      return price ? `${baseLabel} - ${price}€` : baseLabel;
    };

    if (!selectedBoatInfo) {
      // If license filter is set but no boat selected, adapt options to filter (without prices)
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
      // Show all options if filter is "all"
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
      // Boats with license: 2h, 4h, 8h (with prices)
      return [
        { value: "2h", label: formatLabel("2h", "2 horas") },
        { value: "4h", label: formatLabel("4h", "4 horas - Media día") },
        { value: "8h", label: formatLabel("8h", "8 horas - Día completo") },
      ];
    } else {
      // Boats without license: 1h, 2h, 3h, 4h, 6h, 8h (with prices)
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

  // Reset duration if it's no longer valid for selected boat or license filter
  useEffect(() => {
    if (selectedDuration) {
      const validOptions = getDurationOptions();
      const isValid = validOptions.some(opt => opt.value === selectedDuration);
      if (!isValid) {
        setSelectedDuration("");
      }
    }
  }, [selectedBoat, selectedBoatInfo, licenseFilter]);

  // Helper function to get price for selected boat and duration
  const getBookingPrice = () => {
    if (!selectedBoatInfo || !selectedDuration) return null;
    const boatData = BOAT_DATA[selectedBoatInfo.id];
    if (!boatData) return null;
    
    const season = getCurrentSeason();
    const seasonPricing = boatData.pricing[season];
    return seasonPricing?.prices[selectedDuration] || null;
  };

  // Helper function to format date in Spanish
  const formatDateSpanish = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  // Helper function to format date in English
  const formatDateEnglish = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Create WhatsApp message based on phone prefix
  const createWhatsAppBookingMessage = () => {
    const isSpanish = phonePrefix === '+34';
    const price = getBookingPrice();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const phone = `${phonePrefix} ${phoneNumber.trim()}`;
    const boatName = selectedBoatInfo?.name || selectedBoat;
    const formattedDate = isSpanish ? formatDateSpanish(selectedDate) : formatDateEnglish(selectedDate);
    
    // Get duration label
    const durationOption = getDurationOptions().find(opt => opt.value === selectedDuration);
    const durationText = durationOption?.label.split(' - ')[0] || selectedDuration; // Get just the duration part without price
    
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
    // Validate all fields - ALL ARE REQUIRED
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
  };

  const handleWhatsApp = () => {
    openWhatsApp("Hola, me gustaría información sobre el alquiler de barcos");
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center bg-no-repeat" 
         id="home"
         style={{ backgroundImage: `url(${heroImage})` }}>
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="relative z-10 container mx-auto px-4 pt-24 sm:pt-28 pb-8 sm:pb-12 min-h-screen flex flex-col justify-center items-center text-center">
        <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
          <h1 className="font-heading text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
            <div>Alquiler de Barcos en Blanes</div>
            <div>Costa Brava.</div>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-3 sm:mb-4 px-2 text-center">
            {t.hero.subtitle}
          </p>
          <p className="text-[10px] sm:text-xs md:text-sm text-white/80 mb-2 sm:mb-3 max-w-2xl mx-auto px-4">
            Horarios flexibles y salida desde Puerto de Blanes. Añade extras como snorkel, paddle surf y parking.
          </p>
        </div>

        {/* Booking Widget */}
        <Card className="bg-white/95 backdrop-blur-md p-3 sm:p-4 max-w-3xl w-full shadow-2xl border-0 mx-2 sm:mx-4">
          <div className="text-center mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1">{t.booking.title}</h3>
            <p className="text-xs text-gray-600">Completa los datos para encontrar tu barco perfecto</p>
          </div>
          
          {/* Personal Information Section */}
          <div className="bg-gray-50/80 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
            <h4 className="text-xs font-semibold text-gray-800 mb-2 text-center md:text-left">Datos personales</h4>
            <div className="grid grid-cols-2 gap-2">
              {/* First Name */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
                <label className="flex items-center justify-center md:justify-start text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                  </div>
                  Nombre
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej: Juan"
                  className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs sm:text-sm text-center md:text-left"
                  data-testid="input-first-name"
                />
              </div>

              {/* Last Name */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
                <label className="flex items-center justify-center md:justify-start text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                  </div>
                  Apellidos
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej: García López"
                  className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs sm:text-sm text-center md:text-left"
                  data-testid="input-last-name"
                />
              </div>

              {/* Phone Number */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
                <label className="flex items-center justify-center md:justify-start text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                    <PhoneIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                  </div>
                  Teléfono
                </label>
                <div className="flex gap-1">
                  {/* Dropdown personalizado de prefijos */}
                  <div className="relative w-14 sm:w-16">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPrefixDropdown(!showPrefixDropdown);
                        setPrefixSearch("");
                      }}
                      className="w-full h-full px-1 py-2 sm:px-1.5 sm:py-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary transition-all text-gray-900 font-medium text-[9px] sm:text-xs flex items-center justify-between"
                      data-testid="select-phone-prefix"
                    >
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{selectedPrefixInfo?.flag} {phonePrefix}</span>
                      <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0 ml-0.5" />
                    </button>

                    {showPrefixDropdown && (
                      <>
                        {/* Overlay para cerrar al hacer clic fuera */}
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setShowPrefixDropdown(false)}
                        />
                        
                        {/* Dropdown */}
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-20 max-h-80 overflow-hidden flex flex-col">
                          {/* Campo de búsqueda */}
                          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                              <input
                                type="text"
                                value={prefixSearch}
                                onChange={(e) => setPrefixSearch(e.target.value)}
                                placeholder="Buscar por código..."
                                className="w-full pl-7 pr-2 py-1.5 text-xs bg-white text-gray-600 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400"
                                data-testid="input-prefix-search"
                                autoFocus
                              />
                            </div>
                          </div>
                          
                          {/* Lista de prefijos */}
                          <div className="overflow-y-auto flex-1">
                            {filteredPrefixes.length > 0 ? (
                              filteredPrefixes.map((prefix) => (
                                <button
                                  key={prefix.code}
                                  type="button"
                                  onClick={() => {
                                    setPhonePrefix(prefix.code);
                                    setShowPrefixDropdown(false);
                                    setPrefixSearch("");
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors ${
                                    phonePrefix === prefix.code ? 'bg-primary/10' : ''
                                  }`}
                                  data-testid={`option-prefix-${prefix.code}`}
                                >
                                  <span className="font-medium">{prefix.flag} {prefix.code}</span>
                                  <span className="text-gray-500 ml-2">{prefix.country}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-4 text-xs text-gray-500 text-center">
                                No se encontraron resultados
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="612345678"
                    className="flex-1 p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs sm:text-sm text-center md:text-left"
                    data-testid="input-phone-number"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
                <label className="flex items-center justify-center md:justify-start text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                    <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                  </div>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs sm:text-sm text-center md:text-left"
                  data-testid="input-email"
                />
              </div>
            </div>
          </div>

          {/* Boat, Date and Duration Section - All in one column */}
          <div className="bg-gray-50/80 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
            <h4 className="text-xs font-semibold text-gray-800 mb-2 text-center md:text-left">Selección de reserva</h4>
            
            {/* License Filter */}
            <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 mb-2">
              <div className="flex gap-1">
                <button
                  onClick={() => setLicenseFilter("all")}
                  className={`flex-1 p-1.5 rounded-md text-xs font-medium transition-all ${
                    licenseFilter === "all"
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  data-testid="button-license-all"
                >
                  Todos
                </button>
                <button
                  onClick={() => setLicenseFilter("without")}
                  className={`flex-1 p-1.5 rounded-md text-xs font-medium transition-all ${
                    licenseFilter === "without"
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  data-testid="button-license-without"
                >
                  Sin licencia
                </button>
                <button
                  onClick={() => setLicenseFilter("with")}
                  className={`flex-1 p-1.5 rounded-md text-xs font-medium transition-all ${
                    licenseFilter === "with"
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  data-testid="button-license-with"
                >
                  Con licencia
                </button>
              </div>
            </div>

            {/* Boat, Date, Duration in same row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {/* Boat Selector */}
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
                <label className="flex items-center justify-center md:justify-start text-xs font-semibold text-gray-800 mb-1">
                  <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center mr-1">
                    <Anchor className="w-2.5 h-2.5 text-primary" />
                  </div>
                  Barco
                </label>
                <select
                  value={selectedBoat}
                  onChange={(e) => setSelectedBoat(e.target.value)}
                  disabled={isLoadingBoats}
                  className="w-full p-2 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium appearance-none cursor-pointer text-xs disabled:opacity-50 text-center md:text-left"
                  data-testid="select-boat-type"
                >
                  <option value="">
                    {isLoadingBoats ? "Cargando..." : "Seleccionar"}
                  </option>
                  {filteredBoats.map((boat) => (
                    <option key={boat.id} value={boat.id}>
                      {boat.name} ({boat.requiresLicense ? "Con licencia" : "Sin licencia"}) - desde {boat.pricePerHour}€/h
                    </option>
                  ))}
                </select>
                {filteredBoats.length === 0 && !isLoadingBoats && (
                  <p className="text-xs text-gray-500 mt-1">No hay barcos disponibles</p>
                )}
              </div>

              {/* Date */}
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                <label className="flex items-center justify-center md:justify-start text-xs font-semibold text-gray-800 mb-1">
                  <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center mr-1">
                    <Calendar className="w-2.5 h-2.5 text-primary" />
                  </div>
                  {t.booking.date}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getLocalISODate()}
                  className="w-full p-2 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs text-center md:text-left"
                  data-testid="input-booking-date"
                />
              </div>
              
              {/* Duration */}
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                <label className="flex items-center justify-center md:justify-start text-xs font-semibold text-gray-800 mb-1">
                  <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center mr-1">
                    <Clock className="w-2.5 h-2.5 text-primary" />
                  </div>
                  {t.booking.duration}
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full p-2 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium appearance-none cursor-pointer text-xs text-center md:text-left"
                  data-testid="select-duration"
                >
                  <option value="">Seleccionar</option>
                  {getDurationOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {selectedBoatInfo && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedBoatInfo.requiresLicense 
                      ? "Con licencia: 2h, 4h, 8h" 
                      : "Sin licencia: 1-8h"}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Search Button */}
          <div>
            <Button 
              onClick={handleBookingSearch}
              disabled={isSearching}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 sm:py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
              data-testid="button-search-availability"
            >
              {isSearching ? (
                <><span className="hidden sm:inline">Verificando disponibilidad...</span><span className="sm:hidden">Verificando...</span></>
              ) : (
                <><span className="hidden sm:inline">Enviar Petición</span><span className="sm:hidden">Enviar</span></>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {t.hero.trustText}
            </p>
          </div>
          
          <div className="flex flex-col xs:flex-row gap-2 justify-center items-center mt-2">
            <Button 
              variant="outline" 
              onClick={handleWhatsApp}
              className="bg-white/90 backdrop-blur border-white/50 hover:bg-green-500 hover:text-white hover:border-green-500 w-full xs:w-auto text-xs transition-all duration-200"
              data-testid="button-whatsapp-contact"
            >
              <SiWhatsapp className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">{t.hero.whatsappContact}</span>
              <span className="sm:hidden">WhatsApp</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.open("https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D", "_blank")}
              className="bg-white/90 backdrop-blur border-white/50 hover:bg-blue-400 hover:text-white hover:border-blue-400 w-full xs:w-auto text-xs transition-all duration-200"
              data-testid="button-location-maps"
            >
              <MapPin className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">{BUSINESS_LOCATION}</span>
              <span className="sm:hidden">{t.hero.location}</span>
            </Button>
          </div>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-4 sm:mt-6 max-w-3xl w-full mx-2 sm:mx-4">
          <div className="flex flex-wrap sm:grid sm:grid-cols-2 justify-center items-center gap-3 sm:gap-x-8 sm:gap-y-3 text-white/90 text-xs sm:text-sm bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:justify-center">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current flex-shrink-0" />
              <a 
                href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-white transition-colors cursor-pointer"
                data-testid="google-reviews-link"
              >
                4.8/5 valoración media en Google
              </a>
            </div>
            <div className="flex items-center space-x-2 sm:justify-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <a 
                href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-white transition-colors cursor-pointer"
                data-testid="satisfied-clients-link"
              >
                +500 clientes satisfechos
              </a>
            </div>
            <div className="flex items-center space-x-2 sm:justify-center">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
              <span className="font-medium">Totalmente asegurado</span>
            </div>
            <div className="flex items-center space-x-2 sm:justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
              <span className="font-medium">5 años de experiencia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
