// Pricing utility for Costa Brava Rent a Boat seasonal pricing system
import { BOAT_DATA, EXTRA_PACKS, type BoatData } from './boatData';
import { SEASON_START_MONTH, SEASON_END_MONTH } from './constants';

export type Season = 'BAJA' | 'MEDIA' | 'ALTA';
export type Duration = '1h' | '2h' | '3h' | '4h' | '6h' | '8h';

/** Weekend surcharge factor: +15% on Saturdays and Sundays */
export const WEEKEND_SURCHARGE_FACTOR = 1.15;

/**
 * Round a price to the nearest multiple of 10 (e.g. 231 → 230, 235 → 240, 244 → 240).
 * Applied to outputs of weekend-surcharge and override calculations so the
 * customer never sees ugly figures like 187.5€ or 224.9€. Catalog base prices
 * (e.g. 75€, 115€) are NOT rounded — they're the owner's authored numbers.
 */
function roundToNearestTen(n: number): number {
  return Math.round(n / 10) * 10;
}

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/**
 * Get the weekday number in Madrid timezone (0=Sunday .. 6=Saturday).
 * Uses formatToParts to avoid the Node 20 h24 quirk in Europe/Madrid.
 */
export function getWeekdayInMadrid(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    weekday: 'short',
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  return DAY_NAME_TO_NUMBER[weekday] ?? 0;
}

/**
 * Get YYYY-MM-DD date string in Madrid timezone.
 * Used for inclusive comparison with override date_start / date_end (DATE columns).
 */
