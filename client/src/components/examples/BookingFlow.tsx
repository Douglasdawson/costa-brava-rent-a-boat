import BookingFlow from '../BookingFlow';

export default function BookingFlowExample() {
  const handleClose = () => {
    console.log("Booking flow closed");
  };

  return <BookingFlow boatId="astec-450" onClose={handleClose} />;
}