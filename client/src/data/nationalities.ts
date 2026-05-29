// Single source of truth for the nationality picker used in the CRM booking
// modal and the public booking flow.
//
// `value` is the canonical Spanish demonym stored in the DB (kept for
// backward-compat with existing bookings). `country` + `code` drive the
// human-friendly display (flag + country name), and `keywords` make the option
// findable by country name, English name, ISO code and common informal aliases
// (e.g. "netherlands", "holanda", "nl" all resolve to "Holandesa").

export interface NationalityOption {
  /** Canonical Spanish demonym, persisted to the DB. */
  value: string;
  /** Country name in Spanish, shown as the primary label. */
  country: string;
  /** ISO 3166-1 alpha-2 code, used to derive the flag emoji + as a search term. */
  code: string;
  /** Extra search terms (English name/demonym, informal aliases). Lowercased. */
  keywords: string[];
}

/** Strip diacritics + lowercase so "paises bajos" matches "Países Bajos". */
export function normalizeSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Derive a flag emoji from an ISO 3166-1 alpha-2 code ("NL" -> 🇳🇱). */
export function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return "";
  return code
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

// Stored demonyms are feminine (e.g. "Holandesa"). Staff often type the
// masculine form ("holandés", "italiano", "ruso"), so we derive it and feed it
// into the search index as an extra alias. Spanish gender rules cover the bulk;
// the few irregular results are harmless (they only ever ADD a match) and the
// country/English aliases already cover those entries anyway.
const MASCULINE_IRREGULARS: Record<string, string> = {
  Alemana: "Alemán",
};

export function masculineForm(value: string): string | null {
  if (MASCULINE_IRREGULARS[value]) return MASCULINE_IRREGULARS[value];
  if (/[^a-záéíóúüñ]/i.test(value)) return null; // skip compound labels like "Guineana (Bisáu)"
  if (value.endsWith("esa")) return value.slice(0, -3) + "és";
  if (value.endsWith("eña")) return value.slice(0, -3) + "eño";
  if (value.endsWith("ena")) return value.slice(0, -3) + "eno";
  if (value.endsWith("ina")) return value.slice(0, -3) + "ino";
  if (value.endsWith("ana")) return value.slice(0, -3) + "ano";
  if (value.endsWith("a")) return value.slice(0, -1) + "o";
  return null;
}

