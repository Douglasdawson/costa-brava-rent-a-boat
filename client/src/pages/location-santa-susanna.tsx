import { Waves, Castle, Star } from "lucide-react";
import LocationTemplate, { type LocationConfig } from "./LocationTemplate";

const config: LocationConfig = {
  slug: "santa-susanna",
  seoKey: "locationSantaSusanna",
  translationKey: "santaSusanna",
  breadcrumbKey: "locationSantaSusanna",
  breadcrumbUrl: "/alquiler-barcos-santa-susanna",
  gradient: "from-teal-50 to-blue-50",
  attractions: [
    { iconBg: "bg-teal-100", iconColor: "text-teal-600", Icon: Waves },
    { iconBg: "bg-amber-100", iconColor: "text-amber-600", Icon: Castle },
    { iconBg: "bg-primary/10", iconColor: "text-primary", Icon: Star },
  ],
  schema: {
    name: "Alquiler de Barcos cerca de Santa Susanna",
    description: "Alquila barcos desde el Puerto de Blanes, a solo 15 minutos en coche de Santa Susanna. Barcos sin licencia desde 70 EUR/hora.",
    latitude: 41.6332,
    longitude: 2.7133,
    locality: "Santa Susanna",
    region: "Barcelona",
    postalCode: "08398",
    touristType: ["Resort", "Family", "Spa", "Beach"],
  },
  faqTitle: "Preguntas frecuentes sobre alquilar barco desde Santa Susanna",
  faqItems: [
    {
      question: "¿A cuánta distancia está Santa Susanna del Puerto de Blanes?",
      answer: "Santa Susanna está a 12 km del Puerto de Blanes, unos 15 minutos en coche por la N-II. También puedes llegar en tren RENFE línea R1 en solo 10 minutos.",
    },
    {
      question: "¿Cuánto cuesta alquilar un barco desde Blanes si estoy en Santa Susanna?",
      answer: "El alquiler de barco empieza desde 70 EUR por hora con gasolina incluida. No se necesita licencia para barcos de hasta 15 CV. Disponemos de 7 barcos para 4-7 personas.",
    },
    {
      question: "¿Necesito licencia de navegación para alquilar un barco?",
      answer: "No necesariamente. Ofrecemos barcos sin licencia que cualquier mayor de 18 años puede manejar. Te damos 15 minutos de formación antes de zarpar. También tenemos barcos con licencia.",
    },
    {
      question: "¿Es fácil llegar en transporte público desde Santa Susanna?",
      answer: "Sí, la línea R1 de RENFE conecta Santa Susanna con Blanes en solo 10 minutos. Los trenes salen cada 30 minutos en temporada alta. La estación de Blanes está a 10 minutos andando del puerto.",
    },
  ],
};

export default function LocationSantaSusannaPage() {
  return <LocationTemplate config={config} />;
}
