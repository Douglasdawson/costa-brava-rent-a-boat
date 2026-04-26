import { apiRequest } from "@/lib/queryClient";
import {
  trackPurchaseEcommerce,
  trackBookingWithUserData,
  trackQuoteCreated,
  deriveTimeSlot,
  deriveLicenseType,
} from "@/utils/analytics";
import type { BookingFlowStateReturn } from "./useBookingFlowState";

export function useBookingFlowActions(state: BookingFlowStateReturn, onClose?: () => void) {
  const {
    selectedDate, selectedBoat, selectedTime, duration, extras,
    customerData, holdId, availableBoats,
    setIsLoading, setQuote, setHoldId,
    isProcessingPayment, setIsProcessingPayment,
    toast, t, availableExtras,
  } = state;

  const createQuote = async (): Promise<boolean> => {
    if (!selectedDate || !selectedTime || !selectedBoat) {
      toast({
        title: t.booking.error,
        description: t.booking.missingFields,
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);

    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const durationHours = parseInt(duration.replace('h', ''));
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);

      const selectedExtras = Object.entries(extras)
        .filter(([_, quantity]) => quantity > 0)
        .map(([id, _]) => id);

      const quoteResponse = await apiRequest('POST', '/api/quote', {
        boatId: selectedBoat,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        numberOfPeople: customerData.numberOfPeople,
        extras: selectedExtras
      });

      if (!quoteResponse.ok) {
        const error = await quoteResponse.json();
        throw new Error(error.message || "Error al crear la cotización");
      }

      const quoteData = await quoteResponse.json();
      setQuote(quoteData.quote);
      setHoldId(quoteData.holdId);
      trackQuoteCreated(quoteData.holdId, quoteData.quote.total, selectedBoat);

      toast({
        title: "Cotización creada",
        description: `Precio confirmado: ${quoteData.quote.total}€. Tienes 30 minutos para completar el pago.`,
      });

      return true;
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Error creating quote:', error);
      toast({
        title: "Error al crear cotización",
        description: error instanceof Error ? error.message : "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit reservation request (no online payment).
  // Replaces the mock-payment flow that 404'd in production.
  // Customer fills the form → ve cotización → pulsa "Solicitar reserva" →
  // Ivan recibe email con datos → contacta al cliente para coordinar pago.
  const proceedWithPayment = async () => {
    if (!customerData.customerName || !customerData.customerSurname || !customerData.customerPhone || !customerData.customerNationality) {
      toast({
        title: t.booking.error,
        description: t.booking.missingPersonalData,
        variant: "destructive",
      });
      return;
    }

    if (!holdId) {
      toast({
        title: "Error",
        description: "No hay una cotización válida. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsProcessingPayment(true);

    try {
      const submitResponse = await apiRequest('POST', '/api/bookings/submit-request', {
        holdId,
        termsAccepted: true,
      });

      if (!submitResponse.ok) {
        const error = await submitResponse.json();
        throw new Error(error.message || "Error al enviar la solicitud");
      }

      const result = await submitResponse.json();

      // Track conversion event — same shape as before, retained for funnel analytics.
      // The "purchase" semantic is now "request submitted" given the no-payment flow.
      const boat = availableBoats.find(b => b.id === selectedBoat);
      const boatName = boat?.name || selectedBoat;
      const amount = state.quote?.total || 0;
      const durationHours = parseInt(duration.replace('h', ''), 10) || null;
      const startTime = (selectedDate && selectedTime)
        ? new Date(`${selectedDate}T${selectedTime}:00`)
        : null;
      const timeSlot = deriveTimeSlot(startTime, durationHours);
      const boatLike = {
        id: selectedBoat,
        name: boatName,
        specifications: boat?.specifications,
        requiresLicense: boat?.requiresLicense,
      };
      const meta = {
        durationHours,
        startTime,
        numberOfPeople: customerData.numberOfPeople,
      };
      const completedMeta = {
        boatModel: boat?.specifications?.model ?? null,
        licenseType: boat ? deriveLicenseType(boat.requiresLicense) : null,
        durationHours,
        timeSlot,
        numberOfPeople: customerData.numberOfPeople,
      };
      trackPurchaseEcommerce(result.bookingId, amount, boatLike, meta);
      trackBookingWithUserData(result.bookingId, amount, selectedBoat, {
        email: customerData.customerEmail,
        phone: customerData.phonePrefix + customerData.customerPhone,
        firstName: customerData.customerName,
        lastName: customerData.customerSurname,
      }, completedMeta);

      toast({
        title: "¡Solicitud enviada!",
        description: "Te contactaremos en menos de 24h para confirmar disponibilidad y coordinar el pago.",
        duration: 8000,
      });

      if (onClose) onClose();
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Error submitting reservation request:', error);
      toast({
        title: "Error al enviar la solicitud",
        description: error instanceof Error ? error.message : "Inténtalo de nuevo o escríbenos por WhatsApp al +34 611 500 372",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsProcessingPayment(false);
    }
  };

  const handlePayment = async () => {
    // Guard against double-submit
    if (isProcessingPayment) return;

    if (!state.quote || !holdId) {
      const quoteCreated = await createQuote();
      if (!quoteCreated) return;
    }
    await proceedWithPayment();
  };

  return { createQuote, handlePayment };
}
