const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, authorizeLevel } = require('../middlewares/auth.middleware');
const { validate, pagination, parseSort, parseFilters } = require('../middlewares/validation.middleware');

// Validation rules
const createUserValidation = [
  body('employee_code')
    .trim()
    .notEmpty()
    .withMessage('Employee code is required')
    .isLength({ max: 50 })
    .withMessage('Employee code must not exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
  body('department_id')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID'),
  body('role')
    .isIn([
      'admin',
      'factory_manager',
      'production_manager',
      'supervisor',
      'team_leader',
      'operator',
      'technician',
      'qc_inspector',
      'maintenance_manager',
      'maintenance_staff',
      'viewer'
    ])
    .withMessage('Invalid role')
];

const updateUserValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('employee_code')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Employee code must not exceed 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('full_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
  body('department_id')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID'),
  body('role')
    .optional()
    .isIn([
      'admin',
      'factory_manager',
      'production_manager',
      'supervisor',
      'team_leader',
      'operator',
      'technician',
      'qc_inspector',
      'maintenance_manager',
      'maintenance_staff',
      'viewer'
    ])
    .withMessage('Invalid role'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const resetPasswordValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
];

const userIdValidation = [
  param('id').isUUID().withMessage('Invalid user ID')
];

// Routes

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin, Factory Manager)
 */
router.get(
  '/stats',
  authenticate,
  authorizeLevel(2), // Factory Manager and above
  userController.getUserStats
);

/**
 * @route   GET /api/users
 * @desc    Get all users with filters
 * @access  Private (Team Leader and above)
 */
router.get(
  '/',
  authenticate,
  authorizeLevel(5), // Team Leader and above
  pagination,
  parseSort,
  parseFilters(['role', 'department_id', 'is_active', 'search']),
  userController.getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Team Leader and above)
 */
router.get(
  '/:id',
  authenticate,
  authorizeLevel(5), // Team Leader and above
  userIdValidation,
  validate,
  userController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin, Factory Manager)
 */
router.post(
  '/',
  authenticate,
  authorizeLevel(2), // Factory Manager and above
  createUserValidation,
  validate,
  userController.createUser
);

/**
 * @route   PUT /api/users/preferences
 * @desc    Update current user preferences (language, etc)
 * @access  Private
 */
router.put(
  '/preferences',
  authenticate,
  [
    body('preferred_language')
      .optional()
      .isIn(['vi', 'ja'])
      .withMessage('Language must be vi or ja'),
  ],
  validate,
  userController.updatePreferences
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin, Factory Manager)
 */
router.put(
  '/:id',
  authenticate,
  authorizeLevel(2), // Factory Manager and above
  updateUserValidation,
  validate,
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete (deactivate) user
 * @access  Private (Admin, Factory Manager)
 */
router.delete(
  '/:id',
  authenticate,
  authorizeLevel(2), // Factory Manager and above
  userIdValidation,
  validate,
  userController.deleteUser
);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin, Factory Manager)
 */
router.post(
  '/:id/reset-password',
  authenticate,
  authorizeLevel(2), // Factory Manager and above
  resetPasswordValidation,
  validate,
  userController.resetUserPassword
);

module.exports = router;
