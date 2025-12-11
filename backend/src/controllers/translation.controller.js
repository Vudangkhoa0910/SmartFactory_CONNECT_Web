const TranslationService = require('../services/translation.service');
const { asyncHandler, AppError } = require('../middlewares/error.middleware');
const db = require('../config/database');

/**
 * Get all static translations for a language
 * GET /api/translations/:lang
 */
const getTranslationsByLanguage = asyncHandler(async (req, res) => {
  const { lang } = req.params;
  
  if (!['vi', 'ja'].includes(lang)) {
    throw new AppError('Invalid language. Supported: vi, ja', 400);
  }
  
  // Try to get from database first
  try {
    const query = 'SELECT key, vi, ja FROM translations';
    const result = await db.query(query);
    
    const translations = {};
    result.rows.forEach(row => {
      translations[row.key] = lang === 'ja' ? row.ja : row.vi;
    });
    
    res.json({
      success: true,
      data: translations,
      count: Object.keys(translations).length
    });
    
  } catch (error) {
    // Fallback to mock translations if database not ready
    console.warn('Database translations not available, using mock data');
    const translations = TranslationService.getAllStaticTranslations(lang);
    
    res.json({
      success: true,
      data: translations,
      count: Object.keys(translations).length,
      source: 'mock'
    });
  }
});

/**
 * Translate text (for testing)
 * POST /api/translations/translate
 */
const translateText = asyncHandler(async (req, res) => {
  const { text, sourceLang = 'vi', targetLang = 'ja', useMock = true } = req.body;
  
  if (!text) {
    throw new AppError('Text is required', 400);
  }
  
  const translated = await TranslationService.translateText(
    text, 
    sourceLang, 
    targetLang, 
    useMock
  );
  
  res.json({
    success: true,
    data: {
      original: text,
      translated,
      sourceLang,
      targetLang,
      method: useMock ? 'mock' : 'google_free'
    }
  });
});

/**
 * Batch translate multiple texts
 * POST /api/translations/batch
 */
const batchTranslate = asyncHandler(async (req, res) => {
  const { texts, sourceLang = 'vi', targetLang = 'ja', useMock = true } = req.body;
  
  if (!texts || !Array.isArray(texts)) {
    throw new AppError('Texts array is required', 400);
  }
  
  const results = await TranslationService.batchTranslate(
    texts, 
    sourceLang, 
    targetLang, 
    useMock
  );
  
  const response = texts.map((text, index) => ({
    original: text,
    translated: results[index]
  }));
  
  res.json({
    success: true,
    data: response,
    count: response.length
  });
});

/**
 * Get translation statistics
 * GET /api/translations/stats
 */
const getTranslationStats = asyncHandler(async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_cached,
        COUNT(CASE WHEN is_verified THEN 1 END) as verified,
        COUNT(CASE WHEN translation_method = 'google_free' THEN 1 END) as google_free,
        COUNT(CASE WHEN translation_method = 'manual' THEN 1 END) as manual,
        SUM(usage_count) as total_usage
      FROM translation_cache
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    res.json({
      success: true,
      data: {
        total_cached: 0,
        verified: 0,
        google_free: 0,
        manual: 0,
        total_usage: 0,
        message: 'Database not initialized yet'
      }
    });
  }
});

/**
 * Test Google Translate API connection
 * GET /api/translations/test
 */
const testTranslateAPI = asyncHandler(async (req, res) => {
  const testText = 'Xin chào';
  
  try {
    // Test with real API
    const translated = await TranslationService.translateText(testText, 'vi', 'ja', false);
    
    res.json({
      success: true,
      message: 'Google Translate API is working',
      test: {
        original: testText,
        translated,
        expected: 'こんにちは'
      }
    });
    
  } catch (error) {
    res.json({
      success: false,
      message: 'Google Translate API test failed',
      error: error.message,
      fallback: 'Using mock translations'
    });
  }
});

module.exports = {
  getTranslationsByLanguage,
  translateText,
  batchTranslate,
  getTranslationStats,
  testTranslateAPI
};
