// AI Service for WhatsApp Chatbot - Enhanced with RAG, Memory, and Function Calling
import OpenAI from "openai";
import { storage } from "../storage";
import type { Boat } from "@shared/schema";
import { getRAGContext, hasKnowledgeEntries } from "./ragService";
import { 
  getOrCreateSession, 
  saveMessage, 
  updateLeadScore, 
  calculateIntentScore 
} from "./chatMemoryService";
import { 
  AVAILABLE_FUNCTIONS, 
  executeFunction, 
  detectBoatFromMessage 
} from "./functionCallingService";
import { logger } from "../lib/logger";
import { openaiBreaker } from "../lib/circuitBreaker";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Business context for the AI
const BUSINESS_CONTEXT = `
Eres el asistente virtual de Costa Brava Rent a Boat, empresa de alquiler de barcos ubicada en Blanes, Costa Brava, Espana.

INFORMACION DEL NEGOCIO:
- Ubicacion: Puerto de Blanes, Costa Brava, Espana
- Telefono: +34 611 500 372
- Email: costabravarentaboat@gmail.com
- Web: costabravarentaboat.com
- Temporada: Abril a Octubre

SERVICIOS:
- Alquiler de barcos SIN licencia (no se requiere titulacion nautica)
- Alquiler de barcos CON licencia
- Duraciones: desde 2 horas hasta dia completo
- Excursiones por la Costa Brava: Tossa de Mar, Lloret de Mar, calas escondidas

TEMPORADAS DE PRECIOS:
- BAJA: Abril, Mayo, Junio, Septiembre, Octubre (precios mas economicos)
- MEDIA: Julio (precios intermedios)
- ALTA: Agosto (temporada alta, precios maximos)

NORMAS IMPORTANTES:
- Deposito requerido (se devuelve al entregar el barco en buen estado)
- Combustible incluido en algunos barcos
- Se proporciona equipo de seguridad
- Briefing de seguridad antes de salir

ZONAS DE NAVEGACION:
- Blanes y alrededores
- Calas virgenes de la Costa Brava
- Tossa de Mar (costa)
- Lloret de Mar (costa)

Tu objetivo es:
1. Responder preguntas sobre barcos, precios y disponibilidad
2. Ayudar a los clientes a elegir el barco adecuado
3. Proporcionar informacion util sobre la experiencia
4. Cuando el cliente quiera reservar, dirigirlo al WhatsApp (+34 611 500 372) o web para reservar

IDIOMA: Responde SIEMPRE en el idioma indicado en IDIOMA_USUARIO. Si dice "es" responde en espanol, si dice "en" en ingles, "fr" frances, "de" aleman, "nl" holandes, "it" italiano, "ru" ruso, "ca" catalan.

Se amable, profesional y entusiasta sobre la experiencia nautica.
Si no sabes algo especifico, sugiere contactar directamente por WhatsApp o email.
`;

// Premium product: private skipper-led excursion (source of truth: shared/boatData.ts "excursion-privada").
// The AI should propose this product when the customer matches premium profile signals
// (special occasion, no nautical experience, large family group, corporate).
const PRIVATE_EXCURSION_CONTEXT = `
PRODUCTO PREMIUM "EXCURSION PRIVADA CON CAPITAN" (Pacific Craft 625, hasta 7 personas):
Duraciones disponibles y precios por temporada:
- 2h: 240EUR (BAJA) | 260EUR (MEDIA-Julio) | 280EUR (ALTA-Agosto)
- 3h: 320EUR (BAJA) | 340EUR (MEDIA) | 360EUR (ALTA)
- 4h: 380EUR (BAJA) | 400EUR (MEDIA) | 420EUR (ALTA)

Incluye: patron profesional, amarre, limpieza, seguro embarcacion y ocupantes, IVA.
NO incluye: combustible (lo paga el cliente), extras (snorkel, paddle, bebidas).
Capacidad: hasta 7 personas.
Fianza: 500EUR.

CUANDO PROPONER EXCURSION PRIVADA (en lugar de alquiler por horas):
1. Cliente menciona ocasion especial (aniversario, cumpleanos, luna de miel, pedida mano, jubilacion)
2. Cliente sin experiencia nautica ("nunca he llevado un barco", "primera vez navegando", "no tengo licencia")
3. Cliente menciona busqueda premium o VIP ("algo especial", "sorprender")
4. Grupo grande (hasta 7) con perfil familiar o niños pequeños
5. Cliente corporativo o team-building

CUANDO NO PROPONER (mantener flow estandar):
- Cliente tiene licencia PER o menciona experiencia nautica previa
- Cliente busca alquiler corto de 1h en barco sin licencia
- Cliente pregunta explicitamente por precio minimo por hora
- Cliente local (vive en Blanes/Lloret) suele preferir alquiler simple

OBJECION "ES CARO" (la mas comun):
- Validar la preocupacion sin bajar el precio
- Reframe: dividir por persona (380EUR / 7 personas = 54EUR por persona por 4h)
- Comparar con excursion guiada publica agrupada en barco con 40 desconocidos
- Destacar la exclusividad: calas escondidas, ruta curada segun viento del dia, patron dedicado
- Ofrecer alternativa sin-licencia desde 75EUR/h sin presionar

IMPORTANTE: Si el usuario muestra perfil premium, propone la Excursion Privada ANTES del alquiler por horas. La Excursion Privada es el producto diferenciador de Costa Brava Rent a Boat (ningun competidor local lo tiene empaquetado con precio cerrado).
`;

