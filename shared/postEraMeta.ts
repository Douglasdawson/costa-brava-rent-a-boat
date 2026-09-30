/**
 * Post-era SEO meta (RD 1188/2025). From 2026-10-01 renting any motorboat requires a
 * nautical qualification, so every title/description that still promises "sin licencia"
 * has to tell the truth from that day on: the small licence-free boats (up to 15 HP) are
 * withdrawn from rental. What remains is the licensed fleet, rented with the Licencia de
 * Navegación (titulín, a 1-day course), and the excursion with a skipper. No rentable boat
 * includes fuel after that day, so no entry may promise it.
 *
 * ONE map, keyed by the server's STATIC_META key, consumed by both `server/seoInjector.ts`
 * (what crawlers see) and `client/src/utils/seo-config.ts` (what hydrates), so the two
 * can never diverge (CLAUDE.md rule: divergence = canonical to the home). Only the fields
 * that carried the old promise are overridden; everything else keeps the pre-era value.
 * The keyword people still search ("sin licencia") stays in the title on purpose: the
 * page has to keep ranking for it while explaining the change.
 *
 * No prices here: the floor is rewritten at runtime on the server and hardcoded on the
 * client, and a post-era string that cites one would drift the day it changes.
 */
import { BUSINESS_RATING_STR } from "./businessProfile";
import { isLicenseFreeEraActive } from "./constants";

export interface PostEraFields {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}

type LangMap = Partial<Record<string, PostEraFields>>;

const R = BUSINESS_RATING_STR;

/** Satellite towns: same message, the town name and the drive time change. */
const TOWN: Record<string, (name: string, min: number) => PostEraFields> = {
  es: (n, m) => ({
    title: `Alquiler Barco ${n} | Puerto Blanes a ${m} min | Titulín o Patrón`,
    description: `¿Alojado en ${n}? El Puerto de Blanes está a ${m} min. Desde el 1 de octubre de 2026 alquilas con la Licencia de Navegación (curso de 1 día, sin examen) o sales con patrón. ★${R} Google.`,
  }),
  en: (n, m) => ({
    title: `Boat Rental ${n} | Blanes Port ${m} min | Licence in 1 Day or Skipper`,
    description: `Staying in ${n}? Blanes Port is ${m} min away. From 1 October 2026 you rent with the Licencia de Navegación (1-day course, no exam) or sail with a skipper. ★${R} Google.`,
  }),
  ca: (n, m) => ({
    title: `Lloguer Barca ${n} | Port Blanes a ${m} min | Titulí o Patró`,
    description: `Allotjat a ${n}? El Port de Blanes és a ${m} min. Des de l'1 d'octubre de 2026 llogues amb la Llicència de Navegació (curs d'1 dia, sense examen) o surts amb patró. ★${R} Google.`,
  }),
  fr: (n, m) => ({
    title: `Location Bateau ${n} | Port Blanes à ${m} min | Permis en 1 jour ou Skipper`,
    description: `En séjour à ${n} ? Le port de Blanes est à ${m} min. Depuis le 1er octobre 2026, vous louez avec la Licencia de Navegación (cours d'1 jour, sans examen) ou partez avec un skipper. ★${R} Google.`,
  }),
  de: (n, m) => ({
    title: `Bootsverleih ${n} | Hafen Blanes ${m} Min | Schein an 1 Tag oder Skipper`,
    description: `Urlaub in ${n}? Der Hafen Blanes ist ${m} Min entfernt. Seit dem 1. Oktober 2026 mieten Sie mit der Licencia de Navegación (1-Tages-Kurs, ohne Prüfung) oder fahren mit Skipper. ★${R} Google.`,
  }),
  nl: (n, m) => ({
    title: `Bootverhuur ${n} | Haven Blanes op ${m} min | Vaarbewijs in 1 dag of Schipper`,
    description: `Op vakantie in ${n}? De haven van Blanes is ${m} min verderop. Sinds 1 oktober 2026 huur je met de Licencia de Navegación (cursus van 1 dag, zonder examen) of vaar je met een schipper. ★${R} Google.`,
  }),
  it: (n, m) => ({
    title: `Noleggio Barca ${n} | Porto Blanes a ${m} min | Patente in 1 giorno o Skipper`,
    description: `In vacanza a ${n}? Il porto di Blanes è a ${m} min. Dal 1 ottobre 2026 noleggi con la Licencia de Navegación (corso di 1 giorno, senza esame) o esci con uno skipper. ★${R} Google.`,
  }),
  ru: (n, m) => ({
    title: `Аренда Лодки ${n} | Порт Бланес ${m} мин | Права за 1 день или Капитан`,
    description: `Отдыхаете в ${n}? Порт Бланеса в ${m} мин. С 1 октября 2026 года аренда с Licencia de Navegación (курс за 1 день, без экзамена) или выход с капитаном. ★${R} Google.`,
  }),
};

