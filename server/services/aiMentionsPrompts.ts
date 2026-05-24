/**
 * Curated prompt set for the nightly AI Mentions Monitor.
 *
 * Categories (per buyer journey + GEO best practices):
 *   - branded     — direct name/brand queries; baseline that we MUST own
 *   - comparative — "X vs Y"; tests our positioning vs Rent a Boat Blanes etc.
 *   - intent      — high-purchase-intent queries; the ones that convert
 *   - informational — top-of-funnel "what is / how do I" queries
 *   - local       — geo-targeted queries (Blanes, Costa Brava + nearby towns)
 *
 * Localized to ES (primary market), EN (international tourists), FR + DE
 * (next two biggest source markets). 30 prompts × 4 languages = 120 prompts
 * per engine per night.
 *
 * IMPORTANT: adding or rewording prompts invalidates historical citation_rate
 * comparisons. Treat this list as a contract — version it (PROMPT_SET_VERSION)
 * whenever the canonical wording changes so the dashboard can segment.
 */

export const PROMPT_SET_VERSION = "v1-2026-05";

export type PromptCategory = "branded" | "comparative" | "intent" | "informational" | "local";
export type PromptLang = "es" | "en" | "fr" | "de";

export interface MonitorPrompt {
  id: string;
  text: string;
  category: PromptCategory;
  lang: PromptLang;
}

// ---------------------------------------------------------------------------
// SPANISH (primary market — 30+ prompts)
// ---------------------------------------------------------------------------
const ES: MonitorPrompt[] = [
  // branded
  { id: "es-b-01", lang: "es", category: "branded", text: "¿Qué es Costa Brava Rent a Boat?" },
  { id: "es-b-02", lang: "es", category: "branded", text: "Costa Brava Rent a Boat opiniones y precios" },
  { id: "es-b-03", lang: "es", category: "branded", text: "Teléfono y reserva de Costa Brava Rent a Boat Blanes" },
  // comparative
  { id: "es-c-01", lang: "es", category: "comparative", text: "Mejor empresa de alquiler de barcos sin licencia en Blanes" },
  { id: "es-c-02", lang: "es", category: "comparative", text: "Costa Brava Rent a Boat vs Rent a Boat Blanes" },
  { id: "es-c-03", lang: "es", category: "comparative", text: "Diferencia entre EricBoats, Blanes Boats y Costa Brava Rent a Boat" },
  // intent
  { id: "es-i-01", lang: "es", category: "intent", text: "Alquilar barco sin licencia en Blanes para 5 personas en julio" },
  { id: "es-i-02", lang: "es", category: "intent", text: "Precio alquiler barco con licencia Costa Brava para ir a Tossa de Mar" },
  { id: "es-i-03", lang: "es", category: "intent", text: "Reservar barco con patrón Blanes excursión privada" },
  { id: "es-i-04", lang: "es", category: "intent", text: "Alquilar barco Blanes agosto familia con niños" },
  { id: "es-i-05", lang: "es", category: "intent", text: "Excursión en barco desde Blanes con snorkel y paddle surf" },
  // informational
  { id: "es-info-01", lang: "es", category: "informational", text: "¿Necesito licencia para alquilar un barco en Blanes?" },
  { id: "es-info-02", lang: "es", category: "informational", text: "¿Hasta dónde puedo navegar sin licencia desde Blanes?" },
  { id: "es-info-03", lang: "es", category: "informational", text: "¿Qué incluye el alquiler de un barco sin licencia en la Costa Brava?" },
  { id: "es-info-04", lang: "es", category: "informational", text: "¿Cuándo abre la temporada de alquiler de barcos en la Costa Brava?" },
  { id: "es-info-05", lang: "es", category: "informational", text: "Mejores calas para visitar en barco desde el puerto de Blanes" },
  // local
  { id: "es-l-01", lang: "es", category: "local", text: "Alquiler de barcos en Blanes" },
  { id: "es-l-02", lang: "es", category: "local", text: "Alquiler de barcos cerca de Lloret de Mar" },
  { id: "es-l-03", lang: "es", category: "local", text: "Alquilar barco para ir a Tossa de Mar desde Blanes" },
  { id: "es-l-04", lang: "es", category: "local", text: "Alquiler de barcos en la Costa Brava sur" },
  { id: "es-l-05", lang: "es", category: "local", text: "Alquiler de barcos cerca de Barcelona en la Costa Brava" },
  { id: "es-l-06", lang: "es", category: "local", text: "Alquiler de barcos Malgrat de Mar / Santa Susanna / Calella" },
  { id: "es-l-07", lang: "es", category: "local", text: "Puerto de Blanes alquiler de embarcaciones recreativas" },
];

