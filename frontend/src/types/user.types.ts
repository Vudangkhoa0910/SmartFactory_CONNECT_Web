/**
 * User & Department Types - SmartFactory CONNECT
 * Types for User Management and Department Structure
 */

// Role Types
export type UserRole = 
  | 'admin'
  | 'general_manager'
  | 'manager'
  | 'supervisor'
  | 'team_leader'
  | 'operator'
  | 'technician'
  | 'qc_inspector'
  | 'maintenance_staff'
  | 'viewer';

export const ROLE_LEVELS: Record<UserRole, number> = {
  admin: 1,
  general_manager: 1,
  manager: 2,
  supervisor: 3,
  team_leader: 5,
  operator: 6,
  technician: 7,
  qc_inspector: 8,
  maintenance_staff: 9,
  viewer: 10,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  general_manager: 'Tổng Giám đốc',
  manager: 'Trưởng phòng',
  supervisor: 'Giám sát viên',
  team_leader: 'Tổ trưởng',
  operator: 'Nhân viên vận hành',
  technician: 'Kỹ thuật viên',
  qc_inspector: 'Kiểm tra chất lượng',
  maintenance_staff: 'Nhân viên bảo trì',
  viewer: 'Người xem',
};

// User Types
export interface User {
  id: string;
  employee_code: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  level: number;
  department_id?: string;
  department_name?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserDetail extends User {
  manager?: {
    id: string;
    name: string;
    employee_code: string;
  };
  team_size?: number;
  permissions: UserPermissions;
  activity_summary?: UserActivitySummary;
  devices?: UserDevice[];
}

export interface UserPermissions {
  has_web_access: boolean;
  has_mobile_access: boolean;
  can_view_dashboard: boolean;
  can_manage_users: boolean;
  can_review_ideas: boolean;
  can_view_pink_box: boolean;
  can_create_news: boolean;
  can_approve_bookings: boolean;
  can_assign_incidents: boolean;
}

export interface UserActivitySummary {
  ideas_submitted: number;
  ideas_approved: number;
  ideas_pending: number;
  ideas_rejected: number;
  incidents_reported: number;
  incidents_resolved: number;
  incidents_open: number;
  bookings_made: number;
  bookings_approved: number;
  bookings_pending: number;
  gamification_points: number;
  rank?: number;
}

export interface UserDevice {
  id: string;
  device_type: 'web' | 'ios' | 'android';
  device_name: string;
  last_active: string;
  ip_address?: string;
  is_current?: boolean;
}

// Department Types
export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  parent_name?: string;
  manager_id?: string;
  manager_name?: string;
  manager_code?: string;
  is_active: boolean;
  employee_count: number;
  created_at: string;
  updated_at?: string;
}

export interface DepartmentDetail extends Department {
  children?: Department[];
  manager?: User;
  stats?: DepartmentStats;
}

export interface DepartmentStats {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  open_incidents: number;
  resolved_incidents: number;
  pending_ideas: number;
  approved_ideas: number;
  upcoming_bookings: number;
  completed_bookings: number;
}

export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[];
  expanded?: boolean;
}

// Filters
export interface UserFilters {
  search?: string;
  role?: UserRole | UserRole[];
  department_id?: string;
  is_active?: boolean;
  last_login?: 'any' | '7days' | '30days' | '90days' | 'never';
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DepartmentFilters {
  search?: string;
  parent_id?: string | null;
  is_active?: boolean;
  has_manager?: boolean;
}

// API Responses
export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DepartmentsResponse {
  success: boolean;
  data: Department[];
}

// Bulk Operations
export interface BulkUserOperation {
  user_ids: string[];
  action: 'activate' | 'deactivate' | 'change_role' | 'change_department' | 'reset_password' | 'delete';
  params?: {
    role?: UserRole;
    department_id?: string;
  };
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{
    user_id: string;
    error: string;
  }>;
}
