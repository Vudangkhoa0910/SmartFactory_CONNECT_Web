/**
 * Email Routes
 * Admin endpoints for manual email sending
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorizeLevel } = require('../middlewares/auth.middleware');
const emailController = require('../controllers/email.controller');
const { body } = require('express-validator');

// All routes require authentication and admin level (level 1)
router.use(authenticate);
router.use(authorizeLevel(1)); // Admin only

/**
 * @route   GET /api/email/status
 * @desc    Get email service configuration status
 * @access  Admin only
 */
router.get('/status', emailController.getEmailStatus);

/**
 * @route   GET /api/email/recipients
 * @desc    Get list of potential email recipients
 * @query   level - Maximum level (default: 4)
 * @query   department_id - Optional department filter
 * @access  Admin only
 */
router.get('/recipients', emailController.getEmailRecipients);

/**
 * @route   POST /api/email/test
 * @desc    Send a test email to specified address
 * @access  Admin only
 */
router.post(
    '/test',
    [
        body('to_email')
            .isEmail()
            .withMessage('Valid email address is required'),
        body('subject')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage('Subject must be between 1 and 200 characters'),
        body('message')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 5000 })
            .withMessage('Message must be between 1 and 5000 characters')
    ],
    emailController.sendTestEmail
);

/**
 * @route   POST /api/email/incident
 * @desc    Manually send incident notification email
 * @access  Admin only
 */
router.post(
    '/incident',
    [
        body('incident_id')
            .isUUID()
            .withMessage('Valid incident ID is required')
    ],
    emailController.sendIncidentNotification
);

/**
 * @route   POST /api/email/news
 * @desc    Manually send news notification email
 * @access  Admin only
 */
router.post(
    '/news',
    [
        body('news_id')
            .isUUID()
            .withMessage('Valid news ID is required'),
        body('target_audience')
            .optional()
            .isIn(['all', 'managers', 'supervisors'])
            .withMessage('Invalid target audience'),
        body('target_departments')
            .optional()
            .isArray()
            .withMessage('Target departments must be an array')
    ],
    emailController.sendNewsNotification
);

module.exports = router;
