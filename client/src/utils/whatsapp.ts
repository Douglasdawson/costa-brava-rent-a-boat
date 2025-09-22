import { WHATSAPP_PHONE } from "@/lib/config";

/**
 * Creates a WhatsApp link with a pre-filled message
 * @param message - The message to pre-fill in WhatsApp
 * @returns void - Opens WhatsApp in a new tab
 */
export function openWhatsApp(message: string): void {
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
}

/**
 * Creates a booking message for a specific boat
 * @param boatName - Name of the boat
 * @param basePrice - Starting price (optional)
 * @returns formatted booking message
 */
export function createBookingMessage(boatName?: string, basePrice?: number): string {
  if (boatName && basePrice) {
    return `Hola! Me interesa hacer una reserva del ${boatName} (desde ${basePrice}€). ¿Podrían ayudarme con la disponibilidad y precios? ¡Gracias!`;
  } else if (boatName) {
    return `Hola! Me interesa hacer una reserva del ${boatName}. ¿Podrían ayudarme con la disponibilidad y precios? ¡Gracias!`;
  } else {
    return "Hola! Me gustaría hacer una reserva para alquilar un barco. ¿Podrían ayudarme con la disponibilidad y precios?";
  }
}