// Message Router - Routes messages to appropriate flow handlers
import type { ChatbotConversation, ChatbotState } from "@shared/schema";
import { CHATBOT_STATES } from "@shared/schema";
import { getTranslation, formatMessage, type SupportedLanguage } from "./translations";
import { updateState, updateBookingData, clearBookingData } from "./sessionManager";
import { isNumberSelection, parseDate, parseEmail, parseNumber, parseMultipleSelections } from "./intentDetector";
import type { Intent } from "./intentDetector";

// Import flow handlers
import { handleListBoats, handleBoatDetail, handleShowPrices } from "./flows/boatInfo";
import { handleCheckAvailability, handleSelectBoatForCheck, handleShowAvailability } from "./flows/availability";
import {
  handleStartBooking,
  handleBookingDate,
  handleBookingBoat,
  handleBookingTime,
  handleBookingDuration,
  handleBookingPeople,
  handleBookingExtras,
  handleBookingContactName,
  handleBookingContactEmail,
  handleBookingConfirm,
  createBookingFromSession,
} from "./flows/booking";
import { sendWhatsAppMessage, isTwilioConfigured } from "./twilioClient";
import { BOAT_DATA } from "@shared/boatData";
import { handleMainMenu } from "./flows/mainMenu";

/**
 * Process a message based on current state and detected intent
 */
export async function processMessage(
  session: ChatbotConversation,
  message: string,
  intent: Intent
): Promise<string> {
  const t = getTranslation(session.language as SupportedLanguage);
  const state = session.currentState as ChatbotState;

  console.log(`[Router] Processing: state=${state}, intent=${intent}, message="${message.substring(0, 50)}..."`);

  // Handle based on current state
  switch (state) {
    case CHATBOT_STATES.WELCOME:
    case CHATBOT_STATES.MAIN_MENU:
      return handleMainMenuState(session, message, intent, t);

    case CHATBOT_STATES.LIST_BOATS:
      return handleListBoatsState(session, message, t);

    case CHATBOT_STATES.BOAT_DETAIL:
      return handleBoatDetailState(session, message, intent, t);

    case CHATBOT_STATES.SHOW_PRICES:
      return handleShowPricesState(session, message, intent, t);

    case CHATBOT_STATES.CHECK_AVAILABILITY:
      return handleCheckAvailabilityState(session, message, t);

    case CHATBOT_STATES.SELECT_BOAT_FOR_CHECK:
      return handleSelectBoatForCheckState(session, message, t);

    case CHATBOT_STATES.SHOW_AVAILABILITY:
      return handleShowAvailabilityState(session, message, intent, t);

    case CHATBOT_STATES.START_BOOKING:
    case CHATBOT_STATES.BOOKING_DATE:
      return handleBookingDateState(session, message, t);

    case CHATBOT_STATES.BOOKING_BOAT:
      return handleBookingBoatState(session, message, t);

    case CHATBOT_STATES.BOOKING_TIME:
      return handleBookingTimeState(session, message, t);

    case CHATBOT_STATES.BOOKING_DURATION:
      return handleBookingDurationState(session, message, t);

    case CHATBOT_STATES.BOOKING_PEOPLE:
      return handleBookingPeopleState(session, message, t);

    case CHATBOT_STATES.BOOKING_EXTRAS:
      return handleBookingExtrasState(session, message, t);

    case CHATBOT_STATES.BOOKING_CONTACT_NAME:
      return handleBookingContactNameState(session, message, t);

    case CHATBOT_STATES.BOOKING_CONTACT_EMAIL:
      return handleBookingContactEmailState(session, message, t);

    case CHATBOT_STATES.BOOKING_CONFIRM:
      return handleBookingConfirmState(session, message, t);

    case CHATBOT_STATES.AGENT_HANDOFF:
      return handleAgentHandoffState(session, message, t);

    default:
      // Unknown state, return to main menu
      await updateState(session.phoneNumber, CHATBOT_STATES.MAIN_MENU);
      return handleMainMenu(t);
  }
}

// ===== STATE HANDLERS =====

