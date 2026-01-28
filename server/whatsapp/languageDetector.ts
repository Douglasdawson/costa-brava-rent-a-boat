// Language Detection by Phone Prefix
// Detects user's language based on their phone number country code

// Country code to language mapping
const PHONE_PREFIX_TO_LANGUAGE: Record<string, string> = {
  // Spanish-speaking countries
  "34": "es",   // Spain
  "52": "es",   // Mexico
  "54": "es",   // Argentina
  "56": "es",   // Chile
  "57": "es",   // Colombia
  "51": "es",   // Peru
  
  // Catalan (Spain, Andorra)
  "376": "ca",  // Andorra
  
  // French-speaking countries
  "33": "fr",   // France
  "32": "fr",   // Belgium (default to French)
  "41": "fr",   // Switzerland (default to French)
  "377": "fr",  // Monaco
  
  // German-speaking countries
  "49": "de",   // Germany
  "43": "de",   // Austria
  
  // Dutch-speaking countries
  "31": "nl",   // Netherlands
  
  // Italian-speaking countries
  "39": "it",   // Italy
  
  // English-speaking countries
  "44": "en",   // United Kingdom
  "1": "en",    // USA, Canada
  "353": "en",  // Ireland
  "61": "en",   // Australia
  
  // Russian-speaking countries
  "7": "ru",    // Russia
  "375": "ru",  // Belarus
  "380": "ru",  // Ukraine (default to Russian for tourists)
  
  // Nordic (default to English as many speak it well)
  "45": "en",   // Denmark
  "46": "en",   // Sweden
  "47": "en",   // Norway
  "358": "en",  // Finland
  
  // Portuguese (default to Spanish - similar)
  "351": "es",  // Portugal
  "55": "es",   // Brazil
};

// Sorted prefixes by length (longest first) for accurate matching
const SORTED_PREFIXES = Object.keys(PHONE_PREFIX_TO_LANGUAGE)
  .sort((a, b) => b.length - a.length);

/**
 * Detect language from phone number prefix
 * @param phoneNumber - Full phone number in format whatsapp:+XXXXX or +XXXXX
 * @returns Language code (es, en, fr, de, nl, it, ru, ca) or 'es' as default
 */
export function detectLanguageFromPhone(phoneNumber: string): string {
  // Clean the phone number - remove whatsapp: prefix and +
  let cleaned = phoneNumber.replace(/^whatsapp:/, "").replace(/^\+/, "").trim();
  
  // Try to match prefixes (longest first)
  for (const prefix of SORTED_PREFIXES) {
    if (cleaned.startsWith(prefix)) {
      return PHONE_PREFIX_TO_LANGUAGE[prefix];
    }
  }
  
  // Default to Spanish (most common for Costa Brava)
  return "es";
}

// Welcome messages in each language (with emoji)
export const WELCOME_MESSAGES: Record<string, string> = {
  es: "👋 ¡Hola! Soy el asistente de Costa Brava Rent a Boat en Blanes. ¿En qué puedo ayudarte?",
  en: "👋 Hello! I'm the assistant for Costa Brava Rent a Boat in Blanes. How can I help you?",
  fr: "👋 Bonjour! Je suis l'assistant de Costa Brava Rent a Boat à Blanes. Comment puis-je vous aider?",
  de: "👋 Hallo! Ich bin der Assistent von Costa Brava Rent a Boat in Blanes. Wie kann ich Ihnen helfen?",
  nl: "👋 Hallo! Ik ben de assistent van Costa Brava Rent a Boat in Blanes. Hoe kan ik u helpen?",
  it: "👋 Ciao! Sono l'assistente di Costa Brava Rent a Boat a Blanes. Come posso aiutarti?",
  ru: "👋 Привет! Я ассистент Costa Brava Rent a Boat в Бланесе. Чем могу помочь?",
  ca: "👋 Hola! Soc l'assistent de Costa Brava Rent a Boat a Blanes. En què puc ajudar-te?",
};

/**
 * Get welcome message for a language
 * @param language - Language code
 * @returns Welcome message with emoji
 */
export function getWelcomeMessage(language: string): string {
  return WELCOME_MESSAGES[language] || WELCOME_MESSAGES.es;
}

/**
 * Check if this is likely a first message (greeting)
 * @param message - User message
 * @returns true if it looks like a greeting
 */
export function isGreeting(message: string): boolean {
  const greetings = [
    // Spanish
    "hola", "buenos dias", "buenas tardes", "buenas noches", "buenas", "hey",
    // English
    "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
    // French
    "bonjour", "salut", "bonsoir",
    // German
    "hallo", "guten tag", "guten morgen",
    // Dutch
    "hallo", "hoi", "goedemorgen",
    // Italian
    "ciao", "buongiorno", "buonasera",
    // Russian
    "привет", "здравствуйте", "добрый день",
    // Catalan
    "hola", "bon dia", "bona tarda",
  ];
  
  const lowerMessage = message.toLowerCase().trim();
  return greetings.some(g => lowerMessage.includes(g) || lowerMessage === g);
}
