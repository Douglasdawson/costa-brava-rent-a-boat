// Seed Knowledge Base with FAQs, Policies, and Routes
import { addKnowledgeEntry } from "./ragService";

// FAQ entries in Spanish
const FAQS_ES = [
  {
    title: "Como reservar un barco",
    content: "Para reservar un barco, puedes contactarnos directamente por WhatsApp al +34 611 500 372, a traves de nuestra web costabravarentaboat.app, o enviarnos un email a costabravarentaboat@gmail.com. Necesitaremos saber la fecha deseada, duracion del alquiler, numero de personas y el barco que te interesa.",
    category: "faq",
    keywords: ["reservar", "alquilar", "booking", "como"],
    priority: 10,
  },
  {
    title: "Se necesita licencia para alquilar un barco",
    content: "Tenemos barcos para todos. Ofrecemos barcos SIN licencia que cualquier persona mayor de 18 anos puede conducir despues de un breve briefing de seguridad. Tambien tenemos barcos CON licencia para quienes tienen titulacion nautica y buscan embarcaciones mas potentes.",
    category: "faq",
    keywords: ["licencia", "carnet", "titulacion", "sin licencia"],
    priority: 10,
  },
  {
    title: "Que incluye el alquiler",
    content: "El alquiler incluye: equipo de seguridad obligatorio (chalecos, extintor, bengalas), ancla y cabo de fondeo, toldo o bimini para proteccion solar, nevera portatil, y un briefing de seguridad antes de salir. El combustible esta incluido en algunos barcos, consulta las especificaciones de cada embarcacion.",
    category: "faq",
    keywords: ["incluye", "incluido", "equipo", "seguridad"],
    priority: 9,
  },
  {
    title: "Politica de deposito",
    content: "Se requiere un deposito que varia segun el barco (entre 200 y 500 euros). El deposito se paga antes de salir y se devuelve integramente al entregar el barco en las mismas condiciones. Se puede pagar en efectivo o con tarjeta.",
    category: "policy",
    keywords: ["deposito", "fianza", "devolucion"],
    priority: 9,
  },
  {
    title: "Horarios de salida y duracion",
    content: "Ofrecemos alquileres de 2, 4, 6 u 8 horas. Los horarios habituales de salida son: manana (10:00), mediodia (14:00) y tarde (18:00 en verano). Para alquileres de dia completo, la salida es a las 10:00 y la devolucion antes del atardecer.",
    category: "faq",
    keywords: ["horario", "horas", "duracion", "salida"],
    priority: 8,
  },
  {
    title: "Temporadas y precios",
    content: "Tenemos tres temporadas: BAJA (abril, mayo, octubre) con los mejores precios; MEDIA (junio, septiembre) con precios intermedios; y ALTA (julio, agosto) que es la temporada de maxima demanda. Los precios varian segun el barco y la duracion del alquiler.",
    category: "faq",
    keywords: ["temporada", "precio", "tarifa", "coste"],
    priority: 8,
  },
  {
    title: "Politica de cancelacion",
    content: "Las cancelaciones con mas de 48 horas de antelacion reciben reembolso completo. Cancelaciones entre 24-48 horas reciben el 50%. Cancelaciones con menos de 24 horas no son reembolsables, aunque ofrecemos cambio de fecha sujeto a disponibilidad. En caso de mal tiempo, reprogramamos sin coste.",
    category: "policy",
    keywords: ["cancelacion", "anular", "reembolso", "devolucion"],
    priority: 9,
  },
  {
    title: "Mal tiempo",
    content: "Si hay mal tiempo (viento fuerte, tormenta, oleaje excesivo), la salida se pospone o se ofrece cambio de fecha sin coste adicional. La seguridad es nuestra prioridad. Nuestro equipo monitoriza las condiciones meteorologicas y te avisaremos con antelacion si hay cambios.",
    category: "policy",
    keywords: ["tiempo", "tormenta", "viento", "seguridad", "meteorologia"],
    priority: 8,
  },
];

