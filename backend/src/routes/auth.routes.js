const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_code
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               employee_code:
 *                 type: string
 *                 example: NV001
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               department_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */

// Validation rules
const registerValidation = [
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
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
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

const loginValidation = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('employee_code')
    .optional()
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.employee_code) {
      throw new Error('Either email or employee_code is required');
    }
    return true;
  })
];

const updateProfileValidation = [
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
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
];

const changePasswordValidation = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
    .custom((value, { req }) => {
      if (value === req.body.current_password) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
];

const resetPasswordValidation = [
  param('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Routes

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (or Admin only in production)
 */
router.post(
  '/register',
  registerValidation,
  validate,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  loginValidation,
  validate,
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  updateProfileValidation,
  validate,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  forgotPasswordValidation,
  validate,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password/:token',
  resetPasswordValidation,
  validate,
  authController.resetPassword
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token
 * @access  Private
 */
router.get(
  '/verify',
  authenticate,
  authController.verifyToken
);

/**
 * @route   POST /api/auth/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.post(
  '/avatar',
  authenticate,
  upload.array('avatar', 1),
  authController.uploadAvatar
);

/**
 * @route   PUT /api/auth/language
 * @desc    Update user preferred language
 * @access  Private
 */
router.put(
  '/language',
  authenticate,
  [
    body('language')
      .isIn(['vi', 'ja'])
      .withMessage('Language must be vi or ja')
  ],
  validate,
  authController.updateLanguage
);

module.exports = router;
