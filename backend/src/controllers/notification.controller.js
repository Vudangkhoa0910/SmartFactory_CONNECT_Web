const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Get user notifications
 * GET /api/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { pagination } = req;
  
  const notificationService = req.app.get('notificationService');
  
  const result = await notificationService.getUserNotifications(userId, {
    page: pagination.page,
    limit: pagination.limit
  });
  
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  });
});

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notificationService = req.app.get('notificationService');
  
  const count = await notificationService.getUnreadCount(userId);
  
  res.json({
    success: true,
    data: { count }
  });
});

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const notificationService = req.app.get('notificationService');
  
  const notification = await notificationService.markAsRead(id, userId);
  
  // Send updated unread count via WebSocket
  const io = req.app.get('io');
  const unreadCount = await notificationService.getUnreadCount(userId);
  io.to(`user_${userId}`).emit('unread_count', { count: unreadCount });
  
  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notificationService = req.app.get('notificationService');
  
  await notificationService.markAllAsRead(userId);
  
  // Send updated unread count via WebSocket
  const io = req.app.get('io');
  io.to(`user_${userId}`).emit('unread_count', { count: 0 });
  
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const notificationService = req.app.get('notificationService');
  
  await notificationService.deleteNotification(id, userId);
  
  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
