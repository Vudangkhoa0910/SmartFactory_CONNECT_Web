/**
 * Email Controller
 * Handles manual email sending by admin
 */

const emailService = require('../services/email.service');
const db = require('../config/database');
const { asyncHandler, AppError } = require('../middlewares/error.middleware');

/**
 * Send test email
 * POST /api/email/test
 * @access Admin only
 */
const sendTestEmail = asyncHandler(async (req, res) => {
    const { to_email, subject, message } = req.body;

    if (!emailService.isAvailable()) {
        throw new AppError('Email service is not configured', 503);
    }

    if (!to_email) {
        throw new AppError('Email address is required', 400);
    }

    const sgMail = require('@sendgrid/mail');
    const fromEmail = process.env.EMAIL_FROM || 'smartfactoryconnect@gmail.com';

    const msg = {
        to: to_email,
        from: fromEmail,
        subject: subject || 'Test Email from SmartFactory CONNECT',
        text: message || 'This is a test email.',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">${subject || 'Thông báo từ SmartFactory CONNECT'}</h2>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb;">
                    <p style="color: #374151; line-height: 1.6;">${message || 'Đây là email thông báo từ hệ thống SmartFactory CONNECT.'}</p>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">Gửi bởi: ${req.user.full_name || req.user.email}</p>
                </div>
                <div style="background: #f9fafb; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px; border-radius: 0 0 8px 8px;">
                    SmartFactory CONNECT - Hệ thống Email
                </div>
            </div>
        `
    };

    try {
        await sgMail.send(msg);

        res.json({
            success: true,
            message: 'Test email sent successfully',
            data: {
                to: to_email,
                from: fromEmail,
                subject: msg.subject
            }
        });
    } catch (error) {
        console.error('[EmailController] Error sending test email:', error);
        throw new AppError(`Failed to send email: ${error.message}`, 500);
    }
});

/**
 * Send incident notification email manually
 * POST /api/email/incident
 * @access Admin only
 */
const sendIncidentNotification = asyncHandler(async (req, res) => {
    const { incident_id } = req.body;

    if (!emailService.isAvailable()) {
        throw new AppError('Email service is not configured', 503);
    }

    if (!incident_id) {
        throw new AppError('Incident ID is required', 400);
    }

    // Get incident details
    const incidentResult = await db.query(
        `SELECT * FROM incidents WHERE id = $1`,
        [incident_id]
    );

    if (incidentResult.rows.length === 0) {
        throw new AppError('Incident not found', 404);
    }

    const incident = incidentResult.rows[0];

    // Send email
    const result = await emailService.sendIncidentEmail(
        incident,
        incident.department_id || incident.assigned_department_id
    );

    if (!result.success) {
        throw new AppError(`Failed to send email: ${result.error || result.reason}`, 500);
    }

    res.json({
        success: true,
        message: 'Incident notification email sent successfully',
        data: {
            incident_id: incident.id,
            recipients_count: result.recipientCount
        }
    });
});

/**
 * Send news notification email manually
 * POST /api/email/news
 * @access Admin only
 */
const sendNewsNotification = asyncHandler(async (req, res) => {
    const { news_id, target_audience, target_departments } = req.body;

    if (!emailService.isAvailable()) {
        throw new AppError('Email service is not configured', 503);
    }

    if (!news_id) {
        throw new AppError('News ID is required', 400);
    }

    // Get news details
    const newsResult = await db.query(
        `SELECT * FROM news WHERE id = $1`,
        [news_id]
    );

    if (newsResult.rows.length === 0) {
        throw new AppError('News not found', 404);
    }

    const news = newsResult.rows[0];

    // Send email
    const result = await emailService.sendNewsEmail(
        news,
        target_audience || 'all',
        target_departments || null
    );

    if (!result.success) {
        throw new AppError(`Failed to send email: ${result.error || result.reason}`, 500);
    }

    res.json({
        success: true,
        message: 'News notification email sent successfully',
        data: {
            news_id: news.id,
            recipients_count: result.recipientCount,
            target_audience: target_audience || 'all'
        }
    });
});

/**
 * Get email service status
 * GET /api/email/status
 * @access Admin only
 */
const getEmailStatus = asyncHandler(async (req, res) => {
    const isConfigured = emailService.isAvailable();
    const fromEmail = process.env.EMAIL_FROM;
    const isEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';

    // Get recent email statistics (example)
    const supervisorCount = await db.query(
        'SELECT COUNT(*) FROM users WHERE level <= 4 AND is_active = true AND email IS NOT NULL'
    );

    res.json({
        success: true,
        data: {
            email_service_configured: isConfigured,
            email_notifications_enabled: isEnabled,
            from_email: fromEmail,
            potential_recipients: {
                supervisors_and_above: parseInt(supervisorCount.rows[0].count),
                description: 'Users with level <= 4 (Supervisor, Manager, GM, Admin)'
            },
            provider: 'SendGrid',
            configuration_status: isConfigured ? 'Ready' : 'Not Configured'
        }
    });
});

/**
 * Get list of potential email recipients
 * GET /api/email/recipients
 * @access Admin only
 */
const getEmailRecipients = asyncHandler(async (req, res) => {
    const { level, department_id } = req.query;
    const maxLevel = level ? parseInt(level) : 4;

    const recipients = await emailService.getEmailRecipients(maxLevel, department_id);

    res.json({
        success: true,
        data: {
            count: recipients.length,
            recipients: recipients.map(r => ({
                email: r.email,
                full_name: r.full_name,
                preferred_language: r.preferred_language || 'vi'
            }))
        }
    });
});

module.exports = {
    sendTestEmail,
    sendIncidentNotification,
    sendNewsNotification,
    getEmailStatus,
    getEmailRecipients
};
