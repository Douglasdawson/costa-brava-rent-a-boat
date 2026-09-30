import { Waves, Castle, Star } from "lucide-react";
import LocationTemplate, { type LocationConfig } from "./LocationTemplate";

const config: LocationConfig = {
  relatedContentPage: "locationSantaSusanna",
  slug: "santa-susanna",
  seoKey: "locationSantaSusanna",
  translationKey: "santaSusanna",
  breadcrumbKey: "locationSantaSusanna",
  breadcrumbUrl: "/alquiler-barcos-santa-susanna",
  gradient: "from-teal-50 to-blue-50",
  heroImage: {
    basePath: "/images/locations/hero-santa-susanna",
    alt: "Costa de acantilados y aguas turquesas de la Costa Brava, accesible en barco desde Blanes",
  },
  attractions: [
    { iconBg: "bg-teal-100", iconColor: "text-teal-600", Icon: Waves },
    { iconBg: "bg-amber-100", iconColor: "text-amber-600", Icon: Castle },
    { iconBg: "bg-primary/10", iconColor: "text-primary", Icon: Star },
  ],
  schema: {
    name: "Alquiler de Barcos cerca de Santa Susanna",
    description: "Alquila barcos desde el Puerto de Blanes, a solo 15 minutos en coche de Santa Susanna. Con la Licencia de Navegación o con patrón.",
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
      answer: "Desde el 1 de octubre de 2026 alquilas con la Licencia de Navegación (curso de 1 día, sin examen) o sales con patrón. Los barcos con licencia van en packs de 2, 4 u 8 horas desde {licBaja2h} € y la excursión privada con patrón sale desde {excursionBaja2h} € (2 horas). El combustible se paga aparte.",
    },
    {
      question: "¿Necesito licencia de navegación para alquilar un barco?",
      answer: "Sí. Desde el 1 de octubre de 2026 (RD 1188/2025) para pilotar cualquier barco a motor de alquiler hace falta titulación. Basta la Licencia de Navegación, el titulín: curso de 1 día, sin examen. Si no la tienes, reserva la excursión privada con patrón: él pilota y tú disfrutas.",
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
      answer: "Desde Blanes recomendamos: (a) Excursión privada con patrón 4h hasta Tossa y Cala Bona (desde {excursionBaja4h} €, ideal si no tienes titulación ni experiencia náutica); (b) Barco con Licencia de Navegación (LN) 4h para fondear en 2-3 calas entre Blanes y Lloret o subir hasta Tossa (desde 255 € / 4h). Si nadie del grupo tiene titulación, el titulín se saca en un curso de 1 día, sin examen.",
    },
    {
      question: "¿Puedo hacer una excursión en barco al atardecer desde Santa Susanna?",
      answer: "Sí, es muy popular. Desde Blanes puedes salir al atardecer (18:30-21:00 según mes) con un barco con Licencia de Navegación en pack de 2 horas, desde {licBaja2h} €, o con la excursión privada con patrón. Navegarás por las 7 calas con luz dorada. Desde Santa Susanna llegas en 15 min por carretera o 10 min en tren. Reserva con antelación en verano.",
    },
  ],
  popularBoats: {
    title: "Barcos populares para alquilar desde el Puerto de Blanes",
    description: "A 15 minutos de Santa Susanna. Desde el 1 de octubre de 2026 alquilas con la Licencia de Navegación (curso de 1 día, sin examen) o sales con patrón. Estos son los barcos que te llevan a Lloret y a Tossa de Mar.",
    boatIds: ["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625", "excursion-privada"],
  },
};

export default function LocationSantaSusannaPage() {
  return <LocationTemplate config={config} />;
}
