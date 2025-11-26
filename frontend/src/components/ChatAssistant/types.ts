import React from 'react';

// Dùng cho các nút hành động nhanh
export interface QuickAction {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  description: string;
}

// Dùng cho dữ liệu thông báo từ API
export interface Notification {
  id: string;
  title: string;
  message?: string;
  content?: string;
  status?: string;
  is_read?: boolean;
  created_at?: string;
  type?: string;
}

// Dùng cho dữ liệu sự cố từ API
export interface Incident {
  id: string;
  title: string;
  description?: string;
  incident_type: string;
  priority: string;
  status: string;
  location?: string;
  reporter_name?: string;
  reporter_code?: string;
  assigned_to_name?: string;
  department_name?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
}

// Dùng cho dữ liệu ý tưởng từ API
export interface Idea {
  id: string;
  ideabox_type: 'white' | 'pink';
  category: string;
  title: string;
  description?: string;
  expected_benefit?: string;
  status: string;
  submitter_id?: string;
  submitter_name?: string;
  department_id?: string;
  department_name?: string;
  is_anonymous?: boolean;
  attachments?: string;
  handler_level?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  feasibility_score?: number;
  impact_score?: number;
  implementation_cost?: number;
  implementation_time?: number;
  reviewed_by?: string;
  reviewed_by_name?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
  implemented_at?: string;
}

// Dùng cho dữ liệu phản hồi ý tưởng
export interface IdeaResponse {
  id: string;
  response: string;
  attachments?: unknown[];
  created_at: string;
  user_id: string;
  user_name: string;
  user_role: string;
  user_level: number;
  department_name?: string;
}

// Dùng cho lịch sử ý tưởng
export interface IdeaHistory {
  id: string;
  action: string;
  details: {
    note?: string;
    old_status?: string;
    new_status?: string;
    review_notes?: string;
    [key: string]: unknown;
  };
  created_at: string;
  user_id: string;
  user_name: string;
  user_role: string;
  user_level: number;
  department_name?: string;
}

// Dùng trong nội bộ component để hiển thị tin nhắn
export interface UIMessage {
  role: 'user' | 'model';
  text: string;
  actions?: {
    label:string;
    onClick: () => void;
    className?: string;
  }[];
  notificationCards?: Notification[];
  incidentCards?: Incident[];
  ideaCards?: Idea[];
}