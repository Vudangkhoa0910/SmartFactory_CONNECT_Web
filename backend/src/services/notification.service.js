const db = require('../config/database');

/**
 * Notification Service for managing and sending notifications
 * Updated to match new database schema with recipient_id and related columns
 */
class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Create notification in database
   * @param {Object} params - Notification parameters
   * @param {string} params.recipient_id - User ID who receives the notification
   * @param {string} params.recipient_department_id - Optional: Department ID for department-wide notifications
   * @param {string} params.type - Notification type (incident, idea, news, system, etc.)
   * @param {string} params.title - Notification title (Vietnamese)
   * @param {string} params.title_ja - Notification title (Japanese)
   * @param {string} params.message - Notification message (Vietnamese)
   * @param {string} params.message_ja - Notification message (Japanese)
   * @param {string} params.reference_type - Optional: Type of referenced entity
   * @param {string} params.reference_id - Optional: ID of referenced entity
   * @param {string} params.related_incident_id - Optional: Related incident ID
   * @param {string} params.related_idea_id - Optional: Related idea ID
   * @param {string} params.related_news_id - Optional: Related news ID
   * @param {string} params.action_url - Optional: URL to navigate when clicked
   * @param {Object} params.sent_via - Optional: Channels to send via {web: true, mobile: false, email: false}
   * @param {Object} params.metadata - Optional: Additional metadata
   */
  async createNotification({
    recipient_id,
    recipient_department_id,
    type,
    title,
    title_ja,
    message,
    message_ja,
    reference_type,
    reference_id,
    related_incident_id,
    related_idea_id,
    related_news_id,
    action_url,
    sent_via,
    metadata
  }) {
    try {
      const query = `
        INSERT INTO notifications (
          recipient_id,
          recipient_department_id,
          type,
          title,
          title_ja,
          message,
          message_ja,
          reference_type,
          reference_id,
          related_incident_id,
          related_idea_id,
          related_news_id,
          action_url,
          sent_via,
          metadata,
          is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false)
        RETURNING *
      `;

      const result = await db.query(query, [
        recipient_id,
        recipient_department_id || null,
        type,
        title,
        title_ja || null,
        message,
        message_ja || null,
        reference_type || null,
        reference_id || null,
        related_incident_id || null,
        related_idea_id || null,
        related_news_id || null,
        action_url || null,
        sent_via ? JSON.stringify(sent_via) : '{"web": true, "mobile": false}',
        metadata ? JSON.stringify(metadata) : null
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
        recipient_id: userId,
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
   * Now also stores recipient_department_id for department-wide tracking
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

      // Add department_id to notification for tracking
      const notificationWithDept = {
        ...notification,
        recipient_department_id: departmentId
      };

      return await this.sendToUsers(userIds, notificationWithDept);
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
         WHERE id = $1 AND recipient_id = $2
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
         WHERE recipient_id = $1 AND is_read = false
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
        'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = $1 AND is_read = false',
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get notifications for user with related entity data
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false, lang = 'vi' } = {}) {
    try {
      const offset = (page - 1) * limit;

      let countQuery = 'SELECT COUNT(*) FROM notifications WHERE recipient_id = $1';
      let dataQuery = `
        SELECT 
          n.*,
          COALESCE(${lang === 'ja' ? 'n.title_ja' : 'NULL'}, n.title) as title,
          COALESCE(${lang === 'ja' ? 'n.message_ja' : 'NULL'}, n.message) as message,
          COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as incident_title,
          i.status as incident_status,
          COALESCE(${lang === 'ja' ? 'idea.title_ja' : 'NULL'}, idea.title) as idea_title,
          idea.status as idea_status,
          COALESCE(${lang === 'ja' ? 'news.title_ja' : 'NULL'}, news.title) as news_title
        FROM notifications n
        LEFT JOIN incidents i ON n.related_incident_id = i.id
        LEFT JOIN ideas idea ON n.related_idea_id = idea.id
        LEFT JOIN news news ON n.related_news_id = news.id
        WHERE n.recipient_id = $1
      `;
      const queryParams = [userId];

      if (unreadOnly) {
        countQuery += ' AND is_read = false';
        dataQuery += ' AND n.is_read = false';
      }

      const countResult = await db.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].count);

      dataQuery += ' ORDER BY n.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);

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
   * Get notifications by department
   */
  async getDepartmentNotifications(departmentId, { page = 1, limit = 20, lang = 'vi' } = {}) {
    try {
      const offset = (page - 1) * limit;

      const countResult = await db.query(
        'SELECT COUNT(*) FROM notifications WHERE recipient_department_id = $1',
        [departmentId]
      );
      const totalItems = parseInt(countResult.rows[0].count);

      const result = await db.query(
        `SELECT 
           n.*,
           COALESCE(${lang === 'ja' ? 'n.title_ja' : 'NULL'}, n.title) as title,
           COALESCE(${lang === 'ja' ? 'n.message_ja' : 'NULL'}, n.message) as message
         FROM notifications n
         WHERE n.recipient_department_id = $1 
         ORDER BY n.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [departmentId, limit, offset]
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
      console.error('Error getting department notifications:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const result = await db.query(
        'DELETE FROM notifications WHERE id = $1 AND recipient_id = $2 RETURNING *',
        [notificationId, userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Send incident-related notification
   * Helper method for incident notifications
   */
  async sendIncidentNotification(userId, incident, notificationType, customTitle, customMessage) {
    const typeMap = {
      'new': { title: 'Incident mới', message: `Có incident mới: ${incident.title}` },
      'assigned': { title: 'Được gán incident', message: `Bạn được gán xử lý: ${incident.title}` },
      'updated': { title: 'Incident được cập nhật', message: `Incident "${incident.title}" đã được cập nhật` },
      'resolved': { title: 'Incident đã giải quyết', message: `Incident "${incident.title}" đã được giải quyết` },
      'approved': { title: 'Incident được duyệt', message: `Incident "${incident.title}" đã được duyệt` }
    };

    const { title, message } = typeMap[notificationType] || {
      title: customTitle || 'Thông báo Incident',
      message: customMessage || `Có cập nhật về incident: ${incident.title}`
    };

    return await this.sendToUser(userId, {
      type: 'incident',
      title,
      message,
      related_incident_id: incident.id,
      action_url: `/incidents/${incident.id}`,
      metadata: {
        incident_priority: incident.priority,
        incident_status: incident.status
      }
    });
  }

  /**
   * Send idea-related notification
   * Helper method for idea notifications
   */
  async sendIdeaNotification(userId, idea, notificationType) {
    const typeMap = {
      'new': { title: 'Ý tưởng mới', message: `Có ý tưởng mới: ${idea.title}` },
      'approved': { title: 'Ý tưởng được duyệt', message: `Ý tưởng "${idea.title}" đã được duyệt` },
      'rejected': { title: 'Ý tưởng bị từ chối', message: `Ý tưởng "${idea.title}" đã bị từ chối` }
    };

    const { title, message } = typeMap[notificationType] || {
      title: 'Thông báo Kaizen',
      message: `Có cập nhật về ý tưởng: ${idea.title}`
    };

    return await this.sendToUser(userId, {
      type: 'idea',
      title,
      message,
      related_idea_id: idea.id,
      action_url: `/ideas/${idea.id}`
    });
  }
}

module.exports = NotificationService;
