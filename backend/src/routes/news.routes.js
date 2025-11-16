const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const newsController = require('../controllers/news.controller');
const { authenticate, authorizeLevel } = require('../middlewares/auth.middleware');
const { uploadNewsFiles } = require('../middlewares/upload.middleware');
const { validate, pagination, parseSort, parseFilters } = require('../middlewares/validation.middleware');

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
    .isIn(['all', 'admin', 'factory_manager', 'production_manager', 'supervisor', 'team_leader', 'operator', 'technician', 'qc_inspector', 'maintenance_manager', 'maintenance_staff', 'viewer'])
    .withMessage('Invalid target audience'),
  body('target_departments')
    .optional()
    .isArray()
    .withMessage('Target departments must be an array'),
  body('is_priority')
    .optional()
    .isBoolean()
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
    .isIn(['all', 'admin', 'factory_manager', 'production_manager', 'supervisor', 'team_leader', 'operator', 'technician', 'qc_inspector', 'maintenance_manager', 'maintenance_staff', 'viewer'])
    .withMessage('Invalid target audience'),
  body('target_departments')
    .optional()
    .isArray()
    .withMessage('Target departments must be an array'),
  body('is_priority')
    .optional()
    .isBoolean()
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
  authorizeLevel(4), // Supervisor and above
  uploadNewsFiles,
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
  parseFilters(['category', 'is_priority', 'date_from', 'date_to', 'search']),
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
  authorizeLevel(4), // Supervisor and above
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
  authorizeLevel(4), // Supervisor and above
  uploadNewsFiles,
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
  authorizeLevel(4), // Supervisor and above
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
  authorizeLevel(4), // Supervisor and above
  newsIdValidation,
  validate,
  newsController.deleteNews
);

module.exports = router;