const RAW_NATIONALITIES: NationalityOption[] = [
  { value: "Afgana", country: "Afganistán", code: "AF", keywords: ["afghanistan", "afghan"] },
  { value: "Albanesa", country: "Albania", code: "AL", keywords: ["albania", "albanian"] },
  {
    value: "Alemana",
    country: "Alemania",
    code: "DE",
    keywords: ["germany", "german", "deutschland", "allemagne"],
  },
  { value: "Andorrana", country: "Andorra", code: "AD", keywords: ["andorra", "andorran"] },
  { value: "Angoleña", country: "Angola", code: "AO", keywords: ["angola", "angolan"] },
  {
    value: "Antiguana",
    country: "Antigua y Barbuda",
    code: "AG",
    keywords: ["antigua", "barbuda", "antiguan"],
  },
  {
    value: "Saudí",
    country: "Arabia Saudí",
    code: "SA",
    keywords: ["saudi arabia", "saudi", "arabia saudita"],
  },
  {
    value: "Argelina",
    country: "Argelia",
    code: "DZ",
    keywords: ["algeria", "algerian", "algerie"],
  },
  {
    value: "Argentina",
    country: "Argentina",
    code: "AR",
    keywords: ["argentina", "argentinian", "argentine"],
  },
  { value: "Armenia", country: "Armenia", code: "AM", keywords: ["armenia", "armenian"] },
  {
    value: "Australiana",
    country: "Australia",
    code: "AU",
    keywords: ["australia", "australian", "aussie"],
  },
  {
    value: "Austríaca",
    country: "Austria",
    code: "AT",
    keywords: ["austria", "austrian", "osterreich"],
  },
  {
    value: "Azerbaiyana",
    country: "Azerbaiyán",
    code: "AZ",
    keywords: ["azerbaijan", "azerbaijani"],
  },
  { value: "Bahameña", country: "Bahamas", code: "BS", keywords: ["bahamas", "bahamian"] },
  {
    value: "Bangladesí",
    country: "Bangladés",
    code: "BD",
    keywords: ["bangladesh", "bangladeshi"],
  },
  { value: "Barbadense", country: "Barbados", code: "BB", keywords: ["barbados", "barbadian"] },
  { value: "Bareiní", country: "Baréin", code: "BH", keywords: ["bahrain", "bahraini"] },
  {
    value: "Belga",
    country: "Bélgica",
    code: "BE",
    keywords: ["belgium", "belgian", "belgique", "belgie"],
  },
  { value: "Beliceña", country: "Belice", code: "BZ", keywords: ["belize", "belizean"] },
  { value: "Beninesa", country: "Benín", code: "BJ", keywords: ["benin", "beninese"] },
  {
    value: "Bielorrusa",
    country: "Bielorrusia",
    code: "BY",
    keywords: ["belarus", "belarusian", "belorus"],
  },
  { value: "Boliviana", country: "Bolivia", code: "BO", keywords: ["bolivia", "bolivian"] },
  {
    value: "Bosnia",
    country: "Bosnia y Herzegovina",
    code: "BA",
    keywords: ["bosnia", "bosnian", "herzegovina"],
  },
  { value: "Botsuanesa", country: "Botsuana", code: "BW", keywords: ["botswana", "botswanan"] },
  {
    value: "Brasileña",
    country: "Brasil",
    code: "BR",
    keywords: ["brazil", "brazilian", "brasil"],
  },
  { value: "Bruneana", country: "Brunéi", code: "BN", keywords: ["brunei", "bruneian"] },
  { value: "Búlgara", country: "Bulgaria", code: "BG", keywords: ["bulgaria", "bulgarian"] },
  {
    value: "Burkinesa",
    country: "Burkina Faso",
    code: "BF",
    keywords: ["burkina faso", "burkinabe"],
  },
  { value: "Burundesa", country: "Burundi", code: "BI", keywords: ["burundi", "burundian"] },
  { value: "Butanesa", country: "Bután", code: "BT", keywords: ["bhutan", "bhutanese"] },
  {
    value: "Caboverdiana",
    country: "Cabo Verde",
    code: "CV",
    keywords: ["cape verde", "cabo verde", "cape verdean"],
  },
  { value: "Camboyana", country: "Camboya", code: "KH", keywords: ["cambodia", "cambodian"] },
  { value: "Camerunesa", country: "Camerún", code: "CM", keywords: ["cameroon", "cameroonian"] },
  { value: "Canadiense", country: "Canadá", code: "CA", keywords: ["canada", "canadian"] },
  { value: "Catarí", country: "Catar", code: "QA", keywords: ["qatar", "qatari"] },
  { value: "Chadiana", country: "Chad", code: "TD", keywords: ["chad", "chadian"] },
  {
    value: "Checa",
    country: "República Checa",
    code: "CZ",
    keywords: ["czech", "czechia", "czech republic", "chequia"],
  },
  { value: "Chilena", country: "Chile", code: "CL", keywords: ["chile", "chilean"] },
  { value: "China", country: "China", code: "CN", keywords: ["china", "chinese"] },
  { value: "Chipriota", country: "Chipre", code: "CY", keywords: ["cyprus", "cypriot"] },
  { value: "Colombiana", country: "Colombia", code: "CO", keywords: ["colombia", "colombian"] },
  { value: "Comorense", country: "Comoras", code: "KM", keywords: ["comoros", "comorian"] },
  { value: "Congoleña", country: "Congo", code: "CG", keywords: ["congo", "congolese"] },
  {
    value: "Coreana",
    country: "Corea del Sur",
    code: "KR",
    keywords: ["korea", "south korea", "korean", "corea del sur"],
  },
  {
    value: "Costarricense",
    country: "Costa Rica",
    code: "CR",
    keywords: ["costa rica", "costa rican"],
  },
  {
    value: "Marfileña",
    country: "Costa de Marfil",
    code: "CI",
    keywords: ["ivory coast", "cote d'ivoire", "ivorian"],
  },
  {
    value: "Croata",
    country: "Croacia",
    code: "HR",
    keywords: ["croatia", "croatian", "hrvatska"],
  },
  { value: "Cubana", country: "Cuba", code: "CU", keywords: ["cuba", "cuban"] },
  { value: "Danesa", country: "Dinamarca", code: "DK", keywords: ["denmark", "danish", "danmark"] },
  { value: "Dominiquesa", country: "Dominica", code: "DM", keywords: ["dominica", "dominican"] },
  {
    value: "Dominicana",
    country: "República Dominicana",
    code: "DO",
    keywords: ["dominican republic", "republica dominicana"],
  },
  { value: "Ecuatoriana", country: "Ecuador", code: "EC", keywords: ["ecuador", "ecuadorian"] },
  { value: "Egipcia", country: "Egipto", code: "EG", keywords: ["egypt", "egyptian"] },
  {
    value: "Salvadoreña",
    country: "El Salvador",
    code: "SV",
    keywords: ["el salvador", "salvadoran", "salvadorian"],
  },
  {
    value: "Emiratí",
    country: "Emiratos Árabes Unidos",
    code: "AE",
    keywords: [
      "united arab emirates",
      "uae",
      "emirates",
      "emirati",
      "emiratos arabes",
      "dubai",
      "abu dhabi",
    ],
  },
  { value: "Eritrea", country: "Eritrea", code: "ER", keywords: ["eritrea", "eritrean"] },
  { value: "Eslovaca", country: "Eslovaquia", code: "SK", keywords: ["slovakia", "slovak"] },
  {
    value: "Eslovena",
    country: "Eslovenia",
    code: "SI",
    keywords: ["slovenia", "slovenian", "slovene"],
  },
  {
    value: "Española",
    country: "España",
    code: "ES",
    keywords: ["spain", "spanish", "espana", "espagne", "spanien"],
  },
  {
    value: "Estadounidense",
    country: "Estados Unidos",
    code: "US",
    keywords: ["united states", "usa", "us", "american", "eeuu", "estados unidos", "america"],
  },
  { value: "Estonia", country: "Estonia", code: "EE", keywords: ["estonia", "estonian"] },
  { value: "Etíope", country: "Etiopía", code: "ET", keywords: ["ethiopia", "ethiopian"] },
  {
    value: "Filipina",
    country: "Filipinas",
    code: "PH",
    keywords: ["philippines", "filipino", "filipina"],
  },
  {
    value: "Finlandesa",
    country: "Finlandia",
    code: "FI",
    keywords: ["finland", "finnish", "suomi"],
  },
  { value: "Fiyiana", country: "Fiyi", code: "FJ", keywords: ["fiji", "fijian"] },
  {
    value: "Francesa",
    country: "Francia",
    code: "FR",
    keywords: ["france", "french", "francia", "frankreich"],
  },
  { value: "Gabonesa", country: "Gabón", code: "GA", keywords: ["gabon", "gabonese"] },
  { value: "Gambiana", country: "Gambia", code: "GM", keywords: ["gambia", "gambian"] },
  {
    value: "Galesa",
    country: "Gales",
    code: "GB",
    keywords: ["wales", "welsh", "uk", "united kingdom"],
  },
  { value: "Georgiana", country: "Georgia", code: "GE", keywords: ["georgia", "georgian"] },
  { value: "Ghanesa", country: "Ghana", code: "GH", keywords: ["ghana", "ghanaian"] },
  { value: "Granadina", country: "Granada", code: "GD", keywords: ["grenada", "grenadian"] },
  { value: "Griega", country: "Grecia", code: "GR", keywords: ["greece", "greek", "hellas"] },
  {
    value: "Guatemalteca",
    country: "Guatemala",
    code: "GT",
    keywords: ["guatemala", "guatemalan"],
  },
  {
    value: "Ecuatoguineana",
    country: "Guinea Ecuatorial",
    code: "GQ",
    keywords: ["equatorial guinea", "guinea ecuatorial"],
  },
  { value: "Guineana", country: "Guinea", code: "GN", keywords: ["guinea", "guinean"] },
  {
    value: "Guineana (Bisáu)",
    country: "Guinea-Bisáu",
    code: "GW",
    keywords: ["guinea bissau", "bissau"],
  },
  { value: "Guyanesa", country: "Guyana", code: "GY", keywords: ["guyana", "guyanese"] },
  { value: "Haitiana", country: "Haití", code: "HT", keywords: ["haiti", "haitian"] },
  { value: "Hondureña", country: "Honduras", code: "HN", keywords: ["honduras", "honduran"] },
  {
    value: "Holandesa",
    country: "Países Bajos",
    code: "NL",
    keywords: [
      "netherlands",
      "dutch",
      "holland",
      "holanda",
      "nederland",
      "neerlandesa",
      "paises bajos",
    ],
  },
  {
    value: "Húngara",
    country: "Hungría",
    code: "HU",
    keywords: ["hungary", "hungarian", "magyar"],
  },
  { value: "India", country: "India", code: "IN", keywords: ["india", "indian"] },
  { value: "Indonesia", country: "Indonesia", code: "ID", keywords: ["indonesia", "indonesian"] },
  {
    value: "Inglesa",
    country: "Inglaterra",
    code: "GB",
    keywords: ["england", "english", "inglaterra", "uk", "united kingdom", "britain"],
  },
  { value: "Iraní", country: "Irán", code: "IR", keywords: ["iran", "iranian", "persia"] },
  { value: "Iraquí", country: "Irak", code: "IQ", keywords: ["iraq", "iraqi"] },
  { value: "Irlandesa", country: "Irlanda", code: "IE", keywords: ["ireland", "irish", "eire"] },
  { value: "Islandesa", country: "Islandia", code: "IS", keywords: ["iceland", "icelandic"] },
  { value: "Israelí", country: "Israel", code: "IL", keywords: ["israel", "israeli"] },
  {
    value: "Italiana",
    country: "Italia",
    code: "IT",
    keywords: ["italy", "italian", "italia", "italien"],
  },
  { value: "Jamaicana", country: "Jamaica", code: "JM", keywords: ["jamaica", "jamaican"] },
  { value: "Japonesa", country: "Japón", code: "JP", keywords: ["japan", "japanese", "nippon"] },
  { value: "Jordana", country: "Jordania", code: "JO", keywords: ["jordan", "jordanian"] },
  { value: "Kazaja", country: "Kazajistán", code: "KZ", keywords: ["kazakhstan", "kazakh"] },
  { value: "Keniana", country: "Kenia", code: "KE", keywords: ["kenya", "kenyan"] },
  { value: "Kirguisa", country: "Kirguistán", code: "KG", keywords: ["kyrgyzstan", "kyrgyz"] },
  { value: "Kosovar", country: "Kosovo", code: "XK", keywords: ["kosovo", "kosovar"] },
  { value: "Kuwaití", country: "Kuwait", code: "KW", keywords: ["kuwait", "kuwaiti"] },
  { value: "Laosiana", country: "Laos", code: "LA", keywords: ["laos", "laotian"] },
  { value: "Lesothense", country: "Lesoto", code: "LS", keywords: ["lesotho"] },
  { value: "Letona", country: "Letonia", code: "LV", keywords: ["latvia", "latvian"] },
  { value: "Libanesa", country: "Líbano", code: "LB", keywords: ["lebanon", "lebanese"] },
  { value: "Liberiana", country: "Liberia", code: "LR", keywords: ["liberia", "liberian"] },
  { value: "Libia", country: "Libia", code: "LY", keywords: ["libya", "libyan"] },
  { value: "Liechtensteiniana", country: "Liechtenstein", code: "LI", keywords: ["liechtenstein"] },
  { value: "Lituana", country: "Lituania", code: "LT", keywords: ["lithuania", "lithuanian"] },
  {
    value: "Luxemburguesa",
    country: "Luxemburgo",
    code: "LU",
    keywords: ["luxembourg", "luxembourgish"],
  },
  {
    value: "Macedónica",
    country: "Macedonia del Norte",
    code: "MK",
    keywords: ["macedonia", "macedonian", "north macedonia"],
  },
  {
    value: "Madagascarense",
    country: "Madagascar",
    code: "MG",
    keywords: ["madagascar", "malagasy"],
  },
  { value: "Malasia", country: "Malasia", code: "MY", keywords: ["malaysia", "malaysian"] },
  { value: "Malauí", country: "Malaui", code: "MW", keywords: ["malawi", "malawian"] },
  { value: "Maldiva", country: "Maldivas", code: "MV", keywords: ["maldives", "maldivian"] },
  { value: "Maliense", country: "Malí", code: "ML", keywords: ["mali", "malian"] },
  { value: "Maltesa", country: "Malta", code: "MT", keywords: ["malta", "maltese"] },
  {
    value: "Marroquí",
    country: "Marruecos",
    code: "MA",
    keywords: ["morocco", "moroccan", "maroc", "marruecos"],
  },
  {
    value: "Marshallesa",
    country: "Islas Marshall",
    code: "MH",
    keywords: ["marshall islands", "marshallese"],
  },
  { value: "Mauriciana", country: "Mauricio", code: "MU", keywords: ["mauritius", "mauritian"] },
  {
    value: "Mauritana",
    country: "Mauritania",
    code: "MR",
    keywords: ["mauritania", "mauritanian"],
  },
  { value: "Mexicana", country: "México", code: "MX", keywords: ["mexico", "mexican", "mejico"] },
  {
    value: "Micronesia",
    country: "Micronesia",
    code: "FM",
    keywords: ["micronesia", "micronesian"],
  },
  { value: "Moldava", country: "Moldavia", code: "MD", keywords: ["moldova", "moldovan"] },
  { value: "Monegasca", country: "Mónaco", code: "MC", keywords: ["monaco", "monegasque"] },
  { value: "Mongola", country: "Mongolia", code: "MN", keywords: ["mongolia", "mongolian"] },
  {
    value: "Montenegrina",
    country: "Montenegro",
    code: "ME",
    keywords: ["montenegro", "montenegrin"],
  },
  {
    value: "Mozambiqueña",
    country: "Mozambique",
    code: "MZ",
    keywords: ["mozambique", "mozambican"],
  },
  { value: "Namibia", country: "Namibia", code: "NA", keywords: ["namibia", "namibian"] },
  { value: "Nauruana", country: "Nauru", code: "NR", keywords: ["nauru", "nauruan"] },
  { value: "Nepalesa", country: "Nepal", code: "NP", keywords: ["nepal", "nepalese", "nepali"] },
  {
    value: "Nicaragüense",
    country: "Nicaragua",
    code: "NI",
    keywords: ["nicaragua", "nicaraguan"],
  },
  { value: "Nigerina", country: "Níger", code: "NE", keywords: ["niger", "nigerien"] },
  { value: "Nigeriana", country: "Nigeria", code: "NG", keywords: ["nigeria", "nigerian"] },
  {
    value: "Norcoreana",
    country: "Corea del Norte",
    code: "KP",
    keywords: ["north korea", "corea del norte"],
  },
  { value: "Noruega", country: "Noruega", code: "NO", keywords: ["norway", "norwegian", "norge"] },
  {
    value: "Neozelandesa",
    country: "Nueva Zelanda",
    code: "NZ",
    keywords: ["new zealand", "nueva zelanda", "kiwi"],
  },
  { value: "Omaní", country: "Omán", code: "OM", keywords: ["oman", "omani"] },
  { value: "Pakistaní", country: "Pakistán", code: "PK", keywords: ["pakistan", "pakistani"] },
  { value: "Palauana", country: "Palaos", code: "PW", keywords: ["palau", "palauan"] },
  { value: "Palestina", country: "Palestina", code: "PS", keywords: ["palestine", "palestinian"] },
  { value: "Panameña", country: "Panamá", code: "PA", keywords: ["panama", "panamanian"] },
  { value: "Paraguaya", country: "Paraguay", code: "PY", keywords: ["paraguay", "paraguayan"] },
  { value: "Peruana", country: "Perú", code: "PE", keywords: ["peru", "peruvian"] },
  { value: "Polaca", country: "Polonia", code: "PL", keywords: ["poland", "polish", "polska"] },
  { value: "Portuguesa", country: "Portugal", code: "PT", keywords: ["portugal", "portuguese"] },
  {
    value: "Puertorriqueña",
    country: "Puerto Rico",
    code: "PR",
    keywords: ["puerto rico", "puerto rican"],
  },
  {
    value: "Británica",
    country: "Reino Unido",
    code: "GB",
    keywords: [
      "united kingdom",
      "uk",
      "british",
      "britain",
      "great britain",
      "reino unido",
      "england",
      "inglaterra",
      "scotland",
    ],
  },
  {
    value: "Centroafricana",
    country: "República Centroafricana",
    code: "CF",
    keywords: ["central african republic"],
  },
  {
    value: "Congoleña (RDC)",
    country: "República Democrática del Congo",
    code: "CD",
    keywords: ["democratic republic of the congo", "dr congo", "rdc"],
  },
  { value: "Ruandesa", country: "Ruanda", code: "RW", keywords: ["rwanda", "rwandan"] },
  { value: "Rumana", country: "Rumanía", code: "RO", keywords: ["romania", "romanian"] },
  { value: "Rusa", country: "Rusia", code: "RU", keywords: ["russia", "russian", "rossiya"] },
  {
    value: "Salomonense",
    country: "Islas Salomón",
    code: "SB",
    keywords: ["solomon islands", "solomon"],
  },
  { value: "Samoana", country: "Samoa", code: "WS", keywords: ["samoa", "samoan"] },
  {
    value: "Cristobaleña",
    country: "San Cristóbal y Nieves",
    code: "KN",
    keywords: ["saint kitts and nevis", "st kitts"],
  },
  {
    value: "Sanmarinense",
    country: "San Marino",
    code: "SM",
    keywords: ["san marino", "sammarinese"],
  },
  {
    value: "Sanvicentina",
    country: "San Vicente y las Granadinas",
    code: "VC",
    keywords: ["saint vincent and the grenadines", "st vincent"],
  },
  {
    value: "Santalucense",
    country: "Santa Lucía",
    code: "LC",
    keywords: ["saint lucia", "st lucia"],
  },
  {
    value: "Santotomense",
    country: "Santo Tomé y Príncipe",
    code: "ST",
    keywords: ["sao tome and principe", "sao tome"],
  },
  { value: "Senegalesa", country: "Senegal", code: "SN", keywords: ["senegal", "senegalese"] },
  { value: "Serbia", country: "Serbia", code: "RS", keywords: ["serbia", "serbian"] },
  {
    value: "Seychellense",
    country: "Seychelles",
    code: "SC",
    keywords: ["seychelles", "seychellois"],
  },
  {
    value: "Sierraleonesa",
    country: "Sierra Leona",
    code: "SL",
    keywords: ["sierra leone", "sierra leonean"],
  },
  {
    value: "Singapurense",
    country: "Singapur",
    code: "SG",
    keywords: ["singapore", "singaporean"],
  },
  { value: "Siria", country: "Siria", code: "SY", keywords: ["syria", "syrian"] },
  { value: "Somalí", country: "Somalia", code: "SO", keywords: ["somalia", "somali"] },
  { value: "Srilanquesa", country: "Sri Lanka", code: "LK", keywords: ["sri lanka", "sri lankan"] },
  {
    value: "Sudafricana",
    country: "Sudáfrica",
    code: "ZA",
    keywords: ["south africa", "south african", "sudafrica"],
  },
  { value: "Sudanesa", country: "Sudán", code: "SD", keywords: ["sudan", "sudanese"] },
  {
    value: "Sursudanesa",
    country: "Sudán del Sur",
    code: "SS",
    keywords: ["south sudan", "sudan del sur"],
  },
  { value: "Sueca", country: "Suecia", code: "SE", keywords: ["sweden", "swedish", "sverige"] },
  {
    value: "Suiza",
    country: "Suiza",
    code: "CH",
    keywords: ["switzerland", "swiss", "schweiz", "suisse", "svizzera"],
  },
  { value: "Surinamesa", country: "Surinam", code: "SR", keywords: ["suriname", "surinamese"] },
  {
    value: "Suazi",
    country: "Esuatini",
    code: "SZ",
    keywords: ["eswatini", "swaziland", "suazilandia"],
  },
  { value: "Tailandesa", country: "Tailandia", code: "TH", keywords: ["thailand", "thai"] },
  { value: "Taiwanesa", country: "Taiwán", code: "TW", keywords: ["taiwan", "taiwanese"] },
  { value: "Tanzana", country: "Tanzania", code: "TZ", keywords: ["tanzania", "tanzanian"] },
  { value: "Tayika", country: "Tayikistán", code: "TJ", keywords: ["tajikistan", "tajik"] },
  {
    value: "Timorense",
    country: "Timor Oriental",
    code: "TL",
    keywords: ["timor", "east timor", "timor-leste"],
  },
  { value: "Togolesa", country: "Togo", code: "TG", keywords: ["togo", "togolese"] },
  { value: "Tongana", country: "Tonga", code: "TO", keywords: ["tonga", "tongan"] },
  {
    value: "Trinitense",
    country: "Trinidad y Tobago",
    code: "TT",
    keywords: ["trinidad and tobago", "trinidad", "tobago"],
  },
  { value: "Tunecina", country: "Túnez", code: "TN", keywords: ["tunisia", "tunisian", "tunez"] },
  { value: "Turca", country: "Turquía", code: "TR", keywords: ["turkey", "turkish", "turkiye"] },
  {
    value: "Turcomena",
    country: "Turkmenistán",
    code: "TM",
    keywords: ["turkmenistan", "turkmen"],
  },
  { value: "Tuvaluana", country: "Tuvalu", code: "TV", keywords: ["tuvalu", "tuvaluan"] },
  { value: "Ucraniana", country: "Ucrania", code: "UA", keywords: ["ukraine", "ukrainian"] },
  { value: "Ugandesa", country: "Uganda", code: "UG", keywords: ["uganda", "ugandan"] },
  { value: "Uruguaya", country: "Uruguay", code: "UY", keywords: ["uruguay", "uruguayan"] },
  { value: "Uzbeka", country: "Uzbekistán", code: "UZ", keywords: ["uzbekistan", "uzbek"] },
  { value: "Vanuatuense", country: "Vanuatu", code: "VU", keywords: ["vanuatu", "ni-vanuatu"] },
  {
    value: "Vaticana",
    country: "Ciudad del Vaticano",
    code: "VA",
    keywords: ["vatican", "holy see", "vaticano"],
  },
  { value: "Venezolana", country: "Venezuela", code: "VE", keywords: ["venezuela", "venezuelan"] },
  { value: "Vietnamita", country: "Vietnam", code: "VN", keywords: ["vietnam", "vietnamese"] },
  {
    value: "Escocesa",
    country: "Escocia",
    code: "GB",
    keywords: ["scotland", "scottish", "uk", "united kingdom"],
  },
  { value: "Yemení", country: "Yemen", code: "YE", keywords: ["yemen", "yemeni"] },
  { value: "Yibutiana", country: "Yibuti", code: "DJ", keywords: ["djibouti", "djiboutian"] },
  { value: "Zambiana", country: "Zambia", code: "ZM", keywords: ["zambia", "zambian"] },
  { value: "Zimbabuense", country: "Zimbabue", code: "ZW", keywords: ["zimbabwe", "zimbabwean"] },
];

