import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import dashboardService from "../../services/dashboard.service";

interface OverviewData {
  total_incidents: number;
  pending_incidents: number;
  resolved_incidents: number;
  sla_violations?: number;
}

const IncidentOverview: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await dashboardService.getDashboardSummary();
        setData({
          total_incidents: parseInt(summary.total_incidents?.toString() || '0'),
          pending_incidents: parseInt(summary.pending_incidents?.toString() || '0'),
          resolved_incidents: parseInt(summary.resolved_incidents?.toString() || '0'),
          sla_violations: 0, // This would come from a separate API if needed
        });
      } catch (error) {
        console.error("Failed to fetch incident overview:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900 flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
      </div>
    );
  }

  const stats = [
    { label: "Tổng số sự cố", value: data?.total_incidents || 0, icon: AlertTriangle, color: "text-blue-600" },
    { label: "Đang chờ xử lý", value: data?.pending_incidents || 0, icon: Clock, color: "text-yellow-600" },
    { label: "Đã xử lý", value: data?.resolved_incidents || 0, icon: CheckCircle, color: "text-green-600" },
    { label: "Vi phạm SLA", value: data?.sla_violations || 0, icon: AlertCircle, color: "text-red-600" },
  ];

  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
      <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
        Tổng quan sự cố
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-800">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentOverview;
