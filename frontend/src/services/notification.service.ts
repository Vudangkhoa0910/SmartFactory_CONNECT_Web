import { Notification } from '../types/notification.types';

/**
 * Service để quản lý thông báo
 */
class NotificationService {
  private storageKey = 'smartfactory_notifications';

  /**
   * Lấy tất cả thông báo từ localStorage
   */
  getNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const notifications = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return notifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  /**
   * Lưu thông báo vào localStorage
   */
  saveNotifications(notifications: Notification[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  /**
   * Thêm thông báo mới
   */
  addNotification(notification: Notification): void {
    const notifications = this.getNotifications();
    notifications.unshift(notification); // Thêm vào đầu mảng
    
    // Giữ tối đa 50 thông báo
    if (notifications.length > 50) {
      notifications.splice(50);
    }
    
    this.saveNotifications(notifications);
  }

  /**
   * Đánh dấu thông báo là đã đọc
   */
  markAsRead(notificationId: string): void {
    const notifications = this.getNotifications();
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, status: 'read' as const } : n
    );
    this.saveNotifications(updated);
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead(): void {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, status: 'read' as const }));
    this.saveNotifications(updated);
  }

  /**
   * Xóa thông báo
   */
  deleteNotification(notificationId: string): void {
    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    this.saveNotifications(filtered);
  }

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  getUnreadCount(): number {
    const notifications = this.getNotifications();
    return notifications.filter(n => n.status === 'unread').length;
  }

  /**
   * Lấy thông báo chưa đọc
   */
  getUnreadNotifications(): Notification[] {
    const notifications = this.getNotifications();
    return notifications.filter(n => n.status === 'unread');
  }

  /**
   * Lọc thông báo theo loại
   */
  filterByType(type: string): Notification[] {
    const notifications = this.getNotifications();
    return notifications.filter(n => n.type === type);
  }

  /**
   * Lọc thông báo theo độ ưu tiên
   */
  filterByPriority(priority: string): Notification[] {
    const notifications = this.getNotifications();
    return notifications.filter(n => n.priority === priority);
  }

  /**
   * Xóa tất cả thông báo
   */
  clearAll(): void {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Khởi tạo dữ liệu mẫu (chỉ dùng lần đầu)
   */
  initializeSampleData(sampleNotifications: Notification[]): void {
    const existing = this.getNotifications();
    if (existing.length === 0) {
      this.saveNotifications(sampleNotifications);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