export function getDateStringInMadrid(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

/**
 * Check if the given date falls on Saturday or Sunday (Spain timezone)
 */
export function isWeekend(date: Date): boolean {
  const wd = getWeekdayInMadrid(date);
  return wd === 0 || wd === 6;
}

// ===== Pricing overrides (dynamic pricing by date block) =====

export type PricingOverrideDirection = 'surcharge' | 'discount';
export type PricingOverrideType = 'multiplier' | 'flat_eur';

/**
 * Reduced shape of a pricing_overrides row for use in this pure module.
 * The DB row is mapped to this shape by the storage layer (see
 * server/storage/pricingOverrides.ts → loadActiveOverridesForDate).
 */
export interface PricingOverrideRule {
  id: string;
  boatId: string | null;
  dateStart: string; // YYYY-MM-DD
  dateEnd: string; // YYYY-MM-DD inclusive
  weekdayFilter: number[] | null; // null = applies every day; values 0=Sun..6=Sat
  direction: PricingOverrideDirection;
  adjustmentType: PricingOverrideType;
  adjustmentValue: number; // always positive; direction defines sign
  priority: number;
  label: string;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Select the single override that applies to a given date+boat from a list.
 * Resolution rules (in order):
 *   1. is_active = true
 *   2. date in [date_start, date_end] (Madrid TZ)
 *   3. weekday_filter null OR contains target weekday
 *   4. boat_id matches OR boat_id IS NULL (global)
 *   5. boat-specific (boat_id NOT NULL) wins over global
 *   6. higher priority wins
 *   7. most recent created_at wins
 */
export function selectApplicableOverride(
  date: Date,
  boatId: string,
  rules: PricingOverrideRule[],
): PricingOverrideRule | null {
  const dateStr = getDateStringInMadrid(date);
  const weekdayNum = getWeekdayInMadrid(date);

  const candidates = rules.filter((r) => {
    if (!r.isActive) return false;
    if (dateStr < r.dateStart || dateStr > r.dateEnd) return false;
    if (r.weekdayFilter && !r.weekdayFilter.includes(weekdayNum)) return false;
    if (r.boatId !== null && r.boatId !== boatId) return false;
    return true;
  });

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  candidates.sort((a, b) => {
    const aSpec = a.boatId !== null ? 1 : 0;
    const bSpec = b.boatId !== null ? 1 : 0;
    if (aSpec !== bSpec) return bSpec - aSpec;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return candidates[0];
}

/**
 * Apply a single override to a base price.
 * Direction defines sign; multiplier value is the delta (e.g. 0.25 = +25%);
 * flat_eur value is the absolute € delta. Result is rounded and floored at 0.
 */
export function applyOverrideToPrice(price: number, override: PricingOverrideRule): number {
  const sign = override.direction === 'surcharge' ? 1 : -1;
  let result: number;
  if (override.adjustmentType === 'multiplier') {
    result = price * (1 + sign * override.adjustmentValue);
  } else {
    result = price + sign * override.adjustmentValue;
  }
  return Math.max(0, roundToNearestTen(result));
}

/**
 * Get the minimum allowed booking duration for a given date.
 * Returns '2h' for Temporada Alta (August) and weekends; '1h' otherwise.
 */
export function getMinimumDuration(date: Date): Duration {
  const month = date.getMonth() + 1;
  if (month === 8 || isWeekend(date)) return '2h';
  return '1h';
}

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
  return month >= SEASON_START_MONTH && month <= SEASON_END_MONTH;
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
 * Whether the +15% weekend surcharge applies on a given date.
 *
 * In August (Temporada Alta) the day of the week is NOT a demand driver
 * — analysis of 2,333 bookings 2020-2025 showed Mon and Sat in August
 * sell within ~10% of each other. Stacking the weekend surcharge on top
 * of the August season pricing pushed weekend-Aug rates well above
 * market. So we skip the surcharge in August entirely.
 *
 * Weekend surcharge still applies in June, July, September and October,
 * where the data clearly shows weekends outsell weekdays.
 */
export function shouldApplyWeekendSurcharge(date: Date): boolean {
  if (!isWeekend(date)) return false;
  const month = date.getMonth() + 1; // 1-12
  if (month === 8) return false;
  return true;
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

  const basePrice = seasonPricing.prices[duration];
  return shouldApplyWeekendSurcharge(date) ? roundToNearestTen(basePrice * WEEKEND_SURCHARGE_FACTOR) : basePrice;
}

/**
 * Calculate total price for extras, with optional pack support.
 * When a pack is selected, its price is added and individual extras
 * that are already included in the pack are NOT double-counted.
 */
export function calculateExtrasPrice(
  boatId: string,
  selectedExtras: string[],
  selectedPacks: string[] = []
): number {
  const boat = BOAT_DATA[boatId];
  if (!boat) {
    throw new Error(`Boat with id "${boatId}" not found`);
  }

  let total = 0;

  // Collect all extras already covered by selected packs
  const extrasInPacks = new Set<string>();
  for (const packId of selectedPacks) {
    const pack = EXTRA_PACKS.find(p => p.id === packId);
    if (pack) {
      total += pack.price;
      pack.extras.forEach(e => extrasInPacks.add(e));
    }
  }

  // Add individual extras that are NOT covered by any pack
  selectedExtras.forEach(extraName => {
    if (extrasInPacks.has(extraName)) return; // skip, already in a pack
    const extra = boat.extras.find(e => e.name === extraName);
    if (extra) {
      total += parseExtraPrice(extra.price);
    }
  });

  return total;
}

/**
 * Calculate savings for a given pack (originalPrice - price)
 */
export function calculatePackSavings(packId: string): number {
  const pack = EXTRA_PACKS.find(p => p.id === packId);
  if (!pack) return 0;
  return pack.originalPrice - pack.price;
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
export interface AppliedOverrideInfo {
  id: string;
  label: string;
  direction: PricingOverrideDirection;
  adjustmentType: PricingOverrideType;
  adjustmentValue: number;
}

export interface PricingBreakdown {
  boatId: string;
  boatName: string;
  date: string;
  duration: Duration;
  season: Season;
  weekendSurcharge: boolean;
  basePrice: number;
  basePriceBeforeOverride?: number; // present when an override is applied
  appliedOverride?: AppliedOverrideInfo;
  selectedExtras: string[];
  selectedPacks: string[];
  extrasPrice: number;
  deposit: number;
  subtotal: number; // basePrice (post-override) + extrasPrice
  total: number; // subtotal + deposit
}

export function calculatePricingBreakdown(
  boatId: string,
  date: Date,
  duration: Duration,
  selectedExtras: string[] = [],
  selectedPacks: string[] = [],
  overrides: PricingOverrideRule[] = []
): PricingBreakdown {
  const boat = BOAT_DATA[boatId];
  if (!boat) {
    throw new Error(`Boat with id "${boatId}" not found`);
  }

  const season = getSeason(date);
  const basePriceBeforeOverride = calculateBasePrice(boatId, date, duration);

  const applicableOverride = selectApplicableOverride(date, boatId, overrides);
  const basePrice = applicableOverride
    ? applyOverrideToPrice(basePriceBeforeOverride, applicableOverride)
    : basePriceBeforeOverride;

  const extrasPrice = calculateExtrasPrice(boatId, selectedExtras, selectedPacks);
  const deposit = getDepositAmount(boatId);
  const subtotal = basePrice + extrasPrice;
  const total = subtotal + deposit;

  const breakdown: PricingBreakdown = {
    boatId,
    boatName: boat.name,
    date: date.toISOString().split('T')[0], // YYYY-MM-DD format
    duration,
    season,
    weekendSurcharge: shouldApplyWeekendSurcharge(date),
    basePrice,
    selectedExtras,
    selectedPacks,
    extrasPrice,
    deposit,
    subtotal,
    total,
  };

  if (applicableOverride) {
    breakdown.basePriceBeforeOverride = basePriceBeforeOverride;
    breakdown.appliedOverride = {
      id: applicableOverride.id,
      label: applicableOverride.label,
      direction: applicableOverride.direction,
      adjustmentType: applicableOverride.adjustmentType,
      adjustmentValue: applicableOverride.adjustmentValue,
    };
  }

  return breakdown;
}

/**
 * Get available durations for a boat (without date filtering)
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
 * Duration option with availability info for UI rendering
 */
export interface DurationOption {
  duration: Duration;
  available: boolean;
  /** Reason string key when not available (e.g., 'peakSeasonMinimum' or 'weekendMinimum') */
  restrictionReason?: 'peakSeasonMinimum' | 'weekendMinimum';
  /** The minimum duration that applies */
  minimumRequired?: Duration;
}

/** Parse duration string to hours (e.g., '2h' -> 2) */
function durationToHours(d: Duration): number {
  return parseInt(d);
}

/**
 * Get available durations for a boat on a specific date, with restriction info.
 * Combines per-boat duration catalog with date-based minimum duration rules.
 *
 * Business rules (from getMinimumDuration):
 * - August (Temporada Alta): minimum 2h
 * - Weekends (Sat/Sun): minimum 2h
 * - All other dates: minimum 1h
 */
export function getAvailableDurationsForDate(boatId: string, date: Date): DurationOption[] {
  const boat = BOAT_DATA[boatId];
  if (!boat) {
    throw new Error(`Boat with id "${boatId}" not found`);
  }

  const season = getSeason(date);
  const boatDurations = Object.keys(boat.pricing[season].prices) as Duration[];
  const minDuration = getMinimumDuration(date);
  const minHours = durationToHours(minDuration);

  const month = date.getMonth() + 1;

  return boatDurations.map((d) => {
    const hours = durationToHours(d);
    if (hours < minHours) {
      return {
        duration: d,
        available: false,
        restrictionReason: month === 8 ? 'peakSeasonMinimum' : 'weekendMinimum',
        minimumRequired: minDuration,
      };
    }
    return { duration: d, available: true };
  });
}

/**
 * Get all boat IDs
 */
export function getAllBoatIds(): string[] {
  return Object.keys(BOAT_DATA);
}

/**
 * Filter a prices record to only entries offered (price > 0).
 * Admins can set a duration's price to 0 to hide it from public pages.
 */
export function filterActivePrices(
  prices: Record<string, number | null | undefined> | null | undefined,
): Record<string, number> {
  if (!prices) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(prices)) {
    if (typeof v === 'number' && v > 0) out[k] = v;
  }
  return out;
}

/**
 * Minimum offered price across durations, ignoring 0 / null entries.
 * Returns null when no active price is configured.
 */
export function getMinActivePrice(
  prices: Record<string, number | null | undefined> | null | undefined,
): number | null {
  const active = Object.values(filterActivePrices(prices));
  return active.length ? Math.min(...active) : null;
}

/**
 * Cheapest active (>0) price for a specific duration across a set of boats.
 * Used by public pages to render "desde X€" figures derived from live admin data.
 */
export function minPriceAcrossBoats(
  boats: Array<{ pricing?: unknown } | undefined | null>,
  duration: string,
  season: Season,
): number | null {
  let min = Infinity;
  for (const b of boats) {
    const pricing = b?.pricing as Record<Season, { prices?: Record<string, number | null | undefined> }> | null | undefined;
    const p = pricing?.[season]?.prices?.[duration];
    if (typeof p === 'number' && p > 0 && p < min) min = p;
  }
  return Number.isFinite(min) ? min : null;
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
 * Apply a membership discount to a base price.
 * Returns the discounted price, rounded to the nearest euro.
 */
export function applyMembershipDiscount(basePrice: number, discountPercent: number): number {
  return Math.round(basePrice * (1 - discountPercent / 100));
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

// ===== DYNAMIC PRICING ENGINE =====

/** Configuration for demand-responsive price adjustments */
export interface DynamicPricingConfig {
  /** Occupancy rate (0-1) above which prices start increasing */
  highDemandThreshold: number;
  /** Occupancy rate (0-1) below which prices start decreasing */
  lowDemandThreshold: number;
  /** Maximum price increase factor (e.g., 0.25 = +25%) */
  maxSurcharge: number;
  /** Maximum price decrease factor (e.g., 0.25 = -25%) */
  maxDiscount: number;
}

export const DEFAULT_DYNAMIC_PRICING_CONFIG: DynamicPricingConfig = {
  highDemandThreshold: 0.75,
  lowDemandThreshold: 0.30,
  maxSurcharge: 0.25,
  maxDiscount: 0.25,
};

/** Reason why a dynamic price adjustment was applied */
export type DynamicPricingReason = 'high_demand' | 'low_demand' | 'normal';

/** Result of a dynamic pricing calculation */
export interface DynamicPricingResult {
  /** The original base price before dynamic adjustment */
  basePrice: number;
  /** The final price after dynamic adjustment */
  adjustedPrice: number;
  /** Multiplicative factor applied (e.g., 1.15 means +15%) */
  adjustmentFactor: number;
  /** The occupancy rate used for this calculation */
  occupancyRate: number;
  /** Why the adjustment was applied */
  reason: DynamicPricingReason;
}

/**
 * Calculate a demand-responsive price on top of the static base price.
 *
 * Pure function: takes occupancyRate as input, does NOT query the database.
 *
 * Adjustment logic (linear interpolation):
 * - occupancyRate >= highDemandThreshold:
 *     surcharge grows linearly from 0% at threshold to maxSurcharge at 100%
 * - occupancyRate <= lowDemandThreshold:
 *     discount grows linearly from 0% at threshold to maxDiscount at 0%
 * - Between thresholds: no adjustment (base price)
 */
export function calculateDynamicPrice(
  boatId: string,
  date: Date,
  duration: Duration,
  occupancyRate: number,
  config: DynamicPricingConfig = DEFAULT_DYNAMIC_PRICING_CONFIG,
): DynamicPricingResult {
  // Clamp occupancy to valid range
  const clampedOccupancy = Math.max(0, Math.min(1, occupancyRate));

  const basePrice = calculateBasePrice(boatId, date, duration);

  let adjustmentFactor = 1;
  let reason: DynamicPricingReason = 'normal';

  if (clampedOccupancy >= config.highDemandThreshold) {
    // Linear interpolation: 0% surcharge at threshold, maxSurcharge at 100%
    const range = 1 - config.highDemandThreshold;
    const progress = range > 0
      ? (clampedOccupancy - config.highDemandThreshold) / range
      : 1;
    adjustmentFactor = 1 + config.maxSurcharge * progress;
    reason = 'high_demand';
  } else if (clampedOccupancy <= config.lowDemandThreshold) {
    // Linear interpolation: 0% discount at threshold, maxDiscount at 0%
    const range = config.lowDemandThreshold;
    const progress = range > 0
      ? (config.lowDemandThreshold - clampedOccupancy) / range
      : 1;
    adjustmentFactor = 1 - config.maxDiscount * progress;
    reason = 'low_demand';
  }

  const adjustedPrice = Math.round(basePrice * adjustmentFactor);

  return {
    basePrice,
    adjustedPrice,
    adjustmentFactor,
    occupancyRate: clampedOccupancy,
    reason,
  };
}