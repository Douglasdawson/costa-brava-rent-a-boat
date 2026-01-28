// AI Service for WhatsApp Chatbot - Uses OpenAI for intelligent responses
import OpenAI from "openai";
import { storage } from "../storage";
import type { Boat } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Business context for the AI
const BUSINESS_CONTEXT = `
Eres el asistente virtual de Costa Brava Rent a Boat, empresa de alquiler de barcos ubicada en Blanes, Costa Brava, España.

INFORMACIÓN DEL NEGOCIO:
- Ubicación: Puerto de Blanes, Costa Brava, España
- Teléfono: +34 611 500 372
- Email: costabravarentaboat@gmail.com
- Web: costabravarentaboat.app
- Temporada: Abril a Octubre

SERVICIOS:
- Alquiler de barcos SIN licencia (no se requiere titulación náutica)
- Alquiler de barcos CON licencia
- Duraciones: desde 2 horas hasta día completo
- Excursiones por la Costa Brava: Tossa de Mar, Lloret de Mar, calas escondidas

TEMPORADAS DE PRECIOS:
- BAJA: Abril, Mayo, Octubre (precios más económicos)
- MEDIA: Junio, Septiembre
- ALTA: Julio, Agosto (temporada alta, precios máximos)

NORMAS IMPORTANTES:
- Depósito requerido (se devuelve al entregar el barco en buen estado)
- Combustible incluido en algunos barcos
- Se proporciona equipo de seguridad
- Briefing de seguridad antes de salir

ZONAS DE NAVEGACIÓN:
- Blanes y alrededores
- Calas vírgenes de la Costa Brava
- Tossa de Mar (costa)
- Lloret de Mar (costa)

Tu objetivo es:
1. Responder preguntas sobre barcos, precios y disponibilidad
2. Ayudar a los clientes a elegir el barco adecuado
3. Proporcionar información útil sobre la experiencia
4. Dirigir a los clientes al WhatsApp (+34 611 500 372) o web para reservar

Responde siempre en el mismo idioma que el usuario. Sé amable, profesional y entusiasta sobre la experiencia náutica.
Si no sabes algo específico, sugiere contactar directamente por WhatsApp o email.
`;

// Format boat info for the AI context
function formatBoatForAI(boat: Boat): string {
  const pricing = boat.pricing as { BAJA?: { prices?: Record<string, number> }; MEDIA?: { prices?: Record<string, number> }; ALTA?: { prices?: Record<string, number> } } | undefined;
  const specs = boat.specifications as { model?: string; length?: string; engine?: string; capacity?: string } | undefined;
  
  let info = `
BARCO: ${boat.name}
- ID: ${boat.id}
- Capacidad: ${boat.capacity} personas
- Requiere licencia: ${boat.requiresLicense ? "Sí" : "No"}
- Depósito: ${boat.deposit}€
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
    console.error("[AI Service] Error fetching boats:", error);
    return "Error al obtener información de barcos.";
  }
}

// Type for conversation history
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Main function to get AI response
export async function getAIResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  language: string = "es"
): Promise<string> {
  try {
    // Get current boat inventory
    const boatsContext = await getBoatsContext();

    // Build the system prompt with business context and current boats
    const systemPrompt = `${BUSINESS_CONTEXT}

${boatsContext}

IDIOMA DETECTADO DEL USUARIO: ${language}
Responde siempre en el idioma del usuario. Si el usuario escribe en inglés, responde en inglés. Si escribe en español, responde en español, etc.

Mantén las respuestas concisas y amigables (máximo 300 palabras). No uses emojis en tus respuestas.
`;

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: userMessage },
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective and fast
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    return response;
  } catch (error: any) {
    console.error("[AI Service] Error getting AI response:", error.message);
    
    // Fallback response based on language
    const fallbackResponses: Record<string, string> = {
      es: "Lo siento, estoy teniendo problemas técnicos. Por favor, contacta directamente por WhatsApp al +34 611 500 372 o visita costabravarentaboat.app",
      en: "Sorry, I'm having technical difficulties. Please contact us directly via WhatsApp at +34 611 500 372 or visit costabravarentaboat.app",
      ca: "Ho sento, estic tenint problemes tècnics. Si us plau, contacta directament per WhatsApp al +34 611 500 372 o visita costabravarentaboat.app",
      fr: "Désolé, je rencontre des difficultés techniques. Veuillez nous contacter directement via WhatsApp au +34 611 500 372 ou visitez costabravarentaboat.app",
      de: "Entschuldigung, ich habe technische Schwierigkeiten. Bitte kontaktieren Sie uns direkt über WhatsApp unter +34 611 500 372 oder besuchen Sie costabravarentaboat.app",
    };

    return fallbackResponses[language] || fallbackResponses.es;
  }
}

// Check if AI service is properly configured
export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
