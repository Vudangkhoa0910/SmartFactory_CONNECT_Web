/**
 * Email Service - SendGrid
 * Service for sending emails using SendGrid API
 * 
 * This service handles:
 * 1. Sending incident notification emails
 * 2. Sending news notification emails
 * 3. HTML email templates with Vietnamese/Japanese support
 * 4. Error handling and logging
 */

const sgMail = require('@sendgrid/mail');
const db = require('../config/database');

class EmailService {
    constructor() {
        this.isConfigured = false;
        this.configure();
    }

    /**
     * Configure SendGrid with API key
     */
    configure() {
        const apiKey = process.env.SENDGRID_API_KEY;
        const isEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';

        if (!isEnabled) {
            console.log('[EmailService] Email notifications are disabled');
            return;
        }

        if (!apiKey) {
            console.warn('[EmailService] SENDGRID_API_KEY not found in environment variables');
            return;
        }

        sgMail.setApiKey(apiKey);
        this.isConfigured = true;
        console.log('[EmailService] SendGrid configured successfully');
    }

    /**
     * Check if email service is available
     */
    isAvailable() {
        return this.isConfigured;
    }

    /**
     * Get email addresses for users with level <= specified level
     * @param {number} maxLevel - Maximum level (e.g., 4 for supervisor and above)
     * @param {string} departmentId - Optional department ID filter
     * @returns {Array} Array of email addresses
     */
    async getEmailRecipients(maxLevel = 4, departmentId = null) {
        try {
            let query = `
                SELECT DISTINCT u.email, u.full_name, u.preferred_language
                FROM users u
                WHERE u.level <= $1 
                AND u.is_active = true 
                AND u.email IS NOT NULL
            `;
            const params = [maxLevel];

            if (departmentId) {
                query += ' AND (u.department_id = $2 OR u.level <= 3)';
                params.push(departmentId);
            }

            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('[EmailService] Error fetching recipients:', error);
            return [];
        }
    }

