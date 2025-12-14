/**
 * Dashboard Types - SmartFactory CONNECT
 * Types for Dashboard components and data
 */

// KPI Card Types
export interface KPIMetric {
  id: string;
  title: string;
  value: number | string;
  previousValue?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  unit?: string;
  icon?: string;
  color?: 'red' | 'green' | 'yellow' | 'blue' | 'gray';
  link?: string;
}

// Activity Feed Types
export interface ActivityItem {
  id: string;
  type: 'incident' | 'idea' | 'booking' | 'user' | 'news' | 'system';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    department?: string;
  };
  timestamp: string;
  link?: string;
  read?: boolean;
}

// Chart Data Types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

// Department Heat Map
export interface DepartmentHeatData {
  id: string;
  name: string;
  status: 'critical' | 'warning' | 'normal' | 'good';
  openIncidents: number;
  pendingIdeas: number;
  activeUsers: number;
}

// System Health
export interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
  };
  api: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
  };
  storage: {
    status: 'healthy' | 'warning' | 'error';
    usedPercent: number;
  };
  activeSessions: number;
  queueSize: number;
  uptime: number;
}

// Dashboard Widget Configuration
export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'activity' | 'heatmap' | 'health' | 'custom';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, unknown>;
  visible: boolean;
}

// Dashboard State
export interface DashboardState {
  kpis: KPIMetric[];
  activities: ActivityItem[];
  departmentHealth: DepartmentHeatData[];
  systemHealth: SystemHealth | null;
  widgets: DashboardWidget[];
  dateRange: {
    start: string;
    end: string;
    preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  };
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// API Response Types
export interface DashboardSummaryResponse {
  success: boolean;
  data: {
    totalUsers: number;
    activeToday: number;
    totalIncidents: number;
    openIncidents: number;
    totalIdeas: number;
    pendingIdeas: number;
    totalBookings: number;
    pendingBookings: number;
  };
}

export interface ActivityFeedResponse {
  success: boolean;
  data: ActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
