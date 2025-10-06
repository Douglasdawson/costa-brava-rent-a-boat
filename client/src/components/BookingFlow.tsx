import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, Plus, Minus, Euro, CreditCard, Anchor, Gauge, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { BOAT_DATA } from "@shared/boatData";
import { getSeason } from "@shared/pricing";
import { getBoatImage } from "@/utils/boatImages";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { useTranslations } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";

interface BookingFlowProps {
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

interface Customer {
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

export default function BookingFlow({ 
  boatId = "astec-450", 
  onClose,
  initialDate = "",
  initialDuration = "2h",
  initialTime = "",
  initialCustomerData = {}
}: BookingFlowProps) {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedBoat, setSelectedBoat] = useState(boatId);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [duration, setDuration] = useState(initialDuration);
  const [licenseFilter, setLicenseFilter] = useState<"all" | "with" | "without">("all");
  const [extras, setExtras] = useState<{[key: string]: number}>({});
  const [customerData, setCustomerData] = useState({
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
  const [quote, setQuote] = useState<any>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const { toast } = useToast();
  const t = useTranslations();
  
  // Check if user is logged in and load their profile
  const { isAuthenticated } = useAuth();
  const { data: customerProfile } = useQuery<Customer>({
    queryKey: ["/api/customer/profile"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Autocomplete customer data when profile loads (only fill empty fields)
  useEffect(() => {
    if (customerProfile) {
      setCustomerData(prev => ({
        customerName: prev.customerName || customerProfile.firstName || "",
        customerSurname: prev.customerSurname || customerProfile.lastName || "",
        customerEmail: prev.customerEmail || customerProfile.email || "",
        customerPhone: prev.customerPhone || customerProfile.phoneNumber || "",
        phonePrefix: prev.phonePrefix !== "+34" ? prev.phonePrefix : (customerProfile.phonePrefix || "+34"),
        customerNationality: prev.customerNationality || customerProfile.nationality || "",
        numberOfPeople: prev.numberOfPeople // Never overwrite numberOfPeople
      }));
    }
  }, [customerProfile]);

  // Fetch boats from API
  const { data: boats = [] } = useQuery({
    queryKey: ['/api/boats'],
    queryFn: () => apiRequest('GET', '/api/boats').then(res => res.json()),
  });

  // Generate time slots for booking
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push({
        id: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        available: true // Will be checked against API
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const availableExtras = [
    { id: "parking", name: t.booking?.extrasDetails?.parking?.name || "Parking dentro del puerto", price: 10, description: t.booking?.extrasDetails?.parking?.description || "Parking seguro en el puerto" },
    { id: "cooler", name: t.booking?.extrasDetails?.cooler?.name || "Nevera", price: 5, description: t.booking?.extrasDetails?.cooler?.description || "Nevera con hielo" },
    { id: "snorkel", name: t.booking?.extrasDetails?.snorkel?.name || "Equipo snorkel", price: 5, description: t.booking?.extrasDetails?.snorkel?.description || "Equipo de snorkel completo" },
    { id: "paddle", name: t.booking?.extrasDetails?.paddle?.name || "Tabla de paddlesurf", price: 25, description: t.booking?.extrasDetails?.paddle?.description || "Tabla de paddle surf" },
    { id: "seascooter", name: t.booking?.extrasDetails?.seascooter?.name || "Seascooter", price: 50, description: t.booking?.extrasDetails?.seascooter?.description || "Scooter acuático" }
  ];

  const phoneCountries = [
    { code: "+1", country: "Estados Unidos / Canadá" },
    { code: "+7", country: "Rusia / Kazajistán" },
    { code: "+20", country: "Egipto" },
    { code: "+27", country: "Sudáfrica" },
    { code: "+30", country: "Grecia" },
    { code: "+31", country: "Países Bajos" },
    { code: "+32", country: "Bélgica" },
    { code: "+33", country: "Francia" },
    { code: "+34", country: "España" },
    { code: "+36", country: "Hungría" },
    { code: "+39", country: "Italia" },
    { code: "+40", country: "Rumanía" },
    { code: "+41", country: "Suiza" },
    { code: "+43", country: "Austria" },
    { code: "+44", country: "Reino Unido" },
    { code: "+45", country: "Dinamarca" },
    { code: "+46", country: "Suecia" },
    { code: "+47", country: "Noruega" },
    { code: "+48", country: "Polonia" },
    { code: "+49", country: "Alemania" },
    { code: "+51", country: "Perú" },
    { code: "+52", country: "México" },
    { code: "+53", country: "Cuba" },
    { code: "+54", country: "Argentina" },
    { code: "+55", country: "Brasil" },
    { code: "+56", country: "Chile" },
    { code: "+57", country: "Colombia" },
    { code: "+58", country: "Venezuela" },
    { code: "+60", country: "Malasia" },
    { code: "+61", country: "Australia" },
    { code: "+62", country: "Indonesia" },
    { code: "+63", country: "Filipinas" },
    { code: "+64", country: "Nueva Zelanda" },
    { code: "+65", country: "Singapur" },
    { code: "+66", country: "Tailandia" },
    { code: "+81", country: "Japón" },
    { code: "+82", country: "Corea del Sur" },
    { code: "+84", country: "Vietnam" },
    { code: "+86", country: "China" },
    { code: "+90", country: "Turquía" },
    { code: "+91", country: "India" },
    { code: "+92", country: "Pakistán" },
    { code: "+93", country: "Afganistán" },
    { code: "+94", country: "Sri Lanka" },
    { code: "+95", country: "Myanmar" },
    { code: "+98", country: "Irán" },
    { code: "+212", country: "Marruecos" },
    { code: "+213", country: "Argelia" },
    { code: "+216", country: "Túnez" },
    { code: "+218", country: "Libia" },
    { code: "+220", country: "Gambia" },
    { code: "+221", country: "Senegal" },
    { code: "+222", country: "Mauritania" },
    { code: "+223", country: "Malí" },
    { code: "+224", country: "Guinea" },
    { code: "+225", country: "Costa de Marfil" },
    { code: "+226", country: "Burkina Faso" },
    { code: "+227", country: "Níger" },
    { code: "+228", country: "Togo" },
    { code: "+229", country: "Benín" },
    { code: "+230", country: "Mauricio" },
    { code: "+231", country: "Liberia" },
    { code: "+232", country: "Sierra Leona" },
    { code: "+233", country: "Ghana" },
    { code: "+234", country: "Nigeria" },
    { code: "+235", country: "Chad" },
    { code: "+236", country: "República Centroafricana" },
    { code: "+237", country: "Camerún" },
    { code: "+238", country: "Cabo Verde" },
    { code: "+239", country: "Santo Tomé y Príncipe" },
    { code: "+240", country: "Guinea Ecuatorial" },
    { code: "+241", country: "Gabón" },
    { code: "+242", country: "República del Congo" },
    { code: "+243", country: "República Democrática del Congo" },
    { code: "+244", country: "Angola" },
    { code: "+245", country: "Guinea-Bissau" },
    { code: "+246", country: "Territorio Británico del Océano Índico" },
    { code: "+248", country: "Seychelles" },
    { code: "+249", country: "Sudán" },
    { code: "+250", country: "Ruanda" },
    { code: "+251", country: "Etiopía" },
    { code: "+252", country: "Somalia" },
    { code: "+253", country: "Yibuti" },
    { code: "+254", country: "Kenia" },
    { code: "+255", country: "Tanzania" },
    { code: "+256", country: "Uganda" },
    { code: "+257", country: "Burundi" },
    { code: "+258", country: "Mozambique" },
    { code: "+260", country: "Zambia" },
    { code: "+261", country: "Madagascar" },
    { code: "+262", country: "Reunión / Mayotte" },
    { code: "+263", country: "Zimbabue" },
    { code: "+264", country: "Namibia" },
    { code: "+265", country: "Malaui" },
    { code: "+266", country: "Lesoto" },
    { code: "+267", country: "Botsuana" },
    { code: "+268", country: "Esuatini" },
    { code: "+269", country: "Comoras" },
    { code: "+290", country: "Santa Elena" },
    { code: "+291", country: "Eritrea" },
    { code: "+297", country: "Aruba" },
    { code: "+298", country: "Islas Feroe" },
    { code: "+299", country: "Groenlandia" },
    { code: "+350", country: "Gibraltar" },
    { code: "+351", country: "Portugal" },
    { code: "+352", country: "Luxemburgo" },
    { code: "+353", country: "Irlanda" },
    { code: "+354", country: "Islandia" },
    { code: "+355", country: "Albania" },
    { code: "+356", country: "Malta" },
    { code: "+357", country: "Chipre" },
    { code: "+358", country: "Finlandia" },
    { code: "+359", country: "Bulgaria" },
    { code: "+370", country: "Lituania" },
    { code: "+371", country: "Letonia" },
    { code: "+372", country: "Estonia" },
    { code: "+373", country: "Moldavia" },
    { code: "+374", country: "Armenia" },
    { code: "+375", country: "Bielorrusia" },
    { code: "+376", country: "Andorra" },
    { code: "+377", country: "Mónaco" },
    { code: "+378", country: "San Marino" },
    { code: "+380", country: "Ucrania" },
    { code: "+381", country: "Serbia" },
    { code: "+382", country: "Montenegro" },
    { code: "+383", country: "Kosovo" },
    { code: "+385", country: "Croacia" },
    { code: "+386", country: "Eslovenia" },
    { code: "+387", country: "Bosnia y Herzegovina" },
    { code: "+389", country: "Macedonia del Norte" },
    { code: "+420", country: "República Checa" },
    { code: "+421", country: "Eslovaquia" },
    { code: "+423", country: "Liechtenstein" },
    { code: "+500", country: "Islas Malvinas" },
    { code: "+501", country: "Belice" },
    { code: "+502", country: "Guatemala" },
    { code: "+503", country: "El Salvador" },
    { code: "+504", country: "Honduras" },
    { code: "+505", country: "Nicaragua" },
    { code: "+506", country: "Costa Rica" },
    { code: "+507", country: "Panamá" },
    { code: "+508", country: "San Pedro y Miquelón" },
    { code: "+509", country: "Haití" },
    { code: "+590", country: "Guadalupe" },
    { code: "+591", country: "Bolivia" },
    { code: "+592", country: "Guyana" },
    { code: "+593", country: "Ecuador" },
    { code: "+594", country: "Guyana Francesa" },
    { code: "+595", country: "Paraguay" },
    { code: "+596", country: "Martinica" },
    { code: "+597", country: "Surinam" },
    { code: "+598", country: "Uruguay" },
    { code: "+599", country: "Antillas Neerlandesas" },
    { code: "+670", country: "Timor Oriental" },
    { code: "+672", country: "Territorio Antártico Australiano" },
    { code: "+673", country: "Brunéi" },
    { code: "+674", country: "Nauru" },
    { code: "+675", country: "Papúa Nueva Guinea" },
    { code: "+676", country: "Tonga" },
    { code: "+677", country: "Islas Salomón" },
    { code: "+678", country: "Vanuatu" },
    { code: "+679", country: "Fiyi" },
    { code: "+680", country: "Palaos" },
    { code: "+681", country: "Wallis y Futuna" },
    { code: "+682", country: "Islas Cook" },
    { code: "+683", country: "Niue" },
    { code: "+684", country: "Samoa Americana" },
    { code: "+685", country: "Samoa" },
    { code: "+686", country: "Kiribati" },
    { code: "+687", country: "Nueva Caledonia" },
    { code: "+688", country: "Tuvalu" },
    { code: "+689", country: "Polinesia Francesa" },
    { code: "+690", country: "Tokelau" },
    { code: "+691", country: "Estados Federados de Micronesia" },
    { code: "+692", country: "Islas Marshall" },
    { code: "+850", country: "Corea del Norte" },
    { code: "+852", country: "Hong Kong" },
    { code: "+853", country: "Macao" },
    { code: "+855", country: "Camboya" },
    { code: "+856", country: "Laos" },
    { code: "+880", country: "Bangladés" },
    { code: "+886", country: "Taiwán" },
    { code: "+960", country: "Maldivas" },
    { code: "+961", country: "Líbano" },
    { code: "+962", country: "Jordania" },
    { code: "+963", country: "Siria" },
    { code: "+964", country: "Irak" },
    { code: "+965", country: "Kuwait" },
    { code: "+966", country: "Arabia Saudí" },
    { code: "+967", country: "Yemen" },
    { code: "+968", country: "Omán" },
    { code: "+970", country: "Palestina" },
    { code: "+971", country: "Emiratos Árabes Unidos" },
    { code: "+972", country: "Israel" },
    { code: "+973", country: "Baréin" },
    { code: "+974", country: "Catar" },
    { code: "+975", country: "Bután" },
    { code: "+976", country: "Mongolia" },
    { code: "+977", country: "Nepal" },
    { code: "+992", country: "Tayikistán" },
    { code: "+993", country: "Turkmenistán" },
    { code: "+994", country: "Azerbaiyán" },
    { code: "+995", country: "Georgia" },
    { code: "+996", country: "Kirguistán" },
    { code: "+998", country: "Uzbekistán" }
  ];

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

  // Filter functions for search
  const filteredPhoneCountries = phoneCountries.filter(country =>
    country.country.toLowerCase().includes(phonePrefixSearch.toLowerCase()) ||
    country.code.includes(phonePrefixSearch)
  );

  const filteredNationalities = nationalities.filter(nationality =>
    nationality.toLowerCase().includes(nationalitySearch.toLowerCase())
  );

  // Use boats from API instead of static data
  const allBoats = boats.length > 0 ? boats : Object.values(BOAT_DATA);
  
  // Filter boats based on license filter
  const availableBoats = useMemo(() => {
    if (licenseFilter === "all") return allBoats;
    
    return allBoats.filter((boat: any) => {
      const requiresLicense = boat.requiresLicense !== undefined 
        ? boat.requiresLicense 
        : boat.subtitle?.includes("Con Licencia");
      
      if (licenseFilter === "with") return requiresLicense;
      if (licenseFilter === "without") return !requiresLicense;
      return true;
    });
  }, [allBoats, licenseFilter]);

  // Get maximum capacity based on selected boat
  const getMaxCapacity = (boatId: string): number => {
    // First try to get capacity from the actual boat data
    const boat = availableBoats.find((b: any) => b.id === boatId);
    if (boat && boat.capacity) {
      return boat.capacity;
    }
    
    // Fallback to hardcoded mapping if boat data doesn't have capacity
    switch (boatId) {
      case "astec-400":
        return 4;
      case "solar-450":
      case "remus-450":
      case "astec-450": // Astec 480 appears to be astec-450 in the system
        return 5;
      case "pacific-craft-625":
      case "trimarchi-57s":
        return 7;
      case "mingolla-brava-19":
        return 6;
      default:
        return 4; // Conservative fallback instead of 8
    }
  };

  const maxCapacity = getMaxCapacity(selectedBoat);

  // Clamp numberOfPeople if it exceeds the new boat's capacity
  useEffect(() => {
    if (customerData.numberOfPeople > maxCapacity && maxCapacity > 0) {
      setCustomerData(prev => ({...prev, numberOfPeople: Math.min(prev.numberOfPeople, maxCapacity)}));
    }
  }, [selectedBoat, maxCapacity]);

  // Calculate duration prices based on selected boat and date
  const durations = useMemo(() => {
    if (!selectedBoat || !selectedDate) {
      // Fallback prices if no boat/date selected
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
      // First try to find boat in availableBoats (API data), then fallback to BOAT_DATA
      let boat = availableBoats.find((b: any) => b.id === selectedBoat);
      
      // If boat not found in availableBoats, try BOAT_DATA
      if (!boat) {
        boat = BOAT_DATA[selectedBoat];
      }
      
      if (!boat) {
        throw new Error(`Boat ${selectedBoat} not found`);
      }

      // Handle API boat data (has pricePerHour) vs static boat data (has pricing object)
      if (boat.pricePerHour) {
        // API boat - use pricePerHour for all durations
        const basePrice = parseFloat(boat.pricePerHour);
        return [
          { id: "1h", label: t.booking.oneHour, price: basePrice },
          { id: "2h", label: t.booking.twoHours, price: Math.round(basePrice * 1.8) },
          { id: "3h", label: t.booking.threeHours, price: Math.round(basePrice * 2.5) },
          { id: "4h", label: t.booking.fourHours, price: Math.round(basePrice * 3.2) },
          { id: "6h", label: t.booking.sixHours, price: Math.round(basePrice * 4.5) },
          { id: "8h", label: t.booking.eightHours, price: Math.round(basePrice * 5.8) }
        ];
      } else if (boat.pricing) {
        // Static boat data - use seasonal pricing
        const season = getSeason(new Date(selectedDate));
        const seasonPrices = boat.pricing[season]?.prices;
        
        if (!seasonPrices) {
          throw new Error(`No pricing found for season ${season}`);
        }

        return [
          { id: "1h", label: t.booking.oneHour, price: seasonPrices["1h"] || 70 },
          { id: "2h", label: t.booking.twoHours, price: seasonPrices["2h"] || 80 },
          { id: "3h", label: t.booking.threeHours, price: seasonPrices["3h"] || 90 },
          { id: "4h", label: t.booking.fourHours, price: seasonPrices["4h"] || 120 },
          { id: "6h", label: t.booking.sixHours, price: seasonPrices["6h"] || 150 },
          { id: "8h", label: t.booking.eightHours, price: seasonPrices["8h"] || 180 }
        ];
      } else {
        throw new Error(`Boat ${selectedBoat} has no pricing data`);
      }
    } catch (error) {
      console.error('Error calculating durations:', error);
      // If date is outside season or other error, use fallback prices
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

  // Filter available durations based on selected start time (max return time 19:00)
  const getAvailableDurations = (startTime: string) => {
    if (!startTime) return durations;
    
    const [startHour] = startTime.split(':').map(Number);
    const maxReturnHour = 19; // 19:00 (7:00 PM)
    
    return durations.filter(dur => {
      const durationHours = parseInt(dur.id.replace('h', ''));
      const endHour = startHour + durationHours;
      return endHour <= maxReturnHour;
    });
  };

  const handleTimeSelect = (timeId: string) => {
    setSelectedTime(timeId);
    setStep(3);
  };

  const updateExtra = (extraId: string, increment: boolean) => {
    setExtras(prev => ({
      ...prev,
      [extraId]: Math.max(0, (prev[extraId] || 0) + (increment ? 1 : -1))
    }));
  };

  const calculateTotal = () => {
    // Use server-side quote pricing if available
    if (quote) {
      return quote.total;
    }
    
    // Fallback to client-side calculation for display purposes
    const basePrice = durations.find(d => d.id === duration)?.price || 0;
    const extrasTotal = Object.entries(extras).reduce((total, [id, quantity]) => {
      const extra = availableExtras.find(e => e.id === id);
      return total + (extra ? extra.price * quantity : 0);
    }, 0);
    return basePrice + extrasTotal;
  };

  // Check availability for selected time slot using new API
  const checkAvailability = async (timeSlot: string) => {
    if (!selectedDate || !selectedBoat) return true;

    const startDateTime = new Date(`${selectedDate}T${timeSlot}:00`);
    const durationHours = parseInt(duration.replace('h', ''));
    const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);

    try {
      const response = await apiRequest('POST', '/api/check-availability', {
        boatId: selectedBoat,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
      });
      const result = await response.json();
      return result.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      return true; // Assume available on error
    }
  };

  // Create quote to get server-side pricing and hold
  const createQuote = async () => {
    if (!selectedDate || !selectedTime || !selectedBoat) {
      toast({
        title: t.booking.error,
        description: t.booking.missingFields,
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);

    try {
      // Calculate start and end times
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const durationHours = parseInt(duration.replace('h', ''));
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);

      // Get selected extras - send IDs not names
      const selectedExtras = Object.entries(extras)
        .filter(([_, quantity]) => quantity > 0)
        .map(([id, _]) => id); // Send the ID for server-side catalog lookup

      // Create quote with server-side pricing
      const quoteResponse = await apiRequest('POST', '/api/quote', {
        boatId: selectedBoat,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        numberOfPeople: customerData.numberOfPeople,
        extras: selectedExtras
      });

      if (!quoteResponse.ok) {
        const error = await quoteResponse.json();
        throw new Error(error.message || "Error al crear la cotización");
      }

      const quoteData = await quoteResponse.json();
      setQuote(quoteData.quote);
      setHoldId(quoteData.holdId);

      toast({
        title: "Cotización creada",
        description: `Precio confirmado: ${quoteData.quote.total}€. Tienes 30 minutos para completar el pago.`,
      });

      return true;
    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast({
        title: "Error al crear cotización",
        description: error.message || "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!quote || !holdId) {
      // First create the quote if we don't have one
      const quoteCreated = await createQuote();
      if (!quoteCreated) return;
      
      // Quote creation will update the state, but we need to wait for it
      // Let's continue with payment after quote creation
      setTimeout(() => {
        proceedWithPayment();
      }, 100);
      return;
    }

    proceedWithPayment();
  };

  const proceedWithPayment = async () => {
    if (!customerData.customerName || !customerData.customerSurname || !customerData.customerPhone || !customerData.customerNationality) {
      toast({
        title: t.booking.error, 
        description: t.booking.missingPersonalData,
        variant: "destructive",
      });
      return;
    }

    if (!holdId) {
      toast({
        title: "Error",
        description: "No hay una cotización válida. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create PaymentIntent from hold
      const paymentResponse = await apiRequest('POST', '/api/create-payment-intent-mock', {
        holdId: holdId
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        throw new Error(error.message || "Error al procesar el pago");
      }

      const paymentData = await paymentResponse.json();
      setPaymentIntentId(paymentData.paymentIntentId);

      // In a real implementation, you would use Stripe Elements here
      // For now, we'll simulate payment success for testing
      toast({
        title: "Procesando pago...",
        description: "Simulando pago exitoso para testing",
      });

      // Simulate payment success after a delay
      setTimeout(async () => {
        try {
          const successResponse = await apiRequest('POST', '/api/simulate-payment-success', {
            paymentIntentId: paymentData.paymentIntentId
          });

          if (successResponse.ok) {
            const result = await successResponse.json();
            
            toast({
              title: "¡Pago exitoso!",
              description: `Reserva confirmada. ID: ${result.bookingId}`,
            });

            // Reset form or redirect
            if (onClose) {
              onClose();
            }
          } else {
            throw new Error("Error en la simulación de pago");
          }
        } catch (error: any) {
          toast({
            title: "Error en el pago",
            description: error.message,
            variant: "destructive",
          });
        }
      }, 2000);

    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error al procesar el pago",
        description: error.message || "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back to home button */}
        <div className="mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="flex items-center text-gray-600 hover:text-gray-900"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div 
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 ${
                  stepNumber <= step 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 6 && (
                <div 
                  className={`w-8 sm:w-12 h-1 ${
                    stepNumber < step ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Date Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
{t.booking.selectDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-lg text-left text-gray-900"
                data-testid="input-booking-date"
              />
              <div className="mt-6">
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!selectedDate}
                  className="w-full py-3"
                  data-testid="button-next-step"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Boat Selection */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Anchor className="w-5 h-5 mr-2" />
                Selecciona tu embarcación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* License Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Tipo de embarcación</h3>
                <div className="flex gap-2">
                  <Button
                    variant={licenseFilter === "all" ? "default" : "outline"}
                    onClick={() => setLicenseFilter("all")}
                    className="flex-1"
                    data-testid="button-filter-all"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={licenseFilter === "without" ? "default" : "outline"}
                    onClick={() => setLicenseFilter("without")}
                    className="flex-1"
                    data-testid="button-filter-without-license"
                  >
                    Sin Licencia
                  </Button>
                  <Button
                    variant={licenseFilter === "with" ? "default" : "outline"}
                    onClick={() => setLicenseFilter("with")}
                    className="flex-1"
                    data-testid="button-filter-with-license"
                  >
                    Con Licencia
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableBoats.map((boat: any) => {
                  const isSelected = selectedBoat === boat.id;
                  // Handle both database boats and static data boats
                  const boatName = boat.name;
                  const boatCapacity = boat.capacity || parseInt(boat.specifications?.capacity?.split(' ')[0] || '5');
                  const boatPrice = boat.pricePerHour ? parseFloat(boat.pricePerHour) : Math.min(...Object.values(boat.pricing?.BAJA?.prices || {"1h": 75}) as number[]);
                  const boatImage = boat.image || (BOAT_DATA[boat.id]?.image ? getBoatImage(BOAT_DATA[boat.id].image) : "/placeholder-boat.jpg");
                  const requiresLicense = boat.requiresLicense !== undefined ? boat.requiresLicense : boat.subtitle?.includes("Con Licencia");
                  
                  return (
                    <div
                      key={boat.id}
                      onClick={() => setSelectedBoat(boat.id)}
                      className={`p-4 border rounded-lg cursor-pointer hover-elevate ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid={`boat-option-${boat.id}`}
                    >
                      <div className="flex items-center mb-3">
                        <img 
                          src={boatImage} 
                          alt={boatName}
                          className="w-16 h-16 object-cover rounded-lg mr-3"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{boatName}</h3>
                          <p className="text-sm text-gray-600">
                            {requiresLicense ? "Con Licencia" : "Sin Licencia"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>👥 {boatCapacity} personas</div>
                        <div>📏 {boat.specifications?.length || "4-6m"}</div>
                        <div className="flex items-center"><Gauge className="w-3 h-3 mr-1" />{boat.specifications?.engine || boat.specifications?.model || "Motor"}</div>
                        <div>💰 Desde {boatPrice}€</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6">
                <Button 
                  onClick={() => setStep(3)}
                  disabled={!selectedBoat}
                  className="w-full py-3"
                  data-testid="button-next-step"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Time & Duration Selection */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Horario y duración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Horario de inicio</h3>
                <div className="space-y-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setSelectedTime(slot.id);
                        console.log("Time selected:", slot.id);
                        
                        // Reset duration if it's not available for the new time
                        const availableDurations = getAvailableDurations(slot.id);
                        const isDurationStillAvailable = availableDurations.some(d => d.id === duration);
                        if (!isDurationStillAvailable) {
                          setDuration("2h"); // Reset to default duration
                        }
                      }}
                      disabled={!slot.available}
                      className={`w-full p-3 border rounded-lg flex items-center justify-between hover-elevate ${
                        selectedTime === slot.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : !slot.available 
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                      }`}
                      data-testid={`button-timeslot-${slot.id}`}
                    >
                      <span className="font-medium">{slot.label}</span>
                      {slot.available ? (
                        <Badge variant="secondary">Disponible</Badge>
                      ) : (
                        <Badge variant="outline">Ocupado</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {selectedTime && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Duración</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {getAvailableDurations(selectedTime).map((dur) => (
                      <button
                        key={dur.id}
                        onClick={() => setDuration(dur.id)}
                        className={`p-3 border rounded-lg text-center hover-elevate ${
                          duration === dur.id 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        data-testid={`button-duration-${dur.id}`}
                      >
                        <div className="font-medium">{dur.label}</div>
                        <div className="text-sm text-gray-600">{dur.price}€</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTime && duration && (
                <div className="mt-6">
                  <Button 
                    onClick={() => setStep(4)}
                    className="w-full py-3"
                    data-testid="button-continue-extras"
                  >
                    Continuar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Extras Selection */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Extras (opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {availableExtras.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{extra.name}</h4>
                      <p className="text-sm text-gray-600">{extra.description}</p>
                      <p className="text-sm font-medium text-primary">{extra.price}€</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateExtra(extra.id, false)}
                        data-testid={`button-decrease-${extra.id}`}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {extras[extra.id] || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateExtra(extra.id, true)}
                        data-testid={`button-increase-${extra.id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => setStep(5)}
                className="w-full py-3"
                data-testid="button-continue-customer-data"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Customer Information */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Datos del cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={customerData.customerName}
                      onChange={(e) => setCustomerData(prev => ({...prev, customerName: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900"
                      placeholder="Ana"
                      data-testid="input-customer-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      value={customerData.customerSurname}
                      onChange={(e) => setCustomerData(prev => ({...prev, customerSurname: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900"
                      placeholder="García López"
                      data-testid="input-customer-surname"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerData.customerEmail}
                    onChange={(e) => setCustomerData(prev => ({...prev, customerEmail: e.target.value}))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900"
                    placeholder="ana@ejemplo.com (opcional)"
                    data-testid="input-customer-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <div className="flex gap-2 items-start">
                    <div className="relative w-36 flex-shrink-0">
                      <input
                        type="text"
                        value={phonePrefixSearch || customerData.phonePrefix}
                        onChange={(e) => {
                          setPhonePrefixSearch(e.target.value);
                          setShowPhonePrefixDropdown(true);
                        }}
                        onFocus={() => setShowPhonePrefixDropdown(true)}
                        onBlur={() => {
                          setTimeout(() => setShowPhonePrefixDropdown(false), 200);
                        }}
                        placeholder="+34"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm text-gray-900"
                        data-testid="input-phone-prefix-search"
                      />
                      {showPhonePrefixDropdown && filteredPhoneCountries.length > 0 && (
                        <div className="absolute z-10 left-0 w-72 max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                          {filteredPhoneCountries.slice(0, 8).map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setCustomerData(prev => ({...prev, phonePrefix: country.code}));
                                setPhonePrefixSearch("");
                                setShowPhonePrefixDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 text-sm border-b last:border-b-0 text-gray-900"
                              data-testid={`option-prefix-${country.code}`}
                            >
                              <span className="font-mono">{country.code}</span> {country.country}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={customerData.customerPhone}
                      onChange={(e) => setCustomerData(prev => ({...prev, customerPhone: e.target.value}))}
                      className="flex-1 min-w-0 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900"
                      placeholder="600 000 000"
                      data-testid="input-customer-phone"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nacionalidad *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nationalitySearch || customerData.customerNationality}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNationalitySearch(value);
                          setShowNationalityDropdown(true);
                          
                          // Update customerNationality immediately for better UX
                          setCustomerData(prev => ({...prev, customerNationality: value}));
                        }}
                        onBlur={() => {
                          // Always accept the typed value
                          if (nationalitySearch) {
                            setCustomerData(prev => ({...prev, customerNationality: nationalitySearch}));
                            setNationalitySearch("");
                          }
                          setShowNationalityDropdown(false);
                        }}
                        onFocus={() => setShowNationalityDropdown(true)}
                        placeholder="Buscar nacionalidad"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900"
                        data-testid="input-nationality-search"
                      />
                      {showNationalityDropdown && filteredNationalities.length > 0 && (
                        <div className="absolute z-10 w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                          {filteredNationalities.slice(0, 10).map((nationality) => (
                            <button
                              key={nationality}
                              type="button"
                              onClick={() => {
                                setCustomerData(prev => ({...prev, customerNationality: nationality}));
                                setNationalitySearch("");
                                setShowNationalityDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 border-b last:border-b-0 text-gray-900"
                              data-testid={`option-nationality-${nationality.toLowerCase()}`}
                            >
                              {nationality}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de personas *
                    </label>
                    <Select value={customerData.numberOfPeople.toString()} onValueChange={(value) => setCustomerData(prev => ({...prev, numberOfPeople: parseInt(value)}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'persona' : 'personas'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setStep(6)}
                disabled={!customerData.customerName || !customerData.customerSurname || !customerData.customerEmail || !customerData.customerPhone || !customerData.customerNationality || customerData.numberOfPeople < 1 || customerData.customerPhone?.length < 9}
                className="w-full py-3"
                data-testid="button-continue-payment"
              >
                {t.booking.continueToPayment}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Payment Summary */}
        {step === 6 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Resumen y pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-900 mb-3">{t.booking.summaryTitle}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t.booking.summaryDate}</span>
                    <span className="font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.booking.summarySchedule}</span>
                    <span className="font-medium">{selectedTime} ({duration})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.booking.summaryBoat}</span>
                    <span className="font-medium">{BOAT_DATA[selectedBoat]?.name || 'N/A'}</span>
                  </div>
                  <hr className="my-2" />
                  {quote ? (
                    // Show server-side pricing from quote
                    <>
                      <div className="flex justify-between">
                        <span>{t.booking.summaryBasePrice} ({quote.season})</span>
                        <span>{quote.basePrice}€</span>
                      </div>
                      {quote.selectedExtras && quote.selectedExtras.length > 0 && (
                        <div className="flex justify-between">
                          <span>Extras: {quote.selectedExtras.join(', ')}</span>
                          <span>{quote.extrasPrice}€</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Depósito</span>
                        <span>{quote.deposit}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{quote.subtotal}€</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-bold text-base">
                        <span>{t.booking.summaryTotal}</span>
                        <span className="flex items-center">
                          <Euro className="w-4 h-4 mr-1" />
                          {quote.total}
                        </span>
                      </div>
                      {quote.season && (
                        <p className="text-xs text-gray-500 mt-2">
                          Temporada {quote.season} • {quote.duration} • {quote.numberOfPeople} personas
                        </p>
                      )}
                    </>
                  ) : (
                    // Fallback to client-side pricing display
                    <>
                      <div className="flex justify-between">
                        <span>{t.booking.summaryBasePrice}</span>
                        <span>{durations.find(d => d.id === duration)?.price}€</span>
                      </div>
                      {Object.entries(extras).map(([id, quantity]) => {
                        const extra = availableExtras.find(e => e.id === id);
                        if (!quantity || !extra) return null;
                        return (
                          <div key={id} className="flex justify-between">
                            <span>{extra.name} x{quantity}:</span>
                            <span>{extra.price * quantity}€</span>
                          </div>
                        );
                      })}
                      <hr className="my-2" />
                      <div className="flex justify-between font-bold text-base">
                        <span>{t.booking.summaryTotal}</span>
                        <span className="flex items-center">
                          <Euro className="w-4 h-4 mr-1" />
                          {calculateTotal()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        *Precio estimado. El precio final se calculará con las tarifas de temporada.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {!quote ? (
                  // Show quote button when no quote exists
                  <>
                    <Button 
                      onClick={createQuote}
                      disabled={isLoading}
                      className="w-full py-3 text-lg font-medium"
                      data-testid="button-get-quote"
                    >
                      {isLoading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      ) : (
                        <Euro className="w-5 h-5 mr-2" />
                      )}
                      {isLoading ? "Creando cotización..." : "Obtener Cotización"}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Obtén el precio final con tarifas de temporada y crea una reserva temporal de 30 minutos.
                    </p>
                  </>
                ) : (
                  // Show payment options when quote exists
                  <>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✓ Cotización creada. Tienes <strong>30 minutos</strong> para completar el pago.
                        {holdId && (
                          <span className="block text-xs mt-1">Hold ID: {holdId}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <input type="checkbox" id="terms" className="rounded" />
                      <label htmlFor="terms">
                        Acepto los <a href="#" className="text-primary hover:underline">{t.booking.termsAndConditions}</a> y la <a href="#" className="text-primary hover:underline">{t.booking.privacyPolicy}</a>
                      </label>
                    </div>

                    <Button 
                      onClick={handlePayment}
                      disabled={isLoading}
                      className="w-full py-3 text-lg font-medium"
                      data-testid="button-pay-now"
                    >
                      {isLoading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      ) : (
                        <CreditCard className="w-5 h-5 mr-2" />
                      )}
                      {isLoading ? "Procesando pago..." : `${t.booking.pay || 'Pagar'} ${calculateTotal()}€`}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      Pago seguro procesado por Stripe. Simulación de pago para testing.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        {step > 1 && (
          <div className="mt-4">
            <Button 
              variant="outline"
              onClick={() => setStep(step - 1)}
              data-testid="button-back-step"
            >
              {t.booking.back}
            </Button>
          </div>
        )}

        {onClose && (
          <div className="mt-4 text-center">
            <Button 
              variant="ghost"
              onClick={onClose}
              data-testid="button-close-booking"
            >
              {t.booking.close}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}