// Language codes and their full names for the AI
const LANGUAGE_NAMES: Record<string, string> = {
  es: "espanol",
  en: "ingles",
  fr: "frances",
  de: "aleman",
  nl: "holandes",
  it: "italiano",
  ru: "ruso",
  ca: "catalan",
};

// Format boat info for the AI context
function formatBoatForAI(boat: Boat): string {
  const pricing = boat.pricing as { BAJA?: { prices?: Record<string, number> }; MEDIA?: { prices?: Record<string, number> }; ALTA?: { prices?: Record<string, number> } } | undefined;
  const specs = boat.specifications as { model?: string; length?: string; engine?: string; capacity?: string } | undefined;
  
  let info = `
BARCO: ${boat.name}
- ID: ${boat.id}
- Capacidad: ${boat.capacity} personas
- Requiere licencia: ${boat.requiresLicense ? "Si" : "No"}
- Deposito: ${boat.deposit}EUR
`;

  if (specs) {
    info += `- Modelo: ${specs.model || "N/A"}
- Eslora: ${specs.length || "N/A"}
- Motor: ${specs.engine || "N/A"}
`;
  }

  if (pricing) {
    info += `- Precios Temporada BAJA: ${JSON.stringify(pricing.BAJA?.prices || {})}
- Precios Temporada MEDIA: ${JSON.stringify(pricing.MEDIA?.prices || {})}
- Precios Temporada ALTA: ${JSON.stringify(pricing.ALTA?.prices || {})}
`;
  }

  if (boat.equipment && boat.equipment.length > 0) {
    info += `- Equipamiento: ${boat.equipment.join(", ")}
`;
  }

  if (boat.included && boat.included.length > 0) {
    info += `- Incluye: ${boat.included.join(", ")}
`;
  }

  return info;
}

// Get all boats formatted for AI context
async function getBoatsContext(): Promise<string> {
  try {
    const boats = await storage.getAllBoats();
    if (!boats || boats.length === 0) {
      return "No hay barcos disponibles en este momento.";
    }

    const boatsInfo = boats.map(formatBoatForAI).join("\n---\n");
    return `FLOTA DISPONIBLE (${boats.length} barcos):\n${boatsInfo}`;
  } catch (error) {
    logger.error("Error fetching boats for AI context", { error: error instanceof Error ? error.message : String(error) });
    return "Error al obtener informacion de barcos.";
  }
}

