/**
 * Boat text that lives in the database, not in the code.
 *
 * Rows in `boats` are typed from the CRM in Spanish, so every surface that
 * shows them (boat pages, fleet grid, pricing table, SSR meta) needs the same
 * lookup. It lives in shared/ so the server can translate the very same
 * strings it prerenders.
 */
const boatTextTranslations: Record<string, Record<string, string>> = {
  // === Subtitles (9 unique) ===
  "Sin licencia · 5 personas · Para disfrutar del sol": {
    en: "No licence required · 5 people · For sun lovers",
    fr: "Sans permis · 5 personnes · Pour profiter du soleil",
    de: "Ohne Fuehrerschein · 5 Personen · Zum Sonnenbaden",
    nl: "Geen vaarbewijs · 5 personen · Voor zonliefhebbers",
    it: "Senza patente · 5 persone · Per gli amanti del sole",
    ru: "Bez licenzii · 5 chelovek · Dlya lyubitelej solnca",
    ca: "Sense llicencia · 5 persones · Per gaudir del sol",
  },
  "Sin licencia · 5 personas · El favorito de parejas y familias": {
    en: "No licence required · 5 people · Couples & families favourite",
    fr: "Sans permis · 5 personnes · Le prefere des couples et familles",
    de: "Ohne Fuehrerschein · 5 Personen · Liebling von Paaren und Familien",
    nl: "Geen vaarbewijs · 5 personen · Favoriet van koppels en gezinnen",
    it: "Senza patente · 5 persone · Il preferito di coppie e famiglie",
    ru: "Bez licenzii · 5 chelovek · Ljubimyj u par i semej",
    ca: "Sense llicencia · 5 persones · El favorit de parelles i families",
  },
  "Sin licencia · 5 personas · Disponibilidad extra": {
    en: "No licence required · 5 people · Extra availability",
    fr: "Sans permis · 5 personnes · Disponibilite supplementaire",
    de: "Ohne Fuehrerschein · 5 Personen · Zusaetzliche Verfuegbarkeit",
    nl: "Geen vaarbewijs · 5 personen · Extra beschikbaarheid",
    it: "Senza patente · 5 persone · Disponibilita extra",
    ru: "Bez licenzii · 5 chelovek · Dopolnitel'naya dostupnost'",
    ca: "Sense llicencia · 5 persones · Disponibilitat extra",
  },
  "Sin licencia · 4 personas · El mejor precio por persona": {
    en: "No licence required · 4 people · Best price per person",
    fr: "Sans permis · 4 personnes · Le meilleur prix par personne",
    de: "Ohne Fuehrerschein · 4 Personen · Bester Preis pro Person",
    nl: "Geen vaarbewijs · 4 personen · Beste prijs per persoon",
    it: "Senza patente · 4 persone · Il miglior prezzo a persona",
    ru: "Bez licenzii · 4 cheloveka · Luchshaya cena za cheloveka",
    ca: "Sense llicencia · 4 persones · El millor preu per persona",
  },
  "Sin licencia · 5 personas · Premium con bluetooth": {
    en: "No licence required · 5 people · Premium with bluetooth",
    fr: "Sans permis · 5 personnes · Premium avec bluetooth",
    de: "Ohne Fuehrerschein · 5 Personen · Premium mit Bluetooth",
    nl: "Geen vaarbewijs · 5 personen · Premium met bluetooth",
    it: "Senza patente · 5 persone · Premium con bluetooth",
    ru: "Bez licenzii · 5 chelovek · Premium s bluetooth",
    ca: "Sense llicencia · 5 persones · Premium amb bluetooth",
  },
  "Con licencia · 6 personas · Lloret en 15 min, Tossa en 30": {
    en: "Licence required · 6 people · Lloret in 15 min, Tossa in 30",
    fr: "Avec permis · 6 personnes · Lloret en 15 min, Tossa en 30",
    de: "Mit Fuehrerschein · 6 Personen · Lloret in 15 Min, Tossa in 30",
    nl: "Vaarbewijs vereist · 6 personen · Lloret in 15 min, Tossa in 30",
    it: "Con patente · 6 persone · Lloret in 15 min, Tossa in 30",
    ru: "S licenziej · 6 chelovek · Lloret za 15 min, Tossa za 30",
    ca: "Amb llicencia · 6 persones · Lloret en 15 min, Tossa en 30",
  },
  "Con licencia · 7 personas · Adrenalina para grupos": {
    en: "Licence required · 7 people · Adrenaline for groups",
    fr: "Avec permis · 7 personnes · Adrenaline pour les groupes",
    de: "Mit Fuehrerschein · 7 Personen · Adrenalin fuer Gruppen",
    nl: "Vaarbewijs vereist · 7 personen · Adrenaline voor groepen",
    it: "Con patente · 7 persone · Adrenalina per gruppi",
    ru: "S licenziej · 7 chelovek · Adrenalin dlya grupp",
    ca: "Amb llicencia · 7 persones · Adrenalina per a grups",
  },
  "Con licencia · 7 personas · La experiencia de lujo": {
    en: "Licence required · 7 people · The luxury experience",
    fr: "Avec permis · 7 personnes · L'experience de luxe",
    de: "Mit Fuehrerschein · 7 Personen · Das Luxus-Erlebnis",
    nl: "Vaarbewijs vereist · 7 personen · De luxe ervaring",
    it: "Con patente · 7 persone · L'esperienza di lusso",
    ru: "S licenziej · 7 chelovek · Roskoshnyj opyt",
    ca: "Amb llicencia · 7 persones · L'experiencia de luxe",
  },
  "Con patrón · 7 personas · Experiencia VIP": {
    en: "With skipper · 7 people · VIP experience",
    fr: "Avec skipper · 7 personnes · Experience VIP",
    de: "Mit Skipper · 7 Personen · VIP-Erlebnis",
    nl: "Met schipper · 7 personen · VIP-ervaring",
    it: "Con skipper · 7 persone · Esperienza VIP",
    ru: "S shkhiperom · 7 chelovek · VIP-opyt",
    ca: "Amb patro · 7 persones · Experiencia VIP",
  },

  // === Included items (6 unique) ===
  IVA: {
    en: "VAT",
    fr: "TVA",
    de: "MwSt.",
    nl: "BTW",
    it: "IVA",
    ru: "NDS",
    ca: "IVA",
  },
  Carburante: {
    en: "Fuel",
    fr: "Carburant",
    de: "Kraftstoff",
    nl: "Brandstof",
    it: "Carburante",
    ru: "Toplivo",
    ca: "Combustible",
  },
  Amarre: {
    en: "Mooring",
    fr: "Amarrage",
    de: "Liegeplatz",
    nl: "Aanlegplaats",
    it: "Ormeggio",
    ru: "Shvartovka",
    ca: "Amarratge",
  },
  Limpieza: {
    en: "Cleaning",
    fr: "Nettoyage",
    de: "Reinigung",
    nl: "Reiniging",
    it: "Pulizia",
    ru: "Uborka",
    ca: "Neteja",
  },
  // Retirado el 2026-07-30: prometía un seguro de accidentes de ocupantes que la
  // póliza no tiene. Si el CRM vuelve a escribir este rótulo en un barco, se
  // traduce al alcance real en vez de reproducir la promesa (art. 61.2 TRLGDCU:
  // lo publicado es exigible por el consumidor). Ver INSURANCE_SCOPE_ES.
  "Seguro embarcación y ocupantes": {
    en: "Third-party liability insurance",
    fr: "Assurance responsabilite civile",
    de: "Haftpflichtversicherung",
    nl: "Aansprakelijkheidsverzekering",
    it: "Assicurazione di responsabilita civile",
    ru: "Strahovanie grazhdanskoj otvetstvennosti",
    ca: "Assegurança de responsabilitat civil",
  },
  "Patron profesional": {
    en: "Professional skipper",
    fr: "Skipper professionnel",
    de: "Professioneller Skipper",
    nl: "Professionele schipper",
    it: "Skipper professionale",
    ru: "Professional'nyj shkhiper",
    ca: "Patro professional",
  },

  // === Features (26 unique) ===
  "Sin licencia requerida": {
    en: "No licence required",
    fr: "Sans permis requis",
    de: "Kein Fuehrerschein erforderlich",
    nl: "Geen vaarbewijs vereist",
    it: "Nessuna patente richiesta",
    ru: "Licenziya ne trebuetsya",
    ca: "Sense llicencia requerida",
  },
  "Hasta 5 personas": {
    en: "Up to 5 people",
    fr: "Jusqu'a 5 personnes",
    de: "Bis zu 5 Personen",
    nl: "Tot 5 personen",
    it: "Fino a 5 persone",
    ru: "Do 5 chelovek",
    ca: "Fins a 5 persones",
  },
  "Gasolina incluida": {
    en: "Fuel included",
    fr: "Carburant inclus",
    de: "Kraftstoff inklusive",
    nl: "Brandstof inbegrepen",
    it: "Carburante incluso",
    ru: "Toplivo vklyucheno",
    ca: "Gasolina inclosa",
  },
  "Seguro incluido": {
    en: "Insurance included",
    fr: "Assurance incluse",
    de: "Versicherung inklusive",
    nl: "Verzekering inbegrepen",
    it: "Assicurazione inclusa",
    ru: "Strakhovka vklyuchena",
    ca: "Asseguranca inclosa",
  },
  "Equipo de seguridad": {
    en: "Safety equipment",
    fr: "Equipement de securite",
    de: "Sicherheitsausruestung",
    nl: "Veiligheidsuitrusting",
    it: "Equipaggiamento di sicurezza",
    ru: "Oborudovanie bezopasnosti",
    ca: "Equip de seguretat",
  },
  "Escalera de baño": {
    en: "Bathing ladder",
    fr: "Echelle de bain",
    de: "Badeleiter",
    nl: "Zwemladder",
    it: "Scaletta da bagno",
    ru: "Kupol'naya lestnica",
    ca: "Escala de bany",
  },
  "Hasta 4 personas": {
    en: "Up to 4 people",
    fr: "Jusqu'a 4 personnes",
    de: "Bis zu 4 Personen",
    nl: "Tot 4 personen",
    it: "Fino a 4 persone",
    ru: "Do 4 chelovek",
    ca: "Fins a 4 persones",
  },
  "Perfecta para parejas": {
    en: "Perfect for couples",
    fr: "Parfait pour les couples",
    de: "Perfekt fuer Paare",
    nl: "Perfect voor koppels",
    it: "Perfetta per coppie",
    ru: "Ideal'na dlya par",
    ca: "Perfecta per a parelles",
  },
  "Equipo de música": {
    en: "Sound system",
    fr: "Systeme audio",
    de: "Soundsystem",
    nl: "Geluidsinstallatie",
    it: "Impianto audio",
    ru: "Muzykal'naya sistema",
    ca: "Equip de musica",
  },
  "Más espaciosa": {
    en: "More spacious",
    fr: "Plus spacieux",
    de: "Geraeumiger",
    nl: "Ruimer",
    it: "Piu spaziosa",
    ru: "Bolee prostornaya",
    ca: "Mes espaiosa",
  },
  "Licencia de Navegación Básica requerida": {
    en: "Basic navigation licence (LNB) required",
    fr: "Permis de navigation basique (LNB) requis",
    de: "Basis-Navigationsschein (LNB) erforderlich",
    nl: "Basisvaarbewijs (LNB) vereist",
    it: "Patente di navigazione base (LNB) richiesta",
    ru: "Trebuetsya bazovaya licenziya (LNB)",
    ca: "Llicència de Navegació Bàsica (LNB) requerida",
  },
  "Licencia Básica requerida": {
    en: "Basic navigation licence (LNB) required",
    fr: "Permis de navigation basique (LNB) requis",
    de: "Basis-Navigationsschein (LNB) erforderlich",
    nl: "Basisvaarbewijs (LNB) vereist",
    it: "Patente di navigazione base (LNB) richiesta",
    ru: "Trebuetsya bazovaya licenziya (LNB)",
    ca: "Llicència de Navegació Bàsica (LNB) requerida",
  },
  "Hasta 6 personas": {
    en: "Up to 6 people",
    fr: "Jusqu'a 6 personnes",
    de: "Bis zu 6 Personen",
    nl: "Tot 6 personen",
    it: "Fino a 6 persone",
    ru: "Do 6 chelovek",
    ca: "Fins a 6 persones",
  },
  "GPS y sonda incluidos": {
    en: "GPS & fish finder included",
    fr: "GPS et sondeur inclus",
    de: "GPS & Echolot inklusive",
    nl: "GPS & dieptemeter inbegrepen",
    it: "GPS e ecoscandaglio inclusi",
    ru: "GPS i ehkholot vklyucheny",
    ca: "GPS i sonda inclosos",
  },
  "Ducha agua dulce": {
    en: "Freshwater shower",
    fr: "Douche eau douce",
    de: "Suesswasserdusche",
    nl: "Zoetwaterdouche",
    it: "Doccia acqua dolce",
    ru: "Dush s presnoj vodoj",
    ca: "Dutxa d'aigua dolca",
  },
  "Deportiva elegante": {
    en: "Sporty & elegant",
    fr: "Sportif et elegant",
    de: "Sportlich & elegant",
    nl: "Sportief & elegant",
    it: "Sportiva ed elegante",
    ru: "Sportivnaya i ehlegantnaya",
    ca: "Esportiva i elegant",
  },
  "Combustible NO incluido": {
    en: "Fuel NOT included",
    fr: "Carburant NON inclus",
    de: "Kraftstoff NICHT inklusive",
    nl: "Brandstof NIET inbegrepen",
    it: "Carburante NON incluso",
    ru: "Toplivo NE vklyucheno",
    ca: "Combustible NO inclos",
  },
  "Hasta 7 personas": {
    en: "Up to 7 people",
    fr: "Jusqu'a 7 personnes",
    de: "Bis zu 7 Personen",
    nl: "Tot 7 personen",
    it: "Fino a 7 persone",
    ru: "Do 7 chelovek",
    ca: "Fins a 7 persones",
  },
  "Ideal para velocidad": {
    en: "Ideal for speed",
    fr: "Ideal pour la vitesse",
    de: "Ideal fuer Geschwindigkeit",
    nl: "Ideaal voor snelheid",
    it: "Ideale per la velocita",
    ru: "Ideal'na dlya skorosti",
    ca: "Ideal per a velocitat",
  },
  "Mesa central": {
    en: "Central table",
    fr: "Table centrale",
    de: "Zentraler Tisch",
    nl: "Centrale tafel",
    it: "Tavolo centrale",
    ru: "Central'nyj stol",
    ca: "Taula central",
  },
  "Embarcación premium": {
    en: "Premium vessel",
    fr: "Embarcation premium",
    de: "Premium-Boot",
    nl: "Premiumvaartuig",
    it: "Imbarcazione premium",
    ru: "Premium sudno",
    ca: "Embarcacio premium",
  },
  "Mesa para comidas": {
    en: "Dining table",
    fr: "Table a manger",
    de: "Esstisch",
    nl: "Eettafel",
    it: "Tavolo da pranzo",
    ru: "Obedennyj stol",
    ca: "Taula per a menjar",
  },
  "Lujo y confort": {
    en: "Luxury & comfort",
    fr: "Luxe et confort",
    de: "Luxus & Komfort",
    nl: "Luxe & comfort",
    it: "Lusso e comfort",
    ru: "Roskosh' i komfort",
    ca: "Luxe i confort",
  },
  "No requiere licencia": {
    en: "No licence required",
    fr: "Sans permis",
    de: "Kein Fuehrerschein noetig",
    nl: "Geen vaarbewijs nodig",
    it: "Nessuna patente necessaria",
    ru: "Licenziya ne nuzhna",
    ca: "No requereix llicencia",
  },
  "Patron profesional incluido": {
    en: "Professional skipper included",
    fr: "Skipper professionnel inclus",
    de: "Professioneller Skipper inklusive",
    nl: "Professionele schipper inbegrepen",
    it: "Skipper professionale incluso",
    ru: "Professional'nyj shkhiper vklyuchen",
    ca: "Patro professional inclos",
  },
  "Calas escondidas y cuevas": {
    en: "Hidden coves & caves",
    fr: "Criques cachees et grottes",
    de: "Versteckte Buchten & Hoehlen",
    nl: "Verborgen baaien & grotten",
    it: "Calette nascoste e grotte",
    ru: "Skrytye bukhty i peshchery",
    ca: "Cales amagades i coves",
  },
  "Parada para nadar": {
    en: "Swimming stop",
    fr: "Arret baignade",
    de: "Badestopp",
    nl: "Zwemstop",
    it: "Sosta per nuotare",
    ru: "Ostanovka dlya plavaniya",
    ca: "Parada per nedar",
  },

  // === Equipment items (25 unique) ===
  Toldo: {
    en: "Sunshade",
    fr: "Auvent",
    de: "Sonnenverdeck",
    nl: "Zonnetent",
    it: "Tendalino",
    ru: "Tent",
    ca: "Tendal",
  },
  "Arranque eléctrico": {
    en: "Electric start",
    fr: "Demarrage electrique",
    de: "Elektrostart",
    nl: "Elektrische start",
    it: "Avviamento elettrico",
    ru: "Ehlektricheskij zapusk",
    ca: "Arrencada electrica",
  },
  "Gran solárium de proa": {
    en: "Large bow sundeck",
    fr: "Grand solarium de proue",
    de: "Grosses Bug-Sonnendeck",
    nl: "Groot voordek zonnedek",
    it: "Ampio solarium di prua",
    ru: "Bol'shoj solyarij na nosu",
    ca: "Gran solarium de proa",
  },
  "Equipo de seguridad y salvamento": {
    en: "Safety & rescue equipment",
    fr: "Equipement de securite et sauvetage",
    de: "Sicherheits- & Rettungsausruestung",
    nl: "Veiligheids- & reddingsuitrusting",
    it: "Equipaggiamento di sicurezza e salvataggio",
    ru: "Oborudovanie bezopasnosti i spaseniya",
    ca: "Equip de seguretat i salvament",
  },
  "Toldo Bi Mini": {
    en: "Bimini top",
    fr: "Taud bimini",
    de: "Bimini-Verdeck",
    nl: "Bimini-kap",
    it: "Tendalino bimini",
    ru: "Tent bimini",
    ca: "Tendal bimini",
  },
  "Equipo de música bluetooth": {
    en: "Bluetooth sound system",
    fr: "Systeme audio bluetooth",
    de: "Bluetooth-Soundsystem",
    nl: "Bluetooth-geluidsinstallatie",
    it: "Impianto audio bluetooth",
    ru: "Bluetooth muzykal'naya sistema",
    ca: "Equip de musica bluetooth",
  },
  "Radio bluetooth": {
    en: "Bluetooth radio",
    fr: "Radio bluetooth",
    de: "Bluetooth-Radio",
    nl: "Bluetooth-radio",
    it: "Radio bluetooth",
    ru: "Bluetooth radio",
    ca: "Radio bluetooth",
  },
  Altavoces: {
    en: "Speakers",
    fr: "Haut-parleurs",
    de: "Lautsprecher",
    nl: "Luidsprekers",
    it: "Altoparlanti",
    ru: "Dinamiki",
    ca: "Altaveus",
  },
  Sonda: {
    en: "Fish finder",
    fr: "Sondeur",
    de: "Echolot",
    nl: "Dieptemeter",
    it: "Ecoscandaglio",
    ru: "Ehkholot",
    ca: "Sonda",
  },
  GPS: {
    en: "GPS",
    fr: "GPS",
    de: "GPS",
    nl: "GPS",
    it: "GPS",
    ru: "GPS",
    ca: "GPS",
  },
  Ducha: {
    en: "Shower",
    fr: "Douche",
    de: "Dusche",
    nl: "Douche",
    it: "Doccia",
    ru: "Dush",
    ca: "Dutxa",
  },
  "Toldo bimini": {
    en: "Bimini top",
    fr: "Taud bimini",
    de: "Bimini-Verdeck",
    nl: "Bimini-kap",
    it: "Tendalino bimini",
    ru: "Tent bimini",
    ca: "Tendal bimini",
  },
  Nevera: {
    en: "Cooler",
    fr: "Glaciere",
    de: "Kuehlbox",
    nl: "Koelbox",
    it: "Frigo portatile",
    ru: "Kholodil'nik",
    ca: "Nevera",
  },
  "Arco de Inox para deportes acuáticos": {
    en: "Stainless steel arch for water sports",
    fr: "Arceau inox pour sports nautiques",
    de: "Edelstahlbuegel fuer Wassersport",
    nl: "RVS beugel voor watersporten",
    it: "Arco in acciaio inox per sport acquatici",
    ru: "Arka iz nerzhaveyushchej stali dlya vodnogo sporta",
    ca: "Arc d'inox per a esports aquatics",
  },
  "Solarium en proa y popa": {
    en: "Sundeck at bow & stern",
    fr: "Solarium proue et poupe",
    de: "Sonnendeck Bug & Heck",
    nl: "Zonnedek voor & achter",
    it: "Solarium a prua e poppa",
    ru: "Solyarij na nosu i korme",
    ca: "Solarium a proa i popa",
  },
  "Toldo bimini inox": {
    en: "Stainless steel bimini top",
    fr: "Taud bimini inox",
    de: "Edelstahl-Bimini-Verdeck",
    nl: "RVS bimini-kap",
    it: "Tendalino bimini inox",
    ru: "Tent bimini iz nerzhaveyushchej stali",
    ca: "Tendal bimini inox",
  },
  "Mesa en popa y/o proa": {
    en: "Table at stern and/or bow",
    fr: "Table en poupe et/ou proue",
    de: "Tisch am Heck und/oder Bug",
    nl: "Tafel op achter- en/of voordek",
    it: "Tavolo a poppa e/o prua",
    ru: "Stol na korme i/ili nosu",
    ca: "Taula a popa i/o proa",
  },
  "Ducha de agua dulce": {
    en: "Freshwater shower",
    fr: "Douche eau douce",
    de: "Suesswasserdusche",
    nl: "Zoetwaterdouche",
    it: "Doccia acqua dolce",
    ru: "Dush s presnoj vodoj",
    ca: "Dutxa d'aigua dolca",
  },
  "Mando electrónico": {
    en: "Electronic throttle",
    fr: "Commande electronique",
    de: "Elektronische Steuerung",
    nl: "Elektronische bediening",
    it: "Comando elettronico",
    ru: "Ehlektronnoe upravlenie",
    ca: "Comandament electronic",
  },
  Bichero: {
    en: "Boat hook",
    fr: "Gaffe",
    de: "Bootshaken",
    nl: "Bootshaak",
    it: "Mezzo marinaio",
    ru: "Bagor",
    ca: "Bitxero",
  },
  Cabos: {
    en: "Ropes",
    fr: "Cordages",
    de: "Leinen",
    nl: "Lijnen",
    it: "Cavi",
    ru: "Kanaty",
    ca: "Caps",
  },
  Defensas: {
    en: "Fenders",
    fr: "Defenses",
    de: "Fender",
    nl: "Stootkussens",
    it: "Parabordi",
    ru: "Kendery",
    ca: "Defenses",
  },
  "Apta para deportes náuticos": {
    en: "Suitable for water sports",
    fr: "Adaptee aux sports nautiques",
    de: "Geeignet fuer Wassersport",
    nl: "Geschikt voor watersporten",
    it: "Adatta per sport acquatici",
    ru: "Podkhodit dlya vodnogo sporta",
    ca: "Apta per a esports nautics",
  },

  // Extras names live in a shared util (client/src/utils/extraNameTranslations.ts)
  // so the booking modal renders them the same way as this tab.

  // === Hardcoded UI strings ===
  "Ver galería de fotos de clientes": {
    en: "View customer photo gallery",
    fr: "Voir la galerie photos clients",
    de: "Kundenfotogalerie ansehen",
    nl: "Bekijk klantenfotogalerij",
    it: "Vedi galleria foto clienti",
    ru: "Smotret' galereyu foto klientov",
    ca: "Veure galeria de fotos de clients",
  },
  Recomendado: {
    en: "Recommended",
    fr: "Recommande",
    de: "Empfohlen",
    nl: "Aanbevolen",
    it: "Consigliato",
    ru: "Rekomendovano",
    ca: "Recomanat",
  },
  // Wording the CRM uses that had no entry at all (added 2026-07-26). The
  // accent/case variants are handled by normalizeBoatTextKey, not by keys here.
  "Solárium proa y popa": {
    en: "Sundeck at bow & stern",
    fr: "Solarium proue et poupe",
    de: "Sonnendeck Bug & Heck",
    nl: "Zonnedek voor & achter",
    it: "Solarium a prua e poppa",
    ru: "Solyarij na nosu i korme",
    ca: "Solarium a proa i popa",
  },
  "Licencia de Navegación (LN) requerida": {
    en: "Navigation licence (LN) required",
    fr: "Permis de navigation (LN) requis",
    de: "Navigationsschein (LN) erforderlich",
    nl: "Vaarbewijs (LN) vereist",
    it: "Patente di navigazione (LN) richiesta",
    ru: "Trebuetsya licenziya (LN)",
    ca: "Llicència de Navegació (LN) requerida",
  },
  "Equipo de navegación": {
    en: "Navigation equipment",
    fr: "Équipement de navigation",
    de: "Navigationsausrüstung",
    nl: "Navigatie-uitrusting",
    it: "Strumentazione di navigazione",
    ru: "Navigatsionnoe oborudovanie",
    ca: "Equip de navegació",
  },
  "1-2 personas por moto": {
    en: "1-2 people per jet ski",
    fr: "1-2 personnes par jet ski",
    de: "1-2 Personen pro Jetski",
    nl: "1-2 personen per jetski",
    it: "1-2 persone per moto d'acqua",
    ru: "1-2 cheloveka na gidrotsikl",
    ca: "1-2 persones per moto",
  },
  "Desde 15 minutos": {
    en: "From 15 minutes",
    fr: "À partir de 15 minutes",
    de: "Ab 15 Minuten",
    nl: "Vanaf 15 minuten",
    it: "Da 15 minuti",
    ru: "Ot 15 minut",
    ca: "Des de 15 minuts",
  },
  "Monitor incluido": {
    en: "Instructor included",
    fr: "Moniteur inclus",
    de: "Guide inklusive",
    nl: "Instructeur inbegrepen",
    it: "Istruttore incluso",
    ru: "Instruktor vklyuchen",
    ca: "Monitor inclòs",
  },
  "Sin experiencia previa": {
    en: "No experience needed",
    fr: "Aucune expérience requise",
    de: "Keine Vorkenntnisse nötig",
    nl: "Geen ervaring nodig",
    it: "Nessuna esperienza richiesta",
    ru: "Bez opyta",
    ca: "Sense experiència prèvia",
  },
  "Instructor incluido": {
    en: "Instructor included",
    fr: "Moniteur inclus",
    de: "Guide inklusive",
    nl: "Instructeur inbegrepen",
    it: "Istruttore incluso",
    ru: "Instruktor vklyuchen",
    ca: "Monitor inclòs",
  },
  "Salida desde la playa": {
    en: "Departs from the beach",
    fr: "Départ depuis la plage",
    de: "Start vom Strand",
    nl: "Vertrek vanaf het strand",
    it: "Partenza dalla spiaggia",
    ru: "Start s plyazha",
    ca: "Sortida des de la platja",
  },
  "Ruta guiada a Tossa de Mar": {
    en: "Guided route to Tossa de Mar",
    fr: "Itinéraire guidé vers Tossa de Mar",
    de: "Geführte Route nach Tossa de Mar",
    nl: "Begeleide route naar Tossa de Mar",
    it: "Percorso guidato a Tossa de Mar",
    ru: "Marshrut s gidom v Tossa-de-Mar",
    ca: "Ruta guiada a Tossa de Mar",
  },
  "personas han visto este barco hoy": {
    en: "people viewed this boat today",
    fr: "personnes ont vu ce bateau aujourd'hui",
    de: "Personen haben dieses Boot heute angesehen",
    nl: "personen hebben deze boot vandaag bekeken",
    it: "persone hanno visto questa barca oggi",
    ru: "chelovek smotreli ehtu lodku segodnya",
    ca: "persones han vist aquest vaixell avui",
  },

  // === Live-fleet sweep 2026-07-28: strings the CRM serves through /api/boats
  // that had no entry at all (jet ski / e-foil subtitles, shared extras and
  // included items). They were reaching every non-Spanish visitor verbatim. ===
  "Sin licencia · 1-2 personas · Aprende a pilotar en circuito vigilado": {
    en: "No licence required · 1-2 people · Learn to ride on a supervised circuit",
    fr: "Sans permis · 1-2 personnes · Apprenez a piloter sur un circuit surveille",
    de: "Ohne Fuehrerschein · 1-2 Personen · Fahren lernen auf ueberwachtem Parcours",
    nl: "Geen vaarbewijs · 1-2 personen · Leer varen op een bewaakt parcours",
    it: "Senza patente · 1-2 persone · Impara a guidare in un circuito sorvegliato",
    ru: "Bez licenzii · 1-2 cheloveka · Uchites' upravlyat' na ohranyaemoj trasse",
    ca: "Sense llicencia · 1-2 persones · Apren a pilotar en circuit vigilat",
  },
  "Sin licencia · 1-2 personas · Ruta guiada Blanes → Tossa de Mar": {
    en: "No licence required · 1-2 people · Guided route Blanes → Tossa de Mar",
    fr: "Sans permis · 1-2 personnes · Itineraire guide Blanes → Tossa de Mar",
    de: "Ohne Fuehrerschein · 1-2 Personen · Gefuehrte Route Blanes → Tossa de Mar",
    nl: "Geen vaarbewijs · 1-2 personen · Begeleide route Blanes → Tossa de Mar",
    it: "Senza patente · 1-2 persone · Itinerario guidato Blanes → Tossa de Mar",
    ru: "Bez licenzii · 1-2 cheloveka · Ehkskursiya Blanes → Tossa de Mar",
    ca: "Sense llicencia · 1-2 persones · Ruta guiada Blanes → Tossa de Mar",
  },
  "Sin licencia · 1 persona · Vuela sobre el agua con instructor": {
    en: "No licence required · 1 person · Fly above the water with an instructor",
    fr: "Sans permis · 1 personne · Volez au-dessus de l'eau avec un moniteur",
    de: "Ohne Fuehrerschein · 1 Person · Ueber dem Wasser fliegen mit Ausbilder",
    nl: "Geen vaarbewijs · 1 persoon · Vlieg boven het water met een instructeur",
    it: "Senza patente · 1 persona · Vola sull'acqua con istruttore",
    ru: "Bez licenzii · 1 chelovek · Poletajte nad vodoj s instruktorom",
    ca: "Sense llicencia · 1 persona · Vola sobre l'aigua amb instructor",
  },
  Seguro: {
    en: "Insurance",
    fr: "Assurance",
    de: "Versicherung",
    nl: "Verzekering",
    it: "Assicurazione",
    ru: "Strahovanie",
    ca: "Assegurança",
  },
  // Las dos coberturas reales de cada casco: RC de barcos (Allianz, RD 607/1999)
  // y accidentes de ocupantes vía Seguro Obligatorio de Viajeros (FIATC, grupo
  // SOVI, RD 1575/1989). Ver INSURANCE_SCOPE_ES en shared/businessProfile.ts.
  "Seguro de responsabilidad civil y accidentes": {
    en: "Liability and passenger accident insurance",
    fr: "Assurance responsabilite civile et accidents",
    de: "Haftpflicht- und Unfallversicherung",
    nl: "WA- en ongevallenverzekering",
    it: "Assicurazione RC e infortuni",
    ru: "Strahovanie otvetstvennosti i ot neschastnyh sluchaev",
    ca: "Assegurança de responsabilitat civil i accidents",
  },
  "Seguro de responsabilidad civil": {
    en: "Third-party liability insurance",
    fr: "Assurance responsabilite civile",
    de: "Haftpflichtversicherung",
    nl: "Aansprakelijkheidsverzekering",
    it: "Assicurazione di responsabilita civile",
    ru: "Strahovanie grazhdanskoj otvetstvennosti",
    ca: "Assegurança de responsabilitat civil",
  },
  Combustible: {
    en: "Fuel",
    fr: "Carburant",
    de: "Kraftstoff",
    nl: "Brandstof",
    it: "Carburante",
    ru: "Toplivo",
    ca: "Combustible",
  },
  "Batería": {
    en: "Battery",
    fr: "Batterie",
    de: "Batterie",
    nl: "Accu",
    it: "Batteria",
    ru: "Akkumulyator",
    ca: "Bateria",
  },
  "Briefing de seguridad": {
    en: "Safety briefing",
    fr: "Briefing de securite",
    de: "Sicherheitseinweisung",
    nl: "Veiligheidsbriefing",
    it: "Briefing di sicurezza",
    ru: "Instruktazh po bezopasnosti",
    ca: "Briefing de seguretat",
  },
  "Chaleco salvavidas": {
    en: "Life jacket",
    fr: "Gilet de sauvetage",
    de: "Rettungsweste",
    nl: "Reddingsvest",
    it: "Giubbotto di salvataggio",
    ru: "Spasatel'nyj zhilet",
    ca: "Armilla salvavides",
  },
  "Material de seguridad": {
    en: "Safety equipment",
    fr: "Equipement de securite",
    de: "Sicherheitsausruestung",
    nl: "Veiligheidsuitrusting",
    it: "Attrezzatura di sicurezza",
    ru: "Snaryazhenie bezopasnosti",
    ca: "Material de seguretat",
  },
  Instructor: {
    en: "Instructor",
    fr: "Moniteur",
    de: "Ausbilder",
    nl: "Instructeur",
    it: "Istruttore",
    ru: "Instruktor",
    ca: "Instructor",
  },
  "Monitor titulado / guía": {
    en: "Certified instructor / guide",
    fr: "Moniteur diplome / guide",
    de: "Zertifizierter Ausbilder / Guide",
    nl: "Gediplomeerde instructeur / gids",
    it: "Istruttore qualificato / guida",
    ru: "Sertificirovannyj instruktor / gid",
    ca: "Monitor titulat / guia",
  },
  "Monitor y vigilancia": {
    en: "Instructor and supervision",
    fr: "Moniteur et surveillance",
    de: "Betreuung und Aufsicht",
    nl: "Instructeur en toezicht",
    it: "Istruttore e sorveglianza",
    ru: "Instruktor i nablyudenie",
    ca: "Monitor i vigilància",
  },
  "Paddle Surf": {
    en: "Paddleboard (SUP)",
    fr: "Paddle (SUP)",
    de: "SUP-Board",
    nl: "Suppen (SUP)",
    it: "SUP",
    ru: "SUP-doska",
    ca: "Paddle surf",
  },
  Snorkel: {
    en: "Snorkelling gear",
    fr: "Materiel de snorkeling",
    de: "Schnorchelset",
    nl: "Snorkelset",
    it: "Attrezzatura da snorkeling",
    ru: "Komplekt dlya snorklinga",
    ca: "Snorkel",
  },
  "Parking delante del Barco": {
    en: "Parking next to the boat",
    fr: "Parking devant le bateau",
    de: "Parkplatz direkt am Boot",
    nl: "Parkeerplaats naast de boot",
    it: "Parcheggio davanti alla barca",
    ru: "Parkovka ryadom s lodkoj",
    ca: "Pàrquing davant del vaixell",
  },

  // === Product names (2026-07-28). Only the descriptive ones: the model
  // names (Astec 480, Remus 450, Trimarchi 57S...) must stay as they are,
  // and a miss returns the original, so routing every name through here is
  // safe. ===
  "Excursión Privada con Capitán": {
    en: "Private Excursion with Skipper",
    fr: "Excursion privee avec skipper",
    de: "Private Bootstour mit Skipper",
    nl: "Prive-excursie met schipper",
    it: "Escursione privata con skipper",
    ru: "Chastnaya ehkskursiya s kapitanom",
    ca: "Excursió Privada amb Patró",
  },
  "Circuito en Jet Ski": {
    en: "Jet Ski Circuit",
    fr: "Circuit en jet ski",
    de: "Jetski-Parcours",
    nl: "Jetski-parcours",
    it: "Circuito in moto d'acqua",
    ru: "Trassa na gidrocikle",
    ca: "Circuit en Moto d'Aigua",
  },
  "Excursión en Jet Ski con Monitor": {
    en: "Guided Jet Ski Excursion",
    fr: "Excursion en jet ski avec moniteur",
    de: "Jetski-Tour mit Guide",
    nl: "Jetski-excursie met instructeur",
    it: "Escursione in moto d'acqua con istruttore",
    ru: "Ehkskursiya na gidrocikle s instruktorom",
    ca: "Excursió en Moto d'Aigua amb Monitor",
  },
  "E-Foil en Blanes": {
    en: "E-Foil in Blanes",
    fr: "E-Foil a Blanes",
    de: "E-Foil in Blanes",
    nl: "E-Foil in Blanes",
    it: "E-Foil a Blanes",
    ru: "E-Foil v Blanese",
    ca: "E-Foil a Blanes",
  },
};

