import { Waves, Sun, TreePine } from "lucide-react";
import LocationTemplate, { type LocationConfig } from "./LocationTemplate";

const config: LocationConfig = {
  slug: "calella",
  seoKey: "locationCalella",
  translationKey: "calella",
  breadcrumbKey: "locationCalella",
  breadcrumbUrl: "/alquiler-barcos-calella",
  gradient: "from-rose-50 to-blue-50",
  attractions: [
    { iconBg: "bg-rose-100", iconColor: "text-rose-600", Icon: Waves },
    { iconBg: "bg-amber-100", iconColor: "text-amber-600", Icon: Sun },
    { iconBg: "bg-green-100", iconColor: "text-green-600", Icon: TreePine },
  ],
  schema: {
    name: "Alquiler de Barcos cerca de Calella",
    description: "Alquila barcos desde el Puerto de Blanes, a solo 20 minutos en coche de Calella. Barcos sin licencia desde 70 EUR/hora.",
    latitude: 41.6136,
    longitude: 2.6545,
    locality: "Calella",
    region: "Barcelona",
    postalCode: "08370",
    touristType: ["Beach", "Cultural", "Shopping"],
  },
  faqTitle: "Preguntas frecuentes sobre alquilar barco desde Calella",
  faqItems: [
    {
      question: "¿A cuánta distancia está Calella del Puerto de Blanes?",
      answer: "Calella está a 17 km del Puerto de Blanes, unos 20 minutos en coche por la N-II. También puedes llegar en tren RENFE línea R1 en solo 15 minutos.",
    },
    {
      question: "¿Cuánto cuesta alquilar un barco desde Blanes si estoy en Calella?",
      answer: "El alquiler de barco empieza desde 70 EUR por hora con gasolina incluida. No se necesita licencia para barcos de hasta 15 CV. Disponemos de 7 barcos para 4-7 personas.",
    },
    {
      question: "¿Necesito experiencia previa para alquilar un barco?",
      answer: "No necesitas experiencia. Ofrecemos barcos sin licencia que cualquier mayor de 18 años puede manejar. Te damos 15 minutos de formación antes de zarpar, incluyendo normas de navegación y seguridad.",
    },
    {
      question: "¿Puedo ir y volver desde Calella en transporte público?",
      answer: "Sí, la línea R1 de RENFE conecta Calella con Blanes en 15 minutos. Los trenes salen cada 30 minutos en temporada. La estación de Blanes está a unos 10 minutos andando del puerto.",
    },
  ],
};

export default function LocationCalellaPage() {
  return <LocationTemplate config={config} />;
}
