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
  incidentCards?: Incident[]; // Thêm field để hiển thị danh sách sự cố dạng card
}