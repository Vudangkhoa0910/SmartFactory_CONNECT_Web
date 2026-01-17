const db = require('../config/database');

/**
 * Notification Service for managing and sending notifications
 * Updated to match database schema with user_id column
 */
class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Create notification in database
   * @param {Object} params - Notification parameters
   * @param {string} params.user_id - User ID who receives the notification
   * @param {string} params.type - Notification type (incident, idea, news, system, etc.)
   * @param {string} params.title - Notification title (Vietnamese)
   * @param {string} params.title_ja - Notification title (Japanese)
   * @param {string} params.message - Notification message (Vietnamese)
   * @param {string} params.message_ja - Notification message (Japanese)
   * @param {string} params.reference_type - Optional: Type of referenced entity
   * @param {string} params.reference_id - Optional: ID of referenced entity
   * @param {string} params.action_url - Optional: URL to navigate when clicked
   */
  async createNotification({
    user_id,
    type,
    title,
    title_ja,
    message,
    message_ja,
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
          title_ja,
          message,
          message_ja,
          reference_type,
          reference_id,
          action_url,
          is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
        RETURNING *
      `;

      const result = await db.query(query, [
        user_id,
        type,
        title,
        title_ja || null,
        message,
        message_ja || null,
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
   * Get notifications for user with related entity data
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false, lang = 'vi' } = {}) {
    try {
      const offset = (page - 1) * limit;

      let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
      let dataQuery = `
        SELECT 
          n.*,
          COALESCE(${lang === 'ja' ? 'n.title_ja' : 'NULL'}, n.title) as display_title,
          COALESCE(${lang === 'ja' ? 'n.message_ja' : 'NULL'}, n.message) as display_message
        FROM notifications n
        WHERE n.user_id = $1
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
   * Get notifications by department - returns empty since this column doesn't exist in schema
   * This is a no-op, kept for API compatibility
   */
  async getDepartmentNotifications(departmentId, { page = 1, limit = 20 } = {}) {
    // recipient_department_id doesn't exist in schema, return empty
    console.warn('getDepartmentNotifications: recipient_department_id column not in schema');
    return {
      data: [],
      pagination: {
        page,
        limit,
        totalItems: 0,
        totalPages: 0
      }
    };
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

  // =====================================================
  // PINK BOX WORKFLOW NOTIFICATIONS (Hòm Hồng / ピンクボックス)
  // =====================================================

  /**
   * Notify department when idea is forwarded to them
   * Thông báo cho phòng ban khi có ý kiến được chuyển đến
   * 意見が転送された時に部門に通知
   */
  async notifyDepartmentForwarded(departmentId, idea, forwardedBy) {
    try {
      // Get all supervisors and managers in the department
      const result = await db.query(
        `SELECT id FROM users 
         WHERE department_id = $1 
         AND level <= 3 
         AND is_active = true`,
        [departmentId]
      );

      const userIds = result.rows.map(row => row.id);
      if (userIds.length === 0) return [];

      return await this.sendToUsers(userIds, {
        type: 'idea_forwarded',
        title: 'Có ý kiến mới cần xử lý',
        title_ja: '新しい意見が届きました',
        message: `Bạn có ý kiến mới từ Hòm hồng cần phản hồi`,
        message_ja: 'ピンクボックスから新しい意見が届きました',
        reference_type: 'idea',
        reference_id: idea.id,
        action_url: `/ideas/department-inbox`
      });
    } catch (error) {
      console.error('Error notifying department:', error);
      return [];
    }
  }

  /**
   * Notify coordinator when department responds
   * Thông báo cho điều phối viên khi phòng ban trả lời
   * 部門が回答した時にコーディネーターに通知
   */
  async notifyCoordinatorResponse(idea, respondedBy) {
    try {
      if (!idea.coordinator_id) return null;

      return await this.sendToUser(idea.coordinator_id, {
        type: 'department_responded',
        title: 'Phòng ban đã phản hồi',
        title_ja: '部門から回答がありました',
        message: `Ý kiến "${idea.title?.substring(0, 30)}..." đã có phản hồi từ phòng ban`,
        message_ja: `意見「${idea.title?.substring(0, 30)}...」に部門から回答がありました`,
        reference_type: 'idea',
        reference_id: idea.id,
        action_url: `/admin/inbox-pink`
      });
    } catch (error) {
      console.error('Error notifying coordinator:', error);
      return null;
    }
  }

  /**
   * Notify submitter when their idea is published (private notification)
   * Thông báo cho người gửi khi ý kiến được công bố
   * 意見が公開された時に投稿者に通知（プライベート）
   */
  async notifyIdeaPublished(idea) {
    try {
      if (!idea.submitter_id) return null;

      return await this.sendToUser(idea.submitter_id, {
        type: 'idea_published',
        title: 'Ý kiến của bạn đã được giải quyết',
        title_ja: 'あなたの意見が解決されました',
        message: 'Ý kiến ẩn danh của bạn đã được xử lý và công bố phản hồi',
        message_ja: 'あなたの匿名意見が処理され、回答が公開されました',
        reference_type: 'idea',
        reference_id: idea.id,
        action_url: `/ideas/published`
      });
    } catch (error) {
      console.error('Error notifying submitter:', error);
      return null;
    }
  }

  // =====================================================
  // MEETING NOTIFICATIONS (Cuộc họp / ミーティング)
  // =====================================================

  /**
   * Notify user about scheduled meeting for their idea
   * Thông báo cho người dùng về cuộc họp đã đặt
   * 予約されたミーティングについてユーザーに通知
   */
  async notifyMeetingScheduled(idea, booking, room) {
    try {
      if (!idea.submitter_id) return null;

      const startTime = new Date(booking.start_time);
      const formattedDate = startTime.toLocaleDateString('vi-VN');
      const formattedTime = startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      return await this.sendToUser(idea.submitter_id, {
        type: 'meeting_scheduled',
        title: 'Bạn có lịch họp mới',
        title_ja: '新しいミーティングがあります',
        message: `Cuộc họp về ý kiến của bạn: ${formattedDate} lúc ${formattedTime} tại ${room.name}`,
        message_ja: `あなたの意見についてのミーティング: ${formattedDate} ${formattedTime} ${room.name}にて`,
        reference_type: 'room_booking',
        reference_id: booking.id,
        action_url: `/bookings/${booking.id}`,
        metadata: {
          room_name: room.name,
          room_code: room.code,
          start_time: booking.start_time,
          end_time: booking.end_time,
          idea_id: idea.id
        }
      });
    } catch (error) {
      console.error('Error notifying meeting:', error);
      return null;
    }
  }

  /**
   * Notify about idea response (for White Box)
   * Thông báo khi có phản hồi ý kiến Hòm trắng
   * ホワイトボックスの意見に回答があった時に通知
   */
  async notifyWhiteBoxResponse(idea, response, respondedByName) {
    try {
      if (!idea.submitter_id) return null;

      return await this.sendToUser(idea.submitter_id, {
        type: 'idea_response',
        title: 'Ý kiến của bạn có phản hồi mới',
        title_ja: 'あなたの意見に新しい回答があります',
        message: `${respondedByName} đã phản hồi ý kiến "${idea.title?.substring(0, 30)}..."`,
        message_ja: `${respondedByName}さんがあなたの意見「${idea.title?.substring(0, 30)}...」に回答しました`,
        reference_type: 'idea',
        reference_id: idea.id,
        action_url: `/ideas/${idea.id}`
      });
    } catch (error) {
      console.error('Error notifying response:', error);
      return null;
    }
  }
}

module.exports = NotificationService;
