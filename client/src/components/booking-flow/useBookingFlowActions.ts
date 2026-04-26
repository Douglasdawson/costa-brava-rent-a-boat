import { apiRequest } from "@/lib/queryClient";
import {
  trackPurchaseEcommerce,
  trackBookingWithUserData,
  trackQuoteCreated,
  trackWhatsAppClick,
  deriveTimeSlot,
  deriveLicenseType,
} from "@/utils/analytics";
import { openWhatsApp } from "@/utils/whatsapp";
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

    // Build a rich WhatsApp message with all the booking context the customer
    // already entered. Iván receives this directly on the company line as a
    // normal incoming WhatsApp — same channel he already uses to handle leads
    // from the homepage form widget. Open synchronously with the user click
    // to avoid mobile-Safari popup blockers.
    const boat = availableBoats.find(b => b.id === selectedBoat);
    const boatName = boat?.name || selectedBoat;
    const amount = state.quote?.total || 0;
    const peopleCount = customerData.numberOfPeople;
    const dateStr = (() => {
      try {
        return new Date(`${selectedDate}T${selectedTime || "00:00"}:00`).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      } catch { return selectedDate; }
    })();
    const selectedExtraNames = Object.entries(extras)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const ex = availableExtras.find(e => e.id === id);
        return ex ? `${ex.name}${qty > 1 ? ` x${qty}` : ""}` : null;
      })
      .filter(Boolean);

    const whatsappMessage = [
      `Hola! Me gustaría solicitar una reserva:`,
      ``,
      `🚤 *Barco:* ${boatName}`,
      `📅 *Fecha:* ${dateStr}`,
      `🕐 *Hora:* ${selectedTime} (${duration})`,
      `👥 *Personas:* ${peopleCount}`,
      selectedExtraNames.length > 0 ? `➕ *Extras:* ${selectedExtraNames.join(", ")}` : null,
      `💶 *Total estimado:* ${amount}€`,
      ``,
      `*Mis datos:*`,
      `${customerData.customerName} ${customerData.customerSurname}`,
      `Tel: ${customerData.phonePrefix || ""}${customerData.customerPhone}`,
      customerData.customerEmail ? `Email: ${customerData.customerEmail}` : null,
      `Nacionalidad: ${customerData.customerNationality}`,
      ``,
      `¡Gracias!`,
    ].filter(Boolean).join("\n");

    // Fire WhatsApp open SYNCHRONOUSLY before any async work — required for
    // popup-blocker-free behavior (must be inside the click handler stack).
    trackWhatsAppClick("booking_flow_submit");
    openWhatsApp(whatsappMessage);

    setIsLoading(true);
    setIsProcessingPayment(true);

    try {
      const language = (typeof window !== "undefined")
        ? (window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] || "es")
        : "es";

      // Persist the request server-side so it shows up in /crm/bookings AND
      // gets logged as an inquiry in /crm/inquiries (same as the homepage
      // widget). Both records help Iván track leads even if the customer
      // doesn't actually hit "Send" in WhatsApp.
      const [submitResponse] = await Promise.all([
        apiRequest('POST', '/api/bookings/submit-request', {
          holdId,
          termsAccepted: true,
          customerName: customerData.customerName,
          customerSurname: customerData.customerSurname,
          customerEmail: customerData.customerEmail,
          customerPhone: `${customerData.phonePrefix || ""}${customerData.customerPhone || ""}`.trim(),
          customerNationality: customerData.customerNationality,
          language,
        }),
        // Side-channel: log to inquiries table too. Best-effort, don't block.
        fetch('/api/booking-inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boatId: selectedBoat,
            boatName,
            bookingDate: selectedDate,
            preferredTime: selectedTime || null,
            duration,
            numberOfPeople: peopleCount,
            firstName: customerData.customerName,
            lastName: customerData.customerSurname,
            phonePrefix: customerData.phonePrefix || "",
            phoneNumber: customerData.customerPhone || "",
            email: customerData.customerEmail || null,
            extras: selectedExtraNames,
            estimatedTotal: amount ? amount.toFixed(2) : null,
            language,
            source: "booking_wizard",
          }),
        }).catch(() => { /* fire-and-forget */ }),
      ]);

      if (!submitResponse.ok) {
        const error = await submitResponse.json();
        throw new Error(error.message || "Error al enviar la solicitud");
      }

      const result = await submitResponse.json();

      // Track conversion event — boat/boatName/amount already computed above
      // for the WhatsApp message; reuse them here.
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
        title: "¡Pulsa enviar en WhatsApp!",
        description: "Hemos abierto WhatsApp con tu solicitud pre-rellenada. Pulsa Enviar y te contactaremos para confirmar disponibilidad.",
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
