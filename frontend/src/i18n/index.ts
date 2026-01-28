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
 * Supports dot notation, nested access, and variable interpolation
 * Interpolation syntax: {{variableName}}
 */
export function t(key: string, variables?: Record<string, string | number>, language: Language = 'vi'): string {
  // Try flat lookup (faster)
  let result = flatTranslations[language][key];

  // If not in flat, try nested lookup
  if (!result) {
    const nestedResult = getNestedValue(staticTranslations[language], key);
    if (nestedResult !== key) {
      result = nestedResult;
    }
  }

  // Fallback to key itself
  if (!result) {
    result = key;
  }

  // Handle variable interpolation
  if (result !== key && variables) {
    Object.entries(variables).forEach(([vKey, vValue]) => {
      result = (result as string).replace(new RegExp(`{{${vKey}}}`, 'g'), String(vValue));
    });
  }

  return result;
}

export default {
  staticTranslations,
  flatTranslations,
  t,
  getNestedValue,
  flattenTranslations,
};
