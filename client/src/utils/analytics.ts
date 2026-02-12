// Analytics event tracking utilities for Google Tag Manager

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }
}

// Specific conversion events
export function trackBookingStarted(boatId: string, boatName: string) {
  trackEvent("booking_started", { boat_id: boatId, boat_name: boatName });
}

export function trackBookingCompleted(bookingId: string, amount: number, boatId: string) {
  trackEvent("purchase", {
    transaction_id: bookingId,
    value: amount,
    currency: "EUR",
    boat_id: boatId,
  });
}

export function trackWhatsAppClick(source: string) {
  trackEvent("whatsapp_click", { source });
}

export function trackPhoneClick() {
  trackEvent("phone_click");
}

export function trackBookingFormOpen(boatId?: string) {
  trackEvent("booking_form_open", { boat_id: boatId || "general" });
}
