import BoatCard from "./BoatCard";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useLocation } from "wouter";
import { BOAT_DATA } from "@shared/boatData";
import astec450Image from "@assets/generated_images/ASTEC_450_speedboat_photo_fc9de4ed.png";
import astec400Image from "@assets/generated_images/ASTEC_400_boat_photo_9dde16a8.png";
import solar450Image from "@assets/generated_images/SOLAR_450_boat_photo_b70eb7e1.png";
import remus450Image from "@assets/generated_images/REMUS_450_boat_photo_ec8b926c.png";
import trimarchiImage from "@assets/generated_images/Trimarchi_57S_luxury_boat_0ef0159a.png";
import pacificCraftImage from "@assets/generated_images/PACIFIC_CRAFT_625_boat_fbe4f4d0.png";
import mingollaImage from "@assets/generated_images/MINGOLLA_BRAVA_19_boat_c0e4a5b5.png";

export default function FleetSection() {
  const [, setLocation] = useLocation();

  // Real boat data from costabravarentaboat.com - Ordered as requested
  // Using centralized data with fleet-specific information
  const fleetInfo = {
    "astec-400": { rating: 4.7, available: false }, // TEMPORALMENTE NO DISPONIBLE según web
    "remus-450": { rating: 4.7, available: true },
    "solar-450": { rating: 4.6, available: true },
    "astec-450": { rating: 4.8, available: true },
    "pacific-craft-625": { rating: 4.9, available: true },
    "trimarchi-57s": { rating: 4.9, available: true },
    "mingolla-brava-19": { rating: 4.8, available: true }
  };

  // Fleet order as requested
  const fleetOrder = [
    "astec-400", "remus-450", "solar-450", "astec-450", 
    "pacific-craft-625", "trimarchi-57s", "mingolla-brava-19"
  ];

  const boats = fleetOrder.map(boatId => {
    const boatData = BOAT_DATA[boatId];
    const info = fleetInfo[boatId as keyof typeof fleetInfo];
    
    if (!boatData) return null;

    // Extract capacity as number
    const capacity = parseInt(boatData.specifications.capacity.split(' ')[0]);
    
    // Determine if license is required
    const requiresLicense = boatData.subtitle.includes("Con Licencia");
    
    // Base price from BAJA season
    const basePrice = Math.min(...Object.values(boatData.pricing.BAJA.prices));
    
    // Create features list with specific highlights
    const features = [
      ...boatData.features.slice(0, 2), // First 2 features
      ...boatData.equipment.slice(0, 2)  // First 2 equipment items
    ];

    return {
      id: boatId,
      name: boatData.name,
      image: boatData.image,
      imageAlt: `Alquiler ${boatData.name} ${requiresLicense ? "con licencia" : "sin licencia"} en Blanes Costa Brava para ${capacity} personas`,
      capacity,
      requiresLicense,
      description: boatData.description.substring(0, 150) + "...", // Truncate for cards
      basePrice,
      rating: info.rating,
      features,
      available: info.available
    };
  }).filter(Boolean) as Array<{
    id: string;
    name: string;
    image: string;
    imageAlt: string;
    capacity: number;
    requiresLicense: boolean;
    description: string;
    basePrice: number;
    rating: number;
    features: string[];
    available: boolean;
  }>;

  const handleBooking = (boatId: string) => {
    console.log("Booking initiated for:", boatId);
    // Navigate to internal booking flow instead of WhatsApp
    setLocation(`/booking?boat=${boatId}`);
  };

  const handleDetails = (boatId: string) => {
    console.log("View details for:", boatId);
    // Navigate to boat detail page - now works for all boats
    if (BOAT_DATA[boatId]) {
      setLocation(`/barco/${boatId}`);
    } else {
      console.log(`Detail page not available for ${boatId}`);
      // Fallback to contact
      const message = `Hola, me gustaría obtener más información sobre el barco ${boatId}`;
      openWhatsApp(message);
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-gray-50" id="fleet">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Nuestra flota de alquiler en Blanes
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Descubre nuestra flota de alquiler de barcos con licencia o sin licencia en Blanes, Costa Brava. Embarcaciones ideales para salidas con amigos o en familias.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {boats.map((boat) => (
            <BoatCard
              key={boat.id}
              {...boat}
              onBooking={handleBooking}
              onDetails={handleDetails}
            />
          ))}
        </div>

        <div className="text-center px-4">
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">¿Necesitas ayuda para elegir tu alquiler de barco en Blanes?</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg mx-auto">
            <button 
              className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors text-sm sm:text-base"
              onClick={() => openWhatsApp("Hola! Necesito ayuda para elegir el mejor barco para alquilar en Blanes. ¿Podrían asesorarme sobre precios y disponibilidad?")}
              data-testid="button-whatsapp-help"
            >
              💬 <span className="ml-2">Consulta por WhatsApp</span>
            </button>
            <button 
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
              data-testid="button-call-help"
            >
              📞 <span className="ml-1 hidden sm:inline">Llama al </span><span className="ml-1">+34 611 500 372</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}