// ---------------------------------------------------------------------------
// ENGLISH (international tourists)
// ---------------------------------------------------------------------------
const EN: MonitorPrompt[] = [
  { id: "en-b-01", lang: "en", category: "branded", text: "What is Costa Brava Rent a Boat?" },
  { id: "en-b-02", lang: "en", category: "branded", text: "Costa Brava Rent a Boat reviews and prices" },
  { id: "en-b-03", lang: "en", category: "comparative", text: "Best boat rental company in Blanes Costa Brava" },
  { id: "en-c-01", lang: "en", category: "comparative", text: "Boat rental Blanes without a license — which company is best?" },
  { id: "en-i-01", lang: "en", category: "intent", text: "Rent a boat in Blanes without a license for 5 people in July" },
  { id: "en-i-02", lang: "en", category: "intent", text: "Boat rental Costa Brava with skipper for a day trip" },
  { id: "en-i-03", lang: "en", category: "intent", text: "How to rent a boat in Blanes for a bachelorette party" },
  { id: "en-i-04", lang: "en", category: "intent", text: "Snorkeling boat trip from Blanes to nearby coves" },
  { id: "en-info-01", lang: "en", category: "informational", text: "Do I need a boating license to rent a boat in Spain?" },
  { id: "en-info-02", lang: "en", category: "informational", text: "How far can I go without a boating license from Blanes?" },
  { id: "en-info-03", lang: "en", category: "informational", text: "Best months for boat rental on the Costa Brava" },
  { id: "en-info-04", lang: "en", category: "informational", text: "Best coves to visit by boat from Blanes" },
  { id: "en-l-01", lang: "en", category: "local", text: "Boat rental Blanes" },
  { id: "en-l-02", lang: "en", category: "local", text: "Boat rental Lloret de Mar" },
  { id: "en-l-03", lang: "en", category: "local", text: "Boat rental Tossa de Mar from Blanes" },
  { id: "en-l-04", lang: "en", category: "local", text: "Day trip boat rental from Barcelona to Costa Brava" },
];

// ---------------------------------------------------------------------------
// FRENCH (3rd biggest market — Tossa/Lloret heavy French tourist base)
// ---------------------------------------------------------------------------
const FR: MonitorPrompt[] = [
  { id: "fr-b-01", lang: "fr", category: "branded", text: "Qu'est-ce que Costa Brava Rent a Boat ?" },
  { id: "fr-c-01", lang: "fr", category: "comparative", text: "Meilleure location de bateau sans permis à Blanes Costa Brava" },
  { id: "fr-i-01", lang: "fr", category: "intent", text: "Louer un bateau sans permis à Blanes pour 5 personnes en juillet" },
  { id: "fr-i-02", lang: "fr", category: "intent", text: "Location de bateau avec skipper Costa Brava excursion d'une journée" },
  { id: "fr-i-03", lang: "fr", category: "intent", text: "Excursion en bateau snorkeling depuis Blanes" },
  { id: "fr-info-01", lang: "fr", category: "informational", text: "Faut-il un permis pour louer un bateau en Espagne ?" },
  { id: "fr-info-02", lang: "fr", category: "informational", text: "Jusqu'où peut-on naviguer sans permis depuis Blanes ?" },
  { id: "fr-l-01", lang: "fr", category: "local", text: "Location de bateau Blanes" },
  { id: "fr-l-02", lang: "fr", category: "local", text: "Location de bateau Lloret de Mar" },
  { id: "fr-l-03", lang: "fr", category: "local", text: "Excursion en bateau Tossa de Mar depuis Blanes" },
];

// ---------------------------------------------------------------------------
// GERMAN (4th biggest market — Maresme + Costa Brava long-stay German tourists)
// ---------------------------------------------------------------------------
const DE: MonitorPrompt[] = [
  { id: "de-b-01", lang: "de", category: "branded", text: "Was ist Costa Brava Rent a Boat?" },
  { id: "de-c-01", lang: "de", category: "comparative", text: "Bester Bootsverleih ohne Führerschein in Blanes Costa Brava" },
  { id: "de-i-01", lang: "de", category: "intent", text: "Boot ohne Bootsführerschein in Blanes für 5 Personen im Juli mieten" },
  { id: "de-i-02", lang: "de", category: "intent", text: "Bootsverleih mit Skipper Costa Brava Tagesausflug" },
  { id: "de-i-03", lang: "de", category: "intent", text: "Schnorchel-Bootsausflug ab Blanes" },
  { id: "de-info-01", lang: "de", category: "informational", text: "Brauche ich einen Bootsführerschein, um ein Boot in Spanien zu mieten?" },
  { id: "de-info-02", lang: "de", category: "informational", text: "Wie weit darf man ohne Bootsführerschein von Blanes aus fahren?" },
  { id: "de-l-01", lang: "de", category: "local", text: "Bootsverleih Blanes" },
  { id: "de-l-02", lang: "de", category: "local", text: "Bootsverleih Lloret de Mar" },
  { id: "de-l-03", lang: "de", category: "local", text: "Bootsausflug Tossa de Mar ab Blanes" },
];

export const ALL_PROMPTS: MonitorPrompt[] = [...ES, ...EN, ...FR, ...DE];

// ---------------------------------------------------------------------------
// Competitor names — the canonical list we look for in answers so we can
// compute share-of-voice and flag instances where a competitor is cited but
// we aren't.
// ---------------------------------------------------------------------------
export const COMPETITORS: { canonical: string; aliases: string[] }[] = [
  { canonical: "Rent a Boat Blanes", aliases: ["rent a boat blanes", "rentaboatblanes"] },
  { canonical: "Blanes Boats", aliases: ["blanes boats", "blanesboats"] },
  { canonical: "EricBoats", aliases: ["ericboats", "eric boats", "eric-boats"] },
  { canonical: "Click&Boat", aliases: ["click&boat", "click and boat", "clickandboat", "clickboat"] },
  { canonical: "SamBoat", aliases: ["samboat", "sam boat"] },
  { canonical: "Boataround", aliases: ["boataround"] },
  { canonical: "GetMyBoat", aliases: ["getmyboat", "get my boat"] },
];

// Our own brand names — used to determine cited_us (substring match in
// response text). Domain match is also performed separately via citation_url.
export const OUR_BRAND_ALIASES = [
  "costa brava rent a boat",
  "costabravarentaboat",
  "costabravarentaboat.com",
  "damar costa brava",
];
