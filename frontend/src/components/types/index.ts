// src/types/index.ts

// =======================================================
// CÁC KIỂU DỮ LIỆU CHO QUẢN LÝ SỰ CỐ (INCIDENT)
// =======================================================

export type Status =
  | "Mới"
  | "Đã tiếp nhận"
  | "Đang xử lý"
  | "Tạm dừng"
  | "Hoàn thành"
  | "Đã đóng";

export type Priority = "Critical" | "High" | "Normal" | "Low";

export interface Incident {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  assignedTo: string;
  location: string;
  createdAt: Date;
}

/**
 * Định nghĩa cấu trúc cho một "Ý tưởng" trong Hòm thư.
 */
export interface PublicIdea {
  id: string;
  title: string;
  senderName: string;
  group: string;
  timestamp: Date;
  isRead: boolean;
  content: string;
}
