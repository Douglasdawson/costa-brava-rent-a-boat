// Function Calling Service - AI can query availability, prices, and create bookings
import OpenAI from "openai";
import { storage } from "../storage";
import type { Boat } from "@shared/schema";
import {
  getSeason,
  isOperationalSeason,
  getSeasonDisplayName,
  calculatePricingBreakdown,
  isValidDuration,
  type Season,
  type Duration,
} from "@shared/pricing";
import { getStripe } from "../routes/payments";
import { logger } from "../lib/logger";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Define available functions for the AI
export const AVAILABLE_FUNCTIONS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_boat_availability",
      description: "Check if a specific boat is available on a given date and time. Use this when the user asks about availability.",
      parameters: {
        type: "object",
        properties: {
          boat_id: {
            type: "string",
            description: "The ID of the boat to check (e.g., 'voraz-450', 'quicksilver-505')",
          },
          date: {
            type: "string",
            description: "The date to check in YYYY-MM-DD format",
          },
          start_time: {
            type: "string",
            description: "The start time in HH:MM format (e.g., '10:00', '14:00')",
          },
          duration_hours: {
            type: "number",
            description: "Duration in hours (2, 4, 6, or 8)",
          },
        },
        required: ["boat_id", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_price_for_date",
      description: "Get the price for a boat rental on a specific date, considering seasonal pricing. Use this when the user asks about prices for specific dates.",
      parameters: {
        type: "object",
        properties: {
          boat_id: {
            type: "string",
            description: "The ID of the boat",
          },
          date: {
            type: "string",
            description: "The date in YYYY-MM-DD format",
          },
          duration_hours: {
            type: "number",
            description: "Duration in hours (2, 4, 6, or 8)",
          },
        },
        required: ["boat_id", "date", "duration_hours"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_available_boats",
      description: "List all boats that are available on a given date. Use this when the user wants to see what's available.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "The date to check in YYYY-MM-DD format",
          },
          capacity_min: {
            type: "number",
            description: "Minimum number of people the boat should accommodate",
          },
          requires_license: {
            type: "boolean",
            description: "Filter by license requirement (true = needs license, false = no license needed)",
          },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_boat_details",
      description: "Get detailed information about a specific boat including specifications, equipment, and features.",
      parameters: {
        type: "object",
        properties: {
          boat_id: {
            type: "string",
            description: "The ID of the boat",
          },
        },
        required: ["boat_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking_link",
      description: "Creates a booking with a Stripe payment link for the customer. Use when the customer has confirmed their boat choice, date, time, and duration, and wants to proceed with the reservation. You MUST have all required information before calling this function.",
      parameters: {
        type: "object",
        properties: {
          boat_id: {
            type: "string",
            description: "The boat identifier (e.g., 'voraz-450', 'quicksilver-505')",
          },
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format",
          },
          start_time: {
            type: "string",
            description: "Start time in HH:MM format (e.g., '10:00', '14:00')",
          },
          duration_hours: {
            type: "number",
            description: "Duration in hours (1, 2, 3, 4, 6, or 8)",
          },
          customer_name: {
            type: "string",
            description: "Customer's full name",
          },
          customer_phone: {
            type: "string",
            description: "Customer's phone number (WhatsApp number)",
          },
          customer_email: {
            type: "string",
            description: "Customer's email address (optional, for sending confirmation)",
          },
          number_of_people: {
            type: "number",
            description: "Number of passengers",
          },
        },
        required: ["boat_id", "date", "start_time", "duration_hours", "customer_name", "customer_phone", "number_of_people"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_alternatives",
      description: "When a boat is unavailable, suggests similar alternatives that are available on the requested date. Filters by similar capacity, price range, and license requirement.",
      parameters: {
        type: "object",
        properties: {
          original_boat_id: {
            type: "string",
            description: "The ID of the originally requested boat that is unavailable",
          },
          date: {
            type: "string",
            description: "The date in YYYY-MM-DD format",
          },
          start_time: {
            type: "string",
            description: "The start time in HH:MM format (e.g., '10:00', '14:00')",
          },
          duration_hours: {
            type: "number",
            description: "Duration in hours (2, 4, 6, or 8)",
          },
          min_capacity: {
            type: "number",
            description: "Minimum number of people needed",
          },
        },
        required: ["original_boat_id", "date", "start_time", "duration_hours"],
      },
    },
  },
];

// Execute a function call
export async function executeFunction(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      case "get_boat_availability":
        return await checkBoatAvailability(args.boat_id as string, args.date as string, args.start_time as string | undefined, args.duration_hours as number | undefined);
      
      case "get_price_for_date":
        return await getPriceForDate(args.boat_id as string, args.date as string, args.duration_hours as number);
      
      case "list_available_boats":
        return await listAvailableBoats(args.date as string, args.capacity_min as number | undefined, args.requires_license as boolean | undefined);
      
      case "get_boat_details":
        return await getBoatDetails(args.boat_id as string);

      case "suggest_alternatives":
        return await suggestAlternatives(
          args.original_boat_id as string,
          args.date as string,
          args.start_time as string,
          args.duration_hours as number,
          args.min_capacity as number | undefined,
        );

      case "create_booking_link":
        return await createBookingLink({
          boatId: args.boat_id as string,
          dateStr: args.date as string,
          startTime: args.start_time as string,
          durationHours: args.duration_hours as number,
          customerName: args.customer_name as string,
          customerPhone: args.customer_phone as string,
          customerEmail: args.customer_email as string | undefined,
          numberOfPeople: args.number_of_people as number,
        });

      default:
        return JSON.stringify({ error: "Unknown function" });
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Error executing function", { name, error: errorMsg });
    return JSON.stringify({ error: errorMsg });
  }
}

// Check boat availability
async function checkBoatAvailability(
  boatId: string,
  dateStr: string,
  startTime?: string,
  durationHours?: number
): Promise<string> {
  const boat = await storage.getBoat(boatId);
  if (!boat) {
    return JSON.stringify({ available: false, error: "Barco no encontrado" });
  }

  const date = new Date(dateStr);

  if (!isOperationalSeason(date)) {
    return JSON.stringify({
      available: false,
      boat_name: boat.name,
      date: dateStr,
      error: "Esa fecha esta fuera de temporada. Operamos de abril a octubre.",
    });
  }

  const start = startTime || "10:00";
  const duration = durationHours || 4;

  // Parse times
  const [startHour, startMin] = start.split(':').map(Number);
  const startDate = new Date(date);
  startDate.setHours(startHour, startMin, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + duration);

  // Check for conflicts
  const isAvailable = await storage.checkAvailability(boatId, startDate, endDate);

  return JSON.stringify({
    boat_name: boat.name,
    date: dateStr,
    start_time: start,
    duration_hours: duration,
    available: isAvailable,
    message: isAvailable 
      ? `El ${boat.name} esta disponible el ${dateStr} de ${start} a ${endDate.getHours()}:00`
      : `Lo siento, el ${boat.name} no esta disponible en ese horario`,
  });
}

// Get price for a specific date
async function getPriceForDate(
  boatId: string,
  dateStr: string,
  durationHours: number
): Promise<string> {
  const boat = await storage.getBoat(boatId);
  if (!boat) {
    return JSON.stringify({ error: "Barco no encontrado" });
  }

  const date = new Date(dateStr);

  if (!isOperationalSeason(date)) {
    return JSON.stringify({
      boat_name: boat.name,
      error: "Esa fecha esta fuera de temporada. Operamos de abril a octubre.",
    });
  }

  const season = getSeason(date);
  const pricing = boat.pricing as Record<string, { prices?: Record<string, number> }> | null;

  if (!pricing || !pricing[season]) {
    return JSON.stringify({
      boat_name: boat.name,
      error: "Precios no disponibles para esta temporada"
    });
  }

  const durationKey = `${durationHours}h`;
  const price = pricing[season].prices?.[durationKey];

  if (!price) {
    return JSON.stringify({
      boat_name: boat.name,
      season,
      available_durations: Object.keys(pricing[season].prices || {}),
      error: `Duracion de ${durationHours} horas no disponible`,
    });
  }

  return JSON.stringify({
    boat_name: boat.name,
    date: dateStr,
    season,
    season_description: getSeasonDisplayName(season),
    duration_hours: durationHours,
    price: price,
    deposit: boat.deposit,
    message: `El ${boat.name} por ${durationHours} horas el ${dateStr} cuesta ${price} euros (temporada ${season.toLowerCase()}). Deposito: ${boat.deposit} euros.`,
  });
}

// List available boats for a date
async function listAvailableBoats(
  dateStr: string,
  capacityMin?: number,
  requiresLicense?: boolean
): Promise<string> {
  const allBoats = await storage.getAllBoats();
  const date = new Date(dateStr);

  if (!isOperationalSeason(date)) {
    return JSON.stringify({
      date: dateStr,
      error: "Esa fecha esta fuera de temporada. Operamos de abril a octubre.",
      total_available: 0,
      boats: [],
    });
  }

  const season = getSeason(date);

  // Filter boats
  let filteredBoats = allBoats;

  if (capacityMin) {
    filteredBoats = filteredBoats.filter(b => b.capacity >= capacityMin);
  }

  if (capacityMin && filteredBoats.length === 0) {
    return JSON.stringify({
      available: false,
      message: `No tenemos barcos disponibles para ${capacityMin} personas. Nuestra capacidad maxima es de 8 personas por barco. Para grupos mas grandes, podemos organizar varios barcos. Contactanos al +34 611 500 372.`,
    });
  }

  if (requiresLicense !== undefined) {
    filteredBoats = filteredBoats.filter(b => b.requiresLicense === requiresLicense);
  }

  // Check availability for each boat (morning slot as default check)
  const startDate = new Date(date);
  startDate.setHours(10, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(14, 0, 0, 0);

  const availableBoats = [];
  for (const boat of filteredBoats) {
    const isAvailable = await storage.checkAvailability(boat.id, startDate, endDate);
    if (isAvailable) {
      const pricing = boat.pricing as Record<string, { prices?: Record<string, number> }> | null;
      const price4h = pricing?.[season]?.prices?.['4h'];
      availableBoats.push({
        id: boat.id,
        name: boat.name,
        capacity: boat.capacity,
        requires_license: boat.requiresLicense,
        price_4h: price4h,
        deposit: boat.deposit,
      });
    }
  }

  return JSON.stringify({
    date: dateStr,
    season,
    total_available: availableBoats.length,
    boats: availableBoats,
    message: availableBoats.length > 0
      ? `Hay ${availableBoats.length} barcos disponibles el ${dateStr}`
      : `No hay barcos disponibles el ${dateStr} con los criterios especificados`,
  });
}

// Get detailed boat information
async function getBoatDetails(boatId: string): Promise<string> {
  const boat = await storage.getBoat(boatId);
  if (!boat) {
    return JSON.stringify({ error: "Barco no encontrado" });
  }

  const specs = boat.specifications as Record<string, unknown> | null;
  const pricing = boat.pricing as Record<string, { prices?: Record<string, number> }> | null;

  return JSON.stringify({
    id: boat.id,
    name: boat.name,
    subtitle: boat.subtitle,
    description: boat.description,
    capacity: boat.capacity,
    requires_license: boat.requiresLicense,
    deposit: boat.deposit,
    specifications: specs,
    equipment: boat.equipment,
    included: boat.included,
    features: boat.features,
    pricing_summary: {
      BAJA: pricing?.BAJA?.prices,
      MEDIA: pricing?.MEDIA?.prices,
      ALTA: pricing?.ALTA?.prices,
    },
    image_url: boat.imageUrl,
  });
}

// Suggest alternative boats when the preferred one is unavailable
async function suggestAlternatives(
  originalBoatId: string,
  dateStr: string,
  startTime: string,
  durationHours: number,
  minCapacity?: number,
): Promise<string> {
  const originalBoat = await storage.getBoat(originalBoatId);
  if (!originalBoat) {
    return JSON.stringify({ error: "Barco original no encontrado" });
  }

  const date = new Date(dateStr);

  if (!isOperationalSeason(date)) {
    return JSON.stringify({
      error: "Esa fecha esta fuera de temporada. Operamos de abril a octubre.",
      alternatives: [],
    });
  }

  const season = getSeason(date);
  const durationKey = `${durationHours}h`;

  // Get original boat price for comparison
  const originalPricing = originalBoat.pricing as Record<string, { prices?: Record<string, number> }> | null;
  const originalPrice = originalPricing?.[season]?.prices?.[durationKey] ?? 0;

  // Build time window for availability check
  const [startHour, startMin] = startTime.split(':').map(Number);
  const startDate = new Date(date);
  startDate.setHours(startHour, startMin, 0, 0);
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + durationHours);

  const allBoats = await storage.getAllBoats();

  // Effective minimum capacity: use explicit param or original boat capacity
  const requiredCapacity = minCapacity ?? originalBoat.capacity;

  // Filter candidates by compatibility criteria
  const candidates: Array<{
    boat: typeof allBoats[number];
    price: number;
    capacityDiff: number;
    priceDiff: number;
  }> = [];

  for (const boat of allBoats) {
    // Skip the original boat itself
    if (boat.id === originalBoatId) continue;

    // License requirement must match: no-license boats only suggest no-license alternatives
    if (originalBoat.requiresLicense !== boat.requiresLicense) continue;

    // Capacity within +/-2 of original, and must meet minimum
    if (Math.abs(boat.capacity - originalBoat.capacity) > 2) continue;
    if (boat.capacity < requiredCapacity) continue;

    // Get price for this boat
    const candidatePricing = boat.pricing as Record<string, { prices?: Record<string, number> }> | null;
    const candidatePrice = candidatePricing?.[season]?.prices?.[durationKey];

    // Skip if duration not available for this boat
    if (!candidatePrice) continue;

    // Price within +/-30% of original
    if (originalPrice > 0) {
      const priceRatio = candidatePrice / originalPrice;
      if (priceRatio < 0.7 || priceRatio > 1.3) continue;
    }

    // Check actual availability
    const isAvailable = await storage.checkAvailability(boat.id, startDate, endDate);
    if (!isAvailable) continue;

    candidates.push({
      boat,
      price: candidatePrice,
      capacityDiff: Math.abs(boat.capacity - originalBoat.capacity),
      priceDiff: Math.abs(candidatePrice - originalPrice),
    });
  }

  // Sort: best capacity match first, then best price match
  candidates.sort((a, b) => {
    if (a.capacityDiff !== b.capacityDiff) return a.capacityDiff - b.capacityDiff;
    return a.priceDiff - b.priceDiff;
  });

  // Return top 3
  const top3 = candidates.slice(0, 3).map(c => ({
    id: c.boat.id,
    name: c.boat.name,
    capacity: c.boat.capacity,
    requires_license: c.boat.requiresLicense,
    price: c.price,
    deposit: c.boat.deposit,
    subtitle: c.boat.subtitle,
  }));

  return JSON.stringify({
    original_boat: originalBoat.name,
    date: dateStr,
    start_time: startTime,
    duration_hours: durationHours,
    season,
    total_alternatives: top3.length,
    alternatives: top3,
    message: top3.length > 0
      ? `El ${originalBoat.name} no esta disponible, pero tenemos ${top3.length} alternativa${top3.length > 1 ? 's' : ''} similar${top3.length > 1 ? 'es' : ''}`
      : `Lo siento, no hay alternativas similares disponibles el ${dateStr}. Contactanos al +34 611 500 372 para ayudarte.`,
  });
}

// Hold expiry duration for WhatsApp-initiated bookings (30 minutes)
const WHATSAPP_HOLD_MINUTES = 30;

interface CreateBookingLinkParams {
  boatId: string;
  dateStr: string;
  startTime: string;
  durationHours: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  numberOfPeople: number;
}

/**
 * Create a booking hold and Stripe Checkout Session, returning a payment link.
 * This closes the booking loop: customers can pay entirely from WhatsApp.
 */
async function createBookingLink(params: CreateBookingLinkParams): Promise<string> {
  const {
    boatId,
    dateStr,
    startTime,
    durationHours,
    customerName,
    customerPhone,
    customerEmail,
    numberOfPeople,
  } = params;

  // 1. Validate boat exists in DB
  const boat = await storage.getBoat(boatId);
  if (!boat) {
    return JSON.stringify({ success: false, error: "Barco no encontrado. Verifica el identificador del barco." });
  }

  // 2. Validate date is within operational season
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return JSON.stringify({ success: false, error: "Fecha invalida. Usa el formato YYYY-MM-DD." });
  }

  if (!isOperationalSeason(date)) {
    return JSON.stringify({
      success: false,
      error: "Esa fecha esta fuera de temporada. Operamos de abril a octubre.",
    });
  }

  // 3. Validate date is in the future
  const now = new Date();
  const bookingDay = new Date(dateStr);
  bookingDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDay < today) {
    return JSON.stringify({ success: false, error: "La fecha debe ser hoy o en el futuro." });
  }

  // 4. Validate duration
  const durationKey = `${durationHours}h` as Duration;
  if (!isValidDuration(durationKey)) {
    return JSON.stringify({
      success: false,
      error: `Duracion ${durationHours}h no valida. Duraciones disponibles: 1h, 2h, 3h, 4h, 6h, 8h.`,
    });
  }

  // 5. Validate number of people against boat capacity
  if (numberOfPeople < 1) {
    return JSON.stringify({ success: false, error: "El numero de personas debe ser al menos 1." });
  }
  if (numberOfPeople > boat.capacity) {
    return JSON.stringify({
      success: false,
      error: `El ${boat.name} tiene capacidad maxima de ${boat.capacity} personas. Has indicado ${numberOfPeople}.`,
    });
  }

  // 6. Parse start/end times
  const timeMatch = startTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) {
    return JSON.stringify({ success: false, error: "Hora de inicio invalida. Usa formato HH:MM." });
  }
  const [, startHourStr, startMinStr] = timeMatch;
  const startHour = parseInt(startHourStr, 10);
  const startMin = parseInt(startMinStr, 10);

  const startDate = new Date(date);
  startDate.setHours(startHour, startMin, 0, 0);
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + durationHours);

  // 7. Calculate pricing using the pricing engine
  let pricing;
  try {
    pricing = calculatePricingBreakdown(boatId, date, durationKey);
  } catch (pricingError: unknown) {
    const msg = pricingError instanceof Error ? pricingError.message : String(pricingError);
    logger.error("Pricing calculation failed for WhatsApp booking", { boatId, dateStr, durationKey, error: msg });
    return JSON.stringify({
      success: false,
      error: `No se pudo calcular el precio: ${msg}`,
    });
  }

  // 8. Atomically check availability and create hold booking
  const expiresAt = new Date(now.getTime() + WHATSAPP_HOLD_MINUTES * 60 * 1000);

  // Split customer name into first name / surname best-effort
  const nameParts = customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || customerName;
  const surname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "-";

  const result = await storage.checkAvailabilityAndCreateBooking(
    boatId,
    startDate,
    endDate,
    {
      boatId,
      bookingDate: date,
      startTime: startDate,
      endTime: endDate,
      customerName: firstName,
      customerSurname: surname,
      customerPhone,
      customerEmail: customerEmail || undefined,
      customerNationality: "N/A",
      numberOfPeople,
      totalHours: durationHours,
      subtotal: pricing.basePrice.toString(),
      extrasTotal: pricing.extrasPrice.toString(),
      deposit: pricing.deposit.toString(),
      totalAmount: pricing.total.toString(),
      bookingStatus: "hold",
      paymentStatus: "pending",
      source: "whatsapp",
      expiresAt,
      language: "es",
    },
  );

  if (!result.available) {
    const endTimeStr = `${endDate.getHours()}:${String(endDate.getMinutes()).padStart(2, "0")}`;
    return JSON.stringify({
      success: false,
      error: `Lo siento, el ${boat.name} ya no esta disponible el ${dateStr} de ${startTime} a ${endTimeStr}. Prueba con otro horario o fecha.`,
    });
  }

  const booking = result.booking;

  logger.info("WhatsApp booking hold created", {
    bookingId: booking.id,
    boatId,
    dateStr,
    startTime,
    durationHours,
    customerPhone,
    totalAmount: pricing.total,
  });

  // 9. Create Stripe Checkout Session
  // Service amount = subtotal (basePrice + extras). Deposit collected in cash at the port.
  const serviceAmount = pricing.subtotal;
  if (serviceAmount <= 0) {
    return JSON.stringify({
      success: false,
      error: "Error interno: importe de pago invalido.",
    });
  }

  const endTimeStr = `${endDate.getHours()}:${String(endDate.getMinutes()).padStart(2, "0")}`;
  let paymentUrl: string | null = null;

  try {
    const stripeInstance = getStripe();

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Reserva ${boat.name}`,
              description: `${dateStr} | ${startTime}-${endTimeStr} (${durationHours}h) | ${numberOfPeople} pers.`,
            },
            unit_amount: Math.round(serviceAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.APP_URL || "https://www.costabravarentaboat.com"}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${process.env.APP_URL || "https://www.costabravarentaboat.com"}/boats/${boatId}`,
      metadata: {
        bookingId: booking.id,
        boatId,
        customerPhone,
        source: "whatsapp",
      },
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    paymentUrl = session.url;

    // Store the Stripe session reference on the booking
    await storage.updateBooking(booking.id, {
      bookingStatus: "pending_payment",
      stripePaymentIntentId: session.id,
    });
  } catch (stripeError: unknown) {
    const msg = stripeError instanceof Error ? stripeError.message : String(stripeError);
    logger.error("Stripe Checkout Session creation failed for WhatsApp booking", {
      bookingId: booking.id,
      error: msg,
    });
    return JSON.stringify({
      success: false,
      booking_created: true,
      booking_id: booking.id,
      error: "No se pudo generar el enlace de pago. Contacta con nosotros al +34 611 500 372 para completar la reserva.",
    });
  }

  // 10. Return structured result for the AI to compose a natural message
  const season = getSeason(date);

  return JSON.stringify({
    success: true,
    booking_id: booking.id,
    booking_summary: {
      boat: boat.name,
      date: dateStr,
      time: `${startTime} - ${endTimeStr}`,
      duration: `${durationHours}h`,
      people: numberOfPeople,
      price: `${pricing.subtotal}EUR`,
      deposit: `${pricing.deposit}EUR (en efectivo en el puerto)`,
      season: getSeasonDisplayName(season),
    },
    payment_url: paymentUrl,
    expires_in: `${WHATSAPP_HOLD_MINUTES} minutos`,
    message: `Reserva creada para el ${boat.name} el ${dateStr} de ${startTime} a ${endTimeStr}. Precio: ${pricing.subtotal}EUR. Deposito: ${pricing.deposit}EUR (en efectivo). Enlace de pago valido ${WHATSAPP_HOLD_MINUTES} minutos.`,
  });
}

// Detect which boat the user is asking about
export function detectBoatFromMessage(message: string, boats: Boat[]): string | null {
  const lowerMessage = message.toLowerCase();
  
  for (const boat of boats) {
    const boatNameLower = boat.name.toLowerCase();
    const boatIdLower = boat.id.toLowerCase();
    
    if (lowerMessage.includes(boatNameLower) || lowerMessage.includes(boatIdLower)) {
      return boat.id;
    }
    
    // Check for partial matches
    const nameParts = boatNameLower.split(/[\s-]+/);
    for (const part of nameParts) {
      if (part.length > 3 && lowerMessage.includes(part)) {
        return boat.id;
      }
    }
  }
  
  return null;
}
