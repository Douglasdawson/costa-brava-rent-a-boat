// Boat Information Flow Handlers
import { BOAT_DATA } from "@shared/boatData";
import type { ChatbotTranslations } from "../translations";
import { formatMessage } from "../translations";

// Boat data for quick reference
const BOATS = Object.values(BOAT_DATA);

/**
 * List all boats with basic info
 */
export function handleListBoats(t: ChatbotTranslations): string {
  let message = `${t.ourBoats}\n\n${t.boatListHeader}\n\n`;

  BOATS.forEach((boat, index) => {
    const num = index + 1;
    const license = boat.specifications.capacity.includes("Personas")
      ? (boat.features.some(f => f.includes("Sin licencia")) ? t.noLicenseRequired : t.licenseRequired)
      : t.noLicenseRequired;

    // Get lowest price (BAJA season, shortest duration)
    const lowestPrice = Math.min(...Object.values(boat.pricing.BAJA.prices));

    message += `${num}️⃣ *${boat.name}*\n`;
    message += `   👥 ${boat.specifications.capacity}\n`;
    message += `   📋 ${license}\n`;
    message += `   💰 ${t.fromPrice} ${lowestPrice}€\n\n`;
  });

  message += t.selectBoatPrompt;

  return message;
}

/**
 * Show detailed info for a specific boat
 */
export function handleBoatDetail(t: ChatbotTranslations, boatId: string | null): string {
  if (!boatId) {
    return t.boatNotFound;
  }

  const boat = BOAT_DATA[boatId];
  if (!boat) {
    return t.boatNotFound;
  }

  let message = `${t.boatDetails}\n\n`;
  message += `🚤 *${boat.name}*\n`;
  message += `_${boat.subtitle}_\n\n`;

  // Specifications
  message += `📐 *Especificaciones:*\n`;
  message += `• Eslora: ${boat.specifications.length}\n`;
  message += `• Manga: ${boat.specifications.beam}\n`;
  message += `• Motor: ${boat.specifications.engine}\n`;
  message += `• Capacidad: ${boat.specifications.capacity}\n`;
  message += `• Combustible: ${boat.specifications.fuel}\n\n`;

  // License info
  const requiresLicense = boat.features.some(f => f.includes("Licencia"));
  message += requiresLicense ? `📋 ${t.licenseRequired}\n\n` : `📋 ${t.noLicenseRequired}\n\n`;

  // Fuel info
  const fuelIncluded = boat.included.some(i => i.toLowerCase().includes("carburante"));
  message += fuelIncluded ? `${t.fuelIncluded}\n\n` : `${t.fuelNotIncluded}\n\n`;

  // Equipment highlights
  message += `⚓ *Equipamiento:*\n`;
  boat.equipment.slice(0, 5).forEach(item => {
    message += `• ${item}\n`;
  });
  message += `\n`;

  // Starting prices
  const lowestPrice = Math.min(...Object.values(boat.pricing.BAJA.prices));
  message += `💰 *Precios desde ${lowestPrice}€*\n`;
  message += formatMessage(t.depositRequired, { deposit: boat.specifications.deposit.replace("€", "") });
  message += `\n\n`;

  // Actions
  message += `_¿Qué quieres hacer?_\n\n`;
  message += `1️⃣ Reservar este barco\n`;
  message += `2️⃣ Ver precios detallados\n`;
  message += `3️⃣ Volver a la flota`;

  return message;
}

/**
 * Show prices for a boat or all boats
 */
export function handleShowPrices(t: ChatbotTranslations, boatId: string | null): string {
  if (boatId) {
    // Show prices for specific boat
    const boat = BOAT_DATA[boatId];
    if (!boat) {
      return t.boatNotFound;
    }

    let message = formatMessage(t.pricesTitle, { boat: boat.name }) + `\n\n`;

    // Low season
    message += `${t.seasonLow}\n`;
    Object.entries(boat.pricing.BAJA.prices).forEach(([duration, price]) => {
      message += `  ${duration}: *${price}€*\n`;
    });
    message += `\n`;

    // Mid season
    message += `${t.seasonMid}\n`;
    Object.entries(boat.pricing.MEDIA.prices).forEach(([duration, price]) => {
      message += `  ${duration}: *${price}€*\n`;
    });
    message += `\n`;

    // High season
    message += `${t.seasonHigh}\n`;
    Object.entries(boat.pricing.ALTA.prices).forEach(([duration, price]) => {
      message += `  ${duration}: *${price}€*\n`;
    });
    message += `\n`;

    // Deposit
    message += formatMessage(t.depositRequired, { deposit: boat.specifications.deposit.replace("€", "") });
    message += `\n\n`;

    // Extras
    message += `${t.extrasTitle}\n`;
    boat.extras.forEach(extra => {
      message += `• ${extra.name}: ${extra.price}\n`;
    });

    message += t.backToMenu;

    return message;
  }

  // Show price overview for all boats
  let message = `💰 *Precios de Nuestra Flota*\n\n`;
  message += `_Precios en temporada baja (Abr-Jun, Sep-Oct)_\n\n`;

  BOATS.forEach((boat, index) => {
    const num = index + 1;
    const prices = boat.pricing.BAJA.prices;
    const priceList = Object.entries(prices)
      .map(([d, p]) => `${d}=${p}€`)
      .join(" | ");

    message += `${num}️⃣ *${boat.name}*\n`;
    message += `   ${priceList}\n\n`;
  });

  message += `_Responde con el número del barco para ver precios detallados_`;

  return message;
}
