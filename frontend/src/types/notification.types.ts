// Các loại thông báo trong hệ thống nhà máy
export type NotificationType = 
  | 'incident'      // Sự cố
  | 'maintenance'   // Bảo trì
  | 'safety'        // An toàn
  | 'production'    // Sản xuất
  | 'quality'       // Chất lượng
  | 'hr'           // Nhân sự
  | 'system';      // Hệ thống

// Mức độ ưu tiên
export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

// Trạng thái thông báo
export type NotificationStatus = 'unread' | 'read' | 'archived';

// Interface chính cho Notification
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  timestamp: Date;
  status: NotificationStatus;
  relatedId?: string; // ID của incident, maintenance, etc.
  department?: string;
  location?: string;
  actionUrl?: string; // URL để điều hướng khi click
}

// Màu sắc theo loại thông báo
export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  incident: 'bg-red-500',
  maintenance: 'bg-blue-500',
  safety: 'bg-orange-500',
  production: 'bg-green-500',
  quality: 'bg-purple-500',
  hr: 'bg-cyan-500',
  system: 'bg-gray-500',
};

// Icon theo loại thông báo
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  incident: '🚨',
  maintenance: '🔧',
  safety: '⚠️',
  production: '🏭',
  quality: '✓',
  hr: '👥',
  system: '⚙️',
};

// Label tiếng Việt cho loại thông báo
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  incident: 'Sự cố',
  maintenance: 'Bảo trì',
  safety: 'An toàn',
  production: 'Sản xuất',
  quality: 'Chất lượng',
  hr: 'Nhân sự',
  system: 'Hệ thống',
};

// Label tiếng Việt cho mức độ ưu tiên
export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  critical: 'Khẩn cấp',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};
