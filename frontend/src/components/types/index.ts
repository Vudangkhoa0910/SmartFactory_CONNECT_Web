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
  | "Đã đóng"
  | "Đã xử lý";

export type Priority = "Critical" | "High" | "Normal" | "Low";

export interface Incident {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  assignedTo: string;
  location: string;
  createdAt: Date;
  // Additional optional fields used by IncidentQueue
  timestamp?: Date;
  source?: string;
  description?: string;
  reporter?: string;
  department?: string;
  history?: IncidentHistoryEntry[];
  images?: string[];
}

export interface IncidentHistoryEntry {
  action: string;
  time: Date | string;
  note?: string;
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
