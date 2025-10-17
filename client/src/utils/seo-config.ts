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
  phone: "+34683172154",
  email: "costabravarentboat@gmail.com",
  url: getBaseUrl(),
  address: {
    streetAddress: "Puerto de Blanes",
    addressLocality: "Blanes", 
    addressRegion: "Girona",
    postalCode: "17300",
    addressCountry: "ES"
  },
  geo: {
    latitude: 41.6667,
    longitude: 2.7833
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
      title: "Alquiler Barcos Blanes y Lloret | Costa Brava",
      description: "Descubre la Costa Brava desde el mar con nuestros barcos en Blanes. Alquiler con o sin licencia. ¡Fácil, rápido y seguro!",
      keywords: "alquiler barcos blanes, barcos sin licencia costa brava, alquiler embarcaciones blanes, costa brava rent boat, puerto blanes",
      ogTitle: "Alquiler de Barcos en Blanes y Lloret | Costa Brava 2025",
      ogDescription: "Descubre la Costa Brava desde el mar. 7 barcos con y sin licencia. Explora calas paradisíacas. ¡Reserva tu aventura hoy!"
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
      title: "Alquiler Barcos en Blanes Puerto | Costa Brava 2025",
      description: "Alquila barcos en Puerto de Blanes. Sin licencia y con licencia. 7 embarcaciones disponibles. Explora calas y playas de la Costa Brava. ¡Reserva ya!",
      keywords: "alquiler barcos blanes puerto, embarcaciones blanes costa brava, barcos sin licencia blanes, calas costa brava desde blanes",
      ogTitle: "Alquiler de Barcos en Puerto de Blanes | Costa Brava 2025",
      ogDescription: "Alquila barcos desde Puerto de Blanes. Con y sin licencia. 7 embarcaciones disponibles. Explora calas y playas. ¡Reserva ya!"
    },
    locationLloret: {
      title: "Excursión en Barco a Lloret de Mar desde Blanes",
      description: "Navega desde Blanes hasta Lloret de Mar. Alquiler de barcos con o sin licencia. Descubre las mejores playas y calas. ¡Aventura garantizada!",
      keywords: "alquiler barcos lloret de mar, visitar lloret en barco, excursion lloret desde blanes, barcos lloret costa brava",
      ogTitle: "Excursión en Barco a Lloret de Mar | Desde Blanes Costa Brava",
      ogDescription: "Navega desde Blanes hasta Lloret de Mar en barco. Con o sin licencia. Descubre las mejores playas y calas. ¡Aventura garantizada!"
    },
    locationTossa: {
      title: "Excursión en Barco a Tossa de Mar desde Blanes",
      description: "Navega a Tossa de Mar en 1 hora desde Blanes. Descubre el pueblo medieval más bonito de la Costa Brava. Con o sin licencia. ¡Reserva!",
      keywords: "alquiler barcos tossa de mar, visitar tossa en barco, excursion tossa desde blanes, barcos tossa costa brava, vila vella tossa",
      ogTitle: "Excursión en Barco a Tossa de Mar | Vila Vella desde Blanes",
      ogDescription: "Navega a Tossa de Mar en 1 hora desde Blanes. Descubre el pueblo medieval más bonito de la Costa Brava. Con o sin licencia. ¡Reserva!"
    },
    categoryLicenseFree: {
      title: "Alquiler Barcos Sin Licencia Blanes | Costa Brava",
      description: "Barcos sin licencia en Blanes. Hasta 15 CV, 4-7 personas. No necesitas titulación. Fácil de manejar. Explora calas desde Puerto de Blanes. ¡Reserva!",
      keywords: "barcos sin licencia blanes, alquiler barcos sin titulo, embarcaciones sin permiso costa brava, barcos 15cv blanes",
      ogTitle: "Barcos Sin Licencia en Blanes | Fácil y Seguro Costa Brava",
      ogDescription: "Alquila barcos sin licencia en Blanes. Hasta 15 CV, 4-7 personas. No necesitas titulación. Fácil de manejar. ¡Reserva tu aventura!"
    },
    categoryLicensed: {
      title: "Alquiler Barcos Con Licencia Blanes | PER Costa Brava",
      description: "Barcos con licencia en Blanes. Potentes y rápidos. Requiere PER o titulación náutica. Máxima libertad en la Costa Brava. ¡Reserva tu barco!",
      keywords: "barcos con licencia blanes, alquiler barcos PER, embarcaciones titulacion nautica, barcos potentes costa brava",
      ogTitle: "Barcos Con Licencia en Blanes | PER Costa Brava",
      ogDescription: "Barcos potentes y rápidos en Blanes. Requiere PER o titulación náutica. Máxima libertad en la Costa Brava. ¡Reserva tu barco!"
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
      title: "Alquiler {boatName} en Blanes | Desde {pricePerHour}€/h",
      description: "Alquila {boatName} en Blanes, Costa Brava. Capacidad {capacity} personas, {license}. Desde {pricePerHour}€/hora. ¡Reserva online!",
      keywords: "alquiler {boatName}, {boatName} blanes, barco {capacity} personas costa brava"
    },
    notFound: {
      title: "Página no encontrada | Costa Brava Rent a Boat",
      description: "La página que buscas no existe. Vuelve al inicio para alquilar barcos en Blanes, Costa Brava.",
      keywords: "error 404, página no encontrada, costa brava rent boat"
    }
  },
  en: {
    home: {
      title: "Boat Rental Blanes & Lloret de Mar | Costa Brava",
      description: "Discover Costa Brava from the sea with our boats in Blanes. With or without license. Easy, fast & safe!",
      keywords: "boat rental blanes, boats without license costa brava, boat charter blanes, costa brava rent boat, blanes port",
      ogTitle: "Boat Rental in Blanes & Lloret de Mar | Costa Brava 2025",
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
      title: "Boat Rental in Blanes Port | Costa Brava 2025",
      description: "Rent boats in Blanes Port. With and without license. 7 boats available. Explore coves and beaches of Costa Brava. Book now!",
      keywords: "boat rental blanes port, boats blanes costa brava, boats without license blanes, costa brava coves from blanes",
      ogTitle: "Boat Rental at Blanes Port | Costa Brava 2025",
      ogDescription: "Rent boats from Blanes Port. With and without license. 7 boats available. Explore coves and beaches. Book now!"
    },
    locationLloret: {
      title: "Boat Trip to Lloret de Mar from Blanes",
      description: "Sail from Blanes to Lloret de Mar. Boat rental with or without license. Discover the best beaches and coves. Adventure guaranteed!",
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
      title: "No License Boat Rental Blanes | Costa Brava",
      description: "No license boats in Blanes. Up to 15 HP, 4-7 people. No qualification needed. Easy to drive. Explore coves from Blanes Port. Book!",
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
      title: "Rent {boatName} in Blanes | From {pricePerHour}€/h",
      description: "Rent {boatName} in Blanes, Costa Brava. Capacity {capacity} people, {license}. From {pricePerHour}€/hour. Book online!",
      keywords: "rent {boatName}, {boatName} blanes, boat {capacity} people costa brava"
    },
    notFound: {
      title: "Page not found | Costa Brava Rent a Boat",
      description: "The page you're looking for doesn't exist. Return to home to rent boats in Blanes, Costa Brava.",
      keywords: "error 404, page not found, costa brava rent boat"
    }
  },
  ca: {
    home: {
      title: "Lloguer de Barques a Blanes i Lloret de Mar | Costa Brava",
      description: "Descobreix la Costa Brava des del mar amb les nostres barques a Blanes. Lloguer amb o sense llicència. Fàcil, ràpid i segur!",
      keywords: "lloguer barques blanes, barques sense llicència costa brava, lloguer embarcacions blanes, costa brava rent boat, port blanes",
      ogTitle: "Lloguer de Barques a Blanes i Lloret | Costa Brava 2025",
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
      title: "Lloguer Barques al Port de Blanes | Costa Brava 2025",
      description: "Lloga barques al Port de Blanes. Sense llicència i amb llicència. 7 embarcacions disponibles. Explora cales i platges. Reserva ja!",
      keywords: "lloguer barques blanes port, embarcacions blanes costa brava, barques sense llicència blanes",
      ogTitle: "Lloguer de Barques al Port de Blanes | Costa Brava 2025",
      ogDescription: "Lloga barques des del Port de Blanes. Amb i sense llicència. 7 embarcacions disponibles. Explora cales i platges. Reserva ja!"
    },
    locationLloret: {
      title: "Excursió en Barca a Lloret de Mar des de Blanes",
      description: "Navega de Blanes a Lloret de Mar. Lloguer de barques amb o sense llicència. Descobreix les millors platges i cales. Aventura garantida!",
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
      title: "Lloguer Barques Sense Llicència Blanes | Costa Brava",
      description: "Barques sense llicència a Blanes. Fins a 15 CV, 4-7 persones. No cal titulació. Fàcil de manejar. Explora cales des del Port de Blanes. Reserva!",
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
    }
  },
  fr: {
    home: {
      title: "Location Bateaux Blanes & Lloret de Mar | Costa Brava",
      description: "Découvrez la Costa Brava depuis la mer avec nos bateaux à Blanes. Avec ou sans permis. Facile, rapide et sûr!",
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
      title: "Location Bateaux au Port de Blanes | Costa Brava 2025",
      description: "Louez des bateaux au Port de Blanes. Avec et sans permis. 7 bateaux disponibles. Explorez criques et plages. Réservez maintenant!",
      keywords: "location bateaux blanes port, embarcations blanes costa brava, bateaux sans permis blanes"
    },
    locationLloret: {
      title: "Excursion en Bateau à Lloret de Mar depuis Blanes",
      description: "Naviguez de Blanes à Lloret de Mar. Location avec ou sans permis. Découvrez les meilleures plages et criques. Aventure garantie!",
      keywords: "location bateaux lloret de mar, visiter lloret en bateau, excursion lloret depuis blanes"
    },
    locationTossa: {
      title: "Excursion en Bateau à Tossa de Mar depuis Blanes",
      description: "Naviguez vers Tossa de Mar en 1h depuis Blanes. Découvrez la plus belle ville médiévale de la Costa Brava. Avec ou sans permis. Réservez!",
      keywords: "location bateaux tossa de mar, visiter tossa en bateau, excursion tossa depuis blanes, vila vella tossa"
    },
    categoryLicenseFree: {
      title: "Location Bateaux Sans Permis Blanes | Costa Brava",
      description: "Bateaux sans permis à Blanes. Jusqu'à 15 CV, 4-7 personnes. Aucun permis requis. Facile à conduire. Explorez depuis Blanes. Réservez!",
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
    }
  },
  de: {
    home: {
      title: "Bootsverleih Blanes & Lloret de Mar | Costa Brava",
      description: "Entdecken Sie die Costa Brava vom Meer aus mit unseren Booten in Blanes. Mit oder ohne Führerschein. Einfach, schnell & sicher!",
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
      title: "Bootsverleih im Hafen Blanes | Costa Brava 2025",
      description: "Mieten Sie Boote im Hafen Blanes. Mit und ohne Führerschein. 7 Boote verfügbar. Erkunden Sie Buchten und Strände. Jetzt buchen!",
      keywords: "bootsverleih blanes hafen, boote blanes costa brava, boote ohne führerschein blanes"
    },
    locationLloret: {
      title: "Bootsausflug nach Lloret de Mar von Blanes",
      description: "Segeln Sie von Blanes nach Lloret de Mar. Bootsverleih mit oder ohne Führerschein. Entdecken Sie die besten Strände und Buchten. Abenteuer garantiert!",
      keywords: "bootsverleih lloret de mar, lloret per boot besuchen, lloret ausflug von blanes"
    },
    locationTossa: {
      title: "Bootsausflug nach Tossa de Mar von Blanes",
      description: "Segeln Sie in 1h von Blanes nach Tossa de Mar. Entdecken Sie die schönste mittelalterliche Stadt der Costa Brava. Mit oder ohne Führerschein. Buchen!",
      keywords: "bootsverleih tossa de mar, tossa per boot besuchen, tossa ausflug von blanes, vila vella tossa"
    },
    categoryLicenseFree: {
      title: "Bootsverleih Ohne Führerschein Blanes | Costa Brava",
      description: "Boote ohne Führerschein in Blanes. Bis 15 PS, 4-7 Personen. Kein Führerschein erforderlich. Einfach zu fahren. Erkunden Sie von Blanes. Buchen!",
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
    }
  },
  nl: {
    home: {
      title: "Bootverhuur Blanes Zonder Vaarbewijs | Costa Brava",
      description: "Bootverhuur zonder vaarbewijs en met vaarbewijs in Blanes, Costa Brava. Vanaf Haven van Blanes. 7 boten voor 4-7 personen. Inclusief snorkel en paddle surf.",
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
      title: "Bootverhuur Blanes Zonder Vaarbewijs | Haven Blanes",
      description: "Bootverhuur in Blanes, Costa Brava. Haven van Blanes. Boten zonder vaarbewijs en met vaarbewijs voor 4-7 personen.",
      keywords: "bootverhuur blanes haven, boten blanes costa brava, boten zonder vaarbewijs blanes"
    },
    locationLloret: {
      title: "Boten naar Lloret de Mar vanuit Blanes | Costa Brava",
      description: "Bootverhuur voor Lloret de Mar bezoek vanuit Haven Blanes. Boten zonder vaarbewijs en met vaarbewijs. Verken Lloret stranden vanuit Blanes.",
      keywords: "bootverhuur lloret de mar, lloret bezoeken per boot, lloret excursie vanuit blanes"
    },
    locationTossa: {
      title: "Boten naar Tossa de Mar vanuit Blanes | Costa Brava",
      description: "Bootverhuur voor Tossa de Mar bezoek vanuit Haven Blanes. 1 uur varen naar de mooiste middeleeuwse stad van de Costa Brava. Boten zonder vaarbewijs en met vaarbewijs.",
      keywords: "bootverhuur tossa de mar, tossa bezoeken per boot, tossa excursie vanuit blanes, vila vella tossa"
    },
    categoryLicenseFree: {
      title: "Boten Zonder Vaarbewijs Blanes | Costa Brava",
      description: "Bootverhuur zonder vaarbewijs in Blanes, Costa Brava. Boten tot 15 PK voor 4-7 personen. Geen vaarbewijs vereist. Verken Costa Brava baaien vanuit Haven Blanes.",
      keywords: "boten zonder vaarbewijs blanes, bootverhuur zonder licentie, boten zonder vergunning costa brava, 15pk boten blanes"
    },
    categoryLicensed: {
      title: "Boten Met Vaarbewijs Blanes | Costa Brava",
      description: "Bootverhuur met vaarbewijs in Blanes, Costa Brava. Krachtige boten voor gevorderde navigatie. Vaarbewijs ICC, KVB of equivalent vereist. Maximale vrijheid op de Costa Brava.",
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
    }
  },
  it: {
    home: {
      title: "Noleggio Barche Blanes Senza Patente | Costa Brava",
      description: "Noleggio barche senza patente e con patente a Blanes, Costa Brava. Dal Porto di Blanes. 7 barche per 4-7 persone. Include snorkel e paddle surf.",
      keywords: "noleggio barche blanes, barche senza patente costa brava, charter barche blanes, costa brava rent boat, porto blanes"
    },
    faq: {
      title: "FAQ Noleggio Barche Blanes | Costa Brava",
      description: "Risolvi tutti i tuoi dubbi sul noleggio barche a Blanes, Costa Brava. Prezzi, requisiti, cosa è incluso, politiche di cancellazione e altro.",
      keywords: "faq noleggio barche, domande frequenti barche, dubbi noleggio barche costa brava"
    },
    locationBlanes: {
      title: "Noleggio Barche Blanes Senza Patente | Porto Blanes",
      description: "Noleggio barche a Blanes, Costa Brava. Porto di Blanes. Barche senza patente e con patente per 4-7 persone.",
      keywords: "noleggio barche blanes porto, barche blanes costa brava, barche senza patente blanes"
    },
    locationLloret: {
      title: "Barche verso Lloret de Mar da Blanes | Costa Brava",
      description: "Noleggio barche per visitare Lloret de Mar dal Porto di Blanes. Barche senza patente e con patente. Esplora le spiagge di Lloret navigando da Blanes.",
      keywords: "noleggio barche lloret de mar, visitare lloret in barca, escursione lloret da blanes"
    },
    locationTossa: {
      title: "Barche verso Tossa de Mar da Blanes | Costa Brava",
      description: "Noleggio barche per visitare Tossa de Mar dal Porto di Blanes. 1 ora di navigazione verso la più bella città medievale della Costa Brava. Barche senza patente e con patente.",
      keywords: "noleggio barche tossa de mar, visitare tossa in barca, escursione tossa da blanes, vila vella tossa"
    },
    categoryLicenseFree: {
      title: "Barche Senza Patente Blanes | Costa Brava",
      description: "Noleggio barche senza patente a Blanes, Costa Brava. Imbarcazioni fino a 15 CV per 4-7 persone. Nessuna patente nautica richiesta. Esplora le cale dal Porto di Blanes.",
      keywords: "barche senza patente blanes, noleggio barche senza licenza, imbarcazioni senza permesso costa brava, barche 15cv blanes"
    },
    categoryLicensed: {
      title: "Barche Con Patente Blanes | Costa Brava",
      description: "Noleggio barche con patente a Blanes, Costa Brava. Imbarcazioni potenti per navigazione avanzata. Richiede patente nautica ICC, patente costiera o equivalente. Massima libertà sulla Costa Brava.",
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
    }
  },
  ru: {
    home: {
      title: "Аренда Лодок Бланес Без Лицензии | Коста-Брава",
      description: "Аренда лодок без лицензии и с лицензией в Бланесе, Коста-Брава. Из порта Бланес. 7 лодок для 4-7 человек. Включает снорклинг и SUP.",
      keywords: "аренда лодок бланес, лодки без лицензии коста брава, чартер лодок бланес, costa brava rent boat, порт бланес"
    },
    faq: {
      title: "FAQ Аренда Лодок Бланес | Коста-Брава",
      description: "Решите все ваши сомнения по аренде лодок в Бланесе, Коста-Брава. Цены, требования, что включено, политика отмены и многое другое.",
      keywords: "faq аренда лодок, часто задаваемые вопросы лодки, сомнения аренда лодок коста брава"
    },
    locationBlanes: {
      title: "Аренда Лодок Бланес Без Лицензии | Порт Бланес",
      description: "Аренда лодок в Бланесе, Коста-Брава. Порт Бланес. Лодки без лицензии и с лицензией для 4-7 человек.",
      keywords: "аренда лодок бланес порт, лодки бланес коста брава, лодки без лицензии бланес"
    },
    locationLloret: {
      title: "Лодки в Льорет-де-Мар из Бланеса | Коста-Брава",
      description: "Аренда лодок для посещения Льорет-де-Мар из Порта Бланес. Лодки без лицензии и с лицензией. Исследуйте пляжи Льорета из Бланеса.",
      keywords: "аренда лодок льорет де мар, посетить льорет на лодке, экскурсия льорет из бланеса"
    },
    locationTossa: {
      title: "Лодки в Тосса-де-Мар из Бланеса | Коста-Брава",
      description: "Аренда лодок для посещения Тосса-де-Мар из Порта Бланес. 1 час плавания к самому красивому средневековому городу Коста-Брава. Лодки без лицензии и с лицензией.",
      keywords: "аренда лодок тосса де мар, посетить тосса на лодке, экскурсия тосса из бланеса, вила велла тосса"
    },
    categoryLicenseFree: {
      title: "Лодки Без Лицензии Бланес | Коста-Брава",
      description: "Аренда лодок без лицензии в Бланесе, Коста-Брава. Лодки до 15 л.с. для 4-7 человек. Лицензия на управление не требуется. Исследуйте бухты Коста-Брава из порта Бланес.",
      keywords: "лодки без лицензии бланес, аренда лодок без прав, лодки без разрешения коста брава, лодки 15лс бланес"
    },
    categoryLicensed: {
      title: "Лодки С Лицензией Бланес | Коста-Брава",
      description: "Аренда лодок с лицензией в Бланесе, Коста-Брава. Мощные лодки для продвинутой навигации. Требуется лицензия ICC, права на управление или эквивалент. Максимальная свобода на Коста-Брава.",
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
    }
  }
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
      lang,
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
    lang: 'x-default' as any,
    url: defaultUrl
  });

  return hreflangLinks;
};

