import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { useLocation } from 'wouter';
import { trackLanguageChange } from "@/utils/analytics";
import {
  isValidLang,
  getLocalizedPath,
  switchLanguagePath,
} from "@shared/i18n-routes";
import type { LangCode } from "@shared/seoConstants";
import { SUPPORTED_LANGUAGES } from "@shared/seoConstants";
import { langLoaders } from '../i18n/loaders';
import { registerEsFallback } from '@/lib/translations';

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

/**
 * Resolve the language the app will boot with, using the same priority
 * order as the provider effect (path > ?lang > localStorage > browser).
 * Used by main.tsx to fetch the locale bundle BEFORE mounting React, so the
 * SSR fallback stays on screen during the fetch (no blank frame, no CLS).
 */
export function detectInitialLanguage(): Language {
  const pathLang = detectLangFromPath();
  if (pathLang) return pathLang;
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang && isValidLang(urlLang)) return urlLang as Language;
  const saved = localStorage.getItem('costa-brava-language');
  if (saved && isValidLang(saved)) return saved as Language;
  return detectBrowserLanguage();
}

let initialSeed: { lang: Language; bundle: Record<string, any> } | null = null;
export function seedInitialLanguage(lang: Language, bundle: Record<string, any>): void {
  initialSeed = { lang, bundle };
  if (lang === 'es') registerEsFallback(bundle);
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
  currentTranslation: Record<string, any>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialSeed?.lang ?? 'es');
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  // No language is bundled eagerly anymore (load audit 2026-06-11, A2):
  // the active locale chunk is fetched on mount (the server emits a
  // per-locale <link rel="modulepreload"> so there is no extra waterfall)
  // and Spanish is additionally idle-loaded as the deep-merge safety net.
  const [loadedLangs, setLoadedLangs] = useState<Record<string, Record<string, any>>>(() =>
    initialSeed ? { [initialSeed.lang]: initialSeed.bundle } : {}
  );

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

    // 4. Detect from browser. Also persist as a cookie so the server-side root
    // language negotiation (server/index.ts) honors this preference on the next
    // visit to the bare domain.
    const detectedLanguage = detectBrowserLanguage();
    setLanguageState(detectedLanguage);
    localStorage.setItem('costa-brava-language', detectedLanguage);
    document.cookie = `costa-brava-language=${detectedLanguage};path=/;max-age=31536000;SameSite=Lax`;
    setIsLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Lazy-load the active language translation file if not already cached
  useEffect(() => {
    if (loadedLangs[language]) return;
    const loader = langLoaders[language];
    if (loader) {
      loader().then(trans => {
        if (language === 'es') registerEsFallback(trans);
        setLoadedLangs(prev => ({ ...prev, [language]: trans }));
      });
    }
  }, [language, loadedLangs]);

  // Idle-load the Spanish reference bundle for non-es locales: it backs the
  // deep-merge fallback in useTranslations without sitting on the critical
  // path of foreign-market visitors.
  useEffect(() => {
    if (language === 'es') return;
    const load = () => {
      langLoaders.es().then(trans => {
        registerEsFallback(trans);
        setLoadedLangs(prev => (prev.es ? prev : { ...prev, es: trans }));
      });
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(load, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(load, 2500);
    return () => clearTimeout(id);
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

  // Keep showing the previous bundle during a runtime language switch (no
  // blank flash); only the very first render has nothing to show.
  const currentTranslation =
    loadedLangs[language] ?? Object.values(loadedLangs)[0] ?? null;

  // Memoize so the ~84 components consuming useTranslations()/useLanguage()
  // only re-render when one of these values actually changes, not on every
  // provider render.
  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      isLoading,
      localizedPath: localizedPathFn,
      switchLanguageUrl: switchLanguageUrlFn,
      currentTranslation: (currentTranslation ?? {}) as Record<string, any>,
    }),
    [language, setLanguage, isLoading, localizedPathFn, switchLanguageUrlFn, currentTranslation],
  );

  // Gate the tree until the first locale bundle arrives (~one RTT, fetched
  // in parallel with the entry thanks to the server-emitted modulepreload).
  // Rendering with a null translation object would crash the 84 consumers.
  if (!currentTranslation) {
    return null;
  }

  return (
    <LanguageContext.Provider value={contextValue}>
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
