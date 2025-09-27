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

// Base domain for canonical URLs - configurable for production
export const BASE_DOMAIN = typeof window !== 'undefined' 
  ? window.location.origin 
  : import.meta.env.VITE_BASE_DOMAIN || "https://costa-brava-rent-a-boat-blanes.replit.app";

// Language-specific SEO configurations
export const SEO_CONFIGS: Record<Language, Record<string, SEOConfig>> = {
  es: {
    home: {
      title: "Alquiler de barcos en Blanes (Costa Brava) sin licencia | Costa Brava Rent a Boat",
      description: "Alquiler de barcos sin licencia y con licencia en Blanes, Costa Brava. Desde Puerto de Blanes. 7 embarcaciones para 4-7 personas. Incluye snorkel y paddle surf.",
      keywords: "alquiler barcos blanes, barcos sin licencia costa brava, alquiler embarcaciones blanes, costa brava rent boat, puerto blanes"
    },
    faq: {
      title: "Preguntas Frecuentes (FAQ) - Alquiler de Barcos en Blanes | Costa Brava Rent a Boat",
      description: "Resuelve todas tus dudas sobre el alquiler de barcos en Blanes, Costa Brava. Precios, requisitos, qué incluye, políticas de cancelación y más. Sin licencia y con licencia.",
      keywords: "faq alquiler barcos, preguntas frecuentes embarcaciones, dudas alquiler barcos costa brava, información barcos blanes"
    },
    locationBlanes: {
      title: "Alquiler de Barcos en Blanes, Costa Brava - Sin Licencia | Costa Brava Rent a Boat",
      description: "Alquiler de barcos en Blanes, Costa Brava. Puerto de Blanes. Embarcaciones sin licencia y con licencia para 4-7 personas. Explora las calas de la Costa Brava desde Blanes.",
      keywords: "alquiler barcos blanes puerto, embarcaciones blanes costa brava, barcos sin licencia blanes, calas costa brava desde blanes"
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
      title: "Boat Rental in Blanes (Costa Brava) without license | Costa Brava Rent a Boat",
      description: "Boat rental without license and with license in Blanes, Costa Brava. From Port of Blanes. 7 boats for 4-7 people. Includes snorkel and paddle surf.",
      keywords: "boat rental blanes, boats without license costa brava, boat charter blanes, costa brava rent boat, blanes port"
    },
    faq: {
      title: "Frequently Asked Questions (FAQ) - Boat Rental in Blanes | Costa Brava Rent a Boat",
      description: "Solve all your doubts about boat rental in Blanes, Costa Brava. Prices, requirements, what's included, cancellation policies and more. Without license and with license.",
      keywords: "faq boat rental, frequently asked questions boats, boat rental costa brava info, blanes boats information"
    },
    locationBlanes: {
      title: "Boat Rental in Blanes, Costa Brava - Without License | Costa Brava Rent a Boat",
      description: "Boat rental in Blanes, Costa Brava. Port of Blanes. Boats without license and with license for 4-7 people. Explore Costa Brava coves from Blanes.",
      keywords: "boat rental blanes port, boats blanes costa brava, boats without license blanes, costa brava coves from blanes"
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
      title: "Lloguer de barques a Blanes (Costa Brava) sense llicència | Costa Brava Rent a Boat",
      description: "Lloguer de barques sense llicència i amb llicència a Blanes, Costa Brava. Des del Port de Blanes. 7 embarcacions per a 4-7 persones. Inclou snorkel i paddle surf.",
      keywords: "lloguer barques blanes, barques sense llicència costa brava, lloguer embarcacions blanes, costa brava rent boat, port blanes"
    },
    faq: {
      title: "Preguntes Freqüents (FAQ) - Lloguer de Barques a Blanes | Costa Brava Rent a Boat",
      description: "Resol tots els teus dubtes sobre el lloguer de barques a Blanes, Costa Brava. Preus, requisits, què inclou, polítiques de cancel·lació i més.",
      keywords: "faq lloguer barques, preguntes freqüents embarcacions, dubtes lloguer barques costa brava"
    },
    locationBlanes: {
      title: "Lloguer de Barques a Blanes, Costa Brava - Sense Llicència | Costa Brava Rent a Boat",
      description: "Lloguer de barques a Blanes, Costa Brava. Port de Blanes. Embarcacions sense llicència i amb llicència per a 4-7 persones.",
      keywords: "lloguer barques blanes port, embarcacions blanes costa brava, barques sense llicència blanes"
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
      title: "Location de bateaux à Blanes (Costa Brava) sans permis | Costa Brava Rent a Boat",
      description: "Location de bateaux sans permis et avec permis à Blanes, Costa Brava. Depuis le Port de Blanes. 7 bateaux pour 4-7 personnes. Inclut snorkel et paddle surf.",
      keywords: "location bateaux blanes, bateaux sans permis costa brava, location embarcations blanes, costa brava rent boat, port blanes"
    },
    faq: {
      title: "Questions Fréquentes (FAQ) - Location de Bateaux à Blanes | Costa Brava Rent a Boat",
      description: "Résolvez tous vos doutes sur la location de bateaux à Blanes, Costa Brava. Prix, exigences, ce qui est inclus, politiques d'annulation et plus.",
      keywords: "faq location bateaux, questions fréquentes embarcations, doutes location bateaux costa brava"
    },
    locationBlanes: {
      title: "Location de Bateaux à Blanes, Costa Brava - Sans Permis | Costa Brava Rent a Boat",
      description: "Location de bateaux à Blanes, Costa Brava. Port de Blanes. Bateaux sans permis et avec permis pour 4-7 personnes.",
      keywords: "location bateaux blanes port, embarcations blanes costa brava, bateaux sans permis blanes"
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
      title: "Bootsverleih in Blanes (Costa Brava) ohne Führerschein | Costa Brava Rent a Boat",
      description: "Bootsverleih ohne Führerschein und mit Führerschein in Blanes, Costa Brava. Vom Hafen Blanes. 7 Boote für 4-7 Personen. Inklusive Schnorchel und Paddle Surf.",
      keywords: "bootsverleih blanes, boote ohne führerschein costa brava, bootscharter blanes, costa brava rent boat, hafen blanes"
    },
    faq: {
      title: "Häufig gestellte Fragen (FAQ) - Bootsverleih in Blanes | Costa Brava Rent a Boat",
      description: "Lösen Sie alle Ihre Zweifel über Bootsverleih in Blanes, Costa Brava. Preise, Anforderungen, was enthalten ist, Stornierungsrichtlinien und mehr.",
      keywords: "faq bootsverleih, häufige fragen boote, zweifel bootsverleih costa brava"
    },
    locationBlanes: {
      title: "Bootsverleih in Blanes, Costa Brava - Ohne Führerschein | Costa Brava Rent a Boat",
      description: "Bootsverleih in Blanes, Costa Brava. Hafen von Blanes. Boote ohne Führerschein und mit Führerschein für 4-7 Personen.",
      keywords: "bootsverleih blanes hafen, boote blanes costa brava, boote ohne führerschein blanes"
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
      title: "Bootverhuur in Blanes (Costa Brava) zonder vaarbewijs | Costa Brava Rent a Boat",
      description: "Bootverhuur zonder vaarbewijs en met vaarbewijs in Blanes, Costa Brava. Vanaf Haven van Blanes. 7 boten voor 4-7 personen. Inclusief snorkel en paddle surf.",
      keywords: "bootverhuur blanes, boten zonder vaarbewijs costa brava, bootcharter blanes, costa brava rent boat, haven blanes"
    },
    faq: {
      title: "Veelgestelde Vragen (FAQ) - Bootverhuur in Blanes | Costa Brava Rent a Boat",
      description: "Los al je twijfels op over bootverhuur in Blanes, Costa Brava. Prijzen, vereisten, wat inbegrepen is, annuleringsbeleid en meer.",
      keywords: "faq bootverhuur, veelgestelde vragen boten, twijfels bootverhuur costa brava"
    },
    locationBlanes: {
      title: "Bootverhuur in Blanes, Costa Brava - Zonder Vaarbewijs | Costa Brava Rent a Boat",
      description: "Bootverhuur in Blanes, Costa Brava. Haven van Blanes. Boten zonder vaarbewijs en met vaarbewijs voor 4-7 personen.",
      keywords: "bootverhuur blanes haven, boten blanes costa brava, boten zonder vaarbewijs blanes"
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
      title: "Noleggio barche a Blanes (Costa Brava) senza patente | Costa Brava Rent a Boat",
      description: "Noleggio barche senza patente e con patente a Blanes, Costa Brava. Dal Porto di Blanes. 7 barche per 4-7 persone. Include snorkel e paddle surf.",
      keywords: "noleggio barche blanes, barche senza patente costa brava, charter barche blanes, costa brava rent boat, porto blanes"
    },
    faq: {
      title: "Domande Frequenti (FAQ) - Noleggio Barche a Blanes | Costa Brava Rent a Boat",
      description: "Risolvi tutti i tuoi dubbi sul noleggio barche a Blanes, Costa Brava. Prezzi, requisiti, cosa è incluso, politiche di cancellazione e altro.",
      keywords: "faq noleggio barche, domande frequenti barche, dubbi noleggio barche costa brava"
    },
    locationBlanes: {
      title: "Noleggio Barche a Blanes, Costa Brava - Senza Patente | Costa Brava Rent a Boat",
      description: "Noleggio barche a Blanes, Costa Brava. Porto di Blanes. Barche senza patente e con patente per 4-7 persone.",
      keywords: "noleggio barche blanes porto, barche blanes costa brava, barche senza patente blanes"
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
      title: "Аренда лодок в Бланесе (Коста-Брава) без лицензии | Costa Brava Rent a Boat",
      description: "Аренда лодок без лицензии и с лицензией в Бланесе, Коста-Брава. Из порта Бланес. 7 лодок для 4-7 человек. Включает снорклинг и SUP.",
      keywords: "аренда лодок бланес, лодки без лицензии коста брава, чартер лодок бланес, costa brava rent boat, порт бланес"
    },
    faq: {
      title: "Часто задаваемые вопросы (FAQ) - Аренда лодок в Бланесе | Costa Brava Rent a Boat",
      description: "Решите все ваши сомнения по аренде лодок в Бланесе, Коста-Брава. Цены, требования, что включено, политика отмены и многое другое.",
      keywords: "faq аренда лодок, часто задаваемые вопросы лодки, сомнения аренда лодок коста брава"
    },
    locationBlanes: {
      title: "Аренда лодок в Бланесе, Коста-Брава - Без лицензии | Costa Brava Rent a Boat",
      description: "Аренда лодок в Бланесе, Коста-Брава. Порт Бланес. Лодки без лицензии и с лицензией для 4-7 человек.",
      keywords: "аренда лодок бланес порт, лодки бланес коста брава, лодки без лицензии бланес"
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
    lang: 'x-default',
    url: defaultUrl
  });

  return hreflangLinks;
};

// Get page path based on page name
const getPagePath = (pageName: string): string => {
  const paths: Record<string, string> = {
    home: '',
    faq: 'faq',
    locationBlanes: 'alquiler-barcos-blanes',
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