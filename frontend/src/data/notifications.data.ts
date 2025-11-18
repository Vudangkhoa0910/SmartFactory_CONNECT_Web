import { Notification } from '../types/notification.types';

/**
 * Dữ liệu mẫu thông báo cho hệ thống nhà máy thông minh
 */
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    type: 'incident',
    priority: 'critical',
    title: 'Sự cố khẩn cấp: Máy dập D3 ngừng hoạt động',
    message: 'Máy dập số D3 tại phân xưởng lắp ráp đã ngừng hoạt động đột ngột. Cần kỹ thuật viên kiểm tra ngay.',
    sender: {
      id: 'user-001',
      name: 'Nguyễn Văn Tuấn',
      avatar: '/images/user/user-01.jpg',
      role: 'Trưởng ca sản xuất',
    },
    timestamp: new Date(Date.now() - 5 * 60000), // 5 phút trước
    status: 'unread',
    relatedId: 'INC-7845',
    department: 'Phân xưởng lắp ráp',
    location: 'Dây chuyền D - Khu vực 3',
    actionUrl: '/error-report/queue',
  },
  {
    id: 'notif-002',
    type: 'safety',
    priority: 'critical',
    title: 'Cảnh báo an toàn: Phát hiện khí độc vượt ngưỡng',
    message: 'Cảm biến phát hiện nồng độ khí CO tại khu vực kho hóa chất vượt ngưỡng cho phép. Sơ tán nhân viên ngay lập tức.',
    sender: {
      id: 'system-001',
      name: 'Hệ thống giám sát',
      avatar: '/images/icons/system-alert.png',
      role: 'Hệ thống',
    },
    timestamp: new Date(Date.now() - 8 * 60000), // 8 phút trước
    status: 'unread',
    department: 'An toàn lao động',
    location: 'Kho hóa chất - Tầng 1',
    actionUrl: '/safety/alerts',
  },
  {
    id: 'notif-003',
    type: 'maintenance',
    priority: 'high',
    title: 'Lịch bảo trì định kỳ: Băng tải chính số 5',
    message: 'Băng tải chính số 5 sẽ được bảo trì định kỳ vào ngày mai lúc 14:00. Vui lòng sắp xếp công việc phù hợp.',
    sender: {
      id: 'user-002',
      name: 'Trần Minh Đức',
      avatar: '/images/user/user-02.jpg',
      role: 'Kỹ sư bảo trì',
    },
    timestamp: new Date(Date.now() - 15 * 60000), // 15 phút trước
    status: 'unread',
    department: 'Phòng kỹ thuật',
    location: 'Phân xưởng chính',
    actionUrl: '/maintenance/schedule',
  },
  {
    id: 'notif-004',
    type: 'production',
    priority: 'high',
    title: 'Năng suất vượt kế hoạch: Ca 1 hoàn thành 115%',
    message: 'Ca 1 đã hoàn thành 115% kế hoạch sản xuất ngày. Chúc mừng toàn bộ đội ngũ sản xuất!',
    sender: {
      id: 'user-003',
      name: 'Lê Thị Mai',
      avatar: '/images/user/user-03.jpg',
      role: 'Quản đốc sản xuất',
    },
    timestamp: new Date(Date.now() - 30 * 60000), // 30 phút trước
    status: 'read',
    department: 'Sản xuất',
    location: 'Phân xưởng chính',
    actionUrl: '/dashboard/production',
  },
  {
    id: 'notif-005',
    type: 'quality',
    priority: 'high',
    title: 'Cảnh báo chất lượng: Lô hàng #2024-1118-A',
    message: 'Phát hiện 8% sản phẩm không đạt tiêu chuẩn trong lô hàng #2024-1118-A. Cần kiểm tra quy trình ngay.',
    sender: {
      id: 'user-004',
      name: 'Phạm Quốc Khánh',
      avatar: '/images/user/user-04.jpg',
      role: 'QC trưởng',
    },
    timestamp: new Date(Date.now() - 45 * 60000), // 45 phút trước
    status: 'unread',
    relatedId: 'QC-1118-001',
    department: 'Kiểm soát chất lượng',
    location: 'Khu vực QC',
    actionUrl: '/quality/reports',
  },
  {
    id: 'notif-006',
    type: 'maintenance',
    priority: 'medium',
    title: 'Hoàn thành bảo trì: Máy tiện CNC T7',
    message: 'Máy tiện CNC T7 đã được bảo trì và kiểm tra xong. Đã sẵn sàng đưa vào sử dụng trở lại.',
    sender: {
      id: 'user-005',
      name: 'Đỗ Văn Hùng',
      avatar: '/images/user/user-05.jpg',
      role: 'Kỹ thuật viên',
    },
    timestamp: new Date(Date.now() - 60 * 60000), // 1 giờ trước
    status: 'read',
    department: 'Phòng kỹ thuật',
    location: 'Phân xưởng gia công',
    actionUrl: '/maintenance/completed',
  },
  {
    id: 'notif-007',
    type: 'hr',
    priority: 'medium',
    title: 'Thông báo: Đào tạo an toàn lao động tháng 11',
    message: 'Khóa đào tạo an toàn lao động định kỳ tháng 11 sẽ được tổ chức vào 25/11/2024 tại hội trường tầng 2.',
    sender: {
      id: 'user-006',
      name: 'Nguyễn Thu Hà',
      avatar: '/images/user/user-06.jpg',
      role: 'Trưởng phòng Nhân sự',
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 giờ trước
    status: 'read',
    department: 'Nhân sự',
    actionUrl: '/hr/training',
  },
  {
    id: 'notif-008',
    type: 'incident',
    priority: 'medium',
    title: 'Đã xử lý: Sự cố rò rỉ dầu tại máy B12',
    message: 'Sự cố rò rỉ dầu tại máy B12 đã được xử lý hoàn tất. Máy đã hoạt động trở lại bình thường.',
    sender: {
      id: 'user-007',
      name: 'Vũ Đăng Khoa',
      avatar: '/images/user/user-07.jpg',
      role: 'Kỹ sư bảo trì',
    },
    timestamp: new Date(Date.now() - 3 * 60 * 60000), // 3 giờ trước
    status: 'read',
    relatedId: 'INC-7840',
    department: 'Phòng kỹ thuật',
    location: 'Phân xưởng B',
    actionUrl: '/error-report/resolved',
  },
  {
    id: 'notif-009',
    type: 'production',
    priority: 'low',
    title: 'Cập nhật kế hoạch: Thay đổi lịch sản xuất tuần 47',
    message: 'Kế hoạch sản xuất tuần 47 đã được điều chỉnh. Vui lòng kiểm tra lịch mới trên hệ thống.',
    sender: {
      id: 'user-008',
      name: 'Hoàng Minh Tuấn',
      avatar: '/images/user/user-08.jpg',
      role: 'Trưởng phòng KHHĐ',
    },
    timestamp: new Date(Date.now() - 5 * 60 * 60000), // 5 giờ trước
    status: 'read',
    department: 'Kế hoạch - Hành động',
    actionUrl: '/production/schedule',
  },
  {
    id: 'notif-010',
    type: 'system',
    priority: 'low',
    title: 'Cập nhật hệ thống: Phiên bản mới v2.3.0',
    message: 'Hệ thống SmartFactory CONNECT đã được cập nhật lên phiên bản v2.3.0 với nhiều tính năng mới.',
    sender: {
      id: 'system-002',
      name: 'Hệ thống',
      avatar: '/images/icons/system.png',
      role: 'Hệ thống',
    },
    timestamp: new Date(Date.now() - 24 * 60 * 60000), // 1 ngày trước
    status: 'read',
    department: 'IT',
    actionUrl: '/system/updates',
  },
];

/**
 * Lấy số lượng thông báo chưa đọc
 */
export const getUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter(n => n.status === 'unread').length;
};

/**
 * Lọc thông báo theo loại
 */
export const filterNotificationsByType = (
  notifications: Notification[],
  type: string
): Notification[] => {
  return notifications.filter(n => n.type === type);
};

/**
 * Lọc thông báo chưa đọc
 */
export const getUnreadNotifications = (notifications: Notification[]): Notification[] => {
  return notifications.filter(n => n.status === 'unread');
};

/**
 * Format thời gian hiển thị
 */
export const formatNotificationTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  
  return timestamp.toLocaleDateString('vi-VN');
};