// Route recommendations
const ROUTES_ES = [
  {
    title: "Ruta a las Calas de Blanes",
    content: "Desde el puerto de Blanes, navega hacia el norte para descubrir calas virgenes como Cala Sant Francesc, Sa Forcanera y Cala Bona. Son calas tranquilas con aguas cristalinas perfectas para banarse y hacer snorkel. Tiempo estimado: 2-4 horas dependiendo de las paradas.",
    category: "route",
    keywords: ["cala", "blanes", "ruta", "snorkel", "playa"],
    priority: 7,
  },
  {
    title: "Excursion a Tossa de Mar",
    content: "Una de las rutas mas populares. Navega desde Blanes hacia el norte costeando la bella Costa Brava hasta llegar a Tossa de Mar con su famoso recinto amurallado. El trayecto dura aproximadamente 45 minutos por sentido. Se recomienda alquiler de 4-6 horas para disfrutar de la ruta completa.",
    category: "route",
    keywords: ["tossa", "excursion", "costa", "muralla"],
    priority: 8,
  },
  {
    title: "Ruta hacia Lloret de Mar",
    content: "Hacia el sur desde Blanes, puedes explorar la costa de Lloret de Mar, pasando por Santa Cristina y su ermita. Es una ruta mas corta, ideal para alquileres de 2-4 horas. Las playas de Lloret son mas concurridas pero muy pintorescas.",
    category: "route",
    keywords: ["lloret", "santa cristina", "sur", "ermita"],
    priority: 7,
  },
  {
    title: "Fondeo y bano en calas",
    content: "Para fondear, busca calas con fondo de arena (mejor agarre) y protegidas del viento. Algunas recomendaciones: Cala Sant Francesc (arena, muy tranquila), Cala Treumal (mixto, cerca de Blanes), y Sa Forcanera (rocosa, aguas muy claras). Usa el ancla con al menos 3 veces la profundidad en cabo.",
    category: "route",
    keywords: ["fondeo", "ancla", "bano", "cala", "arena"],
    priority: 6,
  },
];

// General information
const GENERAL_ES = [
  {
    title: "Ubicacion y como llegar",
    content: "Estamos ubicados en el Puerto de Blanes, Costa Brava, provincia de Girona. Blanes esta a 60km de Barcelona y 35km de Girona. Puedes llegar en coche (parking disponible), tren (estacion de Blanes a 10 minutos andando) o autobus. Te enviaremos la ubicacion exacta al confirmar la reserva.",
    category: "general",
    keywords: ["ubicacion", "direccion", "llegar", "puerto", "blanes"],
    priority: 7,
  },
  {
    title: "Que llevar al barco",
    content: "Te recomendamos llevar: proteccion solar alta, gorra o sombrero, toallas, banador, agua y comida si planeas paradas largas, gafas de sol, equipo de snorkel si tienes (tambien se puede alquilar), y ropa ligera. Lleva calzado que se pueda mojar para subir y bajar del barco.",
    category: "general",
    keywords: ["llevar", "equipaje", "preparar", "necesario"],
    priority: 6,
  },
  {
    title: "Capacidad de los barcos",
    content: "Nuestros barcos tienen capacidades desde 4 hasta 8 personas dependiendo del modelo. Es importante respetar la capacidad maxima por seguridad. Para grupos grandes, podemos organizar salidas con varios barcos. Contacta con nosotros para grupos especiales.",
    category: "general",
    keywords: ["capacidad", "personas", "grupo", "cuantos"],
    priority: 6,
  },
];

// Seed function
export async function seedKnowledgeBase(): Promise<void> {
  console.log("[Knowledge] Starting to seed knowledge base...");
  
  const allEntries = [...FAQS_ES, ...ROUTES_ES, ...GENERAL_ES];
  let added = 0;
  let failed = 0;
  
  for (const entry of allEntries) {
    const success = await addKnowledgeEntry(
      entry.title,
      entry.content,
      entry.category,
      "es",
      entry.keywords,
      entry.priority
    );
    
    if (success) {
      added++;
    } else {
      failed++;
    }
  }
  
  console.log(`[Knowledge] Seeding complete: ${added} added, ${failed} failed`);
}

// Check if already seeded
export async function isKnowledgeBaseSeeded(): Promise<boolean> {
  const { hasKnowledgeEntries } = await import("./ragService");
  return await hasKnowledgeEntries();
}
