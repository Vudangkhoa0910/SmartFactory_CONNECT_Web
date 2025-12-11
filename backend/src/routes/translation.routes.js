const express = require('express');
const router = express.Router();
const {
  getTranslationsByLanguage,
  translateText,
  batchTranslate,
  getTranslationStats,
  testTranslateAPI
} = require('../controllers/translation.controller');

// Public routes (no auth required for testing)

/**
 * @route   GET /api/translations/:lang
 * @desc    Get all static translations for a language
 * @access  Public
 */
router.get('/:lang', getTranslationsByLanguage);

/**
 * @route   POST /api/translations/translate
 * @desc    Translate a single text
 * @access  Public
 */
router.post('/translate', translateText);

/**
 * @route   POST /api/translations/batch
 * @desc    Batch translate multiple texts
 * @access  Public
 */
router.post('/batch', batchTranslate);

/**
 * @route   GET /api/translations/stats/overview
 * @desc    Get translation cache statistics
 * @access  Public
 */
router.get('/stats/overview', getTranslationStats);

/**
 * @route   GET /api/translations/test/api
 * @desc    Test Google Translate API connection
 * @access  Public
 */
router.get('/test/api', testTranslateAPI);

module.exports = router;
