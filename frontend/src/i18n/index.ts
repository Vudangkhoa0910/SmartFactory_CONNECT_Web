// i18n/index.ts - Translation system entry point
import viTranslations from './locales/vi.json';
import jaTranslations from './locales/ja.json';

export type Language = 'vi' | 'ja';

// Static translations object
export const staticTranslations: Record<Language, Record<string, unknown>> = {
  vi: viTranslations,
  ja: jaTranslations,
};

/**
 * Get nested value from object using dot notation
 * @example getNestedValue({ a: { b: 'c' } }, 'a.b') // returns 'c'
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof result === 'string' ? result : path;
}

/**
 * Flatten nested translations for API compatibility
 */
export function flattenTranslations(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTranslations(value as Record<string, unknown>, newKey));
    } else if (typeof value === 'string') {
      result[newKey] = value;
    }
  }
  
  return result;
}

// Pre-flattened translations for faster lookups
export const flatTranslations: Record<Language, Record<string, string>> = {
  vi: flattenTranslations(viTranslations),
  ja: flattenTranslations(jaTranslations),
};

/**
 * Get static translation by key
 * Supports both dot notation and nested access
 */
export function t(key: string, language: Language = 'vi'): string {
  // First try flat lookup (faster)
  const flatResult = flatTranslations[language][key];
  if (flatResult) return flatResult;
  
  // Then try nested lookup
  return getNestedValue(staticTranslations[language], key);
}

export default {
  staticTranslations,
  flatTranslations,
  t,
  getNestedValue,
  flattenTranslations,
};