const LANGS = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"] as const;

function town(name: string, minutes: number): LangMap {
  const out: LangMap = {};
  for (const l of LANGS) out[l] = TOWN[l](name, minutes);
  return out;
}

/** Legacy English-only pages whose 8 locale entries are the same English copy. */
function allLangs(fields: PostEraFields): LangMap {
  const out: LangMap = {};
  for (const l of LANGS) out[l] = fields;
  return out;
}

/** Activity pages: per-language head + lead sentence, the same titulín-or-skipper tail. */
const ACTIVITY_TAIL: Record<string, { title: string; desc: string }> = {
  es: { title: "Con Titulín o Patrón", desc: `Con titulín (curso de 1 día) o con patrón desde octubre de 2026. ★${R} Google.` },
  en: { title: "Licence in 1 Day or Skipper", desc: `With the titulín (1-day licence) or with a skipper from October 2026. ★${R} Google.` },
  ca: { title: "Amb Titulí o Patró", desc: `Amb titulí (curs d'1 dia) o amb patró des d'octubre de 2026. ★${R} Google.` },
  fr: { title: "Permis en 1 jour ou Skipper", desc: `Avec le titulín (permis en 1 jour) ou avec skipper depuis octobre 2026. ★${R} Google.` },
  de: { title: "Schein an 1 Tag oder Skipper", desc: `Mit dem Titulín (Schein an 1 Tag) oder mit Skipper seit Oktober 2026. ★${R} Google.` },
  nl: { title: "Vaarbewijs in 1 dag of Schipper", desc: `Met de titulín (vaarbewijs in 1 dag) of met schipper sinds oktober 2026. ★${R} Google.` },
  it: { title: "Patente in 1 giorno o Skipper", desc: `Con il titulín (patente in 1 giorno) o con skipper da ottobre 2026. ★${R} Google.` },
  ru: { title: "Права за 1 день или Капитан", desc: `С titulín (права за 1 день) или с капитаном с октября 2026 года. ★${R} Google.` },
};

function activity(copy: Record<(typeof LANGS)[number], [head: string, lead: string]>): LangMap {
  const out: LangMap = {};
  for (const l of LANGS) {
    const [head, lead] = copy[l];
    out[l] = { title: `${head} | ${ACTIVITY_TAIL[l].title}`, description: `${lead} ${ACTIVITY_TAIL[l].desc}` };
  }
  return out;
}

