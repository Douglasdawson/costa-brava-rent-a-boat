import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useLocation } from 'wouter';
import { trackLanguageChange } from "@/utils/analytics";
import {
  isValidLang,
  getLocalizedPath,
  switchLanguagePath,
} from "@shared/i18n-routes";
import type { LangCode } from "@shared/seoConstants";
import { SUPPORTED_LANGUAGES } from "@shared/seoConstants";

export type Language = LangCode;

export { SUPPORTED_LANGUAGES };

function detectBrowserLanguage(): Language {
  const browserLang = navigator.language || navigator.languages?.[0] || 'es';
  const langCode = browserLang.toLowerCase().split('-')[0];

  if (isValidLang(langCode)) {
    return langCode;
  }
  return 'es';
}

function detectLangFromPath(): Language | null {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isValidLang(segments[0])) {
    return segments[0] as Language;
  }
  return null;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
  localizedPath: (pageKey: string, param?: string) => string;
  switchLanguageUrl: (targetLang: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // 1. Check URL path first segment (highest priority)
    const pathLang = detectLangFromPath();
    if (pathLang) {
      setLanguageState(pathLang);
      localStorage.setItem('costa-brava-language', pathLang);
      setIsLoading(false);
      return;
    }

    // 2. Backward compatibility: check ?lang= query param
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && isValidLang(urlLang)) {
      setLanguageState(urlLang as Language);
      localStorage.setItem('costa-brava-language', urlLang);
      setIsLoading(false);
      return;
    }

    // 3. Check localStorage
    const savedLanguage = localStorage.getItem('costa-brava-language');
    if (savedLanguage && isValidLang(savedLanguage)) {
      setLanguageState(savedLanguage as Language);
      setIsLoading(false);
      return;
    }

    // 4. Detect from browser
    const detectedLanguage = detectBrowserLanguage();
    setLanguageState(detectedLanguage);
    localStorage.setItem('costa-brava-language', detectedLanguage);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    trackLanguageChange(language, lang);
    setLanguageState(lang);
    localStorage.setItem('costa-brava-language', lang);
    document.cookie = `costa-brava-language=${lang};path=/;max-age=31536000;SameSite=Lax`;

    const currentPath = window.location.pathname;
    const newPath = switchLanguagePath(currentPath, lang);
    setLocation(newPath);
  }, [language, setLocation]);

  const localizedPathFn = useCallback((pageKey: string, param?: string) => {
    return getLocalizedPath(
      pageKey as Parameters<typeof getLocalizedPath>[0],
      language,
      param ? { slug: param } : undefined
    );
  }, [language]);

  const switchLanguageUrlFn = useCallback((targetLang: Language) => {
    return switchLanguagePath(window.location.pathname, targetLang);
  }, []);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      isLoading,
      localizedPath: localizedPathFn,
      switchLanguageUrl: switchLanguageUrlFn,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
