// components/common/TranslatedText.tsx - Component for rendering translated text
import React from 'react';
import { useDynamicText } from '../../hooks/useDynamicText';

interface TranslatedTextProps {
  /** Original text to translate */
  text: string;
  /** HTML element to render (default: span) */
  as?: keyof JSX.IntrinsicElements;
  /** Additional className */
  className?: string;
  /** Show loading indicator */
  showLoading?: boolean;
  /** Fallback text while loading */
  fallback?: string;
  /** Additional context for translation */
  context?: string;
  /** Children to render (optional, will override text) */
  children?: React.ReactNode;
}

/**
 * Component to display dynamically translated text
 * 
 * @example
 * <TranslatedText text={incident.title} as="h1" className="text-xl" />
 * 
 * @example
 * <TranslatedText text={description} showLoading>
 *   {(translatedText) => <p>{translatedText}</p>}
 * </TranslatedText>
 */
export const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  as: Component = 'span',
  className = '',
  showLoading = false,
  fallback,
  context,
  children,
}) => {
  const { text: translatedText, isLoading } = useDynamicText(text, { context });

  // If children is a function, call it with translated text
  if (typeof children === 'function') {
    return children(translatedText, isLoading);
  }

  // Show loading indicator
  if (isLoading && showLoading) {
    return (
      <Component className={`${className} animate-pulse`}>
        {fallback || text}
        <span className="inline-block w-2 h-2 ml-1 bg-gray-400 rounded-full animate-bounce" />
      </Component>
    );
  }

  return (
    <Component className={className}>
      {translatedText}
    </Component>
  );
};

interface StaticTextProps {
  /** Translation key */
  i18nKey: string;
  /** HTML element to render (default: span) */
  as?: keyof JSX.IntrinsicElements;
  /** Additional className */
  className?: string;
  /** Fallback if key not found */
  fallback?: string;
}

/**
 * Component to display static translated text (from JSON files)
 * For UI labels, buttons, menus - instant, no API call
 * 
 * @example
 * <T i18nKey="button.save" as="span" />
 * <T i18nKey="menu.dashboard" />
 */
export const T: React.FC<StaticTextProps> = ({
  i18nKey,
  as: Component = 'span',
  className = '',
  fallback,
}) => {
  // Import useTranslation here to avoid circular dependency
  const { useTranslation } = require('../../contexts/LanguageContext');
  const { t } = useTranslation();

  return (
    <Component className={className}>
      {t(i18nKey, fallback)}
    </Component>
  );
};

export default TranslatedText;
