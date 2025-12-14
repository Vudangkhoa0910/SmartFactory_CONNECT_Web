const db = require('../config/database');

/**
 * Notification Service for managing and sending notifications
 */
class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Create notification in database
   */
  async createNotification({
    user_id,
    type,
    title,
    message,
    reference_type,
    reference_id,
    action_url
  }) {
    try {
      const query = `
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          reference_type,
          reference_id,
          action_url,
          is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false)
        RETURNING *
      `;
      
      const result = await db.query(query, [
        user_id,
        type,
        title,
        message,
        reference_type || null,
        reference_id || null,
        action_url || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send real-time notification to user
   */
  async sendToUser(userId, notification) {
    try {
      // Create notification in database
      const dbNotification = await this.createNotification({
        user_id: userId,
        ...notification
      });
      
      // Send via Socket.io
      this.io.to(`user_${userId}`).emit('notification', dbNotification);
      
      return dbNotification;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(userIds, notification) {
    try {
      const notifications = await Promise.all(
        userIds.map(userId => this.sendToUser(userId, notification))
      );
      
      return notifications;
    } catch (error) {
      console.error('Error sending notifications to users:', error);
      throw error;
    }
  }

  /**
   * Send notification by role
   */
  async sendToRole(role, notification) {
    try {
      // Get all users with specified role
      const result = await db.query(
        'SELECT id FROM users WHERE role = $1 AND is_active = true',
        [role]
      );
      
      const userIds = result.rows.map(row => row.id);
      
      if (userIds.length === 0) {
        return [];
      }
      
      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('Error sending notifications to role:', error);
      throw error;
    }
  }

  /**
   * Send notification by level (level and above)
   */
  async sendToLevel(level, notification) {
    try {
      // Get all users with level <= specified level (lower number = higher authority)
      const result = await db.query(
        'SELECT id FROM users WHERE level <= $1 AND is_active = true',
        [level]
      );
      
      const userIds = result.rows.map(row => row.id);
      
      if (userIds.length === 0) {
        return [];
      }
      
      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('Error sending notifications to level:', error);
      throw error;
    }
  }

  /**
   * Send notification to department
   */
  async sendToDepartment(departmentId, notification) {
    try {
      // Get all users in department
      const result = await db.query(
        'SELECT id FROM users WHERE department_id = $1 AND is_active = true',
        [departmentId]
      );
      
      const userIds = result.rows.map(row => row.id);
      
      if (userIds.length === 0) {
        return [];
      }
      
      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('Error sending notifications to department:', error);
      throw error;
    }
  }

  /**
   * Broadcast to all connected users
   */
  async broadcastToAll(notification) {
    try {
      // Get all active users
      const result = await db.query(
        'SELECT id FROM users WHERE is_active = true'
      );
      
      const userIds = result.rows.map(row => row.id);
      
      if (userIds.length === 0) {
        return [];
      }
      
      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const result = await db.query(
        `UPDATE notifications 
         SET is_read = true, read_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    try {
      const result = await db.query(
        `UPDATE notifications 
         SET is_read = true, read_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND is_read = false
         RETURNING *`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    try {
      const offset = (page - 1) * limit;
      
      let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
      let dataQuery = `SELECT * FROM notifications WHERE user_id = $1`;
      const queryParams = [userId];
      
      if (unreadOnly) {
        countQuery += ' AND is_read = false';
        dataQuery += ' AND is_read = false';
      }
      
      const countResult = await db.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].count);
      
      dataQuery += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
      
      const result = await db.query(
        dataQuery,
        [...queryParams, limit, offset]
      );
      
      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const result = await db.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
        [notificationId, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get total count for user
   */
  async getTotalCount(userId) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
        [userId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting total count:', error);
      return 0;
    }
  }

  /**
   * Get count by type for user
   */
  async getCountByType(userId) {
    try {
      const result = await db.query(
        `SELECT type, COUNT(*) as count 
         FROM notifications 
         WHERE user_id = $1 
         GROUP BY type`,
        [userId]
      );
      const byType = {};
      result.rows.forEach(row => {
        byType[row.type] = parseInt(row.count);
      });
      return byType;
    } catch (error) {
      console.error('Error getting count by type:', error);
      return {};
    }
  }

  /**
   * Get count by priority for user (from related entities)
   */
  async getCountByPriority(userId) {
    try {
      // For now return empty - priority is on the notification reference
      return { critical: 0, high: 0, medium: 0, low: 0 };
    } catch (error) {
      console.error('Error getting count by priority:', error);
      return {};
    }
  }
}

module.exports = NotificationService;
