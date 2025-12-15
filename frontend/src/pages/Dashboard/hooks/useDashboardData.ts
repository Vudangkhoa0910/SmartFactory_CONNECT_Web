/**
 * Dashboard - Custom Hook for Dashboard Data
 */
import { useState, useCallback, useEffect } from 'react';
import dashboardService, { DashboardSummary, DepartmentStats, RecentActivity } from '../../../services/dashboard.service';
import { getIncidentStats, IncidentStats } from '../../../services/incident.service';
import { useTranslation } from "../../../contexts/LanguageContext";

export interface DashboardState {
  summary: DashboardSummary | null;
  incidentStats: IncidentStats | null;
  departmentStats: DepartmentStats[];
  activities: RecentActivity[];
  loading: boolean;
  error: string | null;
}

export function useDashboardData() {
  const { t } = useTranslation();
  const [state, setState] = useState<DashboardState>({
    summary: null,
    incidentStats: null,
    departmentStats: [],
    activities: [],
    loading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [summary, incidentStats, departmentStats, recentActivities] = await Promise.all([
        dashboardService.getDashboardSummary(),
        getIncidentStats(),
        dashboardService.getDepartmentStats(),
        dashboardService.getRecentActivities(8),
      ]);

      setState({
        summary,
        incidentStats,
        departmentStats,
        activities: recentActivities,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        // error: t('error.no_load_data'),
      }));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return { ...state, refetch: fetchDashboardData };
}

// Computed values helper
export function computeDashboardValues(summary: DashboardSummary | null) {
  const totalIncidents = summary?.total_incidents || 0;
  const pendingIncidents = summary?.pending_incidents || 0;
  const resolvedIncidents = summary?.resolved_incidents || 0;
  const totalIdeas = summary?.total_ideas || 0;
  const pendingIdeas = summary?.pending_ideas || 0;
  const activeUsers = summary?.active_users || 0;
  const resolutionRate = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 100;
  const departmentsCount = summary?.departments_count || 0;

  return {
    totalIncidents,
    pendingIncidents,
    resolvedIncidents,
    totalIdeas,
    pendingIdeas,
    activeUsers,
    resolutionRate,
    departmentsCount,
  };
}
