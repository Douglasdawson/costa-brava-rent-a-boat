// Booking Flow Handlers
import { BOAT_DATA, type BoatData } from "@shared/boatData";
import { calculatePricingBreakdown, isOperationalSeason, type Duration } from "@shared/pricing";
import { storage } from "../../storage";
import type { ChatbotTranslations } from "../translations";
import { formatMessage } from "../translations";
import type { ChatbotConversation } from "@shared/schema";

const BOATS = Object.values(BOAT_DATA);

/**
 * Start booking flow - prompt for date
 */
export function handleStartBooking(t: ChatbotTranslations): string {
  return `${t.startBookingTitle}\n\n${t.bookingDatePrompt}`;
}

/**
 * Handle booking date input (same as start booking for now)
 */
export function handleBookingDate(t: ChatbotTranslations): string {
  return t.bookingDatePrompt;
}

/**
 * Handle booking time selection
 */
export function handleBookingTime(t: ChatbotTranslations): string {
  return t.bookingTimePrompt;
}

/**
 * Show boat selection for booking
 */
export async function handleBookingBoat(
  t: ChatbotTranslations,
  date: Date
): Promise<string> {
  if (!isOperationalSeason(date)) {
    return t.outOfSeason;
  }

  let message = t.bookingBoatPrompt;

  // Show available boats with prices for selected date
  for (let i = 0; i < BOATS.length; i++) {
    const boat = BOATS[i];
    const num = i + 1;

    // Check if boat is available (rough check for the day)
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(20, 0, 0, 0);

    let isAvailable = true;
    try {
      isAvailable = await storage.checkAvailability(boat.id, startOfDay, endOfDay);
    } catch {
      // Assume available on error
    }

    if (isAvailable) {
      const lowestPrice = Math.min(...Object.values(boat.pricing.BAJA.prices));
      message += `${num}️⃣ *${boat.name}* - desde ${lowestPrice}€\n`;
    } else {
      message += `${num}️⃣ ~${boat.name}~ - OCUPADO\n`;
    }
  }

  return message;
}

/**
 * Show duration options for a specific boat
 */
export function handleBookingDuration(t: ChatbotTranslations, boatId: string): string {
  const boat = BOAT_DATA[boatId];
  if (!boat) {
    return t.bookingDurationPrompt;
  }

  // Get available durations for this boat
  const durations = Object.keys(boat.pricing.BAJA.prices);

  let message = t.bookingDurationPrompt.split("\n")[0] + "\n\n";

  const durationLabels: Record<string, string> = {
    "1h": "1️⃣ 1 hora",
    "2h": "2️⃣ 2 horas",
    "3h": "3️⃣ 3 horas",
    "4h": "4️⃣ 4 horas",
    "6h": "5️⃣ 6 horas",
    "8h": "6️⃣ 8 horas (día completo)",
  };

  durations.forEach((duration, index) => {
    const price = boat.pricing.BAJA.prices[duration];
    if (durationLabels[duration]) {
      message += `${durationLabels[duration]} - ${price}€\n`;
    }
  });

  return message;
}

/**
 * Show people prompt with boat capacity
 */
export function handleBookingPeople(t: ChatbotTranslations, boatId: string): string {
  const boat = BOAT_DATA[boatId];
  const maxPeople = boat ? parseInt(boat.specifications.capacity) || 7 : 7;

  return formatMessage(t.bookingPeoplePrompt, { max: maxPeople });
}

/**
 * Show extras selection
 */
export function handleBookingExtras(t: ChatbotTranslations): string {
  return t.bookingExtrasPrompt;
}

/**
 * Prompt for customer name
 */
export function handleBookingContactName(t: ChatbotTranslations): string {
  return t.bookingContactNamePrompt;
}

/**
 * Prompt for customer email
 */
export function handleBookingContactEmail(t: ChatbotTranslations): string {
  return t.bookingContactEmailPrompt;
}

/**
 * Show booking confirmation summary
 */