/**
 * Lookup key: lowercased, unaccented, whitespace collapsed, digits wildcarded.
 *
 * These strings are NOT in the code — they are rows in `boats`, typed from the
 * CRM, so the same item arrives spelled several ways across the fleet ("Toldo
 * bimini", "Toldo Bimini", "Toldo Bi Mini"). Matching the literal key meant one
 * capital letter or one accent was enough to ship Spanish to the other seven
 * languages, with no error anywhere. Five of the eleven strings that were
 * reaching customers untranslated on 2026-07-26 were exactly this: the entry
 * existed, spelled slightly differently.
 *
 * Numbers are the same trap with a slower fuse: the entry for the private
 * excursion said "7 personas" while the fleet row says 6, so every non-Spanish
 * visitor read the subtitle in Spanish. Digits are wildcarded here and
 * re-stamped from the live text in translateBoatText, so a capacity change in
 * the CRM can neither break the translation nor publish a stale figure.
 */
const normalizeBoatTextKey = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\d+/g, "#");

const boatTextIndex = new Map(
  Object.entries(boatTextTranslations).map(([key, value]) => [normalizeBoatTextKey(key), value])
);

/** Translate a Spanish boat text to the current language. Falls back to Spanish original. */
export function translateBoatText(text: string, lang: string): string {
  if (lang === "es") return text;
  const hit = boatTextIndex.get(normalizeBoatTextKey(text))?.[lang];
  if (!hit) return text;
  const source = text.match(/\d+/g) ?? [];
  const entry = hit.match(/\d+/g) ?? [];
  if (source.length !== entry.length) return hit;
  let i = 0;
  return hit.replace(/\d+/g, () => source[i++]);
}