// Keywords that signal a premium-profile customer (special occasion, inexperienced,
// flexible budget, corporate). Multi-language. Used to trigger Excursion Privada upsell.
const PREMIUM_KEYWORDS = [
  // Special occasion — ES
  'aniversario', 'cumpleanos', 'cumpleaños', 'luna de miel', 'pedida de mano',
  'celebracion', 'celebración', 'sorprender', 'algo especial', 'jubilacion', 'jubilación',
  // No experience — ES
  'nunca he llevado', 'sin experiencia', 'primera vez', 'no tengo licencia',
  'no me apetece conducir', 'que alguien nos lleve',
  // Premium budget — ES
  'presupuesto flexible', 'el dinero no es problema', 'algo premium', 'quiero lo mejor',
  // Corporate — ES
  'empresa', 'team building', 'corporate', 'corporativo',
  // EN equivalents
  'anniversary', 'birthday', 'honeymoon', 'proposal', 'celebration',
  'surprise', 'something special', 'retirement',
  'never driven', 'no experience', 'first time', 'no license',
  "don't want to drive", 'dont want to drive',
  'budget flexible', 'money is not an issue', 'something premium',
  // DE equivalents
  'jubilaum', 'jubiläum', 'geburtstag', 'flitterwochen', 'heiratsantrag',
  'feier', 'uberraschen', 'überraschen', 'etwas besonderes', 'ruhestand',
  'noch nie gefahren', 'keine erfahrung', 'zum ersten mal',
  'mochte nicht fahren', 'möchte nicht fahren', 'firma',
  // FR equivalents
  'anniversaire', 'lune de miel', 'demande en mariage',
  'celebration', 'célébration', 'surprendre', 'quelque chose de special',
  'jamais pilote', 'jamais piloté', 'sans experience', 'sans expérience',
  'premiere fois', 'première fois', 'ne veux pas conduire',
  'entreprise',
];

// Detect intent from message
function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Premium profile signals — checked FIRST to catch upsell opportunities
  // before other intents override them
  if (PREMIUM_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    return 'premium_profile_detected';
  }

  // Booking intent
  if (lowerMessage.includes('reserv') || lowerMessage.includes('book') ||
      lowerMessage.includes('alquil') || lowerMessage.includes('rent')) {
    return 'booking_request';
  }
  
  // Availability intent
  if (lowerMessage.includes('disponib') || lowerMessage.includes('available') ||
      lowerMessage.includes('libre') || lowerMessage.includes('free')) {
    return 'availability';
  }
  
  // Price intent
  if (lowerMessage.includes('precio') || lowerMessage.includes('price') ||
      lowerMessage.includes('cost') || lowerMessage.includes('cuant') ||
      lowerMessage.includes('tarif') || lowerMessage.includes('rate')) {
    return 'price_inquiry';
  }
  
  // Boat info intent
  if (lowerMessage.includes('barco') || lowerMessage.includes('boat') ||
      lowerMessage.includes('embarcacion') || lowerMessage.includes('lancha')) {
    return 'boat_info';
  }
  
  // Route info intent
  if (lowerMessage.includes('ruta') || lowerMessage.includes('route') ||
      lowerMessage.includes('cala') || lowerMessage.includes('tossa') ||
      lowerMessage.includes('lloret') || lowerMessage.includes('excursion')) {
    return 'route_info';
  }
  
  // Greeting
  if (lowerMessage.includes('hola') || lowerMessage.includes('hello') ||
      lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
    return 'greeting';
  }
  
  // Farewell
  if (lowerMessage.includes('adios') || lowerMessage.includes('bye') ||
      lowerMessage.includes('gracias') || lowerMessage.includes('thanks')) {
    return 'farewell';
  }
  
  return 'general_question';
}

// Type for conversation history
interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

