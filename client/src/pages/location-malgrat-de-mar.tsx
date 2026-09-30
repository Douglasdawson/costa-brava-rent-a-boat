import { Waves, TreePine, Footprints } from "lucide-react";
import LocationTemplate, { type LocationConfig } from "./LocationTemplate";

const config: LocationConfig = {
  relatedContentPage: "locationMalgrat",
  slug: "malgrat",
  seoKey: "locationMalgrat",
  translationKey: "malgrat",
  breadcrumbKey: "locationMalgrat",
  breadcrumbUrl: "/alquiler-barcos-malgrat-de-mar",
  gradient: "from-amber-50 to-blue-50",
  heroImage: {
    basePath: "/images/locations/hero-malgrat-de-mar",
    alt: "Cala de la Costa Brava con acantilados y pinos, a 25 minutos en barco del Puerto de Blanes",
  },
  attractions: [
    { iconBg: "bg-amber-100", iconColor: "text-amber-600", Icon: Waves },
    { iconBg: "bg-green-100", iconColor: "text-green-600", Icon: TreePine },
    { iconBg: "bg-primary/10", iconColor: "text-primary", Icon: Footprints },
  ],
  schema: {
    name: "Alquiler de Barcos cerca de Malgrat de Mar",
    description: "Alquila barcos desde el Puerto de Blanes, a solo 10 minutos en coche de Malgrat de Mar. Con la Licencia de Navegación o con patrón.",
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
      answer: "Desde el 1 de octubre de 2026 alquilas con la Licencia de Navegación (curso de 1 día, sin examen) o sales con patrón. Los barcos con licencia van en packs de 2, 4 u 8 horas desde {licBaja2h} € y la excursión privada con patrón sale desde {excursionBaja2h} € (2 horas). El combustible se paga aparte.",
    },
    {
      question: "¿Necesito licencia de navegación?",
      answer: "Sí. Desde el 1 de octubre de 2026 (RD 1188/2025) para pilotar cualquier barco a motor de alquiler hace falta titulación. Basta la Licencia de Navegación, el titulín: curso de 1 día, sin examen. Si no la tienes, reserva la excursión privada con patrón: él pilota y tú disfrutas.",
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
      answer: "Desde Blanes, en unos 25 minutos de navegación costera pasas por 7 calas: Sa Forcanera, Cala Sant Francesc, Cala de s'Agulla, Cala Treumal, Playa de Santa Cristina, Cala Sa Boadella y Playa de Fenals (sur de Lloret). Con un barco con Licencia de Navegación (LN) o con la excursión privada con patrón puedes seguir hasta Lloret centro y Tossa de Mar (30-45 min).",
    },
    {
      question: "¿Hay servicio de transfer desde hoteles de Malgrat al Puerto de Blanes?",
      answer: "No ofrecemos transfer directo, pero el trayecto es muy corto: 5 minutos en tren R1 (Malgrat → Blanes) o 10 minutos en coche/taxi (coste aproximado 12-15 EUR). La estación de Blanes está a 10 minutos andando del puerto. También hay bus local L23.",
    },
  ],
  popularBoats: {
    title: "Barcos populares para alquilar desde el Puerto de Blanes",
    description: "A 10 minutos de Malgrat de Mar. Desde el 1 de octubre de 2026 alquilas con la Licencia de Navegación (curso de 1 día, sin examen) o sales con patrón. Estos son los barcos que te llevan a Lloret y a Tossa de Mar.",
    boatIds: ["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625", "excursion-privada"],
  },
};

export default function LocationMalgratPage() {
  return <LocationTemplate config={config} />;
}
