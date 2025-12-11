import React from 'react';
import { useLanguage, Language } from '../../contexts/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

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
