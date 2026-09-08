/**
 * Cross-linking hacia Activitatum (activitatum.com), la agencia de actividades hermana.
 *
 * Regla de negocio: CBRB NUNCA enlaza lo que vende directo. Nada de barcos ni de jet ski,
 * ni el microsite /n/costa-brava-rent-a-boat (enlazarlo es pagarse a uno mismo la comisión).
 * Las motos tampoco: esa demanda ya tiene su propia página puente hacia coastrent.es y
 * duplicarla parte la señal. Ver ACTIVITATUM_BLOCKED al final del archivo.
 *
 * Por eso los destinos son una lista CERRADA: si no está aquí, no se puede enlazar.
 */

export const ACTIVITATUM_DOMAIN = "https://activitatum.com";

/**
 * Activitatum sirve 6 idiomas. El castellano va SIN prefijo — `/es/...` devuelve 404, no
 * redirección — y nl/ru no existen allí, así que caen al inglés.
 */
const ACTIVITATUM_PREFIX: Record<string, string> = {
  es: "",
  ca: "/ca",
  en: "/en",
  fr: "/fr",
  de: "/de",
  it: "/it",
  nl: "/en",
  ru: "/en",
};

/** Colecciones de destino. Las tres primeras son las puertas geográficas de la zona. */
export const ACTIVITATUM_TOPICS = {
  blanes: "/t/blanes",
  lloret: "/t/lloret-de-mar",
  fenals: "/t/fenals",
  groups: "/t/actividades-para-grupos",
  kids: "/t/actividades-para-ninos",
  stagParty: "/t/despedidas-de-soltero",
} as const;

export type ActivitatumTopic = keyof typeof ACTIVITATUM_TOPICS;

/**
 * Fichas concretas, agrupadas por el hueco que llenan en el día del visitante.
 * Ninguna es de barco ni de jet ski. Los precios son los de Activitatum (desde, por persona)
 * y están aquí para poder ordenar y mostrar sin llamar a su API.
 */
export const ACTIVITATUM_PICKS = {
  // Agua en Blanes: mismo puerto del que salen nuestros barcos, sesiones cortas y baratas.
  flyfish: { path: "/a/flyfish-blanes", priceEur: 25, slot: "afterBoat" },
  bananaBoat: { path: "/a/banana-boat-blanes", priceEur: 15, slot: "afterBoat" },
  paddle: { path: "/a/paddle-board-blanes", priceEur: 20, slot: "afterBoat" },
  wakeboard: { path: "/a/wakeboard-waterski-blanes", priceEur: 65, slot: "afterBoat" },
  crazyUfo: { path: "/a/crazy-ufo-lloret", priceEur: 25, slot: "afterBoat" },
  // Planes de medio día en Lloret, para el día que no toca mar.
  parasailing: { path: "/a/parasailing-lloret", priceEur: 70, slot: "landDay" },
  buggy: { path: "/a/buggy-the-coastline-run", priceEur: 159, slot: "landDay" },
  holidayPack: { path: "/a/holiday-pack-lloret", priceEur: 125, slot: "landDay" },
  // Plan de lluvia, en Malgrat (a 10 min de Blanes).
  escapeRoom: { path: "/a/holmes-blindmiceescape", priceEur: 20, slot: "rainyDay" },
} as const;

export type ActivitatumPick = keyof typeof ACTIVITATUM_PICKS;
export type ActivitatumSlot = "afterBoat" | "landDay" | "rainyDay";

/** Las fichas de un hueco concreto, en el orden en que se declaran arriba. */
export function activitatumPicksBySlot(slot: ActivitatumSlot): ActivitatumPick[] {
  return (Object.keys(ACTIVITATUM_PICKS) as ActivitatumPick[]).filter(
    (key) => ACTIVITATUM_PICKS[key].slot === slot,
  );
}

/** Superficie desde la que sale el enlace. Se lee en GA4 como utm_campaign. */
export type ActivitatumSurface =
  | "footer"
  | "nav"
  | "bridge"
  | "booking-confirmation"
  | "thankyou-email"
  | "email-footer"
  | "city-landing"
  | "blog";

/**
 * URL absoluta y canónica hacia Activitatum, en el idioma del visitante y con UTM.
 * `path` empieza por "/" y NO lleva prefijo de idioma: se le añade aquí.
 */
export function activitatumUrl(
  path: string,
  lang: string,
  surface: ActivitatumSurface,
): string {
  const prefix = ACTIVITATUM_PREFIX[lang] ?? "/en";
  const utm = `utm_source=cbrb&utm_medium=referral&utm_campaign=${surface}`;
  return `${ACTIVITATUM_DOMAIN}${prefix}${path}?${utm}`;
}

/** Atajo para las colecciones, que es lo que se enlaza el 90% de las veces. */
export function activitatumTopicUrl(
  topic: ActivitatumTopic,
  lang: string,
  surface: ActivitatumSurface,
): string {
  return activitatumUrl(ACTIVITATUM_TOPICS[topic], lang, surface);
}

/** La puerta geográfica que le toca a cada landing de ciudad de CBRB. */
export function activitatumTopicForCity(citySlug: string): ActivitatumTopic {
  return citySlug.includes("blanes") ? "blanes" : "lloret";
}

/**
 * Destinos vetados, con el motivo. No es una comprobación en runtime — los destinos válidos
 * son la lista cerrada de arriba — sino la documentación de por qué NO están, y lo que el
 * test comprueba que nadie ha colado.
 */
export const ACTIVITATUM_BLOCKED = [
  // La flota de CBRB dentro de Activitatum: lo vendemos directo y sin comisión.
  "/a/solar-450-blanes",
  "/a/remus-450-blanes",
  "/a/remus-450-ii-blanes",
  "/a/astec-480-blanes",
  "/a/mingolla-brava-19-blanes",
  "/a/trimarchi-57s-blanes",
  "/a/pacific-craft-625-blanes",
  "/a/excursion-privada-barco-blanes",
  "/n/costa-brava-rent-a-boat",
  // Temas de barco.
  "/t/alquiler-barcos",
  "/t/barcos-sin-licencia",
  "/t/excursiones-barco",
  // Jet ski: CBRB lo vende directo desde Blanes.
  "/t/jet-ski",
  "/a/jetski-circuito-blanes",
  "/a/jetski-excursion-blanes",
  "/a/jet-ski-lloret",
  "/a/safari-moto-de-agua-aqua-safari-jet-ski",
  // Motos: ya tienen su página puente hacia coastrent.es.
  "/t/alquiler-motos",
] as const;
