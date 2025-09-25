import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Anchor, Clock, MapPin, Phone } from "lucide-react";
import { openWhatsApp } from "@/utils/whatsapp";
import { BUSINESS_LOCATION } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import heroImage from "@assets/generated_images/Mediterranean_coastal_hero_scene_8df465c2.png";

export default function Hero() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedBoat, setSelectedBoat] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleBookingSearch = async () => {
    // Validate all fields are selected
    if (!selectedDate) {
      toast({
        title: "Fecha requerida",
        description: "Por favor selecciona una fecha para tu alquiler",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedBoat) {
      toast({
        title: "Embarcación requerida", 
        description: "Por favor selecciona una embarcación",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedDuration) {
      toast({
        title: "Duración requerida",
        description: "Por favor selecciona la duración del alquiler",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      // Convert duration to hours
      const hours = parseInt(selectedDuration.replace('h', ''));
      
      // Create start time at 10:00 AM (can be adjusted based on business hours)
      const selectedDateObj = new Date(selectedDate);
      const startTime = new Date(selectedDateObj);
      startTime.setHours(10, 0, 0, 0); // 10:00 AM
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + hours);

      // Check availability
      const response = await apiRequest(
        "POST",
        `/api/boats/${selectedBoat}/check-availability`,
        {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }
      );

      const data = await response.json();

      if (data.available) {
        // Navigate to booking page with pre-selected parameters
        const searchParams = new URLSearchParams({
          boat: selectedBoat,
          date: selectedDate,
          duration: selectedDuration,
          time: "10:00"
        });
        
        toast({
          title: "¡Barco disponible!",
          description: "Te redirigimos a completar tu reserva",
        });
        
        setLocation(`/booking?${searchParams.toString()}`);
      } else {
        toast({
          title: "No disponible",
          description: `El barco ${selectedBoat} no está disponible el ${selectedDate} para ${selectedDuration}. Prueba con otra fecha o duración.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error checking availability:", error);
      toast({
        title: "Error de conexión",
        description: "No pudimos verificar la disponibilidad. Por favor intenta nuevamente o contacta por WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
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
      
      <div className="relative z-10 container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12 min-h-screen flex flex-col justify-center items-center text-center">
        <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
          <h1 className="font-heading text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
            <div>Alquiler de barcos en Blanes (Costa Brava) sin licencia</div>
            <div className="mt-2">Costa Brava Rent a Boat - Blanes</div>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-3 sm:mb-4 px-2 lg:whitespace-nowrap">
            Alquiler de embarcaciones sin licencia y con licencia. Fácil, seguro y transparente.
          </p>
          <p className="text-sm sm:text-base md:text-lg text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Mayor flota de alquiler en Blanes con horarios flexibles.<br />
            Salidas desde Puerto de Blanes. Snorkel, paddle surf y parking.
          </p>
        </div>

        {/* Booking Widget */}
        <Card className="bg-white/95 backdrop-blur-md p-3 sm:p-4 lg:p-6 max-w-5xl w-full shadow-2xl border-0 mx-2 sm:mx-4">
          <div className="text-center mb-3 sm:mb-4 lg:mb-5">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Realiza tu petición de reserva</h3>
            <p className="text-xs sm:text-sm text-gray-600">Completa los datos para encontrar tu embarcación perfecta</p>
          </div>
          
          <div className="bg-gray-50/80 rounded-xl p-2 sm:p-3 lg:p-4 mb-3 sm:mb-4 lg:mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {/* Fecha */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                  </div>
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-xs sm:text-sm"
                  data-testid="input-booking-date"
                />
              </div>
              
              {/* Embarcación */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                    <Anchor className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                  </div>
                  Embarcación
                </label>
                <select
                  value={selectedBoat}
                  onChange={(e) => setSelectedBoat(e.target.value)}
                  className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium appearance-none cursor-pointer text-xs sm:text-sm"
                  data-testid="select-boat-type"
                >
                  <option value="">Seleccionar barco</option>
                  <option value="astec-400">Astec 400 (Sin licencia) - desde 70€</option>
                  <option value="remus-450">REMUS 450 (Sin licencia) - desde 75€</option>
                  <option value="solar-450">SOLAR 450 (Sin licencia) - desde 75€</option>
                  <option value="astec-450">Astec 450 (Sin licencia) - desde 80€</option>
                  <option value="pacific-craft-625">PACIFIC CRAFT 625 (Con licencia) - desde 180€</option>
                  <option value="trimarchi-57s">TRIMARCHI 57S (Con licencia) - desde 160€</option>
                  <option value="mingolla-brava-19">MINGOLLA BRAVA 19 (Con licencia) - desde 150€</option>
                </select>
              </div>
              
              {/* Duración */}
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-1 sm:mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                  </div>
                  Duración
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full p-2 sm:p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium appearance-none cursor-pointer text-xs sm:text-sm"
                  data-testid="select-duration"
                >
                  <option value="">Seleccionar duración</option>
                  <option value="1h">1 hora</option>
                  <option value="2h">2 horas</option>
                  <option value="3h">3 horas</option>
                  <option value="4h">4 horas</option>
                  <option value="6h">6 horas</option>
                  <option value="8h">8 horas - Día completo</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Botón de búsqueda */}
          <div>
            <Button 
              onClick={handleBookingSearch}
              disabled={isSearching}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 sm:py-3 px-4 sm:px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
              data-testid="button-search-availability"
            >
              {isSearching ? (
                <>⏳ <span className="hidden sm:inline">Verificando...</span><span className="sm:hidden">Verificando...</span></>
              ) : (
                <>🚤 <span className="hidden sm:inline">Buscar Disponibilidad</span><span className="sm:hidden">Buscar</span></>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-3 sm:mt-4 lg:mt-6 text-center">
              Sin compromiso • Confirmación inmediata • Precios transparentes
            </p>
          </div>
          
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 lg:gap-4 justify-center items-center mt-3 sm:mt-4 lg:mt-6">
            <Button 
              variant="outline" 
              onClick={handleWhatsApp}
              className="bg-white/90 backdrop-blur border-white/50 hover:bg-green-500 hover:text-white hover:border-green-500 w-full xs:w-auto text-xs sm:text-sm lg:text-base transition-all duration-200 py-2 sm:py-2.5"
              data-testid="button-whatsapp-contact"
            >
              <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">WhatsApp +34 611 500 372</span>
              <span className="sm:hidden">WhatsApp</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.open("https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D", "_blank")}
              className="bg-white/90 backdrop-blur border-white/50 hover:bg-blue-400 hover:text-white hover:border-blue-400 w-full xs:w-auto text-xs sm:text-sm lg:text-base transition-all duration-200 py-2 sm:py-2.5"
              data-testid="button-location-maps"
            >
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{BUSINESS_LOCATION}</span>
              <span className="sm:hidden">Ubicación</span>
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