async function handleMainMenuState(
  session: ChatbotConversation,
  message: string,
  intent: Intent,
  t: any
): Promise<string> {
  const num = isNumberSelection(message);

  // Handle number selection from menu
  if (num !== null) {
    switch (num) {
      case 1: // List boats
        await updateState(session.phoneNumber, CHATBOT_STATES.LIST_BOATS);
        return handleListBoats(t);

      case 2: // Check availability
        await updateState(session.phoneNumber, CHATBOT_STATES.CHECK_AVAILABILITY);
        return handleCheckAvailability(t);

      case 3: // Show prices
        await updateState(session.phoneNumber, CHATBOT_STATES.SHOW_PRICES);
        return handleShowPrices(t, null);

      case 4: // Start booking
        await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_DATE);
        return handleStartBooking(t);

      case 5: // Agent handoff
        await updateState(session.phoneNumber, CHATBOT_STATES.AGENT_HANDOFF);
        return t.agentHandoff;
    }
  }

  // Handle intent-based navigation
  switch (intent) {
    case "list_boats":
      await updateState(session.phoneNumber, CHATBOT_STATES.LIST_BOATS);
      return handleListBoats(t);

    case "check_availability":
      await updateState(session.phoneNumber, CHATBOT_STATES.CHECK_AVAILABILITY);
      return handleCheckAvailability(t);

    case "prices":
      await updateState(session.phoneNumber, CHATBOT_STATES.SHOW_PRICES);
      return handleShowPrices(t, null);

    case "booking":
      await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_DATE);
      return handleStartBooking(t);

    case "agent":
      await updateState(session.phoneNumber, CHATBOT_STATES.AGENT_HANDOFF);
      return t.agentHandoff;

    case "greeting":
      return handleMainMenu(t);

    default:
      // Unknown intent, show menu again
      return `${t.unknownCommand}\n\n${handleMainMenu(t)}`;
  }
}

async function handleListBoatsState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const num = isNumberSelection(message);

  if (num !== null && num >= 1 && num <= 7) {
    // User selected a boat
    await updateState(session.phoneNumber, CHATBOT_STATES.BOAT_DETAIL);
    await updateBookingData(session.phoneNumber, { selectedBoatId: getBoatIdByNumber(num) });
    return handleBoatDetail(t, getBoatIdByNumber(num));
  }

  return `${t.invalidOption}\n\n${handleListBoats(t)}`;
}

async function handleBoatDetailState(
  session: ChatbotConversation,
  message: string,
  intent: Intent,
  t: any
): Promise<string> {
  const num = isNumberSelection(message);

  // Options after viewing boat detail
  if (num === 1 || intent === "booking") {
    // Book this boat
    await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_DATE);
    return handleStartBooking(t);
  }

  if (num === 2 || intent === "prices") {
    // View prices for this boat
    return handleShowPrices(t, session.selectedBoatId);
  }

  if (num === 3 || intent === "list_boats") {
    // Back to boat list
    await updateState(session.phoneNumber, CHATBOT_STATES.LIST_BOATS);
    return handleListBoats(t);
  }

  return `${t.invalidOption}\n\n1️⃣ Reservar\n2️⃣ Ver precios\n3️⃣ Volver a la flota`;
}

async function handleShowPricesState(
  session: ChatbotConversation,
  message: string,
  intent: Intent,
  t: any
): Promise<string> {
  const num = isNumberSelection(message);

  if (num !== null && num >= 1 && num <= 7) {
    // User selected a boat to see prices
    return handleShowPrices(t, getBoatIdByNumber(num));
  }

  if (intent === "booking") {
    await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_DATE);
    return handleStartBooking(t);
  }

  if (intent === "list_boats") {
    await updateState(session.phoneNumber, CHATBOT_STATES.LIST_BOATS);
    return handleListBoats(t);
  }

  // Show boat list with prices
  return handleShowPrices(t, null);
}

