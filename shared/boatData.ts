// Real boat data from costabravarentaboat.com
import solar450Image from "@assets/generated_images/SOLAR_450_boat_photo_b70eb7e1.png";
import remus450Image from "@assets/generated_images/REMUS_450_boat_photo_ec8b926c.png";
import astec400Image from "@assets/generated_images/ASTEC_400_boat_photo_9dde16a8.png";
import astec450Image from "@assets/generated_images/ASTEC_400_boat_photo_9dde16a8.png"; // Usando ASTEC 400 para el 450 también
import mingollaImage from "@assets/generated_images/MINGOLLA_BRAVA_19_boat_c0e4a5b5.png";
import trimarchiImage from "@assets/generated_images/Trimarchi_57S_luxury_boat_0ef0159a.png";
import pacificCraftImage from "@assets/generated_images/PACIFIC_CRAFT_625_boat_fbe4f4d0.png";

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
    image: solar450Image,
    subtitle: "Sin Licencia Para Alquilar en Blanes",
    description: "La SOLAR 450 es una embarcación sin necesidad de licencia, ideal para hasta 5 personas. Disfruta de un amplio solárium acolchado en proa, toldo para protección solar, escalera de baño para fácil acceso al mar y arranque eléctrico para mayor comodidad. Perfecta para explorar las calas de la Costa Brava en familia o con amigos.",
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
      { name: "Parking", price: "10€", icon: "Car" },
      { name: "Nevera", price: "5€", icon: "Refrigerator" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Coffee" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Activity" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },
  
  "remus-450": {
    id: "remus-450",
    name: "Remus 450",
    image: remus450Image,
    subtitle: "Sin Licencia Para Alquilar en Blanes",
    description: "La REMUS 450 es un barco sin licencia para hasta 5 personas, perfecto para familias y parejas. Equipado con solárium amplio, toldo para protegerse del sol y escalera de baño, es ideal para explorar las calas más bellas de la Costa Brava.",
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
      { name: "Parking", price: "10€", icon: "Car" },
      { name: "Nevera", price: "5€", icon: "Refrigerator" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Coffee" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Activity" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "astec-400": {
    id: "astec-400",
    name: "ASTEC 400",
    image: astec400Image,
    subtitle: "Sin Licencia Para Alquilar en Blanes",
    description: "La ASTEC 400 es una embarcación sin licencia perfecta para parejas o familias pequeñas, con capacidad para 4 personas. Dispone de un amplio solárium con cojines en proa, toldo para protección solar, escalera de baño para un acceso fácil al agua y arranque eléctrico para mayor comodidad. Ideal para explorar la Costa Brava de manera sencilla y segura.",
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
      { name: "Parking", price: "10€", icon: "Car" },
      { name: "Nevera", price: "5€", icon: "Refrigerator" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Coffee" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Activity" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "astec-450": {
    id: "astec-450",
    name: "ASTEC 450", // Nota: El usuario quiere que se llame 480 en la página
    image: astec450Image,
    subtitle: "Sin Licencia Para Alquilar en Blanes",
    description: "La ASTEC 450 es nuestra embarcación sin licencia más espaciosa, diseñada para grupos de hasta 5 personas. Cuenta con un amplio solárium acolchado en proa, toldo para resguardarse del sol, escalera de baño para un acceso sencillo al agua y arranque eléctrico que facilita su uso. Ideal para una jornada de navegación confortable en la Costa Brava.",
    specifications: {
      model: "Fibra Astec 450",
      length: "4m",
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
      { name: "Parking", price: "10€", icon: "Car" },
      { name: "Nevera", price: "5€", icon: "Refrigerator" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Coffee" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Activity" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "mingolla-brava-19": {
    id: "mingolla-brava-19",
    name: "Mingolla Brava 19",
    image: mingollaImage,
    subtitle: "Con Licencia Básica Para Alquilar en Blanes",
    description: "Espectacular embarcación Mingolla Brava 19 para alquilar en Blanes con Licencia de navegación. Deportiva, que destaca por sus montantes laterales perfilados y un parabrisas con diseño elegante. Preciosa cubierta con colores crema, ofrece dos asientos de piloto, con amplios solariums de proa y popa. Su casco específico en V muy estrecho a la proa deflecta perfectamente el agua.",
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
      { name: "Parking", price: "10€", icon: "Car" },
      { name: "Nevera", price: "5€", icon: "Refrigerator" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Coffee" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Activity" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "trimarchi-57s": {
    id: "trimarchi-57s",
    name: "Trimarchi 57S",
    image: trimarchiImage,
    subtitle: "Con Licencia Básica Para Alquilar en Blanes",
    description: "La TRIMARCHI 57S es un barco deportivo para 7 personas, ideal para los amantes de la velocidad y el confort. Disfruta de un solárium en proa y popa, equipo de música Bluetooth, mesa central y ducha de agua dulce para refrescarte durante tu aventura.",
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
      { name: "Parking", price: "10€", icon: "Car" },
      { name: "Nevera", price: "5€", icon: "Refrigerator" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Coffee" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Activity" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  },

  "pacific-craft-625": {
    id: "pacific-craft-625",
    name: "Pacific Craft 625",
    image: pacificCraftImage,
    subtitle: "Con Licencia Básica Para Alquilar en Blanes",
    description: "La PACIFIC CRAFT 625 es una embarcación premium con capacidad para 7 personas, ideal para quienes buscan lujo y confort en la Costa Brava. Equipada con equipo de sonido Bluetooth, ducha de agua dulce, mesa para comidas a bordo y solárium tanto en proa como en popa, ofrece una experiencia náutica inigualable.",
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
      { name: "Parking", price: "10€", icon: "Car" },
      { name: "Nevera", price: "5€", icon: "Refrigerator" },
      { name: "Bebidas", price: "2,5€/ud", icon: "Coffee" },
      { name: "Snorkel", price: "7,5€", icon: "Eye" },
      { name: "Paddle Surf", price: "25€", icon: "Activity" },
      { name: "Seascooter", price: "50€", icon: "Zap" }
    ]
  }
};