/**
 * Translate the free-form values that live in boatData.specifications
 * (capacity / fuel / engine). Exact-match translation doesn't work here
 * because numbers vary per boat ("4 Personas", "5 Personas", "Gasolina 30L",
 * "Gasolina 50L", "Parsun 40/15cv"...), so we pattern-replace just the
 * Spanish nouns/units and leave the numeric/brand parts intact.
 */
export function translateBoatSpec(value: string, lang: string): string {
  if (lang === "es" || !value) return value;
  let out = value;
  out = out.replace(/(\d+)\s*Personas?/g, (_, n) => {
    const map: Record<string, string> = {
      en: `${n} people`,
      fr: `${n} personnes`,
      de: `${n} Personen`,
      nl: `${n} personen`,
      it: `${n} persone`,
      ru: `${n} человек`,
      ca: `${n} persones`,
    };
    return map[lang] ?? `${n} Personas`;
  });
  out = out.replace(/Gasolina\s+(\d+)\s*L/gi, (_, n) => {
    const map: Record<string, string> = {
      en: `Petrol ${n}L`,
      fr: `Essence ${n}L`,
      de: `Benzin ${n}L`,
      nl: `Benzine ${n}L`,
      it: `Benzina ${n}L`,
      ru: `Бензин ${n}L`,
      ca: `Gasolina ${n}L`,
    };
    return map[lang] ?? `Gasolina ${n}L`;
  });
  const hpMap: Record<string, string> = { en: "hp", de: "PS", nl: "pk", ru: "л.с." };
  if (hpMap[lang]) out = out.replace(/(\d+)cv/g, `$1${hpMap[lang]}`);
  return out;
}
