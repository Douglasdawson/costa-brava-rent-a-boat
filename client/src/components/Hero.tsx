import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Anchor, Clock, MapPin, User, Mail, Phone as PhoneIcon } from "lucide-react";
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
  const [licenseFilter, setLicenseFilter] = useState<"all" | "with" | "without">("all");
  const [selectedBoat, setSelectedBoat] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(() => getLocalISODate());
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = useTranslations();

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
            <h4 className="text-xs font-semibold text-gray-800 mb-2">Datos personales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* First Name */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
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
                  className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs sm:text-sm"
                  data-testid="input-first-name"
                />
              </div>

              {/* Last Name */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
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
                  className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs sm:text-sm"
                  data-testid="input-last-name"
                />
              </div>

              {/* Phone Number */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                    <PhoneIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                  </div>
                  Teléfono
                </label>
                <div className="flex gap-2">
                  <select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="w-24 p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs sm:text-sm"
                    data-testid="select-phone-prefix"
                  >
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+31">🇳🇱 +31</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+1">🇺🇸 +1</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="612345678"
                    className="flex-1 p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs sm:text-sm"
                    data-testid="input-phone-number"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
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
                  className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs sm:text-sm"
                  data-testid="input-email"
                />
              </div>
            </div>
          </div>

          {/* Boat, Date and Duration Section - All in one column */}
          <div className="bg-gray-50/80 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
            <h4 className="text-xs font-semibold text-gray-800 mb-2">Selección de reserva</h4>
            
            {/* License Filter */}
            <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 mb-2">
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                ¿Tienes licencia náutica?
              </label>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Boat Selector */}
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-1">
                  <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center mr-1">
                    <Anchor className="w-2.5 h-2.5 text-primary" />
                  </div>
                  Barco
                </label>
                <select
                  value={selectedBoat}
                  onChange={(e) => setSelectedBoat(e.target.value)}
                  disabled={isLoadingBoats}
                  className="w-full p-2 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium appearance-none cursor-pointer text-xs disabled:opacity-50"
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
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-1">
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
                  className="w-full p-2 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs date-left-align"
                  data-testid="input-booking-date"
                />
              </div>
              
              {/* Duration */}
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-1">
                  <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center mr-1">
                    <Clock className="w-2.5 h-2.5 text-primary" />
                  </div>
                  {t.booking.duration}
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full p-2 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium appearance-none cursor-pointer text-xs"
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

        {/* Trust indicators */}
        <div className="mt-4 sm:mt-6 lg:mt-8 grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 sm:gap-3 lg:gap-6 text-white/80 text-xs sm:text-sm px-2 sm:px-4">
          <div className="flex items-center justify-center sm:justify-start">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1 sm:mr-2 flex-shrink-0"></div>
            <span className="text-center sm:text-left">Precios sin sorpresas</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1 sm:mr-2 flex-shrink-0"></div>
            <span className="text-center sm:text-left">Sin licencia requerida</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1 sm:mr-2 flex-shrink-0"></div>
            <span className="text-center sm:text-left">Hasta 7 personas</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1 sm:mr-2 flex-shrink-0"></div>
            <span className="text-center sm:text-left">Extras disponibles</span>
          </div>
        </div>
      </div>
    </div>
  );
}