export const POST_ERA_META: Record<string, LangMap> = {
  "/barcos-sin-licencia": {
    es: {
      title: `Barcos Sin Licencia Blanes: desde octubre 2026, Titulín en 1 día o Patrón · ★${R}`,
      description: `Desde el 1 de octubre de 2026 ya no alquilamos barcos sin licencia en Blanes: la ley exige título para alquilar cualquier barco a motor. Con el titulín (curso de 1 día, sin examen) llevas nuestras lanchas, o sales con patrón profesional. ★${R} Google.`,
    },
    en: {
      title: `Licence-Free Boats Blanes: from October 2026, Titulín in 1 Day or Skipper · ★${R}`,
      description: `From 1 October 2026 we no longer rent licence-free boats in Blanes: Spanish law requires a licence to rent any motorboat. With the titulín (1-day course, no exam) you skipper our motorboats yourself, or sail with a professional skipper. ★${R} Google.`,
    },
    ca: {
      title: `Barques Sense Llicència Blanes: des d'octubre 2026, Titulí en 1 dia o Patró · ★${R}`,
      description: `Des de l'1 d'octubre de 2026 ja no lloguem barques sense llicència a Blanes: la llei exigeix títol per llogar qualsevol embarcació a motor. Amb el titulí (curs d'1 dia, sense examen) portes les nostres llanxes, o surts amb patró professional. ★${R} Google.`,
    },
    fr: {
      title: `Bateaux Sans Permis Blanes : depuis octobre 2026, Titulín en 1 jour ou Skipper · ★${R}`,
      description: `Depuis le 1er octobre 2026, nous ne louons plus de bateaux sans permis à Blanes : la loi espagnole exige un permis pour louer tout bateau à moteur. Avec le titulín (cours d'1 jour, sans examen), vous pilotez nos bateaux à moteur, ou partez avec un skipper professionnel. ★${R} Google.`,
    },
    de: {
      title: `Boote ohne Führerschein Blanes: seit Oktober 2026 Titulín an 1 Tag oder Skipper · ★${R}`,
      description: `Seit dem 1. Oktober 2026 vermieten wir in Blanes keine führerscheinfreien Boote mehr: Das spanische Gesetz verlangt für jede Motorbootmiete einen Schein. Mit dem Titulín (1-Tages-Kurs, ohne Prüfung) fahren Sie unsere Motorboote selbst, oder Sie fahren mit einem professionellen Skipper. ★${R} Google.`,
    },
    nl: {
      title: `Boten zonder vaarbewijs Blanes: sinds oktober 2026 Titulín in 1 dag of Schipper · ★${R}`,
      description: `Sinds 1 oktober 2026 verhuren we in Blanes geen boten zonder vaarbewijs meer: de Spaanse wet eist een vaarbewijs om een motorboot te huren. Met de titulín (cursus van 1 dag, zonder examen) vaar je zelf met onze motorboten, of je vaart met een professionele schipper. ★${R} Google.`,
    },
    it: {
      title: `Barche senza patente Blanes: da ottobre 2026 Titulín in 1 giorno o Skipper · ★${R}`,
      description: `Dal 1 ottobre 2026 non noleggiamo più barche senza patente a Blanes: la legge spagnola richiede una patente per noleggiare qualsiasi barca a motore. Con il titulín (corso di 1 giorno, senza esame) guidi i nostri motoscafi, oppure esci con uno skipper professionista. ★${R} Google.`,
    },
    ru: {
      title: `Лодки без прав Бланес: с октября 2026 Titulín за 1 день или капитан · ★${R}`,
      description: `С 1 октября 2026 года мы больше не сдаём лодки без прав в Бланесе: закон Испании требует права для аренды любой моторной лодки. С titulín (курс за 1 день, без экзамена) вы сами управляете нашими катерами или выходите с профессиональным капитаном. ★${R} Google.`,
    },
  },
  "/alquiler-barcos-blanes": {
    es: {
      title: "Alquiler Barcos Puerto Blanes | Con Titulín (1 día) o Patrón",
      description: `Alquila barco en el Puerto de Blanes. Desde el 1 de octubre de 2026 con la Licencia de Navegación (curso de 1 día, sin examen) o con patrón. Parking gratis. ★${R} Google.`,
    },
    en: {
      title: "Boat Rental Blanes Port | Licence in 1 Day or Skipper",
      description: `Rent a boat at Blanes Port. From 1 October 2026 with the Licencia de Navegación (1-day course, no exam) or with a skipper. Free parking. ★${R} Google.`,
    },
    ca: {
      title: "Lloguer Barques Port de Blanes | Amb Titulí (1 dia) o Patró",
      description: `Lloga barca al Port de Blanes. Des de l'1 d'octubre de 2026 amb la Llicència de Navegació (curs d'1 dia, sense examen) o amb patró. Pàrquing gratis. ★${R} Google.`,
    },
    fr: {
      title: "Location Bateaux Blanes | Permis en 1 jour ou Skipper",
      description: `Louez un bateau au port de Blanes. Depuis le 1er octobre 2026 avec la Licencia de Navegación (cours d'1 jour, sans examen) ou avec skipper. Parking gratuit. ★${R} Google.`,
    },
    de: {
      title: "Bootsverleih Hafen Blanes | Schein an 1 Tag oder Skipper",
      description: `Boot mieten im Hafen Blanes. Seit dem 1. Oktober 2026 mit der Licencia de Navegación (1-Tages-Kurs, ohne Prüfung) oder mit Skipper. Parken gratis. ★${R} Google.`,
    },
    nl: {
      title: "Bootverhuur Blanes | Vaarbewijs in 1 dag of Schipper",
      description: `Huur een boot in de haven van Blanes. Sinds 1 oktober 2026 met de Licencia de Navegación (cursus van 1 dag, zonder examen) of met schipper. Gratis parkeren. ★${R} Google.`,
    },
    it: {
      title: "Noleggio Barche Blanes | Patente in 1 giorno o Skipper",
      description: `Noleggia una barca nel porto di Blanes. Dal 1 ottobre 2026 con la Licencia de Navegación (corso di 1 giorno, senza esame) o con skipper. Parcheggio gratuito. ★${R} Google.`,
    },
    ru: {
      title: "Аренда Лодок Порт Бланес | Права за 1 день или Капитан",
      description: `Аренда лодки в порту Бланеса. С 1 октября 2026 года с Licencia de Navegación (курс за 1 день, без экзамена) или с капитаном. Бесплатная парковка. ★${R} Google.`,
    },
  },
  "/alquiler-barcos-lloret-de-mar": {
    es: {
      title: `Alquilar Barco Lloret de Mar · Santa Cristina 25 min · Titulín o Patrón · ★${R}`,
      description: `Alquiler de barco a Lloret de Mar desde Blanes: Santa Cristina y Sa Boadella a 25 min. Desde el 1 de octubre de 2026 con la Licencia de Navegación (curso de 1 día) o con patrón. ★${R} Google. Reserva WhatsApp.`,
    },
    en: {
      title: `Boat Rental Lloret de Mar · Santa Cristina 25 min · Licence in 1 Day or Skipper · ★${R}`,
      description: `Boat rental to Lloret de Mar from Blanes: Santa Cristina and Sa Boadella in 25 min. From 1 October 2026 with the Licencia de Navegación (1-day course) or with a skipper. ★${R} Google. Book on WhatsApp.`,
    },
    ca: {
      title: `Lloguer de Vaixell a Lloret de Mar · Santa Cristina 25 min · Titulí o Patró · ★${R}`,
      description: `Lloguer de vaixell a Lloret de Mar des de Blanes: Santa Cristina i Sa Boadella a 25 min. Des de l'1 d'octubre de 2026 amb la Llicència de Navegació (curs d'1 dia) o amb patró. ★${R} Google. Reserva per WhatsApp.`,
    },
    fr: {
      title: `Location de Bateau à Lloret de Mar · Santa Cristina 25 min · Permis en 1 jour ou Skipper · ★${R}`,
      description: `Location de bateau vers Lloret de Mar depuis Blanes : Santa Cristina et Sa Boadella en 25 min. Depuis le 1er octobre 2026 avec la Licencia de Navegación (cours d'1 jour) ou avec skipper. ★${R} Google. Réservez sur WhatsApp.`,
    },
    de: {
      title: `Boot Mieten Lloret de Mar · Santa Cristina 25 Min · Schein an 1 Tag oder Skipper · ★${R}`,
      description: `Boot mieten nach Lloret de Mar ab Blanes: Santa Cristina und Sa Boadella in 25 Min. Seit dem 1. Oktober 2026 mit der Licencia de Navegación (1-Tages-Kurs) oder mit Skipper. ★${R} Google. Buchung per WhatsApp.`,
    },
    nl: {
      title: `Boot Huren Lloret de Mar · Santa Cristina 25 min · Vaarbewijs in 1 dag of Schipper · ★${R}`,
      description: `Boot huren naar Lloret de Mar vanaf Blanes: Santa Cristina en Sa Boadella in 25 min. Sinds 1 oktober 2026 met de Licencia de Navegación (cursus van 1 dag) of met schipper. ★${R} Google. Boek via WhatsApp.`,
    },
    it: {
      title: `Noleggio Barca a Lloret de Mar · Santa Cristina 25 min · Patente in 1 giorno o Skipper · ★${R}`,
      description: `Noleggio barca verso Lloret de Mar da Blanes: Santa Cristina e Sa Boadella in 25 min. Dal 1 ottobre 2026 con la Licencia de Navegación (corso di 1 giorno) o con skipper. ★${R} Google. Prenota su WhatsApp.`,
    },
    ru: {
      title: `Аренда Лодки в Льорет-де-Мар · Санта-Кристина 25 мин · Права за 1 день или Капитан · ★${R}`,
      description: `Аренда лодки в Льорет-де-Мар из Бланеса: Санта-Кристина и Са-Боаделья за 25 минут. С 1 октября 2026 года с Licencia de Navegación (курс за 1 день) или с капитаном. ★${R} Google. Бронь в WhatsApp.`,
    },
  },
  "/alquiler-barcos-tossa-de-mar": {
    nl: {
      description: `Vaar naar Tossa de Mar vanaf Blanes met een motorboot. Sinds 1 oktober 2026 met de Licencia de Navegación (vaarbewijs in 1 dag) of met schipper. ★${R} Google. Boek via WhatsApp.`,
    },
    en: { ogDescription: `Tossa by boat from Blanes: Vila Vella, Mar d'en Roig and Cala Llevadó. With the Licencia de Navegación (1-day course) or with a skipper. ★${R} Google.` },
    ca: { ogDescription: `Tossa en barca des de Blanes: Vila Vella, Mar d'en Roig i Cala Llevadó. Amb la Llicència de Navegació (curs d'1 dia) o amb patró. ★${R} Google.` },
    fr: { ogDescription: `Tossa en bateau depuis Blanes : Vila Vella, Mar d'en Roig et Cala Llevadó. Avec la Licencia de Navegación (cours d'1 jour) ou avec skipper. ★${R} Google.` },
    de: { ogDescription: `Tossa mit dem Boot ab Blanes: Vila Vella, Mar d'en Roig und Cala Llevadó. Mit der Licencia de Navegación (1-Tages-Kurs) oder mit Skipper. ★${R} Google.` },
    it: { ogDescription: `Tossa in barca da Blanes: Vila Vella, Mar d'en Roig e Cala Llevadó. Con la Licencia de Navegación (corso di 1 giorno) o con skipper. ★${R} Google.` },
    ru: { ogDescription: `Тосса на лодке из Бланеса: Вила-Велья, Мар-ден-Роиг и Кала-Льевадо. С Licencia de Navegación (курс за 1 день) или с капитаном. ★${R} Google.` },
  },
  "/alquiler-barcos-malgrat-de-mar": town("Malgrat de Mar", 10),
  "/alquiler-barcos-santa-susanna": town("Santa Susanna", 15),
  "/alquiler-barcos-calella": town("Calella", 20),
  "/alquiler-barcos-pineda-de-mar": town("Pineda de Mar", 18),
  "/alquiler-barcos-palafolls": town("Palafolls", 12),
  "/alquiler-barcos-tordera": town("Tordera", 15),
  "/alquiler-barcos-cerca-barcelona": town("Barcelona", 70),
  "/alquiler-barcos-costa-brava": {
    es: {
      title: `Alquiler Barcos Costa Brava | Titulín en 1 Día o Patrón | ★${R}`,
      description: `Alquila barco en la Costa Brava desde el Puerto de Blanes. Desde el 1 de octubre de 2026 con la Licencia de Navegación (curso de 1 día, sin examen) o con patrón. ★${R} Google.`,
    },
    en: {
      title: `Boat Rental Costa Brava | Licence in 1 Day or Skipper | ★${R}`,
      description: `Rent a boat on the Costa Brava from Blanes Port. From 1 October 2026 with the Licencia de Navegación (1-day course, no exam) or with a skipper. ★${R} Google.`,
    },
    ca: {
      title: `Lloguer Barques Costa Brava | Titulí en 1 Dia o Patró | ★${R}`,
      description: `Lloga barca a la Costa Brava des del Port de Blanes. Des de l'1 d'octubre de 2026 amb la Llicència de Navegació (curs d'1 dia, sense examen) o amb patró. ★${R} Google.`,
    },
    fr: {
      title: `Location Bateaux Costa Brava | Permis en 1 jour ou Skipper | ★${R}`,
      description: `Louez un bateau sur la Costa Brava depuis le port de Blanes. Depuis le 1er octobre 2026 avec la Licencia de Navegación (cours d'1 jour, sans examen) ou avec skipper. ★${R} Google.`,
    },
    de: {
      title: `Bootsverleih Costa Brava | Schein an 1 Tag oder Skipper | ★${R}`,
      description: `Boot mieten an der Costa Brava ab Hafen Blanes. Seit dem 1. Oktober 2026 mit der Licencia de Navegación (1-Tages-Kurs, ohne Prüfung) oder mit Skipper. ★${R} Google.`,
    },
    nl: {
      title: `Bootverhuur Costa Brava | Vaarbewijs in 1 dag of Schipper | ★${R}`,
      description: `Huur een boot aan de Costa Brava vanuit de haven van Blanes. Sinds 1 oktober 2026 met de Licencia de Navegación (cursus van 1 dag, zonder examen) of met schipper. ★${R} Google.`,
    },
    it: {
      title: `Noleggio Barche Costa Brava | Patente in 1 giorno o Skipper | ★${R}`,
      description: `Noleggia una barca sulla Costa Brava dal porto di Blanes. Dal 1 ottobre 2026 con la Licencia de Navegación (corso di 1 giorno, senza esame) o con skipper. ★${R} Google.`,
    },
    ru: {
      title: `Аренда Лодок Коста-Брава | Права за 1 день или Капитан | ★${R}`,
      description: `Аренда лодки на Коста-Браве из порта Бланеса. С 1 октября 2026 года с Licencia de Navegación (курс за 1 день, без экзамена) или с капитаном. ★${R} Google.`,
    },
  },
  "/precios": {
    es: {
      ogTitle: "Precios Alquiler Barcos Costa Brava | Con Titulín o Patrón",
      description: `Precios de alquiler de barcos en Blanes por temporada y duración. Desde el 1 de octubre de 2026 todos los barcos se alquilan con título: titulín en 1 día o salida con patrón. ★${R} Google.`,
    },
    en: { description: `Boat rental prices in Blanes by season and duration. From 1 October 2026 every boat is rented with a licence: titulín in 1 day or sail with a skipper. ★${R} Google.` },
    ca: { description: `Preus de lloguer de barques a Blanes per temporada i durada. Des de l'1 d'octubre de 2026 totes les barques es lloguen amb títol: titulí en 1 dia o sortida amb patró. ★${R} Google.` },
    fr: { description: `Tarifs de location de bateaux à Blanes par saison et durée. Depuis le 1er octobre 2026, chaque bateau se loue avec un permis : titulín en 1 jour ou sortie avec skipper. ★${R} Google.` },
    de: { description: `Bootsverleih-Preise in Blanes nach Saison und Dauer. Seit dem 1. Oktober 2026 wird jedes Boot mit Schein vermietet: Titulín an 1 Tag oder Ausfahrt mit Skipper. ★${R} Google.` },
    nl: { description: `Bootverhuurprijzen in Blanes per seizoen en duur. Sinds 1 oktober 2026 wordt elke boot met vaarbewijs verhuurd: titulín in 1 dag of varen met schipper. ★${R} Google.` },
    it: { description: `Prezzi di noleggio barche a Blanes per stagione e durata. Dal 1 ottobre 2026 ogni barca si noleggia con patente: titulín in 1 giorno o uscita con skipper. ★${R} Google.` },
    ru: { description: `Цены на аренду лодок в Бланесе по сезону и длительности. С 1 октября 2026 года все лодки сдаются с правами: titulín за 1 день или выход с капитаном. ★${R} Google.` },
  },
  "/salidas-compartidas": {
    es: { description: "Navega y conoce gente nueva desde Blanes. Comparte un barco pequeño (con titulín desde octubre de 2026), reparte el coste y disfruta de 4 horas de calas." },
    en: { description: "Sail from Blanes and meet new people. Share a small boat (titulín required from October 2026), split the cost and enjoy 4 hours of coves." },
    ca: { description: "Navega i coneix gent nova des de Blanes. Comparteix una barca petita (amb titulí des d'octubre de 2026), reparteix el cost i gaudeix de 4 hores de cales." },
    fr: { description: "Naviguez depuis Blanes et rencontrez de nouvelles personnes. Partagez un petit bateau (titulín requis depuis octobre 2026), divisez le coût et profitez de 4 heures de criques." },
    de: { description: "Segeln Sie ab Blanes und lernen Sie neue Leute kennen. Teilen Sie sich ein kleines Boot (Titulín ab Oktober 2026), teilen Sie die Kosten und genießen Sie 4 Stunden Buchten." },
    nl: { description: "Vaar vanuit Blanes en ontmoet nieuwe mensen. Deel een kleine boot (titulín vereist sinds oktober 2026), deel de kosten en geniet van 4 uur baaien." },
    it: { description: "Naviga da Blanes e conosci gente nuova. Condividi una barca piccola (titulín richiesto da ottobre 2026), dividi il costo e goditi 4 ore tra le cale." },
    ru: { description: "Выходите в море из Бланеса и знакомьтесь с новыми людьми. Разделите небольшую лодку (titulín с октября 2026), разделите расходы и наслаждайтесь 4 часами бухт." },
  },
  "/booking": {
    es: { description: "Reserva tu barco en Blanes en minutos. Con titulín o con patrón, desde 2 horas. Respuesta inmediata por WhatsApp." },
    en: { description: "Book your boat in Blanes in minutes. With the titulín or with a skipper, from 2 hours. Instant WhatsApp response." },
    ca: { description: "Reserva la teva barca a Blanes en minuts. Amb titulí o amb patró, des de 2 hores. Resposta immediata per WhatsApp." },
    fr: { description: "Réservez votre bateau à Blanes en minutes. Avec le titulín ou avec skipper, dès 2 heures. Réponse WhatsApp instantanée." },
    de: { description: "Buchen Sie Ihr Boot in Blanes in Minuten. Mit Titulín oder mit Skipper, ab 2 Stunden. Sofortige WhatsApp-Antwort." },
    nl: { description: "Reserveer je boot in Blanes in enkele minuten. Met titulín of met schipper, vanaf 2 uur. Direct antwoord via WhatsApp." },
    it: { description: "Prenota la tua barca a Blanes in pochi minuti. Con titulín o con skipper, da 2 ore. Risposta WhatsApp immediata." },
    ru: { description: "Забронируйте лодку в Бланесе за минуты. С titulín или с капитаном, от 2 часов. Мгновенный ответ в WhatsApp." },
  },
  "/excursion-snorkel-barco-blanes": activity({
    es: ["Snorkel en Barco Blanes", "Excursión de snorkel en barco desde Blanes: calas de aguas cristalinas, fauna marina y equipo de snorkel como extra."],
    en: ["Snorkel Boat Trip Blanes", "Snorkel boat trip from Blanes: crystal-clear coves, marine life and snorkel gear as an extra."],
    ca: ["Snorkel en Barca Blanes", "Excursió de snorkel en barca des de Blanes: cales d'aigües cristal·lines, fauna marina i equip de snorkel com a extra."],
    fr: ["Snorkeling en Bateau Blanes", "Excursion snorkeling en bateau depuis Blanes : criques aux eaux cristallines, faune marine et équipement de snorkeling en option."],
    de: ["Schnorcheln per Boot Blanes", "Schnorchel-Bootsausflug ab Blanes: kristallklare Buchten, Meeresfauna und Schnorchelausrüstung als Extra."],
    nl: ["Snorkelen per Boot Blanes", "Snorkelboottocht vanuit Blanes: kristalheldere baaien, zeeleven en snorkeluitrusting als extra."],
    it: ["Snorkeling in Barca Blanes", "Escursione di snorkeling in barca da Blanes: calette cristalline, fauna marina e attrezzatura da snorkeling come extra."],
    ru: ["Снорклинг на Лодке Бланес", "Снорклинг-экскурсия на лодке из Бланеса: кристально чистые бухты, морская фауна и снаряжение для снорклинга за доплату."],
  }),
  "/barco-familias-costa-brava": activity({
    es: ["Barco para Familias Blanes", "Alquiler de barco para familias en Blanes: barcos estables y seguros para niños."],
    en: ["Family Boat Rental Blanes", "Family boat rental in Blanes: stable boats, safe for children."],
    ca: ["Barca per a Famílies Blanes", "Lloguer de barca per a famílies a Blanes: barques estables i segures per a nens."],
    fr: ["Bateau en Famille Blanes", "Location de bateau pour familles à Blanes : bateaux stables et sûrs pour les enfants."],
    de: ["Familienboot Blanes", "Bootsverleih für Familien in Blanes: stabile Boote, sicher für Kinder."],
    nl: ["Gezinsboot Blanes", "Bootverhuur voor gezinnen in Blanes: stabiele boten, veilig voor kinderen."],
    it: ["Barca per Famiglie Blanes", "Noleggio barca per famiglie a Blanes: barche stabili e sicure per i bambini."],
    ru: ["Лодка для Семей Бланес", "Аренда лодки для семей в Бланесе: устойчивые лодки, безопасные для детей."],
  }),
  "/paseo-atardecer-barco-blanes": activity({
    es: ["Barco al Atardecer Blanes", "Paseo en barco al atardecer desde Blanes: puesta de sol sobre la Costa Brava y calas doradas."],
    en: ["Sunset Boat Trip Blanes", "Sunset boat trip from Blanes: golden coves and the sun setting over the Costa Brava."],
    ca: ["Barca al Capvespre Blanes", "Passeig en barca al capvespre des de Blanes: posta de sol sobre la Costa Brava i cales daurades."],
    fr: ["Bateau Coucher de Soleil Blanes", "Balade en bateau au coucher de soleil depuis Blanes : lumière dorée sur la Costa Brava et ses criques."],
    de: ["Sonnenuntergang per Boot Blanes", "Bootstour zum Sonnenuntergang ab Blanes: goldene Stunde über der Costa Brava und ihren Buchten."],
    nl: ["Boot bij Zonsondergang Blanes", "Boottocht bij zonsondergang vanuit Blanes: gouden uur boven de Costa Brava en haar baaien."],
    it: ["Barca al Tramonto Blanes", "Gita in barca al tramonto da Blanes: ora dorata sulla Costa Brava e calette dorate."],
    ru: ["Лодка на Закате Бланес", "Прогулка на лодке на закате из Бланеса: золотой час над Коста-Бравой и её бухтами."],
  }),
  "/pesca-barco-blanes": activity({
    es: ["Pesca en Barco Blanes", "Pesca recreativa en barco desde Blanes: lubinas, doradas y sargos en aguas de la Costa Brava."],
    en: ["Fishing Boat Trip Blanes", "Recreational fishing by boat from Blanes: sea bass, bream and sargo in Costa Brava waters."],
    ca: ["Pesca en Barca Blanes", "Pesca recreativa en barca des de Blanes: llobarros, orades i sards a la Costa Brava."],
    fr: ["Pêche en Bateau Blanes", "Pêche récréative en bateau depuis Blanes : bars, dorades et sars dans les eaux de la Costa Brava."],
    de: ["Angeln per Boot Blanes", "Freizeitangeln per Boot ab Blanes: Wolfsbarsch, Dorade und Brasse in den Gewässern der Costa Brava."],
    nl: ["Vissen per Boot Blanes", "Recreatief vissen per boot vanuit Blanes: zeebaars, dorade en zeebrasem in de wateren van de Costa Brava."],
    it: ["Pesca in Barca Blanes", "Pesca ricreativa in barca da Blanes: spigole, orate e saraghi nelle acque della Costa Brava."],
    ru: ["Рыбалка на Лодке Бланес", "Любительская рыбалка на лодке из Бланеса: сибас, дорада и сарг в водах Коста-Бравы."],
  }),
  "/boat-rental-costa-brava": allLangs({
    title: "Boat Rental Costa Brava | Licence in 1 Day or Skipper, Blanes",
    description: `Rent a boat in Blanes, Costa Brava. From 1 October 2026 every renter needs the Licencia de Navegación (1-day course, no exam) or sails with a skipper. ★${R} Google.`,
  }),
  "/boat-rental-blanes": allLangs({
    title: "Boat Rental Blanes Port | Licence in 1 Day or Skipper",
    description: `Rent a boat at Blanes Port. From 1 October 2026 with the Licencia de Navegación (1-day course, no exam) or with a skipper. April to October. ★${R} Google.`,
  }),
};

