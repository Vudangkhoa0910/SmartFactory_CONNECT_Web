const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const newsController = require('../controllers/news.controller');
const { authenticate, authorizeLevel } = require('../middlewares/auth.middleware');
const { uploadNewsFiles } = require('../middlewares/upload.middleware');
const { validate, pagination, parseSort, parseFilters } = require('../middlewares/validation.middleware');
const { LEVELS } = require('../constants/roles');

// Middleware to parse JSON strings from FormData
const parseNewsFormData = (req, res, next) => {
  try {
    console.log('🔍 Before parsing:', {
      target_departments: typeof req.body.target_departments,
      target_users: typeof req.body.target_users,
      is_priority: typeof req.body.is_priority
    });
    
    // Parse target_departments if it's a JSON string
    if (req.body.target_departments && typeof req.body.target_departments === 'string') {
      req.body.target_departments = JSON.parse(req.body.target_departments);
    }
    // Parse target_users if it's a JSON string
    if (req.body.target_users && typeof req.body.target_users === 'string') {
      req.body.target_users = JSON.parse(req.body.target_users);
    }
    // Parse is_priority if it's a string
    if (req.body.is_priority && typeof req.body.is_priority === 'string') {
      req.body.is_priority = req.body.is_priority === 'true';
    }
    
    console.log('✅ After parsing:', {
      target_departments: Array.isArray(req.body.target_departments) ? 'array' : typeof req.body.target_departments,
      target_users: Array.isArray(req.body.target_users) ? 'array' : typeof req.body.target_users,
      is_priority: typeof req.body.is_priority
    });
  } catch (error) {
    console.error('❌ Error parsing FormData JSON:', error);
  }
  next();
};

// Validation rules
const createNewsValidation = [
  body('category')
    .isIn([
      'company_announcement',
      'policy_update',
      'event',
      'achievement',
      'safety_alert',
      'maintenance',
      'training',
      'welfare',
      'newsletter',
      'emergency',
      'other'
    ])
    .withMessage('Invalid category'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must not exceed 500 characters'),
  body('target_audience')
    .optional()
    .isIn(['all', 'departments', 'users'])
    .withMessage('Invalid target audience'),
  body('target_departments')
    .optional()
    .custom((value, { req }) => {
      if (req.body.target_audience === 'departments') {
        if (!value || !Array.isArray(value) || value.length === 0) {
          throw new Error('Target departments are required when target_audience is "departments"');
        }
      }
      return true;
    })
    .withMessage('Target departments must be an array'),
  body('target_users')
    .optional()
    .custom((value, { req }) => {
      if (req.body.target_audience === 'users') {
        if (!value || !Array.isArray(value) || value.length === 0) {
          throw new Error('Target users are required when target_audience is "users"');
        }
      }
      return true;
    })
    .withMessage('Target users must be an array'),
  body('is_priority')
    .optional()
    .custom((value) => {
      // Accept both boolean and string 'true'/'false' from FormData
      return value === true || value === false || value === 'true' || value === 'false';
    })
    .withMessage('is_priority must be a boolean'),
  body('publish_at')
    .optional()
    .isISO8601()
    .withMessage('Invalid publish date format')
];

const updateNewsValidation = [
  param('id').isUUID().withMessage('Invalid news ID'),
  body('category')
    .optional()
    .isIn([
      'company_announcement',
      'policy_update',
      'event',
      'achievement',
      'safety_alert',
      'maintenance',
      'training',
      'welfare',
      'newsletter',
      'emergency',
      'other'
    ])
    .withMessage('Invalid category'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('content')
    .optional()
    .trim(),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must not exceed 500 characters'),
  body('target_audience')
    .optional()
    .isIn(['all', 'departments', 'users'])
    .withMessage('Invalid target audience'),
  body('target_departments')
    .optional()
    .custom((value, { req }) => {
      if (req.body.target_audience === 'departments') {
        if (!value || !Array.isArray(value) || value.length === 0) {
          throw new Error('Target departments are required when target_audience is "departments"');
        }
      }
      return true;
    })
    .withMessage('Target departments must be an array'),
  body('target_users')
    .optional()
    .custom((value, { req }) => {
      if (req.body.target_audience === 'users') {
        if (!value || !Array.isArray(value) || value.length === 0) {
          throw new Error('Target users are required when target_audience is "users"');
        }
      }
      return true;
    })
    .withMessage('Target users must be an array'),
  body('is_priority')
    .optional()
    .custom((value) => {
      // Accept both boolean and string 'true'/'false' from FormData
      return value === true || value === false || value === 'true' || value === 'false';
    })
    .withMessage('is_priority must be a boolean'),
  body('publish_at')
    .optional()
    .isISO8601()
    .withMessage('Invalid publish date format'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived', 'deleted'])
    .withMessage('Invalid status')
];

const publishNewsValidation = [
  param('id').isUUID().withMessage('Invalid news ID'),
  body('publish_at')
    .optional()
    .isISO8601()
    .withMessage('Invalid publish date format')
];

const newsIdValidation = [
  param('id').isUUID().withMessage('Invalid news ID')
];

const statsQueryValidation = [
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

// Routes

/**
 * @route   POST /api/news
 * @desc    Create new news article
 * @access  Private (Supervisor and above)
 */
router.post(
  '/',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  uploadNewsFiles,
  parseNewsFormData,
  createNewsValidation,
  validate,
  newsController.createNews
);

/**
 * @route   GET /api/news
 * @desc    Get all published news
 * @access  Private (All authenticated users)
 */
router.get(
  '/',
  authenticate,
  pagination,
  parseSort,
  parseFilters(['category', 'is_priority', 'date_from', 'date_to', 'search', 'status']),
  newsController.getNews
);

/**
 * @route   GET /api/news/stats
 * @desc    Get news statistics
 * @access  Private (Supervisor and above)
 */
router.get(
  '/stats',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  statsQueryValidation,
  validate,
  newsController.getNewsStats
);

/**
 * @route   GET /api/news/unread-count
 * @desc    Get unread news count for current user
 * @access  Private (All authenticated users)
 */
router.get(
  '/unread-count',
  authenticate,
  newsController.getUnreadCount
);

/**
 * @route   GET /api/news/:id
 * @desc    Get news by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  newsIdValidation,
  validate,
  newsController.getNewsById
);

/**
 * @route   PUT /api/news/:id
 * @desc    Update news
 * @access  Private (Author or Admin)
 */
router.put(
  '/:id',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  uploadNewsFiles,
  parseNewsFormData,
  updateNewsValidation,
  validate,
  newsController.updateNews
);

/**
 * @route   POST /api/news/:id/publish
 * @desc    Publish news
 * @access  Private (Supervisor and above)
 */
router.post(
  '/:id/publish',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  publishNewsValidation,
  validate,
  newsController.publishNews
);

/**
 * @route   POST /api/news/:id/read
 * @desc    Mark news as read
 * @access  Private (All authenticated users)
 */
router.post(
  '/:id/read',
  authenticate,
  newsIdValidation,
  validate,
  newsController.markAsRead
);

/**
 * @route   DELETE /api/news/:id
 * @desc    Delete news
 * @access  Private (Author or Admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  newsIdValidation,
  validate,
  newsController.deleteNews
);

module.exports = router;
