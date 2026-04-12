import { Language } from "@/hooks/use-language";
import { getBaseUrl } from "@/lib/domain";
import { HREFLANG_CODES } from "@shared/seoConstants";
import { getLocalizedPath } from "@shared/i18n-routes";
import type { PageKey } from "@shared/i18n-routes";

// Dynamic season year: Nov-Dec → next year, otherwise current year
function getSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();
}
const SEASON_YEAR = getSeasonYear();

// SEO Configuration for all languages
export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  image?: string;
}

export interface PageSEOConfig {
  [key: string]: SEOConfig;
}

// Business information for JSON-LD schemas
export const BUSINESS_INFO = {
  name: "Costa Brava Rent a Boat Blanes",
  legalName: "Costa Brava Rent a Boat - Blanes",
  description: "Alquiler de barcos sin licencia y con licencia en Blanes, Costa Brava. Desde Puerto de Blanes. 8 embarcaciones para 4-7 personas.",
  phone: "+34611500372",
  email: "costabravarentaboat@gmail.com",
  url: getBaseUrl(),
  address: {
    streetAddress: "Puerto de Blanes",
    addressLocality: "Blanes", 
    addressRegion: "Girona",
    postalCode: "17300",
    addressCountry: "ES"
  },
  geo: {
    latitude: 41.6751,
    longitude: 2.7934
  },
  openingHours: [
    "Mo-Su 09:00-20:00"  // April-October season
  ],
  seasonalHours: "April to October",
  priceRange: "70€ - 400€",
  servesCuisine: null,
  hasDeliveryService: false
};

// Base domain for canonical URLs (uses canonical domain)
export const BASE_DOMAIN = getBaseUrl();

