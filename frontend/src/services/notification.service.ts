/**
 * Notification Service
 * Provides API calls for notifications (no more localStorage/mock data)
 */
import api from './api';

// ============================================
// Types
// ============================================

export interface NotificationSender {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface Notification {
  id: string;
  type: 'incident' | 'idea' | 'safety' | 'maintenance' | 'production' | 'quality' | 'system' | 'booking';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  sender?: NotificationSender;
  timestamp: Date;
  status: 'unread' | 'read';
  related_id?: string;
  reference_type?: string;
  department?: string;
  location?: string;
  action_url?: string;
}

export interface NotificationFilters {
  type?: string;
  priority?: string;
  status?: 'unread' | 'read';
  start_date?: string;
  end_date?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

// ============================================
// Notification API Functions
// ============================================

/**
 * Get all notifications for current user
 */
export const getNotifications = async (filters?: NotificationFilters): Promise<Notification[]> => {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  
  const response = await api.get(`/notifications?${params.toString()}`);
  return response.data.data.map((n: any) => ({
    ...n,
    timestamp: new Date(n.created_at || n.timestamp),
  }));
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread-count');
  return response.data.data.count;
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (): Promise<NotificationStats> => {
  const response = await api.get('/notifications/stats');
  return response.data.data;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  await api.put(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.put('/notifications/read-all');
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
  await api.delete('/notifications/clear-all');
};

/**
 * Get recent notifications (for dropdown)
 */
export const getRecentNotifications = async (limit: number = 10): Promise<Notification[]> => {
  const response = await api.get(`/notifications/recent?limit=${limit}`);
  return response.data.data.map((n: any) => ({
    ...n,
    timestamp: new Date(n.created_at || n.timestamp),
  }));
};

// ============================================
// Notification Preferences
// ============================================

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  incident_alerts: boolean;
  idea_updates: boolean;
  booking_reminders: boolean;
  system_announcements: boolean;
}

/**
 * Get notification preferences
 */
export const getPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get('/notifications/preferences');
  return response.data.data;
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (preferences: Partial<NotificationPreferences>): Promise<void> => {
  await api.put('/notifications/preferences', preferences);
};

// ============================================
// Helper Functions
// ============================================

/**
 * Format notification time for display
 */
export const formatNotificationTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Get notification type label in Vietnamese
 */
export const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    incident: 'Sự cố',
    idea: 'Ý tưởng',
    safety: 'An toàn',
    maintenance: 'Bảo trì',
    production: 'Sản xuất',
    quality: 'Chất lượng',
    system: 'Hệ thống',
    booking: 'Đặt phòng',
  };
  return labels[type] || type;
};

/**
 * Get priority label in Vietnamese
 */
export const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    critical: 'Nghiêm trọng',
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thấp',
  };
  return labels[priority] || priority;
};

/**
 * Get priority color class
 */
export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };
  return colors[priority] || 'bg-gray-500';
};

export default {
  getNotifications,
  getUnreadCount,
  getNotificationStats,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getRecentNotifications,
  getPreferences,
  updatePreferences,
  formatNotificationTime,
  getTypeLabel,
  getPriorityLabel,
  getPriorityColor,
};
