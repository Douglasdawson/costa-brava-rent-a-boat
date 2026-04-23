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
 * Translation templates for the WhatsApp booking message.
 * Use {boatName} and {price} as placeholders.
 */
export interface BookingMessageTranslations {
  bookingWithBoatAndPrice: string;
  bookingWithBoat: string;
  bookingGeneric: string;
}

// Spanish defaults kept in code so callers that don't pass translations (e.g. unit
// tests) still produce a valid message — production callers always pass t.whatsappMessages.
const SPANISH_FALLBACK: BookingMessageTranslations = {
  bookingWithBoatAndPrice: 'Hola! Me interesa hacer una reserva del {boatName} (desde {price}€). ¿Podrían ayudarme con la disponibilidad y precios? ¡Gracias!',
  bookingWithBoat: 'Hola! Me interesa hacer una reserva del {boatName}. ¿Podrían ayudarme con la disponibilidad y precios? ¡Gracias!',
  bookingGeneric: 'Hola! Me gustaría hacer una reserva para alquilar un barco. ¿Podrían ayudarme con la disponibilidad y precios?',
};

/**
 * Creates a WhatsApp booking message in the caller's language.
 * Pass `translations` from `t.whatsappMessages` to localize.
 */
export function createBookingMessage(
  boatName?: string,
  basePrice?: number,
  translations?: BookingMessageTranslations,
): string {
  const tpl = translations ?? SPANISH_FALLBACK;
  if (boatName && basePrice) {
    return tpl.bookingWithBoatAndPrice
      .replace("{boatName}", boatName)
      .replace("{price}", String(basePrice));
  }
  if (boatName) {
    return tpl.bookingWithBoat.replace("{boatName}", boatName);
  }
  return tpl.bookingGeneric;
}