/**
 * Post-era SEO meta (RD 1188/2025). From 2026-10-01 renting any motorboat requires a
 * nautical qualification, so every title/description that still promises "sin licencia"
 * has to tell the truth from that day on: the same small boats are rented, but with the
 * Licencia de Navegación (titulín, a 1-day course) or with a skipper.
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
    description: `¿Alojado en ${n}? El Puerto de Blanes está a ${m} min. Desde el 1 de octubre de 2026 alquilas con la Licencia de Navegación (curso de 1 día, sin examen) o sales con patrón. Gasolina incluida en los barcos pequeños. ★${R} Google.`,
  }),
  en: (n, m) => ({
    title: `Boat Rental ${n} | Blanes Port ${m} min | Licence in 1 Day or Skipper`,
    description: `Staying in ${n}? Blanes Port is ${m} min away. From 1 October 2026 you rent with the Licencia de Navegación (1-day course, no exam) or sail with a skipper. Fuel included on the small boats. ★${R} Google.`,
  }),
  ca: (n, m) => ({
    title: `Lloguer Barca ${n} | Port Blanes a ${m} min | Titulí o Patró`,
    description: `Allotjat a ${n}? El Port de Blanes és a ${m} min. Des de l'1 d'octubre de 2026 llogues amb la Llicència de Navegació (curs d'1 dia, sense examen) o surts amb patró. Benzina inclosa a les barques petites. ★${R} Google.`,
  }),
  fr: (n, m) => ({
    title: `Location Bateau ${n} | Port Blanes à ${m} min | Permis en 1 jour ou Skipper`,
    description: `En séjour à ${n} ? Le port de Blanes est à ${m} min. Depuis le 1er octobre 2026, vous louez avec la Licencia de Navegación (cours d'1 jour, sans examen) ou partez avec un skipper. Carburant inclus sur les petits bateaux. ★${R} Google.`,
  }),
  de: (n, m) => ({
    title: `Bootsverleih ${n} | Hafen Blanes ${m} Min | Schein an 1 Tag oder Skipper`,
    description: `Urlaub in ${n}? Der Hafen Blanes ist ${m} Min entfernt. Seit dem 1. Oktober 2026 mieten Sie mit der Licencia de Navegación (1-Tages-Kurs, ohne Prüfung) oder fahren mit Skipper. Kraftstoff bei den kleinen Booten inklusive. ★${R} Google.`,
  }),
  nl: (n, m) => ({
    title: `Bootverhuur ${n} | Haven Blanes op ${m} min | Vaarbewijs in 1 dag of Schipper`,
    description: `Op vakantie in ${n}? De haven van Blanes is ${m} min verderop. Sinds 1 oktober 2026 huur je met de Licencia de Navegación (cursus van 1 dag, zonder examen) of vaar je met een schipper. Brandstof inbegrepen bij de kleine boten. ★${R} Google.`,
  }),
  it: (n, m) => ({
    title: `Noleggio Barca ${n} | Porto Blanes a ${m} min | Patente in 1 giorno o Skipper`,
    description: `In vacanza a ${n}? Il porto di Blanes è a ${m} min. Dal 1 ottobre 2026 noleggi con la Licencia de Navegación (corso di 1 giorno, senza esame) o esci con uno skipper. Carburante incluso sulle barche piccole. ★${R} Google.`,
  }),
  ru: (n, m) => ({
    title: `Аренда Лодки ${n} | Порт Бланес ${m} мин | Права за 1 день или Капитан`,
    description: `Отдыхаете в ${n}? Порт Бланеса в ${m} мин. С 1 октября 2026 года аренда с Licencia de Navegación (курс за 1 день, без экзамена) или выход с капитаном. Топливо включено на небольших лодках. ★${R} Google.`,
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

export const POST_ERA_META: Record<string, LangMap> = {
  "/barcos-sin-licencia": {
    es: {
      title: `Barcos Sin Licencia Blanes: desde octubre 2026 con Titulín (1 día) · ★${R}`,
      description: `Los 4 barcos pequeños del Puerto de Blanes (hasta 15 CV, 5 plazas, gasolina incluida) siguen alquilándose, pero desde el 1 de octubre de 2026 la ley pide la Licencia de Navegación: curso de 1 día, sin examen. ★${R} Google.`,
    },
    en: {
      title: `Licence-Free Boats Blanes: from October 2026 with the Titulín (1-day licence) · ★${R}`,
      description: `Our 4 small boats in Blanes harbour (up to 15 HP, 5 seats, fuel included) are still for rent, but from 1 October 2026 Spanish law requires the Licencia de Navegación: a 1-day course, no exam. ★${R} Google.`,
    },
    ca: {
      title: `Barques Sense Llicència Blanes: des d'octubre 2026 amb Titulí (1 dia) · ★${R}`,
      description: `Les 4 barques petites del Port de Blanes (fins a 15 CV, 5 places, benzina inclosa) es continuen llogant, però des de l'1 d'octubre de 2026 la llei demana la Llicència de Navegació: curs d'1 dia, sense examen. ★${R} Google.`,
    },
    fr: {
      title: `Bateaux Sans Permis Blanes : dès octobre 2026 avec le Titulín (permis en 1 jour) · ★${R}`,
      description: `Nos 4 petits bateaux du port de Blanes (15 CV max, 5 places, carburant inclus) restent à louer, mais depuis le 1er octobre 2026 la loi espagnole exige la Licencia de Navegación : un cours d'1 jour, sans examen. ★${R} Google.`,
    },
    de: {
      title: `Boote ohne Führerschein Blanes: ab Oktober 2026 mit Titulín (Schein an 1 Tag) · ★${R}`,
      description: `Unsere 4 kleinen Boote im Hafen Blanes (bis 15 PS, 5 Plätze, Kraftstoff inklusive) sind weiter mietbar, aber seit dem 1. Oktober 2026 verlangt das spanische Gesetz die Licencia de Navegación: 1-Tages-Kurs, ohne Prüfung. ★${R} Google.`,
    },
    nl: {
      title: `Boten zonder vaarbewijs Blanes: vanaf oktober 2026 met Titulín (vaarbewijs in 1 dag) · ★${R}`,
      description: `Onze 4 kleine boten in de haven van Blanes (tot 15 pk, 5 plaatsen, brandstof inbegrepen) blijven te huur, maar sinds 1 oktober 2026 eist de Spaanse wet de Licencia de Navegación: cursus van 1 dag, zonder examen. ★${R} Google.`,
    },
    it: {
      title: `Barche senza patente Blanes: da ottobre 2026 con Titulín (patente in 1 giorno) · ★${R}`,
      description: `Le nostre 4 barche piccole nel porto di Blanes (fino a 15 CV, 5 posti, carburante incluso) restano a noleggio, ma dal 1 ottobre 2026 la legge spagnola richiede la Licencia de Navegación: corso di 1 giorno, senza esame. ★${R} Google.`,
    },
    ru: {
      title: `Лодки без прав Бланес: с октября 2026 с Titulín (права за 1 день) · ★${R}`,
      description: `Наши 4 небольшие лодки в порту Бланеса (до 15 л.с., 5 мест, топливо включено) по-прежнему сдаются, но с 1 октября 2026 закон Испании требует Licencia de Navegación: курс за 1 день, без экзамена. ★${R} Google.`,
    },
  },
  "/alquiler-barcos-blanes": {
    es: {
      title: "Alquiler Barcos Puerto Blanes | Con Titulín (1 día) o Patrón",
      description: `Alquila barco en el Puerto de Blanes. Desde el 1 de octubre de 2026 con la Licencia de Navegación (curso de 1 día, sin examen) o con patrón. Gasolina incluida en los barcos pequeños, parking gratis. ★${R} Google.`,
    },
    en: {
      title: "Boat Rental Blanes Port | Licence in 1 Day or Skipper",
      description: `Rent a boat at Blanes Port. From 1 October 2026 with the Licencia de Navegación (1-day course, no exam) or with a skipper. Fuel included on the small boats, free parking. ★${R} Google.`,
    },
    ca: {
      title: "Lloguer Barques Port de Blanes | Amb Titulí (1 dia) o Patró",
      description: `Lloga barca al Port de Blanes. Des de l'1 d'octubre de 2026 amb la Llicència de Navegació (curs d'1 dia, sense examen) o amb patró. Benzina inclosa a les barques petites, pàrquing gratis. ★${R} Google.`,
    },
    fr: {
      title: "Location Bateaux Blanes | Permis en 1 jour ou Skipper",
      description: `Louez un bateau au port de Blanes. Depuis le 1er octobre 2026 avec la Licencia de Navegación (cours d'1 jour, sans examen) ou avec skipper. Carburant inclus sur les petits bateaux, parking gratuit. ★${R} Google.`,
    },
    de: {
      title: "Bootsverleih Hafen Blanes | Schein an 1 Tag oder Skipper",
      description: `Boot mieten im Hafen Blanes. Seit dem 1. Oktober 2026 mit der Licencia de Navegación (1-Tages-Kurs, ohne Prüfung) oder mit Skipper. Kraftstoff bei den kleinen Booten inklusive, Parken gratis. ★${R} Google.`,
    },
    nl: {
      title: "Bootverhuur Blanes | Vaarbewijs in 1 dag of Schipper",
      description: `Huur een boot in de haven van Blanes. Sinds 1 oktober 2026 met de Licencia de Navegación (cursus van 1 dag, zonder examen) of met schipper. Brandstof inbegrepen bij de kleine boten, gratis parkeren. ★${R} Google.`,
    },
    it: {
      title: "Noleggio Barche Blanes | Patente in 1 giorno o Skipper",
      description: `Noleggia una barca nel porto di Blanes. Dal 1 ottobre 2026 con la Licencia de Navegación (corso di 1 giorno, senza esame) o con skipper. Carburante incluso sulle barche piccole, parcheggio gratuito. ★${R} Google.`,
    },
    ru: {
      title: "Аренда Лодок Порт Бланес | Права за 1 день или Капитан",
      description: `Аренда лодки в порту Бланеса. С 1 октября 2026 года с Licencia de Navegación (курс за 1 день, без экзамена) или с капитаном. Топливо включено на небольших лодках, бесплатная парковка. ★${R} Google.`,
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
      description: `Alquila barco en la Costa Brava desde el Puerto de Blanes. Desde el 1 de octubre de 2026 con la Licencia de Navegación (curso de 1 día, sin examen) o con patrón. Gasolina incluida en los barcos pequeños. ★${R} Google.`,
    },
    en: {
      title: `Boat Rental Costa Brava | Licence in 1 Day or Skipper | ★${R}`,
      description: `Rent a boat on the Costa Brava from Blanes Port. From 1 October 2026 with the Licencia de Navegación (1-day course, no exam) or with a skipper. Fuel included on the small boats. ★${R} Google.`,
    },
    ca: {
      title: `Lloguer Barques Costa Brava | Titulí en 1 Dia o Patró | ★${R}`,
      description: `Lloga barca a la Costa Brava des del Port de Blanes. Des de l'1 d'octubre de 2026 amb la Llicència de Navegació (curs d'1 dia, sense examen) o amb patró. Benzina inclosa a les barques petites. ★${R} Google.`,
    },
    fr: {
      title: `Location Bateaux Costa Brava | Permis en 1 jour ou Skipper | ★${R}`,
      description: `Louez un bateau sur la Costa Brava depuis le port de Blanes. Depuis le 1er octobre 2026 avec la Licencia de Navegación (cours d'1 jour, sans examen) ou avec skipper. Carburant inclus sur les petits bateaux. ★${R} Google.`,
    },
    de: {
      title: `Bootsverleih Costa Brava | Schein an 1 Tag oder Skipper | ★${R}`,
      description: `Boot mieten an der Costa Brava ab Hafen Blanes. Seit dem 1. Oktober 2026 mit der Licencia de Navegación (1-Tages-Kurs, ohne Prüfung) oder mit Skipper. Kraftstoff bei den kleinen Booten inklusive. ★${R} Google.`,
    },
    nl: {
      title: `Bootverhuur Costa Brava | Vaarbewijs in 1 dag of Schipper | ★${R}`,
      description: `Huur een boot aan de Costa Brava vanuit de haven van Blanes. Sinds 1 oktober 2026 met de Licencia de Navegación (cursus van 1 dag, zonder examen) of met schipper. Brandstof inbegrepen bij de kleine boten. ★${R} Google.`,
    },
    it: {
      title: `Noleggio Barche Costa Brava | Patente in 1 giorno o Skipper | ★${R}`,
      description: `Noleggia una barca sulla Costa Brava dal porto di Blanes. Dal 1 ottobre 2026 con la Licencia de Navegación (corso di 1 giorno, senza esame) o con skipper. Carburante incluso sulle barche piccole. ★${R} Google.`,
    },
    ru: {
      title: `Аренда Лодок Коста-Брава | Права за 1 день или Капитан | ★${R}`,
      description: `Аренда лодки на Коста-Браве из порта Бланеса. С 1 октября 2026 года с Licencia de Navegación (курс за 1 день, без экзамена) или с капитаном. Топливо включено на небольших лодках. ★${R} Google.`,
    },
  },
  "/precios": {
    es: { description: `Precios de alquiler de barcos en Blanes por temporada y duración. Desde el 1 de octubre de 2026 todos los barcos se alquilan con título: titulín en 1 día o salida con patrón. Gasolina incluida en los barcos pequeños. ★${R} Google.` },
    en: { description: `Boat rental prices in Blanes by season and duration. From 1 October 2026 every boat is rented with a licence: titulín in 1 day or sail with a skipper. Fuel included on the small boats. ★${R} Google.` },
    ca: { description: `Preus de lloguer de barques a Blanes per temporada i durada. Des de l'1 d'octubre de 2026 totes les barques es lloguen amb títol: titulí en 1 dia o sortida amb patró. Benzina inclosa a les barques petites. ★${R} Google.` },
    fr: { description: `Tarifs de location de bateaux à Blanes par saison et durée. Depuis le 1er octobre 2026, chaque bateau se loue avec un permis : titulín en 1 jour ou sortie avec skipper. Carburant inclus sur les petits bateaux. ★${R} Google.` },
    de: { description: `Bootsverleih-Preise in Blanes nach Saison und Dauer. Seit dem 1. Oktober 2026 wird jedes Boot mit Schein vermietet: Titulín an 1 Tag oder Ausfahrt mit Skipper. Kraftstoff bei den kleinen Booten inklusive. ★${R} Google.` },
    nl: { description: `Bootverhuurprijzen in Blanes per seizoen en duur. Sinds 1 oktober 2026 wordt elke boot met vaarbewijs verhuurd: titulín in 1 dag of varen met schipper. Brandstof inbegrepen bij de kleine boten. ★${R} Google.` },
    it: { description: `Prezzi di noleggio barche a Blanes per stagione e durata. Dal 1 ottobre 2026 ogni barca si noleggia con patente: titulín in 1 giorno o uscita con skipper. Carburante incluso sulle barche piccole. ★${R} Google.` },
    ru: { description: `Цены на аренду лодок в Бланесе по сезону и длительности. С 1 октября 2026 года все лодки сдаются с правами: titulín за 1 день или выход с капитаном. Топливо включено на небольших лодках. ★${R} Google.` },
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
    es: { description: "Reserva tu barco en Blanes en minutos. Con titulín o con patrón, desde 1 hora. Respuesta inmediata por WhatsApp." },
    en: { description: "Book your boat in Blanes in minutes. With the titulín or with a skipper, from 1 hour. Instant WhatsApp response." },
    ca: { description: "Reserva la teva barca a Blanes en minuts. Amb titulí o amb patró, des d'1 hora. Resposta immediata per WhatsApp." },
    fr: { description: "Réservez votre bateau à Blanes en minutes. Avec le titulín ou avec skipper, dès 1 heure. Réponse WhatsApp instantanée." },
    de: { description: "Buchen Sie Ihr Boot in Blanes in Minuten. Mit Titulín oder mit Skipper, ab 1 Stunde. Sofortige WhatsApp-Antwort." },
    nl: { description: "Reserveer je boot in Blanes in enkele minuten. Met titulín of met schipper, vanaf 1 uur. Direct antwoord via WhatsApp." },
    it: { description: "Prenota la tua barca a Blanes in pochi minuti. Con titulín o con skipper, da 1 ora. Risposta WhatsApp immediata." },
    ru: { description: "Забронируйте лодку в Бланесе за минуты. С titulín или с капитаном, от 1 часа. Мгновенный ответ в WhatsApp." },
  },
  "/excursion-snorkel-barco-blanes": {
    es: { description: `Excursión de snorkel en barco desde Blanes: calas de aguas cristalinas, fauna marina, equipo incluido. Con titulín (curso de 1 día) o con patrón desde octubre de 2026. ★${R} Google.` },
    en: { description: `Snorkel boat trip from Blanes: crystal-clear coves, marine life, gear included. With the titulín (1-day licence) or with a skipper from October 2026. ★${R} Google.` },
  },
  "/barco-familias-costa-brava": {
    es: { description: `Alquiler de barco para familias en Blanes: barcos estables y seguros para niños, gasolina incluida. Con titulín (curso de 1 día) o con patrón desde octubre de 2026. ★${R} Google.` },
    en: { description: `Family boat rental in Blanes: stable boats, safe for children, fuel included. With the titulín (1-day licence) or with a skipper from October 2026. ★${R} Google.` },
  },
  "/paseo-atardecer-barco-blanes": {
    es: { description: `Paseo en barco al atardecer desde Blanes: puesta de sol sobre la Costa Brava y calas doradas. Con titulín (curso de 1 día) o con patrón desde octubre de 2026. ★${R} Google.` },
    en: { description: `Sunset boat trip from Blanes: golden coves and the sun setting over the Costa Brava. With the titulín (1-day licence) or with a skipper from October 2026. ★${R} Google.` },
  },
  "/pesca-barco-blanes": {
    es: { description: `Pesca recreativa en barco desde Blanes: lubinas, doradas y sargos en aguas de la Costa Brava. Con titulín (curso de 1 día) o con patrón desde octubre de 2026. ★${R} Google.` },
    en: { description: `Recreational fishing by boat from Blanes: sea bass, bream and sargo in Costa Brava waters. With the titulín (1-day licence) or with a skipper from October 2026. ★${R} Google.` },
  },
  "/boat-rental-costa-brava": allLangs({
    title: "Boat Rental Costa Brava | Licence in 1 Day or Skipper, Blanes",
    description: `Rent a boat in Blanes, Costa Brava. From 1 October 2026 every renter needs the Licencia de Navegación (1-day course, no exam) or sails with a skipper. Fuel included on the small boats. ★${R} Google.`,
  }),
  "/boat-rental-blanes": allLangs({
    title: "Boat Rental Blanes Port | Licence in 1 Day or Skipper",
    description: `Rent a boat at Blanes Port. From 1 October 2026 with the Licencia de Navegación (1-day course, no exam) or with a skipper. Fuel included on the small boats. April to October. ★${R} Google.`,
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
