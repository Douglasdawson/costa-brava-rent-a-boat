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
    {
      question: "¿Hay alquiler de barcos en la propia Santa Susanna?",
      answer: "No. Santa Susanna tiene playa amplia pero no dispone de puerto deportivo ni servicio de alquiler de barcos a motor. El puerto náutico más cercano es el Puerto de Blanes (12 km, 15 min en coche o 10 min en tren R1). Es el punto de alquiler más práctico si te alojas en Santa Susanna.",
    },
    {
      question: "¿Cuál es la mejor excursión en barco si me alojo en Santa Susanna?",
      answer: "Desde Blanes recomendamos: (a) Ruta de calas 4h sin licencia hasta Playa de Fenals fondeando en 2-3 calas cristalinas (desde 135 EUR para 5 personas); (b) Excursión privada con patrón 4h hasta Tossa y Cala Bona (desde 380 EUR, ideal si no tienes experiencia náutica); (c) Barco con Licencia Básica si alguno del grupo tiene titulación (desde 240 EUR / 4h).",
    },
    {
      question: "¿Puedo hacer una excursión en barco al atardecer desde Santa Susanna?",
      answer: "Sí, es muy popular. Desde Blanes ofrecemos paseos al atardecer (18:30-21:00 según mes) con barco sin licencia a 115 EUR por 2 horas. Navegarás por las 7 calas con luz dorada. Desde Santa Susanna llegas en 15 min en coche o 10 min en tren. Reserva con antelación en verano.",
    },
  ],
};

export default function LocationSantaSusannaPage() {
  return <LocationTemplate config={config} />;
}