async function handleCheckAvailabilityState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const date = parseDate(message);

  if (date) {
    await updateState(session.phoneNumber, CHATBOT_STATES.SELECT_BOAT_FOR_CHECK, {
      context: { availabilityDate: date.toISOString() },
    });
    return handleSelectBoatForCheck(t, date);
  }

  return t.invalidDateFormat;
}

async function handleSelectBoatForCheckState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const num = isNumberSelection(message);
  const context = session.context as any;
  const date = context?.availabilityDate ? new Date(context.availabilityDate) : null;

  if (num !== null && num >= 1 && num <= 7 && date) {
    const boatId = getBoatIdByNumber(num);
    await updateState(session.phoneNumber, CHATBOT_STATES.SHOW_AVAILABILITY);
    await updateBookingData(session.phoneNumber, { selectedBoatId: boatId, selectedDate: date });
    return handleShowAvailability(t, boatId, date);
  }

  return `${t.invalidOption}${t.backToMenu}`;
}

async function handleShowAvailabilityState(
  session: ChatbotConversation,
  message: string,
  intent: Intent,
  t: any
): Promise<string> {
  if (intent === "booking" || isNumberSelection(message) === 1) {
    // Start booking with pre-selected boat and date
    await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_TIME);
    return t.bookingTimePrompt;
  }

  await updateState(session.phoneNumber, CHATBOT_STATES.MAIN_MENU);
  return handleMainMenu(t);
}

async function handleBookingDateState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const date = parseDate(message);

  if (date) {
    await updateBookingData(session.phoneNumber, { selectedDate: date });
    await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_BOAT);
    return handleBookingBoat(t, date);
  }

  return t.invalidDateFormat;
}

async function handleBookingBoatState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const num = isNumberSelection(message);

  if (num !== null && num >= 1 && num <= 7) {
    const boatId = getBoatIdByNumber(num);
    await updateBookingData(session.phoneNumber, { selectedBoatId: boatId });
    await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_TIME);
    return t.bookingTimePrompt;
  }

  return `${t.invalidOption}`;
}

async function handleBookingTimeState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const num = isNumberSelection(message);
  const times = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

  if (num !== null && num >= 1 && num <= 7) {
    const startTime = times[num - 1];
    await updateBookingData(session.phoneNumber, { selectedStartTime: startTime });
    await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_DURATION);
    return handleBookingDuration(t, session.selectedBoatId || "");
  }

  return `${t.invalidOption}\n\n${t.bookingTimePrompt}`;
}

async function handleBookingDurationState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const num = isNumberSelection(message);
  const durations = ["1h", "2h", "3h", "4h", "6h", "8h"];

  if (num !== null && num >= 1 && num <= 6) {
    const duration = durations[num - 1];
    await updateBookingData(session.phoneNumber, { selectedDuration: duration });
    await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_PEOPLE);
    return handleBookingPeople(t, session.selectedBoatId || "");
  }

  return `${t.invalidOption}\n\n${t.bookingDurationPrompt}`;
}

async function handleBookingPeopleState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const num = parseNumber(message);

  if (num !== null && num >= 1 && num <= 10) {
    // TODO: Validate against boat capacity
    await updateBookingData(session.phoneNumber, { numberOfPeople: num });
    await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_EXTRAS);
    return handleBookingExtras(t);
  }

  return t.invalidPeopleCount;
}

async function handleBookingExtrasState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const selections = parseMultipleSelections(message);
  const extraNames = ["Parking", "Nevera", "Snorkel", "Paddle Surf", "Seascooter"];

  // 0 means no extras
  if (message.trim() === "0") {
    await updateBookingData(session.phoneNumber, { selectedExtras: [] });
  } else if (selections.length > 0) {
    const selectedExtras = selections
      .filter((n) => n >= 1 && n <= 5)
      .map((n) => extraNames[n - 1]);
    await updateBookingData(session.phoneNumber, { selectedExtras });
  }

  await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_CONTACT_NAME);
  return handleBookingContactName(t);
}

async function handleBookingContactNameState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const name = message.trim();

  if (name.length >= 2) {
    await updateBookingData(session.phoneNumber, { customerName: name });
    await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_CONTACT_EMAIL);
    return handleBookingContactEmail(t);
  }

  return `${t.invalidOption}\n\n${t.bookingContactNamePrompt}`;
}

