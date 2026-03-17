import type { Language } from "../client/src/hooks/use-language";

export interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface BoatRoute {
  id: string;
  coordinates: RoutePoint[];
  color: string;
  distance: string;
  estimatedTime: string;
  difficulty: "easy" | "moderate" | "advanced";
  highlights: string[];
  descriptions: Record<Language, {
    name: string;
    description: string;
    highlights: string[];
  }>;
}

export const BLANES_PORT: RoutePoint = {
  lat: 41.6742,
  lng: 2.7930,
  name: "Puerto de Blanes",
};

export const boatRoutes: BoatRoute[] = [
  {
    id: "sa-palomera",
    coordinates: [
      // Puerto de Blanes → Sa Palomera (along Blanes beach, ~100m offshore)
      { lat: 41.6742, lng: 2.7930 },
      { lat: 41.6734, lng: 2.7926 },
      { lat: 41.6724, lng: 2.7922 },
      { lat: 41.6714, lng: 2.7919 },
      { lat: 41.6706, lng: 2.7916 },
    ],
    color: "#22c55e",
    distance: "1 km",
    estimatedTime: "15 min",
    difficulty: "easy",
    highlights: ["Sa Palomera", "Playa de Blanes"],
    descriptions: {
      es: {
        name: "Blanes - Sa Palomera",
        description: "Ruta corta ideal para principiantes. Navega desde el puerto hasta la iconica roca de Sa Palomera, simbolo de la Costa Brava. Perfecta para familias con ninos.",
        highlights: ["Roca de Sa Palomera", "Playa de Blanes", "Vistas al paseo maritimo"],
      },
      ca: {
        name: "Blanes - Sa Palomera",
        description: "Ruta curta ideal per a principiants. Navega des del port fins a la iconica roca de Sa Palomera, simbol de la Costa Brava. Perfecta per a families amb nens.",
        highlights: ["Roca de Sa Palomera", "Platja de Blanes", "Vistes al passeig maritim"],
      },
      en: {
        name: "Blanes - Sa Palomera",
        description: "Short route ideal for beginners. Sail from the port to the iconic Sa Palomera rock, symbol of Costa Brava. Perfect for families with children.",
        highlights: ["Sa Palomera Rock", "Blanes Beach", "Promenade views"],
      },
      fr: {
        name: "Blanes - Sa Palomera",
        description: "Route courte ideale pour les debutants. Naviguez du port jusqu'au rocher iconique de Sa Palomera, symbole de la Costa Brava. Parfait pour les familles.",
        highlights: ["Rocher Sa Palomera", "Plage de Blanes", "Vues sur la promenade"],
      },
      de: {
        name: "Blanes - Sa Palomera",
        description: "Kurze Route ideal für Anfänger. Segeln Sie vom Hafen zum ikonischen Sa Palomera Felsen, dem Symbol der Costa Brava. Perfekt für Familien mit Kindern.",
        highlights: ["Sa Palomera Felsen", "Strand von Blanes", "Blick auf die Promenade"],
      },
      nl: {
        name: "Blanes - Sa Palomera",
        description: "Korte route ideaal voor beginners. Vaar van de haven naar de iconische Sa Palomera rots, symbool van de Costa Brava. Perfect voor families met kinderen.",
        highlights: ["Sa Palomera Rots", "Strand van Blanes", "Uitzicht op de boulevard"],
      },
      it: {
        name: "Blanes - Sa Palomera",
        description: "Percorso breve ideale per principianti. Naviga dal porto all'iconica roccia di Sa Palomera, simbolo della Costa Brava. Perfetto per famiglie con bambini.",
        highlights: ["Roccia Sa Palomera", "Spiaggia di Blanes", "Vista sul lungomare"],
      },
      ru: {
        name: "Бланес - Са Паломера",
        description: "Короткий маршрут, идеальный для начинающих. Плывите от порта до знаменитой скалы Са Паломера, символа Коста-Бравы. Идеально для семей с детьми.",
        highlights: ["Скала Са Паломера", "Пляж Бланес", "Вид на набережную"],
      },
    },
  },
  {
    id: "cala-sant-francesc",
    coordinates: [
      // Puerto → NE coast → Sa Forcanera headland → Cala Sant Francesc (~200m offshore)
      { lat: 41.6742, lng: 2.7930 },
      { lat: 41.6744, lng: 2.7958 },
      { lat: 41.6746, lng: 2.7985 },
      { lat: 41.6743, lng: 2.8012 },
      { lat: 41.6740, lng: 2.8038 },
      { lat: 41.6748, lng: 2.8055 },
      { lat: 41.6762, lng: 2.8065 },
      { lat: 41.6778, lng: 2.8068 },
      { lat: 41.6790, lng: 2.8062 },
    ],
    color: "#3b82f6",
    distance: "3 km",
    estimatedTime: "30 min",
    difficulty: "easy",
    highlights: ["Cala Sant Francesc", "Jardín Botánico Marimurtra"],
    descriptions: {
      es: {
        name: "Blanes - Cala Sant Francesc",
        description: "Navega hasta una de las calas mas bonitas de Blanes. Aguas cristalinas rodeadas de pinos. Ideal para snorkel y bano. Cerca del famoso Jardin Botanico Marimurtra.",
        highlights: ["Cala Sant Francesc", "Jardin Botanico Marimurtra", "Aguas cristalinas", "Zona de snorkel"],
      },
      ca: {
        name: "Blanes - Cala Sant Francesc",
        description: "Navega fins a una de les cales mes boniques de Blanes. Aigues cristallines envoltades de pins. Ideal per a snorkel i bany. A prop del famis Jardi Botanic Marimurtra.",
        highlights: ["Cala Sant Francesc", "Jardi Botanic Marimurtra", "Aigues cristallines", "Zona de snorkel"],
      },
      en: {
        name: "Blanes - Cala Sant Francesc",
        description: "Sail to one of the most beautiful coves in Blanes. Crystal clear waters surrounded by pine trees. Ideal for snorkeling and swimming. Near the famous Marimurtra Botanical Garden.",
        highlights: ["Cala Sant Francesc", "Marimurtra Botanical Garden", "Crystal clear waters", "Snorkeling area"],
      },
      fr: {
        name: "Blanes - Cala Sant Francesc",
        description: "Naviguez vers l'une des plus belles criques de Blanes. Eaux cristallines entourees de pins. Ideal pour le snorkeling et la baignade. Pres du celebre Jardin Botanique Marimurtra.",
        highlights: ["Cala Sant Francesc", "Jardin Botanique Marimurtra", "Eaux cristallines", "Zone de snorkeling"],
      },
      de: {
        name: "Blanes - Cala Sant Francesc",
        description: "Segeln Sie zu einer der schönsten Buchten von Blanes. Kristallklares Wasser umgeben von Pinien. Ideal zum Schnorcheln und Schwimmen. Nahe dem berühmten Botanischen Garten Marimurtra.",
        highlights: ["Cala Sant Francesc", "Botanischer Garten Marimurtra", "Kristallklares Wasser", "Schnorchelgebiet"],
      },
      nl: {
        name: "Blanes - Cala Sant Francesc",
        description: "Vaar naar een van de mooiste baaien van Blanes. Kristalhelder water omringd door pijnbomen. Ideaal voor snorkelen en zwemmen. Dichtbij de beroemde Botanische Tuin Marimurtra.",
        highlights: ["Cala Sant Francesc", "Botanische Tuin Marimurtra", "Kristalhelder water", "Snorkelgebied"],
      },
      it: {
        name: "Blanes - Cala Sant Francesc",
        description: "Naviga verso una delle calette piu belle di Blanes. Acque cristalline circondate da pini. Ideale per snorkeling e nuoto. Vicino al famoso Giardino Botanico Marimurtra.",
        highlights: ["Cala Sant Francesc", "Giardino Botanico Marimurtra", "Acque cristalline", "Zona snorkeling"],
      },
      ru: {
        name: "Бланес - Кала Сан Франческ",
        description: "Плывите к одной из самых красивых бухт Бланеса. Кристально чистые воды в окружении сосен. Идеально для снорклинга и купания. Рядом со знаменитым Ботаническим садом Маримуртра.",
        highlights: ["Кала Сан Франческ", "Ботанический сад Маримуртра", "Кристально чистая вода", "Зона снорклинга"],
      },
    },
  },
  {
    id: "blanes-lloret",
    coordinates: [
      // Puerto → Sa Forcanera → Cala Sant Francesc → Santa Cristina → Fenals → Lloret (~250m offshore)
      { lat: 41.6742, lng: 2.7930 },
      { lat: 41.6744, lng: 2.7960 },
      { lat: 41.6743, lng: 2.7995 },
      { lat: 41.6740, lng: 2.8030 },
      { lat: 41.6745, lng: 2.8055 },
      { lat: 41.6765, lng: 2.8070 },
      { lat: 41.6790, lng: 2.8080 },
      { lat: 41.6815, lng: 2.8105 },
      { lat: 41.6840, lng: 2.8135 },
      { lat: 41.6862, lng: 2.8170 },
      { lat: 41.6882, lng: 2.8205 },
      { lat: 41.6905, lng: 2.8250 },
      { lat: 41.6925, lng: 2.8300 },
      { lat: 41.6945, lng: 2.8355 },
      { lat: 41.6960, lng: 2.8410 },
      { lat: 41.6975, lng: 2.8460 },
      { lat: 41.6982, lng: 2.8490 },
    ],
    color: "#f59e0b",
    distance: "5.5 km",
    estimatedTime: "45 min",
    difficulty: "easy",
    highlights: ["Lloret de Mar", "Platja de Fenals", "Cala Boadella"],
    descriptions: {
      es: {
        name: "Blanes - Lloret de Mar",
        description: "Ruta clasica por la costa. Navega desde Blanes hasta Lloret de Mar pasando por calas escondidas. Descubre Fenals y Cala Boadella, dos playas imprescindibles.",
        highlights: ["Lloret de Mar", "Platja de Fenals", "Cala Boadella", "Calas escondidas"],
      },
      ca: {
        name: "Blanes - Lloret de Mar",
        description: "Ruta classica per la costa. Navega des de Blanes fins a Lloret de Mar passant per cales amagades. Descobreix Fenals i Cala Boadella, dues platges imprescindibles.",
        highlights: ["Lloret de Mar", "Platja de Fenals", "Cala Boadella", "Cales amagades"],
      },
      en: {
        name: "Blanes - Lloret de Mar",
        description: "Classic coastal route. Sail from Blanes to Lloret de Mar passing by hidden coves. Discover Fenals and Cala Boadella, two must-visit beaches.",
        highlights: ["Lloret de Mar", "Fenals Beach", "Cala Boadella", "Hidden coves"],
      },
      fr: {
        name: "Blanes - Lloret de Mar",
        description: "Route cotiere classique. Naviguez de Blanes a Lloret de Mar en passant par des criques cachees. Decouvrez Fenals et Cala Boadella, deux plages incontournables.",
        highlights: ["Lloret de Mar", "Plage de Fenals", "Cala Boadella", "Criques cachees"],
      },
      de: {
        name: "Blanes - Lloret de Mar",
        description: "Klassische Küstenroute. Segeln Sie von Blanes nach Lloret de Mar vorbei an versteckten Buchten. Entdecken Sie Fenals und Cala Boadella, zwei Strände die man gesehen haben muss.",
        highlights: ["Lloret de Mar", "Strand Fenals", "Cala Boadella", "Versteckte Buchten"],
      },
      nl: {
        name: "Blanes - Lloret de Mar",
        description: "Klassieke kustroute. Vaar van Blanes naar Lloret de Mar langs verborgen baaien. Ontdek Fenals en Cala Boadella, twee stranden die u moet bezoeken.",
        highlights: ["Lloret de Mar", "Fenals Strand", "Cala Boadella", "Verborgen baaien"],
      },
      it: {
        name: "Blanes - Lloret de Mar",
        description: "Percorso costiero classico. Naviga da Blanes a Lloret de Mar passando per calette nascoste. Scopri Fenals e Cala Boadella, due spiagge imperdibili.",
        highlights: ["Lloret de Mar", "Spiaggia Fenals", "Cala Boadella", "Calette nascoste"],
      },
      ru: {
        name: "Бланес - Льорет-де-Мар",
        description: "Классический прибрежный маршрут. Плывите из Бланеса в Льорет-де-Мар мимо скрытых бухт. Откройте для себя Феналс и Кала Боаделья, два обязательных пляжа.",
        highlights: ["Льорет-де-Мар", "Пляж Феналс", "Кала Боаделья", "Скрытые бухты"],
      },
    },
  },
  {
    id: "blanes-tossa",
    coordinates: [
      // Puerto → coast NE → Lloret → Cala Canyelles → Tossa de Mar (~300m offshore)
      { lat: 41.6742, lng: 2.7930 },
      { lat: 41.6744, lng: 2.7965 },
      { lat: 41.6741, lng: 2.8015 },
      { lat: 41.6740, lng: 2.8050 },
      { lat: 41.6760, lng: 2.8072 },
      { lat: 41.6800, lng: 2.8098 },
      { lat: 41.6845, lng: 2.8145 },
      { lat: 41.6878, lng: 2.8195 },
      { lat: 41.6915, lng: 2.8270 },
      { lat: 41.6948, lng: 2.8365 },
      { lat: 41.6975, lng: 2.8460 },
      { lat: 41.6995, lng: 2.8535 },
      { lat: 41.7015, lng: 2.8620 },
      { lat: 41.7030, lng: 2.8700 },
      { lat: 41.7045, lng: 2.8770 },
      { lat: 41.7055, lng: 2.8835 },
      { lat: 41.7070, lng: 2.8905 },
      { lat: 41.7085, lng: 2.8970 },
      { lat: 41.7098, lng: 2.9040 },
      { lat: 41.7112, lng: 2.9105 },
      { lat: 41.7128, lng: 2.9165 },
      { lat: 41.7145, lng: 2.9225 },
      { lat: 41.7162, lng: 2.9280 },
      { lat: 41.7180, lng: 2.9330 },
    ],
    color: "#ef4444",
    distance: "12 km",
    estimatedTime: "1h 15min",
    difficulty: "moderate",
    highlights: ["Tossa de Mar", "Vila Vella", "Cala Giverola"],
    descriptions: {
      es: {
        name: "Blanes - Tossa de Mar",
        description: "Ruta espectacular hasta el pueblo medieval de Tossa de Mar. Navega por acantilados y calas virgenes hasta llegar a la Vila Vella, patrimonio historico de la Costa Brava.",
        highlights: ["Tossa de Mar", "Vila Vella (murallas medievales)", "Cala Giverola", "Acantilados y cuevas"],
      },
      ca: {
        name: "Blanes - Tossa de Mar",
        description: "Ruta espectacular fins al poble medieval de Tossa de Mar. Navega per penya-segats i cales verges fins arribar a la Vila Vella, patrimoni historic de la Costa Brava.",
        highlights: ["Tossa de Mar", "Vila Vella (muralles medievals)", "Cala Giverola", "Penya-segats i coves"],
      },
      en: {
        name: "Blanes - Tossa de Mar",
        description: "Spectacular route to the medieval town of Tossa de Mar. Sail along cliffs and pristine coves to reach the Vila Vella, historic heritage of Costa Brava.",
        highlights: ["Tossa de Mar", "Vila Vella (medieval walls)", "Cala Giverola", "Cliffs and caves"],
      },
      fr: {
        name: "Blanes - Tossa de Mar",
        description: "Route spectaculaire jusqu'au village medieval de Tossa de Mar. Naviguez le long des falaises et criques vierges jusqu'a la Vila Vella, patrimoine historique de la Costa Brava.",
        highlights: ["Tossa de Mar", "Vila Vella (murailles medievales)", "Cala Giverola", "Falaises et grottes"],
      },
      de: {
        name: "Blanes - Tossa de Mar",
        description: "Spektakuläre Route zur mittelalterlichen Stadt Tossa de Mar. Segeln Sie entlang von Klippen und unberührten Buchten zur Vila Vella, dem historischen Erbe der Costa Brava.",
        highlights: ["Tossa de Mar", "Vila Vella (mittelalterliche Mauern)", "Cala Giverola", "Klippen und Höhlen"],
      },
      nl: {
        name: "Blanes - Tossa de Mar",
        description: "Spectaculaire route naar het middeleeuwse stadje Tossa de Mar. Vaar langs kliffen en ongerepte baaien naar de Vila Vella, historisch erfgoed van de Costa Brava.",
        highlights: ["Tossa de Mar", "Vila Vella (middeleeuwse muren)", "Cala Giverola", "Kliffen en grotten"],
      },
      it: {
        name: "Blanes - Tossa de Mar",
        description: "Percorso spettacolare verso il borgo medievale di Tossa de Mar. Naviga lungo scogliere e calette incontaminate fino alla Vila Vella, patrimonio storico della Costa Brava.",
        highlights: ["Tossa de Mar", "Vila Vella (mura medievali)", "Cala Giverola", "Scogliere e grotte"],
      },
      ru: {
        name: "Бланес - Тосса-де-Мар",
        description: "Захватывающий маршрут до средневекового города Тосса-де-Мар. Плывите вдоль скал и нетронутых бухт до Вила-Велья, исторического наследия Коста-Бравы.",
        highlights: ["Тосса-де-Мар", "Вила-Велья (средневековые стены)", "Кала Хиверола", "Скалы и пещеры"],
      },
    },
  },
  {
    id: "costa-brava-tour",
    coordinates: [
      // Ida: Puerto → Tossa (~300m offshore, same as blanes-tossa)
      { lat: 41.6742, lng: 2.7930 },
      { lat: 41.6744, lng: 2.7965 },
      { lat: 41.6740, lng: 2.8030 },
      { lat: 41.6755, lng: 2.8068 },
      { lat: 41.6800, lng: 2.8098 },
      { lat: 41.6855, lng: 2.8160 },
      { lat: 41.6915, lng: 2.8270 },
      { lat: 41.6960, lng: 2.8400 },
      { lat: 41.6990, lng: 2.8510 },
      { lat: 41.7030, lng: 2.8700 },
      { lat: 41.7058, lng: 2.8845 },
      { lat: 41.7090, lng: 2.8990 },
      { lat: 41.7125, lng: 2.9155 },
      { lat: 41.7165, lng: 2.9290 },
      { lat: 41.7180, lng: 2.9330 },
      // Vuelta: ~600m offshore (más mar adentro)
      { lat: 41.7160, lng: 2.9270 },
      { lat: 41.7120, lng: 2.9100 },
      { lat: 41.7075, lng: 2.8920 },
      { lat: 41.7035, lng: 2.8720 },
      { lat: 41.6985, lng: 2.8500 },
      { lat: 41.6930, lng: 2.8300 },
      { lat: 41.6870, lng: 2.8150 },
      { lat: 41.6800, lng: 2.8020 },
      { lat: 41.6755, lng: 2.7960 },
      { lat: 41.6742, lng: 2.7930 },
    ],
    color: "#8b5cf6",
    distance: "25 km",
    estimatedTime: "4-6h",
    difficulty: "advanced",
    highlights: ["Tour completo", "Tossa de Mar", "Lloret de Mar", "Calas virgenes"],
    descriptions: {
      es: {
        name: "Tour Costa Brava Completo",
        description: "La experiencia definitiva. Ida y vuelta desde Blanes hasta Tossa de Mar, explorando todas las calas y pueblos de la costa. Requiere dia completo y experiencia de navegacion.",
        highlights: ["Tour completo ida y vuelta", "Todas las calas de la costa", "Tossa de Mar y Lloret", "Paradas para bano y snorkel"],
      },
      ca: {
        name: "Tour Costa Brava Complet",
        description: "L'experiencia definitiva. Anada i tornada des de Blanes fins a Tossa de Mar, explorant totes les cales i pobles de la costa. Requereix dia complet i experiencia de navegacio.",
        highlights: ["Tour complet anada i tornada", "Totes les cales de la costa", "Tossa de Mar i Lloret", "Parades per a bany i snorkel"],
      },
      en: {
        name: "Full Costa Brava Tour",
        description: "The ultimate experience. Round trip from Blanes to Tossa de Mar, exploring all coves and coastal towns. Requires a full day and sailing experience.",
        highlights: ["Full round trip tour", "All coastal coves", "Tossa de Mar and Lloret", "Swimming and snorkeling stops"],
      },
      fr: {
        name: "Tour Costa Brava Complet",
        description: "L'experience ultime. Aller-retour de Blanes a Tossa de Mar, en explorant toutes les criques et villages de la cote. Necessite une journee complete et de l'experience de navigation.",
        highlights: ["Tour complet aller-retour", "Toutes les criques de la cote", "Tossa de Mar et Lloret", "Arrets baignade et snorkeling"],
      },
      de: {
        name: "Vollständige Costa Brava Tour",
        description: "Das ultimative Erlebnis. Hin- und Rückfahrt von Blanes nach Tossa de Mar, alle Buchten und Küstenorte erkunden. Erfordert einen ganzen Tag und Segelerfahrung.",
        highlights: ["Vollständige Hin- und Rücktour", "Alle Küstenbuchten", "Tossa de Mar und Lloret", "Schwimm- und Schnorchelpausen"],
      },
      nl: {
        name: "Volledige Costa Brava Tour",
        description: "De ultieme ervaring. Rondreis van Blanes naar Tossa de Mar, alle baaien en kustplaatsen verkennen. Vereist een volle dag en vaarervaring.",
        highlights: ["Volledige rondreis", "Alle kustbaaien", "Tossa de Mar en Lloret", "Zwem- en snorkelstops"],
      },
      it: {
        name: "Tour Costa Brava Completo",
        description: "L'esperienza definitiva. Andata e ritorno da Blanes a Tossa de Mar, esplorando tutte le calette e i paesi costieri. Richiede una giornata intera e esperienza di navigazione.",
        highlights: ["Tour completo andata e ritorno", "Tutte le calette della costa", "Tossa de Mar e Lloret", "Soste per bagno e snorkeling"],
      },
      ru: {
        name: "Полный тур по Коста-Браве",
        description: "Незабываемый опыт. Круговой маршрут из Бланеса в Тосса-де-Мар с исследованием всех бухт и прибрежных городков. Требуется целый день и опыт навигации.",
        highlights: ["Полный круговой тур", "Все прибрежные бухты", "Тосса-де-Мар и Льорет", "Остановки для купания и снорклинга"],
      },
    },
  },
];
