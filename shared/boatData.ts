// Real boat data from costabravarentaboat.com
// Image imports moved to client-side to avoid ESBuild PNG import issues during server build

export interface BoatData {
  id: string;
  name: string;
  image: string;
  subtitle: string;
  description: string;
  emotionTag?: string; // i18n key for emotion tag
  specifications: {
    model: string;
    length: string;
    beam: string;
    engine: string;
    fuel: string;
    capacity: string;
    deposit: string;
  };
  equipment: string[];
  included: string[];
  features: string[];
  pricing: {
    BAJA: {
      period: string;
      prices: { [key: string]: number };
      /** Optional explicit weekend prices by duration. When set for a duration,
       * it overrides the global +15% weekend surcharge for that slot (exact price). */
      weekendPrices?: { [key: string]: number };
    };
    MEDIA: {
      period: string;
      prices: { [key: string]: number };
      /** Optional explicit weekend prices by duration. When set for a duration,
       * it overrides the global +15% weekend surcharge for that slot (exact price). */
      weekendPrices?: { [key: string]: number };
    };
    ALTA: {
      period: string;
      prices: { [key: string]: number };
      /** Optional explicit weekend prices by duration. When set for a duration,
       * it overrides the global +15% weekend surcharge for that slot (exact price). */
      weekendPrices?: { [key: string]: number };
    };
  };
  extras: Array<{
    name: string;
    price: string;
    icon: string;
  }>;
}

