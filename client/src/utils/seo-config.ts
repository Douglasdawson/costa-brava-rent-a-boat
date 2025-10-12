import { Language } from "@/hooks/use-language";

// SEO Configuration for all languages
export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
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
  url: typeof window !== 'undefined' ? window.location.origin : "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app",
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

// Base domain for canonical URLs - configurable for production
export const BASE_DOMAIN = typeof window !== 'undefined' 
  ? window.location.origin 
  : import.meta.env.VITE_BASE_DOMAIN || "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app";

// Language-specific SEO configurations
export const SEO_CONFIGS: Record<Language, Record<string, SEOConfig>> = {
  es: {
    home: {
      title: "Alquiler de Barcos en Blanes y Lloret de Mar | Costa Brava Rent a Boat",
      description: "Alquiler de barcos sin licencia y con licencia en Blanes, Costa Brava. Desde Puerto de Blanes. 7 embarcaciones para 4-7 personas. Incluye snorkel y paddle surf.",
      keywords: "alquiler barcos blanes, barcos sin licencia costa brava, alquiler embarcaciones blanes, costa brava rent boat, puerto blanes"
    },
    booking: {
      title: "Reservar Barco Blanes | Costa Brava Rent a Boat",
      description: "Completa el formulario para reservar tu barco en Blanes, Costa Brava. Barcos sin licencia y con licencia. Respuesta rápida por WhatsApp.",
      keywords: "reservar barco blanes, formulario reserva embarcación, booking barco costa brava"
    },
    faq: {
      title: "FAQ Alquiler Barcos Blanes | Costa Brava",
      description: "Resuelve todas tus dudas sobre el alquiler de barcos en Blanes, Costa Brava. Precios, requisitos, qué incluye, políticas de cancelación y más. Sin licencia y con licencia.",
      keywords: "faq alquiler barcos, preguntas frecuentes embarcaciones, dudas alquiler barcos costa brava, información barcos blanes"
    },
    locationBlanes: {
      title: "Alquiler Barcos Blanes Sin Licencia | Puerto Blanes",
      description: "Alquiler de barcos en Blanes, Costa Brava. Puerto de Blanes. Embarcaciones sin licencia y con licencia para 4-7 personas. Explora las calas de la Costa Brava desde Blanes.",
      keywords: "alquiler barcos blanes puerto, embarcaciones blanes costa brava, barcos sin licencia blanes, calas costa brava desde blanes"
    },
    locationLloret: {
      title: "Barcos a Lloret de Mar desde Blanes | Costa Brava",
      description: "Alquiler de barcos para visitar Lloret de Mar desde Puerto de Blanes. Embarcaciones sin licencia y con licencia. Explora las playas de Lloret navegando desde Blanes.",
      keywords: "alquiler barcos lloret de mar, visitar lloret en barco, excursion lloret desde blanes, barcos lloret costa brava"
    },
    locationTossa: {
      title: "Barcos a Tossa de Mar desde Blanes | Costa Brava",
      description: "Alquiler de barcos para visitar Tossa de Mar desde Puerto de Blanes. 1 hora navegando hasta el pueblo medieval más bonito de la Costa Brava. Barcos sin licencia y con licencia.",
      keywords: "alquiler barcos tossa de mar, visitar tossa en barco, excursion tossa desde blanes, barcos tossa costa brava, vila vella tossa"
    },
    categoryLicenseFree: {
      title: "Barcos Sin Licencia Blanes | Costa Brava",
      description: "Alquiler de barcos sin licencia en Blanes, Costa Brava. Embarcaciones de hasta 15 CV para 4-7 personas. No necesitas titulación náutica. Explora las calas desde Puerto de Blanes.",
      keywords: "barcos sin licencia blanes, alquiler barcos sin titulo, embarcaciones sin permiso costa brava, barcos 15cv blanes"
    },
    categoryLicensed: {
      title: "Barcos Con Licencia Blanes | Costa Brava",
      description: "Alquiler de barcos con licencia en Blanes, Costa Brava. Embarcaciones potentes para navegación avanzada. Requiere titulación náutica PER, PNB o superior. Máxima libertad en la Costa Brava.",
      keywords: "barcos con licencia blanes, alquiler barcos PER, embarcaciones titulacion nautica, barcos potentes costa brava"
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
    boatDetail: {
      title: "Alquiler {boatName} en Blanes | Costa Brava Rent a Boat",
      description: "Alquila {boatName} en Blanes, Costa Brava. {capacity} personas, {license}. Incluye equipo de seguridad y briefing completo.",
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
      title: "Boat Rental Blanes No License | Costa Brava",
      description: "Boat rental without license and with license in Blanes, Costa Brava. From Port of Blanes. 7 boats for 4-7 people. Includes snorkel and paddle surf.",
      keywords: "boat rental blanes, boats without license costa brava, boat charter blanes, costa brava rent boat, blanes port"
    },
    booking: {
      title: "Book Boat Blanes | Costa Brava Rent a Boat",
      description: "Complete the form to book your boat in Blanes, Costa Brava. License-free and licensed boats. Quick WhatsApp response.",
      keywords: "book boat blanes, boat booking form, boat reservation costa brava"
    },
    faq: {
      title: "FAQ Boat Rental Blanes | Costa Brava",
      description: "Solve all your doubts about boat rental in Blanes, Costa Brava. Prices, requirements, what's included, cancellation policies and more. Without license and with license.",
      keywords: "faq boat rental, frequently asked questions boats, boat rental costa brava info, blanes boats information"
    },
    locationBlanes: {
      title: "Boat Rental Blanes No License | Port Blanes",
      description: "Boat rental in Blanes, Costa Brava. Port of Blanes. Boats without license and with license for 4-7 people. Explore Costa Brava coves from Blanes.",
      keywords: "boat rental blanes port, boats blanes costa brava, boats without license blanes, costa brava coves from blanes"
    },
    locationLloret: {
      title: "Boats to Lloret de Mar from Blanes | Costa Brava",
      description: "Boat rental to visit Lloret de Mar from Blanes Port. Boats without license and with license. Explore Lloret beaches sailing from Blanes.",
      keywords: "boat rental lloret de mar, visit lloret by boat, lloret excursion from blanes, boats lloret costa brava"
    },
    locationTossa: {
      title: "Boats to Tossa de Mar from Blanes | Costa Brava",
      description: "Boat rental to visit Tossa de Mar from Blanes Port. 1 hour sailing to the most beautiful medieval town of Costa Brava. Boats without license and with license.",
      keywords: "boat rental tossa de mar, visit tossa by boat, tossa excursion from blanes, boats tossa costa brava, vila vella tossa"
    },
    categoryLicenseFree: {
      title: "No License Boats Blanes | Costa Brava",
      description: "License-free boat rental in Blanes, Costa Brava. Boats up to 15 HP for 4-7 people. No boating license required. Explore Costa Brava coves from Blanes Port.",
      keywords: "license free boats blanes, boats without license, no license boat rental costa brava, 15hp boats blanes"
    },
    categoryLicensed: {
      title: "Licensed Boats Blanes | Costa Brava",
      description: "Licensed boat rental in Blanes, Costa Brava. Powerful boats for advanced navigation. Requires boating license ICC, RYA or equivalent. Maximum freedom on Costa Brava.",
      keywords: "licensed boats blanes, boats with license, ICC boat rental, powerful boats costa brava"
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
    boatDetail: {
      title: "Rent {boatName} in Blanes | Costa Brava Rent a Boat",
      description: "Rent {boatName} in Blanes, Costa Brava. {capacity} people, {license}. Includes safety equipment and complete briefing.",
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
      title: "Lloguer Barques Blanes Sense Llicència | Costa Brava",
      description: "Lloguer de barques sense llicència i amb llicència a Blanes, Costa Brava. Des del Port de Blanes. 7 embarcacions per a 4-7 persones. Inclou snorkel i paddle surf.",
      keywords: "lloguer barques blanes, barques sense llicència costa brava, lloguer embarcacions blanes, costa brava rent boat, port blanes"
    },
    booking: {
      title: "Reservar Barque a Blanes | Costa Brava Rent a Boat",
      description: "Completa el formulari per reservar la teva barque a Blanes, Costa Brava. Barques sense llicència i amb llicència. Resposta ràpida per WhatsApp.",
      keywords: "reservar barque blanes, formulari reserva embarcació, booking barque costa brava"
    },
    faq: {
      title: "FAQ Lloguer Barques Blanes | Costa Brava",
      description: "Resol tots els teus dubtes sobre el lloguer de barques a Blanes, Costa Brava. Preus, requisits, què inclou, polítiques de cancel·lació i més.",
      keywords: "faq lloguer barques, preguntes freqüents embarcacions, dubtes lloguer barques costa brava"
    },
    locationBlanes: {
      title: "Lloguer Barques Blanes Sense Llicència | Port Blanes",
      description: "Lloguer de barques a Blanes, Costa Brava. Port de Blanes. Embarcacions sense llicència i amb llicència per a 4-7 persones.",
      keywords: "lloguer barques blanes port, embarcacions blanes costa brava, barques sense llicència blanes"
    },
    locationLloret: {
      title: "Barques a Lloret de Mar des de Blanes | Costa Brava",
      description: "Lloguer de barques per visitar Lloret de Mar des del Port de Blanes. Embarcacions sense llicència i amb llicència. Explora les platges de Lloret navegant des de Blanes.",
      keywords: "lloguer barques lloret de mar, visitar lloret en barque, excursió lloret des de blanes"
    },
    locationTossa: {
      title: "Barques a Tossa de Mar des de Blanes | Costa Brava",
      description: "Lloguer de barques per visitar Tossa de Mar des del Port de Blanes. 1 hora navegant fins al poble medieval més bonic de la Costa Brava. Embarcacions sense llicència i amb llicència.",
      keywords: "lloguer barques tossa de mar, visitar tossa en barque, excursió tossa des de blanes, vila vella tossa"
    },
    categoryLicenseFree: {
      title: "Barques Sense Llicència Blanes | Costa Brava",
      description: "Lloguer de barques sense llicència a Blanes, Costa Brava. Embarcacions de fins a 15 CV per a 4-7 persones. No necessites titulació nàutica. Explora les cales des del Port de Blanes.",
      keywords: "barques sense llicència blanes, lloguer barques sense títol, embarcacions sense permís costa brava, barques 15cv blanes"
    },
    categoryLicensed: {
      title: "Barques Amb Llicència Blanes | Costa Brava",
      description: "Lloguer de barques amb llicència a Blanes, Costa Brava. Embarcacions potents per a navegació avançada. Requereix titulació nàutica PER, PNB o superior. Màxima llibertat a la Costa Brava.",
      keywords: "barques amb llicència blanes, lloguer barques PER, embarcacions titulació nàutica, barques potents costa brava"
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
    }
  },
  fr: {
    home: {
      title: "Location Bateaux Blanes Sans Permis | Costa Brava",
      description: "Location de bateaux sans permis et avec permis à Blanes, Costa Brava. Depuis le Port de Blanes. 7 bateaux pour 4-7 personnes. Inclut snorkel et paddle surf.",
      keywords: "location bateaux blanes, bateaux sans permis costa brava, location embarcations blanes, costa brava rent boat, port blanes"
    },
    booking: {
      title: "Réserver un Bateau à Blanes | Costa Brava Rent a Boat",
      description: "Complétez le formulaire pour réserver votre bateau à Blanes, Costa Brava. Bateaux sans permis et avec permis. Réponse rapide par WhatsApp.",
      keywords: "réserver bateau blanes, formulaire réservation bateau, booking bateau costa brava"
    },
    faq: {
      title: "FAQ Location Bateaux Blanes | Costa Brava",
      description: "Résolvez tous vos doutes sur la location de bateaux à Blanes, Costa Brava. Prix, exigences, ce qui est inclus, politiques d'annulation et plus.",
      keywords: "faq location bateaux, questions fréquentes embarcations, doutes location bateaux costa brava"
    },
    locationBlanes: {
      title: "Location Bateaux Blanes Sans Permis | Port Blanes",
      description: "Location de bateaux à Blanes, Costa Brava. Port de Blanes. Bateaux sans permis et avec permis pour 4-7 personnes.",
      keywords: "location bateaux blanes port, embarcations blanes costa brava, bateaux sans permis blanes"
    },
    locationLloret: {
      title: "Bateaux vers Lloret de Mar depuis Blanes | Costa Brava",
      description: "Location de bateaux pour visiter Lloret de Mar depuis le Port de Blanes. Bateaux sans permis et avec permis. Explorez les plages de Lloret en naviguant depuis Blanes.",
      keywords: "location bateaux lloret de mar, visiter lloret en bateau, excursion lloret depuis blanes"
    },
    locationTossa: {
      title: "Bateaux vers Tossa de Mar depuis Blanes | Costa Brava",
      description: "Location de bateaux pour visiter Tossa de Mar depuis le Port de Blanes. 1 heure de navigation vers la plus belle ville médiévale de la Costa Brava. Bateaux sans permis et avec permis.",
      keywords: "location bateaux tossa de mar, visiter tossa en bateau, excursion tossa depuis blanes, vila vella tossa"
    },
    categoryLicenseFree: {
      title: "Bateaux Sans Permis Blanes | Costa Brava",
      description: "Location de bateaux sans permis à Blanes, Costa Brava. Embarcations jusqu'à 15 CV pour 4-7 personnes. Aucun permis bateau requis. Explorez les criques depuis le Port de Blanes.",
      keywords: "bateaux sans permis blanes, location bateaux sans license, embarcations sans permis costa brava, bateaux 15cv blanes"
    },
    categoryLicensed: {
      title: "Bateaux Avec Permis Blanes | Costa Brava",
      description: "Location de bateaux avec permis à Blanes, Costa Brava. Embarcations puissantes pour navigation avancée. Permis bateau requis ICC, permis côtier ou équivalent. Liberté maximale sur la Costa Brava.",
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
    }
  },
  de: {
    home: {
      title: "Bootsverleih Blanes Ohne Führerschein | Costa Brava",
      description: "Bootsverleih ohne Führerschein und mit Führerschein in Blanes, Costa Brava. Vom Hafen Blanes. 7 Boote für 4-7 Personen. Inklusive Schnorchel und Paddle Surf.",
      keywords: "bootsverleih blanes, boote ohne führerschein costa brava, bootscharter blanes, costa brava rent boat, hafen blanes"
    },
    booking: {
      title: "Boot Buchen Blanes | Costa Brava Rent a Boat",
      description: "Füllen Sie das Formular aus, um Ihr Boot in Blanes, Costa Brava zu buchen. Boote ohne und mit Führerschein. Schnelle WhatsApp-Antwort.",
      keywords: "boot buchen blanes, buchungsformular boot, boot reservierung costa brava"
    },
    faq: {
      title: "FAQ Bootsverleih Blanes | Costa Brava",
      description: "Lösen Sie alle Ihre Zweifel über Bootsverleih in Blanes, Costa Brava. Preise, Anforderungen, was enthalten ist, Stornierungsrichtlinien und mehr.",
      keywords: "faq bootsverleih, häufige fragen boote, zweifel bootsverleih costa brava"
    },
    locationBlanes: {
      title: "Bootsverleih Blanes Ohne Führerschein | Hafen Blanes",
      description: "Bootsverleih in Blanes, Costa Brava. Hafen von Blanes. Boote ohne Führerschein und mit Führerschein für 4-7 Personen.",
      keywords: "bootsverleih blanes hafen, boote blanes costa brava, boote ohne führerschein blanes"
    },
    locationLloret: {
      title: "Boote nach Lloret de Mar von Blanes | Costa Brava",
      description: "Bootsverleih für Lloret de Mar Besuch vom Hafen Blanes. Boote ohne Führerschein und mit Führerschein. Erkunden Sie Lloret Strände von Blanes aus.",
      keywords: "bootsverleih lloret de mar, lloret per boot besuchen, lloret ausflug von blanes"
    },
    locationTossa: {
      title: "Boote nach Tossa de Mar von Blanes | Costa Brava",
      description: "Bootsverleih für Tossa de Mar Besuch vom Hafen Blanes. 1 Stunde Segeln zur schönsten mittelalterlichen Stadt der Costa Brava. Boote ohne Führerschein und mit Führerschein.",
      keywords: "bootsverleih tossa de mar, tossa per boot besuchen, tossa ausflug von blanes, vila vella tossa"
    },
    categoryLicenseFree: {
      title: "Boote Ohne Führerschein Blanes | Costa Brava",
      description: "Bootsverleih ohne Führerschein in Blanes, Costa Brava. Boote bis 15 PS für 4-7 Personen. Kein Bootsführerschein erforderlich. Erkunden Sie Costa Brava Buchten vom Hafen Blanes.",
      keywords: "boote ohne führerschein blanes, bootsverleih ohne lizenz, boote ohne erlaubnis costa brava, 15ps boote blanes"
    },
    categoryLicensed: {
      title: "Boote Mit Führerschein Blanes | Costa Brava",
      description: "Bootsverleih mit Führerschein in Blanes, Costa Brava. Starke Boote für fortgeschrittene Navigation. Bootsführerschein ICC, SBF oder gleichwertig erforderlich. Maximale Freiheit an der Costa Brava.",
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
export function generateLocalBusinessSchema(language: Language = 'es') {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : BUSINESS_INFO.url;
  
  return {
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
      "validFrom": "2024-04-01",
      "validThrough": "2024-10-31"
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
  
  return {
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
    "vehicleModelDate": boatData.year || new Date().getFullYear(),
    "vehicleSeatingCapacity": boatData.capacity,
    "vehicleEngine": {
      "@type": "EngineSpecification",
      "enginePower": {
        "@type": "QuantitativeValue",
        "value": boatData.power,
        "unitText": "CV"
      }
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/barco/${boatData.id}`,
      "priceCurrency": "EUR",
      "price": boatData.pricePerHour,
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": boatData.pricePerHour,
        "priceCurrency": "EUR",
        "unitText": "hour"
      },
      "availability": "https://schema.org/InStock",
      "validFrom": "2024-04-01",
      "validThrough": "2024-10-31",
      "seller": {
        "@type": "LocalBusiness",
        "@id": `${baseUrl}/#organization`
      },
      "offeredBy": {
        "@type": "LocalBusiness", 
        "@id": `${baseUrl}/#organization`
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
}