// hooks/useDynamicText.ts - Hook for translating dynamic CRUD content
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface UseDynamicTextOptions {
  /** Whether to auto-translate when text or language changes */
  autoTranslate?: boolean;
  /** Debounce delay in ms (default: 300) */
  debounce?: number;
  /** Additional context for better translation quality */
  context?: string;
}

interface UseDynamicTextReturn {
  /** Translated text (or original if not yet translated) */
  text: string;
  /** Whether translation is in progress */
  isLoading: boolean;
  /** Manually trigger translation */
  translate: () => Promise<void>;
  /** Original text */
  original: string;
}

/**
 * Hook to translate a single piece of dynamic text
 * 
 * @example
 * const { text, isLoading } = useDynamicText(incident.title);
 * return <h1>{text}</h1>;
 */
export function useDynamicText(
  originalText: string,
  options: UseDynamicTextOptions = {}
): UseDynamicTextReturn {
  const { autoTranslate = true, debounce = 300 } = options;
  const { language, translateDynamic } = useLanguage();
  
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const translate = useCallback(async () => {
    if (!originalText || language === 'vi') {
      setTranslatedText(originalText);
      return;
    }

    setIsLoading(true);
    try {
      const result = await translateDynamic(originalText, { context: options.context });
      if (mountedRef.current) {
        setTranslatedText(result);
      }
    } catch (error) {
      console.error('[useDynamicText] Translation failed:', error);
      if (mountedRef.current) {
        setTranslatedText(originalText);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [originalText, language, translateDynamic, options.context]);

  // Auto-translate with debounce
  useEffect(() => {
    if (!autoTranslate) return;
    
    if (language === 'vi') {
      setTranslatedText(originalText);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      translate();
    }, debounce);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [originalText, language, autoTranslate, debounce, translate]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    text: translatedText,
    isLoading,
    translate,
    original: originalText,
  };
}

interface UseDynamicTextsOptions {
  /** Whether to auto-translate when texts or language changes */
  autoTranslate?: boolean;
  /** Debounce delay in ms (default: 500) */
  debounce?: number;
}

interface UseDynamicTextsReturn {
  /** Array of translated texts */
  texts: string[];
  /** Whether translation is in progress */
  isLoading: boolean;
  /** Manually trigger translation */
  translate: () => Promise<void>;
}

/**
 * Hook to translate multiple pieces of dynamic text (batch)
 * More efficient than multiple useDynamicText calls
 * 
 * @example
 * const titles = incidents.map(i => i.title);
 * const { texts: translatedTitles } = useDynamicTexts(titles);
 */
export function useDynamicTexts(
  originalTexts: string[],
  options: UseDynamicTextsOptions = {}
): UseDynamicTextsReturn {
  const { autoTranslate = true, debounce = 500 } = options;
  const { language, translateBatch } = useLanguage();
  
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(originalTexts);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const translate = useCallback(async () => {
    if (!originalTexts.length || language === 'vi') {
      setTranslatedTexts(originalTexts);
      return;
    }

    setIsLoading(true);
    try {
      const results = await translateBatch(originalTexts);
      if (mountedRef.current) {
        setTranslatedTexts(results);
      }
    } catch (error) {
      console.error('[useDynamicTexts] Batch translation failed:', error);
      if (mountedRef.current) {
        setTranslatedTexts(originalTexts);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [originalTexts, language, translateBatch]);

  // Auto-translate with debounce
  useEffect(() => {
    if (!autoTranslate) return;
    
    if (language === 'vi') {
      setTranslatedTexts(originalTexts);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      translate();
    }, debounce);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [JSON.stringify(originalTexts), language, autoTranslate, debounce, translate]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    texts: translatedTexts,
    isLoading,
    translate,
  };
}

/**
 * Hook to get translated field from an object
 * Checks for _ja suffix field first, then translates dynamically
 * 
 * @example
 * const title = useTranslatedField(incident, 'title');
 */
export function useTranslatedField<T extends Record<string, unknown>>(
  record: T | null | undefined,
  fieldName: keyof T & string,
  options: UseDynamicTextOptions = {}
): UseDynamicTextReturn {
  const { language } = useLanguage();
  
  // Check if pre-translated field exists (e.g., title_ja)
  const jaFieldName = `${fieldName}_ja` as keyof T;
  const hasJaField = record && language === 'ja' && record[jaFieldName];
  
  const originalValue = record ? String(record[fieldName] || '') : '';
  const preTranslated = hasJaField ? String(record[jaFieldName]) : null;
  
  const dynamicResult = useDynamicText(
    preTranslated || originalValue,
    { ...options, autoTranslate: !preTranslated && options.autoTranslate !== false }
  );
  
  // If pre-translated, return that value directly
  if (preTranslated) {
    return {
      text: preTranslated,
      isLoading: false,
      translate: dynamicResult.translate,
      original: originalValue,
    };
  }
  
  return dynamicResult;
}

export default {
  useDynamicText,
  useDynamicTexts,
  useTranslatedField,
};