/** All nationality options, sorted alphabetically by Spanish country name. */
export const NATIONALITY_OPTIONS: NationalityOption[] = [...RAW_NATIONALITIES].sort((a, b) =>
  a.country.localeCompare(b.country, "es")
);

/** Backward-compat: flat list of canonical demonyms (DB values). */
export const NATIONALITIES: string[] = NATIONALITY_OPTIONS.map(n => n.value);

/** Pre-normalized search index so filtering stays cheap on every keystroke. */
const SEARCH_INDEX = NATIONALITY_OPTIONS.map(option => {
  const masculine = masculineForm(option.value);
  const aliases = [...option.keywords, ...(masculine ? [masculine] : [])];
  return {
    option,
    value: normalizeSearch(option.value),
    country: normalizeSearch(option.country),
    code: normalizeSearch(option.code),
    keywords: aliases.map(normalizeSearch),
    haystack: normalizeSearch([option.value, option.country, option.code, ...aliases].join(" ")),
  };
});

// Lower rank = better match. Floats the most likely option to the top
// (e.g. "nl" -> Países Bajos before substring hits like "fiNLandia").
function matchRank(entry: (typeof SEARCH_INDEX)[number], q: string): number {
  if (entry.code === q) return 0;
  if (entry.country === q || entry.value === q) return 1;
  if (entry.country.startsWith(q) || entry.value.startsWith(q)) return 2;
  if (entry.keywords.some(k => k.startsWith(q))) return 3;
  if (entry.haystack.includes(q)) return 4;
  return Infinity;
}

/**
 * Accent-insensitive search across demonym, country, ISO code and aliases.
 * Results are ranked (exact code / prefix matches first). Empty query returns
 * the full sorted list.
 */
export function searchNationalities(query: string): NationalityOption[] {
  const q = normalizeSearch(query);
  if (!q) return NATIONALITY_OPTIONS;
  return SEARCH_INDEX.map(entry => ({ entry, rank: matchRank(entry, q) }))
    .filter(r => r.rank !== Infinity)
    .sort((a, b) =>
      a.rank !== b.rank ? a.rank - b.rank : a.entry.country.localeCompare(b.entry.country, "es")
    )
    .map(r => r.entry.option);
}

/** Look up an option by its stored demonym (DB value). */
export function findNationalityByValue(
  value: string | null | undefined
): NationalityOption | undefined {
  if (!value) return undefined;
  return NATIONALITY_OPTIONS.find(n => n.value === value);
}