// Get page path based on page name
const getPagePath = (pageName: string): string => {
  const paths: Record<string, string> = {
    home: '',
    booking: 'booking',
    faq: 'faq',
    locationBlanes: 'alquiler-barcos-blanes',
    locationLloret: 'alquiler-barcos-lloret-de-mar',
    locationTossa: 'alquiler-barcos-tossa-de-mar',
    categoryLicenseFree: 'barcos-sin-licencia',
    categoryLicensed: 'barcos-con-licencia',
    privacyPolicy: 'privacy-policy',
    termsConditions: 'terms-conditions',
    condicionesGenerales: 'condiciones-generales',
    boatDetail: 'barco', // This will be handled dynamically
    notFound: '404'
  };
  
  return paths[pageName] || '';
};

// Generate canonical URL for a page
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
  
  // Add language query param for non-Spanish languages
  if (language !== 'es') {
    const separator = baseUrl.includes('?') ? '&' : '?';
    baseUrl += `${separator}lang=${language}`;
  }
  
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
  
  const schema: any = {
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
      "validFrom": "2025-04-01",
      "validThrough": "2025-10-31"
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
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": BUSINESS_INFO.geo.latitude,
        "longitude": BUSINESS_INFO.geo.longitude
      },
      "geoRadius": "50000"
    },
    "serviceType": ["Boat Rental", "Maritime Tourism", "Water Sports"],
    "knowsAbout": ["Costa Brava", "Blanes", "Boat Navigation", "Maritime Safety"],
    "slogan": "Explora la Costa Brava desde el agua"
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
      "validFrom": "2024-04-01",
      "validThrough": "2024-10-31"
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
export function generateEnhancedProductSchema(boatData: any, language: Language = 'es') {
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

  const baseSchema: any = {
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
    "requiresSubscription": false
  };

  // Enhanced Offers with seasonal pricing
  if (boatData.pricing) {
    const offers: any[] = [];
    
    // Generate offer for each season
    ['BAJA', 'MEDIA', 'ALTA'].forEach((season) => {
      const seasonData = boatData.pricing[season as keyof typeof boatData.pricing];
      if (seasonData && seasonData.prices) {
        const prices = Object.values(seasonData.prices).filter((p: any) => p > 0) as number[];
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
      const allPrices = offers.flatMap(o => [parseFloat(o.lowPrice), parseFloat(o.highPrice)]);
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