/**
 * Dashboard Service
 * Provides API calls for dashboard statistics and chart data
 */
import api from './api';

// ============================================
// Types
// ============================================

export interface IncidentTrendData {
  categories: string[];
  reported: number[];
  resolved: number[];
}

export interface ProcessingTimeData {
  categories: string[];
  avgHours: number[];
}

export interface DepartmentKPIData {
  categories: string[];
  kpiPercentages: number[];
}

export interface TopMachineData {
  machine_code: string;
  machine_name: string;
  error_count: number;
  department: string;
}

export interface DashboardSummary {
  total_incidents: number;
  pending_incidents: number;
  resolved_incidents: number;
  total_ideas: number;
  pending_ideas: number;
  pending_white_ideas: number;
  pending_pink_ideas: number;
  implemented_ideas: number;
  active_users: number;
  departments_count: number;
}

export interface MonthlyStats {
  month: string;
  incidents_reported: number;
  incidents_resolved: number;
  ideas_submitted: number;
  ideas_implemented: number;
}

export interface PriorityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DepartmentStats {
  department_id: string;
  department_name: string;
  total_incidents: number;
  resolved_incidents: number;
  avg_resolution_time_hours: number;
  kpi_percentage: number;
}

// ============================================
// Dashboard API Functions
// ============================================

/**
 * Get dashboard summary statistics
 */
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await api.get('/dashboard/summary');
  return response.data.data;
};

/**
 * Get incident trend data for charts
 * @param period - 'week' | 'month' | 'quarter' | 'year'
 */
export const getIncidentTrend = async (period: string = 'year'): Promise<IncidentTrendData> => {
  const response = await api.get(`/dashboard/incident-trend?period=${period}`);
  return response.data.data;
};

/**
 * Get average processing time by priority
 */
export const getProcessingTimeByPriority = async (): Promise<ProcessingTimeData> => {
  const response = await api.get('/dashboard/processing-time');
  return response.data.data;
};

/**
 * Get department KPI data
 * @param months - Number of months to include (default: 6)
 */
export const getDepartmentKPI = async (months: number = 6): Promise<DepartmentKPIData> => {
  const response = await api.get(`/dashboard/department-kpi?months=${months}`);
  return response.data.data;
};

/**
 * Get top machines with most errors
 * @param limit - Number of machines to return (default: 10)
 */
export const getTopMachinesWithErrors = async (limit: number = 10): Promise<TopMachineData[]> => {
  const response = await api.get(`/dashboard/top-machines?limit=${limit}`);
  return response.data.data;
};

/**
 * Get monthly statistics
 * @param months - Number of months (default: 12)
 */
export const getMonthlyStats = async (months: number = 12): Promise<MonthlyStats[]> => {
  const response = await api.get(`/dashboard/monthly-stats?months=${months}`);
  return response.data.data;
};

/**
 * Get incident priority distribution
 */
export const getPriorityDistribution = async (): Promise<PriorityDistribution> => {
  const response = await api.get('/dashboard/priority-distribution');
  return response.data.data;
};

/**
 * Get department statistics
 */
export const getDepartmentStats = async (): Promise<DepartmentStats[]> => {
  const response = await api.get('/dashboard/department-stats');
  return response.data.data;
};

/**
 * Get real-time dashboard data (for live updates)
 */
export const getRealTimeStats = async (): Promise<{
  pending_critical: number;
  processing_now: number;
  resolved_today: number;
  new_ideas_today: number;
}> => {
  const response = await api.get('/dashboard/realtime');
  return response.data.data;
};

/**
 * Get recent activities for the dashboard
 */
export interface RecentActivity {
  id: string;
  type: 'incident_created' | 'incident_resolved' | 'incident_assigned' | 'idea_submitted' | 'idea_approved' | 'booking_created' | 'booking_cancelled' | 'news_published' | 'user_registered';
  title: string;
  description: string;
  user?: {
    id?: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export const getRecentActivities = async (limit: number = 10): Promise<RecentActivity[]> => {
  try {
    // Try to get from dashboard activities endpoint
    const response = await api.get(`/dashboard/activities?limit=${limit}`);
    return response.data.data || [];
  } catch (err) {
    // If API doesn't exist, generate from recent incidents
    try {
      const incidentsRes = await api.get('/incidents?limit=5&sort=-created_at');
      const incidents = incidentsRes.data.data || [];

      const activities: RecentActivity[] = incidents.map((incident: any) => ({
        id: `incident-${incident.id}`,
        type: incident.status === 'resolved' ? 'incident_resolved' : 'incident_created' as const,
        title: incident.status === 'resolved' ? 'Sự cố đã được xử lý' : 'Sự cố mới được báo cáo',
        description: incident.title,
        user: { name: incident.reporter_name || 'Unknown' },
        timestamp: incident.created_at,
      }));

      return activities;
    } catch {
      return [];
    }
  }
};

// ============================================
// Idea Statistics
// ============================================

export interface IdeaDifficultyData {
  categories: string[];
  counts: number[];
}

export interface IdeaStatusData {
  submitted: number;
  reviewing: number;
  approved: number;
  implementing: number;
  implemented: number;
  rejected: number;
}

/**
 * Get idea difficulty distribution
 */
export const getIdeaDifficultyDistribution = async (): Promise<IdeaDifficultyData> => {
  const response = await api.get('/dashboard/idea-difficulty');
  return response.data.data;
};

/**
 * Get idea status distribution
 */
export const getIdeaStatusDistribution = async (): Promise<IdeaStatusData> => {
  const response = await api.get('/dashboard/idea-status');
  return response.data.data;
};

export default {
  getDashboardSummary,
  getIncidentTrend,
  getProcessingTimeByPriority,
  getDepartmentKPI,
  getTopMachinesWithErrors,
  getMonthlyStats,
  getPriorityDistribution,
  getDepartmentStats,
  getRealTimeStats,
  getRecentActivities,
  getIdeaDifficultyDistribution,
  getIdeaStatusDistribution,
};