// Language-specific SEO configurations
export const SEO_CONFIGS: Record<Language, Record<string, SEOConfig>> = {
  es: {
    home: {
      title: "Alquiler Barco en Blanes desde 70\u20ac/h | Gasolina Incluida",
      description: "Alquila un barco sin licencia en el Puerto de Blanes desde 70\u20ac/h con gasolina incluida. 15 min de formaci\u00f3n y a navegar. 8 barcos disponibles. Reserva online \u00b7 Cambio de fecha gratis.",
      keywords: "alquiler barco blanes, alquiler barcos blanes, alquilar barco blanes, alquiler barcos sin licencia blanes, alquiler barco puerto blanes, alquiler embarcaciones blanes, barco sin licencia blanes",
      ogTitle: `Alquiler Barcos Sin Licencia Blanes | Puerto de Blanes ${SEASON_YEAR}`,
      ogDescription: "Alquila barcos sin licencia en Puerto de Blanes. Sin experiencia necesaria, desde 70\u20ac/h con gasolina incluida. 8 barcos disponibles. Reserva ya."
    },
    booking: {
      title: "Solicitar Reserva de Barco en Blanes | Costa Brava",
      description: "Reserva tu barco en Blanes en minutos. Con o sin licencia, desde 1 hora. Respuesta inmediata por WhatsApp. ¡Empieza tu aventura!",
      keywords: "reservar barco blanes, formulario reserva embarcación, booking barco costa brava, alquiler barcos online"
    },
    faq: {
      title: "Preguntas Frecuentes Alquiler Barcos Blanes | FAQ",
      description: "¿Necesito licencia? ¿Qué incluye? ¿Cuánto cuesta? Resuelve todas tus dudas sobre alquiler de barcos en Blanes. ¡Respuestas claras!",
      keywords: "faq alquiler barcos, preguntas frecuentes embarcaciones, dudas alquiler barcos costa brava, información barcos blanes",
      ogTitle: "FAQ Alquiler Barcos Blanes | Resuelve Tus Dudas Costa Brava",
      ogDescription: "¿Licencia necesaria? ¿Qué incluye? ¿Precios? Todas las respuestas sobre alquilar barcos en Blanes. ¡Información clara y completa!"
    },
    locationBlanes: {
      title: `Alquiler Barcos Puerto de Blanes ${SEASON_YEAR} | Sin Licencia desde 70\u20ac/h`,
      description: "Alquila barco en el Puerto de Blanes: parking gratis, snorkel y paddle board incluidos. 8 barcos sin licencia desde 70\u20ac/h con gasolina incluida. Reserva hoy.",
      keywords: "alquiler barco blanes, alquilar barco blanes, alquiler barcos blanes, barco sin licencia blanes, alquiler barco blanes sin licencia, alquiler barco puerto blanes, alquiler embarcaciones blanes",
      ogTitle: `Alquiler de Barcos en Blanes | Puerto de Blanes ${SEASON_YEAR}`,
      ogDescription: "Alquila barcos en Puerto de Blanes. Sin licencia desde 70\u20ac/h con gasolina incluida. 8 embarcaciones disponibles. Reserva ya."
    },
    locationLloret: {
      title: "Alquiler Barco Lloret de Mar | 25 min desde Blanes",
      description: "Navega a Lloret de Mar en 25 min desde Puerto de Blanes. Barcos sin licencia desde 70\u20ac/h, gasolina incluida. Calas y playas virgenes. Reserva online.",
      keywords: "alquiler barco lloret de mar, alquiler barco sin licencia lloret de mar, barcos lloret de mar, excursion lloret desde blanes, ir en barco a lloret",
      ogTitle: "Alquiler Barco Lloret de Mar | Sin Licencia desde 70\u20ac/h",
      ogDescription: "Navega a Lloret de Mar en 25 min desde Blanes. 5 barcos sin licencia desde 70\u20ac/h. Gasolina incluida. 4.8\u2605."
    },
    locationTossa: {
      title: "Alquiler Barco Tossa de Mar | Vila Vella en Barco",
      description: "Llega a la Vila Vella de Tossa en 1h desde Blanes. Sin licencia desde 70\u20ac/h, gasolina incluida. Calas medievales y aguas cristalinas. Reserva ya.",
      keywords: "alquiler barco tossa de mar, excursion barco tossa de mar, barcos tossa de mar, excursion tossa desde blanes, barcos tossa costa brava, vila vella tossa, cuanto cuesta barco tossa",
      ogTitle: "Alquiler Barco Tossa de Mar | Vila Vella desde 70\u20ac/h",
      ogDescription: "Navega a Tossa de Mar en 1h desde Blanes. Vila Vella y calas virgenes desde 70\u20ac/h. Gasolina incluida. 4.8\u2605."
    },
    locationMalgrat: {
      title: "Alquiler Barco cerca de Malgrat de Mar | Puerto Blanes 10 min 70\u20ac",
      description: "Alojado en Malgrat de Mar? Puerto de Blanes a 10 min en coche. Alquiler barcos sin licencia desde 70\u20ac/h, gasolina incluida. 8 barcos disponibles.",
      keywords: "alquiler barco malgrat de mar, barcos cerca malgrat, excursion barco malgrat, alquiler barco costa maresme",
      ogTitle: "Alquiler de Barcos cerca de Malgrat de Mar | Desde Blanes",
      ogDescription: "Desde Malgrat de Mar al Puerto de Blanes en 10 min. Barcos sin licencia desde 70\u20ac. Gasolina incluida. Reserva ya."
    },
    locationSantaSusanna: {
      title: "Alquiler Barco cerca de Santa Susanna | Puerto Blanes 15 min 70\u20ac",
      description: "Vacaciones en Santa Susanna? Puerto de Blanes a 15 min. Alquiler barcos sin licencia desde 70\u20ac/h. 8 barcos, gasolina incluida. Reserva online.",
      keywords: "alquiler barco santa susanna, barcos cerca santa susanna, excursion barco santa susanna, alquiler barco costa brava sur",
      ogTitle: "Alquiler de Barcos cerca de Santa Susanna | Desde Blanes",
      ogDescription: "Desde Santa Susanna al Puerto de Blanes en 15 min. Barcos sin licencia desde 70\u20ac. Reserva tu aventura."
    },
    locationCalella: {
      title: "Alquiler Barco cerca de Calella | Puerto Blanes 20 min desde 70\u20ac",
      description: "En Calella? Puerto de Blanes a 20 min en coche. Alquiler barcos sin licencia desde 70\u20ac/h. 8 barcos, gasolina incluida. Explora la Costa Brava.",
      keywords: "alquiler barco calella, barcos calella maresme, excursion barco calella, alquiler barco costa maresme calella",
      ogTitle: "Alquiler de Barcos cerca de Calella | Desde Blanes Costa Brava",
      ogDescription: "Desde Calella al Puerto de Blanes en 20 min. Barcos sin licencia desde 70\u20ac. Descubre la Costa Brava."
    },
    categoryLicenseFree: {
      title: "Barcos Sin Licencia en Blanes | 5 Barcos desde 70\u20ac/h",
      description: "5 barcos sin licencia en Blanes con gasolina incluida. Astec 400, Solar 450, Remus 450 y Astec 480. Formaci\u00f3n de 15 min incluida. Sin experiencia necesaria. Reserva online.",
      keywords: "alquiler barco sin licencia costa brava, alquiler barco blanes sin licencia, alquiler barcos sin licencia costa brava, barcos sin licencia blanes",
      ogTitle: "Barcos Sin Licencia Costa Brava | 5 Barcos desde 70\u20ac/h",
      ogDescription: "5 barcos sin licencia en Blanes desde 70\u20ac/h. Gasolina incluida, 4-7 personas. Formacion 15 min. 4.8\u2605 Google. Reserva hoy."
    },
    categoryLicensed: {
      title: "Barcos Con Licencia Costa Brava | 80-115CV Blanes",
      description: "3 barcos potentes de 80 a 115CV en Blanes. Lloret en 15 min, Tossa en 30 min. Con tu Licencia Basica o patron incluido. Reserva online.",
      keywords: "alquiler barco costa brava con licencia, barcos con licencia blanes, alquiler barcos licencia basica costa brava, barcos potentes costa brava",
      ogTitle: "Barcos Con Licencia en Blanes | Lloret 15 min, Tossa 30 min",
      ogDescription: "3 barcos potentes 80-115CV en Blanes. Con tu Licencia B\u00e1sica o con patr\u00f3n. Reserva online."
    },
    testimonios: {
      title: "Opiniones Clientes Alquiler Barcos Blanes",
      description: "Lee opiniones reales de clientes que alquilaron barcos en Blanes. +100 reviews verificadas. Experiencias en Costa Brava. ¡Descubre por qué nos eligen!",
      keywords: "opiniones alquiler barcos blanes, reviews costa brava rent boat, testimonios clientes barcos, experiencias alquiler embarcaciones",
      ogTitle: "Opiniones Verificadas Alquiler Barcos Blanes | Costa Brava",
      ogDescription: "+100 opiniones reales de clientes satisfechos. Descubre experiencias únicas navegando por la Costa Brava desde Blanes. ¡Lee y reserva!"
    },
    privacyPolicy: {
      title: "Política de Privacidad | Costa Brava Rent a Boat",
      description: "Política de privacidad y protección de datos de Costa Brava Rent a Boat. Información sobre el tratamiento de tus datos personales.",
      keywords: "política privacidad, protección datos, rgpd costa brava rent boat"
    },
    termsConditions: {
      title: "Términos y Condiciones | Costa Brava Rent a Boat",
      description: "Términos y condiciones del servicio de alquiler de barcos en Blanes, Costa Brava. Normas y condiciones de uso.",
      keywords: "términos condiciones, condiciones alquiler barcos, normas uso embarcaciones"
    },
    condicionesGenerales: {
      title: "Condiciones Generales de Alquiler | Costa Brava Rent a Boat",
      description: "Condiciones generales para el alquiler de embarcaciones en Blanes, Costa Brava. Términos y responsabilidades.",
      keywords: "condiciones generales alquiler, términos alquiler barcos blanes"
    },
    cookiesPolicy: {
      title: "Política de Cookies | Costa Brava Rent a Boat",
      description: "Información sobre el uso de cookies en Costa Brava Rent a Boat. Aprende cómo utilizamos cookies para mejorar tu experiencia.",
      keywords: "política cookies, cookies costa brava rent boat, uso cookies, privacidad navegación"
    },
    accesibilidad: {
      title: "Declaracion de Accesibilidad | Costa Brava Rent a Boat",
      description: "Declaracion de accesibilidad web de Costa Brava Rent a Boat. Cumplimiento WCAG 2.1.",
      keywords: "accesibilidad web, wcag 2.1, accesibilidad costa brava rent boat"
    },
    blog: {
      title: "Blog de Navegación y Destinos | Costa Brava",
      description: "Guías, consejos y destinos para alquilar barcos en Blanes y la Costa Brava. Descubre calas secretas, rutas náuticas y tips de navegación.",
      keywords: "blog alquiler barcos, guías navegación costa brava, destinos en barco blanes, calas secretas costa brava, rutas náuticas",
      ogTitle: "Blog de Navegación Costa Brava | Guías y Destinos en Barco",
      ogDescription: "Descubre guías completas, consejos de navegación y los mejores destinos de la Costa Brava. Calas secretas, rutas y tips para tu aventura en barco."
    },
    boatDetail: {
      title: "{boatName} Blanes | {capacity} Personas desde {pricePerHour}€/h Costa Brava",
      description: "Alquila {boatName} en Blanes, Costa Brava. {capacity} personas, {license}. Desde {pricePerHour}€/h, gasolina incluida. 4.8★ Google. Reserva online!",
      keywords: "alquiler {boatName}, {boatName} blanes, barco {capacity} personas costa brava"
    },
    excursionDetail: {
      title: "Excursión Privada en Barco Blanes | {capacity} Personas desde {pricePerHour}€/h Costa Brava",
      description: "Contrata una excursión privada en barco con patrón en Blanes, Costa Brava. {capacity} personas, capitán incluido. Desde {pricePerHour}€/h. 4.8★ Google. Reserva online!",
      keywords: "excursión privada barco blanes, excursión con capitán costa brava, paseo en barco blanes"
    },
    gallery: {
      title: "Galeria de Fotos Clientes | Costa Brava Rent a Boat",
      description: "Fotos reales de nuestros clientes disfrutando en barco por la Costa Brava desde Blanes. Comparte tu experiencia nautica!",
      keywords: "fotos clientes barcos blanes, galeria alquiler barcos costa brava, experiencias barco blanes",
      ogTitle: "Galeria de Fotos | Costa Brava Rent a Boat",
      ogDescription: "Fotos reales de clientes navegando por la Costa Brava desde Blanes. Comparte tu experiencia!"
    },
    routes: {
      title: "Rutas en Barco desde Blanes | Costa Brava",
      description: "Descubre las mejores rutas en barco desde Blanes. Desde Sa Palomera hasta Tossa de Mar. Mapas interactivos y guia de navegacion.",
      keywords: "rutas barco blanes, excursiones barco costa brava, mapa rutas nauticas, tossa de mar barco, lloret barco",
      ogTitle: `Rutas en Barco desde Blanes | Costa Brava ${SEASON_YEAR}`,
      ogDescription: "5 rutas en barco desde Blanes. Sa Palomera, Cala Sant Francesc, Lloret de Mar, Tossa de Mar. Mapas interactivos!"
    },
    giftCards: {
      title: "Tarjetas Regalo Alquiler Barcos | Costa Brava Rent a Boat",
      description: "Regala una experiencia náutica en la Costa Brava. Tarjetas regalo desde 50 € para alquilar barcos en Blanes. Válidas 1 año.",
      keywords: "tarjetas regalo barcos, regalo alquiler barco blanes, experiencia náutica regalo, costa brava regalo",
      ogTitle: "Tarjetas Regalo | Costa Brava Rent a Boat",
      ogDescription: "Regala una experiencia náutica inolvidable. Tarjetas desde 50 € canjeables en todos nuestros barcos en Blanes."
    },
    pricing: {
      title: `Precios Alquiler Barcos Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Consulta precios de alquiler de barcos en Blanes. Sin licencia desde 70\u20ac/hora. Con licencia desde 150\u20ac. Gasolina incluida. Temporada baja, media y alta.",
      keywords: "precios alquiler barco costa brava, cuanto cuesta alquilar barco blanes, tarifas barco sin licencia",
      ogTitle: `Precios Alquiler Barcos Blanes ${SEASON_YEAR} | Desde 70\u20ac`,
      ogDescription: "Compara precios de todos nuestros barcos en Blanes. Sin licencia desde 70\u20ac/h. Gasolina incluida. Temporada baja, media y alta."
    },
    locationBarcelona: {
      title: "Alquiler Barcos cerca de Barcelona | Blanes a 70min | Costa Brava",
      description: "Alquila barcos sin licencia a 70 minutos de Barcelona. Blanes, Costa Brava. Mejores precios, aguas cristalinas. Desde 70\u20ac. Gasolina incluida.",
      keywords: "alquilar barco sin licencia barcelona, alquiler barcos cerca barcelona, barcos costa brava desde barcelona",
      ogTitle: "Alquiler Barcos cerca de Barcelona | Blanes Costa Brava",
      ogDescription: "A solo 70 min de Barcelona. Barcos sin licencia desde 70\u20ac con gasolina incluida. Aguas cristalinas de la Costa Brava."
    },
    locationCostaBrava: {
      title: `Alquiler Barcos Costa Brava ${SEASON_YEAR} | Sin Licencia desde 70\u20ac/h | Blanes, Lloret, Tossa`,
      description: "Alquila barcos en la Costa Brava desde el Puerto de Blanes. 8 barcos sin licencia desde 70\u20ac/h con gasolina incluida. Navega a calas v\u00edrgenes entre Blanes y Tossa de Mar. Reserva online \u00b7 Cambio de fecha gratis.",
      keywords: "alquiler barco costa brava, alquiler barcos costa brava, alquilar barco costa brava, barco sin licencia costa brava, alquiler barco sin licencia costa brava, excursion barco costa brava"
    },
    boatRentalCostaBrava: {
      title: `Boat Rental Costa Brava | No License from 70\u20ac/h — Blanes, Spain`,
      description: "Rent a boat on the Costa Brava from Blanes port. No license required. 9 boats for 4-12 people. Explore hidden coves, snorkel spots & medieval villages.",
      keywords: "boat rental costa brava, rent a boat costa brava, boat hire spain no license",
      ogTitle: "Boat Rental Costa Brava — From Blanes Port",
      ogDescription: "Explore Spain's most beautiful coastline by boat. No license needed. From 70\u20ac/hour."
    },
    activitySnorkel: {
      title: "Excursion Snorkel en Barco Blanes | Mejores Calas Costa Brava",
      description: "Excursion de snorkel en barco desde Blanes. Descubre las mejores calas para hacer snorkel en Costa Brava. Equipo disponible desde 7,50 EUR. Reserva online.",
      keywords: "snorkel barco blanes, excursion snorkel costa brava, calas snorkel blanes, alquiler barco snorkel",
      ogTitle: "Excursion Snorkel en Barco desde Blanes | Costa Brava",
      ogDescription: "Descubre las mejores calas para snorkel desde Blanes. Barcos sin licencia, equipo disponible. Reserva tu aventura submarina."
    },
    activityFamilies: {
      title: "Alquiler Barco Familias Costa Brava | Desde 70 EUR/h Blanes",
      description: "Alquiler barco para familias en Costa Brava desde 70 EUR/h. Sin licencia, gasolina incluida, chalecos infantiles. Calas tranquilas y seguras. Reserva online.",
      keywords: "barco familias costa brava, alquiler barco con ninos, excursion barco familiar, barco sin licencia familias",
      ogTitle: "Barco para Familias en Costa Brava | Desde Blanes",
      ogDescription: "Barcos seguros para toda la familia. Sin licencia necesaria, chalecos infantiles incluidos. Desde 70 EUR/h con gasolina."
    },
    activitySunset: {
      title: "Sunset Boat Trip Blanes | Evening Boat Ride Costa Brava",
      description: "Experience a magical sunset boat trip from Blanes, Costa Brava. No license needed, from 70 EUR/h. Perfect for couples and groups. Book your evening boat ride.",
      keywords: "sunset boat trip blanes, evening boat ride costa brava, sunset cruise blanes, romantic boat trip",
      ogTitle: "Sunset Boat Trip from Blanes | Costa Brava",
      ogDescription: "Magical sunset views from the sea. No license needed. Perfect evening experience from Blanes port."
    },
    activityFishing: {
      title: "Pesca desde Barco en Blanes | Alquiler Barco Pesca Costa Brava",
      description: "Pesca desde nuestros barcos en Blanes, Costa Brava. Barcos con licencia para zonas de pesca. Lubinas, doradas y mas. Reserva tu jornada de pesca.",
      keywords: "pesca barco blanes, alquiler barco pesca costa brava, pesca deportiva blanes, barco para pescar",
      ogTitle: "Pesca desde Barco en Blanes | Costa Brava",
      ogDescription: "Alquila un barco para pescar en Blanes. Barcos con licencia para llegar a las mejores zonas de pesca."
    },
    boatRentalBlanes: {
      title: "Boat Rental in Blanes | Costa Brava, Spain - No License from 70\u20ac/h",
      description: "Rent a boat in Blanes, Costa Brava. No license needed from 70\u20ac/h, fuel included. 8 boats for 4-12 people. April to October. 4.8\u2605 Google. Book online.",
      keywords: "boat rental blanes, rent boat blanes, blanes boat hire, costa brava boat rental, boat rental spain no license",
      ogTitle: "Boat Rental in Blanes | Costa Brava, Spain",
      ogDescription: "Rent boats in Blanes, gateway to Costa Brava. No license needed. Fuel included. 8 boats, 4-12 people. Book your adventure."
    },
    notFound: {
      title: "Página no encontrada | Costa Brava Rent a Boat",
      description: "La página que buscas no existe. Vuelve al inicio para alquilar barcos en Blanes, Costa Brava.",
      keywords: "error 404, página no encontrada, costa brava rent boat"
    }
  },
  en: {
    home: {
      title: "Boat Rental Blanes No Licence | Blanes Port from \u20ac70/h",
      description: "Rent a boat in Blanes port. No licence, no experience needed \u2014 15 min training. Fuel included, from \u20ac70/h. 8 boats available. 4.8\u2605 Google. Book online.",
      keywords: "boat rental blanes, rent boat blanes, boat rental blanes no license, boat hire blanes, blanes port boat rental, rent a boat blanes",
      ogTitle: `Boat Rental Blanes | Port of Blanes ${SEASON_YEAR}`,
      ogDescription: "Rent boats in Blanes port. No license needed, from 70\u20ac/h with fuel included. 8 boats available. Book now."
    },
    booking: {
      title: "Book Your Boat in Blanes | Costa Brava",
      description: "Book your boat in Blanes in minutes. With or without license, from 1 hour. Instant WhatsApp response. Start your adventure!",
      keywords: "book boat blanes, boat booking form, boat reservation costa brava, online boat rental"
    },
    faq: {
      title: "Boat Rental Blanes FAQ | Frequently Asked Questions",
      description: "Do I need a license? What's included? How much does it cost? All your boat rental questions answered. Clear answers!",
      keywords: "faq boat rental, frequently asked questions boats, boat rental costa brava info, blanes boats information",
      ogTitle: "Blanes Boat Rental FAQ | Your Questions Answered Costa Brava",
      ogDescription: "Need a license? What's included? Prices? All answers about renting boats in Blanes. Clear and complete information!"
    },
    locationBlanes: {
      title: `Boat Rental Blanes Port ${SEASON_YEAR} | No License from 70\u20ac/h`,
      description: "No license boat rental at Blanes Port from 70\u20ac/h. Fuel included, free parking. Snorkel, paddle board & seascooter available. 8 boats. 4.8\u2605 Google. Book online.",
      keywords: "boat rental blanes, rent boat blanes, boat hire blanes, boats without license blanes, blanes port boat rental, boat rental blanes no license",
      ogTitle: `Boat Rental at Blanes Port | ${SEASON_YEAR}`,
      ogDescription: "Rent boats from Blanes Port. No license needed, fuel included. 8 boats available. Explore coves and beaches. Book now!"
    },
    locationLloret: {
      title: "Boat Rental Lloret de Mar | From Blanes 70\u20ac/h Fuel Included",
      description: "Boat rental in Lloret de Mar without license from Blanes. From 70\u20ac/h, fuel included. 4.8\u2605 Google. Explore coves and beaches. Book online.",
      keywords: "boat rental lloret de mar, visit lloret by boat, lloret excursion from blanes, boats lloret costa brava",
      ogTitle: "Boat Trip to Lloret de Mar | From Blanes Costa Brava",
      ogDescription: "Sail from Blanes to Lloret de Mar by boat. With or without license. Discover the best beaches and coves. Adventure guaranteed!"
    },
    locationTossa: {
      title: "Boat Trip to Tossa de Mar from Blanes",
      description: "Sail to Tossa de Mar in 1 hour from Blanes. Discover the most beautiful medieval town of Costa Brava. With or without license. Book!",
      keywords: "boat rental tossa de mar, visit tossa by boat, tossa excursion from blanes, boats tossa costa brava, vila vella tossa",
      ogTitle: "Boat Trip to Tossa de Mar | Vila Vella from Blanes",
      ogDescription: "Sail to Tossa de Mar in 1h from Blanes. Discover the most beautiful medieval town of Costa Brava. With or without license. Book!"
    },
    locationMalgrat: {
      title: "Boat Rental near Malgrat de Mar | Blanes Port 10 min \u20ac70",
      description: "Staying in Malgrat de Mar? Blanes Port is 10 min by car. License-free boat rental from \u20ac70/h, fuel included. 8 boats available.",
      keywords: "boat rental malgrat de mar, boats near malgrat, boat trip malgrat, costa brava boat rental south",
      ogTitle: "Boat Rental near Malgrat de Mar | From Blanes",
      ogDescription: "Malgrat de Mar to Blanes Port in 10 min. License-free boats from \u20ac70. Fuel included. Book now."
    },
    locationSantaSusanna: {
      title: "Boat Rental near Santa Susanna | Blanes Port 15 min \u20ac70",
      description: "Holiday in Santa Susanna? Blanes Port is 15 min away. Boat rental from \u20ac70/h, fuel included. 8 boats available.",
      keywords: "boat rental santa susanna, boats near santa susanna, costa brava boat rental",
      ogTitle: "Boat Rental near Santa Susanna | From Blanes",
      ogDescription: "Santa Susanna to Blanes Port in 15 min. License-free boats from \u20ac70. Book your adventure."
    },
    locationCalella: {
      title: "Boat Rental near Calella | Blanes Port 20 min from \u20ac70",
      description: "Staying in Calella? Blanes Port is 20 min by car. Boat rental from \u20ac70/h, fuel included. Explore Costa Brava.",
      keywords: "boat rental calella, boats calella maresme, boat trip calella, costa brava boat rental",
      ogTitle: "Boat Rental near Calella | From Blanes Costa Brava",
      ogDescription: "Calella to Blanes Port in 20 min. License-free boats from \u20ac70. Discover Costa Brava."
    },
    categoryLicenseFree: {
      title: "No License Boat Rental Costa Brava | 5 Boats from 70\u20ac/h Blanes",
      description: "5 no-license boats in Blanes from 70\u20ac/h. Fuel included, 4-7 people. No experience needed, 15 min training. 4.8\u2605 Google (300+ reviews). Book online.",
      keywords: "license free boats blanes, boats without license, no license boat rental costa brava, 15hp boats blanes",
      ogTitle: "No License Boats in Blanes | Easy & Safe Costa Brava",
      ogDescription: "Rent boats without license in Blanes. Up to 15 HP, 4-7 people. No qualification needed. Easy to drive. Book your adventure!"
    },
    categoryLicensed: {
      title: "Licensed Boat Rental Costa Brava | Blanes from 150\u20ac/h",
      description: "Sail to Lloret (15 min) and Tossa (30 min) from Blanes. 3 boats 80-115HP. Basic License or with skipper. 4.8\u2605 Google. Book online.",
      keywords: "licensed boats blanes, boats with license, basic license boat rental, powerful boats costa brava",
      ogTitle: "Licensed Boats in Blanes | Lloret 15 min, Tossa 30 min",
      ogDescription: "3 powerful boats 80-115HP in Blanes. With your Basic License or with skipper. Book online."
    },
    testimonios: {
      title: "Customer Reviews Boat Rental Blanes",
      description: "Read real customer reviews who rented boats in Blanes. +100 verified reviews. Costa Brava experiences.",
      keywords: "boat rental reviews blanes, reviews costa brava rent boat, customer testimonials boats"
    },
    privacyPolicy: {
      title: "Privacy Policy | Costa Brava Rent a Boat",
      description: "Privacy policy and data protection of Costa Brava Rent a Boat. Information about the processing of your personal data.",
      keywords: "privacy policy, data protection, gdpr costa brava rent boat"
    },
    termsConditions: {
      title: "Terms and Conditions | Costa Brava Rent a Boat",
      description: "Terms and conditions of the boat rental service in Blanes, Costa Brava. Rules and conditions of use.",
      keywords: "terms conditions, boat rental conditions, boat usage rules"
    },
    condicionesGenerales: {
      title: "General Rental Conditions | Costa Brava Rent a Boat",
      description: "General conditions for boat rental in Blanes, Costa Brava. Terms and responsibilities.",
      keywords: "general rental conditions, boat rental terms blanes"
    },
    cookiesPolicy: {
      title: "Cookie Policy | Costa Brava Rent a Boat",
      description: "Information about cookie usage on Costa Brava Rent a Boat website.",
      keywords: "cookie policy, cookies costa brava rent boat, cookie usage, browsing privacy"
    },
    accesibilidad: {
      title: "Accessibility Statement | Costa Brava Rent a Boat",
      description: "Web accessibility statement of Costa Brava Rent a Boat. WCAG 2.1 compliance.",
      keywords: "web accessibility, wcag 2.1, accessibility costa brava rent boat"
    },
    blog: {
      title: "Navigation and Destinations Blog | Costa Brava",
      description: "Guides, tips and destinations for boat rental in Blanes and Costa Brava. Discover secret coves, nautical routes and navigation tips.",
      keywords: "boat rental blog, costa brava navigation guides, boat destinations blanes, secret coves costa brava, nautical routes",
      ogTitle: "Costa Brava Navigation Blog | Boat Guides and Destinations",
      ogDescription: "Discover complete guides, navigation tips and the best destinations of Costa Brava. Secret coves, routes and tips for your boat adventure."
    },
    boatDetail: {
      title: "{boatName} Blanes | {capacity} People from {pricePerHour}€/h Costa Brava",
      description: "Rent {boatName} in Blanes, Costa Brava. {capacity} people, {license}. From {pricePerHour}€/h, fuel included. 4.8★ Google. Book online!",
      keywords: "rent {boatName}, {boatName} blanes, boat {capacity} people costa brava"
    },
    excursionDetail: {
      title: "Private Boat Excursion Blanes | {capacity} People from {pricePerHour}€/h Costa Brava",
      description: "Private boat trip with skipper in Blanes, Costa Brava. {capacity} people, captain included. From {pricePerHour}€/h. 4.8★ Google. Book online!",
      keywords: "private boat excursion blanes, boat trip with captain costa brava, boat tour blanes"
    },
    gallery: {
      title: "Customer Photo Gallery | Costa Brava Rent a Boat",
      description: "Real photos from our customers enjoying boat trips on Costa Brava from Blanes. Share your nautical experience!",
      keywords: "customer photos boats blanes, gallery boat rental costa brava, boat trip experiences blanes",
      ogTitle: "Photo Gallery | Costa Brava Rent a Boat",
      ogDescription: "Real photos from customers sailing the Costa Brava from Blanes. Share your experience!"
    },
    routes: {
      title: "Boat Routes from Blanes | Costa Brava",
      description: "Discover the best boat routes from Blanes. From Sa Palomera to Tossa de Mar. Interactive maps and navigation guide.",
      keywords: "boat routes blanes, boat excursions costa brava, nautical route maps, tossa de mar boat, lloret boat",
      ogTitle: `Boat Routes from Blanes | Costa Brava ${SEASON_YEAR}`,
      ogDescription: "5 boat routes from Blanes. Sa Palomera, Cala Sant Francesc, Lloret de Mar, Tossa de Mar. Interactive maps!"
    },
    giftCards: {
      title: "Gift Cards Boat Rental | Costa Brava Rent a Boat",
      description: "Give a nautical experience on Costa Brava. Gift cards from 50 € for boat rental in Blanes. Valid for 1 year.",
      keywords: "boat gift cards, boat rental gift blanes, nautical experience gift, costa brava gift",
      ogTitle: "Gift Cards | Costa Brava Rent a Boat",
      ogDescription: "Give an unforgettable nautical experience. Cards from 50 € redeemable on all our boats in Blanes."
    },
    pricing: {
      title: `Boat Rental Prices Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Check boat rental prices in Blanes. No license from 70\u20ac/h. Licensed from 150\u20ac. Fuel included. Low, mid and high season rates.",
      keywords: "boat rental prices costa brava, how much boat rental blanes, boat hire rates blanes"
    },
    locationBarcelona: {
      title: "Boat Rental near Barcelona | Blanes 70min | Costa Brava",
      description: "Rent boats without license 70 minutes from Barcelona. Blanes, Costa Brava. Best prices, crystal clear water. From 70\u20ac. Fuel included.",
      keywords: "boat rental near barcelona, boats without license barcelona, costa brava boats from barcelona"
    },
    locationCostaBrava: {
      title: `Boat Rental Costa Brava ${SEASON_YEAR} | No License from 70\u20ac/h | Blanes, Lloret, Tossa`,
      description: "Rent boats on the Costa Brava from Blanes Port. 8 no-license boats from 70\u20ac/h, fuel included. Sail to hidden coves between Blanes and Tossa de Mar. 4.8\u2605 Google (300+ reviews). Book online.",
      keywords: "boat rental costa brava, rent a boat costa brava, costa brava boat rental, no license boat costa brava, boat hire costa brava, costa brava boat trip"
    },
    boatRentalCostaBrava: {
      title: `Boat Rental Costa Brava | No License from 70\u20ac/h — Blanes, Spain`,
      description: "Rent a boat on the Costa Brava from Blanes port. No license required. 8 boats for 4-12 people. Explore hidden coves, snorkel spots & medieval villages.",
      keywords: "boat rental costa brava, rent a boat costa brava, boat hire spain no license, costa brava boat excursion",
      ogTitle: "Boat Rental Costa Brava — From Blanes Port",
      ogDescription: "Explore Spain's most beautiful coastline by boat. No license needed. From 70\u20ac/hour."
    },
    activitySnorkel: {
      title: "Snorkeling Boat Trip Blanes | Best Coves Costa Brava",
      description: "Snorkeling boat excursion from Blanes. Discover the best coves for snorkeling in Costa Brava. Equipment rental from 7.50 EUR. Book online.",
      keywords: "snorkeling boat trip blanes, snorkel costa brava, boat snorkeling excursion, best snorkel coves blanes",
      ogTitle: "Snorkeling Boat Trip from Blanes | Costa Brava",
      ogDescription: "Discover the best snorkeling coves from Blanes. No license boats, equipment available. Book your underwater adventure."
    },
    activityFamilies: {
      title: "Family Boat Rental Costa Brava | From 70 EUR/h Blanes",
      description: "Family boat rental in Costa Brava from 70 EUR/h. No license needed, fuel included, children life jackets. Safe coves for kids. Book online.",
      keywords: "family boat rental costa brava, boat with kids blanes, family boat trip, no license family boat",
      ogTitle: "Family Boat Rental in Costa Brava | From Blanes",
      ogDescription: "Safe boats for the whole family. No license needed, children life jackets included. From 70 EUR/h with fuel."
    },
    activitySunset: {
      title: "Sunset Boat Trip Blanes | Evening Boat Ride Costa Brava",
      description: "Experience a magical sunset boat trip from Blanes, Costa Brava. No license needed, from 70 EUR/h. Perfect for couples and groups. Book your evening boat ride.",
      keywords: "sunset boat trip blanes, evening boat ride costa brava, sunset cruise blanes, romantic boat trip",
      ogTitle: "Sunset Boat Trip from Blanes | Costa Brava",
      ogDescription: "Magical sunset views from the sea. No license needed. Perfect evening experience from Blanes port."
    },
    activityFishing: {
      title: "Fishing Boat Rental Blanes | Boat Fishing Costa Brava",
      description: "Rent a boat for fishing in Blanes, Costa Brava. Licensed boats for deeper waters. Sea bass, sea bream and more. Book your fishing day.",
      keywords: "fishing boat blanes, boat fishing costa brava, sport fishing blanes, fishing boat rental",
      ogTitle: "Fishing Boat Rental in Blanes | Costa Brava",
      ogDescription: "Rent a boat for fishing in Blanes. Licensed boats to reach the best fishing grounds in Costa Brava."
    },
    boatRentalBlanes: {
      title: "Boat Rental in Blanes | Costa Brava, Spain - No License from 70\u20ac/h",
      description: "Rent a boat in Blanes, Costa Brava. No license needed from 70\u20ac/h, fuel included. 8 boats for 4-12 people. April to October. 4.8\u2605 Google. Book online.",
      keywords: "boat rental blanes, rent boat blanes, blanes boat hire, costa brava boat rental, boat rental spain no license",
      ogTitle: "Boat Rental in Blanes | Costa Brava, Spain",
      ogDescription: "Rent boats in Blanes, gateway to Costa Brava. No license needed. Fuel included. 8 boats, 4-12 people. Book your adventure."
    },
    notFound: {
      title: "Page not found | Costa Brava Rent a Boat",
      description: "The page you're looking for doesn't exist. Return to home to rent boats in Blanes, Costa Brava.",
      keywords: "error 404, page not found, costa brava rent boat"
    }
  },
  ca: {
    home: {
      title: "Lloguer Barques Blanes Sense Llic\u00e8ncia | Port de Blanes des de 70\u20ac/h",
      description: "Lloguer barques al Port de Blanes sense llic\u00e8ncia des de 70\u20ac/h. Gasolina inclosa. 4.8\u2605 Google (300+ opinions). 8 barques, fins a 7 persones. Reserva online o WhatsApp.",
      keywords: "lloguer barques blanes, lloguer embarcacions blanes, barques sense llicència blanes, port blanes barques, llogar barques blanes",
      ogTitle: `Lloguer de Barques a Blanes | Port de Blanes ${SEASON_YEAR}`,
      ogDescription: "Lloga barques sense llic\u00e8ncia al Port de Blanes. 8 barques disponibles, gasolina inclosa. 4.8\u2605 Google. Reserva la teva aventura!"
    },
    booking: {
      title: "Sol·licitar Reserva de Barca a Blanes | Costa Brava",
      description: "Reserva la teva barca a Blanes en minuts. Amb o sense llicència, des d'1 hora. Resposta immediata per WhatsApp. Comença l'aventura!",
      keywords: "reservar barque blanes, formulari reserva embarcació, booking barque costa brava, lloguer barques online"
    },
    faq: {
      title: "Preguntes Freqüents Lloguer Barques Blanes | FAQ",
      description: "Necessito llicència? Què inclou? Quant costa? Resol tots els dubtes sobre lloguer de barques a Blanes. Respostes clares!",
      keywords: "faq lloguer barques, preguntes freqüents embarcacions, dubtes lloguer barques costa brava",
      ogTitle: "FAQ Lloguer Barques Blanes | Resol els Teus Dubtes Costa Brava",
      ogDescription: "Necessito llicència? Què inclou? Preus? Totes les respostes sobre llogar barques a Blanes. Informació clara i completa!"
    },
    locationBlanes: {
      title: `Lloguer Barques Blanes Sense Llic\u00e8ncia ${SEASON_YEAR} | Port de Blanes des de 70\u20ac/h`,
      description: "Lloguer de barques sense llic\u00e8ncia al Port de Blanes. Des de 70\u20ac/h, gasolina inclosa. 8 barques per a fins a 7 persones. 4.8\u2605 Google (300+ opinions). Reserva online.",
      keywords: "lloguer barques blanes, llogar barques blanes, barques sense llic\u00e8ncia blanes, lloguer barques port blanes, lloguer embarcacions blanes",
      ogTitle: `Lloguer de Barques al Port de Blanes | ${SEASON_YEAR}`,
      ogDescription: "Lloga barques des del Port de Blanes. Sense llic\u00e8ncia des de 70\u20ac/h, gasolina inclosa. 8 embarcacions disponibles. Reserva ja!"
    },
    locationLloret: {
      title: "Lloguer Barques Lloret de Mar | Des de Blanes 70\u20ac/h Gasolina Inclosa",
      description: "Lloguer de barques a Lloret de Mar sense llicencia des de Blanes. Des de 70\u20ac/h, gasolina inclosa. 4.8\u2605 Google. Navega per cales i platges. Reserva online.",
      keywords: "lloguer barques lloret de mar, visitar lloret en barque, excursió lloret des de blanes",
      ogTitle: "Excursió en Barca a Lloret de Mar | Des de Blanes Costa Brava",
      ogDescription: "Navega de Blanes a Lloret de Mar en barca. Amb o sense llicència. Descobreix les millors platges i cales. Aventura garantida!"
    },
    locationTossa: {
      title: "Excursió en Barca a Tossa de Mar des de Blanes",
      description: "Navega a Tossa de Mar en 1 hora des de Blanes. Descobreix el poble medieval més bonic de la Costa Brava. Amb o sense llicència. Reserva!",
      keywords: "lloguer barques tossa de mar, visitar tossa en barque, excursió tossa des de blanes, vila vella tossa",
      ogTitle: "Excursió en Barca a Tossa de Mar | Vila Vella des de Blanes",
      ogDescription: "Navega a Tossa de Mar en 1h des de Blanes. Descobreix el poble medieval més bonic de la Costa Brava. Amb o sense llicència. Reserva!"
    },
    locationMalgrat: {
      title: "Lloguer de Barques a prop de Malgrat de Mar | Port de Blanes 10 min 70\u20ac",
      description: "Allotjat a Malgrat de Mar? Port de Blanes a 10 min en cotxe. Lloguer barques sense llicència des de 70\u20ac/h. 8 barques disponibles.",
      keywords: "lloguer barca malgrat de mar, barques prop malgrat, excursió barca malgrat",
      ogTitle: "Lloguer de Barques a prop de Malgrat de Mar | Des de Blanes",
      ogDescription: "De Malgrat al Port de Blanes en 10 min. Barques sense llicència des de 70\u20ac. Reserva ara."
    },
    locationSantaSusanna: {
      title: "Lloguer de Barques a prop de Santa Susanna | Port de Blanes 15 min 70\u20ac",
      description: "Vacances a Santa Susanna? Port de Blanes a 15 min. Lloguer barques sense llicència des de 70\u20ac/h. Reserva online.",
      keywords: "lloguer barca santa susanna, barques prop santa susanna, excursió barca santa susanna",
      ogTitle: "Lloguer de Barques a prop de Santa Susanna | Des de Blanes",
      ogDescription: "De Santa Susanna al Port de Blanes en 15 min. Barques sense llicència des de 70\u20ac."
    },
    locationCalella: {
      title: "Lloguer de Barques a prop de Calella | Port de Blanes 20 min des de 70\u20ac",
      description: "A Calella? Port de Blanes a 20 min en cotxe. Lloguer barques sense llicència des de 70\u20ac/h. Gasolina inclosa.",
      keywords: "lloguer barca calella, barques calella maresme, excursió barca calella",
      ogTitle: "Lloguer de Barques a prop de Calella | Des de Blanes Costa Brava",
      ogDescription: "De Calella al Port de Blanes en 20 min. Barques sense llicència des de 70\u20ac."
    },
    categoryLicenseFree: {
      title: "Lloguer Barques Sense Llicencia Costa Brava | 5 Barques des de 70\u20ac/h Blanes",
      description: "5 barques sense llicencia a Blanes des de 70\u20ac/h. Gasolina inclosa, 4-7 persones. Sense experiencia, formacio 15 min. 4.8\u2605 Google (300+ opinions). Reserva online.",
      keywords: "barques sense llicència blanes, lloguer barques sense títol, embarcacions sense permís costa brava, barques 15cv blanes",
      ogTitle: "Barques Sense Llicència a Blanes | Fàcil i Segur Costa Brava",
      ogDescription: "Lloga barques sense llicència a Blanes. Fins a 15 CV, 4-7 persones. No cal titulació. Fàcil de manejar. Reserva la teva aventura!"
    },
    categoryLicensed: {
      title: "Lloguer Barques Amb Llic\u00e8ncia Costa Brava | Blanes des de 150\u20ac/h",
      description: "Navega a Lloret (15 min) i Tossa (30 min) des de Blanes. 3 barques 80-115CV. Llic\u00e8ncia B\u00e0sica o amb patr\u00f3. 4.8\u2605 Google. Reserva online.",
      keywords: "barques amb llic\u00e8ncia blanes, lloguer barques llic\u00e8ncia b\u00e0sica, embarcacions llic\u00e8ncia b\u00e0sica o ICC, barques potents costa brava",
      ogTitle: "Barques Amb Llic\u00e8ncia a Blanes | Lloret 15 min, Tossa 30 min",
      ogDescription: "3 barques potents 80-115CV a Blanes. Amb la teva Llic\u00e8ncia B\u00e0sica o amb patr\u00f3. Reserva online."
    },
    testimonios: {
      title: "Opinions Clients Lloguer Barques Blanes",
      description: "Llegeix opinions reals de clients que han llogat barques a Blanes. +100 ressenyes verificades. Experiencies a la Costa Brava.",
      keywords: "opinions lloguer barques blanes, ressenyes costa brava rent boat, testimonis clients barques"
    },
    privacyPolicy: {
      title: "Política de Privacitat | Costa Brava Rent a Boat",
      description: "Política de privacitat i protecció de dades de Costa Brava Rent a Boat.",
      keywords: "política privacitat, protecció dades, rgpd costa brava rent boat"
    },
    termsConditions: {
      title: "Termes i Condicions | Costa Brava Rent a Boat",
      description: "Termes i condicions del servei de lloguer de barques a Blanes, Costa Brava.",
      keywords: "termes condicions, condicions lloguer barques, normes ús embarcacions"
    },
    condicionesGenerales: {
      title: "Condicions Generals de Lloguer | Costa Brava Rent a Boat",
      description: "Condicions generals per al lloguer d'embarcacions a Blanes, Costa Brava. Termes i responsabilitats.",
      keywords: "condicions generals lloguer, termes lloguer barques blanes"
    },
    cookiesPolicy: {
      title: "Politica de Cookies | Costa Brava Rent a Boat",
      description: "Informacio sobre l'us de cookies a Costa Brava Rent a Boat.",
      keywords: "politica cookies, cookies costa brava rent boat, us cookies, privacitat navegacio"
    },
    accesibilidad: {
      title: "Declaracio d'Accessibilitat | Costa Brava Rent a Boat",
      description: "Declaracio d'accessibilitat web de Costa Brava Rent a Boat. Compliment WCAG 2.1.",
      keywords: "accessibilitat web, wcag 2.1, accessibilitat costa brava rent boat"
    },
    blog: {
      title: "Blog de Navegació i Destinacions | Costa Brava",
      description: "Guies, consells i destinacions per llogar barques a Blanes i la Costa Brava. Descobreix cales secretes, rutes nàutiques i consells de navegació.",
      keywords: "blog lloguer barques, guies navegació costa brava, destinacions en barca blanes, cales secretes costa brava, rutes nàutiques",
      ogTitle: "Blog de Navegació Costa Brava | Guies i Destinacions en Barca",
      ogDescription: "Descobreix guies completes, consells de navegació i les millors destinacions de la Costa Brava. Cales secretes, rutes i consells per a la teva aventura en barca."
    },
    gallery: {
      title: "Galeria de Fotos Clients | Costa Brava Rent a Boat",
      description: "Fotos reals dels nostres clients gaudint en barca per la Costa Brava des de Blanes. Comparteix la teva experiencia nautica!",
      keywords: "fotos clients barques blanes, galeria lloguer barques costa brava, experiencies barca blanes"
    },
    routes: {
      title: "Rutes en Barca des de Blanes | Costa Brava",
      description: "Descobreix les millors rutes en barca des de Blanes. Des de Sa Palomera fins a Tossa de Mar. Mapes interactius i guia de navegacio.",
      keywords: "rutes barca blanes, excursions barca costa brava, mapa rutes nautiques, tossa de mar barca"
    },
    giftCards: {
      title: "Targetes Regal Lloguer Barques | Costa Brava Rent a Boat",
      description: "Regala una experiencia nautica a la Costa Brava. Targetes regal des de 50 € per llogar barques a Blanes. Valides 1 any.",
      keywords: "targetes regal barques, regal lloguer barca blanes, experiencia nautica regal, costa brava regal"
    },
    pricing: {
      title: `Preus Lloguer Barques Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Consulta els preus de lloguer de barques a Blanes. Sense llicencia des de 70\u20ac/h. Gasolina inclosa. Temporada baixa, mitja i alta.",
      keywords: "preus lloguer barques costa brava, quant costa llogar barca blanes, tarifes barca sense llicencia"
    },
    locationBarcelona: {
      title: "Lloguer Barques prop de Barcelona | Blanes a 70min | Costa Brava",
      description: "Lloga barques sense llicencia a 70 minuts de Barcelona. Blanes, Costa Brava. Millors preus, aigues cristallines. Des de 70\u20ac.",
      keywords: "llogar barca sense llicencia barcelona, lloguer barques prop barcelona, barques costa brava des de barcelona"
    },
    locationCostaBrava: {
      title: `Lloguer Barques Costa Brava ${SEASON_YEAR} | Sense Llic\u00e8ncia des de 70\u20ac/h | Blanes, Lloret, Tossa`,
      description: "Lloga barques a la Costa Brava des del Port de Blanes. 8 barques sense llic\u00e8ncia des de 70\u20ac/h amb gasolina inclosa. Navega a cales verges entre Blanes i Tossa de Mar. Reserva online \u00b7 Canvi de data gratu\u00eft.",
      keywords: "lloguer barques costa brava, llogar barques costa brava, barques sense llic\u00e8ncia costa brava, excursi\u00f3 barques costa brava, lloguer embarcacions costa brava"
    },
    boatRentalCostaBrava: {
      title: `Boat Rental Costa Brava | No License from 70\u20ac/h — Blanes, Spain`,
      description: "Rent a boat on the Costa Brava from Blanes port. No license required. 9 boats for 4-12 people. Explore hidden coves, snorkel spots & medieval villages.",
      keywords: "boat rental costa brava, rent a boat costa brava, boat hire spain no license"
    }
  },
  fr: {
    home: {
      title: "Location Bateau Sans Permis Blanes | Port de Blanes d\u00e8s 70\u20ac/h",
      description: "Louez un bateau sans permis au Port de Blanes. 15 min de formation, carburant inclus. D\u00e8s 70\u20ac/h. 8 bateaux disponibles. 4.8\u2605 Google (300+ avis). R\u00e9servez en ligne.",
      keywords: "location bateau blanes, location bateau port blanes, bateau sans permis blanes, louer bateau blanes, location bateaux blanes"
    },
    booking: {
      title: "Réserver Votre Bateau à Blanes | Costa Brava",
      description: "Réservez votre bateau à Blanes en minutes. Avec ou sans permis, dès 1 heure. Réponse WhatsApp instantanée. Commencez l'aventure!",
      keywords: "réserver bateau blanes, formulaire réservation bateau, booking bateau costa brava, location bateaux en ligne"
    },
    faq: {
      title: "FAQ Location Bateaux Blanes | Questions Fréquentes",
      description: "Besoin d'un permis? Qu'est-ce qui est inclus? Combien ça coûte? Toutes vos questions sur la location de bateaux. Réponses claires!",
      keywords: "faq location bateaux, questions fréquentes embarcations, doutes location bateaux costa brava"
    },
    locationBlanes: {
      title: `Location Bateaux Blanes Sans Permis ${SEASON_YEAR} | Port de Blanes d\u00e8s 70\u20ac/h`,
      description: "Location de bateaux sans permis au Port de Blanes. D\u00e8s 70\u20ac/h, carburant inclus. 8 bateaux pour 7 personnes. 4.8\u2605 Google (300+ avis). R\u00e9servez en ligne.",
      keywords: "location bateaux blanes, louer bateau blanes, bateaux sans permis blanes, location bateaux port blanes, location embarcations blanes"
    },
    locationLloret: {
      title: "Location Bateau Lloret de Mar | Depuis Blanes 70\u20ac/h Carburant Inclus",
      description: "Location bateau a Lloret de Mar sans permis depuis Blanes. Des 70\u20ac/h, carburant inclus. 4.8\u2605 Google. Decouvrez criques et plages. Reservez en ligne.",
      keywords: "location bateaux lloret de mar, visiter lloret en bateau, excursion lloret depuis blanes"
    },
    locationTossa: {
      title: "Excursion en Bateau à Tossa de Mar depuis Blanes",
      description: "Naviguez vers Tossa de Mar en 1h depuis Blanes. Découvrez la plus belle ville médiévale de la Costa Brava. Avec ou sans permis. Réservez!",
      keywords: "location bateaux tossa de mar, visiter tossa en bateau, excursion tossa depuis blanes, vila vella tossa"
    },
    locationMalgrat: {
      title: "Location Bateau près de Malgrat de Mar | Port Blanes 10 min 70\u20ac",
      description: "En vacances à Malgrat de Mar ? Port de Blanes à 10 min en voiture. Location bateaux sans permis dès 70\u20ac/h. Essence incluse.",
      keywords: "location bateau malgrat de mar, bateaux près malgrat, excursion bateau malgrat",
      ogTitle: "Location de Bateaux près de Malgrat de Mar | Depuis Blanes",
      ogDescription: "De Malgrat au Port de Blanes en 10 min. Bateaux sans permis dès 70\u20ac. Réservez maintenant."
    },
    locationSantaSusanna: {
      title: "Location Bateau près de Santa Susanna | Port Blanes 15 min 70\u20ac",
      description: "Vacances à Santa Susanna ? Port de Blanes à 15 min. Location bateaux sans permis dès 70\u20ac/h. 8 bateaux disponibles.",
      keywords: "location bateau santa susanna, bateaux près santa susanna, excursion bateau santa susanna",
      ogTitle: "Location de Bateaux près de Santa Susanna | Depuis Blanes",
      ogDescription: "De Santa Susanna au Port de Blanes en 15 min. Bateaux sans permis dès 70\u20ac."
    },
    locationCalella: {
      title: "Location Bateau près de Calella | Port Blanes 20 min dès 70\u20ac",
      description: "En séjour à Calella ? Port de Blanes à 20 min en voiture. Location bateaux sans permis dès 70\u20ac/h. Essence incluse.",
      keywords: "location bateau calella, bateaux calella maresme, excursion bateau calella",
      ogTitle: "Location de Bateaux près de Calella | Depuis Blanes Costa Brava",
      ogDescription: "De Calella au Port de Blanes en 20 min. Bateaux sans permis dès 70\u20ac."
    },
    categoryLicenseFree: {
      title: "Bateaux Sans Permis Costa Brava | 5 Bateaux des 70\u20ac/h Blanes",
      description: "5 bateaux sans permis a Blanes des 70\u20ac/h. Carburant inclus, 4-7 personnes. Aucune experience, formation 15 min. 4.8\u2605 Google (300+ avis). Reservez en ligne.",
      keywords: "bateaux sans permis blanes, location bateaux sans license, embarcations sans permis costa brava, bateaux 15cv blanes"
    },
    categoryLicensed: {
      title: "Location Bateaux Avec Permis Costa Brava | Blanes d\u00e8s 150\u20ac/h",
      description: "Naviguez \u00e0 Lloret (15 min) et Tossa (30 min) depuis Blanes. 3 bateaux 80-115CV. Permis c\u00f4tier ou avec skipper. 4.8\u2605 Google. R\u00e9servez en ligne.",
      keywords: "bateaux avec permis blanes, location bateaux permis c\u00f4tier, embarcations permis bateau, bateaux puissants costa brava",
      ogTitle: "Bateaux Avec Permis \u00e0 Blanes | Lloret 15 min, Tossa 30 min",
      ogDescription: "3 bateaux puissants 80-115CV \u00e0 Blanes. Avec votre permis c\u00f4tier ou avec skipper. R\u00e9servez en ligne."
    },
    testimonios: {
      title: "Avis Clients Location Bateaux Blanes",
      description: "Lisez les avis reels de clients ayant loue des bateaux a Blanes. +100 avis verifies. Experiences sur la Costa Brava.",
      keywords: "avis location bateaux blanes, reviews costa brava rent boat, temoignages clients bateaux"
    },
    privacyPolicy: {
      title: "Politique de Confidentialité | Costa Brava Rent a Boat",
      description: "Politique de confidentialité et protection des données de Costa Brava Rent a Boat.",
      keywords: "politique confidentialité, protection données, rgpd costa brava rent boat"
    },
    termsConditions: {
      title: "Termes et Conditions | Costa Brava Rent a Boat",
      description: "Termes et conditions du service de location de bateaux à Blanes, Costa Brava.",
      keywords: "termes conditions, conditions location bateaux, règles usage embarcations"
    },
    condicionesGenerales: {
      title: "Conditions Generales de Location | Costa Brava Rent a Boat",
      description: "Conditions generales pour la location d'embarcations a Blanes, Costa Brava. Termes et responsabilites.",
      keywords: "conditions generales location, termes location bateaux blanes"
    },
    cookiesPolicy: {
      title: "Politique de Cookies | Costa Brava Rent a Boat",
      description: "Informations sur l'utilisation des cookies sur Costa Brava Rent a Boat.",
      keywords: "politique cookies, cookies costa brava rent boat, utilisation cookies, confidentialite navigation"
    },
    accesibilidad: {
      title: "Declaration d'Accessibilite | Costa Brava Rent a Boat",
      description: "Declaration d'accessibilite web de Costa Brava Rent a Boat. Conformite WCAG 2.1.",
      keywords: "accessibilite web, wcag 2.1, accessibilite costa brava rent boat"
    },
    blog: {
      title: "Blog de Navigation et Destinations | Costa Brava",
      description: "Guides, conseils et destinations pour louer des bateaux à Blanes et Costa Brava. Découvrez criques secrètes, routes nautiques et conseils de navigation.",
      keywords: "blog location bateaux, guides navigation costa brava, destinations bateau blanes, criques secrètes costa brava, routes nautiques",
      ogTitle: "Blog de Navigation Costa Brava | Guides et Destinations en Bateau",
      ogDescription: "Découvrez des guides complets, conseils de navigation et meilleures destinations de Costa Brava. Criques secrètes, routes et conseils pour votre aventure en bateau."
    },
    gallery: {
      title: "Galerie Photos Clients | Costa Brava Rent a Boat",
      description: "Photos reelles de nos clients profitant de la Costa Brava en bateau depuis Blanes. Partagez votre experience nautique!",
      keywords: "photos clients bateaux blanes, galerie location bateaux costa brava, experiences bateau blanes"
    },
    routes: {
      title: "Itineraires en Bateau depuis Blanes | Costa Brava",
      description: "Decouvrez les meilleures routes en bateau depuis Blanes. De Sa Palomera a Tossa de Mar. Cartes interactives et guide de navigation.",
      keywords: "routes bateau blanes, excursions bateau costa brava, carte routes nautiques, tossa de mar bateau"
    },
    giftCards: {
      title: "Cartes Cadeaux Location Bateaux | Costa Brava Rent a Boat",
      description: "Offrez une experience nautique sur la Costa Brava. Cartes cadeaux des 50 € pour louer des bateaux a Blanes. Valables 1 an.",
      keywords: "cartes cadeaux bateaux, cadeau location bateau blanes, experience nautique cadeau, costa brava cadeau"
    },
    pricing: {
      title: `Tarifs Location Bateaux Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Consultez les tarifs de location de bateaux a Blanes. Sans permis des 70\u20ac/h. Carburant inclus. Basse, moyenne et haute saison.",
      keywords: "tarifs location bateaux costa brava, combien coute louer bateau blanes, prix bateau sans permis"
    },
    locationBarcelona: {
      title: "Location Bateaux pres de Barcelone | Blanes a 70min | Costa Brava",
      description: "Louez des bateaux sans permis a 70 minutes de Barcelone. Blanes, Costa Brava. Meilleurs prix, eaux cristallines. Des 70\u20ac.",
      keywords: "location bateau sans permis barcelone, location bateaux pres barcelone, bateaux costa brava depuis barcelone"
    },
    locationCostaBrava: {
      title: `Location Bateaux Costa Brava ${SEASON_YEAR} | Sans Permis d\u00e8s 70\u20ac/h | Blanes, Lloret, Tossa`,
      description: "Louez des bateaux sur la Costa Brava depuis le Port de Blanes. 8 bateaux sans permis d\u00e8s 70\u20ac/h, carburant inclus. Naviguez vers des criques vierges entre Blanes et Tossa de Mar. R\u00e9servez en ligne \u00b7 Changement de date gratuit.",
      keywords: "location bateaux costa brava, louer bateau costa brava, bateau sans permis costa brava, excursion bateau costa brava, location embarcations costa brava"
    },
    boatRentalCostaBrava: {
      title: `Boat Rental Costa Brava | No License from 70\u20ac/h — Blanes, Spain`,
      description: "Rent a boat on the Costa Brava from Blanes port. No license required. 9 boats for 4-12 people. Explore hidden coves, snorkel spots & medieval villages.",
      keywords: "boat rental costa brava, rent a boat costa brava, boat hire spain no license"
    }
  },
  de: {
    home: {
      title: "Bootsverleih Blanes Ohne F\u00fchrerschein | Hafen Blanes ab 70\u20ac/h",
      description: "Bootsverleih im Hafen Blanes ohne F\u00fchrerschein ab 70\u20ac/h. Keine Erfahrung n\u00f6tig, 15 Min Einweisung. Kraftstoff inklusive. 8 Boote. 4.8\u2605 Google (300+ Bewertungen). Online buchen.",
      keywords: "bootsverleih blanes, boot mieten blanes, boote ohne führerschein blanes, hafen blanes bootsverleih, bootscharter blanes"
    },
    booking: {
      title: "Ihr Boot in Blanes Buchen | Costa Brava",
      description: "Buchen Sie Ihr Boot in Blanes in Minuten. Mit oder ohne Führerschein, ab 1 Stunde. Sofortige WhatsApp-Antwort. Starten Sie Ihr Abenteuer!",
      keywords: "boot buchen blanes, buchungsformular boot, boot reservierung costa brava, online bootsverleih"
    },
    faq: {
      title: "Bootsverleih Blanes FAQ | Häufig Gestellte Fragen",
      description: "Brauche ich einen Führerschein? Was ist enthalten? Was kostet es? Alle Ihre Fragen zum Bootsverleih beantwortet. Klare Antworten!",
      keywords: "faq bootsverleih, häufige fragen boote, zweifel bootsverleih costa brava"
    },
    locationBlanes: {
      title: `Bootsverleih Blanes Ohne F\u00fchrerschein ${SEASON_YEAR} | Hafen Blanes ab 70\u20ac/h`,
      description: "Bootsverleih ohne F\u00fchrerschein im Hafen Blanes. Ab 70\u20ac/h, Kraftstoff inklusive. 8 Boote f\u00fcr bis zu 7 Personen. 4.8\u2605 Google (300+ Bewertungen). Online buchen.",
      keywords: "bootsverleih blanes, boot mieten blanes, boote ohne f\u00fchrerschein blanes, bootsverleih hafen blanes, bootscharter blanes"
    },
    locationLloret: {
      title: "Bootsverleih Lloret de Mar | Ab Blanes 70\u20ac/h Kraftstoff Inklusive",
      description: "Bootsverleih Lloret de Mar ohne Fuhrerschein ab Blanes. Ab 70\u20ac/h, Kraftstoff inklusive. 4.8\u2605 Google. Buchten und Strande erkunden. Online buchen.",
      keywords: "bootsverleih lloret de mar, lloret per boot besuchen, lloret ausflug von blanes"
    },
    locationTossa: {
      title: "Bootsausflug nach Tossa de Mar von Blanes",
      description: "Segeln Sie in 1h von Blanes nach Tossa de Mar. Entdecken Sie die schönste mittelalterliche Stadt der Costa Brava. Mit oder ohne Führerschein. Buchen!",
      keywords: "bootsverleih tossa de mar, tossa per boot besuchen, tossa ausflug von blanes, vila vella tossa"
    },
    locationMalgrat: {
      title: "Bootsverleih bei Malgrat de Mar | Hafen Blanes 10 Min 70\u20ac",
      description: "Urlaub in Malgrat de Mar? Hafen Blanes in 10 Min mit dem Auto. Boote ohne Führerschein ab 70\u20ac/Std. Benzin inklusive.",
      keywords: "bootsverleih malgrat de mar, boote nahe malgrat, bootsausflug malgrat",
      ogTitle: "Bootsverleih bei Malgrat de Mar | Ab Blanes",
      ogDescription: "Von Malgrat zum Hafen Blanes in 10 Min. Boote ohne Führerschein ab 70\u20ac. Jetzt buchen."
    },
    locationSantaSusanna: {
      title: "Bootsverleih bei Santa Susanna | Hafen Blanes 15 Min 70\u20ac",
      description: "Urlaub in Santa Susanna? Hafen Blanes in 15 Min. Boote ohne Führerschein ab 70\u20ac/Std. 8 Boote verfügbar.",
      keywords: "bootsverleih santa susanna, boote nahe santa susanna, bootsausflug santa susanna",
      ogTitle: "Bootsverleih bei Santa Susanna | Ab Blanes",
      ogDescription: "Von Santa Susanna zum Hafen Blanes in 15 Min. Boote ohne Führerschein ab 70\u20ac."
    },
    locationCalella: {
      title: "Bootsverleih bei Calella | Hafen Blanes 20 Min ab 70\u20ac",
      description: "In Calella? Hafen Blanes in 20 Min mit dem Auto. Boote ohne Führerschein ab 70\u20ac/Std. Benzin inklusive.",
      keywords: "bootsverleih calella, boote calella maresme, bootsausflug calella",
      ogTitle: "Bootsverleih bei Calella | Ab Blanes Costa Brava",
      ogDescription: "Von Calella zum Hafen Blanes in 20 Min. Boote ohne Führerschein ab 70\u20ac."
    },
    categoryLicenseFree: {
      title: "Boote Ohne Fuhrerschein Costa Brava | 5 Boote ab 70\u20ac/h Blanes",
      description: "5 Boote ohne Fuhrerschein in Blanes ab 70\u20ac/h. Kraftstoff inklusive, 4-7 Personen. Keine Erfahrung notig, 15 Min Einweisung. 4.8\u2605 Google (300+ Bewertungen). Online buchen.",
      keywords: "boote ohne führerschein blanes, bootsverleih ohne lizenz, boote ohne erlaubnis costa brava, 15ps boote blanes"
    },
    categoryLicensed: {
      title: "Bootsverleih Mit F\u00fchrerschein Costa Brava | Blanes ab 150\u20ac/h",
      description: "Segeln Sie nach Lloret (15 Min) und Tossa (30 Min) ab Blanes. 3 Boote 80-115PS. Bootsf\u00fchrerschein oder mit Skipper. 4.8\u2605 Google. Online buchen.",
      keywords: "boote mit f\u00fchrerschein blanes, bootsverleih bootsf\u00fchrerschein, boote mit lizenz costa brava, starke boote costa brava",
      ogTitle: "Boote Mit F\u00fchrerschein in Blanes | Lloret 15 Min, Tossa 30 Min",
      ogDescription: "3 leistungsstarke Boote 80-115PS in Blanes. Mit Bootsf\u00fchrerschein oder mit Skipper. Online buchen."
    },
    testimonios: {
      title: "Kundenbewertungen Bootsverleih Blanes",
      description: "Lesen Sie echte Bewertungen von Kunden, die Boote in Blanes gemietet haben. +100 verifizierte Bewertungen. Erfahrungen Costa Brava.",
      keywords: "bewertungen bootsverleih blanes, rezensionen costa brava rent boat, kundenerfahrungen boote"
    },
    privacyPolicy: {
      title: "Datenschutzrichtlinie | Costa Brava Rent a Boat",
      description: "Datenschutzrichtlinie und Datenschutz von Costa Brava Rent a Boat.",
      keywords: "datenschutzrichtlinie, datenschutz, dsgvo costa brava rent boat"
    },
    termsConditions: {
      title: "Geschäftsbedingungen | Costa Brava Rent a Boat",
      description: "Geschäftsbedingungen des Bootsverleihs in Blanes, Costa Brava.",
      keywords: "geschäftsbedingungen, bootsverleihs bedingungen, nutzungsregeln boote"
    },
    condicionesGenerales: {
      title: "Allgemeine Mietbedingungen | Costa Brava Rent a Boat",
      description: "Allgemeine Mietbedingungen fur den Bootsverleih in Blanes, Costa Brava. Bedingungen und Verantwortlichkeiten.",
      keywords: "allgemeine mietbedingungen, bedingungen bootsverleih blanes"
    },
    cookiesPolicy: {
      title: "Cookie-Richtlinie | Costa Brava Rent a Boat",
      description: "Informationen zur Cookie-Nutzung auf Costa Brava Rent a Boat.",
      keywords: "cookie-richtlinie, cookies costa brava rent boat, cookie-nutzung, datenschutz navigation"
    },
    accesibilidad: {
      title: "Barrierefreiheitserklarung | Costa Brava Rent a Boat",
      description: "Erklarung zur Barrierefreiheit von Costa Brava Rent a Boat. WCAG 2.1 Konformitat.",
      keywords: "barrierefreiheit web, wcag 2.1, barrierefreiheit costa brava rent boat"
    },
    blog: {
      title: "Navigation und Reiseziele Blog | Costa Brava",
      description: "Anleitungen, Tipps und Reiseziele für Bootsvermietung in Blanes und Costa Brava. Entdecken Sie geheime Buchten, Seerouten und Navigationstipps.",
      keywords: "bootsvermietung blog, navigationsanleitungen costa brava, bootsziele blanes, geheime buchten costa brava, seerouten",
      ogTitle: "Costa Brava Navigations-Blog | Boot-Anleitungen und Reiseziele",
      ogDescription: "Entdecken Sie vollständige Anleitungen, Navigationstipps und die besten Reiseziele der Costa Brava. Geheime Buchten, Routen und Tipps für Ihr Bootsabenteuer."
    },
    gallery: {
      title: "Kundenfotogalerie | Costa Brava Rent a Boat",
      description: "Echte Fotos unserer Kunden auf Bootsausflügen an der Costa Brava ab Blanes. Teilen Sie Ihr nautisches Erlebnis!",
      keywords: "kundenfotos boote blanes, galerie bootsverleih costa brava, bootserlebnisse blanes"
    },
    routes: {
      title: "Bootsrouten ab Blanes | Costa Brava",
      description: "Entdecken Sie die besten Bootsrouten ab Blanes. Von Sa Palomera bis Tossa de Mar. Interaktive Karten und Navigationsführer.",
      keywords: "bootsrouten blanes, bootsausflüge costa brava, nautische routenkarte, tossa de mar boot"
    },
    giftCards: {
      title: "Geschenkkarten Bootsverleih | Costa Brava Rent a Boat",
      description: "Verschenken Sie ein nautisches Erlebnis an der Costa Brava. Geschenkkarten ab 50 € fur Bootsverleih in Blanes. 1 Jahr gultig.",
      keywords: "geschenkkarten boote, geschenk bootsverleih blanes, nautisches erlebnis geschenk, costa brava geschenk"
    },
    pricing: {
      title: `Bootsverleih Preise Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Bootsverleih Preise in Blanes. Ohne Fuhrerschein ab 70\u20ac/h. Kraftstoff inklusive. Neben-, Mittel- und Hochsaison.",
      keywords: "bootsverleih preise costa brava, was kostet boot mieten blanes, bootstarife ohne fuhrerschein"
    },
    locationBarcelona: {
      title: "Bootsverleih nahe Barcelona | Blanes 70min | Costa Brava",
      description: "Boote ohne Fuhrerschein mieten, 70 Minuten von Barcelona. Blanes, Costa Brava. Beste Preise, kristallklares Wasser. Ab 70\u20ac.",
      keywords: "boot mieten nahe barcelona, boote ohne fuhrerschein barcelona, costa brava boote von barcelona"
    },
    locationCostaBrava: {
      title: `Bootsverleih Costa Brava ${SEASON_YEAR} | Ohne F\u00fchrerschein ab 70\u20ac/h | Blanes, Lloret, Tossa`,
      description: "Mieten Sie Boote an der Costa Brava ab Hafen Blanes. 8 Boote ohne F\u00fchrerschein ab 70\u20ac/h, Kraftstoff inklusive. Segeln Sie zu versteckten Buchten zwischen Blanes und Tossa de Mar. Online buchen \u00b7 Kostenlose Umbuchung.",
      keywords: "bootsverleih costa brava, boot mieten costa brava, boote ohne f\u00fchrerschein costa brava, bootsausflug costa brava, bootscharter costa brava"
    },
    boatRentalCostaBrava: {
      title: `Boat Rental Costa Brava | No License from 70\u20ac/h — Blanes, Spain`,
      description: "Rent a boat on the Costa Brava from Blanes port. No license required. 9 boats for 4-12 people. Explore hidden coves, snorkel spots & medieval villages.",
      keywords: "boat rental costa brava, rent a boat costa brava, boat hire spain no license"
    }
  },
  nl: {
    home: {
      title: "Boten Huren Blanes Zonder Vaarbewijs | Haven Blanes vanaf 70\u20ac/u",
      description: "Bootverhuur in Haven Blanes zonder vaarbewijs vanaf 70\u20ac/u. Brandstof inbegrepen. 8 boten beschikbaar. 4.8\u2605 Google (300+ beoordelingen). Online of WhatsApp boeken.",
      keywords: "bootverhuur blanes, boten huren blanes, boten zonder vaarbewijs blanes, haven blanes bootverhuur, bootcharter blanes"
    },
    booking: {
      title: "Boot Reserveren Blanes | Costa Brava Rent a Boat",
      description: "Vul het formulier in om uw boot in Blanes, Costa Brava te reserveren. Boten zonder en met vaarbewijs. Snelle WhatsApp-reactie.",
      keywords: "boot reserveren blanes, reserveringsformulier boot, boot booking costa brava"
    },
    faq: {
      title: "FAQ Bootverhuur Blanes | Costa Brava",
      description: "Los al je twijfels op over bootverhuur in Blanes, Costa Brava. Prijzen, vereisten, wat inbegrepen is, annuleringsbeleid en meer.",
      keywords: "faq bootverhuur, veelgestelde vragen boten, twijfels bootverhuur costa brava"
    },
    locationBlanes: {
      title: `Bootverhuur Blanes Zonder Vaarbewijs ${SEASON_YEAR} | Haven Blanes vanaf 70\u20ac/u`,
      description: "Bootverhuur zonder vaarbewijs in Haven Blanes. Vanaf 70\u20ac/u, brandstof inbegrepen. 8 boten voor max 7 personen. 4.8\u2605 Google (300+ beoordelingen). Online boeken.",
      keywords: "bootverhuur blanes, boot huren blanes, boten zonder vaarbewijs blanes, bootverhuur haven blanes, bootcharter blanes"
    },
    locationLloret: {
      title: "Bootverhuur Lloret de Mar | Vanuit Blanes 70\u20ac/u Brandstof Inbegrepen",
      description: "Bootverhuur Lloret de Mar zonder vaarbewijs vanuit Blanes. Vanaf 70\u20ac/u, brandstof inbegrepen. 4.8\u2605 Google. Ontdek baaien en stranden. Online boeken.",
      keywords: "bootverhuur lloret de mar, lloret bezoeken per boot, lloret excursie vanuit blanes"
    },
    locationTossa: {
      title: "Boten naar Tossa de Mar vanuit Blanes | Costa Brava",
      description: "Bootverhuur voor Tossa de Mar vanuit Haven Blanes. 1u varen naar mooiste middeleeuwse stad Costa Brava. Boten zonder en met vaarbewijs.",
      keywords: "bootverhuur tossa de mar, tossa bezoeken per boot, tossa excursie vanuit blanes, vila vella tossa"
    },
    locationMalgrat: {
      title: "Boothuur bij Malgrat de Mar | Haven Blanes 10 min \u20ac70",
      description: "Op vakantie in Malgrat de Mar? Haven Blanes op 10 min met de auto. Boten zonder vaarbewijs vanaf \u20ac70/uur. Brandstof inbegrepen.",
      keywords: "boothuur malgrat de mar, boten nabij malgrat, boottocht malgrat",
      ogTitle: "Boothuur bij Malgrat de Mar | Vanaf Blanes",
      ogDescription: "Van Malgrat naar Haven Blanes in 10 min. Boten zonder vaarbewijs vanaf \u20ac70. Reserveer nu."
    },
    locationSantaSusanna: {
      title: "Boothuur bij Santa Susanna | Haven Blanes 15 min \u20ac70",
      description: "Vakantie in Santa Susanna? Haven Blanes op 15 min. Boten zonder vaarbewijs vanaf \u20ac70/uur. 8 boten beschikbaar.",
      keywords: "boothuur santa susanna, boten nabij santa susanna, boottocht santa susanna",
      ogTitle: "Boothuur bij Santa Susanna | Vanaf Blanes",
      ogDescription: "Van Santa Susanna naar Haven Blanes in 15 min. Boten zonder vaarbewijs vanaf \u20ac70."
    },
    locationCalella: {
      title: "Boothuur bij Calella | Haven Blanes 20 min vanaf \u20ac70",
      description: "In Calella? Haven Blanes op 20 min met de auto. Boten zonder vaarbewijs vanaf \u20ac70/uur. Brandstof inbegrepen.",
      keywords: "boothuur calella, boten calella maresme, boottocht calella",
      ogTitle: "Boothuur bij Calella | Vanaf Blanes Costa Brava",
      ogDescription: "Van Calella naar Haven Blanes in 20 min. Boten zonder vaarbewijs vanaf \u20ac70."
    },
    categoryLicenseFree: {
      title: "Boten Zonder Vaarbewijs Costa Brava | 5 Boten vanaf 70\u20ac/u Blanes",
      description: "5 boten zonder vaarbewijs in Blanes vanaf 70\u20ac/u. Brandstof inbegrepen, 4-7 personen. Geen ervaring nodig, 15 min instructie. 4.8\u2605 Google (300+ beoordelingen). Online boeken.",
      keywords: "boten zonder vaarbewijs blanes, bootverhuur zonder licentie, boten zonder vergunning costa brava, 15pk boten blanes"
    },
    categoryLicensed: {
      title: "Boten Met Vaarbewijs Costa Brava | Blanes vanaf 150\u20ac/u",
      description: "Vaar naar Lloret (15 min) en Tossa (30 min) vanuit Blanes. 3 boten 80-115PK. Vaarbewijs of met schipper. 4.8\u2605 Google. Boek online.",
      keywords: "boten met vaarbewijs blanes, bootverhuur vaarbewijs, boten met licentie costa brava, krachtige boten costa brava",
      ogTitle: "Boten Met Vaarbewijs in Blanes | Lloret 15 min, Tossa 30 min",
      ogDescription: "3 krachtige boten 80-115PK in Blanes. Met vaarbewijs of met schipper. Boek online."
    },
    testimonios: {
      title: "Klantenbeoordelingen Bootverhuur Blanes",
      description: "Lees echte beoordelingen van klanten die boten hebben gehuurd in Blanes. +100 geverifieerde reviews. Ervaringen Costa Brava.",
      keywords: "beoordelingen bootverhuur blanes, reviews costa brava rent boat, klantervaringen boten"
    },
    privacyPolicy: {
      title: "Privacybeleid | Costa Brava Rent a Boat",
      description: "Privacybeleid en gegevensbescherming van Costa Brava Rent a Boat.",
      keywords: "privacybeleid, gegevensbescherming, avg costa brava rent boat"
    },
    termsConditions: {
      title: "Algemene Voorwaarden | Costa Brava Rent a Boat",
      description: "Algemene voorwaarden van de bootverhuurservice in Blanes, Costa Brava.",
      keywords: "algemene voorwaarden, bootverhuur voorwaarden, gebruiksregels boten"
    },
    condicionesGenerales: {
      title: "Algemene Huurvoorwaarden | Costa Brava Rent a Boat",
      description: "Algemene huurvoorwaarden voor bootverhuur in Blanes, Costa Brava. Voorwaarden en verantwoordelijkheden.",
      keywords: "algemene huurvoorwaarden, voorwaarden bootverhuur blanes"
    },
    cookiesPolicy: {
      title: "Cookiebeleid | Costa Brava Rent a Boat",
      description: "Informatie over het gebruik van cookies op Costa Brava Rent a Boat.",
      keywords: "cookiebeleid, cookies costa brava rent boat, cookie gebruik, privacy navigatie"
    },
    accesibilidad: {
      title: "Toegankelijkheidsverklaring | Costa Brava Rent a Boat",
      description: "Webtoegankelijkheidsverklaring van Costa Brava Rent a Boat. WCAG 2.1 conformiteit.",
      keywords: "webtoegankelijkheid, wcag 2.1, toegankelijkheid costa brava rent boat"
    },
    blog: {
      title: "Navigatie en Bestemmingen Blog | Costa Brava",
      description: "Gidsen, tips en bestemmingen voor bootverhuur in Blanes en Costa Brava. Ontdek geheime baaien, nautische routes en navigatietips.",
      keywords: "bootverhuur blog, navigatiegidsen costa brava, bootbestemmingen blanes, geheime baaien costa brava, nautische routes",
      ogTitle: "Costa Brava Navigatie Blog | Bootgidsen en Bestemmingen",
      ogDescription: "Ontdek volledige gidsen, navigatietips en de beste bestemmingen van Costa Brava. Geheime baaien, routes en tips voor uw bootavontuur."
    },
    gallery: {
      title: "Klantenfotogalerij | Costa Brava Rent a Boat",
      description: "Echte foto's van onze klanten die genieten van boottochten aan de Costa Brava vanuit Blanes. Deel uw nautische ervaring!",
      keywords: "klantenfoto's boten blanes, galerij bootverhuur costa brava, bootervaring blanes"
    },
    routes: {
      title: "Bootroutes vanuit Blanes | Costa Brava",
      description: "Ontdek de beste bootroutes vanuit Blanes. Van Sa Palomera tot Tossa de Mar. Interactieve kaarten en navigatiegids.",
      keywords: "bootroutes blanes, bootexcursies costa brava, nautische routekaart, tossa de mar boot"
    },
    giftCards: {
      title: "Cadeaukaarten Bootverhuur | Costa Brava Rent a Boat",
      description: "Geef een nautische ervaring aan de Costa Brava. Cadeaukaarten vanaf 50 € voor bootverhuur in Blanes. 1 jaar geldig.",
      keywords: "cadeaukaarten boten, cadeau bootverhuur blanes, nautische ervaring cadeau, costa brava cadeau"
    },
    pricing: {
      title: `Bootverhuur Prijzen Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Bekijk bootverhuur prijzen in Blanes. Zonder vaarbewijs vanaf 70\u20ac/u. Brandstof inbegrepen. Laag-, midden- en hoogseizoen.",
      keywords: "bootverhuur prijzen costa brava, hoeveel kost boot huren blanes, boottarieven zonder vaarbewijs"
    },
    locationBarcelona: {
      title: "Bootverhuur nabij Barcelona | Blanes 70min | Costa Brava",
      description: "Huur boten zonder vaarbewijs op 70 minuten van Barcelona. Blanes, Costa Brava. Beste prijzen, kristalhelder water. Vanaf 70\u20ac.",
      keywords: "boot huren nabij barcelona, boten zonder vaarbewijs barcelona, costa brava boten vanuit barcelona"
    },
    locationCostaBrava: {
      title: `Bootverhuur Costa Brava ${SEASON_YEAR} | Zonder Vaarbewijs vanaf 70\u20ac/u | Blanes, Lloret, Tossa`,
      description: "Huur boten aan de Costa Brava vanuit Haven Blanes. 8 boten zonder vaarbewijs vanaf 70\u20ac/u, brandstof inbegrepen. Vaar naar verborgen baaien tussen Blanes en Tossa de Mar. Online boeken \u00b7 Gratis datumwijziging.",
      keywords: "bootverhuur costa brava, boot huren costa brava, boten zonder vaarbewijs costa brava, boottocht costa brava, bootexcursie costa brava"
    },
    boatRentalCostaBrava: {
      title: `Boat Rental Costa Brava | No License from 70\u20ac/h — Blanes, Spain`,
      description: "Rent a boat on the Costa Brava from Blanes port. No license required. 9 boats for 4-12 people. Explore hidden coves, snorkel spots & medieval villages.",
      keywords: "boat rental costa brava, rent a boat costa brava, boat hire spain no license"
    }
  },
  it: {
    home: {
      title: "Noleggio Barche Blanes Senza Patente | Porto di Blanes da 70\u20ac/h",
      description: "Noleggio barche al Porto di Blanes senza patente da 70\u20ac/h. Carburante incluso. 8 barche disponibili. 4.8\u2605 Google (300+ recensioni). Prenota online o WhatsApp.",
      keywords: "noleggio barche blanes, noleggio barche porto blanes, barche senza patente blanes, charter barche blanes, affitto barche blanes"
    },
    booking: {
      title: "Prenota la Tua Barca a Blanes | Costa Brava",
      description: "Prenota la tua barca a Blanes in pochi minuti. Con o senza patente, da 1 ora. Risposta WhatsApp immediata. Inizia la tua avventura!",
      keywords: "prenotare barca blanes, modulo prenotazione barca, prenotazione barca costa brava, noleggio barche online"
    },
    faq: {
      title: "FAQ Noleggio Barche Blanes | Costa Brava",
      description: "Risolvi tutti i tuoi dubbi sul noleggio barche a Blanes, Costa Brava. Prezzi, requisiti, cosa è incluso, politiche di cancellazione e altro.",
      keywords: "faq noleggio barche, domande frequenti barche, dubbi noleggio barche costa brava"
    },
    locationBlanes: {
      title: `Noleggio Barche Blanes Senza Patente ${SEASON_YEAR} | Porto Blanes da 70\u20ac/h`,
      description: "Noleggio barche senza patente al Porto di Blanes. Da 70\u20ac/h, carburante incluso. 8 barche per max 7 persone. 4.8\u2605 Google (300+ recensioni). Prenota online.",
      keywords: "noleggio barche blanes, affitto barche blanes, barche senza patente blanes, noleggio barche porto blanes, charter barche blanes"
    },
    locationLloret: {
      title: "Noleggio Barche Lloret de Mar | Da Blanes 70\u20ac/h Carburante Incluso",
      description: "Noleggio barche Lloret de Mar senza patente da Blanes. Da 70\u20ac/h, carburante incluso. 4.8\u2605 Google. Scopri calette e spiagge. Prenota online.",
      keywords: "noleggio barche lloret de mar, visitare lloret in barca, escursione lloret da blanes"
    },
    locationTossa: {
      title: "Barche verso Tossa de Mar da Blanes | Costa Brava",
      description: "Noleggio barche per Tossa de Mar dal Porto Blanes. 1h di navigazione verso la città medievale più bella. Barche senza e con patente.",
      keywords: "noleggio barche tossa de mar, visitare tossa in barca, escursione tossa da blanes, vila vella tossa"
    },
    locationMalgrat: {
      title: "Noleggio Barche vicino a Malgrat de Mar | Porto Blanes 10 min 70\u20ac",
      description: "In vacanza a Malgrat de Mar? Porto di Blanes a 10 min in auto. Noleggio barche senza patente da 70\u20ac/ora. Benzina inclusa.",
      keywords: "noleggio barche malgrat de mar, barche vicino malgrat, escursione barca malgrat",
      ogTitle: "Noleggio Barche vicino a Malgrat de Mar | Da Blanes",
      ogDescription: "Da Malgrat al Porto di Blanes in 10 min. Barche senza patente da 70\u20ac. Prenota ora."
    },
    locationSantaSusanna: {
      title: "Noleggio Barche vicino a Santa Susanna | Porto Blanes 15 min 70\u20ac",
      description: "Vacanza a Santa Susanna? Porto di Blanes a 15 min. Noleggio barche senza patente da 70\u20ac/ora. 8 barche disponibili.",
      keywords: "noleggio barche santa susanna, barche vicino santa susanna, escursione barca santa susanna",
      ogTitle: "Noleggio Barche vicino a Santa Susanna | Da Blanes",
      ogDescription: "Da Santa Susanna al Porto di Blanes in 15 min. Barche senza patente da 70\u20ac."
    },
    locationCalella: {
      title: "Noleggio Barche vicino a Calella | Porto Blanes 20 min da 70\u20ac",
      description: "A Calella? Porto di Blanes a 20 min in auto. Noleggio barche senza patente da 70\u20ac/ora. Benzina inclusa.",
      keywords: "noleggio barche calella, barche calella maresme, escursione barca calella",
      ogTitle: "Noleggio Barche vicino a Calella | Da Blanes Costa Brava",
      ogDescription: "Da Calella al Porto di Blanes in 20 min. Barche senza patente da 70\u20ac."
    },
    categoryLicenseFree: {
      title: "Barche Senza Patente Costa Brava | 5 Barche da 70\u20ac/h Blanes",
      description: "5 barche senza patente a Blanes da 70\u20ac/h. Carburante incluso, 4-7 persone. Nessuna esperienza, formazione 15 min. 4.8\u2605 Google (300+ recensioni). Prenota online.",
      keywords: "barche senza patente blanes, noleggio barche senza licenza, imbarcazioni senza permesso costa brava, barche 15cv blanes"
    },
    categoryLicensed: {
      title: "Barche Con Patente Costa Brava | Blanes da 150\u20ac/h",
      description: "Naviga a Lloret (15 min) e Tossa (30 min) da Blanes. 3 barche 80-115CV. Patente nautica o con skipper. 4.8\u2605 Google. Prenota online.",
      keywords: "barche con patente blanes, noleggio barche patente nautica, imbarcazioni con licenza costa brava, barche potenti costa brava",
      ogTitle: "Barche Con Patente a Blanes | Lloret 15 min, Tossa 30 min",
      ogDescription: "3 barche potenti 80-115CV a Blanes. Con patente nautica o con skipper. Prenota online."
    },
    testimonios: {
      title: "Recensioni Clienti Noleggio Barche Blanes",
      description: "Leggi le recensioni reali dei clienti che hanno noleggiato barche a Blanes. +100 recensioni verificate. Esperienze Costa Brava.",
      keywords: "recensioni noleggio barche blanes, reviews costa brava rent boat, testimonianze clienti barche"
    },
    privacyPolicy: {
      title: "Politica sulla Privacy | Costa Brava Rent a Boat",
      description: "Politica sulla privacy e protezione dei dati di Costa Brava Rent a Boat.",
      keywords: "politica privacy, protezione dati, gdpr costa brava rent boat"
    },
    termsConditions: {
      title: "Termini e Condizioni | Costa Brava Rent a Boat",
      description: "Termini e condizioni del servizio di noleggio barche a Blanes, Costa Brava.",
      keywords: "termini condizioni, condizioni noleggio barche, regole uso barche"
    },
    condicionesGenerales: {
      title: "Condizioni Generali di Noleggio | Costa Brava Rent a Boat",
      description: "Condizioni generali per il noleggio di imbarcazioni a Blanes, Costa Brava. Termini e responsabilita.",
      keywords: "condizioni generali noleggio, termini noleggio barche blanes"
    },
    cookiesPolicy: {
      title: "Politica sui Cookie | Costa Brava Rent a Boat",
      description: "Informazioni sull'uso dei cookie su Costa Brava Rent a Boat.",
      keywords: "politica cookie, cookies costa brava rent boat, uso cookie, privacy navigazione"
    },
    accesibilidad: {
      title: "Dichiarazione di Accessibilita | Costa Brava Rent a Boat",
      description: "Dichiarazione di accessibilita web di Costa Brava Rent a Boat. Conformita WCAG 2.1.",
      keywords: "accessibilita web, wcag 2.1, accessibilita costa brava rent boat"
    },
    blog: {
      title: "Blog di Navigazione e Destinazioni | Costa Brava",
      description: "Guide, consigli e destinazioni per noleggio barche a Blanes e Costa Brava. Scopri calette segrete, rotte nautiche e consigli di navigazione.",
      keywords: "blog noleggio barche, guide navigazione costa brava, destinazioni barca blanes, calette segrete costa brava, rotte nautiche",
      ogTitle: "Blog di Navigazione Costa Brava | Guide e Destinazioni in Barca",
      ogDescription: "Scopri guide complete, consigli di navigazione e le migliori destinazioni della Costa Brava. Calette segrete, rotte e consigli per la tua avventura in barca."
    },
    gallery: {
      title: "Galleria Fotografica Clienti | Costa Brava Rent a Boat",
      description: "Foto reali dei nostri clienti che si godono gite in barca sulla Costa Brava da Blanes. Condividi la tua esperienza nautica!",
      keywords: "foto clienti barche blanes, galleria noleggio barche costa brava, esperienze barca blanes"
    },
    routes: {
      title: "Percorsi in Barca da Blanes | Costa Brava",
      description: "Scopri i migliori percorsi in barca da Blanes. Da Sa Palomera a Tossa de Mar. Mappe interattive e guida alla navigazione.",
      keywords: "percorsi barca blanes, escursioni barca costa brava, mappa rotte nautiche, tossa de mar barca"
    },
    giftCards: {
      title: "Carte Regalo Noleggio Barche | Costa Brava Rent a Boat",
      description: "Regala un'esperienza nautica sulla Costa Brava. Carte regalo da 50 € per noleggio barche a Blanes. Valide 1 anno.",
      keywords: "carte regalo barche, regalo noleggio barca blanes, esperienza nautica regalo, costa brava regalo"
    },
    pricing: {
      title: `Prezzi Noleggio Barche Blanes ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Consulta i prezzi di noleggio barche a Blanes. Senza patente da 70\u20ac/h. Carburante incluso. Bassa, media e alta stagione.",
      keywords: "prezzi noleggio barche costa brava, quanto costa noleggiare barca blanes, tariffe barca senza patente"
    },
    locationBarcelona: {
      title: "Noleggio Barche vicino a Barcellona | Blanes a 70min | Costa Brava",
      description: "Noleggia barche senza patente a 70 minuti da Barcellona. Blanes, Costa Brava. Migliori prezzi, acque cristalline. Da 70\u20ac.",
      keywords: "noleggio barca senza patente barcellona, noleggio barche vicino barcellona, barche costa brava da barcellona"
    },
    locationCostaBrava: {
      title: `Noleggio Barche Costa Brava ${SEASON_YEAR} | Senza Patente da 70\u20ac/h | Blanes, Lloret, Tossa`,
      description: "Noleggia barche sulla Costa Brava dal Porto di Blanes. 8 barche senza patente da 70\u20ac/h, carburante incluso. Naviga verso calette nascoste tra Blanes e Tossa de Mar. Prenota online \u00b7 Cambio data gratuito.",
      keywords: "noleggio barche costa brava, affitto barche costa brava, barche senza patente costa brava, escursione barca costa brava, noleggio imbarcazioni costa brava"
    },
    boatRentalCostaBrava: {
      title: `Boat Rental Costa Brava | No License from 70\u20ac/h — Blanes, Spain`,
      description: "Rent a boat on the Costa Brava from Blanes port. No license required. 9 boats for 4-12 people. Explore hidden coves, snorkel spots & medieval villages.",
      keywords: "boat rental costa brava, rent a boat costa brava, boat hire spain no license"
    }
  },
  ru: {
    home: {
      title: "\u0410\u0440\u0435\u043d\u0434\u0430 \u041b\u043e\u0434\u043e\u043a \u0411\u043b\u0430\u043d\u0435\u0441 \u0411\u0435\u0437 \u041b\u0438\u0446\u0435\u043d\u0437\u0438\u0438 | \u041f\u043e\u0440\u0442 \u0411\u043b\u0430\u043d\u0435\u0441 \u043e\u0442 70\u20ac/\u0447",
      description: "Аренда лодок в порту Бланес без лицензии от 70\u20ac/ч. Топливо включено. 8 лодок. 4.8\u2605 Google (300+ отзывов). Бронируйте онлайн или WhatsApp.",
      keywords: "аренда лодок бланес, лодки без лицензии бланес, порт бланес аренда лодок, чартер лодок бланес, прокат лодок бланес"
    },
    booking: {
      title: "Забронировать Лодку в Бланесе | Коста-Брава",
      description: "Забронируйте лодку в Бланесе за минуты. С лицензией или без, от 1 часа. Мгновенный ответ в WhatsApp. Начните приключение\!",
      keywords: "забронировать лодку бланес, форма бронирования лодки, бронирование лодки коста брава, аренда лодок онлайн"
    },
    faq: {
      title: "FAQ Аренда Лодок Бланес | Коста-Брава",
      description: "Решите все ваши сомнения по аренде лодок в Бланесе, Коста-Брава. Цены, требования, что включено, политика отмены и многое другое.",
      keywords: "faq аренда лодок, часто задаваемые вопросы лодки, сомнения аренда лодок коста брава"
    },
    locationBlanes: {
      title: `Аренда Лодок Бланес Без Лицензии ${SEASON_YEAR} | Порт Бланес от 70\u20ac/ч`,
      description: "Аренда лодок без лицензии в порту Бланес. От 70\u20ac/ч, топливо включено. 8 лодок для 7 человек. 4.8\u2605 Google (300+ отзывов). Бронируйте онлайн.",
      keywords: "аренда лодок бланес, арендовать лодку бланес, лодки без лицензии бланес, аренда лодок порт бланес, прокат лодок бланес"
    },
    locationLloret: {
      title: "Аренда Лодок Льорет-де-Мар | Из Бланеса 70\u20ac/ч Топливо Включено",
      description: "Аренда лодок Льорет-де-Мар без лицензии из Бланеса. От 70\u20ac/ч, топливо включено. 4.8\u2605 Google. Бухты и пляжи Льорета. Бронируйте онлайн.",
      keywords: "аренда лодок льорет де мар, посетить льорет на лодке, экскурсия льорет из бланеса"
    },
    locationTossa: {
      title: "Лодки в Тосса-де-Мар из Бланеса | Коста-Брава",
      description: "Аренда лодок для посещения Тосса-де-Мар из Порта Бланес. 1 час плавания к самому красивому средневековому городу Коста-Брава. Лодки без лицензии и с лицензией.",
      keywords: "аренда лодок тосса де мар, посетить тосса на лодке, экскурсия тосса из бланеса, вила велла тосса"
    },
    locationMalgrat: {
      title: "Аренда лодок рядом с Малграт-де-Мар | Порт Бланес 10 мин 70\u20ac",
      description: "Отдыхаете в Малграт-де-Мар? Порт Бланеса в 10 мин на машине. Аренда лодок без прав от 70\u20ac/час. Бензин включён.",
      keywords: "аренда лодок малграт де мар, лодки рядом малграт, прогулка на лодке малграт",
      ogTitle: "Аренда лодок рядом с Малграт-де-Мар | Из Бланеса",
      ogDescription: "Из Малграта в порт Бланеса за 10 мин. Лодки без прав от 70\u20ac. Забронируйте сейчас."
    },
    locationSantaSusanna: {
      title: "Аренда лодок рядом с Санта-Сусанна | Порт Бланес 15 мин 70\u20ac",
      description: "Отпуск в Санта-Сусанне? Порт Бланеса в 15 мин. Аренда лодок без прав от 70\u20ac/час. 8 лодок в наличии.",
      keywords: "аренда лодок санта сусанна, лодки рядом санта сусанна, прогулка лодке санта сусанна",
      ogTitle: "Аренда лодок рядом с Санта-Сусанна | Из Бланеса",
      ogDescription: "Из Санта-Сусанны в порт Бланеса за 15 мин. Лодки без прав от 70\u20ac."
    },
    locationCalella: {
      title: "Аренда лодок рядом с Калелья | Порт Бланес 20 мин от 70\u20ac",
      description: "В Калелье? Порт Бланеса в 20 мин на машине. Аренда лодок без прав от 70\u20ac/час. Бензин включён.",
      keywords: "аренда лодок калелья, лодки калелья маресме, прогулка лодке калелья",
      ogTitle: "Аренда лодок рядом с Калелья | Из Бланеса Коста-Брава",
      ogDescription: "Из Калельи в порт Бланеса за 20 мин. Лодки без прав от 70\u20ac."
    },
    categoryLicenseFree: {
      title: "Лодки Без Лицензии Коста-Брава | 5 Лодок от 70\u20ac/ч Бланес",
      description: "5 лодок без лицензии в Бланесе от 70\u20ac/ч. Топливо включено, 4-7 человек. Без опыта, обучение 15 мин. 4.8\u2605 Google (300+ отзывов). Бронируйте онлайн.",
      keywords: "лодки без лицензии бланес, аренда лодок без прав, лодки без разрешения коста брава, лодки 15лс бланес"
    },
    categoryLicensed: {
      title: "\u041b\u043e\u0434\u043a\u0438 \u0421 \u041b\u0438\u0446\u0435\u043d\u0437\u0438\u0435\u0439 \u041a\u043e\u0441\u0442\u0430-\u0411\u0440\u0430\u0432\u0430 | \u0411\u043b\u0430\u043d\u0435\u0441 \u043e\u0442 150\u20ac/\u0447",
      description: "\u041f\u043b\u0430\u0432\u0430\u0439\u0442\u0435 \u0432 \u041b\u044c\u043e\u0440\u0435\u0442 (15 \u043c\u0438\u043d) \u0438 \u0422\u043e\u0441\u0441\u0430 (30 \u043c\u0438\u043d) \u0438\u0437 \u0411\u043b\u0430\u043d\u0435\u0441\u0430. 3 \u043b\u043e\u0434\u043a\u0438 80-115 \u043b.\u0441. \u0421 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0435\u0439 \u0438\u043b\u0438 \u0448\u043a\u0438\u043f\u0435\u0440\u043e\u043c. 4.8\u2605 Google. \u0411\u0440\u043e\u043d\u0438\u0440\u0443\u0439\u0442\u0435 \u043e\u043d\u043b\u0430\u0439\u043d.",
      keywords: "\u043b\u043e\u0434\u043a\u0438 \u0441 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0435\u0439 \u0431\u043b\u0430\u043d\u0435\u0441, \u0430\u0440\u0435\u043d\u0434\u0430 \u043b\u043e\u0434\u043e\u043a \u0441 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0435\u0439, \u043c\u043e\u0449\u043d\u044b\u0435 \u043b\u043e\u0434\u043a\u0438 \u043a\u043e\u0441\u0442\u0430 \u0431\u0440\u0430\u0432\u0430",
      ogTitle: "\u041b\u043e\u0434\u043a\u0438 \u0421 \u041b\u0438\u0446\u0435\u043d\u0437\u0438\u0435\u0439 \u0432 \u0411\u043b\u0430\u043d\u0435\u0441\u0435 | \u041b\u044c\u043e\u0440\u0435\u0442 15 \u043c\u0438\u043d, \u0422\u043e\u0441\u0441\u0430 30 \u043c\u0438\u043d",
      ogDescription: "3 \u043c\u043e\u0449\u043d\u044b\u0435 \u043b\u043e\u0434\u043a\u0438 80-115 \u043b.\u0441. \u0432 \u0411\u043b\u0430\u043d\u0435\u0441\u0435. \u0421 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0435\u0439 \u0438\u043b\u0438 \u0448\u043a\u0438\u043f\u0435\u0440\u043e\u043c. \u0411\u0440\u043e\u043d\u0438\u0440\u0443\u0439\u0442\u0435 \u043e\u043d\u043b\u0430\u0439\u043d."
    },
    testimonios: {
      title: "Отзывы Клиентов Аренда Лодок Бланес",
      description: "Читайте реальные отзывы клиентов, арендовавших лодки в Бланесе. +100 проверенных отзывов. Впечатления от Коста-Бравы.",
      keywords: "отзывы аренда лодок бланес, отзывы costa brava rent boat, впечатления клиентов лодки"
    },
    privacyPolicy: {
      title: "Политика конфиденциальности | Costa Brava Rent a Boat",
      description: "Политика конфиденциальности и защита данных Costa Brava Rent a Boat.",
      keywords: "политика конфиденциальности, защита данных, gdpr costa brava rent boat"
    },
    termsConditions: {
      title: "Условия использования | Costa Brava Rent a Boat",
      description: "Условия использования службы аренды лодок в Бланесе, Коста-Брава.",
      keywords: "условия использования, условия аренды лодок, правила использования лодок"
    },
    condicionesGenerales: {
      title: "Общие Условия Аренды | Costa Brava Rent a Boat",
      description: "Общие условия аренды лодок в Бланесе, Коста-Брава. Условия и ответственность.",
      keywords: "общие условия аренды, условия аренда лодок бланес"
    },
    cookiesPolicy: {
      title: "Политика Cookies | Costa Brava Rent a Boat",
      description: "Информация об использовании cookies на Costa Brava Rent a Boat.",
      keywords: "политика cookies, cookies costa brava rent boat, использование cookies, конфиденциальность"
    },
    accesibilidad: {
      title: "Заявление о Доступности | Costa Brava Rent a Boat",
      description: "Заявление о веб-доступности Costa Brava Rent a Boat. Соответствие WCAG 2.1.",
      keywords: "веб-доступность, wcag 2.1, доступность costa brava rent boat"
    },
    blog: {
      title: "Блог о Навигации и Направлениях | Costa Brava",
      description: "Руководства, советы и направления для аренды лодок в Бланесе и Коста-Брава. Откройте секретные бухты, морские маршруты и советы по навигации.",
      keywords: "блог аренда лодок, гиды навигация коста брава, направления лодка бланес, секретные бухты коста брава, морские маршруты",
      ogTitle: "Блог Навигации Коста-Брава | Гиды и Направления на Лодке",
      ogDescription: "Откройте полные гиды, советы по навигации и лучшие направления Коста-Бравы. Секретные бухты, маршруты и советы для вашего приключения на лодке."
    },
    gallery: {
      title: "Фотогалерея Клиентов | Costa Brava Rent a Boat",
      description: "Реальные фото наших клиентов на лодочных прогулках по Коста-Браве из Бланеса. Поделитесь своим морским опытом!",
      keywords: "фото клиентов лодки бланес, галерея аренда лодок коста брава, впечатления лодка бланес"
    },
    routes: {
      title: "Маршруты на Лодке из Бланеса | Коста-Брава",
      description: "Откройте лучшие маршруты на лодке из Бланеса. От Са Паломера до Тосса-де-Мар. Интерактивные карты и навигационный гид.",
      keywords: "маршруты лодка бланес, экскурсии лодка коста брава, карта морских маршрутов, тосса де мар лодка"
    },
    giftCards: {
      title: "Подарочные Карты Аренда Лодок | Costa Brava Rent a Boat",
      description: "Подарите морской опыт на Коста-Браве. Подарочные карты от 50 € на аренду лодок в Бланесе. Действительны 1 год.",
      keywords: "подарочные карты лодки, подарок аренда лодки бланес, морской опыт подарок, коста брава подарок"
    },
    pricing: {
      title: `Цены Аренда Лодок Бланес ${SEASON_YEAR} | Costa Brava Rent a Boat`,
      description: "Узнайте цены аренды лодок в Бланесе. Без лицензии от 70\u20ac/ч. Топливо включено. Низкий, средний и высокий сезон.",
      keywords: "цены аренда лодок коста брава, сколько стоит арендовать лодку бланес, тарифы лодка без лицензии"
    },
    locationBarcelona: {
      title: "Аренда Лодок рядом с Барселоной | Бланес 70мин | Коста-Брава",
      description: "Арендуйте лодки без лицензии в 70 минутах от Барселоны. Бланес, Коста-Брава. Лучшие цены, кристально чистая вода. От 70\u20ac.",
      keywords: "аренда лодки без лицензии барселона, аренда лодок рядом барселона, лодки коста брава из барселоны"
    },
    locationCostaBrava: {
      title: `Аренда Лодок Коста-Брава ${SEASON_YEAR} | Без Лицензии от 70\u20ac/ч | Бланес, Льорет, Тосса`,
      description: "Арендуйте лодки на Коста-Браве из порта Бланес. 8 лодок без лицензии от 70\u20ac/ч, топливо включено. Плавайте к скрытым бухтам между Бланесом и Тосса-де-Мар. Бронируйте онлайн \u00b7 Бесплатное изменение даты.",
      keywords: "аренда лодок коста брава, арендовать лодку коста брава, лодки без лицензии коста брава, экскурсия на лодке коста брава, прокат лодок коста брава"
    },
    boatRentalCostaBrava: {
      title: `Boat Rental Costa Brava | No License from 70\u20ac/h — Blanes, Spain`,
      description: "Rent a boat on the Costa Brava from Blanes port. No license required. 9 boats for 4-12 people. Explore hidden coves, snorkel spots & medieval villages.",
      keywords: "boat rental costa brava, rent a boat costa brava, boat hire spain no license"
    }
  }
};

// HREFLANG_CODES imported from @shared/seoConstants

// Alias map for legacy page names that differ from i18n-routes PageKey
const PAGE_NAME_ALIASES: Record<string, PageKey> = {
  testimonios: "testimonials",
  boatRentalBlanes: "locationBlanes",
  boatRentalCostaBrava: "locationCostaBrava",
  excursionDetail: "boatDetail",
  notFound: "home",
};

// Resolve a page name string to a valid PageKey (handles legacy aliases)
const resolvePageKey = (pageName: string): PageKey => {
  if (pageName in PAGE_NAME_ALIASES) {
    return PAGE_NAME_ALIASES[pageName];
  }
  return pageName as PageKey;
};

// Generate hreflang links for a page using subdirectory URLs
// e.g. /fr/location-bateau-blanes instead of /alquiler-barcos-blanes?lang=fr
export const generateHreflangLinks = (pageName: string, params?: string): Array<{ lang: string; url: string }> => {
  const languages: Language[] = ['es', 'en', 'ca', 'fr', 'de', 'nl', 'it', 'ru'];
  const pageKey = resolvePageKey(pageName);

  const hreflangLinks = languages.map(lang => {
    const path = getLocalizedPath(pageKey, lang, params ? { slug: params } : undefined);
    return {
      lang: HREFLANG_CODES[lang],
      url: `${BASE_DOMAIN}${path}`,
    };
  });

  // x-default points to the Spanish version
  const esPath = getLocalizedPath(pageKey, 'es', params ? { slug: params } : undefined);
  hreflangLinks.push({
    lang: 'x-default',
    url: `${BASE_DOMAIN}${esPath}`,
  });

  return hreflangLinks;
};

// Generate canonical URL for a page using subdirectory URLs
// Each language now gets its own canonical (e.g. /fr/location-bateau-blanes)
export const generateCanonicalUrl = (pageName: string, language: Language = 'es', params?: string): string => {
  const pageKey = resolvePageKey(pageName);
  const path = getLocalizedPath(pageKey, language, params ? { slug: params } : undefined);
  return `${BASE_DOMAIN}${path}`;
};

// Get SEO config for a page and language with dynamic content replacement
export const getSEOConfig = (pageName: string, language: Language, dynamicData?: Record<string, string>): SEOConfig => {
  const config = SEO_CONFIGS[language]?.[pageName] || SEO_CONFIGS['es'][pageName] || SEO_CONFIGS['es']['home'];
  
  // Replace dynamic placeholders if provided
  if (dynamicData && Object.keys(dynamicData).length > 0) {
    return {
      title: replacePlaceholders(config.title, dynamicData),
      description: replacePlaceholders(config.description, dynamicData),
      keywords: config.keywords ? replacePlaceholders(config.keywords, dynamicData) : config.keywords
    };
  }
  
  return config;
};

// Helper function to replace placeholders in strings
const replacePlaceholders = (text: string, data: Record<string, string>): string => {
  let result = text;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
};

// Generate LocalBusiness JSON-LD schema
export function generateLocalBusinessSchema(language: Language = 'es', rating?: number, reviewCount?: number) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : BUSINESS_INFO.url;
  
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#organization`,
    "name": BUSINESS_INFO.name,
    "legalName": BUSINESS_INFO.legalName,
    "description": BUSINESS_INFO.description,
    "url": baseUrl,
    "telephone": BUSINESS_INFO.phone,
    "email": BUSINESS_INFO.email,
    "priceRange": BUSINESS_INFO.priceRange,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": BUSINESS_INFO.address.streetAddress,
      "addressLocality": BUSINESS_INFO.address.addressLocality,
      "addressRegion": BUSINESS_INFO.address.addressRegion,
      "postalCode": BUSINESS_INFO.address.postalCode,
      "addressCountry": BUSINESS_INFO.address.addressCountry
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": BUSINESS_INFO.geo.latitude,
      "longitude": BUSINESS_INFO.geo.longitude
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "09:00",
      "closes": "20:00",
      "validFrom": "2026-04-01",
      "validThrough": "2026-10-31"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Alquiler de Barcos",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Alquiler de barcos sin licencia",
            "description": "Embarcaciones hasta 15 CV que no requieren titulación náutica. Gasolina incluida."
          },
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "70",
            "priceCurrency": "EUR",
            "unitText": "hora",
            "description": "Precio desde (temporada baja)"
          },
          "availability": "https://schema.org/SeasonalAvailability",
          "validFrom": "2026-04-01",
          "validThrough": "2026-10-31"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Alquiler de barcos con licencia",
            "description": "Embarcaciones potentes 80-115CV que requieren titulación náutica oficial"
          },
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "150",
            "priceCurrency": "EUR",
            "unitText": "hora",
            "description": "Precio desde (temporada baja)"
          },
          "availability": "https://schema.org/SeasonalAvailability",
          "validFrom": "2026-04-01",
          "validThrough": "2026-10-31"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Excursión privada con capitán",
            "description": "Excursión guiada por la Costa Brava con patrón profesional"
          },
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "200",
            "priceCurrency": "EUR",
            "unitText": "hora",
            "description": "Precio desde"
          },
          "availability": "https://schema.org/SeasonalAvailability",
          "validFrom": "2026-04-01",
          "validThrough": "2026-10-31"
        }
      ]
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Blanes",
        "sameAs": "https://en.wikipedia.org/wiki/Blanes"
      },
      {
        "@type": "City",
        "name": "Lloret de Mar",
        "sameAs": "https://en.wikipedia.org/wiki/Lloret_de_Mar"
      },
      {
        "@type": "City",
        "name": "Tossa de Mar",
        "sameAs": "https://en.wikipedia.org/wiki/Tossa_de_Mar"
      },
      {
        "@type": "AdministrativeArea",
        "name": "Costa Brava",
        "sameAs": "https://en.wikipedia.org/wiki/Costa_Brava"
      },
      {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": BUSINESS_INFO.geo.latitude,
          "longitude": BUSINESS_INFO.geo.longitude
        },
        "geoRadius": "50000"
      }
    ],
    "serviceType": ["Boat Rental", "Maritime Tourism", "Water Sports", "Boat Excursions", "Snorkeling"],
    "additionalType": [
      "https://schema.org/TouristInformationCenter",
      "https://schema.org/SportsActivityLocation"
    ],
    "knowsAbout": [
      "Costa Brava",
      "Blanes",
      "Boat Rental",
      "Boat Navigation",
      "Maritime Safety",
      "License-Free Boating",
      "Lloret de Mar",
      "Tossa de Mar",
      "Mediterranean Sea",
      "Nautical Tourism",
      "Costa Brava Coves",
      "Water Sports",
      "Snorkeling Costa Brava",
      "Boat Rental Without License Spain",
      "Puerto de Blanes",
      "Cala Brava",
      "Cala Sant Francesc",
      "Vila Vella Tossa",
      "Girona Province Tourism",
      "Catalan Coast"
    ],
    "knowsLanguage": ["es", "en", "ca", "fr", "de", "nl", "it", "ru"],
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "value": 6
    },
    "foundingDate": "2019",
    "currenciesAccepted": "EUR",
    "paymentAccepted": "Cash, Credit Card, Bizum, Bank Transfer",
    "slogan": "Explora la Costa Brava desde el agua",
    "award": "4.8 stars on Google Maps - 300+ reviews",
    "hasMap": "https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5",
    "sameAs": [
      "https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5",
      "https://www.instagram.com/costabravarentaboat/",
      "https://www.facebook.com/costabravarentaboat",
      "https://www.tiktok.com/@costabravarentaboat",
    ]
  };

  // Add aggregate rating if provided
  if (rating && reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": rating.toString(),
      "reviewCount": reviewCount.toString(),
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  return schema;
}

