/* =======================================================
   types.ts
   - Các định nghĩa type và interface dùng chung
======================================================= */

/** Độ khó của ý tưởng */
export type DifficultyLevel = 'A' | 'B' | 'C' | 'D';

/** Trạng thái của ý tưởng / góp ý */
export type StatusType =
  | "new"
  | "under_review"
  | "assigned"
  | "approved"
  | "rejected"
  | "implemented"
  | "completed"
  | "on_hold";

/** Trạng thái tin nhắn nhạy cảm (Pink Box) - Extended for workflow */
export type MessageStatus = "new" | "under_review" | "processed" | "forwarded" | "department_responded" | "coordinator_reviewing" | "published" | "need_revision";
export type HistoryAction = "CREATED" | "FORWARDED" | "REPLIED" | "DEPARTMENT_RESPONDED" | "PUBLISHED" | "REVISION_REQUESTED";

/** Pink Box status labels - Bilingual */
export interface StatusLabel {
  status: string;
  label_vi: string;
  label_ja: string;
  color: string;
}

/** Pink Box forwarding info */
export interface ForwardInfo {
  forwarded_to_department_id?: string;
  forwarded_to_department_name?: string;
  forwarded_at?: Date;
  forwarded_by?: string;
  forwarded_note?: string;
  forwarded_note_ja?: string;
}

/** Department response info */
export interface DepartmentResponse {
  department_response?: string;
  department_response_ja?: string;
  department_responded_at?: Date;
  department_responded_by?: string;
}

/** Published response info */
export interface PublishedInfo {
  published_response?: string;
  published_response_ja?: string;
  published_at?: Date;
  is_published: boolean;
}

/** Meeting info for idea */
export interface IdeaMeeting {
  booking_id: string;
  room_name: string;
  start_time: Date;
  end_time: Date;
  organizer_name: string;
  purpose: string;
}

/** Lịch sử hành động trên tin nhắn nhạy cảm */
export interface HistoryEntry {
  action: HistoryAction;
  timestamp: Date;
  details: string;
  actor: string;
}

/** Phản hồi tin nhắn nhạy cảm */
export interface Reply {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

/** Tin nhắn nhạy cảm (Pink Box) - Extended */
export interface SensitiveMessage {
  id: string;
  isAnonymous: boolean;
  senderName?: string;
  senderId?: string;
  title: string;
  fullContent: string;
  imageUrl?: string;
  timestamp: Date;
  status: MessageStatus;
  difficulty?: DifficultyLevel;
  history: HistoryEntry[];
  replies: Reply[];
  // Extended fields for Pink Box workflow
  forwardInfo?: ForwardInfo;
  departmentResponse?: DepartmentResponse;
  publishedInfo?: PublishedInfo;
  meeting?: IdeaMeeting;
}

/** Current user placeholder - should be replaced with auth context */
export const CURRENT_USER = "Admin";

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
  difficulty?: DifficultyLevel; // Độ khó
  history: ActionHistory[];
  chat: ChatMessage[];
  isRead: boolean; // Đã đọc hay chưa
}
