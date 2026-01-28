// Hybrid Intent Detector - Buttons + Keyword Detection
import type { SupportedLanguage } from "./translations";

export type Intent =
  | "list_boats"
  | "check_availability"
  | "prices"
  | "booking"
  | "agent"
  | "greeting"
  | "thanks"
  | "cancel"
  | "confirm"
  | "menu"
  | "unknown";

// Keywords for each intent in all supported languages
const INTENT_KEYWORDS: Record<SupportedLanguage, Record<Intent, string[]>> = {
  es: {
    list_boats: [
      "barcos",
      "barco",
      "flota",
      "ver barcos",
      "qué barcos",
      "embarcaciones",
      "embarcación",
      "vuestros barcos",
      "los barcos",
    ],
    check_availability: [
      "disponibilidad",
      "disponible",
      "libre",
      "hay hueco",
      "puedo reservar",
      "está libre",
      "tienen disponible",
      "hay sitio",
      "ocupado",
    ],
    prices: [
      "precio",
      "precios",
      "cuánto cuesta",
      "cuanto cuesta",
      "tarifas",
      "coste",
      "cuánto vale",
      "cuanto vale",
      "tarifa",
      "costar",
    ],
    booking: [
      "reservar",
      "reserva",
      "quiero reservar",
      "hacer reserva",
      "alquilar",
      "alquiler",
      "contratar",
      "quiero alquilar",
    ],
    agent: [
      "agente",
      "humano",
      "persona",
      "hablar con",
      "ayuda",
      "problema",
      "atención",
      "llamar",
      "teléfono",
      "contacto",
    ],
    greeting: [
      "hola",
      "buenos días",
      "buenas tardes",
      "buenas noches",
      "hey",
      "hi",
      "hello",
      "buenas",
      "qué tal",
      "saludos",
    ],
    thanks: [
      "gracias",
      "perfecto",
      "genial",
      "ok",
      "vale",
      "de acuerdo",
      "muchas gracias",
      "estupendo",
      "excelente",
    ],
    cancel: [
      "cancelar",
      "salir",
      "volver",
      "atrás",
      "no quiero",
      "dejarlo",
      "olvidalo",
      "nada",
    ],
    confirm: ["sí", "si", "confirmar", "confirmo", "acepto", "adelante", "claro"],
    menu: ["menú", "menu", "inicio", "empezar", "principal", "opciones"],
    unknown: [],
  },

  en: {
    list_boats: [
      "boats",
      "boat",
      "fleet",
      "see boats",
      "what boats",
      "vessels",
      "your boats",
      "the boats",
      "show boats",
    ],
    check_availability: [
      "availability",
      "available",
      "free",
      "can i book",
      "is it free",
      "open",
      "slot",
      "check availability",
    ],
    prices: [
      "price",
      "prices",
      "how much",
      "rates",
      "cost",
      "pricing",
      "tariff",
      "fare",
      "what does it cost",
    ],
    booking: [
      "book",
      "reserve",
      "reservation",
      "rent",
      "hire",
      "make a booking",
      "i want to book",
      "rental",
    ],
    agent: [
      "agent",
      "human",
      "person",
      "talk",
      "help",
      "problem",
      "support",
      "call",
      "phone",
      "contact",
    ],
    greeting: [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "howdy",
      "greetings",
    ],
    thanks: [
      "thanks",
      "thank you",
      "perfect",
      "great",
      "ok",
      "okay",
      "awesome",
      "wonderful",
      "excellent",
    ],
    cancel: ["cancel", "exit", "back", "return", "quit", "stop", "nevermind", "nothing"],
    confirm: ["yes", "confirm", "confirmed", "accept", "proceed", "sure", "yep", "yeah"],
    menu: ["menu", "start", "main", "home", "options", "beginning"],
    unknown: [],
  },

  fr: {
    list_boats: [
      "bateaux",
      "bateau",
      "flotte",
      "voir bateaux",
      "quels bateaux",
      "embarcations",
      "vos bateaux",
    ],
    check_availability: [
      "disponibilité",
      "disponible",
      "libre",
      "puis-je réserver",
      "est-ce libre",
      "place",
    ],
    prices: [
      "prix",
      "tarifs",
      "combien",
      "coût",
      "tarif",
      "combien ça coûte",
      "cher",
    ],
    booking: [
      "réserver",
      "réservation",
      "louer",
      "location",
      "je veux réserver",
      "faire une réservation",
    ],
    agent: [
      "agent",
      "humain",
      "personne",
      "parler",
      "aide",
      "problème",
      "appeler",
      "téléphone",
      "contact",
    ],
    greeting: [
      "bonjour",
      "salut",
      "bonsoir",
      "coucou",
      "hello",
      "hi",
    ],
    thanks: [
      "merci",
      "parfait",
      "super",
      "ok",
      "d'accord",
      "génial",
      "excellent",
    ],
    cancel: ["annuler", "sortir", "retour", "quitter", "arrêter", "rien"],
    confirm: ["oui", "confirmer", "confirme", "accepte", "d'accord"],
    menu: ["menu", "début", "principal", "accueil", "options"],
    unknown: [],
  },

  ca: {
    list_boats: [
      "vaixells",
      "vaixell",
      "flota",
      "veure vaixells",
      "quins vaixells",
      "embarcacions",
      "els vostres vaixells",
    ],
    check_availability: [
      "disponibilitat",
      "disponible",
      "lliure",
      "puc reservar",
      "està lliure",
      "hi ha lloc",
    ],
    prices: [
      "preu",
      "preus",
      "quant costa",
      "tarifes",
      "cost",
      "quant val",
    ],
    booking: [
      "reservar",
      "reserva",
      "vull reservar",
      "fer reserva",
      "llogar",
      "lloguer",
    ],
    agent: [
      "agent",
      "humà",
      "persona",
      "parlar",
      "ajuda",
      "problema",
      "trucar",
      "telèfon",
      "contacte",
    ],
    greeting: [
      "hola",
      "bon dia",
      "bona tarda",
      "bona nit",
      "ei",
      "hey",
    ],
    thanks: [
      "gràcies",
      "perfecte",
      "genial",
      "ok",
      "d'acord",
      "excel·lent",
    ],
    cancel: ["cancel·lar", "sortir", "tornar", "enrere", "deixar-ho", "res"],
    confirm: ["sí", "si", "confirmar", "confirmo", "accepto"],
    menu: ["menú", "menu", "inici", "començar", "principal", "opcions"],
    unknown: [],
  },
};

