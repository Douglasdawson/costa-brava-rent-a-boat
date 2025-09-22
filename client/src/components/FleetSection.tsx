import BoatCard from "./BoatCard";
import astec450Image from "@assets/generated_images/ASTEC_450_speedboat_photo_fc9de4ed.png";
import trimarchiImage from "@assets/generated_images/Trimarchi_57S_luxury_boat_0ef0159a.png";

export default function FleetSection() {
  const handleBooking = (boatId: string) => {
    console.log("Booking initiated for:", boatId);
    // Navigate to booking flow
  };

  const handleDetails = (boatId: string) => {
    console.log("View details for:", boatId);
    // Navigate to boat detail page
  };

  // todo: remove mock functionality - replace with real API data
  const boats = [
    {
      id: "astec-450",
      name: "ASTEC 450",
      image: astec450Image,
      capacity: 5,
      requiresLicense: false,
      description: "La embarcación más popular. Perfect para familias con solárium, toldo y escalera de baño. Gasolina incluida.",
      basePrice: 75,
      rating: 4.8,
      features: ["Gasolina incluida", "Solárium", "Toldo", "Escalera", "Nevera opcional"],
      available: true
    },
    {
      id: "astec-480",
      name: "ASTEC 480",
      image: astec450Image,
      capacity: 5,
      requiresLicense: false,
      description: "Versión premium del ASTEC con más espacio y comodidades. Ideal para grupos que buscan mayor confort.",
      basePrice: 80,
      rating: 4.9,
      features: ["Gasolina incluida", "Solárium amplio", "Toldo premium", "Escalera", "Nevera incluida"],
      available: true
    },
    {
      id: "trimarchi-57s",
      name: "Trimarchi 57S",
      image: trimarchiImage,
      capacity: 7,
      requiresLicense: true,
      description: "Embarcación de lujo para navegantes con licencia. Máximo confort y prestaciones para grupos grandes.",
      basePrice: 160,
      rating: 4.9,
      features: ["Gran potencia", "Solárium deluxe", "Cabina", "Cocina", "Baño", "Sistema audio"],
      available: false
    },
    {
      id: "remus-450",
      name: "Remus 450",
      image: astec450Image,
      capacity: 5,
      requiresLicense: false,
      description: "Barco robusto y cómodo, perfecto para exploraciones familiares por la costa. Sin licencia requerida.",
      basePrice: 75,
      rating: 4.7,
      features: ["Gasolina incluida", "Solárium", "Toldo", "Escalera", "Almacenamiento"],
      available: true
    },
    {
      id: "solar-450",
      name: "Solar 450",
      image: astec450Image,
      capacity: 5,
      requiresLicense: false,
      description: "Diseño moderno y funcional. Excelente maniobrabilidad para descubrir calas escondidas.",
      basePrice: 75,
      rating: 4.6,
      features: ["Gasolina incluida", "Solárium", "Toldo", "Escalera", "GPS básico"],
      available: true
    },
    {
      id: "mingolla-brava",
      name: "Mingolla Brava 19",
      image: trimarchiImage,
      capacity: 6,
      requiresLicense: true,
      description: "Embarcación italiana de alta calidad. Combina elegancia y rendimiento para experiencias únicas.",
      basePrice: 160,
      rating: 4.8,
      features: ["Motor potente", "Acabados premium", "Cabina", "Nevera", "Sistema navegación"],
      available: true
    }
  ];

  return (
    <section className="py-16 bg-gray-50" id="fleet">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nuestra Flota
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre nuestra selección de embarcaciones, desde barcos sin licencia perfectos para familias 
            hasta yates de lujo para navegantes experimentados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {boats.map((boat) => (
            <BoatCard
              key={boat.id}
              {...boat}
              onBooking={handleBooking}
              onDetails={handleDetails}
            />
          ))}
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">¿Necesitas ayuda para elegir?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
              onClick={() => window.open("https://wa.me/34611500372", "_blank")}
              data-testid="button-whatsapp-help"
            >
              💬 Consulta por WhatsApp
            </button>
            <button 
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              data-testid="button-call-help"
            >
              📞 Llama al +34 611 500 372
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}