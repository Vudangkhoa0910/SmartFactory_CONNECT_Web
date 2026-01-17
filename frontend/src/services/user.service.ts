/**
 * User Service
 * Provides API calls for user management
 */
import api from './api';

// ============================================
// Types
// ============================================

export interface User {
  id: string;
  employee_code: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  level: number;
  department_id?: string;
  department_name?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  parent_id?: string;
  is_active: boolean;
  user_count?: number;
  created_at: string;
}

export interface UserFilters {
  role?: string;
  department_id?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserData {
  employee_code: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: string;
  department_id?: string;
}

// ============================================
// User API Functions
// ============================================

/**
 * Get users with filters
 */
export const getUsers = async (filters?: UserFilters): Promise<{
  data: User[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
}> => {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.department_id) params.append('department_id', filters.department_id);
  if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/users?${params.toString()}`);
  return response.data;
};

/**
 * Get single user by ID
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
};

/**
 * Create new user
 */
export const createUser = async (data: CreateUserData): Promise<User> => {
  const response = await api.post('/users', data);
  return response.data.data;
};

/**
 * Update user
 */
export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const response = await api.put(`/users/${id}`, data);
  return response.data.data;
};

/**
 * Delete/deactivate user
 */
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

/**
 * Activate user
 */
export const activateUser = async (id: string): Promise<User> => {
  const response = await api.put(`/users/${id}/activate`);
  return response.data.data;
};

/**
 * Get users by department
 */
export const getUsersByDepartment = async (departmentId: string): Promise<User[]> => {
  const response = await api.get(`/users/department/${departmentId}`);
  return response.data.data;
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: string): Promise<User[]> => {
  const response = await api.get(`/users/role/${role}`);
  return response.data.data;
};

// ============================================
// Department API Functions
// ============================================

/**
 * Get all departments
 */
export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get('/departments');
  return response.data.data;
};

/**
 * Get single department by ID
 */
export const getDepartmentById = async (id: string): Promise<Department> => {
  const response = await api.get(`/departments/${id}`);
  return response.data.data;
};

/**
 * Create new department
 */
export const createDepartment = async (data: Partial<Department>): Promise<Department> => {
  const response = await api.post('/departments', data);
  return response.data.data;
};

/**
 * Update department
 */
export const updateDepartment = async (id: string, data: Partial<Department>): Promise<Department> => {
  const response = await api.put(`/departments/${id}`, data);
  return response.data.data;
};

/**
 * Delete department
 */
export const deleteDepartment = async (id: string): Promise<void> => {
  await api.delete(`/departments/${id}`);
};

// ============================================
// Roles & Levels
// ============================================

export interface Role {
  value: string;
  label: string;
  level: number;
  description?: string;
}

/**
 * Get available roles
 */
export const getRoles = async (): Promise<Role[]> => {
  const response = await api.get('/users/roles');
  return response.data.data;
};

/**
 * Fallback roles if API is not available
 */
export const DEFAULT_ROLES: Role[] = [
  { value: 'admin', label: 'Quản trị viên', level: 1, description: 'Toàn quyền hệ thống' },
  { value: 'general_manager', label: 'Giám đốc/GM', level: 1, description: 'Quản lý cấp cao' },
  { value: 'manager', label: 'Trưởng phòng', level: 2, description: 'Quản lý phòng ban' },
  { value: 'supervisor', label: 'Giám sát viên', level: 3, description: 'Giám sát sản xuất' },
  { value: 'team_leader', label: 'Trưởng nhóm', level: 5, description: 'Quản lý nhóm' },
  { value: 'operator', label: 'Công nhân', level: 6, description: 'Vận hành máy móc' },
  { value: 'technician', label: 'Kỹ thuật viên', level: 7, description: 'Bảo trì kỹ thuật' },
  { value: 'qc_inspector', label: 'QC', level: 8, description: 'Kiểm tra chất lượng' },
  { value: 'viewer', label: 'Xem', level: 10, description: 'Chỉ xem' },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get role label in Vietnamese
 */
export const getRoleLabel = (role: string): string => {
  const roleObj = DEFAULT_ROLES.find(r => r.value === role);
  return roleObj?.label || role;
};

/**
 * Get level label
 */
export const getLevelLabel = (level: number): string => {
  const labels: Record<number, string> = {
    1: 'Cấp 1 - Admin/GM',
    2: 'Cấp 2 - Manager',
    3: 'Cấp 3 - Supervisor',
    5: 'Cấp 5 - Team Leader',
    6: 'Cấp 6 - Operator',
    7: 'Cấp 7 - Technician',
    8: 'Cấp 8 - QC',
    10: 'Cấp 10 - Viewer',
  };
  return labels[level] || `Cấp ${level}`;
};

/**
 * Check if user has web access
 */
export const hasWebAccess = (level: number): boolean => {
  return level <= 3;
};

/**
 * Format last login time
 */
export const formatLastLogin = (dateStr?: string): string => {
  if (!dateStr) return 'Chưa đăng nhập';
  const date = new Date(dateStr);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default {
  // User functions
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  getUsersByDepartment,
  getUsersByRole,
  
  // Department functions
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  
  // Role functions
  getRoles,
  DEFAULT_ROLES,
  
  // Helpers
  getRoleLabel,
  getLevelLabel,
  hasWebAccess,
  formatLastLogin,
};
