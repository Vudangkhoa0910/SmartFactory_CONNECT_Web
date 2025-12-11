import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

export type Language = 'vi' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: Record<string, string>;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'ja' ? 'ja' : 'vi') as Language;
  });

  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/translations/${language}`);
        
        if (response.data.success) {
          setTranslations(response.data.data);
          console.log(`[i18n] Loaded ${Object.keys(response.data.data).length} translations for ${language}`);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to empty object or default translations
        setTranslations({});
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    console.log(`[i18n] Language switched to ${lang}`);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[key] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    translations,
    loading,
  };

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
