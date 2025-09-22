import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Clock, MapPin, Phone } from "lucide-react";
import heroImage from "@assets/generated_images/Mediterranean_coastal_hero_scene_8df465c2.png";

export default function Hero() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedBoat, setSelectedBoat] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");

  const handleBookingSearch = () => {
    console.log("Booking search triggered", { selectedDate, selectedBoat, selectedDuration });
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/34611500372?text=Hola%2C%20me%20gustar%C3%ADa%20informaci%C3%B3n%20sobre%20el%20alquiler%20de%20barcos", "_blank");
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center bg-no-repeat" 
         style={{ backgroundImage: `url(${heroImage})` }}>
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col justify-center items-center text-center">
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="font-heading text-2xl md:text-4xl font-bold text-white mb-6 leading-tight">
            ¡BIENVENIDO AL MEJOR SITIO PARA ALQUILAR TU BARCO CON O SIN LICENCIA EN BLANES!
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4">
            Sin licencia. Fácil, seguro y con gasolina incluida.
          </p>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            La empresa con la mayor oferta de horas y mayor flexibilidad horaria contratables en la zona.
            Opciones: snorkel, paddle surf, nevera con bebidas frías.
          </p>
        </div>

        {/* Booking Widget */}
        <Card className="bg-white/95 backdrop-blur-md p-6 max-w-4xl w-full shadow-2xl border-0">
          <div className="text-center mb-5">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reserva tu aventura</h3>
            <p className="text-sm text-gray-600">Completa los datos para encontrar tu embarcación perfecta</p>
          </div>
          
          <div className="bg-gray-50/80 rounded-xl p-4 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fecha */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                    <Calendar className="w-3 h-3 text-primary" />
                  </div>
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium text-sm"
                  data-testid="input-booking-date"
                />
              </div>
              
              {/* Embarcación */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                    <Users className="w-3 h-3 text-primary" />
                  </div>
                  Embarcación
                </label>
                <select
                  value={selectedBoat}
                  onChange={(e) => setSelectedBoat(e.target.value)}
                  className="w-full p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium appearance-none cursor-pointer text-sm"
                  data-testid="select-boat-type"
                >
                  <option value="">Seleccionar barco</option>
                  <option value="astec-400">ASTEC 400 (Sin licencia) - desde 70€</option>
                  <option value="remus-450">REMUS 450 (Sin licencia) - desde 75€</option>
                  <option value="solar-450">SOLAR 450 (Sin licencia) - desde 75€</option>
                  <option value="astec-450">ASTEC 450 (Sin licencia) - desde 80€</option>
                  <option value="pacific-craft-625">PACIFIC CRAFT 625 (Con licencia) - desde 180€</option>
                  <option value="trimarchi-57s">TRIMARCHI 57S (Con licencia) - desde 160€</option>
                  <option value="mingolla-brava-19">MINGOLLA BRAVA 19 (Con licencia) - desde 150€</option>
                </select>
              </div>
              
              {/* Duración */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <label className="flex items-center text-xs font-semibold text-gray-800 mb-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                    <Clock className="w-3 h-3 text-primary" />
                  </div>
                  Duración
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full p-2.5 border-0 bg-gray-50 rounded-md focus:ring-2 focus:ring-primary focus:bg-white transition-all text-gray-900 font-medium appearance-none cursor-pointer text-sm"
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
          <div className="text-center">
            <Button 
              onClick={handleBookingSearch}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="button-search-availability"
            >
              🚤 Buscar Disponibilidad
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Sin compromiso • Confirmación inmediata • Gasolina incluida
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="outline" 
              onClick={handleWhatsApp}
              className="bg-white/90 backdrop-blur border-white/50 hover:bg-white"
              data-testid="button-whatsapp-contact"
            >
              <Phone className="w-4 h-4 mr-2" />
              WhatsApp +34 611 500 372
            </Button>
            
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              Blanes, Costa Brava
            </div>
          </div>
        </Card>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/80 text-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Gasolina incluida
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Sin licencia requerida
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Hasta 5 personas
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Extras disponibles
          </div>
        </div>
      </div>
    </div>
  );
}