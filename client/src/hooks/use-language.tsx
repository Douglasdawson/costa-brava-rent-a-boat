import { useState, useEffect, createContext, useContext } from 'react';

// Supported languages
export type Language = 'es' | 'ca' | 'fr' | 'de' | 'nl' | 'it' | 'ru' | 'en';

// Language detection function
function detectBrowserLanguage(): Language {
  const browserLang = navigator.language || navigator.languages?.[0] || 'es';
  const langCode = browserLang.toLowerCase().split('-')[0];
  
  // Map browser language codes to supported languages
  const languageMap: Record<string, Language> = {
    'es': 'es', // Spanish
    'ca': 'ca', // Catalan
    'fr': 'fr', // French
    'de': 'de', // German
    'nl': 'nl', // Dutch
    'it': 'it', // Italian
    'ru': 'ru', // Russian
    'en': 'en'  // English
  };
  
  return languageMap[langCode] || 'es'; // Default to Spanish
}

// Language context
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider component
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved language preference
    const savedLanguage = localStorage.getItem('costa-brava-language') as Language;
    
    if (savedLanguage && ['es', 'ca', 'fr', 'de', 'nl', 'it', 'ru', 'en'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    } else {
      // Detect browser language and save it
      const detectedLanguage = detectBrowserLanguage();
      setLanguageState(detectedLanguage);
      localStorage.setItem('costa-brava-language', detectedLanguage);
    }
    
    setIsLoading(false);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('costa-brava-language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}