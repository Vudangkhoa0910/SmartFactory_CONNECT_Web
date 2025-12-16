import { useEffect, useState, useCallback } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import dashboardService, { DashboardSummary } from "../../services/dashboard.service";
import { useSocketRefresh } from "../../hooks/useSocket";

export default function EcommerceMetrics() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch summary - extracted to useCallback for WebSocket refresh
  const fetchSummary = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await dashboardService.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchSummary(true);
  }, [fetchSummary]);

  // WebSocket: Auto-refresh without loading when incidents change (affects metrics)
  const silentRefresh = useCallback(() => {
    fetchSummary(false);
  }, [fetchSummary]);

  useSocketRefresh(
    ['incident_created', 'incident_updated'],
    silentRefresh,
    ['incidents']
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
          <div className="mt-5">
            <div className="h-4 bg-gray-200 rounded w-24 dark:bg-gray-700"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mt-2 dark:bg-gray-700"></div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
          <div className="mt-5">
            <div className="h-4 bg-gray-200 rounded w-24 dark:bg-gray-700"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mt-2 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }

  const activeUsers = summary?.active_users || 0;
  const totalIncidents = summary?.total_incidents || 0;
  const pendingIncidents = summary?.pending_incidents || 0;
  const resolvedRate = totalIncidents > 0
    ? Math.round((summary?.resolved_incidents || 0) / totalIncidents * 100)
    : 100;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-900 size-6 dark:text-white" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Nhân viên hoạt động
            </span>
            <h4 className="mt-2 font-bold text-gray-900 text-title-sm dark:text-white">
              {activeUsers.toLocaleString()}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            Đang hoạt động
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-900 size-6 dark:text-white" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng sự cố
            </span>
            <h4 className="mt-2 font-bold text-gray-900 text-title-sm dark:text-white">
              {totalIncidents.toLocaleString()}
            </h4>
          </div>

          <Badge color={pendingIncidents > 0 ? "warning" : "success"}>
            {pendingIncidents > 0 ? (
              <>
                <ArrowDownIcon />
                {pendingIncidents} đang xử lý
              </>
            ) : (
              <>
                <ArrowUpIcon />
                {resolvedRate}% đã xử lý
              </>
            )}
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
