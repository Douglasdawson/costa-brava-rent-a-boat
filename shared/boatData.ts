// Real boat data from costabravarentaboat.com
import solar450Image from "@assets/generated_images/SOLAR_450_boat_photo_b70eb7e1.png";
import remus450Image from "@assets/generated_images/REMUS_450_boat_photo_ec8b926c.png";

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
      { name: "Parking", price: "10€", icon: "🅿️" },
      { name: "Nevera", price: "5€", icon: "🧊" },
      { name: "Bebidas", price: "2,5€/ud", icon: "🥤" },
      { name: "Snorkel", price: "7,5€", icon: "🤿" },
      { name: "Paddle Surf", price: "25€", icon: "🏄‍♂️" },
      { name: "Seascooter", price: "50€", icon: "🛴" }
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
      { name: "Parking", price: "10€", icon: "🅿️" },
      { name: "Nevera", price: "5€", icon: "🧊" },
      { name: "Bebidas", price: "2,5€/ud", icon: "🥤" },
      { name: "Snorkel", price: "7,5€", icon: "🤿" },
      { name: "Paddle Surf", price: "25€", icon: "🏄‍♂️" },
      { name: "Seascooter", price: "50€", icon: "🛴" }
    ]
  }
};