export function handleBookingConfirm(
  t: ChatbotTranslations,
  session: ChatbotConversation
): string {
  const boat = BOAT_DATA[session.selectedBoatId || ""];
  if (!boat) {
    return t.error;
  }

  const date = session.selectedDate ? new Date(session.selectedDate) : new Date();
  const dateStr = formatDateForDisplay(date);
  const startTime = session.selectedStartTime || "10:00";
  const duration = session.selectedDuration || "2h";

  // Calculate end time
  const durationHours = parseInt(duration) || 2;
  const [startHour, startMin] = startTime.split(":").map(Number);
  const endHour = startHour + durationHours;
  const endTime = `${endHour.toString().padStart(2, "0")}:${startMin.toString().padStart(2, "0")}`;

  // Calculate pricing
  let pricing;
  try {
    pricing = calculatePricingBreakdown(
      boat.id,
      date,
      duration as Duration,
      session.selectedExtras || []
    );
  } catch {
    pricing = {
      basePrice: 100,
      extrasPrice: 0,
      deposit: 200,
      subtotal: 100,
      total: 300,
    };
  }

  const extrasText = session.selectedExtras?.length
    ? session.selectedExtras.join(", ")
    : t.noExtras;

  let message = t.bookingConfirmTitle + "\n\n";
  message += formatMessage(t.bookingConfirmDetails, {
    boat: boat.name,
    date: dateStr,
    time: startTime,
    endTime: endTime,
    people: session.numberOfPeople || 1,
    extras: extrasText,
    total: pricing.subtotal,
    deposit: pricing.deposit,
  });

  message += "\n" + t.bookingConfirmPrompt;

  return message;
}

/**
 * Create the actual booking
 */
export async function createBookingFromSession(
  session: ChatbotConversation
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    const boat = BOAT_DATA[session.selectedBoatId || ""];
    if (!boat) {
      return { success: false, error: "Boat not found" };
    }

    const date = session.selectedDate ? new Date(session.selectedDate) : new Date();
    const startTime = session.selectedStartTime || "10:00";
    const duration = session.selectedDuration || "2h";

    // Calculate times
    const [startHour, startMin] = startTime.split(":").map(Number);
    const durationHours = parseInt(duration) || 2;

    const startDateTime = new Date(date);
    startDateTime.setHours(startHour, startMin, 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + durationHours);

    // Calculate pricing
    let pricing;
    try {
      pricing = calculatePricingBreakdown(
        boat.id,
        date,
        duration as Duration,
        session.selectedExtras || []
      );
    } catch {
      return { success: false, error: "Pricing calculation failed" };
    }

    // Check availability one more time
    const isAvailable = await storage.checkAvailability(boat.id, startDateTime, endDateTime);
    if (!isAvailable) {
      return { success: false, error: "Time slot no longer available" };
    }

    // Create booking as hold (pending payment)
    const booking = await storage.createBooking({
      boatId: boat.id,
      bookingDate: date,
      startTime: startDateTime,
      endTime: endDateTime,
      customerName: session.customerName?.split(" ")[0] || "Cliente",
      customerSurname: session.customerName?.split(" ").slice(1).join(" ") || "WhatsApp",
      customerPhone: session.phoneNumber,
      customerEmail: session.customerEmail || "",
      customerNationality: "ES", // Default, can be updated later
      numberOfPeople: session.numberOfPeople || 1,
      totalHours: durationHours,
      subtotal: pricing.subtotal.toString(),
      extrasTotal: pricing.extrasPrice.toString(),
      deposit: pricing.deposit.toString(),
      totalAmount: pricing.total.toString(),
      paymentStatus: "pending",
      bookingStatus: "hold",
      source: "whatsapp" as any, // Need to add 'whatsapp' to source type
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    // Create booking extras
    if (session.selectedExtras?.length) {
      for (const extraName of session.selectedExtras) {
        const extra = boat.extras.find((e) => e.name === extraName);
        if (extra) {
          await storage.createBookingExtra({
            bookingId: booking.id,
            extraName: extra.name,
            extraPrice: extra.price.replace(/[€\/ud\s]/g, ""),
            quantity: 1,
          });
        }
      }
    }

    return { success: true, bookingId: booking.id };
  } catch (error: any) {
    console.error("[Booking] Error creating booking:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Format date for display
 */
function formatDateForDisplay(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
