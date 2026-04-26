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
      answer: "El alquiler de barco empieza desde {noLicBaja1h} EUR por hora con gasolina incluida. No se necesita licencia para barcos de hasta 15 CV. Disponemos de {fleetCount} barcos para 4-11 personas.",
    },
    {
      question: "¿Necesito experiencia previa para alquilar un barco?",
      answer: "No necesitas experiencia. Ofrecemos barcos sin licencia que cualquier mayor de 18 años puede manejar. Te damos 15 minutos de formación antes de zarpar, incluyendo normas de navegación y seguridad.",
    },
    {
      question: "¿Puedo ir y volver desde Calella en transporte público?",
      answer: "Sí, la línea R1 de RENFE conecta Calella con Blanes en 15 minutos. Los trenes salen cada 30 minutos en temporada. La estación de Blanes está a unos 10 minutos andando del puerto.",
    },
    {
      question: "¿Hay alquiler de barcos en el propio Calella?",
      answer: "Calella es la localidad más grande del tramo pero no dispone de puerto deportivo con servicio de alquiler a motor. Los puertos náuticos más cercanos son Blanes (17 km al norte, mejor flota del tramo) y Arenys de Mar (15 km al sur, precios más altos). Recomendamos Blanes para mejor relación calidad-precio y conexión directa por R1 en 15 minutos.",
    },
    {
      question: "¿Puedo hacer una excursión en barco desde Calella a Tossa de Mar?",
      answer: "No directamente desde Calella (no hay alquiler). Desde Blanes sí: con un barco con Licencia de Navegación Básica (LNB) llegas a Tossa en 45 min (desde {licBaja2h} EUR/2h), o con nuestra Excursión Privada con Capitán 4h hasta Tossa incluyendo Cala Bona y Vila Vella (desde {excursionBaja4h} EUR para hasta 7 personas). Los barcos sin licencia no pueden llegar a Tossa por el límite legal de 2 millas.",
    },
    {
      question: "¿Cuánto cuesta el tren R1 de Calella a Blanes?",
      answer: "El billete sencillo R1 Calella → Blanes cuesta aproximadamente 3 EUR (tarifa ATM zona 4-5). Con tarjeta T-Casual 10 viajes es más económico. Duración: 15 minutos. Frecuencia: cada 30 minutos en temporada. Desde la estación de Blanes al Puerto son 10 minutos andando o 3 min en taxi.",
    },
  ],
};

export default function LocationCalellaPage() {
  return <LocationTemplate config={config} />;
}
