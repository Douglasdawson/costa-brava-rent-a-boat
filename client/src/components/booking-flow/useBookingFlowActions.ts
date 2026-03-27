import { apiRequest } from "@/lib/queryClient";
import { trackPurchaseEcommerce, trackBookingWithUserData, trackQuoteCreated } from "@/utils/analytics";
import type { BookingFlowStateReturn } from "./useBookingFlowState";

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useBookingFlowActions(state: BookingFlowStateReturn, onClose?: () => void) {
  const {
    selectedDate, selectedBoat, selectedTime, duration, extras,
    customerData, holdId, availableBoats,
    setIsLoading, setQuote, setHoldId, setPaymentIntentId,
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
      const paymentResponse = await apiRequest('POST', '/api/create-payment-intent-mock', {
        holdId: holdId
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        throw new Error(error.message || "Error al procesar el pago");
      }

      const paymentData = await paymentResponse.json();
      setPaymentIntentId(paymentData.paymentIntentId);

      toast({
        title: "Procesando pago...",
        description: "Simulando pago exitoso para testing",
      });

      // Wait for simulated payment processing instead of detached setTimeout
      await delay(2000);

      const successResponse = await apiRequest('POST', '/api/simulate-payment-success', {
        paymentIntentId: paymentData.paymentIntentId
      });

      if (successResponse.ok) {
        const result = await successResponse.json();
        const boat = availableBoats.find(b => b.id === selectedBoat);
        const boatName = boat?.name || selectedBoat;
        trackPurchaseEcommerce(result.bookingId, state.quote?.total || 0, selectedBoat, boatName);
        trackBookingWithUserData(result.bookingId, state.quote?.total || 0, selectedBoat, {
          email: customerData.customerEmail,
          phone: customerData.phonePrefix + customerData.customerPhone,
          firstName: customerData.customerName,
          lastName: customerData.customerSurname,
        });
        toast({
          title: "¡Pago exitoso!",
          description: `Reserva confirmada. ID: ${result.bookingId}`,
        });
        if (onClose) onClose();
      } else {
        throw new Error("Error en la simulación de pago");
      }
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Error processing payment:', error);
      toast({
        title: t.booking.errorPayment,
        description: error instanceof Error ? error.message : t.booking.errorGeneric,
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
