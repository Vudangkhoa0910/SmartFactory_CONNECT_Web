import api from './api';

export interface EmailStatus {
    email_service_configured: boolean;
    email_notifications_enabled: boolean;
    from_email: string;
    potential_recipients: {
        supervisors_and_above: number;
        description: string;
    };
    provider: string;
    configuration_status: string;
}

export interface EmailRecipient {
    email: string;
    full_name: string;
    preferred_language: string;
}

export interface EmailRecipientsResponse {
    count: number;
    recipients: EmailRecipient[];
}

export interface SendTestEmailRequest {
    to_email: string;
    subject?: string;
    message?: string;
}

export interface SendIncidentEmailRequest {
    incident_id: string;
}

export interface SendNewsEmailRequest {
    news_id: string;
    target_audience?: 'all' | 'managers' | 'supervisors';
    target_departments?: string[];
}

class EmailService {
    /**
     * Get email service status and configuration
     */
    async getStatus(): Promise<EmailStatus> {
        const response = await api.get('/email/status');
        return response.data.data;
    }

    /**
     * Get list of potential email recipients
     */
    async getRecipients(level?: number, departmentId?: string): Promise<EmailRecipientsResponse> {
        const params: any = {};
        if (level) params.level = level;
        if (departmentId) params.department_id = departmentId;

        const response = await api.get('/email/recipients', { params });
        return response.data.data;
    }

    /**
     * Send a test email
     */
    async sendTestEmail(data: SendTestEmailRequest): Promise<any> {
        const response = await api.post('/email/test', data);
        return response.data;
    }

    /**
     * Send incident notification email manually
     */
    async sendIncidentEmail(data: SendIncidentEmailRequest): Promise<any> {
        const response = await api.post('/email/incident', data);
        return response.data;
    }

    /**
     * Send news notification email manually
     */
    async sendNewsEmail(data: SendNewsEmailRequest): Promise<any> {
        const response = await api.post('/email/news', data);
        return response.data;
    }
}

export default new EmailService();
