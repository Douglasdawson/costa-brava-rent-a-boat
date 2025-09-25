import BoatCard from '../BoatCard';
import astec450Image from "../../assets/generated_images/ASTEC_450_speedboat_photo_fc9de4ed.png";

export default function BoatCardExample() {
  const handleBooking = (boatId: string) => {
    console.log("Booking boat:", boatId);
  };

  const handleDetails = (boatId: string) => {
    console.log("View details for boat:", boatId);
  };

  return (
    <div className="p-8 max-w-sm">
      <BoatCard
        id="astec-450"
        name="Astec 450"
        image={astec450Image}
        capacity={5}
        requiresLicense={false}
        description="Embarcación perfecta para familias. Incluye solárium, toldo y escalera de baño. Gasolina incluida."
        basePrice={75}
        rating={4.8}
        features={["Gasolina incluida", "Solárium", "Toldo", "Escalera", "Nevera opcional"]}
        available={true}
        onBooking={handleBooking}
        onDetails={handleDetails}
      />
    </div>
  );
}