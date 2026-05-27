// Nautical glossary — single source of truth for the 18 essential boating
// terms used by /glosario (UI), seo-schemas (JSON-LD DefinedTermSet emitted in
// each page's <head>) and /api/ai-glossary (machine-readable endpoint for
// answer-engine consumption).
//
// Keep ES authoritative; localized variants live in client/src/i18n/<lang>.ts
// under `t.glossaryPage.terms` and are validated by `npm run i18n:validate`.

export type GlossaryCategory =
  | "titulacion"
  | "unidad"
  | "accion"
  | "parte"
  | "equipamiento";

export interface GlossaryTerm {
  term: string;
  definition: string;
  category?: GlossaryCategory;
  inLanguage?: string;
}

export const NAUTICAL_GLOSSARY_ES: GlossaryTerm[] = [
  { term: "LN (Licencia de Navegación)", definition: "Titulación náutica española mínima reconocida por el RD 875/2014. Permite gobernar embarcaciones de hasta 6 metros de eslora, con motor adecuado al casco y hasta 2 millas náuticas de la costa, en horario diurno. Es la titulación mínima requerida para los barcos con licencia de nuestra flota (Mingolla Brava 19, Trimarchi 57S y Pacific Craft 625). Examen teórico + curso de seguridad básico.", category: "titulacion" },
  { term: "LNB (Licencia de Navegación Básica)", definition: "Titulación náutica española superior a la LN. Permite gobernar embarcaciones de hasta 8 metros de eslora y hasta 5 millas de la costa. Recomendable para quien quiera flexibilidad de zona. Válida de por vida tras aprobar el examen teórico + curso práctico.", category: "titulacion" },
  { term: "PER (Patrón de Embarcaciones de Recreo)", definition: "Titulación náutica española superior a la LNB. Permite gobernar embarcaciones de hasta 15 metros de eslora y hasta 12 millas de la costa. Requiere examen teórico + prácticas de navegación + radiocomunicaciones.", category: "titulacion" },
  { term: "PNB (Patrón de Navegación Básica)", definition: "Antigua titulación náutica reemplazada en 2014 por la LNB. Permite gobernar embarcaciones de hasta 8 metros hasta 5 millas. Los que la tengan siguen siendo válidos sin necesidad de actualizar a LNB.", category: "titulacion" },
  { term: "Milla náutica", definition: "Unidad de distancia marítima internacional equivalente a 1.852 metros (1,852 km). Las embarcaciones sin licencia en España pueden navegar hasta un máximo de 2 millas náuticas de la costa (3,7 km).", category: "unidad" },
  { term: "Nudo", definition: "Unidad de velocidad marítima equivalente a 1 milla náutica por hora (1,852 km/h). Las embarcaciones sin licencia están limitadas a 5 nudos (9,3 km/h). Los barcos con licencia pueden alcanzar mucha más velocidad.", category: "unidad" },
  { term: "Eslora", definition: "Longitud total del barco, medida de proa a popa. Unidad: metros. En España, la eslora determina la titulación náutica mínima: hasta 5m puede no requerir título, hasta 8m requiere LNB, hasta 15m requiere PER.", category: "unidad" },
  { term: "Manga", definition: "Anchura máxima del barco, medida de un costado a otro en su punto más ancho. Unidad: metros. Junto con la eslora define la estabilidad y espacio disponible a bordo.", category: "unidad" },
  { term: "CV (caballos de vapor)", definition: "Unidad de potencia del motor marino. Los barcos sin licencia en España están limitados a 15 CV. Los barcos con licencia típicamente tienen 40-150 CV, permitiendo navegación más rápida y alcance mayor.", category: "unidad" },
  { term: "Fondear", definition: "Acción de detener el barco lanzando el ancla al fondo marino para mantenerlo estático en una cala o zona sin amarre. Requiere elegir fondo arenoso (no rocoso), echar cabo suficiente (3-4 veces la profundidad) y verificar que el ancla agarra.", category: "accion" },
  { term: "Cala", definition: "Ensenada pequeña y abrigada en la costa, típicamente rodeada de acantilados o vegetación. En la Costa Brava existen decenas de calas accesibles solo por mar, con aguas cristalinas y fondos rocosos ideales para snorkel.", category: "parte" },
  { term: "Puerto deportivo", definition: "Instalación portuaria destinada a embarcaciones de recreo con amarres, servicios de combustible, agua, electricidad y varadero. El Puerto de Blanes (Girona) es el puerto deportivo náutico de referencia en la Costa Brava Sur.", category: "parte" },
  { term: "Proa", definition: "Parte delantera del barco, opuesta a la popa. En barcos de recreo suele llevar el solárium principal y la luz de navegación blanca.", category: "parte" },
  { term: "Popa", definition: "Parte trasera del barco, opuesta a la proa. Aloja el motor fuera borda, la escalera de baño y típicamente la zona de mesa central.", category: "parte" },
  { term: "Estribor", definition: "Lado derecho del barco mirando desde popa hacia proa. Se identifica por la luz verde de navegación. Regla de oro: 'Estribor = derecho' (ambas empiezan con E).", category: "parte" },
  { term: "Babor", definition: "Lado izquierdo del barco mirando desde popa hacia proa. Se identifica por la luz roja de navegación.", category: "parte" },
  { term: "Bimini / Toldo bimini", definition: "Toldo desplegable que cubre la bañera del barco proporcionando sombra. Esencial para navegación con niños o en verano. La mayoría de nuestros barcos sin licencia lo incorporan de serie.", category: "equipamiento" },
  { term: "Solárium", definition: "Zona acolchada del barco destinada a tumbarse al sol, típicamente en proa o popa. Los barcos premium tienen solárium doble (proa y popa).", category: "equipamiento" },
  { term: "Bañera", definition: "Zona central del barco donde se ubican los asientos, el puesto de gobierno y la mesa. Es el espacio operativo del barco durante la navegación.", category: "parte" },
];
