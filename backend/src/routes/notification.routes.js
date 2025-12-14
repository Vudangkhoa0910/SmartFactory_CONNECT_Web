const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate, pagination } = require('../middlewares/validation.middleware');

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