// Menu option mappings (number -> intent)
const MENU_OPTIONS: Record<string, Intent> = {
  "1": "list_boats",
  "2": "check_availability",
  "3": "prices",
  "4": "booking",
  "5": "agent",
};

/**
 * Detect intent from user message using hybrid approach:
 * 1. Check if message is a menu number (1-5)
 * 2. Check for keyword matches
 * 3. Return 'unknown' if no match
 */
export function detectIntent(
  message: string,
  language: SupportedLanguage = "es"
): Intent {
  const normalizedMsg = message.toLowerCase().trim();

  // 1. Check for menu number selection
  if (MENU_OPTIONS[normalizedMsg]) {
    return MENU_OPTIONS[normalizedMsg];
  }

  // 2. Check for menu/cancel keywords first (these override other intents)
  const keywords = INTENT_KEYWORDS[language] || INTENT_KEYWORDS.es;

  if (keywords.menu.some((kw) => normalizedMsg.includes(kw))) {
    return "menu";
  }

  if (keywords.cancel.some((kw) => normalizedMsg.includes(kw))) {
    return "cancel";
  }

  // 3. Check for confirmation
  if (keywords.confirm.some((kw) => normalizedMsg === kw || normalizedMsg.startsWith(kw + " "))) {
    return "confirm";
  }

  // 4. Check other intents by keyword matching
  const intentPriority: Intent[] = [
    "booking",
    "check_availability",
    "list_boats",
    "prices",
    "agent",
    "greeting",
    "thanks",
  ];

  for (const intent of intentPriority) {
    if (keywords[intent].some((kw) => normalizedMsg.includes(kw))) {
      return intent;
    }
  }

  // 5. No match found
  return "unknown";
}

/**
 * Detect language from user message
 * Returns the most likely language based on greeting patterns
 */
export function detectLanguage(message: string): SupportedLanguage {
  const normalizedMsg = message.toLowerCase().trim();

  // French-specific patterns
  if (
    normalizedMsg.includes("bonjour") ||
    normalizedMsg.includes("salut") ||
    normalizedMsg.includes("bonsoir") ||
    normalizedMsg.includes("je veux") ||
    normalizedMsg.includes("s'il vous")
  ) {
    return "fr";
  }

  // English-specific patterns
  if (
    normalizedMsg.includes("hello") ||
    normalizedMsg.includes("good morning") ||
    normalizedMsg.includes("i want") ||
    normalizedMsg.includes("please") ||
    normalizedMsg.includes("thank you")
  ) {
    return "en";
  }

  // Catalan-specific patterns
  if (
    normalizedMsg.includes("bon dia") ||
    normalizedMsg.includes("bona tarda") ||
    normalizedMsg.includes("vull") ||
    normalizedMsg.includes("si us plau") ||
    normalizedMsg.includes("gràcies")
  ) {
    return "ca";
  }

  // Default to Spanish
  return "es";
}

/**
 * Check if a message is a simple number selection (1-9)
 */
export function isNumberSelection(message: string): number | null {
  const trimmed = message.trim();
  if (/^[1-9]$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  return null;
}

/**
 * Parse multiple selections (e.g., "1,3,4" for extras)
 */
export function parseMultipleSelections(message: string): number[] {
  const trimmed = message.trim();
  const matches = trimmed.match(/\d+/g);
  if (matches) {
    return matches.map((m) => parseInt(m, 10)).filter((n) => n >= 0 && n <= 9);
  }
  return [];
}

/**
 * Parse date from message (DD/MM/YYYY format)
 */
export function parseDate(message: string): Date | null {
  const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/;
  const match = message.match(dateRegex);

  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(match[3], 10);

    const date = new Date(year, month, day);

    // Validate the date is real
    if (
      date.getDate() === day &&
      date.getMonth() === month &&
      date.getFullYear() === year
    ) {
      return date;
    }
  }

  return null;
}

/**
 * Parse email from message
 */
export function parseEmail(message: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = message.match(emailRegex);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Parse a number from message (for people count, etc.)
 */
export function parseNumber(message: string): number | null {
  const trimmed = message.trim();
  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
}