// Enhanced AI response with RAG, Memory, and Function Calling
export async function getAIResponseEnhanced(
  phoneNumber: string,
  userMessage: string,
  language: string = "es",
  profileName?: string
): Promise<{ response: string; tokensUsed?: number; detectedIntent?: string; detectedBoatId?: string }> {
  try {
    // Get or create persistent session
    const session = await getOrCreateSession(phoneNumber, profileName, language);
    
    // Detect intent
    const detectedIntent = detectIntent(userMessage);
    
    // Detect boat from message
    const boats = await storage.getAllBoats();
    const detectedBoatId = detectBoatFromMessage(userMessage, boats);
    
    // Get RAG context if knowledge base has entries
    let ragContext = "";
    if (await hasKnowledgeEntries()) {
      ragContext = await getRAGContext(userMessage, language);
    }
    
    // Get boats context
    const boatsContext = await getBoatsContext();

    // Get language name for clearer instructions
    const languageName = LANGUAGE_NAMES[language] || "espanol";
    
    // Build the system prompt
    const systemPrompt = `${BUSINESS_CONTEXT}

${boatsContext}

${PRIVATE_EXCURSION_CONTEXT}

${ragContext ? `\n${ragContext}\n` : ""}

IDIOMA_USUARIO: ${language} (${languageName})
INSTRUCCION CRITICA: Debes responder EXCLUSIVAMENTE en ${languageName}. No cambies de idioma bajo ninguna circunstancia.

Manten las respuestas concisas y amigables (maximo 300 palabras). No uses emojis en tus respuestas.

IMPORTANTE: Tienes acceso a funciones para consultar disponibilidad y precios en tiempo real. Usa estas funciones cuando el usuario pregunte por fechas especificas o disponibilidad.
`;

    // Prepare messages with history
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...session.history.slice(-10).map(m => ({ 
        role: m.role as "user" | "assistant", 
        content: m.content 
      })),
      { role: "user", content: userMessage },
    ];

    // Call OpenAI with function calling
    const completion = await openaiBreaker.call(() => getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      tools: AVAILABLE_FUNCTIONS,
      tool_choice: "auto",
      max_tokens: 500,
      temperature: 0.7,
    }));

    let response = completion.choices[0]?.message?.content || "";
    let tokensUsed = completion.usage?.total_tokens;

    // Handle function calls
    const toolCalls = completion.choices[0]?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      // Add assistant message with tool calls
      messages.push(completion.choices[0].message);

      // Execute each function call
      for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') continue;
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        logger.debug("AI Service executing function", { functionName, functionArgs });
        
        const functionResult = await executeFunction(functionName, functionArgs);
        
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: functionResult,
        });
      }

      // Get final response with function results
      const finalCompletion = await openaiBreaker.call(() => getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }));

      response = finalCompletion.choices[0]?.message?.content || response;
      tokensUsed = (tokensUsed || 0) + (finalCompletion.usage?.total_tokens || 0);
    }

    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Save messages to persistent memory
    await saveMessage(session.id, 'user', userMessage, {
      detectedIntent,
      detectedBoatId: detectedBoatId || undefined,
    });
    
    await saveMessage(session.id, 'assistant', response, {
      tokensUsed,
    });

    // Update lead scoring
    const currentScore = session.intentScore;
    const newScore = calculateIntentScore(currentScore, detectedIntent);
    await updateLeadScore(session.id, newScore, detectedBoatId || undefined, detectedIntent);

    return { 
      response, 
      tokensUsed, 
      detectedIntent,
      detectedBoatId: detectedBoatId || undefined,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Error getting AI response", { error: errorMsg });
    
    // Fallback response based on language
    const fallbackResponses: Record<string, string> = {
      es: "Lo siento, estoy teniendo problemas tecnicos. Por favor, contacta directamente por WhatsApp al +34 611 500 372 o visita costabravarentaboat.com",
      en: "Sorry, I'm having technical difficulties. Please contact us directly via WhatsApp at +34 611 500 372 or visit costabravarentaboat.com",
      ca: "Ho sento, estic tenint problemes tecnics. Si us plau, contacta directament per WhatsApp al +34 611 500 372 o visita costabravarentaboat.com",
      fr: "Desole, je rencontre des difficultes techniques. Veuillez nous contacter directement via WhatsApp au +34 611 500 372 ou visitez costabravarentaboat.com",
      de: "Entschuldigung, ich habe technische Schwierigkeiten. Bitte kontaktieren Sie uns direkt uber WhatsApp unter +34 611 500 372 oder besuchen Sie costabravarentaboat.com",
      nl: "Sorry, ik heb technische problemen. Neem direct contact op via WhatsApp op +34 611 500 372 of bezoek costabravarentaboat.com",
      it: "Mi dispiace, sto avendo difficolta tecniche. Vi preghiamo di contattarci direttamente tramite WhatsApp al +34 611 500 372 o visitate costabravarentaboat.com",
      ru: "Izvinite, u menya tekhnicheskiye trudnosti. Svyazhites' s nami napryamuyu cherez WhatsApp po nomeru +34 611 500 372 ili posetite costabravarentaboat.com",
    };

    return { 
      response: fallbackResponses[language] || fallbackResponses.es,
      detectedIntent: 'error',
    };
  }
}

// Legacy function for backwards compatibility (wrapper around enhanced)
export async function getAIResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  language: string = "es"
): Promise<string> {
  // For legacy calls without phone number, use a placeholder
  const result = await getAIResponseEnhanced("legacy-session", userMessage, language);
  return result.response;
}

// Check if AI service is properly configured
export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// Get image URL for a boat (for sending via WhatsApp)
export async function getBoatImageUrl(boatId: string): Promise<string | null> {
  try {
    const boat = await storage.getBoat(boatId);
    return boat?.imageUrl || null;
  } catch {
    return null;
  }
}