// Generate Service JSON-LD schema
export function generateServiceSchema(language: Language = 'es') {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : BUSINESS_INFO.url;
  
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${baseUrl}/#service`,
    "name": "Alquiler de Barcos en Costa Brava",
    "description": "Servicio de alquiler de embarcaciones sin licencia y con licencia en Blanes, Costa Brava. Desde 1 hora hasta jornada completa.",
    "provider": {
      "@type": "LocalBusiness",
      "@id": `${baseUrl}/#organization`
    },
    "areaServed": {
      "@type": "State",
      "name": "Cataluña"
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "availableLanguage": ["Spanish", "Catalan", "English", "French", "German", "Dutch", "Italian", "Russian"],
      "servicePhone": BUSINESS_INFO.phone,
      "serviceUrl": baseUrl
    },
    "category": "Transportation",
    "serviceType": "Boat Rental",
    "hoursAvailable": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "09:00",
      "closes": "20:00",
      "validFrom": "2026-04-01",
      "validThrough": "2026-10-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "307",
      "bestRating": "5",
      "worstRating": "1"
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "70",
      "highPrice": "350",
      "priceCurrency": "EUR",
      "offerCount": "8",
      "availability": "https://schema.org/InStock"
    },
    "serviceOutput": {
      "@type": "Thing",
      "name": "Experiencia náutica en Costa Brava"
    }
  };
}

