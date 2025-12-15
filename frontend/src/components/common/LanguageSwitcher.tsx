import React from 'react';
import { useTranslation, Language } from '../../contexts/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'default' }) => {
  const { language, setLanguage } = useTranslation();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  // Compact variant - single button that toggles
  if (variant === 'compact') {
    const nextLang = language === 'vi' ? 'ja' : 'vi';
    return (
      <button
        onClick={() => handleLanguageChange(nextLang)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium 
          text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 
          transition-all duration-200"
        title={language === 'vi' ? '日本語に切り替え' : 'Chuyển sang Tiếng Việt'}
      >
        <span>{language.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
      <button
        onClick={() => handleLanguageChange('vi')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          language === 'vi'
            ? 'bg-white text-gray-900 shadow-md border-2 border-red-500 dark:bg-gray-700 dark:text-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'
        }`}
        title="Tiếng Việt"
      >
        VI
      </button>
      <button
        onClick={() => handleLanguageChange('ja')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          language === 'ja'
            ? 'bg-white text-gray-900 shadow-md border-2 border-red-500 dark:bg-gray-700 dark:text-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'
        }`}
        title="日本語"
      >
        JA
      </button>
    </div>
  );
};
