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
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Alquila tu barco en Blanes
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
        <Card className="bg-white/95 backdrop-blur-md p-6 max-w-4xl w-full shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-2" />
                Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                data-testid="input-booking-date"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline w-4 h-4 mr-2" />
                Embarcación
              </label>
              <select
                value={selectedBoat}
                onChange={(e) => setSelectedBoat(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                data-testid="select-boat-type"
              >
                <option value="">Seleccionar barco</option>
                <option value="astec-450">ASTEC 450 (Sin licencia)</option>
                <option value="solar-450">SOLAR 450 (Sin licencia)</option>
                <option value="remus-450">REMUS 450 (Sin licencia)</option>
                <option value="trimarchi-57s">TRIMARCHI 57S (Con licencia)</option>
                <option value="pacific-craft-625">PACIFIC CRAFT 625 (Con licencia)</option>
                <option value="mingolla-brava-19">MINGOLLA BRAVA 19 (Con licencia)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-2" />
                Duración
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                data-testid="select-duration"
              >
                <option value="">Seleccionar</option>
                <option value="1h">1 hora - desde 70€</option>
                <option value="2h">2 horas - desde 80€</option>
                <option value="3h">3 horas - desde 90€</option>
                <option value="4h">4 horas - desde 120€</option>
                <option value="6h">6 horas - desde 150€</option>
                <option value="8h">8 horas - desde 180€</option>
              </select>
            </div>
            
            <div className="flex flex-col justify-end">
              <Button 
                onClick={handleBookingSearch}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold"
                data-testid="button-search-availability"
              >
                Buscar Disponibilidad
              </Button>
            </div>
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