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
    subtitle: "¡Barco sin licencia para alquilar en Blanes!",
    description: "Alquiler Solar 450 sin licencia en Blanes, Costa Brava. Embarcación ideal para hasta 5 personas con gasolina incluida. Perfecta para familias que buscan alquilar barco sin licencia en Puerto de Blanes. Incluye amplio solárium acolchado, toldo, escalera de baño y arranque eléctrico. Ideal para explorar las calas de Blanes y Costa Brava Sur.",
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
        prices: { "1h": 85, "2h": 130, "3h": 160, "4h": 180, "6h": 230, "8h": 270 }
      },
      ALTA: {
        period: "Agosto", 
        prices: { "1h": 95, "2h": 140, "3h": 170, "4h": 195, "6h": 240, "8h": 290 }
      }
    },
    extras: [
      { name: "Parking", price: "10€", icon: "CircleParking" },
      { name: "Nevera", price: "5€", icon: "Snowflake" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Beer" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Waves" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },
  
  "remus-450": {
    id: "remus-450",
    name: "Remus 450",
    image: "REMUS_450_boat_photo_ec8b926c.png",
    subtitle: "¡Barco sin licencia para alquilar en Blanes!",
    description: "Alquiler Remus 450 sin licencia en Blanes, Costa Brava. Barco ideal para hasta 5 personas con gasolina incluida. Perfecto para familias que buscan alquilar embarcación sin licencia en Puerto de Blanes. Equipado con solárium amplio, toldo Bi Mini y escalera de baño. Ideal para explorar las calas de Blanes y Costa Brava Sur.",
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
        prices: { "1h": 95, "2h": 140, "3h": 170, "4h": 195, "6h": 240, "8h": 290 }
      }
    },
    extras: [
      { name: "Parking", price: "10€", icon: "CircleParking" },
      { name: "Nevera", price: "5€", icon: "Snowflake" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Beer" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Waves" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "remus-450-ii": {
    id: "remus-450-ii",
    name: "Remus 450 II",
    image: "REMUS_450_boat_photo_ec8b926c.png",
    subtitle: "¡Barco sin licencia para alquilar en Blanes!",
    description: "Alquiler Remus 450 II sin licencia en Blanes, Costa Brava. Barco ideal para hasta 5 personas con gasolina incluida. Perfecto para familias que buscan alquilar embarcación sin licencia en Puerto de Blanes. Equipado con solárium amplio, toldo Bi Mini y escalera de baño. Ideal para explorar las calas de Blanes y Costa Brava Sur.",
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
        prices: { "1h": 95, "2h": 140, "3h": 170, "4h": 195, "6h": 240, "8h": 290 }
      }
    },
    extras: [
      { name: "Parking", price: "10€", icon: "CircleParking" },
      { name: "Nevera", price: "5€", icon: "Snowflake" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Beer" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Waves" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "astec-400": {
    id: "astec-400",
    name: "Astec 400",
    image: "ASTEC_400_boat_photo_9dde16a8.png",
    subtitle: "¡Barco sin licencia para alquilar en Blanes!",
    description: "Alquiler Astec 400 sin licencia en Blanes, Costa Brava. Embarcación perfecta para parejas o familias pequeñas, hasta 4 personas con gasolina incluida. Ideal para alquilar barco sin licencia en Puerto de Blanes. Incluye solárium con cojines, toldo, escalera de baño y arranque eléctrico. Perfecta para explorar las calas de Blanes de manera sencilla y segura.",
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
        prices: { "1h": 70, "2h": 105, "3h": 120, "4h": 135, "6h": 170, "8h": 200 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 80, "2h": 120, "3h": 145, "4h": 165, "6h": 210, "8h": 250 }
      },
      ALTA: {
        period: "Agosto", 
        prices: { "1h": 90, "2h": 130, "3h": 155, "4h": 180, "6h": 220, "8h": 270 }
      }
    },
    extras: [
      { name: "Parking", price: "10€", icon: "CircleParking" },
      { name: "Nevera", price: "5€", icon: "Snowflake" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Beer" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Waves" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "astec-480": {
    id: "astec-480",
    name: "Astec 480",
    image: "ASTEC_400_boat_photo_9dde16a8.png",
    subtitle: "¡Barco sin licencia para alquilar en Blanes!",
    description: "Alquiler Astec 480 sin licencia en Blanes, Costa Brava. Nuestra embarcación sin licencia más espaciosa para grupos de hasta 5 personas con gasolina incluida. La mejor opción para alquilar barco sin licencia en Puerto de Blanes. Incluye solárium acolchado, toldo, escalera de baño, arranque eléctrico y equipo bluetooth. Ideal para navegación confortable en Costa Brava Sur.",
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
        prices: { "1h": 80, "2h": 130, "3h": 155, "4h": 180, "6h": 230, "8h": 270 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 90, "2h": 150, "3h": 190, "4h": 220, "6h": 270, "8h": 310 }
      },
      ALTA: {
        period: "Agosto", 
        prices: { "1h": 100, "2h": 170, "3h": 200, "4h": 230, "6h": 290, "8h": 340 }
      }
    },
    extras: [
      { name: "Parking", price: "10€", icon: "CircleParking" },
      { name: "Nevera", price: "5€", icon: "Snowflake" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Beer" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Waves" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "mingolla-brava-19": {
    id: "mingolla-brava-19",
    name: "Mingolla Brava 19",
    image: "MINGOLLA_BRAVA_19_boat_c0e4a5b5.png",
    subtitle: "Con Licencia Básica Para Alquilar en Blanes",
    description: "Alquiler Mingolla Brava 19 con licencia en Blanes, Costa Brava. Espectacular embarcación deportiva para 6 personas con equipamiento premium. Ideal para alquilar barco con licencia en Puerto de Blanes. Destaca por diseño elegante, ducha agua dulce, bluetooth y GPS. Perfecta para explorar la Costa Brava Sur con estilo y confort.",
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
      { name: "Parking", price: "10€", icon: "CircleParking" },
      { name: "Nevera", price: "5€", icon: "Snowflake" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Beer" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Waves" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "trimarchi-57s": {
    id: "trimarchi-57s",
    name: "Trimarchi 57S",
    image: "Trimarchi_57S_luxury_boat_0ef0159a.png",
    subtitle: "Con Licencia Básica Para Alquilar en Blanes",
    description: "Alquiler Trimarchi 57S con licencia en Blanes, Costa Brava. Barco deportivo premium para 7 personas, ideal para grupos que buscan alquilar embarcación con licencia en Puerto de Blanes. Incluye solárium en proa y popa, equipo bluetooth, mesa central y ducha agua dulce. Perfecta para aventuras en Costa Brava Sur.",
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
      { name: "Parking", price: "10€", icon: "CircleParking" },
      { name: "Nevera", price: "5€", icon: "Snowflake" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Beer" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Waves" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "pacific-craft-625": {
    id: "pacific-craft-625",
    name: "Pacific Craft 625",
    image: "PACIFIC_CRAFT_625_boat_fbe4f4d0.png",
    subtitle: "Con Licencia Básica Para Alquilar en Blanes",
    description: "Alquiler Pacific Craft 625 con licencia en Blanes, Costa Brava. Embarcación premium para 7 personas, la mejor opción para alquilar barco de lujo con licencia en Puerto de Blanes. Incluye bluetooth, ducha agua dulce, mesa, solárium proa y popa. Experiencia náutica inigualable en Costa Brava Sur.",
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
      { name: "Parking", price: "10€", icon: "CircleParking" },
      { name: "Nevera", price: "5€", icon: "Snowflake" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Beer" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Waves" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "excursion-privada": {
    id: "excursion-privada",
    name: "Excursion Privada con Capitan",
    image: "PACIFIC_CRAFT_625_boat_fbe4f4d0.png",
    subtitle: "Excursion privada con patron en la Costa Brava",
    description: "Disfruta de una excursion privada en barco con patron por la Costa Brava, explorando la costa de Blanes, Lloret y Tossa. Navega por calas escondidas, cuevas y playas tranquilas. Fondearemos en una cala ideal para nadar y relajarse, elegida por el capitan segun las condiciones del mar. Ideal para parejas, familias o grupos que buscan una experiencia exclusiva desde el mar.",
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
      "Escalera de bano",
      "Equipo de seguridad y salvamento"
    ],
    included: [
      "IVA",
      "Patron profesional",
      "Amarre",
      "Limpieza",
      "Seguro embarcacion y ocupantes"
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
      { name: "Parking", price: "10€", icon: "CircleParking" },
      { name: "Nevera", price: "5€", icon: "Snowflake" },
      { name: "Agua y refrescos", price: "2€/ud", icon: "Beer" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Waves" },
      { name: "Seascooter", price: "60€", icon: "Zap" }
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