    /**
     * Generate HTML email template for incident
     */
    generateIncidentEmailHTML(incident, language = 'vi') {
        const priorityColors = {
            'critical': '#dc2626',
            'high': '#ea580c',
            'medium': '#ca8a04',
            'low': '#16a34a'
        };

        const priorityLabels = {
            vi: {
                'critical': 'Nghiêm trọng',
                'high': 'Cao',
                'medium': 'Trung bình',
                'low': 'Thấp'
            },
            ja: {
                'critical': '重大',
                'high': '高',
                'medium': '中',
                'low': '低'
            }
        };

        const typeLabels = {
            vi: {
                'machine': 'Máy móc',
                'quality': 'Chất lượng',
                'safety': 'An toàn',
                'environment': 'Môi trường',
                'other': 'Khác'
            },
            ja: {
                'machine': '機械',
                'quality': '品質',
                'safety': '安全',
                'environment': '環境',
                'other': 'その他'
            }
        };

        const translations = {
            vi: {
                subject: 'Thông báo sự cố mới',
                header: 'Sự cố mới cần xử lý',
                priority: 'Mức độ ưu tiên',
                type: 'Loại sự cố',
                location: 'Vị trí',
                description: 'Mô tả',
                viewDetails: 'Xem chi tiết',
                footer: 'Email này được gửi tự động từ hệ thống SmartFactory CONNECT'
            },
            ja: {
                subject: '新規インシデント通知',
                header: '処理が必要な新規インシデント',
                priority: '優先度',
                type: 'インシデント種別',
                location: '場所',
                description: '説明',
                viewDetails: '詳細を見る',
                footer: 'このメールはSmartFactory CONNECTシステムから自動送信されています'
            }
        };

        const t = translations[language] || translations.vi;
        const priorityColor = priorityColors[incident.priority] || '#ca8a04';
        const priorityLabel = (priorityLabels[language] || priorityLabels.vi)[incident.priority] || incident.priority;
        const typeLabel = (typeLabels[language] || typeLabels.vi)[incident.incident_type] || incident.incident_type;
        const title = language === 'ja' && incident.title_ja ? incident.title_ja : incident.title;
        const description = language === 'ja' && incident.description_ja ? incident.description_ja : incident.description;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #dc2626; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">${t.header}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <!-- Title -->
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">${title || t.subject}</h2>
                            
                            <!-- Priority Badge -->
                            <div style="margin-bottom: 20px;">
                                <span style="display: inline-block; padding: 6px 12px; background-color: ${priorityColor}; color: #ffffff; border-radius: 4px; font-size: 14px; font-weight: bold;">
                                    ${t.priority}: ${priorityLabel}
                                </span>
                            </div>
                            
                            <!-- Details Table -->
                            <table style="width: 100%; margin-bottom: 24px; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151; width: 30%;">
                                        ${t.type}
                                    </td>
                                    <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                        ${typeLabel}
                                    </td>
                                </tr>
                                ${incident.location ? `
                                <tr>
                                    <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">
                                        ${t.location}
                                    </td>
                                    <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                        ${incident.location}
                                    </td>
                                </tr>
                                ` : ''}
                            </table>
                            
                            <!-- Description -->
                            ${description ? `
                            <div style="margin-bottom: 24px;">
                                <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: bold;">${t.description}</h3>
                                <p style="margin: 0; color: #6b7280; line-height: 1.6;">${description}</p>
                            </div>
                            ` : ''}
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 32px;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/incidents/${incident.id}" 
                                   style="display: inline-block; padding: 12px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                    ${t.viewDetails}
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">${t.footer}</p>
                            <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 11px;">Đây là email tự động, vui lòng không trả lời.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * Generate HTML email template for news
     */
    generateNewsEmailHTML(news, language = 'vi') {
        const translations = {
            vi: {
                subject: 'Tin tức mới',
                header: 'Tin tức mới từ SmartFactory',
                category: 'Danh mục',
                publishedOn: 'Ngày đăng',
                viewDetails: 'Đọc toàn bộ',
                footer: 'Email này được gửi tự động từ hệ thống SmartFactory CONNECT'
            },
            ja: {
                subject: '新着ニュース',
                header: 'SmartFactoryの新着ニュース',
                category: 'カテゴリー',
                publishedOn: '公開日',
                viewDetails: '全文を読む',
                footer: 'このメールはSmartFactory CONNECTシステムから自動送信されています'
            }
        };

        const categoryLabels = {
            vi: {
                'announcement': 'Thông báo',
                'maintenance': 'Bảo trì',
                'safety': 'An toàn',
                'training': 'Đào tạo',
                'general': 'Chung'
            },
            ja: {
                'announcement': 'お知らせ',
                'maintenance': 'メンテナンス',
                'safety': '安全',
                'training': 'トレーニング',
                'general': '一般'
            }
        };

        const t = translations[language] || translations.vi;
        const title = language === 'ja' && news.title_ja ? news.title_ja : news.title;
        const excerpt = language === 'ja' && news.excerpt_ja ? news.excerpt_ja : news.excerpt;
        const categoryLabel = (categoryLabels[language] || categoryLabels.vi)[news.category] || news.category;

        const priorityBadge = news.is_priority ? `
            <div style="margin-bottom: 16px;">
                <span style="display: inline-block; padding: 4px 12px; background-color: #dc2626; color: #ffffff; border-radius: 4px; font-size: 12px; font-weight: bold;">
                    ${language === 'ja' ? '重要' : 'QUAN TRỌNG'}
                </span>
            </div>
        ` : '';

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #0ea5e9; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">${t.header}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${priorityBadge}
                            
                            <!-- Title -->
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 22px; line-height: 1.4;">${title}</h2>
                            
                            <!-- Meta Info -->
                            <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb;">
                                <span style="display: inline-block; margin-right: 16px; color: #6b7280; font-size: 14px;">
                                    ${t.category}: <strong>${categoryLabel}</strong>
                                </span>
                            </div>
                            
                            <!-- Excerpt -->
                            ${excerpt ? `
                            <div style="margin-bottom: 24px;">
                                <p style="margin: 0; color: #4b5563; line-height: 1.8; font-size: 16px;">${excerpt}</p>
                            </div>
                            ` : ''}
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 32px;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/news/${news.id}" 
                                   style="display: inline-block; padding: 12px 32px; background-color: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                    ${t.viewDetails}
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">${t.footer}</p>
                            <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 11px;">Đây là email tự động, vui lòng không trả lời.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * Send incident notification email
     * @param {Object} incident - Incident object
     * @param {string} departmentId - Optional department ID filter
     */
    async sendIncidentEmail(incident, departmentId = null) {
        if (!this.isAvailable()) {
            console.log('[EmailService] Email service not configured, skipping incident email');
            return { success: false, reason: 'not_configured' };
        }

        const startTime = Date.now();
        console.log(`[EmailService] Sending incident email for: ${incident.id}`);

        try {
            // Get recipients (supervisor and above)
            const recipients = await this.getEmailRecipients(4, departmentId);

            if (recipients.length === 0) {
                console.log('[EmailService] No email recipients found for incident');
                return { success: true, recipientCount: 0 };
            }

            const fromEmail = process.env.EMAIL_FROM || 'smartfactoryconnect@gmail.com';

            // Group recipients by language
            const recipientsByLanguage = {
                vi: recipients.filter(r => !r.preferred_language || r.preferred_language === 'vi'),
                ja: recipients.filter(r => r.preferred_language === 'ja')
            };

            const emailPromises = [];

            // Send Vietnamese emails
            if (recipientsByLanguage.vi.length > 0) {
                const html = this.generateIncidentEmailHTML(incident, 'vi');
                const msg = {
                    to: recipientsByLanguage.vi.map(r => r.email),
                    from: fromEmail,
                    subject: `Thông báo sự cố mới: ${incident.title || 'Cần xử lý'}`,
                    html: html
                };
                emailPromises.push(sgMail.send(msg));
            }

            // Send Japanese emails
            if (recipientsByLanguage.ja.length > 0) {
                const html = this.generateIncidentEmailHTML(incident, 'ja');
                const msg = {
                    to: recipientsByLanguage.ja.map(r => r.email),
                    from: fromEmail,
                    subject: `新規インシデント通知: ${incident.title_ja || incident.title || '処理が必要'}`,
                    html: html
                };
                emailPromises.push(sgMail.send(msg));
            }

            await Promise.all(emailPromises);

            const duration = Date.now() - startTime;
            console.log(`[EmailService] Incident emails sent successfully in ${duration}ms to ${recipients.length} recipients`);

            return { success: true, recipientCount: recipients.length };
        } catch (error) {
            console.error('[EmailService] Error sending incident email:', error);
            if (error.response) {
                console.error('[EmailService] SendGrid error:', error.response.body);
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Send news notification email
     * @param {Object} news - News object
     * @param {string} targetAudience - Target audience filter
     * @param {Array} targetDepartments - Target departments filter
     */
    async sendNewsEmail(news, targetAudience = 'all', targetDepartments = null) {
        if (!this.isAvailable()) {
            console.log('[EmailService] Email service not configured, skipping news email');
            return { success: false, reason: 'not_configured' };
        }

        const startTime = Date.now();
        console.log(`[EmailService] Sending news email for: ${news.id}`);

        try {
            let recipients = [];

            // Determine recipients based on target audience
            if (targetAudience === 'all') {
                // Get all active users
                const result = await db.query(
                    'SELECT email, full_name, preferred_language FROM users WHERE is_active = true AND email IS NOT NULL'
                );
                recipients = result.rows;
            } else if (targetDepartments && targetDepartments.length > 0) {
                // Get users in target departments
                const result = await db.query(
                    'SELECT email, full_name, preferred_language FROM users WHERE department_id = ANY($1) AND is_active = true AND email IS NOT NULL',
                    [targetDepartments]
                );
                recipients = result.rows;
            } else if (targetAudience === 'managers') {
                // Get managers and above (level <= 3)
                recipients = await this.getEmailRecipients(3);
            } else {
                // Default: supervisors and above
                recipients = await this.getEmailRecipients(4);
            }

            if (recipients.length === 0) {
                console.log('[EmailService] No email recipients found for news');
                return { success: true, recipientCount: 0 };
            }

            const fromEmail = process.env.EMAIL_FROM || 'smartfactoryconnect@gmail.com';

            // Group recipients by language
            const recipientsByLanguage = {
                vi: recipients.filter(r => !r.preferred_language || r.preferred_language === 'vi'),
                ja: recipients.filter(r => r.preferred_language === 'ja')
            };

            const emailPromises = [];

            // Send Vietnamese emails
            if (recipientsByLanguage.vi.length > 0) {
                const html = this.generateNewsEmailHTML(news, 'vi');
                const msg = {
                    to: recipientsByLanguage.vi.map(r => r.email),
                    from: fromEmail,
                    subject: `${news.is_priority ? '[QUAN TRỌNG] ' : ''}Tin mới: ${news.title}`,
                    html: html
                };
                emailPromises.push(sgMail.send(msg));
            }

            // Send Japanese emails
            if (recipientsByLanguage.ja.length > 0) {
                const html = this.generateNewsEmailHTML(news, 'ja');
                const msg = {
                    to: recipientsByLanguage.ja.map(r => r.email),
                    from: fromEmail,
                    subject: `${news.is_priority ? '[重要] ' : ''}新着ニュース: ${news.title_ja || news.title}`,
                    html: html
                };
                emailPromises.push(sgMail.send(msg));
            }

            await Promise.all(emailPromises);

            const duration = Date.now() - startTime;
            console.log(`[EmailService] News emails sent successfully in ${duration}ms to ${recipients.length} recipients`);

            return { success: true, recipientCount: recipients.length };
        } catch (error) {
            console.error('[EmailService] Error sending news email:', error);
            if (error.response) {
                console.error('[EmailService] SendGrid error:', error.response.body);
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Send email notification to admin when incident is auto-assigned
     * @param {Object} data - Auto-assign data
     */
    async sendAutoAssignNotificationEmail(data) {
        if (!this.isAvailable()) {
            console.log('[EmailService] Email service not configured, skipping auto-assign email');
            return { success: false, reason: 'not_configured' };
        }

        try {
            // Get admin users (level <= 2: Admin, Factory Manager)
            const admins = await this.getEmailRecipients(2);

            if (admins.length === 0) {
                console.log('[EmailService] No admin recipients found for auto-assign notification');
                return { success: true, recipientCount: 0 };
            }

            const fromEmail = process.env.EMAIL_FROM || 'smartfactoryconnect@gmail.com';
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

            const priorityLabels = {
                'critical': 'Nghiêm trọng',
                'high': 'Cao',
                'medium': 'Trung bình',
                'low': 'Thấp'
            };

            const typeLabels = {
                'machine': 'Máy móc',
                'quality': 'Chất lượng',
                'safety': 'An toàn',
                'environment': 'Môi trường',
                'other': 'Khác'
            };

            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông báo gán tự động</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #dc2626; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Sự cố được gán tự động</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <!-- Title -->
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">${data.title || 'Sự cố mới'}</h2>
                            
                            <!-- Auto-assign Badge -->
                            <div style="margin-bottom: 20px;">
                                <span style="display: inline-block; padding: 6px 12px; background-color: #16a34a; color: #ffffff; border-radius: 4px; font-size: 14px; font-weight: bold;">
                                    AI Auto-Assign: ${(data.confidence * 100).toFixed(0)}% độ tin cậy
                                </span>
                            </div>
                            
                            <!-- Details Table -->
                            <table style="width: 100%; margin-bottom: 24px; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 12px; background-color: #fef2f2; border-bottom: 1px solid #fecaca; font-weight: bold; color: #991b1b; width: 35%;">
                                        Phòng ban được gán
                                    </td>
                                    <td style="padding: 12px; background-color: #fef2f2; border-bottom: 1px solid #fecaca; color: #991b1b; font-weight: bold;">
                                        ${data.department_name}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">
                                        Loại sự cố
                                    </td>
                                    <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                        ${typeLabels[data.incident_type] || data.incident_type || 'Khác'}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">
                                        Mức độ ưu tiên
                                    </td>
                                    <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                        ${priorityLabels[data.priority] || data.priority || 'Trung bình'}
                                    </td>
                                </tr>
                                ${data.location ? `
                                <tr>
                                    <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">
                                        Vị trí
                                    </td>
                                    <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                        ${data.location}
                                    </td>
                                </tr>
                                ` : ''}
                                <tr>
                                    <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">
                                        Người báo cáo
                                    </td>
                                    <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                        ${data.reporter_name || 'Không rõ'}
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Description -->
                            ${data.description ? `
                            <div style="margin-bottom: 24px;">
                                <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: bold;">Mô tả</h3>
                                <p style="margin: 0; color: #6b7280; line-height: 1.6;">${data.description.substring(0, 500)}${data.description.length > 500 ? '...' : ''}</p>
                            </div>
                            ` : ''}
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 32px;">
                                <a href="${frontendUrl}/incident-queue" 
                                   style="display: inline-block; padding: 12px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                    Xem hàng đợi sự cố
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">Email này được gửi tự động từ hệ thống SmartFactory CONNECT</p>
                            <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 11px;">Đây là email tự động, vui lòng không trả lời.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `;

            const msg = {
                to: admins.map(a => a.email),
                from: fromEmail,
                subject: `[Auto-Assign] Sự cố mới: ${data.title || 'Cần xử lý'} → ${data.department_name}`,
                html: html
            };

            await sgMail.send(msg);

            console.log(`[EmailService] Auto-assign notification sent to ${admins.length} admins`);
            return { success: true, recipientCount: admins.length };

        } catch (error) {
            console.error('[EmailService] Error sending auto-assign email:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
module.exports = new EmailService();
