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
      answer: "El alquiler de barco empieza desde 70 EUR por hora con gasolina incluida. No se necesita licencia para barcos de hasta 15 CV. Disponemos de 7 barcos para 4-7 personas.",
    },
    {
      question: "¿Necesito licencia de navegación?",
      answer: "No necesariamente. Ofrecemos barcos sin licencia que cualquier mayor de 18 años puede manejar. Te damos 15 minutos de formación antes de zarpar. También tenemos barcos con licencia.",
    },
    {
      question: "¿Hay parking en el Puerto de Blanes?",
      answer: "Sí, hay parking gratuito disponible cerca del Puerto de Blanes. En temporada alta recomendamos llegar temprano para asegurar plaza, o considerar tren/taxi.",
    },
  ],
};

export default function LocationMalgratPage() {
  return <LocationTemplate config={config} />;
}
