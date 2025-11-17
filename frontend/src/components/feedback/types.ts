/* =======================================================
   types.ts
   - Các định nghĩa type và interface dùng chung
======================================================= */

/** Trạng thái của ý tưởng / góp ý */
export type StatusType =
  | "Mới"
  | "Đang xem xét"
  | "Đã chuyển Manager"
  | "Đã duyệt"
  | "Đã từ chối"
  | "Đã triển khai"
  | "Đã hoàn tất";

/** Tin nhắn chat giữa user / manager */
export interface ChatMessage {
  id: string;
  sender: "user" | "manager";
  text: string;
  time: Date;
}

/** Lịch sử hành động trên ý tưởng */
export interface ActionHistory {
  time: Date;
  by: string; // Ai thực hiện
  action: string; // Ví dụ: "Đã duyệt", "Đã từ chối"
  note?: string; // Phương hướng giải quyết hoặc ghi chú
}

/** Ý tưởng / góp ý */
export interface PublicIdea {
  id: string;
  senderId: string;
  senderName: string;
  group: string; // Nhóm / team
  line: string; // Dây chuyền
  title: string; // Tiêu đề
  content: string; // Nội dung chi tiết
  imageUrl?: string; // Hình ảnh nếu có
  timestamp: Date; // Thời gian gửi
  status: StatusType; // Trạng thái hiện tại
  history: ActionHistory[];
  chat: ChatMessage[];
}
