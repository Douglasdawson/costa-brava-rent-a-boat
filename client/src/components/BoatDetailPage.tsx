import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Users, 
  Anchor, 
  Fuel, 
  Euro,
  Calendar,
  CheckCircle,
  Star,
  Navigation as NavigationIcon,
  Ruler,
  ArrowUpDown,
  Zap,
  Shield
} from "lucide-react";
import { openWhatsApp } from "@/utils/whatsapp";
import Navigation from "./Navigation";
import Footer from "./Footer";
import solar450Image from "@assets/generated_images/SOLAR_450_boat_photo_b70eb7e1.png";

interface BoatDetailPageProps {
  boatId?: string;
  onBack?: () => void;
}

export default function BoatDetailPage({ boatId = "solar-450", onBack }: BoatDetailPageProps) {
  const [selectedSeason, setSelectedSeason] = useState("BAJA");
  
  // Solar 450 data from costabravarentaboat.com
  const boatData = {
    id: "solar-450",
    name: "Solar 450",
    image: solar450Image,
    subtitle: "Sin Licencia Para Alquilar en Blanes",
    description: "La SOLAR 450 es una embarcación sin necesidad de licencia, ideal para hasta 5 personas. Disfruta de un amplio solárium acolchado en proa, toldo para protección solar, escalera de baño para fácil acceso al mar y arranque eléctrico para mayor comodidad. Perfecta para explorar las calas de la Costa Brava en familia o con amigos.",
    
    // Technical specs from the web
    specifications: {
      model: "Solar 450",
      length: "4,50m",
      beam: "1,50m",
      engine: "Mercury 15cv 4t",
      fuel: "Gasolina 30L",
      capacity: "5 Personas",
      deposit: "250€"
    },
    
    equipment: [
      "Toldo",
      "Arranque eléctrico", 
      "Gran solárium de proa",
      "Escalera de baño",
      "Equipo de seguridad y salvamento"
    ],
    
    included: [
      "IVA",
      "Carburante",
      "Amarre", 
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    
    // Real pricing from website
    pricing: {
      BAJA: {
        period: "1 abril - 30 junio y 1 septiembre - cierre",
        prices: { "1h": 75, "2h": 115, "3h": 130, "4h": 150, "6h": 190, "8h": 220 }
      },
      MEDIA: {
        period: "1 julio - 31 julio",
        prices: { "1h": 85, "2h": 130, "3h": 160, "4h": 180, "6h": 230, "8h": 270 }
      },
      ALTA: {
        period: "1 agosto - 31 agosto", 
        prices: { "1h": 95, "2h": 140, "3h": 170, "4h": 195, "6h": 240, "8h": 290 }
      }
    }
  };

  const extras = [
    { name: "Parking", price: "10€", icon: "🅿️" },
    { name: "Nevera", price: "5€", icon: "🧊" },
    { name: "Agua y bebidas", price: "2,5€/ud", icon: "🥤" },
    { name: "Equipo de snorkel", price: "7,5€", icon: "🤿" },
    { name: "Paddle Surf", price: "25€", icon: "🏄‍♂️" },
    { name: "Seascooter", price: "50€", icon: "🛴" }
  ];

  const handleReservation = () => {
    console.log("Navigate to booking for Solar 450");
    const lowestPrice = Math.min(...Object.values(boatData.pricing.BAJA.prices));
    const message = `Hola! Me gustaría hacer una reserva del ${boatData.name} (desde ${lowestPrice}€, sin licencia requerida). He visto los precios por temporada en vuestra web. ¿Podrían confirmarme disponibilidad? ¡Muchas gracias!`;
    openWhatsApp(message);
  };

  const handleWhatsApp = () => {
    const message = `Hola, me interesa el ${boatData.name}. ¿Podrían darme más información?`;
    openWhatsApp(message);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Back button */}
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-6"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la flota
          </Button>
        )}

        {/* Hero section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <img 
              src={boatData.image} 
              alt={boatData.name}
              className="w-full h-96 object-cover rounded-2xl shadow-lg"
            />
          </div>
          
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="w-fit mb-4">
              Sin licencia requerida
            </Badge>
            
            <h1 className="font-heading text-4xl font-bold text-gray-900 mb-2">
              {boatData.name}
            </h1>
            
            <p className="text-xl text-gray-600 mb-4">
              {boatData.subtitle}
            </p>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-primary mr-2" />
                <span className="font-medium">Hasta {boatData.specifications.capacity}</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2 fill-current" />
                <span className="font-medium">4.6/5</span>
              </div>
              <div className="flex items-center">
                <Fuel className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-green-600">Gasolina incluida</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleReservation}
                className="flex-1"
                data-testid="button-reserve-solar450"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Reservar Ahora
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleWhatsApp}
                className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                data-testid="button-whatsapp-solar450"
              >
                💬 WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Technical Specifications - Moved here and made compact */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Anchor className="w-5 h-5 mr-2" />
              Características Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                <Anchor className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Modelo</div>
                  <div className="font-semibold text-sm">{boatData.specifications.model}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                <Ruler className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Eslora</div>
                  <div className="font-semibold text-sm">{boatData.specifications.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                <ArrowUpDown className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Manga</div>
                  <div className="font-semibold text-sm">{boatData.specifications.beam}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                <Zap className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Motor</div>
                  <div className="font-semibold text-sm">{boatData.specifications.engine}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                <Fuel className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Combustible</div>
                  <div className="font-semibold text-sm">{boatData.specifications.fuel}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2 px-3 bg-primary/10 rounded-lg border border-primary/20">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-primary/70 uppercase tracking-wide">Fianza</div>
                  <div className="font-bold text-primary">{boatData.specifications.deposit}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <p className="text-gray-700 text-lg leading-relaxed">
              {boatData.description}
            </p>
            <p className="text-gray-600 mt-4">
              ¡También podrás añadir extras como: material de snorkel completo, tabla de paddle surf, 
              nevera con hielo y bebidas o seascooter!
            </p>
          </CardContent>
        </Card>


        {/* Equipment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Equipamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {boatData.equipment.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Incluido en el precio</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {boatData.included.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Euro className="w-5 h-5 mr-2" />
              Precios por Temporada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Season selector */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(boatData.pricing).map(([season, data]) => (
                <button
                  key={season}
                  onClick={() => setSelectedSeason(season)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSeason === season
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`button-season-${season.toLowerCase()}`}
                >
                  Temporada {season}
                </button>
              ))}
            </div>

            {/* Selected season details */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                <strong>Temporada {selectedSeason}:</strong> {boatData.pricing[selectedSeason as keyof typeof boatData.pricing].period}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(boatData.pricing[selectedSeason as keyof typeof boatData.pricing].prices).map(([duration, price]) => (
                  <div key={duration} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{duration}</div>
                    <div className="text-xl font-bold text-primary">{price}€</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extras */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Extras Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {extras.map((extra, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg hover-elevate">
                  <div className="text-3xl mb-2">{extra.icon}</div>
                  <h4 className="font-medium text-sm text-gray-900 mb-1">{extra.name}</h4>
                  <p className="text-primary font-bold">{extra.price}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Puedes añadir cualquiera de estos extras al completar tu reserva online o directamente en el puerto antes de zarpar.
            </p>
          </CardContent>
        </Card>

        {/* Call to action */}
        <Card className="bg-primary text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">¿Listo para tu aventura en el Solar 450?</h3>
            <p className="text-primary-foreground/90 mb-6">
              Haz tu reserva hoy mismo y asegúrate de añadir los extras que harán que tu día sea perfecto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleReservation}
                variant="secondary"
                className="bg-white text-primary hover:bg-gray-100"
                data-testid="button-reserve-now-cta"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Reservar Ahora
              </Button>
              <Button 
                onClick={handleWhatsApp}
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                data-testid="button-whatsapp-cta"
              >
                💬 Contactar por WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}