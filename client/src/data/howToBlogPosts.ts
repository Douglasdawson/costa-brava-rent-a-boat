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

  "consejos-primera-vez-alquilar-barco": {
    name: "Cómo alquilar un barco por primera vez — guía paso a paso",
    description: "Proceso completo para quien nunca ha alquilado un barco: desde elegir el tipo adecuado hasta devolverlo sin cargos extra. Específico para barco sin licencia en Blanes.",
    totalTime: "PT45M",
    tool: ["DNI o pasaporte", "Tarjeta bancaria para fianza"],
    supply: ["Protección solar SPF 50+", "Gafas de sol polarizadas", "Calzado antideslizante", "Agua en botella", "Móvil cargado"],
    steps: [
      {
        name: "Decide tipo de barco según grupo y experiencia",
        text: "Si eres novato sin licencia náutica y grupo de 2-5 personas, elige un barco sin licencia 15 CV (Solar 450, Remus 450 o Astec). Para grupos de 6-7 con alguno con licencia, elige barco con Licencia de Navegación Básica (LNB). Si no tiene nadie licencia pero el grupo es grande, reserva Excursión Privada con Capitán.",
      },
      {
        name: "Elige duración realista",
        text: "1h es poco para disfrutar, solo útil para probar. 2h permite ir a 1 cala y fondear. 4h es el sweet spot: 2-3 calas + snorkel + baño. 8h es día completo con comida a bordo. Primera vez: recomendamos 2h o 4h.",
      },
      {
        name: "Reserva online o por WhatsApp",
        text: "En costabravarentaboat.com elige fecha + barco + duración. Es solicitud de reserva, no pago online. Recibes confirmación en minutos por email y WhatsApp.",
      },
      {
        name: "Llega al Puerto de Blanes 15 min antes",
        text: "Dirección: Carrer Esplanada del Port, 17300 Blanes, Girona. Parking gratuito cerca. Preséntate en la oficina del muelle.",
      },
      {
        name: "Paga la fianza (200-500€) con tarjeta",
        text: "Se bloquea en tu tarjeta, no se cobra. Se libera al devolver el barco en buen estado. Firma el contrato simplificado. Se valida el DNI.",
      },
      {
        name: "Sigue atentamente el briefing de seguridad (15 min)",
        text: "Te explican: arranque del motor, cambio de marchas, maniobra de fondeo, uso del ancla y escalera, chalecos salvavidas, kit de emergencia, límite legal 2 millas, zona prohibida de baño. Pregunta lo que no entiendas — es el momento clave.",
      },
      {
        name: "Navega respetando las 3 reglas básicas",
        text: "(1) Velocidad máxima 5 nudos para sin licencia. (2) Distancia mínima 200m de la costa (balizas amarillas). (3) Vuelve al puerto con margen para no llegar tarde. Si dudas, llámanos por WhatsApp.",
      },
      {
        name: "Devuelve el barco a tiempo y sin daños",
        text: "Regresa 5-10 min antes del horario. Entrega las llaves. Nuestro equipo inspecciona brevemente el barco. Si todo está bien, la fianza se libera en minutos. Retraso sin aviso: 150€ por cada 30 min.",
      },
    ],
  },

  "navegar-con-ninos-costa-brava-guia-familias": {
    name: "Cómo navegar con niños en la Costa Brava de forma segura",
    description: "Guía práctica para familias con niños de 3-14 años: qué barco elegir, qué llevar, normas de seguridad infantil a bordo y rutas recomendadas para una primera experiencia sin estrés.",
    totalTime: "PT4H",
    tool: ["Chalecos salvavidas talla infantil (incluidos)", "Crema solar resistente al agua SPF 50+"],
    supply: ["Gorras con cordón", "Toallas grandes", "Snacks y agua (sin cristal)", "Nevera portátil (opcional)", "Pulseras de identificación con teléfono", "Cambio de ropa seca"],
    steps: [
      {
        name: "Elige barco estable con toldo bimini",
        text: "Para familias recomendamos Remus 450 o Solar 450: sin licencia, toldo bimini integral que cubre a los niños del sol, escalera de baño trasera, estable con mar calmo. Evita barcos deportivos sin sombra.",
      },
      {
        name: "Reserva horario templado (evita medio día)",
        text: "Salida recomendada con niños: 10:00-14:00 (mar más calmo, luz mejor) o 16:30-20:00 (atardecer, menos sol directo). Evita 13:00-16:00 que es el pico de calor y radiación solar.",
      },
      {
        name: "Explica las reglas a bordo antes de salir",
        text: "Regla 1: chaleco puesto desde que se sube al barco (obligatorio por ley para menores). Regla 2: sentados mientras navega. Regla 3: bañarse solo con el motor parado y ancla echada. Regla 4: mantenerse en la zona marcada de la escalera al subir/bajar del agua.",
      },
      {
        name: "Navega a velocidad reducida a calas familiares",
        text: "Las 3 mejores calas para niños desde Blanes: (a) Cala Sant Francesc — protegida del viento, fondo arenoso, entrada suave al agua; (b) Playa de Santa Cristina — con servicios en tierra si necesitas baño; (c) Cala Treumal — pinos hasta el agua, sombra natural.",
      },
      {
        name: "Para fondear: elige zona arenosa sin bañistas",
        text: "Busca zona arenosa (se ve turquesa claro desde el barco), NO rocosa. Echa el ancla. Espera 2-3 min para comprobar que no garrea. Apaga el motor. Baja la escalera de baño. Solo entonces los niños pueden bajar al agua con chaleco.",
      },
      {
        name: "Alterna 20 min de navegación / 40 min fondeo",
        text: "Los niños se cansan rápido del balanceo. Alterna trayectos cortos con paradas largas en calas. En 4h de alquiler: 2 calas con 45-60 min de baño en cada una es el ritmo ideal. Lleva snacks para fondeos.",
      },
      {
        name: "Regresa con margen antes del horario límite",
        text: "Calcula 30 min extra para volver tranquilo. Niños cansados no ayudan a maniobrar. Regresa a velocidad reducida con el viento controlado. En la oficina dejan devolver 5-10 min antes sin problema.",
      },
    ],
  },

  "seguridad-navegacion-mar-guia": {
    name: "Cómo preparar tu salida en barco con máxima seguridad",
    description: "Checklist pre-salida completo para alquiler de barco sin licencia en la Costa Brava: desde consultar el parte meteorológico hasta verificar equipamiento de emergencia a bordo.",
    totalTime: "PT30M",
    tool: ["App meteorológica (Windguru / Windy)", "Móvil cargado con Google Maps"],
    supply: ["Botellín de agua por persona", "Protección solar", "Chalecos salvavidas (incluidos)", "Silbato emergencia (incluido en kit)"],
    steps: [
      {
        name: "Consulta parte meteorológico 24h antes",
        text: "Revisa Windguru, Windy o la AEMET para Blanes. Criterios de NO salida: viento sostenido >20 nudos, rachas >25, olas >1m significativas, alerta naranja/roja. Si hay tramuntana fuerte (viento del norte), la costa queda desprotegida.",
      },
      {
        name: "Revisa parte meteo el día de la salida",
        text: "El día del alquiler consulta el parte de Capitanía Marítima o pregunta al personal del puerto antes de zarpar. Las condiciones pueden cambiar en 6h. Si hay duda, nuestro equipo decide: priorizamos tu seguridad sobre mantener la reserva.",
      },
      {
        name: "Verifica el kit de seguridad a bordo durante el briefing",
        text: "Comprueba que están: chalecos salvavidas (1 por persona, tallas correctas), bengalas de emergencia, silbato, extintor, ancla con 30m de cabo, escalera de baño, bichero, cabos de amarre, botiquín básico, espejo señalizador.",
      },
      {
        name: "Pon chalecos a niños y personas no nadadoras",
        text: "Por ley, menores de 12 años llevan chaleco puesto permanentemente. Recomendamos también a adultos no nadadores o que toman medicación. El chaleco puede salvar vidas incluso en aguas calmas.",
      },
      {
        name: "Planifica la ruta y avisa a alguien en tierra",
        text: "Decide calas objetivo antes de salir. Envía a un contacto (familia o amigo) un mensaje con: ruta planeada, hora prevista de regreso, número del barco (en la ficha). Si no regresas a tiempo, pueden alertar al 112 o al puerto.",
      },
      {
        name: "Lleva el móvil en bolsa estanca",
        text: "Bolsas estancas de 10€ en ferretería. El móvil te permite llamar al 112 (rescate marítimo gratuito), a nuestro WhatsApp (24/7), o consultar GPS si pierdes la orientación. Cargado al 100% antes de salir.",
      },
      {
        name: "Conoce las señales de emergencia",
        text: "Si hay emergencia grave: llama al 112 o canal 16 VHF (si el barco tiene radio). Brazos en cruz subidos/bajados = señal internacional de ayuda. Bengala roja si tienes visibilidad nocturna limitada. Silbato: 3 pitidos cortos repetidos.",
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