// Generate BreadcrumbList JSON-LD schema  
export function generateBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : BUSINESS_INFO.url;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`
    }))
  };
}

// Generate enhanced Product JSON-LD schema for boats
interface BoatProductData {
  id: string;
  name: string;
  description: string | null;
  brand?: string;
  year?: number;
  capacity: number;
  power: string | number;
  pricePerHour?: number | string;
  image?: string;
  imageGallery?: string[];
  pricing?: Record<string, { period: string; prices: Record<string, number> }>;
  requiresLicense?: boolean;
}

export function generateEnhancedProductSchema(boatData: BoatProductData, language: Language = 'es') {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : BUSINESS_INFO.url;
  const currentYear = new Date().getFullYear();
  
  // Helper to parse season period and generate dates
  const parseSeasonDates = (period: string, seasonName: string) => {
    const months: { [key: string]: number } = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
      'cierre': 9 // Map "Cierre" to October (end of season)
    };
    
    const periodLower = period.toLowerCase().trim();
    
    // Handle single month (e.g., "Julio", "Agosto")
    if (months[periodLower] !== undefined) {
      const monthNum = months[periodLower];
      return {
        validFrom: new Date(currentYear, monthNum, 1).toISOString().split('T')[0],
        validThrough: new Date(currentYear, monthNum + 1, 0).toISOString().split('T')[0]
      };
    }
    
    // Handle comma-separated ranges (e.g., "Abril-Junio, Septiembre-Cierre")
    const segments = periodLower.split(',').map(s => s.trim());
    let earliestStart: Date | null = null;
    let latestEnd: Date | null = null;
    
    for (const segment of segments) {
      const parts = segment.split('-').map(p => p.trim());
      
      if (parts.length === 2) {
        const startMonth = months[parts[0]];
        const endMonth = months[parts[1]];
        
        if (startMonth !== undefined && endMonth !== undefined) {
          const segmentStart = new Date(currentYear, startMonth, 1);
          const segmentEnd = new Date(currentYear, endMonth + 1, 0);
          
          if (!earliestStart || segmentStart < earliestStart) {
            earliestStart = segmentStart;
          }
          if (!latestEnd || segmentEnd > latestEnd) {
            latestEnd = segmentEnd;
          }
        }
      } else if (parts.length === 1 && months[parts[0]] !== undefined) {
        // Single month in segment
        const monthNum = months[parts[0]];
        const segmentStart = new Date(currentYear, monthNum, 1);
        const segmentEnd = new Date(currentYear, monthNum + 1, 0);
        
        if (!earliestStart || segmentStart < earliestStart) {
          earliestStart = segmentStart;
        }
        if (!latestEnd || segmentEnd > latestEnd) {
          latestEnd = segmentEnd;
        }
      }
    }
    
    // If we successfully parsed segments, return the range
    if (earliestStart && latestEnd) {
      return {
        validFrom: earliestStart.toISOString().split('T')[0],
        validThrough: latestEnd.toISOString().split('T')[0]
      };
    }
    
    // Fallback dates based on season name (only if parsing completely failed)
    if (seasonName === 'BAJA') {
      return {
        validFrom: `${currentYear}-04-01`,
        validThrough: `${currentYear}-06-30`
      };
    } else if (seasonName === 'MEDIA') {
      return {
        validFrom: `${currentYear}-07-01`,
        validThrough: `${currentYear}-07-31`
      };
    } else { // ALTA
      return {
        validFrom: `${currentYear}-08-01`,
        validThrough: `${currentYear}-08-31`
      };
    }
  };

  const baseSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${baseUrl}/barco/${boatData.id}`,
    "name": boatData.name,
    "description": boatData.description,
    "brand": {
      "@type": "Brand",
      "name": boatData.brand || "Costa Brava Rent a Boat"
    },
    "category": "Boat Rental",
    "additionalType": "https://schema.org/Vehicle",
    "vehicleModelDate": boatData.year || currentYear,
    "vehicleSeatingCapacity": boatData.capacity,
    "vehicleEngine": {
      "@type": "EngineSpecification",
      "enginePower": {
        "@type": "QuantitativeValue",
        "value": boatData.power,
        "unitText": "CV"
      }
    },
    "manufacturer": {
      "@type": "Organization",
      "name": boatData.brand || "Various"
    },
    "itemCondition": "https://schema.org/UsedCondition",
    "isAccessibleForFree": false,
    "requiresSubscription": false,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": "307",
      "reviewCount": "307"
    }
  };

  // Enhanced Offers with seasonal pricing
  if (boatData.pricing) {
    const offers: Record<string, unknown>[] = [];
    
    // Generate offer for each season
    ['BAJA', 'MEDIA', 'ALTA'].forEach((season) => {
      const seasonData = boatData.pricing![season as keyof typeof boatData.pricing];
      if (seasonData && seasonData.prices) {
        const prices = Object.values(seasonData.prices).filter((p): p is number => typeof p === 'number' && p > 0);
        if (prices.length > 0) {
          const dates = parseSeasonDates(seasonData.period, season);
          
          offers.push({
            "@type": "Offer",
            "name": `Temporada ${season}`,
            "url": `${baseUrl}/barco/${boatData.id}`,
            "priceCurrency": "EUR",
            "price": Math.min(...prices).toString(),
            "lowPrice": Math.min(...prices).toString(),
            "highPrice": Math.max(...prices).toString(),
            "priceValidUntil": dates.validThrough,
            "validFrom": dates.validFrom,
            "validThrough": dates.validThrough,
            "availability": "https://schema.org/InStock",
            "eligibleRegion": {
              "@type": "Place",
              "name": "Costa Brava, Girona, España",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Blanes",
                "addressRegion": "Girona",
                "addressCountry": "ES"
              }
            },
            "seller": {
              "@type": "LocalBusiness",
              "@id": `${baseUrl}/#organization`
            },
            "offeredBy": {
              "@type": "LocalBusiness",
              "@id": `${baseUrl}/#organization`
            }
          });
        }
      }
    });

    // Use AggregateOffer if multiple seasons, or single Offer
    if (offers.length > 1) {
      const allPrices = offers.flatMap(o => [parseFloat(o.lowPrice as string), parseFloat(o.highPrice as string)]);
      baseSchema.offers = {
        "@type": "AggregateOffer",
        "priceCurrency": "EUR",
        "lowPrice": Math.min(...allPrices).toString(),
        "highPrice": Math.max(...allPrices).toString(),
        "offerCount": offers.length.toString(),
        "offers": offers,
        "availability": "https://schema.org/InStock",
        "url": `${baseUrl}/barco/${boatData.id}`,
        "seller": {
          "@type": "LocalBusiness",
          "@id": `${baseUrl}/#organization`
        }
      };
    } else if (offers.length === 1) {
      baseSchema.offers = offers[0];
    } else {
      // Fallback to simple offer
      baseSchema.offers = {
        "@type": "Offer",
        "url": `${baseUrl}/barco/${boatData.id}`,
        "priceCurrency": "EUR",
        "price": boatData.pricePerHour || "70",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "LocalBusiness",
          "@id": `${baseUrl}/#organization`
        }
      };
    }
  } else {
    // Fallback when no pricing data
    baseSchema.offers = {
      "@type": "Offer",
      "url": `${baseUrl}/barco/${boatData.id}`,
      "priceCurrency": "EUR",
      "price": boatData.pricePerHour || "70",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": boatData.pricePerHour || "70",
        "priceCurrency": "EUR",
        "unitText": "hour"
      },
      "availability": "https://schema.org/InStock",
      "validFrom": `${currentYear}-04-01`,
      "validThrough": `${currentYear}-10-31`,
      "seller": {
        "@type": "LocalBusiness",
        "@id": `${baseUrl}/#organization`
      },
      "offeredBy": {
        "@type": "LocalBusiness",
        "@id": `${baseUrl}/#organization`
      }
    };
  }

  return baseSchema;
}

