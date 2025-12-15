const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate, pagination } = require('../middlewares/validation.middleware');
const fcmService = require('../services/fcm.service');
const { asyncHandler } = require('../middlewares/error.middleware');

const notificationIdValidation = [
  param('id').isUUID().withMessage('Invalid notification ID')
];

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  pagination,
  notificationController.getNotifications
);

/**
 * @route   GET /api/notifications/recent
 * @desc    Get recent notifications (for dropdown)
 * @access  Private
 */
router.get(
  '/recent',
  authenticate,
  notificationController.getRecentNotifications
);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  notificationController.getNotificationStats
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount
);

/**
 * @route   POST /api/notifications/push
 * @desc    Send push notification to a device (for testing)
 * @access  Private
 */
router.post(
  '/push',
  authenticate,
  [
    body('token').notEmpty().withMessage('FCM token is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('body').notEmpty().withMessage('Body is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { token, title, body: notifBody, data } = req.body;

    const result = await fcmService.sendToDevice(token, title, notifBody, data);

    if (result.success) {
      res.json({
        success: true,
        message: 'Push notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send push notification',
        error: result.error
      });
    }
  })
);

/**
 * @route   POST /api/notifications/push/topic
 * @desc    Send push notification to a topic
 * @access  Private
 */
router.post(
  '/push/topic',
  authenticate,
  [
    body('topic').notEmpty().withMessage('Topic is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('body').notEmpty().withMessage('Body is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { topic, title, body: notifBody, data } = req.body;

    const result = await fcmService.sendToTopic(topic, title, notifBody, data);

    if (result.success) {
      res.json({
        success: true,
        message: `Push notification sent to topic: ${topic}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send push notification',
        error: result.error
      });
    }
  })
);

/**
 * @route   GET /api/notifications/push/status
 * @desc    Check FCM service status
 * @access  Public
 */
router.get('/push/status', (req, res) => {
  res.json({
    success: true,
    fcmAvailable: fcmService.isAvailable(),
    message: fcmService.isAvailable()
      ? 'FCM is configured and ready'
      : 'FCM not configured - firebase-service-account.json missing'
  });
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put(
  '/read-all',
  authenticate,
  notificationController.markAllAsRead
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put(
  '/:id/read',
  authenticate,
  notificationIdValidation,
  validate,
  notificationController.markAsRead
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  notificationIdValidation,
  validate,
  notificationController.deleteNotification
);

module.exports = router;
