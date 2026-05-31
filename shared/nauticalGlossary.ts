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
  | "equipamiento"
  | "seguridad"
  | "meteo";

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
  { term: "PY (Patrón de Yate)", definition: "Titulación náutica española superior al PER. Permite gobernar embarcaciones de hasta 24 metros de eslora y hasta 150 millas de la costa. Amplía el PER con navegación, meteorología e inglés técnico. No hace falta para ningún barco de nuestra flota, pero es la referencia para navegación de altura.", category: "titulacion" },
  { term: "Calado", definition: "Profundidad que necesita un barco para flotar sin tocar fondo, medida desde la línea de flotación hasta el punto más bajo de la quilla o la hélice. Unidad: metros. Las embarcaciones de recreo ligeras tienen calados pequeños, lo que permite acercarse a calas poco profundas.", category: "unidad" },
  { term: "Rumbo", definition: "Dirección hacia la que navega el barco, medida en grados (0° a 360°) respecto al norte: 0°/360° norte, 90° este, 180° sur, 270° oeste. Mantener un rumbo constante es la base de la navegación entre Blanes y las calas de la Costa Brava.", category: "unidad" },
  { term: "Singladura", definition: "Distancia recorrida o navegación realizada en un día. En navegación de recreo costera se usa de forma coloquial para referirse a la salida o jornada de mar completa.", category: "unidad" },
  { term: "Braza", definition: "Antigua unidad de profundidad equivalente a 1,8288 metros (6 pies). Todavía aparece en algunas cartas náuticas y entre marineros para referirse al fondo o a la longitud de cabo largado al fondear.", category: "unidad" },
  { term: "Atracar", definition: "Maniobra de aproximar y amarrar el barco a un muelle, pantalán o embarcadero. Requiere controlar la velocidad, anticipar el viento y la corriente y proteger el casco con defensas.", category: "accion" },
  { term: "Largar amarras", definition: "Soltar los cabos que sujetan el barco al amarre para iniciar la navegación; lo contrario de amarrar. Coloquialmente, 'largar amarras' equivale a zarpar.", category: "accion" },
  { term: "Virar", definition: "Cambiar el rumbo del barco girando la proa hacia un lado. También describe el giro completo para invertir el sentido de la marcha.", category: "accion" },
  { term: "Capear", definition: "Aguantar el mal tiempo o la mar gruesa manteniendo el barco con la proa o la amura al oleaje y a poca velocidad, para minimizar el balanceo y los golpes de mar.", category: "accion" },
  { term: "Dar avante / dar atrás", definition: "Órdenes de máquina. 'Dar avante' es propulsar el barco hacia adelante; 'dar atrás' (o ciar) es propulsarlo hacia atrás. Esenciales en maniobras de puerto y al fondear.", category: "accion" },
  { term: "Aproar", definition: "Orientar la proa del barco hacia un punto concreto: el oleaje, el viento o el rumbo deseado. Aproar a la mar es la técnica básica para navegar con seguridad cuando hay olas.", category: "accion" },
  { term: "Quilla", definition: "Pieza longitudinal en la base del casco que da estabilidad y rigidez al barco y reduce la deriva lateral. En embarcaciones ligeras a motor es poco pronunciada.", category: "parte" },
  { term: "Casco", definition: "Cuerpo o estructura flotante del barco, que lo mantiene a flote y soporta el resto de elementos. Lo más común en recreo es la fibra de vidrio; también los hay de aluminio o madera.", category: "parte" },
  { term: "Timón", definition: "Pieza móvil situada bajo la popa que, al girar, desvía el flujo de agua y hace que el barco cambie de rumbo. Se gobierna con la rueda o la caña del puesto de gobierno.", category: "parte" },
  { term: "Hélice", definition: "Pieza giratoria de palas que, accionada por el motor, impulsa el barco al desplazar el agua. En los motores fueraborda va integrada en la cola del motor.", category: "parte" },
  { term: "Amura", definition: "Zona del costado del barco próxima a la proa, entre esta y el través. Se habla de amura de babor o de estribor; 'mar de amura' es el oleaje que llega por esa zona.", category: "parte" },
  { term: "Aleta", definition: "Zona del costado del barco próxima a la popa, entre el través y la popa. Se habla de aleta de babor o de estribor.", category: "parte" },
  { term: "Línea de flotación", definition: "Línea donde la superficie del agua toca el casco con el barco a flote y con su carga normal. Separa la obra viva (sumergida) de la obra muerta (emergida).", category: "parte" },
  { term: "Ancla", definition: "Pieza de metal que se lanza al fondo marino, unida al barco por cadena o cabo, para fondear y mantener la posición. El rezón es un tipo de ancla ligera de varias uñas habitual en embarcaciones pequeñas.", category: "equipamiento" },
  { term: "Cabo", definition: "Nombre marinero de toda cuerda a bordo: nunca se dice 'cuerda'. Los cabos sirven para amarrar, fondear, remolcar o sujetar elementos del barco.", category: "equipamiento" },
  { term: "Defensas", definition: "Elementos cilíndricos o esféricos, normalmente inflables, que se cuelgan del costado para proteger el casco de golpes contra el muelle u otras embarcaciones al atracar.", category: "equipamiento" },
  { term: "Cornamusa", definition: "Pieza metálica con forma de T fijada en cubierta donde se hacen firmes los cabos de amarre. Permite asegurar y soltar el cabo con rapidez.", category: "equipamiento" },
  { term: "Ecosonda", definition: "Instrumento que mide la profundidad del agua bajo el casco emitiendo ultrasonidos y midiendo el eco del fondo. Imprescindible para fondear con seguridad y evitar embarrancar.", category: "equipamiento" },
  { term: "GPS y carta náutica", definition: "El GPS da la posición del barco por satélite; el plotter la representa sobre una carta náutica electrónica con profundidades, balizas y peligros. La carta náutica es el mapa oficial del mar.", category: "equipamiento" },
  { term: "Chaleco salvavidas", definition: "Equipo individual de flotación obligatorio a bordo, uno por persona. Mantiene a flote a quien cae al agua. Su uso es obligatorio en situaciones de riesgo y muy recomendable para menores y no nadadores.", category: "seguridad" },
  { term: "Aro salvavidas", definition: "Flotador circular que se lanza a una persona caída al agua para que se agarre mientras se la recupera. Suele llevar una rabiza (cabo) y, en algunos casos, luz de localización.", category: "seguridad" },
  { term: "Hombre al agua", definition: "Emergencia en la que una persona cae al mar. La maniobra consiste en señalar al accidentado, no perderlo de vista, lanzar un aro salvavidas y regresar aproando con cuidado para recogerlo por sotavento.", category: "seguridad" },
  { term: "Bengalas y señales de socorro", definition: "Material de seguridad pirotécnico (bengalas de mano, cohetes con paracaídas, señales de humo) para pedir ayuda y ser localizado en caso de emergencia en la mar.", category: "seguridad" },
  { term: "VHF (Canal 16)", definition: "Radio de muy alta frecuencia para comunicaciones marítimas. El canal 16 es la frecuencia internacional de socorro, urgencia y llamada, monitorizada por Salvamento Marítimo.", category: "seguridad" },
  { term: "Botiquín de a bordo", definition: "Conjunto de material sanitario, obligatorio según la zona de navegación, para atender mareos, cortes, quemaduras solares y pequeñas urgencias durante la salida.", category: "seguridad" },
  { term: "Tramontana", definition: "Viento fuerte, frío y seco del norte característico del Golfo de León y del norte de la Costa Brava. Puede levantarse con rapidez y complicar la navegación; conviene consultar la previsión antes de salir de Blanes.", category: "meteo" },
  { term: "Garbí (Garbino)", definition: "Viento del suroeste típico de las tardes de verano en la Costa Brava, asociado a la brisa marina. Suele ser moderado y refrescante, aunque puede rizar la mar por la tarde.", category: "meteo" },
  { term: "Migjorn", definition: "Viento del sur (mediodía) en la costa catalana. Cálido y húmedo, suele anunciar cambio de tiempo y aumento del oleaje.", category: "meteo" },
  { term: "Mar de fondo", definition: "Oleaje formado por viento lejano o ya pasado que llega a la costa como olas largas y regulares, aun sin viento local. Puede hacer incómodo el fondeo en calas expuestas.", category: "meteo" },
  { term: "Marejada y mar rizada", definition: "Estados de la mar según la altura de las olas: 'mar rizada' son olas muy pequeñas (hasta 0,5 m) y 'marejada' olas de 0,5 a 1,25 m. Son términos del parte meteorológico marítimo.", category: "meteo" },
  { term: "Banderas de baño", definition: "Señalización de playa: bandera verde (baño permitido), amarilla (precaución, baño con limitaciones) y roja (baño prohibido). Orientan también sobre el estado de la mar para salir en barco.", category: "meteo" },
  { term: "Parte meteorológico marítimo", definition: "Previsión específica para la mar (viento, estado de la mar, visibilidad y fenómenos) emitida por la AEMET por zonas. Consultarlo antes de cada salida es la primera norma de seguridad.", category: "meteo" },
];