// Generate WebSite + SearchAction schema for sitelinks search box in AI results
export function generateWebSiteSchema() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : BUSINESS_INFO.url;

  return {
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "name": BUSINESS_INFO.name,
    "url": baseUrl,
    "inLanguage": ["es-ES", "en-GB", "ca-ES", "fr-FR", "de-DE", "nl-NL", "it-IT", "ru-RU"],
    "publisher": {
      "@type": "LocalBusiness",
      "@id": `${baseUrl}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

// Generate Speakable schema for AI voice assistants and AI Overviews
export function generateSpeakableSchema(cssSelectors: string[]) {
  return {
    "@type": "SpeakableSpecification",
    "cssSelector": cssSelectors
  };
}

// Generate HowTo schema for booking process (AI-extractable step-by-step)
export function generateHowToBookingSchema(language: Language = 'es') {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : BUSINESS_INFO.url;

  const steps: Record<string, Array<{ name: string; text: string }>> = {
    es: [
      { name: "Elige tu barco", text: "Selecciona entre nuestras embarcaciones sin licencia (desde 70 EUR/hora) o con licencia (desde 150 EUR/2 horas) en nuestra web o por WhatsApp." },
      { name: "Selecciona fecha y horario", text: "Elige la fecha, hora de inicio y duración del alquiler. Disponible de abril a octubre, de 09:00 a 20:00." },
      { name: "Confirma tu reserva", text: "Reserva por WhatsApp (+34 611 500 372) o a través de la web. No se requiere depósito para barcos sin licencia." },
      { name: "Recibe tu briefing", text: "Al llegar al Puerto de Blanes, nuestro equipo te dará una formación de 15 minutos sobre el manejo del barco y las normas de seguridad." },
      { name: "Navega por la Costa Brava", text: "Explora calas, playas y destinos como Lloret de Mar y Tossa de Mar. Combustible, seguro y equipo de seguridad incluidos." }
    ],
    en: [
      { name: "Choose your boat", text: "Select from our license-free boats (from 70 EUR/hour) or licensed boats (from 150 EUR/2 hours) on our website or via WhatsApp." },
      { name: "Select date and time", text: "Choose your date, start time, and rental duration. Available April to October, 09:00 to 20:00." },
      { name: "Confirm your booking", text: "Book via WhatsApp (+34 611 500 372) or through the website. No deposit required for license-free boats." },
      { name: "Receive your briefing", text: "Upon arrival at Puerto de Blanes, our team will give you a 15-minute training on boat handling and safety rules." },
      { name: "Explore the Costa Brava", text: "Discover coves, beaches, and destinations like Lloret de Mar and Tossa de Mar. Fuel, insurance, and safety equipment included." }
    ]
  };

  const langSteps = steps[language] || steps.es;

  return {
    "@type": "HowTo",
    "name": language === 'en' ? "How to Rent a Boat in Blanes, Costa Brava" : "Como alquilar un barco en Blanes, Costa Brava",
    "description": language === 'en'
      ? "Step-by-step guide to renting a boat in Blanes without a license. Book in 5 minutes."
      : "Guia paso a paso para alquilar un barco en Blanes sin licencia. Reserva en 5 minutos.",
    "totalTime": "PT5M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": "70"
    },
    "supply": [],
    "tool": [],
    "step": langSteps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "url": `${baseUrl}/#step-${index + 1}`
    }))
  };
}