// Availability Check Flow Handlers
import { BOAT_DATA } from "@shared/boatData";
import { isOperationalSeason } from "@shared/pricing";
import { storage } from "../../storage";
import type { ChatbotTranslations } from "../translations";
import { formatMessage } from "../translations";

const BOATS = Object.values(BOAT_DATA);

/**
 * Prompt for date to check availability
 */
export function handleCheckAvailability(t: ChatbotTranslations): string {
  return `${t.checkAvailabilityTitle}\n\n${t.enterDatePrompt}`;
}

/**
 * Show boat selection after date is entered
 */
export async function handleSelectBoatForCheck(
  t: ChatbotTranslations,
  date: Date
): Promise<string> {
  // Check if date is in operational season
  if (!isOperationalSeason(date)) {
    return t.outOfSeason;
  }

  const dateStr = formatDateForDisplay(date);
  let message = formatMessage(t.availabilityResult, { date: dateStr }) + `\n\n`;

  // Check availability for each boat
  const availabilityPromises = BOATS.map(async (boat) => {
    // Check if any booking exists for this date (simplified check)
    // We'll check a full day window (9:00-20:00)
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(20, 0, 0, 0);

    try {
      const isAvailable = await storage.checkAvailability(boat.id, startOfDay, endOfDay);
      return { boat, isAvailable };
    } catch {
      return { boat, isAvailable: true }; // Assume available on error
    }
  });

  const results = await Promise.all(availabilityPromises);
  let availableCount = 0;

  results.forEach(({ boat, isAvailable }, index) => {
    const num = index + 1;
    const status = isAvailable ? t.available : t.occupied;
    const lowestPrice = Math.min(...Object.values(boat.pricing.BAJA.prices));

    if (isAvailable) {
      availableCount++;
      message += `${num}️⃣ *${boat.name}* ${status}\n`;
      message += `   💰 ${t.fromPrice} ${lowestPrice}€\n\n`;
    } else {
      message += `${num}️⃣ ~${boat.name}~ ${status}\n\n`;
    }
  });

  if (availableCount === 0) {
    message += `\n${t.noBoatsAvailable}`;
  } else if (availableCount === BOATS.length) {
    message += `\n${t.allBoatsAvailable}`;
  }

  message += t.selectBoatForAvailability;

  return message;
}

/**
 * Show detailed availability for a specific boat on a date
 */
export async function handleShowAvailability(
  t: ChatbotTranslations,
  boatId: string,
  date: Date
): Promise<string> {
  const boat = BOAT_DATA[boatId];
  if (!boat) {
    return t.boatNotFound;
  }

  const dateStr = formatDateForDisplay(date);
  let message = `📅 *Disponibilidad ${boat.name}*\n`;
  message += `_${dateStr}_\n\n`;

  // Check availability for common time slots
  const timeSlots = [
    { start: 10, end: 12, label: "10:00 - 12:00 (2h)" },
    { start: 10, end: 14, label: "10:00 - 14:00 (4h)" },
    { start: 10, end: 18, label: "10:00 - 18:00 (8h)" },
    { start: 14, end: 16, label: "14:00 - 16:00 (2h)" },
    { start: 14, end: 18, label: "14:00 - 18:00 (4h)" },
    { start: 16, end: 18, label: "16:00 - 18:00 (2h)" },
  ];

  for (const slot of timeSlots) {
    const startTime = new Date(date);
    startTime.setHours(slot.start, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(slot.end, 0, 0, 0);

    try {
      const isAvailable = await storage.checkAvailability(boatId, startTime, endTime);
      const status = isAvailable ? "✅" : "❌";
      message += `${status} ${slot.label}\n`;
    } catch {
      message += `✅ ${slot.label}\n`;
    }
  }

  message += `\n_¿Quieres reservar?_\n\n`;
  message += `1️⃣ Sí, reservar\n`;
  message += `2️⃣ Volver al menú`;

  return message;
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
