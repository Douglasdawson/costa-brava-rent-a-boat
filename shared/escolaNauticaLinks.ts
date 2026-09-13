/**
 * Cross-linking hacia Escola Nàutica Blanes (escolanauticablanes.com), la escuela náutica
 * hermana: misma empresa (DAMAR COSTA BRAVA S.L.), mismo puerto.
 *
 * Dos reglas de negocio, y las dos son del destino, no nuestras:
 *
 * 1. La escuela NO VENDE todavía. No tiene el AGR163 resuelto, abre en abril de 2027 y hoy
 *    solo capta lista de espera. Ningún copy de aquí puede prometer plaza, fecha ni precio.
 * 2. La escuela es MONOLINGÜE en castellano. Su /es/, /en/, /de/... devuelven 404 real, no
 *    redirección. Por eso solo enlazan es, ca y en (con aviso), y el resto de idiomas se
 *    queda con el WhatsApp: mandar a un alemán a una página en castellano que además no le
 *    resuelve el título antes de 2027 es peor que no enlazar.
 *
 * El gate de idioma es el propio tipo: si el idioma no está en COPY, esta función devuelve
 * null y no hay nada que renderizar. No existe otra forma de construir la URL.
 */

/** Sin www: su canonical es el apex, y el www responde 200 sin redirigir. */
export const ESCOLA_NAUTICA_DOMAIN = "https://escolanauticablanes.com";

/**
 * Anclas verificadas de su home (13-sep-2026), por si hiciera falta un deep-link:
 * #el-dia, #la-flota, #limites, #preguntas, #lista-de-espera, #contenido.
 * Hoy solo se enlaza la raíz. Cuando haga falta la segunda, el parámetro `anchor` tiene que
 * poner el "?" ANTES del "#", o los UTM se pierden dentro del fragmento.
 */
const ESCOLA_NAUTICA_PATH = "/";

/** Superficie desde la que sale el enlace. Se lee en su GA4 como utm_campaign. */
export type EscolaNauticaSurface = "titulin-course" | "faq" | "llms";

export interface EscolaNauticaHandoff {
  url: string;
  title: string;
  body: string;
  cta: string;
  /** Copy del CTA final de la pillar, que en es/ca/en deja de mandar al WhatsApp. */
  finalTitle: string;
  finalBody: string;
}

/**
 * El copy vive aquí y no en i18n a propósito: `scripts/validate-translations.ts` exige que
 * toda clave de es.ts exista en los 8 idiomas, así que meterlo en i18n obligaría a traducirlo
 * a de/fr/it/nl/ru y luego gatearlo aparte. Aquí el Record ES el gate, y el copy no puede
 * separarse nunca de su enlace.
 */
const COPY: Record<string, Omit<EscolaNauticaHandoff, "url">> = {
  es: {
    title: "Nuestra escuela náutica abre en abril de 2027",
    body:
      "El curso lo dan escuelas náuticas autorizadas y, desde abril de 2027, una de ellas será la nuestra: Escola Nàutica Blanes, de la misma empresa que Costa Brava Rent a Boat, en el puerto de Blanes. Todavía no hay matrícula abierta ni precio: en su web puedes ver cómo es el día de prácticas, con qué barcos se enseña y qué límites tiene el título, y dejar tu correo en la lista de espera. Si lo necesitas antes (desde el 1 de octubre de 2026 la ley ya pide título para alquilar), escríbenos por WhatsApp y te lo organizamos en una escuela autorizada de la zona, sin esperar a la nuestra.",
    cta: "Conocer Escola Nàutica Blanes",
    finalTitle: "El titulín, con la escuela de la casa",
    finalBody:
      "Escola Nàutica Blanes abre en abril de 2027 en el puerto de Blanes. Mira cómo será el curso y deja tu correo para que te avisemos en cuanto haya fecha.",
  },
  ca: {
    title: "La nostra escola nàutica obre l'abril del 2027",
    body:
      "El curs el fan escoles nàutiques autoritzades i, a partir de l'abril del 2027, una d'elles serà la nostra: Escola Nàutica Blanes, de la mateixa empresa que Costa Brava Rent a Boat, al port de Blanes. Encara no hi ha matrícula oberta ni preu: al seu web pots veure com és el dia de pràctiques, amb quins vaixells s'ensenya i quins límits té el títol, i deixar el teu correu a la llista d'espera. Si el necessites abans (des de l'1 d'octubre del 2026 la llei ja demana títol per llogar), escriu-nos per WhatsApp i te l'organitzem en una escola autoritzada de la zona.",
    cta: "Conèixer Escola Nàutica Blanes",
    finalTitle: "El titulí, amb l'escola de la casa",
    finalBody:
      "Escola Nàutica Blanes obre l'abril del 2027 al port de Blanes. Mira com serà el curs i deixa el teu correu perquè t'avisem quan hi hagi data.",
  },
  en: {
    title: "Our own nautical school opens in April 2027",
    body:
      "The course is run by authorised nautical schools and, from April 2027, one of them will be ours: Escola Nàutica Blanes, part of the same company as Costa Brava Rent a Boat, in Blanes harbour. Enrolment is not open and there is no price yet: the site explains what the practice day looks like, which boats you train on and what the licence lets you do, and you can leave your email on the waiting list. If you need the licence sooner (from 1 October 2026 the law requires one in order to rent), message us on WhatsApp and we will arrange it at an authorised school nearby.",
    cta: "Visit Escola Nàutica Blanes (site in Spanish)",
    finalTitle: "The titulín, with our own school",
    finalBody:
      "Escola Nàutica Blanes opens in April 2027 in Blanes harbour. See what the course will be like and leave your email so we can let you know as soon as there is a date.",
  },
};

/**
 * URL absoluta con atribución. Separada del handoff porque los ficheros estáticos (llms.txt)
 * no pueden llamar a una función y su test compara contra esta.
 * `utm_content` lleva el idioma para poder decidir con datos si el inglés merece seguir.
 */
export function escolaNauticaUrl(lang: string, surface: EscolaNauticaSurface): string {
  const utm = `utm_source=cbrb&utm_medium=referral&utm_campaign=${surface}&utm_content=${lang}`;
  return `${ESCOLA_NAUTICA_DOMAIN}${ESCOLA_NAUTICA_PATH}?${utm}`;
}

/**
 * Enlace + copy hacia la escuela, o null si el idioma no está gateado.
 * El null es deliberado: con `strict`, quien lo ignore no compila, así que el peor accidente
 * posible es no pintar nada, nunca un enlace a un 404 en alemán.
 */
export function escolaNauticaHandoff(
  lang: string,
  surface: EscolaNauticaSurface,
): EscolaNauticaHandoff | null {
  const copy = COPY[lang];
  if (!copy) return null;
  return { url: escolaNauticaUrl(lang, surface), ...copy };
}

/** Los idiomas que enlazan. Lo consumen los tests y las superficies que iteran locales. */
export const ESCOLA_NAUTICA_LANGS = Object.keys(COPY);
