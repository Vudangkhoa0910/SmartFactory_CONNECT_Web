/**
 * Push Notification Service
 * Unified service for sending push notifications via FCM, Socket.io, and database
 * 
 * This service handles:
 * 1. Creating in-app notifications (database)
 * 2. Sending FCM push to mobile devices
 * 3. Emitting Socket.io for web real-time updates
 * 4. Error handling (FCM failures don't break the flow)
 */

const db = require('../config/database');
const fcmService = require('./fcm.service');
const emailService = require('./email.service');
const { getUserFcmTokens, getMultipleUsersFcmTokens, getDepartmentFcmTokens, cleanupInvalidTokens } = require('../controllers/fcm-token.controller');

class PushNotificationService {
    constructor(io, notificationService) {
        this.io = io;
        this.notificationService = notificationService;
    }

    /**
     * Send notification when news is published
     * @param {Object} news - News object with id, title, title_ja, excerpt, excerpt_ja, category
     * @param {string} targetAudience - 'all', 'departments', 'users'
     * @param {Array} targetDepartments - Array of department IDs (optional)
     * @param {Array} targetUsers - Array of user IDs (optional)
     */
    async sendNewsPublishedNotification(news, targetAudience = 'all', targetDepartments = null, targetUsers = null) {
        const startTime = Date.now();
        console.log(`[PushNotification] Sending news notification for: ${news.title}`);

        try {
            // Determine recipients based on target_audience
            let recipientUserIds = [];

            if (targetAudience === 'all') {
                // Get all active users
                const usersResult = await db.query(
                    'SELECT id FROM users WHERE is_active = true'
                );
                recipientUserIds = usersResult.rows.map(r => r.id);
            } else if (targetAudience === 'departments' && targetDepartments && targetDepartments.length > 0) {
                // Get users in target departments
                const deptIds = typeof targetDepartments === 'string' ? JSON.parse(targetDepartments) : targetDepartments;
                const usersResult = await db.query(
                    'SELECT id FROM users WHERE department_id = ANY($1) AND is_active = true',
                    [deptIds]
                );
                recipientUserIds = usersResult.rows.map(r => r.id);
            } else if (targetAudience === 'users' && targetUsers && targetUsers.length > 0) {
                // Use specific user IDs
                recipientUserIds = typeof targetUsers === 'string' ? JSON.parse(targetUsers) : targetUsers;
            } else {
                // Default: all users (fallback)
                const usersResult = await db.query(
                    'SELECT id FROM users WHERE is_active = true'
                );
                recipientUserIds = usersResult.rows.map(r => r.id);
            }

            if (recipientUserIds.length === 0) {
                console.log('[PushNotification] No recipients found for news notification');
                return { success: true, recipientCount: 0 };
            }

            // Create in-app notifications for each recipient
            const notificationPromises = recipientUserIds.map(userId =>
                this.notificationService.createNotification({
                    recipient_id: userId,
                    type: 'news',
                    title: '📰 Tin mới',
                    title_ja: '📰 新着ニュース',
                    message: news.title,
                    message_ja: news.title_ja || news.title,
                    reference_type: 'news',
                    reference_id: news.id,
                    related_news_id: news.id,
                    action_url: `/news/${news.id}`,
                    metadata: {
                        news_category: news.category,
                        is_priority: news.is_priority
                    }
                }).catch(err => {
                    console.error(`[PushNotification] Failed to create notification for user ${userId}:`, err.message);
                    return null;
                })
            );

            await Promise.all(notificationPromises);

            // Send FCM push notifications
            const fcmTokens = await getMultipleUsersFcmTokens(recipientUserIds);

            if (fcmTokens.length > 0 && fcmService.isAvailable()) {
                const fcmResult = await fcmService.sendToMultipleDevices(
                    fcmTokens,
                    news.is_priority ? '🔴 Tin quan trọng' : '📰 Tin mới',
                    news.excerpt || news.title.substring(0, 100),
                    {
                        type: 'news',
                        id: news.id,
                        action_url: `/news/${news.id}`,
                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                        priority: news.is_priority ? 'high' : 'normal'
                    }
                );

                // Cleanup invalid tokens
                if (fcmResult.responses) {
                    const invalidTokens = fcmTokens.filter((token, idx) =>
                        fcmResult.responses[idx] && !fcmResult.responses[idx].success &&
                        fcmResult.responses[idx].error?.code === 'messaging/registration-token-not-registered'
                    );
                    if (invalidTokens.length > 0) {
                        await cleanupInvalidTokens(invalidTokens);
                    }
                }

                console.log(`[PushNotification] FCM sent to ${fcmResult.successCount || 0}/${fcmTokens.length} devices`);
            }

            // Emit Socket.io for web real-time
            if (this.io) {
                recipientUserIds.forEach(userId => {
                    this.io.to(`user_${userId}`).emit('notification', {
                        type: 'news',
                        title: '📰 Tin mới',
                        message: news.title,
                        news_id: news.id,
                        action_url: `/news/${news.id}`
                    });
                });
            }

            // Send email notifications (non-blocking)
            if (emailService.isAvailable()) {
                emailService.sendNewsEmail(news, targetAudience, targetDepartments)
                    .catch(err => console.error('[PushNotification] Email send failed:', err.message));
            }

            const duration = Date.now() - startTime;
            console.log(`[PushNotification] News notification completed in ${duration}ms for ${recipientUserIds.length} users`);

            return { success: true, recipientCount: recipientUserIds.length };
        } catch (error) {
            console.error('[PushNotification] Error sending news notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification when incident is created
     * @param {Object} incident - Incident object with id, title, description, priority, incident_type, department_id
     */
    async sendIncidentCreatedNotification(incident) {
        const startTime = Date.now();
        console.log(`[PushNotification] Sending incident notification for: ${incident.title || incident.id}`);

        try {
            // Get supervisors and above (level <= 4) from the incident's department
            // If no department, notify all supervisors+
            let recipientUserIds = [];

            if (incident.department_id || incident.assigned_department_id) {
                const deptId = incident.department_id || incident.assigned_department_id;
                const usersResult = await db.query(
                    `SELECT id FROM users 
           WHERE (department_id = $1 OR level <= 3) 
           AND level <= 4 
           AND is_active = true`,
                    [deptId]
                );
                recipientUserIds = usersResult.rows.map(r => r.id);
            } else {
                // No department - notify all supervisors+
                const usersResult = await db.query(
                    'SELECT id FROM users WHERE level <= 4 AND is_active = true'
                );
                recipientUserIds = usersResult.rows.map(r => r.id);
            }

            if (recipientUserIds.length === 0) {
                console.log('[PushNotification] No supervisors found for incident notification');
                return { success: true, recipientCount: 0 };
            }

            // Determine priority emoji
            const priorityEmoji = {
                'critical': '🔴',
                'high': '🟠',
                'medium': '🟡',
                'low': '🟢'
            }[incident.priority] || '🟡';

            const typeLabel = {
                'machine': 'Máy móc',
                'quality': 'Chất lượng',
                'safety': 'An toàn',
                'environment': 'Môi trường',
                'other': 'Khác'
            }[incident.incident_type] || 'Báo cáo';

            // Create in-app notifications
            const notificationPromises = recipientUserIds.map(userId =>
                this.notificationService.createNotification({
                    recipient_id: userId,
                    type: 'incident',
                    title: `${priorityEmoji} Incident mới - ${typeLabel}`,
                    title_ja: `${priorityEmoji} 新規インシデント`,
                    message: incident.title || incident.description?.substring(0, 100) || 'Có incident mới cần xử lý',
                    message_ja: incident.title_ja || incident.title || '新規インシデントがあります',
                    reference_type: 'incident',
                    reference_id: incident.id,
                    related_incident_id: incident.id,
                    action_url: `/incidents/${incident.id}`,
                    metadata: {
                        incident_priority: incident.priority,
                        incident_type: incident.incident_type,
                        location: incident.location
                    }
                }).catch(err => {
                    console.error(`[PushNotification] Failed to create notification for user ${userId}:`, err.message);
                    return null;
                })
            );

            await Promise.all(notificationPromises);

            // Send FCM push notifications
            const fcmTokens = await getMultipleUsersFcmTokens(recipientUserIds);

            if (fcmTokens.length > 0 && fcmService.isAvailable()) {
                const fcmResult = await fcmService.sendToMultipleDevices(
                    fcmTokens,
                    `${priorityEmoji} Incident mới - ${typeLabel}`,
                    incident.title || incident.description?.substring(0, 80) || 'Có incident mới',
                    {
                        type: 'incident',
                        id: incident.id,
                        action_url: `/incidents/${incident.id}`,
                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                        priority: incident.priority,
                        incident_type: incident.incident_type
                    }
                );

                // Cleanup invalid tokens
                if (fcmResult.responses) {
                    const invalidTokens = fcmTokens.filter((token, idx) =>
                        fcmResult.responses[idx] && !fcmResult.responses[idx].success &&
                        fcmResult.responses[idx].error?.code === 'messaging/registration-token-not-registered'
                    );
                    if (invalidTokens.length > 0) {
                        await cleanupInvalidTokens(invalidTokens);
                    }
                }

                console.log(`[PushNotification] FCM sent to ${fcmResult.successCount || 0}/${fcmTokens.length} devices`);
            }

            // Emit Socket.io for web real-time
            if (this.io) {
                recipientUserIds.forEach(userId => {
                    this.io.to(`user_${userId}`).emit('notification', {
                        type: 'incident',
                        title: `${priorityEmoji} Incident mới`,
                        message: incident.title || 'Có incident mới',
                        incident_id: incident.id,
                        action_url: `/incidents/${incident.id}`
                    });
                });
            }

            // NOTE: Email is now sent from incident.controller.js when auto-assign happens
            // This avoids sending duplicate emails (one on create, another on auto-assign)
            // if (emailService.isAvailable()) {
            //     const deptId = incident.department_id || incident.assigned_department_id;
            //     emailService.sendIncidentEmail(incident, deptId)
            //         .catch(err => console.error('[PushNotification] Email send failed:', err.message));
            // }

            const duration = Date.now() - startTime;
            console.log(`[PushNotification] Incident notification completed in ${duration}ms for ${recipientUserIds.length} users`);

            return { success: true, recipientCount: recipientUserIds.length };
        } catch (error) {
            console.error('[PushNotification] Error sending incident notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification when idea receives a response
     * @param {Object} idea - Idea object with id, title, submitter_id
     * @param {Object} response - Response object (optional, for context)
     * @param {string} responderId - ID of the user who responded
     */
    async sendIdeaResponseNotification(idea, response = null, responderId = null) {
        const startTime = Date.now();
        console.log(`[PushNotification] Sending idea response notification for idea: ${idea.id}`);

        try {
            // Notify the idea submitter
            const submitterId = idea.submitter_id;

            if (!submitterId) {
                console.log('[PushNotification] No submitter_id found for idea');
                return { success: true, recipientCount: 0 };
            }

            // Don't notify if responder is the same as submitter
            if (responderId && submitterId === responderId) {
                console.log('[PushNotification] Responder is the same as submitter, skipping notification');
                return { success: true, recipientCount: 0 };
            }

            // Create in-app notification
            await this.notificationService.createNotification({
                recipient_id: submitterId,
                type: 'idea',
                title: '💬 Phản hồi ý kiến của bạn',
                title_ja: '💬 あなたのアイデアへの返信',
                message: `Ý kiến "${idea.title || 'của bạn'}" đã nhận được phản hồi mới`,
                message_ja: idea.title_ja ? `「${idea.title_ja}」に新しい返信があります` : 'あなたのアイデアに返信がありました',
                reference_type: 'idea',
                reference_id: idea.id,
                related_idea_id: idea.id,
                action_url: `/ideas/${idea.id}`,
                metadata: {
                    idea_type: idea.ideabox_type,
                    response_preview: response?.response?.substring(0, 50) || null
                }
            });

            // Send FCM push notification
            const fcmTokens = await getUserFcmTokens(submitterId);

            if (fcmTokens.length > 0 && fcmService.isAvailable()) {
                const fcmResult = await fcmService.sendToMultipleDevices(
                    fcmTokens,
                    '💬 Phản hồi ý kiến của bạn',
                    idea.title ? `"${idea.title}" đã nhận được phản hồi` : 'Ý kiến của bạn đã được phản hồi',
                    {
                        type: 'idea',
                        id: idea.id,
                        action_url: `/ideas/${idea.id}`,
                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                        idea_type: idea.ideabox_type || 'white'
                    }
                );

                // Cleanup invalid tokens
                if (fcmResult.responses) {
                    const invalidTokens = fcmTokens.filter((token, idx) =>
                        fcmResult.responses[idx] && !fcmResult.responses[idx].success &&
                        fcmResult.responses[idx].error?.code === 'messaging/registration-token-not-registered'
                    );
                    if (invalidTokens.length > 0) {
                        await cleanupInvalidTokens(invalidTokens);
                    }
                }

                console.log(`[PushNotification] FCM sent to ${fcmResult.successCount || 0}/${fcmTokens.length} devices`);
            }

            // Emit Socket.io for web real-time
            if (this.io) {
                this.io.to(`user_${submitterId}`).emit('notification', {
                    type: 'idea',
                    title: '💬 Phản hồi ý kiến',
                    message: `Ý kiến của bạn đã nhận được phản hồi`,
                    idea_id: idea.id,
                    action_url: `/ideas/${idea.id}`
                });
            }

            const duration = Date.now() - startTime;
            console.log(`[PushNotification] Idea response notification completed in ${duration}ms`);

            return { success: true, recipientCount: 1 };
        } catch (error) {
            console.error('[PushNotification] Error sending idea response notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification when incident is assigned to user
     * @param {Object} incident - Incident object
     * @param {string} assigneeId - User ID who is assigned
     * @param {string} assignerName - Name of person who assigned
     */
    async sendIncidentAssignedNotification(incident, assigneeId, assignerName = null) {
        const startTime = Date.now();
        console.log(`[PushNotification] Sending incident assigned notification for: ${incident.id} to ${assigneeId}`);

        try {
            const priorityEmoji = {
                'critical': '🔴',
                'high': '🟠',
                'medium': '🟡',
                'low': '🟢'
            }[incident.priority] || '🟡';

            // Create in-app notification
            await this.notificationService.createNotification({
                recipient_id: assigneeId,
                type: 'incident',
                title: `${priorityEmoji} Bạn được gán incident`,
                title_ja: `${priorityEmoji} インシデントが割り当てられました`,
                message: incident.title || incident.description?.substring(0, 100) || 'Bạn được gán xử lý incident',
                message_ja: incident.title_ja || '新しいインシデントが割り当てられました',
                reference_type: 'incident',
                reference_id: incident.id,
                related_incident_id: incident.id,
                action_url: `/incidents/${incident.id}`,
                metadata: {
                    incident_priority: incident.priority,
                    assigned_by: assignerName
                }
            });

            // Send FCM push notification
            const fcmTokens = await getUserFcmTokens(assigneeId);

            if (fcmTokens.length > 0 && fcmService.isAvailable()) {
                const fcmResult = await fcmService.sendToMultipleDevices(
                    fcmTokens,
                    `${priorityEmoji} Bạn được gán incident`,
                    incident.title || 'Bạn được gán xử lý incident mới',
                    {
                        type: 'incident',
                        id: incident.id,
                        action_url: `/incidents/${incident.id}`,
                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                        priority: incident.priority
                    }
                );

                console.log(`[PushNotification] FCM assigned notification sent to ${fcmResult.successCount || 0}/${fcmTokens.length} devices`);
            }

            // Emit Socket.io
            if (this.io) {
                this.io.to(`user_${assigneeId}`).emit('notification', {
                    type: 'incident_assigned',
                    title: `${priorityEmoji} Bạn được gán incident`,
                    message: incident.title || 'Có incident mới được gán cho bạn',
                    incident_id: incident.id,
                    action_url: `/incidents/${incident.id}`
                });
            }

            const duration = Date.now() - startTime;
            console.log(`[PushNotification] Incident assigned notification completed in ${duration}ms`);

            return { success: true, recipientCount: 1 };
        } catch (error) {
            console.error('[PushNotification] Error sending incident assigned notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification when incident status changes
     * @param {Object} incident - Incident object
     * @param {string} oldStatus - Previous status
     * @param {string} newStatus - New status
     * @param {Array} notifyUserIds - Array of user IDs to notify
     */
    async sendIncidentStatusChangedNotification(incident, oldStatus, newStatus, notifyUserIds = []) {
        const startTime = Date.now();
        console.log(`[PushNotification] Sending status change notification for incident: ${incident.id}`);

        try {
            if (!notifyUserIds || notifyUserIds.length === 0) {
                // Default: notify reporter and assigned user
                notifyUserIds = [incident.reporter_id, incident.assigned_to].filter(Boolean);
            }

            // Remove duplicates
            notifyUserIds = [...new Set(notifyUserIds)];

            if (notifyUserIds.length === 0) {
                return { success: true, recipientCount: 0 };
            }

            const statusVi = {
                'pending': 'Chờ xử lý',
                'assigned': 'Đã gán',
                'in_progress': 'Đang xử lý',
                'resolved': 'Đã giải quyết',
                'closed': 'Đã đóng',
                'cancelled': 'Đã hủy',
                'escalated': 'Đã leo thang'
            }[newStatus] || newStatus;

            const statusJa = {
                'pending': '保留中',
                'assigned': '割り当て済み',
                'in_progress': '進行中',
                'resolved': '解決済み',
                'closed': 'クローズ',
                'cancelled': 'キャンセル',
                'escalated': 'エスカレーション'
            }[newStatus] || newStatus;

            // Create notifications
            const notificationPromises = notifyUserIds.map(userId =>
                this.notificationService.createNotification({
                    recipient_id: userId,
                    type: 'incident',
                    title: `📋 Cập nhật incident`,
                    title_ja: `📋 インシデント更新`,
                    message: `Trạng thái: ${statusVi}`,
                    message_ja: `ステータス: ${statusJa}`,
                    reference_type: 'incident',
                    reference_id: incident.id,
                    related_incident_id: incident.id,
                    action_url: `/incidents/${incident.id}`,
                    metadata: {
                        old_status: oldStatus,
                        new_status: newStatus
                    }
                }).catch(err => {
                    console.error(`[PushNotification] Failed to create notification for user ${userId}:`, err.message);
                    return null;
                })
            );

            await Promise.all(notificationPromises);

            // Send FCM push notifications
            const fcmTokens = await getMultipleUsersFcmTokens(notifyUserIds);

            if (fcmTokens.length > 0 && fcmService.isAvailable()) {
                await fcmService.sendToMultipleDevices(
                    fcmTokens,
                    '📋 Cập nhật incident',
                    `${incident.title || 'Incident'}: ${statusVi}`,
                    {
                        type: 'incident',
                        id: incident.id,
                        action_url: `/incidents/${incident.id}`,
                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                        status: newStatus
                    }
                );
            }

            const duration = Date.now() - startTime;
            console.log(`[PushNotification] Status change notification completed in ${duration}ms for ${notifyUserIds.length} users`);

            return { success: true, recipientCount: notifyUserIds.length };
        } catch (error) {
            console.error('[PushNotification] Error sending status change notification:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = PushNotificationService;
