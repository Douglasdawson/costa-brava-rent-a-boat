import BookingFormWidget from "@/components/BookingFormWidget";
import { useEffect } from "react";

export default function MobileBooking() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <BookingFormWidget />
      </div>
    </div>
  );
}