/**
 * seo-config page names → STATIC_META keys, so the client can look up the same map.
 * Only pages with a post-era entry are listed; anything else resolves to nothing.
 */
export const SEO_PAGE_TO_META_KEY: Record<string, string> = {
  categoryLicenseFree: "/barcos-sin-licencia",
  locationBlanes: "/alquiler-barcos-blanes",
  locationLloret: "/alquiler-barcos-lloret-de-mar",
  locationTossa: "/alquiler-barcos-tossa-de-mar",
  locationMalgrat: "/alquiler-barcos-malgrat-de-mar",
  locationSantaSusanna: "/alquiler-barcos-santa-susanna",
  locationCalella: "/alquiler-barcos-calella",
  locationBarcelona: "/alquiler-barcos-cerca-barcelona",
  locationCostaBrava: "/alquiler-barcos-costa-brava",
  pricing: "/precios",
  sharedSailing: "/salidas-compartidas",
  booking: "/booking",
  activitySnorkel: "/excursion-snorkel-barco-blanes",
  activityFamilies: "/barco-familias-costa-brava",
  activitySunset: "/paseo-atardecer-barco-blanes",
  activityFishing: "/pesca-barco-blanes",
  boatRentalCostaBrava: "/boat-rental-costa-brava",
  boatRentalBlanes: "/boat-rental-blanes",
};

/**
 * Apply the post-era override to a meta object. Before 2026-10-01 (Madrid) it returns
 * `base` untouched. An overridden title/description also replaces the OG twin unless the
 * override sets it explicitly, so a social preview never keeps the old promise.
 */
export function postEraMeta<T extends PostEraFields>(metaKey: string, lang: string, base: T, now: Date = new Date()): T {
  if (isLicenseFreeEraActive(now)) return base;
  const o = POST_ERA_META[metaKey]?.[lang];
  if (!o) return base;
  return {
    ...base,
    ...o,
    ogTitle: o.ogTitle ?? o.title ?? base.ogTitle,
    ogDescription: o.ogDescription ?? o.description ?? base.ogDescription,
  };
}
