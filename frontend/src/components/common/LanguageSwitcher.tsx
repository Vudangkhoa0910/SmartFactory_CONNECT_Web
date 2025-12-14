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
        <span>{language === 'vi' ? '🇻🇳' : '🇯🇵'}</span>
        <span>{language.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
      <button
        onClick={() => handleLanguageChange('vi')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          language === 'vi'
            ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="Tiếng Việt"
      >
        🇻🇳 VI
      </button>
      <button
        onClick={() => handleLanguageChange('ja')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          language === 'ja'
            ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="日本語"
      >
        🇯🇵 JA
      </button>
    </div>
  );
};
