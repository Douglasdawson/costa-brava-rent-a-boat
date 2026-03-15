import { Language } from "@/hooks/use-language";
import { getBaseUrl } from "@/lib/domain";

// SEO Configuration for all languages
export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export interface PageSEOConfig {
  [key: string]: SEOConfig;
}

// Business information for JSON-LD schemas
export const BUSINESS_INFO = {
  name: "Costa Brava Rent a Boat Blanes",
  legalName: "Costa Brava Rent a Boat - Blanes",
  description: "Alquiler de barcos sin licencia y con licencia en Blanes, Costa Brava. Desde Puerto de Blanes. 7 embarcaciones para 4-7 personas.",
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
  priceRange: "€€",
  servesCuisine: null,
  hasDeliveryService: false
};

// Base domain for canonical URLs (uses canonical domain)
export const BASE_DOMAIN = getBaseUrl();

// Language-specific SEO configurations
export const SEO_CONFIGS: Record<Language, Record<string, SEOConfig>> = {
  es: {
    home: {
      title: "Alquiler Barcos Costa Brava Sin Licencia | Blanes desde 70\u20ac/h",
      description: "Alquila barcos sin licencia en Costa Brava desde Puerto de Blanes. Desde 70\u20ac/h, gasolina incluida. 4.8\u2605 en Google (307 opiniones). 7 barcos para 4-7 personas. Reserva online en 2 min.",
      keywords: "alquiler barco costa brava, alquiler barcos blanes, barco alquiler costa brava, alquiler de barco en costa brava, alquiler embarcaciones costa brava",
      ogTitle: "Alquiler de Barcos en Costa Brava | Blanes 2026",
      ogDescription: "Alquila barcos en Costa Brava desde Puerto de Blanes. Sin licencia ni experiencia, desde 70\u20ac con gasolina incluida. Reserva ya tu aventura."
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
      title: "Alquiler Barco Blanes Sin Licencia | Puerto de Blanes desde 70\u20ac/h",
      description: "Alquiler de barcos sin licencia en Puerto de Blanes. Desde 70\u20ac/h, gasolina incluida. 4.8\u2605 Google (307 opiniones). 7 barcos para hasta 7 personas. Reserva online.",
      keywords: "alquiler barco blanes, alquiler barcos blanes, alquilar barco en blanes, barcos sin licencia blanes, puerto blanes",
      ogTitle: "Alquiler de Barcos en Blanes | Puerto de Blanes 2026",
      ogDescription: "Alquila barcos en Puerto de Blanes. Sin licencia desde 70\u20ac con gasolina incluida. 7 embarcaciones disponibles. Reserva ya."
    },
    locationLloret: {
      title: "Alquiler Barco Lloret de Mar | Desde Blanes 70\u20ac/h Gasolina Incluida",
      description: "Alquiler barco en Lloret de Mar sin licencia desde Blanes. Desde 70\u20ac/h, gasolina incluida. 4.8\u2605 Google. Navega por calas y playas de Lloret. Reserva online.",
      keywords: "alquiler barco lloret de mar, alquiler barco sin licencia lloret de mar, barcos lloret de mar, excursion lloret desde blanes",
      ogTitle: "Alquiler de Barco en Lloret de Mar | Desde Blanes Costa Brava",
      ogDescription: "Alquila un barco sin licencia y navega a Lloret de Mar desde Blanes. Desde 70\u20ac con gasolina incluida. Reserva tu aventura."
    },
    locationTossa: {
      title: "Alquiler Barco Tossa de Mar | Desde Blanes | Costa Brava",
      description: "Alquiler barco en Tossa de Mar desde Blanes. Sin licencia desde 70\u20ac, gasolina incluida. Navega 1h hasta Vila Vella y calas de Tossa. Reserva ya.",
      keywords: "alquiler barco tossa de mar, barcos tossa de mar, excursion tossa desde blanes, barcos tossa costa brava, vila vella tossa",
      ogTitle: "Alquiler de Barco en Tossa de Mar | Desde Blanes Costa Brava",
      ogDescription: "Navega a Tossa de Mar en 1 hora desde Blanes. Alquiler de barco sin licencia desde 70\u20ac. Descubre Vila Vella y calas secretas. Reserva."
    },
    categoryLicenseFree: {
      title: "Barcos Sin Licencia Costa Brava | 5 Barcos desde 70\u20ac/h Blanes",
      description: "Alquiler barco sin licencia en Costa Brava desde Blanes. 5 barcos desde 70\u20ac/h, gasolina incluida. 4.8\u2605 Google (307 opiniones). 15 min de formacion. Reserva online.",
      keywords: "alquiler barco sin licencia costa brava, alquiler barco blanes sin licencia, alquiler barcos sin licencia costa brava, barcos sin licencia blanes",
      ogTitle: "Barcos Sin Licencia en Costa Brava | Desde 70\u20ac Blanes",
      ogDescription: "Alquila barcos sin licencia en Costa Brava desde Puerto de Blanes. Desde 70\u20ac con gasolina incluida. Sin experiencia necesaria. Reserva ya."
    },
    categoryLicensed: {
      title: "Alquiler Barco Costa Brava con Patron | Blanes",
      description: "Alquiler barco con licencia o con patrón en Costa Brava. Desde Blanes, barcos potentes y rápidos. Gasolina incluida. Reserva online.",
      keywords: "alquiler barco costa brava con patron, barcos con licencia blanes, alquiler barcos PER costa brava, barcos potentes costa brava",
      ogTitle: "Barcos Con Licencia y Con Patrón | Blanes Costa Brava",
      ogDescription: "Alquila barcos con licencia o con patrón en Costa Brava desde Blanes. Barcos potentes y rápidos. Gasolina incluida. Reserva tu barco."
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
      ogTitle: "Rutas en Barco desde Blanes | Costa Brava 2026",
      ogDescription: "5 rutas en barco desde Blanes. Sa Palomera, Cala Sant Francesc, Lloret de Mar, Tossa de Mar. Mapas interactivos!"
    },
    giftCards: {
      title: "Tarjetas Regalo Alquiler Barcos | Costa Brava Rent a Boat",
      description: "Regala una experiencia nautica en la Costa Brava. Tarjetas regalo desde 50EUR para alquilar barcos en Blanes. Validas 1 ano.",
      keywords: "tarjetas regalo barcos, regalo alquiler barco blanes, experiencia nautica regalo, costa brava regalo",
      ogTitle: "Tarjetas Regalo | Costa Brava Rent a Boat",
      ogDescription: "Regala una experiencia nautica inolvidable. Tarjetas desde 50EUR canjeables en todos nuestros barcos en Blanes."
    },
    pricing: {
      title: "Precios Alquiler Barcos Blanes 2026 | Costa Brava Rent a Boat",
      description: "Consulta precios de alquiler de barcos en Blanes. Sin licencia desde 70\u20ac/hora. Con licencia desde 150\u20ac. Gasolina incluida. Temporada baja, media y alta.",
      keywords: "precios alquiler barco costa brava, cuanto cuesta alquilar barco blanes, tarifas barco sin licencia",
      ogTitle: "Precios Alquiler Barcos Blanes 2026 | Desde 70\u20ac",
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
      title: "Alquiler de Barcos en Costa Brava 2026 | Sin Licencia desde 70\u20ac/h",
      description: "Alquila barcos en la Costa Brava desde Puerto de Blanes. Sin licencia desde 70\u20ac/h, gasolina incluida. 4.8\u2605 Google (307 opiniones). 7 barcos. Reserva online.",
      keywords: "alquiler barcos costa brava, alquiler barcos sin licencia costa brava, barcos costa brava 2026"
    },
    notFound: {
      title: "Página no encontrada | Costa Brava Rent a Boat",
      description: "La página que buscas no existe. Vuelve al inicio para alquilar barcos en Blanes, Costa Brava.",
      keywords: "error 404, página no encontrada, costa brava rent boat"
    }
  },
  en: {
    home: {
      title: "Boat Rental Costa Brava No License | Blanes from 70\u20ac/h",
      description: "Rent boats without license in Costa Brava from Blanes Port. From 70\u20ac/h, fuel included. 4.8\u2605 Google (307 reviews). 7 boats for 4-7 people. Book online in 2 min.",
      keywords: "boat rental blanes, boats without license costa brava, boat charter blanes, costa brava rent boat, blanes port",
      ogTitle: "Boat Rental in Blanes & Lloret de Mar | Costa Brava 2026",
      ogDescription: "Discover Costa Brava from the sea. 7 boats with and without license. Explore paradise coves. Book your adventure today!"
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
      title: "Boat Rental Blanes No License | Blanes Port from 70\u20ac/h",
      description: "Boat rental without license at Blanes Port. From 70\u20ac/h, fuel included. 4.8\u2605 Google (307 reviews). 7 boats for up to 7 people. Book online.",
      keywords: "boat rental blanes port, boats blanes costa brava, boats without license blanes, costa brava coves from blanes",
      ogTitle: "Boat Rental at Blanes Port | Costa Brava 2026",
      ogDescription: "Rent boats from Blanes Port. With and without license. 7 boats available. Explore coves and beaches. Book now!"
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
    categoryLicenseFree: {
      title: "No License Boats Costa Brava | 5 Boats from 70\u20ac/h Blanes",
      description: "No license boat rental in Costa Brava from Blanes. 5 boats from 70\u20ac/h, fuel included. 4.8\u2605 Google (307 reviews). 15 min training. Book online.",
      keywords: "license free boats blanes, boats without license, no license boat rental costa brava, 15hp boats blanes",
      ogTitle: "No License Boats in Blanes | Easy & Safe Costa Brava",
      ogDescription: "Rent boats without license in Blanes. Up to 15 HP, 4-7 people. No qualification needed. Easy to drive. Book your adventure!"
    },
    categoryLicensed: {
      title: "Licensed Boat Rental Blanes | ICC Costa Brava",
      description: "Licensed boats in Blanes. Powerful and fast. Requires ICC or boating license. Maximum freedom on Costa Brava. Book your boat!",
      keywords: "licensed boats blanes, boats with license, ICC boat rental, powerful boats costa brava",
      ogTitle: "Licensed Boats in Blanes | ICC Costa Brava",
      ogDescription: "Powerful and fast boats in Blanes. Requires ICC or boating license. Maximum freedom on Costa Brava. Book your boat!"
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
      ogTitle: "Boat Routes from Blanes | Costa Brava 2026",
      ogDescription: "5 boat routes from Blanes. Sa Palomera, Cala Sant Francesc, Lloret de Mar, Tossa de Mar. Interactive maps!"
    },
    giftCards: {
      title: "Gift Cards Boat Rental | Costa Brava Rent a Boat",
      description: "Give a nautical experience on Costa Brava. Gift cards from 50EUR for boat rental in Blanes. Valid for 1 year.",
      keywords: "boat gift cards, boat rental gift blanes, nautical experience gift, costa brava gift",
      ogTitle: "Gift Cards | Costa Brava Rent a Boat",
      ogDescription: "Give an unforgettable nautical experience. Cards from 50EUR redeemable on all our boats in Blanes."
    },
    pricing: {
      title: "Boat Rental Prices Blanes 2026 | Costa Brava Rent a Boat",
      description: "Check boat rental prices in Blanes. No license from 70\u20ac/h. Licensed from 150\u20ac. Fuel included. Low, mid and high season rates.",
      keywords: "boat rental prices costa brava, how much boat rental blanes, boat hire rates blanes"
    },
    locationBarcelona: {
      title: "Boat Rental near Barcelona | Blanes 70min | Costa Brava",
      description: "Rent boats without license 70 minutes from Barcelona. Blanes, Costa Brava. Best prices, crystal clear water. From 70\u20ac. Fuel included.",
      keywords: "boat rental near barcelona, boats without license barcelona, costa brava boats from barcelona"
    },
    locationCostaBrava: {
      title: "Boat Rental Costa Brava 2026 | No License from 70\u20ac/h",
      description: "Rent boats in Costa Brava from Blanes Port. No license from 70\u20ac/h, fuel included. 4.8\u2605 Google (307 reviews). 7 boats. Book online.",
      keywords: "boat rental costa brava, no license boats costa brava, costa brava boats 2026"
    },
    notFound: {
      title: "Page not found | Costa Brava Rent a Boat",
      description: "The page you're looking for doesn't exist. Return to home to rent boats in Blanes, Costa Brava.",
      keywords: "error 404, page not found, costa brava rent boat"
    }
  },
  ca: {
    home: {
      title: "Lloguer Barques Costa Brava Sense Llicencia | Blanes des de 70\u20ac/h",
      description: "Lloga barques sense llicencia a la Costa Brava des del Port de Blanes. Des de 70\u20ac/h, gasolina inclosa. 4.8\u2605 Google (307 opinions). 7 barques per a 4-7 persones. Reserva online en 2 min.",
      keywords: "lloguer barques blanes, barques sense llicència costa brava, lloguer embarcacions blanes, costa brava rent boat, port blanes",
      ogTitle: "Lloguer de Barques a Blanes i Lloret | Costa Brava 2026",
      ogDescription: "Descobreix la Costa Brava des del mar. 7 barques amb i sense llicència. Explora cales paradisíaques. Reserva la teva aventura!"
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
      title: "Lloguer Barques Blanes Sense Llicencia | Port de Blanes des de 70\u20ac/h",
      description: "Lloguer de barques sense llicencia al Port de Blanes. Des de 70\u20ac/h, gasolina inclosa. 4.8\u2605 Google (307 opinions). 7 barques per a fins a 7 persones. Reserva online.",
      keywords: "lloguer barques blanes port, embarcacions blanes costa brava, barques sense llicència blanes",
      ogTitle: "Lloguer de Barques al Port de Blanes | Costa Brava 2026",
      ogDescription: "Lloga barques des del Port de Blanes. Amb i sense llicència. 7 embarcacions disponibles. Explora cales i platges. Reserva ja!"
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
    categoryLicenseFree: {
      title: "Barques Sense Llicencia Costa Brava | 5 Barques des de 70\u20ac/h Blanes",
      description: "Lloguer barques sense llicencia a la Costa Brava des de Blanes. 5 barques des de 70\u20ac/h, gasolina inclosa. 4.8\u2605 Google (307 opinions). 15 min de formacio. Reserva online.",
      keywords: "barques sense llicència blanes, lloguer barques sense títol, embarcacions sense permís costa brava, barques 15cv blanes",
      ogTitle: "Barques Sense Llicència a Blanes | Fàcil i Segur Costa Brava",
      ogDescription: "Lloga barques sense llicència a Blanes. Fins a 15 CV, 4-7 persones. No cal titulació. Fàcil de manejar. Reserva la teva aventura!"
    },
    categoryLicensed: {
      title: "Lloguer Barques Amb Llicència Blanes | PER Costa Brava",
      description: "Barques amb llicència a Blanes. Potents i ràpides. Requereix PER o titulació nàutica. Màxima llibertat a la Costa Brava. Reserva!",
      keywords: "barques amb llicència blanes, lloguer barques PER, embarcacions titulació nàutica, barques potents costa brava",
      ogTitle: "Barques Amb Llicència a Blanes | PER Costa Brava",
      ogDescription: "Barques potents i ràpides a Blanes. Requereix PER o titulació nàutica. Màxima llibertat a la Costa Brava. Reserva la teva barca!"
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
      description: "Regala una experiencia nautica a la Costa Brava. Targetes regal des de 50EUR per llogar barques a Blanes. Valides 1 any.",
      keywords: "targetes regal barques, regal lloguer barca blanes, experiencia nautica regal, costa brava regal"
    },
    pricing: {
      title: "Preus Lloguer Barques Blanes 2026 | Costa Brava Rent a Boat",
      description: "Consulta els preus de lloguer de barques a Blanes. Sense llicencia des de 70\u20ac/h. Gasolina inclosa. Temporada baixa, mitja i alta.",
      keywords: "preus lloguer barques costa brava, quant costa llogar barca blanes, tarifes barca sense llicencia"
    },
    locationBarcelona: {
      title: "Lloguer Barques prop de Barcelona | Blanes a 70min | Costa Brava",
      description: "Lloga barques sense llicencia a 70 minuts de Barcelona. Blanes, Costa Brava. Millors preus, aigues cristallines. Des de 70\u20ac.",
      keywords: "llogar barca sense llicencia barcelona, lloguer barques prop barcelona, barques costa brava des de barcelona"
    },
    locationCostaBrava: {
      title: "Lloguer Barques Costa Brava 2026 | Sense Llicencia des de 70\u20ac/h",
      description: "Lloga barques a la Costa Brava des del Port de Blanes. Sense llicencia des de 70\u20ac/h, gasolina inclosa. 4.8\u2605 Google (307 opinions). 7 barques. Reserva online.",
      keywords: "lloguer barques costa brava, barques sense llicencia costa brava, barques costa brava 2026"
    }
  },
  fr: {
    home: {
      title: "Location Bateaux Costa Brava Sans Permis | Blanes des 70\u20ac/h",
      description: "Louez des bateaux sans permis sur la Costa Brava depuis le Port de Blanes. Des 70\u20ac/h, carburant inclus. 4.8\u2605 Google (307 avis). 7 bateaux pour 4-7 personnes. Reservez en 2 min.",
      keywords: "location bateaux blanes, bateaux sans permis costa brava, location embarcations blanes, costa brava rent boat, port blanes"
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
      title: "Location Bateaux Blanes Sans Permis | Port de Blanes des 70\u20ac/h",
      description: "Location de bateaux sans permis au Port de Blanes. Des 70\u20ac/h, carburant inclus. 4.8\u2605 Google (307 avis). 7 bateaux pour 7 personnes. Reservez en ligne.",
      keywords: "location bateaux blanes port, embarcations blanes costa brava, bateaux sans permis blanes"
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
    categoryLicenseFree: {
      title: "Bateaux Sans Permis Costa Brava | 5 Bateaux des 70\u20ac/h Blanes",
      description: "Location bateaux sans permis Costa Brava depuis Blanes. 5 bateaux des 70\u20ac/h, carburant inclus. 4.8\u2605 Google (307 avis). 15 min de formation. Reservez en ligne.",
      keywords: "bateaux sans permis blanes, location bateaux sans license, embarcations sans permis costa brava, bateaux 15cv blanes"
    },
    categoryLicensed: {
      title: "Location Bateaux Avec Permis Blanes | ICC Costa Brava",
      description: "Bateaux avec permis à Blanes. Puissants et rapides. Permis ICC ou permis bateau requis. Liberté maximale Costa Brava. Réservez!",
      keywords: "bateaux avec permis blanes, location bateaux ICC, embarcations permis bateau, bateaux puissants costa brava"
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
      description: "Offrez une experience nautique sur la Costa Brava. Cartes cadeaux des 50EUR pour louer des bateaux a Blanes. Valables 1 an.",
      keywords: "cartes cadeaux bateaux, cadeau location bateau blanes, experience nautique cadeau, costa brava cadeau"
    },
    pricing: {
      title: "Tarifs Location Bateaux Blanes 2026 | Costa Brava Rent a Boat",
      description: "Consultez les tarifs de location de bateaux a Blanes. Sans permis des 70\u20ac/h. Carburant inclus. Basse, moyenne et haute saison.",
      keywords: "tarifs location bateaux costa brava, combien coute louer bateau blanes, prix bateau sans permis"
    },
    locationBarcelona: {
      title: "Location Bateaux pres de Barcelone | Blanes a 70min | Costa Brava",
      description: "Louez des bateaux sans permis a 70 minutes de Barcelone. Blanes, Costa Brava. Meilleurs prix, eaux cristallines. Des 70\u20ac.",
      keywords: "location bateau sans permis barcelone, location bateaux pres barcelone, bateaux costa brava depuis barcelone"
    },
    locationCostaBrava: {
      title: "Location Bateaux Costa Brava 2026 | Sans Permis des 70\u20ac/h",
      description: "Louez des bateaux sur la Costa Brava depuis le Port de Blanes. Sans permis des 70\u20ac/h, carburant inclus. 4.8\u2605 Google (307 avis). 7 bateaux. Reservez en ligne.",
      keywords: "location bateaux costa brava, bateaux sans permis costa brava, bateaux costa brava 2026"
    }
  },
  de: {
    home: {
      title: "Bootsverleih Costa Brava Ohne Fuhrerschein | Blanes ab 70\u20ac/h",
      description: "Boote ohne Fuhrerschein an der Costa Brava ab Hafen Blanes mieten. Ab 70\u20ac/h, Kraftstoff inklusive. 4.8\u2605 Google (307 Bewertungen). 7 Boote fur 4-7 Personen. Online buchen in 2 Min.",
      keywords: "bootsverleih blanes, boote ohne führerschein costa brava, bootscharter blanes, costa brava rent boat, hafen blanes"
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
      title: "Bootsverleih Blanes Ohne Fuhrerschein | Hafen Blanes ab 70\u20ac/h",
      description: "Bootsverleih ohne Fuhrerschein im Hafen Blanes. Ab 70\u20ac/h, Kraftstoff inklusive. 4.8\u2605 Google (307 Bewertungen). 7 Boote fur bis zu 7 Personen. Online buchen.",
      keywords: "bootsverleih blanes hafen, boote blanes costa brava, boote ohne führerschein blanes"
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
    categoryLicenseFree: {
      title: "Boote Ohne Fuhrerschein Costa Brava | 5 Boote ab 70\u20ac/h Blanes",
      description: "Bootsverleih ohne Fuhrerschein Costa Brava ab Blanes. 5 Boote ab 70\u20ac/h, Kraftstoff inklusive. 4.8\u2605 Google (307 Bewertungen). 15 Min Einweisung. Online buchen.",
      keywords: "boote ohne führerschein blanes, bootsverleih ohne lizenz, boote ohne erlaubnis costa brava, 15ps boote blanes"
    },
    categoryLicensed: {
      title: "Bootsverleih Mit Führerschein Blanes | ICC Costa Brava",
      description: "Boote mit Führerschein in Blanes. Leistungsstark und schnell. ICC oder Bootsführerschein erforderlich. Maximale Freiheit Costa Brava. Buchen!",
      keywords: "boote mit führerschein blanes, bootsverleih ICC, boote bootsführerschein, starke boote costa brava"
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
      description: "Verschenken Sie ein nautisches Erlebnis an der Costa Brava. Geschenkkarten ab 50EUR fur Bootsverleih in Blanes. 1 Jahr gultig.",
      keywords: "geschenkkarten boote, geschenk bootsverleih blanes, nautisches erlebnis geschenk, costa brava geschenk"
    },
    pricing: {
      title: "Bootsverleih Preise Blanes 2026 | Costa Brava Rent a Boat",
      description: "Bootsverleih Preise in Blanes. Ohne Fuhrerschein ab 70\u20ac/h. Kraftstoff inklusive. Neben-, Mittel- und Hochsaison.",
      keywords: "bootsverleih preise costa brava, was kostet boot mieten blanes, bootstarife ohne fuhrerschein"
    },
    locationBarcelona: {
      title: "Bootsverleih nahe Barcelona | Blanes 70min | Costa Brava",
      description: "Boote ohne Fuhrerschein mieten, 70 Minuten von Barcelona. Blanes, Costa Brava. Beste Preise, kristallklares Wasser. Ab 70\u20ac.",
      keywords: "boot mieten nahe barcelona, boote ohne fuhrerschein barcelona, costa brava boote von barcelona"
    },
    locationCostaBrava: {
      title: "Bootsverleih Costa Brava 2026 | Ohne Fuhrerschein ab 70\u20ac/h",
      description: "Boote mieten an der Costa Brava ab Hafen Blanes. Ohne Fuhrerschein ab 70\u20ac/h, Kraftstoff inklusive. 4.8\u2605 Google (307 Bewertungen). 7 Boote. Online buchen.",
      keywords: "bootsverleih costa brava, boote ohne fuhrerschein costa brava, boote costa brava 2026"
    }
  },
  nl: {
    home: {
      title: "Bootverhuur Costa Brava Zonder Vaarbewijs | Blanes vanaf 70\u20ac/u",
      description: "Huur boten zonder vaarbewijs aan de Costa Brava vanuit Haven Blanes. Vanaf 70\u20ac/u, brandstof inbegrepen. 4.8\u2605 Google (307 beoordelingen). 7 boten voor 4-7 personen. Online boeken in 2 min.",
      keywords: "bootverhuur blanes, boten zonder vaarbewijs costa brava, bootcharter blanes, costa brava rent boat, haven blanes"
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
      title: "Bootverhuur Blanes Zonder Vaarbewijs | Haven Blanes vanaf 70\u20ac/u",
      description: "Bootverhuur zonder vaarbewijs in Haven Blanes. Vanaf 70\u20ac/u, brandstof inbegrepen. 4.8\u2605 Google (307 beoordelingen). 7 boten voor max 7 personen. Online boeken.",
      keywords: "bootverhuur blanes haven, boten blanes costa brava, boten zonder vaarbewijs blanes"
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
    categoryLicenseFree: {
      title: "Boten Zonder Vaarbewijs Costa Brava | 5 Boten vanaf 70\u20ac/u Blanes",
      description: "Bootverhuur zonder vaarbewijs Costa Brava vanuit Blanes. 5 boten vanaf 70\u20ac/u, brandstof inbegrepen. 4.8\u2605 Google (307 beoordelingen). 15 min instructie. Online boeken.",
      keywords: "boten zonder vaarbewijs blanes, bootverhuur zonder licentie, boten zonder vergunning costa brava, 15pk boten blanes"
    },
    categoryLicensed: {
      title: "Boten Met Vaarbewijs Blanes | Costa Brava",
      description: "Bootverhuur met vaarbewijs in Blanes. Krachtige boten voor gevorderde navigatie. ICC, KVB of equivalent vereist. Maximale vrijheid Costa Brava.",
      keywords: "boten met vaarbewijs blanes, bootverhuur ICC, boten vaarbewijs, krachtige boten costa brava"
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
      description: "Geef een nautische ervaring aan de Costa Brava. Cadeaukaarten vanaf 50EUR voor bootverhuur in Blanes. 1 jaar geldig.",
      keywords: "cadeaukaarten boten, cadeau bootverhuur blanes, nautische ervaring cadeau, costa brava cadeau"
    },
    pricing: {
      title: "Bootverhuur Prijzen Blanes 2026 | Costa Brava Rent a Boat",
      description: "Bekijk bootverhuur prijzen in Blanes. Zonder vaarbewijs vanaf 70\u20ac/u. Brandstof inbegrepen. Laag-, midden- en hoogseizoen.",
      keywords: "bootverhuur prijzen costa brava, hoeveel kost boot huren blanes, boottarieven zonder vaarbewijs"
    },
    locationBarcelona: {
      title: "Bootverhuur nabij Barcelona | Blanes 70min | Costa Brava",
      description: "Huur boten zonder vaarbewijs op 70 minuten van Barcelona. Blanes, Costa Brava. Beste prijzen, kristalhelder water. Vanaf 70\u20ac.",
      keywords: "boot huren nabij barcelona, boten zonder vaarbewijs barcelona, costa brava boten vanuit barcelona"
    },
    locationCostaBrava: {
      title: "Bootverhuur Costa Brava 2026 | Zonder Vaarbewijs vanaf 70\u20ac/u",
      description: "Huur boten aan de Costa Brava vanuit Haven Blanes. Zonder vaarbewijs vanaf 70\u20ac/u, brandstof inbegrepen. 4.8\u2605 Google (307 beoordelingen). 7 boten. Online boeken.",
      keywords: "bootverhuur costa brava, boten zonder vaarbewijs costa brava, boten costa brava 2026"
    }
  },
  it: {
    home: {
      title: "Noleggio Barche Costa Brava Senza Patente | Blanes da 70\u20ac/h",
      description: "Noleggia barche senza patente sulla Costa Brava dal Porto di Blanes. Da 70\u20ac/h, carburante incluso. 4.8\u2605 Google (307 recensioni). 7 barche per 4-7 persone. Prenota online in 2 min.",
      keywords: "noleggio barche blanes, barche senza patente costa brava, charter barche blanes, costa brava rent boat, porto blanes"
    },
    faq: {
      title: "FAQ Noleggio Barche Blanes | Costa Brava",
      description: "Risolvi tutti i tuoi dubbi sul noleggio barche a Blanes, Costa Brava. Prezzi, requisiti, cosa è incluso, politiche di cancellazione e altro.",
      keywords: "faq noleggio barche, domande frequenti barche, dubbi noleggio barche costa brava"
    },
    locationBlanes: {
      title: "Noleggio Barche Blanes Senza Patente | Porto Blanes da 70\u20ac/h",
      description: "Noleggio barche senza patente al Porto di Blanes. Da 70\u20ac/h, carburante incluso. 4.8\u2605 Google (307 recensioni). 7 barche per max 7 persone. Prenota online.",
      keywords: "noleggio barche blanes porto, barche blanes costa brava, barche senza patente blanes"
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
    categoryLicenseFree: {
      title: "Barche Senza Patente Costa Brava | 5 Barche da 70\u20ac/h Blanes",
      description: "Noleggio barche senza patente Costa Brava da Blanes. 5 barche da 70\u20ac/h, carburante incluso. 4.8\u2605 Google (307 recensioni). 15 min formazione. Prenota online.",
      keywords: "barche senza patente blanes, noleggio barche senza licenza, imbarcazioni senza permesso costa brava, barche 15cv blanes"
    },
    categoryLicensed: {
      title: "Barche Con Patente Blanes | Costa Brava",
      description: "Noleggio barche con patente a Blanes. Imbarcazioni potenti per navigazione avanzata. Richiede ICC, patente costiera o equivalente.",
      keywords: "barche con patente blanes, noleggio barche ICC, imbarcazioni patente nautica, barche potenti costa brava"
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
      description: "Regala un'esperienza nautica sulla Costa Brava. Carte regalo da 50EUR per noleggio barche a Blanes. Valide 1 anno.",
      keywords: "carte regalo barche, regalo noleggio barca blanes, esperienza nautica regalo, costa brava regalo"
    },
    pricing: {
      title: "Prezzi Noleggio Barche Blanes 2026 | Costa Brava Rent a Boat",
      description: "Consulta i prezzi di noleggio barche a Blanes. Senza patente da 70\u20ac/h. Carburante incluso. Bassa, media e alta stagione.",
      keywords: "prezzi noleggio barche costa brava, quanto costa noleggiare barca blanes, tariffe barca senza patente"
    },
    locationBarcelona: {
      title: "Noleggio Barche vicino a Barcellona | Blanes a 70min | Costa Brava",
      description: "Noleggia barche senza patente a 70 minuti da Barcellona. Blanes, Costa Brava. Migliori prezzi, acque cristalline. Da 70\u20ac.",
      keywords: "noleggio barca senza patente barcellona, noleggio barche vicino barcellona, barche costa brava da barcellona"
    },
    locationCostaBrava: {
      title: "Noleggio Barche Costa Brava 2026 | Senza Patente da 70\u20ac/h",
      description: "Noleggia barche sulla Costa Brava dal Porto di Blanes. Senza patente da 70\u20ac/h, carburante incluso. 4.8\u2605 Google (307 recensioni). 7 barche. Prenota online.",
      keywords: "noleggio barche costa brava, barche senza patente costa brava, barche costa brava 2026"
    }
  },
  ru: {
    home: {
      title: "Аренда Лодок Коста-Брава Без Лицензии | Бланес от 70\u20ac/ч",
      description: "Арендуйте лодки без лицензии на Коста-Браве из порта Бланес. От 70\u20ac/ч, топливо включено. 4.8\u2605 Google (307 отзывов). 7 лодок для 4-7 человек. Бронируйте онлайн за 2 мин.",
      keywords: "аренда лодок бланес, лодки без лицензии коста брава, чартер лодок бланес, costa brava rent boat, порт бланес"
    },
    faq: {
      title: "FAQ Аренда Лодок Бланес | Коста-Брава",
      description: "Решите все ваши сомнения по аренде лодок в Бланесе, Коста-Брава. Цены, требования, что включено, политика отмены и многое другое.",
      keywords: "faq аренда лодок, часто задаваемые вопросы лодки, сомнения аренда лодок коста брава"
    },
    locationBlanes: {
      title: "Аренда Лодок Бланес Без Лицензии | Порт Бланес от 70\u20ac/ч",
      description: "Аренда лодок без лицензии в порту Бланес. От 70\u20ac/ч, топливо включено. 4.8\u2605 Google (307 отзывов). 7 лодок для 7 человек. Бронируйте онлайн.",
      keywords: "аренда лодок бланес порт, лодки бланес коста брава, лодки без лицензии бланес"
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
    categoryLicenseFree: {
      title: "Лодки Без Лицензии Коста-Брава | 5 Лодок от 70\u20ac/ч Бланес",
      description: "Аренда лодок без лицензии Коста-Брава из Бланеса. 5 лодок от 70\u20ac/ч, топливо включено. 4.8\u2605 Google (307 отзывов). 15 мин обучения. Бронируйте онлайн.",
      keywords: "лодки без лицензии бланес, аренда лодок без прав, лодки без разрешения коста брава, лодки 15лс бланес"
    },
    categoryLicensed: {
      title: "Лодки С Лицензией Бланес | Коста-Брава",
      description: "Аренда лодок с лицензией в Бланесе. Мощные лодки для продвинутой навигации. Требуется ICC, права или эквивалент. Свобода Коста-Брава.",
      keywords: "лодки с лицензией бланес, аренда лодок ICC, лодки с правами, мощные лодки коста брава"
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
      description: "Подарите морской опыт на Коста-Браве. Подарочные карты от 50EUR на аренду лодок в Бланесе. Действительны 1 год.",
      keywords: "подарочные карты лодки, подарок аренда лодки бланес, морской опыт подарок, коста брава подарок"
    },
    pricing: {
      title: "Цены Аренда Лодок Бланес 2026 | Costa Brava Rent a Boat",
      description: "Узнайте цены аренды лодок в Бланесе. Без лицензии от 70\u20ac/ч. Топливо включено. Низкий, средний и высокий сезон.",
      keywords: "цены аренда лодок коста брава, сколько стоит арендовать лодку бланес, тарифы лодка без лицензии"
    },
    locationBarcelona: {
      title: "Аренда Лодок рядом с Барселоной | Бланес 70мин | Коста-Брава",
      description: "Арендуйте лодки без лицензии в 70 минутах от Барселоны. Бланес, Коста-Брава. Лучшие цены, кристально чистая вода. От 70\u20ac.",
      keywords: "аренда лодки без лицензии барселона, аренда лодок рядом барселона, лодки коста брава из барселоны"
    },
    locationCostaBrava: {
      title: "Аренда Лодок Коста-Брава 2026 | Без Лицензии от 70\u20ac/ч",
      description: "Арендуйте лодки на Коста-Браве из порта Бланес. Без лицензии от 70\u20ac/ч, топливо включено. 4.8\u2605 Google (307 отзывов). 7 лодок. Бронируйте онлайн.",
      keywords: "аренда лодок коста брава, лодки без лицензии коста брава, лодки коста брава 2026"
    }
  }
};

// Map language codes to full hreflang codes with country
const HREFLANG_CODES: Record<Language, string> = {
  'es': 'es-ES',  // Spanish (Spain)
  'en': 'en-GB',  // English (United Kingdom)
  'ca': 'ca-ES',  // Catalan (Spain)
  'fr': 'fr-FR',  // French (France)
  'de': 'de-DE',  // German (Germany)
  'nl': 'nl-NL',  // Dutch (Netherlands)
  'it': 'it-IT',  // Italian (Italy)
  'ru': 'ru-RU'   // Russian (Russia)
};

// Generate hreflang links for a page
export const generateHreflangLinks = (pageName: string, params?: string): Array<{ lang: string; url: string }> => {
  const languages: Language[] = ['es', 'en', 'ca', 'fr', 'de', 'nl', 'it', 'ru'];
  
  const hreflangLinks = languages.map(lang => {
    let url = '';
    const pagePath = getPagePath(pageName);
    
    if (pagePath) {
      url = `${BASE_DOMAIN}/${pagePath}`;
      if (params) {
        url += `/${params}`;
      }
    } else {
      url = BASE_DOMAIN;
    }
    
    // Add language query param for non-Spanish languages
    if (lang !== 'es') {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}lang=${lang}`;
    }
    
    return {
      lang: HREFLANG_CODES[lang], // Use full hreflang code with country
      url
    };
  });

  // Add x-default pointing to Spanish version (no lang param)
  let defaultUrl = '';
  const pagePath = getPagePath(pageName);
  if (pagePath) {
    defaultUrl = `${BASE_DOMAIN}/${pagePath}`;
    if (params) {
      defaultUrl += `/${params}`;
    }
  } else {
    defaultUrl = BASE_DOMAIN;
  }
  
  hreflangLinks.push({
    lang: 'x-default',
    url: defaultUrl
  });

  return hreflangLinks;
};

// Get page path based on page name
const getPagePath = (pageName: string): string => {
  const paths: Record<string, string> = {
    home: '',
    booking: 'booking',
    blog: 'blog',
    destinations: 'destinations',
    faq: 'faq',
    testimonios: 'testimonios',
    locationBlanes: 'alquiler-barcos-blanes',
    locationLloret: 'alquiler-barcos-lloret-de-mar',
    locationTossa: 'alquiler-barcos-tossa-de-mar',
    categoryLicenseFree: 'barcos-sin-licencia',
    categoryLicensed: 'barcos-con-licencia',
    privacyPolicy: 'privacy-policy',
    termsConditions: 'terms-conditions',
    cookiesPolicy: 'cookies-policy',
    condicionesGenerales: 'condiciones-generales',
    boatDetail: 'barco', // This will be handled dynamically
    blogDetail: 'blog', // This will be handled dynamically with slug
    destinationDetail: 'destination', // This will be handled dynamically with slug
    gallery: 'galeria',
    routes: 'rutas',
    giftCards: 'tarjetas-regalo',
    pricing: 'precios',
    locationBarcelona: 'alquiler-barcos-cerca-barcelona',
    locationCostaBrava: 'alquiler-barcos-costa-brava',
    notFound: '404'
  };

  return paths[pageName] || '';
};

// Generate canonical URL for a page
// NOTE: Canonical URLs must be clean without language query params
// Language variants are handled via hreflang tags, not canonicals
export const generateCanonicalUrl = (pageName: string, language: Language = 'es', params?: string): string => {
  const pagePath = getPagePath(pageName);
  let baseUrl = '';
  
  if (pagePath) {
    baseUrl = `${BASE_DOMAIN}/${pagePath}`;
    if (params) {
      baseUrl += `/${params}`;
    }
  } else {
    baseUrl = BASE_DOMAIN;
  }
  
  // DO NOT add language query params to canonical URLs
  // Canonical URLs must be clean and consistent for proper SEO
  // Language variants are indicated through hreflang tags instead
  
  return baseUrl;
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
            "description": "Embarcaciones hasta 15 CV que no requieren titulación náutica"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Alquiler de barcos con licencia",
            "description": "Embarcaciones que requieren titulación náutica oficial"
          }
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
      "bestRating": "5"
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
    "offers": [
      {
        "@type": "Offer",
        "name": "Alquiler por horas",
        "description": "Desde 1 hora de duración",
        "priceCurrency": "EUR",
        "eligibleQuantity": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 8,
          "unitText": "hours"
        }
      }
    ],
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