// Server-side boat data - no image imports to avoid ESBuild PNG processing issues
// This file contains only the data needed by the server (no images)

export interface ServerBoatData {
  id: string;
  name: string;
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

export const SERVER_BOAT_DATA: { [key: string]: ServerBoatData } = {
  "solar-450": {
    id: "solar-450",
    name: "Solar 450",
    subtitle: "Barco sin licencia para tomar el sol en Blanes",
    description: "Alquiler de barco sin licencia Solar 450 en el Puerto de Blanes, Costa Brava. La embarcación ideal para quienes buscan relajarse y tomar el sol en el mar: su solárium acolchado es el más amplio de toda la flota sin licencia. Hasta 5 personas con gasolina incluida. No necesitas carnet náutico: te formamos en 15 minutos antes de zarpar. Fondea en calas de agua turquesa cerca de Blanes como Sa Palomera y Cala Sant Francesc. Motor Mercury 15cv, toldo parasol, escalera de baño y equipo de seguridad incluido.",
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
        prices: { "1h": 75, "2h": 135, "3h": 155, "4h": 180, "6h": 225, "8h": 270 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 80, "2h": 140, "3h": 165, "4h": 190, "6h": 235, "8h": 280 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 85, "2h": 150, "3h": 175, "4h": 200, "6h": 250, "8h": 295 }
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
    subtitle: "El barco sin licencia favorito de parejas y familias en Blanes",
    description: "Alquiler del barco sin licencia más popular para parejas y familias con niños en el Puerto de Blanes, Costa Brava. La Remus 450 es la embarcación más estable y fácil de manejar de la flota, con toldo Bi Mini de cobertura completa para proteger a los más pequeños del sol. Capacidad para 5 personas con gasolina incluida. Ideal si es vuestra primera vez navegando sin carnet. Solárium de proa, escalera de baño y motor Suzuki 15cv. Descubre calas cristalinas tranquilas entre Blanes y Lloret de Mar.",
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
        prices: { "1h": 75, "2h": 135, "3h": 155, "4h": 180, "6h": 225, "8h": 270 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 80, "2h": 140, "3h": 165, "4h": 190, "6h": 235, "8h": 280 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 85, "2h": 150, "3h": 175, "4h": 200, "6h": 250, "8h": 295 }
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
    subtitle: "Disponibilidad garantizada en temporada alta",
    description: "Alquiler de barco sin licencia Remus 450 II en Blanes con disponibilidad garantizada en julio y agosto. Mismo modelo que nuestro barco más reservado, para que no te quedes sin embarcación en temporada alta en la Costa Brava. Capacidad 5 personas, gasolina incluida, toldo Bi Mini, solárium de proa y motor Suzuki 15cv. Reserva tu barco sin carnet en el Puerto de Blanes incluso en las fechas más demandadas.",
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
        prices: { "1h": 75, "2h": 135, "3h": 155, "4h": 180, "6h": 225, "8h": 270 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 80, "2h": 140, "3h": 165, "4h": 190, "6h": 235, "8h": 280 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 85, "2h": 150, "3h": 175, "4h": 200, "6h": 250, "8h": 295 }
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
    subtitle: "El mejor precio por persona para parejas y familias en Blanes",
    description: "Alquiler del barco sin licencia más económico en el Puerto de Blanes, Costa Brava. La Astec 400 ofrece el mejor precio por persona para parejas y familias con niños: desde 70 euros la hora para hasta 4 personas con gasolina incluida. Compacta, estable y segura para navegar con los más pequeños. Toldo Bi Mini para proteger a los niños del sol, solárium acolchado y escalera de baño. Navega sin carnet por calas tranquilas cerca de Blanes como Sa Palomera y Cala Sant Francesc. Motor Suzuki 15cv y equipo de seguridad completo.",
    specifications: {
      model: "Fibra Astec 400",
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
        prices: { "1h": 70, "2h": 125, "3h": 145, "4h": 165, "6h": 210, "8h": 250 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 75, "2h": 130, "3h": 155, "4h": 175, "6h": 220, "8h": 260 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 80, "2h": 140, "3h": 165, "4h": 185, "6h": 235, "8h": 275 }
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
    subtitle: "El mejor barco sin licencia de la Costa Brava",
    description: "Alquiler del mejor barco sin licencia en el Puerto de Blanes, Costa Brava. La Astec 480 es la embarcación premium sin carnet más completa: 4,80m de eslora, equipo de música bluetooth, solárium acolchado y depósito de 50 litros para jornadas largas. Capacidad 5 personas con gasolina incluida. Navega con tu propia música por las calas de Blanes, Lloret de Mar y la Costa Brava Sur. Motor Parsun 15cv, toldo Bi Mini y máximo confort sin necesidad de titulación náutica.",
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
        prices: { "1h": 90, "2h": 160, "3h": 190, "4h": 220, "6h": 280, "8h": 340 }
      },
      MEDIA: {
        period: "Julio",
        prices: { "1h": 95, "2h": 165, "3h": 200, "4h": 230, "6h": 290, "8h": 350 }
      },
      ALTA: {
        period: "Agosto",
        prices: { "1h": 100, "2h": 175, "3h": 210, "4h": 240, "6h": 300, "8h": 360 }
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
    subtitle: "Lancha con licencia: Lloret en 15 min, Tossa en 30",
    description: "Alquiler de lancha Mingolla Brava 19 con licencia en el Puerto de Blanes, Costa Brava. La embarcación ideal para explorar toda la costa: Lloret de Mar en 15 minutos y Tossa de Mar en media hora con sus 80cv de potencia. Capacidad 6 personas. Equipada con GPS, sonda náutica, ducha de agua dulce, equipo bluetooth y arco inox para deportes acuáticos. Llega a calas que otros barcos no alcanzan y navega la Costa Brava con total autonomía. Requiere licencia náutica PER o PNB.",
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
    subtitle: "Barco italiano 110cv para grupos con adrenalina en Blanes",
    description: "Alquiler de lancha italiana Trimarchi 57S con 110cv en el Puerto de Blanes, Costa Brava. La embarcación con licencia más potente de la flota, diseñada para grupos de hasta 7 personas que buscan adrenalina sin renunciar al confort. Motor Selva 110XS, solárium doble en proa y popa para tomar el sol, mesa central para comer fondeados en una cala y ducha de agua dulce. Llega a cualquier rincón entre Blanes, Lloret y Tossa de Mar en minutos. Requiere licencia náutica PER o PNB.",
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
    subtitle: "El barco de lujo para alquilar en Blanes",
    description: "Alquiler del barco de lujo más completo en el Puerto de Blanes, Costa Brava. La Pacific Craft 625 es lo mejor que puedes alquilar: 6,24 metros de eslora, motor Yamaha 115cv de 4 tiempos y espacio premium para 7 personas. Solárium doble en proa y popa, mesa abatible para comer en una cala, ducha de agua dulce, mando electrónico y equipo bluetooth. La experiencia náutica más exclusiva de la Costa Brava, con alcance hasta Tossa de Mar y más allá. Requiere licencia náutica PER o PNB.",
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
    subtitle: "Excursión privada con patrón desde Blanes",
    description: "Excursión privada en barco con patrón profesional desde el Puerto de Blanes, Costa Brava. Descubre calas secretas, cuevas marinas y rincones inaccesibles a pie entre Blanes y Tossa de Mar. No necesitas licencia: el capitán navega mientras tú disfrutas. Hasta 7 personas a bordo de nuestra Pacific Craft 625 con Yamaha 115cv. Paradas para nadar en aguas cristalinas, snorkel y contemplar la costa desde el mar. Ideal para celebraciones, aniversarios y experiencias VIP en la Costa Brava.",
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