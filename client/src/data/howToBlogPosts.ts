/**
 * HowTo schema.org steps for selected blog posts.
 * GEO benefit: Perplexity / ChatGPT / Google SGE prefer HowTo over Article
 * for procedural queries like "how to rent a boat without a license".
 *
 * Only add posts that truly have a step-by-step structure in their content.
 * Over-using HowTo where it doesn't fit can hurt authority.
 *
 * Mapping key: blog post slug. Value: HowTo metadata.
 */

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

export interface HowToBlogEntry {
  name: string;
  description: string;
  totalTime: string;   // ISO 8601 duration, e.g. PT15M (15 min)
  estimatedCost?: { currency: string; value: number };
  tool?: string[];
  supply?: string[];
  steps: HowToStep[];
}

export const HOW_TO_BLOG_POSTS: Record<string, HowToBlogEntry> = {
  "alquiler-barco-sin-licencia-blanes-guia": {
    name: "Cómo alquilar un barco sin licencia en Blanes (Costa Brava)",
    description: "Proceso completo para alquilar un barco sin titulación náutica en el Puerto de Blanes y navegar legalmente por las calas de la Costa Brava Sur.",
    totalTime: "PT30M",
    estimatedCost: { currency: "EUR", value: 70 },
    tool: [
      "DNI o pasaporte (mayor de 18 años)",
      "Tarjeta bancaria para la fianza",
    ],
    supply: [
      "Protección solar",
      "Gafas de sol",
      "Calzado antideslizante",
      "Ropa cómoda o bañador",
    ],
    steps: [
      {
        name: "Elige el barco y la duración",
        text: "Entra en costabravarentaboat.com, selecciona un barco sin licencia (Solar 450, Remus 450, Astec 400 o 480) y elige duración: 1h, 2h, 4h, 6h o día completo. Desde 70€/hora con gasolina incluida.",
      },
      {
        name: "Reserva con fecha y hora",
        text: "Rellena el formulario con tu fecha, hora de salida y número de personas (máximo 4-5 según barco). Recibes confirmación por email y WhatsApp. Es una solicitud de reserva, no pago online.",
      },
      {
        name: "Preséntate en el Puerto de Blanes",
        text: "El día reservado, llega al Puerto de Blanes 15 minutos antes. Dirección: Carrer Esplanada del Port, 17300 Blanes, Girona. Parking gratuito cerca.",
      },
      {
        name: "Deposita la fianza y firma el contrato",
        text: "Paga la fianza (200-300€ según barco) con tarjeta. Firmas el contrato simplificado. La fianza se devuelve íntegra al regresar si el barco vuelve en buen estado.",
      },
      {
        name: "Recibe el briefing de seguridad (15 min)",
        text: "Nuestro equipo te explica: cómo arrancar el motor, usar la palanca de marchas, maniobrar, fondear, uso del ancla y escalera, chalecos salvavidas y kit de seguridad. Te enseñamos también la zona de navegación permitida (hasta 2 millas de costa, a 5 nudos, límite norte en Playa de Fenals).",
      },
      {
        name: "Navega por las calas de la Costa Brava",
        text: "Sales del puerto. Puedes fondear en 7 calas hasta Playa de Fenals: Sa Forcanera, Cala Sant Francesc, Cala de s'Agulla, Cala Treumal, Playa de Santa Cristina, Cala Sa Boadella y Playa de Fenals. Tiempo aproximado: 25 minutos a velocidad de crucero.",
      },
      {
        name: "Devuelve el barco a la hora acordada",
        text: "Regresa al puerto antes de la hora estipulada. Nuestro equipo inspecciona el barco brevemente. Si todo está bien, te devuelven la fianza. En caso de retraso sin aviso, se cobra 150€ por cada 30 minutos.",
      },
    ],
  },

  "como-llegar-puerto-blanes-desde-barcelona": {
    name: "Cómo llegar al Puerto de Blanes desde Barcelona",
    description: "Opciones de transporte para llegar al Puerto de Blanes desde Barcelona y alrededores: coche, tren Rodalies R1, autobús y bus directo desde el aeropuerto.",
    totalTime: "PT1H30M",
    tool: ["Tarjeta T-mobilitat (tren)", "GPS o navegador"],
    steps: [
      {
        name: "Elige tu medio de transporte",
        text: "Opciones desde Barcelona: (a) coche por AP-7 o N-II (~1h), (b) tren Rodalies R1 desde Estació de França o Passeig de Gràcia (1h 30min directo), (c) autobús Mon-Bus, (d) taxi/Uber ~100€.",
      },
      {
        name: "Si vas en coche: sigue AP-7 salida 9 Blanes",
        text: "Desde Barcelona toma la AP-7 dirección norte/Girona. Sal en la salida 9 (Blanes/Lloret). Sigue indicaciones Blanes centro. El Puerto de Blanes está señalizado. Hay parking gratuito en Passeig del Port.",
      },
      {
        name: "Si vas en tren: Rodalies R1 hasta estación Blanes",
        text: "Desde Barcelona Sants o Passeig de Gràcia toma la R1 dirección Blanes. El viaje directo tarda 1h 30min. Frecuencia cada 30 min. Al llegar a la estación de Blanes, el puerto está a 15 min a pie (1 km) o 3 min en taxi.",
      },
      {
        name: "Llega al Puerto de Blanes 15 min antes de tu reserva",
        text: "La oficina está en el mismo muelle donde atracan los barcos. Recomendamos llegar 15 minutos antes del horario reservado para el briefing de seguridad. Dirección: Carrer Esplanada del Port, 17300 Blanes.",
      },
      {
        name: "Desde aeropuerto El Prat",
        text: "Opción 1: Aerobus hasta Pl. Catalunya + R1 a Blanes (~2h total). Opción 2: Renfe desde El Prat hasta Passeig de Gràcia + R1 (~2h). Opción 3: taxi directo ~120€ (1h 15min). Opción 4: bus directo Mon-Bus desde aeropuerto hasta Blanes (consulta temporada).",
      },
    ],
  },
};

/**
 * Build HowTo schema.org JSON-LD for a blog post slug.
 * Returns null if the slug has no HowTo entry.
 */
export function generateHowToSchema(slug: string, canonical: string): Record<string, unknown> | null {
  const entry = HOW_TO_BLOG_POSTS[slug];
  if (!entry) return null;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${canonical}#howto`,
    "name": entry.name,
    "description": entry.description,
    "totalTime": entry.totalTime,
    "step": entry.steps.map((s, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": s.name,
      "text": s.text,
      ...(s.url ? { "url": s.url } : {}),
    })),
  };

  if (entry.estimatedCost) {
    schema.estimatedCost = {
      "@type": "MonetaryAmount",
      "currency": entry.estimatedCost.currency,
      "value": entry.estimatedCost.value,
    };
  }
  if (entry.tool && entry.tool.length > 0) {
    schema.tool = entry.tool.map((t) => ({ "@type": "HowToTool", "name": t }));
  }
  if (entry.supply && entry.supply.length > 0) {
    schema.supply = entry.supply.map((s) => ({ "@type": "HowToSupply", "name": s }));
  }

  return schema;
}