async function handleBookingContactEmailState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const email = parseEmail(message);

  if (email) {
    await updateBookingData(session.phoneNumber, { customerEmail: email });
    await updateState(session.phoneNumber, CHATBOT_STATES.BOOKING_CONFIRM);
    // Get fresh session with all booking data
    const updatedSession = await require("./sessionManager").getSession(session.phoneNumber);
    return handleBookingConfirm(t, updatedSession);
  }

  return `${t.invalidOption}\n\n${t.bookingContactEmailPrompt}`;
}

async function handleBookingConfirmState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  const num = isNumberSelection(message);

  if (num === 1) {
    // Confirm booking - create the booking in the database
    const result = await createBookingFromSession(session);

    if (result.success && result.bookingId) {
      // Build owner notification message with booking details
      const boat = BOAT_DATA[session.selectedBoatId || ""];
      const boatName = boat ? boat.name : session.selectedBoatId || "Unknown";
      const date = session.selectedDate ? new Date(session.selectedDate) : new Date();
      const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
      const startTime = session.selectedStartTime || "10:00";
      const duration = session.selectedDuration || "2h";
      const durationHours = parseInt(duration) || 2;
      const [startHour, startMin] = startTime.split(":").map(Number);
      const endHour = startHour + durationHours;
      const endTime = `${endHour.toString().padStart(2, "0")}:${startMin.toString().padStart(2, "0")}`;

      const ownerNotification =
        `*Nueva reserva via WhatsApp*\n\n` +
        `Booking ID: ${result.bookingId}\n` +
        `Cliente: ${session.customerName || "N/A"}\n` +
        `Telefono: ${session.phoneNumber}\n` +
        `Barco: ${boatName}\n` +
        `Fecha: ${dateStr}\n` +
        `Hora: ${startTime} - ${endTime}\n` +
        `Duracion: ${duration}\n` +
        `Personas: ${session.numberOfPeople || 1}\n` +
        `Extras: ${session.selectedExtras?.length ? session.selectedExtras.join(", ") : "Ninguno"}`;

      // Send WhatsApp notification to Ivan (owner) - non-blocking
      if (isTwilioConfigured()) {
        try {
          await sendWhatsAppMessage("+34611500372", ownerNotification);
          console.log(`[Booking] Owner notified for booking ${result.bookingId}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[Booking] Failed to notify owner for booking ${result.bookingId}:`, errorMessage);
        }
      }

      // Transition to main menu and respond with success
      await clearBookingData(session.phoneNumber);
      await updateState(session.phoneNumber, CHATBOT_STATES.MAIN_MENU);
      return `${t.bookingCreated}\n\n${t.bookingNotification}\n\n${handleMainMenu(t)}`;
    } else {
      // Booking creation failed
      await clearBookingData(session.phoneNumber);
      await updateState(session.phoneNumber, CHATBOT_STATES.MAIN_MENU);
      return `${t.bookingFailed}\n\n${handleMainMenu(t)}`;
    }
  }

  if (num === 2) {
    // Cancel
    await clearBookingData(session.phoneNumber);
    await updateState(session.phoneNumber, CHATBOT_STATES.MAIN_MENU);
    return `${t.goodbye}\n\n${handleMainMenu(t)}`;
  }

  return t.bookingConfirmPrompt;
}

async function handleAgentHandoffState(
  session: ChatbotConversation,
  message: string,
  t: any
): Promise<string> {
  // In agent handoff state, messages are forwarded to admin
  // For now, just acknowledge
  return t.agentNotified;
}

// ===== HELPERS =====

const BOAT_IDS = [
  "solar-450",
  "remus-450",
  "astec-400",
  "astec-480",
  "remus-450-ii",
  "mingolla-brava-19",
  "trimarchi-57s",
  "pacific-craft-625",
];

function getBoatIdByNumber(num: number): string {
  return BOAT_IDS[num - 1] || BOAT_IDS[0];
}
