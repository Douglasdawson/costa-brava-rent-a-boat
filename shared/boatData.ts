// Real boat data from costabravarentaboat.com
// Image imports moved to client-side to avoid ESBuild PNG import issues during server build

export interface BoatData {
  id: string;
  name: string;
  image: string;
  subtitle: string;
  description: string;
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
    };
    MEDIA: {
      period: string;
      prices: { [key: string]: number };
    };
    ALTA: {
      period: string;
      prices: { [key: string]: number };
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
      "Seguro incluido",
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
        prices: { "1h": 85, "2h": 135, "3h": 160, "4h": 180, "6h": 230, "8h": 270 }
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
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" },
      { name: "Seascooter", price: "50€", icon: "Seascooter" }
    ]
  },

  "remus-450": {
    id: "remus-450",
    name: "Remus 450",
    image: "REMUS_450_boat_photo_ec8b926c.png",
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
      "Seguro incluido",
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
        prices: { "1h": 85, "2h": 130, "3h": 160, "4h": 180, "6h": 230, "8h": 270 }
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
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" },
      { name: "Seascooter", price: "50€", icon: "Seascooter" }
    ]
  },

  "remus-450-ii": {
    id: "remus-450-ii",
    name: "Remus 450 II",
    image: "REMUS_450_boat_photo_ec8b926c.png",
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
      "Seguro incluido",
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
        prices: { "1h": 85, "2h": 130, "3h": 160, "4h": 180, "6h": 230, "8h": 270 }
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
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" },
      { name: "Seascooter", price: "50€", icon: "Seascooter" }
    ]
  },

  "astec-400": {
    id: "astec-400",
    name: "Astec 400",
    image: "ASTEC_400_boat_photo_9dde16a8.png",
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
      "Seguro incluido",
      "Equipo de seguridad",
      "Perfecta para parejas"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "1h": 75, "2h": 115, "3h": 130, "4h": 150, "6h": 190, "8h": 220 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 85, "2h": 130, "3h": 160, "4h": 180, "6h": 230, "8h": 270 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 95, "2h": 140, "3h": 170, "4h": 190, "6h": 240, "8h": 290 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" },
      { name: "Seascooter", price: "50€", icon: "Seascooter" }
    ]
  },


  "astec-480": {
    id: "astec-480",
    name: "Astec 480",
    image: "ASTEC_400_boat_photo_9dde16a8.png", // TODO: replace with actual ASTEC 480 photo (currently using ASTEC 400 image)
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
      "Seguro incluido",
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
        prices: { "1h": 90, "2h": 160, "3h": 200, "4h": 220, "6h": 270, "8h": 340 }
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
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" },
      { name: "Seascooter", price: "50€", icon: "Seascooter" }
    ]
  },

  "mingolla-brava-19": {
    id: "mingolla-brava-19",
    name: "Mingolla Brava 19",
    image: "MINGOLLA_BRAVA_19_boat_c0e4a5b5.png",
    subtitle: "Con licencia · 6 personas · Lloret en 15 min, Tossa en 30",
    description: "La lancha ideal para explorar toda la costa: Lloret de Mar en 15 minutos, Tossa de Mar en media hora. Con 80cv, GPS y sonda náutica, llegas a calas que otros barcos no alcanzan. Ducha de agua dulce, bluetooth y arco inox para deportes acuáticos. Todo el equipamiento para recorrer la Costa Brava con total autonomía. Requiere licencia náutica (PER/PNB).",
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
      "Licencia Básica requerida",
      "Hasta 6 personas",
      "GPS y sonda incluidos", 
      "Ducha agua dulce",
      "Deportiva elegante",
      "Combustible NO incluido"
    ],
    pricing: {
      BAJA: {
        period: "Abril-Junio, Septiembre-Cierre",
        prices: { "2h": 150, "4h": 230, "8h": 280 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "2h": 160, "4h": 240, "8h": 300 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "2h": 180, "4h": 250, "8h": 390 }
      }
    },
    extras: [
      { name: "Parking delante del Barco", price: "10€", icon: "Parking" },
      { name: "Nevera", price: "5€", icon: "Nevera" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Bebidas" },
      { name: "Snorkel", price: "7,5€", icon: "Snorkel" },
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" },
      { name: "Seascooter", price: "50€", icon: "Seascooter" }
    ]
  },

  "trimarchi-57s": {
    id: "trimarchi-57s",
    name: "Trimarchi 57S",
    image: "Trimarchi_57S_luxury_boat_0ef0159a.png",
    subtitle: "Con licencia · 7 personas · Adrenalina para grupos",
    description: "110cv de diseño italiano para grupos de hasta 7 personas que quieren adrenalina y confort a partes iguales. Solárium doble en proa y popa para tomar el sol, mesa central para comer fondeados en una cala y la potencia para llegar a cualquier rincón entre Blanes y Tossa de Mar en minutos. La embarcación que elige quien quiere sentir la velocidad sin renunciar a nada. Requiere licencia náutica (PER/PNB).",
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
      "Licencia Básica requerida",
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
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" },
      { name: "Seascooter", price: "50€", icon: "Seascooter" }
    ]
  },

  "pacific-craft-625": {
    id: "pacific-craft-625",
    name: "Pacific Craft 625",
    image: "PACIFIC_CRAFT_625_boat_fbe4f4d0.png",
    subtitle: "Con licencia · 7 personas · La experiencia de lujo",
    description: "Lo mejor que puedes alquilar en Blanes. 6,24 metros de eslora, motor Yamaha 115cv y espacio de lujo para 7 personas. Solárium doble, mesa para comer fondeados frente a una cala, ducha de agua dulce y mando electrónico. Para quienes no quieren compromisos y buscan la experiencia náutica más completa de la Costa Brava. Requiere licencia náutica (PER/PNB).",
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
      "Solarium en proa y popa",
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
      "Licencia Básica requerida",
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
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" },
      { name: "Seascooter", price: "50€", icon: "Seascooter" }
    ]
  },

  "excursion-privada": {
    id: "excursion-privada",
    name: "Excursion Privada con Capitan",
    image: "PACIFIC_CRAFT_625_boat_fbe4f4d0.png",
    subtitle: "Con patrón · 7 personas · Experiencia VIP",
    description: "Tú solo disfrutas: nuestro patrón profesional te lleva a calas secretas, cuevas marinas y rincones inaccesibles a pie entre Blanes y Tossa de Mar. Fondearéis en la cala perfecta del día, elegida según viento y corrientes. Ideal para celebraciones, aniversarios o familias que quieren una excursión privada exclusiva por la Costa Brava sin preocuparse de nada.",
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
      "Patron profesional",
      "Radio bluetooth",
      "Altavoces",
      "Solarium en proa y popa",
      "Toldo bimini inox",
      "Mesa en popa y/o proa",
      "Ducha de agua dulce",
      "Escalera de baño",
      "Equipo de seguridad y salvamento"
    ],
    included: [
      "IVA",
      "Patron profesional",
      "Amarre",
      "Limpieza",
      "Seguro embarcación y ocupantes"
    ],
    features: [
      "No requiere licencia",
      "Patron profesional incluido",
      "Hasta 7 personas",
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
      { name: "Paddle Surf", price: "25€", icon: "PaddleSurf" },
      { name: "Seascooter", price: "60€", icon: "Seascooter" }
    ]
  }
};

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
  {
    id: "pack-aventura",
    name: "Pack Aventura",
    nameEN: "Adventure Pack",
    extras: ["Nevera", "Snorkel", "Paddle Surf", "Seascooter"],
    price: 75,
    originalPrice: 87.5,
    icon: "Zap",
  },
];