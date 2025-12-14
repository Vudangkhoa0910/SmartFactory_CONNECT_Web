/**
 * Notification Types - SmartFactory CONNECT
 * Types for Real-time Notification System
 */

// Types
export type NotificationType = 
  | 'incident_created'
  | 'incident_assigned'
  | 'incident_updated'
  | 'incident_resolved'
  | 'incident_escalated'
  | 'incident_sla_warning'
  | 'incident_sla_breach'
  | 'idea_submitted'
  | 'idea_reviewed'
  | 'idea_implemented'
  | 'idea_comment'
  | 'idea_voted'
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'booking_invite'
  | 'news_published'
  | 'news_urgent'
  | 'mention'
  | 'system'
  | 'announcement';

export type NotificationPriority = 'high' | 'normal' | 'low';
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

// Labels
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  incident_created: 'Sự cố mới',
  incident_assigned: 'Phân công sự cố',
  incident_updated: 'Cập nhật sự cố',
  incident_resolved: 'Sự cố đã giải quyết',
  incident_escalated: 'Sự cố leo thang',
  incident_sla_warning: 'Cảnh báo SLA',
  incident_sla_breach: 'Vi phạm SLA',
  idea_submitted: 'Ý tưởng mới',
  idea_reviewed: 'Ý tưởng được xem xét',
  idea_implemented: 'Ý tưởng được triển khai',
  idea_comment: 'Bình luận ý tưởng',
  idea_voted: 'Bình chọn ý tưởng',
  booking_created: 'Đặt phòng mới',
  booking_confirmed: 'Xác nhận đặt phòng',
  booking_cancelled: 'Hủy đặt phòng',
  booking_reminder: 'Nhắc nhở cuộc họp',
  booking_invite: 'Lời mời cuộc họp',
  news_published: 'Tin mới',
  news_urgent: 'Thông báo khẩn',
  mention: 'Được nhắc đến',
  system: 'Hệ thống',
  announcement: 'Thông báo chung',
};

// Main Notification Type
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  
  // Content
  title: string;
  message: string;
  
  // Reference
  reference_type?: 'incident' | 'idea' | 'booking' | 'news' | 'user';
  reference_id?: string;
  reference_url?: string;
  
  // Recipient
  user_id: string;
  
  // Sender
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  
  // Status
  is_read: boolean;
  read_at?: string;
  
  // Actions
  actions?: NotificationAction[];
  
  // Timestamps
  created_at: string;
  expires_at?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: 'view' | 'approve' | 'reject' | 'claim' | 'dismiss' | 'custom';
  url?: string;
  is_primary?: boolean;
}

// Grouped Notifications
export interface NotificationGroup {
  date: string; // 'today', 'yesterday', '2024-01-15'
  label: string; // 'Hôm nay', 'Hôm qua', '15/01/2024'
  notifications: Notification[];
}

// Notification Badge
export interface NotificationBadge {
  total_unread: number;
  by_type: Partial<Record<NotificationType, number>>;
  high_priority_count: number;
}

// Preferences
export interface NotificationPreferences {
  user_id: string;
  
  // Channel preferences
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  // Type preferences
  types: Partial<Record<NotificationType, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>>;
  
  // Schedule
  quiet_hours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
    timezone: string;
  };
  
  // Email digest
  email_digest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // HH:mm
  };
  
  updated_at: string;
}

// Filters
export interface NotificationFilters {
  type?: NotificationType | NotificationType[];
  priority?: NotificationPriority | NotificationPriority[];
  is_read?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

// Real-time Events
export interface NotificationEvent {
  event: 'new_notification' | 'notification_read' | 'badge_update';
  data: Notification | NotificationBadge;
}

// API Responses
export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationBadgeResponse {
  success: boolean;
  data: NotificationBadge;
}

// Actions
export interface MarkReadData {
  notification_ids: string[];
}

export interface MarkAllReadData {
  type?: NotificationType;
}

export interface UpdatePreferencesData {
  channels?: Partial<NotificationPreferences['channels']>;
  types?: Partial<NotificationPreferences['types']>;
  quiet_hours?: NotificationPreferences['quiet_hours'];
  email_digest?: NotificationPreferences['email_digest'];
}

// Sound & Desktop Notification
export interface NotificationSound {
  enabled: boolean;
  volume: number;
  sound_file: string;
}

export interface DesktopNotificationConfig {
  enabled: boolean;
  permission: 'granted' | 'denied' | 'default';
}