export const BOAT_DATA: { [key: string]: BoatData } = {
  "solar-450": {
    id: "solar-450",
    name: "Solar 450",
    image: "SOLAR_450_boat_photo_b70eb7e1.png",
    emotionTag: "emotionTags.sunLovers",
    subtitle: "Sin licencia · 5 personas · Para disfrutar del sol",
    description: "El barco pensado para quienes quieren tomar el sol en el mar. Su solárium acolchado es el más amplio de toda la flota sin licencia: fondea en una cala de agua turquesa cerca de Blanes y relájate como en ningún otro sitio. Sin carnet necesario, te enseñamos a manejarla en 15 minutos. Gasolina, seguro y equipo de seguridad incluidos.",
    specifications: {
      model: "Solar 450",
      length: "4,50m",
      beam: "1,50m",
      engine: "Mercury 15cv 4t",
      fuel: "Gasolina 30L",
      capacity: "5 Personas",
      deposit: "250€"
    },
    equipment: [
      "Toldo",
      "Arranque eléctrico", 
      "Gran solárium de proa",
      "Escalera de baño",
      "Equipo de seguridad y salvamento"
    ],
    included: [
      "IVA",
      "Carburante",
      "Amarre", 
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    features: [
      "Sin licencia requerida",
      "Hasta 5 personas",
      "Gasolina incluida",
      "Equipo de seguridad",
      "Escalera de baño"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "1h": 75, "2h": 115, "3h": 130, "4h": 150, "6h": 190, "8h": 220 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 85, "2h": 140, "3h": 170, "4h": 200, "6h": 230, "8h": 270 },
        weekendPrices: { "3h": 190, "4h": 220 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 95, "2h": 150, "3h": 180, "4h": 210, "6h": 260, "8h": 300 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" }
    ]
  },

  "remus-450": {
    id: "remus-450",
    name: "Remus 450",
    image: "REMUS_450_boat_photo_ec8b926c.png",
    emotionTag: "emotionTags.familyFavorite",
    subtitle: "Sin licencia · 5 personas · El favorito de parejas y familias",
    description: "El barco más alquilado de Blanes y la primera elección de parejas y familias con niños. Su toldo Bi Mini cubre toda la embarcación para proteger a los peques del sol, y su estabilidad la hace ideal si es vuestra primera vez en el mar. Perfecto para 2-5 personas que buscan una jornada tranquila en calas de agua cristalina. Te enseñamos a manejarlo en 15 minutos. Gasolina, seguro y equipo de seguridad incluidos.",
    specifications: {
      model: "Remus 450",
      length: "4,5m",
      beam: "1,6m",
      engine: "Suzuki 15cv 4t",
      fuel: "Gasolina 25L",
      capacity: "5 Personas",
      deposit: "200€"
    },
    equipment: [
      "Toldo Bi Mini",
      "Arranque eléctrico",
      "Gran solárium de proa",
      "Escalera de baño",
      "Equipo de seguridad y salvamento"
    ],
    included: [
      "IVA",
      "Carburante",
      "Amarre",
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    features: [
      "Sin licencia requerida",
      "Hasta 5 personas",
      "Gasolina incluida",
      "Equipo de seguridad",
      "Escalera de baño"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "1h": 75, "2h": 115, "3h": 130, "4h": 150, "6h": 190, "8h": 220 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 85, "2h": 140, "3h": 170, "4h": 200, "6h": 230, "8h": 270 },
        weekendPrices: { "3h": 190, "4h": 220 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 95, "2h": 140, "3h": 170, "4h": 210, "6h": 250, "8h": 290 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" }
    ]
  },

  "remus-450-ii": {
    id: "remus-450-ii",
    name: "Remus 450 II",
    image: "REMUS_450_boat_photo_ec8b926c.png",
    emotionTag: "emotionTags.alwaysAvailable",
    subtitle: "Sin licencia · 5 personas · Disponibilidad extra",
    description: "Mismo modelo que nuestro barco más popular, con disponibilidad garantizada incluso en pleno agosto. Ideal si la Remus 450 ya está reservada: disfrutas del mismo confort, la misma estabilidad y el toldo Bi Mini que tanto valoran las familias en la Costa Brava. Gasolina, seguro y equipo de seguridad incluidos.",
    specifications: {
      model: "Remus 450",
      length: "4,5m",
      beam: "1,6m",
      engine: "Suzuki 15cv 4t",
      fuel: "Gasolina 25L",
      capacity: "5 Personas",
      deposit: "200€"
    },
    equipment: [
      "Toldo Bi Mini",
      "Arranque eléctrico",
      "Gran solárium de proa",
      "Escalera de baño",
      "Equipo de seguridad y salvamento"
    ],
    included: [
      "IVA",
      "Carburante",
      "Amarre",
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    features: [
      "Sin licencia requerida",
      "Hasta 5 personas",
      "Gasolina incluida",
      "Equipo de seguridad",
      "Escalera de baño"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "1h": 75, "2h": 115, "3h": 130, "4h": 150, "6h": 190, "8h": 220 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 85, "2h": 140, "3h": 170, "4h": 200, "6h": 230, "8h": 270 },
        weekendPrices: { "3h": 190, "4h": 220 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 95, "2h": 140, "3h": 170, "4h": 210, "6h": 250, "8h": 290 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" }
    ]
  },

  "astec-400": {
    id: "astec-400",
    name: "Astec 400",
    image: "ASTEC_400_boat_photo_9dde16a8.png",
    emotionTag: "emotionTags.bestPrice",
    subtitle: "Sin licencia · 4 personas · El mejor precio por persona",
    description: "La opción más económica para parejas y familias que quieren disfrutar del mar sin gastar de más. Al ser 2-4 personas, el precio por persona es el más bajo de toda la flota. Estable, fácil de manejar y con toldo Bi Mini para proteger a los peques del sol. Fondea en calas tranquilas cerca de Blanes sin necesidad de carnet náutico. Gasolina, seguro y equipo de seguridad incluidos.",
    specifications: {
      model: "Astec 400",
      length: "4m",
      beam: "1,75m",
      engine: "Suzuki 15hp 4t",
      fuel: "Gasolina 25L",
      capacity: "4 Personas",
      deposit: "200€"
    },
    equipment: [
      "Toldo Bi Mini",
      "Arranque eléctrico", 
      "Gran solárium de proa",
      "Escalera de baño",
      "Equipo de seguridad y salvamento"
    ],
    included: [
      "IVA",
      "Carburante",
      "Amarre", 
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    features: [
      "Sin licencia requerida",
      "Hasta 4 personas",
      "Gasolina incluida",
      "Equipo de seguridad",
      "Perfecta para parejas"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "1h": 70, "2h": 100, "3h": 120, "4h": 140, "6h": 180, "8h": 200 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 80, "2h": 120, "3h": 150, "4h": 170, "6h": 210, "8h": 250 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 90, "2h": 140, "3h": 170, "4h": 190, "6h": 240, "8h": 280 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" }
    ]
  },


  "astec-480": {
    id: "astec-480",
    name: "Astec 480",
    image: "ASTEC_480_boat_photo.png",
    emotionTag: "emotionTags.premiumNoLicense",
    subtitle: "Sin licencia · 5 personas · Premium con bluetooth",
    description: "La experiencia premium sin necesidad de carnet náutico. Con 4,80m de eslora, equipo de música bluetooth, solárium acolchado y el doble de depósito de combustible, es la embarcación sin licencia más completa de Blanes. Navega con tu música favorita hacia las calas más bonitas de la Costa Brava. Gasolina, seguro y equipo de seguridad incluidos.",
    specifications: {
      model: "Fibra Astec 480",
      length: "4,80m",
      beam: "1,75m",
      engine: "Parsun 40/15cv",
      fuel: "Gasolina 50L",
      capacity: "5 Personas",
      deposit: "300€"
    },
    equipment: [
      "Toldo Bi Mini",
      "Equipo de música bluetooth",
      "Arranque eléctrico", 
      "Gran solárium de proa",
      "Escalera de baño",
      "Equipo de seguridad y salvamento"
    ],
    included: [
      "IVA",
      "Carburante",
      "Amarre", 
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    features: [
      "Sin licencia requerida",
      "Hasta 5 personas",
      "Gasolina incluida",
      "Equipo de música",
      "Más espaciosa"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "1h": 80, "2h": 150, "3h": 180, "4h": 200, "6h": 240, "8h": 270 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 90, "2h": 160, "3h": 210, "4h": 230, "6h": 270, "8h": 340 },
        weekendPrices: { "3h": 210, "4h": 250 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 100, "2h": 180, "3h": 220, "4h": 250, "6h": 290, "8h": 370 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" }
    ]
  },

  "mingolla-brava-19": {
    id: "mingolla-brava-19",
    name: "Mingolla Brava 19",
    image: "MINGOLLA_BRAVA_19_boat_c0e4a5b5.png",
    emotionTag: "emotionTags.explorer",
    subtitle: "Con licencia · 6 personas · Lloret en 15 min, Tossa en 30",
    description: "La lancha ideal para explorar toda la costa: Lloret de Mar en 15 minutos, Tossa de Mar en media hora. Con 80cv, GPS y sonda náutica, llegas a calas que otros barcos no alcanzan. Ducha de agua dulce, bluetooth y arco inox para deportes acuáticos. Todo el equipamiento para recorrer la Costa Brava con total autonomía. Requiere Licencia de Navegación (LN) o superior.",
    specifications: {
      model: "Brava 19",
      length: "5,99m",
      beam: "2,35m",
      engine: "Mercury 80cv",
      fuel: "Gasolina 80L",
      capacity: "6 Personas",
      deposit: "500€"
    },
    equipment: [
      "Radio bluetooth",
      "Altavoces",
      "Sonda", 
      "GPS",
      "Ducha",
      "Toldo bimini",
      "Nevera",
      "Arco de Inox para deportes acuáticos"
    ],
    included: [
      "IVA",
      "Amarre", 
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    features: [
      "Licencia de Navegación (LN) requerida",
      "Hasta 6 personas",
      "GPS y sonda incluidos", 
      "Ducha agua dulce",
      "Deportiva elegante",
      "Combustible NO incluido"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "2h": 160, "4h": 230, "8h": 280 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "2h": 180, "4h": 260, "8h": 340 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "2h": 200, "4h": 280, "8h": 390 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" }
    ]
  },

  "trimarchi-57s": {
    id: "trimarchi-57s",
    name: "Trimarchi 57S",
    image: "Trimarchi_57S_luxury_boat_0ef0159a.png",
    emotionTag: "emotionTags.adrenaline",
    subtitle: "Con licencia · 7 personas · Adrenalina para grupos",
    description: "110cv de diseño italiano para grupos de hasta 7 personas que quieren adrenalina y confort a partes iguales. Solárium doble en proa y popa para tomar el sol, mesa central para comer fondeados en una cala y la potencia para llegar a cualquier rincón entre Blanes y Tossa de Mar en minutos. La embarcación que elige quien quiere sentir la velocidad sin renunciar a nada. Requiere Licencia de Navegación (LN) o superior.",
    specifications: {
      model: "Trimarchi 57S",
      length: "5,7m",
      beam: "2,1m",
      engine: "Selva 110XS",
      fuel: "Gasolina 136L",
      capacity: "7 Personas",
      deposit: "500€"
    },
    equipment: [
      "Radio bluetooth",
      "Altavoces",
      "Sonda", 
      "GPS",
      "Ducha",
      "Toldo bimini",
      "Nevera",
      "Arco de Inox para deportes acuáticos"
    ],
    included: [
      "IVA",
      "Amarre", 
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    features: [
      "Licencia de Navegación (LN) requerida",
      "Hasta 7 personas",
      "Ideal para velocidad", 
      "Ducha agua dulce",
      "Mesa central",
      "Combustible NO incluido"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "2h": 160, "4h": 240, "8h": 290 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "2h": 190, "4h": 260, "8h": 340 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "2h": 210, "4h": 290, "8h": 400 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" }
    ]
  },

  "pacific-craft-625": {
    id: "pacific-craft-625",
    name: "Pacific Craft 625",
    image: "PACIFIC_CRAFT_625_boat_fbe4f4d0.png",
    emotionTag: "emotionTags.luxury",
    subtitle: "Con licencia · 7 personas · La experiencia de lujo",
    description: "Lo mejor que puedes alquilar en Blanes. 6,24 metros de eslora, motor Yamaha 115cv y espacio de lujo para 7 personas. Solárium doble, mesa para comer fondeados frente a una cala, ducha de agua dulce y mando electrónico. Para quienes no quieren compromisos y buscan la experiencia náutica más completa de la Costa Brava. Requiere Licencia de Navegación (LN) o superior.",
    specifications: {
      model: "Pacific Craft 625 Open",
      length: "6,24m",
      beam: "2,51m",
      engine: "Yamaha 115cv 4T",
      fuel: "Gasolina 127L",
      capacity: "7 Personas",
      deposit: "500€"
    },
    equipment: [
      "Radio bluetooth",
      "Altavoces",
      "Solárium en proa y popa",
      "Toldo bimini inox",
      "Mesa en popa y/o proa", 
      "Ducha de agua dulce",
      "Mando electrónico",
      "Escalera de baño",
      "Bichero",
      "Cabos",
      "Defensas",
      "Apta para deportes náuticos"
    ],
    included: [
      "IVA",
      "Amarre", 
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    features: [
      "Licencia de Navegación (LN) requerida",
      "Hasta 7 personas",
      "Embarcación premium", 
      "Mesa para comidas",
      "Lujo y confort",
      "Combustible NO incluido"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "2h": 180, "4h": 250, "8h": 300 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "2h": 200, "4h": 280, "8h": 360 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "2h": 220, "4h": 300, "8h": 420 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" }
    ]
  },

  "excursion-privada": {
    id: "excursion-privada",
    name: "Excursión Privada con Capitán",
    image: "PACIFIC_CRAFT_625_boat_fbe4f4d0.png",
    emotionTag: "emotionTags.vip",
    subtitle: "Con patrón · 6 personas · Experiencia VIP",
    description: "Tú solo disfrutas: nuestro patrón profesional te lleva a calas secretas, cuevas marinas y rincones inaccesibles a pie entre Blanes y Tossa de Mar. Fondearéis en la cala perfecta del día, elegida según viento y corrientes. Ideal para celebraciones, aniversarios o familias que quieren una excursión privada exclusiva por la Costa Brava sin preocuparse de nada.",
    specifications: {
      model: "Pacific Craft 625 Open",
      length: "6,24m",
      beam: "2,51m",
      engine: "Yamaha 115cv 4T",
      fuel: "Gasolina 127L",
      capacity: "6 Personas",
      deposit: "500€"
    },
    equipment: [
      "Patrón profesional",
      "Radio bluetooth",
      "Altavoces",
      "Solárium en proa y popa",
      "Toldo bimini inox",
      "Mesa en popa y/o proa",
      "Ducha de agua dulce",
      "Escalera de baño",
      "Equipo de seguridad y salvamento"
    ],
    included: [
      "IVA",
      "Patrón profesional",
      "Amarre",
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    features: [
      "No requiere licencia",
      "Patrón profesional incluido",
      "Hasta 6 personas",
      "Calas escondidas y cuevas",
      "Parada para nadar",
      "Combustible NO incluido"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "2h": 240, "3h": 320, "4h": 380 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "2h": 260, "3h": 340, "4h": 400 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "2h": 280, "3h": 360, "4h": 420 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Agua y refrescos", price: "2€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" }
    ]
  }
};

// Boats piloted by a professional captain: the customer needs no licence, but
// unlike the self-drive licence-free fleet, fuel is NOT included. Surfaces that
// branch on `!requiresLicense` alone mislabel these (impeccable sweep P1.2).
export const CAPTAINED_BOAT_IDS: ReadonlySet<string> = new Set(["excursion-privada"]);

export function isCaptainedBoat(boatId: string): boolean {
  return CAPTAINED_BOAT_IDS.has(boatId);
}

/**
 * Single source for the "fuel included" claim. Canon: only the self-drive
 * licence-free boats include fuel; licensed boats, the captained excursion and
 * jet skis do NOT (see CLAUDE.md "Hechos canonicos").
 */
export function boatIncludesFuel(boatId: string, requiresLicense: boolean | null | undefined): boolean {
  if (requiresLicense) return false;
  if (isCaptainedBoat(boatId)) return false;
  if (boatId.startsWith("jetski")) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Live fleet statistics (single source for "N boats / from X€/h" copy)
// ---------------------------------------------------------------------------
//
// The CATALOG is the 9 boats above. The LIVE fleet is the subset with
// `is_active` in the DB (managed from the CRM). The owner deactivated the
// Astec 400 on 2026-05-29, so today the live fleet is 8 (4 license-free + 3
// licensed + 1 captained excursion) and the cheapest license-free boat is
// 75 EUR/h. Machine-readable surfaces (meta, llms.txt, ai-citations) must
// reflect the LIVE fleet, not the catalog — see CLAUDE.md "Flota viva".
//
// These helpers compute the stats from whatever active set they're given, so
// the numbers track the CRM toggle automatically and never need hand-editing.

// Boats currently deactivated in the live fleet. Used ONLY as the static
// fallback when the DB isn't reachable (so the fallback still yields 8/75, not
// the catalog's 9/70). The DB `is_active` column is the real source of truth;
// update this list if the owner permanently changes which hull is offered.
export const BASELINE_INACTIVE_BOAT_IDS: readonly string[] = ["astec-400"];

export interface FleetStatBoat {
  id: string;
  name: string;
  requiresLicense: boolean;
  pricing?: { BAJA?: { prices?: { [key: string]: number } } } | null;
}

export interface FleetStats {
  /** Total live boats across all categories (incl. captained excursion). */
  fleetCount: number;
  /** Self-drive license-free boats (no license, fuel included). */
  licenseFreeCount: number;
  /** Boats requiring a navigation license. */
  licensedCount: number;
  /** Captained excursion offerings (no license needed, fuel NOT included). */
  captainCount: number;
  /** Names of the live license-free boats, in catalog order. */
  licenseFreeNames: string[];
  /** Names of the live licensed boats, in catalog order. */
  licensedNames: string[];
  /** Names of the live captained excursion offerings. */
  captainNames: string[];
  /** Lowest advertised hourly rate (BAJA "1h") across the live fleet. */
  priceFloor: number;
  /** Name of the boat that sets the price floor (e.g. "Solar 450"). */
  cheapestBoatName: string;
}

/**
 * Compute fleet statistics from a set of boats. Pure and testable: pass the
 * LIVE (active) set and you get the live numbers; pass the full catalog and you
 * get the catalog numbers. Categorisation reuses {@link isCaptainedBoat} and
 * the boat's own `requiresLicense` flag — never derived from a regex by callers.
 */
export function computeFleetStats(boats: FleetStatBoat[]): FleetStats {
  const licenseFreeNames: string[] = [];
  const licensedNames: string[] = [];
  const captainNames: string[] = [];
  let priceFloor = Infinity;
  let cheapestBoatName = "";

  for (const boat of boats) {
    if (isCaptainedBoat(boat.id)) {
      captainNames.push(boat.name);
    } else if (boat.requiresLicense) {
      licensedNames.push(boat.name);
    } else {
      licenseFreeNames.push(boat.name);
    }

    // Only self-drive boats advertise an hourly ("1h") rate; licensed boats and
    // the captained excursion start at multi-hour blocks, so they naturally do
    // not set the "from X€/h" floor.
    const hourly = boat.pricing?.BAJA?.prices?.["1h"];
    if (typeof hourly === "number" && hourly > 0 && hourly < priceFloor) {
      priceFloor = hourly;
      cheapestBoatName = boat.name;
    }
  }

  return {
    fleetCount: boats.length,
    licenseFreeCount: licenseFreeNames.length,
    licensedCount: licensedNames.length,
    captainCount: captainNames.length,
    licenseFreeNames,
    licensedNames,
    captainNames,
    priceFloor: Number.isFinite(priceFloor) ? priceFloor : 0,
    cheapestBoatName,
  };
}

/**
 * Whether a catalog boat requires a navigation license, derived from its
 * features. Only used to normalise the static {@link BOAT_DATA} catalog into
 * {@link FleetStatBoat}s for the fallback path; live DB rows carry their own
 * `requiresLicense` boolean.
 */
export function boatDataRequiresLicense(boat: BoatData): boolean {
  return boat.features.some((f) => /licencia de navegaci/i.test(f));
}

/**
 * Fleet stats computed from the static catalog minus the given inactive ids
 * (defaults to {@link BASELINE_INACTIVE_BOAT_IDS}). This is the offline
 * fallback for the server cache and the default for client-side surfaces that
 * can't await a DB lookup.
 */
export function catalogFleetStats(
  excludeIds: readonly string[] = BASELINE_INACTIVE_BOAT_IDS,
): FleetStats {
  const exclude = new Set(excludeIds);
  const boats: FleetStatBoat[] = Object.values(BOAT_DATA)
    .filter((b) => !exclude.has(b.id))
    .map((b) => ({
      id: b.id,
      name: b.name,
      requiresLicense: boatDataRequiresLicense(b),
      pricing: b.pricing,
    }));
  return computeFleetStats(boats);
}

/**
 * Rewrite fleet-count and price-floor literals in our own marketing copy,
 * JSON-LD prose and llms.txt to match the LIVE fleet. The catalog is "9 boats
 * from 70€/h" but the live fleet (Astec 400 deactivated) is "8 from 75€/h", so
 * static strings drift. Patterns are deliberately tight:
 *   • the price floor only matches "70" immediately followed by a currency
 *     token, so numeric JSON-LD fields ("price":"70") are never touched;
 *   • fleet/subset counts require a boat noun (or "license-free"), so capacities
 *     ("5 personas", "hasta 7 personas") are never touched.
 * Keeping these accurate to the live fleet is correct on every surface, so it is
 * safe to run over assembled JSON-LD (incl. boat/blog schemas) and llms.txt.
 */
export function applyFleetStatsToText(text: string, stats: FleetStats): string {
  const floor = String(stats.priceFloor);
  return text
    .replace(/\b9-boat fleet\b/g, `${stats.fleetCount}-boat fleet`)
    .replace(
      /\b9 (boats|barcos|embarcaciones|vaixells|Boote|boten|barche)\b/g,
      `${stats.fleetCount} $1`,
    )
    .replace(
      /\b5 (license-free|barcos|boats|Boote|barche|boten|vaixells)\b/gi,
      `${stats.licenseFreeCount} $1`,
    )
    .replace(/\b70-(\d{2,4}) EUR\b/g, `${floor}-$1 EUR`)
    .replace(/\b70(?=\s?(?:€|EUR\b))/g, floor);
}

export interface ExtraPack {
  id: string;
  name: string;
  nameEN: string;
  extras: string[]; // names of included extras
  price: number; // pack price in EUR
  originalPrice: number; // total if bought separately
  icon: string; // lucide icon name
}

export const EXTRA_PACKS: ExtraPack[] = [
  {
    id: "pack-basic",
    name: "Pack Basic",
    nameEN: "Basic Pack",
    extras: ["Nevera", "Snorkel"],
    price: 10,
    originalPrice: 12.5,
    icon: "Package",
  },
  {
    id: "pack-premium",
    name: "Pack Premium",
    nameEN: "Premium Pack",
    extras: ["Nevera", "Snorkel", "Paddle Surf"],
    price: 30,
    originalPrice: 37.5,
    icon: "Crown",
  },
];