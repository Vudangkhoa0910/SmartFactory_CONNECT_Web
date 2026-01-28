// contexts/LanguageContext.tsx - Simplified i18n Context (Static Only)
import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { flatTranslations, t as staticT, Language } from '../i18n';
import api from '../services/api';

// Re-export Language type
export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language, saveToServer?: boolean) => void;

  // Static translation (UI labels, buttons, menus - instant)
  // Updated to support variable interpolation
  t: (key: string, variables?: Record<string, string | number>, fallback?: string) => string;

  // Legacy support
  translations: Record<string, string>;
  loading: boolean;

  // Initialize from user preference
  initFromUser: (preferredLanguage?: string) => void;
}

interface LanguageProviderProps {
  children: ReactNode;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'ja' ? 'ja' : 'vi') as Language;
  });

  // Initialize language from user preference (called after login)
  const initFromUser = useCallback((preferredLanguage?: string) => {
    if (preferredLanguage === 'ja' || preferredLanguage === 'vi') {
      setLanguageState(preferredLanguage);
      localStorage.setItem('language', preferredLanguage);
      document.documentElement.lang = preferredLanguage;
      console.log(`[i18n] Language initialized from user preference: ${preferredLanguage}`);
    }
  }, []);

  // Change language
  const setLanguage = useCallback(async (lang: Language, saveToServer: boolean = true) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    console.log(`[i18n] Language switched to ${lang}`);

    // Save to server if user is logged in
    if (saveToServer) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await api.put('/users/preferences', { preferred_language: lang });
          // Update stored user data
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            userData.preferred_language = lang;
            localStorage.setItem('user', JSON.stringify(userData));
          }
          console.log(`[i18n] Language preference saved to server`);
        }
      } catch (error) {
        console.warn('[i18n] Failed to save language preference to server:', error);
      }
    }
  }, []);

  // Set document language on mount
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Static translation function (instant, from local JSON)
  // Optimized and now supports variable interpolation
  const t = useCallback((key: string, variables?: Record<string, string | number>, fallback?: string): string => {
    // Re-use the t function from i18n/index.ts which now supports variables
    const result = staticT(key, variables, language);

    if (result !== key) return result;

    // Return fallback or key
    return fallback || key;
  }, [language]);

  // Legacy support - translations object
  const translations = useMemo(() => flatTranslations[language], [language]);

  const value: LanguageContextType = useMemo(() => ({
    language,
    setLanguage,
    t,
    translations,
    loading: false,
    initFromUser,
  }), [language, setLanguage, t, translations, initFromUser]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Convenience hook for just static translations
export const useTranslation = () => {
  const { t, language, setLanguage } = useLanguage();
  return { t, language, setLanguage };
};
