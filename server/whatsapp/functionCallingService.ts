// Function Calling Service - AI can query availability, prices, and create drafts
import OpenAI from "openai";
import { storage } from "../storage";
import type { Boat } from "@shared/schema";
import { getSeason, isOperationalSeason, getSeasonDisplayName, type Season } from "@shared/pricing";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
];

// Execute a function call
export async function executeFunction(
  name: string,
  args: Record<string, any>
): Promise<string> {
  try {
    switch (name) {
      case "get_boat_availability":
        return await checkBoatAvailability(args.boat_id, args.date, args.start_time, args.duration_hours);
      
      case "get_price_for_date":
        return await getPriceForDate(args.boat_id, args.date, args.duration_hours);
      
      case "list_available_boats":
        return await listAvailableBoats(args.date, args.capacity_min, args.requires_license);
      
      case "get_boat_details":
        return await getBoatDetails(args.boat_id);
      
      default:
        return JSON.stringify({ error: "Unknown function" });
    }
  } catch (error: any) {
    console.error(`[Functions] Error executing ${name}:`, error.message);
    return JSON.stringify({ error: error.message });
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
  const pricing = boat.pricing as any;

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
      const pricing = boat.pricing as any;
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

  const specs = boat.specifications as any;
  const pricing = boat.pricing as any;

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
      baja: pricing?.BAJA?.prices,
      media: pricing?.MEDIA?.prices,
      alta: pricing?.ALTA?.prices,
    },
    image_url: boat.imageUrl,
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
