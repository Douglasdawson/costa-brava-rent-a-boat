import BoatCard from "./BoatCard";
import astec450Image from "@assets/generated_images/ASTEC_450_speedboat_photo_fc9de4ed.png";
import astec400Image from "@assets/generated_images/ASTEC_400_boat_photo_9dde16a8.png";
import solar450Image from "@assets/generated_images/SOLAR_450_boat_photo_b70eb7e1.png";
import remus450Image from "@assets/generated_images/REMUS_450_boat_photo_ec8b926c.png";
import trimarchiImage from "@assets/generated_images/Trimarchi_57S_luxury_boat_0ef0159a.png";
import pacificCraftImage from "@assets/generated_images/PACIFIC_CRAFT_625_boat_fbe4f4d0.png";
import mingollaImage from "@assets/generated_images/MINGOLLA_BRAVA_19_boat_c0e4a5b5.png";

export default function FleetSection() {
  const handleBooking = (boatId: string) => {
    console.log("Booking initiated for:", boatId);
    // Navigate to booking flow
  };

  const handleDetails = (boatId: string) => {
    console.log("View details for:", boatId);
    // Navigate to boat detail page
  };

  // Real boat data from costabravarentaboat.com - Ordered as requested
  const boats = [
    {
      id: "astec-400",
      name: "ASTEC 400",
      image: astec400Image,
      capacity: 4,
      requiresLicense: false,
      description: "Perfecta para parejas y familias con niños. Gran solárium para tumbarse y escalera de baño para disfrutar del mar.",
      basePrice: 70,
      rating: 4.7,
      features: ["Gasolina incluida", "Solárium", "Escalera", "Perfecta parejas"],
      available: false // TEMPORALMENTE NO DISPONIBLE según web
    },
    {
      id: "remus-450",
      name: "REMUS 450",
      image: remus450Image,
      capacity: 5,
      requiresLicense: false,
      description: "Embarcación sin licencia muy cómoda con enorme solárium con cojines en proa, toldo y escalera de baño.",
      basePrice: 75,
      rating: 4.7,
      features: ["Gasolina incluida", "Solárium", "Toldo", "Escalera", "Cojines proa"],
      available: true
    },
    {
      id: "solar-450",
      name: "SOLAR 450",
      image: solar450Image,
      capacity: 5,
      requiresLicense: false,
      description: "Embarcación sin licencia muy cómoda con enorme solárium con cojines en proa, toldo y escalera de baño.",
      basePrice: 75,
      rating: 4.6,
      features: ["Gasolina incluida", "Solárium", "Toldo", "Escalera", "Cojines proa"],
      available: true
    },
    {
      id: "astec-450",
      name: "ASTEC 450",
      image: astec450Image,
      capacity: 5,
      requiresLicense: false,
      description: "La más grande que tenemos sin licencia. Ancha, cómoda, y con un enorme solárium acolchado. También cuenta equipo de música bluetooth.",
      basePrice: 80,
      rating: 4.8,
      features: ["Gasolina incluida", "Solárium", "Toldo", "Escalera", "Música bluetooth"],
      available: true
    },
    {
      id: "pacific-craft-625",
      name: "PACIFIC CRAFT 625",
      image: pacificCraftImage,
      capacity: 7,
      requiresLicense: true,
      description: "¡La más premium que tenemos! Para 7 personas esta embarcación es alta, ancha y estable. Cuenta con camarote pequeño, un gran solárium y está equipada con ducha y mesa.",
      basePrice: 180,
      rating: 4.9,
      features: ["Camarote", "Gran solárium", "Ducha", "Mesa", "Premium"],
      available: true
    },
    {
      id: "trimarchi-57s",
      name: "TRIMARCHI 57S",
      image: trimarchiImage,
      capacity: 7,
      requiresLicense: true,
      description: "Magnífica embarcación para 7 personas, deportiva, con equipo de música bluetooth ducha de agua dulce, mesa y solárium en proa.",
      basePrice: 160,
      rating: 4.9,
      features: ["Música bluetooth", "Ducha agua dulce", "Mesa", "Solárium proa"],
      available: true
    },
    {
      id: "mingolla-brava-19",
      name: "MINGOLLA BRAVA 19",
      image: mingollaImage,
      capacity: 6,
      requiresLicense: true,
      description: "Magnífica embarcación para 6 personas muy ancha con equipo de música bluetooth ducha de agua dulce, mesa y solárium en proa.",
      basePrice: 150,
      rating: 4.8,
      features: ["Música bluetooth", "Ducha agua dulce", "Mesa", "Solárium proa"],
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