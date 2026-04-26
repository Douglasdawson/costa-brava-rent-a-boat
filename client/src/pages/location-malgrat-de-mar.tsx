import { Waves, TreePine, Footprints } from "lucide-react";
import LocationTemplate, { type LocationConfig } from "./LocationTemplate";

const config: LocationConfig = {
  slug: "malgrat",
  seoKey: "locationMalgrat",
  translationKey: "malgrat",
  breadcrumbKey: "locationMalgrat",
  breadcrumbUrl: "/alquiler-barcos-malgrat-de-mar",
  gradient: "from-amber-50 to-blue-50",
  attractions: [
    { iconBg: "bg-amber-100", iconColor: "text-amber-600", Icon: Waves },
    { iconBg: "bg-green-100", iconColor: "text-green-600", Icon: TreePine },
    { iconBg: "bg-primary/10", iconColor: "text-primary", Icon: Footprints },
  ],
  schema: {
    name: "Alquiler de Barcos cerca de Malgrat de Mar",
    description: "Alquila barcos desde el Puerto de Blanes, a solo 10 minutos en coche de Malgrat de Mar. Barcos sin licencia desde 70 EUR/hora.",
    latitude: 41.6458,
    longitude: 2.7419,
    locality: "Malgrat de Mar",
    region: "Barcelona",
    postalCode: "08380",
    touristType: ["Family", "Beach", "Resort"],
  },
  faqTitle: "Preguntas frecuentes sobre alquilar barco desde Malgrat de Mar",
  faqItems: [
    {
      question: "¿A cuánta distancia está Malgrat de Mar del Puerto de Blanes?",
      answer: "Malgrat de Mar está a solo 8 km del Puerto de Blanes, unos 10 minutos en coche por la N-II. También puedes llegar en tren RENFE línea R1 en solo 5 minutos.",
    },
    {
      question: "¿Cuánto cuesta alquilar un barco desde Blanes?",
      answer: "El alquiler de barco empieza desde {noLicBaja1h} EUR por hora con gasolina incluida. No se necesita licencia para barcos de hasta 15 CV. Disponemos de {fleetCount} barcos para 4-11 personas.",
    },
    {
      question: "¿Necesito licencia de navegación?",
      answer: "No necesariamente. Ofrecemos barcos sin licencia que cualquier mayor de 18 años puede manejar. Te damos 15 minutos de formación antes de zarpar. También tenemos barcos con licencia.",
    },
    {
      question: "¿Hay parking en el Puerto de Blanes?",
      answer: "Sí, hay parking gratuito disponible cerca del Puerto de Blanes. En temporada alta recomendamos llegar temprano para asegurar plaza, o considerar tren/taxi.",
    },
    {
      question: "¿Puedo alquilar el barco directamente desde Malgrat de Mar?",
      answer: "No. Malgrat de Mar no tiene puerto deportivo ni punto de alquiler de barcos a motor. El puerto náutico más cercano a Malgrat es el Puerto de Blanes (8 km, 10 min en coche o 5 min en tren R1). Todas nuestras embarcaciones salen y regresan al Puerto de Blanes.",
    },
    {
      question: "¿Qué calas se pueden alcanzar en barco desde Blanes si estoy alojado en Malgrat?",
      answer: "Con un barco sin licencia desde Blanes llegas en 25 minutos a Playa de Fenals (sur de Lloret), pasando por 7 calas: Sa Forcanera, Cala Sant Francesc, Cala de s'Agulla, Cala Treumal, Playa de Santa Cristina, Cala Sa Boadella y Playa de Fenals. Con barco con Licencia de Navegación Básica puedes llegar a Tossa de Mar (45 min) y más allá.",
    },
    {
      question: "¿Hay servicio de transfer desde hoteles de Malgrat al Puerto de Blanes?",
      answer: "No ofrecemos transfer directo, pero el trayecto es muy corto: 5 minutos en tren R1 (Malgrat → Blanes) o 10 minutos en coche/taxi (coste aproximado 12-15 EUR). La estación de Blanes está a 10 minutos andando del puerto. También hay bus local L23.",
    },
  ],
};

export default function LocationMalgratPage() {
  return <LocationTemplate config={config} />;
}
