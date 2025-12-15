/**
 * Multilingual Helper Functions
 * Utility functions for handling vi/ja content
 */

/**
 * Get localized field name based on language
 * @param {string} fieldName - Original field name (e.g., 'title')
 * @param {string} lang - Language code ('vi' or 'ja')
 * @returns {string} - Localized field name (e.g., 'title_ja' for Japanese)
 */
function getLocalizedField(fieldName, lang) {
    if (lang === 'ja') {
        return `${fieldName}_ja`;
    }
    return fieldName; // Default Vietnamese
}

/**
 * Build SELECT clause with localized fields
 * Uses COALESCE to fallback to Vietnamese if Japanese is null
 * 
 * @param {string[]} fields - Array of field names to localize
 * @param {string} lang - Language code ('vi' or 'ja')
 * @param {string} tableAlias - Table alias (e.g., 'n' for news)
 * @returns {string} - SQL SELECT clause
 * 
 * Example: buildLocalizedSelect(['title', 'content'], 'ja', 'n')
 * Returns: "COALESCE(n.title_ja, n.title) as title, COALESCE(n.content_ja, n.content) as content"
 */
function buildLocalizedSelect(fields, lang, tableAlias = '') {
    const prefix = tableAlias ? `${tableAlias}.` : '';

    if (lang !== 'ja') {
        // Vietnamese - just return original fields
        return fields.map(f => `${prefix}${f}`).join(', ');
    }

    // Japanese - use COALESCE to fallback to Vietnamese
    return fields.map(f =>
        `COALESCE(${prefix}${f}_ja, ${prefix}${f}) as ${f}`
    ).join(', ');
}

/**
 * Get localized content from an object
 * 
 * @param {Object} obj - Object with vi/ja fields
 * @param {string} field - Field name (e.g., 'title')
 * @param {string} lang - Language code
 * @returns {string} - Localized value
 */
function getLocalizedValue(obj, field, lang) {
    if (lang === 'ja') {
        return obj[`${field}_ja`] || obj[field];
    }
    return obj[field];
}

/**
 * Set localized content based on language
 * 
 * @param {string} field - Field name (e.g., 'title')
 * @param {string} value - Value to set
 * @param {string} lang - Language code
 * @returns {Object} - Object with field set to correct column
 */
function setLocalizedValue(field, value, lang) {
    if (lang === 'ja') {
        return { [`${field}_ja`]: value };
    }
    return { [field]: value };
}

/**
 * Supported languages
 */
const SUPPORTED_LANGUAGES = ['vi', 'ja'];

/**
 * Default language
 */
const DEFAULT_LANGUAGE = 'vi';

/**
 * Validate language code
 */
function isValidLanguage(lang) {
    return SUPPORTED_LANGUAGES.includes(lang);
}

/**
 * Get language from request (header, query, or user preference)
 */
function getLanguageFromRequest(req) {
    // 1. Check user preference (authoritative default)
    if (req.user && req.user.preferred_language) {
        const pref = String(req.user.preferred_language).substring(0, 2);
        if (isValidLanguage(pref)) {
            return pref;
        }
    }

    // 2. Check query parameter (optional override)
    if (req.query.lang && isValidLanguage(req.query.lang)) {
        return req.query.lang;
    }

    // 3. Check header (optional override)
    const headerLang = req.headers['x-language'] || req.headers['accept-language'];
    if (headerLang && isValidLanguage(headerLang.substring(0, 2))) {
        return headerLang.substring(0, 2);
    }

    return DEFAULT_LANGUAGE;
}

module.exports = {
    getLocalizedField,
    buildLocalizedSelect,
    getLocalizedValue,
    setLocalizedValue,
    getLanguageFromRequest,
    isValidLanguage,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE
};
