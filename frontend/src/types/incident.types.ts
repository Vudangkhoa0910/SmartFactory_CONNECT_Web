/**
 * Incident Types - SmartFactory CONNECT
 * Types for Incident Management System
 */

// Status & Priority
export type IncidentStatus = 'new' | 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low';
export type IncidentCategory = 'machine' | 'quality' | 'safety' | 'process' | 'material' | 'other';

// SLA Configuration
export interface SLAConfig {
  priority: IncidentPriority;
  response_time_hours: number;
  resolution_time_hours: number;
  escalation_time_hours: number;
}

export const DEFAULT_SLA: Record<IncidentPriority, SLAConfig> = {
  critical: { priority: 'critical', response_time_hours: 0.5, resolution_time_hours: 2, escalation_time_hours: 1 },
  high: { priority: 'high', response_time_hours: 1, resolution_time_hours: 4, escalation_time_hours: 2 },
  medium: { priority: 'medium', response_time_hours: 2, resolution_time_hours: 8, escalation_time_hours: 4 },
  low: { priority: 'low', response_time_hours: 4, resolution_time_hours: 24, escalation_time_hours: 8 },
};

// Labels
export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  new: 'Mới',
  open: 'Đang mở',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
  escalated: 'Leo thang',
};

export const INCIDENT_PRIORITY_LABELS: Record<IncidentPriority, string> = {
  critical: 'Nghiêm trọng',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  machine: 'Máy móc',
  quality: 'Chất lượng',
  safety: 'An toàn',
  process: 'Quy trình',
  material: 'Vật liệu',
  other: 'Khác',
};

// Colors
export const PRIORITY_COLORS: Record<IncidentPriority, { text: string; bg: string; border: string }> = {
  critical: { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-500' },
  high: { text: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-500' },
  medium: { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-500' },
  low: { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-500' },
};

export const STATUS_COLORS: Record<IncidentStatus, { text: string; bg: string; border: string }> = {
  new: { text: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-500' },
  open: { text: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-500' },
  in_progress: { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-500' },
  resolved: { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-500' },
  closed: { text: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-500' },
  escalated: { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-500' },
};

// Main Incident Type
export interface Incident {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  location?: string;
  machine_id?: string;
  machine_name?: string;
  
  // Reporter
  reporter_id: string;
  reporter_name: string;
  reporter_department?: string;
  
  // Assignment
  assigned_to_id?: string;
  assigned_to_name?: string;
  assigned_department_id?: string;
  assigned_department_name?: string;
  
  // Media
  images?: string[];
  attachments?: IncidentAttachment[];
  
  // SLA Tracking
  sla_response_deadline?: string;
  sla_resolution_deadline?: string;
  sla_status: 'on_track' | 'at_risk' | 'overdue';
  response_time_minutes?: number;
  resolution_time_minutes?: number;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  
  // Resolution
  resolution_notes?: string;
  root_cause?: string;
  preventive_action?: string;
}

export interface IncidentAttachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
  uploaded_by: string;
}

export interface IncidentComment {
  id: string;
  incident_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  attachments?: IncidentAttachment[];
  mentions?: string[];
  created_at: string;
  updated_at?: string;
  is_internal?: boolean;
}

export interface IncidentHistory {
  id: string;
  incident_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  user_id: string;
  user_name: string;
  created_at: string;
  details?: string;
}

// Related Incidents (ML suggested)
export interface RelatedIncident {
  id: string;
  incident_number: string;
  title: string;
  similarity_score: number;
  status: IncidentStatus;
  resolution_notes?: string;
  resolved_at?: string;
}

// Filters
export interface IncidentFilters {
  search?: string;
  status?: IncidentStatus | IncidentStatus[];
  priority?: IncidentPriority | IncidentPriority[];
  category?: IncidentCategory | IncidentCategory[];
  department_id?: string;
  assigned_to_id?: string;
  reporter_id?: string;
  sla_status?: 'on_track' | 'at_risk' | 'overdue';
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Kanban View
export interface KanbanColumn {
  id: IncidentStatus;
  title: string;
  color: string;
  incidents: Incident[];
  count: number;
}

// Queue Item
export interface QueueIncident extends Incident {
  wait_time_minutes: number;
  sla_remaining_minutes?: number;
  is_claimed: boolean;
  claimed_by?: string;
}

// Statistics
export interface IncidentStats {
  total: number;
  by_status: Record<IncidentStatus, number>;
  by_priority: Record<IncidentPriority, number>;
  by_category: Record<IncidentCategory, number>;
  avg_response_time: number;
  avg_resolution_time: number;
  sla_compliance: number;
  trends: {
    date: string;
    created: number;
    resolved: number;
  }[];
}

// API Responses
export interface IncidentsResponse {
  success: boolean;
  data: Incident[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IncidentDetailResponse {
  success: boolean;
  data: Incident & {
    comments: IncidentComment[];
    history: IncidentHistory[];
    related: RelatedIncident[];
  };
}

// Actions
export interface CreateIncidentData {
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  location?: string;
  machine_id?: string;
  images?: File[];
}

export interface UpdateIncidentData {
  title?: string;
  description?: string;
  category?: IncidentCategory;
  priority?: IncidentPriority;
  status?: IncidentStatus;
  assigned_to_id?: string;
  assigned_department_id?: string;
  resolution_notes?: string;
  root_cause?: string;
  preventive_action?: string;
}

export interface AssignIncidentData {
  assigned_to_id?: string;
  assigned_department_id?: string;
  notes?: string;
}

export interface EscalateIncidentData {
  escalate_to_id: string;
  reason: string;
  notes?: string;
}
