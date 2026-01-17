/**
 * Incident Service
 * Provides API calls for incident management
 */
import api from './api';

// ============================================
// Types
// ============================================

export interface Incident {
  id: string;
  incident_code: string;
  title: string;
  description: string;
  incident_type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  location?: string;
  machine_code?: string;
  machine_name?: string;
  department_id?: string;
  department_name?: string;
  reporter_id: string;
  reporter_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  escalated_to?: string;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  attachments?: string[];
}

export interface IncidentFilters {
  status?: string;
  priority?: string;
  department_id?: string;
  incident_type?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IncidentStats {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_department: { department_name: string; count: number }[];
  avg_resolution_time_hours: number;
}

export interface CreateIncidentData {
  title: string;
  description: string;
  incident_type: string;
  priority: string;
  location?: string;
  machine_code?: string;
  department_id?: string;
  attachments?: File[];
}

// ============================================
// Incident API Functions
// ============================================

/**
 * Get incidents with filters
 */
export const getIncidents = async (filters?: IncidentFilters): Promise<{
  data: Incident[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
}> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.department_id) params.append('department_id', filters.department_id);
  if (filters?.incident_type) params.append('incident_type', filters.incident_type);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/incidents?${params.toString()}`);
  return response.data;
};

/**
 * Get single incident by ID
 */
export const getIncidentById = async (id: string): Promise<Incident> => {
  const response = await api.get(`/incidents/${id}`);
  return response.data.data;
};

/**
 * Create new incident
 */
export const createIncident = async (data: CreateIncidentData): Promise<Incident> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('incident_type', data.incident_type);
  formData.append('priority', data.priority);
  if (data.location) formData.append('location', data.location);
  if (data.machine_code) formData.append('machine_code', data.machine_code);
  if (data.department_id) formData.append('department_id', data.department_id);
  if (data.attachments) {
    data.attachments.forEach(file => formData.append('attachments', file));
  }

  const response = await api.post('/incidents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

/**
 * Update incident
 */
export const updateIncident = async (id: string, data: Partial<Incident>): Promise<Incident> => {
  const response = await api.put(`/incidents/${id}`, data);
  return response.data.data;
};

/**
 * Assign incident to user
 */
export const assignIncident = async (id: string, assigneeId: string): Promise<Incident> => {
  const response = await api.put(`/incidents/${id}/assign`, { assigned_to: assigneeId });
  return response.data.data;
};

/**
 * Update incident status
 */
export const updateIncidentStatus = async (id: string, status: string, notes?: string): Promise<Incident> => {
  const response = await api.put(`/incidents/${id}/status`, { status, notes });
  return response.data.data;
};

/**
 * Resolve incident
 */
export const resolveIncident = async (id: string, resolutionNotes: string): Promise<Incident> => {
  const response = await api.put(`/incidents/${id}/resolve`, { resolution_notes: resolutionNotes });
  return response.data.data;
};

/**
 * Escalate incident
 */
export const escalateIncident = async (id: string, reason: string): Promise<Incident> => {
  const response = await api.post(`/incidents/${id}/escalate`, { reason });
  return response.data.data;
};

/**
 * Add comment to incident
 */
export const addComment = async (id: string, content: string): Promise<any> => {
  const response = await api.post(`/incidents/${id}/comments`, { content });
  return response.data.data;
};

/**
 * Get incident comments
 */
export const getIncidentComments = async (id: string): Promise<any[]> => {
  const response = await api.get(`/incidents/${id}/comments`);
  return response.data.data;
};

/**
 * Get incident statistics
 */
export const getIncidentStats = async (): Promise<IncidentStats> => {
  const response = await api.get('/incidents/stats');
  return response.data.data;
};

/**
 * Get incident queue (pending incidents)
 */
export const getIncidentQueue = async (): Promise<Incident[]> => {
  const response = await api.get('/incidents/queue');
  return response.data.data;
};

/**
 * Rate incident resolution
 */
export const rateIncident = async (id: string, rating: number, feedback?: string): Promise<void> => {
  await api.post(`/incidents/${id}/rate`, { rating, feedback });
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get status label in Vietnamese
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    open: 'Mở',
    assigned: 'Đã giao',
    in_progress: 'Đang xử lý',
    resolved: 'Đã giải quyết',
    closed: 'Đã đóng',
    escalated: 'Đã leo thang',
  };
  return labels[status] || status;
};

/**
 * Get priority label in Vietnamese
 */
export const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    critical: 'Nghiêm trọng',
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thấp',
  };
  return labels[priority] || priority;
};

/**
 * Get status color class
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    escalated: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get priority color class
 */
export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-black',
    low: 'bg-green-500 text-white',
  };
  return colors[priority] || 'bg-gray-500 text-white';
};

export default {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  assignIncident,
  updateIncidentStatus,
  resolveIncident,
  escalateIncident,
  addComment,
  getIncidentComments,
  getIncidentStats,
  getIncidentQueue,
  rateIncident,
  getStatusLabel,
  getPriorityLabel,
  getStatusColor,
  getPriorityColor,
};
