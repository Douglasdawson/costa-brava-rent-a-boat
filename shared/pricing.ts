// Pricing utility for Costa Brava Rent a Boat seasonal pricing system
import { BOAT_DATA, type BoatData } from './boatData';

export type Season = 'BAJA' | 'MEDIA' | 'ALTA';
export type Duration = '1h' | '2h' | '3h' | '4h' | '6h' | '8h';

/**
 * Determine the season based on a given date
 * BAJA: April-June, September-October (operational season)
 * MEDIA: July
 * ALTA: August
 */
export function getSeason(date: Date): Season {
  const month = date.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
  
  if (month === 7) {
    return 'MEDIA'; // July
  } else if (month === 8) {
    return 'ALTA'; // August
  } else if (month >= 4 && month <= 6 || month >= 9 && month <= 10) {
    return 'BAJA'; // April-June, September-October
  } else {
    // Outside operational season (November-March)
    throw new Error(`Date ${date.toDateString()} is outside operational season (April-October)`);
  }
}

/**
 * Check if a given date is within operational season (April-October)
 */
export function isOperationalSeason(date: Date): boolean {
  const month = date.getMonth() + 1;
  return month >= 4 && month <= 10;
}

/**
 * Parse deposit string to number (e.g., "250€" -> 250)
 */
function parseDeposit(depositStr: string): number {
  return parseInt(depositStr.replace(/[€\s]/g, ''));
}

/**
 * Parse extra price to number (e.g., "10€" -> 10, "2,5€/ud" -> 2.5)
 */
function parseExtraPrice(priceStr: string): number {
  // Handle cases like "2,5€/ud" - just take the number part
  const match = priceStr.match(/(\d+(?:,\d+)?)/);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }
  return 0;
}

/**
 * Calculate the base rental price for a boat on a specific date and duration
 * Alias: priceFor() - same functionality, different name for compatibility
 */
export function calculateBasePrice(boatId: string, date: Date, duration: Duration): number {
  const boat = BOAT_DATA[boatId];
  if (!boat) {
    throw new Error(`Boat with id "${boatId}" not found`);
  }

  const season = getSeason(date);
  const seasonPricing = boat.pricing[season];
  
  if (!seasonPricing || !seasonPricing.prices[duration]) {
    throw new Error(`Price not found for boat ${boatId}, season ${season}, duration ${duration}`);
  }

  return seasonPricing.prices[duration];
}

/**
 * Calculate total price for extras
 */
export function calculateExtrasPrice(boatId: string, selectedExtras: string[]): number {
  const boat = BOAT_DATA[boatId];
  if (!boat) {
    throw new Error(`Boat with id "${boatId}" not found`);
  }

  let total = 0;
  selectedExtras.forEach(extraName => {
    const extra = boat.extras.find(e => e.name === extraName);
    if (extra) {
      total += parseExtraPrice(extra.price);
    }
  });

  return total;
}

/**
 * Get the deposit amount for a boat
 */
export function getDepositAmount(boatId: string): number {
  const boat = BOAT_DATA[boatId];
  if (!boat) {
    throw new Error(`Boat with id "${boatId}" not found`);
  }

  return parseDeposit(boat.specifications.deposit);
}

/**
 * Calculate complete pricing breakdown for a booking
 */
export interface PricingBreakdown {
  boatId: string;
  boatName: string;
  date: string;
  duration: Duration;
  season: Season;
  basePrice: number;
  selectedExtras: string[];
  extrasPrice: number;
  deposit: number;
  subtotal: number; // basePrice + extrasPrice
  total: number; // subtotal + deposit
}

export function calculatePricingBreakdown(
  boatId: string,
  date: Date,
  duration: Duration,
  selectedExtras: string[] = []
): PricingBreakdown {
  const boat = BOAT_DATA[boatId];
  if (!boat) {
    throw new Error(`Boat with id "${boatId}" not found`);
  }

  const season = getSeason(date);
  const basePrice = calculateBasePrice(boatId, date, duration);
  const extrasPrice = calculateExtrasPrice(boatId, selectedExtras);
  const deposit = getDepositAmount(boatId);
  const subtotal = basePrice + extrasPrice;
  const total = subtotal + deposit;

  return {
    boatId,
    boatName: boat.name,
    date: date.toISOString().split('T')[0], // YYYY-MM-DD format
    duration,
    season,
    basePrice,
    selectedExtras,
    extrasPrice,
    deposit,
    subtotal,
    total
  };
}

/**
 * Get available durations for a boat
 */
export function getAvailableDurations(boatId: string): Duration[] {
  const boat = BOAT_DATA[boatId];
  if (!boat) {
    throw new Error(`Boat with id "${boatId}" not found`);
  }

  // Get durations from BAJA season as reference (all boats should have same duration options)
  return Object.keys(boat.pricing.BAJA.prices) as Duration[];
}

/**
 * Get all boat IDs
 */
export function getAllBoatIds(): string[] {
  return Object.keys(BOAT_DATA);
}

/**
 * Format price for display (e.g., 150 -> "150€")
 */
export function formatPrice(amount: number): string {
  return `${amount}€`;
}

/**
 * Calculate the base rental price for a boat on a specific date and duration
 * Alias for calculateBasePrice() to match original contract
 */
export function priceFor(boatId: string, date: Date, duration: Duration): number {
  return calculateBasePrice(boatId, date, duration);
}

/**
 * Validate if a duration is supported
 */
export function isValidDuration(duration: string): duration is Duration {
  const validDurations: Duration[] = ['1h', '2h', '3h', '4h', '6h', '8h'];
  return validDurations.includes(duration as Duration);
}

/**
 * Get season display name in Spanish
 */
export function getSeasonDisplayName(season: Season): string {
  const seasonNames = {
    'BAJA': 'Temporada Baja',
    'MEDIA': 'Temporada Media', 
    'ALTA': 'Temporada Alta'
  };
  return seasonNames[season];
}