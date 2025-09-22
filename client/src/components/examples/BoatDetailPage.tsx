import BoatDetailPage from '../BoatDetailPage';

export default function BoatDetailPageExample() {
  const handleBack = () => {
    console.log("Navigate back to fleet");
  };

  return <BoatDetailPage boatId="solar-450" onBack={handleBack} />;
}